import Form from "next/form";
import Link from "next/link";
import Wordmark, { BrandGlyph } from "@/components/brand/Wordmark";
import HowItWorksDemo from "./HowItWorksDemo";
import PhoneFrame from "./PhoneFrame";
import { LockScreen, ScamScreen } from "./Screens";
import { NAV_LINKS } from "./TopBar";
import { CONTAINER, Label, SectionHeader } from "./ui";

export function SeeHowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="w-full scroll-mt-24 bg-surface py-20 sm:py-28">
      <div className={CONTAINER}>
        <SectionHeader
          label="Try it here"
          id="how-title"
          title="See how Tech Helper works"
          intro="One clear step at a time. You tell me when you're ready for the next one."
        />
        <div className="mt-12 md:mt-16">
          <HowItWorksDemo />
        </div>
      </div>
    </section>
  );
}

const LESSONS = ["Teach me WhatsApp", "Teach me Instagram", "Teach me online safety"] as const;

export function LearnTechnology() {
  return (
    <section id="learn" aria-labelledby="learn-title" className={`${CONTAINER} scroll-mt-24 py-20 sm:py-28`}>
      <SectionHeader
        label="Learn"
        id="learn-title"
        title="Learn technology, at your own pace."
        intro="Short, friendly lessons for beginners. No question is too small."
      />
      <div className="mt-12 grid grid-cols-1 gap-5 md:mt-16 md:grid-cols-2">
        <div className="flex flex-col gap-6 rounded-[1.2rem] bg-surface p-6 sm:p-10">
          <Label>Teach me</Label>
          <h3 className="display-md">Lessons that explain, show, then let you try.</h3>
          <ul className="flex flex-wrap gap-2.5">
            {LESSONS.map((l) => (
              <li key={l}>
                <Link href="/app/learn" className="chip sm:text-lg">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/app/learn" className="link-cta mt-auto self-start text-lg">
            See all lessons<span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="flex flex-col gap-6 rounded-[1.2rem] bg-night p-6 text-white sm:p-10">
          <Label className="text-night-muted!">Practice</Label>
          <h3 className="display-md text-white">Practise on a pretend phone.</h3>
          <p className="max-w-[34ch] text-xl text-night-muted">
            Tap where you think you should go. Nothing real happens, so there&apos;s nothing to worry about.
          </p>
          <Link href="/app/practice" className="btn-light mt-auto self-start px-8 text-lg sm:w-auto">
            Start practising →
          </Link>
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
    <section id="safety" aria-labelledby="safety-title" className={`${CONTAINER} scroll-mt-24 py-20 sm:py-28`}>
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-7 lg:col-span-7">
          <Label>Safety</Label>
          <h2 id="safety-title" className="display-lg">
            Not sure about a message? Send it to me.
          </h2>
          <p className="max-w-[34ch] text-xl text-muted sm:text-2xl">
            I&apos;ll help you check. If someone asks for your OTP, password or money, I&apos;ll warn you.
          </p>
          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold">What you&apos;ll see:</p>
            <ul className="flex flex-wrap gap-2">
              {BADGES.map((b) => (
                <li key={b.label} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-base font-semibold ${b.cls}`}>
                  <span aria-hidden="true">{b.emoji}</span>
                  {b.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="border-l-4 border-danger pl-5">
            <p className="font-semibold text-danger">
              <span aria-hidden="true">🔴 </span>Potential scam. Why?
            </p>
            <p className="text-lg">
              The message is asking you to share an OTP. Legitimate banks will never ask you to share your OTP.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/app/scam" className="btn-primary sm:w-auto sm:px-7 sm:whitespace-nowrap">
              <span aria-hidden="true" className="mr-1">📷</span>Upload screenshot
            </Link>
            <Link href="/app/scam" className="btn-secondary sm:w-auto sm:px-7 sm:whitespace-nowrap">
              <span aria-hidden="true" className="mr-1">📋</span>Paste message
            </Link>
          </div>
        </div>
        <div
          role="img"
          aria-label="A scam check on a phone: a message asking for an OTP is marked as a potential scam, with the reason why."
          className="media-card blue-field flex justify-center px-4 pt-12 lg:col-span-5 lg:py-16"
        >
          <PhoneFrame width={14} className="-mb-16 lg:mb-0">
            <ScamScreen />
          </PhoneFrame>
        </div>
      </div>
    </section>
  );
}

const SETUP = [
  "Open Tech Helper on their phone's web browser.",
  "Add it to the home screen, so it opens like an app.",
  "Save your number for the “Call family” button.",
] as const;

const ASK_FAMILY = [
  "When they're stuck, they tap Ask my family.",
  "The message says what they're trying to do and which step they're on, with a picture of their screen if they like.",
  "It's sent from their own phone, by WhatsApp or text. You can help in seconds.",
] as const;

function NumberedList({ items }: { items: readonly string[] }) {
  return (
    <ol className="flex flex-col border-t border-border">
      {items.map((s, i) => (
        <li key={s} className="flex gap-5 border-b border-border py-4 text-lg">
          <span aria-hidden="true" className="w-7 shrink-0 font-display text-base font-medium text-primary">
            0{i + 1}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function Families() {
  return (
    <section id="families" aria-labelledby="family-title" className="w-full scroll-mt-24 bg-surface py-20 sm:py-28">
      <div className={CONTAINER}>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="flex flex-col gap-7 lg:col-span-7">
            <Label>For families</Label>
            <h2 id="family-title" className="display-lg">
              Technology help, without the phone call.
            </h2>
            <p className="max-w-[30ch] text-xl text-muted sm:text-2xl">
              So you don&apos;t have to explain the same thing for the fifth time.
            </p>
            <p className="max-w-[40ch] text-lg">
              There are no accounts and no dashboards. Their questions stay on their own phone.
            </p>
          </div>
          <div
            role="img"
            aria-label="A family member's lock screen with a WhatsApp message from Mom: Mom is stuck while trying to post on Instagram. Mom is on Step 2 of 4: Tap the + button. Sent from Tech Helper, with a picture of her screen."
            className="media-card blue-field flex justify-center px-4 pt-12 lg:order-first lg:col-span-5 lg:py-16"
          >
            <PhoneFrame width={14} statusBar="light" screenClassName="bg-primary" className="-mb-16 lg:mb-0">
              <LockScreen />
            </PhoneFrame>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-5 rounded-[1.2rem] bg-card p-6 sm:p-10">
            <h3 className="display-md">Ask my family</h3>
            <NumberedList items={ASK_FAMILY} />
          </div>
          <div className="flex flex-col gap-5 rounded-[1.2rem] bg-card p-6 sm:p-10">
            <h3 className="display-md">Set it up for someone you love</h3>
            <NumberedList items={SETUP} />
            <Link href="/app" className="btn-secondary mt-auto sm:w-auto sm:self-start sm:px-8">
              Set it up now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const FAQS = [
  {
    q: "Is it free?",
    a: "Yes. Tech Helper is free to use. There's nothing to buy and no card to enter.",
  },
  {
    q: "Do I need to sign up?",
    a: "No. There are no accounts and no passwords to remember. Open it and ask your question.",
  },
  {
    q: "Is my information safe?",
    a: "Your questions are not saved on our servers. To answer them, they're sent to an AI service. Your saved guides and settings stay on your own phone. Never share an OTP, PIN or password with anyone, and Tech Helper will never ask you for one.",
  },
  {
    q: "Which phones does it work on?",
    a: "Any Android phone or iPhone with a web browser, and tablets and computers too. There's nothing to download: you can add it to your home screen so it opens like an app.",
  },
  {
    q: "Can it speak Hindi?",
    a: "Yes. Tech Helper works in English, Hindi and Hinglish. Choose your language in Settings, and tap Read this to me to hear a step out loud.",
  },
  {
    q: "What if I get stuck?",
    a: "Tap I'm stuck on any step. Send me a screenshot and I'll point to the right button, or tap Ask my family to send a message to someone you trust.",
  },
] as const;

/** Objection-handling FAQ: native <details>, so it works without JavaScript and with the keyboard. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className={`${CONTAINER} scroll-mt-24 py-20 sm:py-28`}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="flex flex-col gap-5 lg:col-span-4">
          <Label>Questions</Label>
          <h2 id="faq-title" className="display-lg">
            Good questions.
          </h2>
        </div>
        <div className="border-t border-foreground lg:col-span-8">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-border">
              <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 font-display text-2xl font-medium tracking-[-0.015em] sm:text-3xl [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-2xl leading-none transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="max-w-[60ch] pb-7 text-xl text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/** The last ask, on electric blue: a second question box that goes straight to /app?q=. */
export function FinalCta() {
  return (
    <section aria-labelledby="final-title" className="blue-field relative w-full overflow-hidden py-20 sm:py-28">
      <BrandGlyph className="pointer-events-none absolute top-1/2 -right-[6rem] hidden h-[34rem] w-[34rem] -translate-y-1/2 text-white opacity-10 lg:block" />
      <div className={`${CONTAINER} relative flex flex-col gap-10`}>
        <Label className="text-on-blue-muted!">Free · No sign-up · Any phone</Label>
        <h2 id="final-title" className="display-xl max-w-[14ch] text-white">
          Start asking&nbsp;— it&apos;s free.
        </h2>
        <Form action="/app" className="flex max-w-3xl flex-col gap-3">
          <label htmlFor="final-question" className="text-xl font-semibold text-white">
            Ask your first question
          </label>
          <div className="flex flex-col gap-2 rounded-[1.6rem] bg-white p-2 focus-within:outline-4 focus-within:outline-offset-2 focus-within:outline-white sm:flex-row sm:items-center sm:rounded-full">
            <input
              id="final-question"
              name="q"
              type="text"
              required
              maxLength={500}
              autoComplete="off"
              enterKeyHint="go"
              placeholder="e.g. bigger text"
              className="min-h-14 w-full flex-1 rounded-full bg-transparent px-4 text-xl text-foreground placeholder:text-muted focus-visible:outline-none"
            />
            <button type="submit" className="btn-primary min-h-14 px-8 text-xl sm:w-auto">
              Start asking
            </button>
          </div>
        </Form>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="night-field">
      <div className={`${CONTAINER} flex flex-col gap-12 py-16 sm:py-20`}>
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-4">
            <Wordmark tone="white" accent="blue" size="min(3rem, 13vw)" />
            <p className="max-w-[30ch] text-lg text-night-muted">Simple steps for any phone, computer or AI question.</p>
          </div>
          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-10 gap-y-1 text-lg sm:flex sm:flex-wrap sm:gap-x-8">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="inline-flex min-h-12 items-center text-white decoration-2 underline-offset-[6px] hover:underline">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#faq" className="inline-flex min-h-12 items-center text-white decoration-2 underline-offset-[6px] hover:underline">
                  Questions
                </a>
              </li>
              <li className="col-span-2">
                <Link href="/app" className="inline-flex min-h-12 items-center font-semibold text-white underline decoration-2 underline-offset-[6px]">
                  Open Tech Helper →
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="max-w-2xl border-t border-night-line pt-8 text-base text-night-muted">
          <span aria-hidden="true">🔒 </span>Nothing you ask is stored on our servers. Questions are sent to an AI service
          to be answered.
        </p>
      </div>
    </footer>
  );
}
