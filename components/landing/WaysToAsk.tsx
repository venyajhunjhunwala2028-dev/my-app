import Link from "next/link";
import { Arrow, CONTAINER, SectionHeader } from "./ui";

const WAYS = [
  { id: "ask", n: "01", verb: "Ask", text: "Type your question", more: "In your own words, as if you were asking a friend.", href: "/app?start=ask" },
  { id: "speak", n: "02", verb: "Speak", text: "Tell me what you need", more: "Tap the microphone and just say it. No typing.", href: "/app?start=speak" },
  { id: "show", n: "03", verb: "Show", text: "Upload a screenshot", more: "I'll point to exactly what to tap.", href: "/app/press" },
] as const;

/** Ask / Speak / Show as an editorial row of three. Show is emphasised: it is what other helpers can't do. */
export default function WaysToAsk() {
  return (
    <section id="ways" aria-labelledby="ways-title" className={`${CONTAINER} scroll-mt-24 py-20 sm:py-28`}>
      <SectionHeader label="How to ask" id="ways-title" title="Three ways to ask." />
      <ul className="mt-12 grid grid-cols-1 gap-4 md:mt-16 md:grid-cols-3 md:gap-5">
        {WAYS.map((w) => {
          const show = w.id === "show";
          return (
            <li key={w.id}>
              <Link
                href={w.href}
                aria-label={`${w.verb}: ${w.text}`}
                className={`group flex h-full min-h-[19rem] flex-col gap-4 rounded-[1.2rem] p-6 transition-colors sm:p-8 ${
                  show
                    ? "blue-field text-white"
                    : "border border-border bg-card text-foreground hover:border-foreground"
                }`}
              >
                <span className="flex items-baseline justify-between">
                  <span aria-hidden="true" className={`font-display text-6xl font-medium tracking-[-0.04em] ${show ? "text-white" : "text-primary"}`}>
                    {w.n}
                  </span>
                  {show && (
                    <span className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-white">Most helpful</span>
                  )}
                </span>
                <span className="mt-auto flex flex-col gap-2">
                  <span className={`text-base font-semibold ${show ? "text-on-blue-muted" : "text-muted"}`}>{w.verb}</span>
                  <span className="font-display text-3xl leading-tight font-medium tracking-[-0.02em]">{w.text}</span>
                  <span className={`text-lg ${show ? "text-on-blue-muted" : "text-muted"}`}>{w.more}</span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-lg font-semibold underline decoration-2 underline-offset-[6px]"
                >
                  Start <Arrow />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
