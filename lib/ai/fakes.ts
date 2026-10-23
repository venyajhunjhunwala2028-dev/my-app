import type { AskAnswer, AskRequest } from "./schemas";
import { warningFor } from "@/lib/safety/stepWarnings";

// Fixed answers for FAKE_AI=1: tests and e2e run without calling Claude.

const explain = (title: string, text: string, alternative: string | null = null): AskAnswer => ({
  kind: "explanation",
  language: "en",
  title,
  text,
  offerShowMeHow: false,
  alternative,
});

export function fakeAskAnswer(req: AskRequest): AskAnswer {
  const q = req.question.toLowerCase();
  const device = req.devices?.[0] ?? null;
  const step = req.guideContext?.steps[req.guideContext.stepIndex] ?? "this step";

  switch (req.mode) {
    case "followup":
      return explain(
        "This step, more simply",
        `Let's go slowly. "${step}" means: look at your screen, find that button, and tap it once with one finger.`,
      );
    case "showAgain":
      return explain(
        "Another way to see this step",
        `Think of your screen like a page in a book. "${step}" means: find that place on the page, then touch it gently once.`,
      );
    case "simpler":
      return explain("This step, in a few words", `Find it. Touch it once. That's all.`);
    case "stuck":
      return explain(
        "Let's sort this out",
        `No problem. Take your time. If you can't see it, tap the back arrow once, then look again. The step is: "${step}"`,
        "Or, swipe down from the middle of the screen and type the app's name in the search box.",
      );
  }
  if (req.mode !== "showMeHow") {
    if (q.includes("bank called")) {
      return {
        kind: "scam_warning",
        language: "en",
        message: "This looks like a scam. Do not share any code. Please call your family.",
      };
    }
    if (q === "help" || q.includes("not sure")) {
      return {
        kind: "unclear",
        language: "en",
        message: "I'm not completely sure what you mean. Tell me what you are trying to do, and I'll help.",
        examples: ["How do I make a video call on WhatsApp?", "How do I make the text bigger?", "How do I send a photo?"],
      };
    }
    if (q.includes("post a picture") && !req.app) {
      return {
        kind: "clarify",
        language: "en",
        prompt: "Which app do you want to post the picture on?",
        options: ["Instagram", "WhatsApp", "Facebook"],
        about: "app",
      };
    }
    if (q.includes("what is")) {
      return {
        kind: "explanation",
        language: "en",
        title: "What it is",
        text: "It is an app you can talk to by typing or speaking. You ask a question and it writes an answer for you.",
        offerShowMeHow: true,
        alternative: null,
      };
    }
    if (q.includes("text bigger") && !req.devices?.length) {
      return {
        kind: "needs_device",
        language: "en",
        prompt: "Which device are you using?",
        options: ["iPhone", "Android phone", "Windows computer", "Mac", "TV"],
      };
    }
  }
  if (req.app && req.app !== "Instagram") {
    return {
      kind: "steps",
      language: "en",
      title: `Post a picture on ${req.app}`,
      device,
      app: req.app,
      safety: null,
      steps: [
        {
          instruction: `Open ${req.app}.`,
          lookFor: `The ${req.app} icon on your home screen.`,
          spoken: `Open ${req.app}.`,
          encouragement: "Great!",
        },
        {
          instruction: "Tap the + button.",
          lookFor: "A + sign, usually at the bottom or top of the screen.",
          spoken: "Tap the plus button.",
          encouragement: "Well done.",
        },
        {
          instruction: "Choose a photo and tap Send.",
          lookFor: "Your photos fill the screen. Send is at the bottom.",
          spoken: "Tap a photo, then tap Send.",
          encouragement: "",
        },
      ],
      screenshotHowTo: [
        "Press the side button and the volume up button at the same time.",
        "Let go quickly. You will see a small picture in the corner.",
      ],
    };
  }
  return {
    kind: "steps",
    language: "en",
    title: "Post a story on Instagram",
    device,
    app: "Instagram",
    safety: warningFor(req.question, "en"),
    steps: [
      {
        instruction: "Open Instagram.",
        lookFor: "A square icon with a camera outline, in pink and orange colours.",
        spoken: "Open Instagram. It is the pink and orange square with a camera drawing.",
        encouragement: "Great!",
      },
      {
        instruction: "Tap your picture at the top left.",
        lookFor: "Your round photo with a small blue + at the top left of the screen.",
        spoken: "Tap your round photo at the top left of the screen.",
        encouragement: "Well done. You're doing well.",
      },
      {
        instruction: "Choose a photo and tap Share.",
        lookFor: "Your photos fill the screen. The Share button is at the bottom.",
        spoken: "Tap a photo, then tap Share at the bottom.",
        encouragement: "",
      },
    ],
    screenshotHowTo: [
      "Press the side button and the volume up button at the same time.",
      "Let go quickly. You will see a small picture in the corner.",
    ],
  };
}
