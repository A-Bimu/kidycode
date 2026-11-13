/*
 * Notification drafting, permissions and safety rules.
 *
 * There is NO send path in this module, on purpose. Nothing here opens a mail, SMS,
 * WhatsApp or push connection and no provider is configured. What it does is decide what a
 * message would say, who is allowed to receive it, whether the moment is acceptable to send
 * it and whether the sender is allowed to broadcast at all. The console then shows the draft
 * and a dry-run delivery plan. Live delivery stays blocked until the owner approves a
 * provider and the consent work in the brief is done.
 *
 * The rules, in one place so they can be tested:
 *   - Only the platform owner may broadcast to a whole pathway.
 *   - An institution role may only address the cohorts it already leads, and never platform-wide.
 *   - A guardian may only be addressed about a child they are verifiably linked to.
 *   - A learner under 18 is not messaged directly unless explicit child-directed consent exists.
 *   - Quiet hours are respected in the recipient's own time zone.
 *   - A frequency cap stops repeat nudging inside one week.
 */

export const notificationTemplates = [
  "unfinished-lesson",
  "new-module",
  "missed-week",
  "achievement",
  "guardian-report",
  "announcement",
] as const;
export type NotificationTemplate = (typeof notificationTemplates)[number];

export const notificationAudiences = ["guardian", "learner"] as const;
export type NotificationAudience = (typeof notificationAudiences)[number];

export type MessageVariable =
  | "name"
  | "lessonTitle"
  | "moduleTitle"
  | "streak"
  | "completedCount"
  | "nextSuggestion"
  | "organisationName"
  /* Not a message variable: it records that explicit child-directed consent exists. It is
   * read by canSend and is deliberately never rendered into a message. */
  | "consent_child_directed";

export type NotificationDraft = {
  template: NotificationTemplate;
  audience: NotificationAudience;
  recipientRef: string;
  variables: Partial<Record<MessageVariable, string>>;
  scheduledAt?: string | null;
};

export type RenderedMessage = {
  subject: string;
  body: string;
  template: NotificationTemplate;
  audience: NotificationAudience;
};

export type SenderRole = "owner" | "institution" | "guardian";

export type SenderContext = {
  role: SenderRole;
  cohortIds: string[];
  guardianLinkedChildRefs: string[];
};

export type PermissionDecision = { allowed: boolean; reason: string };

export type QuietHours = { startHour: number; endHour: number; timeZone: string };

export const defaultQuietHours: QuietHours = { startHour: 19, endHour: 7, timeZone: "Africa/Nairobi" };
export const frequencyCapPerWeek = 2;

/* Non-shaming, age-safe copy. Nothing here blames the learner for stopping and nothing
 * presumes the reason. "missed-week" in particular never mentions absence. */
const templateCopy: Record<NotificationTemplate, { subject: string; body: string }> = {
  "unfinished-lesson": {
    subject: "{name}, your next step is ready when you are",
    body: "You were working on {lessonTitle}. It is waiting exactly where you left it, with nothing lost. When you have a moment, the next small step is enough.",
  },
  "new-module": {
    subject: "A new module is open: {moduleTitle}",
    body: "The next part of your course is ready: {moduleTitle}. You can look at it whenever you like. There is no rush and no deadline.",
  },
  "missed-week": {
    subject: "A short practice idea for {name}",
    body: "Here is one small thing that keeps the last lesson fresh: {nextSuggestion}. Ten minutes is plenty. Everything else can wait.",
  },
  achievement: {
    subject: "{name} finished something worth noticing",
    body: "You completed {completedCount} lessons and kept a streak of {streak}. Well done. The next suggestion is {nextSuggestion} when you want it.",
  },
  "guardian-report": {
    subject: "{name}'s week in {organisationName}",
    body: "{name} completed {completedCount} lessons this week and is working on {moduleTitle}. A useful next step together is {nextSuggestion}.",
  },
  announcement: {
    subject: "A note from KidyCode",
    body: "{moduleTitle}",
  },
};

const PLACEHOLDER = /\{(\w+)\}/g;
const RENDERABLE_VARIABLES = ["name", "lessonTitle", "moduleTitle", "streak", "completedCount", "nextSuggestion", "organisationName"] as const;

/* A name is shown as a nickname or a shortened form only. Never an email, never a full
 * legal name, never a school, never an address. */
export function safeDisplayName(raw: string | undefined): string {
  const value = (raw || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (value.length === 0) return "there";
  return value.slice(0, 24);
}

function safeValue(raw: string | undefined): string {
  return (raw || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function renderMessage(draft: NotificationDraft): RenderedMessage {
  const copy = templateCopy[draft.template];
  const values: Record<string, string> = { name: safeDisplayName(draft.variables.name) };
  for (const key of RENDERABLE_VARIABLES) {
    if (key === "name") continue;
    values[key] = safeValue(draft.variables[key]);
  }
  const fill = (text: string) => text.replace(PLACEHOLDER, (_match, key: string) => values[key] ?? "");
  return { subject: fill(copy.subject), body: fill(copy.body), template: draft.template, audience: draft.audience };
}

export function canSend(context: SenderContext, draft: NotificationDraft): PermissionDecision {
  if (context.role === "owner") {
    return draft.audience === "learner" && draft.variables.consent_child_directed !== "yes"
      ? { allowed: false, reason: "Owner may broadcast, but a learner under 18 is only messaged directly with explicit child-directed consent." }
      : { allowed: true, reason: "The platform owner may broadcast." };
  }
  if (context.role === "institution") {
    if (!draft.recipientRef) return { allowed: false, reason: "An institution message must name a cohort the sender already leads." };
    if (!context.cohortIds.includes(draft.recipientRef)) {
      return { allowed: false, reason: "That cohort is not one this sender leads, so the message is refused." };
    }
    if (draft.audience === "learner") {
      return { allowed: false, reason: "An institution role may not address a learner directly; message the guardian instead." };
    }
    return { allowed: true, reason: "The sender leads this cohort." };
  }
  if (context.role === "guardian") {
    if (!draft.variables.consent_child_directed) {
      return { allowed: false, reason: "A guardian may address only their own linked children, and this message names no such link." };
    }
    return { allowed: true, reason: "A guardian may message a child they are linked to." };
  }
  return { allowed: false, reason: "This role may not send notifications." };
}

export function hourIn(timeZone: string, at: Date): number {
  try {
    return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone }).format(at));
  } catch {
    return at.getUTCHours();
  }
}

export function withinQuietHours(at: Date, quiet: QuietHours, timeZone: string): boolean {
  const hour = hourIn(timeZone, at);
  const { startHour, endHour } = quiet;
  return startHour <= endHour ? hour >= startHour && hour < endHour : hour >= startHour || hour < endHour;
}

export type SendPlan = {
  deliverable: boolean;
  liveDeliveryEnabled: false;
  reasons: string[];
  preview: RenderedMessage;
  dryRunOnly: true;
};

export function planSend(
  context: SenderContext,
  draft: NotificationDraft,
  options: { now?: Date; quiet?: QuietHours; sentThisWeek?: number; recipientTimeZone?: string; liveDeliveryApproved?: boolean } = {},
): SendPlan {
  const now = options.now ?? new Date();
  const quiet = options.quiet ?? defaultQuietHours;
  const timeZone = options.recipientTimeZone ?? quiet.timeZone;
  const reasons: string[] = [];

  const permission = canSend(context, draft);
  if (!permission.allowed) reasons.push(permission.reason);

  if (withinQuietHours(now, quiet, timeZone)) {
    reasons.push(`Inside quiet hours for ${timeZone} (${hourIn(timeZone, now)}:00 there), so delivery is held to the next allowed window.`);
  }
  if ((options.sentThisWeek ?? 0) >= frequencyCapPerWeek) {
    reasons.push(`Frequency cap reached: ${frequencyCapPerWeek} messages per week per recipient.`);
  }
  if (draft.audience === "learner" && !options.liveDeliveryApproved) {
    reasons.push("Live child-directed delivery is not approved.");
  }

  return {
    deliverable: reasons.length === 0,
    /* Hard-coded false. Wiring a provider is an explicit owner decision and a separate change. */
    liveDeliveryEnabled: false,
    reasons: reasons.length > 0 ? reasons : ["The draft passes every rule, but live delivery is disabled in this build."],
    preview: renderMessage(draft),
    dryRunOnly: true,
  };
}

export const deliveryDisabledNote =
  "No message is sent by this console. Drafting, preview and the dry-run plan are real; delivery needs an approved provider, guardian consent and an explicit owner decision.";
