"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import LessonPlayer from "@/components/LessonPlayer";
import Mascot from "@/components/Mascot";
import { getLesson } from "@/lib/content/lessons";
import { useT } from "@/lib/i18n";
import { useIsClient } from "@/lib/useIsClient";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  // The id is only known per request, so it is read inside Suspense (Cache Components).
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 px-4 py-6">
      <Suspense fallback={null}>
        <Lesson params={params} />
      </Suspense>
    </main>
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
      <div className="card flex items-center gap-4">
        <Mascot mood="thinking" size={4} />
        <h1 className="text-3xl font-bold">{t("lesson.notFound")}</h1>
      </div>
      <Link href="/app/learn" className="btn-primary">
        {t("lesson.allLessons")}
      </Link>
    </>
  );
}
