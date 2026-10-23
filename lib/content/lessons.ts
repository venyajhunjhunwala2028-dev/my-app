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
    title: { en: "Using your phone", hi: "अपना फ़ोन चलाना" },
    lessons: [
      {
        id: "whatsapp-video-call",
        title: { en: "Make a video call on WhatsApp", hi: "WhatsApp पर वीडियो कॉल करें" },
        question: {
          en: "Teach me how to make a video call on WhatsApp",
          hi: "मुझे सिखाइए कि WhatsApp पर वीडियो कॉल कैसे करें",
        },
      },
      {
        id: "whatsapp-photo",
        title: { en: "Send a photo on WhatsApp", hi: "WhatsApp पर फ़ोटो भेजें" },
        question: {
          en: "Teach me how to send a photo on WhatsApp",
          hi: "मुझे सिखाइए कि WhatsApp पर फ़ोटो कैसे भेजें",
        },
      },
      {
        id: "screenshot",
        title: { en: "Take a screenshot", hi: "स्क्रीनशॉट लें" },
        question: { en: "Teach me how to take a screenshot", hi: "मुझे सिखाइए कि स्क्रीनशॉट कैसे लें" },
      },
      {
        id: "bigger-text",
        title: { en: "Make text bigger", hi: "लिखावट बड़ी करें" },
        question: {
          en: "Teach me how to make the text bigger on my phone",
          hi: "मुझे सिखाइए कि फ़ोन पर लिखावट बड़ी कैसे करें",
        },
      },
      {
        id: "wifi",
        title: { en: "Connect to Wi‑Fi", hi: "Wi‑Fi से जुड़ें" },
        question: { en: "Teach me how to connect to Wi‑Fi", hi: "मुझे सिखाइए कि Wi‑Fi से कैसे जुड़ें" },
      },
      {
        id: "save-contact",
        title: { en: "Save a new phone number", hi: "नया फ़ोन नंबर सेव करें" },
        question: {
          en: "Teach me how to save a new phone number in my contacts",
          hi: "मुझे सिखाइए कि नया फ़ोन नंबर कॉन्टैक्ट में कैसे सेव करें",
        },
      },
    ],
  },
  {
    id: "safety",
    title: { en: "Staying safe", hi: "सुरक्षित रहना" },
    lessons: [
      {
        id: "spot-scam",
        title: { en: "Spot a scam message", hi: "धोखे वाला मैसेज पहचानें" },
        question: { en: "Teach me how to spot a scam message", hi: "मुझे सिखाइए कि धोखे वाला मैसेज कैसे पहचानें" },
      },
      {
        id: "strong-password",
        title: { en: "Make a strong password", hi: "मज़बूत पासवर्ड बनाएँ" },
        question: { en: "Teach me how to make a strong password", hi: "मुझे सिखाइए कि मज़बूत पासवर्ड कैसे बनाएँ" },
      },
      {
        id: "block-caller",
        title: { en: "Block an unknown caller", hi: "अनजान कॉल करने वाले को ब्लॉक करें" },
        question: {
          en: "Teach me how to block an unknown number that keeps calling me",
          hi: "मुझे सिखाइए कि बार-बार कॉल करने वाले अनजान नंबर को ब्लॉक कैसे करें",
        },
      },
    ],
  },
  {
    id: "ai",
    title: { en: "AI helpers", hi: "AI मददगार" },
    lessons: [
      {
        id: "ask-chatgpt",
        title: { en: "Ask ChatGPT a question", hi: "ChatGPT से सवाल पूछें" },
        question: { en: "Teach me how to ask ChatGPT a question", hi: "मुझे सिखाइए कि ChatGPT से सवाल कैसे पूछें" },
      },
    ],
  },
  {
    id: "email",
    title: { en: "Email", hi: "ईमेल" },
    lessons: [
      {
        id: "send-email",
        title: { en: "Send an email", hi: "ईमेल भेजें" },
        question: { en: "Teach me how to send an email", hi: "मुझे सिखाइए कि ईमेल कैसे भेजें" },
      },
    ],
  },
  {
    id: "payments",
    title: { en: "Online payments", hi: "ऑनलाइन पेमेंट" },
    lessons: [
      {
        id: "upi-check",
        title: { en: "Check a UPI payment safely", hi: "UPI पेमेंट सुरक्षित तरीके से जाँचें" },
        question: {
          en: "Teach me how to check a UPI payment safely",
          hi: "मुझे सिखाइए कि UPI पेमेंट सुरक्षित तरीके से कैसे जाँचें",
        },
      },
    ],
  },
];

export const ALL_LESSONS: readonly Lesson[] = LESSON_GROUPS.flatMap((g) => g.lessons);
