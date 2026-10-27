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
  const apps = ["#3d33f0", "#1d6b3a", "#f5c54a", "insta", "#0a0a0a", "#8c86ff", "#d9d6fc", "#a8d5b5", "#e5e5e5"];
  return (
    <div className="grid h-full grid-cols-3 content-start gap-3 bg-gradient-to-b from-[#eeedfe] to-[#c9c5ff] px-4 pt-[22%]">
      {apps.map((c, i) =>
        c === "insta" ? (
          <Lens key={i} pulse={pulse} className="justify-self-center">
            <span className="block h-9 w-9 rounded-xl bg-gradient-to-tr from-[#f5c54a] via-[#e7798f] to-[#8c86ff]" />
          </Lens>
        ) : (
          <span key={i} className="block h-9 w-9 justify-self-center rounded-xl" style={{ background: c }} />
        ),
      )}
    </div>
  );
}

function PhotoScreen({ pulse }: { pulse: boolean }) {
  const photos = ["#ffe2b8", "#cfe8d6", "#f8c9d4", "#c9c5ff", "#a8d5b5", "#f5c54a", "#eeedfe", "#e7798f", "#8c86ff"];
  return (
    <div className="flex h-full flex-col pt-[20%]">
      <p className="px-3 pb-2 text-[0.7rem] font-bold text-[#0a0a0a]">New post</p>
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
    <div className="flex h-full flex-col gap-2 px-3 pt-[20%]">
      <p className="text-[0.7rem] font-bold text-[#0a0a0a]">New post</p>
      <span className="block aspect-square w-full rounded-md bg-[#ffe2b8]" />
      <span className="h-1.5 w-3/4 rounded-full bg-[#e5e5e5]" />
      <span className="h-1.5 w-1/2 rounded-full bg-[#e5e5e5]" />
      <div className="mt-auto flex justify-center pb-8">
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

/** Progress as four short bars, like the real guide. */
function Progress({ current }: { current: number }) {
  return (
    <span aria-hidden="true" className="grid w-28 grid-cols-4 gap-1.5">
      {STEPS.map((_, i) => (
        <span key={i} className={`h-1.5 rounded-full ${i < current ? "bg-primary" : "bg-border"}`} />
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
    <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-12">
      <div aria-hidden="true" className="media-card blue-field flex items-center justify-center px-4 py-10 lg:col-span-5 lg:py-14">
        <PhoneFrame width={11} className="md:w-[13rem]!">
          <div key={step} className="h-full animate-fade-in">
            <Screen step={step} pulse={hint === "where"} />
          </div>
        </PhoneFrame>
      </div>

      <div className="flex flex-col gap-4 lg:col-span-7">
        {/* On phones the mock phone shows the question, so the bubble is for screen readers only there. */}
        <p className="sr-only md:not-sr-only md:ml-auto md:max-w-sm md:rounded-3xl md:rounded-br-md md:bg-primary md:px-5 md:py-3 md:text-lg md:font-medium md:text-primary-foreground">
          <span className="sr-only">You asked: </span>
          {QUESTION}
        </p>

        <div aria-live="polite" className="card flex min-h-[19rem] flex-1 flex-col gap-4 p-6 sm:p-8">
          {step === 0 && (
            <>
              <p className="font-display text-2xl leading-snug font-medium tracking-[-0.01em] sm:text-3xl">
                Tech Helper turns your question into simple steps. Tap Next to see them.
              </p>
              <button ref={nextButton} type="button" className="btn-primary mt-auto sm:w-auto sm:self-start sm:px-10" onClick={() => go(1)}>
                Next
              </button>
            </>
          )}

          {current && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-base font-semibold text-primary">
                  Step {step} of {STEPS.length}
                </p>
                <Progress current={step} />
              </div>
              <h3 ref={heading} tabIndex={-1} className="text-4xl leading-tight font-semibold">
                {current.title}
              </h3>
              <p className="text-xl text-muted">{current.lookFor}</p>
              {hint && (
                <p className="animate-fade-in rounded-2xl bg-lavender p-4 text-lg">
                  {hint === "where"
                    ? "Look for the glowing circle on the phone. That's where to tap."
                    : "No problem. In the real app you can send me a screenshot and I'll point to the right button."}
                </p>
              )}
              <div className="mt-auto flex flex-col gap-3">
                <button type="button" className="btn-primary" onClick={() => go(step + 1)}>
                  <span aria-hidden="true" className="mr-1">
                    ✓
                  </span>
                  I did it
                </button>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button type="button" aria-pressed={hint === "where"} className="btn-secondary aria-pressed:bg-surface" onClick={() => setHint("where")}>
                    Show me where
                  </button>
                  <button type="button" aria-pressed={hint === "stuck"} className="btn-secondary aria-pressed:bg-surface" onClick={() => setHint("stuck")}>
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
                <h3 ref={heading} tabIndex={-1} className="text-4xl font-semibold">
                  You did it! <span aria-hidden="true">🎉</span>
                </h3>
              </div>
              <p className="text-xl">That&apos;s the whole guide. One step at a time, at your own pace.</p>
              <button type="button" className="btn-secondary mt-auto sm:w-auto sm:self-start sm:px-10" onClick={() => go(0)}>
                Start again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
