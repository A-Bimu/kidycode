# Reference lesson 2 - CSS Flexbox

Original KidyCode material. Written for V3 from the blueprint in
`docs/v3/lesson-blueprint.md`. Nothing here is copied from Code Club, Code.org, freeCodeCamp,
Scratch or The Odin Project; see `docs/v3/research-matrix.md` for why.

This is the CSS proof of the presenter. It is rank 4 in the audit's risk ranking
(`docs/v3/curriculum-audit.md`), because the property belongs on the parent and the axis is
invisible until it is wrong.

## Which existing lessons this script serves

- ages 10 to 12: `css-layout-flex` (`lib/course.ts:413`), task "Make nav a flex container with a
  1rem gap", checks `nav { display: flex }` and `nav { gap: 1rem }`.
- ages 13 to 15, 16 to 18, adults: the pathway lesson `flex` (`lib/pathway-course.ts:286`),
  becoming `ages-13-15-responsive-flex`, `ages-16-18-responsive-flex` and
  `adults-responsive-flex`, task "Make nav a wrapping flex row with a 1rem gap and centred
  alignment".

Both tasks and both sets of checks come from the `Lesson`; this document only supplies framing.

## Script record

```json
{
  "lessonId": "ages-13-15-responsive-flex",
  "courseIds": ["ages-13-15", "ages-16-18", "adults"],
  "companionLessonIds": {
    "ages-10-12": "css-layout-flex"
  },
  "concept": "Flexbox is a decision made on the parent element that arranges its children along one direction.",
  "make": "The learner turns the row of navigation links on their own website into a wrapping, evenly spaced flex row.",
  "difficulty": 3,
  "prerequisites": ["ages-13-15-structure-headings", "ages-13-15-structure-links"],
  "projectStep": "The project's navigation stops being a run of links on one line and becomes a flex row that wraps on a narrow screen.",
  "stages": {
    "hook": "Three navigation links, cramped against the left edge with no space between them, and the same three links pushed off the right of a narrow preview. Ask what single change could fix spacing and wrapping together.",
    "model": "nav { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; } with each declaration named: the parent becomes a flex container, children may move to a new line, there is a fixed space between them, and they line up on the cross axis.",
    "build": "The learner edits the CSS file only, one declaration at a time, running the preview after each.",
    "check": "The learner compares each change with their prediction: did the space appear between the links, and did they wrap when the preview narrowed?",
    "explain": "A fresh row of three cards, arranged with a different gap and a different alignment.",
    "transfer": "The layout rules for the project's navigation row are the same rules the learner will reuse for the card row in the next module."
  },
  "mastery": {
    "freshTask": "Arrange a row of three tag buttons on a recipe page: spaced apart, allowed to wrap, and lined up in the middle of the row.",
    "observable": "Narrowing the preview moves the third button onto a second line, and widening it puts all three back in one centred row.",
    "reflection": "Which element received display: flex, and why would putting it on each link instead not work?"
  }
}
```

## Conceptual model

Flexbox is not a way to space things out. It is a change you make to a **parent**: "you are now
a flex container, and you arrange your own children". That is why the rule goes on `nav` or
`.cards` and never on each link. Once the parent is a flex container, the children are flex
items and three further decisions become available:

1. `flex-wrap: wrap` lets items move onto a new line instead of overflowing.
2. `gap` is the space between items. It is a property of the container, not a margin on the
   items, so it cannot collapse or double up.
3. `align-items` places items across the other direction, which is why it needs the direction to
   be understood first.

The single idea: **choose the parent, then arrange its children along one direction.**

## Worked example

```css
nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
```

Applied to `<nav><a>One</a><a>Two</a><a>Three</a></nav>`: the three links sit in one row with a
1rem space between each pair, they move to a second line if the preview is too narrow, and they
sit on the vertical centre of that line. Remove `display: flex` and the three declarations below
it do nothing, which is the point worth making out loud.

## Common wrong answers

| What the learner writes | Why it looks right and is not | How to tell them, and how it is detected |
|-------------------------|-------------------------------|------------------------------------------|
| `a { display: flex; }` on each link | The preview changes a little, so it looks like progress | "Flexbox arranges a parent's children. Put it on the parent, then the children arrange themselves." Detection gap: the check matches `nav\s*\{[\s\S]*display\s*:\s*flex` (`lib/pathway-course.ts:286`), so a rule that happens to contain `nav` and `display: flex` can pass even if the parent never became a container. The mastery step asks the learner which element received it |
| `gap` added but no `display: flex` | The file reads as if the spacing were set | "Gap only works once the parent is a flex container." Detection: the same check requires `display: flex` before the gap, but the pattern is permissive |
| Spacing written as `margin-right: 1rem` on every link | It looks the same and works | "That is spacing by hand. It puts an extra gap after the last item and does not survive wrapping." Detection: the check looks for `gap`, so margins do not pass |
| `display: flex` written but no `flex-wrap` | One line looks tidy, so nothing seems wrong | "Without wrapping, everything stays on one line and runs off the screen." Detection: the pathway check requires `flex-wrap\s*:\s*wrap` (`lib/pathway-course.ts:286`) |
| `align-items` used to try to space the items along the row | It centres or stretches them instead | "Alignment across the row is `justify-content`. `align-items` works the other way." Detection: the check only requires `align-items\s*:\s*center`, so a learner who never learns the difference still passes. The mastery step contrasts the two directions |
| The rule written on the wrong selector with the same name, such as `nav a` | It is close enough to read as correct | "That is the children again." Detection: nothing distinguishes `nav` from `nav a` in the pattern |

## Hints

Pathway lesson `flex` (`lib/pathway-course.ts:286`):

1. **Nudge.** "Style the nav parent, not each link first."
2. **Locate.** "Use display:flex and flex-wrap:wrap."
3. **Worked partial.** "Add gap:1rem and align-items:center."

ages 10 to 12 lesson `css-layout-flex` (`lib/course.ts:413`):

1. **Nudge.** "The parent is nav."
2. **Locate.** "Use display: flex first."
3. **Worked partial.** "Add gap in the same rule."

Pacing: guided offers hint 1 after the first failed check, balanced on request, independent after
two failed checks. Hint 1 exists specifically because choosing the wrong element is the commonest
error here.

## Independent challenge

The fresh task, with no example open and different content:

> A recipe page has three tag buttons in a row. Arrange them so they are spaced apart, allowed to
> wrap onto a second line, and lined up in the middle of the row.

Success is judged by behaviour: the learner narrows the preview, watches the third button move to
a second line, widens it again and sees all three return to one centred row.

## Evidence of mastery

1. The lesson's own checks pass (`lib/pathway-course.ts:286`): `display: flex`, `flex-wrap: wrap`,
   `gap: 1rem` and `align-items: center` on the navigation rule; or, for ages 10 to 12, the
   simpler `display: flex` and `gap: 1rem` (`lib/course.ts:413`).
2. The lesson question is answered and its explanation read. The pathway question asks when
   Flexbox is a good choice, and its correct answer is "For a row or column whose items need
   alignment and gaps" (`lib/pathway-course.ts:286`). The ages 10 to 12 question asks where
   `display: flex` belongs, and its correct answer is "on the parent of the items"
   (`lib/course.ts:413`).
3. The learner answers, unprompted, which element received `display: flex` and why putting it on
   each link would not work.

## How the central website progresses

The project already has a `nav` inside the header, added in the structure module. Where the ages
10 to 12 project had no layout rule, and the pathway project had links stacked or running
together, after this lesson the project's navigation is a real flex row that wraps. The next
pathway module reuses the identical pattern for the card row, so the learner meets `display:
flex` as a decision they already understand rather than a new trick. One deliberate consequence:
the audit flagged that Flexbox axis behaviour is never verified by the automatic checks, so this
lesson depends on the visible prediction step rather than on the check alone.

## Age variants

| Register | Lesson id | Lead line | Framing |
|----------|-----------|-----------|---------|
| 10 to 12 | `css-layout-flex` | "Your links will sit in a row with even space between them." | guided: `gap` only, no wrapping or alignment yet, one declaration at a time |
| 13 to 15 | `ages-13-15-responsive-flex` | "A row of links that wraps is the difference between a usable page and one that scrolls sideways on a phone." | balanced: full set of declarations, the learner chooses the values |
| 16 to 18 | `ages-16-18-responsive-flex` | "Given a row that overflows at 320px, name the property that fixes it and the one that only appears to." | independent: the learner diagnoses `margin` against `gap` themselves |
| Adults | `adults-responsive-flex` | "This is the pattern every real site's navigation uses. Get it right once and you reuse it everywhere." | balanced, adult tones: names the reuse, mentions that `gap` replaced margin hacks |
