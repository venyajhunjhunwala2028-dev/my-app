"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { AppHeader, PAGE_COLUMN } from "@/components/app/AppShell";
import { useT, withNodes, type MessageKey } from "@/lib/i18n";
import { noSubscribe } from "@/lib/useIsClient";

// True in an iPhone/iPad Safari tab that was not opened from the home screen icon.
// The home-screen app keeps separate storage from Safari, so setup must happen inside it.
function needsInstall(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const standalone =
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches === true;
  return !standalone;
}

export default function InstallGuide({ children }: { children: ReactNode }) {
  // null on the server; the browser check runs only on the phone.
  const install = useSyncExternalStore<boolean | null>(noSubscribe, needsInstall, () => null);
  const [skipped, setSkipped] = useState(false);
  const t = useT();

  if (install === null) return null;
  if (!install || skipped) return <>{children}</>;

  const bold = (key: MessageKey) => <strong>{t(key)}</strong>;
  const steps = [
    withNodes(t("install.step1"), { share: bold("install.share") }),
    withNodes(t("install.step2"), { add: bold("install.addToHome") }),
    withNodes(t("install.step3"), { add: bold("install.add") }),
    t("install.step4"),
    t("install.step5"),
  ];
  return (
    <>
      <AppHeader />
      <main className={`${PAGE_COLUMN} flex flex-1 flex-col gap-8 pt-4 pb-20`}>
        <h1 className="display-lg max-w-[16ch]">{t("install.title")}</h1>
        <p className="max-w-[36ch] text-xl text-muted sm:text-2xl">{t("install.forHelper")}</p>
        <ol className="hairline-list">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-5 py-5 text-xl leading-snug">
              <span aria-hidden="true" className="display-num w-12 shrink-0 pt-1 text-[2.25rem] text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="pt-1">{step}</span>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-text self-start px-0" onClick={() => setSkipped(true)}>
          {t("install.continue")}
        </button>
      </main>
    </>
  );
}
