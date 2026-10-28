"use client";

import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import { MyDevicesManager } from "@/components/MyDevices";
import { useT } from "@/lib/i18n";

/** "My Devices": the devices the learner owns, and the one in use now, which answers are written for. */
export default function DevicesPage() {
  const t = useT();
  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <PageIntro label={t("settings.device")} title={t("devices.title")} lead={t("devices.intro")} />
      <MyDevicesManager />
    </AppPage>
  );
}
