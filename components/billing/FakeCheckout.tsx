"use client";

import { useEffect, useRef } from "react";
import { useT } from "@/lib/i18n";

/** FAKE_BILLING=1 only: stands in for Razorpay Checkout in tests and previews. No money is ever involved. */
export default function FakeCheckout({ onPay, onFail, onClose }: { onPay: () => void; onFail: () => void; onClose: () => void }) {
  const t = useT();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="fake-checkout-heading" className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="card flex w-full max-w-md flex-col gap-4">
        <h2 id="fake-checkout-heading" ref={heading} tabIndex={-1} className="display-md outline-none">
          {t("plus.fake.title")}
        </h2>
        <p className="text-lg">{t("plus.fake.text")}</p>
        <button type="button" className="btn-primary" onClick={onPay}>
          {t("plus.fake.pay")}
        </button>
        <button type="button" className="btn-secondary" onClick={onFail}>
          {t("plus.fake.fail")}
        </button>
        <button type="button" className="btn-text self-center" onClick={onClose}>
          {t("plus.fake.close")}
        </button>
      </div>
    </div>
  );
}
