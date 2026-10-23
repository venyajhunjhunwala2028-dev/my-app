// Deterministic red-flag check for the scam checker. It runs on pasted text and can only
// raise the AI's verdict (safe → careful → scam), never lower it.
import type { ScamAnswer, ScamVerdict } from "@/lib/ai/scam";
import { warningLanguage, type WarningLanguage } from "@/lib/safety/stepWarnings";

type Floor = Exclude<ScamVerdict, "safe">;
type Topic = "secret" | "collect" | "remote" | "lottery" | "kyc_link" | "blocked_link" | "blocked" | "kyc" | "prize" | "short_link" | "urgent_link";

export interface ScamPrecheck {
  floor: Floor;
  /** Matched signs, strongest first. */
  topics: Topic[];
  /** One to three plain English reasons; applyScamFloor localises them. */
  reasons: string[];
}

const REASONS: Record<WarningLanguage, Record<Topic, string>> = {
  en: {
    secret: "It asks you to share an OTP, PIN, password or card details. Real banks never ask for these.",
    collect: "It is a payment request. Entering your UPI PIN sends money out; it never brings money in.",
    remote: "It asks you to install an app that lets a stranger control your phone.",
    lottery: "It says you won a lottery or lucky draw that you never entered.",
    kyc_link: "It asks you to update KYC through a link. Banks do not do this by message.",
    blocked_link: "It threatens that your account will be blocked and gives a link, to rush you.",
    blocked: "It says your account will be blocked, to make you worried and rush.",
    kyc: "It talks about a KYC update. Banks do not ask for this by message.",
    prize: "It says you have won something you did not expect.",
    short_link: "It has a short link that hides where it really goes.",
    urgent_link: "It pushes you to act fast and open a link.",
  },
  hi: {
    secret: "इसमें OTP, PIN, पासवर्ड या कार्ड की जानकारी माँगी गई है। असली बैंक यह कभी नहीं माँगते।",
    collect: "यह पैसे माँगने की रिक्वेस्ट है। UPI PIN डालने से पैसे जाते हैं, आते नहीं।",
    remote: "इसमें ऐसा ऐप डालने को कहा गया है जिससे कोई अनजान व्यक्ति आपका फ़ोन चला सके।",
    lottery: "इसमें लिखा है कि आपने लॉटरी या इनाम जीता है, जिसमें आपने कभी भाग नहीं लिया।",
    kyc_link: "इसमें लिंक से KYC अपडेट करने को कहा गया है। बैंक मैसेज से ऐसा नहीं करते।",
    blocked_link: "इसमें खाता बंद होने का डर दिखाकर लिंक दिया गया है, ताकि आप जल्दी करें।",
    blocked: "इसमें खाता बंद होने का डर दिखाया गया है, ताकि आप घबराकर जल्दी करें।",
    kyc: "इसमें KYC अपडेट की बात है। बैंक मैसेज से यह नहीं माँगते।",
    prize: "इसमें लिखा है कि आपने कुछ जीता है, जिसकी आपको उम्मीद नहीं थी।",
    short_link: "इसमें छोटा लिंक है, जो असली पता छिपा देता है।",
    urgent_link: "इसमें जल्दी करने और लिंक खोलने का दबाव है।",
  },
};

const ADVICE: Record<WarningLanguage, Record<Floor, string>> = {
  en: {
    scam: "Do not reply, do not tap any link, and never share an OTP, PIN or password. Delete it and call your family.",
    careful: "Do not tap any link or reply yet. Check with your family, or call the company on a number you already trust.",
  },
  hi: {
    scam: "जवाब न दें, कोई लिंक न खोलें, और OTP, PIN या पासवर्ड कभी न बताएं। इसे मिटा दें और परिवार को फ़ोन करें।",
    careful: "अभी कोई लिंक न खोलें और जवाब न दें। पहले परिवार से पूछें, या कंपनी के भरोसेमंद नंबर पर फ़ोन करें।",
  },
};

const rx = (s: string, flags = "iu") => new RegExp(s, flags);
const LINK = rx(String.raw`\bhttps?://|\bwww\.|\b[a-z0-9-]+\.(?:com|in|co|net|org|info|xyz|top|link|site|online|app)(?:/|\b)|लिंक|\blink\b`);
const SHORT_LINK = rx(String.raw`\b(?:bit\.ly|tinyurl\.com|t\.co|goo\.gl|cutt\.ly|is\.gd|rb\.gy|shorturl\.at|tiny\.cc)/`);
const SECRET = String.raw`(?:\b(?:otps?|one[- ]time password|pin|password|passcode|cvv|card (?:number|details)|bank details|net ?banking (?:id|password))\b|ओटीपी|पिन|पासवर्ड)`;
// Someone asking for the secret: "share the OTP", "send your ATM PIN", "reply with your password".
const ASK_SECRET = rx(
  String.raw`\b(?:share|send|tell|give|forward|provide|disclose|reply with|read out|whatsapp)\b[^.!?\n]{0,30}?${SECRET}`,
  "giu",
);
const NEGATION = rx(String.raw`(?:\bnot\b|\bnever\b|n't\b|\bdont\b|\bno one\b|मत|\bmat\b)[^.!?\n]{0,15}$`);
const ASK_SECRET_HI = rx(
  String.raw`${SECRET}\s+(?:bata\S*|bhej\S*|share kar\S*|de do|dedo|बताओ|बताएं|बताइए|बता दो|भेजो|भेजें|भेज दो|शेयर कर\S*|दे दो|दें)`,
);
const COLLECT = rx(
  String.raw`\bcollect request\b|\b(?:enter|type|use)\b[^.!?\n]{0,25}\bpin\b[^.!?\n]{0,25}\b(?:receive|get|claim|credit)|पैसे पाने के लिए[^.!?\n]{0,20}पिन`,
);
const REMOTE = rx(String.raw`\b(?:any ?desk|team ?viewer|quick ?support|rust ?desk|airdroid|remote access app)\b`);
const LOTTERY = rx(String.raw`\b(?:lottery|lucky draw|jackpot|kbc)\b|लॉटरी|\binaam\b|इनाम`);
const PRIZE = rx(String.raw`\byou(?:'ve| have)? won\b|\bwinner\b|\bprize\b|\bcashback reward\b`);
const KYC = rx(String.raw`\bkyc\b|\bpan (?:card )?(?:update|link)|केवाईसी`);
const BLOCKED = rx(
  String.raw`\b(?:account|card|sim|wallet|upi)\b[^.!?\n]{0,30}\b(?:blocked|suspended|deactivated|closed|frozen|disabled)\b|\bwill be (?:blocked|suspended|deactivated|disconnected)\b|(?:खाता|अकाउंट|account|khata)[^.!?\n]{0,20}(?:बंद|ब्लॉक|band|block)`,
);
const URGENT = rx(String.raw`\burgent\b|\bimmediately\b|\bwithin \d+ ?(?:hours?|hrs?|minutes?|mins?)\b|\btoday only\b|\bact now\b|\blast chance\b|तुरंत|जल्दी`);

function asksForSecret(text: string): boolean {
  if (ASK_SECRET_HI.test(text)) return true;
  for (const m of text.matchAll(ASK_SECRET)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 25), m.index);
    if (!NEGATION.test(before)) return true;
  }
  return false;
}

/** Returns the minimum verdict obvious red flags call for, or null when there are none. */
export function scamPrecheck(raw: string): ScamPrecheck | null {
  const text = raw.normalize("NFC").replace(/[’‘]/g, "'");
  const link = LINK.test(text);
  const scam: Topic[] = [];
  const careful: Topic[] = [];
  if (asksForSecret(text)) scam.push("secret");
  if (COLLECT.test(text)) scam.push("collect");
  if (REMOTE.test(text)) scam.push("remote");
  if (LOTTERY.test(text)) scam.push("lottery");
  if (KYC.test(text)) (link ? scam : careful).push(link ? "kyc_link" : "kyc");
  if (BLOCKED.test(text)) (link ? scam : careful).push(link ? "blocked_link" : "blocked");
  if (PRIZE.test(text) && !scam.includes("lottery")) careful.push("prize");
  if (SHORT_LINK.test(text)) careful.push("short_link");
  if (URGENT.test(text) && link && !careful.includes("short_link")) careful.push("urgent_link");

  const topics = [...scam, ...careful];
  if (topics.length === 0) return null;
  return {
    floor: scam.length ? "scam" : "careful",
    topics,
    reasons: topics.slice(0, 3).map((t) => REASONS.en[t]),
  };
}

const RANK: Record<ScamVerdict, number> = { safe: 0, careful: 1, scam: 2 };

/** Raises the answer's verdict to the pre-check floor, leading with the pre-check's reasons. Never lowers it. */
export function applyScamFloor(answer: ScamAnswer, check: ScamPrecheck | null): ScamAnswer {
  if (!check || RANK[answer.verdict] >= RANK[check.floor]) return answer;
  const lang = warningLanguage(answer.language);
  const ours = check.topics.map((t) => REASONS[lang][t]);
  const reasons = [...new Set(ours)].slice(0, 3);
  return { ...answer, verdict: check.floor, reasons, advice: ADVICE[lang][check.floor] };
}
