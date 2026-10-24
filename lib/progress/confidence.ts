// "Your Tech Confidence": a gentle level from what the learner has finished on this phone.
// Worked out from the local store only; nothing is sent anywhere.

import { PRACTICE } from "@/lib/content/practice";
import type { MessageKey } from "@/lib/i18n";
import type { SavedGuide } from "@/lib/store/localStore";

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

/** How many things (lessons or guides) must be finished to reach each level. */
export const CONFIDENCE_LEVELS: readonly { level: ConfidenceLevel; needs: number; nameKey: MessageKey }[] = [
  { level: 1, needs: 0, nameKey: "confidence.level.1" },
  { level: 2, needs: 1, nameKey: "confidence.level.2" },
  { level: 3, needs: 3, nameKey: "confidence.level.3" },
  { level: 4, needs: 6, nameKey: "confidence.level.4" },
  { level: 5, needs: 10, nameKey: "confidence.level.5" },
];

export function confidenceLevel(points: number): ConfidenceLevel {
  const p = Number.isFinite(points) ? points : 0;
  let level: ConfidenceLevel = 1;
  for (const l of CONFIDENCE_LEVELS) if (p >= l.needs) level = l.level;
  return level;
}

/** A steps guide whose saved step is past its last step: the learner reached "You did it!". */
export function isFinishedGuide(guide: SavedGuide): boolean {
  const answer = guide.answer as { kind?: unknown; steps?: unknown } | null;
  return answer?.kind === "steps" && Array.isArray(answer.steps) && guide.step > answer.steps.length;
}

export type ConfidenceInput = {
  completedLessons: readonly string[];
  guides: readonly SavedGuide[];
  /** Practice exercises finished (lib/content/practice ids). */
  completedPractice?: readonly string[];
};

/**
 * Each completed lesson once, each finished Practice exercise once, plus each finished guide that is not a lesson
 * (those count through the lesson).
 */
export function confidencePoints({ completedLessons, guides, completedPractice = [] }: ConfidenceInput): number {
  const lessons = new Set(completedLessons).size;
  const practice = new Set(completedPractice).size;
  const finished = guides.filter((g) => !g.lessonId && isFinishedGuide(g)).length;
  return lessons + practice + finished;
}

export type TechConfidence = {
  level: ConfidenceLevel;
  points: number;
  nameKey: MessageKey;
  /** How many more to finish for the next level; null at the top. */
  toNext: number | null;
};

export function techConfidence(input: ConfidenceInput): TechConfidence {
  const points = confidencePoints(input);
  const level = confidenceLevel(points);
  const next = CONFIDENCE_LEVELS.find((l) => l.level === level + 1);
  return {
    level,
    points,
    nameKey: CONFIDENCE_LEVELS[level - 1].nameKey,
    toNext: next ? next.needs - points : null,
  };
}

// ---------- Tech Confidence as a percentage, by topic ----------

/**
 * The things people learn here, as plain topics ("WhatsApp", "Video calls"). A topic is learned once one of its
 * lessons or Practice exercises is finished, or a guide about it reaches "You did it!": a Help library question
 * from its categories, or a question or title with one of its words. In this order, the first topic not learned yet is "Next".
 */
export type ConfidenceTopic = {
  id: string;
  nameKey: MessageKey;
  /** "Learn how to …", shown after "Next:". */
  nextKey: MessageKey;
  /** "Teach me" lessons about this topic, by id. The first unfinished one is where "Next" starts. */
  lessons: readonly string[];
  /** Help library categories about this topic; "Next" opens the first when the topic has no lesson. */
  libraryCategories: readonly string[];
  /** Words in a finished guide's question or title that put it under this topic. */
  words: RegExp;
};

const topic = (
  id: string,
  lessons: readonly string[],
  libraryCategories: readonly string[],
  words: RegExp,
): ConfidenceTopic => ({
  id,
  nameKey: `topic.${id}` as MessageKey,
  nextKey: `topic.${id}.next` as MessageKey,
  lessons,
  libraryCategories,
  words,
});

/** Practice exercises count towards their topics (`topics` in lib/content/practice). */
const PRACTICE_TOPICS: ReadonlyMap<string, readonly string[]> = new Map(PRACTICE.map((p) => [p.id, p.topics]));

// Devanagari has no \b, so Hindi words are matched without it. "Wi‑Fi" is often written with a non-breaking hyphen.
export const CONFIDENCE_TOPICS: readonly ConfidenceTopic[] = [
  topic(
    "whatsapp",
    ["whatsapp-video-call", "whatsapp-photo", "whatsapp-voice-message"],
    ["whatsapp"],
    /whats ?app|व्हाट्सऐप|व्हाट्सएप/iu,
  ),
  topic(
    "videoCalls",
    ["whatsapp-video-call", "join-video-meeting"],
    [],
    /video ?call|वीडियो कॉल|\bzoom\b|google meet|facetime|video meeting|वीडियो मीटिंग/iu,
  ),
  topic("photos", ["whatsapp-photo"], [], /\b(?:photo|photos|picture|pictures)\b|फ़ोटो|फोटो|तस्वीर/iu),
  topic("scams", ["spot-scam", "block-caller"], ["safety"], /\bscams?\b|\bfraud\b|\bblock\b|\bdhokh|धोखे|धोखा|फ्रॉड|ब्लॉक/iu),
  topic("screenshots", ["screenshot"], [], /screen ?shot|स्क्रीनशॉट/iu),
  topic("phone", ["bigger-text", "save-contact"], ["phone"], /text bigger|bigger text|\bfont\b|\bvolume\b|\bcontacts?\b|लिखावट|कॉन्टैक्ट/iu),
  topic("wifi", ["wifi"], ["internet"], /\bwi[-‑ ]?fi\b|\binternet\b|mobile data|इंटरनेट|वाई-?फ़ाई/iu),
  topic("passwords", ["strong-password"], [], /\bpass(?:word|code)s?\b|पासवर्ड/iu),
  topic("email", ["send-email"], ["email"], /\be-?mails?\b|\bgmail\b|ईमेल/iu),
  topic("payments", ["upi-check"], ["payments"], /\bupi\b|\bpayments?\b|\bpaytm\b|phone ?pe|google pay|\bgpay\b|पेमेंट/iu),
  topic("ai", ["ask-chatgpt"], [], /chat ?gpt|\bgemini\b|\bai\b|चैटजीपीटी/iu),
  topic("instagram", ["instagram-post"], ["instagram"], /instagram|इंस्टाग्राम/iu),
  topic("computer", [], ["computer"], /\bcomputer\b|\blaptop\b|\bcopy and paste\b|कंप्यूटर/iu),
  topic("tv", [], ["tv"], /\btv\b|\btelevision\b|\byoutube\b|टीवी/iu),
  topic("shopping", ["track-order"], ["shopping"], /\bamazon\b|\bflipkart\b|\bshopping\b|\border\b|ख़रीदारी|खरीदारी/iu),
  topic("search", ["google-search"], [], /\bgoogle search\b|\bsearch (?:on|for)\b|\bgoogle (?:it|pe|par|पर)|गूगल/iu),
  topic("maps", ["maps-directions"], [], /\bmaps?\b|\bdirections?\b|\braasta\b|नक्श|रास्ता/iu),
];

export type ProgressInput = ConfidenceInput & {
  /** Help library questions by category id, in every language (from lib/content/library). */
  libraryQuestions?: Readonly<Record<string, readonly string[]>>;
};

const sameQuestion = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function guideTopics(guide: SavedGuide, libraryQuestions: ProgressInput["libraryQuestions"]): Set<string> {
  const ids = new Set<string>();
  const text = `${guide.question}\n${guide.title}`;
  for (const t of CONFIDENCE_TOPICS) {
    const fromLibrary = t.libraryCategories.some((c) => libraryQuestions?.[c]?.some((q) => sameQuestion(q, guide.question)));
    if (fromLibrary || t.words.test(text)) ids.add(t.id);
  }
  return ids;
}

/** The ids of the topics learned, from finished lessons, Practice exercises and guides. */
export function learnedTopicIds({ completedLessons, guides, libraryQuestions, completedPractice = [] }: ProgressInput): Set<string> {
  const done = new Set(completedLessons);
  const learned = new Set(CONFIDENCE_TOPICS.filter((t) => t.lessons.some((l) => done.has(l))).map((t) => t.id));
  for (const id of completedPractice) for (const t of PRACTICE_TOPICS.get(id) ?? []) learned.add(t);
  for (const g of guides) {
    if (isFinishedGuide(g)) for (const id of guideTopics(g, libraryQuestions)) learned.add(id);
  }
  return learned;
}

export type TopicStart = { href: string; /** The lesson that "Next" starts, when the topic has one. */ lessonId?: string };

/** Where "Next" goes: the topic's first unfinished lesson, else its Help library category. */
export function topicStart(t: ConfidenceTopic, completedLessons: readonly string[]): TopicStart {
  const lessonId = t.lessons.find((l) => !completedLessons.includes(l)) ?? t.lessons[0];
  if (lessonId) return { href: `/app/learn/${encodeURIComponent(lessonId)}`, lessonId };
  const category = t.libraryCategories[0];
  return { href: category ? `/app/library?topic=${encodeURIComponent(category)}` : "/app/learn" };
}

export type ConfidenceProgress = {
  /** 0 to 100: the share of topics learned, rounded. */
  percent: number;
  learned: ConfidenceTopic[];
  /** The first topic not learned yet, with where to start it; null once every topic is learned. */
  next: ({ topic: ConfidenceTopic } & TopicStart) | null;
  total: number;
};

export function confidenceProgress(input: ProgressInput): ConfidenceProgress {
  const ids = learnedTopicIds(input);
  const learned = CONFIDENCE_TOPICS.filter((t) => ids.has(t.id));
  const nextTopic = CONFIDENCE_TOPICS.find((t) => !ids.has(t.id));
  const total = CONFIDENCE_TOPICS.length;
  return {
    percent: Math.round((learned.length / total) * 100),
    learned,
    next: nextTopic ? { topic: nextTopic, ...topicStart(nextTopic, input.completedLessons) } : null,
    total,
  };
}
