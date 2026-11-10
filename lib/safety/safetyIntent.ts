// Client-safe, deterministic: is the learner asking whether something they received is safe?
// Those questions go to the scam check ("Verify before I do it") instead of a how-to guide.
// It looks for a question about *this* message, link or call, not for general safety topics,
// so "How do I spot a scam message?" or "Is it safe to accept a payment request from a stranger?" stay as guides.
import type { AskAnswer } from "@/lib/ai/schemas";

const rx = (s: string) => new RegExp(s, "iu");

const VERDICT_WORD = String.raw`(?:safe|scam|scams|real|really|genuine|legit|legitimate|fake|fraud|trustworthy|trusted|from (?:my|the))`;
const THING = String.raw`(?:link|attachment|file|message|email|e-mail|text|pdf|website|site)`;

const RULES: RegExp[] = [
  // "Is this message safe?", "Is this really from my bank?", "Is that text real or fake?"
  rx(String.raw`\bis (?:this|that|these)\b[^.?!]{0,40}?\b${VERDICT_WORD}\b`),
  // "is it real?", "is it safe to click", "is it from my bank?" (but not "is it safe to accept a payment…")
  rx(String.raw`\bis it (?:safe to (?:click|open|tap|reply|answer|call)|real|really|genuine|legit|fake|a scam|a fraud|from (?:my|the))\b`),
  // "Should I reply?", "Should I click the link?"
  rx(String.raw`\bshould i (?:reply|respond|answer|trust|believe|click|tap)\b`),
  rx(String.raw`\bshould i open (?:this|that|it|the)\b(?:[^.?!]{0,20}?\b${THING}\b|\s*[?.!]?\s*$)`),
  rx(String.raw`\bshould i call (?:(?:this|that|the) (?:number|person)|back|them|him|her)\b`),
  // "Can I trust this email?"
  rx(String.raw`\bcan i (?:trust|believe) (?:this|that|it|these|the)\b`),
  // Hindi (Devanagari has no \b, so edges are explicit) and Hinglish.
  rx(String.raw`क्या (?:यह|ये|वह|वो)[^?।]{0,30}(?:सुरक्षित|असली|सही|धोखा|फ़्रॉड|फ्रॉड|नकली|सच में)`),
  rx(String.raw`क्या (?:मुझे|मैं)[^?।]{0,20}(?:जवाब|रिप्लाई)`),
  rx(String.raw`\bkya (?:ye|yeh|yah|woh|wo)\b[^?.!]{0,30}\b(?:safe|sahi|asli|fraud|fake|nakli|scam|dhokha)\b`),
  rx(String.raw`\b(?:reply|jawab) (?:karu|karun|karoon|du|dun|doon)\b`),
];

/** "How should I reply to an email?" is a how-to, not a safety question. */
const HOW_TO = rx(String.raw`\bhow (?:should|do|can|could) i\b`);

/** True when the question asks whether something the learner received is safe to trust, click or answer. */
export function isSafetyQuestion(question: string): boolean {
  const text = question.normalize("NFC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  if (!text || HOW_TO.test(text)) return false;
  return RULES.some((r) => r.test(text));
}

const DEVANAGARI = /[ऀ-ॿ]/u;

const SAFETY_CHECK_MESSAGES = {
  en: "Good idea to check first. Let's look at it together. Please show me the message, email or link.",
  hi: "पहले जाँचना अच्छा है। चलिए साथ में देखते हैं। मुझे वह मैसेज, ईमेल या लिंक दिखाइए।",
} as const;

/** The answer the ask route gives a safety question, without calling the AI. */
export function safetyCheckAnswer(question: string): Extract<AskAnswer, { kind: "safety_check" }> {
  const language = DEVANAGARI.test(question) ? "hi" : "en";
  return { kind: "safety_check", language, message: SAFETY_CHECK_MESSAGES[language] };
}

/** The scam check page, with the learner's own question ready to go with what they paste or upload. */
export function scamCheckHref(question: string): string {
  const q = question.trim().slice(0, 500);
  return q ? `/app/scam?q=${encodeURIComponent(q)}` : "/app/scam";
}
