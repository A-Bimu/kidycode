import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy and grown-up information | KidyCode",
  description: "What KidyCode stores for a learner, why it is needed, what a connected grown-up can see, and how to clear a device or delete a profile.",
};

/*
 * Privacy and grown-up information.
 *
 * Every statement on this page describes behaviour that exists in this repository:
 * the stored columns, the cookie, the code lifetimes, the grown-up allow list and
 * the two removal operations. Nothing is claimed that the product does not do, and
 * no address, support contact, registration or retention period is invented.
 */

export default function Privacy() {
  return (
    <main className="trust-page">
      <Link className="course-brand" href="/"><span>K</span><b>KidyCode</b></Link>

      <section className="trust-head">
        <p className="kicker">PRIVACY AND GROWN-UPS</p>
        <h1>What KidyCode keeps, and who can see it</h1>
        <p>
          KidyCode is built for learners to write real code, so it saves their work. This page explains exactly what is
          saved, why it is needed, what a connected grown-up can see, and how to remove everything.
        </p>
      </section>

      <section aria-labelledby="stored-heading">
        <h2 id="stored-heading">What is saved for a learner</h2>
        <ul>
          <li><b>A nickname, an age and a chosen website project.</b> The age decides which learning path the learner starts on, and the project decides what they build. The nickname is shown on their own screens and, in a short form, to a connected grown-up.</li>
          <li><b>Activity progress and the time each activity was finished.</b> This is what lets a learner stop and come back later, and what makes the completion record truthful.</li>
          <li><b>Evidence from practice.</b> Counts of attempts, checks passed, hints used and how much of each concept is secure, plus the labels of concepts that need another look. Learner code is not stored in this evidence.</li>
          <li><b>Saved project versions.</b> When a module is finished, the HTML, CSS and JavaScript of the website at that moment is saved, together with the short reflection the learner wrote. This is what the portfolio shows.</li>
          <li><b>Final assessment attempts.</b> The answers chosen, the repaired code, the score and whether the attempt passed. This is how the final check is graded and how the completion record is derived.</li>
          <li><b>Grown-up connections and one-time codes.</b> Which grown-up is connected, when the connection was made or ended, and one-time codes stored only as digests. A code itself is never stored and never written to logs.</li>
          <li><b>The last time the learner was active.</b> This is shown to a connected grown-up so they know the course is still in use.</li>
        </ul>
        <p className="trust-quiet">
          There is no advertising, no tracking pixel, no payment information and no third-party analytics in KidyCode.
        </p>
      </section>

      <section aria-labelledby="why-heading">
        <h2 id="why-heading">Why each item is needed</h2>
        <p>
          Progress, project versions and assessment attempts are what make a course work: without them a learner would
          start from the beginning every time, the tutor could not give the right hint, and no completion record could be
          truthful. Grown-up connections exist so a parent or carer can follow progress when the learner chooses to
          connect them. Nothing is saved for any other purpose.
        </p>
      </section>

      <section aria-labelledby="sessions-heading">
        <h2 id="sessions-heading">How a learner session works</h2>
        <p>
          When a learner starts or moves to a device, KidyCode sets one cookie. It is HttpOnly, so page scripts cannot
          read it, it is marked Secure and SameSite, and it lasts six months. The cookie holds the profile reference and a
          long random key; only a hash of that key is stored, so a copy of the database cannot be turned into a working
          session.
        </p>
        <p>
          Clearing the device removes that cookie and nothing else. All progress stays saved, and the same profile can be
          opened again on any device with a transfer code, or by a connected grown-up who creates one for the learner.
        </p>
      </section>

      <section aria-labelledby="grownup-heading">
        <h2 id="grownup-heading">What a connected grown-up can and cannot see</h2>
        <p>A grown-up who is connected to a learner can see:</p>
        <ul>
          <li>the learner&apos;s first name, the course and the project they chose</li>
          <li>how many activities are complete, out of the course total</li>
          <li>how many module project versions are saved, out of eight</li>
          <li>whether the final assessment has been passed</li>
          <li>recent milestones, such as a saved module version or a passed final assessment</li>
          <li>the completion date, and only once the course is genuinely complete</li>
        </ul>
        <p>A grown-up can never see:</p>
        <ul>
          <li>any HTML, CSS or JavaScript the learner wrote</li>
          <li>the reflections written with saved versions</li>
          <li>final assessment answers or repaired code</li>
          <li>the tutor&apos;s record of struggles, hints or mistakes</li>
          <li>learner keys, session cookies, connection codes or any internal identifier</li>
        </ul>
        <p>
          Grown-up access is read only. A grown-up cannot complete lessons, answer questions, change progress or delete
          anything.
        </p>
      </section>

      <section aria-labelledby="codes-heading">
        <h2 id="codes-heading">How connection and transfer codes work</h2>
        <p>
          A learner creates a connection code on their progress page and reads it to the grown-up they want to connect.
          The code is shown once, lasts ten minutes, works once, and is stored only as a digest. A grown-up cannot search
          for a learner by name, email or identifier: the only way in is a code the learner chose to share.
        </p>
        <p>
          A transfer code works the same way and moves the learner&apos;s profile to another device. Using it signs the
          previous device out. Both kinds of code are cancelled automatically when a newer one is created, and repeated
          wrong guesses are limited.
        </p>
      </section>

      <section aria-labelledby="remove-heading">
        <h2 id="remove-heading">Disconnecting, clearing a device and deleting a profile</h2>
        <ul>
          <li><b>Disconnect a grown-up.</b> A learner can end any connection from Grown-up access on their progress page, and a grown-up can disconnect from their own dashboard. Access ends immediately for both.</li>
          <li><b>Clear this device.</b> This signs the learner out of the browser they are using and changes nothing else. Progress, versions, reflections and assessment attempts all stay saved.</li>
          <li><b>Delete the profile permanently.</b> This is a separate, deliberate action with a two step confirmation. It removes the profile and every record that belongs to it, revokes grown-up connections, cancels connection and transfer codes, and signs the device out. It cannot be undone, and KidyCode never creates a replacement profile by itself.</li>
        </ul>
      </section>

      <section aria-labelledby="safety-heading">
        <h2 id="safety-heading">Keeping a learner&apos;s own details out of it</h2>
        <p>
          Learners should use a nickname rather than a full name. A nickname is enough for everything KidyCode does, and
          it is the only name a connected grown-up sees.
        </p>
        <p>
          Children should not type their school, home address, phone number, email address or exact location anywhere in
          KidyCode, including in project text or reflections. The lessons never ask for these, and the project ideas are
          built so that a learner can complete them without sharing personal details.
        </p>
      </section>

      <section aria-labelledby="record-heading">
        <h2 id="record-heading">About the completion record</h2>
        <p>
          The KidyCode course completion record is a record of what a learner did inside KidyCode: the activities they
          completed, the project versions they saved and the final assessment they passed. It is not an accredited
          qualification, diploma or professional certification, and it is not recognised by any examining body.
        </p>
      </section>

      <nav className="trust-actions" aria-label="Continue">
        <Link className="primary-button" href="/">Choose a learning path</Link>
        <Link className="outline-button" href="/guardian">Grown-up view</Link>
      </nav>
    </main>
  );
}
