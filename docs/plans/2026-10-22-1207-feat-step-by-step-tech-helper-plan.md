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

- **Objective:** An older person who is new to smartphones can ask any tech question on their own and complete the task (for example, posting an Instagram story) by following the answer, without calling a family member.
- **Product authority:** The repo owner, who is building this for their grandmother as the first real user.
- **Open blockers:** None. Remaining questions are deferred to planning.

---

## Product Contract

### Summary

A mobile web app where the user speaks or types any tech question in their own language and gets back large, one-at-a-time step cards that can be read aloud.
Popular apps get real picture guides, and when the screen looks different the user can send a screenshot and the AI marks the exact spot to tap.
Guides and a family contact are saved on the phone with no sign-up, and scam or money questions get a warning instead of steps.

### Problem Frame

The first user is the builder's grandmother. She wanted to post Instagram stories and posts but did not know where to tap or in what order.
Her grandchild sat with her and showed her once. When she tried again alone she had forgotten the steps and was stuck until someone could help again.

The cost is dependence: every task needs a family member present, every time, and a forgotten step means giving up.
What helped was a patient person showing the next button at the moment she needed it. What was missing was a way to get that same help back later, on her own, at her own pace.

### Actors

- A1. Learner: an older or non-tech-savvy person using the app alone on their phone. The grandmother is the reference user.
- A2. Family helper: a relative who sets up the "Call family" contact and is the fallback when the learner is stuck.
- A3. Guide maintainer: whoever captures and refreshes the real screenshots for the picture-guide apps, initially the builder.

### Key Decisions

- **Ask-anything helper over a curated guide library or family-made guides.** It matches the success test of the learner getting help on demand with nobody else involved. Governs R1, R4.
- **Picture guides for a few top apps; screenshot help everywhere.** The AI cannot reliably draw accurate app screens, so ready-made pictures come only from real screenshots and cover a short list. Governs R9, R10, R11.
- **Saved on the phone, no account.** Signing in is itself a hurdle for beginners; the trade-off is that a new phone or cleared browser loses saved data. Governs R12, R13.
- **Answer in the language the learner uses.** Button labels on screen still follow the phone's language, so steps lean on a button's look and position. Governs R3, R6.
- **Mobile website, free to use.** No app store install; the builder covers the per-question AI cost for now. Governs R14.

### Requirements

**Asking**

- R1. The learner can ask any tech-related question, about any app or phone setting.
- R2. A large microphone button lets the learner speak the question, with a text box as an alternative.
- R3. The app understands questions and answers in whatever language the learner asks in.
- R4. The first time, the app asks which kind of phone the learner has (iPhone or Android) and tailors steps to it from then on.

**Following the steps**

- R5. Answers are broken into numbered steps shown one at a time, in large, high-contrast text, with one action per step.
- R6. Each step describes what to tap by its look and position on screen (for example, "the + at the bottom of the screen"), not only by its label.
- R7. Each step can be read aloud, and the learner moves on with a large "Done, next step" button or goes back with "Previous step".
- R8. When the learner leaves to use the other app and comes back, the guide reopens on the same step.

**Pictures and "my screen looks different"**

- R9. For a short launch list of apps (Instagram, WhatsApp, YouTube, Facebook), common tasks show a real screenshot with the tap target clearly marked.
- R10. Every step has a "My screen looks different" button that leads to screenshot help.
- R11. Screenshot help first teaches the learner how to take a screenshot on their phone type, then lets them send it; the app returns the image with the exact place to tap circled or arrowed, plus a plain-language instruction.

**Remembering**

- R12. Every guide the learner has used is saved as a large button under "My guides" so they can replay it later without asking again.
- R13. Saved guides, phone type, and the family contact live on the learner's phone with no sign-up or login.
- R14. The app can be added to the phone's home screen so it opens like an app.

**Safety**

- R15. Questions that look like scams (sharing an OTP or password, gift cards, remote-access requests, urgent payments, strangers asking for money) get a clear warning that it is likely a scam, no steps, and a prompt to call family.
- R16. The app gives no steps for sending money, bank transfers, or payments, and tells the learner to ask a trusted person.
- R17. Before a screenshot is sent, the app reminds the learner not to include bank, password, or private message screens, and screenshots are not kept after the answer is given.
- R18. A large "Call family" button calls or opens WhatsApp to a saved family member; a family helper can add that contact the first time.

### Key Flows

- F1. Ask and follow
  - **Trigger:** The learner wants to do something, such as post an Instagram story.
  - **Actors:** A1
  - **Steps:** Taps the microphone and asks; sees step 1 in large text, read aloud; switches to Instagram, does it, returns; the same step is waiting; taps "Done, next step" until finished; the guide is saved to "My guides".
  - **Covered by:** R1, R2, R5, R7, R8, R12
- F2. My screen looks different
  - **Trigger:** A step does not match what the learner sees.
  - **Actors:** A1
  - **Steps:** Taps "My screen looks different"; is shown how to take a screenshot; sees the privacy reminder; sends the screenshot; gets it back with the tap spot marked and a short instruction; continues the guide.
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
- AE5. **Covers R9, R10.** Given a question about an app outside the launch list, then the answer has text steps with no ready-made pictures, and "My screen looks different" is still on every step.

### Success Criteria

- The grandmother, alone, can ask how to post an Instagram story and a post, follow the steps smoothly, and finish both without calling anyone.
- She can reopen a saved guide a week later and complete the task again from it.

### Scope Boundaries

**Deferred for later**

- Family-made guides: a relative builds and checks a guide that the learner replays.
- Accounts and syncing guides across devices.
- Picture guides beyond the four launch apps.
- An App Store or Play Store app.
- Payments, subscriptions, or usage analytics.

**Outside this product's identity**

- Taking control of the learner's phone or acting on their behalf; the learner always does the tapping.
- General-purpose chat unrelated to using technology.

### Dependencies / Assumptions

- Picture guides depend on someone capturing real screenshots of the launch apps and refreshing them when those apps change their layout.
- The AI service can read a screenshot and locate a button well enough to mark it; planning should confirm this with real screenshots.
- Per-question AI, voice, and image costs are paid by the builder and stay small at family-and-friends scale.
- Saved data is lost if the learner changes phones or clears browser data; accepted for the first version.

### Outstanding Questions

**Deferred to Planning**

- Which tasks per launch app get picture guides first (beyond posting a story and a post on Instagram).
- How the app recognizes that a question matches a ready-made picture guide versus needing an AI answer.
- Limits to prevent abuse of the free AI cost, such as a daily question cap.
