/*
 * Build Outside KidyCode.
 *
 * The in-browser course teaches the language, but a working developer uses a real editor,
 * a real terminal, a real browser inspector and a real version history. This programme
 * moves the learner out of the site in six stations: the files, the editor, the developer
 * tools, version control, GitHub and publishing.
 *
 * The stations are ordered so nothing is introduced before it can be used, and every
 * station names one safety rule, because leaving the browser is the point at which a
 * learner meets real accounts and real links. No station asks a learner for a payment or a
 * personal address, and the publishing station is written for a supervised setting.
 */

export const buildStations = ["files", "editor", "devtools", "git", "github", "publish"] as const;
export type BuildStationId = (typeof buildStations)[number];

export type BuildStation = {
  id: BuildStationId;
  order: number;
  title: string;
  tool: string;
  why: string;
  steps: string[];
  practice: string;
  check: string;
  safety: string;
};

export const buildOutsideProgrammeId = "build-outside" as const;

export type BuildOutsideProgramme = {
  id: typeof buildOutsideProgrammeId;
  title: string;
  kind: "tooling";
  promise: string;
  stations: BuildStation[];
  graduatedFor: "supervised";
};

export const buildOutside: BuildOutsideProgramme = {
  id: buildOutsideProgrammeId,
  title: "Build Outside KidyCode",
  kind: "tooling",
  promise: "Move a working page from the browser editor into real files, a real editor, real developer tools, real version history and a real link, one station at a time.",
  graduatedFor: "supervised",
  stations: [
    {
      id: "files",
      order: 1,
      title: "Files and folders",
      tool: "The file explorer on your own computer",
      why: "A website is a folder of files. Before an editor can help you, you need to find that folder, name the files and see which file the browser is actually loading.",
      steps: [
        "Make one project folder and put index.html, style.css and script.js inside it.",
        "Open the folder in the file explorer and read the three names aloud, matching each to its job.",
        "Change one word of text in index.html, save it and reopen the page to see the change arrive.",
      ],
      practice: "Rename a file, update the link in index.html to match, then reload and confirm the page still works.",
      check: "If the page loads with no styling, which file and which link would you check first, and why?",
      safety: "Keep everything inside one project folder that you can find again, and never store a password or a private document in a project you might share.",
    },
    {
      id: "editor",
      order: 2,
      title: "A real editor",
      tool: "Visual Studio Code",
      why: "An editor shows the whole project at once, highlights mistakes and runs your commands. It is the workshop where the files are actually made.",
      steps: [
        "Open your project folder in the editor so the three files appear in the side panel.",
        "Use the editor's search to find one word across the whole project rather than opening each file.",
        "Turn on the built-in source control panel and the problems panel, and note what each one reports.",
      ],
      practice: "Introduce a deliberate mistake, find it from the problems panel, and repair it without asking for the answer.",
      check: "Which panel would you open first to find a broken bracket, and what would it show you?",
      safety: "Install an editor from its official site only, and decline any extension that asks for access to files outside your project.",
    },
    {
      id: "devtools",
      order: 3,
      title: "Developer tools",
      tool: "The browser's own inspector",
      why: "Developer tools show the page the browser actually built, not the file you wrote. They are how you see a real value, a real style and a real error.",
      steps: [
        "Open the inspector, select one element on the page and read its place in the page outline.",
        "Change one style in the inspector, watch the page respond, then reload and confirm the change was only temporary.",
        "Open the console, read every message, and find the line each one points at.",
      ],
      practice: "Make one element look wrong on purpose, then use only the inspector to work out which rule is winning.",
      check: "Why does a change made in the inspector disappear when the page reloads?",
      safety: "Developer tools are for the page you are building. Never paste a script you do not understand into the console.",
    },
    {
      id: "git",
      order: 4,
      title: "Version control with Git",
      tool: "Git",
      why: "Git keeps every working version of your project so you can see what changed, go back and try something without losing the last good state.",
      steps: [
        "Turn your project folder into a Git repository and record one commit describing the first working version.",
        "Change two files, view the difference between them and the last commit, and describe what moved.",
        "Make a second commit with a message that says what the change was for, not which files changed.",
      ],
      practice: "Break one feature, commit nothing, then return the project to the last good commit and confirm it works again.",
      check: "What should a commit message describe: the files you touched, or the reason for the change?",
      safety: "Commit work, never secrets. A repository is easy to copy, so nothing private belongs in it, even for one commit.",
    },
    {
      id: "github",
      order: 5,
      title: "GitHub",
      tool: "GitHub",
      why: "A remote repository is your project on a server, so it is backed up, shareable and reviewable. It is also how real teams work together without overwriting each other.",
      steps: [
        "Create an account under adult supervision and make one repository for the project.",
        "Connect your local repository and push the commits you already made.",
        "Open the repository's history and read your own commits in the order you made them.",
      ],
      practice: "Make a change on the remote, pull it into your project, and resolve the one difference it creates.",
      check: "What is the difference between committing and pushing?",
      safety: "Use a nickname rather than a full name on a public profile, and keep the school name, a phone number or a home address off a public repository.",
    },
    {
      id: "publish",
      order: 6,
      title: "Publishing a page",
      tool: "A static host",
      why: "Publishing turns a folder on your computer into an address another person can open. It is the moment the work becomes something you can show.",
      steps: [
        "With grown-up supervision, choose a static host and connect the repository you already built.",
        "Publish the project and open the link on a second device to confirm it works.",
        "Check the page at a phone width and at a laptop width, and write down one thing that changed.",
      ],
      practice: "Push one small improvement to the repository and confirm the published page updates from a single link.",
      check: "Why does publishing from the repository beat uploading files by hand?",
      safety: "Publish only work you would show a stranger, never anything with a real name, an address, a photograph of a person or a private link.",
    },
  ],
};

export function buildOutsideIssues(programme: BuildOutsideProgramme = buildOutside): string[] {
  const issues: string[] = [];
  const orders = programme.stations.map((station) => station.order);
  if (new Set(orders).size !== orders.length || Math.min(...orders) !== 1 || Math.max(...orders) !== programme.stations.length) {
    issues.push("the stations must be ordered 1 to 6 without gaps.");
  }
  for (const id of buildStations) {
    if (!programme.stations.some((station) => station.id === id)) issues.push(`the ${id} station is missing.`);
  }
  for (const station of programme.stations) {
    if (station.steps.length < 3) issues.push(`${station.id}: a station needs at least three steps.`);
    if (station.why.trim().length < 40) issues.push(`${station.id}: say why the tool is introduced now.`);
    if (station.practice.trim().length < 30) issues.push(`${station.id}: give the station a practice task.`);
    if (station.safety.trim().length < 40) issues.push(`${station.id}: every station names one safety rule.`);
  }
  return issues;
}
