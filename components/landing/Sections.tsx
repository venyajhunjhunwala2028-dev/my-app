import Link from "next/link";
import Mascot from "@/components/Mascot";
import { Family, PersonLaptop, ScamShield } from "@/components/illustrations";
import HowItWorksDemo from "./HowItWorksDemo";

function Eyebrow({ children }: { children: string }) {
  return <p className="text-sm font-extrabold tracking-[0.15em] text-primary uppercase">{children}</p>;
}

export function SeeHowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 py-16">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Try it here</Eyebrow>
        <h2 id="how-title" className="text-3xl font-extrabold sm:text-5xl">
          See how Tech Helper works
        </h2>
        <p className="max-w-2xl text-xl text-muted">
          One clear step at a time. You tell me when you&apos;re ready for the next one.
        </p>
      </div>
      <HowItWorksDemo />
    </section>
  );
}

const LESSONS = ["Teach me WhatsApp", "Teach me Instagram", "Teach me online safety"] as const;

export function LearnTechnology() {
  return (
    <section aria-labelledby="learn-title" className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="card grid items-center gap-8 p-5 sm:p-10 md:grid-cols-[1fr_16rem]">
        <div className="flex flex-col gap-5">
          <Eyebrow>Learn at your own pace</Eyebrow>
          <h2 id="learn-title" className="text-3xl font-extrabold sm:text-4xl">
            Learn technology
          </h2>
          <p className="text-xl text-muted">Short, friendly lessons for beginners. No question is too small.</p>
          <ul className="flex flex-wrap gap-3">
            {LESSONS.map((l) => (
              <li key={l}>
                <Link href="/app/learn" className="chip text-lg">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-[16rem]">
          <PersonLaptop />
        </div>
      </div>
    </section>
  );
}

const BADGES = [
  { emoji: "🟢", label: "Probably safe", cls: "bg-safe-surface text-safe" },
  { emoji: "🟡", label: "Be careful", cls: "bg-caution-surface text-caution" },
  { emoji: "🔴", label: "Potential scam", cls: "bg-danger-surface text-danger" },
] as const;

export function ScamCheck() {
  return (
    <section id="safety" aria-labelledby="safety-title" className="mx-auto w-full max-w-6xl scroll-mt-28 px-4 py-12">
      <div className="grid items-center gap-8 rounded-[2rem] bg-caution-surface p-5 sm:p-10 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Eyebrow>Safety first</Eyebrow>
          <h2 id="safety-title" className="text-3xl font-extrabold sm:text-4xl">
            <span aria-hidden="true">🔐 </span>Not sure about a message? Send it to me.
          </h2>
          <p className="text-xl">I&apos;ll help you check. If someone asks for your OTP, password or money, I&apos;ll warn you.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/app/scam" className="btn-primary sm:w-auto sm:px-6">
              <span aria-hidden="true" className="mr-2">📷</span>Upload screenshot
            </Link>
            <Link href="/app/scam" className="btn-secondary sm:w-auto sm:px-6">
              <span aria-hidden="true" className="mr-2">📋</span>Paste message
            </Link>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="mx-auto w-40 sm:w-48">
            <ScamShield />
          </div>
          <div className="card flex flex-col gap-4 p-4 sm:p-6">
            <p className="text-base font-bold text-muted">What you&apos;ll see:</p>
            <ul className="flex flex-wrap gap-2">
              {BADGES.map((b) => (
                <li key={b.label} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold ${b.cls}`}>
                  <span aria-hidden="true">{b.emoji}</span>
                  {b.label}
                </li>
              ))}
            </ul>
            <div className="rounded-2xl bg-danger-surface p-3 sm:p-4">
              <p className="font-bold text-danger">
                <span aria-hidden="true">🔴 </span>Potential scam. Why?
              </p>
              <p className="text-lg">
                The message is asking you to share an OTP. Legitimate banks will never ask you to share your OTP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Families() {
  return (
    <section aria-labelledby="family-title" className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Eyebrow>For families</Eyebrow>
          <h2 id="family-title" className="text-3xl font-extrabold sm:text-5xl">
            Technology help, without the phone call.
          </h2>
          <p className="text-xl text-muted">So you don&apos;t have to explain the same thing for the fifth time.</p>
          <div className="flex flex-col gap-3" aria-label="Example conversation" role="group">
            <p className="max-w-xs rounded-3xl rounded-bl-md bg-card px-5 py-3 text-lg shadow-card">
              <strong>Mom:</strong> &ldquo;How do I send this photo?&rdquo;
            </p>
            <div className="ml-auto flex items-end gap-2">
              <p className="max-w-xs rounded-3xl rounded-br-md bg-primary px-5 py-3 text-lg text-primary-foreground">
                <strong>Tech Helper:</strong> &ldquo;Let&apos;s do it together.&rdquo;
              </p>
              <Mascot mood="success" size={2.8} animate={false} />
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[16rem] md:max-w-sm">
          <Family />
        </div>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <div className="card flex flex-col gap-4">
          <h3 className="text-2xl font-extrabold">Set it up for someone you love</h3>
          <ol className="flex flex-col gap-3 text-lg">
            <li className="flex gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-primary">1</span>
              <span>Open Tech Helper on their phone&apos;s web browser.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-primary">2</span>
              <span>Add it to the home screen, so it opens like an app.</span>
            </li>
            <li className="flex gap-3">
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lavender font-bold text-primary">3</span>
              <span>Save your number for the &ldquo;Call family&rdquo; button.</span>
            </li>
          </ol>
          <Link href="/app" className="btn-secondary mt-auto">
            Set it up now
          </Link>
        </div>
        <div className="card-lavender flex flex-col gap-4">
          <h3 className="text-2xl font-extrabold">
            <span aria-hidden="true">👨‍👩‍👧 </span>Ask my family
          </h3>
          <p className="text-lg">
            When they&apos;re stuck, one tap sends you a message by WhatsApp or text that says exactly which step
            they&apos;re on, with a screenshot if they like. You can help in seconds.
          </p>
          <p className="text-lg text-muted">
            There are no accounts. Their questions stay on their own phone.
          </p>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="mt-8 border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Mascot size={2.5} animate={false} />
          <span className="text-xl font-extrabold">Tech Helper</span>
        </div>
        <p className="max-w-xl text-base text-muted">
          <span aria-hidden="true">🔒 </span>Nothing you ask is stored on our servers. Questions are sent to an AI service
          to be answered.
        </p>
      </div>
    </footer>
  );
}
