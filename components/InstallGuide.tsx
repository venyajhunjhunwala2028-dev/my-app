"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
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

  if (install === null) return null;
  if (!install || skipped) return <>{children}</>;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold">First, put Tech Helper on the home screen</h1>
      <p className="text-xl text-muted">For the family helper: please do this before setting anything up.</p>
      <ol className="flex list-decimal flex-col gap-4 pl-8 text-xl">
        <li>
          Tap the <strong>Share</strong> button at the bottom of the screen. It looks like a square with an arrow
          pointing up.
        </li>
        <li>
          Scroll down and tap <strong>Add to Home Screen</strong>.
        </li>
        <li>
          Tap <strong>Add</strong>.
        </li>
        <li>Close Safari and open Tech Helper from the new icon on the home screen.</li>
        <li>From now on, always use Tech Helper from the icon, not from Safari.</li>
      </ol>
      <button type="button" className="btn-text" onClick={() => setSkipped(true)}>
        Continue anyway
      </button>
    </main>
  );
}
