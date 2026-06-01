"""DynamoDB storage. Single table, pk/sk. Phase 2a: insights events."""
import os
import time
import uuid

import boto3
from boto3.dynamodb.conditions import Key

TABLE = os.environ["TABLE"]
_t = boto3.resource("dynamodb").Table(TABLE)
_TTL_DAYS = 120


# ---- insights -------------------------------------------------------------
def log_event(ev):
    """Append one usage event (a question or an error). pk='EVENT'."""
    ts = int(time.time())
    item = {"pk": "EVENT", "sk": "%010d#%s" % (ts, uuid.uuid4().hex[:8]),
            "ts": ts, "ttl": ts + _TTL_DAYS * 86400}
    for k, v in ev.items():
        if v not in (None, ""):
            item[k] = str(v)[:300]
    _t.put_item(Item=item)


def _all_events(limit=2000):
    resp = _t.query(KeyConditionExpression=Key("pk").eq("EVENT"),
                    ScanIndexForward=False, Limit=limit)  # newest first
    return resp.get("Items", [])


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
