"use client";

import { useRef, useState, type ChangeEvent } from "react";
import PrivacyReminder from "@/components/PrivacyReminder";
import { useT, type MessageKey } from "@/lib/i18n";
import { prepareScreenshot } from "@/lib/image/prepare";
import type { PreparedImage } from "@/lib/image/resize";

export interface PickerButton {
  label: string;
  /** Opens the back camera straight away on phones (a photo of the device, not a screenshot). */
  camera?: boolean;
  testId: string;
  primary?: boolean;
}

/**
 * The privacy reminder, then one or more big buttons that open the picture chooser.
 * The chosen picture is checked and shrunk on the phone (the same limits as every screenshot)
 * and handed to `onPicked`; nothing is sent or saved here.
 */
export default function PicturePicker({
  buttons,
  onPicked,
  understood,
  onUnderstand,
  privacy,
  disabled = false,
}: {
  buttons: PickerButton[];
  onPicked: (image: PreparedImage) => void;
  understood: boolean;
  onUnderstand: () => void;
  /** Already translated; defaults to the general screenshot reminder. */
  privacy?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const [problem, setProblem] = useState<MessageKey | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  async function choose(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const result = await prepareScreenshot(file);
    if ("problem" in result) return setProblem(result.problem);
    setProblem(null);
    onPicked(result.image);
  }

  return (
    <div className="flex flex-col gap-4">
      <PrivacyReminder understood={understood} onUnderstand={onUnderstand} message={privacy} />
      {buttons.map((b) => (
        <div key={b.testId}>
          <button
            type="button"
            className={b.primary ? "btn-primary min-h-20 w-full text-2xl" : "btn-secondary w-full"}
            disabled={!understood || disabled}
            onClick={() => inputs.current[b.testId]?.click()}
          >
            {b.label}
          </button>
          <input
            ref={(el) => {
              inputs.current[b.testId] = el;
            }}
            data-testid={b.testId}
            type="file"
            accept="image/*"
            {...(b.camera ? { capture: "environment" as const } : {})}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
            disabled={!understood || disabled}
            onChange={(e) => void choose(e)}
          />
        </div>
      ))}
      {problem && (
        <p role="alert" className="rounded-[1.2rem] border-l-4 border-warning bg-warning-surface p-4 text-xl">
          {t(problem)}
        </p>
      )}
    </div>
  );
}
