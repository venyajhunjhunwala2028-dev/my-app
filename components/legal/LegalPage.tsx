import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/brand/Wordmark";
import { LegalNav } from "@/components/landing/Sections";
import { CONTAINER, Label } from "@/components/landing/ui";
import { BUSINESS } from "@/lib/business";

/** A legal page (Terms, Privacy, Refunds, Contact): plain, readable, in one column, with the small print linked. */
export default function LegalPage({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <>
      <header className="bg-background">
        <div className={`${CONTAINER} flex min-h-[4.5rem] items-center justify-between gap-4 pt-1`}>
          <Link href="/" aria-label="Tech Helper home" className="flex min-h-12 items-center rounded-lg">
            <Wordmark size="min(1.5rem, 6.8vw)" />
          </Link>
          <Link href="/app" className="link-cta text-base sm:text-lg">
            Open the app<span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 pt-6 pb-20 sm:px-8">
        <div className="flex flex-col gap-4">
          <Label>{label}</Label>
          <h1 className="display-lg">{title}</h1>
          <p className="text-base text-muted">Last updated: {BUSINESS.lastUpdated}</p>
        </div>
        <div className="flex flex-col gap-8 text-lg leading-relaxed">{children}</div>
      </main>
      <footer className="night-field">
        <div className={`${CONTAINER} flex flex-col gap-6 py-12`}>
          <Wordmark tone="white" accent="blue" size="min(2rem, 9vw)" />
          <LegalNav />
          <p className="text-base text-night-muted">
            {BUSINESS.name} · {BUSINESS.email}
          </p>
        </div>
      </footer>
    </>
  );
}

/** One titled part of a legal page. */
export function Part({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em]">{title}</h2>
      {children}
    </section>
  );
}

/** A plain bulleted list for legal text. */
export function Bullets({ items }: { items: readonly ReactNode[] }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** The business's contact details, from lib/business.ts. */
export function ContactDetails() {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
      <dt className="font-semibold">Business</dt>
      <dd>{BUSINESS.name}</dd>
      <dt className="font-semibold">Email</dt>
      <dd>
        <a href={`mailto:${BUSINESS.email}`} className="underline underline-offset-4">
          {BUSINESS.email}
        </a>
      </dd>
      <dt className="font-semibold">Phone</dt>
      <dd>{BUSINESS.phone}</dd>
      <dt className="font-semibold">Address</dt>
      <dd>{BUSINESS.address}</dd>
    </dl>
  );
}
