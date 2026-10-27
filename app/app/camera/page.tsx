"use client";

import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import CameraHelper from "@/components/CameraHelper";
import { useT } from "@/lib/i18n";

/** "Show me with my camera": a photo of a router, printer, TV, remote or laptop, explained and, if needed, fixed step by step. */
export default function CameraPage() {
  const t = useT();
  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <PageIntro label={t("home.tag.camera")} title={t("camera.title")} lead={t("camera.lead")} />
      {/* A router with blinking lights on the night field, the magic lens on the one to look at. */}
      <div aria-hidden="true" className="media-card night-field flex h-[11rem] items-center justify-center gap-6 sm:h-[13rem]">
        <span className="text-6xl">📡</span>
        <span className="flex gap-3 rounded-2xl bg-[#1c1c28] px-5 py-4 shadow-[0_0_0_1px_#2e2e44]">
          <span className="h-4 w-4 rounded-full bg-[#2e8a50]" />
          <span className="h-4 w-4 rounded-full bg-[#2e8a50]" />
          <span className="lens-ring relative h-4 w-4 rounded-full bg-[#e05a4b]" />
        </span>
      </div>
      <CameraHelper />
    </AppPage>
  );
}
