"""Kid tutor logic — same prompts as the Pi's server.py, but runs on Bedrock."""
import os

import llm

TUTOR_MODEL = os.environ.get("TUTOR_MODEL", "us.anthropic.claude-haiku-4-5-20251001-v1:0")

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
    "hint or question. Doing MORE than asked is great — if they also did the bonus or "
    "experimented, praise it; never tell them to remove correct extra work or that they "
    "have 'too much'. Only flag things that are actually broken or missing.\n"
    "- If their code got an ERROR, explain in plain, kind words what the error means and "
    "give ONE clear hint to fix it. Point at the EXACT spot — e.g. a variable name with a "
    "space (names must be one word like candy_per_friend), or the box name on the wrong "
    "side of the = (it goes on the LEFT: name = value), or a missing quote. Don't rewrite "
    "the whole program.\n"
    "- If they ask you to EXPLAIN the lesson, re-teach its main idea from scratch, slow and "
    "thorough, with a friendly real-world comparison then a tiny example. A bit longer is OK.\n"
    "- Only talk about Python, coding, and their workshop project. If they ask about "
    "something else, kindly say you're the coding helper and steer back to code.\n"
    "- Never include anything inappropriate for a child.\n"
    "- Reply with ONLY your helpful answer for the kid — no notes about your reasoning."
)


def build_messages(payload):
    history = payload.get("history") or []
    clean = []
    for m in history[-6:]:
        role = m.get("role")
        content = str(m.get("content", ""))[:2000]
        if role in ("user", "assistant") and content:
            clean.append({"role": role, "content": content})

    kid = str(payload.get("kid") or "the kid")[:40]
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
        parts.append("Optional BONUS / level-up challenge (extra credit, totally allowed):\n" + bonus)
    if code.strip():
        parts.append("The kid's code right now:\n```python\n" + code + "\n```")

    if mode == "check":
        parts.append("Please CHECK " + kid + "'s work above against the lesson's challenge. "
                     "Praise one thing, then give ONE gentle hint. Don't write the solution.")
    elif mode == "fix":
        if error:
            parts.append("They ran their code and got this error message:\n" + error)
        parts.append("Explain in simple, kind words what went wrong, and give " + kid +
                     " ONE clear hint to fix it, pointing at the exact spot. Don't rewrite the program.")
    elif mode == "explain":
        parts.append("Re-teach THIS lesson's main idea to " + kid + " from scratch — a real-world "
                     "comparison, then step by step, then ONE tiny example. End with a small thing to try.")
    else:
        parts.append(kid + " asks: " + question)
    clean.append({"role": "user", "content": "\n\n".join(parts)})
    return clean


def answer(payload):
    max_tokens = 1100 if payload.get("mode") == "explain" else 700
    return llm.chat(build_messages(payload), TUTOR_SYSTEM, TUTOR_MODEL, max_tokens)
