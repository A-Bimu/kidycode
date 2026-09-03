(function () {
  const stages = [
    {
      id: 'computer-thinking', number: 1, title: 'Think like a computer', short: 'Notice the steps behind everyday actions.',
      mentor: 'Fara the Fox', mentorKey: 'fox', mentorLine: 'A good plan is small enough to test.', sessions: 8,
      outcome: 'Explain what a program does, spot input and output, break up a task and predict a result.',
      make: 'Teach a robot to complete an everyday mission.', badge: 'Fox Planner', mode: 'scenario',
      lessons: [
        ['You Are the Programmer', 'Programs control actions', 'Who Is Giving the Instructions?', 'Write one action chosen by a person, one action carried out by a machine and the instruction that connects them.'],
        ['Input, Work, Output', 'Input, processing and output', 'Build the Snack Machine', 'Describe what goes into a snack machine, what the machine does and what comes out.'],
        ['The Fussy Robot', 'Precise instructions', 'Make the Sandwich', 'Write each tiny action a robot would need to make a sandwich. Do not let it guess.'],
        ['Break Up a Big Job', 'Decomposition', 'Pack for School', 'Split packing for school into three smaller jobs and list the steps inside each one.'],
        ['Find the Pattern', 'Pattern recognition', 'Tile Detective', 'Write the next four items in the pattern: purple, navy, navy, purple, navy, navy.'],
        ['Predict Before You Run', 'Prediction and testing', 'Where Will Fox Stop?', 'Read the route, predict the finishing square and explain how you traced it.'],
        ['The Missing Step', 'First debugging', 'Repair the Morning Routine', 'Find the missing step between waking up and leaving home. Add it in the correct place.']
      ],
      project: ['Teach a robot', ['Get ready for school', 'Prepare a simple snack', 'Organise football practice', 'Guide a robot through a room'], ['Write at least eight ordered steps', 'Split one step into a smaller job', 'Predict the result before testing', 'Record one change after a test']]
    },
    {
      id: 'sequences', number: 2, title: 'Sequences and instructions', short: 'Put exact commands in an order that works.',
      mentor: 'Fara the Fox', mentorKey: 'fox', mentorLine: 'Order changes the result. Trace one line at a time.', sessions: 8,
      outcome: 'Create, trace, compare and repair ordered algorithms.', make: 'Build a delivery trail through a chosen world.', badge: 'Sequence Scout', mode: 'commands',
      lessons: [
        ['First, Next, Last', 'Sequence order', 'Mixed-Up Mission', 'Reorder the four commands so Kito reaches the parcel before returning home.'],
        ['One Command, One Action', 'Command precision', 'Robot Translator', 'Replace the vague command go over there with exact move and turn commands.'],
        ['Move and Turn', 'Direction commands', 'Cross the Courtyard', 'Use move() and turnRight() to reach the far gate.'],
        ['Plan Before Blocks', 'Pseudocode', 'Write the Route', 'Write the route in plain words first. Then turn each step into one command.'],
        ['Two Ways to Arrive', 'Comparing algorithms', 'Which Path Works?', 'Trace both routes. Keep the route that arrives and explain why the other route misses.'],
        ['Trace Every Step', 'Manual tracing', 'Finger Trace', 'Add a position note after every command so another learner can follow the route.'],
        ['Wrong Order Bug', 'Sequence debugging', 'Rescue the Parcel', 'Move the two misplaced commands until the parcel reaches the lab.']
      ],
      project: ['Delivery trail', ['Forest trail', 'Moon base', 'Busy city', 'Ocean floor'], ['Use ten or more commands', 'Include at least one turn', 'Write a plan before the commands', 'Test two different routes']]
    },
    {
      id: 'events', number: 3, title: 'Events and movement', short: 'Make characters respond to starts, keys and clicks.',
      mentor: 'Bina the Butterfly', mentorKey: 'butterfly', mentorLine: 'An event is the signal that tells an action to begin.', sessions: 8,
      outcome: 'Use start, click, keyboard, message and collision events to control a scene.', make: 'Create an interactive animal parade.', badge: 'Event Starter', mode: 'commands',
      lessons: [
        ['What Starts the Action?', 'Events', 'Match the Trigger', 'Pair each action with its trigger: start, click, key press or touching.'],
        ['Start the Scene', 'Start events', 'Wake the Animals', 'Use whenStart three times so three animals begin together.'],
        ['Position and Direction', 'Coordinates and direction', 'Place the Parade', 'Change the x and y positions so the animals stand on their marked spots.'],
        ['Press to Move', 'Keyboard events', 'Guide the Butterfly', 'Add up, down, left and right key events to move the butterfly.'],
        ['Click for a Surprise', 'Click events', 'Secret Origami', 'Make the folded shape reveal its animal when clicked or when Enter is pressed.'],
        ['Send a Message', 'Events between characters', 'Pass the Signal', 'Broadcast paradeTime so the elephant moves after the fox.'],
        ['Too Many Starts', 'Event debugging', 'Calm the Stage', 'Remove the duplicate trigger that starts the dance twice.']
      ],
      project: ['Interactive animal parade', ['Animal parade', 'Musical forest', 'Space greeting card', 'Interactive sports scene'], ['Use a start event', 'Add a keyboard or click event', 'Control two characters', 'Send one message between characters']]
    },
    {
      id: 'loops', number: 4, title: 'Loops and patterns', short: 'Repeat useful work without repeating yourself.',
      mentor: 'Chui the Cheetah', mentorKey: 'cheetah', mentorLine: 'Fast code is not rushed code. It removes work you do not need.', sessions: 8,
      outcome: 'Choose counted, continuous and nested loops for different jobs.', make: 'Turn a repeating pattern into motion.', badge: 'Loop Sprinter', mode: 'commands',
      lessons: [
        ['Spot the Repetition', 'Repeated instructions', 'Circle the Pattern', 'Mark the commands that repeat and name the smallest repeating group.'],
        ['Repeat a Number of Times', 'Counted loops', 'Four-Step Dance', 'Replace four copies of step() with repeat(4).'],
        ['Keep It Moving', 'Continuous loops', 'Flying Butterfly', 'Use forever so the butterfly keeps moving until Stop is pressed.'],
        ['Stop at the Right Time', 'Loop control', 'Cheetah Training', 'Choose repeat or forever for each action and explain the choice.'],
        ['A Loop Inside a Loop', 'Nested loops', 'Pattern Cloth', 'Use one loop for rows and one loop for shapes in each row.'],
        ['Make It Shorter', 'Efficient code', 'Block Clean-Up', 'Shorten the program without changing what it does.'],
        ['The Runaway Loop', 'Loop debugging', 'Catch the Spinner', 'Repair the loop so the spinner stops after six turns.']
      ],
      project: ['Pattern in motion', ['Dance routine', 'Animated night sky', 'Geometric pattern art', 'Patrol route'], ['Use one counted loop', 'Use a continuous or nested loop', 'Add a Stop or Reset control', 'Compare the block count before and after']]
    },
    {
      id: 'variables', number: 5, title: 'Variables and memory', short: 'Give changing information a clear name.',
      mentor: 'Ella the Elephant', mentorKey: 'elephant', mentorLine: 'A variable remembers one value under a useful label.', sessions: 8,
      outcome: 'Name, set, change, display and reset variables.', make: 'Build a quiz, tracker, tally or virtual pet.', badge: 'Memory Keeper', mode: 'commands',
      lessons: [
        ['A Labelled Memory Box', 'Variable names', 'Name the Boxes', 'Rename box1 and thing so each name tells us what it remembers.'],
        ['Set a Starting Value', 'Initial values', 'Prepare the Scoreboard', 'Set score to 0, lives to 3 and playerName to a safe nickname.'],
        ['Change What Is Remembered', 'Updating variables', 'Collect the Stars', 'Add 1 to score each time a star is collected.'],
        ['Words Can Be Stored Too', 'Text values', 'Welcome Sign', 'Store a nickname and show it in a welcome message.'],
        ['More Than One Memory', 'Multiple variables', 'Pet Care', 'Change hunger without changing happiness, then change happiness.'],
        ['Reset and Try Again', 'Resetting state', 'New Round', 'Return score, lives and timer to their starting values.'],
        ['The Mystery Score', 'Variable debugging', 'Fix the Scoreboard', 'Fix the starting value and the update that gives ten points instead of one.']
      ],
      project: ['Make memory useful', ['Mini quiz with score', 'Virtual pet meter', 'Snack shop tally', 'Reading goal tracker'], ['Create two clearly named variables', 'Set starting values', 'Change values after an action', 'Add a Reset control']]
    },
    {
      id: 'conditions', number: 6, title: 'Conditions and decisions', short: 'Make code choose what happens next.',
      mentor: 'Fara and Odi', mentorKey: 'fox', mentorLine: 'Ask a question the computer can answer with true or false.', sessions: 8,
      outcome: 'Use comparisons, if, if/else, sensing, AND and OR.', make: 'Build a decision machine with more than one outcome.', badge: 'Decision Maker', mode: 'commands',
      lessons: [
        ['True or False?', 'Boolean statements', 'Truth Sorter', 'Sort each statement into true, false or not enough information.'],
        ['If This Happens', 'If conditions', 'Open the Gate', 'Open the gate only if the key has been collected.'],
        ['This or That', 'If and else', 'Weather Outfit', 'Show one outfit if it is raining and another if it is not.'],
        ['Touching and Sensing', 'Collision conditions', 'Avoid the Rocks', 'Lose one life only when the player touches a rock.'],
        ['Compare a Variable', 'Comparisons', 'Score Door', 'Unlock the door when score is 10 or higher.'],
        ['Two Things Must Be True', 'AND and OR', 'Safe Crossing', 'Allow crossing when the light is safe AND the road is clear.'],
        ['The Backwards Decision', 'Condition debugging', 'Repair the Gatekeeper', 'Correct the comparison and put the messages in the right branches.']
      ],
      project: ['Decision machine', ['Fictional password practice', 'Choose-your-path quiz', 'Animal habitat sorter', 'Treasure detector'], ['Use one if statement', 'Use one if/else statement', 'Create two possible outcomes', 'Test four different inputs']]
    },
    {
      id: 'debugging', number: 7, title: 'Debugging', short: 'Use the Owl Check to turn bugs into clues.',
      mentor: 'Odi the Owl', mentorKey: 'owl', mentorLine: 'Expected. Actual. Smallest difference. One careful change.', sessions: 9,
      outcome: 'Reproduce, describe, trace, isolate, repair and retest a bug.', make: 'Repair five bugs in a broken project.', badge: 'Bug Detective', mode: 'commands',
      lessons: [
        ['Bugs Are Clues', 'Bug types', 'Name the Bug Type', 'Match each symptom to a sequence, event, loop, variable or condition bug.'],
        ['Make It Happen Again', 'Reproduction', 'Repeat the Problem', 'Write the exact actions that make the bug appear every time.'],
        ['Expected and Actual', 'Describing behaviour', 'Spot the Difference', 'Write what should happen and what actually happens.'],
        ['Trace the Program', 'Step tracing', 'Follow the Blocks', 'Record the value after each command and mark the first incorrect value.'],
        ['Test a Smaller Piece', 'Isolation', 'Switch Off the Noise', 'Temporarily remove unrelated parts until only the bug remains.'],
        ['Change One Thing', 'Controlled repair', 'One-Fix Rule', 'Choose one edit, predict its effect and test before changing anything else.'],
        ['Retest and Explain', 'Regression testing', 'Did We Really Fix It?', 'Run one normal case and two edge cases after the repair.'],
        ['Mixed Bug Workshop', 'Full Owl Check', "Owl's Repair Bench", 'Repair one event bug, one variable bug and one condition bug.']
      ],
      project: ['Repair shop', ['Broken story', 'Broken animation', 'Broken catch game'], ['Record reproduction steps', 'Write expected and actual results', 'Save a version before each repair', 'Repair five seeded bugs']]
    },
    {
      id: 'stories', number: 8, title: 'Interactive stories', short: 'Let the reader change what happens.',
      mentor: 'Bina the Butterfly', mentorKey: 'butterfly', mentorLine: 'A choice matters when it changes the story.', sessions: 8,
      outcome: 'Combine scenes, dialogue, events, variables and conditions in a branching story.', make: 'Create a story with choices and two endings.', badge: 'Story Weaver', mode: 'commands',
      lessons: [
        ['A Story Has a Shape', 'Branching structure', 'Build the Story Map', 'Plan a beginning, a problem, one choice and two endings.'],
        ['Change the Scene', 'Scene transitions', 'From Forest to River', 'Switch from the forest backdrop to the river backdrop after the signal.'],
        ['Let Characters Speak', 'Dialogue timing', 'Conversation Fixer', 'Order the dialogue so two characters do not speak over each other.'],
        ['Give the Reader a Choice', 'User input and branches', 'Choose the Door', 'Create two buttons or keys that lead to different scenes.'],
        ['Remember the Choice', 'Story state', 'Carry the Clue', 'Store the chosen clue and use it in a later scene.'],
        ['Bring the World to Life', 'Looped motion and sound', 'Living Background', 'Add gentle repeated movement and a sound-off control.'],
        ['Make It Easy to Follow', 'Story accessibility', 'Story Comfort Check', 'Improve text size, timing, controls, contrast and sound alternatives.']
      ],
      project: ['Branching story', ['Animal adventure', 'School mystery', 'Future city', 'Retold folktale in your own words'], ['Create at least three scenes', 'Add two meaningful choices', 'Build two endings', 'Revise after one family or peer test']]
    },
    {
      id: 'games', number: 9, title: 'Game development', short: 'Turn controls and rules into a fair challenge.',
      mentor: 'Chui the Cheetah', mentorKey: 'cheetah', mentorLine: 'The best speed is the speed a player can understand.', sessions: 9,
      outcome: 'Build a complete game with controls, collisions, score, states and playtesting.', make: 'Create a mini-game another person can play.', badge: 'Game Maker', mode: 'commands',
      lessons: [
        ['Goal, Rules, Feedback', 'Game systems', 'Is It a Game Yet?', 'Find the missing goal, rule or feedback in each tiny game.'],
        ['Control the Player', 'Responsive input', 'Movement Lab', 'Create four controls that move at the same predictable speed.'],
        ['Touch, Collect, Avoid', 'Collision behaviour', 'Three Collisions', 'Add one collect action, one obstacle reaction and one goal reaction.'],
        ['Keep Score', 'Score variables', 'Fair Points', 'Award one point per object and stop repeat scoring during one collision.'],
        ['Lives and Time', 'Challenge variables', 'Stay in the Game', 'Add lives or a timer and reset it when a new round starts.'],
        ['Start, Play, Finish', 'Game states', 'State Switcher', 'Build start, playing, win and lose states.'],
        ['Make It Fair', 'Difficulty and feedback', 'Too Easy, Too Hard', 'Change one speed, size or timer value after a playtest.'],
        ['Watch Someone Play', 'Playtesting', 'Silent Test', 'Watch someone play without explaining. Record where they pause or get stuck.']
      ],
      project: ['Complete mini-game', ['Catch game', 'Dodge game', 'Maze game', 'Collect and deliver'], ['Show clear instructions', 'Use keyboard and visible touch controls', 'Add score plus win and lose states', 'Make two revisions after playtests']]
    },
    {
      id: 'web', number: 10, title: 'Web foundations', short: 'Build a page that works on phones and computers.',
      mentor: 'Bina the Butterfly', mentorKey: 'butterfly', mentorLine: 'Design helps people know where to look and what to do.', sessions: 9,
      outcome: 'Create an accessible responsive webpage with HTML and CSS.', make: 'Build a one-page website about a safe topic.', badge: 'Web Builder', mode: 'html',
      lessons: [
        ['What Makes a Webpage?', 'Browser, HTML and CSS', 'Label the Page', 'Add a comment that explains the job of HTML and the job of CSS.'],
        ['Give the Page Structure', 'HTML document structure', 'Repair the Skeleton', 'Add the missing main, heading and paragraph elements.'],
        ['Headings and Paragraphs', 'Semantic text', 'Make It Readable', 'Use one h1, useful h2 headings and short paragraphs.'],
        ['Links and Safe Images', 'Links, images and alt text', 'Complete the Animal Card', 'Add a safe link and useful alt text to the supplied image.'],
        ['Style with CSS', 'Selectors and declarations', 'Design the Card', 'Change the type, colour, spacing and border using CSS.'],
        ['Boxes and Layout', 'Box model and flex', 'Arrange the Gallery', 'Use flex so the cards wrap instead of leaving the screen.'],
        ['Work on Small Screens', 'Responsive design', 'Phone Check', 'Add a small-screen rule and make every button easy to tap.'],
        ['Find the Web Bug', 'HTML and CSS debugging', 'Broken Page Clinic', 'Fix one nesting bug, one selector bug and one contrast problem.']
      ],
      project: ['My first website', ['Favourite subject guide', 'Animal facts', 'Hobby showcase', 'Community helper profile'], ['Use one main heading and logical subheadings', 'Create at least two sections', 'Add an image with useful alt text', 'Test phone and desktop layouts']]
    },
    {
      id: 'javascript', number: 11, title: 'JavaScript introduction', short: 'Meet familiar coding ideas in text form.',
      mentor: 'Ella and Odi', mentorKey: 'elephant', mentorLine: 'The symbols look new. The ideas are ones you already know.', sessions: 9,
      outcome: 'Read and modify variables, functions, events, conditions and loops in JavaScript.', make: 'Build a small interactive web toy.', badge: 'JavaScript Starter', mode: 'javascript',
      lessons: [
        ['Same Idea, New Outfit', 'Blocks to text', 'Match Block to Code', 'Write a comment that pairs repeat, set variable and if blocks with JavaScript.'],
        ['Make JavaScript Speak', 'Strings and output', 'Finish the Message', 'Change the message inside console.log and show it on the page.'],
        ['Memory in Text Code', 'let, const and values', 'Build the Score Variable', 'Declare score, add one and display the new value.'],
        ['Give a Job a Name', 'Functions', 'Call the Greeting', 'Complete the greet function and call it once.'],
        ['Listen for a Click', 'DOM events', 'Wake the Button', 'Attach a click listener that changes the result text.'],
        ['Make a Choice', 'JavaScript if and else', 'Mood Card', 'Use if and else to show one of two messages.'],
        ['Repeat Through a List', 'Arrays and for of', 'Animal Roll Call', 'Use for...of to display every animal in the supplied list.'],
        ['Read the Error', 'Syntax and runtime errors', 'Text Code Clinic', 'Fix one bracket, one spelling and one value error.']
      ],
      project: ['Interactive web toy', ['Compliment generator', 'Creature click counter', 'Three-question quiz', 'Drawing prompt generator'], ['Use one variable', 'Create and call one function', 'Add one event listener', 'Use one condition or list loop']]
    },
    {
      id: 'safety-ai', number: 12, title: 'Digital safety and responsible AI', short: 'Protect people, check claims and credit help.',
      mentor: 'Odi and Fara', mentorKey: 'owl', mentorLine: 'Pause before sharing. Check before trusting.', sessions: 10,
      outcome: 'Protect private information, make safe sharing choices, verify claims and recognise unfair results.', make: 'Create a safe creator guide.', badge: 'Safe Digital Creator', mode: 'scenario', mandatory: true,
      lessons: [
        ['Private or Shareable?', 'Personal data', 'Information Sort', 'Sort nickname, password, favourite colour, school location and home address into safe, private or ask an adult.'],
        ['Strong Account Habits', 'Account safety', 'Protect the Account', 'Choose the safest fictional password and explain why reuse is risky.'],
        ['Pause Before Posting', 'Audience and permanence', 'Who Can See This?', 'Choose a safe audience for three sample projects.'],
        ['Use What You Are Allowed to Use', 'Copyright and attribution', 'Credit the Creator', 'Write a credit with creator, asset title, source and licence.'],
        ['What AI Actually Does', 'AI patterns and limits', 'Machine or Person?', 'Correct three claims about what an AI system knows and understands.'],
        ['Keep Private Things Out', 'Prompt privacy', 'Clean the Prompt', 'Remove the name, school, phone number and exact location from the sample prompt.'],
        ['Check Before Trusting', 'Verification', 'Two Sources', 'Compare the supplied AI answer with two supplied sources and mark the unsupported claim.'],
        ['Fairness and Missing Views', 'Bias', 'Who Was Left Out?', 'Find whose experience is missing from the sample recommendation.'],
        ['Say How You Got Help', 'Attribution', 'Help Note', 'Write one sentence that says what a tool helped with and what you checked yourself.']
      ],
      project: ['Safe creator guide', ['Interactive safety quiz', 'Responsible AI comic', 'Sharing decision tree', 'Creator credit guide'], ['Teach one private-information rule', 'Show one verification method', 'Include one bias example', 'Ask a grown-up to review it']]
    },
    {
      id: 'capstone', number: 13, title: 'Final project and showcase', short: 'Plan, build, test and explain something original.',
      mentor: 'Leo the Lion', mentorKey: 'lion', mentorLine: 'Confidence comes from work you can explain and improve.', sessions: 12,
      outcome: 'Independently plan, build, test, improve and privately present an original product.', make: 'Complete a story, game or interactive webpage.', badge: 'KidyCode Creator', mode: 'capstone', mandatory: true,
      lessons: [
        ['Choose What to Make', 'Project choice', 'Pick the Format', 'Choose an interactive story, mini-game or interactive webpage and explain why it fits your idea.'],
        ['Choose Who It Helps', 'User and need', 'Meet the User', 'Describe one safe, non-identifying user and the need your project will meet.'],
        ['Write the Project Promise', 'Purpose', 'One Clear Sentence', 'Finish: My project helps ___ to ___ by ___.'],
        ['Draw the Plan', 'Visual planning', 'Map the Build', 'Describe each screen, scene or game area before you start coding.'],
        ['Choose the Success Checks', 'Acceptance criteria', 'How Will I Know?', 'Write four things a tester must be able to see or do.'],
        ['Build Version One', 'Small working core', 'Make the Smallest Version', 'Build only the main action first and save it as Version 1.'],
        ['Add the Main Features', 'Combining concepts', 'Use Your Toolkit', 'Add at least two concepts from earlier stages.'],
        ['Test with Two People', 'Observation', 'Watch and Record', 'Record what two testers tried, where they paused and what they expected.'],
        ['Run the Owl Check', 'Debugging evidence', 'Repair with Evidence', 'Record and repair at least two bugs using expected and actual results.'],
        ['Improve the Experience', 'Usability and accessibility', 'Make It Easier', 'Make one usability change and one accessibility change.'],
        ['Explain the Code', 'Technical explanation', 'Show How It Works', 'Explain one important part of the code in your own words.'],
        ['Prepare the Showcase', 'Private presentation', 'Ready to Share Safely', 'Add a title, controls, credits and reflection. Keep the showcase private until a grown-up approves.']
      ]
    }
  ];

  const modeStarters = {
    scenario: [
      'My answer:\n\nWhat I predict:\n\nWhat I tested:\n',
      'Input:\nProcess:\nOutput:\n',
      'First:\nNext:\nThen:\nFinally:\n'
    ],
    commands: [
      'whenStart {\n  move()\n  move()\n}\n',
      'whenKey("right") {\n  move()\n}\n',
      'set score = 0\nwhenTouch("star") {\n  change score by 1\n}\n',
      'repeat(4) {\n  move()\n  turnRight()\n}\n'
    ],
    html: [
      '<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; background: #f7f3ea; color: #111936; padding: 2rem; }\n  .card { border: 3px solid #4b1768; padding: 1rem; max-width: 32rem; }\n</style>\n</head>\n<body>\n  <main class="card">\n    <h1>My first page</h1>\n    <p>Change this page to complete the task.</p>\n  </main>\n</body>\n</html>',
      '<!doctype html>\n<html>\n<head>\n<style>\n  body { font-family: system-ui; padding: 2rem; background: #f7f3ea; color: #111936; }\n  .gallery { display: flex; flex-wrap: wrap; gap: 1rem; }\n  .card { width: 12rem; padding: 1rem; border: 2px solid #4b1768; }\n</style>\n</head>\n<body>\n  <h1>Animal gallery</h1>\n  <section class="gallery">\n    <article class="card"><h2>Fox</h2><p>Plans the route.</p></article>\n    <article class="card"><h2>Elephant</h2><p>Remembers values.</p></article>\n  </section>\n</body>\n</html>'
    ],
    javascript: [
      '<!doctype html>\n<html>\n<body style="font-family:system-ui;background:#f7f3ea;color:#111936;padding:2rem">\n  <h1>JavaScript lab</h1>\n  <button id="action">Try it</button>\n  <p id="result">Waiting for your code.</p>\n  <script>\n    const button = document.querySelector("#action");\n    const result = document.querySelector("#result");\n    let score = 0;\n    button.addEventListener("click", () => {\n      score = score + 1;\n      result.textContent = "Score: " + score;\n    });\n  <\/script>\n</body>\n</html>',
      '<!doctype html>\n<html>\n<body style="font-family:system-ui;background:#f7f3ea;color:#111936;padding:2rem">\n  <h1>Animal roll call</h1>\n  <ul id="result"></ul>\n  <script>\n    const animals = ["Fox", "Elephant", "Butterfly"];\n    const list = document.querySelector("#result");\n    for (const animal of animals) {\n      list.innerHTML += `<li>${animal}<\/li>`;\n    }\n  <\/script>\n</body>\n</html>'
    ],
    capstone: [
      'Project title:\n\nWho it helps:\n\nMy project helps ___ to ___ by ___.\n\nFour success checks:\n1.\n2.\n3.\n4.\n',
      'Version note:\n\nWhat works now:\n\nWhat I will build next:\n',
      'Test record:\nExpected:\nActual:\nOne change:\nRetest result:\n'
    ]
  };

  const predictPrompts = {
    scenario: 'What answer do you expect before you test or compare it?',
    commands: 'Point to the first command that will run. What should change on screen?',
    html: 'Which part of the page will change when you edit the highlighted HTML or CSS?',
    javascript: 'What will the browser show after this code runs?',
    capstone: 'What will a tester be able to do when this step is finished?'
  };

  const signals = {
    scenario: [], commands: ['when', 'move', 'repeat', 'set', 'if', 'test', 'first'],
    html: ['<', '>', 'style', 'h1', 'main'], javascript: ['script', 'const', 'let', 'function', 'addEventListener', 'if', 'for'],
    capstone: []
  };

  function slug(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function makeLesson(stage, item, index) {
    const mode = stage.mode;
    const starterList = modeStarters[mode];
    const starter = starterList[index % starterList.length];
    return {
      id: `s${String(stage.number).padStart(2, '0')}l${String(index + 1).padStart(2, '0')}`,
      stageId: stage.id,
      order: index + 1,
      title: item[0],
      focus: item[1],
      challenge: item[2],
      task: item[3],
      time: index % 3 === 0 ? 7 : index % 3 === 1 ? 9 : 11,
      kind: stage.number === 7 ? 'Bug Detective' : mode === 'scenario' ? 'Think and test' : mode === 'capstone' ? 'Capstone mission' : 'Code mission',
      mode,
      goal: `Use ${item[1].toLowerCase()} to complete ${item[2]}.`,
      concept: `${item[1]} means making one clear idea visible in the program. Change one thing, run it and compare the result with your prediction.`,
      predict: predictPrompts[mode],
      starter,
      signals: signals[mode],
      minChars: mode === 'scenario' || mode === 'capstone' ? 45 : 20,
      hints: [
        `Nudge: focus on ${item[1].toLowerCase()}. Say the goal in your own words first.`,
        `Look here: find the smallest line or step connected to ${item[2]}.`,
        `One step: change a single instruction, run it and compare expected with actual. Do not rebuild everything at once.`
      ],
      extension: `Stretch it: add one safe detail of your own, then explain why it improves the result.`
    };
  }

  stages.forEach((stage) => {
    stage.lessons = stage.lessons.map((item, index) => makeLesson(stage, item, index));
    if (stage.project) {
      const [title, choices, requirements] = stage.project;
      stage.lessons.push({
        id: `s${String(stage.number).padStart(2, '0')}p01`, stageId: stage.id, order: stage.lessons.length + 1,
        title, focus: `${stage.title} project`, challenge: 'Boss project', task: `Choose one: ${choices.join(', ')}. Build the smallest working version first.`,
        time: 12, kind: 'Boss project', mode: stage.mode, goal: stage.make,
        concept: `This project brings the whole stage together. Your evidence is the working build, a test record and an explanation.`,
        predict: 'Which requirement will be easiest to test? Which one may need more than one attempt?',
        starter: modeStarters[stage.mode][0], signals: signals[stage.mode], minChars: 60,
        choices, requirements,
        hints: [
          `Nudge: choose one idea and circle the most important action.`,
          `Look here: build only the first requirement before adding the others.`,
          `One step: make a tiny version with one input and one visible result, then test it.`
        ],
        extension: 'Remix it with a different theme without replacing your original.'
      });
    }
  });

  window.KIDYCODE_COURSE = {
    id: 'code-explorers-10-12',
    title: 'Code Explorers',
    ages: '10 to 12',
    version: '1.0.0',
    stages,
    badges: [
      ['Fox Planner', 'Complete Stage 1 with a plan, test and revision.'],
      ['Sequence Scout', 'Build and trace a working route.'],
      ['Event Starter', 'Make a scene respond to more than one event.'],
      ['Loop Sprinter', 'Choose and explain two useful loops.'],
      ['Memory Keeper', 'Build with named values that change and reset.'],
      ['Decision Maker', 'Test both sides of a decision.'],
      ['Bug Detective', 'Complete an independent Owl Check.'],
      ['Story Weaver', 'Build and test a story with two endings.'],
      ['Game Maker', 'Ship a playable game after two playtests.'],
      ['Web Builder', 'Build a responsive and accessible webpage.'],
      ['JavaScript Starter', 'Connect familiar blocks to working text code.'],
      ['Safe Digital Creator', 'Make safe sharing and verification choices.'],
      ['KidyCode Creator', 'Pass the final project mastery check.'],
      ['Brave Tester', 'Record ten meaningful tests.'],
      ['Helpful Explainer', 'Complete five explanation checkpoints.'],
      ['Remix Maker', 'Save an original remix without replacing the source.'],
      ['Accessibility Ally', 'Pass five accessibility checks.'],
      ['Independent Builder', 'Complete a boss project without Hint 3.']
    ],
    weeklyChallenge: {
      title: 'Pattern with a surprise',
      brief: 'Make a repeating pattern using movement, sound, words or colour. Change one part on the final repeat.'
    }
  };
})();
