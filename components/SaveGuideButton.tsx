"use client";

import { useState } from "react";
import { isGuideBookmarked, setGuideBookmarked } from "@/lib/store/localStore";
import { useT } from "@/lib/i18n";

/**
 * "⭐ Save this guide": a toggle (pressed once saved) that keeps the guide in My saved guides, where it is never
 * dropped to make room. Tapping it again removes it from saved.
 */
export default function SaveGuideButton({
  id,
  className = "btn-secondary",
  row = false,
}: {
  id: string;
  className?: string;
  /** A row of a hairline list (More help) instead of a pill. */
  row?: boolean;
}) {
  const t = useT();
  const [saved, setSaved] = useState(() => isGuideBookmarked(id));
  const [changed, setChanged] = useState(false);

  function toggle() {
    const next = !saved;
    setGuideBookmarked(id, next);
    setSaved(next);
    setChanged(true);
  }

  if (row) {
    return (
      <>
        <button type="button" aria-pressed={saved} className="row-action group" onClick={toggle}>
          <span aria-hidden="true" className={`row-icon ${saved ? "bg-lavender" : ""}`}>
            {saved ? "⭐" : "☆"}
          </span>
          <span className="flex-1 text-xl leading-tight font-semibold">{t("saved.save")}</span>
          {saved && (
            <span aria-hidden="true" className="tag bg-lavender text-primary">
              ✓
            </span>
          )}
        </button>
        <p role="status" className="pb-3 text-lg font-semibold empty:hidden">
          {changed && saved ? t("saved.done") : ""}
        </p>
      </>
    );
  }

  return (
    <>
      <button type="button" aria-pressed={saved} className={className} onClick={toggle}>
        <span aria-hidden="true" className="mr-2">
          {saved ? "⭐" : "☆"}
        </span>
        {t("saved.save")}
        {saved && (
          <span aria-hidden="true" className="ml-2">
            ✓
          </span>
        )}
      </button>
      <p role="status" className="col-span-full text-lg font-semibold empty:hidden">
        {changed && saved ? t("saved.done") : ""}
      </p>
    </>
  );
}
