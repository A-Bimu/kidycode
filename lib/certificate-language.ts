import { CERTIFICATE_LEVELS, CERTIFICATE_NAME } from "@/lib/certification";
import type { CourseId } from "@/lib/course";
import { codingCourseIds } from "@/lib/learning-experience";

/*
 * The pending-approval certificate wording.
 *
 * A certificate is a claim made in KidyCode's name, so the wording that goes on it is not a
 * design decision: it waits for written institutional approval. This module holds the exact
 * wording in that pending state, so the day the approval arrives there is one place to
 * change and nothing has already implied otherwise.
 *
 * Three things are fixed here:
 *
 *   1. Status. There is exactly one status, pending-approval, and nothing may render the
 *      wording as final while that status stands.
 *   2. What the wording will assert, and what it will never assert. The withholds name the
 *      accreditation, the university association and the guarantee that a certificate does
 *      not carry, so an approver sees the boundary before they sign it.
 *   3. No co-branding. There is no second logo and no institution name until written
 *      approval exists, which is why coBranding is the literal false.
 */

export const certificateWordingStatuses = ["pending-approval"] as const;
export type CertificateWordingStatus = (typeof certificateWordingStatuses)[number];

export type CertificateWording = {
  status: CertificateWordingStatus;
  courseId: CourseId;
  provisionalTitle: string;
  provisionalLevel: string;
  /* What the wording states once it is approved. */
  asserts: string[];
  /* What the wording never states, at any status. */
  withholds: string[];
  approvalRequiredBy: string;
  coBranding: false;
};

export function certificateWording(courseId: CourseId): CertificateWording {
  const level = CERTIFICATE_LEVELS[courseId] || "KidyCode builder";
  return {
    status: "pending-approval",
    courseId,
    provisionalTitle: `${CERTIFICATE_NAME}: ${level}`,
    provisionalLevel: level,
    asserts: [
      `That the learner completed the ${level} pathway and passed its final assessment.`,
      "That the learner produced a working website and transferred the skill to a different problem.",
      "That the certificate was issued from one eligibility calculation and one credential record.",
    ],
    withholds: [
      "It is not an accredited qualification, and it is not offered as one.",
      "It carries no university or institution name, logo or association without written approval.",
      "It promises no job, salary, place on a course or entry to any programme.",
      "It records no score, no attempt identifier and no personal detail.",
    ],
    approvalRequiredBy: "The institution and the KidyCode programme owner, in writing, before any certificate is issued.",
    coBranding: false,
  };
}

export function certificateWordingIssues(): string[] {
  const issues: string[] = [];
  for (const courseId of codingCourseIds) {
    const wording = certificateWording(courseId);
    if (wording.status !== "pending-approval") issues.push(`${courseId}: the wording must start as pending approval.`);
    if (wording.coBranding !== false) issues.push(`${courseId}: no co-branding may exist before written approval.`);
    if (wording.asserts.length < 3) issues.push(`${courseId}: the wording must state what it asserts.`);
    if (wording.withholds.length < 4) issues.push(`${courseId}: the wording must state what it withholds.`);
    if (!/written|in writing/i.test(wording.approvalRequiredBy)) issues.push(`${courseId}: approval must be in writing.`);
    /* The accreditation word may appear only where it is denied. */
    const joined = [...wording.asserts, ...wording.withholds].join(" ");
    for (const match of joined.matchAll(/accredited/gi)) {
      const before = joined.slice(Math.max(0, (match.index ?? 0) - 24), match.index);
      if (!/\b(not|never|nor|without|no)\b/i.test(before)) issues.push(`${courseId}: the wording must not claim to be accredited.`);
    }
  }
  return issues;
}
