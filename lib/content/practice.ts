// Practice mode: simplified pretend screens, drawn with HTML and CSS by components/practice/PracticeScreen.
// They look *like* a chat app or a photo app but never copy a real app's name, logo or colours.
// Every exercise is plain data: one instruction per screen, and the id of the one thing to tap.

import type { Localized } from "@/lib/content/localized";

/** Something on a pretend screen that can be tapped: the right answer or a distractor. Always a real button. */
export type PracticeTap = {
  /** Unique on its screen; a step's `target` names one. */
  id: string;
  /** The button's accessible name, read by screen readers ("Attach", "Chat with Priya"). */
  label: Localized;
  /** A symbol drawn on the button (decorative: the label names it). */
  icon?: string;
  /** Words shown on the button, when it has any. */
  text?: Localized;
  /** A background colour, for photo tiles, avatars and coloured buttons. */
  tone?: string;
};

export type PracticeChat = PracticeTap & { preview: Localized; time: string };
export type PracticeInboxMessage = PracticeTap & { sender: Localized; preview: Localized; time: string };

/** The building blocks of a pretend screen, top to bottom. */
export type PracticeElement =
  | { kind: "appBar"; title: Localized; back?: PracticeTap; actions?: readonly PracticeTap[] }
  | { kind: "chatList"; chats: readonly PracticeChat[] }
  | { kind: "messages"; messages: readonly { from: "me" | "them"; text: Localized }[] }
  | { kind: "composer"; placeholder: Localized; tools: readonly PracticeTap[] }
  | { kind: "sheet"; title: Localized; options: readonly PracticeTap[] }
  | { kind: "photoGrid"; photos: readonly PracticeTap[] }
  | { kind: "photo"; icon: string; tone: string; small?: boolean }
  | { kind: "post"; author: Localized; icon: string; tone: string }
  | { kind: "caption"; placeholder: Localized }
  | { kind: "options"; options: readonly PracticeTap[] }
  | { kind: "actions"; buttons: readonly PracticeTap[]; align?: "center" | "end" }
  | { kind: "call"; name: Localized; status: Localized; buttons: readonly PracticeTap[] }
  | { kind: "inbox"; messages: readonly PracticeInboxMessage[] }
  | { kind: "tabBar"; tabs: readonly PracticeTap[] };

export type PracticeStep = {
  id: string;
  /** One thing to do, said plainly: "Tap where you think you should go to attach a photo." */
  instruction: Localized;
  /** After a wrong tap: "Not quite — look for the paperclip at the bottom." */
  hint: Localized;
  /** The id of the one right thing to tap on this screen. */
  target: string;
  /** Said with "Yes! That's right." after the right tap; the last step's is replaced by `done`. */
  praise?: Localized;
  screen: readonly PracticeElement[];
};

/** How a pretend app looks: a chat app, a photo-sharing app or a text-message inbox. All generic. */
export type PracticeLook = "chat" | "social" | "inbox";

export type PracticeExercise = {
  /** Stable id, saved in the store when finished. Never rename one. */
  id: string;
  title: Localized;
  intro: Localized;
  emoji: string;
  look: PracticeLook;
  /** Tech Confidence topics (lib/progress/confidence) this practice counts towards. */
  topics: readonly string[];
  steps: readonly PracticeStep[];
  /** Shown when finished: what was learned (for the scam check, why it was a scam). */
  done: Localized;
};

// ---------- Shared pieces ----------

const L = (en: string, hi: string, hinglish: string): Localized => ({ en, hi, hinglish });

const PRIYA = L("Priya", "प्रिया", "Priya");
const RAJ = L("Raj", "राज", "Raj");

const back: PracticeTap = { id: "back", label: L("Back", "वापस", "Wapas"), icon: "←" };
const close: PracticeTap = { id: "close", label: L("Close", "बंद करें", "Band kijiye"), icon: "✕" };

const chatsBar: PracticeElement = {
  kind: "appBar",
  title: L("Chats", "चैट", "Chats"),
  actions: [
    { id: "search", label: L("Search", "खोजें", "Search"), icon: "🔍" },
    { id: "menu", label: L("Menu", "मेन्यू", "Menu"), icon: "⋮" },
  ],
};

const chatList: PracticeElement = {
  kind: "chatList",
  chats: [
    {
      id: "priya",
      label: L("Chat with Priya", "प्रिया से चैट", "Priya se chat"),
      text: PRIYA,
      preview: L("See you on Sunday!", "रविवार को मिलते हैं!", "Sunday ko milte hain!"),
      time: "10:24",
      tone: "#e7798f",
    },
    {
      id: "raj",
      label: L("Chat with Raj", "राज से चैट", "Raj se chat"),
      text: RAJ,
      preview: L("Thank you 🙏", "धन्यवाद 🙏", "Shukriya 🙏"),
      time: "9:02",
      tone: "#7c74ff",
    },
    {
      id: "family",
      label: L("Chat with the family group", "परिवार ग्रुप से चैट", "Family group se chat"),
      text: L("Family", "परिवार", "Family"),
      preview: L("Good morning ☀️", "सुप्रभात ☀️", "Good morning ☀️"),
      time: "8:15",
      tone: "#2e8a50",
    },
  ],
};

const chatTabs: PracticeElement = {
  kind: "tabBar",
  tabs: [
    { id: "tab-chats", label: L("Chats", "चैट", "Chats"), icon: "💬" },
    { id: "tab-calls", label: L("Calls", "कॉल", "Calls"), icon: "📞" },
    { id: "tab-settings", label: L("Settings", "सेटिंग्स", "Settings"), icon: "⚙️" },
  ],
};

function chatBar(name: Localized): PracticeElement {
  return {
    kind: "appBar",
    title: name,
    back,
    actions: [
      { id: "video", label: L("Video call", "वीडियो कॉल", "Video call"), icon: "📹" },
      { id: "voice", label: L("Voice call", "वॉइस कॉल", "Voice call"), icon: "📞" },
    ],
  };
}

const composer: PracticeElement = {
  kind: "composer",
  placeholder: L("Message", "मैसेज", "Message"),
  tools: [
    { id: "emoji", label: L("Emoji", "इमोजी", "Emoji"), icon: "😊" },
    { id: "attach", label: L("Attach", "अटैच करें", "Attach"), icon: "📎" },
    { id: "camera", label: L("Camera", "कैमरा", "Camera"), icon: "📷" },
    { id: "mic", label: L("Voice message", "वॉइस मैसेज", "Voice message"), icon: "🎤" },
  ],
};

const priyaMessages: PracticeElement = {
  kind: "messages",
  messages: [
    { from: "them", text: L("Hi! How are you?", "नमस्ते! आप कैसे हैं?", "Hi! Aap kaise hain?") },
    { from: "me", text: L("Very well, thank you!", "बहुत बढ़िया, धन्यवाद!", "Bahut badhiya, shukriya!") },
    { from: "them", text: L("See you on Sunday!", "रविवार को मिलते हैं!", "Sunday ko milte hain!") },
  ],
};

const photo = (id: string, icon: string, tone: string, label: Localized): PracticeTap => ({ id, icon, tone, label });

const photos: readonly PracticeTap[] = [
  photo("sunset", "🌅", "#fbe7ad", L("Photo of a sunset", "सूरज ढलने की फ़ोटो", "Dhalte suraj ki photo")),
  photo("dog", "🐶", "#cfe8d6", L("Photo of a dog", "कुत्ते की फ़ोटो", "Kutte ki photo")),
  photo("flowers", "🌸", "#f8d3cd", L("Photo of pink flowers", "गुलाबी फूलों की फ़ोटो", "Gulabi phoolon ki photo")),
  photo("cake", "🎂", "#e4e1fa", L("Photo of a birthday cake", "जन्मदिन के केक की फ़ोटो", "Birthday cake ki photo")),
  photo("tree", "🌳", "#a8d5b5", L("Photo of a tree", "पेड़ की फ़ोटो", "Ped ki photo")),
  photo("beach", "🏖️", "#cbc6f3", L("Photo of the beach", "समुद्र तट की फ़ोटो", "Beach ki photo")),
];

// ---------- The exercises ----------

const sendPhoto: PracticeExercise = {
  id: "send-photo",
  title: L("Send a photo in a chat app", "चैट ऐप में फ़ोटो भेजें", "Chat app mein photo bhejiye"),
  intro: L(
    "Open a chat, attach a photo and send it.",
    "चैट खोलें, फ़ोटो जोड़ें और भेजें।",
    "Chat kholiye, photo jodiye aur bhejiye.",
  ),
  emoji: "📎",
  look: "chat",
  topics: ["whatsapp", "photos"],
  steps: [
    {
      id: "open-chat",
      instruction: L(
        "Let's send Priya a photo. First, tap Priya's chat to open it.",
        "चलिए प्रिया को एक फ़ोटो भेजते हैं। पहले प्रिया की चैट पर टैप करके उसे खोलें।",
        "Chaliye Priya ko ek photo bhejte hain. Pehle Priya ki chat pe tap karke use kholiye.",
      ),
      hint: L(
        "Not quite — look for Priya's name in the list.",
        "यह नहीं — सूची में प्रिया का नाम ढूँढिए।",
        "Yeh nahi — list mein Priya ka naam dhoondhiye.",
      ),
      target: "priya",
      praise: L("That opens your chat with Priya.", "इससे प्रिया के साथ आपकी चैट खुल गई।", "Isse Priya ke saath aapki chat khul gayi."),
      screen: [chatsBar, chatList, chatTabs],
    },
    {
      id: "attach",
      instruction: L(
        "Tap where you think you should go to attach a photo.",
        "फ़ोटो जोड़ने के लिए जहाँ आपको लगता है, वहाँ टैप करें।",
        "Photo jodne ke liye jahan aapko lagta hai, wahan tap kijiye.",
      ),
      hint: L(
        "Not quite — look for the paperclip at the bottom.",
        "यह नहीं — नीचे पेपरक्लिप ढूँढिए।",
        "Yeh nahi — neeche paperclip dhoondhiye.",
      ),
      target: "attach",
      praise: L(
        "The paperclip opens a menu of things you can send.",
        "पेपरक्लिप से एक मेन्यू खुलता है, जिसमें भेजने की चीज़ें होती हैं।",
        "Paperclip se ek menu khulta hai, jismein bhejne ki cheezein hoti hain.",
      ),
      screen: [chatBar(PRIYA), priyaMessages, composer],
    },
    {
      id: "gallery",
      instruction: L(
        "Now choose the place where your photos are kept.",
        "अब वह जगह चुनें जहाँ आपकी फ़ोटो रखी होती हैं।",
        "Ab woh jagah chuniye jahan aapki photos rakhi hoti hain.",
      ),
      hint: L(
        "Not quite — look for Gallery. That's where your photos are.",
        "यह नहीं — गैलरी ढूँढिए। आपकी फ़ोटो वहीं होती हैं।",
        "Yeh nahi — Gallery dhoondhiye. Aapki photos wahin hoti hain.",
      ),
      target: "gallery",
      praise: L(
        "Gallery shows all the photos on your phone.",
        "गैलरी में आपके फ़ोन की सारी फ़ोटो दिखती हैं।",
        "Gallery mein aapke phone ki saari photos dikhti hain.",
      ),
      screen: [
        chatBar(PRIYA),
        {
          kind: "sheet",
          title: L("Send", "भेजें", "Bhejiye"),
          options: [
            { id: "document", label: L("Document", "डॉक्यूमेंट", "Document"), icon: "📄" },
            { id: "camera", label: L("Camera", "कैमरा", "Camera"), icon: "📷" },
            { id: "gallery", label: L("Gallery", "गैलरी", "Gallery"), icon: "🖼️" },
            { id: "location", label: L("Location", "लोकेशन", "Location"), icon: "📍" },
            { id: "contact", label: L("Contact", "कॉन्टैक्ट", "Contact"), icon: "👤" },
          ],
        },
      ],
    },
    {
      id: "pick-photo",
      instruction: L(
        "Tap the photo of the pink flowers to choose it.",
        "गुलाबी फूलों वाली फ़ोटो पर टैप करके उसे चुनें।",
        "Gulabi phoolon wali photo pe tap karke use chuniye.",
      ),
      hint: L(
        "Not quite — look for the photo with the pink flowers 🌸.",
        "यह नहीं — गुलाबी फूलों 🌸 वाली फ़ोटो ढूँढिए।",
        "Yeh nahi — gulabi phoolon 🌸 wali photo dhoondhiye.",
      ),
      target: "flowers",
      praise: L("Lovely choice.", "बढ़िया चुनाव।", "Badhiya choice."),
      screen: [{ kind: "appBar", title: L("Gallery", "गैलरी", "Gallery"), back }, { kind: "photoGrid", photos }],
    },
    {
      id: "send",
      instruction: L("Now send the photo to Priya.", "अब यह फ़ोटो प्रिया को भेजें।", "Ab yeh photo Priya ko bhejiye."),
      hint: L(
        "Not quite — look for the round Send button with the arrow, at the bottom right.",
        "यह नहीं — नीचे दाईं ओर तीर वाला गोल “भेजें” बटन ढूँढिए।",
        "Yeh nahi — neeche right side pe teer wala gol Send button dhoondhiye.",
      ),
      target: "send",
      screen: [
        {
          kind: "appBar",
          title: PRIYA,
          back: close,
          actions: [
            { id: "crop", label: L("Crop", "काटें", "Crop"), icon: "✂️" },
            { id: "draw", label: L("Draw", "ड्रॉ करें", "Draw"), icon: "✏️" },
          ],
        },
        { kind: "photo", icon: "🌸", tone: "#f8d3cd" },
        { kind: "caption", placeholder: L("Add a caption…", "कैप्शन लिखें…", "Caption likhiye…") },
        { kind: "actions", align: "end", buttons: [{ id: "send", label: L("Send", "भेजें", "Send"), icon: "➤", tone: "#0e7a6d" }] },
      ],
    },
  ],
  done: L(
    "You sent a photo! The real app works the same way: open the chat, tap the paperclip, choose Gallery, pick a photo and tap Send.",
    "आपने फ़ोटो भेज दी! असली ऐप में भी ऐसे ही होता है: चैट खोलें, पेपरक्लिप दबाएँ, गैलरी चुनें, फ़ोटो चुनें और “भेजें” दबाएँ।",
    "Aapne photo bhej di! Asli app mein bhi aise hi hota hai: chat kholiye, paperclip dabaiye, Gallery chuniye, photo chuniye aur Send dabaiye.",
  ),
};

const videoCall: PracticeExercise = {
  id: "video-call",
  title: L("Make a video call", "वीडियो कॉल करें", "Video call kijiye"),
  intro: L(
    "Open a contact and start a video call.",
    "किसी की चैट खोलें और वीडियो कॉल शुरू करें।",
    "Kisi ki chat kholiye aur video call shuru kijiye.",
  ),
  emoji: "📹",
  look: "chat",
  topics: ["videoCalls"],
  steps: [
    {
      id: "open-chat",
      instruction: L(
        "Let's video call Raj. Tap Raj's chat to open it.",
        "चलिए राज को वीडियो कॉल करते हैं। राज की चैट पर टैप करके उसे खोलें।",
        "Chaliye Raj ko video call karte hain. Raj ki chat pe tap karke use kholiye.",
      ),
      hint: L(
        "Not quite — look for Raj's name in the list.",
        "यह नहीं — सूची में राज का नाम ढूँढिए।",
        "Yeh nahi — list mein Raj ka naam dhoondhiye.",
      ),
      target: "raj",
      praise: L("Here is your chat with Raj.", "यह रही राज के साथ आपकी चैट।", "Yeh rahi Raj ke saath aapki chat."),
      screen: [chatsBar, chatList, chatTabs],
    },
    {
      id: "video",
      instruction: L(
        "Tap the button that starts a video call.",
        "वीडियो कॉल शुरू करने वाला बटन दबाएँ।",
        "Video call shuru karne wala button dabaiye.",
      ),
      hint: L(
        "Not quite — look for the little video camera at the top.",
        "यह नहीं — ऊपर छोटा वीडियो कैमरा ढूँढिए।",
        "Yeh nahi — upar chhota video camera dhoondhiye.",
      ),
      target: "video",
      praise: L(
        "The video camera starts a video call. The phone next to it is a voice call.",
        "वीडियो कैमरा से वीडियो कॉल शुरू होती है। उसके पास वाला फ़ोन सिर्फ़ आवाज़ वाली कॉल है।",
        "Video camera se video call shuru hoti hai. Uske paas wala phone sirf awaaz wali call hai.",
      ),
      screen: [
        chatBar(RAJ),
        {
          kind: "messages",
          messages: [
            { from: "them", text: L("Call me when you're free.", "फ़ुर्सत में फ़ोन करना।", "Free hon toh call karna.") },
            { from: "me", text: L("Thank you 🙏", "धन्यवाद 🙏", "Shukriya 🙏") },
          ],
        },
        composer,
      ],
    },
    {
      id: "end",
      instruction: L(
        "You're talking to Raj. When you've finished, end the call.",
        "राज से बात हो रही है। बात पूरी होने पर कॉल काटें।",
        "Raj se baat ho rahi hai. Baat poori hone pe call kaatiye.",
      ),
      hint: L(
        "Not quite — look for the red button at the bottom.",
        "यह नहीं — नीचे लाल बटन ढूँढिए।",
        "Yeh nahi — neeche laal button dhoondhiye.",
      ),
      target: "end",
      screen: [
        {
          kind: "call",
          name: RAJ,
          status: L("Video call · 00:42", "वीडियो कॉल · 00:42", "Video call · 00:42"),
          buttons: [
            { id: "mute", label: L("Mute", "आवाज़ बंद करें", "Mute"), icon: "🔇" },
            { id: "end", label: L("End call", "कॉल काटें", "Call kaatiye"), icon: "📞", tone: "#c0392b" },
            { id: "flip", label: L("Switch camera", "कैमरा बदलें", "Camera badliye"), icon: "🔄" },
          ],
        },
      ],
    },
  ],
  done: L(
    "You made a video call! Remember: the video camera starts it, and the red button ends it.",
    "आपने वीडियो कॉल कर ली! याद रखें: वीडियो कैमरा से कॉल शुरू होती है, और लाल बटन से कटती है।",
    "Aapne video call kar li! Yaad rakhiye: video camera se call shuru hoti hai, aur laal button se katti hai.",
  ),
};

const NEW_POST = L("New post", "नई पोस्ट", "Nayi post");

const postPhoto: PracticeExercise = {
  id: "post-photo",
  title: L("Post a photo", "फ़ोटो पोस्ट करें", "Photo post kijiye"),
  intro: L(
    "Share a photo with everyone who follows you.",
    "अपनी फ़ोटो उन सबके साथ शेयर करें जो आपको फ़ॉलो करते हैं।",
    "Apni photo un sabke saath share kijiye jo aapko follow karte hain.",
  ),
  emoji: "🖼️",
  look: "social",
  topics: ["instagram", "photos"],
  steps: [
    {
      id: "new-post",
      instruction: L("Tap the button to make a new post.", "नई पोस्ट बनाने वाला बटन दबाएँ।", "Nayi post banane wala button dabaiye."),
      hint: L(
        "Not quite — look for the + at the bottom of the screen.",
        "यह नहीं — स्क्रीन के नीचे + ढूँढिए।",
        "Yeh nahi — screen ke neeche + dhoondhiye.",
      ),
      target: "new",
      praise: L("The + is for making something new.", "+ कुछ नया बनाने के लिए होता है।", "+ kuch naya banane ke liye hota hai."),
      screen: [
        {
          kind: "appBar",
          title: L("Home", "होम", "Home"),
          actions: [
            { id: "likes", label: L("Notifications", "सूचनाएँ", "Notifications"), icon: "♡" },
            { id: "messages", label: L("Messages", "मैसेज", "Messages"), icon: "✉️" },
          ],
        },
        { kind: "post", author: L("Asha", "आशा", "Asha"), icon: "🌄", tone: "#cbc6f3" },
        {
          kind: "tabBar",
          tabs: [
            { id: "home", label: L("Home", "होम", "Home"), icon: "🏠" },
            { id: "search", label: L("Search", "खोजें", "Search"), icon: "🔍" },
            { id: "new", label: NEW_POST, icon: "＋" },
            { id: "profile", label: L("My profile", "मेरी प्रोफ़ाइल", "Meri profile"), icon: "👤" },
          ],
        },
      ],
    },
    {
      id: "pick-photo",
      instruction: L("Choose the photo of the sunset.", "सूरज ढलने वाली फ़ोटो चुनें।", "Dhalte suraj wali photo chuniye."),
      hint: L(
        "Not quite — look for the orange sunset 🌅.",
        "यह नहीं — नारंगी रंग वाली, सूरज ढलने की फ़ोटो 🌅 ढूँढिए।",
        "Yeh nahi — orange rang wali, dhalte suraj ki photo 🌅 dhoondhiye.",
      ),
      target: "sunset",
      praise: L("Beautiful.", "बहुत सुंदर।", "Bahut sundar."),
      screen: [{ kind: "appBar", title: NEW_POST, back: close }, { kind: "photoGrid", photos }],
    },
    {
      id: "next",
      instruction: L(
        "Happy with the photo? Tap the button to go on.",
        "फ़ोटो पसंद है? आगे बढ़ने वाला बटन दबाएँ।",
        "Photo pasand hai? Aage badhne wala button dabaiye.",
      ),
      hint: L(
        "Not quite — look for the word Next at the top right.",
        "यह नहीं — ऊपर दाईं ओर “आगे” लिखा बटन ढूँढिए।",
        "Yeh nahi — upar right side pe “Next” likha button dhoondhiye.",
      ),
      target: "next",
      praise: L("Next takes you to the last step.", "“आगे” से आप आख़िरी कदम पर पहुँचते हैं।", "Next se aap aakhri step pe pahunchte hain."),
      screen: [
        {
          kind: "appBar",
          title: NEW_POST,
          back,
          actions: [{ id: "next", label: L("Next", "आगे", "Next"), text: L("Next", "आगे", "Next") }],
        },
        { kind: "photo", icon: "🌅", tone: "#fbe7ad" },
        {
          kind: "actions",
          align: "center",
          buttons: [
            { id: "filter", label: L("Filter", "फ़िल्टर", "Filter"), text: L("Filter", "फ़िल्टर", "Filter") },
            { id: "edit", label: L("Edit", "एडिट करें", "Edit"), text: L("Edit", "एडिट करें", "Edit") },
          ],
        },
      ],
    },
    {
      id: "share",
      instruction: L("Tap Share to post your photo.", "अपनी फ़ोटो पोस्ट करने के लिए “शेयर करें” दबाएँ।", "Apni photo post karne ke liye Share dabaiye."),
      hint: L(
        "Not quite — look for the blue Share button at the bottom.",
        "यह नहीं — नीचे नीला “शेयर करें” बटन ढूँढिए।",
        "Yeh nahi — neeche neela Share button dhoondhiye.",
      ),
      target: "share",
      screen: [
        { kind: "appBar", title: NEW_POST, back },
        { kind: "photo", icon: "🌅", tone: "#fbe7ad", small: true },
        { kind: "caption", placeholder: L("Write a caption…", "कैप्शन लिखें…", "Caption likhiye…") },
        {
          kind: "options",
          options: [
            { id: "tag", label: L("Tag people", "लोगों को टैग करें", "Logon ko tag kijiye"), icon: "🏷️" },
            { id: "location", label: L("Add location", "जगह जोड़ें", "Location jodiye"), icon: "📍" },
          ],
        },
        {
          kind: "actions",
          align: "center",
          buttons: [{ id: "share", label: L("Share", "शेयर करें", "Share"), text: L("Share", "शेयर करें", "Share"), tone: "#2563eb" }],
        },
      ],
    },
  ],
  done: L(
    "You posted a photo! Your family and friends can now see it.",
    "आपने फ़ोटो पोस्ट कर दी! अब आपका परिवार और दोस्त इसे देख सकते हैं।",
    "Aapne photo post kar di! Ab aapki family aur dost ise dekh sakte hain.",
  ),
};

const spotScam: PracticeExercise = {
  id: "spot-scam",
  title: L("Spot the scam message", "धोखे वाला मैसेज पहचानें", "Scam wala message pehchaniye"),
  intro: L(
    "Three messages. One is a scam. Can you find it?",
    "तीन मैसेज हैं। एक धोखा है। क्या आप उसे ढूँढ सकते हैं?",
    "Teen message hain. Ek scam hai. Kya aap use dhoondh sakte hain?",
  ),
  emoji: "🕵️",
  look: "inbox",
  topics: ["scams"],
  steps: [
    {
      id: "find-scam",
      instruction: L(
        "One of these messages is a scam. Tap the one you think is suspicious.",
        "इनमें से एक मैसेज धोखा है। जो आपको शक वाला लगे, उस पर टैप करें।",
        "Inmein se ek message scam hai. Jo aapko shak wala lage, us pe tap kijiye.",
      ),
      hint: L(
        "Not quite — that one looks normal. Look for a message that rushes you, has a strange link or asks for a code.",
        "यह नहीं — यह मैसेज ठीक लगता है। ऐसा मैसेज ढूँढिए जो जल्दी मचाए, अजीब लिंक दे या कोड माँगे।",
        "Yeh nahi — yeh message theek lagta hai. Aisa message dhoondhiye jo jaldi machaye, ajeeb link de ya code maange.",
      ),
      target: "bank",
      screen: [
        { kind: "appBar", title: L("Messages", "मैसेज", "Messages") },
        {
          kind: "inbox",
          messages: [
            {
              id: "priya",
              label: L("Message from Priya", "प्रिया का मैसेज", "Priya ka message"),
              sender: PRIYA,
              preview: L("Come for lunch on Sunday! 🍲", "रविवार को खाने पर आइए! 🍲", "Sunday ko lunch pe aaiye! 🍲"),
              time: "11:05",
              tone: "#e7798f",
            },
            {
              id: "bank",
              label: L("Message from BANK-ALERT", "BANK-ALERT का मैसेज", "BANK-ALERT ka message"),
              sender: L("BANK-ALERT", "BANK-ALERT", "BANK-ALERT"),
              preview: L(
                "URGENT! Your account is BLOCKED. Click bit.ly/kyc-now and enter the OTP within 10 minutes.",
                "ज़रूरी! आपका खाता बंद हो गया है। bit.ly/kyc-now पर क्लिक करें और 10 मिनट में OTP डालें।",
                "URGENT! Aapka account BLOCK ho gaya hai. bit.ly/kyc-now pe click kijiye aur 10 minute mein OTP daaliye.",
              ),
              time: "10:47",
              tone: "#8a8799",
            },
            {
              id: "pharmacy",
              label: L("Message from City Pharmacy", "सिटी फ़ार्मेसी का मैसेज", "City Pharmacy ka message"),
              sender: L("City Pharmacy", "सिटी फ़ार्मेसी", "City Pharmacy"),
              preview: L(
                "Your medicine is ready. Collect it from the shop any time today.",
                "आपकी दवा तैयार है। आज किसी भी समय दुकान से ले लीजिए।",
                "Aapki dawai taiyaar hai. Aaj kisi bhi time dukaan se le lijiye.",
              ),
              time: "9:30",
              tone: "#2e8a50",
            },
          ],
        },
      ],
    },
  ],
  done: L(
    "That's the scam. It rushes you (“URGENT”, “10 minutes”), it has a strange short link, and it asks for your OTP. A real bank never asks for your OTP. Don't tap the link: delete the message, or ask your family.",
    "यही धोखा है। यह जल्दी मचाता है (“ज़रूरी”, “10 मिनट”), इसमें अजीब छोटा लिंक है, और यह आपका OTP माँगता है। असली बैंक कभी OTP नहीं माँगता। लिंक न दबाएँ: मैसेज मिटा दें, या परिवार से पूछें।",
    "Yahi scam hai. Yeh jaldi machata hai (“URGENT”, “10 minute”), ismein ajeeb chhota link hai, aur yeh aapka OTP maangta hai. Asli bank kabhi OTP nahi maangta. Link mat dabaiye: message delete kar dijiye, ya family se poochiye.",
  ),
};

export const PRACTICE: readonly PracticeExercise[] = [sendPhoto, videoCall, postPhoto, spotScam];

export function getPractice(id: string | null | undefined): PracticeExercise | undefined {
  return PRACTICE.find((p) => p.id === id);
}

/** Every tappable thing on a screen, in reading order: the right one and the distractors. */
export function screenTaps(screen: readonly PracticeElement[]): PracticeTap[] {
  return screen.flatMap((el): readonly PracticeTap[] => {
    switch (el.kind) {
      case "appBar":
        return [...(el.back ? [el.back] : []), ...(el.actions ?? [])];
      case "chatList":
        return el.chats;
      case "composer":
        return el.tools;
      case "sheet":
      case "options":
        return el.options;
      case "photoGrid":
        return el.photos;
      case "actions":
      case "call":
        return el.buttons;
      case "inbox":
        return el.messages;
      case "tabBar":
        return el.tabs;
      default:
        return [];
    }
  });
}
