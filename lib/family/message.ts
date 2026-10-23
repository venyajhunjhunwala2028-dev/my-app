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
};

export type FamilyMessage = {
  /** Shown one per line in the sheet, exactly as sent. */
  lines: string[];
  text: string;
};

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

export function buildFamilyMessage({ goal, step }: FamilyHelpContext, t: Translate): FamilyMessage {
  const g = goal?.replace(/\s+/g, " ").trim() ?? "";
  const lines = [g && !hasPrivateInfo(g) ? t("askFamily.msg.goal", { goal: g }) : t("askFamily.msg.generic")];
  if (step) {
    const instruction = step.instruction.replace(/\s+/g, " ").trim();
    const vars = { step: step.number, total: step.total };
    lines.push(
      instruction && !hasPrivateInfo(instruction)
        ? t("askFamily.msg.step", { ...vars, instruction })
        : t("askFamily.msg.stepOnly", vars),
    );
  }
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
