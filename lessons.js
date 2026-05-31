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

{
  unit: "1 · Tell the computer what to do",
  title: "Put it together: All About Me card",
  intro: `
    <p>You learned three big things: <b>print</b>, <b>variables</b> (boxes), and
    <b>math</b>. Let's use all three at once to make an "All About Me" card!</p>
    <pre>name = "Sam"
age = 10
days_old = age * 365
print("Name: " + name)
print("Age: " + str(age) + " (about " + str(days_old) + " days!)")</pre>
    <p>Boxes hold your facts, math figures things out, and print shows it off.</p>`,
  task: `<p>Make boxes for your <code>name</code>, <code>age</code>, and one
    <code>favorite</code> thing. Use a little <b>math</b> on a box (like your age in
    days), then <b>print</b> a neat card that uses all your boxes.</p>`,
  levelUp: `<p>Add your age in <b>dog years</b> (<code>age * 7</code>), or how many
    days until you turn 100 (<code>(100 - age) * 365</code>).</p>`,
  starter:
`name = "Sam"
age = 10
favorite = "pizza"

# Use your boxes and some math to print an "All About Me" card!
print(name)
`,
  solution:
`name = "Sam"
age = 10
favorite = "pizza"

days_old = age * 365
dog_years = age * 7

print("=== All About Me ===")
print("Name: " + name)
print("Age: " + str(age) + " (about " + str(days_old) + " days!)")
print("Favorite thing: " + favorite)
print("In dog years I'm " + str(dog_years) + "!")
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

{
  unit: "2 · Meet the turtle 🐢",
  title: "Put it together: Turtle scene",
  intro: `
    <p>You can move the turtle, <b>loop</b>, and use <b>color</b>. Let's combine them
    into a picture — like a flower made of shapes!</p>
    <pre>import turtle
colors = ["red", "orange", "yellow", "green", "blue", "purple"]
for i in range(6):
    turtle.pencolor(colors[i])
    # draw a petal, then turn a little</pre>
    <p>The trick: draw one shape (a "petal"), turn a little, and repeat with a loop.</p>`,
  task: `<p>Draw a <b>flower</b> (or any scene) using a <code>for</code> loop, the
    turtle, and a list of <b>colors</b>. Draw a shape, turn a bit, and let the loop
    repeat it all the way around.</p>`,
  levelUp: `<p>Add a <code>bgcolor</code> and draw a SECOND flower somewhere else.
    Hint: <code>penup()</code>, <code>goto(x, y)</code>, <code>pendown()</code> to
    move without drawing.</p>`,
  starter:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)

colors = ["red", "orange", "yellow", "green", "blue", "purple"]
for i in range(6):
    turtle.pencolor(colors[i])
    # draw one petal (a shape), then turn a little
`,
  solution:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)

colors = ["red", "orange", "yellow", "green", "blue", "purple"]
for i in range(12):
    turtle.pencolor(colors[i % 6])
    for side in range(4):       # a square petal
        turtle.forward(80)
        turtle.right(90)
    turtle.right(30)            # turn before the next petal
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

{
  unit: "4 · Make your own commands",
  title: "Put it together: Stamp art",
  intro: `
    <p>Now you can build your own <b>functions</b> that take numbers. Let's use one
    to "stamp" a shape over and over and make art!</p>
    <pre>def shape(sides, size, color):
    turtle.pencolor(color)
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

shape(5, 60, "magenta")</pre>
    <p>Write the command once, then call it as many times as you like.</p>`,
  task: `<p>Write a <code>shape(...)</code> function that draws a shape, then
    <b>call it several times</b> with different sizes and colors to build a picture
    or pattern.</p>`,
  levelUp: `<p>Use a <code>for</code> loop to call your function many times, growing
    the size or changing the color each time, for a cool spiral of shapes.</p>`,
  starter:
`import turtle

def shape(sides, size, color):
    turtle.pencolor(color)
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

# Call shape(...) a few times to make art!
shape(5, 60, "magenta")
`,
  solution:
`import turtle
turtle.bgcolor("black")
turtle.pensize(2)

def shape(sides, size, color):
    turtle.pencolor(color)
    angle = 360 / sides
    for i in range(sides):
        turtle.forward(size)
        turtle.right(angle)

colors = ["red", "yellow", "cyan", "magenta", "lime"]
for i in range(10):
    shape(5, 20 + i * 12, colors[i % 5])
    turtle.right(36)
`
},

/* ===================== UNIT 5 (Lists & data) ===================== */
{
  unit: "5 · Lists & data 📊",
  title: "Make a list 📝",
  intro: `
    <p>So far each box held ONE thing. A <b>list</b> is a box that holds <b>many</b>
    things, in order. You make one with square brackets <code>[ ]</code> and commas:</p>
    <pre>fruits = ["apple", "banana", "cherry"]
print(fruits)
print(fruits[0])     # the FIRST one (counting starts at 0!): apple
print(len(fruits))   # how many are in the list: 3</pre>
    <p>Counting starts at <b>0</b>, so <code>fruits[0]</code> is the first item and
    <code>fruits[1]</code> is the second. Add a new item to the end with
    <code>.append()</code>:</p>
    <pre>fruits.append("kiwi")   # now the list has 4 things</pre>`,
  task: `<p>Make a list of 3 or more of your <b>favorite things</b>. Print the whole
    list, then print just the <b>first</b> one with <code>[0]</code>. Then
    <code>.append()</code> one more and print how many you have with
    <code>len(...)</code>.</p>`,
  levelUp: `<p>Print the <b>last</b> item using <code>favorites[-1]</code> — a
    negative number counts from the end!</p>`,
  starter:
`favorites = ["pizza", "legos", "soccer"]

print(favorites)
print(favorites[0])
`,
  solution:
`favorites = ["pizza", "legos", "soccer"]

print("My favorites:", favorites)
print("Number one:", favorites[0])

favorites.append("ice cream")
print("Now I have", len(favorites), "favorites!")
print("Last one:", favorites[-1])
`
},
{
  unit: "5 · Lists & data 📊",
  title: "Loop through a list 🔁",
  intro: `
    <p>The best part of lists: you can do something with <b>every</b> item using a
    <code>for</code> loop. This is the "for each" loop:</p>
    <pre>animals = ["cat", "dog", "fish"]
for a in animals:
    print("I like the " + a)</pre>
    <p>Each time around, <code>a</code> becomes the next item in the list. No counting
    needed! It works great with the turtle too — a list of colors, one shape each:</p>
    <pre>import turtle
colors = ["red", "green", "blue"]
for c in colors:
    turtle.pencolor(c)
    turtle.forward(100)
    turtle.right(120)</pre>`,
  task: `<p>Make a list, then use a <code>for</code> loop to print each item on its
    own line.</p>`,
  levelUp: `<p>Make a list of <b>colors</b> and loop through it to draw one line (or
    shape) in each color with the turtle.</p>`,
  starter:
`animals = ["cat", "dog", "fish", "frog"]

for a in animals:
    print(a)
`,
  solution:
`import turtle
turtle.pensize(5)

colors = ["red", "orange", "yellow", "green", "blue", "purple"]
for c in colors:
    turtle.pencolor(c)
    turtle.forward(120)
    turtle.right(60)
`
},
{
  unit: "5 · Lists & data 📊",
  title: "Put it together: Number chart 📊",
  intro: `
    <p>Lists can hold <b>numbers</b> too — and numbers can become a <b>chart</b>!
    Let's loop through a list of numbers and draw a bar for each one: a bigger number
    makes a taller bar. This uses <b>lists + loops + a function + the turtle</b> all
    at once.</p>
    <pre>scores = [40, 90, 60, 120]
for height in scores:
    # draw a bar this tall, then move over</pre>
    <p>A <code>bar(height)</code> function keeps the drawing tidy — write it once, call
    it for every number.</p>`,
  task: `<p>Make a list of <b>numbers</b>, then draw a simple <b>bar chart</b> — one bar
    per number, where the number is how tall the bar is. Use a <code>bar(...)</code>
    function and a <code>for</code> loop.</p>`,
  levelUp: `<p>Give each bar a different <b>color</b> from a color list as you loop.</p>`,
  starter:
`import turtle
turtle.pensize(3)

scores = [40, 90, 60, 120, 70]

def bar(height):
    turtle.left(90); turtle.forward(height)     # up
    turtle.right(90); turtle.forward(40)         # across the top
    turtle.right(90); turtle.forward(height)     # back down
    turtle.left(90)                              # ready for the next bar

turtle.penup(); turtle.goto(-160, -80); turtle.pendown()
for h in scores:
    bar(h)
`,
  solution:
`import turtle
turtle.bgcolor("black")
turtle.pensize(3)

scores = [40, 90, 60, 120, 70]
colors = ["red", "orange", "yellow", "green", "cyan"]

def bar(height, color):
    turtle.pencolor(color)
    turtle.left(90); turtle.forward(height)
    turtle.right(90); turtle.forward(40)
    turtle.right(90); turtle.forward(height)
    turtle.left(90)

turtle.penup(); turtle.goto(-160, -80); turtle.pendown()
for i in range(len(scores)):
    bar(scores[i], colors[i % len(colors)])
`
},

/* ===================== UNIT 6 ===================== */
{
  unit: "6 · Build something big",
  title: "CAPSTONE: Your own creation 🏆",
  intro: `
    <p>You now know <b>print, variables, math, loops, if/else, input, while,
    functions, and lists</b> — that is real programming! Time to build your own thing.</p>
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

/* ============================================================
   PER-LESSON CHECKLISTS
   Short, tickable steps so a learner can track what they've done
   within a lesson. Index-aligned with LESSONS above. ⭐ = the
   optional level-up step. Empty array = no checklist (free play).
   ============================================================ */
const LESSON_STEPS = [
  ["Print your name", "Print your age", "Print your favorite food", "⭐ Print a little picture made of symbols"],
  ["Make a name box and an age box", "Print one sentence that uses BOTH boxes", "⭐ Print how many years until you're 16"],
  ["Print how much candy each friend gets", "⭐ Print the leftover candy with %"],
  ["Make name, age, and favorite boxes", "Use math on a box (like age * 365)", "Print a card using all your boxes", "⭐ Add dog years or days-until-birthday"],
  ["Draw a big letter L", "Draw another straight-line letter (T, E, F, H, I)", "⭐ Draw a triangle"],
  ["Draw the square with a for loop", "Change it into a hexagon (6 sides)", "⭐ Draw a 5-pointed star"],
  ["Draw a shape with a thick, colored pen", "Change the color on different sides", "⭐ Use a list of colors in the loop"],
  ["Run the spiral and watch it", "Try different turn numbers (89, 120, 144)", "⭐ Make a rainbow spiral with a color list"],
  ["Use a for loop to repeat a shape", "Change the pen color as you go", "Turn a little each time to make a flower", "⭐ Add a background color and a second flower"],
  ["Ask a question with input()", "Respond differently with if and else", "⭐ Add a third answer with elif"],
  ["Play the guessing game", "Make it yours (change the range or messages)", "⭐ Count how many guesses it took"],
  ["Write your own function with def", "Call it a few times around the canvas", "⭐ Make a flower using a function"],
  ["Call shape() with different numbers of sides", "Move or change color between shapes", "⭐ Add a color to shape()"],
  ["Write a function that draws a shape", "Call it a few times with different numbers", "Use color and size to make it cool", "⭐ Loop your function for a big pattern"],
  ["Make a list with [ ]", "Print the whole list", "Print just the first item with [0]", "Add one with .append() and print len()", "⭐ Print the last item with [-1]"],
  ["Make a list", "Loop through it with for ... in ...", "Do something with each item", "⭐ Use a color list to draw with the turtle"],
  ["Make a list of numbers", "Write a bar() function that draws one bar", "Loop the numbers, drawing a bar for each", "⭐ Give each bar its own color"],
  ["Pick your project (art, story, or game)", "Build it!", "⭐ Add one surprise (random event, secret, hidden room)"],
  [],
];
