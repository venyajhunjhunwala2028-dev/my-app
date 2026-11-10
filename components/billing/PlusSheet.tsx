"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Wordmark from "@/components/brand/Wordmark";
import PlusOffer from "@/components/billing/PlusOffer";
import PlusUnlocked from "@/components/billing/PlusUnlocked";
import { CONTAINER } from "@/components/landing/ui";
import { usePlus } from "@/lib/billing/plus";
import { useT } from "@/lib/i18n";

/** The paywall as a full-screen sheet over the page, opened from a locked entry point. */
export function PlusSheet({ onClose, onContinue }: { onClose: () => void; onContinue: () => void }) {
  const t = useT();
  const [code, setCode] = useState<string | null>(null);
  const closeRef = useRef(onClose);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    sheet.current?.querySelector<HTMLElement>("h2")?.setAttribute("tabindex", "-1");
    sheet.current?.querySelector<HTMLElement>("h2")?.focus();
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = before;
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={sheet} role="dialog" aria-modal="true" aria-label={t("plus.name")} className="sheet animate-fade-in">
      <div className={`${CONTAINER} sticky top-0 z-10 flex min-h-[4.5rem] items-center justify-between gap-4 bg-background pt-1`}>
        <Wordmark size="min(1.5rem, 6.8vw)" />
        <button
          type="button"
          className="inline-flex min-h-14 items-center gap-2 rounded-full px-1 text-lg font-semibold text-foreground in-data-[easy=on]:border-2 in-data-[easy=on]:border-foreground in-data-[easy=on]:px-5"
          onClick={onClose}
        >
          <span aria-hidden="true">✕</span>
          <span className="underline decoration-2 underline-offset-[6px]">{t("common.close")}</span>
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pt-4 pb-16 sm:px-8">
        {code ? (
          <PlusUnlocked code={code} onContinue={onContinue} />
        ) : (
          <>
            <PlusOffer onUnlocked={(grant) => setCode(grant.subscriptionId)} />
            <Link href="/app/plus" className="link-cta self-start text-lg">
              {t("settings.plusOpen")}
              <span aria-hidden="true">→</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * For a locked entry point: `requirePlus(action)` runs the action with Plus, and otherwise opens the paywall sheet
 * (render `sheet`), running the action after "Continue" once Plus is unlocked.
 */
export function usePlusGate() {
  const { isPlus, status } = usePlus();
  // Locked entry points show their Plus tag only once the phone's state is known, so Plus learners never see it flash.
  const locked = status === "free" || status === "lapsed";
  const [pending, setPending] = useState<null | (() => void)>(null);
  function requirePlus(action: () => void) {
    if (isPlus) action();
    else setPending(() => action);
  }
  const sheet = pending ? (
    <PlusSheet
      onClose={() => setPending(null)}
      onContinue={() => {
        setPending(null);
        pending();
      }}
    />
  ) : null;
  return { isPlus, locked, requirePlus, sheet };
}

/** A link to a Plus page: without Plus, tapping it opens the paywall sheet instead (the page is gated too). */
export function PlusLink({ href, onClick, children, ...rest }: ComponentProps<typeof Link> & { href: string; children: ReactNode }) {
  const router = useRouter();
  const { isPlus, requirePlus, sheet } = usePlusGate();
  function click(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (isPlus || e.defaultPrevented) return;
    e.preventDefault();
    requirePlus(() => router.push(href));
  }
  return (
    <>
      <Link href={href} onClick={click} {...rest}>
        {children}
      </Link>
      {sheet}
    </>
  );
}
