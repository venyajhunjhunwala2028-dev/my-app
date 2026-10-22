"use client";

import { useRouter } from "next/navigation";
import { getSavedGuides, setCurrentGuide, setGuideStep } from "@/lib/store/localStore";
import { useIsClient } from "@/lib/useIsClient";

export default function MyGuides() {
  const router = useRouter();
  // The store lives in localStorage, so read it only after the page is running in the browser.
  const isClient = useIsClient();
  if (!isClient) return null;
  const guides = getSavedGuides();

  function open(id: string) {
    setGuideStep(id, 1);
    setCurrentGuide(id);
    router.push(`/guide/${id}`);
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">My guides</h2>
      {guides.length === 0 ? (
        <p className="text-xl text-muted">Guides you use will appear here so you can do them again.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {guides.map((g) => (
            <li key={g.id}>
              <button type="button" className="btn-secondary" onClick={() => open(g.id)}>
                {g.title}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
