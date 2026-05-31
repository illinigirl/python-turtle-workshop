"""Python Turtle Workshop — static server + per-learner progress API.

Serves the workshop's static files (index.html, css, js) and a tiny JSON
API that stores each learner's progress server-side so it follows them across
devices (laptop, iPad, etc.). Pure standard library — no web framework.

Routes:
    GET  /                          -> index.html
    GET  /<file>                    -> static asset (css/js from this folder)
    GET  /api/profiles              -> {"profiles": [...], "tutor": bool}
    GET  /api/progress?kid=NAME     -> {"done": [..lesson indexes..], "code": {idx: src}}
    POST /api/progress              -> body {kid, done:[...], code:{...}}  (replaces that record)
    POST /api/ask                   -> AI helper (optional; needs ANTHROPIC_API_KEY)

Progress is stored in ./data/progress.json. The data/ dir is gitignored so
it's never committed. Writes are atomic (temp file + os.replace).
"""

import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

# Optionally load environment variables (e.g. ANTHROPIC_API_KEY) from a local
# .env file. Guarded so the server still runs without python-dotenv / .env.
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# The AI helper ("Ask") is optional. It only turns on if the anthropic SDK is
# installed AND an API key is present. Otherwise /api/ask returns a clear error
# and the front-end hides the Ask box.
try:
    import anthropic
    _HAS_ANTHROPIC = True
except Exception:
    _HAS_ANTHROPIC = False

# AI helper model. Haiku is fast + cheap and plenty for kids' "how do I...?"
# questions; override with TUTOR_MODEL (e.g. "claude-opus-4-8" for max quality).
TUTOR_MODEL = os.environ.get("TUTOR_MODEL", "claude-haiku-4-5")
_anthropic_client = None  # created lazily, reused across requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
PROGRESS_FILE = os.path.join(DATA_DIR, "progress.json")

HOST = os.environ.get("WORKSHOP_HOST", "0.0.0.0")
PORT = int(os.environ.get("WORKSHOP_PORT", "8095"))

# Profiles shown on the "Who's coding?" screen. Customize with the
# WORKSHOP_PROFILES env var, e.g. WORKSHOP_PROFILES="Ada,Grace,Alan".
PROFILES = [p.strip() for p in os.environ.get("WORKSHOP_PROFILES", "Explorer,Builder").split(",") if p.strip()]

# Only these files are servable, and only with these content types.
STATIC = {
    "index.html": "text/html; charset=utf-8",
    "style.css": "text/css; charset=utf-8",
    "lessons.js": "application/javascript; charset=utf-8",
    "workshop.js": "application/javascript; charset=utf-8",
}

# One lock guards all reads/writes of the progress file.
_lock = threading.Lock()


def _load_all():
    try:
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_all(data):
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = PROGRESS_FILE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, PROGRESS_FILE)  # atomic on POSIX


def _norm(kid):
    """Match a kid name case-insensitively to a known profile."""
    for p in PROFILES:
        if p.lower() == str(kid).lower():
            return p
    return None


# ---------------------------------------------------------------------------
# AI helper ("Ask the helper")
# ---------------------------------------------------------------------------
def tutor_available():
    return _HAS_ANTHROPIC and bool(os.environ.get("ANTHROPIC_API_KEY"))


def _get_client():
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    return _anthropic_client


TUTOR_SYSTEM = (
    "You are a friendly, patient coding helper for kids learning Python in a fun, "
    "colorful web workshop. The kids are about 9-13 years old and came from Scratch "
    "and Minecraft, so they're smart but new to typing code.\n\n"
    "How to answer:\n"
    "- Keep it SHORT: 2-4 simple sentences, plus a tiny code example when it helps.\n"
    "- Be warm and encouraging — celebrate that they asked.\n"
    "- Explain the idea in plain, friendly words first, then show a SMALL example "
    "(just a few lines) in a ```python code block```.\n"
    "- This is a learning workshop. If they ask how to do the lesson's MAIN challenge, "
    "give a helpful HINT and a small example — don't write the whole solution for them. "
    "For little how-to questions (like 'how do I add a blank line between prints?'), just "
    "answer directly.\n"
    "- If they ask you to CHECK THEIR WORK, look at their code against the lesson's goal. "
    "Start with something they did well, then point out ONE next thing to try as a gentle "
    "hint or question (e.g. 'You typed your name in quotes — what if you used your name box "
    "instead?'). Never paste the finished solution; let them fix it themselves.\n"
    "- If their code got an ERROR, explain in plain, kind words what the error means and "
    "give ONE clear hint to fix it. Point at the EXACT spot — e.g. a variable name with a "
    "space in it (names must be one word like candy_per_friend), or the box name on the "
    "wrong side of the = (it goes on the LEFT: name = value), or a missing quote. Don't "
    "rewrite the whole program for them.\n"
    "- Use the turtle/Python commands the workshop uses (import turtle, forward, right, "
    "print, input, for loops, if, def). \n"
    "- Only talk about Python, coding, and their workshop project. If they ask about "
    "something else, kindly say you're the coding helper and steer back to code.\n"
    "- Never include anything inappropriate for a child.\n"
    "- Reply with ONLY your helpful answer for the kid — no notes about your reasoning."
)


def build_ask_messages(payload):
    """Assemble the messages array: prior turns + a context-grounded question."""
    history = payload.get("history") or []
    clean = []
    for m in history[-6:]:  # cap context
        role = m.get("role")
        content = str(m.get("content", ""))[:2000]
        if role in ("user", "assistant") and content:
            clean.append({"role": role, "content": content})

    kid = _norm(payload.get("kid")) or "the kid"
    title = str(payload.get("lessonTitle", ""))[:200]
    lesson = str(payload.get("lessonText", ""))[:2000]
    task = str(payload.get("lessonTask", ""))[:1000]
    bonus = str(payload.get("levelUp", ""))[:1000]
    code = str(payload.get("code", ""))[:4000]
    question = str(payload.get("question", ""))[:1000].strip()
    error = str(payload.get("errorText", ""))[:500]
    mode = payload.get("mode")

    parts = []
    if title:
        parts.append("Current lesson: " + title)
    if lesson:
        parts.append("What this lesson is teaching:\n" + lesson)
    if task:
        parts.append("The lesson's challenge (their goal):\n" + task)
    if bonus:
        parts.append("Optional BONUS / level-up challenge (they MAY also have done this — "
                     "it's extra credit and totally allowed):\n" + bonus)
    if code.strip():
        parts.append("The kid's code right now:\n```python\n" + code + "\n```")

    if mode == "check":
        parts.append(
            "Please CHECK " + kid + "'s work above against the lesson's challenge. "
            "Say one thing they did well, then give at most ONE gentle hint about a next "
            "thing to try. IMPORTANT: doing MORE than asked is GREAT — if they also did the "
            "bonus challenge or experimented with extra lines, praise it. NEVER tell them to "
            "remove correct extra work, and never say they have 'too much' or 'only need "
            "one'. Only point out things that are actually broken or missing from the goal. "
            "If everything works, just celebrate it. Do not write the finished solution.")
    elif mode == "fix":
        if error:
            parts.append("They ran their code and got this error message:\n" + error)
        parts.append(
            "Explain in simple, kind words what went wrong, and give " + kid + " ONE clear "
            "hint to fix it. Point at the exact spot (e.g. a variable name with a space, or "
            "the box name on the wrong side of the =). Don't rewrite the whole program.")
    elif mode == "explain":
        parts.append(
            "Re-teach THIS lesson's main idea to " + kid + " from scratch, as if they "
            "didn't follow the lesson text. Go slow and thorough: start with a friendly "
            "real-world comparison, then explain step by step in plain words, then show ONE "
            "tiny example they could type. It's OK to be a little longer than usual here. "
            "End with a small, doable thing they could try. Don't just repeat the lesson "
            "text word-for-word — explain it a different way.")
    else:
        parts.append(kid + " asks: " + question)
    clean.append({"role": "user", "content": "\n\n".join(parts)})
    return clean


def answer_question(payload):
    """Call Claude and return the helper's reply text (raises on API error)."""
    client = _get_client()
    # "Explain this" wants room to go slow and thorough; others stay short.
    max_tokens = 1100 if payload.get("mode") == "explain" else 700
    resp = client.messages.create(
        model=TUTOR_MODEL,
        max_tokens=max_tokens,
        system=TUTOR_SYSTEM,
        messages=build_ask_messages(payload),
    )
    return "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip()


class Handler(BaseHTTPRequestHandler):
    server_version = "KidsWorkshop/1.0"

    # quieter logs
    def log_message(self, fmt, *args):
        pass

    def _send(self, code, body, content_type="application/json; charset=utf-8"):
        if isinstance(body, (dict, list)):
            body = json.dumps(body).encode("utf-8")
        elif isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        # tiny app on the LAN; allow the page to call its own API freely
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    # ---- AI helper ----
    def _handle_ask(self, payload):
        if not tutor_available():
            return self._send(503, {"error": "The helper isn't set up (no API key)."})
        if not str(payload.get("question", "")).strip():
            return self._send(400, {"error": "no question"})
        try:
            answer = answer_question(payload)
            return self._send(200, {"answer": answer})
        except Exception as e:
            # Don't leak internals to a kid's screen; log server-side.
            print("ask error:", repr(e))
            return self._send(502, {"error": "The helper is taking a quick break — try again in a moment."})

    # ---- GET ----
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/profiles":
            # `tutor` tells the front-end whether to show the "Ask the helper" box
            return self._send(200, {"profiles": PROFILES, "tutor": tutor_available()})

        if path == "/api/progress":
            qs = parse_qs(parsed.query)
            kid = _norm((qs.get("kid") or [""])[0])
            if not kid:
                return self._send(400, {"error": "unknown kid"})
            with _lock:
                rec = _load_all().get(kid, {})
            return self._send(200, {"done": rec.get("done", []), "code": rec.get("code", {})})

        # static files
        name = "index.html" if path == "/" else path.lstrip("/")
        if name in STATIC:
            full = os.path.join(BASE_DIR, name)
            try:
                with open(full, "rb") as f:
                    return self._send(200, f.read(), STATIC[name])
            except FileNotFoundError:
                pass
        return self._send(404, {"error": "not found"})

    # ---- POST ----
    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ("/api/progress", "/api/ask"):
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or "{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "bad json"})

        if path == "/api/ask":
            return self._handle_ask(payload)

        kid = _norm(payload.get("kid"))
        if not kid:
            return self._send(400, {"error": "unknown kid"})

        done = payload.get("done", [])
        code = payload.get("code", {})
        if not isinstance(done, list) or not isinstance(code, dict):
            return self._send(400, {"error": "bad shape"})

        with _lock:
            data = _load_all()
            data[kid] = {"done": done, "code": code}
            _save_all(data)
        return self._send(200, {"ok": True})


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Kids Python Workshop on http://%s:%d  (profiles: %s)" % (HOST, PORT, ", ".join(PROFILES)))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
