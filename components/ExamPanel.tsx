"use client";

import { useMemo, useState } from "react";
import { courseFacts, finalExam, practicalExam } from "@/lib/course";

type ExamResult = {
  attempt: { score: number; total: number; practicalPassed: boolean; passed: boolean };
  corrections: Array<{ correct: boolean; answer: number; explanation: string }>;
};

export function ExamPanel({ onBack }: { onBack: () => void }) {
  const [answers, setAnswers] = useState<number[]>(() => finalExam.map(() => -1));
  const [practicalCode, setPracticalCode] = useState(practicalExam.starterCode);
  const [explanation, setExplanation] = useState("");
  const [result, setResult] = useState<ExamResult | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const complete = useMemo(() => answers.every((answer) => answer >= 0) && explanation.trim().length >= 10, [answers, explanation]);

  async function submitExam() {
    if (!complete) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/exam", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ answers, practicalCode, explanation }),
      });
      const data = await response.json() as ExamResult & { error?: string };
      if (!response.ok) throw new Error(data.error || "The final check could not be saved.");
      setResult(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The final check could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="exam-page">
        <button className="text-button" type="button" onClick={onBack}>← Return to course</button>
        <section className={`exam-result ${result.attempt.passed ? "is-pass" : "is-retry"}`}>
          <p className="kicker">FINAL CHECK RESULT</p>
          <h1>{result.attempt.passed ? "You proved the foundations." : "Review a few ideas, then try again."}</h1>
          <div className="result-score">{result.attempt.score}<span>/{result.attempt.total}</span></div>
          <p>{result.attempt.practicalPassed ? "The code repair passed." : "The webpage still has one or more broken pieces."}</p>
          <p>{result.attempt.passed ? "Your project and final check now show both knowledge and practical skill." : `A pass needs ${courseFacts.passMark} correct answers and a working code repair.`}</p>
        </section>
        <section className="correction-list" aria-label="Question review">
          {finalExam.map((question, index) => (
            <article key={question.prompt} className={result.corrections[index].correct ? "is-correct" : "is-wrong"}>
              <span>{result.corrections[index].correct ? "Correct" : "Review"}</span>
              <h2>{index + 1}. {question.prompt}</h2>
              <p>{result.corrections[index].explanation}</p>
            </article>
          ))}
        </section>
      </main>
    );
  }

  return (
    <main className="exam-page">
      <button className="text-button" type="button" onClick={onBack}>← Return to course</button>
      <header className="exam-heading">
        <p className="kicker">SMALL FINAL CHECK</p>
        <h1>Show what you know, then repair a small webpage.</h1>
        <p>Ten short questions and one practical HTML and JavaScript repair. This is not timed.</p>
      </header>

      <section className="exam-questions">
        {finalExam.map((question, questionIndex) => (
          <fieldset key={question.prompt}>
            <legend>{questionIndex + 1}. {question.prompt}</legend>
            {question.options.map((option, optionIndex) => (
              <label key={option}>
                <input
                  type="radio"
                  name={`question-${questionIndex}`}
                  checked={answers[questionIndex] === optionIndex}
                  onChange={() => setAnswers((current) => current.map((answer, index) => index === questionIndex ? optionIndex : answer))}
                />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </section>

      <section className="practical-exam">
        <p className="kicker">PRACTICAL REPAIR</p>
        <h2>{practicalExam.title}</h2>
        <p>{practicalExam.brief}</p>
        <label htmlFor="exam-code">{practicalExam.language}</label>
        <textarea id="exam-code" value={practicalCode} onChange={(event) => setPracticalCode(event.target.value)} spellCheck={false} />
        <label htmlFor="exam-explanation">Explain your repair</label>
        <textarea id="exam-explanation" value={explanation} onChange={(event) => setExplanation(event.target.value)} placeholder="I changed... because..." />
      </section>

      {message && <p className="form-message is-error" role="alert">{message}</p>}
      <button className="primary-button exam-submit" type="button" disabled={!complete || submitting} onClick={submitExam}>
        {submitting ? "Checking..." : "Submit final check"}
      </button>
    </main>
  );
}
