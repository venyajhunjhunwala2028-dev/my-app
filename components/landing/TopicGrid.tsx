import Link from "next/link";

const TOPICS = [
  { emoji: "📱", label: "Phone", href: "/app/library?topic=phone" },
  { emoji: "💬", label: "WhatsApp", href: "/app/library?topic=whatsapp" },
  { emoji: "📸", label: "Instagram", href: "/app/library?topic=instagram" },
  { emoji: "📧", label: "Email", href: "/app/library?topic=email" },
  { emoji: "💻", label: "Computer", href: "/app/library?topic=computer" },
  { emoji: "🔐", label: "Scam Check", href: "/app/scam" },
] as const;

export default function TopicGrid() {
  return (
    <section aria-labelledby="topics-title" className="mx-auto w-full max-w-6xl px-4 py-12">
      <h2 id="topics-title" className="mb-8 text-3xl font-extrabold sm:text-4xl">
        How can I help?
      </h2>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {TOPICS.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-card p-4 text-center text-lg font-bold shadow-card transition-transform hover:-translate-y-1 hover:bg-lavender"
            >
              <span aria-hidden="true" className="text-4xl">
                {t.emoji}
              </span>
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
