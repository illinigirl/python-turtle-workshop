/* ============================================================
   LESSON CONTENT
   Each lesson:
     unit     - section name (used for sidebar dividers)
     title    - shown as the heading
     intro    - HTML explanation (kid-friendly, Scratch analogies)
     task     - the "your turn" challenge (HTML)
     levelUp  - optional extra challenge for the 12-yo (HTML or null)
     starter  - code pre-filled in the editor
     solution - an example answer they can peek at
   ============================================================ */

const LESSONS = [

/* ===================== UNIT 1 ===================== */
{
  unit: "1 · Tell the computer what to do",
  title: "Hello, Python! 👋",
  intro: `
    <p>In Scratch you used the <b>say</b> block to make a sprite talk. In Python the
    magic word is <code>print</code>. Whatever you put inside the quotes shows up
    in the <b>Output</b> box.</p>
    <pre>print("Hello!")
print("My name is Sam")</pre>
    <p>Each <code>print</code> line shows on its own line. Try changing the words and
    press <b>▶ Run</b>.</p>`,
  task: `<p>Make Python print <b>three</b> things about you: your name, your age, and
    your favorite food. One <code>print</code> for each!</p>`,
  levelUp: `<p>Can you print a tiny picture made of letters and symbols? Like a cat:
    <code>print("=^.^=")</code></p>`,
  starter:
`print("Hello!")
print("Change these words")
`,
  solution:
`print("My name is Sam")
print("I am 10 years old")
print("My favorite food is pizza")
print("=^.^=")
`
},
{
  unit: "1 · Tell the computer what to do",
  title: "Boxes that remember (variables)",
  intro: `
    <p>A <b>variable</b> is like a labeled box that remembers something for you —
    just like Scratch variables. You make one with an <code>=</code> sign:</p>
    <pre>name = "Sam"
age = 10</pre>
    <p><b>Here's the big secret 🤫 — quotes vs. no quotes:</b></p>
    <ul>
      <li><b>Quotes</b> <code>" "</code> mean <i>"print these EXACT letters."</i></li>
      <li><b>No quotes</b> mean <i>"look INSIDE the box with that name."</i></li>
    </ul>
    <pre>name = "Sam"

print("name")   # prints the word:   name
print(name)     # opens the box:     Sam</pre>
    <p>See the difference? <code>"name"</code> is just the 4 letters n-a-m-e.
    <code>name</code> (no quotes) means "whatever I put in the box" — Sam!</p>
    <p>You can glue words and boxes together with <code>+</code>. Numbers need
    <code>str(...)</code> to join with words:</p>
    <pre>print("Hi " + name + ", you are " + str(age))
# prints:  Hi Sam, you are 10</pre>
    <p>The <code>"Hi "</code> is exact text (quotes), <code>name</code> is the box
    (no quotes). Mixing them is how you make sentences!</p>`,
  task: `<p>Make a box for your <code>name</code> and one for your <code>age</code>.
    Then print one sentence that uses BOTH boxes, like <i>"Sam is 10 years old."</i></p>
    <p><b>Trick part:</b> use your boxes (no quotes!) — don't just type your name
    inside quotes again. Let the box do the work. 📦</p>`,
  levelUp: `<p>Make a variable <code>years_until_16 = 16 - age</code> and print how many
    years until you can drive.</p>`,
  starter:
`name = "put your name here"
age = 10

print(name)
`,
  solution:
`name = "Sam"
age = 10
years_until_16 = 16 - age

print(name + " is " + str(age) + " years old.")
print("Only " + str(years_until_16) + " years until you can drive!")
`
},
{
  unit: "1 · Tell the computer what to do",
  title: "Python is a calculator 🧮",
  intro: `
    <p>Python loves math. Try these in the editor:</p>
    <pre>print(2 + 2)
print(10 - 3)
print(6 * 7)     # * means multiply
print(20 / 4)    # / means divide</pre>
    <p>You can store answers in variables and use them later:</p>
    <pre>cookies = 12
kids = 3
print("Each kid gets", cookies / kids)</pre>
    <p>Notice you can give <code>print</code> several things separated by commas and it
    puts spaces between them.</p>`,
  task: `<p>You have a number of <code>candy</code> pieces and a number of
    <code>friends</code>. Print how many pieces each friend gets if you share them
    equally.</p>`,
  levelUp: `<p>Use <code>%</code> (called "remainder") to print how many candies are
    LEFT OVER after sharing: <code>print(candy % friends)</code></p>`,
  starter:
`candy = 20
friends = 4

# print how many each friend gets
`,
  solution:
`candy = 20
friends = 4

print("Each friend gets", candy / friends)
print("Left over:", candy % friends)
`
},

/* ===================== UNIT 2 ===================== */
{
  unit: "2 · Meet the turtle 🐢",
  title: "Move the turtle",
  intro: `
    <p>Time for drawing! Python has a <b>turtle</b> that carries a pen. When it moves,
    it draws a line — exactly like the pen blocks in Scratch.</p>
    <pre>import turtle

turtle.forward(120)   # walk forward 120 steps
turtle.right(90)      # turn right 90 degrees
turtle.forward(120)</pre>
    <p><b>forward</b> walks the turtle the way it's facing. <b>right</b> and
    <b>left</b> spin it <i>in place</i> — they don't move it, they just change which
    way it points. The turtle starts facing <b>right →</b>.</p>
    <p>The number is how far to turn, in <b>degrees</b>:</p>
    <ul>
      <li><code>right(90)</code> = a quarter turn (a square corner) ⤵</li>
      <li><code>right(180)</code> = a half turn (now it faces backward) ↩</li>
      <li><code>right(45)</code> = a small turn (half of a corner)</li>
    </ul>
    <p>So to draw a corner you do two steps: <code>forward</code> (draw a line), then
    <code>right</code> or <code>left</code> (point a new way), then <code>forward</code>
    again. That's how you build any shape out of straight lines!</p>`,
  task: `<p>Draw a big letter <b>L</b>: go forward, turn, go forward.</p>
    <p>Then try a letter made of <b>straight lines</b> — great ones are
    <b>T, E, F, H, I, L</b>. (You'll use <code>penup()</code>/<code>pendown()</code>
    in a later lesson to lift the pen, so for now pick a letter you can draw in
    one path.)</p>
    <p>💡 Curvy letters like <b>C, S, O, G</b> need <i>circles</i> — we learn those
    in a couple of lessons! So for today, pick a straight-line letter. ✏️</p>`,
  levelUp: `<p>Make the turtle draw a triangle. Hint: turn <code>120</code> degrees
    between each side (not 90!). Why 120? Because a triangle's outside turns add up
    to 360, and 360 ÷ 3 = 120.</p>`,
  starter:
`import turtle

turtle.forward(120)
turtle.right(90)
turtle.forward(120)
`,
  solution:
`import turtle

# A triangle
turtle.forward(150)
turtle.left(120)
turtle.forward(150)
turtle.left(120)
turtle.forward(150)
`
},
{
  unit: "2 · Meet the turtle 🐢",
  title: "Repeat with a loop 🔁",
  intro: `
    <p>To draw a square you do the same thing 4 times: forward, turn, forward, turn…
    In Scratch you used the <b>repeat</b> block. In Python that is a
    <code>for</code> loop:</p>
    <pre>import turtle

for i in range(4):
    turtle.forward(120)
    turtle.right(90)</pre>
    <p><b>Super important:</b> the lines INSIDE the loop are pushed in with spaces
    (this is called <i>indentation</i>). That is how Python knows what to repeat.
    Press Tab to indent.</p>`,
  task: `<p>Change the square into a different shape. Try a <b>hexagon</b> (6 sides):
    use <code>range(6)</code> and turn <code>60</code> degrees each time.</p>`,
  levelUp: `<p>Draw a <b>star</b>! Use <code>range(5)</code>, go
    <code>forward(200)</code>, and turn <code>right(144)</code> each time.</p>`,
  starter:
`import turtle

for i in range(4):
    turtle.forward(120)
    turtle.right(90)
`,
  solution:
`import turtle

# A 5-pointed star
for i in range(5):
    turtle.forward(200)
    turtle.right(144)
`
},
{
  unit: "2 · Meet the turtle 🐢",
  title: "Colors & thicker pens 🎨",
  intro: `
    <p>Let's add color! Tell the turtle a color before it draws:</p>
    <pre>import turtle

turtle.pensize(6)            # thicker pen
turtle.pencolor("magenta")   # any color name

for i in range(4):
    turtle.forward(120)
    turtle.right(90)</pre>
    <p>Color names that work: <code>red orange yellow green blue purple
    magenta pink brown black gray</code> and lots more.</p>
    <p>You can even change the background: <code>turtle.bgcolor("black")</code>.</p>`,
  task: `<p>Draw a shape where you change the <code>pencolor</code> to a different color
    on each side. Hint: put a new <code>pencolor</code> line inside the loop, or just
    write the sides out one at a time.</p>`,
  levelUp: `<p>Make a list of colors and pull a new one each time around the loop:</p>
    <pre>colors = ["red", "orange", "green", "blue"]
for i in range(4):
    turtle.pencolor(colors[i])
    turtle.forward(120)
    turtle.right(90)</pre>`,
  starter:
`import turtle

turtle.pensize(6)
turtle.bgcolor("black")

turtle.pencolor("yellow")
turtle.forward(140)
turtle.right(120)
turtle.pencolor("magenta")
turtle.forward(140)
`,
  solution:
`import turtle
turtle.pensize(6)
turtle.bgcolor("black")

colors = ["red", "orange", "yellow", "green", "blue", "magenta"]
for i in range(6):
    turtle.pencolor(colors[i])
    turtle.forward(120)
    turtle.right(60)
`
},
{
  unit: "2 · Meet the turtle 🐢",
  title: "Spirals & wow patterns 🌀",
  intro: `
    <p>Here is where loops get amazing. If the turn is a little bit OFF from a normal
    shape, you get a spinning pattern. Try this and watch:</p>
    <pre>import turtle
turtle.bgcolor("black")
turtle.pensize(2)

for i in range(100):
    turtle.pencolor("cyan")
    turtle.forward(i)     # each line a little longer
    turtle.right(91)      # 91, not 90 -> it spirals!</pre>
    <p>The variable <code>i</code> counts up 0, 1, 2, 3… so <code>forward(i)</code>
    draws longer and longer lines.</p>`,
  task: `<p>Run it, then experiment! Change <code>right(91)</code> to other numbers like
    <code>89</code>, <code>120</code>, <code>144</code>. Change the color. Every number
    makes a totally different pattern.</p>`,
  levelUp: `<p>Use a list of colors so the spiral is a rainbow:</p>
    <pre>colors = ["red","orange","yellow","green","blue","purple"]
for i in range(120):
    turtle.pencolor(colors[i % 6])
    turtle.forward(i)
    turtle.right(59)</pre>
    <p><code>i % 6</code> cycles 0,1,2,3,4,5,0,1,2… so the colors repeat.</p>`,
  starter:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)
turtle.pencolor("cyan")

for i in range(100):
    turtle.forward(i)
    turtle.right(91)
`,
  solution:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)

colors = ["red","orange","yellow","green","blue","purple"]
for i in range(140):
    turtle.pencolor(colors[i % 6])
    turtle.forward(i)
    turtle.right(59)
`
},

/* ===================== UNIT 3 ===================== */
{
  unit: "3 · Making choices",
  title: "Ask a question (input & if)",
  intro: `
    <p>In Scratch the <b>ask</b> block let a sprite ask you something. Python uses
    <code>input</code>. Whatever you type gets stored in a box:</p>
    <pre>name = input("What is your name? ")
print("Hi " + name + "!")</pre>
    <p>Now we can make the program <b>decide</b> things with <code>if</code>. This is
    like the Scratch <b>if/else</b> block:</p>
    <pre>age = int(input("How old are you? "))

if age &gt;= 13:
    print("You are a teenager!")
else:
    print("You are a kid — awesome.")</pre>
    <p><code>int(...)</code> turns the typed text into a real number so we can compare
    it. <code>&gt;=</code> means "greater than or equal to".</p>`,
  task: `<p>Ask the user for their favorite color, then print a different message if
    they say your favorite color vs. anything else. Use <code>if</code> and
    <code>else</code>.</p>`,
  levelUp: `<p>Add a third option with <code>elif</code> (means "else if"):</p>
    <pre>if color == "red":
    print("Hot!")
elif color == "blue":
    print("Cool!")
else:
    print("Nice choice!")</pre>`,
  starter:
`color = input("What is your favorite color? ")

if color == "green":
    print("Same as the turtle!")
else:
    print("Cool, I like " + color + " too.")
`,
  solution:
`color = input("What is your favorite color? ")

if color == "red":
    print("Hot like fire!")
elif color == "blue":
    print("Cool like the ocean!")
else:
    print("Nice choice — " + color + " rocks.")
`
},
{
  unit: "3 · Making choices",
  title: "GAME: Guess the Number 🎲",
  intro: `
    <p>Now you know enough to build a REAL game! The computer picks a secret number and
    you keep guessing until you get it. We need two new ideas:</p>
    <p><b>1. Random numbers:</b></p>
    <pre>import random
secret = random.randint(1, 20)   # secret number 1 to 20</pre>
    <p><b>2. A <code>while</code> loop</b> — it repeats as long as something is true
    (here: until you guess right):</p>
    <pre>guess = 0
while guess != secret:
    guess = int(input("Guess (1-20): "))
    if guess &lt; secret:
        print("Too low!")
    elif guess &gt; secret:
        print("Too high!")
print("You got it! 🎉")</pre>
    <p><code>!=</code> means "is not equal to".</p>`,
  task: `<p>Run the game and play it! Then make it your own: change the range to
    <code>1, 100</code>, or change the messages to be funnier.</p>`,
  levelUp: `<p>Count how many guesses it took. Add a <code>tries = 0</code> before the
    loop, do <code>tries = tries + 1</code> inside the loop, and print
    <code>tries</code> at the end.</p>`,
  starter:
`import random
secret = random.randint(1, 20)

guess = 0
while guess != secret:
    guess = int(input("Guess a number 1-20: "))
    if guess < secret:
        print("Too low!")
    elif guess > secret:
        print("Too high!")

print("You got it!")
`,
  solution:
`import random
secret = random.randint(1, 100)

tries = 0
guess = 0
while guess != secret:
    guess = int(input("Guess 1-100: "))
    tries = tries + 1
    if guess < secret:
        print("Too low! Try higher.")
    elif guess > secret:
        print("Too high! Try lower.")

print("You got it in", tries, "guesses! 🎉")
`
},

/* ===================== UNIT 4 ===================== */
{
  unit: "4 · Make your own commands",
  title: "Build your own block (functions)",
  intro: `
    <p>Remember making your own custom blocks in Scratch? In Python those are called
    <b>functions</b>. You teach Python a new command once, then use it as many times
    as you want.</p>
    <pre>import turtle

def square():            # teach a new command called square
    for i in range(4):
        turtle.forward(80)
        turtle.right(90)

square()                 # now USE it
turtle.forward(100)
square()                 # use it again!</pre>
    <p><code>def</code> means "define" (make a new command). Everything indented under
    it belongs to the function. Nothing happens until you "call" it by writing its
    name with <code>()</code>.</p>`,
  task: `<p>Write a function called <code>triangle()</code> that draws a triangle. Then
    call it 2 or 3 times with some moves in between to scatter triangles around.</p>`,
  levelUp: `<p>Make a <code>flower()</code> function: draw a small shape, turn a little,
    and repeat — or just call <code>square()</code> 8 times turning 45° between each.
    A flower made of squares!</p>`,
  starter:
`import turtle

def square():
    for i in range(4):
        turtle.forward(80)
        turtle.right(90)

square()
`,
  solution:
`import turtle

def square():
    for i in range(4):
        turtle.forward(80)
        turtle.right(90)

# Spin a square around to make a flower
turtle.pencolor("magenta")
for i in range(8):
    square()
    turtle.right(45)
`
},
{
  unit: "4 · Make your own commands",
  title: "Commands that take a number",
  intro: `
    <p>Functions get way more powerful when you give them <b>inputs</b> (called
    "parameters"). Look — one function that can draw ANY shape:</p>
    <pre>import turtle

def shape(sides, size):
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

shape(3, 100)   # triangle
shape(5, 100)   # pentagon
shape(8, 60)    # octagon</pre>
    <p>The same code draws a triangle, a pentagon, or an octagon just by changing the
    number you hand it. The math <code>360 / sides</code> figures out the turn for you.</p>`,
  task: `<p>Call <code>shape(...)</code> a few times with different numbers to make a
    pile of different shapes. Move or change color between them.</p>`,
  levelUp: `<p>Add a <code>color</code> parameter:
    <code>def shape(sides, size, color):</code> and set
    <code>turtle.pencolor(color)</code> inside. Then call
    <code>shape(6, 80, "blue")</code>.</p>`,
  starter:
`import turtle

def shape(sides, size):
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

shape(3, 100)
`,
  solution:
`import turtle

def shape(sides, size, color):
    turtle.pencolor(color)
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

turtle.bgcolor("black")
shape(3, 80, "red")
shape(5, 100, "yellow")
shape(8, 60, "cyan")
shape(12, 120, "magenta")
`
},

/* ===================== UNIT 5 ===================== */
{
  unit: "5 · Build something big",
  title: "CAPSTONE: Your own creation 🏆",
  intro: `
    <p>You now know <b>print, variables, math, loops, if/else, input, while, and
    functions</b> — that is real programming! Time to build your own thing.</p>
    <p>Pick ONE (or invent your own):</p>
    <p><b>🐢 Turtle masterpiece</b> — Use functions and loops to draw a scene: a house,
    a robot, a galaxy of stars, your name in shapes.</p>
    <p><b>🗺️ Text adventure</b> — Use <code>input</code> and <code>if</code> to make a
    choose-your-path story. Here is a starting skeleton in the editor.</p>
    <p><b>🎲 Better game</b> — Take your Guess the Number game and add levels, score,
    or a "play again?" question.</p>`,
  task: `<p>Build your project! There is no single right answer. Use the
    <b>💡 Peek</b> button if you want ideas, and ask a grown-up or Claude when you get
    stuck. When you are proud of it — show someone! 🎉</p>`,
  levelUp: `<p>Add ONE thing that surprises the player: a random event, a secret
    password, a hidden room, or a drawing that changes based on their answers.</p>`,
  starter:
`# A choose-your-own-adventure starter. Make it yours!
print("You wake up in a mysterious forest. 🌲")
door = input("Do you go LEFT or RIGHT? ")

if door == "left":
    print("You find a friendly dragon who shares snacks. 🐉")
    snack = input("Do you eat the snack? (yes/no) ")
    if snack == "yes":
        print("Yum! You gain super speed and escape. You win! 🏆")
    else:
        print("You stay polite and the dragon walks you home. Nice! 🏡")
else:
    print("You fall into a pit of... pillows. Comfy but stuck. Try again!")
`,
  solution:
`# Example: turtle scene + a little story. Mix and match!
import turtle, random

def star(size):
    for i in range(5):
        turtle.forward(size)
        turtle.right(144)

turtle.bgcolor("black")
turtle.pensize(2)

colors = ["white","yellow","cyan","magenta","orange"]
for i in range(12):
    turtle.penup()
    turtle.goto(random.randint(-220, 220), random.randint(-220, 220))
    turtle.pendown()
    turtle.pencolor(colors[i % 5])
    star(random.randint(20, 60))

turtle.hideturtle()
print("A galaxy of", 12, "stars! Try changing the numbers.")
`
},

/* ===================== FREE PLAY ===================== */
{
  unit: "🎨 Free play",
  title: "Blank canvas — make anything!",
  intro: `
    <p>No lesson here — just a blank page to play, experiment, and build whatever you
    dream up. Everything you learned still works.</p>
    <p>Quick reminders:</p>
    <pre>import turtle
turtle.forward(100)        turtle.right(90)
turtle.pencolor("blue")    turtle.pensize(5)
turtle.bgcolor("black")    turtle.penup() / pendown()
turtle.goto(0, 0)          turtle.circle(50)

print("words")            name = input("question ")
for i in range(10): ...    if x == 1: ...
def myblock(): ...</pre>`,
  task: `<p>Go wild. 🚀 Save your favorite creations by copying the code into a note so
    you can come back to them.</p>`,
  levelUp: null,
  starter:
`import turtle

# Your playground. Try anything!
turtle.pensize(3)
turtle.bgcolor("midnightblue")

for i in range(36):
    turtle.pencolor("gold")
    turtle.circle(80)
    turtle.right(10)
`,
  solution:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)
for i in range(200):
    turtle.pencolor(["red","orange","yellow","green","blue","purple"][i % 6])
    turtle.forward(i)
    turtle.left(59)
`
}

];
