# CS 260 Notes

[My startup - Audit App](url)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## GITHUB

I refreshed my memory of Git commands and their purposes. I also refamiliarized myself with Visual Studio Code, and how to use Git commands through Source Control.

## AWS

My IP address is: 18.211.42.4
in order to ssh and use my key use ~/.ssh/production.pem
to deploy to my server use ./deployService.sh -k ~/.ssh/production.pem -h auditapp.click -s startup


## Caddy

followed all the instructions. It worked perfectly.

## HTML

I structured out everything, but used an AI helper to quickly create my different fields i needed. It was almost instantaneous, I just had to change a few different areas of the code to fit my needs. I had trouble with getting the simon subdomain working.

## CSS

I enjoyed writing the css styling for my application. I made a basic scaffolding, and then asked AI for specific help to implement my ideas. think my end result looks really functional, but I'm excited to start using react and get a little more out of my webapp.

## React Part 1: Routing

Had to update class to className in my html. React components were easy to figure out. Hard to debug because of how precise you have to be.

## React Part 2: Reactivity

I'm excited to actually implement these technologies that will help my startup actually work well. It was fun to make a popup that does the websocket messages.

## SERVICE

node service/index.js for testing backend

npm run dev for testing frontend
 

## Web Development & JavaScript Notes Guide
1. In the following code, what does the <link> element do?

It connects an external resource (usually a CSS file) to the HTML document.
Example:

<link rel="stylesheet" href="styles.css">

2. In the following code, what does a <div> tag do?

It defines a generic container used to group content for styling or scripting.

3. In the following code, what is the difference between the #title and .grid selector?

#title selects an element by its ID (unique).
.grid selects elements by their class (can apply to many).

#title { color: blue; }
.grid { display: grid; }

4. In the following code, what is the difference between padding and margin?

Padding: Space inside the element’s border.

Margin: Space outside the element’s border (between elements).

5. Given this HTML and CSS, how will the images be displayed using flex?

With display: flex, images will appear in a horizontal row by default.

6. What does the following padding CSS do?
div { padding: 20px 10px; }


Adds 20px of padding on the top and bottom, and 10px on the left and right.

7. What does the following code using arrow syntax function declaration do?
const add = (a, b) => a + b;


Defines a concise function that returns the sum of a and b.

8. What does the following code using .map() with an array output?
[1, 2, 3].map(x => x * 2);
// Output: [2, 4, 6]

9. What does the following code output using getElementById and addEventListener?
document.getElementById("btn").addEventListener("click", () => {
  console.log("Clicked!");
});


When the element with ID “btn” is clicked, it logs "Clicked!" to the console.

10. What does the following line of JavaScript do using a # selector?
document.querySelector("#title");


Selects the HTML element with id="title".

11. Which of the following are true about the DOM?

The DOM represents the structure of an HTML document as objects.

It allows JavaScript to access and modify HTML and CSS.

It updates dynamically when changes occur in the page.

12. By default, the HTML <span> element has a default CSS display property value of:

inline

13. How would you use CSS to change all <div> elements to have a background color of red?
div { background-color: red; }

14. How would you display an image with a hyperlink in HTML?
<a href="https://example.com">
  <img src="photo.jpg" alt="Example image">
</a>

15. In the CSS box model, what is the ordering of the box layers (inside to outside)?

Content → Padding → Border → Margin

16. Given the following HTML, what CSS would you use to set the text “trouble” to green and leave “double” unaffected?
<p><span class="green">trouble</span>double</p>

.green { color: green; }

17. What will the following code output when executed using a for loop and console.log?
for (let i = 0; i < 3; i++) {
  console.log(i);
}
// Output: 0, 1, 2

18. How would you use JavaScript to select an element with the id of “byu” and change the text color to green?
document.getElementById("byu").style.color = "green";

19. What is the opening HTML tag for a paragraph, ordered list, unordered list, and headings?

Paragraph → <p>

Ordered list → <ol>

Unordered list → <ul>

First-level heading → <h1>

Second-level heading → <h2>

Third-level heading → <h3>

20. How do you declare the document type to be HTML?
<!DOCTYPE html>

21. What is valid JavaScript syntax for if, else, for, while, and switch statements?
if (x > 0) { ... }
else { ... }

for (let i = 0; i < 5; i++) { ... }

while (condition) { ... }

switch(value) {
  case 1: break;
  default: break;
}

22. What is the correct syntax for creating a JavaScript object?
const person = { name: "Alice", age: 25 };

23. Is it possible to add new properties to JavaScript objects?

Yes ✅

person.city = "Provo";

24. If you want to include JavaScript on an HTML page, which tag do you use?
<script src="script.js"></script>

25. Given the following HTML, what JavaScript could you use to set the text “animal” to “crow” and leave “fish” unaffected?
<p id="animal">fish</p>

document.getElementById("animal").textContent = "crow";

26. Which of the following correctly describes JSON?

JSON = JavaScript Object Notation

Used for data storage and transfer

Uses key-value pairs
Example:

{ "name": "Hayden", "age": 21 }

27. What does each console command do?

chmod → change file permissions

pwd → print working directory

cd → change directory

ls → list files

vim / nano → text editors

mkdir → make a new directory

mv → move or rename file

rm → remove file

man → view manual/help

ssh → open remote shell

ps → show running processes

wget → download from web

sudo → run as superuser

28. Which console command creates a remote shell session?

ssh

29. Which of the following is true when the -la parameter is specified for the ls command?

It lists all files including hidden ones and shows detailed information (permissions, size, owner, etc.).

30. For the domain name banana.fruit.bozo.click, which parts are which?

Top-level domain → .click

Root domain → bozo.click

Subdomain → banana.fruit

31. Is a web certificate necessary to use HTTPS?

Yes ✅

32. Can a DNS A record point to an IP address or another A record?

It can point to an IP address ✅

It cannot point to another A record ❌ (use a CNAME for that)

33. Port 443, 80, and 22 are reserved for which protocols?

443 → HTTPS

80 → HTTP

22 → SSH

34. What will the following code using Promises output when executed?

Promise.resolve("done").then(v => console.log(v));
// Output: done


Or:

new Promise(r => setTimeout(() => r("hi"), 1000)).then(console.log);
// Output after 1 second: hi
