"use client";

import { useState } from "react";
import { DEVICE_CHOICES } from "@/lib/device";
import { getDevices, getTextSize, setPreferredDevice, setTextSize, type TextSize } from "@/lib/store/localStore";
import { applyTextSize } from "@/lib/textSize";
import { useIsClient } from "@/lib/useIsClient";

const SIZES: { size: TextSize; label: string; className: string }[] = [
  { size: "normal", label: "Normal", className: "text-lg" },
  { size: "large", label: "Large", className: "text-xl" },
  { size: "xl", label: "Extra large", className: "text-2xl" },
];

// The chosen option shows a tick as well as its colour.
function Tick({ on }: { on: boolean }) {
  return on ? (
    <span aria-hidden="true" className="mr-2">
      ✓
    </span>
  ) : null;
}

const choiceClass = (on: boolean) => (on ? "btn-primary" : "btn-secondary");

/** The "Aa Text size" button and its small settings sheet: text size and the learner's device. */
export default function Settings() {
  const isClient = useIsClient();
  const [open, setOpen] = useState(false);
  // Bumped after a choice so the pressed buttons re-read the store.
  const [, setVersion] = useState(0);

  if (!isClient) return null;

  if (!open) {
    return (
      <button type="button" className="btn-secondary" onClick={() => setOpen(true)}>
        <span aria-hidden="true" className="mr-2 font-serif">
          Aa
        </span>
        Text size
      </button>
    );
  }

  const size = getTextSize();
  const device = getDevices()[0] ?? null;

  function chooseSize(next: TextSize) {
    setTextSize(next);
    applyTextSize(next);
    setVersion((v) => v + 1);
  }

  function chooseDevice(next: string) {
    setPreferredDevice(next);
    setVersion((v) => v + 1);
  }

  return (
    <section
      aria-labelledby="settings-heading"
      className="flex flex-col gap-6 rounded-2xl border-2 border-primary bg-surface p-4"
    >
      <h2 id="settings-heading" className="text-2xl font-bold">
        Settings
      </h2>
      <div role="group" aria-labelledby="text-size-heading" className="flex flex-col gap-3">
        <h3 id="text-size-heading" className="text-xl font-bold">
          Text size
        </h3>
        {SIZES.map((s) => (
          <button
            key={s.size}
            type="button"
            aria-pressed={size === s.size}
            className={`${choiceClass(size === s.size)} ${s.className}`}
            onClick={() => chooseSize(s.size)}
          >
            <Tick on={size === s.size} />
            {s.label}
          </button>
        ))}
      </div>
      <div role="group" aria-labelledby="device-heading" className="flex flex-col gap-3">
        <h3 id="device-heading" className="text-xl font-bold">
          Your device
        </h3>
        {DEVICE_CHOICES.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={device === d}
            className={choiceClass(device === d)}
            onClick={() => chooseDevice(d)}
          >
            <Tick on={device === d} />
            {d}
          </button>
        ))}
      </div>
      <button type="button" className="btn-primary" onClick={() => setOpen(false)}>
        Done
      </button>
    </section>
  );
}
