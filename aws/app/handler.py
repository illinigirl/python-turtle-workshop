"""Python Turtle Workshop — single Lambda behind an HTTP API.

Serves the static app at / and the JSON API under /api/*. Same-origin (no CORS).
Storage is DynamoDB + S3; the AI helper runs on Bedrock; accounts are nickname +
PIN (PIN hashed) with a stateless HMAC token gating progress + gallery writes.
"""
import base64
import json
import os

import ai
import llm
import store

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
PROFILES = [p.strip() for p in os.environ.get("WORKSHOP_PROFILES", "Explorer,Builder").split(",") if p.strip()]
INSIGHTS_MODEL = os.environ.get("INSIGHTS_MODEL", "us.anthropic.claude-opus-4-8")

STATIC = {
    "index.html": "text/html; charset=utf-8",
    "style.css": "text/css; charset=utf-8",
    "lessons.js": "application/javascript; charset=utf-8",
    "workshop.js": "application/javascript; charset=utf-8",
    "insights.html": "text/html; charset=utf-8",
}
_cache = {}


def _read_static(name):
    if name not in _cache:
        with open(os.path.join(STATIC_DIR, name), "r", encoding="utf-8") as f:
            _cache[name] = f.read()
    return _cache[name]


def _resp(status, body, content_type="application/json"):
    payload = body if isinstance(body, str) else json.dumps(body)
    return {"statusCode": status,
            "headers": {"content-type": content_type, "cache-control": "no-cache"},
            "body": payload}


def _body(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode("utf-8")
    return json.loads(raw or "{}")


def _token(event, payload):
    headers = {k.lower(): v for k, v in (event.get("headers") or {}).items()}
    return headers.get("x-workshop-token") or payload.get("token")


def _insights_summary():
    data = store.insights_data()
    if data["totals"]["events"] == 0:
        return "No activity has been logged yet. Once the kids use the workshop, come back here for suggestions."
    items = sorted(data["lessons"].items(), key=lambda kv: kv[1]["questions"] + kv[1]["errors"], reverse=True)
    lines = []
    for name, d in items:
        if d["questions"] == 0 and d["errors"] == 0:
            continue
        et = ", ".join("%s x%d" % (k, v) for k, v in sorted(d["errorTypes"].items(), key=lambda x: -x[1]))
        lines.append("- %s: %d questions, %d errors%s" % (name, d["questions"], d["errors"], (" (" + et + ")" if et else "")))
    qlines = ["- [%s] %s" % (q["lesson"], q["question"][:160]) for q in store.recent_questions(25)]
    user = ("Here is real usage data from the workshop.\n\nPER-LESSON struggle (most to least):\n"
            + "\n".join(lines) + "\n\nA SAMPLE of recent questions kids asked:\n" + "\n".join(qlines))
    system = (
        "You help improve a kids' (ages 9-13) Python turtle workshop by reviewing real usage "
        "data — the questions kids asked and the errors they hit. Identify the lessons where "
        "kids struggle most and, for each, say briefly what is likely confusing and ONE concrete "
        "tweak. Prioritize the biggest pain points. Be concrete and concise — a to-do list for "
        "improving lessons. Use short markdown sections per lesson.")
    return llm.chat([{"role": "user", "content": user}], system, INSIGHTS_MODEL, max_tokens=1500)


def handler(event, context):
    http = event.get("requestContext", {}).get("http", {})
    method = http.get("method", "GET")
    path = event.get("rawPath", "/")
    params = event.get("queryStringParameters") or {}

    try:
        # ---- static ----
        if path == "/" or path == "/index.html":
            return _resp(200, _read_static("index.html"), STATIC["index.html"])
        name = path.lstrip("/")
        if name in STATIC:
            return _resp(200, _read_static(name), STATIC[name])

        # ---- GET API ----
        if path == "/api/profiles":
            # accounts mode uses the login form, not profile buttons — don't
            # expose any names here.
            return _resp(200, {"profiles": [], "tutor": True, "accounts": True})
        if path == "/api/insights":
            return _resp(200, store.insights_data())
        if path == "/api/progress" and method == "GET":
            kid = params.get("kid", "")
            if not store.check_token(kid, _token(event, {})):
                return _resp(401, {"error": "not logged in"})
            return _resp(200, store.get_progress(kid))
        if path == "/api/gallery" and method == "GET":
            kid = params.get("kid", "")
            if not store.check_token(kid, _token(event, {})):
                return _resp(401, {"error": "not logged in"})
            return _resp(200, {"drawings": store.gallery_list(kid)})

        # ---- POST API ----
        if method == "POST":
            payload = _body(event)

            if path == "/api/signup":
                token, err = store.create_account(payload.get("nick"), payload.get("pin"))
                if err:
                    return _resp(400, {"error": err})
                return _resp(200, {"ok": True, "token": token, "nick": store._nick(payload.get("nick"))})

            if path == "/api/login":
                token, err = store.login(payload.get("nick"), payload.get("pin"))
                if err:
                    return _resp(401, {"error": err})
                return _resp(200, {"ok": True, "token": token, "nick": store._nick(payload.get("nick"))})

            if path == "/api/ask":
                if not str(payload.get("question", "")).strip():
                    return _resp(400, {"error": "no question"})
                store.log_event({"kind": "ask", "kid": payload.get("kid", "?"),
                                 "mode": payload.get("mode", "ask"),
                                 "lesson": payload.get("lessonTitle", ""),
                                 "question": payload.get("question", "")})
                try:
                    return _resp(200, {"answer": ai.answer(payload)})
                except Exception as e:
                    print("ask error:", repr(e))
                    return _resp(502, {"error": "The helper is taking a quick break — try again in a moment."})

            if path == "/api/log_error":
                store.log_event({"kind": "error", "kid": payload.get("kid", "?"),
                                 "lesson": payload.get("lesson", ""),
                                 "errorType": payload.get("errorType", "other"),
                                 "error": payload.get("error", "")})
                return _resp(200, {"ok": True})

            if path == "/api/insights/summary":
                try:
                    return _resp(200, {"summary": _insights_summary()})
                except Exception as e:
                    print("insights summary error:", repr(e))
                    return _resp(502, {"error": "Couldn't generate a summary right now."})

            kid = payload.get("kid", "")

            if path == "/api/progress":
                if not store.check_token(kid, _token(event, payload)):
                    return _resp(401, {"error": "not logged in"})
                store.put_progress(kid, payload.get("done", []), payload.get("code", {}), payload.get("steps", {}))
                return _resp(200, {"ok": True})

            if path == "/api/gallery":
                if not store.check_token(kid, _token(event, payload)):
                    return _resp(401, {"error": "not logged in"})
                try:
                    f = store.gallery_add(kid, payload.get("image"), payload.get("title"), payload.get("lesson"))
                    return _resp(200, {"ok": True, "file": f})
                except ValueError as e:
                    return _resp(400, {"error": str(e)})

            if path == "/api/gallery_delete":
                if not store.check_token(kid, _token(event, payload)):
                    return _resp(401, {"error": "not logged in"})
                return _resp(200, {"ok": store.gallery_delete(kid, payload.get("file", ""))})

        return _resp(404, {"error": "not found", "path": path})
    except Exception as e:
        return _resp(500, {"error": str(e), "type": type(e).__name__})
