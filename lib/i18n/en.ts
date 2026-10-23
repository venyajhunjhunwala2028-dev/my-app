// The English interface text. Every other locale must have exactly these keys (see `Messages`).
// {name} marks a value filled in by `t(key, { name })`. AI answers are not here: they come in the answer language.

export const en = {
  // Shared
  "common.backHome": "Back to home",
  "common.home": "Home",
  "common.goHome": "Go to Home",
  "common.tryAgain": "Try again",
  "common.speak": "Speak",
  "common.listening": "Listening…",
  "common.listeningTapStop": "Listening… tap to stop",
  "common.ask": "Ask",
  "common.send": "Send",
  "common.yes": "Yes",
  "common.no": "No",
  "common.done": "Done",
  "common.thinking": "Thinking, one moment…",
  "common.iUnderstand": "I understand",
  "common.thankYou": "Thank you.",

  // Home
  "home.title": "Tech Helper",
  "home.navLabel": "What would you like to do?",
  "home.ask": "Ask a question",
  "home.press": "What do I press?",
  "home.scam": "Is this a scam?",
  "home.family": "Ask my family",
  "home.callFamily": "Call my family",
  "home.learn": "Teach me",
  "home.library": "Help library",

  // Teach me
  "learn.title": "Teach me",
  "learn.intro": "Pick a lesson. I'll show you how, one step at a time.",
  "learn.progress": "You've finished {done} of {total} lessons",

  // Help library
  "library.title": "Help library",
  "library.intro": "Choose a topic, then tap a question.",
  "library.allTopics": "All topics",
  "library.pickQuestion": "Tap a question:",

  // Ask box
  "ask.label": "What do you need help with?",
  "ask.youAsked": "You asked:",
  "ask.different": "Ask a different question",
  "ask.couldAsk": "You could ask:",
  "ask.speakingLanguage": "Speaking language:",
  "ask.changeLanguage": "Change language",
  "ask.whichLanguage": "Which language will you speak?",
  "ask.mic.denied": "The microphone is not allowed. You can type your question in the box instead.",
  "ask.mic.noSpeech": "I didn't hear anything.",
  "ask.mic.failed": "The microphone didn't work. You can type your question in the box instead.",

  // Voice typing in other boxes
  "mic.denied": "The microphone is not allowed. You can type in the box instead.",
  "mic.noSpeech": "I didn't hear anything. Tap Speak to try again.",
  "mic.failed": "The microphone didn't work. You can type in the box instead.",

  // Guide page
  "guide.notFound": "I couldn't find that guide",
  "answer.anotherWay": "Another way",
  "answer.showMeHow": "Show me how",
  /** Names the language in `LocaleInfo.otherLanguage`: Hindi for English, English for every other locale. */
  "answer.explainOther": "Explain this in Hindi",

  // Step player
  "steps.progress": "Step {step} of {total}",
  "steps.cheer": "Great, you're doing it.",
  "steps.safetyLabel": "Safety warning",
  "steps.previous": "Previous step",
  "steps.lookFor": "Look for: {text}",
  "steps.pause": "Pause",
  "steps.play": "Play",
  "steps.replay": "Replay",
  "steps.slower": "Slower voice",
  "steps.showAgain": "Show me again",
  "steps.stuck": "I'm stuck",
  "steps.showOnScreen": "Show me on my screen",
  "steps.backToMyStep": "Back to my step",
  "steps.helpLabel": "Help with this step",
  "steps.troubleHeading": "What's the trouble?",
  "steps.trouble.cantFind": "I can't find it",
  "steps.trouble.different": "My screen looks different",
  "steps.trouble.nothing": "Nothing happens",
  "steps.somethingElse": "Something else",
  "steps.tellWrong": "Tell me what is wrong",
  "steps.backToStep": "Back to the step",
  "steps.playHelp": "Play this help",
  "steps.replayHelp": "Replay this help",
  "steps.simpler": "Explain more simply",
  "steps.askSpecific": "Ask something specific",
  "steps.next": "Done, next step",

  // Finished
  "success.title": "You did it!",
  "success.saved": "This guide is saved in My previous help if you want to do it again.",
  "success.goHome": "Go home",
  "success.another": "Ask another question",
  "success.learn": "Learn something else",
  "success.helpful": "Was this helpful?",
  "success.thanks": "Thank you for telling us.",

  // Show me on my screen / What do I press?
  "press.title": "What do I press?",
  "show.bigger": "Make the picture bigger",
  "show.smaller": "Make the picture smaller",
  "show.tapBigger": "Tap the picture to make it bigger.",
  "show.tapSmaller": "Tap the picture to make it smaller.",
  "show.yourScreenshot": "Your screenshot",
  "show.chosenScreenshot": "The screenshot you chose",
  "show.anotherScreen": "Ask about another screen",
  "show.notFound": "I couldn't find it on your screen",
  "show.whichDevice": "Which device are you using?",
  "show.whatToDo": "What do you want to do?",
  "show.example": "For example: send this photo, or turn on wifi.",
  "show.noQuestion": "Please say or type what you want to do.",
  "show.showMe": "Show me",
  "show.differentScreenshot": "Choose a different screenshot",
  "show.takeFirst": "First, take a screenshot",
  "show.whatIsScreenshot": "A screenshot is a picture of your screen. Go to the screen you need help with, then:",
  "show.comeBack": "Then come back to this app.",
  "show.choose": "Choose your screenshot",
  "show.pickNewest": "Pick the newest picture, the one you just took.",
  "privacy.screenshot":
    "Don't send screenshots of bank apps, passwords or private messages. This app doesn't save your screenshot; it's sent to an AI service to be read.",

  // How to take a screenshot, per device
  "howTo.iPhone.1": "Press the side button and the volume up button at the same time, then let go.",
  "howTo.iPhone.2": "If your iPhone has a round Home button, press the side button and the Home button together.",
  "howTo.android.1": "Press the power button and the volume down button at the same time, then let go.",
  "howTo.iPad.1": "Press the top button and a volume button at the same time, then let go.",
  "howTo.iPad.2": "If your iPad has a round Home button, press the top button and the Home button together.",
  "howTo.windows.1": "Press the Windows key and the Print Screen key (PrtSc) at the same time.",
  "howTo.windows.2": "The picture is saved in Pictures, in the Screenshots folder.",
  "howTo.mac.1": "Press Shift, Command and 3 at the same time.",
  "howTo.mac.2": "The picture appears on your desktop.",
  "howTo.other": "Take a picture of your screen the way you usually do.",

  // Picture problems
  "image.notPicture": "That is not a picture. Please choose the screenshot you just took.",
  "image.tooBig": "That picture is too big. Please choose the screenshot you just took.",
  "image.cantOpen": "Sorry, that picture could not be opened. Please choose your screenshot again.",

  // Is this a scam?
  "scam.title": "Is this a scam?",
  "scam.intro": "Got a message, email or link you are not sure about? I will check it for you.",
  "scam.neverShare": "Never share OTPs, passwords, PINs or card numbers with anyone.",
  "scam.nothing": "Please paste a message or add a screenshot first.",
  "scam.privacy":
    "Before you add a screenshot, make sure it shows no passwords, codes or bank details. This app doesn't save your screenshot; it's sent to an AI service to be checked.",
  "scam.verdict.safe": "Looks safe",
  "scam.verdict.careful": "Be careful",
  "scam.verdict.scam": "Possible scam",
  "scam.pasteLabel": "Paste a message, email or link",
  "scam.pasteHint": "Press and hold in the box, then tap Paste.",
  "scam.orScreenshot": "Or add a screenshot",
  "scam.added": "Screenshot added.",
  "scam.remove": "Remove screenshot",
  "scam.add": "Add a screenshot",
  "scam.check": "Check it",
  "scam.checkElse": "Check something else",

  // Safety notices
  "safety.scam.heading": "Stop — this looks like a scam",
  "safety.scam.message": "Do not share any codes, passwords or bank details. Call someone you trust first.",
  "safety.money.heading": "I can't help with sending money",
  "safety.money.message": "Please ask someone you trust to help you with money and payments.",
  "safety.limit.heading": "That's all for today",
  "safety.limit.message": "You have asked a lot of questions today. The helper will be ready again tomorrow.",

  // Errors (English shows the server's own message; other locales use these)
  "errors.setup": "Sorry, this isn't working right now.",
  "errors.retry": "Sorry, something went wrong. Please try again.",
  "errors.too_long": "That is too long. Please make it shorter and try again.",
  "errors.bad_request": "Sorry, something went wrong. Please try again.",

  // Call family
  "family.isRight": "Is this right?",
  "family.change": "Change",
  "family.callName": "Call {name}",
  "family.call": "Call",
  "family.whatsapp": "WhatsApp",
  "family.changeContact": "Change family contact",
  "family.who": "Who should we call for help?",
  "family.name": "Name",
  "family.phone": "Phone number (with country code, like +44)",
  "family.save": "Save",

  // Ask my family
  "askFamily.title": "Ask my family",
  "askFamily.open": "Ask my family for help",
  "askFamily.close": "Close",
  "askFamily.willSend": "This message will be sent to {name}:",
  "askFamily.chooseWho": "This message will be sent to the person you choose:",
  "askFamily.noContact": "You haven't saved a family contact yet. Add one here, or just send the message and choose who gets it.",
  "askFamily.whatsapp": "Send on WhatsApp",
  "askFamily.sms": "Send a text message",
  "askFamily.share": "Share another way",
  "askFamily.shareWithPicture": "Send with my picture",
  "askFamily.addPicture": "Add a picture of my screen",
  "askFamily.privacy":
    "Don't add screenshots of bank apps, passwords, OTPs or private messages. The picture goes straight from your phone to your family. Tech Helper never uploads or saves it.",
  "askFamily.pictureAdded": "Picture added. Tap Send with my picture to send it with the message.",
  "askFamily.removePicture": "Remove the picture",
  "askFamily.shareFailed": "That didn't work. Please try WhatsApp or a text message.",
  "askFamily.msg.goal": "I need help with: {goal}",
  "askFamily.msg.generic": "I need help with my phone",
  "askFamily.msg.step": "I'm on step {step} of {total}: {instruction}",
  "askFamily.msg.stepOnly": "I'm on step {step} of {total}.",
  "askFamily.msg.from": "Sent from Tech Helper",

  // iPhone install guide
  "install.title": "First, put Tech Helper on the home screen",
  "install.forHelper": "For the family helper: please do this before setting anything up.",
  "install.step1": "Tap the {share} button at the bottom of the screen. It looks like a square with an arrow pointing up.",
  "install.share": "Share",
  "install.step2": "Scroll down and tap {add}.",
  "install.addToHome": "Add to Home Screen",
  "install.step3": "Tap {add}.",
  "install.add": "Add",
  "install.step4": "Close Safari and open Tech Helper from the new icon on the home screen.",
  "install.step5": "From now on, always use Tech Helper from the icon, not from Safari.",
  "install.continue": "Continue anyway",

  // Settings
  "settings.open": "Settings",
  "settings.heading": "Settings",
  "settings.language": "Language",
  "settings.textSize": "Text size",
  "settings.size.normal": "Normal",
  "settings.size.large": "Large",
  "settings.size.xl": "Extra large",
  "settings.device": "Your device",
  "settings.level": "How should I explain?",
  "settings.level.very_simple": "Very simple",
  "settings.level.simple": "Simple",
  "settings.level.detailed": "Detailed",
  "settings.voice": "Read steps aloud",
  "settings.voiceOn": "Voice on",
  "settings.voiceOff": "Voice off",
  "settings.speed": "Voice speed",
  "settings.normalSpeed": "Normal speed",
  "settings.slower": "Slower voice",
  "settings.privacy":
    "Your help history and settings stay on this phone. Screenshots are sent to read them and are not saved.",

  // Device names as shown (the English name is what is saved and sent)
  "device.iPhone": "iPhone",
  "device.android": "Android phone",
  "device.iPad": "iPad",
  "device.iPadOrTablet": "iPad or tablet",
  "device.windows": "Windows computer",
  "device.mac": "Mac",

  // My previous help
  "history.heading": "My previous help",
  "history.empty": "Help you ask for will appear here, so you can use it again.",
  "history.today": "Today",
  "history.yesterday": "Yesterday",
  "history.delete": "Delete",
  "history.deleteItem": "Delete: {question}",
  "history.deleteAll": "Delete all my history",
  "history.confirm": "Are you sure? This can't be undone.",
  "history.showMore": "Show more",
} as const;

/** Every locale's catalog has exactly these keys, each a string. */
export type Messages = { readonly [K in keyof typeof en]: string };
export type MessageKey = keyof Messages;
