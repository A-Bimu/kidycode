/*
 * Grading fixtures.
 *
 * One passing and one failing submission for every requirement check kind the content
 * uses. Each failing fixture is asserted to actually fail: a "wrong code" fixture that
 * is in fact correct would report the product as broken, so the suite proves the
 * negative case is negative before relying on it.
 */

export const SAFE_PROJECT = {
  html: `<!doctype html>
<html lang="en">
  <head>
    <title>The Origami Club</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <header>
      <h1>The Origami Club</h1>
      <nav><a href="#folds">Folds</a> <a href="#start">Start here</a></nav>
    </header>
    <main>
      <section id="folds">
        <h2>Folds</h2>
        <img src="crane.webp" alt="A finished paper crane on a table">
        <ul>
          <li>Valley fold</li>
          <li>Mountain fold</li>
          <li>Inside reverse fold</li>
        </ul>
      </section>
      <section id="start">
        <h2>Start here</h2>
        <form id="note-form">
          <label for="note">Your favourite fold</label>
          <input id="note" name="note" type="text" required>
          <button type="submit">Save</button>
        </form>
        <p id="status" role="status">Ready</p>
      </section>
    </main>
    <footer><p>Built by SkyFolder using HTML, CSS and JavaScript.</p></footer>
  </body>
</html>`,
  css: `:root { --ink: #111936; --paper: #f7f3ea; --space: 1rem; }
* { box-sizing: border-box; }
body { margin: 0; padding: 2rem; background: var(--paper); color: var(--ink); line-height: 1.6; font-size: 1rem; }
img { max-width: 100%; height: auto; }
.page { width: min(100% - 2rem, 70rem); }
nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: 1rem; }
.card { padding: 1rem; border: 2px solid var(--ink); margin-bottom: 1rem; }
button:hover { background: var(--highlight, #ee9d2b); }
button:focus-visible, a:focus-visible { outline: 3px solid #ee9d2b; outline-offset: 3px; }
@media (min-width: 700px) { .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }`,
  javascript: `const statusText = document.querySelector("#status");
const form = document.querySelector("#note-form");
const noteInput = document.querySelector("#note");

function describeCount(count) {
  return count > 0 ? "Folds available" : "No folds yet";
}

const folds = [
  { title: "Valley fold", available: true },
  { title: "Petals", available: false },
];

const available = folds.filter(function (fold) {
  return fold.available === true;
});

available.forEach(function (fold) {
  const item = document.createElement("li");
  item.textContent = fold.title;
  document.querySelector("#folds ul").append(item);
});

statusText.textContent = describeCount(available.length);

const saved = localStorage.getItem("project-note");
if (saved) {
  noteInput.value = saved;
  statusText.textContent = "Saved note restored";
}

form.addEventListener("submit", function (event) {
  event.preventDefault();
  const value = noteInput.value.trim();
  if (value === "") {
    statusText.textContent = "Enter a note first";
    return;
  }
  localStorage.setItem("project-note", value);
  statusText.textContent = "Saved";
});

let latestRequest = 0;
async function loadNotes() {
  const requestId = ++latestRequest;
  statusText.textContent = "Loading...";
  try {
    const response = await fetch("data:application/json,%5B%5D");
    if (!response.ok) throw new Error("Request failed");
    const data = await response.json();
    if (requestId !== latestRequest) return;
    statusText.textContent = data.length ? "Ready" : "No results";
  } catch (error) {
    statusText.textContent = "Could not load notes. Try again.";
  } finally {
    form.disabled = false;
  }
}

void loadNotes();`,
};

/* A submission that fails almost everything, used to prove the negative cases. */
export const WEAK_PROJECT = {
  html: `<div><h1>My page</h1><img src="photo.jpg"><p>Call me on 0712 345 678 or email me at learner@example.com</p></div>`,
  css: `body { color: red }
img { width: 2000px }`,
  javascript: `document.querySelector("#missing").innerHTML = "<b>Hi</b>";
var x = 1
x == "1";`,
};

export const UNSAFE_PROJECT = {
  html: `<main><h1>Test</h1></main>`,
  css: `body { color: #111936; }`,
  javascript: `const value = eval("1 + 1");
const build = new Function("return 1");
document.write("hello");
list.innerHTML = "<li>" + value + "</li>";`,
};

/* Project with an unverifiable requirement: the check deliberately cannot be decided
 * from the files, so the attempt must return Needs verification. */
export const PARTIAL_PROJECT = {
  html: `<main><h1>Test</h1><p>Nothing else yet.</p></main>`,
  css: `body { color: #111936; }`,
  javascript: `// no behaviour yet`,
};