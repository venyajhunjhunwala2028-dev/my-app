import Link from "next/link";
import PhoneFrame, { InstagramScreen, PlusButton } from "./PhoneFrame";
import { CONTAINER, Label } from "./ui";

const LENS_STEPS = ["Take a screenshot of your screen.", "Send it to Tech Helper.", "I circle exactly what to tap."] as const;

/**
 * The centrepiece, on the deep night surface: a looping CSS-only demo of "What do I press?".
 * Screenshot → "Looking at your screenshot…" with a scan line → the magic lens finds the + → "Tap here".
 * Under prefers-reduced-motion the animations stop and the final frame shows.
 */
export default function MagicLensDemo() {
  return (
    <section id="magic-lens" aria-labelledby="lens-title" className="night-field w-full py-20 sm:py-28">
      <div className={`${CONTAINER} grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10`}>
        <div className="flex flex-col gap-8 lg:col-span-6">
          <Label className="text-night-muted!">The magic lens</Label>
          <h2 id="lens-title" className="display-lg text-white">
            Not sure what to press? Take a screenshot and I&apos;ll point it out.
          </h2>
          <ol className="flex flex-col border-t border-night-line text-xl">
            {LENS_STEPS.map((s, i) => (
              <li key={s} className="flex items-baseline gap-5 border-b border-night-line py-4">
                <span aria-hidden="true" className="w-8 shrink-0 font-display text-base font-medium text-night-muted">
                  0{i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <Link href="/app/press" className="btn-light self-start px-8 text-xl sm:w-auto">
            Try it →
          </Link>
        </div>

        <div className="media-card blue-field flex justify-center px-4 py-12 sm:py-16 lg:col-span-6">
          <div
            role="img"
            aria-label="Demo: a screenshot of Instagram. Tech Helper scans it, then a glowing circle appears around the + button with the words: Tech Helper found it, tap here."
            className="relative flex flex-col items-center gap-6"
          >
            <PhoneFrame className="lens-shot" width={14}>
              <InstagramScreen
                plus={
                  <span className="relative inline-flex">
                    <PlusButton />
                    <span className="lens-found absolute top-1/2 left-1/2 -mt-[1.4rem] -ml-[1.4rem] h-[2.8rem] w-[2.8rem] rounded-full border-[3px] border-white outline-[3px] outline-[#3d33f0] outline-solid shadow-[0_0_0_6px_rgba(61,51,240,0.3),0_0_22px_8px_rgba(61,51,240,0.5)]" />
                  </span>
                }
              />
              {/* Spotlight: dims everything except the area around the + button. */}
              <div
                className="lens-dim pointer-events-none absolute inset-0 z-10"
                style={{ background: "radial-gradient(circle at 50% calc(100% - 1.83rem), transparent 1.6rem, rgb(10 10 20 / 0.38) 1.8rem)" }}
              />
              {/* Scanning phase */}
              <div className="lens-scanning pointer-events-none absolute inset-0 z-20 bg-[#3d33f0]/10">
                <div className="scan-line" />
                <p className="absolute top-1/2 left-1/2 w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-3 py-2 text-center text-[0.7rem] font-bold text-foreground shadow-raised">
                  Looking at your screenshot…
                </p>
              </div>
            </PhoneFrame>
            <p className="lens-found w-fit max-w-full rounded-full sm:whitespace-nowrap bg-white px-5 py-3 text-center text-lg font-semibold text-foreground shadow-raised">
              Tech Helper found it — <span className="text-primary">Tap here.</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
