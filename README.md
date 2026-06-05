# 🐢 Python Turtle Workshop

A zero-install, browser-based workshop that teaches kids (and curious adults) to
write **real Python** — by drawing with a turtle and building little games.
Python runs **in the browser** via [Pyodide](https://pyodide.org), so there's
nothing to install on the learner's device.

**▶️ Try it live:** https://illinigirl.github.io/python-turtle-workshop/

Built as a friendly bridge from block coding (Scratch / Minecraft) to text-based
Python: instant feedback, a forgiving editor, and an optional AI helper that
answers questions in kid-friendly language.

> **Why it exists:** I wanted my own kids to learn Python without a painful setup
> step, and without me hovering to translate every error message. So the workshop
> explains itself, checks their work, and turns Python's cryptic errors into plain
> English.

## ✨ Features

- **Real Python in the browser** (Pyodide / WebAssembly) — no install, works on a
  laptop or an iPad.
- **A custom `turtle`** that animates onto an HTML canvas (the real `turtle` needs
  tkinter, which browsers don't have). Learners still write plain `import turtle`.
- **12 guided lessons + free play**: print/variables/math → turtle drawing, loops,
  color, spirals → input & `if` → a Guess-the-Number game → functions → a capstone.
- **Optional AI helper** (Claude) with three modes:
  - **Ask** — any question, answered with the learner's current code as context.
  - **📖 Explain this** — re-teaches the current lesson, step by step, with an analogy.
  - **🔍 Check my work** — praises what's right, gives one gentle hint (never the
    full solution), and recognizes bonus/extra work.
- **Plain-English error messages** + a one-tap "what does that mean?" that reads the
  learner's actual code and the error.
- **Per-learner progress** saved server-side (with a localStorage fallback offline).

## 🚀 Quick start

The page is served over `http://` (Pyodide loads its WebAssembly from a CDN, which
`file://` can block). Run the tiny included server:

```bash
git clone <this-repo>
cd python-turtle-workshop

# (optional) turn on the AI helper:
cp .env.example .env        # then paste your ANTHROPIC_API_KEY into .env
pip install anthropic python-dotenv   # only needed for the AI helper

python3 server.py           # or ./start.sh
```

Open **http://localhost:8095**, pick a profile, and start coding. Without an API
key the AI helper simply stays hidden — everything else works.

## 🧩 How it works

| File | Role |
|------|------|
| `index.html` / `style.css` | Layout + kid-friendly styling (responsive, works on tablets) |
| `lessons.js` | All lesson content — **edit here to add/change lessons** |
| `workshop.js` | The engine: Pyodide setup, the custom `turtle`, the animated canvas player, the editor, progress, and the AI helper UI |
| `server.py` | Stdlib `http.server`: serves the static files + a JSON API for progress and the AI helper (`/api/progress`, `/api/ask`). The API key stays server-side. |

The AI helper is called **server-side** so the API key is never exposed to the
browser. It's grounded with the current lesson + the learner's code, so answers
are specific. A kid-safe system prompt keeps it short, encouraging, on-topic, and
hint-based rather than handing over solutions.

## 🛠️ Configuration

All optional (see `.env.example`):

| Variable | Default | What it does |
|----------|---------|--------------|
| `ANTHROPIC_API_KEY` | — | Enables the AI helper |
| `TUTOR_MODEL` | `claude-haiku-4-5` | Helper model (use `claude-opus-4-8` for max quality) |
| `WORKSHOP_PROFILES` | `Explorer,Builder` | The profile buttons on the start screen |
| `WORKSHOP_PORT` | `8095` | Server port |

## 🗺️ Roadmap

See [ROADMAP.md](ROADMAP.md) — public hosting on AWS (serverless), open sign-up
with privacy-first accounts, and content tailored to different ages and skill
levels.

## 📄 License

MIT — see [LICENSE](LICENSE).
