import Link from "next/link";

const WAYS = [
  { id: "ask", verb: "Ask", emoji: "💬", text: "Type your question", href: "/app?start=ask" },
  { id: "speak", verb: "Speak", emoji: "🎙️", text: "Tell me what you need", href: "/app?start=speak" },
  { id: "show", verb: "Show", emoji: "📷", text: "Upload a screenshot", href: "/app/press" },
] as const;

/** Ask / Speak / Show. Show is the most prominent: it is the thing other helpers can't do. */
export default function WaysToAsk() {
  return (
    <section aria-labelledby="ways-title" className="mx-auto w-full max-w-6xl px-4 py-12">
      <h2 id="ways-title" className="mb-8 text-3xl font-extrabold sm:text-4xl">
        Three easy ways to get help
      </h2>
      <ul className="grid gap-5 md:grid-cols-3 md:items-stretch">
        {WAYS.map((w) => {
          const show = w.id === "show";
          return (
            <li key={w.id} className={show ? "md:-my-3" : ""}>
              <Link
                href={w.href}
                aria-label={`${w.verb}: ${w.text}`}
                className={`group flex h-full flex-col gap-3 rounded-[1.5rem] p-6 transition-transform hover:-translate-y-1 active:translate-y-0 ${
                  show
                    ? "bg-primary text-primary-foreground shadow-raised"
                    : "bg-card text-foreground shadow-card"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-4xl ${show ? "bg-white/15" : "bg-lavender"}`}
                >
                  {w.emoji}
                </span>
                <span className={`text-sm font-extrabold tracking-[0.15em] uppercase ${show ? "text-white/85" : "text-primary"}`}>
                  {w.verb}
                </span>
                <span className="text-2xl font-bold">{w.text}</span>
                {show && <span className="text-lg text-white/90">I&apos;ll point to exactly what to tap.</span>}
                <span aria-hidden="true" className="mt-auto pt-2 text-lg font-bold">
                  Start →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
