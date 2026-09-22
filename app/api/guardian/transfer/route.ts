import { z } from "zod";
import { establishGuardian, guardianUnauthorized } from "@/lib/guardian-auth";
import { resolveGuardianLink } from "@/lib/guardian-links";
import { databaseError, getDatabase } from "@/lib/server-database";
import { createTransferCode } from "@/lib/transfer-codes";

/*
 * A grown-up creating a transfer code for a learner they are actively connected to.
 *
 * The learner is reached only through the guardian's own link, so a revoked or
 * unrelated grown-up cannot make a code for a learner they do not hold. The
 * response carries the code and its expiry, never the learner's session, access
 * key or access hash.
 */

const bodySchema = z.object({ link: z.string().min(1).max(64) });

export async function POST(request: Request) {
  try {
    const established = await establishGuardian(request);
    if (!established) return guardianUnauthorized();
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Choose a learner from your list." }, { status: 400 });
    }

    const database = getDatabase();
    const link = await resolveGuardianLink(database, established.account.id, parsed.data.link);
    if (!link) {
      return Response.json({ error: "That learner is not connected to you." }, { status: 403 });
    }

    const transfer = await createTransferCode(database, link.learnerId, "guardian", new Date().toISOString());
    return Response.json({ transfer, codeLifetimeMinutes: 10 }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}
