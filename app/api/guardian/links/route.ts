import { z } from "zod";
import { courses } from "@/lib/course-catalog";
import { establishGuardian, guardianUnauthorized } from "@/lib/guardian-auth";
import { normaliseConnectCode } from "@/lib/one-time-codes";
import { claimConnectCode, listGuardianLinks, revokeGuardianLink } from "@/lib/guardian-links";
import { databaseError, getDatabase } from "@/lib/server-database";

/*
 * Claiming a connection code, and disconnecting again.
 *
 * A guardian can only ever reach a learner through a code that learner created
 * and showed them. There is no search by name, no search by email and no way to
 * name a learner directly, so a guessed identifier cannot create a link.
 */

const claimSchema = z.object({ code: z.string().min(1).max(64) });
const disconnectSchema = z.object({ linkRef: z.string().min(1).max(64) });

async function learnerList(guardianId: string) {
  const learners = await listGuardianLinks(getDatabase(), guardianId);
  return learners.map((row) => ({
    linkRef: row.linkRef,
    firstName: row.learnerName,
    courseGroup: courses[row.courseId as keyof typeof courses]?.courseFacts.ageRange || "KidyCode",
    connectedAt: row.connectedAt,
  }));
}

export async function POST(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();
    const parsed = claimSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Enter the connection code exactly as it appears." }, { status: 400 });
    }

    const normalised = normaliseConnectCode(parsed.data.code);
    if (!normalised) {
      /* A code that cannot even be a code is still bounded, so a caller cannot
       * probe the space without limit. */
      const outcome = await claimConnectCode(getDatabase(), established.account.id, parsed.data.code, "", new Date().toISOString());
      return connectFailure(outcome.status);
    }

    const database = getDatabase();
    const now = new Date().toISOString();
    const outcome = await claimConnectCode(database, established.account.id, parsed.data.code, normalised, now);
    if (outcome.status !== "linked") return connectFailure(outcome.status);

    return Response.json({
      connected: true,
      learner: { linkRef: outcome.linkRef, firstName: outcome.learnerName },
      learners: await learnerList(established.account.id),
    });
  } catch (error) {
    return databaseError(error);
  }
}

function connectFailure(status: string): Response {
  if (status === "rate-limited") {
    return Response.json(
      { error: "Too many attempts. Wait a few minutes before trying another code." },
      { status: 429 },
    );
  }
  if (status === "not-found") {
    return Response.json({ error: "That code was not recognised. Check it and try again." }, { status: 404 });
  }
  if (status === "expired") {
    return Response.json({ error: "That code has expired. Ask the learner for a new one." }, { status: 410 });
  }
  if (status === "used") {
    return Response.json({ error: "That code has already been used. Ask the learner for a new one." }, { status: 410 });
  }
  if (status === "locked") {
    return Response.json({ error: "That code is no longer valid. Ask the learner for a new one." }, { status: 410 });
  }
  if (status === "raced") {
    return Response.json({ error: "That code was used at the same moment elsewhere. Ask the learner for a new one." }, { status: 409 });
  }
  return Response.json({ error: "That code is no longer valid. Ask the learner for a new one." }, { status: 410 });
}

export async function DELETE(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();
    const parsed = disconnectSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "That request could not be read." }, { status: 400 });
    }

    const revoked = await revokeGuardianLink(getDatabase(), established.account.id, parsed.data.linkRef, new Date().toISOString());
    if (!revoked) {
      return Response.json({ error: "That learner is not connected to you." }, { status: 403 });
    }
    return Response.json({ disconnected: true, learners: await learnerList(established.account.id) });
  } catch (error) {
    return databaseError(error);
  }
}