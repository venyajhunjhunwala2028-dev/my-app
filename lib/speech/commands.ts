// "Talk me through it": the few spoken words the step screen listens for, in English, Hindi and Hinglish.
// Pure and deterministic, so it is easy to test; the step screen decides what each command does.

/** next: go to the next step; repeat: read this step again; stuck: open "I'm stuck"; back: previous step; stop: end voice help. */
export type VoiceCommand = "next" | "repeat" | "stuck" | "back" | "stop";

/**
 * Checked in this order, so "I'm stuck, not done" is stuck and "stop, go back" is stop.
 * Each phrase must appear as whole words. Hindi in Devanagari and Hinglish in Latin letters are both listed,
 * because speech recognition writes Hindi either way depending on the language it listens in.
 */
const PHRASES: readonly [VoiceCommand, readonly string[]][] = [
  [
    "stop",
    [
      "stop",
      "stop it",
      "quit",
      "exit",
      "be quiet",
      "stop talking",
      "bas",
      "bas karo",
      "bas kijiye",
      "band karo",
      "band kijiye",
      "ruko",
      "ruk jao",
      "rukiye",
      "बस",
      "बंद करो",
      "बंद कीजिए",
      "रुको",
      "रुकिए",
      "रुक जाओ",
    ],
  ],
  [
    "stuck",
    [
      "stuck",
      "i'm stuck",
      "im stuck",
      "help",
      "help me",
      "i need help",
      "i can't",
      "i cant",
      "can't find",
      "cant find",
      "cannot find",
      "not working",
      "doesn't work",
      "didn't work",
      "it didn't work",
      "not done",
      "i don't understand",
      "madad",
      "madad karo",
      "madad kijiye",
      "help karo",
      "atak gaya",
      "atak gayi",
      "atka",
      "nahi mil raha",
      "nahi mila",
      "nahi hua",
      "nahi ho raha",
      "samajh nahi",
      "samajh nahi aaya",
      "मदद",
      "मदद करो",
      "मदद कीजिए",
      "अटक गया",
      "अटक गई",
      "नहीं मिल रहा",
      "नहीं मिला",
      "नहीं हुआ",
      "नहीं हो रहा",
      "समझ नहीं",
    ],
  ],
  [
    "back",
    [
      "back",
      "go back",
      "previous",
      "previous step",
      "last step",
      "peeche",
      "piche",
      "pichhe",
      "peechhe",
      "pichla",
      "pichhla",
      "wapas",
      "vapas",
      "पीछे",
      "पिछला",
      "वापस",
    ],
  ],
  [
    "repeat",
    [
      "repeat",
      "again",
      "say again",
      "say that again",
      "one more time",
      "once more",
      "pardon",
      "what",
      "sorry",
      "phir se",
      "fir se",
      "phirse",
      "firse",
      "dobara",
      "dubara",
      "ek baar aur",
      "फिर से",
      "फिरसे",
      "दोबारा",
      "दुबारा",
      "एक बार और",
    ],
  ],
  [
    "next",
    [
      "done",
      "i'm done",
      "im done",
      "i did it",
      "did it",
      "i have done it",
      "i've done it",
      "finished",
      "next",
      "next step",
      "ok next",
      "okay next",
      "yes",
      "got it",
      "ho gaya",
      "ho gayi",
      "hogaya",
      "kar liya",
      "kar diya",
      "aage",
      "aage chalo",
      "agla",
      "हो गया",
      "हो गई",
      "हो गयी",
      "कर लिया",
      "कर दिया",
      "आगे",
      "अगला",
      "हाँ",
    ],
  ],
];

/** Lower case, curly quotes straightened, punctuation (in any script) turned into spaces, spaces squeezed. */
export function normalizeSpoken(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^\p{L}\p{M}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const contains = (spoken: string, phrase: string) => ` ${spoken} `.includes(` ${phrase} `);

/** The command in what the learner said, or null when it is not one we listen for. */
export function matchVoiceCommand(transcript: string): VoiceCommand | null {
  const spoken = normalizeSpoken(transcript);
  if (!spoken) return null;
  for (const [command, phrases] of PHRASES) {
    if (phrases.some((p) => contains(spoken, normalizeSpoken(p)))) return command;
  }
  return null;
}
