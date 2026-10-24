"use client";

import { useId, useState } from "react";
import Link from "next/link";
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
    <section aria-labelledby={headingId} className="card flex animate-fade-in flex-col gap-4 p-5 shadow-raised">
      <h2 id={headingId} className="text-2xl leading-tight font-extrabold">
        <span aria-hidden="true" className="mr-2">
          📱
        </span>
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
    <section aria-labelledby={headingId} className="card flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-bold text-muted">
        <span aria-hidden="true" className="mr-2">
          📱
        </span>
        {t("devices.title")}
      </h2>
      {current ? (
        <p className="flex items-center gap-3 text-2xl font-extrabold">
          <span aria-hidden="true" className="text-4xl">
            {devicePicture(current)}
          </span>
          {t("devices.usingNow", { device: deviceLabel(current, t) })}
        </p>
      ) : (
        <p className="text-xl">{t("devices.none")}</p>
      )}
      <Link href="/app/devices" className="btn-soft justify-center">
        {t("devices.change")}
        <span aria-hidden="true" className="ml-2">
          →
        </span>
      </Link>
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
    <div className="flex flex-col gap-6">
      <section aria-labelledby={nowId} className="card flex flex-col gap-4">
        <h2 id={nowId} className="text-2xl font-bold">
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
            <ul className="flex flex-col gap-1">
              {owned.map((d) => (
                <li key={d} className="flex flex-wrap items-center justify-between gap-x-3">
                  <span className="flex min-w-[8rem] flex-1 flex-wrap items-center gap-2 text-lg [overflow-wrap:normal]">
                    {deviceLabel(d, t)}
                    {d === current && (
                      <span className="rounded-full bg-safe-surface px-3 py-1 text-base font-semibold text-safe">
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
        <section aria-labelledby={addId} className="flex flex-col gap-4">
          <h2 id={addId} className="text-2xl font-bold">
            <span aria-hidden="true" className="mr-2">
              ➕
            </span>
            {t("devices.add")}
          </h2>
          <DeviceChoices options={others} labelledBy={addId} onChoose={(d) => change(() => addDevice(d))} />
        </section>
      )}
    </div>
  );
}
