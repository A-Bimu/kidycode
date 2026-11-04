"use client";

import { useState } from "react";
import type { DesignCheck } from "@/lib/design-course";

export function DesignQuickCheck({ check }: { check: DesignCheck }) {
  const [choice, setChoice] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const correct = choice === check.answer;
  return (
    <section className="kc-design-check" aria-label="Check what you learned">
      <h4>Check your understanding</h4>
      <p>{check.prompt}</p>
      <div className="kc-design-check-options" role="group" aria-label="Choose one answer">
        {check.options.map((option, index) =>
          <button type="button" key={index} aria-pressed={choice === index}
            disabled={correct} onClick={() => { setChoice(index); setAttempts(a => a + 1); }}>
            <span aria-hidden="true">{choice === index ? "●" : "○"}</span>{option}
          </button>)}
      </div>
      {choice !== null && <p role="status" aria-live="polite" className="kc-note">
        {correct
          ? "That's right! " + check.explanation
          : attempts > 1
            ? "Not quite. Look for the answer that makes the screen easiest to understand. Try again."
            : "Good try! Re-read the example above and choose another answer."}
      </p>}
    </section>
  );
}
