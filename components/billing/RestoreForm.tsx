"use client";

import { useId, useState, type FormEvent } from "react";
import type { PlusGrant } from "@/lib/billing/api";
import { fetchPlusStatus } from "@/lib/billing/client";
import { cleanRestoreCode } from "@/lib/billing/plan";
import { savePlusGrant } from "@/lib/billing/plus";
import { useT, type MessageKey } from "@/lib/i18n";

/** "I already have Plus": the restore code (the subscription id) unlocks Plus on this phone, checked with Razorpay. */
export default function RestoreForm({ initialCode = "", onRestored }: { initialCode?: string; onRestored: (grant: PlusGrant) => void }) {
  const t = useT();
  const id = useId();
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<MessageKey | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const clean = cleanRestoreCode(code);
    if (!clean) return setProblem("plus.restoreInvalid");
    setBusy(true);
    setProblem(null);
    const result = await fetchPlusStatus(clean);
    setBusy(false);
    if (result.ok && result.data.active) {
      savePlusGrant(result.data);
      return onRestored(result.data);
    }
    if (result.ok) return setProblem("plus.restoreInactive");
    setProblem(
      result.error === "not_found" || result.error === "bad_request"
        ? "plus.restoreNotFound"
        : result.error === "not_configured"
          ? "plus.notAvailableDesc"
          : result.error === "rate_limited"
            ? "plus.rateLimited"
            : "plus.error",
    );
  }

  return (
    <form className="flex flex-col gap-3 rounded-[1.2rem] bg-card p-5 text-foreground sm:p-8" onSubmit={submit} noValidate>
      <h3 className="font-display text-[1.6rem] leading-tight font-medium tracking-[-0.02em]">{t("plus.restoreTitle")}</h3>
      <label htmlFor={`${id}-code`} className="text-xl font-semibold">
        {t("plus.codeLabel")}
      </label>
      <p id={`${id}-hint`} className="text-lg text-muted">
        {t("plus.restoreHint")}
      </p>
      <input
        id={`${id}-code`}
        aria-describedby={`${id}-hint${problem ? ` ${id}-problem` : ""}`}
        aria-invalid={problem === "plus.restoreInvalid" || problem === "plus.restoreNotFound" ? true : undefined}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="sub_…"
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        maxLength={60}
        className="field font-mono"
      />
      {problem && (
        <p id={`${id}-problem`} role="alert" className="text-lg font-semibold text-danger">
          {t(problem)}
        </p>
      )}
      <button type="submit" className="btn-primary" disabled={busy}>
        {busy ? t("plus.restoring") : t("plus.restoreButton")}
      </button>
    </form>
  );
}
