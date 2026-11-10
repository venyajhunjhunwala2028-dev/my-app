"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Paren } from "@/components/app/AppShell";
import FakeCheckout from "@/components/billing/FakeCheckout";
import RestoreForm from "@/components/billing/RestoreForm";
import { BUSINESS } from "@/lib/business";
import type { PlusGrant } from "@/lib/billing/api";
import { fetchPlusStatus, getBillingConfig, startSubscription, verifyPayment, type CheckoutResponse } from "@/lib/billing/client";
import { openCheckout, type CheckoutOutcome } from "@/lib/billing/checkout";
import { keepSubscriptionId, savePlusGrant, usePlus } from "@/lib/billing/plus";
import { useT, type MessageKey } from "@/lib/i18n";

export const PLUS_BENEFITS: readonly MessageKey[] = ["plus.benefit.lessons", "plus.benefit.practice", "plus.benefit.family"];
export const FREE_FEATURES: readonly MessageKey[] = [
  "plus.free.ask",
  "plus.free.guides",
  "plus.free.press",
  "plus.free.scam",
  "plus.free.library",
  "plus.free.settings",
  "plus.free.call",
];

/** "Free for everyone": the honest list of what stays free. */
export function FreeList({ tone = "night", id }: { tone?: "night" | "light"; id?: string }) {
  const t = useT();
  return (
    <div id={id} className="flex flex-col gap-3">
      <h3 className={`text-xl font-semibold ${tone === "night" ? "text-white" : ""}`}>{t("plus.freeTitle")}</h3>
      <ul className="flex flex-col gap-2">
        {FREE_FEATURES.map((key) => (
          <li key={key} className={`flex gap-3 text-lg ${tone === "night" ? "text-night-muted" : "text-muted"}`}>
            <span aria-hidden="true">✓</span>
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One calm line naming what bank and UPI statements show (an individual Razorpay account shows the owner's name). */
export function StatementLine({ className = "" }: { className?: string }) {
  const t = useT();
  return <p className={`text-base ${className}`}>{t("plus.statement", { name: BUSINESS.statementName })}</p>;
}

type Flow =
  | { kind: "idle" }
  | { kind: "opening" }
  | { kind: "fake"; subscriptionId: string; payment: CheckoutResponse }
  | { kind: "verifying" }
  | { kind: "problem"; message: MessageKey; retry?: () => void };

/** "Unlock Plus — ₹99/month": if it wraps, the dash stays with "Plus" and the price stays whole. */
function unlockLabel(text: string) {
  const [name, price] = text.split(" — ");
  if (!price) return text;
  return (
    <span>
      <span className="whitespace-nowrap">{name} —</span> <span className="whitespace-nowrap">{price}</span>
    </span>
  );
}

/** What happens after Checkout closes. */
export function outcomeMessage(outcome: CheckoutOutcome): MessageKey | null {
  if (outcome.kind === "dismissed") return "plus.dismissed";
  if (outcome.kind === "failed") return "plus.failed";
  if (outcome.kind === "unavailable") return "plus.loadFailed";
  return null;
}

/**
 * The Plus offer, on the night field: lock, "This is part of Tech Helper Plus", what's included, the price, then
 * "Unlock Plus — ₹99/month" (Razorpay Checkout), "I already have Plus" (restore code) and "What's free?".
 * When payments are not set up yet the offer still shows, and the button says so kindly.
 */
export default function PlusOffer({
  onUnlocked,
  title,
  lead,
  headingLevel = 2,
}: {
  onUnlocked: (grant: PlusGrant) => void;
  title?: string;
  lead?: string;
  headingLevel?: 1 | 2;
}) {
  const t = useT();
  const id = useId();
  const plus = usePlus();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [flow, setFlow] = useState<Flow>({ kind: "idle" });
  const [restoring, setRestoring] = useState(false);
  const [showFree, setShowFree] = useState(false);
  const fakeDone = useRef<((outcome: CheckoutOutcome) => void) | null>(null);
  const Heading = headingLevel === 1 ? "h1" : "h2";

  useEffect(() => {
    let live = true;
    void getBillingConfig().then((result) => {
      if (!live) return;
      // Offline: assume it is set up; tapping the button explains what went wrong.
      setConfigured(result.ok ? result.data.configured : true);
    });
    return () => {
      live = false;
    };
  }, []);

  function unlocked(grant: PlusGrant) {
    setFlow({ kind: "idle" });
    onUnlocked(grant);
  }

  /** After a payment: our server checks the signature and asks Razorpay; then Plus is on. */
  async function finish(response: CheckoutResponse) {
    keepSubscriptionId(response.razorpay_subscription_id);
    setFlow({ kind: "verifying" });
    const result = await verifyPayment(response);
    if (result.ok) {
      savePlusGrant(result.data);
      return unlocked(result.data);
    }
    const retry = () => void retryUnlock(response.razorpay_subscription_id);
    setFlow({ kind: "problem", message: result.error === "rate_limited" ? "plus.rateLimited" : "plus.verifyFailed", retry });
  }

  /** "Try again" after a payment that went through: the status check needs only the restore code. */
  async function retryUnlock(subscriptionId: string) {
    setFlow({ kind: "verifying" });
    const result = await fetchPlusStatus(subscriptionId);
    if (result.ok && result.data.active) {
      savePlusGrant(result.data);
      return unlocked(result.data);
    }
    setFlow({ kind: "problem", message: "plus.verifyFailed", retry: () => void retryUnlock(subscriptionId) });
  }

  async function unlock() {
    if (flow.kind === "opening" || flow.kind === "verifying") return;
    setFlow({ kind: "opening" });
    const sub = await startSubscription();
    if (!sub.ok) {
      if (sub.error === "not_configured") {
        setConfigured(false);
        return setFlow({ kind: "idle" });
      }
      return setFlow({ kind: "problem", message: sub.error === "rate_limited" ? "plus.rateLimited" : "plus.error" });
    }
    const { subscriptionId, keyId, fakePayment } = sub.data;
    let outcome: CheckoutOutcome;
    if (fakePayment) {
      outcome = await new Promise<CheckoutOutcome>((resolve) => {
        fakeDone.current = resolve;
        setFlow({ kind: "fake", subscriptionId, payment: { razorpay_subscription_id: subscriptionId, ...fakePayment } });
      });
    } else {
      outcome = await openCheckout(keyId, subscriptionId);
    }
    if (outcome.kind === "paid") return void finish(outcome.response);
    setFlow({ kind: "problem", message: outcomeMessage(outcome) ?? "plus.error" });
  }

  function endFake(outcome: CheckoutOutcome) {
    fakeDone.current?.(outcome);
    fakeDone.current = null;
  }

  const busy = flow.kind === "opening" || flow.kind === "verifying" || flow.kind === "fake";
  const unavailable = configured === false;
  const buttonText = unavailable
    ? t("plus.notAvailable")
    : flow.kind === "opening" || flow.kind === "fake"
      ? t("plus.opening")
      : flow.kind === "verifying"
        ? t("plus.checking")
        : unlockLabel(t("plus.unlock"));

  return (
    <section
      aria-labelledby={`${id}-title`}
      data-testid="plus-offer"
      className="media-card night-field flex flex-col gap-6 px-5 py-7 sm:px-10 sm:py-10"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-2xl">
          🔒
        </span>
        <span className="text-base font-medium text-night-muted">
          <Paren>{t("plus.name")}</Paren>
        </span>
      </div>
      <div className="flex flex-col gap-3">
        <Heading id={`${id}-title`} className="display-md max-w-[20ch] text-white">
          {title ?? t("plus.lockedTitle")}
        </Heading>
        <p className="max-w-[38ch] text-xl text-night-muted">{lead ?? t("plus.lockedLead")}</p>
      </div>
      {plus.status === "lapsed" && <p className="text-lg font-semibold text-white">{t("plus.lapsed")}</p>}
      <div className="flex flex-col gap-3 border-t border-night-line pt-5">
        <h3 className="text-xl font-semibold text-white">{t("plus.includes")}</h3>
        <ul className="flex flex-col gap-3">
          {PLUS_BENEFITS.map((key) => (
            <li key={key} className="flex gap-3 text-lg text-white">
              <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold">
                ✓
              </span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em] text-white">{t("plus.price")}</p>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="btn-light min-h-16 px-4 text-lg sm:text-xl"
          disabled={busy || unavailable}
          aria-describedby={unavailable ? `${id}-unavailable` : `${id}-statement`}
          onClick={() => void unlock()}
        >
          {buttonText}
        </button>
        {unavailable ? (
          <p id={`${id}-unavailable`} className="text-lg text-night-muted">
            {t("plus.notAvailableDesc")}
          </p>
        ) : (
          <div id={`${id}-statement`} className="flex flex-col gap-1 text-night-muted">
            <p className="text-base">{t("plus.autopay")}</p>
            <StatementLine />
          </div>
        )}
        {flow.kind === "problem" && (
          <div role="alert" className="flex flex-col gap-3 rounded-[1rem] bg-white p-4 text-foreground">
            <p className="text-lg font-semibold">{t(flow.message)}</p>
            {flow.retry && (
              <button type="button" className="btn-primary" onClick={flow.retry}>
                {t("plus.tryAgain")}
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          aria-expanded={restoring}
          className="btn min-h-14 border-2 border-white text-white hover:bg-white/10"
          onClick={() => setRestoring((r) => !r)}
        >
          {t("plus.haveIt")}
        </button>
        {restoring && <RestoreForm initialCode={plus.subscriptionId ?? ""} onRestored={unlocked} />}
        <button
          type="button"
          aria-expanded={showFree}
          aria-controls={`${id}-free`}
          className="btn-text self-start px-0 text-white"
          onClick={() => setShowFree((s) => !s)}
        >
          {t("plus.whatsFree")}
        </button>
        {showFree && <FreeList id={`${id}-free`} />}
      </div>
      {flow.kind === "fake" && (
        <FakeCheckout
          onPay={() => endFake({ kind: "paid", response: flow.payment })}
          onFail={() => endFake({ kind: "failed" })}
          onClose={() => endFake({ kind: "dismissed" })}
        />
      )}
    </section>
  );
}
