"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Mascot from "@/components/Mascot";
import PhoneFrame, { InstagramScreen, Lens, PlusButton } from "./PhoneFrame";

const QUESTION = "How do I post on Instagram?";

const STEPS = [
  { title: "Open Instagram", lookFor: "Find the pink and orange square with a camera on your home screen." },
  { title: "Tap the + button", lookFor: "It's a small square with a + sign, at the bottom of the screen." },
  { title: "Choose a photo", lookFor: "Your photos fill the screen. Tap the one you'd like to share." },
  { title: "Tap Share", lookFor: "The blue Share button is at the bottom." },
] as const;

const DONE = STEPS.length + 1;

type Hint = "where" | "stuck" | null;

function HomeScreen({ pulse }: { pulse: boolean }) {
  const apps = ["#7c74ff", "#2e8a50", "#f5c54a", "insta", "#e7798f", "#5a50d8", "#cbc6f3", "#a8d5b5", "#f8d3cd"];
  return (
    <div className="grid h-full grid-cols-3 content-start gap-3 bg-gradient-to-b from-[#eeecfb] to-[#fbe7ad] px-4 pt-10">
      {apps.map((c, i) =>
        c === "insta" ? (
          <Lens key={i} pulse={pulse} className="justify-self-center">
            <span className="block h-9 w-9 rounded-xl bg-gradient-to-tr from-[#f5c54a] via-[#e7798f] to-[#7c74ff]" />
          </Lens>
        ) : (
          <span key={i} className="block h-9 w-9 justify-self-center rounded-xl" style={{ background: c }} />
        ),
      )}
    </div>
  );
}

function PhotoScreen({ pulse }: { pulse: boolean }) {
  const photos = ["#fbe7ad", "#cfe8d6", "#f8d3cd", "#cbc6f3", "#a8d5b5", "#f5c54a", "#e4e1fa", "#e7798f", "#7c74ff"];
  return (
    <div className="flex h-full flex-col pt-7">
      <p className="px-3 pb-2 text-[0.7rem] font-bold text-[#1c1b2e]">New post</p>
      <div className="grid grid-cols-3 gap-1 px-1">
        {photos.map((c, i) => {
          const tile = <span className="block aspect-square w-full rounded-sm" style={{ background: c }} />;
          return i === 0 ? (
            <Lens key={i} pulse={pulse} className="w-full">
              {tile}
            </Lens>
          ) : (
            <span key={i}>{tile}</span>
          );
        })}
      </div>
    </div>
  );
}

function ShareScreen({ pulse }: { pulse: boolean }) {
  return (
    <div className="flex h-full flex-col gap-2 px-3 pt-7">
      <p className="text-[0.7rem] font-bold text-[#1c1b2e]">New post</p>
      <span className="block aspect-square w-full rounded-md bg-[#fbe7ad]" />
      <span className="h-1.5 w-3/4 rounded-full bg-[#dcd9ec]" />
      <span className="h-1.5 w-1/2 rounded-full bg-[#dcd9ec]" />
      <div className="mt-auto flex justify-center pb-4">
        <Lens pulse={pulse}>
          <span className="rounded-lg bg-[#3b82f6] px-5 py-1.5 text-[0.7rem] font-bold text-white">Share</span>
        </Lens>
      </div>
    </div>
  );
}

function HelperScreen({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center gap-3 bg-lavender px-3 pt-6 text-center">{children}</div>;
}

function Screen({ step, pulse }: { step: number; pulse: boolean }) {
  switch (step) {
    case 1:
      return <HomeScreen pulse={pulse} />;
    case 2:
      return (
        <InstagramScreen
          plus={
            <Lens pulse={pulse}>
              <PlusButton />
            </Lens>
          }
        />
      );
    case 3:
      return <PhotoScreen pulse={pulse} />;
    case 4:
      return <ShareScreen pulse={pulse} />;
    case DONE:
      return (
        <HelperScreen>
          <Mascot mood="celebrate" size={4} animate={false} />
          <p className="text-[0.8rem] font-bold text-foreground">Posted!</p>
        </HelperScreen>
      );
    default:
      return (
        <HelperScreen>
          <Mascot mood="thinking" size={3.5} animate={false} />
          <p className="rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-[0.7rem] font-semibold text-white">{QUESTION}</p>
        </HelperScreen>
      );
  }
}

function Dots({ current }: { current: number }) {
  return (
    <span aria-hidden="true" className="flex gap-2">
      {STEPS.map((_, i) => (
        <span
          key={i}
          className={`h-3 w-3 rounded-full border-2 border-primary ${i < current ? "bg-primary" : "bg-transparent"}`}
        />
      ))}
    </span>
  );
}

/** "See how Tech Helper works": a small, keyboard-operable walk through a 4-step guide. */
export default function HowItWorksDemo() {
  const [step, setStep] = useState(0);
  const [hint, setHint] = useState<Hint>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  // After the first change, keep keyboard focus in the demo: the button pressed may have disappeared.
  useEffect(() => {
    if (!moved.current) return;
    if (step === 0) nextButton.current?.focus();
    else if (step === 1 || step === DONE) heading.current?.focus();
  }, [step]);

  function go(to: number) {
    moved.current = true;
    setHint(null);
    setStep(to);
  }

  const current = step >= 1 && step <= STEPS.length ? STEPS[step - 1] : null;

  return (
    <div className="grid items-center gap-5 md:grid-cols-[auto_1fr] md:gap-8">
      <div aria-hidden="true">
        <PhoneFrame width={9} className="md:w-[13rem]!">
          <div key={step} className="h-full animate-fade-in">
            <Screen step={step} pulse={hint === "where"} />
          </div>
        </PhoneFrame>
      </div>

      <div className="flex flex-col gap-4">
        {/* On phones the mock phone shows the question, so the bubble is for screen readers only there. */}
        <p className="sr-only md:not-sr-only md:ml-auto md:max-w-sm md:rounded-3xl md:rounded-br-md md:bg-primary md:px-5 md:py-3 md:text-lg md:font-semibold md:text-primary-foreground">
          <span className="sr-only">You asked: </span>
          {QUESTION}
        </p>

        <div aria-live="polite" className="card flex min-h-[17rem] flex-col gap-4">
          {step === 0 && (
            <>
              <p className="text-xl">Tech Helper turns your question into simple steps. Tap Next to see them.</p>
              <button ref={nextButton} type="button" className="btn-primary mt-auto" onClick={() => go(1)}>
                Next
              </button>
            </>
          )}

          {current && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-bold text-primary">
                  Step {step} of {STEPS.length}
                </p>
                <Dots current={step} />
              </div>
              <h3 ref={heading} tabIndex={-1} className="text-3xl font-extrabold">
                {current.title}
              </h3>
              <p className="text-lg text-muted">{current.lookFor}</p>
              {hint && (
                <p className="animate-fade-in rounded-2xl bg-lavender p-3 text-lg">
                  {hint === "where"
                    ? "Look for the glowing circle on the phone. That's where to tap."
                    : "No problem. In the real app you can send me a screenshot and I'll point to the right button."}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-3">
                <button type="button" className="btn-primary" onClick={() => go(step + 1)}>
                  <span aria-hidden="true" className="mr-2">
                    ✓
                  </span>
                  I did it
                </button>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" aria-pressed={hint === "where"} className="btn-secondary" onClick={() => setHint("where")}>
                    <span aria-hidden="true" className="mr-2">
                      📱
                    </span>
                    Show me where
                  </button>
                  <button type="button" aria-pressed={hint === "stuck"} className="btn-secondary" onClick={() => setHint("stuck")}>
                    <span aria-hidden="true" className="mr-2">
                      ❓
                    </span>
                    I&apos;m stuck
                  </button>
                </div>
              </div>
            </>
          )}

          {step === DONE && (
            <>
              <div className="flex items-center gap-4">
                <Mascot mood="celebrate" size={4} />
                <h3 ref={heading} tabIndex={-1} className="text-3xl font-extrabold">
                  You did it! <span aria-hidden="true">🎉</span>
                </h3>
              </div>
              <p className="text-xl">That&apos;s the whole guide. One step at a time, at your own pace.</p>
              <button type="button" className="btn-secondary mt-auto" onClick={() => go(0)}>
                Start again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
