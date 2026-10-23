import Link from "next/link";

export default function Landing() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-16 px-4 py-12">
      <section className="flex flex-col gap-6">
        <h1 className="text-4xl font-bold leading-tight">
          Ask any phone, computer or AI question. Get the steps one at a time.
        </h1>
        <p className="text-xl text-muted">
          Tech Helper shows you exactly what to tap, in big clear steps, read aloud in your language. Stuck? Send a
          screenshot and it circles the button for you.
        </p>
        <Link href="/app" className="btn-primary max-w-sm">
          Start asking, it&apos;s free
        </Link>
        <p className="text-base text-muted">No sign-up. Works on your phone&apos;s web browser.</p>
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold">How it works</h2>
        <ol className="flex flex-col gap-4 text-xl">
          <li>
            <strong>1. Ask out loud or type.</strong> &ldquo;How do I post a story on Instagram?&rdquo;
          </li>
          <li>
            <strong>2. Follow one big step at a time.</strong> Tap &ldquo;Done&rdquo; when you&apos;re ready for the
            next one.
          </li>
          <li>
            <strong>3. Can&apos;t find the button?</strong> Send a screenshot and see it circled.
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold">Built to keep you safe</h2>
        <p className="text-xl">
          If someone asks for your OTP, password or money, Tech Helper warns you it may be a scam and helps you call
          family instead. Nothing you ask is stored on our servers.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-3xl font-bold">Set it up for someone you love</h2>
        <p className="text-xl">
          Open it on their phone, add it to the home screen, and save your number for the &ldquo;Call family&rdquo;
          button. Then they can ask whenever you&apos;re not there.
        </p>
        <Link href="/app" className="btn-secondary max-w-sm">
          Set it up now
        </Link>
      </section>
    </main>
  );
}
