"use client";

import Link from "next/link";
import { MyDevicesManager } from "@/components/MyDevices";
import { useT } from "@/lib/i18n";

/** "My Devices": the devices the learner owns, and the one in use now, which answers are written for. */
export default function DevicesPage() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-extrabold">
        <span aria-hidden="true">📱 </span>
        {t("devices.title")}
      </h1>
      <p className="text-xl">{t("devices.intro")}</p>
      <MyDevicesManager />
    </main>
  );
}
