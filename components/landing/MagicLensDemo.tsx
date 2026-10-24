import Link from "next/link";
import PhoneFrame, { InstagramScreen, PlusButton } from "./PhoneFrame";

/**
 * The centrepiece: a looping CSS-only demo of "What do I press?".
 * Screenshot → "Looking at your screenshot…" with a scan line → the magic lens finds the + → "Tap here".
 * Under prefers-reduced-motion the animations stop and the final frame shows.
 */
export default function MagicLensDemo() {
  return (
    <section aria-labelledby="lens-title" className="w-full bg-lavender py-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <p className="text-sm font-extrabold tracking-[0.15em] text-primary uppercase">The magic lens</p>
          <h2 id="lens-title" className="text-3xl leading-tight font-extrabold sm:text-5xl">
            Not sure what to press? Take a screenshot and I&apos;ll point it out.
          </h2>
          <ol className="flex flex-col gap-3 text-xl">
            {["Take a screenshot of your screen.", "Send it to Tech Helper.", "I circle exactly what to tap."].map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
          <Link href="/app/press" className="btn-primary self-start px-8 sm:w-auto">
            Try it →
          </Link>
        </div>

        <div
          role="img"
          aria-label="Demo: a screenshot of Instagram. Tech Helper scans it, then a glowing circle appears around the + button with the words: Tech Helper found it, tap here."
          className="relative py-4"
        >
          <PhoneFrame className="lens-shot" width={14}>
            <InstagramScreen
              plus={
                <span className="relative inline-flex">
                  <PlusButton />
                  <span className="lens-found absolute top-1/2 left-1/2 -mt-[1.4rem] -ml-[1.4rem] h-[2.8rem] w-[2.8rem] rounded-full border-[3px] border-[#6d64f0] shadow-[0_0_0_5px_rgba(124,116,255,0.3),0_0_22px_8px_rgba(124,116,255,0.55)]" />
                </span>
              }
            />
            {/* Spotlight: dims everything except the area around the + button. */}
            <div
              className="lens-dim pointer-events-none absolute inset-0 z-10"
              style={{ background: "radial-gradient(circle at 50% 95.5%, transparent 1.6rem, rgb(28 27 46 / 0.45) 1.8rem)" }}
            />
            {/* Scanning phase */}
            <div className="lens-scanning pointer-events-none absolute inset-0 z-20 bg-[#7c74ff]/10">
              <div className="scan-line" />
              <p className="absolute top-1/2 left-1/2 w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white px-3 py-2 text-center text-[0.7rem] font-bold text-foreground shadow-card">
                Looking at your screenshot…
              </p>
            </div>
          </PhoneFrame>
          <p className="lens-found relative z-30 mx-auto mt-5 w-fit max-w-[18rem] rounded-2xl bg-card px-5 py-3 text-center text-lg font-bold text-foreground shadow-raised">
            <span aria-hidden="true">🔎 </span>Tech Helper found it — <span className="text-primary">Tap here.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
