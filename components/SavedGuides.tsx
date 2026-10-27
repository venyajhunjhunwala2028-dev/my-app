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
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <Heading id={headingId} className={page ? "display-lg" : "display-md"}>
        {t("saved.heading")}
      </Heading>
      {guides.length === 0 ? (
        <p className="border-t border-foreground pt-5 text-xl text-muted">{t("saved.empty")}</p>
      ) : (
        <ul className="hairline-list">
          {shown.map((g) => (
            <li key={g.id} className="flex items-center gap-2">
              <button type="button" className="row-action group min-w-0 flex-1" onClick={() => open(g.id)}>
                <span aria-hidden="true" className="row-icon">
                  ⭐
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-xl leading-snug font-semibold">{g.title || g.question}</span>
                  {g.title && g.title !== g.question && <span className="text-lg leading-snug">{g.question}</span>}
                  <span className="text-base text-muted">{simpleDate(g.savedAt, speechCode, t)}</span>
                </span>
                <span aria-hidden="true" className="row-arrow">
                  →
                </span>
              </button>
              {!preview && (
                <button
                  type="button"
                  className="btn-text shrink-0 px-2 text-base text-muted"
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
        <Link href="/app/saved" className="link-cta self-start text-lg">
          {t("saved.seeAll")}
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </section>
  );
}
