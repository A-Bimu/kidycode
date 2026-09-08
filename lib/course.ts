export type ThemeId = "wildlife" | "museum" | "space";
export type LessonMode = "blocks" | "javascript";
export type ActivityType = "theory" | "workshop" | "lab" | "review" | "quiz";

export type PracticeQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type Lesson = {
  id: string;
  title: string;
  minutes: number;
  mode: LessonMode;
  objective: string;
  notes: string[];
  exampleTitle: string;
  exampleCode: string;
  exampleExplanation: string;
  question: PracticeQuestion;
  task: string;
  starterBlocks?: string[];
  availableBlocks?: string[];
  solutionBlocks?: string[];
  starterCode?: string;
  requiredCode?: string[];
  hints: string[];
  reflection: string;
  evidence: string;
  activityType?: ActivityType;
  activityNumber?: number;
  sections?: Array<{
    title: string;
    paragraphs: string[];
    exampleTitle: string;
    exampleCode: string;
    exampleExplanation: string;
  }>;
  questions?: PracticeQuestion[];
  steps?: string[];
  requirements?: string[];
  keyTerms?: string[];
};

export type Stage = {
  id: string;
  number: number;
  title: string;
  focus: string;
  projectStep: string;
  mentor: "fox" | "owl" | "elephant" | "cheetah" | "butterfly" | "lion";
  lessons: Lesson[];
  checkpoint: {
    title: string;
    checks: string[];
  };
};

export const themes: Array<{
  id: ThemeId;
  title: string;
  pitch: string;
  collectable: string;
  hazard: string;
  destination: string;
}> = [
  {
    id: "wildlife",
    title: "Wildlife Signal Rescue",
    pitch: "Restore three tracking beacons and reach the field station.",
    collectable: "beacons",
    hazard: "rocky ground",
    destination: "field station",
  },
  {
    id: "museum",
    title: "Museum Night Run",
    pitch: "Recover three exhibit tags and reach the control room.",
    collectable: "exhibit tags",
    hazard: "security barriers",
    destination: "control room",
  },
  {
    id: "space",
    title: "Space Station Courier",
    pitch: "Collect three energy cells and reach the command deck.",
    collectable: "energy cells",
    hazard: "coolant leaks",
    destination: "command deck",
  },
];

export const blockCatalog: Record<string, { label: string; code: string; group: string }> = {
  start: { label: "when game starts", code: "startGame();", group: "Events" },
  right: { label: "move right 1 step", code: "movePlayer(1, 0);", group: "Movement" },
  left: { label: "move left 1 step", code: "movePlayer(-1, 0);", group: "Movement" },
  up: { label: "move up 1 step", code: "movePlayer(0, -1);", group: "Movement" },
  down: { label: "move down 1 step", code: "movePlayer(0, 1);", group: "Movement" },
  keyRight: { label: "when right arrow pressed", code: "onKey(\"ArrowRight\", moveRight);", group: "Events" },
  keyLeft: { label: "when left arrow pressed", code: "onKey(\"ArrowLeft\", moveLeft);", group: "Events" },
  keyUp: { label: "when up arrow pressed", code: "onKey(\"ArrowUp\", moveUp);", group: "Events" },
  keyDown: { label: "when down arrow pressed", code: "onKey(\"ArrowDown\", moveDown);", group: "Events" },
  repeat3: { label: "repeat 3 times", code: "repeat(3, moveRight);", group: "Loops" },
  repeatForever: { label: "repeat while playing", code: "while (game.playing) { animate(); }", group: "Loops" },
  collect: { label: "if touching item, collect it", code: "if (touchingItem()) collectItem();", group: "Decisions" },
  avoid: { label: "if touching hazard, lose a life", code: "if (touchingHazard()) loseLife();", group: "Decisions" },
  score0: { label: "set score to 0", code: "let score = 0;", group: "Variables" },
  lives3: { label: "set lives to 3", code: "let lives = 3;", group: "Variables" },
  addScore: { label: "change score by 1", code: "score = score + 1;", group: "Variables" },
  timer30: { label: "set time to 30", code: "let timeLeft = 30;", group: "Variables" },
  win: { label: "if score is 3, show win", code: "if (score === 3) showWin();", group: "Decisions" },
  lose: { label: "if lives is 0, show retry", code: "if (lives === 0) showRetry();", group: "Decisions" },
  level2: { label: "load level 2", code: "loadLevel(2);", group: "Levels" },
  reset: { label: "reset the game", code: "resetGame();", group: "Controls" },
};

const javascriptBase = `const player = { x: 1, y: 4 };
let score = 0;
let lives = 3;

function movePlayer(dx, dy) {
  player.x = player.x + dx;
  player.y = player.y + dy;
}

function collectItem() {
  score = score + 1;
  updateScreen();
}`;

const stageSeeds: Stage[] = [
  {
    id: "route",
    number: 1,
    title: "Plan the route",
    focus: "Algorithms, sequence and precise instructions",
    projectStep: "Move the player from the start tile to the first signal.",
    mentor: "fox",
    lessons: [
      {
        id: "route-1",
        title: "Code is an exact instruction",
        minutes: 18,
        mode: "blocks",
        objective: "Explain why a computer needs instructions that are clear and ordered.",
        notes: [
          "An algorithm is a set of steps for completing a task.",
          "A computer follows the steps it receives. It does not fill in missing details for us.",
          "A useful instruction says what action to take and, when needed, how many times to take it.",
        ],
        exampleTitle: "A route with no guessing",
        exampleCode: "when game starts\nmove right 1 step\nmove right 1 step",
        exampleExplanation: "The event begins the algorithm. The two movement blocks then run from top to bottom.",
        question: {
          prompt: "Which instruction is most useful to a computer?",
          options: ["Go over there", "Move right two tiles", "Find the nice place"],
          answer: 1,
          explanation: "Move right two tiles gives a direction and an exact distance.",
        },
        task: "Build the first route: start the game, then move right twice.",
        starterBlocks: [],
        availableBlocks: ["start", "right", "left", "up"],
        solutionBlocks: ["start", "right", "right"],
        hints: ["Every program needs a clear starting event.", "The signal is two tiles to the right.", "Use start, right, right in that order."],
        reflection: "Why would “go to the signal” be difficult for a computer to follow?",
        evidence: "I can turn a short route into exact commands.",
      },
      {
        id: "route-2",
        title: "Order changes the result",
        minutes: 18,
        mode: "blocks",
        objective: "Predict how changing the order of commands changes an outcome.",
        notes: [
          "A sequence is the order in which commands run.",
          "The same commands can produce a different route when their order changes.",
          "Read a block program from the event at the top to the final block at the bottom.",
        ],
        exampleTitle: "Same blocks, different destination",
        exampleCode: "move right\nmove up\nmove right",
        exampleExplanation: "Moving up in the middle avoids the barrier. Moving up last would place the player somewhere else.",
        question: {
          prompt: "The player must go right, up, then right. Which sequence works?",
          options: ["right, right, up", "up, right, right", "right, up, right"],
          answer: 2,
          explanation: "The commands must match the route in the same order.",
        },
        task: "Reach the second tile without crossing the barrier: right, up, right.",
        starterBlocks: ["start"],
        availableBlocks: ["right", "left", "up", "down"],
        solutionBlocks: ["start", "right", "up", "right"],
        hints: ["Trace the route one tile at a time.", "The middle move goes upward.", "Start, right, up, right is the complete sequence."],
        reflection: "What changed when you moved one block to a different position?",
        evidence: "I can order commands to match a planned route.",
      },
      {
        id: "route-3",
        title: "Test a prediction",
        minutes: 20,
        mode: "blocks",
        objective: "Predict a result, run the program and compare the actual result.",
        notes: [
          "Prediction means deciding what you expect before pressing Run.",
          "Testing compares the expected result with what actually happened.",
          "A wrong prediction is useful because it tells you what to inspect next.",
        ],
        exampleTitle: "Expected and actual",
        exampleCode: "Prediction: finish on tile B4\nActual: finish on tile B3\nDifference: one move up is missing",
        exampleExplanation: "A clear comparison points to the smallest useful change.",
        question: {
          prompt: "What should you do before changing code that did not work?",
          options: ["Delete everything", "Describe expected and actual results", "Add several random blocks"],
          answer: 1,
          explanation: "Expected and actual results help you find the exact difference.",
        },
        task: "Complete the planned route, then run it and check the final tile.",
        starterBlocks: ["start", "right", "up"],
        availableBlocks: ["right", "left", "up", "down"],
        solutionBlocks: ["start", "right", "up", "right", "down"],
        hints: ["The final signal is one tile below the current route.", "Add only one block, then test.", "Place down after the final right block."],
        reflection: "Write one sentence comparing your prediction with the result.",
        evidence: "I can predict, run and compare a program.",
      },
      {
        id: "route-4",
        title: "Checkpoint: the first signal",
        minutes: 25,
        mode: "blocks",
        objective: "Plan and build a complete short route without copying a finished answer.",
        notes: [
          "Plan the tiles first, then turn each tile change into a command.",
          "Run the smallest working version before adding extra movement.",
          "Your explanation is part of the work. It shows that the route was understood, not guessed.",
        ],
        exampleTitle: "A compact route plan",
        exampleCode: "Start (1,4) → right → up → right → down → signal (3,4)",
        exampleExplanation: "Coordinates and arrows give a plan that can be checked before coding.",
        question: {
          prompt: "Which is the best first step for a new route?",
          options: ["Plan the tiles", "Add every block", "Change the colours"],
          answer: 0,
          explanation: "A short plan makes the coding and checking easier.",
        },
        task: "Build the full route to signal one. Save it as Project Checkpoint 1.",
        starterBlocks: ["start"],
        availableBlocks: ["right", "left", "up", "down"],
        solutionBlocks: ["start", "right", "up", "right", "down"],
        hints: ["Draw the route with arrows first.", "There are four movement blocks.", "The route is right, up, right, down."],
        reflection: "How did your plan help you use fewer guesses?",
        evidence: "I can plan, build and explain a complete sequence.",
      },
    ],
    checkpoint: {
      title: "Checkpoint 1: First signal route",
      checks: ["The program starts correctly", "The route reaches signal one", "The commands are in a sensible order", "The learner explains one decision"],
    },
  },
  {
    id: "controls",
    number: 2,
    title: "Give the player control",
    focus: "Events, input and responsive movement",
    projectStep: "Let another person move the player with four arrow keys.",
    mentor: "cheetah",
    lessons: [
      {
        id: "controls-1",
        title: "Events make code respond",
        minutes: 18,
        mode: "blocks",
        objective: "Connect an event with the code that should run after it.",
        notes: ["An event is something the program notices, such as a key press or click.", "An event handler contains the commands that run after that event.", "Different events can trigger different actions."],
        exampleTitle: "Right arrow event",
        exampleCode: "when right arrow pressed\nmove right 1 step",
        exampleExplanation: "Movement waits until the player presses the matching key.",
        question: { prompt: "What starts this movement?", options: ["A timer", "The right arrow key", "The score"], answer: 1, explanation: "The event listens for the right arrow key." },
        task: "Connect the right arrow event to right movement.",
        starterBlocks: [], availableBlocks: ["keyRight", "right", "keyLeft", "left"], solutionBlocks: ["keyRight", "right"],
        hints: ["Choose an event first.", "Match the arrow direction with the movement direction.", "Use keyRight followed by right."],
        reflection: "What would happen if the movement block had no event?", evidence: "I can connect an event to an action.",
      },
      {
        id: "controls-2",
        title: "Four directions, four decisions",
        minutes: 20,
        mode: "blocks",
        objective: "Create consistent controls for up, down, left and right.",
        notes: ["Controls should behave in a way the player can predict.", "Each arrow event needs the matching movement.", "Testing every direction catches reversed or missing controls."],
        exampleTitle: "A complete control pair",
        exampleCode: "when left arrow pressed\nmove left 1 step",
        exampleExplanation: "The input and output point in the same direction.",
        question: { prompt: "Which pair is incorrect?", options: ["up key → move up", "left key → move right", "down key → move down"], answer: 1, explanation: "A left key should not move the player right." },
        task: "Add all four key events and their matching movements.",
        starterBlocks: ["keyRight", "right"], availableBlocks: ["keyLeft", "left", "keyUp", "up", "keyDown", "down"],
        solutionBlocks: ["keyRight", "right", "keyLeft", "left", "keyUp", "up", "keyDown", "down"],
        hints: ["Build one event and movement pair at a time.", "You need eight blocks in total.", "Each key block is immediately followed by the same direction movement."],
        reflection: "Which control did you test first, and why?", evidence: "I can build and test a four-direction control system.",
      },
      {
        id: "controls-3",
        title: "Keep the player on the map",
        minutes: 20,
        mode: "blocks",
        objective: "Recognise that controls need rules and boundaries.",
        notes: ["A boundary stops the player leaving the game area.", "Good feedback makes a blocked move understandable.", "Edge cases happen at the limits, such as the top row or far-left tile."],
        exampleTitle: "A boundary check",
        exampleCode: "if next tile is inside map\n  move player\nelse\n  stay on current tile",
        exampleExplanation: "The program checks the result before allowing the move.",
        question: { prompt: "Which test checks an edge case?", options: ["Move in the middle", "Move at the left edge", "Read the title"], answer: 1, explanation: "The left edge tests whether the boundary works." },
        task: "Test all four edges, then keep the correct four-direction controls.",
        starterBlocks: ["keyRight", "right", "keyLeft", "left", "keyUp", "up"], availableBlocks: ["keyDown", "down"],
        solutionBlocks: ["keyRight", "right", "keyLeft", "left", "keyUp", "up", "keyDown", "down"],
        hints: ["Try moving beyond every outside edge.", "A good control should stop at the map border.", "Complete the missing down control pair."],
        reflection: "Name one edge case you tested.", evidence: "I can test controls at the boundaries of a map.",
      },
      {
        id: "controls-4",
        title: "Checkpoint: playable movement",
        minutes: 25,
        mode: "blocks",
        objective: "Make the project controllable by another person.",
        notes: ["A playable control system needs clear instructions.", "A silent test shows whether another player can understand the controls without help.", "Fix one problem at a time, then retest."],
        exampleTitle: "A short control instruction",
        exampleCode: "Use the arrow keys to collect three signals. Avoid the dark tiles.",
        exampleExplanation: "The instruction tells the player the controls, goal and main danger.",
        question: { prompt: "What makes a playtest more useful?", options: ["Tell the player every answer", "Watch where the player hesitates", "Only test your favourite key"], answer: 1, explanation: "Hesitation shows where instructions or controls may be unclear." },
        task: "Finish four-direction movement and ask someone to try it without help.",
        starterBlocks: ["keyRight", "right", "keyLeft", "left"], availableBlocks: ["keyUp", "up", "keyDown", "down"], solutionBlocks: ["keyRight", "right", "keyLeft", "left", "keyUp", "up", "keyDown", "down"],
        hints: ["Finish the controls before the playtest.", "Do not explain while the tester plays.", "Watch one thing they find unclear, then improve it."],
        reflection: "What did your tester do that you did not expect?", evidence: "I can make and test controls that another person can use.",
      },
    ],
    checkpoint: { title: "Checkpoint 2: Playable controls", checks: ["All four arrow keys work", "Movement stays inside the map", "Instructions name the controls", "One playtest observation is recorded"] },
  },
  {
    id: "loops",
    number: 3,
    title: "Use repetition well",
    focus: "Counted loops, continuous loops and efficient code",
    projectStep: "Animate the signals and shorten repeated movement code.",
    mentor: "butterfly",
    lessons: [
      {
        id: "loops-1", title: "Spot repeated work", minutes: 18, mode: "blocks", objective: "Identify commands that can be replaced by a loop.",
        notes: ["A loop repeats a command or group of commands.", "Counted loops repeat a known number of times.", "Loops make repeated code shorter and easier to change."],
        exampleTitle: "Three moves, one loop", exampleCode: "repeat 3 times\n  move right 1 step", exampleExplanation: "The movement command runs three times without being copied three times.",
        question: { prompt: "Which code is most efficient for ten identical moves?", options: ["Ten separate move blocks", "A repeat 10 loop", "A score variable"], answer: 1, explanation: "A counted loop states the repetition clearly and compactly." },
        task: "Replace three right blocks with one repeat block.", starterBlocks: ["start"], availableBlocks: ["right", "repeat3"], solutionBlocks: ["start", "repeat3"],
        hints: ["Look for the action that repeats.", "The repeat block already includes three right moves.", "Use start, then repeat3."], reflection: "What becomes easier when repeated code is shorter?", evidence: "I can replace repeated commands with a counted loop.",
      },
      {
        id: "loops-2", title: "Repeat a pattern", minutes: 20, mode: "blocks", objective: "Use a loop to create a predictable visual pattern.",
        notes: ["A pattern repeats a recognisable set of actions.", "The loop body is the part that repeats.", "Changing one value can change every repeat."],
        exampleTitle: "Signal pulse", exampleCode: "repeat 3 times\n  make signal bright\n  make signal dim", exampleExplanation: "Two actions form one pulse, and the loop repeats that pulse three times.",
        question: { prompt: "What is the loop body?", options: ["The actions inside the repeat", "The game title", "The final score"], answer: 0, explanation: "The loop body contains the commands that repeat." },
        task: "Create a three-step patrol using a repeat block.", starterBlocks: ["start"], availableBlocks: ["right", "repeat3", "left"], solutionBlocks: ["start", "repeat3", "left"],
        hints: ["Use repeat for the repeated right movement.", "Add one left move after the loop.", "The complete order is start, repeat3, left."], reflection: "Which command is inside the repeated part?", evidence: "I can identify and build a repeated pattern.",
      },
      {
        id: "loops-3", title: "Repeat while the game runs", minutes: 20, mode: "blocks", objective: "Distinguish a continuous loop from a counted loop.",
        notes: ["A continuous loop keeps running while the program is active.", "Animation needs repeated small updates.", "A stop, pause or game-over state must be able to end the loop."],
        exampleTitle: "Continuous animation", exampleCode: "repeat while playing\n  update animation\n  check collisions", exampleExplanation: "The game keeps updating until playing becomes false.",
        question: { prompt: "When should a continuous game loop stop?", options: ["Never", "When the game is paused or finished", "After every key press"], answer: 1, explanation: "The program needs a clear state that stops repeated updates." },
        task: "Add the continuous animation loop after the game starts.", starterBlocks: ["start"], availableBlocks: ["repeat3", "repeatForever", "right"], solutionBlocks: ["start", "repeatForever"],
        hints: ["This animation does not have a fixed number of repeats.", "Choose the block that runs while playing.", "Use start, then repeatForever."], reflection: "Why is a stop condition important in a continuous loop?", evidence: "I can choose between counted and continuous loops.",
      },
      {
        id: "loops-4", title: "Checkpoint: an animated map", minutes: 25, mode: "blocks", objective: "Use two kinds of loops in the growing project.",
        notes: ["Use a counted loop for a fixed route or repeated effect.", "Use a continuous loop for ongoing animation and checking.", "Test that the project can still pause, win and restart."],
        exampleTitle: "Two loops, two jobs", exampleCode: "repeat 3 times → patrol route\nrepeat while playing → animate signals", exampleExplanation: "Each loop matches a different kind of repetition.",
        question: { prompt: "Which loop suits a signal that pulses until the game ends?", options: ["Repeat 3", "Repeat while playing", "No loop"], answer: 1, explanation: "The animation should continue for the whole playing state." },
        task: "Keep the shorter patrol route and add continuous animation.", starterBlocks: ["start", "repeat3"], availableBlocks: ["repeatForever", "right", "left"], solutionBlocks: ["start", "repeat3", "repeatForever"],
        hints: ["Your route already uses a counted loop.", "Add the ongoing animation after it.", "Use start, repeat3, repeatForever."], reflection: "Explain why your two loops do different jobs.", evidence: "I can use loops to improve both code and animation.",
      },
    ],
    checkpoint: { title: "Checkpoint 3: Efficient animation", checks: ["A counted loop replaces repeated movement", "A continuous loop animates the game", "The project can still stop", "The learner explains each loop's job"] },
  },
  {
    id: "collision",
    number: 4,
    title: "Collect and avoid",
    focus: "Coordinates, collision detection and feedback",
    projectStep: "Make signals collectable and hazards meaningful.",
    mentor: "cheetah",
    lessons: [
      {
        id: "collision-1", title: "Positions use coordinates", minutes: 18, mode: "blocks", objective: "Read x and y positions on the game grid.",
        notes: ["The x coordinate changes from left to right.", "The y coordinate changes from top to bottom on this grid.", "Two objects touch when their occupied positions overlap."],
        exampleTitle: "Reading a tile", exampleCode: "player = (2, 4)\nsignal = (3, 4)", exampleExplanation: "The signal is one tile to the right because only the x value changes.",
        question: { prompt: "From (2,4), where does one move right end?", options: ["(3,4)", "(2,3)", "(1,4)"], answer: 0, explanation: "Moving right increases x by one and keeps y the same." },
        task: "Move from (1,4) to the item at (3,4).", starterBlocks: ["start"], availableBlocks: ["right", "left", "up", "down"], solutionBlocks: ["start", "right", "right"],
        hints: ["Compare the two x values.", "The y value does not change.", "Use two right movements."], reflection: "Which coordinate changed, and which stayed the same?", evidence: "I can use coordinates to plan a move.",
      },
      {
        id: "collision-2", title: "Detect a collected item", minutes: 20, mode: "blocks", objective: "Use a collision condition to collect an item once.",
        notes: ["Collision detection checks whether two objects are touching.", "Collecting should change the item so it cannot be collected twice.", "Visible or sound feedback tells the player the collection worked."],
        exampleTitle: "Collect once", exampleCode: "if player touches signal\n  hide signal\n  add one to score", exampleExplanation: "Hiding or marking the signal collected prevents repeat scoring.",
        question: { prompt: "Why should the signal disappear after collection?", options: ["To make the map empty", "To prevent scoring it again", "To stop the player moving"], answer: 1, explanation: "A collected object should not award points more than once." },
        task: "Add the collection check after movement.", starterBlocks: ["start", "right", "right"], availableBlocks: ["collect", "avoid", "addScore"], solutionBlocks: ["start", "right", "right", "collect"],
        hints: ["First reach the signal.", "Then check whether the player is touching it.", "Add collect as the final block."], reflection: "What feedback tells the player an item was collected?", evidence: "I can detect and respond to a collection collision.",
      },
      {
        id: "collision-3", title: "Hazards need fair feedback", minutes: 20, mode: "blocks", objective: "Create a clear response when the player touches a hazard.",
        notes: ["A hazard changes the game when touched.", "Fair hazards are visible and give immediate feedback.", "After a hit, moving the player to a safe tile prevents repeated life loss."],
        exampleTitle: "A fair hazard response", exampleCode: "if touching hazard\n  lose one life\n  flash the player\n  return to safe tile", exampleExplanation: "The player sees what happened and gets a clear chance to continue.",
        question: { prompt: "Which hazard is fairest?", options: ["Invisible and instant", "Visible with clear feedback", "Impossible to avoid"], answer: 1, explanation: "A player should be able to notice, understand and avoid a hazard." },
        task: "Add a hazard check after the item check.", starterBlocks: ["start", "collect"], availableBlocks: ["avoid", "right", "win"], solutionBlocks: ["start", "collect", "avoid"],
        hints: ["The collect check is already present.", "Choose the block that reacts to a hazard.", "Use start, collect, avoid."], reflection: "How will a player know why a life was lost?", evidence: "I can design and test a fair hazard response.",
      },
      {
        id: "collision-4", title: "Checkpoint: working game objects", minutes: 25, mode: "blocks", objective: "Combine movement, item collection and hazard detection.",
        notes: ["Run collision checks after each movement update.", "Test item and hazard behaviour separately before testing them together.", "A checkpoint should keep the last version that worked."],
        exampleTitle: "A useful test order", exampleCode: "1. Touch one item\n2. Touch the same item again\n3. Touch one hazard\n4. Move away and continue", exampleExplanation: "Each test checks a different rule and catches repeat effects.",
        question: { prompt: "Which test catches repeat scoring?", options: ["Collect the same item twice", "Read the instructions", "Move on an empty tile"], answer: 0, explanation: "The second contact should not add another point." },
        task: "Finish collect and avoid rules, then save Project Checkpoint 4.", starterBlocks: ["start"], availableBlocks: ["collect", "avoid", "right", "left"], solutionBlocks: ["start", "collect", "avoid"],
        hints: ["Add both collision responses.", "Test each one separately.", "The compact solution is start, collect, avoid."], reflection: "Which collision test found the most useful problem?", evidence: "I can combine and test two collision rules.",
      },
    ],
    checkpoint: { title: "Checkpoint 4: Collect and avoid", checks: ["Items collect only once", "Hazards have visible feedback", "The player returns to a fair position", "Both rules are tested separately"] },
  },
  {
    id: "variables",
    number: 5,
    title: "Remember the game state",
    focus: "Variables, values, score, lives and time",
    projectStep: "Add a scoreboard with three values that change during play.",
    mentor: "elephant",
    lessons: [
      {
        id: "variables-1", title: "Variables are labelled memory", minutes: 18, mode: "blocks", objective: "Name and set variables for the game.",
        notes: ["A variable stores a value the program needs to remember.", "A clear variable name describes the value inside it.", "Starting values prepare the game before play begins."],
        exampleTitle: "Clear starting values", exampleCode: "set score to 0\nset lives to 3", exampleExplanation: "The names explain the values and both are ready before the first move.",
        question: { prompt: "Which is the clearest variable name?", options: ["thing", "x1", "playerScore"], answer: 2, explanation: "playerScore tells us exactly what the value represents." },
        task: "Set score to 0 and lives to 3 when the game starts.", starterBlocks: ["start"], availableBlocks: ["score0", "lives3", "addScore"], solutionBlocks: ["start", "score0", "lives3"],
        hints: ["Starting values belong near the game start.", "You need one score block and one lives block.", "Use start, score0, lives3."], reflection: "Why is playerScore clearer than thing?", evidence: "I can name and initialise variables.",
      },
      {
        id: "variables-2", title: "Change score after an action", minutes: 20, mode: "blocks", objective: "Update a variable when an item is collected.",
        notes: ["Updating a variable replaces its old value with a new one.", "Score should change only after the correct event or collision.", "A scoreboard must display the latest stored value."],
        exampleTitle: "Add one point", exampleCode: "score starts at 0\ncollect one item\nscore becomes 1", exampleExplanation: "The update happens once because the item can only be collected once.",
        question: { prompt: "Score is 2. What is it after score = score + 1?", options: ["1", "2", "3"], answer: 2, explanation: "The old value 2 plus 1 gives the new value 3." },
        task: "Add one point after a successful collection.", starterBlocks: ["start", "score0", "collect"], availableBlocks: ["addScore", "lives3", "timer30"], solutionBlocks: ["start", "score0", "collect", "addScore"],
        hints: ["The update belongs after collection.", "Choose the block that changes score by one.", "Place addScore after collect."], reflection: "What would happen if score changed before the collection check?", evidence: "I can update a variable after a specific action.",
      },
      {
        id: "variables-3", title: "Lives and time create pressure", minutes: 20, mode: "blocks", objective: "Choose suitable starting values for lives and time.",
        notes: ["Lives count how many mistakes the player can recover from.", "A timer counts down as the game runs.", "Difficulty values should be tested and adjusted, not guessed once."],
        exampleTitle: "A testable first balance", exampleCode: "lives = 3\ntimeLeft = 30", exampleExplanation: "These values are a starting hypothesis. A playtest decides whether they are fair.",
        question: { prompt: "Players always run out of time near the first item. What is the best next step?", options: ["Make the timer shorter", "Test a slightly longer time", "Remove all feedback"], answer: 1, explanation: "Adjust one value and test whether the experience becomes fairer." },
        task: "Prepare three lives and a 30-second timer.", starterBlocks: ["start", "score0"], availableBlocks: ["lives3", "timer30", "addScore"], solutionBlocks: ["start", "score0", "lives3", "timer30"],
        hints: ["Both values are set at the start.", "Choose lives3 and timer30.", "Place both after score0."], reflection: "Which value would you adjust first after a difficult playtest?", evidence: "I can set and justify starting game values.",
      },
      {
        id: "variables-4", title: "Checkpoint: the scoreboard", minutes: 25, mode: "blocks", objective: "Build and test a consistent score, lives and time system.",
        notes: ["Every displayed value should match the stored variable.", "Reset should return all values to their starting state.", "Test the scoreboard during collection, a hazard hit and a restart."],
        exampleTitle: "Three scoreboard tests", exampleCode: "Collect → score +1\nHazard → lives -1\nReset → score 0, lives 3, time 30", exampleExplanation: "Each test changes or restores a different part of the game state.",
        question: { prompt: "What should Reset do?", options: ["Keep the old score", "Restore all starting values", "Add one life"], answer: 1, explanation: "Reset prepares a clean new round." },
        task: "Complete the starting variables and add Reset.", starterBlocks: ["start", "score0", "lives3", "timer30"], availableBlocks: ["reset", "addScore", "collect"], solutionBlocks: ["start", "score0", "lives3", "timer30", "reset"],
        hints: ["Your starting values are already present.", "Choose the control that restores them.", "Add reset as the final block."], reflection: "Name the three moments when you tested the scoreboard.", evidence: "I can create, update and reset game variables.",
      },
    ],
    checkpoint: { title: "Checkpoint 5: Scoreboard", checks: ["Score begins at 0", "Lives begin at 3", "Time begins at 30", "Reset restores all three values"] },
  },
  {
    id: "decisions",
    number: 6,
    title: "Make the game decide",
    focus: "Conditions, comparisons, win and retry states",
    projectStep: "Add clear rules for winning, losing and trying again.",
    mentor: "fox",
    lessons: [
      {
        id: "decisions-1", title: "A condition asks a true-or-false question", minutes: 18, mode: "blocks", objective: "Write a condition the program can evaluate.",
        notes: ["A condition is a question with a true or false result.", "If runs code only when its condition is true.", "Comparisons use values such as equal to, greater than or less than."],
        exampleTitle: "A score condition", exampleCode: "if score is 3\n  open destination", exampleExplanation: "The destination opens only after all three items have been collected.",
        question: { prompt: "Which is a condition?", options: ["Move right", "Is score equal to 3?", "Play a sound"], answer: 1, explanation: "The score question can be evaluated as true or false." },
        task: "Check whether score is 3 and show the win screen.", starterBlocks: ["start", "score0"], availableBlocks: ["win", "lose", "addScore"], solutionBlocks: ["start", "score0", "win"],
        hints: ["The condition needs the score value.", "Choose the win decision.", "Use start, score0, win."], reflection: "When is the win condition false?", evidence: "I can recognise and use a true-or-false condition.",
      },
      {
        id: "decisions-2", title: "Win and retry are different states", minutes: 20, mode: "blocks", objective: "Create separate outcomes for success and failure.",
        notes: ["A game state describes what the game is doing now.", "Playing, won and retry are separate states.", "Controls should stop changing the map when the game is not in the playing state."],
        exampleTitle: "Two ending checks", exampleCode: "if score is 3 → won\nif lives is 0 → retry", exampleExplanation: "Each comparison leads to a different end state.",
        question: { prompt: "What should happen after the game enters won state?", options: ["Keep losing lives", "Show success and pause play", "Hide the result"], answer: 1, explanation: "A completed state needs clear feedback and should stop normal play." },
        task: "Add both the win and retry conditions.", starterBlocks: ["start", "score0", "lives3"], availableBlocks: ["win", "lose", "reset"], solutionBlocks: ["start", "score0", "lives3", "win", "lose"],
        hints: ["One condition checks score.", "The other condition checks lives.", "Add win, then lose after the starting variables."], reflection: "How does the player know which ending happened?", evidence: "I can build two distinct game outcomes.",
      },
      {
        id: "decisions-3", title: "Test the edge values", minutes: 20, mode: "blocks", objective: "Test conditions at, below and above a boundary value.",
        notes: ["A boundary value is where a condition changes from false to true.", "For score === 3, test 2, 3 and 4.", "Testing nearby values catches comparison mistakes such as using > instead of >=."],
        exampleTitle: "Three useful tests", exampleCode: "score 2 → keep playing\nscore 3 → win\nscore 4 → inspect why it was possible", exampleExplanation: "The middle test checks the exact boundary and the others check nearby behaviour.",
        question: { prompt: "Which three values best test lives === 0?", options: ["3, 3, 3", "1, 0, -1", "10, 20, 30"], answer: 1, explanation: "The values sit above, at and below the boundary." },
        task: "Keep both ending conditions and add a reset control for another round.", starterBlocks: ["start", "win", "lose"], availableBlocks: ["reset", "right", "timer30"], solutionBlocks: ["start", "win", "lose", "reset"],
        hints: ["A completed round needs a way to start again.", "Choose the reset control.", "Place reset after the two ending checks."], reflection: "Which boundary value did you test exactly?", evidence: "I can test a condition around its boundary.",
      },
      {
        id: "decisions-4", title: "Checkpoint: a complete round", minutes: 25, mode: "blocks", objective: "Play one full round from start to win or retry.",
        notes: ["A complete round has a start, a playing state and a clear ending.", "Winning and losing should both allow a clean restart.", "A test record should name the input, expected result and actual result."],
        exampleTitle: "A simple test record", exampleCode: "Input: collect third item\nExpected: win screen\nActual: win screen\nResult: pass", exampleExplanation: "The record makes the evidence easy to understand later.",
        question: { prompt: "Which test proves retry works?", options: ["Lose the final life, press retry, check starting values", "Read the score", "Move once"], answer: 0, explanation: "It reaches the retry state and checks the new round is clean." },
        task: "Build the win, retry and reset flow, then save Project Checkpoint 6.", starterBlocks: ["start", "score0", "lives3"], availableBlocks: ["win", "lose", "reset"], solutionBlocks: ["start", "score0", "lives3", "win", "lose", "reset"],
        hints: ["Prepare score and lives before checking them.", "Add both end states.", "Finish with reset so another round can begin."], reflection: "Describe one full test from input to result.", evidence: "I can build and test a complete game round.",
      },
    ],
    checkpoint: { title: "Checkpoint 6: Complete round", checks: ["Three collected items trigger win", "Zero lives triggers retry", "Normal controls pause after an ending", "Retry starts with clean values"] },
  },
  {
    id: "levels",
    number: 7,
    title: "Build a second level",
    focus: "Functions, decomposition and reusable behaviour",
    projectStep: "Add a second map without copying every instruction.",
    mentor: "elephant",
    lessons: [
      {
        id: "levels-1", title: "Break a large job into smaller jobs", minutes: 18, mode: "blocks", objective: "Decompose the game into named parts.",
        notes: ["Decomposition means breaking a large problem into smaller parts.", "A function is a named set of instructions for one job.", "Good function names describe actions, such as resetGame or loadLevel."],
        exampleTitle: "Three jobs", exampleCode: "startGame()\nmovePlayer()\ncheckCollisions()", exampleExplanation: "Each function has one clear responsibility.",
        question: { prompt: "Which is the clearest function name?", options: ["doThing", "function1", "loadLevel"], answer: 2, explanation: "loadLevel states the job the function performs." },
        task: "Use the level block to separate map loading from the rest of the game.", starterBlocks: ["start"], availableBlocks: ["level2", "right", "reset"], solutionBlocks: ["start", "level2"],
        hints: ["The new job is loading a map.", "Choose the level block.", "Use start, then level2."], reflection: "Name one other job that deserves its own function.", evidence: "I can split a game into named jobs.",
      },
      {
        id: "levels-2", title: "Reuse behaviour", minutes: 20, mode: "blocks", objective: "Reuse the same controls and rules on a new map.",
        notes: ["Reusable code works in more than one place.", "Controls, collection and hazard rules should not be copied for every level.", "Data such as object positions can change while the rules stay the same."],
        exampleTitle: "Rules stay, map changes", exampleCode: "Level 1 data: three item positions\nLevel 2 data: three different positions\nShared rule: collect when touching", exampleExplanation: "The level data changes, but the collection function is reused.",
        question: { prompt: "What should change for level two?", options: ["Every control rule", "Map data and difficulty", "The meaning of score"], answer: 1, explanation: "A new level can change layout and difficulty while keeping familiar rules." },
        task: "Load level two while keeping collect and avoid rules.", starterBlocks: ["start", "collect", "avoid"], availableBlocks: ["level2", "right", "repeat3"], solutionBlocks: ["start", "collect", "avoid", "level2"],
        hints: ["Do not remove the shared collision rules.", "Add the new level after them.", "Use start, collect, avoid, level2."], reflection: "Which rules stayed the same in both levels?", evidence: "I can reuse behaviour with different level data.",
      },
      {
        id: "levels-3", title: "Increase difficulty one step at a time", minutes: 20, mode: "blocks", objective: "Adjust one game value after a playtest.",
        notes: ["Difficulty can change speed, space, time or number of hazards.", "Change one factor at a time so the effect is clear.", "A fair second level feels harder but still understandable."],
        exampleTitle: "One controlled change", exampleCode: "Before: 30 seconds\nChange: 25 seconds\nTest: Can two players still finish?", exampleExplanation: "Only the timer changed, so its effect can be observed.",
        question: { prompt: "Why change one difficulty value at a time?", options: ["To make the code longer", "To know which change affected play", "To avoid testing"], answer: 1, explanation: "One change makes cause and effect easier to identify." },
        task: "Keep the level flow and add a shorter repeated route for level two.", starterBlocks: ["start", "level2"], availableBlocks: ["repeat3", "right", "left"], solutionBlocks: ["start", "level2", "repeat3"],
        hints: ["Add one challenge after loading level two.", "Use the counted repeat.", "The solution is start, level2, repeat3."], reflection: "What single difficulty value would you test next?", evidence: "I can adjust and test one difficulty factor.",
      },
      {
        id: "levels-4", title: "Checkpoint: two connected levels", minutes: 28, mode: "blocks", objective: "Finish a two-level version of the mission game.",
        notes: ["Level two should begin only after level one is complete.", "Show the new level number and restore the player to a safe start tile.", "Run the whole path from level one start to level two finish."],
        exampleTitle: "A level transition", exampleCode: "if score is 3\n  show level complete\n  loadLevel(2)\n  reset player position", exampleExplanation: "The transition gives feedback, changes data and prepares the player safely.",
        question: { prompt: "What must happen when a new level loads?", options: ["Keep the player inside a hazard", "Prepare the new map and safe start", "Erase all controls"], answer: 1, explanation: "A level needs its map data and a clear, fair starting state." },
        task: "Connect win, level two and reset behaviour, then save Project Checkpoint 7.", starterBlocks: ["start", "win"], availableBlocks: ["level2", "reset", "lose"], solutionBlocks: ["start", "win", "level2", "reset"],
        hints: ["The win check comes before the transition.", "Load the new level next.", "Reset the player after the map changes."], reflection: "What did you reuse instead of copying?", evidence: "I can connect two levels using reusable behaviour.",
      },
    ],
    checkpoint: { title: "Checkpoint 7: Two-level game", checks: ["Level one leads to level two", "Controls and collision rules are reused", "Level two makes one fair difficulty change", "The full two-level path is tested"] },
  },
  {
    id: "javascript",
    number: 8,
    title: "Read the JavaScript",
    focus: "Syntax, variables, functions and block-to-text translation",
    projectStep: "Open the code behind the blocks and make the first text-code changes.",
    mentor: "owl",
    lessons: [
      {
        id: "javascript-1", title: "Blocks and text can express the same idea", minutes: 20, mode: "javascript", objective: "Match familiar blocks with JavaScript statements.",
        notes: ["Syntax is the punctuation and structure a language expects.", "A semicolon marks the end of many JavaScript statements.", "Function calls such as startGame() tell a named job to run."],
        exampleTitle: "A familiar movement", exampleCode: "movePlayer(1, 0);", exampleExplanation: "The first number changes x by one. The second keeps y unchanged. This is one move right.",
        question: { prompt: "Which JavaScript line matches move left one step?", options: ["movePlayer(1, 0);", "movePlayer(-1, 0);", "movePlayer(0, 1);"], answer: 1, explanation: "A negative x change moves left." },
        task: "Change the movement call so the player moves left instead of right.", starterCode: "movePlayer(1, 0);", requiredCode: ["movePlayer(-1, 0)"],
        hints: ["Only the x value needs to change.", "Left uses a negative x value.", "Use movePlayer(-1, 0);"], reflection: "Which part of the function call controls horizontal direction?", evidence: "I can match a movement block with JavaScript.",
      },
      {
        id: "javascript-2", title: "Variables in JavaScript", minutes: 22, mode: "javascript", objective: "Declare and update score and lives in text code.",
        notes: ["let creates a variable whose value may change.", "The equals sign stores the value on its right in the variable on its left.", "score = score + 1 reads the old score, adds one and stores the new score."],
        exampleTitle: "Score in text", exampleCode: "let score = 0;\nscore = score + 1;", exampleExplanation: "The first line creates score. The second line updates it after an action.",
        question: { prompt: "What is score after this code runs twice: score = score + 1? It starts at 0.", options: ["0", "1", "2"], answer: 2, explanation: "Each update adds one, so two updates make 2." },
        task: "Create lives with a starting value of 3 and subtract one.", starterCode: "let score = 0;\nscore = score + 1;\n\n// Add lives below", requiredCode: ["let lives = 3", "lives = lives - 1"],
        hints: ["Use let to create the variable.", "Start lives at 3.", "Write let lives = 3; then lives = lives - 1;"], reflection: "What is the difference between creating and updating a variable?", evidence: "I can declare and update numeric variables in JavaScript.",
      },
      {
        id: "javascript-3", title: "Functions organise the project", minutes: 22, mode: "javascript", objective: "Read and call a JavaScript function.",
        notes: ["A function definition stores instructions under a name.", "Calling a function runs those stored instructions.", "Parentheses follow the function name in both definitions and calls."],
        exampleTitle: "Define, then call", exampleCode: "function resetGame() {\n  score = 0;\n}\n\nresetGame();", exampleExplanation: "The definition describes the job. The final line calls it once.",
        question: { prompt: "Which line calls the function?", options: ["function resetGame() {", "score = 0;", "resetGame();"], answer: 2, explanation: "The name with parentheses runs the function." },
        task: "Complete resetGame so it restores score and lives, then call it.", starterCode: "let score = 2;\nlet lives = 1;\n\nfunction resetGame() {\n  // restore both values\n}\n\n// call the function", requiredCode: ["score = 0", "lives = 3", "resetGame();"],
        hints: ["Put both updates inside the braces.", "Score returns to 0 and lives returns to 3.", "Add resetGame(); after the closing brace."], reflection: "What is the job of resetGame?", evidence: "I can complete and call a JavaScript function.",
      },
      {
        id: "javascript-4", title: "Checkpoint: first text-code version", minutes: 28, mode: "javascript", objective: "Read, change and explain a small section of the mission game.",
        notes: ["Read text code one statement at a time, just as you read blocks top to bottom.", "Use the error line and nearby punctuation as clues.", "Make one change, run the check and keep the last working version."],
        exampleTitle: "A tiny debug record", exampleCode: "Expected: score becomes 1\nActual: score stays 0\nChange: call collectItem()\nRetest: score becomes 1", exampleExplanation: "The record connects the symptom, change and result.",
        question: { prompt: "A function name is underlined as unknown. What should you inspect first?", options: ["Its spelling", "The page colour", "The timer value"], answer: 0, explanation: "A misspelled name is a common cause of an unknown function error." },
        task: "Repair the score update and call collectItem once.", starterCode: `${javascriptBase}\n\n// Run one collection below`, requiredCode: ["score = score + 1", "collectItem();"],
        hints: ["The function already contains the score update.", "The remaining job is to call it.", "Add collectItem(); after the function."], reflection: "What clue helped you understand or repair the text code?", evidence: "I can modify, test and explain working JavaScript.",
      },
    ],
    checkpoint: { title: "Checkpoint 8: JavaScript bridge", checks: ["The learner matches blocks to text", "Variables are declared and updated", "A function is completed and called", "One text-code change is explained"] },
  },
  {
    id: "polish",
    number: 9,
    title: "Finish the experience",
    focus: "DOM events, feedback, accessibility and comfort",
    projectStep: "Add clear interface feedback and controls that work for more players.",
    mentor: "butterfly",
    lessons: [
      {
        id: "polish-1", title: "Connect code to the screen", minutes: 22, mode: "javascript", objective: "Update visible text from a JavaScript value.",
        notes: ["The DOM is the browser's representation of page elements.", "querySelector finds an element using a CSS selector.", "textContent replaces the visible text inside an element."],
        exampleTitle: "Show the current score", exampleCode: "const scoreLabel = document.querySelector(\"#score\");\nscoreLabel.textContent = score;", exampleExplanation: "The first line finds the label. The second shows the variable value.",
        question: { prompt: "Which property changes visible text?", options: ["textContent", "querySelector", "addEventListener"], answer: 0, explanation: "textContent controls the text shown inside the selected element." },
        task: "Update the score label after score changes.", starterCode: "let score = 0;\nconst scoreLabel = document.querySelector(\"#score\");\nscore = score + 1;\n// show the new score", requiredCode: ["scoreLabel.textContent", "score"],
        hints: ["Use the scoreLabel variable.", "Change its textContent.", "Write scoreLabel.textContent = score;"], reflection: "Why should the visible score match the stored score?", evidence: "I can show a JavaScript value on a webpage.",
      },
      {
        id: "polish-2", title: "Buttons need events", minutes: 22, mode: "javascript", objective: "Connect a button click to a game function.",
        notes: ["addEventListener connects an event to code.", "The click event works with mouse, touch and keyboard activation on a real button.", "Pass a function name without parentheses when registering it as a handler."],
        exampleTitle: "A retry button", exampleCode: "retryButton.addEventListener(\"click\", resetGame);", exampleExplanation: "The browser calls resetGame when the button is activated.",
        question: { prompt: "Which element is best for a retry action?", options: ["A paragraph", "A button", "A decorative image"], answer: 1, explanation: "A button is keyboard accessible and clearly represents an action." },
        task: "Connect the retry button to resetGame.", starterCode: "const retryButton = document.querySelector(\"#retry\");\nfunction resetGame() {\n  score = 0;\n}\n// connect the button", requiredCode: ["addEventListener", "click", "resetGame"],
        hints: ["Use the retryButton variable.", "Listen for click.", "Write retryButton.addEventListener(\"click\", resetGame);"], reflection: "Why is a real button better than clickable text?", evidence: "I can connect an accessible control to JavaScript.",
      },
      {
        id: "polish-3", title: "Accessibility is part of the build", minutes: 22, mode: "javascript", objective: "Add settings and feedback that support different players.",
        notes: ["Keyboard controls should have visible instructions.", "Important information should not depend on colour alone.", "Sound needs a mute option, and motion should respect reduced-motion preferences."],
        exampleTitle: "More than colour", exampleCode: "status.textContent = \"Signal collected: 2 of 3\";\nstatus.dataset.state = \"collected\";", exampleExplanation: "Text communicates the result even when colour cannot be distinguished.",
        question: { prompt: "Which feedback is most accessible?", options: ["A colour change only", "Text plus a visual change", "A very fast flash"], answer: 1, explanation: "Two forms of feedback make the result understandable to more people." },
        task: "Add a clear text status after an item is collected.", starterCode: "const status = document.querySelector(\"#status\");\nlet score = 2;\n// announce the collected total", requiredCode: ["status.textContent", "score"],
        hints: ["Use the status element.", "Include the current score in the message.", "Set status.textContent to a message containing score."], reflection: "Which player need does your change support?", evidence: "I can improve feedback without relying on colour alone.",
      },
      {
        id: "polish-4", title: "Checkpoint: ready for playtesting", minutes: 30, mode: "javascript", objective: "Complete the interface for a playable two-level build.",
        notes: ["A player needs a goal, controls, score and ending they can understand.", "Test with keyboard and touch-friendly buttons where available.", "Fix the biggest point of confusion before adding decoration."],
        exampleTitle: "A useful polish order", exampleCode: "1. Clear controls\n2. Clear goal\n3. Clear feedback\n4. Comfortable motion and sound\n5. Decoration", exampleExplanation: "Understanding and control come before visual extras.",
        question: { prompt: "What should you fix first after a player gets stuck?", options: ["The biggest source of confusion", "The logo size", "An unrelated animation"], answer: 0, explanation: "The main usability problem most affects whether the game can be played." },
        task: "Finish score feedback and the retry event, then save Project Checkpoint 9.", starterCode: "const scoreLabel = document.querySelector(\"#score\");\nconst retryButton = document.querySelector(\"#retry\");\nlet score = 0;\nfunction resetGame() { score = 0; }\n\n// update score text\n// connect retry", requiredCode: ["scoreLabel.textContent", "addEventListener", "resetGame"],
        hints: ["Update the score label first.", "Then listen for the retry click.", "Use scoreLabel.textContent and retryButton.addEventListener."], reflection: "What must a first-time player understand without your help?", evidence: "I can finish a clear and accessible game interface.",
      },
    ],
    checkpoint: { title: "Checkpoint 9: Playtest-ready build", checks: ["Goal and controls are visible", "Score and state changes use text feedback", "Retry works with a button", "Motion and sound have comfortable settings"] },
  },
  {
    id: "showcase",
    number: 10,
    title: "Test, improve and present",
    focus: "Debugging, evaluation, digital safety and communication",
    projectStep: "Turn the working game into a project the learner can confidently show.",
    mentor: "lion",
    lessons: [
      {
        id: "showcase-1", title: "Use the Owl Check", minutes: 22, mode: "javascript", objective: "Debug with evidence instead of random changes.",
        notes: ["The Owl Check is: expected, actual, smallest difference, one change, retest.", "Reproduce the bug before editing so you know how to check the repair.", "Keep a working checkpoint before a risky change."],
        exampleTitle: "A complete bug note", exampleCode: "Expected: third item wins\nActual: score shows 3 but play continues\nDifference: win check is not called\nChange: call checkWin()\nRetest: pass", exampleExplanation: "The note records both the reasoning and the proof of repair.",
        question: { prompt: "What comes after making one repair?", options: ["Make three more changes", "Retest the original problem", "Delete the checkpoint"], answer: 1, explanation: "Retesting shows whether the specific repair worked." },
        task: "Fix the misspelled function call, then record expected and actual results.", starterCode: "function checkWin() {\n  return score === 3;\n}\nlet score = 3;\nchekWin();", requiredCode: ["checkWin();", "score === 3"],
        hints: ["Compare the function definition and call.", "One letter is missing in the call.", "Change chekWin() to checkWin()."], reflection: "What was the smallest difference in the broken code?", evidence: "I can reproduce, repair and retest a bug.",
      },
      {
        id: "showcase-2", title: "Watch two people play", minutes: 28, mode: "javascript", objective: "Collect useful playtest evidence without coaching the player.",
        notes: ["A silent playtest reveals what the interface communicates on its own.", "Record where the player pauses, retries or asks a question.", "A useful change connects directly to an observed problem."],
        exampleTitle: "Observation to improvement", exampleCode: "Observation: both players missed the goal text\nChange: place the goal above the game\nRetest: both players began without asking", exampleExplanation: "The improvement responds to evidence rather than preference.",
        question: { prompt: "Which is an observation rather than an opinion?", options: ["The game feels bad", "The player paused for 12 seconds at the start", "Purple is best"], answer: 1, explanation: "The pause is a specific behaviour that can be recorded." },
        task: "Add a visible goal message that includes the number 3.", starterCode: "const goal = document.querySelector(\"#goal\");\n// tell the player what to collect", requiredCode: ["goal.textContent", "3"],
        hints: ["Use the goal element.", "State the number of items.", "Set goal.textContent to a short message containing 3."], reflection: "What did a tester do, and what will you change because of it?", evidence: "I can turn a playtest observation into an improvement.",
      },
      {
        id: "showcase-3", title: "Share safely and give credit", minutes: 20, mode: "javascript", objective: "Prepare a project description without personal information.",
        notes: ["Use a nickname or project name, not a full name, school, phone number or location.", "Credit assets made by someone else with creator, title, source and licence when known.", "A grown-up should approve any public sharing for this age group."],
        exampleTitle: "A safe project note", exampleCode: "Made by: SkyCoder\nProject: Wildlife Signal Rescue\nAssets: Original shapes and sounds\nPublic sharing: waiting for grown-up approval", exampleExplanation: "The note explains the work without exposing identifying details.",
        question: { prompt: "Which detail should stay private?", options: ["Project title", "School and home location", "Game controls"], answer: 1, explanation: "School and exact location can identify or locate a child." },
        task: "Add a safe creator credit and a grown-up approval reminder.", starterCode: "const credits = document.querySelector(\"#credits\");\n// add a safe credit message", requiredCode: ["credits.textContent", "approval"],
        hints: ["Use a nickname, not a full identity.", "Mention approval before public sharing.", "Set credits.textContent to a message that includes approval."], reflection: "Which details did you deliberately leave out?", evidence: "I can prepare a safe, credited project description.",
      },
      {
        id: "showcase-4", title: "Final build and reflection", minutes: 35, mode: "javascript", objective: "Save and explain the final version of the mission game.",
        notes: ["A finished project meets its success checks and has known limitations recorded.", "A strong explanation covers the goal, one important code idea, one bug and one improvement.", "The final exam checks understanding, but the project proves the skill."],
        exampleTitle: "A concise project explanation", exampleCode: "Goal: collect 3 items and reach the destination\nCode idea: conditions control win and retry\nBug: one item scored twice\nImprovement: clearer goal text after playtesting", exampleExplanation: "Four short points show purpose, knowledge, debugging and evaluation.",
        question: { prompt: "Which evidence best proves coding skill?", options: ["Time spent on the page", "A working project the learner can explain", "Opening every lesson"], answer: 1, explanation: "Working, tested code plus explanation demonstrates both skill and understanding." },
        task: "Complete the final project note and save the showcase version.", starterCode: "const projectNote = {\n  goal: \"\",\n  importantCode: \"\",\n  repairedBug: \"\",\n  improvement: \"\"\n};", requiredCode: ["goal:", "importantCode:", "repairedBug:", "improvement:"],
        hints: ["Use one short sentence for each field.", "Name a real bug you repaired.", "Name a change that came from testing."], reflection: "What can you build now that you could not build at the start?", evidence: "I can present a working project and explain how it improved.",
      },
    ],
    checkpoint: { title: "Checkpoint 10: Showcase version", checks: ["Two playtests are recorded", "At least one bug is repaired with evidence", "Project information is safe and credited", "The learner explains the finished game"] },
  },
];

function unique(values: string[]) {
  return [...new Set(values)];
}

function buildStageActivities(stage: Stage): Lesson[] {
  const sourceLessons = stage.lessons;
  const keyTerms = unique(
    stage.focus
      .split(/,| and /)
      .map((term) => term.trim())
      .filter(Boolean),
  );
  const theoryQuestions = sourceLessons.slice(0, 3).map((lesson) => lesson.question);
  const stageQuiz: PracticeQuestion[] = [
    ...sourceLessons.map((lesson) => lesson.question),
    {
      prompt: `Which result belongs in ${stage.checkpoint.title}?`,
      options: [stage.checkpoint.checks[0], "The activity page was opened", "A decoration changed without a test"],
      answer: 0,
      explanation: `${stage.checkpoint.checks[0]} is one of the practical checks for this stage.`,
    },
  ];

  const theory: Lesson = {
    ...sourceLessons[0],
    id: `${stage.id}-theory`,
    title: `Learn: ${stage.title}`,
    minutes: 18,
    objective: `Understand ${stage.focus.toLowerCase()} before changing the project.`,
    activityType: "theory",
    activityNumber: 1,
    sections: sourceLessons.map((lesson) => ({
      title: lesson.title.replace(/^Checkpoint:\s*/i, "Putting the ideas together"),
      paragraphs: lesson.notes,
      exampleTitle: lesson.exampleTitle,
      exampleCode: lesson.exampleCode,
      exampleExplanation: lesson.exampleExplanation,
    })),
    questions: theoryQuestions,
    keyTerms,
  };

  const workshops = sourceLessons.slice(0, 3).map((lesson, index): Lesson => ({
    ...lesson,
    id: `${stage.id}-workshop-${index + 1}`,
    title: `Build ${index + 1}: ${lesson.title}`,
    activityType: "workshop",
    activityNumber: index + 2,
    steps: [
      `Read the goal: ${lesson.objective}`,
      `Study “${lesson.exampleTitle}” and predict what its instructions will do.`,
      lesson.task,
      "Run the project and compare the game preview with the goal.",
      "Check your work. Read the failed requirement before opening a hint.",
      "Keep the working version and continue to the next build.",
    ],
    requirements: [lesson.evidence, "The required instructions appear in a useful order"],
  }));

  const lab: Lesson = {
    ...sourceLessons[3],
    id: `${stage.id}-checkpoint`,
    title: stage.checkpoint.title,
    activityType: "lab",
    activityNumber: 5,
    requirements: stage.checkpoint.checks,
    steps: [
      "Read every requirement before changing the project.",
      "Plan the smallest change that could satisfy the requirements.",
      "Build and run your solution without copying a finished answer.",
      "Use the automated checks, repair one failed requirement and test again.",
      "Explain one decision before saving this project version.",
    ],
  };

  const review: Lesson = {
    ...sourceLessons[3],
    id: `${stage.id}-review`,
    title: `${stage.title} review`,
    minutes: 10,
    objective: "Bring the important ideas and examples together before the quiz.",
    activityType: "review",
    activityNumber: 6,
    notes: unique(sourceLessons.flatMap((lesson) => lesson.notes)),
    sections: sourceLessons.map((lesson) => ({
      title: lesson.title.replace(/^Checkpoint:\s*/i, "Checkpoint thinking"),
      paragraphs: lesson.notes,
      exampleTitle: lesson.exampleTitle,
      exampleCode: lesson.exampleCode,
      exampleExplanation: lesson.exampleExplanation,
    })),
    keyTerms,
  };

  const quiz: Lesson = {
    ...sourceLessons[3],
    id: `${stage.id}-quiz`,
    title: `${stage.title} quiz`,
    minutes: 8,
    objective: "Answer five questions using only ideas already taught in this stage.",
    activityType: "quiz",
    activityNumber: 7,
    questions: stageQuiz,
    keyTerms,
  };

  return [theory, ...workshops, lab, review, quiz];
}

export const stages: Stage[] = stageSeeds.map((stage) => ({
  ...stage,
  lessons: buildStageActivities(stage),
}));

export const lessons = stages.flatMap((stage) => stage.lessons);

export const finalExam: PracticeQuestion[] = [
  { prompt: "What is an algorithm?", options: ["A set of ordered steps", "A computer picture", "A score"], answer: 0, explanation: "An algorithm is a sequence of instructions for completing a task." },
  { prompt: "Which structure is best for ten identical movements?", options: ["A variable", "A repeat loop", "A title"], answer: 1, explanation: "A loop handles repeated work clearly." },
  { prompt: "What does a variable do?", options: ["Stores a value", "Draws every image", "Turns off the computer"], answer: 0, explanation: "Variables remember values such as score, lives and time." },
  { prompt: "Which is a true-or-false condition?", options: ["Move right", "Is score equal to 3?", "Play sound"], answer: 1, explanation: "The comparison has a true or false answer." },
  { prompt: "What should happen before random code changes?", options: ["Describe expected and actual results", "Delete the project", "Add more hazards"], answer: 0, explanation: "A comparison helps locate the problem." },
  { prompt: "Which JavaScript creates a score variable?", options: ["let score = 0;", "score?", "move(score);"], answer: 0, explanation: "let declares the variable and assigns its starting value." },
  { prompt: "Which line calls a function named resetGame?", options: ["function resetGame", "resetGame();", "let resetGame"], answer: 1, explanation: "The function name followed by parentheses calls it." },
  { prompt: "What is a useful playtest observation?", options: ["I like it", "The player missed the goal text twice", "The game is cool"], answer: 1, explanation: "Specific observed behaviour can guide an improvement." },
  { prompt: "Which feedback is most accessible?", options: ["Colour only", "Text plus a visual change", "A fast flash only"], answer: 1, explanation: "Multiple forms of feedback support more players." },
  { prompt: "Which detail should not appear on a child's public project page?", options: ["Game controls", "Project title", "School and exact location"], answer: 2, explanation: "Identifying and location information should stay private." },
];

export const practicalExam = {
  title: "Repair the final checkpoint",
  brief: "The retry code should restore score to 0 and lives to 3. Repair it and explain your change in one sentence.",
  starterCode: "let score = 3;\nlet lives = 0;\n\nfunction resetGame() {\n  score = 3;\n  lives = 0;\n}\n\nresetGame();",
  requiredCode: ["score = 0", "lives = 3", "resetGame()"],
};

export const courseFacts = {
  title: "Mission Game: From Blocks to JavaScript",
  ageRange: "Ages 10 to 12",
  lessonCount: lessons.length,
  stageCount: stages.length,
  estimatedHours: "20 to 24 hours",
  passMark: 7,
};
