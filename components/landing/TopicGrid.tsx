import Link from "next/link";
import { Arrow, CONTAINER, Label } from "./ui";

const TOPICS = [
  { emoji: "📱", label: "Phone", desc: "Bigger text, screenshots, volume, contacts", href: "/app/library?topic=phone" },
  { emoji: "💬", label: "WhatsApp", desc: "Photos, video calls, voice messages, groups", href: "/app/library?topic=whatsapp" },
  { emoji: "📸", label: "Instagram", desc: "Posts, stories, following, privacy", href: "/app/library?topic=instagram" },
  { emoji: "📧", label: "Email", desc: "Send, reply, add a photo, find old emails", href: "/app/library?topic=email" },
  { emoji: "💻", label: "Computer", desc: "Copy and paste, find files, turn it off", href: "/app/library?topic=computer" },
  { emoji: "🔐", label: "Scam Check", desc: "Is this message safe? Check it with me", href: "/app/scam" },
] as const;

/**
 * Topics as an editorial list: hairlines, big names and arrows. The whole row is the link's tap area
 * (a stretched ::after), but the link's name stays just the topic.
 */
export default function TopicGrid() {
  return (
    <section aria-labelledby="topics-title" className={`${CONTAINER} py-20 sm:py-28`}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <Label>Topics</Label>
          <h2 id="topics-title" className="display-lg">
            How can I help?
          </h2>
          <p className="max-w-[24ch] text-xl text-muted sm:text-2xl">Pick a topic to see simple, ready-made guides.</p>
        </div>
        <ul className="border-t border-foreground lg:col-span-9">
          {TOPICS.map((t) => (
            <li
              key={t.label}
              className="group relative flex min-h-[5.5rem] items-center gap-4 border-b border-border py-4 transition-colors hover:bg-surface sm:gap-6 sm:px-2"
            >
              <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-surface text-2xl transition-colors group-hover:bg-white">
                {t.emoji}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-6">
                <Link
                  href={t.href}
                  className="font-display text-[min(1.875rem,9vw)] font-medium tracking-[-0.02em] whitespace-nowrap after:absolute sm:min-w-[13rem] after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-4 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary sm:text-4xl"
                >
                  {t.label}
                </Link>
                <span className="text-base text-muted">{t.desc}</span>
              </span>
              <Arrow className="text-2xl" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
