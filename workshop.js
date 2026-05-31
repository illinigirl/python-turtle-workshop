/* ============================================================
   Python Workshop — engine
   - Loads Pyodide (real Python in the browser)
   - Installs a kid-safe `turtle` module that RECORDS drawing ops
   - Animates those ops onto a canvas (classic pen-moving effect)
   - Wires up the editor, console, lessons, and progress
   ============================================================ */

/* ------------------------------------------------------------
   1) The custom turtle module (Python source).
   The real `turtle` needs tkinter, which doesn't exist in the
   browser. So this drop-in records every move into a list (_OPS)
   that JavaScript then animates. Kids still write `import turtle`.
   ------------------------------------------------------------ */
const KIDTURTLE_SRC = String.raw`
import math, json, sys

_OPS = []
_BG = None

def _to_color(c, args=()):
    # Accept "red", (r,g,b), or r,g,b   (0-255 or 0.0-1.0)
    if isinstance(c, (tuple, list)) and len(c) >= 3:
        r, g, b = c[0], c[1], c[2]
    elif len(args) >= 2:
        r, g, b = c, args[0], args[1]
    else:
        return str(c)
    if max(r, g, b) <= 1:
        r, g, b = r * 255, g * 255, b * 255
    return "rgb(%d,%d,%d)" % (int(r), int(g), int(b))

class Turtle:
    def __init__(self, *a, **k):
        self.x = 0.0
        self.y = 0.0
        self.heading = 0.0      # degrees, 0 = facing right, turns CCW positive
        self.pen = True
        self.col = "black"
        self.fillcol = "black"
        self.size = 2
        self.visible = True
        self.spd = 6
        self._filling = False
        self._fillpoints = []
        self._fillbuffer = []

    # --- internal ---
    def _emit(self, op):
        if self._filling and op.get("op") == "line":
            self._fillbuffer.append(op)
        else:
            _OPS.append(op)

    def _mark(self):
        if self._filling:
            self._fillpoints.append([self.x, self.y])

    # --- movement ---
    def forward(self, dist):
        rad = math.radians(self.heading)
        nx = self.x + dist * math.cos(rad)
        ny = self.y + dist * math.sin(rad)
        if self.pen:
            self._emit({"op": "line", "x1": self.x, "y1": self.y, "x2": nx, "y2": ny,
                        "color": self.col, "width": self.size, "heading": self.heading})
        self.x, self.y = nx, ny
        self._mark()
    fd = forward

    def backward(self, dist):
        self.forward(-dist)
    bk = back = backward

    def right(self, ang):
        self.heading = (self.heading - ang) % 360
    rt = right

    def left(self, ang):
        self.heading = (self.heading + ang) % 360
    lt = left

    def setheading(self, ang):
        self.heading = ang % 360
    seth = setheading

    def goto(self, x, y=None):
        if y is None:  # allow goto((x, y))
            x, y = x[0], x[1]
        if self.pen:
            self._emit({"op": "line", "x1": self.x, "y1": self.y, "x2": x, "y2": y,
                        "color": self.col, "width": self.size,
                        "heading": math.degrees(math.atan2(y - self.y, x - self.x))})
        self.x, self.y = x, y
        self._mark()
    setpos = setposition = goto

    def home(self):
        self.goto(0, 0)
        self.heading = 0

    def circle(self, radius, extent=360, steps=None):
        n = steps if steps else max(8, int(abs(extent) / 8) + 1)
        w = extent / n
        l = 2 * radius * math.sin(math.radians(w / 2))
        if radius < 0:
            l, w = -l, -w
        self.left(w / 2)
        for _ in range(n):
            self.forward(l)
            self.left(w)
        self.left(-w / 2)

    # --- pen / color ---
    def penup(self): self.pen = False
    pu = up = penup
    def pendown(self): self.pen = True
    pd = down = pendown

    def pensize(self, w=None):
        if w is None: return self.size
        self.size = w
    width = pensize

    def pencolor(self, c=None, *a):
        if c is None: return self.col
        self.col = _to_color(c, a)
    def fillcolor(self, c=None, *a):
        if c is None: return self.fillcol
        self.fillcol = _to_color(c, a)
    def color(self, *a):
        if not a: return self.col
        self.col = _to_color(a[0], ())
        self.fillcol = _to_color(a[1], ()) if len(a) >= 2 else self.col

    # --- fill ---
    def begin_fill(self):
        self._filling = True
        self._fillpoints = [[self.x, self.y]]
        self._fillbuffer = []
    def end_fill(self):
        if self._filling and len(self._fillpoints) >= 3:
            _OPS.append({"op": "fill", "points": self._fillpoints, "color": self.fillcol})
        for op in self._fillbuffer:
            _OPS.append(op)
        self._filling = False
        self._fillpoints = []
        self._fillbuffer = []

    # --- extras ---
    def dot(self, size=None, color=None):
        if size is None: size = max(self.size + 4, 2 * self.size)
        c = _to_color(color, ()) if color else self.col
        _OPS.append({"op": "dot", "x": self.x, "y": self.y, "size": size, "color": c})

    def write(self, text, move=False, align="left", font=("Arial", 14, "normal")):
        sz = 14
        try: sz = font[1]
        except Exception: pass
        _OPS.append({"op": "write", "x": self.x, "y": self.y, "text": str(text),
                     "color": self.col, "size": sz, "align": align})

    def speed(self, s=None):
        if s is None: return self.spd
        names = {"fastest": 0, "fast": 10, "normal": 6, "slow": 3, "slowest": 1}
        if isinstance(s, str): s = names.get(s, 6)
        self.spd = s
        _OPS.append({"op": "speed", "value": s})

    def hideturtle(self): self.visible = False; _OPS.append({"op": "hide"})
    ht = hideturtle
    def showturtle(self): self.visible = True; _OPS.append({"op": "show"})
    st = showturtle
    def isvisible(self): return self.visible

    def clear(self): _OPS.append({"op": "clear"})

    # --- getters ---
    def position(self): return (self.x, self.y)
    pos = position
    def xcor(self): return self.x
    def ycor(self): return self.y
    def heading_(self): return self.heading
    def getheading(self): return self.heading

# default turtle + functional API (so plain function calls work too)
_default = Turtle()

def _reset():
    _OPS.clear()
    global _BG
    _BG = None
    _default.__init__()

_FUNCS = ["forward","fd","backward","bk","back","right","rt","left","lt",
          "setheading","seth","goto","setpos","setposition","home","circle",
          "penup","pu","up","pendown","pd","down","pensize","width",
          "pencolor","fillcolor","color","begin_fill","end_fill","dot","write",
          "speed","hideturtle","ht","showturtle","st","isvisible","clear",
          "position","pos","xcor","ycor"]
_self = sys.modules[__name__]
for _n in _FUNCS:
    def _make(name):
        def _fn(*a, **k):
            return getattr(_default, name)(*a, **k)
        _fn.__name__ = name
        return _fn
    setattr(_self, _n, _make(_n))

def heading():
    return _default.heading

# --- screen-level helpers (mostly no-ops in the browser) ---
def bgcolor(c=None, *a):
    global _BG
    if c is None: return _BG
    _BG = _to_color(c, a)
    _OPS.append({"op": "bgcolor", "color": _BG})

class _Screen:
    def bgcolor(self, *a): return bgcolor(*a)
    def setup(self, *a, **k): pass
    def title(self, *a, **k): pass
    def tracer(self, *a, **k): pass
    def update(self): pass
    def listen(self, *a, **k): pass
    def onkey(self, *a, **k): pass
    def exitonclick(self): pass
    def bye(self): pass

def Screen(): return _Screen()
def getscreen(): return _Screen()
def done(*a, **k): pass
mainloop = bye = done
def tracer(*a, **k): pass
def update(*a, **k): pass
def title(*a, **k): pass
def setup(*a, **k): pass
def setworldcoordinates(*a, **k): pass

def get_ops_json():
    return json.dumps(_OPS)
`;

/* ------------------------------------------------------------
   2) DOM handles + global state
   ------------------------------------------------------------ */
const $ = (id) => document.getElementById(id);
const canvas = $("turtle-canvas");
const ctx = canvas.getContext("2d");
let pyodide = null;
let editor = null;
let current = 0;          // index of current lesson
let running = false;
let player = null;        // animation player
const W = canvas.width, H = canvas.height;

// Per-kid state lives on the server (so it follows them across devices) with
// a localStorage mirror as an offline fallback. `kid` is the current coder.
let kid = null;
let state = { done: new Set(), code: {} };
let doneSet = state.done;          // alias used throughout the UI code
let profiles = ["Carter", "Harper"];
let tutorAvailable = false;       // server told us the AI helper is on
let helpHistory = [];             // recent {role, content} for the helper, per lesson
const LAST_KID_KEY = "pyworkshop_lastkid";
const cacheKey = (k) => "pyworkshop_kid_" + k;

/* coordinate transform: turtle (0,0)=center, +y up  ->  canvas pixels */
const tx = (x) => W / 2 + x;
const ty = (y) => H / 2 - y;

/* ------------------------------------------------------------
   3) Console output
   ------------------------------------------------------------ */
function printConsole(text, isErr) {
  const el = $("console");
  const span = document.createElement("span");
  if (isErr) span.className = "err";
  span.textContent = text;
  el.appendChild(span);
  el.scrollTop = el.scrollHeight;
}
function clearConsole() { $("console").textContent = ""; }

/* ------------------------------------------------------------
   4) Canvas player — animates the recorded ops
   We keep a committed (offscreen) canvas so we never have to
   redraw everything each frame; we just blit it and draw the
   little turtle cursor on top.
   ------------------------------------------------------------ */
// The committed canvas holds ONLY the drawings (transparent background).
// The background color is tracked separately and painted behind the art at
// blit time — that way changing bgcolor never covers up the drawing, and a
// bgcolor line at the top of the program works no matter when it runs.
const committed = document.createElement("canvas");
committed.width = W; committed.height = H;
const cctx = committed.getContext("2d");
let bgColor = "#ffffff";

function resetCanvasState() {
  bgColor = "#ffffff";
  cctx.clearRect(0, 0, W, H);
}

function blit(cursor) {
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(committed, 0, 0);
  if (cursor && cursor.show) drawCursor(cursor.x, cursor.y, cursor.heading);
}

function drawCursor(x, y, headingDeg) {
  // a green turtle marker (arrowhead + little body) pointing in the heading
  const px = tx(x), py = ty(y);
  const a = -headingDeg * Math.PI / 180; // canvas y is flipped
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  // body
  ctx.beginPath();
  ctx.arc(-4, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#3cb371";
  ctx.strokeStyle = "#0c5a2c";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  // head / direction arrow
  ctx.beginPath();
  ctx.moveTo(17, 0);
  ctx.lineTo(2, 9);
  ctx.lineTo(2, -9);
  ctx.closePath();
  ctx.fillStyle = "#2aa45a";
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// Shown on lessons that don't draw (print/input lessons) so kids look at the
// Output box instead of a confusing blank canvas.
function drawNoDrawingHint() {
  blit({ show: false });
  ctx.fillStyle = "#8b93b8";
  ctx.textAlign = "center";
  ctx.font = "44px sans-serif";
  ctx.fillText("🐢💤", W / 2, H / 2 - 28);
  ctx.font = "19px sans-serif";
  ctx.fillText("No turtle drawing this time —", W / 2, H / 2 + 18);
  ctx.fillText("look at the Output box 👇", W / 2, H / 2 + 46);
  ctx.textAlign = "left";
}

class Player {
  constructor(ops) {
    this.ops = ops;
    this.i = 0;
    this.lineProg = 0;        // 0..1 along the current line
    // Did the program actually draw anything? On print-only lessons there are no
    // drawing ops, so we must NOT show a stray turtle cursor on a blank canvas.
    const drawOps = ["line", "dot", "fill", "write"];
    this.hasDrawing = ops.some((o) => drawOps.includes(o.op));
    this.hasBg = ops.some((o) => o.op === "bgcolor");
    this.cursor = { x: 0, y: 0, heading: 0, show: this.hasDrawing };
    this.speed = currentSpeed();
    this.raf = null;
  }

  start() {
    resetCanvasState();
    blit(this.cursor);
    // Nothing to animate (no drawing, or instant speed) → run it all at once.
    if (this.speed >= 11 || !this.hasDrawing) { this.drawAllInstant(); return; }
    const step = () => {
      this.advance();
      blit(this.cursor);
      if (this.i < this.ops.length) {
        this.raf = requestAnimationFrame(step);
      } else {
        this.raf = null;
        this.finish();
      }
    };
    this.raf = requestAnimationFrame(step);
  }

  // Called once the drawing is fully rendered.
  finish() {
    if (!this.hasDrawing && !this.hasBg) drawNoDrawingHint();
  }

  stop() { if (this.raf) cancelAnimationFrame(this.raf); this.raf = null; }

  drawAllInstant() {
    while (this.i < this.ops.length) {
      const op = this.ops[this.i];
      if (op.op === "line") this.commitLine(op, 1);
      else this.runOp(op);
      this.i++;
    }
    // park cursor at the end
    const last = this.ops[this.ops.length - 1];
    if (last && last.op === "line") { this.cursor.x = last.x2; this.cursor.y = last.y2; this.cursor.heading = last.heading; }
    blit(this.cursor);
    this.finish();
  }

  // advance the animation a little each frame
  advance() {
    let budget = this.pixelsPerFrame(); // how many pixels of line to draw this frame
    while (this.i < this.ops.length && budget > 0) {
      const op = this.ops[this.i];
      if (op.op !== "line") { this.runOp(op); this.i++; continue; }

      const len = Math.hypot(op.x2 - op.x1, op.y2 - op.y1);
      const remain = len * (1 - this.lineProg);
      const take = Math.min(remain, budget);
      const from = this.lineProg;
      this.lineProg += len > 0 ? take / len : 1;
      if (this.lineProg > 1) this.lineProg = 1;
      this.commitLine(op, this.lineProg, from);
      // move cursor to current tip
      this.cursor.x = op.x1 + (op.x2 - op.x1) * this.lineProg;
      this.cursor.y = op.y1 + (op.y2 - op.y1) * this.lineProg;
      this.cursor.heading = op.heading;
      budget -= take;
      if (this.lineProg >= 1) { this.lineProg = 0; this.i++; }
    }
  }

  pixelsPerFrame() {
    // speed 1 (slow) .. 10 (fast). Gentle curve so low speeds are actually
    // slow enough to watch the turtle move, high speeds still feel snappy.
    const s = this.speed;
    return 1 + s * s * 0.9;
  }

  // draw the portion of a line from fraction `from` to `to`
  commitLine(op, to, from = 0) {
    const x1 = op.x1 + (op.x2 - op.x1) * from;
    const y1 = op.y1 + (op.y2 - op.y1) * from;
    const x2 = op.x1 + (op.x2 - op.x1) * to;
    const y2 = op.y1 + (op.y2 - op.y1) * to;
    cctx.strokeStyle = op.color;
    cctx.lineWidth = op.width;
    cctx.lineCap = "round";
    cctx.beginPath();
    cctx.moveTo(tx(x1), ty(y1));
    cctx.lineTo(tx(x2), ty(y2));
    cctx.stroke();
  }

  runOp(op) {
    switch (op.op) {
      case "bgcolor":
        bgColor = op.color;
        break;
      case "fill": {
        cctx.fillStyle = op.color;
        cctx.beginPath();
        op.points.forEach((p, k) => {
          const X = tx(p[0]), Y = ty(p[1]);
          if (k === 0) cctx.moveTo(X, Y); else cctx.lineTo(X, Y);
        });
        cctx.closePath();
        cctx.fill();
        break;
      }
      case "dot":
        cctx.fillStyle = op.color;
        cctx.beginPath();
        cctx.arc(tx(op.x), ty(op.y), op.size / 2, 0, Math.PI * 2);
        cctx.fill();
        break;
      case "write":
        cctx.fillStyle = op.color;
        cctx.font = op.size + "px sans-serif";
        cctx.textAlign = op.align === "center" ? "center" : (op.align === "right" ? "right" : "left");
        cctx.fillText(op.text, tx(op.x), ty(op.y));
        break;
      case "speed":
        // mid-drawing speed change
        this.speed = op.value === 0 ? 11 : Math.min(op.value, 10);
        break;
      case "hide": this.cursor.show = false; break;
      case "show": this.cursor.show = true; break;
      case "clear": cctx.clearRect(0, 0, W, H); break;  // clears art, keeps bgcolor
    }
  }
}

function currentSpeed() {
  const v = parseInt($("speed").value, 10);
  return v; // 1..11 ; 11 means instant
}

function clearCanvas() {
  if (player) player.stop();
  resetCanvasState();
  blit({ show: false });
}

/* ------------------------------------------------------------
   5) Running Python
   ------------------------------------------------------------ */
async function runCode() {
  if (!pyodide || running) return;
  running = true;
  const btn = $("run-btn");
  btn.classList.add("busy");
  btn.textContent = "running…";
  clearConsole();
  if (player) player.stop();

  try {
    pyodide.runPython("import turtle; turtle._reset()");
    await pyodide.runPythonAsync(editor.getValue());
    const opsJson = pyodide.runPython("import turtle; turtle.get_ops_json()");
    const ops = JSON.parse(opsJson);
    player = new Player(ops);
    player.start();
    if (ops.length === 0) printConsole("", false); // ran fine, maybe just printed
  } catch (e) {
    showPythonError(e);
  } finally {
    running = false;
    btn.classList.remove("busy");
    btn.textContent = "▶ Run";
  }
}

function showPythonError(e) {
  const msg = String(e.message || e);
  // Pyodide wraps tracebacks; pull out the friendly last line.
  const lines = msg.trim().split("\n").filter(Boolean);
  const last = lines[lines.length - 1] || "Something went wrong.";
  printConsole("\n🐛 Oops! " + friendlyError(last) + "\n", true);
  offerErrorHelp(last);
}

// translate common Python errors into kid language — MOST SPECIFIC FIRST
// (several of these are SyntaxErrors, so the generic SyntaxError line is last).
function friendlyError(line) {
  if (/cannot assign to|can't assign to|assign to (expression|operator|literal|function call)/.test(line))
    return "The box name and the value look like they're on the wrong sides of the =. Python wants it like  candy = 20  — the box name on the LEFT, the value on the RIGHT.";
  if (/IndentationError|unexpected indent|expected an indented/.test(line))
    return "The spacing is off. Lines inside a loop, if, or def need to be pushed in evenly — press Tab.";
  if (/unterminated string|EOL while scanning|unterminated/.test(line))
    return 'A quote is missing its partner. Every " needs another " to close the words.';
  if (/NameError/.test(line)) {
    const m = line.match(/name '([^']+)'/);
    return "Python doesn't know the name" + (m ? ' "' + m[1] + '"' : "") +
      " yet. Check the spelling — or did you forget quotes around some words?";
  }
  if (/ValueError/.test(line) && /int\(\)/.test(line))
    return "It tried to turn words into a number. Type only digits (like 7) when it asks.";
  if (/TypeError/.test(line) && /concatenate|str.*int|int.*str|must be str/.test(line))
    return 'You\'re gluing words and a number together. Wrap the number in str(...), like  "I am " + str(age).';
  if (/TypeError/.test(line))
    return "Those things don't fit together. A number and words usually need str() or int() first.";
  if (/SyntaxError|invalid syntax/.test(line))
    return "Python got confused reading a line. Two common fixes: a box (variable) name must be ONE word with no spaces (use_underscores instead), and a for/if/def line needs a : at the end.";
  return line;
}

// On an error, offer a one-tap explanation from the AI helper that reads the
// kid's actual code + the error. This is the "suggestion" — no need to know
// what to ask.
function offerErrorHelp(errLine) {
  if (!tutorAvailable) return;
  const wrap = document.createElement("div");
  wrap.className = "err-help-wrap";
  const btn = document.createElement("button");
  btn.className = "btn err-help";
  btn.type = "button";
  btn.textContent = "🤔 What does that mean? Ask the helper";
  btn.addEventListener("click", () => {
    btn.disabled = true;
    $("help").scrollIntoView({ behavior: "smooth", block: "nearest" });
    askHelper("Why didn't my code work? 🤔", "fix", errLine);
  }, { once: true });
  wrap.appendChild(btn);
  $("console").appendChild(wrap);
  $("console").scrollTop = $("console").scrollHeight;
}

/* ------------------------------------------------------------
   6) Lessons UI
   ------------------------------------------------------------ */
function savedCodeFor(i) { return state.code[i]; }
function saveCodeFor(i, code) {
  state.code[i] = code;
  schedulePersist();
}

// Save the kid's state to the server (and mirror to localStorage). Debounced
// so typing doesn't hammer the Pi.
let persistTimer = null;
function schedulePersist() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(persistNow, 600);
}
function snapshot() {
  return { kid: kid, done: [...doneSet], code: state.code };
}
function persistNow() {
  if (!kid) return;
  const payload = snapshot();
  try { localStorage.setItem(cacheKey(kid), JSON.stringify(payload)); } catch (e) {}
  fetch("api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {/* offline: localStorage mirror has it */});
}
// keep the alias name used by older callers
function saveProgress() { schedulePersist(); }

// Switch to a kid: persist whoever was active, then load the new kid's state
// from the server (falling back to the localStorage mirror if offline).
async function loadKid(name) {
  if (kid && editor) { saveCodeFor(current, editor.getValue()); persistNow(); }
  kid = name;
  try { localStorage.setItem(LAST_KID_KEY, name); } catch (e) {}
  $("who-name").textContent = name;

  let data = null;
  try {
    const r = await fetch("api/progress?kid=" + encodeURIComponent(name));
    if (r.ok) data = await r.json();
  } catch (e) { /* offline */ }
  if (!data) {
    try { data = JSON.parse(localStorage.getItem(cacheKey(name))) || {}; }
    catch (e) { data = {}; }
  }

  state = { done: new Set(data.done || []), code: data.code || {} };
  doneSet = state.done;
  current = 0;
  buildSidebar();
  renderLesson();
  $("picker").classList.add("hidden");
}

// Build the "who's coding?" buttons from the server's profile list.
async function buildPicker() {
  try {
    const r = await fetch("api/profiles");
    if (r.ok) {
      const data = await r.json();
      profiles = data.profiles || profiles;
      tutorAvailable = !!data.tutor;
    }
  } catch (e) { /* static-only mode: keep defaults, no tutor */ }

  const avatars = ["🧑‍🚀", "👧", "🦊", "🐢", "🦉", "🐱", "🦄", "🐼"];
  const box = $("picker-buttons");
  box.innerHTML = "";
  profiles.forEach((name) => {
    const b = document.createElement("button");
    b.className = "kid-btn";
    b.innerHTML = '<span class="avatar">' + avatars[box.children.length % avatars.length] + '</span>' + name +
                  '<span class="sub">tap to start</span>';
    b.addEventListener("click", () => loadKid(name));
    box.appendChild(b);
  });
}

function showPicker() { $("picker").classList.remove("hidden"); }

function buildSidebar() {
  const list = $("lesson-list");
  list.innerHTML = "";
  let lastUnit = null;
  LESSONS.forEach((lesson, i) => {
    if (lesson.unit !== lastUnit) {
      const d = document.createElement("li");
      d.className = "unit-divider";
      d.textContent = lesson.unit;
      list.appendChild(d);
      lastUnit = lesson.unit;
    }
    const li = document.createElement("li");
    li.dataset.index = i;
    li.innerHTML = '<span class="tick">' + (doneSet.has(i) ? "✓" : "○") + '</span>' +
                   '<span>' + lesson.title + '</span>';
    if (doneSet.has(i)) li.classList.add("done");
    li.addEventListener("click", () => goTo(i));
    list.appendChild(li);
  });
  updateActive();
  updateProgress();
}

function updateActive() {
  document.querySelectorAll("#lesson-list li").forEach((li) => {
    li.classList.toggle("active", li.dataset.index == current);
  });
}

function updateProgress() {
  const total = LESSONS.length;
  const done = [...doneSet].filter((i) => i < total).length;
  $("progress-fill").style.width = (100 * done / total) + "%";
  $("progress-text").textContent = done + " / " + total;
}

function renderLesson() {
  const L = LESSONS[current];
  $("lesson-unit").textContent = L.unit;
  $("lesson-title").textContent = L.title;
  $("lesson-intro").innerHTML = L.intro;
  $("lesson-task").innerHTML = L.task;
  $("lesson-levelup").innerHTML = L.levelUp || "";
  // editor: use saved code if the kid worked on this one, else the starter
  const saved = savedCodeFor(current);
  editor.setValue(saved !== undefined ? saved : L.starter);
  clearConsole();
  clearCanvas();
  $("prev-btn").disabled = current === 0;
  $("next-btn").disabled = current === LESSONS.length - 1;
  $("done-btn").textContent = doneSet.has(current) ? "✓ Finished!" : "✓ I finished this!";
  updateActive();
  // fresh helper conversation for each lesson
  helpHistory = [];
  $("help-chat").innerHTML = "";
  $("help").classList.toggle("hidden", !tutorAvailable);
  // scroll lesson text back to top
  $("stage").scrollTop = 0;
}

/* ------------------------------------------------------------
   AI helper ("Ask the helper")
   ------------------------------------------------------------ */
// Turn a lesson's intro HTML into plain text to send as context.
function lessonPlainText(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return (d.textContent || "").replace(/\s+\n/g, "\n").trim().slice(0, 2000);
}

function helpBubble(cls, html) {
  const div = document.createElement("div");
  div.className = "bubble " + cls;
  if (cls === "helper") div.innerHTML = renderHelperMarkdown(html);
  else div.textContent = html;
  $("help-chat").appendChild(div);
  $("help-chat").scrollTop = $("help-chat").scrollHeight;
  return div;
}

// Minimal, SAFE markdown. Pull code blocks out into placeholders FIRST (so the
// heading/bold passes can't corrupt "#" comments inside code), escape the rest,
// convert headings/inline-code/bold, then restore the (escaped) code blocks.
function renderHelperMarkdown(text) {
  const esc = (x) => x.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const blocks = [];
  let s = String(text).replace(/```(?:python)?\n?([\s\S]*?)```/g, (m, code) => {
    blocks.push("<pre><code>" + esc(code.replace(/\n$/, "")) + "</code></pre>");
    return " " + (blocks.length - 1) + " ";
  });
  s = esc(s);
  s = s.replace(/^\s*#{1,6}\s*(.+)$/gm, "<strong>$1</strong>");  // # heading -> bold
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");                 // inline code
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");       // **bold**
  s = s.replace(/ (\d+) /g, (m, i) => blocks[+i]);      // restore code
  return s;
}

async function askHelper(question, mode = "ask", errorText = "") {
  helpBubble("me", question);
  const waitMsg = mode === "check" ? "looking at your code…"
    : mode === "fix" ? "reading the error…"
    : mode === "explain" ? "writing a clearer explanation…" : "thinking…";
  const thinking = helpBubble("helper thinking", waitMsg);
  setHelpBusy(true);

  try {
    const r = await fetch("api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        mode,
        errorText,
        history: helpHistory.slice(-6),
        kid,
        lessonTitle: LESSONS[current].title,
        lessonText: lessonPlainText(LESSONS[current].intro),
        lessonTask: lessonPlainText(LESSONS[current].task),
        levelUp: lessonPlainText(LESSONS[current].levelUp),
        code: editor.getValue(),
      }),
    });
    const data = await r.json().catch(() => ({}));
    const answer = r.ok ? (data.answer || "") : (data.error || "Hmm, that didn't work. Try again!");
    thinking.className = "bubble helper";
    thinking.innerHTML = renderHelperMarkdown(answer);
    if (r.ok && answer) {
      helpHistory.push({ role: "user", content: question });
      helpHistory.push({ role: "assistant", content: answer });
    }
  } catch (e) {
    thinking.className = "bubble helper";
    thinking.textContent = "I couldn't reach the helper. Check the connection and try again.";
  } finally {
    setHelpBusy(false);
    $("help-chat").scrollTop = $("help-chat").scrollHeight;
  }
}

// enable/disable all the helper buttons together while a request is in flight
function setHelpBusy(busy) {
  ["help-send", "check-work", "explain-lesson"].forEach((id) => {
    const el = $(id);
    if (el) el.disabled = busy;
  });
}

function goTo(i) {
  if (i < 0 || i >= LESSONS.length) return;
  // remember work on the lesson we're leaving
  if (editor) saveCodeFor(current, editor.getValue());
  current = i;
  renderLesson();
}

/* ------------------------------------------------------------
   7) Button wiring
   ------------------------------------------------------------ */
function wireButtons() {
  $("run-btn").addEventListener("click", runCode);
  $("clear-btn").addEventListener("click", clearCanvas);
  $("console-clear").addEventListener("click", clearConsole);
  $("prev-btn").addEventListener("click", () => goTo(current - 1));
  $("next-btn").addEventListener("click", () => goTo(current + 1));

  $("reset-btn").addEventListener("click", () => {
    if (confirm("Put the original starter code back? Your changes here will be replaced.")) {
      editor.setValue(LESSONS[current].starter);
      saveCodeFor(current, LESSONS[current].starter);
    }
  });

  $("solution-btn").addEventListener("click", () => {
    const L = LESSONS[current];
    if (!L.solution) return;
    if (confirm("Peek at an example answer? It's totally fine to look when you're stuck — then try it your own way too!")) {
      // load into editor but DON'T overwrite their saved work key until they edit
      editor.setValue(L.solution);
    }
  });

  $("who").addEventListener("click", () => {
    if (kid && editor) { saveCodeFor(current, editor.getValue()); persistNow(); }
    showPicker();
  });

  $("help-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("help-input").value.trim();
    if (!q) return;
    $("help-input").value = "";
    askHelper(q);
  });

  $("check-work").addEventListener("click", () => {
    askHelper("Can you check my work so far? 🔍", "check");
  });

  $("explain-lesson").addEventListener("click", () => {
    askHelper("Can you explain this lesson to me in a simpler way? 📖", "explain");
  });

  $("done-btn").addEventListener("click", () => {
    if (doneSet.has(current)) doneSet.delete(current);
    else doneSet.add(current);
    persistNow();
    buildSidebar();
    renderLesson();
    if (doneSet.has(current) && current < LESSONS.length - 1) {
      setTimeout(() => goTo(current + 1), 350);
    }
  });

  // Ctrl/Cmd+Enter to run — feels pro
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); runCode(); }
  });

  // save code as they type (debounced)
  let t = null;
  editor.on("change", () => {
    clearTimeout(t);
    t = setTimeout(() => saveCodeFor(current, editor.getValue()), 400);
  });
}

/* ------------------------------------------------------------
   8) Boot
   ------------------------------------------------------------ */
function setBoot(pct, msg) {
  $("boot-fill").style.width = pct + "%";
  if (msg) $("boot-msg").textContent = msg;
}

async function boot() {
  // editor first so the page feels alive
  editor = CodeMirror($("editor"), {
    value: "",
    mode: "python",
    theme: "dracula",
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    extraKeys: {
      Tab: (cm) => cm.replaceSelection("    "),  // insert spaces, not a tab
    },
  });

  wireButtons();

  // flush the kid's work when the page is hidden or closed
  const flush = () => {
    if (!kid) return;
    saveCodeFor(current, editor.getValue());
    const blob = new Blob([JSON.stringify(snapshot())], { type: "application/json" });
    if (navigator.sendBeacon) navigator.sendBeacon("api/progress", blob);
    else persistNow();
  };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(); });

  setBoot(25, "Downloading the Python engine…");
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
  });
  setBoot(70, "Setting up the turtle…");

  // stdout / stderr -> our console box.
  // Pyodide's `batched` callback fires once per line with the trailing newline
  // stripped, so we add it back — otherwise every print() (and any "\n" inside a
  // string) runs together on one line.
  pyodide.setStdout({ batched: (s) => printConsole(s + "\n") });
  pyodide.setStderr({ batched: (s) => printConsole(s + "\n", true) });

  // install our turtle as the module named "turtle"
  pyodide.runPython(`
import sys, types
_m = types.ModuleType("kidturtle")
_m.__dict__["__name__"] = "kidturtle"
sys.modules["kidturtle"] = _m
sys.modules["turtle"] = _m
exec(compile(${JSON.stringify(KIDTURTLE_SRC)}, "kidturtle.py", "exec"), _m.__dict__)
`);

  // friendly input() using the browser prompt, echoed to the console
  pyodide.runPython(`
import builtins, js
def _kid_input(prompt=""):
    if prompt:
        print(prompt, end="")
    r = js.window.prompt(prompt if prompt else "Type your answer:")
    if r is None:
        r = ""
    print(r)
    return r
builtins.input = _kid_input
`);

  setBoot(100, "Ready!");
  $("boot").classList.add("hidden");

  // Now choose who's coding. Auto-resume the last kid on this device;
  // otherwise show the picker.
  await buildPicker();
  let last = null;
  try { last = localStorage.getItem(LAST_KID_KEY); } catch (e) {}
  if (last && profiles.includes(last)) {
    await loadKid(last);
  } else {
    showPicker();
  }
}

boot();
