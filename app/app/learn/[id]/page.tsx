"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import LessonPlayer from "@/components/LessonPlayer";
import Mascot from "@/components/Mascot";
import { AppHeader, PAGE_COLUMN } from "@/components/app/AppShell";
import { getLesson } from "@/lib/content/lessons";
import { useT } from "@/lib/i18n";
import { useIsClient } from "@/lib/useIsClient";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  // The id is only known per request, so it is read inside Suspense (Cache Components).
  return (
    <>
      <AppHeader />
      <main className={`${PAGE_COLUMN} flex flex-1 flex-col gap-6 pt-2 pb-20`}>
        <Suspense fallback={null}>
          <Lesson params={params} />
        </Suspense>
      </main>
    </>
  );
}

function Lesson({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useT();
  // The lesson reads saved guides and progress from localStorage, so it runs only in the browser.
  const isClient = useIsClient();
  if (!isClient) return null;

  const lesson = getLesson(decodeURIComponent(id));
  if (lesson) return <LessonPlayer key={lesson.id} lesson={lesson} />;
  return (
    <>
      <div className="flex flex-col items-start gap-6 pt-6">
        <Mascot mood="thinking" size={4.5} />
        <h1 className="display-lg max-w-[16ch]">{t("lesson.notFound")}</h1>
      </div>
      <Link href="/app/learn" className="btn-primary">
        {t("lesson.allLessons")}
      </Link>
    </>
  );
}
