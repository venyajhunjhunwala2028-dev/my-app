"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Paren } from "@/components/app/AppShell";
import RestoreCode from "@/components/billing/RestoreCode";
import { PLUS_BENEFITS, StatementLine } from "@/components/billing/PlusOffer";
import { cancelPlan } from "@/lib/billing/client";
import { markCancelled, refreshPlus, usePlus } from "@/lib/billing/plus";
import { getPlus } from "@/lib/store/localStore";
import { useLocale, useT, type MessageKey } from "@/lib/i18n";

/** A date in the interface language: "10 December 2026". */
export function useFormatDate() {
  const { speechCode } = useLocale();
  return (ms: number) => new Intl.DateTimeFormat(speechCode, { day: "numeric", month: "long", year: "numeric" }).format(new Date(ms));
}

type Cancel = { kind: "idle" } | { kind: "confirm" } | { kind: "busy" } | { kind: "done" } | { kind: "problem"; message: MessageKey };

/**
 * With Plus on: what the plan is, the next payment (when known), the restore code, and "Cancel my plan" with a
 * clear confirm (no more payments; Plus stays on until the end of the paid month).
 */
export default function PlusPlan() {
  const t = useT();
  const formatDate = useFormatDate();
  const plus = usePlus();
  const [cancel, setCancel] = useState<Cancel>({ kind: "idle" });
  const confirmHeading = useRef<HTMLHeadingElement>(null);

  // Fresh status (and the next payment date) on a visit, at most every 10 minutes; offline keeps what is saved.
  useEffect(() => {
    void refreshPlus({ force: true, minAgeMs: 10 * 60 * 1000 });
  }, []);
  useEffect(() => {
    if (cancel.kind === "confirm") confirmHeading.current?.focus();
  }, [cancel.kind]);

  async function confirmCancel() {
    const saved = getPlus();
    if (!saved?.token) return;
    setCancel({ kind: "busy" });
    const result = await cancelPlan(saved.subscriptionId, saved.token);
    if (result.ok) {
      markCancelled(result.data.endsAt);
      return setCancel({ kind: "done" });
    }
    setCancel({ kind: "problem", message: result.error === "cannot_cancel" ? "plus.cannotCancel" : "plus.error" });
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="plan-heading" className="media-card blue-field flex flex-col gap-5 px-5 py-7 sm:px-10 sm:py-10">
        <p className="text-base font-medium text-on-blue-muted">
          <Paren>{t("plus.status.heading")}</Paren>
        </p>
        <h2 id="plan-heading" className="display-md flex items-center gap-3 text-white">
          <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl text-primary">
            ✓
          </span>
          {t("plus.status.on")}
        </h2>
        <ul className="flex flex-col gap-2">
          {PLUS_BENEFITS.map((key) => (
            <li key={key} className="flex gap-3 text-lg text-white">
              <span aria-hidden="true">✓</span>
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-1 border-t border-white/30 pt-4 text-xl text-white">
          {plus.cancelAtEnd && plus.validUntil ? (
            <p data-testid="plan-ends">{t("plus.status.endsOn", { date: formatDate(plus.validUntil) })}</p>
          ) : plus.nextBillingAt ? (
            <p data-testid="next-billing">{t("plus.status.nextBilling", { date: formatDate(plus.nextBillingAt) })}</p>
          ) : (
            plus.validUntil && <p>{t("plus.status.until", { date: formatDate(plus.validUntil) })}</p>
          )}
          <p className="text-lg text-on-blue-muted">{t("plus.price")}</p>
          {!plus.cancelAtEnd && <StatementLine className="text-on-blue-muted" />}
        </div>
      </section>

      {plus.subscriptionId && <RestoreCode code={plus.subscriptionId} />}

      {!plus.cancelAtEnd && cancel.kind !== "done" && (
        <section aria-labelledby="cancel-heading" className="flex flex-col gap-4 border-t border-foreground pt-6">
          {cancel.kind === "confirm" || cancel.kind === "busy" ? (
            <div role="alertdialog" aria-labelledby="cancel-heading" aria-describedby="cancel-text" className="card flex flex-col gap-4 sm:p-8">
              <h2 id="cancel-heading" ref={confirmHeading} tabIndex={-1} className="display-md outline-none">
                {t("plus.cancelTitle")}
              </h2>
              <p id="cancel-text" className="text-xl">
                {t("plus.cancelText")}
              </p>
              <button type="button" className="btn-primary" disabled={cancel.kind === "busy"} onClick={() => void confirmCancel()}>
                {cancel.kind === "busy" ? t("plus.cancelling") : t("plus.cancelYes")}
              </button>
              <button type="button" className="btn-secondary" disabled={cancel.kind === "busy"} onClick={() => setCancel({ kind: "idle" })}>
                {t("plus.cancelNo")}
              </button>
            </div>
          ) : (
            <>
              <h2 id="cancel-heading" className="sr-only">
                {t("plus.cancel")}
              </h2>
              <button type="button" className="btn-secondary sm:w-auto sm:self-start sm:px-10" onClick={() => setCancel({ kind: "confirm" })}>
                {t("plus.cancel")}
              </button>
            </>
          )}
          {cancel.kind === "problem" && (
            <p role="alert" className="text-lg font-semibold text-danger">
              {t(cancel.message)}{" "}
              {cancel.message === "plus.cannotCancel" && (
                <Link href="/contact" className="underline">
                  {t("plus.contact")}
                </Link>
              )}
            </p>
          )}
        </section>
      )}
      {cancel.kind === "done" && (
        <p role="status" className="rounded-[1.2rem] bg-safe-surface p-5 text-xl font-semibold text-safe">
          {t("plus.cancelled")}
        </p>
      )}
    </div>
  );
}
