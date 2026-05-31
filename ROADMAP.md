# Roadmap

Where this is headed beyond the local/single-host version. Today it runs as a
static site + a small stdlib server; the frontend is already **backend-optional**
(it falls back to localStorage and hides the AI helper when no API is present), so
it can move to the cloud without a rewrite.

## 1. Public hosting on AWS (serverless)

Goal: a real HTTPS URL anyone can open, that costs ~nothing at low traffic and
scales cleanly.

```
            ┌─────────────┐      ┌──────────────┐     ┌──────────────┐
 Browser ──▶│  CloudFront │ ───▶ │      S3      │     │  (static app)│
            └──────┬──────┘      └──────────────┘     └──────────────┘
                   │  /api/*
                   ▼
            ┌─────────────┐      ┌──────────────┐     ┌──────────────┐
            │ API Gateway │ ───▶ │   Lambda     │ ──▶ │  DynamoDB    │  progress + profiles
            │  (HTTP API) │      │ (progress,   │     └──────────────┘
            └─────────────┘      │  ask)        │ ──▶  Anthropic API
                                 └──────┬───────┘     (key in Secrets Manager)
                                        ▼
                                 Secrets Manager / SSM
```

- **Frontend:** S3 + CloudFront (the current `index.html` / `css` / `js`, unchanged).
- **Backend:** API Gateway (HTTP API) + Lambda — the existing `server.py` handlers
  (`/api/progress`, `/api/ask`) port over with minimal change. Scales to zero.
- **Data:** DynamoDB single table (profiles + progress).
- **AI key:** Secrets Manager / SSM Parameter Store — never in the bundle, never in
  the browser.
- **IaC:** AWS SAM or CDK so the whole stack is reproducible from the repo.

## 2. Accounts — privacy-first ("any kid can sign up")

Open sign-up for children means **COPPA** applies the moment you collect personal
info from under-13s. The design sidesteps that by **collecting no personal info**:

- A learner picks a **nickname + a 4-digit PIN**. No email, no real name required,
  no age stored as identity.
- Stored in DynamoDB keyed by nickname; PIN is hashed. Progress attaches to it.
- Anyone with the link can create one — but there's nothing sensitive to leak.

It's a coding playground, not a bank, so a lightweight PIN is the right amount of
security. (A "real" email/password tier via **Cognito** can be added later for an
adult/teen audience or parent-managed accounts — that's where Cognito fits without
tripping COPPA.)

### Guardrails before going public
- **Per-profile daily cap** on AI-helper questions (cost + abuse control).
- **Rate limiting** at CloudFront/WAF or in the Lambda.
- **AWS budget alarm** so a surprise bill can't sneak up.

## 3. Tailored tracks (ages + skill levels, eventually adults)

Today `lessons.js` is one flat list. To support different learners, restructure
lessons into **tracks** — each a metadata-tagged, ordered set:

```js
{ id: "kids-9-13", title: "Turtle Coders", level: "beginner", lessons: [...] }
{ id: "teen",      title: "Python Jumpstart", level: "intermediate", lessons: [...] }
{ id: "adult",     title: "Python Crash Course", level: "fast",       lessons: [...] }
```

- Learner picks a track at sign-up (or switches anytime).
- The current 12 lessons become the "Turtle Coders" track.
- The AI helper already adapts its tone; pass the learner's **level** into the
  system prompt so explanations match their age/experience.

## Nice-to-haves
- "Save my drawing" gallery (server-side).
- Optional gentle auto-nudge when a learner is stuck on a lesson for a while.
- Shareable creations / a class-code mode for teachers.
