"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
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
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">{t("install.title")}</h1>
      <p className="text-xl text-muted">{t("install.forHelper")}</p>
      <ol className="flex list-decimal flex-col gap-4 pl-8 text-xl">
        <li>{withNodes(t("install.step1"), { share: bold("install.share") })}</li>
        <li>{withNodes(t("install.step2"), { add: bold("install.addToHome") })}</li>
        <li>{withNodes(t("install.step3"), { add: bold("install.add") })}</li>
        <li>{t("install.step4")}</li>
        <li>{t("install.step5")}</li>
      </ol>
      <button type="button" className="btn-text" onClick={() => setSkipped(true)}>
        {t("install.continue")}
      </button>
    </main>
  );
}
