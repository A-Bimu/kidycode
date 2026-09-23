/*
 * The certificate.
 *
 * Two endpoints, both server-owned:
 *
 *   GET   reads the current certification state. It never writes and never issues.
 *   POST  issues the certificate, and only when every eligibility condition already holds on
 *         a submitted attempt. Issuing is idempotent: a repeat returns the same credential
 *         with the same id and the same issue date.
 *
 * Nothing about the certificate can be chosen by the browser. The level comes from the
 * learner's assigned course, the issue date comes from the server clock, the credential id is
 * generated here from cryptographically secure randomness, and eligibility, the assessment
 * result and the defence outcome are all read back from stored evidence.
 */

import { z } from "zod";
import { loadCredential, issueCredential } from "@/lib/assessment/store";
import {
  CERTIFICATE_NAME,
  CERTIFICATION_STATUS_LABELS,
  newCredentialId,
} from "@/lib/certification";
import { demonstratedSkills } from "@/lib/passport";
import { loadLearnerSummary } from "@/lib/progress-view";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";
import { courses } from "@/lib/course-catalog";

/* The one body shape that is accepted: nothing that decides an outcome. A request that tries to
 * supply a level, a date, a result, a defence outcome or a credential id is refused rather than
 * quietly ignored, so the attempt is visible in the tests. */
const bodySchema = z.object({
  action: z.literal("issue"),
  level: z.undefined().optional(),
  issuedAt: z.undefined().optional(),
  credentialId: z.undefined().optional(),
  score: z.undefined().optional(),
  result: z.undefined().optional(),
  defence: z.undefined().optional(),
  mandatoryPassed: z.undefined().optional(),
  eligible: z.undefined().optional(),
}).strict();

function clientCertificate(
  credential: { id: string; level: string; certificateName: string; projectTitle: string; skillsJson: string; issuedAt: string },
  extra: { firstName: string; courseTitle: string; skills: string[] },
) {
  let stored: string[] = [];
  try {
    const parsed = JSON.parse(credential.skillsJson) as unknown;
    if (Array.isArray(parsed)) stored = parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    stored = [];
  }
  return {
    credentialId: credential.id,
    certificateName: credential.certificateName,
    level: credential.level,
    courseTitle: extra.courseTitle,
    projectTitle: credential.projectTitle,
    learnerFirstName: extra.firstName,
    issuedAt: credential.issuedAt,
    /* The printed skills come from the passport's demonstrated skills, so a skill can only
     * ever be printed when the evidence behind it exists. */
    skills: extra.skills.length > 0 ? extra.skills : stored,
    statement: `Completed the ${extra.courseTitle} course and demonstrated the practical skills listed above.`,
  };
}

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const summary = await loadLearnerSummary(database, learner);
    if (!summary) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const credential = await loadCredential(database, learner.id, learner.courseId);
    const skills = demonstratedSkills(summary.passport);

    return Response.json({
      certification: {
        certificateName: summary.certification.certificateName,
        level: summary.certification.level,
        status: summary.certification.status,
        statusLabel: CERTIFICATION_STATUS_LABELS[summary.certification.status],
        eligible: summary.certification.eligible,
        gates: summary.certification.gates.map((gate) => ({ id: gate.id, label: gate.label, met: gate.met, detail: gate.detail })),
        missing: summary.certification.missing.map((gate) => ({ id: gate.id, label: gate.label, detail: gate.detail })),
        nextAction: summary.certification.nextAction,
      },
      passport: summary.passport,
      /* The credential is only ever returned to the learner it belongs to, and only once it
       * has been issued. Reading here never creates one. */
      certificate: credential
        ? clientCertificate(credential, {
          firstName: firstNameOf(learner.nickname),
          courseTitle: course.courseFacts.title,
          skills,
        })
        : null,
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json(
        { error: "A certificate is issued by KidyCode from your own results. Nothing about it is sent from the page." },
        { status: 400 },
      );
    }

    const course = courses[learner.courseId];
    if (!course) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    const database = getDatabase();
    const summary = await loadLearnerSummary(database, learner);
    if (!summary) return Response.json({ error: "This learning path is not available." }, { status: 409 });

    /* A retryable technical defence result is not a learner outcome. It leaves certification
     * undecided rather than denied: the learner keeps everything and can finish the defence. */
    if (!summary.certification.eligible) {
      return Response.json({
        issued: false,
        certification: {
          status: summary.certification.status,
          statusLabel: CERTIFICATION_STATUS_LABELS[summary.certification.status],
          level: summary.certification.level,
          missing: summary.certification.missing.map((gate) => ({ id: gate.id, label: gate.label, detail: gate.detail })),
          nextAction: summary.certification.nextAction,
        },
      }, { status: 403 });
    }

    const level = summary.certification.level;
    const attemptId = summary.certification.attemptId;
    if (!level || !attemptId) {
      return Response.json({ issued: false, error: "The certificate is not ready yet." }, { status: 403 });
    }

    const skills = demonstratedSkills(summary.passport);
    const existing = await loadCredential(database, learner.id, learner.courseId);
    const credential = existing || await issueCredential(database, learner.id, {
      /* Opaque, non-sequential and generated here. */
      id: newCredentialId(),
      courseId: learner.courseId,
      level,
      certificateName: CERTIFICATE_NAME,
      projectTitle: summary.completion.projectTitle,
      skillsJson: JSON.stringify(skills),
      attemptId,
    }, new Date().toISOString());

    if (!credential) {
      return Response.json({ issued: false, error: "The certificate could not be issued. Try again in a moment." }, { status: 503 });
    }

    return Response.json({
      issued: true,
      /* A repeat request returns this same credential, with the same id and issue date. */
      alreadyHeld: Boolean(existing),
      certificate: clientCertificate(credential, {
        firstName: firstNameOf(learner.nickname),
        courseTitle: course.courseFacts.title,
        skills,
      }),
    });
  } catch (error) {
    return databaseError(error);
  }
}

/* The certificate names the learner by a first name only, taken from the nickname they chose. */
function firstNameOf(nickname: string): string {
  const trimmed = (nickname || "").trim();
  if (trimmed.length === 0) return "Learner";
  return trimmed.split(/\s+/)[0].slice(0, 24);
}