"use client";

import { useState } from "react";
import { whatsAppLink } from "@/lib/family/message";
import { useT } from "@/lib/i18n";
import { getFamilyContact } from "@/lib/store/localStore";

function canShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/**
 * The restore code (the subscription id) in big letters, with Copy and "Send this code to my family" (the share
 * sheet, or WhatsApp to the saved family contact). It never leaves the phone any other way.
 */
export default function RestoreCode({ code, lead = true }: { code: string; lead?: boolean }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const [share] = useState(canShare);
  const message = t("plus.codeMessage", { code });

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      // No clipboard (an older browser): select the code so it can be copied by hand.
      const range = document.createRange();
      const el = document.getElementById("restore-code-value");
      if (!el) return;
      range.selectNodeContents(el);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }

  async function send() {
    try {
      await navigator.share({ text: message });
    } catch {
      // Closing the share sheet is fine.
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[1.2rem] bg-card p-4 text-foreground sm:p-8">
      {lead && <p className="text-xl font-semibold">{t("plus.codeLead")}</p>}
      <div className="flex flex-col gap-1">
        <p id="restore-code-label" className="text-base font-medium text-muted">
          {t("plus.codeLabel")}
        </p>
        <p
          id="restore-code-value"
          aria-labelledby="restore-code-label restore-code-value"
          data-testid="restore-code"
          className="rounded-xl border-2 border-dashed border-primary bg-lavender px-4 py-3 font-mono text-[1.35rem] font-semibold tracking-wide break-all text-primary select-all sm:text-2xl"
        >
          {code}
        </p>
      </div>
      <button type="button" className="btn-primary px-4" onClick={() => void copy()}>
        <span>
          <span aria-hidden="true" className="mr-2">
            {copied ? "✓" : "📋"}
          </span>
          {copied ? t("plus.copied") : t("plus.copy")}
        </span>
      </button>
      {copied && (
        <p role="status" className="sr-only">
          {t("plus.copied")}
        </p>
      )}
      {share ? (
        <button type="button" className="btn-secondary px-4" onClick={() => void send()}>
          <span>
            <span aria-hidden="true" className="mr-2">
              👨‍👩‍👧
            </span>
            {t("plus.sendFamily")}
          </span>
        </button>
      ) : (
        <a href={whatsAppLink(message, getFamilyContact()?.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary px-4">
          <span>
            <span aria-hidden="true" className="mr-2">
              👨‍👩‍👧
            </span>
            {t("plus.sendFamily")}
          </span>
        </a>
      )}
    </div>
  );
}
