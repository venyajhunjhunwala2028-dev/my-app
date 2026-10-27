"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
import { AppPage, BackLink, PageIntro } from "@/components/app/AppShell";
import { LIBRARY, type LibraryCategory } from "@/lib/content/library";
import { useT, useUiLanguage } from "@/lib/i18n";

/** "Help library": common questions by topic; tapping one asks it as if it were typed. */
export default function LibraryPage() {
  // `?topic=<id>` (from the landing page) opens that category. Search params are only known per
  // request, so they are read inside Suspense; the prerendered fallback shows all topics.
  return (
    <Suspense fallback={<Library topic={null} />}>
      <LibraryFromUrl />
    </Suspense>
  );
}

function LibraryFromUrl() {
  return <Library topic={useSearchParams().get("topic")} />;
}

function Library({ topic }: { topic: string | null }) {
  const t = useT();
  const language = useUiLanguage();
  const [category, setCategory] = useState<LibraryCategory | null>(() => LIBRARY.find((c) => c.id === topic) ?? null);
  const askBox = useRef<AskBoxHandle>(null);
  const answerArea = useRef<HTMLDivElement>(null);

  function ask(question: string) {
    askBox.current?.ask(question);
    // The waiting message and any question back appear above the questions.
    answerArea.current?.scrollIntoView?.({ block: "start" });
  }

  return (
    <AppPage back={<BackLink href="/app">{t("common.backHome")}</BackLink>}>
      {category ? (
        <>
          <PageIntro title={t("library.title")} />
          <section aria-labelledby="library-category" className="flex flex-col gap-5">
            <BackLink onClick={() => setCategory(null)}>{t("library.allTopics")}</BackLink>
            <h2 id="library-category" className="flex items-center gap-4 display-md">
              <span aria-hidden="true" className="row-icon h-14 w-14 text-3xl">
                {category.emoji}
              </span>
              <span>{category.title[language]}</span>
            </h2>
            <div ref={answerArea} className="scroll-mt-4">
              <AskBox key={category.id} ref={askBox} showForm={false} />
            </div>
            <p className="text-xl text-muted">{t("library.pickQuestion")}</p>
            <ul className="hairline-list">
              {category.questions.map((q) => (
                <li key={q.en}>
                  <button type="button" className="row-action group" onClick={() => ask(q[language])}>
                    <span className="flex-1 text-xl leading-snug font-semibold">{q[language]}</span>
                    <span aria-hidden="true" className="row-arrow text-primary">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : (
        <>
          <PageIntro title={t("library.title")} lead={t("library.intro")} />
          {/* Topics as an editorial list: hairlines, big names and arrows, as on the landing page. */}
          <ul className="hairline-list">
            {LIBRARY.map((c) => (
              <li key={c.id}>
                <button type="button" className="row-action group min-h-[5.5rem]" onClick={() => setCategory(c)}>
                  <span aria-hidden="true" className="row-icon">
                    {c.emoji}
                  </span>
                  <span className="flex-1 font-display text-[1.75rem] leading-tight font-medium tracking-[-0.02em]">
                    {c.title[language]}
                  </span>
                  <span aria-hidden="true" className="row-arrow">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </AppPage>
  );
}
