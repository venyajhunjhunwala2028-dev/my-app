import type { Messages } from "@/lib/i18n/en";

// Simple everyday Hindi in Devanagari. Common tech words that people already say (फ़ोन, स्क्रीन, ऐप, बटन) stay as they are.
// On-screen names from the phone (Share, Add to Home Screen) are shown in English too, because many phones show them that way.

export const hi: Messages = {
  // Shared
  "common.backHome": "होम पर वापस जाएँ",
  "common.home": "होम",
  "common.goHome": "होम पर जाएँ",
  "common.tryAgain": "फिर से कोशिश करें",
  "common.speak": "बोलें",
  "common.listening": "सुन रहा हूँ…",
  "common.listeningTapStop": "सुन रहा हूँ… रोकने के लिए दबाएँ",
  "common.ask": "पूछें",
  "common.send": "भेजें",
  "common.yes": "हाँ",
  "common.no": "नहीं",
  "common.done": "हो गया",
  "common.thinking": "सोच रहा हूँ, एक पल रुकिए…",
  "common.iUnderstand": "ठीक है, समझ लिया",
  "common.thankYou": "धन्यवाद।",

  // Home
  "home.title": "Tech Helper",
  "home.navLabel": "आप क्या करना चाहते हैं?",
  "home.ask": "सवाल पूछें",
  "home.press": "क्या दबाऊँ?",
  "home.scam": "क्या यह धोखा है?",
  "home.family": "परिवार से पूछें",
  "home.learn": "मुझे सिखाइए",
  "home.library": "मदद की लाइब्रेरी",

  // Teach me
  "learn.title": "मुझे सिखाइए",
  "learn.intro": "एक पाठ चुनें। मैं आपको एक-एक कदम करके दिखाऊँगा।",
  "learn.progress": "आपने {total} में से {done} पाठ पूरे कर लिए हैं",

  // Help library
  "library.title": "मदद की लाइब्रेरी",
  "library.intro": "एक विषय चुनें, फिर कोई सवाल दबाएँ।",
  "library.allTopics": "सभी विषय",
  "library.pickQuestion": "कोई सवाल दबाएँ:",

  // Ask box
  "ask.label": "आपको किस चीज़ में मदद चाहिए?",
  "ask.youAsked": "आपने पूछा:",
  "ask.different": "कोई दूसरा सवाल पूछें",
  "ask.couldAsk": "आप ऐसे पूछ सकते हैं:",
  "ask.speakingLanguage": "बोलने की भाषा:",
  "ask.changeLanguage": "भाषा बदलें",
  "ask.whichLanguage": "आप किस भाषा में बोलेंगे?",
  "ask.mic.denied": "माइक की इजाज़त नहीं है। आप अपना सवाल बॉक्स में लिख सकते हैं।",
  "ask.mic.noSpeech": "मुझे कुछ सुनाई नहीं दिया।",
  "ask.mic.failed": "माइक नहीं चला। आप अपना सवाल बॉक्स में लिख सकते हैं।",

  // Voice typing in other boxes
  "mic.denied": "माइक की इजाज़त नहीं है। आप बॉक्स में लिख सकते हैं।",
  "mic.noSpeech": "मुझे कुछ सुनाई नहीं दिया। फिर से कोशिश करने के लिए “बोलें” दबाएँ।",
  "mic.failed": "माइक नहीं चला। आप बॉक्स में लिख सकते हैं।",

  // Guide page
  "guide.notFound": "मुझे यह गाइड नहीं मिली",
  "answer.anotherWay": "दूसरा तरीका",
  "answer.showMeHow": "करके दिखाइए",
  "answer.explainOther": "इसे अंग्रेज़ी में समझाइए",

  // Step player
  "steps.progress": "कुल {total} में से चरण {step}",
  "steps.cheer": "बहुत बढ़िया, आप कर रहे हैं।",
  "steps.safetyLabel": "सावधानी",
  "steps.previous": "पिछला चरण",
  "steps.lookFor": "यह ढूँढें: {text}",
  "steps.pause": "रोकें",
  "steps.play": "सुनें",
  "steps.replay": "फिर से सुनें",
  "steps.slower": "धीमी आवाज़",
  "steps.showAgain": "फिर से दिखाइए",
  "steps.stuck": "मुझे दिक्कत आ रही है",
  "steps.showOnScreen": "मेरी स्क्रीन पर दिखाइए",
  "steps.backToMyStep": "मेरे चरण पर वापस जाएँ",
  "steps.helpLabel": "इस चरण में मदद",
  "steps.troubleHeading": "क्या परेशानी है?",
  "steps.trouble.cantFind": "मुझे यह मिल नहीं रहा",
  "steps.trouble.different": "मेरी स्क्रीन अलग दिख रही है",
  "steps.trouble.nothing": "दबाने पर कुछ नहीं होता",
  "steps.somethingElse": "कुछ और",
  "steps.tellWrong": "बताइए, क्या गड़बड़ है",
  "steps.backToStep": "चरण पर वापस जाएँ",
  "steps.playHelp": "यह मदद सुनें",
  "steps.replayHelp": "यह मदद फिर से सुनें",
  "steps.simpler": "और आसान करके समझाइए",
  "steps.askSpecific": "कुछ खास पूछें",
  "steps.next": "हो गया, अगला चरण",

  // Finished
  "success.title": "आपने कर दिखाया!",
  "success.saved": "यह गाइड “मेरी पिछली मदद” में रखी है, ताकि आप इसे फिर से कर सकें।",
  "success.goHome": "होम पर जाएँ",
  "success.another": "दूसरा सवाल पूछें",
  "success.learn": "कुछ और सीखें",
  "success.helpful": "क्या इससे मदद मिली?",
  "success.thanks": "बताने के लिए धन्यवाद।",

  // Show me on my screen / What do I press?
  "press.title": "क्या दबाऊँ?",
  "show.bigger": "तस्वीर बड़ी करें",
  "show.smaller": "तस्वीर छोटी करें",
  "show.tapBigger": "तस्वीर बड़ी करने के लिए उस पर दबाएँ।",
  "show.tapSmaller": "तस्वीर छोटी करने के लिए उस पर दबाएँ।",
  "show.yourScreenshot": "आपका स्क्रीनशॉट",
  "show.chosenScreenshot": "आपका चुना हुआ स्क्रीनशॉट",
  "show.anotherScreen": "किसी दूसरी स्क्रीन के बारे में पूछें",
  "show.notFound": "यह आपकी स्क्रीन पर नहीं मिला",
  "show.whichDevice": "आप कौन-सा फ़ोन या कंप्यूटर इस्तेमाल कर रहे हैं?",
  "show.whatToDo": "आप क्या करना चाहते हैं?",
  "show.example": "जैसे: यह फ़ोटो भेजनी है, या वाई-फ़ाई चालू करना है।",
  "show.noQuestion": "कृपया बोलकर या लिखकर बताइए कि आप क्या करना चाहते हैं।",
  "show.showMe": "दिखाइए",
  "show.differentScreenshot": "दूसरा स्क्रीनशॉट चुनें",
  "show.takeFirst": "पहले, स्क्रीनशॉट लीजिए",
  "show.whatIsScreenshot": "स्क्रीनशॉट आपकी स्क्रीन की तस्वीर होती है। जिस स्क्रीन पर मदद चाहिए, वहाँ जाइए, फिर:",
  "show.comeBack": "फिर इस ऐप पर वापस आइए।",
  "show.choose": "अपना स्क्रीनशॉट चुनें",
  "show.pickNewest": "सबसे नई तस्वीर चुनें, जो आपने अभी ली है।",
  "privacy.screenshot":
    "बैंक ऐप, पासवर्ड या निजी मैसेज के स्क्रीनशॉट न भेजें। यह ऐप आपका स्क्रीनशॉट नहीं रखता; उसे पढ़ने के लिए एक AI सेवा को भेजा जाता है।",

  // How to take a screenshot, per device
  "howTo.iPhone.1": "साइड वाला बटन और आवाज़ बढ़ाने वाला बटन एक साथ दबाकर छोड़ दें।",
  "howTo.iPhone.2": "अगर आपके iPhone में नीचे गोल होम बटन है, तो साइड वाला बटन और होम बटन एक साथ दबाएँ।",
  "howTo.android.1": "पावर बटन और आवाज़ कम करने वाला बटन एक साथ दबाकर छोड़ दें।",
  "howTo.iPad.1": "ऊपर वाला बटन और कोई एक आवाज़ वाला बटन एक साथ दबाकर छोड़ दें।",
  "howTo.iPad.2": "अगर आपके iPad में गोल होम बटन है, तो ऊपर वाला बटन और होम बटन एक साथ दबाएँ।",
  "howTo.windows.1": "Windows की और Print Screen की (PrtSc) एक साथ दबाएँ।",
  "howTo.windows.2": "तस्वीर Pictures में, Screenshots फ़ोल्डर में रखी जाती है।",
  "howTo.mac.1": "Shift, Command और 3 एक साथ दबाएँ।",
  "howTo.mac.2": "तस्वीर आपके डेस्कटॉप पर आ जाती है।",
  "howTo.other": "जैसे आप हमेशा स्क्रीन की तस्वीर लेते हैं, वैसे ही लीजिए।",

  // Picture problems
  "image.notPicture": "यह तस्वीर नहीं है। कृपया वही स्क्रीनशॉट चुनें जो आपने अभी लिया है।",
  "image.tooBig": "यह तस्वीर बहुत बड़ी है। कृपया वही स्क्रीनशॉट चुनें जो आपने अभी लिया है।",
  "image.cantOpen": "माफ़ कीजिए, यह तस्वीर खुल नहीं पाई। कृपया अपना स्क्रीनशॉट फिर से चुनें।",

  // Is this a scam?
  "scam.title": "क्या यह धोखा है?",
  "scam.intro": "कोई मैसेज, ईमेल या लिंक आया है और आपको भरोसा नहीं है? मैं उसे जाँच दूँगा।",
  "scam.neverShare": "OTP, पासवर्ड, PIN या कार्ड नंबर कभी किसी को न बताएँ।",
  "scam.nothing": "कृपया पहले कोई मैसेज चिपकाएँ या स्क्रीनशॉट जोड़ें।",
  "scam.privacy":
    "स्क्रीनशॉट जोड़ने से पहले देख लें कि उसमें कोई पासवर्ड, कोड या बैंक की जानकारी न हो। यह ऐप आपका स्क्रीनशॉट नहीं रखता; उसे जाँचने के लिए एक AI सेवा को भेजा जाता है।",
  "scam.verdict.safe": "सुरक्षित लगता है",
  "scam.verdict.careful": "सावधान रहें",
  "scam.verdict.scam": "शायद धोखा है",
  "scam.pasteLabel": "मैसेज, ईमेल या लिंक यहाँ चिपकाएँ",
  "scam.pasteHint": "बॉक्स में उँगली दबाकर रखें, फिर “Paste” या “चिपकाएँ” दबाएँ।",
  "scam.orScreenshot": "या स्क्रीनशॉट जोड़ें",
  "scam.added": "स्क्रीनशॉट जुड़ गया।",
  "scam.remove": "स्क्रीनशॉट हटाएँ",
  "scam.add": "स्क्रीनशॉट जोड़ें",
  "scam.check": "जाँच करें",
  "scam.checkElse": "कुछ और जाँचें",

  // Safety notices
  "safety.scam.heading": "रुकिए — यह धोखा लगता है",
  "safety.scam.message": "कोई कोड, पासवर्ड या बैंक की जानकारी न बताएँ। पहले किसी भरोसे वाले को फ़ोन करें।",
  "safety.money.heading": "मैं पैसे भेजने में मदद नहीं कर सकता",
  "safety.money.message": "पैसे और पेमेंट के लिए किसी भरोसे वाले व्यक्ति से मदद लें।",
  "safety.limit.heading": "आज के लिए इतना ही",
  "safety.limit.message": "आज आपने बहुत सारे सवाल पूछ लिए हैं। कल फिर से मदद मिलेगी।",

  // Errors
  "errors.setup": "माफ़ कीजिए, अभी यह काम नहीं कर रहा है।",
  "errors.retry": "माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।",
  "errors.too_long": "यह बहुत लंबा है। कृपया थोड़ा छोटा करके फिर से कोशिश करें।",
  "errors.bad_request": "माफ़ कीजिए, कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।",

  // Call family
  "family.isRight": "क्या यह सही है?",
  "family.change": "बदलें",
  "family.callName": "{name} को फ़ोन करें",
  "family.call": "फ़ोन करें",
  "family.whatsapp": "WhatsApp",
  "family.changeContact": "परिवार का नंबर बदलें",
  "family.who": "मदद के लिए किसे फ़ोन करें?",
  "family.name": "नाम",
  "family.phone": "फ़ोन नंबर (देश के कोड के साथ, जैसे +91)",
  "family.save": "सेव करें",

  // iPhone install guide
  "install.title": "पहले, Tech Helper को होम स्क्रीन पर लगाइए",
  "install.forHelper": "परिवार में जो मदद कर रहे हैं, उनके लिए: कुछ भी सेट करने से पहले यह कर लें।",
  "install.step1": "स्क्रीन के नीचे {share} बटन दबाएँ। यह एक चौकोर डिब्बे जैसा है, जिसमें से तीर ऊपर की ओर निकलता है।",
  "install.share": "शेयर (Share)",
  "install.step2": "नीचे सरकाएँ और {add} दबाएँ।",
  "install.addToHome": "होम स्क्रीन में जोड़ें (Add to Home Screen)",
  "install.step3": "{add} दबाएँ।",
  "install.add": "जोड़ें (Add)",
  "install.step4": "Safari बंद करें और होम स्क्रीन पर बने नए आइकन से Tech Helper खोलें।",
  "install.step5": "अब से Tech Helper हमेशा इसी आइकन से खोलें, Safari से नहीं।",
  "install.continue": "फिर भी आगे बढ़ें",

  // Settings
  "settings.open": "सेटिंग्स",
  "settings.heading": "सेटिंग्स",
  "settings.language": "भाषा",
  "settings.textSize": "अक्षरों का आकार",
  "settings.size.normal": "सामान्य",
  "settings.size.large": "बड़ा",
  "settings.size.xl": "बहुत बड़ा",
  "settings.device": "आपका फ़ोन या कंप्यूटर",
  "settings.level": "मैं कैसे समझाऊँ?",
  "settings.level.very_simple": "बहुत आसान",
  "settings.level.simple": "आसान",
  "settings.level.detailed": "पूरी जानकारी के साथ",
  "settings.voice": "चरण बोलकर सुनाएँ",
  "settings.voiceOn": "आवाज़ चालू",
  "settings.voiceOff": "आवाज़ बंद",
  "settings.speed": "आवाज़ की रफ़्तार",
  "settings.normalSpeed": "सामान्य रफ़्तार",
  "settings.slower": "धीमी आवाज़",
  "settings.privacy":
    "आपकी पिछली मदद और सेटिंग्स इसी फ़ोन पर रहती हैं। स्क्रीनशॉट सिर्फ़ पढ़ने के लिए भेजे जाते हैं, रखे नहीं जाते।",

  // Device names as shown
  "device.iPhone": "iPhone",
  "device.android": "Android फ़ोन",
  "device.iPad": "iPad",
  "device.iPadOrTablet": "iPad या टैबलेट",
  "device.windows": "Windows कंप्यूटर",
  "device.mac": "Mac",

  // My previous help
  "history.heading": "मेरी पिछली मदद",
  "history.empty": "आप जो मदद माँगेंगे, वह यहाँ दिखेगी, ताकि आप उसे फिर से देख सकें।",
  "history.today": "आज",
  "history.yesterday": "कल",
  "history.delete": "मिटाएँ",
  "history.deleteItem": "मिटाएँ: {question}",
  "history.deleteAll": "मेरी पूरी हिस्ट्री मिटाएँ",
  "history.confirm": "क्या आप पक्का मिटाना चाहते हैं? यह वापस नहीं आएगा।",
  "history.showMore": "और दिखाएँ",
};
