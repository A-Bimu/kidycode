/* Revision packs for the adult course. One pack per assessed concept. */

import type { RevisionPack } from "@/lib/assessment/types";

export const packs: RevisionPack[] = [
  {
    "concept": "adults:adults-structure:landmarks",
    "courses": [
      "adults"
    ],
    "title": "Page regions that name their purpose",
    "meaning": "Landmark elements such as header, nav, main and footer label the parts of a page so browsers, search engines and assistive technology can identify them without guessing.",
    "whyItMatters": "A client's visitors arrive on different devices and some use a screen reader. Named regions let them jump straight to the main content or the menu instead of listening to the whole page.",
    "workedExample": "<header> <nav>Menu</nav> </header> <main>Content</main> <footer>Contact</footer>",
    "commonMistake": "Wrapping every part of the page in a plain div, which leaves the browser and a screen reader with no idea which block is the menu and which is the main content.",
    "guided": [
      {
        "prompt": "Which element should contain the primary content of a business page?",
        "options": [
          "A main element",
          "A footer element",
          "A div whose class is named content"
        ],
        "answer": 0,
        "explanation": "The main element marks the primary content, so a visitor can skip the header and the menu and land directly on the words that matter."
      },
      {
        "prompt": "Why is a nav element a better choice than a div for a menu?",
        "options": [
          "It tells assistive technology this is a set of navigation links",
          "It makes the menu load faster on a phone",
          "It is the only element a menu can be typed inside"
        ],
        "answer": 0,
        "explanation": "The element name carries meaning, so a screen reader can announce the menu as navigation instead of reading a list of unrelated links."
      }
    ],
    "independent": "Open your client page and wrap the menu, the main service description and the closing details in header, nav, main and footer regions. Check the page still reads in a sensible order.",
    "hints": [
      "Start with the closing information and work upwards through the page.",
      "A region can hold other regions, so the nav often sits inside the header.",
      "Read the page from top to bottom and ask what each block is for."
    ],
    "readiness": [
      {
        "prompt": "What does a footer usually hold on a client site?",
        "options": [
          "Closing details such as contact information and the release note",
          "The main service list",
          "The navigation menu"
        ],
        "answer": 0,
        "explanation": "The footer closes the page, so it carries the small print and the contact details rather than the main offer."
      }
    ],
    "lessonId": "adults-structure-landmarks"
  },
  {
    "concept": "adults:adults-structure:headings",
    "courses": [
      "adults"
    ],
    "title": "Heading levels that describe the page",
    "meaning": "Headings form the outline of a page. One h1 names the page and each section title steps down one level, so the structure is clear before any styling exists.",
    "whyItMatters": "A client reading a long page needs to scan it. A clean heading order lets a visitor find the section they want in seconds, and it feeds search engines the same structure.",
    "workedExample": "<h1>Service name</h1> <h2>How we work</h2> <h3>Step one</h3>",
    "commonMistake": "Choosing heading levels by how large the text should look, which produces an outline that jumps from h1 to h4 and confuses anyone navigating by headings.",
    "guided": [
      {
        "prompt": "How many h1 elements should one business page use?",
        "options": [
          "One, naming the whole page",
          "One for each section",
          "As many as there are paragraphs"
        ],
        "answer": 0,
        "explanation": "The h1 names the page once. Section titles belong in lower levels so the outline stays predictable for every reader."
      },
      {
        "prompt": "Which heading level belongs directly beneath an h2?",
        "options": [
          "h3",
          "h4",
          "h1"
        ],
        "answer": 0,
        "explanation": "Heading levels step down one at a time, so a subsection inside a section uses the next level rather than skipping ahead."
      }
    ],
    "independent": "Rewrite the headings on one page of the client site so there is a single h1 and every section and subsection steps down one level at a time.",
    "hints": [
      "Write the page outline on paper before touching the code.",
      "Pick levels by meaning, not by how big the text looks.",
      "Never skip a level on the way down."
    ],
    "readiness": [
      {
        "prompt": "What does a reader gain from a well ordered heading outline?",
        "options": [
          "They can scan the page and find the section they need",
          "They can see the file size of the page",
          "They can edit the page without a code editor"
        ],
        "answer": 0,
        "explanation": "Headings behave like a table of contents, so a visitor or a screen reader can move straight to the part they care about."
      }
    ],
    "lessonId": "adults-structure-headings"
  },
  {
    "concept": "adults:adults-structure:links",
    "courses": [
      "adults"
    ],
    "title": "Link text that names the destination",
    "meaning": "A link has an address in the href attribute and words between the tags. The words must tell a visitor where the link goes even when the link is read on its own.",
    "whyItMatters": "Visitors skim link text. Words such as click here tell them nothing and make a page harder to use on a phone or with a screen reader.",
    "workedExample": "<a href='services.html'>Our services</a>",
    "commonMistake": "Writing click here or read more as the link text and putting the description somewhere else on the page.",
    "guided": [
      {
        "prompt": "What belongs in the href attribute of a link?",
        "options": [
          "The address the link opens",
          "The words the visitor reads",
          "The colour of the link text"
        ],
        "answer": 0,
        "explanation": "The href holds the destination. The visible words are the link text that the visitor reads on the page."
      },
      {
        "prompt": "How should a fragment link be written?",
        "options": [
          "With a hash and the id of an element on the same page",
          "With the class name of the section",
          "With an external web address"
        ],
        "answer": 0,
        "explanation": "A fragment link points at an id on the page, so the target element must exist and carry that id."
      }
    ],
    "independent": "Review every link on the client page. Rewrite any that only say click here so each one names its destination, and check that the menu link reaches the right section.",
    "hints": [
      "Read each link on its own and ask where it goes.",
      "Learn which links point outside the site.",
      "Check that the id a fragment link aims at really exists."
    ],
    "readiness": [
      {
        "prompt": "Which piece of link text helps a visitor most?",
        "options": [
          "Request a quote for the kitchen fitting",
          "Click here",
          "More"
        ],
        "answer": 0,
        "explanation": "The useful words name the action and the subject, so the link makes sense even when it is read out of context."
      }
    ],
    "lessonId": "adults-structure-links"
  },
  {
    "concept": "adults:adults-structure:images",
    "courses": [
      "adults"
    ],
    "title": "Describing an image in words",
    "meaning": "Every image has a src, which names the file to display, and an alt value, which describes what the picture shows to someone who cannot see it.",
    "whyItMatters": "Images carry information on a business site, from a finished installation to a team photo. Without a description that information is lost to some visitors and to search engines.",
    "workedExample": "<img src='team.jpg' alt='Two people fitting a kitchen'>",
    "commonMistake": "Swapping the src and alt values, or writing the words image of followed by the file name, which describes the file instead of the content.",
    "guided": [
      {
        "prompt": "What is the difference between the src and the alt value of an image?",
        "options": [
          "The src is the file to display and the alt is its description",
          "The src is the description and the alt is the file",
          "Both values describe the picture"
        ],
        "answer": 0,
        "explanation": "The src points the browser at a file. The alt explains what the picture contributes to the page."
      },
      {
        "prompt": "When is empty alternative text the correct choice?",
        "options": [
          "When the picture only repeats what the nearby words already say",
          "Whenever the picture is small",
          "Whenever the picture came from a stock library"
        ],
        "answer": 0,
        "explanation": "Empty alt text is a deliberate decision to hide a decorative picture from assistive technology, not a shortcut for images that carry meaning."
      }
    ],
    "independent": "Choose one photograph for the client site, write a description of what it adds to the page, and place it with that description in the alt value.",
    "hints": [
      "Write the description before you choose the file.",
      "Say what the picture contributes, not what the file is called.",
      "Decide deliberately whether a decorative picture needs no description at all."
    ],
    "readiness": [
      {
        "prompt": "What does alt text replace for a visitor who cannot see the picture?",
        "options": [
          "The information the picture carries",
          "The file size of the picture",
          "The position of the picture on the page"
        ],
        "answer": 0,
        "explanation": "Alt text is the picture written in words, so it has to carry the same useful information."
      }
    ],
    "lessonId": "adults-structure-metadata"
  },
  {
    "concept": "adults:adults-structure:site-foundation",
    "courses": [
      "adults"
    ],
    "title": "A first version that stands on its own",
    "meaning": "The first working version of a client site proves the structure and the message: a named purpose, the services and one clear action for the visitor.",
    "whyItMatters": "A client can only judge a website once something real is on the page. An empty framework hides the decisions that matter and delays useful feedback.",
    "workedExample": "<h1>Independent joiner</h1> <p>Fitted kitchens across the city</p> <a href='enquiry.html'>Request a quote</a>",
    "commonMistake": "Trying to build every feature the client mentioned before any of the content is written, which leaves nothing to review at the first meeting.",
    "guided": [
      {
        "prompt": "What belongs in the first working version of a client website?",
        "options": [
          "A named purpose, the services and one clear action",
          "Every feature the client might want later",
          "Only the empty page framework"
        ],
        "answer": 0,
        "explanation": "A first version should be small and complete enough for the client to react to at a real review."
      },
      {
        "prompt": "What is the most useful decision to make before writing any page code?",
        "options": [
          "The purpose and the audience of the site",
          "The exact shade of every colour",
          "The folder names on the web server"
        ],
        "answer": 0,
        "explanation": "Purpose and audience decide the content, the tone and the calls to action, so they come first."
      }
    ],
    "independent": "Draft the first version of your client page with a single heading, a short paragraph that names the audience, a list of services and one action a visitor can take.",
    "hints": [
      "Write one sentence that names who the site is for.",
      "Choose a single action you want visitors to take.",
      "Leave the extra features for a later version."
    ],
    "readiness": [
      {
        "prompt": "Which version of a site can a client review properly?",
        "options": [
          "One with real content and one clear action",
          "One with styling and no words",
          "One with a menu and an empty page"
        ],
        "answer": 0,
        "explanation": "A client reacts to content and purpose, so the first review needs those in place."
      }
    ],
    "lessonId": "adults-structure-project"
  },
  {
    "concept": "adults:adults-forms:labels",
    "courses": [
      "adults"
    ],
    "title": "Labels joined to their form fields",
    "meaning": "A label describes a form control, and connecting the label to the control means a click on the words focuses the field and assistive technology reads the pair together.",
    "whyItMatters": "An enquiry form is often the only way a client wins work. A field without a label is hard to complete on a phone and impossible to use with a screen reader.",
    "workedExample": "<label for='email'>Email address</label> <input id='email' name='email'>",
    "commonMistake": "Placing text near a field without any label element, or giving the label a for value that does not match the id of the input.",
    "guided": [
      {
        "prompt": "What connects a label to the field it describes?",
        "options": [
          "The for value matching the id of the input",
          "Placing the label above the input",
          "Giving the label the same name as the form"
        ],
        "answer": 0,
        "explanation": "The for attribute names the id of the control, so the browser knows the two belong together."
      },
      {
        "prompt": "What happens when a visitor clicks a properly connected label?",
        "options": [
          "The matching field receives focus",
          "The form is submitted",
          "The page scrolls to the top"
        ],
        "answer": 0,
        "explanation": "A connected label acts as part of the control, which makes small targets much easier to use on a phone."
      }
    ],
    "independent": "Take the enquiry form on the client site and connect every visible field to its own label, then test each one by clicking the words rather than the box.",
    "hints": [
      "Start with the field a visitor types in most often.",
      "Match the for value to the id exactly, including capital letters.",
      "Click each label to prove the connection works."
    ],
    "readiness": [
      {
        "prompt": "Why does an enquiry form need labelled fields?",
        "options": [
          "So every visitor can tell what each field expects and use it with assistive technology",
          "So the form submits faster",
          "So the page needs no JavaScript"
        ],
        "answer": 0,
        "explanation": "A label explains the field to everyone, including people using a screen reader."
      }
    ],
    "lessonId": "adults-forms-labels"
  },
  {
    "concept": "adults:adults-forms:input-types",
    "courses": [
      "adults"
    ],
    "title": "Choosing the right control for each answer",
    "meaning": "The type of an input decides which keyboard or picker a visitor sees: text for a name, email for an address, tel for a number and checkbox for a yes or no.",
    "whyItMatters": "On a phone the right control turns a fiddly form into a quick one, and it lets the browser check the answer before it is ever sent.",
    "workedExample": "<input type='email' id='email' name='email'> <input type='tel' id='phone' name='phone'>",
    "commonMistake": "Leaving every field as a plain text input, which forces phone visitors to hunt for the right keys and gives the browser nothing to validate.",
    "guided": [
      {
        "prompt": "Which input type suits an email address in an enquiry form?",
        "options": [
          "email",
          "text",
          "password"
        ],
        "answer": 0,
        "explanation": "The email type brings up the right keyboard on a phone and lets the browser check the shape of the address."
      },
      {
        "prompt": "Which control is best for a question with a single yes or no answer?",
        "options": [
          "A checkbox with a label",
          "A text input",
          "A paragraph of text"
        ],
        "answer": 0,
        "explanation": "A checkbox matches a two state answer and keeps the form easy to scan."
      }
    ],
    "independent": "Look at each field on the client enquiry form and change its type so it matches the answer you expect, then open the form on a phone and check the keyboards.",
    "hints": [
      "Match the control to the kind of answer, not the label wording.",
      "Test the form on a narrow screen, not just a laptop.",
      "Keep one purpose per field."
    ],
    "readiness": [
      {
        "prompt": "What does the input type do for a visitor on a phone?",
        "options": [
          "It offers the keyboard or picker that suits the answer",
          "It reduces the size of the form file",
          "It removes the need for a label"
        ],
        "answer": 0,
        "explanation": "The type drives the on screen keyboard, so the right one saves real effort."
      }
    ],
    "lessonId": "adults-forms-types"
  },
  {
    "concept": "adults:adults-forms:groups",
    "courses": [
      "adults"
    ],
    "title": "Grouping related choices",
    "meaning": "A fieldset wraps a set of related controls and a legend names the group, so a visitor hears the question before the individual options.",
    "whyItMatters": "Forms often ask for a choice, such as which service is wanted. Without a group, a screen reader reads a list of labels with no question attached to them.",
    "workedExample": "<fieldset> <legend>Which service do you need?</legend> <label><input type='radio' name='service'> Fitting</label> </fieldset>",
    "commonMistake": "Using a paragraph or a bold line as the group heading, which looks the same but tells assistive technology nothing.",
    "guided": [
      {
        "prompt": "Which element wraps a set of related form controls?",
        "options": [
          "fieldset",
          "section",
          "main"
        ],
        "answer": 0,
        "explanation": "The fieldset groups controls that belong to one question so they are read as a unit."
      },
      {
        "prompt": "What names the question a group of controls answers?",
        "options": [
          "The legend inside the fieldset",
          "The first label in the group",
          "The name attribute of the form"
        ],
        "answer": 0,
        "explanation": "The legend is the words spoken for the whole group, so it states the question clearly."
      }
    ],
    "independent": "Find the part of the client form that asks a visitor to choose between services and wrap those controls in a fieldset with a legend that states the question.",
    "hints": [
      "Group controls that answer one question together.",
      "Write the legend as the question itself.",
      "Keep the legend short enough to be read aloud."
    ],
    "readiness": [
      {
        "prompt": "What does a legend add to a group of radio buttons?",
        "options": [
          "It states the question the options answer",
          "It selects the first option by default",
          "It hides the group until it is needed"
        ],
        "answer": 0,
        "explanation": "The legend gives the group its meaning, so the visitor knows what they are choosing between."
      }
    ],
    "lessonId": "adults-forms-groups"
  },
  {
    "concept": "adults:adults-forms:messages",
    "courses": [
      "adults"
    ],
    "title": "Guidance and feedback on a form",
    "meaning": "A form should explain what it needs before it is submitted and report what happened afterwards, using hints beside the field and a live region for the result.",
    "whyItMatters": "An enquiry form that fails silently loses a client. Clear guidance and a visible result tell the visitor what to fix and confirm that the message arrived.",
    "workedExample": "<p id='email-hint'>We reply within two working days</p> <p role='status'>Thank you, your enquiry was sent</p>",
    "commonMistake": "Relying on colour alone to show that a field is wrong, which helps nobody who cannot see the difference and leaves the message unexplained.",
    "guided": [
      {
        "prompt": "Where should guidance about a field appear?",
        "options": [
          "Beside the field it belongs to",
          "In the page footer",
          "In a separate document"
        ],
        "answer": 0,
        "explanation": "Guidance next to the field is read at the moment the visitor needs it."
      },
      {
        "prompt": "What is a live status region used for on a form?",
        "options": [
          "Reporting the result of submitting the form",
          "Styling the submit button",
          "Storing the answers"
        ],
        "answer": 0,
        "explanation": "A status region announces a change, so a visitor knows the enquiry was received without hunting for a message."
      }
    ],
    "independent": "Add a short hint beside the field visitors find hardest to complete and a status region that reports the result once the form is submitted.",
    "hints": [
      "Put the help where the visitor is looking at that moment.",
      "Write the status message as a short sentence.",
      "Make sure the message is not carried by colour alone."
    ],
    "readiness": [
      {
        "prompt": "Which message tells a visitor that an enquiry was received?",
        "options": [
          "A short status sentence that appears after submitting",
          "A change of border colour only",
          "Nothing until the site owner replies"
        ],
        "answer": 0,
        "explanation": "A spoken status message confirms the result to everyone, including someone using a screen reader."
      }
    ],
    "lessonId": "adults-forms-messages"
  },
  {
    "concept": "adults:adults-forms:enquiry-form",
    "courses": [
      "adults"
    ],
    "title": "An enquiry form ready for a client",
    "meaning": "A complete enquiry form has labelled fields, the right control types, grouped choices, help beside each field and a clear result after it is submitted.",
    "whyItMatters": "This form is often the only place a client turns a visitor into a customer, so it has to be understandable, quick to complete and honest about what happens next.",
    "workedExample": "<form> <label for='name'>Your name</label> <input id='name' name='name' type='text'> <button type='submit'>Send enquiry</button> </form>",
    "commonMistake": "Submitting a form without testing it on a phone, which leaves overlapping labels and a button that cannot be reached comfortably.",
    "guided": [
      {
        "prompt": "Which combination makes an enquiry form usable?",
        "options": [
          "Labels for every field, suitable control types and a clear result message",
          "Styling only, with no labels",
          "A single text box for every question"
        ],
        "answer": 0,
        "explanation": "The form works when each field is described, the right control is offered and the result is reported."
      },
      {
        "prompt": "What should happen after a visitor submits an enquiry?",
        "options": [
          "The page tells them the message was received",
          "The page reloads with no message",
          "The fields empty with no explanation"
        ],
        "answer": 0,
        "explanation": "A visible result reassures the visitor and shows the enquiry reached the business."
      }
    ],
    "independent": "Build the complete enquiry form for the client site, covering name, email, phone, the service wanted and the message, and check it on a narrow screen.",
    "hints": [
      "Work through one field at a time.",
      "Test the whole form after each addition.",
      "Ask the client what happens to an enquiry after it is sent."
    ],
    "readiness": [
      {
        "prompt": "Which form can a client confidently publish?",
        "options": [
          "One with labelled fields, sensible controls and a confirmation message",
          "One with unlabelled fields and no button",
          "One that hides all of its fields"
        ],
        "answer": 0,
        "explanation": "A published form has to be complete and understandable for every visitor."
      }
    ],
    "lessonId": "adults-forms-project"
  },
  {
    "concept": "adults:adults-css-system:selectors",
    "courses": [
      "adults"
    ],
    "title": "Selectors that target the right elements",
    "meaning": "A CSS rule has a selector and a set of declarations. Type selectors match an element name, class selectors match a shared attribute and descendant selectors match elements nested inside others.",
    "whyItMatters": "Client sites reuse the same building blocks on every page. Selectors let one small change reach every button or card, instead of editing each page by hand.",
    "workedExample": ".service-card { padding: 1rem; } nav a { text-decoration: none; }",
    "commonMistake": "Styling with very long descendant chains that break as soon as the page structure changes, instead of giving the shared element a class.",
    "guided": [
      {
        "prompt": "Which selector matches every element carrying a particular class?",
        "options": [
          "A dot followed by the class name",
          "A hash followed by the class name",
          "The class name on its own after a space"
        ],
        "answer": 0,
        "explanation": "The dot means class, so it matches every element that shares that class name."
      },
      {
        "prompt": "When is a class selector the better choice?",
        "options": [
          "When the same styling is needed on several different elements",
          "When one unique element needs styling",
          "When the element name alone is not allowed"
        ],
        "answer": 0,
        "explanation": "A class is shared by design, so it suits a button style or a card used across the site."
      }
    ],
    "independent": "Find three pieces of styling repeated on the client site and give the shared element a single class that every instance can reuse.",
    "hints": [
      "Look for repetition in the pages before touching the CSS.",
      "Choose names that describe what the block is.",
      "Keep selectors short enough to read."
    ],
    "readiness": [
      {
        "prompt": "What does a class selector let a designer do?",
        "options": [
          "Style many elements that share a purpose with one rule",
          "Style only the first matching element",
          "Style elements that have no attributes"
        ],
        "answer": 0,
        "explanation": "One class rule reaches every element using that class, which keeps the site consistent."
      }
    ],
    "lessonId": "adults-css-system-selectors"
  },
  {
    "concept": "adults:adults-css-system:box-model",
    "courses": [
      "adults"
    ],
    "title": "Padding, borders and margin around a block",
    "meaning": "Every element is a box. Padding is the space inside the border, a border surrounds the padding and margin is the space outside the box.",
    "whyItMatters": "Most confusing layouts come down to this model. Knowing which space belongs to the box and which belongs to the gap between boxes saves hours of guesswork.",
    "workedExample": ".card { padding: 1rem; border: 1px solid #cccccc; margin-bottom: 1rem; box-sizing: border-box; }",
    "commonMistake": "Adding a width to a box that already has padding and a border, then wondering why it overflows, without using border-box sizing.",
    "guided": [
      {
        "prompt": "Which space sits inside the border of a box?",
        "options": [
          "The padding",
          "The margin",
          "The gap between two boxes"
        ],
        "answer": 0,
        "explanation": "Padding is the inner space, so it pushes content away from the border."
      },
      {
        "prompt": "What does box-sizing border-box change?",
        "options": [
          "The stated width includes the padding and the border",
          "The border is removed from the box",
          "The margin is added to the width"
        ],
        "answer": 0,
        "explanation": "With border-box the width a designer writes is the width the box actually occupies."
      }
    ],
    "independent": "Take one card on the client site and set its padding, border and margin deliberately, then switch to border-box sizing and check that its width behaves as written.",
    "hints": [
      "Decide the inner space before the outer space.",
      "Write a width you can predict.",
      "Measure the box in the browser tools as you change it."
    ],
    "readiness": [
      {
        "prompt": "Which part of the box model creates the gap between two cards?",
        "options": [
          "The margin",
          "The padding",
          "The border"
        ],
        "answer": 0,
        "explanation": "Margin is the space outside the box, so it separates one card from the next."
      }
    ],
    "lessonId": "adults-css-system-box-model"
  },
  {
    "concept": "adults:adults-css-system:tokens",
    "courses": [
      "adults"
    ],
    "title": "Design tokens for consistent styling",
    "meaning": "A design token is a CSS custom property that stores a repeated value, such as a brand colour or a spacing step, so one definition can be used everywhere.",
    "whyItMatters": "A client will ask for a colour or a font size change. With tokens that is one edit; without them it is a search through every rule on the site.",
    "workedExample": ":root { --brand: #1f4e79; --space: 1rem; } .button { background: var(--brand); padding: var(--space); }",
    "commonMistake": "Repeating the same colour value in dozens of rules, so a rebrand turns into an afternoon of careful edits and missed spots.",
    "guided": [
      {
        "prompt": "Where are design tokens usually defined?",
        "options": [
          "In a rule that matches the root of the document",
          "Inside every rule that uses them",
          "In the HTML head as comments"
        ],
        "answer": 0,
        "explanation": "Defining tokens at the root makes them available to the whole stylesheet."
      },
      {
        "prompt": "How is a stored token used in a rule?",
        "options": [
          "With the var function and the token name",
          "By writing the value out again",
          "By linking the stylesheet twice"
        ],
        "answer": 0,
        "explanation": "The var function reads the stored value, so a change in one place reaches every use."
      }
    ],
    "independent": "List the colours and spacing values the client site repeats, define them as tokens at the root and replace the repeated values with the tokens.",
    "hints": [
      "Count a value before you decide to store it.",
      "Name tokens by the role they play, not the colour they happen to be.",
      "Check the site still looks right after the change."
    ],
    "readiness": [
      {
        "prompt": "What is the main benefit of tokens when a client asks for a colour change?",
        "options": [
          "One edit updates every place the colour is used",
          "The colour is loaded faster",
          "The page needs no stylesheet"
        ],
        "answer": 0,
        "explanation": "Tokens keep one source of truth for each repeated value."
      }
    ],
    "lessonId": "adults-css-system-tokens"
  },
  {
    "concept": "adults:adults-css-system:states",
    "courses": [
      "adults"
    ],
    "title": "Visible states for links and buttons",
    "meaning": "Interactive elements have states. Hover, focus and active each need a visible style, and the focus style must be clear enough to follow from the keyboard.",
    "whyItMatters": "A visitor who cannot see where the keyboard is pointing cannot submit an enquiry or move through the menu, which turns an accessible site into an unusable one.",
    "workedExample": "a:hover { text-decoration: underline; } button:focus-visible { outline: 3px solid #1f4e79; }",
    "commonMistake": "Removing the focus outline to tidy the design, which leaves keyboard visitors with no way to tell which control will respond.",
    "guided": [
      {
        "prompt": "Which state is shown when a visitor moves through a page with the keyboard?",
        "options": [
          "Focus",
          "Hover",
          "Visited"
        ],
        "answer": 0,
        "explanation": "Focus marks the control that will respond to the next key press, so it must always be visible."
      },
      {
        "prompt": "Why should the focus outline never be removed without a replacement?",
        "options": [
          "Because keyboard visitors need to see where they are",
          "Because it slows the page down",
          "Because the browser requires the outline for printing"
        ],
        "answer": 0,
        "explanation": "Without a visible focus state the page becomes impossible to use from the keyboard."
      }
    ],
    "independent": "Add hover, focus and active styles to the client site menu and buttons, then move through the page with the keyboard only and confirm you can always see where you are.",
    "hints": [
      "Start with the focus state, not the hover state.",
      "Test with the keyboard and never with the mouse.",
      "Keep the focus style at least as clear as the hover style."
    ],
    "readiness": [
      {
        "prompt": "Which visitor depends most on a strong focus style?",
        "options": [
          "Someone navigating with the keyboard",
          "Someone reading on a large monitor",
          "Someone using a fast connection"
        ],
        "answer": 0,
        "explanation": "Focus exists for keyboard navigation, so that visitor needs it most."
      }
    ],
    "lessonId": "adults-css-system-states"
  },
  {
    "concept": "adults:adults-css-system:visual-system",
    "courses": [
      "adults"
    ],
    "title": "A consistent visual system",
    "meaning": "A visual system collects the shared type scale, colours, spacing and component styles into a small set of rules that every page uses in the same way.",
    "whyItMatters": "Clients judge a business by how consistent its site looks. A shared system keeps pages recognisable and makes later additions quick to fit.",
    "workedExample": ".card { border-radius: 8px; padding: var(--space); } h2 { font-size: 1.5rem; line-height: 1.3; }",
    "commonMistake": "Styling each page on its own so headings, buttons and spacing slowly drift apart across the site.",
    "guided": [
      {
        "prompt": "What does a visual system make easier?",
        "options": [
          "Adding a new page that already matches the rest of the site",
          "Removing the need for any CSS",
          "Avoiding the use of images"
        ],
        "answer": 0,
        "explanation": "Shared rules mean a new page inherits the look without new decisions."
      },
      {
        "prompt": "Which set of values belongs in a visual system?",
        "options": [
          "Type sizes, colours and spacing steps",
          "File names and folder paths",
          "Server addresses and passwords"
        ],
        "answer": 0,
        "explanation": "A visual system covers the repeated visual decisions, not the technical plumbing."
      }
    ],
    "independent": "Write down the type sizes, colours and spacing steps your client site already uses, then tidy the stylesheet so each heading level, button and card follows them.",
    "hints": [
      "Collect the values you actually used before inventing new ones.",
      "Change one component at a time and check the pages.",
      "Write a short note for the client about each shared value."
    ],
    "readiness": [
      {
        "prompt": "What tells a client that two pages belong to one business?",
        "options": [
          "The same type scale, colours and component styles",
          "The same file names",
          "The same number of paragraphs"
        ],
        "answer": 0,
        "explanation": "Consistency in type, colour and components is what makes pages feel like one site."
      }
    ],
    "lessonId": "adults-css-system-project"
  },
  {
    "concept": "adults:adults-responsive:viewport",
    "courses": [
      "adults"
    ],
    "title": "The viewport setting and flexible widths",
    "meaning": "The viewport meta tag tells the browser to match the page to the width of the device, and flexible widths then let the content reflow.",
    "whyItMatters": "Without that setting a phone pretends the page is desktop sized and shrinks it, which makes text tiny and forms hard to use.",
    "workedExample": "<meta name='viewport' content='width=device-width, initial-scale=1'>",
    "commonMistake": "Leaving the viewport tag out and setting a fixed pixel width instead, which forces sideways scrolling on every phone.",
    "guided": [
      {
        "prompt": "What does width=device-width ask the browser to do?",
        "options": [
          "Match the page to the device screen width",
          "Open the page in a new window",
          "Load a smaller stylesheet"
        ],
        "answer": 0,
        "explanation": "The setting makes the layout width follow the real screen rather than a default."
      },
      {
        "prompt": "What does initial-scale set?",
        "options": [
          "The starting zoom level of the page",
          "The load order of the stylesheets",
          "The number of columns in the layout"
        ],
        "answer": 0,
        "explanation": "A starting scale of one shows the page at its natural size on the device."
      }
    ],
    "independent": "Add the viewport setting to the client site, remove any fixed page width and check the layout on a narrow screen.",
    "hints": [
      "Add the setting before tuning the layout.",
      "Look for any fixed pixel width on the page shell.",
      "Test on the narrowest screen available to you."
    ],
    "readiness": [
      {
        "prompt": "What is the clearest symptom of a missing viewport setting on a phone?",
        "options": [
          "The text appears tiny and the page needs sideways scrolling",
          "The images disappear",
          "The stylesheet stops loading"
        ],
        "answer": 0,
        "explanation": "The browser treats the page as desktop sized and scales it down, which ruins readability."
      }
    ],
    "lessonId": "adults-responsive-viewport"
  },
  {
    "concept": "adults:adults-responsive:flex-row",
    "courses": [
      "adults"
    ],
    "title": "A flexible row with flexbox",
    "meaning": "A flex container lays its children out in a row, and properties such as gap, align-items and justify-content control the spacing and the alignment.",
    "whyItMatters": "Menus, feature rows and button groups all need to line up neatly and adapt to the space, which is quick to achieve with flexbox.",
    "workedExample": ".nav { display: flex; gap: 1rem; align-items: center; }",
    "commonMistake": "Floating each item left and adding margins to fake the spacing, which breaks as soon as one item changes size.",
    "guided": [
      {
        "prompt": "Which declaration turns an element into a flex container?",
        "options": [
          "display: flex",
          "position: flex",
          "layout: row"
        ],
        "answer": 0,
        "explanation": "The display value flex makes the children line up along an axis that the container controls."
      },
      {
        "prompt": "Which property sets even space between flex items?",
        "options": [
          "gap",
          "margin-left on every item",
          "text-align"
        ],
        "answer": 0,
        "explanation": "The gap property spaces the items evenly without extra rules on each child."
      }
    ],
    "independent": "Rebuild the client site menu as a flex row with even gaps, then add a second flex row for three service highlights and check the alignment.",
    "hints": [
      "Start with the container before the children.",
      "Use gap instead of individual margins.",
      "Check the row on a narrow screen as well."
    ],
    "readiness": [
      {
        "prompt": "What does align-items control in a flex row?",
        "options": [
          "How the items line up across the row",
          "The order the items appear in",
          "The colour of the items"
        ],
        "answer": 0,
        "explanation": "Alignment across the row keeps items of different heights sitting neatly together."
      }
    ],
    "lessonId": "adults-responsive-flex"
  },
  {
    "concept": "adults:adults-responsive:grid-columns",
    "courses": [
      "adults"
    ],
    "title": "A grid for cards and panels",
    "meaning": "A grid container divides space into columns and rows, and the repeat function with minmax lets the number of columns respond to the width available.",
    "whyItMatters": "Service lists, pricing panels and project galleries all need to sit in neat columns that rearrange themselves on smaller screens.",
    "workedExample": ".cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }",
    "commonMistake": "Placing each card at an exact pixel width, so the layout leaves gaps on wide screens and overflows on narrow ones.",
    "guided": [
      {
        "prompt": "Which declaration creates a grid container?",
        "options": [
          "display: grid",
          "display: columns",
          "position: grid"
        ],
        "answer": 0,
        "explanation": "The grid value makes the element lay its children out in tracks."
      },
      {
        "prompt": "What does minmax inside repeat allow?",
        "options": [
          "Columns that stay within a minimum and maximum size",
          "Columns that are always one size",
          "Rows that never wrap"
        ],
        "answer": 0,
        "explanation": "minmax sets the bounds each track respects, so the grid adapts to the space."
      }
    ],
    "independent": "Lay the client service cards out in a grid that keeps at least two columns on a laptop and drops to one on a phone.",
    "hints": [
      "Decide the smallest useful card width first.",
      "Let the grid decide how many columns fit.",
      "Test with a long service name to see what wraps."
    ],
    "readiness": [
      {
        "prompt": "Which unit lets grid columns share the free space fairly?",
        "options": [
          "fr",
          "px",
          "pt"
        ],
        "answer": 0,
        "explanation": "The fr unit divides the available space between the tracks."
      }
    ],
    "lessonId": "adults-responsive-grid"
  },
  {
    "concept": "adults:adults-responsive:breakpoints",
    "courses": [
      "adults"
    ],
    "title": "Breakpoints that adapt the layout",
    "meaning": "A media query applies rules only while a condition holds, usually a minimum width, so a layout can change between a phone and a wide screen.",
    "whyItMatters": "Clients expect a site to work on every device. Breakpoints are how one stylesheet serves a phone, a tablet and a desktop without a separate site.",
    "workedExample": "@media (min-width: 700px) { .cards { grid-template-columns: repeat(2, 1fr); } }",
    "commonMistake": "Writing a query for a specific phone model instead of a width where the content itself starts to look cramped.",
    "guided": [
      {
        "prompt": "What does a media query do?",
        "options": [
          "Applies rules only while its condition is true",
          "Loads a second stylesheet for every device",
          "Changes the HTML of the page"
        ],
        "answer": 0,
        "explanation": "A media query is a condition around a block of rules, so those rules apply only at certain widths."
      },
      {
        "prompt": "How should a breakpoint width be chosen?",
        "options": [
          "Where the content starts to look cramped",
          "From the model number of a popular phone",
          "From the screen size of the designer"
        ],
        "answer": 0,
        "explanation": "Breakpoints follow the content, so they hold up as devices change."
      }
    ],
    "independent": "Find the width where the client service cards stop looking comfortable and add a media query for that width that changes the layout.",
    "hints": [
      "Resize the browser slowly and watch when the layout struggles.",
      "Add the query around the rules that must change.",
      "Test either side of the breakpoint."
    ],
    "readiness": [
      {
        "prompt": "What should decide where a breakpoint sits?",
        "options": [
          "The point where the layout begins to strain",
          "The newest phone on the market",
          "The number of pages on the site"
        ],
        "answer": 0,
        "explanation": "Content led breakpoints survive changes in device sizes."
      }
    ],
    "lessonId": "adults-responsive-media"
  },
  {
    "concept": "adults:adults-responsive:responsive-project",
    "courses": [
      "adults"
    ],
    "title": "One page that fits every screen",
    "meaning": "A responsive page combines a viewport meta tag, flexible widths, a flex or grid layout and breakpoints so the same content suits any screen.",
    "whyItMatters": "Clients and their customers browse on phones. A page that needs sideways scrolling looks unprofessional and loses enquiries.",
    "workedExample": "<meta name='viewport' content='width=device-width, initial-scale=1'> .wrap { max-width: 900px; margin: 0 auto; }",
    "commonMistake": "Setting a fixed pixel width on the page wrapper, which forces sideways scrolling on every phone.",
    "guided": [
      {
        "prompt": "What does the viewport meta tag do?",
        "options": [
          "Tells the browser to match the page to the device width",
          "Centres the page on a desktop",
          "Loads a separate mobile stylesheet"
        ],
        "answer": 0,
        "explanation": "The viewport tag stops a phone from pretending the page is much wider than the screen."
      },
      {
        "prompt": "Which width setting suits a page wrapper that must work everywhere?",
        "options": [
          "A maximum width with automatic side margins",
          "A fixed pixel width",
          "A width measured in centimetres"
        ],
        "answer": 0,
        "explanation": "A maximum width keeps lines readable on large screens and lets the page narrow on small ones."
      }
    ],
    "independent": "Take the client home page and make it responsive end to end, checking the menu, the cards and the form on a narrow screen.",
    "hints": [
      "Add the viewport tag before anything else.",
      "Let widths be flexible and cap the maximum.",
      "Walk through the page on the narrowest screen you can."
    ],
    "readiness": [
      {
        "prompt": "What is the clearest sign that a page is not responsive?",
        "options": [
          "It needs sideways scrolling on a phone",
          "It uses a serif font",
          "It has more than one page"
        ],
        "answer": 0,
        "explanation": "Sideways scrolling on a phone is the classic symptom of a fixed width layout."
      }
    ],
    "lessonId": "adults-responsive-project"
  },
  {
    "concept": "adults:adults-javascript:values",
    "courses": [
      "adults"
    ],
    "title": "Values, variables and types",
    "meaning": "A variable names a stored value. Strings hold text, numbers hold figures and booleans hold true or false, and the type decides what an operation means.",
    "whyItMatters": "Business logic such as a price, a name or a yes or no answer starts as a value, and choosing the right type avoids quiet errors later.",
    "workedExample": "let price = 120; let label = 'kitchen fitting'; let urgent = false;",
    "commonMistake": "Storing a number as text, so adding two values joins them together instead of adding them up.",
    "guided": [
      {
        "prompt": "Which type holds a true or false value?",
        "options": [
          "A boolean",
          "A string",
          "A number"
        ],
        "answer": 0,
        "explanation": "A boolean has only two states, which suits a flag such as whether a form was completed."
      },
      {
        "prompt": "What does a variable declaration do?",
        "options": [
          "Names a value so the code can use it later",
          "Prints the value on the page",
          "Sends the value to a server"
        ],
        "answer": 0,
        "explanation": "Declaring a variable gives a value a name that the rest of the code can read."
      }
    ],
    "independent": "Write three variables for the client site, one for a service name, one for a price and one for whether an offer is running, and use each in a sentence.",
    "hints": [
      "Decide what kind of answer each value holds.",
      "Name variables so their meaning is obvious.",
      "Check the type when a calculation looks wrong."
    ],
    "readiness": [
      {
        "prompt": "Why does the type of a value matter?",
        "options": [
          "It decides what the value can do in an expression",
          "It decides how fast the file loads",
          "It decides the colour of the text"
        ],
        "answer": 0,
        "explanation": "Types govern the operations available, so text and numbers behave differently."
      }
    ],
    "lessonId": "adults-javascript-values"
  },
  {
    "concept": "adults:adults-javascript:functions",
    "courses": [
      "adults"
    ],
    "title": "Functions that name a piece of behaviour",
    "meaning": "A function packages a set of statements under a name, can receive values as parameters and can hand a result back with return.",
    "whyItMatters": "Once a site needs the same action in several places, a function keeps one copy of the logic and makes the page easier to change later.",
    "workedExample": "function formatPrice(amount) { return 'GBP ' + amount; }",
    "commonMistake": "Copying the same block of statements into three event handlers, so a later fix has to be made three times.",
    "guided": [
      {
        "prompt": "What does the return statement do in a function?",
        "options": [
          "Hands a result back to the code that called the function",
          "Prints the result on the page",
          "Stops the whole script"
        ],
        "answer": 0,
        "explanation": "A return value lets the caller use the result in another expression."
      },
      {
        "prompt": "Why give a function a clear name?",
        "options": [
          "So the code reads as a description of what happens",
          "So it runs faster",
          "So it needs no parameters"
        ],
        "answer": 0,
        "explanation": "A descriptive name makes the code read like the business rule it expresses."
      }
    ],
    "independent": "Find one piece of behaviour used more than once on the client site and replace it with a single named function that takes a parameter.",
    "hints": [
      "Start from the repeated block of code.",
      "Choose a name that states what the function does.",
      "Pass in the values that change."
    ],
    "readiness": [
      {
        "prompt": "Which feature lets a function receive values from the code that calls it?",
        "options": [
          "Parameters",
          "Comments",
          "Semicolons"
        ],
        "answer": 0,
        "explanation": "Parameters carry the values into the function body."
      }
    ],
    "lessonId": "adults-javascript-functions"
  },
  {
    "concept": "adults:adults-javascript:conditions",
    "courses": [
      "adults"
    ],
    "title": "Decisions with if and else",
    "meaning": "An if statement runs a block only when a comparison is true, and an else branch covers the remaining case.",
    "whyItMatters": "Business rules are full of decisions: whether a quote was requested, whether a field is complete, whether a discount applies.",
    "workedExample": "if (total > 100) { postage = 0; } else { postage = 5; }",
    "commonMistake": "Comparing values with a loose operator, so text and numbers are treated as equal when they are not the same value at all.",
    "guided": [
      {
        "prompt": "When does the block inside an if statement run?",
        "options": [
          "When its condition is true",
          "Always",
          "Only when the page is reloaded"
        ],
        "answer": 0,
        "explanation": "The condition is checked first, and the block runs only if it holds."
      },
      {
        "prompt": "Which operator compares two values strictly?",
        "options": [
          "===",
          "=",
          "!"
        ],
        "answer": 0,
        "explanation": "The triple equals compares both the value and the type, which avoids surprising matches."
      }
    ],
    "independent": "Add a condition to the client site that shows a different message when the visitor has not chosen a service yet.",
    "hints": [
      "Write the condition as a question with a yes or no answer.",
      "Compare types as well as values.",
      "Test both branches, not just the first one."
    ],
    "readiness": [
      {
        "prompt": "What does an else branch cover?",
        "options": [
          "The case where the condition is false",
          "The case where the condition is true",
          "The second run of the script"
        ],
        "answer": 0,
        "explanation": "The else branch handles everything the condition did not catch."
      }
    ],
    "lessonId": "adults-javascript-conditions"
  },
  {
    "concept": "adults:adults-javascript:dom-output",
    "courses": [
      "adults"
    ],
    "title": "Writing safe output into the page",
    "meaning": "JavaScript finds an element and changes it with textContent, which writes the value as plain text rather than interpreting it as markup.",
    "whyItMatters": "Visitor supplied text ends up on the page, so writing it as text keeps the site safe and the display correct.",
    "workedExample": "const node = document.querySelector('#status'); node.textContent = 'Quote requested';",
    "commonMistake": "Building the page with innerHTML from whatever the visitor typed, which lets unexpected markup into the page.",
    "guided": [
      {
        "prompt": "Which property writes a value as plain text?",
        "options": [
          "textContent",
          "innerHTML",
          "style"
        ],
        "answer": 0,
        "explanation": "textContent treats the value as text, so nothing inside it is treated as markup."
      },
      {
        "prompt": "Which method finds the first element matching a CSS selector?",
        "options": [
          "querySelector",
          "createElement",
          "addEventListener"
        ],
        "answer": 0,
        "explanation": "querySelector returns the first match for the selector, which is how a script gets a hold of an element."
      }
    ],
    "independent": "Use a script to write the visitor name from the enquiry form into a summary paragraph, using a text property rather than markup.",
    "hints": [
      "Write the text where the visitor expects to read it.",
      "Keep the writing in one function.",
      "Test with text that contains punctuation."
    ],
    "readiness": [
      {
        "prompt": "Why is a text property safer than writing markup?",
        "options": [
          "Anything typed by a visitor stays visible as text",
          "It makes the page load faster",
          "It removes the need for HTML"
        ],
        "answer": 0,
        "explanation": "Text properties escape the value, so typed content cannot change the structure of the page."
      }
    ],
    "lessonId": "adults-javascript-dom-output"
  },
  {
    "concept": "adults:adults-javascript:scripted-behaviour",
    "courses": [
      "adults"
    ],
    "title": "A scripted behaviour worth having",
    "meaning": "A useful script connects a trigger, such as a click or a form submission, to a named function that changes something the visitor can see.",
    "whyItMatters": "Clients ask for behaviour they can show people: a price estimate, a filtered list, a confirmation message. Each one is a trigger, a function and a visible result.",
    "workedExample": "function show(price) { document.querySelector('#out').textContent = price; }",
    "commonMistake": "Adding an event listener inside another listener, so a single click quietly runs the same work many times.",
    "guided": [
      {
        "prompt": "What three parts make a scripted behaviour?",
        "options": [
          "A trigger, a function that responds and a visible result",
          "A stylesheet, a font and a colour",
          "A server, a database and a password"
        ],
        "answer": 0,
        "explanation": "A trigger starts the work, the function does it and the result is what the visitor notices."
      },
      {
        "prompt": "Why is a named function better than a long inline handler?",
        "options": [
          "It can be tested and reused and reads more clearly",
          "It runs without JavaScript",
          "It needs no event listener"
        ],
        "answer": 0,
        "explanation": "A named function keeps the handler short and the behaviour reusable."
      }
    ],
    "independent": "Add one behaviour to the client site that a visitor would notice, such as a live estimate, and describe in one sentence what triggers it.",
    "hints": [
      "Decide the trigger before you write the function.",
      "Name the function after the business action.",
      "Check the result is visible without scrolling."
    ],
    "readiness": [
      {
        "prompt": "Which detail shows a scripted behaviour is finished?",
        "options": [
          "A visitor can see the page change",
          "The file is longer than before",
          "A comment describes the function"
        ],
        "answer": 0,
        "explanation": "The work is only done when the change reaches the screen."
      }
    ],
    "lessonId": "adults-javascript-project"
  },
  {
    "concept": "adults:adults-data:arrays",
    "courses": [
      "adults"
    ],
    "title": "Lists held in arrays",
    "meaning": "An array holds an ordered list of values, written with square brackets, and each item can be read by its position counting from zero.",
    "whyItMatters": "Services, prices and opening times are naturally lists, and an array keeps them together so one block of code can work through them.",
    "workedExample": "const services = ['fitting', 'repairs', 'maintenance']; const first = services[0];",
    "commonMistake": "Reading the first item with index one, which actually returns the second item and leaves a gap at the start of the list.",
    "guided": [
      {
        "prompt": "How is an array written?",
        "options": [
          "With square brackets around the values",
          "With curly braces around the values",
          "With a single value inside quotes"
        ],
        "answer": 0,
        "explanation": "Square brackets hold a list, and each value is separated by a comma."
      },
      {
        "prompt": "Which index reads the first item of an array?",
        "options": [
          "0",
          "1",
          "-1"
        ],
        "answer": 0,
        "explanation": "Index counting starts at zero, so the first item sits at index zero."
      }
    ],
    "independent": "Store the client service list in an array and write the array to the page as a single line of text.",
    "hints": [
      "Keep one kind of value in each array where you can.",
      "Count from zero when you read an item.",
      "Check the length before you reach for an index."
    ],
    "readiness": [
      {
        "prompt": "What does the length of an array tell you?",
        "options": [
          "How many items it holds",
          "The size of the file",
          "The first item in the list"
        ],
        "answer": 0,
        "explanation": "The length counts the items, which is useful before stepping through them."
      }
    ],
    "lessonId": "adults-data-arrays"
  },
  {
    "concept": "adults:adults-data:objects",
    "courses": [
      "adults"
    ],
    "title": "Records that group related values",
    "meaning": "An object groups named values into one record, so a service can hold its title, price and duration together under meaningful property names.",
    "whyItMatters": "Real business data comes in records: a customer, a booking, a quotation. Objects keep the fields together and make the code readable.",
    "workedExample": "const service = { title: 'Fitting', price: 120, duration: 2 }; const cost = service.price;",
    "commonMistake": "Relying on the position of values in an array instead of naming them, so nobody can tell which number is the price.",
    "guided": [
      {
        "prompt": "How is an object written?",
        "options": [
          "With curly braces around named properties",
          "With square brackets around values",
          "With a single quoted string"
        ],
        "answer": 0,
        "explanation": "Curly braces hold properties, each with a name and a value."
      },
      {
        "prompt": "How is a property of an object read?",
        "options": [
          "With the object name, a dot and the property name",
          "With the object name and an index",
          "With the property name alone"
        ],
        "answer": 0,
        "explanation": "The property name after a dot reads that field from the record."
      }
    ],
    "independent": "Write a record for one client service with a title, a price and a duration, then read and display the price on the page.",
    "hints": [
      "Decide the property names before the values.",
      "Use names a colleague would understand.",
      "Read one property at a time while testing."
    ],
    "readiness": [
      {
        "prompt": "Why is a named record clearer than a plain list of values?",
        "options": [
          "Each value is named, so its meaning is obvious",
          "It uses less memory",
          "It needs no punctuation"
        ],
        "answer": 0,
        "explanation": "Named properties explain themselves, which keeps business data readable."
      }
    ],
    "lessonId": "adults-data-objects"
  },
  {
    "concept": "adults:adults-data:foreach",
    "courses": [
      "adults"
    ],
    "title": "Working through a list with forEach",
    "meaning": "The forEach method runs a function once for every item in an array, passing the current item to the function as a parameter.",
    "whyItMatters": "Most business pages render a list of services or jobs. forEach turns one template into many blocks without repeating the markup by hand.",
    "workedExample": "items.forEach(function (item) { render(item); });",
    "commonMistake": "Using return inside a forEach callback expecting it to stop the loop, when forEach always visits every item.",
    "guided": [
      {
        "prompt": "How many times does the callback of forEach run?",
        "options": [
          "Once for every item in the array",
          "Once in total",
          "Only for the first item"
        ],
        "answer": 0,
        "explanation": "forEach visits each item in order and calls the function once per item."
      },
      {
        "prompt": "What does the callback receive?",
        "options": [
          "The current item from the array",
          "The length of the array",
          "A new empty array"
        ],
        "answer": 0,
        "explanation": "The function is given the current item so it can work with it."
      }
    ],
    "independent": "Store the client service list in an array and use forEach to write every service into its own block on the page.",
    "hints": [
      "Write the template for one item first.",
      "Check what the callback receives.",
      "Count the rendered blocks against the array length."
    ],
    "readiness": [
      {
        "prompt": "What is a sensible use of forEach on a client site?",
        "options": [
          "Rendering one card for each service in a list",
          "Loading the stylesheet",
          "Storing a password"
        ],
        "answer": 0,
        "explanation": "forEach suits turning a list of data into a list of page elements."
      }
    ],
    "lessonId": "adults-data-foreach"
  },
  {
    "concept": "adults:adults-data:render",
    "courses": [
      "adults"
    ],
    "title": "Rendering safely from data",
    "meaning": "Rendering means turning data into page elements. Building the elements in code and setting their text keeps visitor data out of the page structure.",
    "whyItMatters": "When a page shows customer or client content, a safe render keeps the layout intact and protects the site from injected markup.",
    "workedExample": "const card = document.createElement('p'); card.textContent = item.title; list.append(card);",
    "commonMistake": "Joining strings of markup together and assigning them to innerHTML, which lets anything inside the data change the page structure.",
    "guided": [
      {
        "prompt": "Which method creates a new page element in code?",
        "options": [
          "createElement",
          "querySelector",
          "addEventListener"
        ],
        "answer": 0,
        "explanation": "createElement builds an element that can then be filled and placed."
      },
      {
        "prompt": "How is data added to a new element without treating it as markup?",
        "options": [
          "By setting its text property",
          "By assigning it to innerHTML",
          "By putting it in a class name"
        ],
        "answer": 0,
        "explanation": "The text property keeps the value as text, so the structure of the page cannot be changed by the data."
      }
    ],
    "independent": "Render the client service list by creating an element for each service and setting its text, then append each one to the page.",
    "hints": [
      "Create, fill and place each item in turn.",
      "Keep the data out of the markup.",
      "Check the page with data that contains punctuation."
    ],
    "readiness": [
      {
        "prompt": "What makes a render safe?",
        "options": [
          "Text from the data is written as text, not as markup",
          "The data is short",
          "The page uses one stylesheet"
        ],
        "answer": 0,
        "explanation": "Treating data as text is what keeps the page structure under the developer's control."
      }
    ],
    "lessonId": "adults-data-render"
  },
  {
    "concept": "adults:adults-data:data-content",
    "courses": [
      "adults"
    ],
    "title": "Driving page content from data",
    "meaning": "A data driven page keeps its content in a list of records and renders the page from that list, so content and layout stay separate.",
    "whyItMatters": "A client who wants to add a service should not need a developer. Keeping content in data makes that change small and predictable.",
    "workedExample": "const services = [{ title: 'Fitting' }, { title: 'Repairs' }]; services.forEach(render);",
    "commonMistake": "Writing each service directly into the HTML by hand, so adding one means editing the structure and hoping nothing else breaks.",
    "guided": [
      {
        "prompt": "What is kept separate on a data driven page?",
        "options": [
          "The content and the layout",
          "The HTML and the CSS files",
          "The visitor and the server"
        ],
        "answer": 0,
        "explanation": "Content lives in data and the render turns it into elements, so each can change on its own."
      },
      {
        "prompt": "What happens when one record is added to the data list?",
        "options": [
          "One more block appears on the page",
          "The whole page must be rewritten",
          "Nothing changes until the markup is edited"
        ],
        "answer": 0,
        "explanation": "The render works through the list, so a new record produces a new block."
      }
    ],
    "independent": "Move the client service list into an array of records and render the section from that data instead of writing each item into the markup.",
    "hints": [
      "Move one item at a time and check the page.",
      "Keep the field names consistent across records.",
      "Confirm the render still handles an empty list."
    ],
    "readiness": [
      {
        "prompt": "What is the main benefit of driving content from data?",
        "options": [
          "The content can change without rewriting the page structure",
          "The page loads without JavaScript",
          "The stylesheet becomes optional"
        ],
        "answer": 0,
        "explanation": "Content in data is easy to change and keeps the layout stable."
      }
    ],
    "lessonId": "adults-data-project"
  },
  {
    "concept": "adults:adults-interaction:select",
    "courses": [
      "adults"
    ],
    "title": "Selecting elements to work with",
    "meaning": "A script uses a selector to find an element, either the first match or every match, and then works with the result.",
    "whyItMatters": "Every interactive feature starts by finding the right element. A reliable selection is what makes the rest of the script predictable.",
    "workedExample": "const buttons = document.querySelectorAll('.service-card');",
    "commonMistake": "Selecting with an id that appears on several elements, so only the first one is ever reached.",
    "guided": [
      {
        "prompt": "Which method returns every element matching a selector?",
        "options": [
          "querySelectorAll",
          "querySelector",
          "getElementById"
        ],
        "answer": 0,
        "explanation": "The all variant returns the whole set, which a script can then work through."
      },
      {
        "prompt": "What does querySelector return when several elements match?",
        "options": [
          "The first match only",
          "All of the matches",
          "An error"
        ],
        "answer": 0,
        "explanation": "querySelector stops at the first match, so use the all variant for a full set."
      }
    ],
    "independent": "Select the client site menu and all of its links in a script and confirm in the console that the count matches the page.",
    "hints": [
      "Inspect the page to confirm the selector matches.",
      "Prefer a class over an id for repeated items.",
      "Check the count before writing more code."
    ],
    "readiness": [
      {
        "prompt": "Why should a selector be checked before it is used?",
        "options": [
          "To confirm it finds the elements the script expects",
          "To make the page load faster",
          "To avoid writing any CSS"
        ],
        "answer": 0,
        "explanation": "A selector that finds nothing leaves the rest of the script working on an empty set."
      }
    ],
    "lessonId": "adults-interaction-select"
  },
  {
    "concept": "adults:adults-interaction:events",
    "courses": [
      "adults"
    ],
    "title": "Responding to clicks and submissions",
    "meaning": "An event listener attaches a function to an element for a named event, such as click or submit, and the function runs when that event happens.",
    "whyItMatters": "Interaction is how a site earns its keep: a quote request, a menu toggle, a filtered list. Each one starts with a listener on the right event.",
    "workedExample": "form.addEventListener('submit', function (event) { event.preventDefault(); });",
    "commonMistake": "Listening for the wrong event on a form, so the page reloads before the script can respond to the entry.",
    "guided": [
      {
        "prompt": "Which method attaches a function to an event?",
        "options": [
          "addEventListener",
          "querySelector",
          "preventDefault"
        ],
        "answer": 0,
        "explanation": "addEventListener names the event and the function that should respond."
      },
      {
        "prompt": "Why call preventDefault on a submit event?",
        "options": [
          "To stop the page reloading so the script can respond",
          "To clear the form fields",
          "To send the data to a server"
        ],
        "answer": 0,
        "explanation": "The default submit reloads the page, which would discard any script response."
      }
    ],
    "independent": "Attach a submit listener to the client enquiry form that stops the default reload and shows a short confirmation instead.",
    "hints": [
      "Decide which event matters before writing the handler.",
      "Keep the handler short and readable.",
      "Test with a real click, not only in the console."
    ],
    "readiness": [
      {
        "prompt": "What does an event listener need to know?",
        "options": [
          "Which event to watch and what to run when it happens",
          "The colour of the element",
          "The file size of the script"
        ],
        "answer": 0,
        "explanation": "The event name and the handler function are what make a listener work."
      }
    ],
    "lessonId": "adults-interaction-events"
  },
  {
    "concept": "adults:adults-interaction:validation",
    "courses": [
      "adults"
    ],
    "title": "Checking entries before they are sent",
    "meaning": "Validation reads what the visitor typed and decides whether it is complete and sensible before the form is allowed to continue.",
    "whyItMatters": "A client cannot act on an enquiry with no contact details. Checking on the page gives the visitor a fast answer and keeps poor entries out of the business inbox.",
    "workedExample": "if (email.value.trim() === '') { message.textContent = 'Please add an email address'; return; }",
    "commonMistake": "Trusting the browser to block every empty field and never checking on the page, which lets incomplete enquiries through.",
    "guided": [
      {
        "prompt": "What does on page validation protect against?",
        "options": [
          "Entries that are empty or obviously wrong",
          "Slow network connections",
          "Long file names"
        ],
        "answer": 0,
        "explanation": "Checking the entry before submission stops incomplete enquiries reaching the business."
      },
      {
        "prompt": "What should happen when a field fails validation?",
        "options": [
          "A clear message tells the visitor what to fix",
          "The page closes",
          "The entry is sent anyway"
        ],
        "answer": 0,
        "explanation": "The visitor needs to know what to change, in plain words next to the field."
      }
    ],
    "independent": "Add a check to the client enquiry form that refuses to send when the name, email or message field is empty and explains why.",
    "hints": [
      "Decide which fields are essential to the business.",
      "Write the message as an instruction.",
      "Test each rule on its own."
    ],
    "readiness": [
      {
        "prompt": "Which entry should a business form refuse to send?",
        "options": [
          "One with no contact details at all",
          "One with a short message",
          "One sent on a weekend"
        ],
        "answer": 0,
        "explanation": "Without contact details the business cannot reply, so that entry is not usable."
      }
    ],
    "lessonId": "adults-interaction-validation"
  },
  {
    "concept": "adults:adults-interaction:storage",
    "courses": [
      "adults"
    ],
    "title": "Remembering a choice in the browser",
    "meaning": "Browser storage saves a small value under a key, so a page can read it again on the next visit without a server.",
    "whyItMatters": "Small conveniences such as remembering a chosen branch or a display preference make a service site feel considered.",
    "workedExample": "localStorage.setItem('branch', 'north'); const branch = localStorage.getItem('branch');",
    "commonMistake": "Storing a complex object directly, which browser storage refuses, instead of converting it to text first.",
    "guided": [
      {
        "prompt": "Which method saves a value in browser storage?",
        "options": [
          "setItem",
          "getItem",
          "removeItem"
        ],
        "answer": 0,
        "explanation": "setItem writes a value under a key, and getItem reads it back."
      },
      {
        "prompt": "What kind of value can browser storage hold?",
        "options": [
          "Text",
          "Any object as it stands",
          "A CSS stylesheet"
        ],
        "answer": 0,
        "explanation": "Storage keeps text, so a record has to be converted to text before it is saved."
      }
    ],
    "independent": "Remember the branch a visitor selected on the client site and read it back when the page is opened again.",
    "hints": [
      "Choose a clear key name.",
      "Save a single value first.",
      "Test by reloading the page."
    ],
    "readiness": [
      {
        "prompt": "What does browser storage save a business site from doing?",
        "options": [
          "Asking the visitor for the same small choice on every visit",
          "Loading any CSS",
          "Using a form"
        ],
        "answer": 0,
        "explanation": "A remembered choice saves the visitor a repeated decision."
      }
    ],
    "lessonId": "adults-interaction-storage"
  },
  {
    "concept": "adults:adults-interaction:form-interaction",
    "courses": [
      "adults"
    ],
    "title": "A form that responds as it is used",
    "meaning": "A well built interaction combines selection, events, validation and storage so the form responds to the visitor and keeps anything worth remembering.",
    "whyItMatters": "This is the point where the site starts doing work for the business: guiding the visitor, catching mistakes and confirming what happened.",
    "workedExample": "form.addEventListener('submit', function (event) { event.preventDefault(); if (valid()) { show('Thank you'); } });",
    "commonMistake": "Writing the response before the validation, so the page congratulates a visitor whose enquiry is incomplete.",
    "guided": [
      {
        "prompt": "In what order should a form interaction run?",
        "options": [
          "Check the entry, then respond to the visitor",
          "Respond, then check the entry",
          "Save the entry, then check it"
        ],
        "answer": 0,
        "explanation": "Validation comes first so the response only appears for a usable entry."
      },
      {
        "prompt": "What is worth remembering between visits on an enquiry form?",
        "options": [
          "A small preference such as the branch selected",
          "The visitor's payment details",
          "The whole conversation"
        ],
        "answer": 0,
        "explanation": "Only a small, harmless preference should be kept, never sensitive detail."
      }
    ],
    "independent": "Complete the client form so it checks the important fields, responds clearly and remembers one small preference between visits.",
    "hints": [
      "Write the checks before the messages.",
      "Keep sensitive detail out of storage.",
      "Walk through the form as a visitor would."
    ],
    "readiness": [
      {
        "prompt": "Which order of work makes a form reliable?",
        "options": [
          "Collect, check, then respond",
          "Respond, then collect",
          "Store everything first"
        ],
        "answer": 0,
        "explanation": "Checking before responding means the visitor only sees a message that is true."
      }
    ],
    "lessonId": "adults-interaction-project"
  },
  {
    "concept": "adults:adults-quality:debug",
    "courses": [
      "adults"
    ],
    "title": "Debugging with evidence",
    "meaning": "Debugging starts from evidence: read the console message, find the line it names and change one thing at a time until the evidence changes.",
    "whyItMatters": "A site owner will report a fault in plain words. Being able to reproduce it and follow the evidence is what turns a report into a fix.",
    "workedExample": "console.log(typeof price, price);",
    "commonMistake": "Changing several lines at once hoping the fault disappears, which leaves nobody able to say what actually fixed it.",
    "guided": [
      {
        "prompt": "What is the first step when a page misbehaves?",
        "options": [
          "Reproduce the fault and read the console message",
          "Rewrite the whole script",
          "Delete the stylesheet"
        ],
        "answer": 0,
        "explanation": "A repeatable fault and its message are the evidence that leads to the cause."
      },
      {
        "prompt": "Why change one thing at a time?",
        "options": [
          "So the effect of each change is clear",
          "So the page loads faster",
          "So no comments are needed"
        ],
        "answer": 0,
        "explanation": "One change at a time keeps the cause and the cure connected."
      }
    ],
    "independent": "Reproduce one fault on the client site, note the console message and fix a single line, then write down what the evidence showed.",
    "hints": [
      "Write down the steps that cause the fault.",
      "Read the message the browser gives you.",
      "Change one line and test again."
    ],
    "readiness": [
      {
        "prompt": "What counts as evidence when debugging?",
        "options": [
          "A fault you can repeat and a message the browser reports",
          "A hunch about the code",
          "A guess from a colleague"
        ],
        "answer": 0,
        "explanation": "Evidence is what can be reproduced and read, not guessed."
      }
    ],
    "lessonId": "adults-quality-debug"
  },
  {
    "concept": "adults:adults-quality:access-check",
    "courses": [
      "adults"
    ],
    "title": "Checking the site for access problems",
    "meaning": "An access check looks at the page structure, the labels, the contrast and the keyboard path to find anything that stops a visitor using the site.",
    "whyItMatters": "A business site that excludes visitors loses enquiries, and fixing access problems early is far cheaper than fixing them after launch.",
    "workedExample": "<img src='plan.jpg' alt='Layout plan for a narrow kitchen'>",
    "commonMistake": "Judging a page only by how it looks on the designer's own laptop, which hides contrast and keyboard problems completely.",
    "guided": [
      {
        "prompt": "Which check belongs in an access review?",
        "options": [
          "Whether the page can be used with the keyboard alone",
          "Whether the fonts are the newest available",
          "Whether the files are small enough"
        ],
        "answer": 0,
        "explanation": "The keyboard path is one of the clearest indicators of an accessible page."
      },
      {
        "prompt": "What makes link text accessible?",
        "options": [
          "Naming the destination so it makes sense on its own",
          "Being as short as possible",
          "Being a different colour from the text"
        ],
        "answer": 0,
        "explanation": "Link text read on its own still needs to say where it goes."
      }
    ],
    "independent": "Walk through the client site with the keyboard only and note every place you lose track of where you are, then fix the worst one.",
    "hints": [
      "Start at the top and press Tab through the page.",
      "Check the heading order of each page.",
      "Note the problem in plain words before fixing it."
    ],
    "readiness": [
      {
        "prompt": "Which visitor is most affected by images with no description?",
        "options": [
          "Someone using a screen reader",
          "Someone on a fast connection",
          "Someone on a large screen"
        ],
        "answer": 0,
        "explanation": "A screen reader depends on the description to convey what the picture shows."
      }
    ],
    "lessonId": "adults-quality-accessibility"
  },
  {
    "concept": "adults:adults-quality:safe-details",
    "courses": [
      "adults"
    ],
    "title": "Keeping private details off the page",
    "meaning": "A published page is public. Personal addresses, private phone numbers, customer names and internal notes must stay out of the files that reach visitors.",
    "whyItMatters": "Publishing private detail exposes a business and the people it works with, and the mistake is often made once and copied to every page.",
    "workedExample": "<p>Enquiries are answered within one working day.</p>",
    "commonMistake": "Copying a real customer list or a home address into the page while testing and then publishing without removing it.",
    "guided": [
      {
        "prompt": "Which detail must not appear on a public business page?",
        "options": [
          "A private home address of a person",
          "The opening hours of the business",
          "A general enquiry address"
        ],
        "answer": 0,
        "explanation": "Private detail about a person must never be published, even while testing."
      },
      {
        "prompt": "What is the safest way to demonstrate a form during development?",
        "options": [
          "Use invented example details",
          "Use a real customer record",
          "Use the owner's personal number"
        ],
        "answer": 0,
        "explanation": "Invented examples prove the design without exposing anyone."
      }
    ],
    "independent": "Read through the client page and its comments and remove anything private, replacing real examples with invented ones.",
    "hints": [
      "Look in the comments as well as the visible words.",
      "Check every page, not only the home page.",
      "Replace real examples with plainly invented ones."
    ],
    "readiness": [
      {
        "prompt": "Why is a published page never a safe place for private detail?",
        "options": [
          "Because anyone who opens the address can read it",
          "Because it slows the page down",
          "Because search engines reject it"
        ],
        "answer": 0,
        "explanation": "A public page can be read and copied by anyone, so private detail cannot live there."
      }
    ],
    "lessonId": "adults-quality-security"
  },
  {
    "concept": "adults:adults-quality:release-note",
    "courses": [
      "adults"
    ],
    "title": "A short note with each release",
    "meaning": "A release note records what changed, what was tested and what is still open, in a few plain lines the client can read.",
    "whyItMatters": "Clients pay for visible progress. A short note answers the questions they will ask and protects the developer when something needs a follow up.",
    "workedExample": "Version 2: added the enquiry form and checked it on a phone. Open item: the price list still needs the client's figures.",
    "commonMistake": "Handing over a pile of changed files with no note, so the client cannot tell what was finished or what still waits on them.",
    "guided": [
      {
        "prompt": "What belongs in a release note?",
        "options": [
          "What changed, what was tested and what is still open",
          "A full copy of the code",
          "A list of every file name"
        ],
        "answer": 0,
        "explanation": "The note answers the client's questions rather than documenting the whole project."
      },
      {
        "prompt": "Why record what was tested?",
        "options": [
          "So the client knows what was checked rather than assumed",
          "So the file names stay short",
          "So no bugs can occur later"
        ],
        "answer": 0,
        "explanation": "Naming the tests shows what the release actually covers."
      }
    ],
    "independent": "Write a release note for the latest change to the client site, covering what you added, what you tested and anything still waiting.",
    "hints": [
      "Write it in plain words, as if speaking to the client.",
      "Keep the note to a few short lines.",
      "Say what is still open, honestly."
    ],
    "readiness": [
      {
        "prompt": "Which sentence belongs in a client release note?",
        "options": [
          "The enquiry form was added and tested on a phone",
          "Every file was saved",
          "The developer prefers one code editor"
        ],
        "answer": 0,
        "explanation": "Useful notes describe the change and the testing, not the habits of the developer."
      }
    ],
    "lessonId": "adults-quality-release"
  },
  {
    "concept": "adults:adults-quality:tested-release",
    "courses": [
      "adults"
    ],
    "title": "A release you have tested end to end",
    "meaning": "A finished release has been walked through as a visitor would use it, with every page read, every form tried and every fault either fixed or written down.",
    "whyItMatters": "The last check before hand over is what stands between a client's good first impression and a broken one.",
    "workedExample": "Checklist: pages open, menu works, form sends, headings read in order, images described.",
    "commonMistake": "Testing only the page that was changed and never the pages that link to it, which lets a broken link or layout reach the client.",
    "guided": [
      {
        "prompt": "How should the site be checked before release?",
        "options": [
          "By walking through it as a visitor would",
          "By reading the code only",
          "By checking the home page only"
        ],
        "answer": 0,
        "explanation": "A visitor path finds the problems that matter to the client."
      },
      {
        "prompt": "What happens to a fault found late in testing?",
        "options": [
          "It is fixed or written into the release note",
          "It is ignored until the client reports it",
          "The release is cancelled"
        ],
        "answer": 0,
        "explanation": "Either fix it or record it honestly, so nothing is hidden."
      }
    ],
    "independent": "Walk through the whole client site as a visitor, note every problem, fix what you can and list the rest in the release note.",
    "hints": [
      "Follow the path a real visitor would take.",
      "Check on a narrow screen and with the keyboard.",
      "Write down what you fixed and what remains."
    ],
    "readiness": [
      {
        "prompt": "Which release is ready to hand to a client?",
        "options": [
          "One walked through and tested as a visitor would use it",
          "One with the newest styling",
          "One with every file name tidy"
        ],
        "answer": 0,
        "explanation": "A release is ready when it has been used the way the client's visitors will use it."
      }
    ],
    "lessonId": "adults-quality-project"
  },
  {
    "concept": "adults:adults-structure:semantic-regions",
    "courses": [
      "adults"
    ],
    "title": "Semantic regions rather than plain containers",
    "meaning": "Semantic elements name the role of a region, so a header, a nav, a main and a footer each tell the browser and assistive technology what they contain.",
    "whyItMatters": "Clients review the structure long before the design. Named regions give the page meaning that survives any later styling change.",
    "workedExample": "<nav aria-label='Main menu'> <a href='#services'>Services</a> </nav>",
    "commonMistake": "Building the whole page from div elements with descriptive class names, which looks tidy to a developer but means nothing to assistive technology.",
    "guided": [
      {
        "prompt": "Why choose a semantic element over a div?",
        "options": [
          "It names the role the region plays",
          "It renders faster",
          "It removes the need for classes"
        ],
        "answer": 0,
        "explanation": "The element name carries meaning that a screen reader can announce."
      },
      {
        "prompt": "What does an aria-label add to a nav element?",
        "options": [
          "A name for the navigation, useful when a page has more than one",
          "Styling for the menu",
          "A link to the home page"
        ],
        "answer": 0,
        "explanation": "A label distinguishes one navigation from another for anyone listening to the page."
      }
    ],
    "independent": "Replace the generic containers around the client menu and main content with semantic elements and check the page still reads in order.",
    "hints": [
      "Walk the page and name each block out loud.",
      "Use the element that matches the name.",
      "Keep one main region per page."
    ],
    "readiness": [
      {
        "prompt": "Which element names the primary content of a page?",
        "options": [
          "main",
          "div",
          "span"
        ],
        "answer": 0,
        "explanation": "The main element identifies the primary content region."
      }
    ],
    "lessonId": "adults-structure-landmarks"
  },
  {
    "concept": "adults:adults-forms:label-connection",
    "courses": [
      "adults"
    ],
    "title": "Connecting each label to its field",
    "meaning": "A label is connected to a control through its for value and the id of the control, which turns the words into part of the field itself.",
    "whyItMatters": "Enquiry forms decide whether a visitor becomes a customer, and a connected label makes every field quicker and easier to complete.",
    "workedExample": "<label for='phone'>Phone number</label> <input id='phone' name='phone' type='tel'>",
    "commonMistake": "Reusing the same id on two fields, which leaves the label connected to the wrong control and breaks the link entirely.",
    "guided": [
      {
        "prompt": "What must match for a label to connect to a field?",
        "options": [
          "The for value and the id of the control",
          "The label text and the field name",
          "The label colour and the field border"
        ],
        "answer": 0,
        "explanation": "The for value points at the id, so the two must match exactly."
      },
      {
        "prompt": "What breaks a label connection?",
        "options": [
          "An id that appears on more than one element",
          "A label placed above the field",
          "A short label text"
        ],
        "answer": 0,
        "explanation": "Duplicate ids make the target ambiguous, so the connection cannot be trusted."
      }
    ],
    "independent": "Check every label on the client form, confirm each for value matches exactly one id on the page and fix any duplicates.",
    "hints": [
      "Search the page for repeated id values.",
      "Match capital letters exactly.",
      "Click each label to prove the pair works."
    ],
    "readiness": [
      {
        "prompt": "What is the sign of a properly connected label?",
        "options": [
          "Clicking the words puts the cursor in the field",
          "Clicking the words submits the form",
          "Clicking the words reloads the page"
        ],
        "answer": 0,
        "explanation": "A connected label forwards the click to the field, which shows the pair is joined."
      }
    ],
    "lessonId": "adults-forms-labels"
  },
  {
    "concept": "adults:adults-css-system:design-tokens",
    "courses": [
      "adults"
    ],
    "title": "One place for repeated values",
    "meaning": "A design token stores a repeated value once at the root of the stylesheet, under a name that says what the value is for.",
    "whyItMatters": "Rebrands and refinements are normal on a client project, and tokens turn an afternoon of edits into a single line.",
    "workedExample": ":root { --ink: #222222; --space: 1rem; } p { color: var(--ink); margin-bottom: var(--space); }",
    "commonMistake": "Naming a token after the current colour rather than its role, so the name becomes wrong the moment the palette changes.",
    "guided": [
      {
        "prompt": "What makes a token name useful six months later?",
        "options": [
          "It describes the role the value plays",
          "It records the exact colour code",
          "It matches the client's favourite word"
        ],
        "answer": 0,
        "explanation": "A role based name stays true even when the value changes."
      },
      {
        "prompt": "What does the var function do in a rule?",
        "options": [
          "Reads the value stored under a token name",
          "Creates a new token",
          "Deletes an unused token"
        ],
        "answer": 0,
        "explanation": "var brings the stored value into the declaration that needs it."
      }
    ],
    "independent": "Choose the three most repeated values on the client site, store them as tokens at the root and use them in the rules that need them.",
    "hints": [
      "Count how often a value appears before storing it.",
      "Name each token for its role.",
      "Search the stylesheet afterwards for any leftover raw values."
    ],
    "readiness": [
      {
        "prompt": "What is the risk of leaving raw values in the stylesheet?",
        "options": [
          "A later change misses the places that were not converted",
          "The page loads more slowly",
          "The tokens stop working"
        ],
        "answer": 0,
        "explanation": "Unconverted values keep the old look and undermine the point of tokens."
      }
    ],
    "lessonId": "adults-css-system-tokens"
  },
  {
    "concept": "adults:adults-css-system:interaction-states",
    "courses": [
      "adults"
    ],
    "title": "Hover, focus and active states",
    "meaning": "Each interactive state gives the visitor feedback: hover shows interest, focus shows the keyboard position and active shows the moment of the press.",
    "whyItMatters": "Clear states make a site feel responsive and keep it usable for anyone who navigates without a mouse.",
    "workedExample": ".link:hover { text-decoration: underline; } .link:focus-visible { outline: 3px solid #1f4e79; }",
    "commonMistake": "Styling hover so heavily that the focus state becomes invisible, which leaves keyboard visitors worse off than no styling at all.",
    "guided": [
      {
        "prompt": "Which state must always remain visible?",
        "options": [
          "Focus",
          "Hover",
          "Active"
        ],
        "answer": 0,
        "explanation": "Focus is the keyboard visitor's only clue about where they are."
      },
      {
        "prompt": "Why is hover alone never enough?",
        "options": [
          "Touch and keyboard visitors never hover",
          "It loads faster without it",
          "Hover only works on images"
        ],
        "answer": 0,
        "explanation": "Many visitors never trigger a hover, so the page needs states they can reach."
      }
    ],
    "independent": "Give every link and button on the client site a hover, a focus and an active state, then test the site with the keyboard only.",
    "hints": [
      "Design the focus state first.",
      "Keep the states clearly different from each other.",
      "Test with the keyboard, not just the mouse."
    ],
    "readiness": [
      {
        "prompt": "Which pair of visitors needs states other than hover?",
        "options": [
          "Keyboard and touch users",
          "Desktop users with a mouse",
          "Users on a large monitor"
        ],
        "answer": 0,
        "explanation": "Neither keyboard nor touch produces a hover, so both need focus and active feedback."
      }
    ],
    "lessonId": "adults-css-system-states"
  },
  {
    "concept": "adults:adults-responsive:layout-breakpoint",
    "courses": [
      "adults"
    ],
    "title": "Choosing a breakpoint from the layout",
    "meaning": "A breakpoint is the width at which the layout changes, chosen because the content starts to look cramped rather than because of a device name.",
    "whyItMatters": "Devices change every year, but the width at which a two column layout stops working stays stable, which keeps the stylesheet useful.",
    "workedExample": "@media (min-width: 720px) { .services { display: grid; grid-template-columns: repeat(2, 1fr); } }",
    "commonMistake": "Copying a list of device widths from an old article, so the layout changes at points that do not match the content at all.",
    "guided": [
      {
        "prompt": "What should decide a breakpoint width?",
        "options": [
          "The point where the content starts to look cramped",
          "The newest phone dimensions",
          "The designer's own screen size"
        ],
        "answer": 0,
        "explanation": "Content led breakpoints hold up as devices come and go."
      },
      {
        "prompt": "How many breakpoints does a simple business site usually need?",
        "options": [
          "One or two, chosen from the layout",
          "One for every device model",
          "None at all"
        ],
        "answer": 0,
        "explanation": "Most pages need very few changes to work across widths."
      }
    ],
    "independent": "Resize the client page slowly, note the width where each section strains and add a media query for the most important one.",
    "hints": [
      "Resize gradually and watch the content, not the ruler.",
      "Add one breakpoint at a time.",
      "Test just above and just below the width you chose."
    ],
    "readiness": [
      {
        "prompt": "What does a media query with min-width do?",
        "options": [
          "Applies its rules from that width upwards",
          "Applies its rules only on one phone model",
          "Hides the rules on tablets"
        ],
        "answer": 0,
        "explanation": "A min-width query adds rules once the viewport reaches that width."
      }
    ],
    "lessonId": "adults-responsive-media"
  },
  {
    "concept": "adults:adults-javascript:named-functions",
    "courses": [
      "adults"
    ],
    "title": "Functions with clear names",
    "meaning": "A named function groups a block of statements under a description, takes the values it needs as parameters and returns a result when one is useful.",
    "whyItMatters": "Named functions turn a script into a list of business actions, which makes the code reviewable by anyone on the team.",
    "workedExample": "function totalWithPostage(total) { return total + 5; }",
    "commonMistake": "Writing one enormous function that selects elements, validates, saves and renders, so no part of it can be tested or reused.",
    "guided": [
      {
        "prompt": "What makes a function easy to reuse?",
        "options": [
          "It takes the values that change as parameters",
          "It reads values from the whole page",
          "It contains every step of the program"
        ],
        "answer": 0,
        "explanation": "Parameters let the same function serve many cases."
      },
      {
        "prompt": "Why return a value instead of writing to the page inside the function?",
        "options": [
          "The result can be used or tested anywhere",
          "It makes the script shorter",
          "It avoids the need for a function name"
        ],
        "answer": 0,
        "explanation": "Returning a value separates the calculation from the display, which makes it testable."
      }
    ],
    "independent": "Split one long handler on the client site into two or three named functions, each doing a single job.",
    "hints": [
      "Name each function after the action it performs.",
      "Pass in the values that vary.",
      "Check the page still behaves after the split."
    ],
    "readiness": [
      {
        "prompt": "Which function is easiest to test?",
        "options": [
          "One that takes a value and returns a result",
          "One that changes the page directly",
          "One that reads the clock and the page at once"
        ],
        "answer": 0,
        "explanation": "A value in and a result out can be tested without the page."
      }
    ],
    "lessonId": "adults-javascript-functions"
  },
  {
    "concept": "adults:adults-javascript:safe-output",
    "courses": [
      "adults"
    ],
    "title": "Writing text into the page safely",
    "meaning": "Output written with a text property stays text, so a value from a visitor can appear on the page without being treated as markup.",
    "whyItMatters": "Enquiry forms and review fields put visitor words onto a page, and writing them as text keeps the page structure under the developer's control.",
    "workedExample": "const note = document.querySelector('#note'); note.textContent = entry;",
    "commonMistake": "Assigning visitor input to innerHTML, which lets anything the visitor typed become part of the page structure.",
    "guided": [
      {
        "prompt": "Which property writes a value as text only?",
        "options": [
          "textContent",
          "innerHTML",
          "dataset"
        ],
        "answer": 0,
        "explanation": "The text property treats the value as words, never as markup."
      },
      {
        "prompt": "Which kind of value is most risky to write as markup?",
        "options": [
          "Anything a visitor can type",
          "A number decided in the code",
          "A fixed string in the script"
        ],
        "answer": 0,
        "explanation": "Values the visitor controls cannot be trusted, so they must be written as text."
      }
    ],
    "independent": "Check every place the client site writes visitor data into the page and change any that treat it as markup to a text property.",
    "hints": [
      "Follow the data from the field to the page.",
      "Search the script for markup assignments.",
      "Test with text that includes symbols."
    ],
    "readiness": [
      {
        "prompt": "What is the safe way to show a visitor's message on the page?",
        "options": [
          "Write it with a text property",
          "Join it into markup and assign it",
          "Put it into an attribute name"
        ],
        "answer": 0,
        "explanation": "Text properties display the value without changing the structure of the page."
      }
    ],
    "lessonId": "adults-javascript-dom-output"
  },
  {
    "concept": "adults:adults-data:record-shape",
    "courses": [
      "adults"
    ],
    "title": "The shape of a record",
    "meaning": "A record has a fixed shape: the property names stay the same and only the values change, so the code can rely on each field.",
    "whyItMatters": "Consistency across records is what lets one render work for every service, every quotation and every booking.",
    "workedExample": "const job = { title: 'Repair', price: 90, days: 2 };",
    "commonMistake": "Adding an extra property to one record only, so the render handles that item differently and the page becomes unpredictable.",
    "guided": [
      {
        "prompt": "What stays the same across records of the same kind?",
        "options": [
          "The property names",
          "The values",
          "The number of pages"
        ],
        "answer": 0,
        "explanation": "A stable set of names is what makes the records interchangeable."
      },
      {
        "prompt": "Why does a missing property cause trouble?",
        "options": [
          "The code reads a value that is not there",
          "The page loads a second time",
          "The stylesheet stops working"
        ],
        "answer": 0,
        "explanation": "Code written against the shape expects each name to hold a value."
      }
    ],
    "independent": "Write three client services as records with exactly the same property names and check the render handles all three.",
    "hints": [
      "Write the first record, then copy its shape.",
      "Keep the same names in every record.",
      "Decide what to show when a value is empty."
    ],
    "readiness": [
      {
        "prompt": "What does a consistent record shape let you do?",
        "options": [
          "Render every record with the same code",
          "Avoid writing any JavaScript",
          "Store the records as images"
        ],
        "answer": 0,
        "explanation": "One render serves many records when the shape never varies."
      }
    ],
    "lessonId": "adults-data-objects"
  },
  {
    "concept": "adults:adults-interaction:saved-preference",
    "courses": [
      "adults"
    ],
    "title": "Saving a small preference",
    "meaning": "A small preference can be saved in the browser under a key and read back on the next visit, so the site remembers the visitor's choice.",
    "whyItMatters": "Remembering a branch or a display option makes a service site feel thoughtful without asking the visitor to repeat themselves.",
    "workedExample": "localStorage.setItem('branch', chosen); const saved = localStorage.getItem('branch');",
    "commonMistake": "Saving everything the visitor did in the browser, including private detail, when the browser is not a safe place for sensitive information.",
    "guided": [
      {
        "prompt": "Which value is suitable for browser storage?",
        "options": [
          "A chosen branch name",
          "A payment card number",
          "A customer's full record"
        ],
        "answer": 0,
        "explanation": "Only small and harmless preferences belong in the browser."
      },
      {
        "prompt": "What happens when the stored key is missing?",
        "options": [
          "The read returns nothing and the code needs a default",
          "The page fails to load",
          "The storage is deleted"
        ],
        "answer": 0,
        "explanation": "Code should expect an empty result on a first visit and fall back to a sensible default."
      }
    ],
    "independent": "Save the visitor's chosen service category on the client site and use the stored value to preselect it on their next visit.",
    "hints": [
      "Choose a short and clear key name.",
      "Plan for the first visit, when nothing is stored.",
      "Never store private detail."
    ],
    "readiness": [
      {
        "prompt": "What does the site need on a visitor's first visit?",
        "options": [
          "A default value to use when nothing is stored",
          "A prompt for a password",
          "A second browser"
        ],
        "answer": 0,
        "explanation": "Without a stored value the page needs a sensible fallback."
      }
    ],
    "lessonId": "adults-interaction-storage"
  },
  {
    "concept": "adults:adults-quality:private-detail",
    "courses": [
      "adults"
    ],
    "title": "Private detail stays unpublished",
    "meaning": "Anything in a published file can be read by anyone, so private addresses, personal numbers, real customer names and internal notes must be removed before release.",
    "whyItMatters": "A single copied example can expose a business and the people who trusted it, and the damage is immediate and public.",
    "workedExample": "<p>Call the office on the number on our contact page.</p>",
    "commonMistake": "Leaving a real customer record in the page as a demonstration and forgetting to remove it before the site goes live.",
    "guided": [
      {
        "prompt": "Which item is not safe to publish?",
        "options": [
          "A real customer's phone number",
          "The business opening hours",
          "A general enquiry address"
        ],
        "answer": 0,
        "explanation": "Personal contact detail belongs to a person and cannot be published."
      },
      {
        "prompt": "What should replace real data during development?",
        "options": [
          "Invented examples that look realistic",
          "A copy of the client database",
          "The owner's own contact details"
        ],
        "answer": 0,
        "explanation": "Invented examples prove the design while keeping everyone safe."
      }
    ],
    "independent": "Search the client site and its code comments for anything private and replace it with invented examples.",
    "hints": [
      "Check the comments as well as the visible text.",
      "Look for names, numbers and addresses.",
      "Test the site as if a stranger were reading it."
    ],
    "readiness": [
      {
        "prompt": "Who can read a published web page?",
        "options": [
          "Anyone who knows the address",
          "Only the developer",
          "Only the client"
        ],
        "answer": 0,
        "explanation": "A public page can be opened and copied by anyone, so private detail cannot be there."
      }
    ],
    "lessonId": "adults-quality-security"
  },
  {
    "concept": "adults:adults-forms:control-types",
    "courses": [
      "adults"
    ],
    "title": "Matching controls to answers",
    "meaning": "The input type tells the browser which keyboard, picker or widget to offer, so it should match the answer the field expects.",
    "whyItMatters": "Choosing the right control shortens the form on a phone and lets the browser check an entry before it reaches the business.",
    "workedExample": "<input type='email' id='email' name='email'> <input type='date' id='visit' name='visit'>",
    "commonMistake": "Leaving a date field as plain text, so every visitor types the date in a different order and none can be compared.",
    "guided": [
      {
        "prompt": "Which control suits a date?",
        "options": [
          "A date input",
          "A text input",
          "A checkbox"
        ],
        "answer": 0,
        "explanation": "A date picker removes ambiguity about order and format."
      },
      {
        "prompt": "Which control suits a single choice from a short list?",
        "options": [
          "Radio buttons in a group",
          "A paragraph of text",
          "A hidden field"
        ],
        "answer": 0,
        "explanation": "Radio buttons present the options plainly and allow only one selection."
      }
    ],
    "independent": "Review every field on the client form and change its control so it matches the answer expected, then test the form on a phone.",
    "hints": [
      "Ask what kind of answer each field expects.",
      "Match the control to that answer.",
      "Test the form on a narrow screen."
    ],
    "readiness": [
      {
        "prompt": "What does the right input type improve?",
        "options": [
          "The effort of completing the form on a phone",
          "The load speed of the stylesheet",
          "The number of pages on the site"
        ],
        "answer": 0,
        "explanation": "The type drives the on screen keyboard, which makes the form quicker to complete."
      }
    ],
    "lessonId": "adults-forms-types"
  },
  {
    "concept": "adults:adults-forms:live-feedback",
    "courses": [
      "adults"
    ],
    "title": "Feedback that arrives as it is needed",
    "meaning": "Feedback can appear beside a field while it is being completed and in a status region once the form is submitted.",
    "whyItMatters": "A visitor who cannot tell whether an entry was accepted will often leave the form, which costs the business an enquiry.",
    "workedExample": "<p role='status'>Your enquiry was received. We reply within one working day.</p>",
    "commonMistake": "Showing feedback that disappears after a moment, so a visitor who looked away never learns what happened.",
    "guided": [
      {
        "prompt": "Where does per field feedback belong?",
        "options": [
          "Next to the field it describes",
          "At the very bottom of the page",
          "In a separate window"
        ],
        "answer": 0,
        "explanation": "Feedback beside the field is read at the moment it is needed."
      },
      {
        "prompt": "What is a status region for?",
        "options": [
          "Announcing a change that matters, such as a submitted form",
          "Styling the page",
          "Storing the entry"
        ],
        "answer": 0,
        "explanation": "A status region tells everyone, including a screen reader user, that something changed."
      }
    ],
    "independent": "Add field level feedback and a status message to the client enquiry form, then test the form from start to finish.",
    "hints": [
      "Decide what the visitor needs to know at each step.",
      "Keep messages short and specific.",
      "Test with a screen reader if you can."
    ],
    "readiness": [
      {
        "prompt": "What should a visitor see after a successful submission?",
        "options": [
          "A clear message confirming the enquiry was received",
          "A blank page",
          "Nothing at all"
        ],
        "answer": 0,
        "explanation": "Confirmation closes the loop and reassures the visitor."
      }
    ],
    "lessonId": "adults-forms-messages"
  },
  {
    "concept": "adults:adults-responsive:flexible-layout",
    "courses": [
      "adults"
    ],
    "title": "Layouts built from flexible widths",
    "meaning": "Flexible layouts use relative units and maximum widths so content reflows on any screen, instead of assuming one fixed canvas.",
    "whyItMatters": "A client's visitors arrive on everything from a small phone to a large monitor, and a flexible layout serves them all from one stylesheet.",
    "workedExample": ".wrap { width: 100%; max-width: 880px; margin: 0 auto; }",
    "commonMistake": "Setting a fixed pixel width on the page shell, which forces sideways scrolling on every phone.",
    "guided": [
      {
        "prompt": "What is a flexible way to set a main content width?",
        "options": [
          "A percentage with a maximum width",
          "A fixed pixel width",
          "A width measured in points"
        ],
        "answer": 0,
        "explanation": "A flexible width fills the screen while the maximum keeps lines readable."
      },
      {
        "prompt": "What unit keeps text readable as the screen changes?",
        "options": [
          "A relative unit such as rem",
          "A fixed pixel size",
          "A unit based on the file size"
        ],
        "answer": 0,
        "explanation": "Relative units scale with the visitor's own settings."
      }
    ],
    "independent": "Change the client page shell so its width is flexible with a sensible maximum, then check it on the widest and narrowest screens you can.",
    "hints": [
      "Set the flexible width before the maximum.",
      "Use relative units for text.",
      "Test the extremes, not just your own screen."
    ],
    "readiness": [
      {
        "prompt": "Which structure stays readable on a large monitor?",
        "options": [
          "A flexible width capped by a maximum",
          "A fixed pixel width",
          "A width that fills the screen edge to edge"
        ],
        "answer": 0,
        "explanation": "A maximum keeps line length comfortable while the width stays flexible."
      }
    ],
    "lessonId": "adults-responsive-viewport"
  },
  {
    "concept": "adults:adults-responsive:card-grid",
    "courses": [
      "adults"
    ],
    "title": "Cards in a responsive grid",
    "meaning": "Card grids use repeat with minmax or auto-fit so the number of columns follows the space available rather than a fixed count.",
    "whyItMatters": "Service lists and project galleries look orderly in a grid and rearrange themselves neatly when the screen narrows.",
    "workedExample": ".cards { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }",
    "commonMistake": "Forcing three columns at every width, so the cards squash on a phone and become unreadable.",
    "guided": [
      {
        "prompt": "How can a grid decide its own column count?",
        "options": [
          "With repeat and auto-fit around a minimum card width",
          "With a fixed column count for every screen",
          "With a margin on each card"
        ],
        "answer": 0,
        "explanation": "auto-fit fits as many columns as the minimum width allows."
      },
      {
        "prompt": "Why does a grid beat a fixed column count?",
        "options": [
          "It adapts as the space changes",
          "It loads fewer files",
          "It removes the need for a gap"
        ],
        "answer": 0,
        "explanation": "An adaptive grid stays readable across widths without extra rules."
      }
    ],
    "independent": "Lay the client service cards out in a grid that fits as many columns as the space allows, then test it at several widths.",
    "hints": [
      "Decide the smallest width a card can use.",
      "Let the grid count the columns.",
      "Check the last row when the count changes."
    ],
    "readiness": [
      {
        "prompt": "What should happen to a card grid on a phone?",
        "options": [
          "It drops to a single readable column",
          "It keeps three columns",
          "It hides the cards"
        ],
        "answer": 0,
        "explanation": "One column keeps the content readable on a narrow screen."
      }
    ],
    "lessonId": "adults-responsive-grid"
  },
  {
    "concept": "adults:adults-interaction:element-selection",
    "courses": [
      "adults"
    ],
    "title": "Finding elements reliably",
    "meaning": "A script finds elements with a selector, using querySelector for a single match and querySelectorAll for a whole set.",
    "whyItMatters": "Everything interactive depends on finding the right element, so a reliable selector is the first step of every feature.",
    "workedExample": "const menu = document.querySelector('nav');",
    "commonMistake": "Relying on a selector that matches nothing, then wondering why the script never runs, without checking the count in the console.",
    "guided": [
      {
        "prompt": "Which method returns a single element?",
        "options": [
          "querySelector",
          "querySelectorAll",
          "addEventListener"
        ],
        "answer": 0,
        "explanation": "querySelector stops at the first match, which suits a unique element."
      },
      {
        "prompt": "What should be checked before using a selection?",
        "options": [
          "That the selector matches the elements expected",
          "That the page has no stylesheet",
          "That the script file is small"
        ],
        "answer": 0,
        "explanation": "A quick count in the console confirms the selector is doing what the script assumes."
      }
    ],
    "independent": "Write a script that selects the client menu and its links, then log the number of matches and confirm it against the page.",
    "hints": [
      "Look at the page in the browser tools first.",
      "Use a class for repeated elements.",
      "Check the count before building on it."
    ],
    "readiness": [
      {
        "prompt": "Why is querySelectorAll useful for a menu?",
        "options": [
          "It returns every link so the script can work through them",
          "It returns only the first link",
          "It styles the menu"
        ],
        "answer": 0,
        "explanation": "The whole set is what a script needs for a menu or a card list."
      }
    ],
    "lessonId": "adults-interaction-select"
  },
  {
    "concept": "adults:adults-javascript:branch-decisions",
    "courses": [
      "adults"
    ],
    "title": "Deciding with branches",
    "meaning": "A branch runs a block of code when a condition holds, and an else branch covers the case where it does not.",
    "whyItMatters": "Business rules are decisions, from whether a quote is needed to whether a message is required, and each one belongs in a clear branch.",
    "workedExample": "if (service === 'fitting') { showQuote(); } else { showAdvice(); }",
    "commonMistake": "Nesting branch inside branch until no one can say which combination runs, instead of combining the conditions in one test.",
    "guided": [
      {
        "prompt": "Which operator compares value and type together?",
        "options": [
          "===",
          "==",
          "="
        ],
        "answer": 0,
        "explanation": "The strict operator avoids matches between different types."
      },
      {
        "prompt": "What should a branch do about the visitor's next step?",
        "options": [
          "Offer a clear action for the case it handles",
          "Say nothing",
          "Reload the page"
        ],
        "answer": 0,
        "explanation": "Each branch should lead the visitor somewhere useful."
      }
    ],
    "independent": "Add a branch to the client form that shows different guidance depending on whether the visitor has selected a service.",
    "hints": [
      "Write the condition as a single question.",
      "Test both outcomes of the condition.",
      "Keep one decision per branch where you can."
    ],
    "readiness": [
      {
        "prompt": "What does an else branch handle?",
        "options": [
          "The case the condition did not catch",
          "The same case again",
          "The stylesheet"
        ],
        "answer": 0,
        "explanation": "The else branch covers everything outside the condition."
      }
    ],
    "lessonId": "adults-javascript-conditions"
  },
  {
    "concept": "adults:adults-quality:handover-notes",
    "courses": [
      "adults"
    ],
    "title": "Notes the client can use",
    "meaning": "Handover notes explain in plain words what the site does, how to change the content and what still needs attention.",
    "whyItMatters": "A client who can make small changes themselves needs the developer less, and a written handover protects both sides after the project ends.",
    "workedExample": "To change the service list, open the data array at the top of the script and edit the titles.",
    "commonMistake": "Handing over a folder of files with no explanation, so every small content change becomes a paid support call.",
    "guided": [
      {
        "prompt": "What makes handover notes useful?",
        "options": [
          "They say in plain words how to make common changes",
          "They list every function in the script",
          "They name the version of the code editor"
        ],
        "answer": 0,
        "explanation": "The client needs to know how to change content, not how the code is organised."
      },
      {
        "prompt": "Why record what is still outstanding?",
        "options": [
          "So the client knows what to expect next",
          "So the notes look longer",
          "So tests can be skipped"
        ],
        "answer": 0,
        "explanation": "An honest list of open items sets expectations and avoids surprises."
      }
    ],
    "independent": "Write short handover notes for the client site covering how to change the service list, the contact details and anything still open.",
    "hints": [
      "Write for a reader who does not code.",
      "Cover the changes the client is most likely to want.",
      "Be honest about what is unfinished."
    ],
    "readiness": [
      {
        "prompt": "Who are handover notes written for?",
        "options": [
          "The client who will own and change the site",
          "The next developer only",
          "The hosting company only"
        ],
        "answer": 0,
        "explanation": "The notes serve the person responsible for the site after handover."
      }
    ],
    "lessonId": "adults-quality-release"
  },
  {
    "concept": "adults:adults-interaction:input-validation",
    "courses": [
      "adults"
    ],
    "title": "Checking what the visitor typed",
    "meaning": "Validation reads the values in a form and decides whether each one is complete and believable before the entry is accepted.",
    "whyItMatters": "A business cannot reply to an enquiry with no contact details, and a quick on page check saves everyone a wasted exchange.",
    "workedExample": "if (message.value.trim().length < 10) { hint.textContent = 'Please describe what you need'; }",
    "commonMistake": "Writing one vague message for every failed check, so the visitor cannot tell which field needs attention.",
    "guided": [
      {
        "prompt": "What does trimming a value before checking it remove?",
        "options": [
          "Spaces at the start and the end",
          "Numbers inside the value",
          "The punctuation"
        ],
        "answer": 0,
        "explanation": "Trimming stops a value made only of spaces from passing a check."
      },
      {
        "prompt": "Why should each failed check name the field?",
        "options": [
          "So the visitor knows exactly what to correct",
          "So the script runs faster",
          "So the form submits without a button"
        ],
        "answer": 0,
        "explanation": "Specific guidance is what lets the visitor fix the entry quickly."
      }
    ],
    "independent": "Add a check to the client form for each essential field that names the field and says plainly what is needed.",
    "hints": [
      "Decide which fields the business cannot do without.",
      "Write the message as an instruction.",
      "Test each check with an empty and a filled field."
    ],
    "readiness": [
      {
        "prompt": "Which rule protects the business most?",
        "options": [
          "Refusing an enquiry with no way to reply",
          "Refusing a short message",
          "Refusing an enquiry sent on a weekend"
        ],
        "answer": 0,
        "explanation": "An enquiry with no contact details cannot be acted on at all."
      }
    ],
    "lessonId": "adults-interaction-validation"
  },
  {
    "concept": "adults:adults-interaction:submit-events",
    "courses": [
      "adults"
    ],
    "title": "Handling a form submission",
    "meaning": "A submit listener runs when a form is submitted, and calling preventDefault stops the page reloading so the script can respond.",
    "whyItMatters": "The moment of submission is where the business either receives an enquiry or loses one, so the handler must be deliberate.",
    "workedExample": "form.addEventListener('submit', function (event) { event.preventDefault(); respond(); });",
    "commonMistake": "Forgetting to stop the default behaviour, so the page reloads and the visitor never sees the confirmation.",
    "guided": [
      {
        "prompt": "Which event fires when a form is submitted?",
        "options": [
          "submit",
          "click",
          "load"
        ],
        "answer": 0,
        "explanation": "The submit event is the form's own event, so a listener on the form catches it."
      },
      {
        "prompt": "What does preventDefault stop?",
        "options": [
          "The browser reloading the page",
          "The visitor typing",
          "The stylesheet loading"
        ],
        "answer": 0,
        "explanation": "Stopping the default reload keeps the visitor on the page to see the result."
      }
    ],
    "independent": "Attach a submit handler to the client enquiry form that validates the entries and shows a confirmation without leaving the page.",
    "hints": [
      "Listen on the form, not only the button.",
      "Check the entries before responding.",
      "Test the whole path from typing to confirmation."
    ],
    "readiness": [
      {
        "prompt": "What is the risk of not stopping the default submit?",
        "options": [
          "The page reloads and the visitor sees no confirmation",
          "The form sends twice",
          "The stylesheet fails"
        ],
        "answer": 0,
        "explanation": "The reload discards the script's response, so the visitor never sees it."
      }
    ],
    "lessonId": "adults-interaction-events"
  },
  {
    "concept": "adults:adults-structure:page-metadata",
    "courses": [
      "adults"
    ],
    "title": "Metadata that describes the page",
    "meaning": "Metadata in the head describes the page: its title, its character set, its viewport and the description a search result may show.",
    "whyItMatters": "Search results and browser tabs are often the first thing a client's customer sees, so the title and description are part of the marketing.",
    "workedExample": "<title>Kitchen fitting in the city | Example Joinery</title> <meta name='description' content='Fitted kitchens and repairs'>",
    "commonMistake": "Leaving the title as the file name, so every tab and every search result shows an address instead of the business name.",
    "guided": [
      {
        "prompt": "What does the title element describe?",
        "options": [
          "The whole page, shown in the tab and search results",
          "The first paragraph only",
          "The stylesheet"
        ],
        "answer": 0,
        "explanation": "The title names the page for the browser and for search engines."
      },
      {
        "prompt": "Why does the description matter?",
        "options": [
          "It is often the summary shown in a search result",
          "It changes the layout of the page",
          "It loads the images"
        ],
        "answer": 0,
        "explanation": "A clear description helps someone decide whether to open the page."
      }
    ],
    "independent": "Write a title and a description for one page of the client site that name the service and the area it covers.",
    "hints": [
      "Read the title as if it were a search result.",
      "Keep the description to one useful sentence.",
      "Check that the viewport and character settings are present too."
    ],
    "readiness": [
      {
        "prompt": "Which setting stops a phone from shrinking the page?",
        "options": [
          "The viewport meta tag",
          "The description meta tag",
          "The title element"
        ],
        "answer": 0,
        "explanation": "The viewport setting tells the browser to match the page to the device width."
      }
    ],
    "lessonId": "adults-structure-metadata"
  },
  {
    "concept": "adults:adults-forms:grouped-choice",
    "courses": [
      "adults"
    ],
    "title": "Grouping choices under one question",
    "meaning": "A fieldset wraps a set of related controls and its legend states the question, so every option belongs to a clear decision.",
    "whyItMatters": "Service forms often ask a visitor to choose, and a grouped question is far easier to answer with a screen reader or on a small screen.",
    "workedExample": "<fieldset> <legend>Preferred contact method</legend> <label><input type='radio' name='contact'> Email</label> </fieldset>",
    "commonMistake": "Placing the question in a heading above the options, which looks correct but leaves the controls with no shared name.",
    "guided": [
      {
        "prompt": "Which element states the question for a group of controls?",
        "options": [
          "The legend inside the fieldset",
          "The first label in the group",
          "The field name attribute"
        ],
        "answer": 0,
        "explanation": "The legend is read for the whole group, so it carries the question."
      },
      {
        "prompt": "When is a fieldset most useful?",
        "options": [
          "When several controls answer one question",
          "When a form has a single text field",
          "When the page has no headings"
        ],
        "answer": 0,
        "explanation": "Grouping suits any question with more than one control answering it."
      }
    ],
    "independent": "Wrap the choice of service on the client form in a fieldset whose legend states the question plainly.",
    "hints": [
      "Group only the controls that answer one question.",
      "Write the legend as the question itself.",
      "Keep the legend short enough to read aloud."
    ],
    "readiness": [
      {
        "prompt": "What is read aloud for a grouped choice?",
        "options": [
          "The legend followed by the options",
          "Only the first option",
          "Nothing at all"
        ],
        "answer": 0,
        "explanation": "The legend gives the group its meaning before the options are announced."
      }
    ],
    "lessonId": "adults-forms-groups"
  },
  {
    "concept": "adults:adults-structure:image-alternative",
    "courses": [
      "adults"
    ],
    "title": "Alternative text that carries meaning",
    "meaning": "The alt value describes what an image contributes to the page, so someone who cannot see it still receives the information.",
    "whyItMatters": "Photographs of finished work are a business's strongest proof, and without a description that proof is invisible to some visitors.",
    "workedExample": "<img src='finished-kitchen.jpg' alt='Fitted kitchen with a pale worktop'>",
    "commonMistake": "Writing a description of the file instead of the content, such as a stock photo reference number, which tells the visitor nothing.",
    "guided": [
      {
        "prompt": "What should alternative text describe?",
        "options": [
          "What the image contributes to the page",
          "The size of the image file",
          "The camera used for the photograph"
        ],
        "answer": 0,
        "explanation": "The description replaces the picture, so it must carry the same useful information."
      },
      {
        "prompt": "What is the right alt value for a decorative image?",
        "options": [
          "An empty value, so assistive technology skips it",
          "A short file name",
          "The words decorative image"
        ],
        "answer": 0,
        "explanation": "An empty value is the deliberate way to mark a picture that adds no information."
      }
    ],
    "independent": "Write alternative text for every image on the client page, describing what each one adds to the words around it.",
    "hints": [
      "Read the sentence around the image first.",
      "Describe the content, not the file.",
      "Decide deliberately whether each image needs a description at all."
    ],
    "readiness": [
      {
        "prompt": "How should alternative text be judged?",
        "options": [
          "By whether it conveys the same information as the picture",
          "By how short it is",
          "By how many words it shares with the title"
        ],
        "answer": 0,
        "explanation": "The test is whether someone who cannot see the picture still gets the point."
      }
    ],
    "lessonId": "adults-structure-metadata"
  }
];
