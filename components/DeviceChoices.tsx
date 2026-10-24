"use client";

import { useId } from "react";
import { deviceLabel, devicePicture } from "@/lib/device";
import { useT } from "@/lib/i18n";

/**
 * Big picture buttons, one per device, two to a row when there is room (most phones). The chosen one is pressed (with a tick,
 * not only colour); a `suggested` one, the browser's guess, says so under its name.
 */
export default function DeviceChoices({
  options,
  chosen = null,
  suggested = null,
  onChoose,
  labelledBy,
}: {
  options: readonly string[];
  chosen?: string | null;
  suggested?: string | null;
  onChoose: (device: string) => void;
  /** The heading that names this group of buttons. */
  labelledBy?: string;
}) {
  const t = useT();
  const guessId = `${useId()}-guess`;
  return (
    <div className="@container">
      <ul aria-labelledby={labelledBy} className="grid grid-cols-1 gap-3 @[15rem]:grid-cols-2">
        {options.map((device) => {
          const on = device === chosen || (chosen === null && device === suggested);
          return (
            <li key={device}>
              <button
                type="button"
                aria-pressed={on}
                aria-describedby={device === suggested ? guessId : undefined}
                className={`card-action h-full min-h-[7rem] flex-col items-center justify-center gap-1 px-3 text-center ${
                  on ? "border-primary! bg-lavender" : ""
                }`}
                onClick={() => onChoose(device)}
              >
                <span aria-hidden="true" className="text-5xl leading-none">
                  {devicePicture(device)}
                </span>
                <span className="text-xl leading-tight font-extrabold [overflow-wrap:normal]">
                  {on && (
                    <span aria-hidden="true" className="mr-1 text-primary">
                      ✓
                    </span>
                  )}
                  {deviceLabel(device, t)}
                </span>
                {/* Read as the button's description, not its name. */}
                {device === suggested && (
                  <span id={guessId} aria-hidden="true" className="text-base font-semibold text-primary">
                    {t("devices.guess")}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
