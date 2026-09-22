import { z } from "zod";
import { authenticateLearner, databaseError, getDatabase, unauthorized } from "@/lib/server-database";
import { cancelTransferCode, createTransferCode, pendingTransferCode } from "@/lib/transfer-codes";

/*
 * The learner's own transfer codes, created on the device they are using now.
 *
 * The plain code is returned exactly once, to the device that asked for it. After
 * that only its digest exists, so nothing here can show it again. A new code
 * cancels any unused one, which is what stops two live codes existing at once.
 */

const bodySchema = z.object({ action: z.literal("generate") });

export async function GET(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();

    const database = getDatabase();
    const now = new Date().toISOString();
    const [pending, guardians] = await Promise.all([
      pendingTransferCode(database, learner.id, now),
      database
        .prepare("SELECT COUNT(*) AS total FROM guardian_links WHERE learner_id = ? AND status = 'active'")
        .bind(learner.id)
        .first<{ total: number }>(),
    ]);

    return Response.json({
      pending,
      guardianConnected: (guardians?.total ?? 0) > 0,
      codeLifetimeMinutes: 10,
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
      return Response.json({ error: "Choose to create a transfer code." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const transfer = await createTransferCode(getDatabase(), learner.id, "learner", now);
    return Response.json({ transfer, codeLifetimeMinutes: 10 }, { status: 201 });
  } catch (error) {
    return databaseError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const learner = await authenticateLearner(request);
    if (!learner) return unauthorized();
    const cancelled = await cancelTransferCode(getDatabase(), learner.id, new Date().toISOString());
    return Response.json({ cancelled });
  } catch (error) {
    return databaseError(error);
  }
}
