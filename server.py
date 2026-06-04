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
import base64
import time
import re
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
GALLERY_DIR = os.path.join(DATA_DIR, "gallery")
GALLERY_INDEX = os.path.join(DATA_DIR, "gallery.json")
GALLERY_MAX_PER_KID = 40          # keep the newest N drawings per learner
GALLERY_MAX_BYTES = 600 * 1024    # reject images larger than this

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
    "insights.html": "text/html; charset=utf-8",  # grown-up "where do kids struggle" page
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
# "Save my drawing" gallery — PNGs on disk + a small JSON index
# ---------------------------------------------------------------------------
def _gallery_load():
    try:
        with open(GALLERY_INDEX, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _gallery_save(items):
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = GALLERY_INDEX + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(items, f, indent=2)
        f.flush(); os.fsync(f.fileno())
    os.replace(tmp, GALLERY_INDEX)


def gallery_add(kid, data_url, title, lesson):
    """Decode a PNG data URL, store it, and append to the index. Enforces a
    size cap and a per-kid count cap (drops the oldest). Returns the new item."""
    m = re.match(r"^data:image/png;base64,([A-Za-z0-9+/=]+)$", data_url or "")
    if not m:
        raise ValueError("not a png data url")
    raw = base64.b64decode(m.group(1))
    if len(raw) > GALLERY_MAX_BYTES:
        raise ValueError("image too large")
    os.makedirs(GALLERY_DIR, exist_ok=True)
    # filename: <kid>-<ms>.png  (ms timestamp keeps them ordered + unique enough)
    fname = "%s-%d.png" % (re.sub(r"[^A-Za-z0-9]", "", kid), int(time.time() * 1000))
    with open(os.path.join(GALLERY_DIR, fname), "wb") as f:
        f.write(raw)
    item = {"kid": kid, "file": fname, "title": (title or "").strip()[:60] or "Untitled",
            "lesson": str(lesson or "")[:120], "ts": int(time.time())}
    with _lock:
        items = _gallery_load()
        items.append(item)
        # enforce per-kid cap: drop oldest of this kid
        mine = [x for x in items if x.get("kid") == kid]
        if len(mine) > GALLERY_MAX_PER_KID:
            drop = mine[:len(mine) - GALLERY_MAX_PER_KID]
            dropfiles = {x["file"] for x in drop}
            items = [x for x in items if x["file"] not in dropfiles]
            for df in dropfiles:
                try: os.remove(os.path.join(GALLERY_DIR, df))
                except OSError: pass
        _gallery_save(items)
    return item


def gallery_list(kid):
    with _lock:
        items = _gallery_load()
    return [{"file": x["file"], "title": x.get("title", ""), "lesson": x.get("lesson", ""),
             "ts": x.get("ts", 0)} for x in items if x.get("kid") == kid][::-1]  # newest first


def gallery_delete(kid, fname):
    with _lock:
        items = _gallery_load()
        keep = [x for x in items if not (x.get("kid") == kid and x.get("file") == fname)]
        if len(keep) != len(items):
            try: os.remove(os.path.join(GALLERY_DIR, os.path.basename(fname)))
            except OSError: pass
            _gallery_save(keep)
            return True
    return False


# ---------------------------------------------------------------------------
# Learning insights — log what kids ask + the errors they hit, so lessons can
# be improved from real usage. Append-only JSONL; private (under data/).
# ---------------------------------------------------------------------------
INSIGHTS_FILE = os.path.join(DATA_DIR, "insights.jsonl")
INSIGHTS_MODEL = os.environ.get("INSIGHTS_MODEL", "claude-opus-4-8")
_log_lock = threading.Lock()


def log_event(ev):
    """Append one event. Never let logging break the actual request."""
    try:
        ev["ts"] = int(time.time())
        os.makedirs(DATA_DIR, exist_ok=True)
        with _log_lock:
            with open(INSIGHTS_FILE, "a", encoding="utf-8") as f:
                f.write(json.dumps(ev) + "\n")
    except Exception:
        pass


def _insights_read():
    out = []
    try:
        with open(INSIGHTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try: out.append(json.loads(line))
                    except json.JSONDecodeError: pass
    except FileNotFoundError:
        pass
    return out


def insights_data():
    """Aggregate the log into per-lesson tallies + recent activity."""
    events = _insights_read()
    lessons = {}
    for e in events:
        L = e.get("lesson") or "(unknown)"
        d = lessons.setdefault(L, {"questions": 0, "errors": 0, "modes": {}, "errorTypes": {}})
        if e.get("kind") == "ask":
            d["questions"] += 1
            m = e.get("mode", "ask")
            d["modes"][m] = d["modes"].get(m, 0) + 1
        elif e.get("kind") == "error":
            d["errors"] += 1
            t = e.get("errorType", "other")
            d["errorTypes"][t] = d["errorTypes"].get(t, 0) + 1
    totals = {
        "events": len(events),
        "questions": sum(1 for e in events if e.get("kind") == "ask"),
        "errors": sum(1 for e in events if e.get("kind") == "error"),
    }
    return {"lessons": lessons, "recent": events[-40:][::-1], "totals": totals}


def insights_ai_summary():
    """Have Claude read the struggle data and suggest lesson tweaks."""
    data = insights_data()
    if data["totals"]["events"] == 0:
        return "No activity has been logged yet. Once the kids use the workshop, come back here for suggestions."

    # Build a compact, sorted picture of where kids struggle.
    items = sorted(data["lessons"].items(),
                   key=lambda kv: kv[1]["questions"] + kv[1]["errors"], reverse=True)
    lines = []
    for name, d in items:
        if d["questions"] == 0 and d["errors"] == 0:
            continue
        et = ", ".join("%s x%d" % (k, v) for k, v in sorted(d["errorTypes"].items(), key=lambda x: -x[1]))
        lines.append("- %s: %d questions, %d errors%s" % (name, d["questions"], d["errors"], (" (" + et + ")" if et else "")))
    # a sample of actual questions (richest signal)
    qs = [e for e in _insights_read() if e.get("kind") == "ask" and e.get("question")]
    sample = qs[-25:]
    qlines = ["- [%s] %s" % (e.get("lesson", "?"), str(e.get("question", ""))[:160]) for e in sample]

    user = ("Here is real usage data from the workshop.\n\nPER-LESSON struggle "
            "(most to least):\n" + "\n".join(lines) +
            "\n\nA SAMPLE of recent questions kids asked:\n" + "\n".join(qlines))
    system = (
        "You help improve a kids' (ages 9-13) Python turtle workshop by reviewing real "
        "usage data — the questions kids asked the helper and the errors they hit. "
        "Identify the lessons where kids struggle most and, for each, say briefly what is "
        "likely confusing and ONE concrete, specific tweak to the lesson (clearer wording, "
        "a better example, an extra step, reordering, or a hint). Prioritize the biggest "
        "pain points. Be concrete and concise — this is a to-do list for improving lessons. "
        "Use short markdown sections per lesson.")
    client = _get_client()
    resp = client.messages.create(
        model=INSIGHTS_MODEL, max_tokens=1500, system=system,
        messages=[{"role": "user", "content": user}],
    )
    return "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip()


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
        step_labels = payload.get("steps")
        if isinstance(step_labels, list) and step_labels:
            checklist = "\n".join("%d. %s" % (i + 1, s) for i, s in enumerate(step_labels))
            parts.append(
                "Here is " + kid + "'s checklist for this lesson, in order:\n" + checklist + "\n\n"
                "Look at their code above. For EACH checklist item decide, from the code:\n"
                '  "done"    = the code clearly accomplishes it\n'
                '  "not_yet" = the code does not do this yet\n'
                '  "unknown" = it is about running/experimenting and cannot be judged from code\n'
                "Be GENEROUS — if the code reasonably accomplishes a step, mark it done. "
                "Extra/bonus work is great.\n\n"
                "Reply with ONLY a JSON object, nothing else, exactly like:\n"
                '{"message": "<short warm note: praise something + ONE gentle hint if needed>", '
                '"steps": ["done","not_yet","unknown"]}\n'
                "The \"steps\" array MUST be the same length and order as the checklist above.")
        else:
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
    """Call Claude. Returns {"answer": text, "steps": verdicts_or_None}.
    For 'check' mode with a checklist, the model also judges each step."""
    client = _get_client()
    mode = payload.get("mode")
    is_check_steps = mode == "check" and isinstance(payload.get("steps"), list) and payload.get("steps")
    max_tokens = 1100 if mode == "explain" else (800 if is_check_steps else 700)
    resp = client.messages.create(
        model=TUTOR_MODEL,
        max_tokens=max_tokens,
        system=TUTOR_SYSTEM,
        messages=build_ask_messages(payload),
    )
    text = "".join(b.text for b in resp.content if getattr(b, "type", None) == "text").strip()
    if is_check_steps:
        import re
        m = re.search(r"\{[\s\S]*\}", text)
        try:
            obj = json.loads(m.group(0) if m else text)
            verdicts = obj.get("steps")
            if not isinstance(verdicts, list):
                verdicts = None
            return {"answer": (str(obj.get("message", "")).strip() or "Nice work! 🎉"), "steps": verdicts}
        except Exception:
            return {"answer": text, "steps": None}
    return {"answer": text, "steps": None}


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
        # log the question (signal for improving lessons)
        log_event({"kind": "ask", "kid": _norm(payload.get("kid")) or "?",
                   "mode": payload.get("mode", "ask"),
                   "lesson": str(payload.get("lessonTitle", ""))[:120],
                   "question": str(payload.get("question", ""))[:300],
                   "errorText": str(payload.get("errorText", ""))[:200]})
        try:
            result = answer_question(payload)
            out = {"answer": result["answer"]}
            if result.get("steps"):
                out["steps"] = result["steps"]
            return self._send(200, out)
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
            return self._send(200, {"done": rec.get("done", []), "code": rec.get("code", {}),
                                    "steps": rec.get("steps", {})})

        if path == "/api/gallery":
            qs = parse_qs(parsed.query)
            kid = _norm((qs.get("kid") or [""])[0])
            if not kid:
                return self._send(400, {"error": "unknown kid"})
            return self._send(200, {"drawings": gallery_list(kid)})

        if path == "/api/insights":
            return self._send(200, insights_data())

        # saved drawing images
        if path.startswith("/gallery/"):
            safe = os.path.basename(path[len("/gallery/"):])
            full = os.path.join(GALLERY_DIR, safe)
            if safe.endswith(".png") and os.path.isfile(full):
                with open(full, "rb") as f:
                    return self._send(200, f.read(), "image/png")
            return self._send(404, {"error": "not found"})

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
        if path not in ("/api/progress", "/api/ask", "/api/gallery", "/api/gallery_delete",
                        "/api/log_error", "/api/insights/summary"):
            return self._send(404, {"error": "not found"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or "{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "bad json"})

        if path == "/api/ask":
            return self._handle_ask(payload)

        # grown-up insights summary — no kid needed
        if path == "/api/insights/summary":
            if not tutor_available():
                return self._send(503, {"error": "AI summary needs an API key."})
            try:
                return self._send(200, {"summary": insights_ai_summary()})
            except Exception as e:
                print("insights summary error:", repr(e))
                return self._send(502, {"error": "Couldn't generate a summary right now."})

        kid = _norm(payload.get("kid"))
        if not kid:
            return self._send(400, {"error": "unknown kid"})

        if path == "/api/log_error":
            log_event({"kind": "error", "kid": kid,
                       "lesson": str(payload.get("lesson", ""))[:120],
                       "errorType": str(payload.get("errorType", "other"))[:60],
                       "error": str(payload.get("error", ""))[:200]})
            return self._send(200, {"ok": True})

        if path == "/api/gallery":
            try:
                item = gallery_add(kid, payload.get("image"), payload.get("title"),
                                   payload.get("lesson"))
                return self._send(200, {"ok": True, "file": item["file"]})
            except ValueError as e:
                return self._send(400, {"error": str(e)})
            except Exception as e:
                print("gallery save error:", repr(e))
                return self._send(500, {"error": "could not save drawing"})

        if path == "/api/gallery_delete":
            ok = gallery_delete(kid, str(payload.get("file", "")))
            return self._send(200, {"ok": ok})

        done = payload.get("done", [])
        code = payload.get("code", {})
        steps = payload.get("steps", {})
        if not isinstance(done, list) or not isinstance(code, dict) or not isinstance(steps, dict):
            return self._send(400, {"error": "bad shape"})

        with _lock:
            data = _load_all()
            data[kid] = {"done": done, "code": code, "steps": steps}
            _save_all(data)
        return self._send(200, {"ok": True})


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print("Kids Python Workshop on http://%s:%d  (profiles: %s)" % (HOST, PORT, ", ".join(PROFILES)))
    httpd.serve_forever()


if __name__ == "__main__":
    main()
