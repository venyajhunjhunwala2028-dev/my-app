import type { AskAnswer, AskRequest } from "./schemas";

// Fixed answers for FAKE_AI=1 (KTD10): tests and e2e run without calling Claude.

export function fakeAskAnswer(req: AskRequest): AskAnswer {
  const q = req.question.toLowerCase();
  const device = req.devices?.[0] ?? null;

  if (req.mode === "followup") {
    const step = req.guideContext?.steps[req.guideContext.stepIndex] ?? "this step";
    return {
      kind: "explanation",
      language: "en",
      title: "This step, more simply",
      text: `Let's go slowly. "${step}" means: look at your screen, find that button, and tap it once with one finger.`,
      offerShowMeHow: false,
    };
  }
  if (req.mode !== "showMeHow") {
    if (q.includes("bank called")) {
      return {
        kind: "scam_warning",
        language: "en",
        message: "This looks like a scam. Do not share any code. Please call your family.",
      };
    }
    if (q.includes("what is")) {
      return {
        kind: "explanation",
        language: "en",
        title: "What it is",
        text: "It is an app you can talk to by typing or speaking. You ask a question and it writes an answer for you.",
        offerShowMeHow: true,
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
  return {
    kind: "steps",
    language: "en",
    title: "Post a story on Instagram",
    device,
    steps: [
      {
        instruction: "Open Instagram.",
        lookFor: "A square icon with a camera outline, in pink and orange colours.",
        spoken: "Open Instagram. It is the pink and orange square with a camera drawing.",
      },
      {
        instruction: "Tap your picture at the top left.",
        lookFor: "Your round photo with a small blue + at the top left of the screen.",
        spoken: "Tap your round photo at the top left of the screen.",
      },
      {
        instruction: "Choose a photo and tap Share.",
        lookFor: "Your photos fill the screen. The Share button is at the bottom.",
        spoken: "Tap a photo, then tap Share at the bottom.",
      },
    ],
    screenshotHowTo: [
      "Press the side button and the volume up button at the same time.",
      "Let go quickly. You will see a small picture in the corner.",
    ],
  };
}
