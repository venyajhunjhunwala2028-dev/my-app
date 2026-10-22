---
title: Step-by-Step Tech Helper - Plan
type: feat
date: 2026-10-22
topic: step-by-step-tech-helper
artifact_contract: ce-unified-plan/v1
product_contract_source: ce-brainstorm
execution: code
---

# Step-by-Step Tech Helper - Plan

## Goal Capsule

- **Objective:** An older person who is new to technology can ask any tech or AI question on their own and get through the task or understand the answer, without calling a family member.
- **Means:** A mobile web app that turns each question into large, spoken, one-at-a-time steps or a plain explanation, with on-screen tap marking from a screenshot (KTD2, KTD5).
- **Product authority:** The repo owner, building this for their grandmother as the first real user. The Product Contract below wins on behavior; KTDs win on mechanism.
- **Stop conditions:** Stop and ask if Claude cannot return a usable tap location from real phone screenshots (see Risks), or if a requirement would need an account or stored user data on a server.
- **Execution profile:** Greenfield Next.js app in this repo, deployed to the owner's Vercel account. Built by `ce-work`; the owner supplies the Anthropic API key and does the final real-world check with their grandmother.

---

## Product Contract

Product Contract preservation: changed R1, R4, R10, R11 and removed R9 — scope widened from social apps to any tech or AI question on any device, and ready-made picture guides replaced by screenshot marking on every step (confirmed by the owner); added R19–R21.

### Summary

A mobile web app where the learner speaks or types any question about technology or AI, in their own language.
How-to questions come back as large, one-at-a-time step cards that can be read aloud; "what is" and "should I" questions come back as a short plain explanation.
On any step the learner can send a screenshot and the AI circles exactly where to tap.
Guides and a family contact are saved on the phone with no sign-up, and scam or money questions get a warning instead of steps.

### Problem Frame

The first user is the builder's grandmother. She wanted to post Instagram stories and posts but did not know where to tap or in what order.
Her grandchild sat with her and showed her once. When she tried again alone she had forgotten the steps and was stuck until someone could help again.

The same thing happens with any app, website, device setting, or AI tool, not only social media. Every task needs a family member present, every time, and a forgotten step means giving up.
What helped was a patient person showing the next button at the moment she needed it. What was missing was a way to get that same help back later, on her own, at her own pace.

### Actors

- A1. Learner: an older or non-tech-savvy person using the app alone on their phone. The grandmother is the reference user.
- A2. Family helper: a relative who sets up the "Call family" contact and is the fallback when the learner is stuck.

### Key Decisions

- **Ask-anything helper over a curated guide library or family-made guides.** It matches the success test of the learner getting help on demand with nobody else involved. Governs R1, R19.
- **Screenshot marking on every step instead of ready-made picture guides.** It works for any app, website, or device screen and needs no screenshot library to maintain. Governs R10, R11.
- **Saved on the phone, no account.** Signing in is itself a hurdle for beginners; the trade-off is that a new phone or cleared browser loses saved data. Governs R12, R13.
- **Answer in the language the learner uses.** Button labels on screen still follow the device's language, so steps lean on a button's look and position. Governs R3, R6.
- **Mobile website, free to use, with a daily cap.** No app store install; the builder covers the AI cost, protected by a per-phone daily limit. Governs R14, R21.

### Requirements

**Asking**

- R1. The learner can ask any question about technology or AI: phones, tablets, computers, smart TVs, Wi-Fi and Bluetooth, settings, any app or website, email, video calls, online safety, and AI tools such as ChatGPT, Gemini, or Claude.
- R2. A large microphone button lets the learner speak the question, with a text box as an alternative.
- R3. The app understands questions and answers in whatever language the learner asks in.
- R4. When it matters which device or system the question is about and that is unclear, the app asks with large buttons (for example iPhone, Android phone, Windows computer, Mac, TV) and remembers the learner's usual devices as defaults.
- R19. How-to questions are answered as steps (R5); "what is", "why", and "should I" questions are answered as a short plain-language explanation, with a "Show me how" button when there is something to do.

**Following the steps**

- R5. Answers are broken into numbered steps shown one at a time, in large, high-contrast text, with one action per step.
- R6. Each step describes what to tap by its look and position on screen (for example, "the + at the bottom of the screen"), not only by its label.
- R7. Each step can be read aloud, and the learner moves on with a large "Done, next step" button or goes back with "Previous step".
- R8. When the learner leaves to use the other app and comes back, the guide reopens on the same step.
- R20. On any step the learner can say or tap "I don't understand" and ask a follow-up about that step, and the answer keeps them on the same guide.

**Show me on my screen**

- R10. Every step has a "Show me on my screen" button that leads to screenshot help.
- R11. Screenshot help first teaches the learner how to take a screenshot on their device, then lets them send it; the app returns the image with the place to tap circled, plus a plain-language instruction. When the AI cannot find the place, it says so and describes what to look for instead of circling a guess.

**Remembering**

- R12. Every guide the learner has used is saved as a large button under "My guides" so they can replay it later without asking again.
- R13. Saved guides, usual devices, and the family contact live on the learner's phone with no sign-up or login.
- R14. The app can be added to the phone's home screen so it opens like an app.

**Safety and cost**

- R15. Questions that look like scams (sharing an OTP or password, gift cards, remote-access requests, urgent payments, strangers asking for money) get a clear warning that it is likely a scam, no steps, and a prompt to call family.
- R16. The app gives no steps for sending money, bank transfers, or payments, and tells the learner to ask a trusted person.
- R17. Before a screenshot is sent, the app reminds the learner not to include bank, password, or private message screens, and screenshots are not kept after the answer is given.
- R18. A large "Call family" button calls or opens WhatsApp to a saved family member; a family helper can add that contact the first time.
- R21. Each phone can ask up to 30 questions and screenshots per day; past that, the app explains kindly that it will be ready again tomorrow and offers "Call family".

### Key Flows

- F1. Ask and follow
  - **Trigger:** The learner wants to do something, such as post an Instagram story or connect to Wi-Fi.
  - **Actors:** A1
  - **Steps:** Taps the microphone and asks; answers the device question if asked; sees step 1 in large text, read aloud; switches to the other app, does it, returns; the same step is waiting; taps "Done, next step" until finished; the guide is saved to "My guides".
  - **Covered by:** R1, R2, R4, R5, R7, R8, R12
- F2. Show me on my screen
  - **Trigger:** The learner cannot find what a step describes.
  - **Actors:** A1
  - **Steps:** Taps "Show me on my screen"; is shown how to take a screenshot on their device; sees the privacy reminder; sends the screenshot; gets it back with the tap spot circled and a short instruction; continues the guide.
  - **Covered by:** R10, R11, R17
- F3. Replay a past guide
  - **Trigger:** The learner wants to repeat something they did before.
  - **Actors:** A1
  - **Steps:** Opens the app from the home screen; taps the guide under "My guides"; follows it from step 1.
  - **Covered by:** R12, R13, R14

### Acceptance Examples

- AE1. **Covers R8.** Given the learner is on step 3 of "post a story", when they switch to Instagram and come back ten minutes later, then step 3 is showing.
- AE2. **Covers R15.** Given the learner asks "the bank called and wants the code they sent me, how do I find it?", then the app shows a scam warning and the "Call family" button, and gives no steps.
- AE3. **Covers R16.** Given the learner asks "how do I send money on Google Pay?", then the app explains it will not guide payments and suggests asking a trusted person.
- AE4. **Covers R3, R6.** Given the learner asks in Hindi while their phone is set to English, then the steps are in Hindi and describe each button by its look and position.
- AE5. **Covers R11.** Given a screenshot where the described button is not visible, then the app says it could not find it, draws no circle, and describes what to look for.
- AE6. **Covers R19.** Given the learner asks "what is ChatGPT?", then the app gives a short plain explanation, not steps, with a "Show me how" button to start using it.
- AE7. **Covers R4.** Given the learner asks "how do I make the text bigger?" with no usual device saved, then the app asks which device with large buttons before answering.
- AE8. **Covers R21.** Given the learner has asked 30 questions today, when they ask another, then no AI request is made and the app says it will be ready tomorrow and shows "Call family".

### Success Criteria

- The grandmother, alone, can ask how to post an Instagram story and a post, follow the steps smoothly, and finish both without calling anyone.
- She can ask about something outside social media, such as joining a video call or what an AI app does, and act on the answer.
- She can reopen a saved guide a week later and complete the task again from it.

### Scope Boundaries

**Deferred for later**

- Family-made guides: a relative builds and checks a guide that the learner replays.
- Accounts and syncing guides across devices.
- Ready-made picture guides for popular apps.
- An App Store or Play Store app.
- Payments, subscriptions, or usage analytics.

**Outside this product's identity**

- Taking control of the learner's device or acting on their behalf; the learner always does the tapping.
- General-purpose chat unrelated to using technology or AI.

**Considered and not built**

- Server-side rate limiting by IP: the per-phone cap (R21) plus a monthly spend limit set in the Anthropic console bounds cost at family scale without adding a database; revisit if usage grows beyond people the owner knows.
- Live camera or screen-sharing guidance: screenshots cover the need with far less complexity and privacy risk.

### Dependencies / Assumptions

- The AI service can read a screenshot and locate a described control well enough to circle it; U6 verifies this on real screenshots before building the overlay polish.
- Per-question AI cost is paid by the owner and stays small at family-and-friends scale, with a spend limit set in the Anthropic console.
- Saved data is lost if the learner changes phones or clears browser data; accepted for the first version.
- Voice input and read-aloud use the browser's built-in speech features, whose language coverage varies by phone.

---

## Planning Contract

### Key Technical Decisions

- KTD1. **Next.js App Router with TypeScript and Tailwind, deployed on Vercel.** One app serves the pages and the server routes that hold the API key, and Vercel deploys it from this repo on every push.
- KTD2. **Claude Opus 5.5 (`claude-opus-5-5`) through the official `@anthropic-ai/sdk`, called only from server routes.** Most capable current model; run at `low` effort to keep answers fast and cheap. Enable server-side refusal fallbacks (`fallbacks: "default"` with the `server-side-fallback-2026-07-01` beta) and check `stop_reason` before reading content. The model ID lives in one config constant so the owner can switch to `claude-haiku-5-5` later.
- KTD3. **Structured output for every answer.** The ask route requests a JSON schema via `output_config.format` with a `kind` of `steps`, `explanation`, `needs_device`, `scam_warning`, `money_refusal`, or `off_topic`, the answer language, and for steps an ordered list where each step has the instruction, what it looks like and where it is, and a spoken version. The UI renders by `kind` and never parses free text.
- KTD4. **Two layers for scam and money safety (R15, R16).** A small deterministic phrase check (OTP, password, gift card, remote access, AnyDesk, send money, and equivalents in common languages) runs before the AI call and returns the warning directly; the system prompt and the `scam_warning` / `money_refusal` kinds cover everything the phrase check misses. The phrase check exists because a missed scam does harm before anyone notices.
- KTD5. **Screenshot marking returns coordinates, the browser draws the circle.** The client shrinks the image to at most 1568 px on the long edge before upload. The locate route asks Claude for a box in coordinates normalized to 0–1000, a `found` flag, and an instruction. The client draws the circle over its own copy of the image. Nothing is written to disk or logs (R17).
- KTD6. **Browser speech APIs for voice.** `SpeechRecognition` (with the `webkit` prefix) for input and `speechSynthesis` for read-aloud, both feature-detected. When recognition is missing or fails, the mic button hides and the text box stays (R2).
- KTD7. **One versioned local store.** A small typed wrapper over `localStorage` holds saved guides, the current guide and step, usual devices, the family contact, and today's question count, under one versioned key so a later format change can migrate it.
- KTD8. **Daily cap counted on the phone (R21).** The count lives in the local store and resets at local midnight. It stops ordinary over-use, not a determined abuser, so the Anthropic console spend limit is the hard backstop.
- KTD9. **Installable web app without offline mode.** A web manifest and icons enable "Add to Home Screen" (R14); no service worker, since every answer needs the network.
- KTD10. **Fake AI mode for tests.** When `FAKE_AI=1`, both routes return fixed fixtures, so unit, component, and end-to-end tests run free and offline.

### High-Level Technical Design

Ask flow, including the safety and device branches:

```mermaid
sequenceDiagram
  participant L as Learner (browser)
  participant S as Local store
  participant A as /api/ask
  participant C as Claude
  L->>S: check daily count (R21)
  alt over the cap
    S-->>L: "ready tomorrow" + Call family
  else under the cap
    L->>A: question, language, usual devices, guide context
    A->>A: phrase check (KTD4)
    alt scam or money phrase
      A-->>L: scam_warning / money_refusal
    else
      A->>C: system prompt + question, JSON schema (KTD3)
      C-->>A: structured answer
      A-->>L: steps | explanation | needs_device | ...
    end
    L->>S: save guide, step = 1, count + 1
  end
```

Step player states:

```mermaid
stateDiagram-v2
  [*] --> Step
  Step --> Step: Done, next step / Previous step
  Step --> FollowUp: I don't understand (R20)
  FollowUp --> Step: answer shown, same step
  Step --> ShowMe: Show me on my screen (R10)
  ShowMe --> Step: circled screenshot shown
  Step --> Finished: last step done
  Finished --> [*]
```

Leaving the page in any state saves the step; returning restores it (R8).

### Output Structure

```text
app/
  layout.tsx
  page.tsx                  # home: ask, My guides, Call family
  guide/[id]/page.tsx       # step player and explanation view
  api/ask/route.ts
  api/locate/route.ts
  manifest.ts
components/
  AskBox.tsx
  DevicePicker.tsx
  StepPlayer.tsx
  ExplanationView.tsx
  ShowMeOnScreen.tsx
  CallFamily.tsx
  SafetyNotice.tsx
lib/
  ai/client.ts              # Anthropic client, model constant
  ai/prompts.ts
  ai/schemas.ts
  ai/fakes.ts
  safety/phraseCheck.ts
  store/localStore.ts
  speech/speech.ts
  image/resize.ts
tests/
  unit/
  components/
  e2e/
public/icons/
```

### Assumptions

- The owner creates an Anthropic API key and a Vercel environment variable `ANTHROPIC_API_KEY`; the app shows a clear setup error when it is missing.
- Vercel's default function timeout is enough for a `low`-effort answer; if not, the routes stream and the UI shows a "thinking" state.

---

## Implementation Units

### U1. App scaffold and accessible design base

- **Goal:** A deployable Next.js app with large-type, high-contrast styling, test tooling, and the install manifest.
- **Requirements:** R5 (type scale and contrast), R14
- **Dependencies:** none
- **Files:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `public/icons/`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `tests/unit/smoke.test.ts`
- **Approach:**
  1. Create the app per KTD1 with ESLint and TypeScript strict mode.
  2. Set a base font of at least 20 px, buttons at least 56 px tall, and colours meeting WCAG AA contrast.
  3. Add the web manifest and icons per KTD9.
  4. Add Vitest with Testing Library and Playwright; add `.env.example` with `ANTHROPIC_API_KEY` and `FAKE_AI`.
- **Execution note:** Mostly scaffolding; prove it with a build and a smoke test rather than unit coverage.
- **Test scenarios:**
  - The home page renders with the app name and an ask control.
  - The manifest route returns a name, start URL, and at least one icon.
- **Verification:** The app builds, the dev server shows the home page, and the test runners execute.

### U2. Local store

- **Goal:** One place that saves and restores everything the app remembers on the phone.
- **Requirements:** R8, R12, R13, R18, R21; KTD7, KTD8
- **Dependencies:** U1
- **Files:** `lib/store/localStore.ts`, `tests/unit/localStore.test.ts`
- **Approach:** Typed get/set for saved guides, current guide and step, usual devices, family contact, and daily count with its date; one versioned key; reads that fail or hold bad data return safe defaults.
- **Test scenarios:**
  - Saving a guide then reloading returns it under My guides, newest first.
  - Setting step 3 on a guide and reading it back returns step 3.
  - The daily count increments and resets to 0 when the stored date is yesterday.
  - Corrupt JSON in storage yields defaults instead of an error.
  - Storage that throws (private mode) does not crash the app; the app still works without saving.
  - Saving the same question twice keeps one guide entry.
- **Verification:** All store tests pass, and a manual reload in the browser keeps saved data.

### U3. Ask API with safety and structured answers

- **Goal:** A server route that turns any tech or AI question into a structured answer, with scam and money safety.
- **Requirements:** R1, R3, R4, R6, R15, R16, R19, R20; KTD2, KTD3, KTD4, KTD10
- **Dependencies:** U1
- **Files:** `app/api/ask/route.ts`, `lib/ai/client.ts`, `lib/ai/prompts.ts`, `lib/ai/schemas.ts`, `lib/ai/fakes.ts`, `lib/safety/phraseCheck.ts`, `tests/unit/phraseCheck.test.ts`, `tests/unit/askRoute.test.ts`
- **Approach:**
  1. Validate the request: question text, optional language hint, usual devices, and optional guide context with step number for follow-ups (R20).
  2. Run the phrase check (KTD4); on a match, return the warning kind without calling the AI.
  3. Build the system prompt: patient helper for older beginners; one action per step; describe controls by look and position (R6); answer in the question's language (R3); ask for the device when it changes the answer (R4); explain rather than step for "what is" questions (R19); refuse payments (R16); flag scams (R15); decline non-tech topics.
  4. Call Claude per KTD2 with the schema from KTD3; on refusal or invalid output return a friendly retry message, never a raw error.
  5. Return fixtures when `FAKE_AI=1` (KTD10).
- **Test scenarios:**
  - Covers AE2. "The bank called and wants the code they sent me" returns `scam_warning` without calling the AI.
  - Covers AE3. "How do I send money on Google Pay?" returns `money_refusal`.
  - A phrase check in Hindi ("OTP बताओ") also triggers the warning.
  - An ordinary question ("how do I post a story on Instagram") passes the phrase check and returns `steps` from the fake.
  - A follow-up request with guide context returns an explanation tied to that step.
  - An empty question returns a 400 with a friendly message.
  - A missing API key in real mode returns a setup error the UI can show.
  - An AI refusal or malformed response returns the friendly retry message.
- **Verification:** Route tests pass in fake mode; one manual real call in a few languages returns valid schema-shaped answers.

### U4. Ask screen with voice and device picker

- **Goal:** The home screen where the learner asks by voice or text and answers the device question when needed.
- **Requirements:** R2, R3, R4, R13, R21; KTD6, KTD8
- **Dependencies:** U2, U3
- **Files:** `app/page.tsx`, `components/AskBox.tsx`, `components/DevicePicker.tsx`, `lib/speech/speech.ts`, `tests/components/AskBox.test.tsx`, `tests/components/DevicePicker.test.tsx`
- **Approach:** Large mic button and text box; speech recognized in the device's language with the transcript shown for confirmation; check the daily cap before sending; on `needs_device` show the picker, save the choice as a usual device, and resend; route `steps` and `explanation` answers to the guide page; show safety kinds via `SafetyNotice`.
- **Test scenarios:**
  - Typing a question and tapping Ask sends it and navigates to the guide.
  - With no speech support, the mic button is hidden and the text box works.
  - A recognized transcript fills the box and waits for the learner to confirm.
  - Covers AE7. A `needs_device` answer shows the device buttons; choosing one resends and saves it as a usual device.
  - Covers AE8. At 30 questions today, asking shows the "ready tomorrow" message and Call family, and no request is sent.
  - A `scam_warning` answer shows the warning and the Call family button, not steps.
- **Verification:** Component tests pass; on a real phone, speaking a question in English and one other language produces a guide.

### U5. Step player and explanation view

- **Goal:** Show answers one step at a time, read aloud, resumable, with follow-up questions.
- **Requirements:** R5, R6, R7, R8, R12, R19, R20; KTD6, KTD7
- **Dependencies:** U2, U3
- **Files:** `app/guide/[id]/page.tsx`, `components/StepPlayer.tsx`, `components/ExplanationView.tsx`, `tests/components/StepPlayer.test.tsx`, `tests/components/ExplanationView.test.tsx`
- **Approach:** Render one step with "Step N of M", Read aloud, Done next step, Previous step, I don't understand, and Show me on my screen; save the step on every change and on `visibilitychange`; restore it on load; follow-up answers appear on the same step; explanations show the text and, when offered, a "Show me how" button that asks for steps.
- **Test scenarios:**
  - Step 1 of 4 shows only step 1; Done moves to step 2; Previous returns to step 1.
  - Covers AE1. Reloading the guide page after reaching step 3 shows step 3.
  - Finishing the last step shows a "You did it" screen and the guide stays in My guides.
  - Read aloud speaks the step's spoken text in the answer language; with no speech support the button is hidden.
  - I don't understand sends the step context and shows the answer without leaving the step.
  - Covers AE6. An explanation answer shows text and a Show me how button that loads steps.
- **Verification:** Component tests pass; on a phone, switching to another app and back keeps the step.

### U6. Show me on my screen

- **Goal:** Teach the learner to take a screenshot, then circle where to tap on it.
- **Requirements:** R10, R11, R17; KTD2, KTD5
- **Dependencies:** U3, U5
- **Files:** `components/ShowMeOnScreen.tsx`, `lib/image/resize.ts`, `app/api/locate/route.ts`, `tests/unit/resize.test.ts`, `tests/unit/locateRoute.test.ts`, `tests/components/ShowMeOnScreen.test.tsx`
- **Approach:**
  1. Show device-specific "how to take a screenshot" steps (iPhone with and without Home button, Android, computer), then the privacy reminder (R17), then a large upload button.
  2. Shrink the image on the phone per KTD5 and send it with the current step's instruction.
  3. The locate route asks Claude for `found`, a 0–1000 box, and an instruction; it keeps no copy of the image.
  4. Draw a thick circle and arrow over the image when `found`; otherwise show the "couldn't find it" description (R11).
- **Execution note:** Before building the overlay, run the locate prompt against 5–10 real phone screenshots and check the boxes land on the right control; record the result and stop to ask if most miss.
- **Test scenarios:**
  - A 3000×6000 image is resized to at most 1568 px on the long edge, keeping its aspect ratio.
  - The privacy reminder shows before the upload button is enabled.
  - Covers AE5. A `found: false` answer shows the description and draws no circle.
  - A `found: true` box at (500, 900) draws the circle at the matching position on the displayed image at any display size.
  - A non-image file is rejected with a friendly message.
  - The locate route returns fixtures in fake mode and never writes the image anywhere.
- **Verification:** Tests pass, and the real-screenshot check from the execution note hits the right control in most cases.

### U7. My guides and Call family

- **Goal:** Let the learner replay saved guides and reach family with one tap.
- **Requirements:** R12, R13, R18; KTD7
- **Dependencies:** U2, U4
- **Files:** `components/MyGuides.tsx`, `components/CallFamily.tsx`, `components/SafetyNotice.tsx`, `tests/components/MyGuides.test.tsx`, `tests/components/CallFamily.test.tsx`
- **Approach:** My guides lists saved guides as large buttons that open at step 1 (F3); Call family shows a one-time setup for name and phone number, then a large button with Call and WhatsApp options using `tel:` and `https://wa.me/` links; SafetyNotice reuses Call family.
- **Test scenarios:**
  - With two saved guides, both show as buttons and tapping one opens it at step 1.
  - With no saved guides, the section shows a friendly hint instead of an empty list.
  - Saving a family contact shows the Call family button with the right `tel:` and WhatsApp links.
  - Without a saved contact, the button opens the setup form.
  - Covers AE2. The scam warning shows the Call family button.
- **Verification:** Component tests pass and the links open the dialer and WhatsApp on a real phone.

### U8. End-to-end check and deploy to Vercel

- **Goal:** Prove the main flows work together and put the app live on Vercel from this repo.
- **Requirements:** R14, success criteria; KTD1, KTD10
- **Dependencies:** U4, U5, U6, U7
- **Files:** `tests/e2e/ask-and-follow.spec.ts`, `tests/e2e/show-me.spec.ts`, `README.md`
- **Approach:** Playwright runs F1, F2, and F3 at phone screen size against fake mode; create the Vercel project linked to `venyajhunjhunwala2028-dev/my-app`; the owner adds `ANTHROPIC_API_KEY` and sets an Anthropic console spend limit; README explains setup, the key, and how to switch the model.
- **Test scenarios:**
  - Covers F1. Ask, get 3 steps, finish them, and see the guide in My guides.
  - Covers F2. On a step, open Show me on my screen, upload a sample image, and see the circle.
  - Covers F3. Reopen a saved guide from the home page.
- **Verification:** End-to-end tests pass, the Vercel deployment loads on a phone, and a real question returns a guide once the key is set.

---

## Risks

| Risk | Mitigation |
|---|---|
| Claude's tap locations miss on real screenshots | U6 checks real screenshots before overlay work; R11's "couldn't find it" path avoids wrong circles; stop and ask if most miss. |
| AI gives a wrong or outdated step | Steps describe looks and positions (R6); Show me on my screen (R10) and I don't understand (R20) on every step. |
| Speech recognition is missing for a language or browser | Feature detection hides the mic and keeps the text box (KTD6). |
| Cost grows if the link spreads | Daily cap (R21) plus console spend limit; server-side limiting is recorded as considered and not built. |
| A scam question slips past | Phrase check plus model classification (KTD4). |

---

## Verification Contract

| Check | Command | Applies to |
|---|---|---|
| Type check | `npx tsc --noEmit` | All units |
| Lint | `npm run lint` | All units |
| Unit and component tests | `npm test` (Vitest, with `FAKE_AI=1`) | U2–U7 |
| End-to-end tests | `npx playwright test` (fake mode, phone viewport) | U8 |
| Production build | `npm run build` | U1, U8 |
| Real-screenshot locate check | manual, 5–10 screenshots | U6 |
| Live check | open the Vercel URL on a phone and ask a real question | U8 |

---

## Definition of Done

- Every unit's test scenarios exist and pass, and type check, lint, and build are clean.
- The app is live on Vercel from this repo, and a real question returns a guide on a phone.
- No API key, screenshot, or personal data is committed, logged, or stored on the server.
- No dead-end or experimental code from abandoned approaches remains in the diff.
- The README explains how to set the API key, set a spend limit, and change the model.
