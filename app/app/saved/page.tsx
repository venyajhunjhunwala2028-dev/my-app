"use client";

import { AppPage, BackLink } from "@/components/app/AppShell";
import SavedGuides from "@/components/SavedGuides";
import { useT } from "@/lib/i18n";

/** "My saved guides": every guide the learner saved, to open again or remove from saved. */
export default function SavedPage() {
  const t = useT();
  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <SavedGuides page />
    </AppPage>
  );
}
