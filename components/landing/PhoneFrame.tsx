import type { ReactNode } from "react";

/** A simple CSS phone: dark rounded frame, notch and a screen for mock content. */
export default function PhoneFrame({
  children,
  className = "",
  width = 12.5,
}: {
  children: ReactNode;
  className?: string;
  /** In rem, so it grows with the text size setting. */
  width?: number;
}) {
  return (
    <div
      style={{ width: `${width}rem` }}
      className={`relative mx-auto aspect-[9/18] max-w-full shrink-0 rounded-[2.25rem] bg-[#1c1b2e] p-[0.45rem] shadow-raised ${className}`}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.85rem] bg-white">
        <div className="absolute top-1.5 left-1/2 z-30 h-[0.9rem] w-[3.8rem] -translate-x-1/2 rounded-full bg-[#1c1b2e]" />
        {children}
      </div>
    </div>
  );
}

/** A mock Instagram feed; `plus` lets the caller wrap the + button (e.g. with the magic lens). */
export function InstagramScreen({ plus }: { plus?: ReactNode }) {
  return (
    <div className="flex h-full flex-col pt-7 text-[0.55rem] text-[#1c1b2e]">
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[0.75rem] font-bold italic">Instagram</span>
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[#1c1b2e]" />
          <span className="h-3 w-3 rounded-sm border-2 border-[#1c1b2e]" />
        </span>
      </div>
      <div className="flex gap-2 px-3 pb-2">
        {["#f5c54a", "#e7798f", "#7c74ff", "#2e8a50"].map((c) => (
          <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c, boxShadow: "0 0 0 2px #e7798f" }} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-1.5">
        <span className="h-4 w-4 rounded-full bg-[#cbc6f3]" />
        <span className="h-1.5 w-12 rounded-full bg-[#dcd9ec]" />
      </div>
      <div className="mx-0 flex-1 bg-gradient-to-br from-[#fbe7ad] via-[#f8d3cd] to-[#cbc6f3]">
        <div className="flex h-full items-end justify-center pb-4">
          <span className="h-10 w-16 rounded-t-full bg-[#2e8a50]/40" />
        </div>
      </div>
      <div className="flex items-center justify-around border-t border-[#dcd9ec] px-2 py-2.5">
        <span className="h-3.5 w-3.5 rounded-sm border-2 border-[#1c1b2e]" />
        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#1c1b2e]" />
        {plus ?? <PlusButton />}
        <span className="h-3.5 w-3.5 rounded-sm border-2 border-[#1c1b2e]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#cbc6f3]" />
      </div>
    </div>
  );
}

export function PlusButton() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-[#1c1b2e] text-[0.8rem] leading-none font-bold">
      +
    </span>
  );
}

/** The glowing "magic lens" ring around whatever should be tapped. */
export function Lens({ children, pulse = false, className = "" }: { children: ReactNode; pulse?: boolean; className?: string }) {
  return (
    <span className={`relative inline-flex ${className}`}>
      {children}
      <span
        className={`pointer-events-none absolute top-1/2 left-1/2 h-[2.6rem] w-[2.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#6d64f0] bg-[#7c74ff]/10 shadow-[0_0_0_4px_rgba(124,116,255,0.25),0_0_18px_6px_rgba(124,116,255,0.45)] ${pulse ? "animate-pulse-ring" : ""}`}
      />
    </span>
  );
}
