/*
 * The KidyCode Applied Web Skills Certificate.
 *
 * One calculation, used by the learner passport, the certificate, the printable view, the
 * guardian summary and the tests. Nothing here is stored and nothing is accepted from the
 * browser: eligibility, the level, the credential id and the issue date are all derived by
 * the server from evidence rows that already exist.
 *
 * Two achievements stay separate.
 *
 *   Course completed   the existing completion record, unchanged since V1
 *   Skills certified   this certificate, which additionally needs Assessment V2 and a
 *                      passed code defence
 *
 * A learner who finished the original course keeps that record and is not retroactively
 * certified: an old completion alone never issues this certificate.
 *
 * This is not an accredited qualification and never claims to be one. It records that the
 * learner finished the course and demonstrated the listed practical skills.
 */

export const CERTIFICATE_NAME = "KidyCode Applied Web Skills Certificate" as const;

/* The approved pass marks. The independent build has its own floor, so a high total can
 * never carry a weak independent build over the line. */
export const ASSESSMENT_PASS_MARK = 70;
export const ASSESSMENT_TOTAL_MARKS = 100;
export const INDEPENDENT_BUILD_FLOOR = 30;
export const INDEPENDENT_BUILD_MARKS = 50;

/* The four reviewed courses and their certificate levels. The level is looked up from the
 * course the learner is assigned to, never taken from a request. */
export const CERTIFICATE_LEVELS: Record<string, string> = {
  "ages-10-12": "Web Creator",
  "ages-13-15": "Web Builder",
  "ages-16-18": "Web Application Builder",
  adults: "Business Website Builder",
};

export function certificateLevelFor(courseId: string): string | null {
  return CERTIFICATE_LEVELS[courseId] || null;
}

export type CertificationGateId = "course" | "assessment" | "build" | "mandatory" | "defence";

export type CertificationGate = {
  id: CertificationGateId;
  label: string;
  /* True only when the stored evidence satisfies the condition. */
  met: boolean;
  detail: string;
};

/* One submitted Assessment V2 final attempt, as stored. The figures are integers the
 * server wrote when it graded the attempt. */
export type StoredAttempt = {
  attemptId: string;
  status: string;
  submittedAt: string | null;
  score: number;
  total: number;
  buildAwarded: number;
  buildTotal: number;
  mandatoryPassed: boolean;
  defenceStatus: "passed" | "not_passed" | "pending" | "none";
};

export type CertificationInput = {
  courseId: string;
  /* The existing completion calculation, unchanged. */
  courseComplete: boolean;
  /* Every submitted final attempt for this learner and this course, newest first. */
  attempts: StoredAttempt[];
};

export type CertificationStatus = "certified" | "ready" | "in-progress";

export type Certification = {
  certificateName: typeof CERTIFICATE_NAME;
  level: string | null;
  /* certified: every gate holds. ready: the course is complete but certification is
   * outstanding. in-progress: the course itself is not finished. */
  status: CertificationStatus;
  eligible: boolean;
  gates: CertificationGate[];
  missing: CertificationGate[];
  /* One useful next action, in plain language. Never a congratulation before every gate. */
  nextAction: { label: string; detail: string };
  /* The attempt the certificate would be, or was, bound to. */
  attemptId: string | null;
  scores: { assessment: number; assessmentTotal: number; build: number; buildTotal: number };
};

function gate(
  id: CertificationGateId,
  label: string,
  met: boolean,
  detail: string,
): CertificationGate {
  return { id, label, met, detail };
}

/* The strongest evidence for each condition, taken from one attempt at a time: a
 * certificate binds to a single submitted attempt, so a high score on one attempt and a
 * passed defence on another is not a certified learner. */
function gatesFromAttempt(attempt: StoredAttempt, courseComplete: boolean, level: string | null): CertificationGate[] {
  const assessmentMet = attempt.score >= ASSESSMENT_PASS_MARK;
  const buildMet = attempt.buildAwarded >= INDEPENDENT_BUILD_FLOOR;
  const courseMet = courseComplete && level !== null;
  return [
    gate(
      "course",
      "Course completed",
      courseMet,
      level === null
        ? "This course has no reviewed certificate level yet, so no certificate can be issued for it."
        : "Every activity, every module project version and the course final check.",
    ),
    gate(
      "assessment",
      `Assessment result of at least ${ASSESSMENT_PASS_MARK} out of ${ASSESSMENT_TOTAL_MARKS}`,
      assessmentMet,
      `Stored result ${attempt.score} out of ${ASSESSMENT_TOTAL_MARKS}.`,
    ),
    gate(
      "build",
      `Independent build of at least ${INDEPENDENT_BUILD_FLOOR} out of ${INDEPENDENT_BUILD_MARKS}`,
      buildMet,
      `Stored independent build ${attempt.buildAwarded} out of ${INDEPENDENT_BUILD_MARKS}.`,
    ),
    gate(
      "mandatory",
      "Every required check passed",
      attempt.mandatoryPassed,
      attempt.mandatoryPassed
        ? "Every required accessibility, privacy and safety check passed."
        : "At least one required check has not passed yet.",
    ),
    gate(
      "defence",
      "Code defence passed",
      attempt.defenceStatus === "passed",
      attempt.defenceStatus === "passed"
        ? "The independent-understanding defence was passed."
        : attempt.defenceStatus === "not_passed"
          ? "The code defence is Not passed yet."
          : "The code defence is not finished.",
    ),
  ];
}

function nextActionFor(gates: CertificationGate[]): Certification["nextAction"] {
  const unmet = gates.find((entry) => !entry.met);
  if (!unmet) {
    return {
      label: "Print your certificate",
      detail: "Every requirement is met. Your certificate and your Skills Passport are ready.",
    };
  }
  switch (unmet.id) {
    case "course":
      return {
        label: "Finish the course",
        detail: "Complete the activities, save each module project version and pass the course final check.",
      };
    case "assessment":
      return {
        label: "Return to revision",
        detail: "Work through the revision pages for the skills that need it, then take the assessment again.",
      };
    case "build":
      return {
        label: "Strengthen your independent build",
        detail: "Your own build carries its own floor, so it must stand on its own before the certificate is issued.",
      };
    case "mandatory":
      return {
        label: "Pass the required checks",
        detail: "The accessibility, privacy and safety checks are required. A high total cannot replace them.",
      };
    default:
      return {
        label: "Complete your code defence",
        detail: "Explain your work, predict what a small change does and make it, then submit the defence.",
      };
  }
}

/* The one eligibility calculation. The five conditions must all hold on the same attempt,
 * and a course that is not finished can never be certified. */
export function deriveCertification(input: CertificationInput): Certification {
  const level = certificateLevelFor(input.courseId);
  const submitted = input.attempts.filter((attempt) => attempt.status === "submitted");

  /* Every attempt is judged on its own evidence. An eligible attempt wins outright; when
   * none is eligible the strongest attempt is used for the guidance and the figures. */
  const judged = submitted.map((attempt) => ({ attempt, gates: gatesFromAttempt(attempt, input.courseComplete, level) }));
  const eligible = judged.find((entry) => entry.gates.every((entryGate) => entryGate.met)) || null;
  const strongest = judged.reduce<{ attempt: StoredAttempt; gates: CertificationGate[] } | null>(
    (best, entry) => (!best || entry.attempt.score > best.attempt.score ? entry : best),
    null,
  );
  const chosen = eligible || strongest;
  const gates = chosen ? chosen.gates : gatesFromAttempt(emptyAttempt(), input.courseComplete, level);
  const attempt = chosen ? chosen.attempt : null;

  const missing = gates.filter((entry) => !entry.met);
  const status: CertificationStatus = eligible
    ? "certified"
    : input.courseComplete
      ? "ready"
      : "in-progress";

  return {
    certificateName: CERTIFICATE_NAME,
    level,
    status,
    /* A course with no reviewed level cannot be certified, so this fails closed. */
    eligible: Boolean(eligible && level),
    gates,
    missing,
    nextAction: nextActionFor(gates),
    attemptId: attempt ? attempt.attemptId : null,
    scores: {
      assessment: attempt ? attempt.score : 0,
      assessmentTotal: attempt ? attempt.total : ASSESSMENT_TOTAL_MARKS,
      build: attempt ? attempt.buildAwarded : 0,
      buildTotal: attempt ? attempt.buildTotal : INDEPENDENT_BUILD_MARKS,
    },
  };
}

function emptyAttempt(): StoredAttempt {
  return {
    attemptId: "",
    status: "none",
    submittedAt: null,
    score: 0,
    total: ASSESSMENT_TOTAL_MARKS,
    buildAwarded: 0,
    buildTotal: INDEPENDENT_BUILD_MARKS,
    mandatoryPassed: false,
    defenceStatus: "none",
  };
}

/* ---------------------------------------------------------------- credential id -- */

/* The printable suffix alphabet. It avoids characters that are easy to misread on paper. */
const CREDENTIAL_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/*
 * The private credential id is generated by the server from cryptographically secure
 * random bytes. It is opaque, it carries no learner, course, date or attempt information,
 * and it is safe to print. The randomness is injected so the shape can be tested without
 * weakening the real call site.
 */
export function credentialIdFrom(bytes: Uint8Array): string {
  const groups: string[] = [];
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      groups.push(CREDENTIAL_ALPHABET[(buffer >> bits) & 31]);
    }
  }
  const body = groups.join("").slice(0, 20);
  const chunks = body.match(/.{1,4}/g) || [body];
  return `KC-${chunks.join("-")}`;
}

export function newCredentialId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return credentialIdFrom(bytes);
}

/* -------------------------------------------------------------------- guardian -- */

/* The certificate facts a currently connected guardian may read. A strict allow list: no
 * marks, no attempt id, no credential internals, no code, no defence response. */
export type GuardianCertificate = {
  certificateName: string;
  level: string | null;
  status: "certified" | "ready" | "in-progress";
  statusLabel: string;
  courseComplete: boolean;
  projectTitle: string;
  issuedAt: string | null;
  skills: string[];
};

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  certified: "Certificate earned",
  ready: "Course completed, certificate still to earn",
  "in-progress": "Still working through the course",
};

export function toGuardianCertificate(
  certification: Certification,
  extras: { projectTitle: string; issuedAt: string | null; skills: string[] },
): GuardianCertificate {
  return {
    certificateName: certification.certificateName,
    level: certification.level,
    status: certification.status,
    statusLabel: CERTIFICATION_STATUS_LABELS[certification.status],
    courseComplete: certification.status !== "in-progress",
    projectTitle: extras.projectTitle,
    issuedAt: extras.issuedAt,
    skills: extras.skills.slice(0, 6),
  };
}
