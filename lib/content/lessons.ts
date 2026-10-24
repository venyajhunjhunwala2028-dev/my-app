// "Teach me" lessons. Each one is asked as a Show me how question and played in the normal step player.
// Payment and safety lessons never ask the learner to share an OTP, PIN, password or CVV.

import type { Localized } from "@/lib/content/localized";

export type Lesson = {
  /** Stable id, saved in the store when the lesson is finished. Never rename one. */
  id: string;
  title: Localized;
  /** Sent to the helper; the English one always starts "Teach me how to". */
  question: Localized;
};

export type LessonGroup = { id: string; title: Localized; lessons: readonly Lesson[] };

export const LESSON_GROUPS: readonly LessonGroup[] = [
  {
    id: "phone",
    title: { en: "Using your phone", hi: "अपना फ़ोन चलाना", hinglish: "Apna phone chalana" },
    lessons: [
      {
        id: "whatsapp-video-call",
        title: {
          en: "Make a video call on WhatsApp",
          hi: "WhatsApp पर वीडियो कॉल करें",
          hinglish: "WhatsApp pe video call kijiye",
        },
        question: {
          en: "Teach me how to make a video call on WhatsApp",
          hi: "मुझे सिखाइए कि WhatsApp पर वीडियो कॉल कैसे करें",
          hinglish: "Mujhe sikhaiye ki WhatsApp pe video call kaise karte hain",
        },
      },
      {
        id: "whatsapp-photo",
        title: { en: "Send a photo on WhatsApp", hi: "WhatsApp पर फ़ोटो भेजें", hinglish: "WhatsApp pe photo bhejiye" },
        question: {
          en: "Teach me how to send a photo on WhatsApp",
          hi: "मुझे सिखाइए कि WhatsApp पर फ़ोटो कैसे भेजें",
          hinglish: "Mujhe sikhaiye ki WhatsApp pe photo kaise bhejte hain",
        },
      },
      {
        id: "screenshot",
        title: { en: "Take a screenshot", hi: "स्क्रीनशॉट लें", hinglish: "Screenshot lijiye" },
        question: {
          en: "Teach me how to take a screenshot",
          hi: "मुझे सिखाइए कि स्क्रीनशॉट कैसे लें",
          hinglish: "Mujhe sikhaiye ki screenshot kaise lete hain",
        },
      },
      {
        id: "bigger-text",
        title: { en: "Make text bigger", hi: "लिखावट बड़ी करें", hinglish: "Text bada kijiye" },
        question: {
          en: "Teach me how to make the text bigger on my phone",
          hi: "मुझे सिखाइए कि फ़ोन पर लिखावट बड़ी कैसे करें",
          hinglish: "Mujhe sikhaiye ki phone pe text bada kaise karte hain",
        },
      },
      {
        id: "wifi",
        title: { en: "Connect to Wi‑Fi", hi: "Wi‑Fi से जुड़ें", hinglish: "Wi‑Fi se judiye" },
        question: {
          en: "Teach me how to connect to Wi‑Fi",
          hi: "मुझे सिखाइए कि Wi‑Fi से कैसे जुड़ें",
          hinglish: "Mujhe sikhaiye ki Wi‑Fi se kaise judte hain",
        },
      },
      {
        id: "save-contact",
        title: {
          en: "Save a new phone number",
          hi: "नया फ़ोन नंबर सेव करें",
          hinglish: "Naya phone number save kijiye",
        },
        question: {
          en: "Teach me how to save a new phone number in my contacts",
          hi: "मुझे सिखाइए कि नया फ़ोन नंबर कॉन्टैक्ट में कैसे सेव करें",
          hinglish: "Mujhe sikhaiye ki naya phone number contacts mein kaise save karte hain",
        },
      },
    ],
  },
  {
    id: "safety",
    title: { en: "Staying safe", hi: "सुरक्षित रहना", hinglish: "Safe rehna" },
    lessons: [
      {
        id: "spot-scam",
        title: { en: "Spot a scam message", hi: "धोखे वाला मैसेज पहचानें", hinglish: "Scam wala message pehchaniye" },
        question: {
          en: "Teach me how to spot a scam message",
          hi: "मुझे सिखाइए कि धोखे वाला मैसेज कैसे पहचानें",
          hinglish: "Mujhe sikhaiye ki scam wala message kaise pehchante hain",
        },
      },
      {
        id: "strong-password",
        title: { en: "Make a strong password", hi: "मज़बूत पासवर्ड बनाएँ", hinglish: "Mazboot password banaiye" },
        question: {
          en: "Teach me how to make a strong password",
          hi: "मुझे सिखाइए कि मज़बूत पासवर्ड कैसे बनाएँ",
          hinglish: "Mujhe sikhaiye ki mazboot password kaise banate hain",
        },
      },
      {
        id: "block-caller",
        title: {
          en: "Block an unknown caller",
          hi: "अनजान कॉल करने वाले को ब्लॉक करें",
          hinglish: "Anjaan caller ko block kijiye",
        },
        question: {
          en: "Teach me how to block an unknown number that keeps calling me",
          hi: "मुझे सिखाइए कि बार-बार कॉल करने वाले अनजान नंबर को ब्लॉक कैसे करें",
          hinglish: "Mujhe sikhaiye ki baar-baar call karne wale anjaan number ko block kaise karte hain",
        },
      },
    ],
  },
  {
    id: "ai",
    title: { en: "AI helpers", hi: "AI मददगार", hinglish: "AI helpers" },
    lessons: [
      {
        id: "ask-chatgpt",
        title: { en: "Ask ChatGPT a question", hi: "ChatGPT से सवाल पूछें", hinglish: "ChatGPT se sawaal poochiye" },
        question: {
          en: "Teach me how to ask ChatGPT a question",
          hi: "मुझे सिखाइए कि ChatGPT से सवाल कैसे पूछें",
          hinglish: "Mujhe sikhaiye ki ChatGPT se sawaal kaise poochte hain",
        },
      },
    ],
  },
  {
    id: "email",
    title: { en: "Email", hi: "ईमेल", hinglish: "Email" },
    lessons: [
      {
        id: "send-email",
        title: { en: "Send an email", hi: "ईमेल भेजें", hinglish: "Email bhejiye" },
        question: {
          en: "Teach me how to send an email",
          hi: "मुझे सिखाइए कि ईमेल कैसे भेजें",
          hinglish: "Mujhe sikhaiye ki email kaise bhejte hain",
        },
      },
    ],
  },
  {
    id: "payments",
    title: { en: "Online payments", hi: "ऑनलाइन पेमेंट", hinglish: "Online payment" },
    lessons: [
      {
        id: "upi-check",
        title: {
          en: "Check a UPI payment safely",
          hi: "UPI पेमेंट सुरक्षित तरीके से जाँचें",
          hinglish: "UPI payment safe tareeke se check kijiye",
        },
        question: {
          en: "Teach me how to check a UPI payment safely",
          hi: "मुझे सिखाइए कि UPI पेमेंट सुरक्षित तरीके से कैसे जाँचें",
          hinglish: "Mujhe sikhaiye ki UPI payment safe tareeke se kaise check karte hain",
        },
      },
    ],
  },
];

export const ALL_LESSONS: readonly Lesson[] = LESSON_GROUPS.flatMap((g) => g.lessons);
