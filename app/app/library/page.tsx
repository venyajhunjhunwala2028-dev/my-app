"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AskBox, { type AskBoxHandle } from "@/components/AskBox";
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
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-3xl font-extrabold">
        <span aria-hidden="true">📚 </span>
        {t("library.title")}
      </h1>
      {category ? (
        <section aria-labelledby="library-category" className="flex flex-col gap-4">
          <button type="button" className="btn-text self-start" onClick={() => setCategory(null)}>
            {t("library.allTopics")}
          </button>
          <h2 id="library-category" className="text-3xl font-extrabold">
            <span aria-hidden="true">{category.emoji} </span>
            {category.title[language]}
          </h2>
          <div ref={answerArea} className="scroll-mt-4">
            <AskBox key={category.id} ref={askBox} showForm={false} />
          </div>
          <p className="text-xl">{t("library.pickQuestion")}</p>
          <ul className="flex flex-col gap-3">
            {category.questions.map((q) => (
              <li key={q.en}>
                <button
                  type="button"
                  className="card-action items-center justify-between gap-3 text-xl font-semibold"
                  onClick={() => ask(q[language])}
                >
                  <span>{q[language]}</span>
                  <span aria-hidden="true" className="text-2xl text-primary">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <p className="text-xl">{t("library.intro")}</p>
          {/* Two columns only when there is room at the chosen text size. */}
          <div className="@container">
            <ul className="grid grid-cols-1 gap-3 @[17rem]:grid-cols-2">
              {LIBRARY.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="card-action h-full min-h-[6.5rem] flex-col items-start justify-between gap-2 text-xl font-bold"
                    onClick={() => setCategory(c)}
                  >
                    <span aria-hidden="true" className="text-3xl">
                      {c.emoji}
                    </span>
                    {c.title[language]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </main>
  );
}
