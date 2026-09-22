import { z } from "zod";
import { maskEmail } from "@/lib/guardian-identity";
import {
  createConnectCode,
  listLearnerConnections,
  pendingConnectCode,
  revokeLearnerConnection,
} from "@/lib/guardian-links";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";

/*
 * The learner's side of grown-up access.
 *
 * This is the only place a connection code is ever produced, and the plain code
 * is returned once to the learner who asked for it. It is never logged, never
 * stored and never shown to anyone else.
 */

const generateSchema = z.object({ action: z.literal("generate") });
const revokeSchema = z.object({ action: z.literal("revoke"), linkRef: z.string().min(1).max(64) });

/* Guardian controls are for the learner courses only. An adult keeps their own
 * progress private. */
function guardianControlsUnavailable(courseId: string): boolean {
  return courseId === "adults";
}

async function connectionsPayload(learnerId: string, now: string) {
  const database = getDatabase();
  const [connections, pending] = await Promise.all([
    listLearnerConnections(database, learnerId),
    pendingConnectCode(database, learnerId, now),
  ]);
  return {
    connections: connections.map((row) => ({
      linkRef: row.linkRef,
      guardianName: row.guardianName,
      guardianEmailMasked: maskEmail(row.guardianEmail),
      connectedAt: row.connectedAt,
    })),
    pendingCode: pending ? { expiresAt: pending.expiresAt } : null,
  };
}

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    if (guardianControlsUnavailable(learner.courseId)) {
      return Response.json({ error: "Grown-up access is not part of this learning path." }, { status: 409 });
    }
    return Response.json(await connectionsPayload(learner.id, new Date().toISOString()));
  } catch (error) {
    return databaseError(error);
  }
}

export async function POST(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    if (guardianControlsUnavailable(learner.courseId)) {
      return Response.json({ error: "Grown-up access is not part of this learning path." }, { status: 409 });
    }
    const parsed = generateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "That request could not be read." }, { status: 400 });
    }

    const now = new Date().toISOString();
    /* A replacement code invalidates the previous unused one, so only the newest
     * code can be claimed. */
    const created = await createConnectCode(getDatabase(), learner.id, now);
    return Response.json({
      /* The plain code is returned once, to the learner who asked for it. */
      issuedCode: created.code,
      ...(await connectionsPayload(learner.id, now)),
    });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    if (guardianControlsUnavailable(learner.courseId)) {
      return Response.json({ error: "Grown-up access is not part of this learning path." }, { status: 409 });
    }
    const parsed = revokeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "That request could not be read." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const revoked = await revokeLearnerConnection(getDatabase(), learner.id, parsed.data.linkRef, now);
    if (!revoked) {
      return Response.json({ error: "That connection is not one of yours." }, { status: 403 });
    }
    return Response.json({ revoked: true, ...(await connectionsPayload(learner.id, now)) });
  } catch (error) {
    return databaseError(error);
  }
}
