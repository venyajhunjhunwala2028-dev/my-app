"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Wordmark from "@/components/brand/Wordmark";
import Settings from "@/components/Settings";
import { CONTAINER } from "@/components/landing/ui";
import { useT } from "@/lib/i18n";

/*
 * The app's editorial shell, shared by every /app page and guide: the same top bar as the landing page
 * (wordmark left, one plain control right), a "← Back" link, "(Label)" metadata and hairline lists.
 */

/** The reading column for app pages: one comfortable column, centred under the wide top bar. */
export const PAGE_COLUMN = "mx-auto w-full max-w-2xl px-4 sm:px-8";

/**
 * Wordmark top-left (to the landing page) and "Aa Settings" as a plain underlined control top-right.
 * The Settings sheet opens full screen over the page.
 */
export function AppHeader({ settings = true }: { settings?: boolean }) {
  const t = useT();
  return (
    <header data-testid="app-header" className="bg-background">
      <div className={`${CONTAINER} flex min-h-[4.5rem] items-center justify-between gap-4 pt-1`}>
        <Link href="/" aria-label={t("home.title")} className="flex min-h-14 min-w-0 items-center rounded-lg">
          <Wordmark size="min(1.5rem, 6.8vw)" />
        </Link>
        {settings && <Settings />}
      </div>
    </header>
  );
}

/** "← Back to home": a link, or a button when the page goes back by itself (e.g. All practice). */
export function BackLink({
  href,
  onClick,
  children,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const inner = (
    <>
      <span aria-hidden="true" className="text-xl leading-none">
        ←
      </span>
      <span>{children}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`back-link self-start ${className}`}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`back-link self-start ${className}`}>
      {inner}
    </button>
  );
}

/**
 * Metabrand-style metadata in brackets: "(Step 2 of 5)". The brackets are decoration, so screen readers
 * (and tests) read just the words.
 */
export function Paren({ children }: { children: ReactNode }) {
  return (
    <>
      <span aria-hidden="true">(</span>
      {children}
      <span aria-hidden="true">)</span>
    </>
  );
}

/** A small "(Label)" line above a headline. */
export function Label({ children, className = "", id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={`label-paren text-base ${className}`}>
      <Paren>{children}</Paren>
    </p>
  );
}

/** A page's opening: "(label)", a big tight headline and an optional lead. */
export function PageIntro({
  label,
  title,
  lead,
  titleId,
}: {
  label?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  titleId?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {label && <Label>{label}</Label>}
      <h1 id={titleId} className="display-lg max-w-[16ch]">
        {title}
      </h1>
      {lead && <p className="max-w-[36ch] text-xl leading-snug text-muted sm:text-2xl">{lead}</p>}
    </div>
  );
}

/** The inside of a hairline row: a round icon, the words, and an arrow. Ids let the row be named by its title. */
export function RowContent({
  icon,
  title,
  desc,
  titleId,
  descId,
  arrow = "→",
  titleClassName = "text-xl font-semibold",
  extra,
}: {
  icon?: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  titleId?: string;
  descId?: string;
  arrow?: ReactNode;
  titleClassName?: string;
  /** Something after the words, before the arrow (a "✓ Done" tag). */
  extra?: ReactNode;
}) {
  return (
    <>
      {icon && (
        <span aria-hidden="true" className="row-icon">
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span id={titleId} className={`leading-tight ${titleClassName}`}>
          {title}
        </span>
        {desc && (
          <span id={descId} className="text-base leading-snug text-muted">
            {desc}
          </span>
        )}
      </span>
      {extra}
      {arrow && (
        <span aria-hidden="true" className="row-arrow">
          {arrow}
        </span>
      )}
    </>
  );
}

/** A page under the app header: an optional back link, then the page in one column. */
export function AppPage({
  back,
  children,
  className = "",
}: {
  back?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      <AppHeader />
      <main className={`${PAGE_COLUMN} flex flex-1 flex-col gap-8 pt-2 pb-20 ${className}`}>
        {back}
        {children}
      </main>
    </>
  );
}
