"use client";

import type { LessonDetail, QualityFlag } from "@/components/admin/types";

/*
 * The read-only lesson body, shared by the Curriculum Explorer detail pane and by the
 * sandboxed "View as learner" preview.
 *
 * It renders the whole original content: objective, teaching notes, key terms, the activity,
 * the worked example and its explanation, starter files, every hint, every automatic
 * requirement, the reflection prompt and the answer key with an explanation per question.
 *
 * Nothing here is a form. There is no submit, no check-my-work, no progress control and no
 * certificate action, so this component cannot write learner state - there is no code path
 * that could. In learner mode the answer key sits behind a deliberate toggle, and the mode
 * banner makes clear this is a preview rather than a real learner session.
 */

type Props = {
  lesson: LessonDetail;
  mode: "review" | "learner";
  showAnswers: boolean;
  onToggleAnswers: () => void;
  flags?: QualityFlag[];
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4>{title}</h4>
      {children}
    </section>
  );
}

function fileLabel(key: keyof NonNullable<LessonDetail["starterFiles"]>): string {
  if (key === "html") return "Starter HTML";
  if (key === "css") return "Starter CSS";
  return "Starter JavaScript";
}

export function LessonContent({ lesson, mode, showAnswers, onToggleAnswers, flags = [] }: Props) {
  const starter = lesson.starterFiles;
  return (
    <div className="adm-content">
      <Section title="Objective">
        <p>{lesson.objective || "No objective recorded."}</p>
      </Section>

      <Section title={`Teaching notes (${lesson.notes.length})`}>
        {lesson.notes.length === 0 ? (
          <p className="adm-note">No teaching notes recorded for this lesson.</p>
        ) : (
          <ul>
            {lesson.notes.map((note, index) => <li key={index}>{note}</li>)}
          </ul>
        )}
      </Section>

      {lesson.keyTerms.length > 0 && (
        <Section title="Key terms">
          <div className="adm-tags">
            {lesson.keyTerms.map(term => <span className="adm-tag" key={term}>{term}</span>)}
          </div>
        </Section>
      )}

      <Section title="Activity">
        <p>{lesson.activity || "No activity recorded."}</p>
      </Section>

      {lesson.workedExample && (
        <Section title="Worked example">
          <pre className="adm-pre">{lesson.workedExample}</pre>
          {lesson.exampleExplanation && <p>{lesson.exampleExplanation}</p>}
        </Section>
      )}

      {starter && (starter.html || starter.css || starter.javascript) && (
        <Section title="Starter files">
          {(["html", "css", "javascript"] as const).map(key => starter[key] ? (
            <div key={key}>
              <h4>{fileLabel(key)}</h4>
              <pre className="adm-pre">{starter[key]}</pre>
            </div>
          ) : null)}
        </Section>
      )}

      <Section title={`Hint stages (${lesson.hints.length})`}>
        {lesson.hints.length === 0 ? (
          <p className="adm-note">This lesson offers no hints.</p>
        ) : (
          <ol>
            {lesson.hints.map((hint, index) => <li key={index}>{hint}</li>)}
          </ol>
        )}
      </Section>

      <Section title={`Automatic requirements and rubric (${lesson.requirements.length})`}>
        {lesson.requirements.length === 0 ? (
          <p className="adm-note">No automatic requirement recorded.</p>
        ) : (
          <ul>
            {lesson.requirements.map((requirement, index) => <li key={index}>{requirement}</li>)}
          </ul>
        )}
      </Section>

      {lesson.reflection && (
        <Section title="Reflection prompt">
          <p>{lesson.reflection}</p>
        </Section>
      )}

      <Section title={`Answer key and explanations (${lesson.questions.length} question${lesson.questions.length === 1 ? "" : "s"})`}>
        {lesson.questions.length === 0 ? (
          <p className="adm-note">This lesson has no practice question.</p>
        ) : (
          <>
            {mode === "learner" && (
              <div className="adm-button-row">
                <button type="button" className="adm-button adm-button-quiet" aria-pressed={showAnswers} onClick={onToggleAnswers}>
                  {showAnswers ? "Hide the answer key" : "Show the owner answer key"}
                </button>
                <p className="adm-note">A learner never sees this. It is here so the owner can review correctness without answering the question.</p>
              </div>
            )}
            {mode === "review" || showAnswers ? (
              <ol>
                {lesson.questions.map((question, index) => (
                  <li key={index}>
                    <p>{question.prompt}</p>
                    <div>
                      {question.options.map((option, optionIndex) => (
                        <p
                          className={optionIndex === question.correctIndex ? "adm-option adm-option-correct" : "adm-option"}
                          key={optionIndex}
                        >
                          <span className="adm-option-marker" aria-hidden="true">{optionIndex === question.correctIndex ? "✓" : "•"}</span>
                          <span>
                            {option}
                            {optionIndex === question.correctIndex && <span className="adm-tag adm-tag-reviewed" style={{ marginLeft: ".4rem" }}>correct</span>}
                          </span>
                        </p>
                      ))}
                    </div>
                    <p className="adm-note">Explanation: {question.explanation || "none recorded"}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="adm-note">
                {lesson.questions.length} question{lesson.questions.length === 1 ? "" : "s"} hidden. Use the button above to reveal the answer key for review.
              </p>
            )}
          </>
        )}
      </Section>

      <Section title={`Automatic suggestions (${flags.length}) — heuristic, not verified`}>
        {flags.length === 0 ? (
          <p className="adm-note">The checks found nothing to point at in this lesson. That is not a guarantee of correctness, only an absence of flags.</p>
        ) : (
          <ul>
            {flags.map((flag, index) => (
              <li key={index}>
                <span className={flag.level === "suggestion" ? "adm-tag adm-tag-suggestion" : "adm-tag"}>{flag.level}</span>{" "}
                {flag.message} {flag.detail ? `(${flag.detail})` : ""}
              </li>
            ))}
          </ul>
        )}
        <p className="adm-note">These are suggestions produced by a reading of the content, not findings of fact. A reviewer decides.</p>
      </Section>
    </div>
  );
}
