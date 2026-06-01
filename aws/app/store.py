"""DynamoDB + S3 storage. Single table, pk/sk.

  EVENT                 insights events (TTL'd)
  CONFIG / auth_secret  HMAC secret for tokens (auto-created)
  ACCOUNT#<nick>        nickname+PIN account (pin hashed)
  PROGRESS#<nick>       a learner's progress (done/code/steps)
  GALLERY#<nick>        saved-drawing metadata (PNG bytes live in S3)
"""
import base64
import hashlib
import hmac
import os
import re
import secrets as _secrets
import time
import uuid

import boto3
from boto3.dynamodb.conditions import Key

TABLE = os.environ["TABLE"]
BUCKET = os.environ.get("GALLERY_BUCKET", "")
_t = boto3.resource("dynamodb").Table(TABLE)
_s3 = boto3.client("s3")
_TTL_DAYS = 120
GALLERY_MAX = 40
GALLERY_MAX_BYTES = 700 * 1024


def _nick(nick):
    return re.sub(r"[^a-z0-9_]", "", str(nick or "").lower())[:24]


# ---- auth (nickname + PIN, HMAC token) ------------------------------------
_SECRET = None


def _secret():
    global _SECRET
    if _SECRET is None:
        r = _t.get_item(Key={"pk": "CONFIG", "sk": "auth_secret"}).get("Item")
        if r:
            _SECRET = r["v"]
        else:
            v = _secrets.token_hex(32)
            try:
                # conditional write so concurrent cold starts converge on ONE
                # secret (an unconditional put let instances cache different
                # secrets, breaking token verification across instances).
                _t.put_item(Item={"pk": "CONFIG", "sk": "auth_secret", "v": v},
                            ConditionExpression="attribute_not_exists(pk)")
                _SECRET = v
            except _t.meta.client.exceptions.ConditionalCheckFailedException:
                _SECRET = _t.get_item(Key={"pk": "CONFIG", "sk": "auth_secret"}).get("Item")["v"]
    return _SECRET


def make_token(nick):
    return hmac.new(_secret().encode(), _nick(nick).encode(), hashlib.sha256).hexdigest()


def check_token(nick, token):
    return bool(token) and hmac.compare_digest(make_token(nick), str(token))


def _hash_pin(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", str(pin).encode(), bytes.fromhex(salt), 100_000).hex()


def create_account(nick, pin):
    n = _nick(nick)
    if len(n) < 2:
        return None, "Pick a name with at least 2 letters or numbers."
    if not re.fullmatch(r"\d{4}", str(pin or "")):
        return None, "Your PIN must be exactly 4 numbers."
    salt = _secrets.token_hex(16)
    try:
        _t.put_item(
            Item={"pk": f"ACCOUNT#{n}", "sk": "profile", "nick": str(nick)[:24],
                  "salt": salt, "pin": _hash_pin(pin, salt), "created": int(time.time())},
            ConditionExpression="attribute_not_exists(pk)")
    except _t.meta.client.exceptions.ConditionalCheckFailedException:
        return None, "That name is taken — try another one!"
    return make_token(n), None


def login(nick, pin):
    n = _nick(nick)
    r = _t.get_item(Key={"pk": f"ACCOUNT#{n}", "sk": "profile"}).get("Item")
    if not r:
        return None, "No account with that name yet. Tap “Create new” to make one!"
    if not hmac.compare_digest(_hash_pin(pin, r["salt"]), r["pin"]):
        return None, "That PIN doesn't match. Try again!"
    return make_token(n), None


def account_exists(nick):
    return "Item" in _t.get_item(Key={"pk": f"ACCOUNT#{_nick(nick)}", "sk": "profile"})


# ---- insights admin key (gates the grown-up insights page) ----------------
def check_insights_token(given):
    r = _t.get_item(Key={"pk": "CONFIG", "sk": "insights_token"}).get("Item")
    tok = r["v"] if r else None
    return bool(tok) and bool(given) and hmac.compare_digest(tok, str(given))


# ---- progress -------------------------------------------------------------
def get_progress(nick):
    r = _t.get_item(Key={"pk": f"PROGRESS#{_nick(nick)}", "sk": "state"}).get("Item")
    if not r:
        return {"done": [], "code": {}, "steps": {}}
    return {"done": r.get("done", []), "code": r.get("code", {}), "steps": r.get("steps", {})}


def put_progress(nick, done, code, steps):
    _t.put_item(Item={"pk": f"PROGRESS#{_nick(nick)}", "sk": "state",
                      "done": done, "code": code, "steps": steps})


# ---- gallery (PNG in S3, metadata in DynamoDB, presigned URLs) ------------
def gallery_add(nick, data_url, title, lesson):
    m = re.match(r"^data:image/png;base64,([A-Za-z0-9+/=]+)$", data_url or "")
    if not m:
        raise ValueError("not a png data url")
    raw = base64.b64decode(m.group(1))
    if len(raw) > GALLERY_MAX_BYTES:
        raise ValueError("image too large")
    n = _nick(nick)
    ms = int(time.time() * 1000)
    fname = f"{n}-{ms}.png"
    _s3.put_object(Bucket=BUCKET, Key=f"gallery/{fname}", Body=raw, ContentType="image/png")
    _t.put_item(Item={"pk": f"GALLERY#{n}", "sk": f"{ms:013d}#{fname}", "file": fname,
                      "title": (str(title or "").strip()[:60] or "Untitled"),
                      "lesson": str(lesson or "")[:120], "ts": int(time.time())})
    _gallery_trim(n)
    return fname


def _gallery_trim(n):
    items = _t.query(KeyConditionExpression=Key("pk").eq(f"GALLERY#{n}"),
                     ScanIndexForward=True).get("Items", [])  # oldest first
    for it in items[:max(0, len(items) - GALLERY_MAX)]:
        _t.delete_item(Key={"pk": it["pk"], "sk": it["sk"]})
        try:
            _s3.delete_object(Bucket=BUCKET, Key=f"gallery/{it['file']}")
        except Exception:
            pass


def gallery_list(nick):
    n = _nick(nick)
    items = _t.query(KeyConditionExpression=Key("pk").eq(f"GALLERY#{n}"),
                     ScanIndexForward=False, Limit=60).get("Items", [])  # newest first
    out = []
    for it in items:
        url = _s3.generate_presigned_url(
            "get_object", Params={"Bucket": BUCKET, "Key": f"gallery/{it['file']}"}, ExpiresIn=3600)
        out.append({"file": it["file"], "title": it.get("title", ""),
                    "lesson": it.get("lesson", ""), "ts": int(it.get("ts", 0)), "url": url})
    return out


def gallery_delete(nick, file):
    n = _nick(nick)
    items = _t.query(KeyConditionExpression=Key("pk").eq(f"GALLERY#{n}")).get("Items", [])
    for it in items:
        if it.get("file") == file:
            _t.delete_item(Key={"pk": it["pk"], "sk": it["sk"]})
            try:
                _s3.delete_object(Bucket=BUCKET, Key=f"gallery/{file}")
            except Exception:
                pass
            return True
    return False


# ---- insights -------------------------------------------------------------
def log_event(ev):
    ts = int(time.time())
    item = {"pk": "EVENT", "sk": "%010d#%s" % (ts, uuid.uuid4().hex[:8]),
            "ts": ts, "ttl": ts + _TTL_DAYS * 86400}
    for k, v in ev.items():
        if v not in (None, ""):
            item[k] = str(v)[:300]
    _t.put_item(Item=item)


def _all_events(limit=2000):
    return _t.query(KeyConditionExpression=Key("pk").eq("EVENT"),
                    ScanIndexForward=False, Limit=limit).get("Items", [])


def insights_data():
    events = _all_events()
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
    recent = [{"kind": e.get("kind"), "kid": e.get("kid", "?"), "lesson": e.get("lesson", "?"),
               "mode": e.get("mode", ""), "errorType": e.get("errorType", ""),
               "question": e.get("question", ""), "ts": int(e.get("ts", 0))} for e in events[:40]]
    totals = {"events": len(events),
              "questions": sum(1 for e in events if e.get("kind") == "ask"),
              "errors": sum(1 for e in events if e.get("kind") == "error")}
    return {"lessons": lessons, "recent": recent, "totals": totals}


def recent_questions(n=25):
    qs = [e for e in _all_events() if e.get("kind") == "ask" and e.get("question")]
    return [{"lesson": e.get("lesson", "?"), "question": e.get("question", "")} for e in qs[:n]]
