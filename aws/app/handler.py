"""Python Turtle Workshop — single Lambda behind an HTTP API.

Serves the static app at / and the JSON API under /api/*. Same-origin, so no
CORS. Mirrors the Pi's server.py behavior, but storage is DynamoDB + S3 and the
AI helper runs on Bedrock.

PHASE 1 (this file): serves the static app + /api/profiles. The frontend works
fully in localStorage mode (progress saved per-browser; AI/gallery hidden).
PHASE 2 will add: progress (DynamoDB), ask (Bedrock), gallery (S3), insights,
and nickname+PIN accounts.
"""
import json
import os

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
PROFILES = [p.strip() for p in os.environ.get("WORKSHOP_PROFILES", "Explorer,Builder").split(",") if p.strip()]

# served static files -> content type
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
    return {
        "statusCode": status,
        "headers": {"content-type": content_type, "cache-control": "no-cache"},
        "body": payload,
    }


def handler(event, context):
    http = event.get("requestContext", {}).get("http", {})
    method = http.get("method", "GET")
    path = event.get("rawPath", "/")

    try:
        if path == "/" or path == "/index.html":
            return _resp(200, _read_static("index.html"), STATIC["index.html"])

        name = path.lstrip("/")
        if name in STATIC:
            return _resp(200, _read_static(name), STATIC[name])

        if path == "/api/profiles":
            # tutor=False in phase 1 (the /api/ask route isn't wired yet, so the
            # frontend correctly hides the AI helper).
            return _resp(200, {"profiles": PROFILES, "tutor": False})

        return _resp(404, {"error": "not found", "path": path})
    except Exception as e:
        return _resp(500, {"error": str(e), "type": type(e).__name__})
