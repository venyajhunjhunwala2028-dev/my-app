"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT, type T } from "@/lib/i18n";
import {
  deleteAllGuides,
  deleteGuide,
  getSavedGuides,
  setCurrentGuide,
  setGuideStep,
  type SavedGuide,
} from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

const PAGE = 10;

/** "Today", "Yesterday", or a plain date like "1 October 2026". */
export function simpleDate(savedAt: number, dateLocale: string, t: T): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const saved = new Date(savedAt);
  const days = Math.round((day(new Date()) - day(saved)) / 86_400_000);
  if (days === 0) return t("history.today");
  if (days === 1) return t("history.yesterday");
  return new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "long", year: "numeric" }).format(saved);
}

/** Yes / No before anything is deleted. */
export function Confirm({ onYes, onNo, t }: { onYes: () => void; onNo: () => void; t: T }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-3xl border-2 border-warning bg-warning-surface p-4">
      <p className="text-xl font-semibold">{t("history.confirm")}</p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" className="btn-primary" onClick={onYes}>
          {t("common.yes")}
        </button>
        <button type="button" className="btn-secondary" onClick={onNo}>
          {t("common.no")}
        </button>
      </div>
    </div>
  );
}

/** Opens a guide again from step 1, as its current guide. */
export function useOpenGuide() {
  const router = useRouter();
  return (id: string) => {
    setGuideStep(id, 1);
    setCurrentGuide(id);
    router.push(`/guide/${id}`);
  };
}

/**
 * "Recent help": the questions asked on this phone, newest first; tap one to do it again from step 1.
 * Shows `initial` at first (5 on home), then more on "Show more". Saved guides are marked.
 */
export default function MyGuides({ initial = PAGE }: { initial?: number } = {}) {
  const open = useOpenGuide();
  const t = useT();
  const { speechCode } = useLocale();
  // The store lives in localStorage, so read it only after the page is running in the browser.
  const isClient = useIsClient();
  const [shown, setShown] = useState(initial);
  // The id being confirmed for deletion, or "all".
  const [confirming, setConfirming] = useState<string | null>(null);
  // Bumped after a delete so the list re-reads the store.
  const [, setVersion] = useState(0);
  if (!isClient) return null;
  const guides = getSavedGuides();

  function remove(id: string | "all") {
    if (id === "all") deleteAllGuides();
    else deleteGuide(id);
    setConfirming(null);
    setVersion((v) => v + 1);
  }

  const item = (g: SavedGuide) => (
    <li key={g.id} className="flex flex-col gap-2">
      <button type="button" className="card-action flex-col items-start gap-1 text-left" onClick={() => open(g.id)}>
        <span className="text-xl font-bold">{g.question}</span>
        <span className="flex flex-wrap items-center gap-2 text-lg text-muted">
          {simpleDate(g.savedAt, speechCode, t)}
          {g.bookmarked && (
            <span className="rounded-full bg-lavender px-3 py-0.5 text-base font-semibold text-primary">
              <span aria-hidden="true">⭐ </span>
              {t("history.savedBadge")}
            </span>
          )}
        </span>
      </button>
      {confirming === g.id ? (
        <Confirm t={t} onYes={() => remove(g.id)} onNo={() => setConfirming(null)} />
      ) : (
        <button
          type="button"
          className="btn-text self-end"
          aria-label={t("history.deleteItem", { question: g.question })}
          onClick={() => setConfirming(g.id)}
        >
          {t("history.delete")}
        </button>
      )}
    </li>
  );

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">
        <span aria-hidden="true" className="mr-2">
          🕘
        </span>
        {t("history.heading")}
      </h2>
      {guides.length === 0 ? (
        <p className="card-lavender text-xl text-muted">{t("history.empty")}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-4">{guides.slice(0, shown).map(item)}</ul>
          {guides.length > shown && (
            <button type="button" className="btn-secondary" onClick={() => setShown((n) => n + PAGE)}>
              {t("history.showMore")}
            </button>
          )}
          {confirming === "all" ? (
            <Confirm t={t} onYes={() => remove("all")} onNo={() => setConfirming(null)} />
          ) : (
            <button type="button" className="btn-text" onClick={() => setConfirming("all")}>
              {t("history.deleteAll")}
            </button>
          )}
        </>
      )}
    </section>
  );
}
