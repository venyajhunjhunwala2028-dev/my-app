// The Help library: common questions by topic. Tapping one asks it exactly as if it were typed.
// Payment and safety questions never suggest sharing an OTP, PIN, password or CVV.

import type { Localized } from "@/lib/content/localized";

export type LibraryCategory = {
  id: string;
  emoji: string;
  title: Localized;
  /** 4 to 6 questions, asked in the interface language. */
  questions: readonly Localized[];
};

export const LIBRARY: readonly LibraryCategory[] = [
  {
    id: "phone",
    emoji: "📱",
    title: { en: "Phone", hi: "फ़ोन" },
    questions: [
      { en: "How do I make the text bigger?", hi: "लिखावट बड़ी कैसे करें?" },
      { en: "How do I take a screenshot?", hi: "स्क्रीनशॉट कैसे लें?" },
      { en: "How do I turn the volume up?", hi: "आवाज़ तेज़ कैसे करें?" },
      { en: "How do I save a new phone number?", hi: "नया फ़ोन नंबर कैसे सेव करें?" },
      { en: "How do I charge my phone faster?", hi: "फ़ोन जल्दी चार्ज कैसे करें?" },
    ],
  },
  {
    id: "whatsapp",
    emoji: "💬",
    title: { en: "WhatsApp", hi: "WhatsApp" },
    questions: [
      { en: "How do I make a video call?", hi: "वीडियो कॉल कैसे करें?" },
      { en: "How do I send a photo on WhatsApp?", hi: "WhatsApp पर फ़ोटो कैसे भेजें?" },
      { en: "How do I send a voice message?", hi: "आवाज़ वाला मैसेज कैसे भेजें?" },
      { en: "How do I make a WhatsApp group?", hi: "WhatsApp ग्रुप कैसे बनाएँ?" },
      { en: "How do I block someone on WhatsApp?", hi: "WhatsApp पर किसी को ब्लॉक कैसे करें?" },
    ],
  },
  {
    id: "instagram",
    emoji: "📸",
    title: { en: "Instagram", hi: "Instagram" },
    questions: [
      { en: "How do I post a photo on Instagram?", hi: "Instagram पर फ़ोटो कैसे डालें?" },
      { en: "How do I post a story on Instagram?", hi: "Instagram पर स्टोरी कैसे डालें?" },
      { en: "How do I follow someone on Instagram?", hi: "Instagram पर किसी को फ़ॉलो कैसे करें?" },
      { en: "How do I make my Instagram account private?", hi: "Instagram अकाउंट प्राइवेट कैसे करें?" },
    ],
  },
  {
    id: "email",
    emoji: "✉️",
    title: { en: "Email", hi: "ईमेल" },
    questions: [
      { en: "How do I send an email?", hi: "ईमेल कैसे भेजें?" },
      { en: "How do I add a photo to an email?", hi: "ईमेल में फ़ोटो कैसे जोड़ें?" },
      { en: "How do I reply to an email?", hi: "ईमेल का जवाब कैसे दें?" },
      { en: "How do I find an old email?", hi: "पुराना ईमेल कैसे ढूँढें?" },
    ],
  },
  {
    id: "computer",
    emoji: "💻",
    title: { en: "Computer", hi: "कंप्यूटर" },
    questions: [
      { en: "How do I turn off my computer properly?", hi: "कंप्यूटर ठीक से बंद कैसे करें?" },
      { en: "How do I copy and paste text?", hi: "लिखावट कॉपी और पेस्ट कैसे करें?" },
      { en: "How do I find a file I saved?", hi: "सेव की हुई फ़ाइल कैसे ढूँढें?" },
      { en: "How do I make things bigger on the screen?", hi: "स्क्रीन पर चीज़ें बड़ी कैसे करें?" },
    ],
  },
  {
    id: "internet",
    emoji: "🌐",
    title: { en: "Internet", hi: "इंटरनेट" },
    questions: [
      { en: "How do I connect to Wi‑Fi?", hi: "Wi‑Fi से कैसे जुड़ें?" },
      { en: "How do I search for something on Google?", hi: "Google पर कुछ कैसे खोजें?" },
      { en: "How do I turn mobile data on or off?", hi: "मोबाइल डेटा चालू या बंद कैसे करें?" },
      { en: "How do I save a website to open later?", hi: "किसी वेबसाइट को बाद में खोलने के लिए कैसे सेव करें?" },
    ],
  },
  {
    id: "tv",
    emoji: "📺",
    title: { en: "Smart TV", hi: "स्मार्ट टीवी" },
    questions: [
      { en: "How do I watch YouTube on my TV?", hi: "टीवी पर YouTube कैसे देखें?" },
      { en: "How do I connect my TV to Wi‑Fi?", hi: "टीवी को Wi‑Fi से कैसे जोड़ें?" },
      { en: "How do I turn on subtitles on my TV?", hi: "टीवी पर सबटाइटल कैसे चालू करें?" },
      { en: "How do I show my phone's photos on the TV?", hi: "फ़ोन की फ़ोटो टीवी पर कैसे दिखाएँ?" },
    ],
  },
  {
    id: "shopping",
    emoji: "🛒",
    title: { en: "Online shopping", hi: "ऑनलाइन ख़रीदारी" },
    questions: [
      { en: "How do I search for something on Amazon?", hi: "Amazon पर कोई चीज़ कैसे खोजें?" },
      { en: "How do I track my order?", hi: "अपना ऑर्डर कहाँ पहुँचा, कैसे देखें?" },
      { en: "How do I return something I bought online?", hi: "ऑनलाइन ख़रीदी चीज़ वापस कैसे करें?" },
      { en: "How do I know if a shopping website is real?", hi: "कैसे पता करें कि ख़रीदारी की वेबसाइट असली है?" },
    ],
  },
  {
    id: "payments",
    emoji: "💳",
    title: { en: "Digital payments", hi: "डिजिटल पेमेंट" },
    questions: [
      { en: "How do I check that a UPI payment has come in?", hi: "कैसे देखें कि UPI पेमेंट आ गया है?" },
      { en: "How do I see my past payments in my UPI app?", hi: "UPI ऐप में पुराने पेमेंट कैसे देखें?" },
      { en: "Why must my UPI PIN stay secret?", hi: "मेरा UPI PIN गुप्त क्यों रहना चाहिए?" },
      { en: "Is it safe to accept a payment request from a stranger?", hi: "क्या अनजान व्यक्ति की पेमेंट रिक्वेस्ट मानना सुरक्षित है?" },
      { en: "How do I report a payment that went wrong?", hi: "ग़लत हुए पेमेंट की शिकायत कैसे करें?" },
    ],
  },
  {
    id: "safety",
    emoji: "🔒",
    title: { en: "Online safety", hi: "ऑनलाइन सुरक्षा" },
    questions: [
      { en: "How do I spot a scam message?", hi: "धोखे वाला मैसेज कैसे पहचानें?" },
      { en: "How do I make a strong password?", hi: "मज़बूत पासवर्ड कैसे बनाएँ?" },
      { en: "How do I know if a link is safe to open?", hi: "कैसे पता करें कि कोई लिंक खोलना सुरक्षित है?" },
      { en: "Why is my OTP only for me?", hi: "मेरा OTP सिर्फ़ मेरे लिए क्यों है?" },
      { en: "How do I block a number that keeps calling me?", hi: "बार-बार कॉल करने वाला नंबर ब्लॉक कैसे करें?" },
    ],
  },
];
