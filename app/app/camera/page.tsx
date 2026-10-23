"use client";

import Link from "next/link";
import CameraHelper from "@/components/CameraHelper";
import { useT } from "@/lib/i18n";

/** "Show me with my camera": a photo of a router, printer, TV, remote or laptop, explained and, if needed, fixed step by step. */
export default function CameraPage() {
  const t = useT();
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        {t("common.backHome")}
      </Link>
      <h1 className="text-lg font-extrabold tracking-[0.12em] text-primary uppercase">
        <span aria-hidden="true" className="mr-2">
          📸
        </span>
        {t("camera.title")}
      </h1>
      <section className="card-lavender flex items-center gap-4 overflow-hidden">
        <p className="min-w-0 flex-1 text-xl leading-snug font-extrabold [overflow-wrap:normal]">{t("camera.lead")}</p>
        {/* A small router with blinking lights, inside the magic lens. */}
        <div aria-hidden="true" className="flex shrink-0 flex-col items-center gap-2">
          <span className="text-5xl">📡</span>
          <span className="flex gap-1.5 rounded-xl border-4 border-foreground bg-card px-3 py-2 shadow-raised">
            <span className="h-3 w-3 rounded-full bg-safe" />
            <span className="h-3 w-3 rounded-full bg-safe" />
            <span className="lens-ring relative h-3 w-3 rounded-full bg-warning" />
          </span>
        </div>
      </section>
      <CameraHelper />
    </main>
  );
}
