import type { LessonScript } from "@/lib/lesson-scripts";

/*
 * Ages 16 to 18, the JavaScript half of the remaining content batch.
 *
 * Six challenge lessons that had no six-moment script: sorting a copy, updating
 * one record by id, removing a record predictably, the asynchronous request,
 * the failure path with cleanup, and the stale result guard.
 *
 * The wording is written for a learner who will ship this code: a mutation is
 * treated as a defect with a symptom, an unhandled rejection as a state the
 * visitor will meet, and a race between two requests as a real failure mode
 * rather than a theoretical one. Every script carries the guided, balanced and
 * independent wording, a fresh task with its own checks, and two
 * misconception-specific hints with proved detectors.
 */

export const developerJavascriptScripts: LessonScript[] = [
  {
    lessonId: "ages-16-18-javascript-sort",
    courseIds: ["ages-16-18"],
    concept: "Sorting is a mutating operation, so ordering a collection is always done on a copy rather than on the source array.",
    make: "The learner derives an ordered playlist from a copied array using a numeric comparison.",
    difficulty: 3,
    prerequisites: ["ages-16-18-javascript-filter"],
    projectStep: "The project can present its records in a chosen order without disturbing the order the data arrived in, which the sorting control on the project page depends on.",
    stages: {
      hook: {
        lead: "A page offers a sort control and it works. Two days later the same list appears in the wrong order on a different screen, and nothing there mentions sorting at all. The sort itself was correct. What did it change that it should not have?",
        variants: {
          guided: "Sorting a list rearranges the list it is given. Today you order a copy so the original list is untouched.",
          balanced: "One array can be read by several parts of a page. A mutation is therefore a change that reaches somewhere you are not looking.",
          independent: "Treat the source array as read-only. Every derived order, filter or selection is built from a copy.",
        },
      },
      model: {
        lead: "const orderedTracks = [...tracks].sort(function (a, b) { return b.plays - a.plays; }); takes a shallow copy first and sorts that copy from the most played track to the least. The comparison returns a number, and a descending order swaps the two operands.",
        variants: {
          guided: "Read it as two steps: copy the array, then sort the copy. The original array is never named after the copy exists.",
          balanced: "Sort compares pairs and moves them according to the number you return, so the order of the subtraction decides the final direction.",
          independent: "A comparator receives two items and answers one question about their order. Anything else it does is a side effect waiting to cause a defect.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the copy first and run the page while checking that the original order is unchanged, then add the comparison.",
        variants: {
          guided: "Start with the spread copy, then call sort on it, then return the difference between the two play counts.",
          balanced: "Build the copy and the sort on one line, because a copy that is never sorted helps nobody.",
          independent: "Decide the direction of the order before typing, then state it in the comparison so the reader can check it.",
        },
      },
      check: {
        lead: "Read the original array after sorting. It must be in its original order. Then read the new array and confirm the most played track is first and the least played is last.",
        variants: {
          guided: "Check the first item of the copy is the track with the largest play count.",
          balanced: "Check both arrays separately, since the defect shows up in the array you did not intend to change.",
          independent: "Test the boundary case: two tracks with the same play count should keep a stable and predictable position.",
        },
      },
      explain: {
        lead: "Now a different collection: a playlist whose tracks carry a play count, and a request for the most played track to appear first. No example open. Produce an ordered copy without changing the source array.",
        variants: {
          guided: "The new array needs the same two steps: a copy, then a sort with a numeric comparison.",
          balanced: "Same pattern, new data. Read the field you are ordering by before deciding the subtraction.",
          independent: "Work with no example open and decide the direction from the wording of the request alone.",
        },
      },
      transfer: {
        lead: "The project's lists are read by more than one part of the page, so any ordering it offers is derived from a copy rather than applied to the records themselves.",
        variants: {
          independent: "A derived copy also makes the order undoable, because the original collection is still available when the control is reset.",
          guided: "Your project's sort controls will each order a copy.",
          balanced: "Keeping the source order intact is what makes a second ordering possible at all.",
        },
      },
    },
    mastery: {
      freshTask: "A playlist holds tracks with a play count. Produce a new array named orderedTracks containing a copy of the playlist ordered from the most played track to the least, leaving the original array in its original order.",
      observable: "The new array opens with the most played track, and the original array still lists its tracks in the order they were declared.",
      reflection: "In your own words, why does ordering a collection require a copy, and what symptom appears later when the copy is forgotten?",
      starterFiles: {
        html: "<p>The playlist order is shown below.</p>",
        css: "",
        javascript: "const tracks = [\n  { title: \"Warm up\", plays: 4 },\n  { title: \"Finale\", plays: 12 },\n];\n// Copy the playlist and order the copy",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "A copy is taken before sorting", pattern: "\\[\\s*\\.\\.\\.tracks\\s*\\]" },
        { file: "javascript", label: "The copy is the array that gets sorted", pattern: "\\.sort\\s*\\(" },
        { file: "javascript", label: "The comparison orders by play count", pattern: "b\\.plays\\s*-\\s*a\\.plays" },
        { file: "javascript", label: "The ordered result is stored on its own", pattern: "(?:const|let)\\s+orderedTracks\\s*=" },
      ],
      workedSolution: {
        html: "<p>The playlist order is shown below.</p>",
        css: "",
        javascript: "const tracks = [\n  { title: \"Warm up\", plays: 4 },\n  { title: \"Finale\", plays: 12 },\n];\n\nconst orderedTracks = [...tracks].sort(function (a, b) {\n  return b.plays - a.plays;\n});",
      },
    },
    misconceptions: [
      {
        wrong: "sort can be called straight on the source array because its order is not important.",
        symptom: "A later part of the page reads the records in the wrong order although it never sorted anything itself.",
        hint: "Sort rearranges the array it is given, so the change reaches every other reader of that array. Copy with the spread syntax first and sort the copy instead.",
        file: "javascript",
        detect: "(?<!\\.\\.\\.)tracks\\.sort\\s*\\(",
        detectableExample: "tracks.sort(function (a, b) {\n  return b.plays - a.plays;\n});",
      },
      {
        wrong: "sort without a comparison function orders numbers correctly.",
        symptom: "Twelve plays sorts before four, because the values are compared as text rather than as counts.",
        hint: "Without a comparison function the values are converted to text and ordered character by character. Provide a function that returns the difference between the two counts.",
        file: "javascript",
        detect: "\\.sort\\s*\\(\\s*\\)",
        detectableExample: "const orderedTracks = [...tracks].sort();",
      },
    ],
  },
  {
    lessonId: "ages-16-18-data-update",
    courseIds: ["ages-16-18"],
    concept: "An update is a derived collection in which one matching record is replaced by an updated copy, so identity is carried by the id rather than by the position.",
    make: "The learner writes setQuantity, which replaces one item through map and an object spread.",
    difficulty: 4,
    prerequisites: ["ages-16-18-data-create"],
    projectStep: "The project's edit action changes one record and leaves the others identical, which is what lets the interface redraw a single row rather than the whole list.",
    stages: {
      hook: {
        lead: "An edit form changes the quantity of the second row and the first row changes instead. Then a colleague adds a sort control and the same edit changes a completely different row. The lookup was by position and the position moved. What should have identified the record?",
        variants: {
          guided: "A row's position is not its identity. Today you find the record by its id so the update survives a reordering.",
          balanced: "Position is an accident of the current order. An id is a property of the record and travels with it.",
          independent: "Treat the id as the only stable handle on a record, and derive every update from it.",
        },
      },
      model: {
        lead: "state.items = state.items.map(function (item) { return item.id === id ? { ...item, quantity: quantity } : item; }); examines every item, replaces the one whose id matches with an updated copy, and returns the rest untouched.",
        variants: {
          guided: "Read it as a decision per item: this one matches, so return an amended copy; otherwise return the item exactly as it arrived.",
          balanced: "The spread copies the existing fields first so the amended object keeps everything it had and changes only the named field.",
          independent: "A map produces a new collection rather than editing the old one, which is why the result has to be assigned back to the state.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the function signature first, then the map, then the comparison, and finally the updated copy.",
        variants: {
          guided: "Name the function and its two parameters, map over the items, compare the ids, and return a spread copy for the match.",
          balanced: "Build the returned object last, so the match and the replacement are decided before the object shape is written.",
          independent: "Decide the exact field that changes before typing, then confirm the copy keeps every other field.",
        },
      },
      check: {
        lead: "Call the function with a known id and read the result. Exactly one item should have changed, the matched item should carry the new value, and every other item should be indistinguishable from its original.",
        variants: {
          guided: "Check the matched item changed and the neighbouring item did not.",
          balanced: "Check the returned object still carries the fields it had before the update, since a spread is easy to write in the wrong order.",
          independent: "Check the source item object was not itself modified, because that would make the update invisible to anything holding the previous collection.",
        },
      },
      explain: {
        lead: "Now a different collection: a stock list whose items carry a quantity. No example open. Write a function that updates the quantity of the item matching an id and returns the rest unchanged.",
        variants: {
          guided: "The new state is called items and the function takes an id and a quantity, exactly as in the worked pattern.",
          balanced: "Same pattern, new field. Read the record shape before writing the replacement.",
          independent: "Work with no example open and choose the id comparison operator deliberately, because a loose comparison can match the wrong record.",
        },
      },
      transfer: {
        lead: "The project's edit action is built on this function, and the undo behaviour planned for a later module only works because the previous collection is never modified in place.",
        variants: {
          independent: "A derived update is also what makes the change testable, because the function can be called with a fixed state and compared against an expected result.",
          guided: "Your project's edit form will update one record by id.",
          balanced: "One stable handle on a record removes the whole class of defects that position based updates produce.",
        },
      },
    },
    mastery: {
      freshTask: "A stock list holds items with quantities. Write setQuantity(id, quantity) so the item matching the id receives the new quantity and every other item is returned unchanged.",
      observable: "Calling the function with an existing id changes exactly one item, and every other item in the new collection is identical to the item it replaced.",
      reflection: "In your own words, why is updating by id safer than updating by position, and what does the spread copy protect?",
      starterFiles: {
        html: "<p>Quantities are listed below the form.</p>",
        css: "",
        javascript: "const state = {\n  items: [{ id: 1, name: \"Paper\", quantity: 2 }],\n};\n// Define setQuantity",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The update function is defined", pattern: "function\\s+setQuantity\\s*\\(\\s*id\\s*,\\s*quantity\\s*\\)" },
        { file: "javascript", label: "Every item is examined with map", pattern: "state\\.items\\.map\\s*\\(" },
        { file: "javascript", label: "Only the matching id is replaced", pattern: "item\\.id\\s*===\\s*id" },
        { file: "javascript", label: "The match is replaced by a spread copy", pattern: "\\{\\s*\\.\\.\\.item\\s*," },
      ],
      workedSolution: {
        html: "<p>Quantities are listed below the form.</p>",
        css: "",
        javascript: "const state = {\n  items: [{ id: 1, name: \"Paper\", quantity: 2 }],\n};\n\nfunction setQuantity(id, quantity) {\n  state.items = state.items.map(function (item) {\n    return item.id === id ? { ...item, quantity: quantity } : item;\n  });\n}",
      },
    },
    misconceptions: [
      {
        wrong: "the matched object can be edited in place because only one field changes.",
        symptom: "The interface keeps showing the previous value, because the collection still holds the object that was mutated.",
        hint: "Editing the object changes it wherever it is referenced, which hides the change from anything holding the previous collection. Return a new object built from the spread of the old one with the field replaced.",
        file: "javascript",
        detect: "item\\.[a-z]+\\s*=[^=]",
        detectableExample: "item.quantity = 3;",
      },
      {
        wrong: "the record can be found by its position in the array.",
        symptom: "The update lands on a different record as soon as the list is sorted or filtered, and nothing in the code has changed.",
        hint: "A position is only valid until the collection is reordered. Compare the record's own id with the id passed in, and let the position change without affecting which record is updated.",
        file: "javascript",
        detect: "(?:state\\.items|items)\\s*\\[\\s*\\d+\\s*\\]",
        detectableExample: "state.items[0].quantity = 3;",
      },
    ],
  },
  {
    lessonId: "ages-16-18-data-delete",
    courseIds: ["ages-16-18"],
    concept: "Removing a record is a derivation rather than an instruction: the remaining collection is built from the records whose id does not match.",
    make: "The learner writes removeItem, which derives the remaining items with filter and reports how many are left.",
    difficulty: 4,
    prerequisites: ["ages-16-18-data-update"],
    projectStep: "The project's delete action removes exactly one record and leaves the list count correct, which the interface displays directly from the state.",
    stages: {
      hook: {
        lead: "A delete button removes the right row and the count beneath the list stays one higher than the number of rows. The row really is gone. Which value was never derived from the collection after the removal?",
        variants: {
          guided: "After removing a record there is a new collection, and anything that describes it has to be derived again. Today the function does both.",
          balanced: "A delete that returns nothing leaves the caller guessing. Returning the new count makes the result usable.",
          independent: "Treat removal as a constraint on what remains: keep everything whose id is not the one being removed.",
        },
      },
      model: {
        lead: "state.items = state.items.filter(function (item) { return item.id !== id; }); keeps every item whose id differs from the one being removed and then reports how many remain. Nothing is deleted from an existing array; a new one is derived.",
        variants: {
          guided: "Two steps: keep the items that do not match, assign the result back to the state, then return the new length.",
          balanced: "The comparison is deliberately the opposite of the update lesson, because here the match is the record that must not survive.",
          independent: "A derivation rather than a removal means the previous collection is still intact and the new one is a value you can inspect.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the signature, then the filter with the id comparison, then the assignment, then the reported count.",
        variants: {
          guided: "Filter the items, return the ones whose id is not the selected id, assign the result, then return the length.",
          balanced: "Write the comparison carefully: keeping the wrong side of it leaves the collection unchanged and deletes nothing.",
          independent: "Decide what the function returns before writing it, then make the return value the number the interface needs.",
        },
      },
      check: {
        lead: "Call the function with a known id and read both results. The removed id must be absent from the new collection, every other id must still be present, and the returned count must match the number of remaining items.",
        variants: {
          guided: "Check the removed id is gone and the returned count matches the list you can count.",
          balanced: "Check the two results separately: the collection that remains and the number you return.",
          independent: "Test the case where the id does not exist, because a removal that silently succeeds on a missing id hides a caller's mistake.",
        },
      },
      explain: {
        lead: "Now a different collection: a stock list whose items carry an id. No example open. Write a function that removes the matching item, keeps the rest and reports how many items remain.",
        variants: {
          guided: "The new state is called items and the function takes one id, as in the worked pattern.",
          balanced: "Same pattern, new field names. Read the record shape before writing the filter.",
          independent: "Work with no example open and confirm the function would still report a correct count if nothing was removed.",
        },
      },
      transfer: {
        lead: "The project's delete action and the record count beside the list both read from the state, so a removal that forgets to report the new count leaves the interface disagreeing with itself.",
        variants: {
          independent: "A function that derives and reports in one step keeps two parts of the interface from disagreeing, which is cheaper than reconciling them later.",
          guided: "Your project's delete control will remove one record and update the count.",
          balanced: "Deriving the remainder means the count is a fact rather than a second copy that can drift.",
        },
      },
    },
    mastery: {
      freshTask: "A stock list holds items with ids. Write removeItem(id) so the matching item is left out of the new collection and the function reports how many items remain.",
      observable: "After the call the removed id is absent, every other id is still present, and the returned number equals the number of remaining items.",
      reflection: "In your own words, why is removing a record described as deriving the remainder rather than as deleting an element?",
      starterFiles: {
        html: "<p>Items are listed below the form.</p>",
        css: "",
        javascript: "const state = {\n  items: [{ id: 1, name: \"Paper\" }, { id: 2, name: \"Pens\" }],\n};\n// Define removeItem",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The removal function is defined", pattern: "function\\s+removeItem\\s*\\(\\s*id\\s*\\)" },
        { file: "javascript", label: "The remainder is derived with filter", pattern: "state\\.items\\.filter\\s*\\(" },
        { file: "javascript", label: "The removed id is excluded", pattern: "item\\.id\\s*!==\\s*id" },
        { file: "javascript", label: "The function reports how many remain", pattern: "return\\s+state\\.items\\.length" },
      ],
      workedSolution: {
        html: "<p>Items are listed below the form.</p>",
        css: "",
        javascript: "const state = {\n  items: [{ id: 1, name: \"Paper\" }, { id: 2, name: \"Pens\" }],\n};\n\nfunction removeItem(id) {\n  state.items = state.items.filter(function (item) {\n    return item.id !== id;\n  });\n  return state.items.length;\n}",
      },
    },
    misconceptions: [
      {
        wrong: "the record can be removed with splice at a remembered position.",
        symptom: "The wrong record disappears as soon as the list is reordered, and the removal depends on a position nothing tracks.",
        hint: "Splice removes whatever sits at that position, which stops being the intended record after any ordering. Derive the remainder with filter against the record's id instead.",
        file: "javascript",
        detect: "\\.splice\\s*\\(",
        detectableExample: "state.items.splice(0, 1);",
      },
      {
        wrong: "deleting is the same as blanking the record's fields.",
        symptom: "The list still shows a row with no content, and every count that reads the collection still includes it.",
        hint: "An empty field is not a removal. A blank record still occupies a position and is still counted, so derive a collection that genuinely excludes it.",
        file: "javascript",
        detect: "(?:item|record)\\.[a-z]+\\s*=\\s*(?:null|\"\"|'')",
        detectableExample: "record.name = null;",
      },
    ],
  },
  {
    lessonId: "ages-16-18-interaction-fetch",
    courseIds: ["ages-16-18"],
    concept: "A request completes in two stages, the response and then its body, and an HTTP error status arrives as a completed response rather than as a rejection.",
    make: "The learner writes an asynchronous loader that awaits the request, refuses an error status and returns the parsed body.",
    difficulty: 4,
    prerequisites: ["ages-16-18-interaction-loading"],
    projectStep: "The project can read a feed from outside the page, which is the first half of the external data checkpoint.",
    stages: {
      hook: {
        lead: "A loader reads a feed, the feed answers with a message saying the page was not found, and the code happily renders that message as data. Nothing threw an error and nothing was logged. The request succeeded and the result is nonsense. Which check was missing?",
        variants: {
          guided: "A reply can arrive successfully and still report a failure. Today you check the status before you read the body.",
          balanced: "A rejected promise only covers a request that never completed. An HTTP error status completes normally and has to be refused by hand.",
          independent: "Treat a response as two separate steps: confirming it can be used, then reading what it contains.",
        },
      },
      model: {
        lead: "const response = await fetch(feedUrl); waits for the reply, if (!response.ok) throw new Error(\"Feed request failed\"); refuses an error status, and return response.json(); reads the body. The body is a second asynchronous step, which is why it is awaited by the caller or returned as a promise.",
        variants: {
          guided: "Three steps in order: request, status check, body. The loader is marked async so the await inside it is allowed.",
          balanced: "The status property states whether the response is usable, while the body has not been read at all at that point.",
          independent: "Returning the parsed body rather than the response keeps the caller free of transport details, which is what makes the loader testable.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the async function first, then the awaited request, then the status check, then the parsed return value.",
        variants: {
          guided: "Mark the function async, await the request, throw when the status is not ok, then return the parsed body.",
          balanced: "Write the status check before reading the body, because the body of an error response is rarely the data you expected.",
          independent: "Decide what the function returns before typing, and keep the transport details inside it rather than passing them out.",
        },
      },
      check: {
        lead: "Call the loader and read what it returns. The value should be parsed data rather than a response object, and it should not be possible to reach the return statement when the status reports an error.",
        variants: {
          guided: "Check the returned value is usable data and that an error status cannot reach the return statement.",
          balanced: "Check the two stages separately: the request completes, then the body is read.",
          independent: "Confirm the error thrown would be meaningful to a caller, since a generic failure message is nearly as unhelpful as silence.",
        },
      },
      explain: {
        lead: "Now a different endpoint: a publication feed that returns JSON. No example open. Write an asynchronous function that requests the feed, refuses a response that reports an error status and returns the parsed body.",
        variants: {
          guided: "The new loader needs the same three steps: await the request, check the status, return the body.",
          balanced: "Same pattern, new endpoint. Decide what a caller should receive before writing the return value.",
          independent: "Work with no example open and write the failure message as something a visitor could act on.",
        },
      },
      transfer: {
        lead: "The project's external data arrives through this loader, and every state the interface shows during a request is driven by what this function returns or throws.",
        variants: {
          independent: "A loader that refuses an error status is what makes the loading, empty and failure states of the interface honest rather than decorative.",
          guided: "Your project will read its feed through one loader like this.",
          balanced: "Two awaits stand between the request and the data the page can use.",
        },
      },
    },
    mastery: {
      freshTask: "A publication feed returns JSON. Write async function loadFeed() that requests the feed, refuses a response reporting an error status and returns the parsed body.",
      observable: "The function resolves with parsed data, and a response reporting an error status causes a thrown error rather than a returned value.",
      reflection: "In your own words, why does a request with an error status not automatically reject, and why is the body read as a second step?",
      starterFiles: {
        html: "<p id=\"feed-status\">Not loaded yet.</p>",
        css: "",
        javascript: "const feedUrl = \"data:application/json,%7B%22issue%22%3A12%7D\";\n// Define loadFeed",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The loader is asynchronous", pattern: "async\\s+function\\s+loadFeed\\s*\\(" },
        { file: "javascript", label: "The request is awaited", pattern: "await\\s+fetch\\s*\\(\\s*feedUrl\\s*\\)" },
        { file: "javascript", label: "An error status is refused", pattern: "response\\.ok" },
        { file: "javascript", label: "The parsed body is returned", pattern: "return\\s+response\\.json\\s*\\(\\s*\\)" },
      ],
      workedSolution: {
        html: "<p id=\"feed-status\">Not loaded yet.</p>",
        css: "",
        javascript: "const feedUrl = \"data:application/json,%7B%22issue%22%3A12%7D\";\n\nasync function loadFeed() {\n  const response = await fetch(feedUrl);\n  if (!response.ok) {\n    throw new Error(\"Feed request failed\");\n  }\n  return response.json();\n}",
      },
    },
    misconceptions: [
      {
        wrong: "the parsed data is the value the request resolves with.",
        symptom: "The interface receives a response object and reads its fields as though they were the data, so every value is empty.",
        hint: "The request resolves with a response, and the body is read from it in a second asynchronous step. Await or return response.json() separately rather than chaining it onto the request.",
        file: "javascript",
        detect: "await\\s+fetch\\s*\\([^)]*\\)\\s*\\.\\s*json",
        detectableExample: "const data = await fetch(feedUrl).json();",
      },
      {
        wrong: "a failed request and an error status are the same thing.",
        symptom: "A page that was not found is rendered as if it were data, because only a network failure ever throws.",
        hint: "A rejection means the request never completed. An HTTP error status completes normally, so check response.ok and throw for yourself before the body is used.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*await\\s+fetch)(?![\\s\\S]*response\\.ok)",
        detectableExample: "const response = await fetch(feedUrl);\nreturn response.json();",
      },
    ],
  },
  {
    lessonId: "ages-16-18-interaction-errors",
    courseIds: ["ages-16-18"],
    concept: "A failure path needs three parts: the attempt, the recovery and the cleanup that must happen either way.",
    make: "The learner wraps an awaited export in a try block, reports a recoverable message in catch and re-enables the control in finally.",
    difficulty: 5,
    prerequisites: ["ages-16-18-interaction-fetch"],
    projectStep: "The project's request actions stay usable after a failure, so a visitor can retry without reloading the page.",
    stages: {
      hook: {
        lead: "An export button works once and then does nothing at all. The first attempt failed, the failure was caught, and the button was disabled before the request and never re-enabled. A second attempt is impossible. Which block should have run whatever happened?",
        variants: {
          guided: "Something has to run whether the attempt succeeds or fails. Today you put the cleanup there.",
          balanced: "The success path and the failure path both need the control returned to a usable state, which is why the cleanup does not belong in either one.",
          independent: "Treat a disabled control as a resource. Anything acquired before an await has to be released by code that cannot be skipped.",
        },
      },
      model: {
        lead: "try { const data = await exportFeed(); } catches a failure into a parameter, catch (error) { runStatus.textContent = \"Could not export. Check your connection and try again.\"; } reports it to the visitor, and finally { runButton.disabled = false; } runs after either outcome.",
        variants: {
          guided: "Three blocks in order: the attempt, the recovery message, then the cleanup that always runs.",
          balanced: "The catch receives the failure as a parameter, so the message can distinguish a failure the visitor can act on from one they cannot.",
          independent: "The finally block is the only place code runs after both outcomes, so it is where cleanup belongs rather than duplicated in two branches.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Wrap the awaited call in try first, add the catch with its message, then add the finally block that re-enables the button.",
        variants: {
          guided: "Put the awaited call inside try, write a message in catch, and set the button's disabled property to false in finally.",
          balanced: "Add the cleanup last, once both the success and the failure branch are written and can be read.",
          independent: "Decide the message before typing, and write it as something the visitor can act on rather than as a description of the code.",
        },
      },
      check: {
        lead: "Force a failure and read the page. The visitor should see a message they can act on, and the button should be usable again. Then let the call succeed and confirm the same cleanup ran.",
        variants: {
          guided: "Check the message appears, then check the button can be pressed again after a failure.",
          balanced: "Check the three blocks separately, because a failure path can report correctly and still leave the control disabled.",
          independent: "Confirm the cleanup runs on both outcomes, since that is the only property that distinguishes finally from a duplicated statement.",
        },
      },
      explain: {
        lead: "Now a different action: an export button that disables itself before the call and has no failure handling at all. No example open. Attempt the call in a try block, report a failure the visitor can act on, and restore the control whatever happens.",
        variants: {
          guided: "The new file needs the same three blocks: the attempt, a message in catch and the cleanup in finally.",
          balanced: "Same pattern, new action. Read the control's starting state before deciding what the cleanup restores.",
          independent: "Work with no example open and write the failure message so it tells the visitor what to try next.",
        },
      },
      transfer: {
        lead: "Every request the project makes can fail, and the release note can only claim the failure path was tested if the control is restored in both outcomes.",
        variants: {
          independent: "A failure path that leaves the interface in a usable state is what separates a demo from something a visitor can depend on.",
          guided: "Your project's action buttons will each restore themselves after a failure.",
          balanced: "The cleanup is the one part of the failure path that must not depend on which branch was taken.",
        },
      },
    },
    mastery: {
      freshTask: "An export button disables itself, calls an asynchronous export and can never be pressed again after a failure. Attempt the call inside try, report a failure the visitor can act on, and restore the button whatever happens.",
      observable: "A failed export shows a message telling the visitor what to try and leaves the button pressable, and a successful export leaves it pressable as well.",
      reflection: "In your own words, why does the cleanup belong in a finally block rather than in the success and failure branches?",
      starterFiles: {
        html: "<button id=\"export\">Export</button>\n<p id=\"export-status\"></p>",
        css: "",
        javascript: "const runButton = document.querySelector(\"#export\");\nconst runStatus = document.querySelector(\"#export-status\");\n\nasync function runExport() {\n  runButton.disabled = true;\n  // Handle success and failure\n}",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "The call is attempted inside try", pattern: "try\\s*\\{[\\s\\S]*await\\s+exportFeed\\s*\\(" },
        { file: "javascript", label: "A failure is caught", pattern: "catch\\s*\\(" },
        { file: "javascript", label: "The visitor is told what to do next", pattern: "textContent\\s*=\\s*[\"'][^\"']*try again[^\"']*[\"']" },
        { file: "javascript", label: "Cleanup always runs", pattern: "finally\\s*\\{" },
        { file: "javascript", label: "The button is usable again afterwards", pattern: "\\.disabled\\s*=\\s*false" },
      ],
      workedSolution: {
        html: "<button id=\"export\">Export</button>\n<p id=\"export-status\"></p>",
        css: "",
        javascript: "const runButton = document.querySelector(\"#export\");\nconst runStatus = document.querySelector(\"#export-status\");\n\nasync function runExport() {\n  runButton.disabled = true;\n  try {\n    const data = await exportFeed();\n    runStatus.textContent = \"Export ready\";\n    return data;\n  } catch (error) {\n    runStatus.textContent = \"Could not export. Check your connection and try again.\";\n  } finally {\n    runButton.disabled = false;\n  }\n}",
      },
    },
    misconceptions: [
      {
        wrong: "the cleanup can be written at the end of the failure branch instead of in a finally block.",
        symptom: "The control stays disabled after a successful attempt, so the action works once and appears to break.",
        hint: "A statement in one branch runs only for that branch. Move the cleanup into a finally block so it runs after success and after failure alike.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*catch\\s*\\()(?=[\\s\\S]*\\.disabled\\s*=\\s*false)(?![\\s\\S]*\\bfinally)",
        detectableExample: "try {\n  await exportFeed();\n} catch (error) {\n  runButton.disabled = false;\n}",
      },
      {
        wrong: "a failure is best kept out of the interface so the page looks calm.",
        symptom: "The action appears to do nothing at all when it fails, so the visitor retries without knowing whether anything happened.",
        hint: "An unhandled failure reads as a broken control. Write a message into the status region that says what failed and what to try, because silence is the least useful outcome.",
        file: "javascript",
        detect: "catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}",
        detectableExample: "try {\n  await exportFeed();\n} catch (error) {}",
      },
    ],
  },
  {
    lessonId: "ages-16-18-interaction-abort",
    courseIds: ["ages-16-18"],
    concept: "Asynchronous work does not finish in the order it started, so a result is only usable if it belongs to the most recent request.",
    make: "The learner tags each request with an increasing number and drops a result that no longer belongs to the latest one.",
    difficulty: 5,
    prerequisites: ["ages-16-18-interaction-errors"],
    projectStep: "The project's filter stays correct when a visitor types quickly, so the interface never shows the result of a request they have moved on from.",
    stages: {
      hook: {
        lead: "A filter box is used quickly and the board ends up showing results for a term typed three seconds ago. The request for the newest term did finish, and its results arrived first. Two requests, two answers, one order of arrival. Which answer should be allowed to reach the screen?",
        variants: {
          guided: "Two requests can finish in either order. Today each result checks whether it is still the one the visitor is waiting for.",
          balanced: "The network gives no guarantee about completion order, so the code has to decide which answer is still relevant.",
          independent: "Treat arrival order as unreliable input rather than as an assumption, and make the newest request the only one allowed to render.",
        },
      },
      model: {
        lead: "const filterId = ++latestFilter; gives this request a number higher than every earlier one, const data = await loadFilter(term); waits for the reply, and if (filterId !== latestFilter) { return; } drops the result when a newer request has started in the meantime.",
        variants: {
          guided: "Take a number before the await, compare it after the await, and stop if a newer request has taken a higher one.",
          balanced: "The counter lives outside the function so it survives between calls, which is what makes the comparison meaningful.",
          independent: "The guard runs before the result is rendered, because once the data has reached the interface the stale value has already been shown.",
        },
      },
      build: {
        lead: "Work in the JavaScript file. Write the counter first, then take the number inside the function, then the await, then the comparison and the early return.",
        variants: {
          guided: "Increment the counter, store the number, await the data, compare the numbers and return before rendering when they differ.",
          balanced: "Place the comparison immediately after the await, so no work happens on data that may already be out of date.",
          independent: "Decide what the function does for a stale result before typing, and make that outcome the cheapest path through the code.",
        },
      },
      check: {
        lead: "Start a request and then start a second one before the first returns. Only the second result should reach the display, and the first should leave no trace at all.",
        variants: {
          guided: "Check that the newest result is the one shown and the older one disappears.",
          balanced: "Check the guard is placed before the render, because a comparison after rendering changes nothing.",
          independent: "Confirm the stale path returns rather than rendering an older value over the newest one.",
        },
      },
      explain: {
        lead: "Now a different interface: a board with a filter box and no protection against out of order results. No example open. Give each request a number and ignore any result that is no longer the newest.",
        variants: {
          guided: "The new file needs the same counter, the same comparison and the same early return before rendering.",
          balanced: "Same pattern, new interface. Decide what a superseded result should do before writing the guard.",
          independent: "Work with no example open and keep the counter outside the function so it can compare requests across calls.",
        },
      },
      transfer: {
        lead: "The project's filter and search controls depend on this guard, because a visitor typing quickly will always produce more requests than answers.",
        variants: {
          independent: "A guard that reads the newest request is simpler to reason about than one that tries to cancel work already in flight.",
          guided: "Your project's filter requests will each carry a number.",
          balanced: "Two requests started a second apart can finish in either order, which is what the number settles.",
        },
      },
    },
    mastery: {
      freshTask: "A board is filtered as a visitor types, and results can arrive out of order. Give each request a number and ignore any result that is no longer the newest one before it reaches the board.",
      observable: "When two requests are started in quick succession, only the result belonging to the newer request is rendered and the older result is dropped.",
      reflection: "In your own words, why can a stale result appear at all, and why must the check happen before the result is rendered?",
      starterFiles: {
        html: "<p>The board shows the results of the current filter.</p>",
        css: "",
        javascript: "let latestFilter = 0;\n\nasync function applyFilter(term) {\n  // Track this request\n  const data = await loadFilter(term);\n  // Ignore stale data\n  renderBoard(data);\n}",
      },
      editableFiles: ["javascript"],
      checks: [
        { file: "javascript", label: "Each request takes a new number", pattern: "\\+\\+latestFilter|latestFilter\\s*\\+\\s*1" },
        { file: "javascript", label: "The number for this request is kept", pattern: "(?:const|let)\\s+filterId" },
        { file: "javascript", label: "The older result is recognised", pattern: "filterId\\s*!==\\s*latestFilter" },
        { file: "javascript", label: "The stale result is dropped before it renders", pattern: "if\\s*\\([^)]*filterId[^)]*\\)[\\s\\S]*return" },
      ],
      workedSolution: {
        html: "<p>The board shows the results of the current filter.</p>",
        css: "",
        javascript: "let latestFilter = 0;\n\nasync function applyFilter(term) {\n  const filterId = ++latestFilter;\n  const data = await loadFilter(term);\n  if (filterId !== latestFilter) {\n    return;\n  }\n  renderBoard(data);\n}",
      },
    },
    misconceptions: [
      {
        wrong: "the newest request always finishes last, so no guard is needed.",
        symptom: "The board shows the result of an earlier term after the newest one has already appeared, and nothing in the code looks wrong.",
        hint: "Completion order is decided by the network rather than by the order the requests were made. Compare this request's number with the newest one and stop before rendering when they differ.",
        file: "javascript",
        detect: "^(?=[\\s\\S]*await\\s+loadFilter)(?![\\s\\S]*(?:filterId|requestId)\\s*!==)",
        detectableExample: "async function applyFilter(term) {\n  const data = await loadFilter(term);\n  renderBoard(data);\n}",
      },
      {
        wrong: "a stale result can be corrected by rendering again once the newer data arrives.",
        symptom: "The wrong data appears on screen for a moment before it is replaced, and every stale response redraws the board.",
        hint: "Render once, from the newest result only. A guard before the render keeps a superseded answer off the screen entirely instead of showing it and correcting it.",
        file: "javascript",
        detect: "(?:renderBoard\\s*\\([\\s\\S]*){2}",
        detectableExample: "renderBoard(data);\nrenderBoard(olderData);",
      },
    ],
  },
];
