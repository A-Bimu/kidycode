import { z } from "zod";
import { sessionCookie } from "@/lib/access-keys";
import { courseRoute } from "@/lib/course-routes";
import { normaliseConnectCode } from "@/lib/one-time-codes";
import { databaseError, getDatabase } from "@/lib/server-database";
import { claimTransferCode, sourceScope } from "@/lib/transfer-codes";

/*
 * Claiming a transfer code on a new device.
 *
 * No learner session is needed to reach this, because the whole point is that the
 * new device has none. The code is the only credential, it works once, and the
 * claim rotates the learner's access key, so the device that held the old key
 * stops working the moment this succeeds.
 *
 * The response carries the learner's course path and nickname and nothing else.
 * The new access key leaves only inside the HttpOnly cookie.
 */

const bodySchema = z.object({ code: z.string().trim().min(1).max(40) });

function failure(status: string): Response {
  if (status === "expired") {
    return Response.json({ error: "That code has expired. Codes last ten minutes. Ask for a new one." }, { status: 410 });
  }
  if (status === "used") {
    return Response.json({ error: "That code has already been used. Ask for a new one to move again." }, { status: 410 });
  }
  if (status === "invalidated") {
    return Response.json({ error: "That code was replaced or cancelled. Ask for a new one." }, { status: 410 });
  }
  if (status === "locked") {
    return Response.json({ error: "That code can no longer be used. Ask for a new one." }, { status: 410 });
  }
  if (status === "raced") {
    return Response.json({ error: "Another device used that code first. The transfer finished on that device." }, { status: 409 });
  }
  if (status === "rate-limited") {
    return Response.json({ error: "Too many attempts. Please wait ten minutes before trying again." }, { status: 429 });
  }
  return Response.json({ error: "That code was not found. Check every character and try again." }, { status: 404 });
}

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Enter the transfer code from your other device." }, { status: 400 });
    }

    const normalised = normaliseConnectCode(parsed.data.code);
    if (!normalised) {
      return Response.json({ error: "That is not a transfer code. Check the letters and numbers and try again." }, { status: 400 });
    }

    const scope = await sourceScope((request.headers.get("cf-connecting-ip") || "").trim() || "local");
    const outcome = await claimTransferCode(getDatabase(), normalised, scope, new Date().toISOString());

    if (outcome.status !== "transferred" || !outcome.newAccessKey) return failure(outcome.status);

    const response = Response.json({
      transferred: true,
      coursePath: courseRoute(outcome.courseId),
      nickname: outcome.nickname,
    });
    response.headers.append("set-cookie", sessionCookie(outcome.learnerId, outcome.newAccessKey));
    return response;
  } catch (error) {
    return databaseError(error);
  }
}
