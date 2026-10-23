// Client-safe, deterministic: finds risky topics in a step's text and returns a one-line warning.
// The UI can show it on any step, even when the AI left the guide's safety note out.

export type WarningLanguage = "en" | "hi";

type Topic = "remote" | "otp" | "upi" | "bank" | "secret" | "link";

const WARNINGS: Record<WarningLanguage, Record<Topic, string>> = {
  en: {
    remote:
      "⚠️ Never install a remote-access app or share your screen because someone asked. Stop and call your family.",
    otp: "⚠️ Never share an OTP with anyone, even if they say they are from your bank.",
    upi: "⚠️ Your UPI PIN is only for sending money, never for receiving it. Never share it with anyone.",
    bank: "⚠️ Never share your card number, CVV or bank details with anyone who calls or messages you.",
    secret: "⚠️ Never tell anyone your password or PIN. Type it yourself, where nobody can see.",
    link: "⚠️ Do not open links from people you don't know. If you are not sure, ask your family first.",
  },
  hi: {
    remote:
      "⚠️ किसी के कहने पर कोई रिमोट ऐप न डालें और अपनी स्क्रीन शेयर न करें। रुकिए और अपने परिवार को फ़ोन करें।",
    otp: "⚠️ अपना OTP कभी किसी को न बताएं, चाहे वे बैंक से होने की बात कहें।",
    upi: "⚠️ UPI PIN सिर्फ़ पैसे भेजने के लिए होता है, पैसे पाने के लिए कभी नहीं। इसे किसी को न बताएं।",
    bank: "⚠️ अपना कार्ड नंबर, CVV या बैंक की जानकारी फ़ोन या मैसेज करने वाले किसी को न दें।",
    secret: "⚠️ अपना पासवर्ड या PIN कभी किसी को न बताएं। इसे ख़ुद लिखें, जहाँ कोई देख न सके।",
    link: "⚠️ अनजान लोगों के भेजे लिंक न खोलें। पक्का न हो तो पहले परिवार से पूछें।",
  },
};

const rx = (s: string) => new RegExp(s, "iu");
// \b does not work around Devanagari, so Hindi words are matched without it.
const RULES: [Topic, RegExp][] = [
  [
    "remote",
    rx(
      String.raw`\b(?:any ?desk|team ?viewer|quick ?support|rust ?desk|remote (?:access|desktop|control))\b|\bscreen ?shar(?:e|ing)\b|\bshar(?:e|ing) (?:your |my |the )?screen\b|स्क्रीन शेयर|रिमोट`,
    ),
  ],
  ["otp", rx(String.raw`\botps?\b|\bone[- ]time (?:pass(?:word|code)?|code)\b|\bverification code\b|ओटीपी`)],
  ["upi", rx(String.raw`\bupi\b|\b(?:google ?pay|gpay|phone ?pe|paytm|bhim)\b|यूपीआई`)],
  [
    "bank",
    rx(
      String.raw`\bcvv\b|\b(?:card|account) (?:number|details)\b|\b(?:debit|credit|atm) card\b|\bbank (?:account|details)\b|\bifsc\b|\bnet ?banking\b|\bkhata\b|बैंक खाता|खाता संख्या|(?:डेबिट|क्रेडिट|एटीएम) कार्ड`,
    ),
  ],
  [
    "secret",
    // "Pin a chat" and "pinned" are features, not secrets.
    rx(String.raw`\bpass(?:word|code)s?\b|\bpin\b(?! (?:a |the |this |that )?(?:chat|message|app|tab|post|note|conversation)s?\b|\s*to top)|पासवर्ड|पिन`),
  ],
  [
    "link",
    rx(
      String.raw`\bhttps?://|\bwww\.|\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd|rb\.gy)/|\b(?:suspicious|unknown|strange|unexpected) links?\b|लिंक`,
    ),
  ],
];

/** Returns the one-line warning for the riskiest topic in `text`, or null when there is none. */
export function warningFor(text: string, language: WarningLanguage): string | null {
  const normal = text.normalize("NFC");
  const hit = RULES.find(([, r]) => r.test(normal));
  return hit ? WARNINGS[language][hit[0]] : null;
}

/** "hi", "hi-IN" and similar map to Hindi; everything else to English. */
export function warningLanguage(language: string | undefined | null): WarningLanguage {
  return language?.toLowerCase().startsWith("hi") ? "hi" : "en";
}
