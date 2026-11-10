// "Teach me how this works" lessons, grouped by topic. Each lesson runs in four stages (lib/learn/lessonFlow):
// EXPLAIN (the short `explain` text below) → SHOW (the helper's step-by-step guide for the learner's own device,
// asked as `question` in Show me how mode) → LET ME TRY (the Practice exercise `practiceId`, or "Now try it on
// your phone") → DONE.
// Payment and safety lessons never ask the learner to share an OTP, PIN, password or CVV.

import type { Localized } from "@/lib/content/localized";

export type Lesson = {
  /** Stable id, saved in the store when the lesson is finished. Never rename one. */
  id: string;
  title: Localized;
  /** Sent to the helper; the English one always starts "Teach me how to". */
  question: Localized;
  /** EXPLAIN: two or three short, plain sentences on what this is and why it's useful. */
  explain: Localized;
  /** LET ME TRY: the Practice exercise (lib/content/practice) for this lesson, when there is one. */
  practiceId?: string;
};

export type LessonGroup = { id: string; emoji: string; title: Localized; lessons: readonly Lesson[] };

const L = (en: string, hi: string, hinglish: string): Localized => ({ en, hi, hinglish });

export const LESSON_GROUPS: readonly LessonGroup[] = [
  {
    id: "whatsapp",
    emoji: "💬",
    title: L("WhatsApp", "WhatsApp", "WhatsApp"),
    lessons: [
      {
        id: "whatsapp-photo",
        title: L("Send a photo on WhatsApp", "WhatsApp पर फ़ोटो भेजें", "WhatsApp pe photo bhejiye"),
        question: L(
          "Teach me how to send a photo on WhatsApp",
          "मुझे सिखाइए कि WhatsApp पर फ़ोटो कैसे भेजें",
          "Mujhe sikhaiye ki WhatsApp pe photo kaise bhejte hain",
        ),
        explain: L(
          "WhatsApp lets you send photos to family and friends for free, over the internet. The photo goes straight into your chat, and they can see it on their phone in seconds.",
          "WhatsApp से आप परिवार और दोस्तों को इंटरनेट पर मुफ़्त में फ़ोटो भेज सकते हैं। फ़ोटो सीधे चैट में जाती है, और वे कुछ ही पलों में अपने फ़ोन पर उसे देख सकते हैं।",
          "WhatsApp se aap family aur doston ko internet pe free mein photo bhej sakte hain. Photo seedha chat mein jaati hai, aur woh kuch hi pal mein apne phone pe use dekh sakte hain.",
        ),
        practiceId: "send-photo",
      },
      {
        id: "whatsapp-voice-message",
        title: L("Send a voice message on WhatsApp", "WhatsApp पर वॉइस मैसेज भेजें", "WhatsApp pe voice message bhejiye"),
        question: L(
          "Teach me how to send a voice message on WhatsApp",
          "मुझे सिखाइए कि WhatsApp पर वॉइस मैसेज कैसे भेजें",
          "Mujhe sikhaiye ki WhatsApp pe voice message kaise bhejte hain",
        ),
        explain: L(
          "A voice message is a short recording of your voice. It's handy when typing is hard: you hold a button, talk, and let go.",
          "वॉइस मैसेज आपकी आवाज़ की एक छोटी रिकॉर्डिंग है। जब टाइप करना मुश्किल हो, तब यह बहुत काम आता है: बस एक बटन दबाकर रखें, बोलें, और छोड़ दें।",
          "Voice message aapki awaaz ki ek chhoti recording hai. Jab type karna mushkil ho, tab yeh bahut kaam aata hai: bas ek button dabakar rakhiye, boliye, aur chhod dijiye.",
        ),
      },
    ],
  },
  {
    id: "instagram",
    emoji: "📸",
    title: L("Instagram", "Instagram", "Instagram"),
    lessons: [
      {
        id: "instagram-post",
        title: L("Post a photo on Instagram", "Instagram पर फ़ोटो पोस्ट करें", "Instagram pe photo post kijiye"),
        question: L(
          "Teach me how to post a photo on Instagram",
          "मुझे सिखाइए कि Instagram पर फ़ोटो कैसे पोस्ट करें",
          "Mujhe sikhaiye ki Instagram pe photo kaise post karte hain",
        ),
        explain: L(
          "Instagram is an app for sharing photos and short videos. When you post a photo, the people who follow you can see it, like it and leave a kind comment.",
          "Instagram फ़ोटो और छोटे वीडियो शेयर करने का ऐप है। जब आप फ़ोटो पोस्ट करते हैं, तो आपको फ़ॉलो करने वाले लोग उसे देख सकते हैं, लाइक कर सकते हैं और कुछ अच्छा लिख सकते हैं।",
          "Instagram photos aur chhote videos share karne ka app hai. Jab aap photo post karte hain, toh aapko follow karne wale log use dekh sakte hain, like kar sakte hain aur kuch accha likh sakte hain.",
        ),
        practiceId: "post-photo",
      },
    ],
  },
  {
    id: "email",
    emoji: "✉️",
    title: L("Email", "ईमेल", "Email"),
    lessons: [
      {
        id: "send-email",
        title: L("Send an email", "ईमेल भेजें", "Email bhejiye"),
        question: L("Teach me how to send an email", "मुझे सिखाइए कि ईमेल कैसे भेजें", "Mujhe sikhaiye ki email kaise bhejte hain"),
        explain: L(
          "An email is like a letter that travels over the internet. It arrives in seconds, and you can add photos or documents to it.",
          "ईमेल इंटरनेट से जाने वाली चिट्ठी जैसा है। यह कुछ ही पलों में पहुँच जाता है, और इसमें आप फ़ोटो या डॉक्यूमेंट भी जोड़ सकते हैं।",
          "Email internet se jaane wali chitthi jaisa hai. Yeh kuch hi pal mein pahunch jaata hai, aur ismein aap photo ya document bhi jod sakte hain.",
        ),
      },
    ],
  },
  {
    id: "videoCalls",
    emoji: "📹",
    title: L("Video calls", "वीडियो कॉल", "Video calls"),
    lessons: [
      {
        id: "whatsapp-video-call",
        title: L("Make a video call on WhatsApp", "WhatsApp पर वीडियो कॉल करें", "WhatsApp pe video call kijiye"),
        question: L(
          "Teach me how to make a video call on WhatsApp",
          "मुझे सिखाइए कि WhatsApp पर वीडियो कॉल कैसे करें",
          "Mujhe sikhaiye ki WhatsApp pe video call kaise karte hain",
        ),
        explain: L(
          "A video call lets you see and hear someone at the same time, wherever they are. On WhatsApp it's free when you're on Wi‑Fi or mobile data.",
          "वीडियो कॉल में आप किसी को एक साथ देख और सुन सकते हैं, चाहे वे कहीं भी हों। Wi‑Fi या मोबाइल डेटा पर WhatsApp से यह मुफ़्त है।",
          "Video call mein aap kisi ko ek saath dekh aur sun sakte hain, chahe woh kahin bhi hon. Wi‑Fi ya mobile data pe WhatsApp se yeh free hai.",
        ),
        practiceId: "video-call",
      },
      {
        id: "join-video-meeting",
        title: L("Join a video meeting from a link", "लिंक से वीडियो मीटिंग में जुड़ें", "Link se video meeting mein judiye"),
        question: L(
          "Teach me how to join a video meeting from a link someone sent me",
          "मुझे सिखाइए कि किसी के भेजे लिंक से वीडियो मीटिंग में कैसे जुड़ें",
          "Mujhe sikhaiye ki kisi ke bheje link se video meeting mein kaise judte hain",
        ),
        explain: L(
          "Sometimes family or a doctor sends you a link to a video meeting. Tapping the link opens the meeting, and you join with your camera and microphone.",
          "कभी-कभी परिवार या डॉक्टर आपको वीडियो मीटिंग का लिंक भेजते हैं। लिंक दबाने पर मीटिंग खुलती है, और आप अपने कैमरे और माइक के साथ उसमें जुड़ जाते हैं।",
          "Kabhi-kabhi family ya doctor aapko video meeting ka link bhejte hain. Link dabane pe meeting khulti hai, aur aap apne camera aur mic ke saath usmein jud jaate hain.",
        ),
      },
    ],
  },
  {
    id: "phone",
    emoji: "📱",
    title: L("Phone basics", "फ़ोन की बुनियादी बातें", "Phone ki basic baatein"),
    lessons: [
      {
        id: "screenshot",
        title: L("Take a screenshot", "स्क्रीनशॉट लें", "Screenshot lijiye"),
        question: L("Teach me how to take a screenshot", "मुझे सिखाइए कि स्क्रीनशॉट कैसे लें", "Mujhe sikhaiye ki screenshot kaise lete hain"),
        explain: L(
          "A screenshot is a picture of exactly what is on your screen. It's useful for keeping something, or for showing someone what you see.",
          "स्क्रीनशॉट आपकी स्क्रीन पर जो दिख रहा है, उसकी तस्वीर है। किसी चीज़ को रखने के लिए, या किसी को दिखाने के लिए कि आपको क्या दिख रहा है, यह काम आता है।",
          "Screenshot aapki screen pe jo dikh raha hai, uski photo hai. Kisi cheez ko rakhne ke liye, ya kisi ko dikhane ke liye ki aapko kya dikh raha hai, yeh kaam aata hai.",
        ),
      },
      {
        id: "bigger-text",
        title: L("Make text bigger", "लिखावट बड़ी करें", "Text bada kijiye"),
        question: L(
          "Teach me how to make the text bigger on my phone",
          "मुझे सिखाइए कि फ़ोन पर लिखावट बड़ी कैसे करें",
          "Mujhe sikhaiye ki phone pe text bada kaise karte hain",
        ),
        explain: L(
          "Your phone can show all its words bigger, so they're easier to read. You change it once in Settings, and every app follows.",
          "आपका फ़ोन सारे शब्द बड़े दिखा सकता है, ताकि पढ़ना आसान हो। इसे सेटिंग्स में एक बार बदलें, और हर ऐप में लिखावट बड़ी हो जाएगी।",
          "Aapka phone saare words bade dikha sakta hai, taaki padhna aasaan ho. Ise Settings mein ek baar badliye, aur har app mein text bada ho jayega.",
        ),
      },
      {
        id: "wifi",
        title: L("Connect to Wi‑Fi", "Wi‑Fi से जुड़ें", "Wi‑Fi se judiye"),
        question: L("Teach me how to connect to Wi‑Fi", "मुझे सिखाइए कि Wi‑Fi से कैसे जुड़ें", "Mujhe sikhaiye ki Wi‑Fi se kaise judte hain"),
        explain: L(
          "Wi‑Fi is internet without wires, from a box at home or in a shop or café. Using Wi‑Fi saves your mobile data, and it's often faster.",
          "Wi‑Fi बिना तार का इंटरनेट है, जो घर के एक डिब्बे से या दुकान और कैफ़े में मिलता है। Wi‑Fi चलाने से आपका मोबाइल डेटा बचता है, और यह अक्सर तेज़ भी होता है।",
          "Wi‑Fi bina taar ka internet hai, jo ghar ke ek dibbe se ya dukaan aur cafe mein milta hai. Wi‑Fi chalane se aapka mobile data bachta hai, aur yeh aksar tez bhi hota hai.",
        ),
      },
      {
        id: "save-contact",
        title: L("Save a new phone number", "नया फ़ोन नंबर सेव करें", "Naya phone number save kijiye"),
        question: L(
          "Teach me how to save a new phone number in my contacts",
          "मुझे सिखाइए कि नया फ़ोन नंबर कॉन्टैक्ट में कैसे सेव करें",
          "Mujhe sikhaiye ki naya phone number contacts mein kaise save karte hain",
        ),
        explain: L(
          "Saving a number puts the person's name in your phone. Then you can see who is calling, and find them again without typing the number.",
          "नंबर सेव करने से उस व्यक्ति का नाम आपके फ़ोन में आ जाता है। फिर आपको दिखता है कि कौन फ़ोन कर रहा है, और बिना नंबर लिखे आप उन्हें फिर से ढूँढ सकते हैं।",
          "Number save karne se us insaan ka naam aapke phone mein aa jaata hai. Phir aapko dikhta hai ki kaun call kar raha hai, aur bina number likhe aap unhe phir se dhoondh sakte hain.",
        ),
      },
    ],
  },
  {
    id: "safety",
    emoji: "🛡️",
    title: L("Online safety", "ऑनलाइन सुरक्षा", "Online safety"),
    lessons: [
      {
        id: "spot-scam",
        title: L("Spot a scam message", "धोखे वाला मैसेज पहचानें", "Scam wala message pehchaniye"),
        question: L(
          "Teach me how to spot a scam message",
          "मुझे सिखाइए कि धोखे वाला मैसेज कैसे पहचानें",
          "Mujhe sikhaiye ki scam wala message kaise pehchante hain",
        ),
        explain: L(
          "Some messages pretend to be from a bank, a delivery or a prize, to trick you. Knowing the warning signs keeps your money and your details safe.",
          "कुछ मैसेज बैंक, डिलीवरी या इनाम के नाम पर आपको धोखा देने के लिए आते हैं। चेतावनी के निशान पहचानने से आपके पैसे और आपकी जानकारी सुरक्षित रहते हैं।",
          "Kuch message bank, delivery ya inaam ke naam pe aapko dhokha dene ke liye aate hain. Warning ke nishaan pehchanne se aapke paise aur aapki jaankari safe rehte hain.",
        ),
        practiceId: "spot-scam",
      },
      {
        id: "strong-password",
        title: L("Make a strong password", "मज़बूत पासवर्ड बनाएँ", "Mazboot password banaiye"),
        question: L(
          "Teach me how to make a strong password",
          "मुझे सिखाइए कि मज़बूत पासवर्ड कैसे बनाएँ",
          "Mujhe sikhaiye ki mazboot password kaise banate hain",
        ),
        explain: L(
          "A password is a secret word that locks your account. A strong one is long and hard to guess, so nobody else can get in.",
          "पासवर्ड एक गुप्त शब्द है जो आपके अकाउंट पर ताला लगाता है। मज़बूत पासवर्ड लंबा होता है और उसका अंदाज़ा लगाना मुश्किल होता है, ताकि कोई और अंदर न आ सके।",
          "Password ek secret word hai jo aapke account pe taala lagata hai. Mazboot password lamba hota hai aur uska andaaza lagana mushkil hota hai, taaki koi aur andar na aa sake.",
        ),
      },
      {
        id: "block-caller",
        title: L("Block an unknown caller", "अनजान कॉल करने वाले को ब्लॉक करें", "Anjaan caller ko block kijiye"),
        question: L(
          "Teach me how to block an unknown number that keeps calling me",
          "मुझे सिखाइए कि बार-बार कॉल करने वाले अनजान नंबर को ब्लॉक कैसे करें",
          "Mujhe sikhaiye ki baar-baar call karne wale anjaan number ko block kaise karte hain",
        ),
        explain: L(
          "Blocking a number stops it from calling or messaging you again. It's a quick way to stop a stranger who keeps bothering you.",
          "किसी नंबर को ब्लॉक करने से वह आपको फिर फ़ोन या मैसेज नहीं कर पाता। बार-बार परेशान करने वाले अनजान व्यक्ति को रोकने का यह आसान तरीका है।",
          "Kisi number ko block karne se woh aapko phir call ya message nahi kar paata. Baar-baar pareshaan karne wale anjaan insaan ko rokne ka yeh aasaan tareeka hai.",
        ),
      },
      {
        id: "upi-check",
        title: L(
          "Check a UPI payment safely",
          "UPI पेमेंट सुरक्षित तरीके से जाँचें",
          "UPI payment safe tareeke se check kijiye",
        ),
        question: L(
          "Teach me how to check a UPI payment safely",
          "मुझे सिखाइए कि UPI पेमेंट सुरक्षित तरीके से कैसे जाँचें",
          "Mujhe sikhaiye ki UPI payment safe tareeke se kaise check karte hain",
        ),
        explain: L(
          "UPI lets you pay from your phone, straight from your bank. Checking a payment safely means looking in your own app, not trusting a message or a caller.",
          "UPI से आप फ़ोन से सीधे अपने बैंक से पेमेंट कर सकते हैं। पेमेंट को सुरक्षित तरीके से जाँचने का मतलब है अपने ऐप में देखना, किसी मैसेज या कॉल करने वाले पर भरोसा न करना।",
          "UPI se aap phone se seedha apne bank se payment kar sakte hain. Payment ko safe tareeke se check karne ka matlab hai apne app mein dekhna, kisi message ya call karne wale pe bharosa na karna.",
        ),
      },
    ],
  },
  {
    id: "search",
    emoji: "🔍",
    title: L("Google Search", "Google पर खोजना", "Google Search"),
    lessons: [
      {
        id: "google-search",
        title: L("Search for something on Google", "Google पर कुछ खोजें", "Google pe kuch search kijiye"),
        question: L(
          "Teach me how to search for something on Google",
          "मुझे सिखाइए कि Google पर कुछ कैसे खोजें",
          "Mujhe sikhaiye ki Google pe kuch kaise search karte hain",
        ),
        explain: L(
          "Google Search finds answers on the internet. You type or say a few words, like “weather today”, and it shows you pages that can help.",
          "Google Search इंटरनेट पर जवाब ढूँढता है। आप कुछ शब्द लिखें या बोलें, जैसे “आज का मौसम”, और यह मदद करने वाले पेज दिखाता है।",
          "Google Search internet pe jawaab dhoondhta hai. Aap kuch words likhiye ya boliye, jaise “aaj ka mausam”, aur yeh madad karne wale pages dikhata hai.",
        ),
      },
    ],
  },
  {
    id: "maps",
    emoji: "🗺️",
    title: L("Maps", "नक्शे (Maps)", "Maps"),
    lessons: [
      {
        id: "maps-directions",
        title: L("Get directions on Google Maps", "Google Maps पर रास्ता देखें", "Google Maps pe raasta dekhiye"),
        question: L(
          "Teach me how to get directions to a place on Google Maps",
          "मुझे सिखाइए कि Google Maps पर किसी जगह का रास्ता कैसे देखें",
          "Mujhe sikhaiye ki Google Maps pe kisi jagah ka raasta kaise dekhte hain",
        ),
        explain: L(
          "Google Maps is a map on your phone that knows where you are. It can show you the way to any place, by car, by bus or on foot.",
          "Google Maps आपके फ़ोन पर एक नक्शा है, जिसे पता होता है कि आप कहाँ हैं। यह आपको किसी भी जगह का रास्ता दिखा सकता है: गाड़ी से, बस से या पैदल।",
          "Google Maps aapke phone pe ek naksha hai, jise pata hota hai ki aap kahan hain. Yeh aapko kisi bhi jagah ka raasta dikha sakta hai: gaadi se, bus se ya paidal.",
        ),
      },
    ],
  },
  {
    id: "shopping",
    emoji: "🛍️",
    title: L("Online shopping", "ऑनलाइन ख़रीदारी", "Online shopping"),
    lessons: [
      {
        id: "track-order",
        title: L("Track an online order", "ऑनलाइन ऑर्डर ट्रैक करें", "Online order track kijiye"),
        question: L(
          "Teach me how to track something I ordered online",
          "मुझे सिखाइए कि ऑनलाइन मँगाई चीज़ को कैसे ट्रैक करें",
          "Mujhe sikhaiye ki online mangwayi cheez ko kaise track karte hain",
        ),
        explain: L(
          "When you buy something online, the shop tells you where your parcel is. Tracking it shows the day it will arrive, so you know when to be home.",
          "जब आप ऑनलाइन कुछ ख़रीदते हैं, तो दुकान बताती है कि आपका पार्सल कहाँ है। ट्रैक करने से पता चलता है कि वह किस दिन आएगा, ताकि आप उस दिन घर पर रहें।",
          "Jab aap online kuch khareedte hain, toh dukaan batati hai ki aapka parcel kahan hai. Track karne se pata chalta hai ki woh kis din aayega, taaki aap us din ghar pe rahein.",
        ),
      },
    ],
  },
  {
    id: "ai",
    emoji: "🤖",
    title: L("AI helpers", "AI मददगार", "AI helpers"),
    lessons: [
      {
        id: "ask-chatgpt",
        title: L("Ask ChatGPT a question", "ChatGPT से सवाल पूछें", "ChatGPT se sawaal poochiye"),
        question: L(
          "Teach me how to ask ChatGPT a question",
          "मुझे सिखाइए कि ChatGPT से सवाल कैसे पूछें",
          "Mujhe sikhaiye ki ChatGPT se sawaal kaise poochte hain",
        ),
        explain: L(
          "ChatGPT is an AI helper you can talk to by typing or speaking. You ask a question in your own words, and it writes an answer for you.",
          "ChatGPT एक AI मददगार है, जिससे आप लिखकर या बोलकर बात कर सकते हैं। आप अपने शब्दों में सवाल पूछें, और यह आपके लिए जवाब लिखता है।",
          "ChatGPT ek AI helper hai, jisse aap likhkar ya bolkar baat kar sakte hain. Aap apne words mein sawaal poochiye, aur yeh aapke liye jawaab likhta hai.",
        ),
      },
    ],
  },
];

export const ALL_LESSONS: readonly Lesson[] = LESSON_GROUPS.flatMap((g) => g.lessons);

export function getLesson(id: string | null | undefined): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

/** The lesson's topic group. */
export function lessonGroup(id: string): LessonGroup | undefined {
  return LESSON_GROUPS.find((g) => g.lessons.some((l) => l.id === id));
}
