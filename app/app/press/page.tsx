"use client";

import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import ShowMeOnScreen from "@/components/ShowMeOnScreen";
import PhoneFrame, { InstagramScreen, Lens, PlusButton } from "@/components/landing/PhoneFrame";
import { useT } from "@/lib/i18n";
import { getDevices, getSpeakingLanguage } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/** "What do I press?": the learner's own question about a screenshot, with no guide. */
export default function PressPage() {
  // The saved device and language live in localStorage, so read them only in the browser.
  const isClient = useIsClient();
  const t = useT();
  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      <PageIntro label={t("home.tag.show")} title={t("press.title")} lead={t("press.lead")} />
      {/* The promise as a picture: the bottom of a phone on the blue field, the magic lens around its + button. */}
      <div aria-hidden="true" className="media-card blue-field relative h-[11rem] sm:h-[14rem]">
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <PhoneFrame width={9.5}>
            <InstagramScreen
              plus={
                <Lens pulse>
                  <PlusButton />
                </Lens>
              }
            />
          </PhoneFrame>
        </div>
      </div>
      {isClient && <ShowMeOnScreen device={getDevices()[0] ?? null} language={getSpeakingLanguage()} />}
    </AppPage>
  );
}
