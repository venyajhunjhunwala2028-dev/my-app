import Form from "next/form";
import Link from "next/link";
import Mascot from "@/components/Mascot";
import { OlderPersonPhone } from "@/components/illustrations";

/** Things people want to get done, in their own words. "Is this message safe?" opens the scam check. */
export const TRY_ASKING = [
  "I want to send a photo to my daughter",
  "I want to post something on Instagram",
  "Is this message safe?",
] as const;

export const askHref = (q: string) => `/app?q=${encodeURIComponent(q)}`;

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pt-10 pb-14 lg:grid-cols-[1.25fr_1fr] lg:pt-16">
      <div className="flex flex-col gap-6">
        <Mascot mood="ready" size={4.5} className="animate-fade-in">
          Hi! I&apos;m your Tech Helper <span aria-hidden="true">👋</span>
        </Mascot>
        <h1 id="hero-title" className="text-[2.2rem] leading-[1.1] font-extrabold sm:text-6xl">
          Technology doesn&apos;t have to be confusing.
        </h1>
        <p className="max-w-2xl text-xl text-muted sm:text-2xl">
          Tell me what you&apos;re trying to do, and I&apos;ll guide you one step at a time.
        </p>

        {/* A real GET form: /app?q=… asks the question straight away (works without JavaScript too). */}
        <Form action="/app" className="card flex flex-col gap-3 p-4 sm:p-5">
          <label htmlFor="landing-question" className="text-xl font-bold">
            <span aria-hidden="true">💬 </span>What would you like to do?
          </label>
          <p id="landing-question-hint" className="text-lg text-muted">
            Say it in your own words. There are no silly questions.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="landing-question"
              name="q"
              type="text"
              required
              maxLength={500}
              autoComplete="off"
              aria-describedby="landing-question-hint"
              enterKeyHint="go"
              placeholder="e.g. send a photo to my daughter"
              className="min-h-16 w-full flex-1 rounded-2xl border-2 border-border bg-background px-5 text-xl placeholder:text-muted/80 focus:border-primary"
            />
            <button type="submit" className="btn-primary min-h-16 px-8 text-xl sm:w-auto">
              Help me
            </button>
          </div>
        </Form>

        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold text-muted">Try asking:</p>
          <ul className="flex flex-wrap gap-3">
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
      <div className="mx-auto hidden w-full max-w-md lg:block">
        <OlderPersonPhone />
      </div>
    </section>
  );
}
