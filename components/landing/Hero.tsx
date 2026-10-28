import Form from "next/form";
import Link from "next/link";
import { BrandGlyph } from "@/components/brand/Wordmark";
import PhoneFrame from "./PhoneFrame";
import { StepScreen } from "./Screens";
import { CONTAINER } from "./ui";

export const TRY_ASKING = [
  "How do I post on Instagram?",
  "How do I send a photo on WhatsApp?",
  "Why isn't my Wi-Fi working?",
] as const;

export const askHref = (q: string) => `/app?q=${encodeURIComponent(q)}`;

/** Metabrand-style metadata row: "(Free)  ✳ No sign-up · Works on any phone". */
function MetaRow() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-foreground" aria-label="At a glance">
      <li className="text-muted">(Free)</li>
      <li className="flex items-center gap-2">
        <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <BrandGlyph className="h-3.5 w-3.5 text-white" />
        </span>
        No sign-up
      </li>
      <li aria-hidden="true" className="hidden text-muted sm:block">
        ·
      </li>
      <li>Works on any phone</li>
    </ul>
  );
}

/** The big electric-blue media card: the wordmark huge behind a phone showing a Tech Helper step. */
function HeroMedia() {
  return (
    <div
      role="img"
      aria-label="Tech Helper on a phone: Step 2 of 4, Tap the + button. A glowing ring shows exactly where to tap."
      className="media-card blue-field mt-10 flex flex-col items-center overflow-hidden px-4 pt-10 pb-10 lg:min-h-[46rem] lg:justify-center lg:py-16"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none relative z-0 font-brand leading-[0.8] font-semibold tracking-[-0.03em] whitespace-nowrap text-white select-none lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2"
        style={{ fontSize: "min(17vw, 16rem)" }}
      >
        tech helper
      </span>
      {/* Editorial captions, desktop only. */}
      <p aria-hidden="true" className="absolute top-8 left-8 hidden text-base text-on-blue-muted lg:block">
        (Step by step)
      </p>
      <p aria-hidden="true" className="absolute right-8 bottom-8 hidden max-w-[16rem] text-right text-base text-on-blue-muted lg:block">
        One clear step at a time, and a ring that shows exactly where to tap.
      </p>
      <PhoneFrame width={14.5} className="relative z-10 mt-8 lg:mt-0 lg:scale-[1.12]">
        <StepScreen />
      </PhoneFrame>
    </div>
  );
}

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className={`${CONTAINER} pt-10 sm:pt-12 lg:pt-10`}>
      <h1 id="hero-title" className="display-xl">
        Technology doesn&apos;t have to be confusing.
      </h1>
      <div className="mt-6">
        <MetaRow />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-6 lg:col-span-4">
          <p className="max-w-[26ch] text-2xl leading-snug sm:text-[1.75rem]">
            Tell me what you&apos;re trying to do, and I&apos;ll guide you one step at a time.
          </p>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-8">
          {/* A real GET form: /app?q=… asks the question straight away (works without JavaScript too). */}
          <Form action="/app" className="flex flex-col gap-3">
            <label htmlFor="landing-question" className="text-xl font-semibold">
              What would you like help with?
            </label>
            <div className="flex flex-col gap-2 rounded-[1.6rem] border-2 border-foreground bg-card p-2 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-primary sm:flex-row sm:items-center sm:rounded-full">
              <input
                id="landing-question"
                name="q"
                type="text"
                required
                maxLength={500}
                autoComplete="off"
                enterKeyHint="go"
                placeholder="e.g. send a photo"
                className="min-h-14 w-full flex-1 rounded-full bg-transparent px-4 text-xl placeholder:text-muted focus-visible:outline-none"
              />
              <button type="submit" className="btn-primary min-h-14 px-8 text-xl sm:w-auto">
                Help me
              </button>
            </div>
          </Form>

          <div className="flex flex-col gap-3">
            <p className="label-paren">(Try asking)</p>
            <ul className="flex flex-wrap gap-2.5">
              {TRY_ASKING.map((q) => (
                <li key={q}>
                  <Link href={askHref(q)} className="chip">
                    {q}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <HeroMedia />
    </section>
  );
}
