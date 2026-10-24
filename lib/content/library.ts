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
    title: { en: "Phone", hi: "फ़ोन", hinglish: "Phone" },
    questions: [
      { en: "How do I make the text bigger?", hi: "लिखावट बड़ी कैसे करें?", hinglish: "Text bada kaise karein?" },
      { en: "How do I take a screenshot?", hi: "स्क्रीनशॉट कैसे लें?", hinglish: "Screenshot kaise lein?" },
      { en: "How do I turn the volume up?", hi: "आवाज़ तेज़ कैसे करें?", hinglish: "Awaaz tez kaise karein?" },
      {
        en: "How do I save a new phone number?",
        hi: "नया फ़ोन नंबर कैसे सेव करें?",
        hinglish: "Naya phone number kaise save karein?",
      },
      {
        en: "How do I charge my phone faster?",
        hi: "फ़ोन जल्दी चार्ज कैसे करें?",
        hinglish: "Phone jaldi charge kaise karein?",
      },
    ],
  },
  {
    id: "whatsapp",
    emoji: "💬",
    title: { en: "WhatsApp", hi: "WhatsApp", hinglish: "WhatsApp" },
    questions: [
      { en: "How do I make a video call?", hi: "वीडियो कॉल कैसे करें?", hinglish: "Video call kaise karein?" },
      {
        en: "How do I send a photo on WhatsApp?",
        hi: "WhatsApp पर फ़ोटो कैसे भेजें?",
        hinglish: "WhatsApp pe photo kaise bhejein?",
      },
      {
        en: "How do I send a voice message?",
        hi: "आवाज़ वाला मैसेज कैसे भेजें?",
        hinglish: "Voice message kaise bhejein?",
      },
      {
        en: "How do I make a WhatsApp group?",
        hi: "WhatsApp ग्रुप कैसे बनाएँ?",
        hinglish: "WhatsApp group kaise banayein?",
      },
      {
        en: "How do I block someone on WhatsApp?",
        hi: "WhatsApp पर किसी को ब्लॉक कैसे करें?",
        hinglish: "WhatsApp pe kisi ko block kaise karein?",
      },
    ],
  },
  {
    id: "instagram",
    emoji: "📸",
    title: { en: "Instagram", hi: "Instagram", hinglish: "Instagram" },
    questions: [
      {
        en: "How do I post a photo on Instagram?",
        hi: "Instagram पर फ़ोटो कैसे डालें?",
        hinglish: "Instagram pe photo kaise daalein?",
      },
      {
        en: "How do I post a story on Instagram?",
        hi: "Instagram पर स्टोरी कैसे डालें?",
        hinglish: "Instagram pe story kaise daalein?",
      },
      {
        en: "How do I follow someone on Instagram?",
        hi: "Instagram पर किसी को फ़ॉलो कैसे करें?",
        hinglish: "Instagram pe kisi ko follow kaise karein?",
      },
      {
        en: "How do I make my Instagram account private?",
        hi: "Instagram अकाउंट प्राइवेट कैसे करें?",
        hinglish: "Instagram account private kaise karein?",
      },
    ],
  },
  {
    id: "email",
    emoji: "✉️",
    title: { en: "Email", hi: "ईमेल", hinglish: "Email" },
    questions: [
      { en: "How do I send an email?", hi: "ईमेल कैसे भेजें?", hinglish: "Email kaise bhejein?" },
      {
        en: "How do I add a photo to an email?",
        hi: "ईमेल में फ़ोटो कैसे जोड़ें?",
        hinglish: "Email mein photo kaise jodein?",
      },
      { en: "How do I reply to an email?", hi: "ईमेल का जवाब कैसे दें?", hinglish: "Email ka reply kaise karein?" },
      { en: "How do I find an old email?", hi: "पुराना ईमेल कैसे ढूँढें?", hinglish: "Purana email kaise dhoondhein?" },
    ],
  },
  {
    id: "computer",
    emoji: "💻",
    title: { en: "Computer", hi: "कंप्यूटर", hinglish: "Computer" },
    questions: [
      {
        en: "How do I turn off my computer properly?",
        hi: "कंप्यूटर ठीक से बंद कैसे करें?",
        hinglish: "Computer theek se band kaise karein?",
      },
      {
        en: "How do I copy and paste text?",
        hi: "लिखावट कॉपी और पेस्ट कैसे करें?",
        hinglish: "Text copy aur paste kaise karein?",
      },
      {
        en: "How do I find a file I saved?",
        hi: "सेव की हुई फ़ाइल कैसे ढूँढें?",
        hinglish: "Save ki hui file kaise dhoondhein?",
      },
      {
        en: "How do I make things bigger on the screen?",
        hi: "स्क्रीन पर चीज़ें बड़ी कैसे करें?",
        hinglish: "Screen pe cheezein badi kaise karein?",
      },
    ],
  },
  {
    id: "internet",
    emoji: "🌐",
    title: { en: "Internet", hi: "इंटरनेट", hinglish: "Internet" },
    questions: [
      { en: "How do I connect to Wi‑Fi?", hi: "Wi‑Fi से कैसे जुड़ें?", hinglish: "Wi‑Fi se kaise judein?" },
      {
        en: "How do I search for something on Google?",
        hi: "Google पर कुछ कैसे खोजें?",
        hinglish: "Google pe kuch kaise search karein?",
      },
      {
        en: "How do I turn mobile data on or off?",
        hi: "मोबाइल डेटा चालू या बंद कैसे करें?",
        hinglish: "Mobile data on ya off kaise karein?",
      },
      {
        en: "How do I save a website to open later?",
        hi: "किसी वेबसाइट को बाद में खोलने के लिए कैसे सेव करें?",
        hinglish: "Website ko baad mein kholne ke liye kaise save karein?",
      },
    ],
  },
  {
    id: "tv",
    emoji: "📺",
    title: { en: "Smart TV", hi: "स्मार्ट टीवी", hinglish: "Smart TV" },
    questions: [
      {
        en: "How do I watch YouTube on my TV?",
        hi: "टीवी पर YouTube कैसे देखें?",
        hinglish: "TV pe YouTube kaise dekhein?",
      },
      {
        en: "How do I connect my TV to Wi‑Fi?",
        hi: "टीवी को Wi‑Fi से कैसे जोड़ें?",
        hinglish: "TV ko Wi‑Fi se kaise jodein?",
      },
      {
        en: "How do I turn on subtitles on my TV?",
        hi: "टीवी पर सबटाइटल कैसे चालू करें?",
        hinglish: "TV pe subtitles kaise on karein?",
      },
      {
        en: "How do I show my phone's photos on the TV?",
        hi: "फ़ोन की फ़ोटो टीवी पर कैसे दिखाएँ?",
        hinglish: "Phone ki photos TV pe kaise dikhayein?",
      },
    ],
  },
  {
    id: "shopping",
    emoji: "🛒",
    title: { en: "Online shopping", hi: "ऑनलाइन ख़रीदारी", hinglish: "Online shopping" },
    questions: [
      {
        en: "How do I search for something on Amazon?",
        hi: "Amazon पर कोई चीज़ कैसे खोजें?",
        hinglish: "Amazon pe koi cheez kaise search karein?",
      },
      {
        en: "How do I track my order?",
        hi: "अपना ऑर्डर कहाँ पहुँचा, कैसे देखें?",
        hinglish: "Apna order kahan pahuncha, kaise dekhein?",
      },
      {
        en: "How do I return something I bought online?",
        hi: "ऑनलाइन ख़रीदी चीज़ वापस कैसे करें?",
        hinglish: "Online khareedi cheez wapas kaise karein?",
      },
      {
        en: "How do I know if a shopping website is real?",
        hi: "कैसे पता करें कि ख़रीदारी की वेबसाइट असली है?",
        hinglish: "Kaise pata karein ki shopping website asli hai?",
      },
    ],
  },
  {
    id: "payments",
    emoji: "💳",
    title: { en: "Digital payments", hi: "डिजिटल पेमेंट", hinglish: "Digital payment" },
    questions: [
      {
        en: "How do I check that a UPI payment has come in?",
        hi: "कैसे देखें कि UPI पेमेंट आ गया है?",
        hinglish: "Kaise dekhein ki UPI payment aa gaya hai?",
      },
      {
        en: "How do I see my past payments in my UPI app?",
        hi: "UPI ऐप में पुराने पेमेंट कैसे देखें?",
        hinglish: "UPI app mein purane payment kaise dekhein?",
      },
      {
        en: "Why must my UPI PIN stay secret?",
        hi: "मेरा UPI PIN गुप्त क्यों रहना चाहिए?",
        hinglish: "Mera UPI PIN secret kyun rehna chahiye?",
      },
      {
        en: "Is it safe to accept a payment request from a stranger?",
        hi: "क्या अनजान व्यक्ति की पेमेंट रिक्वेस्ट मानना सुरक्षित है?",
        hinglish: "Kya anjaan insaan ki payment request accept karna safe hai?",
      },
      {
        en: "How do I report a payment that went wrong?",
        hi: "ग़लत हुए पेमेंट की शिकायत कैसे करें?",
        hinglish: "Galat hue payment ki shikayat kaise karein?",
      },
    ],
  },
  {
    id: "safety",
    emoji: "🔒",
    title: { en: "Online safety", hi: "ऑनलाइन सुरक्षा", hinglish: "Online safety" },
    questions: [
      {
        en: "How do I spot a scam message?",
        hi: "धोखे वाला मैसेज कैसे पहचानें?",
        hinglish: "Scam wala message kaise pehchanein?",
      },
      {
        en: "How do I make a strong password?",
        hi: "मज़बूत पासवर्ड कैसे बनाएँ?",
        hinglish: "Mazboot password kaise banayein?",
      },
      {
        en: "How do I know if a link is safe to open?",
        hi: "कैसे पता करें कि कोई लिंक खोलना सुरक्षित है?",
        hinglish: "Kaise pata karein ki koi link kholna safe hai?",
      },
      {
        en: "Why is my OTP only for me?",
        hi: "मेरा OTP सिर्फ़ मेरे लिए क्यों है?",
        hinglish: "Mera OTP sirf mere liye kyun hai?",
      },
      {
        en: "How do I block a number that keeps calling me?",
        hi: "बार-बार कॉल करने वाला नंबर ब्लॉक कैसे करें?",
        hinglish: "Baar-baar call karne wala number block kaise karein?",
      },
    ],
  },
];
