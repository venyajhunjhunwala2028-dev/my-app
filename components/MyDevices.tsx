"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Paren } from "@/components/app/AppShell";
import DeviceChoices from "@/components/DeviceChoices";
import { DEVICE_CHOICES, detectThisDevice, deviceLabel, devicePicture } from "@/lib/device";
import { useT } from "@/lib/i18n";
import {
  addDevice,
  getCurrentDevice,
  getDevices,
  isDeviceChosen,
  removeDevice,
  setPreferredDevice,
} from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/**
 * Home, first use: "What are you using right now?" with big picture buttons, the browser's guess already chosen.
 * One tap answers it for good; it does not come back once a device is picked (here, in Settings or in My Devices).
 */
export function FirstRunDevice({ onChosen }: { onChosen?: () => void }) {
  const t = useT();
  const isClient = useIsClient();
  const headingId = useId();
  const [answered, setAnswered] = useState(false);
  if (!isClient || answered || isDeviceChosen()) return null;

  const guess = getCurrentDevice() ?? detectThisDevice();

  function choose(device: string) {
    setPreferredDevice(device);
    setAnswered(true);
    onChosen?.();
  }

  return (
    <section aria-labelledby={headingId} className="flex animate-fade-in flex-col gap-4 rounded-[1.2rem] bg-surface p-5 sm:p-6">
      <h2 id={headingId} className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
        {t("devices.firstRun")}
      </h2>
      <p className="text-lg text-muted">{t("devices.firstRunLead")}</p>
      <DeviceChoices options={DEVICE_CHOICES} suggested={guess} labelledBy={headingId} onChoose={choose} />
    </section>
  );
}

/** Home: which device the steps are written for now, with a way to change it. */
export function MyDevicesCard() {
  const t = useT();
  const isClient = useIsClient();
  const headingId = useId();
  if (!isClient) return null;
  const current = getCurrentDevice();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <h2 id={headingId} className="label-paren text-base">
        <Paren>{t("devices.title")}</Paren>
      </h2>
      <div className="flex flex-col gap-3 border-t border-foreground pt-5">
        {current ? (
          <p className="flex items-center gap-4 font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            <span aria-hidden="true" className="row-icon h-14 w-14 text-3xl">
              {devicePicture(current)}
            </span>
            {t("devices.usingNow", { device: deviceLabel(current, t) })}
          </p>
        ) : (
          <p className="text-xl">{t("devices.none")}</p>
        )}
        <Link href="/app/devices" className="link-cta self-start text-lg">
          {t("devices.change")}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

/** The My Devices page: pick the one in use now, remove one, or add another one the learner owns. */
export function MyDevicesManager() {
  const t = useT();
  const isClient = useIsClient();
  const nowId = useId();
  const addId = useId();
  // Bumped after a change so the buttons re-read the store.
  const [, setVersion] = useState(0);
  if (!isClient) return null;

  const owned = getDevices();
  const current = owned[0] ?? null;
  const others = DEVICE_CHOICES.filter((d) => !owned.includes(d));

  function change(save: () => void) {
    save();
    setVersion((v) => v + 1);
  }

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby={nowId} className="flex flex-col gap-4">
        <h2 id={nowId} className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
          {t("devices.whichNow")}
        </h2>
        {owned.length === 0 ? (
          <p className="text-xl">{t("devices.none")}</p>
        ) : (
          <>
            <DeviceChoices
              options={owned}
              chosen={current}
              labelledBy={nowId}
              onChoose={(d) => change(() => setPreferredDevice(d))}
            />
            <ul className="hairline-list mt-2">
              {owned.map((d) => (
                <li key={d} className="flex flex-wrap items-center justify-between gap-x-3 py-1">
                  <span className="flex min-w-[8rem] flex-1 flex-wrap items-center gap-2 text-xl [overflow-wrap:normal]">
                    {deviceLabel(d, t)}
                    {d === current && (
                      <span className="tag bg-safe-surface text-safe">
                        {t("devices.inUse")}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="btn-text shrink-0"
                    onClick={() => change(() => removeDevice(d))}
                  >
                    {t("devices.remove", { device: deviceLabel(d, t) })}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      {others.length > 0 && (
        <section aria-labelledby={addId} className="flex flex-col gap-4 border-t border-foreground pt-8">
          <h2 id={addId} className="font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
            {t("devices.add")}
          </h2>
          <DeviceChoices options={others} labelledBy={addId} onChoose={(d) => change(() => addDevice(d))} />
        </section>
      )}
    </div>
  );
}
