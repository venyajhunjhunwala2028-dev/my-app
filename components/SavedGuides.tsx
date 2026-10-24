"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { simpleDate, useOpenGuide } from "@/components/MyGuides";
import { useLocale, useT } from "@/lib/i18n";
import { getBookmarkedGuides, setGuideBookmarked } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

/**
 * "My saved guides": the guides the learner chose to keep with "Save this guide", newest first.
 * Tap one to do it again from step 1; "Remove from saved" keeps it in Recent help but not here.
 * On home (`limit`), only the newest few show, with a link to the full list, and nothing shows when none are saved.
 */
export default function SavedGuides({ limit, page = false }: { limit?: number; page?: boolean } = {}) {
  const t = useT();
  const { speechCode } = useLocale();
  const open = useOpenGuide();
  const isClient = useIsClient();
  const headingId = useId();
  // Bumped after a removal so the list re-reads the store.
  const [, setVersion] = useState(0);
  if (!isClient) return null;

  const guides = getBookmarkedGuides();
  const preview = limit !== undefined;
  if (preview && guides.length === 0) return null;
  const shown = preview ? guides.slice(0, limit) : guides;
  // The saved guides page's own title; a section heading elsewhere.
  const Heading = page ? "h1" : "h2";

  function remove(id: string) {
    setGuideBookmarked(id, false);
    setVersion((v) => v + 1);
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <Heading id={headingId} className={page ? "text-3xl font-extrabold" : "text-2xl font-bold"}>
        <span aria-hidden="true" className="mr-2">
          ⭐
        </span>
        {t("saved.heading")}
      </Heading>
      {guides.length === 0 ? (
        <p className="card-lavender text-xl">{t("saved.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((g) => (
            <li key={g.id} className="flex flex-col gap-2">
              <button type="button" className="card-action flex-col items-start gap-1 text-left" onClick={() => open(g.id)}>
                <span className="text-xl font-bold">{g.title || g.question}</span>
                {g.title && g.title !== g.question && <span className="text-lg">{g.question}</span>}
                <span className="text-lg text-muted">{simpleDate(g.savedAt, speechCode, t)}</span>
              </button>
              {!preview && (
                <button
                  type="button"
                  className="btn-text self-end"
                  aria-label={t("saved.removeItem", { question: g.question })}
                  onClick={() => remove(g.id)}
                >
                  {t("saved.remove")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {preview && (
        <Link href="/app/saved" className="btn-soft justify-center">
          {t("saved.seeAll")}
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      )}
    </section>
  );
}
