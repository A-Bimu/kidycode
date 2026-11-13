# Reference lesson 1 - HTML heading hierarchy

Original KidyCode material. Written for V3 from the blueprint in
`docs/v3/lesson-blueprint.md`. Nothing here is copied from Code Club, Code.org, freeCodeCamp,
Scratch or The Odin Project; see `docs/v3/research-matrix.md` for why.

This is the **simple short lesson** used as the first proof of the presenter.

## Which existing lessons this script serves

The heading hierarchy with one `h1`, two `h2` headings and one `h3` is the pathway lesson
`headings` (`lib/pathway-course.ts:256`), which becomes one id per course:
`ages-13-15-structure-headings`, `ages-16-18-structure-headings` and
`adults-structure-headings`. The ages 10 to 12 module teaches headings at a gentler level as
`html-foundations-text` (`lib/course.ts:380`), whose own task is one `h2` plus a paragraph. The
script below drives the pathway lesson and supplies the guided variant for the 10 to 12 lesson;
in every case the task and the checks come from the `Lesson` itself, never from this document.

## Script record

```json
{
  "lessonId": "ages-13-15-structure-headings",
  "courseIds": ["ages-13-15", "ages-16-18", "adults"],
  "companionLessonIds": {
    "ages-10-12": "html-foundations-text"
  },
  "concept": "A heading level states how important a piece of text is, and the levels must form one outline.",
  "make": "The learner turns their own page's plain lines into a real heading outline.",
  "difficulty": 1,
  "prerequisites": [],
  "projectStep": "The website's name becomes the page heading and the three project items become its sections.",
  "stages": {
    "hook": "Two pages, one set of words. Show the same three lines twice: once as three paragraphs, once as one big title and two section titles. Ask which page they could read in five seconds and why.",
    "model": "<h1>Study Planner</h1> then <h2>This week</h2> then <h3>Mathematics</h3>. Name the job of each line: the page, a section, a topic inside that section.",
    "build": "The learner edits their own page in the HTML file only.",
    "check": "Read the page, then read the outline again: only the headings, in order. If that short outline explains the page, the hierarchy works.",
    "explain": "A fresh notice with three parts, marked up with no example open.",
    "transfer": "The same headings become the sections of the learner's own website, and the next lesson links to them."
  },
  "mastery": {
    "freshTask": "Mark up a three-part lost-and-found notice: a title, a section for where to look, and a sub-section for what to do if you find an item.",
    "observable": "Reading only the headings in order tells the whole story of the notice.",
    "reflection": "In your own words, what did the h1 do that the h2 headings could not do?"
  }
}
```

## Conceptual model

A webpage is read in two ways. A visitor reads the words; a browser, a search engine and a screen
reader read the structure. A heading is not a way to make text big. It is a statement that this
text is a title and the text under it belongs to that title. Because the levels build one
outline, the rule is not "how many headings do I like" but "what does this line do".

The single idea: **the heading tags describe a hierarchy, and the hierarchy is the page's
skeleton.** One `h1` names the page. `h2` names a section of it. `h3` names a part of that
section. Reading only the headings in order should tell you what the page is about, as a table of
contents.

## Worked example

```html
<h1>Study Planner</h1>
<section>
  <h2>This week</h2>
  <p>Three sessions before Friday.</p>
  <h3>Mathematics</h3>
  <p>Fractions and decimals.</p>
</section>
<section>
  <h2>Next week</h2>
  <p>Prepare the revision list.</p>
</section>
```

Read the headings alone: Study Planner, This week, Mathematics, Next week. That is a table of
contents, and it is correct. `Mathematics` sits inside `This week` because it is a part of that
section, which is why it is `h3` and not `h2`.

## Common wrong answers

| What the learner writes | Why it looks right and is not | How to tell them, and how it is detected |
|-------------------------|-------------------------------|------------------------------------------|
| Three `h1` headings, one per section | Each one looks important, and the page looks fine | "A page has one name. The other lines are sections of it." The lesson check requires exactly one `h1`: `test("html", "Has one main heading", "<h1[\\s>][\\s\\S]*</h1>")` (`lib/pathway-course.ts:256`) |
| `h1` then `h4`, skipping levels | The sizes still look like a big title and a small one | "Heading levels are not font sizes. Skipping one breaks the outline." Detection: the check requires two `h2` headings before the `h3`, so a skipped level fails it |
| `h3` before any `h2` | It renders, and it is smaller than the title | "A part of a section cannot come before the section." Detection: the same two-`h2` requirement (`lib/pathway-course.ts:256`) |
| Using `<b>` or a bigger `font-size` instead of a heading | It looks like a heading | "That changes how it looks, not what it is." Detection: nothing matches `b` or `font-size`, so the required headings are still missing |
| Extra `h2` headings for every small card | Feels tidy and ordered | "Headings describe the page's shape. Text inside a card is not a page section." Detection gap: the check only counts that two `h2` exist, so extra ones still pass. This is exactly why the mastery step has the learner read their own outline aloud |
| On the 10 to 12 lesson, an `h1` where the task asks for `h2` | The bigger heading looks better | "The task asks for a section heading, and the page already has its name." Detection: `html-foundations-text` requires `h2` around "About this page" and a paragraph after it (`lib/course.ts:380`) |

## Hints

Both lessons already supply three hints; the script reuses them and gives the presenter the
pacing rule per mode.

Pathway lesson `headings` (`lib/pathway-course.ts:256`):

1. **Nudge.** "Turn the page name into h1."
2. **Locate.** "Turn each section name into h2." A locate hint names the place to look, never the
   count to type.
3. **Worked partial.** "Use h3 only for the topic that belongs inside the second section."

Guided variant `html-foundations-text` (`lib/course.ts:380`):

1. **Nudge.** "Add the h2 before the paragraph."
2. **Locate.** "A paragraph uses p tags."
3. **Worked partial.** "Write <h2>About this page</h2>, then add your paragraph."

Pacing: guided offers hint 1 after the first failed check; balanced on request; independent after
two failed checks. Hint 3 never contains the finished answer for the fresh task, only the shape
of the worked example.

## Independent challenge

The fresh task, with no example open and different content:

> A community notice board has a lost-and-found notice. Write the page so it has a title, a
> section called "Where to look" and a sub-section called "If you find an item".

Success is judged by behaviour, not by clicks. The learner reads their own headings in order
aloud, and the order must explain the notice.

## Evidence of mastery

1. The lesson's own automatic checks pass (`lib/pathway-course.ts:256`): exactly one `h1`, two
   `h2` section headings, and one `h3` nested in the second section. For the guided variant,
   `lib/course.ts:380` requires the `h2` and the paragraph.
2. The lesson question is answered and its explanation read (`lib/pathway-course.ts:256`).
3. The learner answers, unprompted, what the `h1` does that the `h2` headings cannot. A correct
   answer says the `h1` names the whole page while the `h2` headings name its sections; an
   answer that only describes size is recorded as a review item.

## How the central website progresses

Before this lesson the learner's project page has a title and an introduction typed as plain
text. After it, their chosen site (Personal Portfolio, Community Event Hub or Small Business
Website for 13 to 15; Revision Planner, Opportunity Directory or Service Dashboard for 16 to 18)
has a real heading outline: the site name is the `h1` and the three project items become `h2`
sections. The next lesson, `links`, adds navigation that points at those sections, so the outline
this lesson creates is what the links reach.

## Age variants

| Register | Lesson id | Lead line | Framing |
|----------|-----------|-----------|---------|
| 10 to 12 | `html-foundations-text` | "Your page will show a section heading, and the sentence under it." | guided: result stated first, one requirement at a time, hint 1 after the first failed check |
| 13 to 15 | `ages-13-15-structure-headings` | "A page with a clear outline is easier to design and easier to read." | balanced: the learner picks the subject words, the structure is the lesson |
| 16 to 18 | `ages-16-18-structure-headings` | "Headings are the document outline. Assistive technology and search engines rely on it, so a broken outline is a real defect." | independent: expected result stated, the learner diagnoses a deliberately broken outline first |
| Adults | `adults-structure-headings` | "On a real site, a correct heading outline is what makes the page scannable and what lets screen readers move between sections." | balanced, adult tones: mentions the practical cost of skipping levels |
