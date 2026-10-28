// "Ask my family": the short message a learner sends to family, and the links that send it.
// The message holds only the goal (guide title or question) and the current step, never anything private.

import type { MessageKey, TranslateVars } from "@/lib/i18n/locales";
import { phraseCheck } from "@/lib/safety/phraseCheck";
import { scamPrecheck } from "@/lib/safety/scamPrecheck";

type Translate = (key: MessageKey, vars?: TranslateVars) => string;

export type FamilyHelpContext = {
  /** The guide title or the learner's question; missing on the home screen. */
  goal?: string;
  /** Set inside a steps guide. */
  step?: { number: number; total: number; instruction: string };
  /**
   * What went wrong, in a few words: from I'm stuck or That's not what I see, or a quick choice in the sheet
   * ("I can't find the button").
   */
  problem?: string;
  /** Anything else the learner typed for their family. */
  note?: string;
};

/** Who the message is from: what the learner asked to be called ("Mom", "Nani"); empty or missing means "I". */
export type FamilySender = { callMe?: string | null };

export type FamilyMessage = {
  /** Shown one per line in the sheet, exactly as sent. */
  lines: string[];
  text: string;
};

/** The quick choices for "What went wrong?" in Ask my family. */
export const FAMILY_PROBLEMS: readonly MessageKey[] = [
  "askFamily.problem.cantFind",
  "askFamily.problem.different",
  "askFamily.problem.error",
  "askFamily.problem.unsure",
];

// Words for secrets, and anything that looks like a code or card number (4+ digits, spaces or dashes allowed).
const SECRET_WORDS =
  /\b(?:otps?|one[- ]time (?:pass(?:word|code)?|code)|passwords?|passcodes?|cvv|verification code|security code|card (?:number|details)|bank details)\b|ओटीपी|पासवर्ड|पिन/iu;
// "pin a chat" is fine; a PIN is a secret when written in capitals or named as one.
const PIN = /\bPIN\b/u;
const PIN_NAMED = /\b(?:my|upi|atm|card|sim|your|secret) pins?\b|\bpin (?:code|number)\b/iu;
const DIGIT_RUN = /\d(?:[\s-]?\d){3,}/u;

/** True when text mentions an OTP, password, PIN or similar, holds a code-like number, or matches a handover pattern. */
export function hasPrivateInfo(text: string): boolean {
  const t = text.normalize("NFC");
  if (SECRET_WORDS.test(t) || PIN.test(t) || PIN_NAMED.test(t) || DIGIT_RUN.test(t)) return true;
  if (phraseCheck(t)) return true;
  return scamPrecheck(t)?.topics.includes("secret") ?? false;
}

const oneLine = (text: string | null | undefined) => (text ?? "").replace(/\s+/g, " ").trim();

/** Kept only when it holds nothing private. */
const safe = (text: string | null | undefined) => {
  const line = oneLine(text);
  return line && !hasPrivateInfo(line) ? line : "";
};

// Guide titles start with a verb ("Post a story on Instagram"); it reads as "trying to post a story on Instagram".
const VERBS =
  /^(?:add|ask|block|book|call|change|check|connect|copy|delete|download|find|get|install|join|learn|log|make|open|order|pay|post|print|put|read|record|reset|save|search|see|send|set|share|sign|spot|start|stop|take|track|turn|update|use|watch|write)$/;

/** "Post a story on Instagram." → "post a story on Instagram"; app names and other words keep their capitals. */
export function plainTask(goal: string): string {
  const task = oneLine(goal).replace(/[.!।]+$/u, "");
  const first = task.split(" ")[0] ?? "";
  return VERBS.test(first.toLowerCase()) && /^[A-Z][a-z]*$/.test(first) ? first.toLowerCase() + task.slice(first.length) : task;
}

/** A question ("how do I send a photo?") reads as "stuck on this: …", not "trying to …". */
const isQuestion = (goal: string) => /\?\s*$/.test(goal) || /^(?:how|what|why|where|when|which|can|could|is|are|do|does)\b/i.test(goal);

/**
 * The message to family, one line each: who is stuck and on what, the step, what went wrong and an optional note,
 * then "Sent from Tech Helper". With a name ("Mom") it repeats the name and never uses he or she; without one it
 * is written as "I". The goal, step, problem and note are each left out when they hold anything private.
 */
export function buildFamilyMessage(
  { goal, step, problem, note }: FamilyHelpContext,
  t: Translate,
  { callMe }: FamilySender = {},
): FamilyMessage {
  const name = oneLine(callMe);
  const g = safe(goal);
  const lines: string[] = [];
  if (g) {
    const task = plainTask(g);
    const key = isQuestion(g)
      ? name
        ? "askFamily.msg.named.question"
        : "askFamily.msg.question"
      : name
        ? "askFamily.msg.named.goal"
        : "askFamily.msg.goal";
    lines.push(t(key, { name, task }));
  } else {
    lines.push(name ? t("askFamily.msg.named.generic", { name }) : t("askFamily.msg.generic"));
  }
  if (step) {
    const instruction = safe(step.instruction);
    const vars = { name, step: step.number, total: step.total, instruction };
    lines.push(
      t(
        instruction
          ? name
            ? "askFamily.msg.named.step"
            : "askFamily.msg.step"
          : name
            ? "askFamily.msg.named.stepOnly"
            : "askFamily.msg.stepOnly",
        vars,
      ),
    );
  }
  const what = safe(problem);
  if (what) lines.push(t("askFamily.msg.problem", { problem: what }));
  const extra = safe(note);
  if (extra) lines.push(t("askFamily.msg.note", { note: extra }));
  lines.push(t("askFamily.msg.from"));
  return { lines, text: lines.join("\n") };
}

/** wa.me with the saved number (digits only); with none, WhatsApp asks who to send it to. */
export function whatsAppLink(text: string, phone: string | null | undefined): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** iPhone and iPad read the body after `&`; Android and others after `?`. */
export function smsLink(text: string, phone: string | null | undefined, ios: boolean): string {
  const number = (phone ?? "").replace(/[^\d+]/g, "");
  return `sms:${number}${ios ? "&" : "?"}body=${encodeURIComponent(text)}`;
}

/** What a guide is about: its title (else the question), or nothing when the learner's question holds something private. */
export function guideGoal(guide: { title: string; question: string }): string | undefined {
  if (hasPrivateInfo(guide.question)) return undefined;
  return guide.title.trim() || guide.question;
}
