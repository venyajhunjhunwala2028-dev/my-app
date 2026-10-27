import type { ReactNode } from "react";

/** The landing page's editorial column: wide, with generous side margins. */
export const CONTAINER = "mx-auto w-full max-w-[88rem] px-4 sm:px-8 lg:px-10";

/** A small Metabrand-style label in brackets: "(Safety)". */
export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`label-paren ${className}`}>({children})</p>;
}

/** Section header: the label sits above (phones) or beside (desktop) a big headline. */
export function SectionHeader({
  label,
  id,
  title,
  intro,
  tone = "light",
}: {
  label: string;
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-10">
      <Label className={`lg:col-span-3 lg:pt-4 ${dark ? "text-night-muted!" : ""}`}>{label}</Label>
      <div className="flex flex-col gap-5 lg:col-span-9">
        <h2 id={id} className={`display-lg max-w-[18ch] ${dark ? "text-white" : ""}`}>
          {title}
        </h2>
        {intro && <p className={`max-w-[38ch] text-xl sm:text-2xl ${dark ? "text-night-muted" : "text-muted"}`}>{intro}</p>}
      </div>
    </div>
  );
}

/** A right arrow that nudges on hover of its `group`. Decorative. */
export function Arrow({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-block transition-transform group-hover:translate-x-1 ${className}`}>
      →
    </span>
  );
}
