"use client";

import { useState } from "react";
import { isGuideBookmarked, setGuideBookmarked } from "@/lib/store/localStore";
import { useT } from "@/lib/i18n";

/**
 * "⭐ Save this guide": a toggle (pressed once saved) that keeps the guide in My saved guides, where it is never
 * dropped to make room. Tapping it again removes it from saved.
 */
export default function SaveGuideButton({ id, className = "btn-secondary" }: { id: string; className?: string }) {
  const t = useT();
  const [saved, setSaved] = useState(() => isGuideBookmarked(id));
  const [changed, setChanged] = useState(false);

  function toggle() {
    const next = !saved;
    setGuideBookmarked(id, next);
    setSaved(next);
    setChanged(true);
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
