import {
  canSend,
  defaultQuietHours,
  deliveryDisabledNote,
  frequencyCapPerWeek,
  notificationAudiences,
  notificationTemplates,
  planSend,
  renderMessage,
  type NotificationAudience,
  type NotificationTemplate,
  type SenderContext,
} from "@/lib/admin-notifications";
import { requireOwner } from "@/lib/preview-runtime";

/*
 * The notification centre's server side — the Node twin of
 * app/api/admin/notifications/route.ts.
 *
 * There is no send. No provider is configured, no credential is read and nothing leaves the
 * process: planSend is hard-coded to liveDeliveryEnabled: false. The route is owner-gated, so
 * the drafting rules cannot be probed by anyone else.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const audiences: readonly string[] = notificationAudiences;
const templates: readonly string[] = notificationTemplates;

export async function GET(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  return Response.json(
    {
      provenance: guard.provenance,
      readOnly: true,
      templates,
      audiences,
      quietHours: defaultQuietHours,
      frequencyCapPerWeek,
      liveDeliveryEnabled: false,
      notice: deliveryDisabledNote,
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

type DraftBody = {
  template?: string;
  audience?: string;
  recipientRef?: string;
  variables?: Record<string, string>;
  sentThisWeek?: number;
  recipientTimeZone?: string;
};

export async function POST(request: Request) {
  const guard = await requireOwner(request);
  if (!guard.ok) return guard.response;

  let body: DraftBody;
  try {
    body = await request.json() as DraftBody;
  } catch {
    return Response.json({ error: "A JSON draft is required." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  if (!body.template || !templates.includes(body.template)) {
    return Response.json({ error: "Unknown template." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }
  if (!body.audience || !audiences.includes(body.audience)) {
    return Response.json({ error: "Unknown audience." }, { status: 400, headers: { "Cache-Control": "private, no-store" } });
  }

  const draft = {
    template: body.template as NotificationTemplate,
    audience: body.audience as NotificationAudience,
    recipientRef: typeof body.recipientRef === "string" ? body.recipientRef.slice(0, 120) : "",
    variables: sanitizeVariables(body.variables),
  };

  const context: SenderContext = { role: "owner", cohortIds: [], guardianLinkedChildRefs: [] };
  const permission = canSend(context, draft);
  const plan = planSend(context, draft, {
    sentThisWeek: typeof body.sentThisWeek === "number" ? body.sentThisWeek : 0,
    recipientTimeZone: typeof body.recipientTimeZone === "string" ? body.recipientTimeZone.slice(0, 60) : undefined,
    liveDeliveryApproved: false,
  });

  return Response.json(
    {
      provenance: guard.provenance,
      readOnly: true,
      permission,
      plan,
      preview: renderMessage(draft),
      notice: deliveryDisabledNote,
    },
    { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
  );
}

function sanitizeVariables(input: unknown): Record<string, string> {
  const allowed = ["name", "lessonTitle", "moduleTitle", "streak", "completedCount", "nextSuggestion", "organisationName", "consent_child_directed"];
  const output: Record<string, string> = {};
  if (!input || typeof input !== "object") return output;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!allowed.includes(key) || typeof value !== "string") continue;
    output[key] = value.slice(0, 200);
  }
  return output;
}
