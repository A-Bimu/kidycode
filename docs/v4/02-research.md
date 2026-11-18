# KidyCode V4 — Phase 1 research

What established learning products and child–computer-interaction research actually say, and what KidyCode should take
from it. Sources were read during this phase; nothing here is copied from a competitor's design, and no competitor's
layout, component or visual identity is reproduced.

## Sources read

| Source | What it establishes |
| --- | --- |
| [The Duolingo Handbook](https://handbook.duolingo.com/) | The move from a browsable "Tree" to a linear "Path"; "research shows that the most effective learning comes through experience, not a long list of instructions" |
| [Duolingo — the science behind the home screen redesign](https://blog.duolingo.com/new-duolingo-home-screen-design) | One obvious next step; lessons grouped into units with stated objectives; spaced repetition built into the path |
| [Duolingo — how lesson transparency helps learners](https://blog.duolingo.com/duolingo-difficult-exercises) | Telling learners a task *is hard* raised persistence: "if I make a mistake, I don't feel as bad, because you warned me"; value shown at level-up |
| [Apple — Behind the Design: Duolingo](https://developer.apple.com/news?id=jhkvppla) | Character animation as intrinsic reward; "we're not an education company, we're a fun and motivation company" |
| [Scratch — developers / design principles](https://scratch.mit.edu/developers) | Low floor and wide walls; **"Make it as Simple as Possible — And Maybe Even Simpler"**; design for tinkerability; many paths, many styles |
| [Resnick et al., *Scratch: Programming for Everyone*](https://web.media.mit.edu/~mres/scratch/cacm-scratch-09.pdf) | Low floor / high ceiling / wide walls; tinkerability over top-down planning; "it's OK to be a little messy and experimental" |
| [ScratchJr (IDC) paper](https://dl.acm.org/doi/pdf/10.1145/2485760.2485785) | Four principles incl. **conviviality** — the interface should feel "friendly, joyful, inviting and playful" |
| [Resnick, *Some Reflections on Designing Construction Kits for Kids*](https://web.media.mit.edu/~mres/papers/IDC-2005.pdf) | Ten guiding principles; success measured by *diversity of outcomes*, not uniform ones |
| [NN/g — Designing for Kids: Cognitive Considerations](https://nngroup.com/articles/kids-cognition) | State the goal and how to reach it; reduce cognitive load — children's working memory is smaller than adults'; "what works for one age group will not work for another" |
| [NN/g — Design for Kids Based on Physical Development](https://nngroup.com/articles/children-ux-physical-development) | Target sizes around 2 cm × 2 cm for young children (≈4× the adult minimum); gesture capability by age; around 11 children can use the same interaction range as adults |
| [UXPA — Playful Interfaces](https://uxpamagazine.org/playful-interfaces) | Larger on-screen widgets for younger children, evidence-backed |
| [TIDRC framework (Soni et al.)](https://init.cise.ufl.edu/wp-content/uploads/sites/775/2019/04/TIDRC-Framework-soni-et-al-IDC19-final.pdf) | Across 50 popular children's apps only ~63% followed published design recommendations (cognitive 51%) — the gap is normal, and worth closing deliberately |

I did not instrument Khan Academy, Brilliant, Mimo or Codecademy. Their widely-known patterns (mastery levels,
micro-lessons, in-browser editors, streak mechanics) are treated below as *reference points in common use*, not as
sourced findings, and no metric from them is quoted.

## What we take

1. **One obvious next step beats a browsable map.** Duolingo replaced choice with a path and reported it improved
   mastery. KidyCode already computes a "continue" lesson (`learnerDashboard(...).continueLesson`) — it is simply not
   shown to learners anywhere. The dashboard must lead with it.
2. **Experience before explanation.** Both Duolingo's handbook and Scratch's constructionist line say the learner should
   *do* first. Our lesson currently opens with prose. V4 moves one interactive moment above the explanation.
3. **Say when it is hard.** Duolingo's difficulty indicators reduced the sting of failure. The 16–18 concept states
   plainly that immutable updates are fiddly; the 10–12 concept says "one idea, the rest is typing".
4. **Reduce, then reduce again.** Scratch's own principle is to remove features. Our lesson screen carries six
   parallel systems (F3 in the audit). V4 keeps three bands and deletes the rest from the default view.
5. **Different interfaces for different ages is not optional.** NN/g is explicit that a few years changes cognitive
   capacity substantially. Our audit measured all four age groups rendering at exactly 1009 px with the same palette.
6. **Bigger, simpler targets on phones.** NN/g's ~2 cm guidance is aimed at under-10s, but it still argues for generous
   touch targets and thumb-reachable primary actions at every age. V4's mobile sheets use a sticky action bar and
   44 px minimum targets.
7. **Tinkerability.** Scratch's word: allow partial, messy, exploratory progress. KidyCode's editor therefore keeps a
   live preview and a "Run" that never blocks, and hints that are *shaped* by the learner (13–15) rather than listed.
8. **Conviviality is a design requirement, not decoration.** Friendly, inviting tone — carried by type, shape and
   copy, not by a mascot.

## What we deliberately reject

- **Streak guilt and loss-aversion mechanics.** A "3-day making streak" appears in the 10–12 concept as a *description*
  of what they built, and never as a countdown that punishes absence. No lives, no hearts, no "you lost your streak".
- **Points, coins or leaderboards.** Rewards are the artefacts a learner made and the skills the checks proved.
- **Character mascots and confetti.** KidyCode has no mascot; inventing one now would be a bigger brand decision than a
  visual refresh, and the brief asks for an original identity rather than a borrowed one.
- **Fabricated analytics for motivation.** The audit found the app is honest about what it does not record (no sign-ins,
  no time-on-task). Concept D states this on the dashboard instead of inventing a "hours learned" figure.
- **Copying any reference product's layout or components.** Every layout here is KidyCode's own; the borrowing is at the
  level of principle (progressive disclosure, low floor, transparency).

## The one-line research conclusion

The products that make hard things feel possible all do the same three things: they show **one** next step, they let
you **touch** the thing before they explain it, and they are **honest** about difficulty. KidyCode's curriculum already
supports all three; its interface currently does none of them.
