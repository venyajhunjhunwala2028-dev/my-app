"use client";

import Link from "next/link";
import ScamChecker from "@/components/ScamChecker";

export default function ScamPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6">
      <Link href="/app" className="btn-text self-start">
        Back to home
      </Link>
      <h1 className="text-3xl font-bold">Is this a scam?</h1>
      <ScamChecker />
    </main>
  );
}
