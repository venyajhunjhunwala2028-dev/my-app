// Deterministic handover-pattern check (KTD4). Runs before any AI call.
// It looks for someone being given a secret, gift cards, remote access, or money,
// not for bare mentions of "password", "OTP" or "code".

export type PhraseCheckResult =
  | { kind: "scam_warning"; language: string; message: string }
  | { kind: "money_refusal"; language: string; message: string };

const SECRET = String.raw`(?:otp|one[- ]time (?:pass)?(?:code|word)|verification code|security code|pin|passcode|password|code)s?`;
const HANDOVER_VERB = String.raw`(?:give|giving|share|sharing|tell|telling|read(?:ing)?(?: out)?|send|sending|forward|say|reveal)`;
const RECIPIENT = String.raw`(?:him|her|them|someone|somebody|the caller|a caller|the bank|the man|the woman|the person|that person|this person|a stranger|customer care|the agent|the officer)`;
const REQUESTER = String.raw`(?:someone|somebody|he|she|they|(?:the |a )?(?:caller|man|woman|person|bank|agent|officer|stranger|executive|guy|lady)|customer care)`;
const ASKS = String.raw`(?:ask(?:ed|ing|s)?|want(?:s|ed)?|need(?:s|ed)?|request(?:ed|ing|s)?|told me|tells me)`;
const GAP = String.raw`[^.?!]{0,40}`;
const REMOTE_APP = String.raw`(?:any ?desk|team ?viewer|quick ?support|rust ?desk|remote access|remote desktop|remote control app)`;
const MONEY = String.raw`(?:\b(?:money|cash|funds|rupees|rs|dollars)\b|₹|\$)`;

const rx = (s: string) => new RegExp(s, "iu");

const SCAM_EN = [
  // "the bank wants the code they sent me", "someone asked me for my OTP"
  rx(String.raw`\b${REQUESTER}\b${GAP}\b${ASKS}\b${GAP}\b${SECRET}\b`),
  // "tell them my OTP", "give him the code"
  rx(String.raw`\b${HANDOVER_VERB}\s+(?:it\s+)?(?:to\s+)?${RECIPIENT}\b${GAP}\b${SECRET}\b`),
  // "share my password with the caller"
  rx(String.raw`\b${HANDOVER_VERB}\b${GAP}\b${SECRET}\b${GAP}\b(?:to|with)\s+${RECIPIENT}\b`),
  // an OTP is never meant for another person: "share my OTP", "read out the OTP"
  rx(String.raw`\b(?:give|giving|share|sharing|tell|telling|read(?:ing)? out|say|reveal|forward)\b[^.?!]{0,20}\botps?\b`),
  // gift cards for someone else
  rx(String.raw`\b(?:buy|buying|purchase|get|send)\b${GAP}\bgift ?cards?\b${GAP}\b(?:for|to)\s+${RECIPIENT}\b`),
  rx(String.raw`\b${REQUESTER}\b${GAP}\b${ASKS}\b${GAP}\bgift ?cards?\b`),
  // remote access on request
  rx(String.raw`\b${REQUESTER}\b${GAP}\b${ASKS}\b${GAP}\b${REMOTE_APP}\b`),
  rx(String.raw`\b(?:install|download|open|set up)\b${GAP}\b${REMOTE_APP}\b${GAP}\b(?:for)\s+${RECIPIENT}\b`),
  rx(String.raw`\bgive\s+${RECIPIENT}\s+(?:remote )?access\b`),
  // a stranger or caller asking for money
  rx(String.raw`\b${REQUESTER}\b${GAP}\b${ASKS}\b${GAP}\b(?:send|transfer|pay)\b${GAP}${MONEY}`),
];

const MONEY_EN = [
  rx(String.raw`\b(?:send|sending|transfer|transferring|wire)\b${GAP}${MONEY}`),
];

// Hindi (Devanagari) and Hinglish. \b does not work around Devanagari, so use explicit edges.
const END = String.raw`(?=$|[\s.,!?।])`;
const H_SECRET = String.raw`(?:otp|ओटीपी|code|कोड|pin|पिन|password|पासवर्ड)`;
const H_GIVE = String.raw`(?:bata|batao|bataiye|bataye|bata do|batado|de do|dedo|do|bhejo|bhej do|share karo|बताओ|बता|बताइए|बताएं|बता दो|दे दो|दो|भेजो|भेज दो|शेयर करो)`;
const H_MONEY = String.raw`(?:paise|paisa|pese|rupaye|rupees|पैसे|पैसा|रुपये|रुपए)`;
const H_SEND = String.raw`(?:bhej\S*|transfer\S*|भेज\S*|ट्रांसफर\S*)`;

const SCAM_HI = [rx(String.raw`(?:^|\s)${H_SECRET}\s+${H_GIVE}${END}`)];
const MONEY_HI = [rx(String.raw`(?:^|\s)${H_MONEY}(?:\s+\S+){0,2}\s+${H_SEND}${END}`)];

const MESSAGES = {
  en: {
    scam_warning:
      "Stop. This looks like a scam. Never give your OTP, code, PIN or password to anyone, even if they say they are from your bank. Do not install apps or send money for them. Put the phone down and call your family first.",
    money_refusal:
      "I can't help with sending money or payments. Please ask someone you trust, like a family member, to help you with this.",
  },
  hi: {
    scam_warning:
      "रुकिए। यह धोखा लग रहा है। अपना OTP, कोड, PIN या पासवर्ड किसी को न बताएं, चाहे वे बैंक से होने की बात कहें। उनके कहने पर कोई ऐप न डालें और पैसे न भेजें। पहले अपने परिवार को फ़ोन करें।",
    money_refusal:
      "मैं पैसे भेजने या पेमेंट में मदद नहीं कर सकता। कृपया परिवार के किसी भरोसेमंद व्यक्ति से मदद लें।",
  },
} as const;

const DEVANAGARI = /[ऀ-ॿ]/u;

function result(kind: PhraseCheckResult["kind"], text: string, hindiMatch: boolean): PhraseCheckResult {
  const language = hindiMatch || DEVANAGARI.test(text) ? "hi" : "en";
  return { kind, language, message: MESSAGES[language][kind] };
}

/** Returns a warning answer when the question matches a handover pattern, otherwise null. */
export function phraseCheck(question: string): PhraseCheckResult | null {
  const text = question.normalize("NFC").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
  if (SCAM_HI.some((r) => r.test(text))) return result("scam_warning", text, true);
  if (SCAM_EN.some((r) => r.test(text))) return result("scam_warning", text, false);
  if (MONEY_HI.some((r) => r.test(text))) return result("money_refusal", text, true);
  if (MONEY_EN.some((r) => r.test(text))) return result("money_refusal", text, false);
  return null;
}
