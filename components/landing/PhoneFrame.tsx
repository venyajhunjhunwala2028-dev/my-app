import type { ReactNode } from "react";

/** The iPhone status bar: 9:41, signal, Wi-Fi and battery. `tone` is the colour of the icons. */
export function StatusBar({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const c = tone === "dark" ? "#0a0a0a" : "#ffffff";
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-[9%] pt-[5.2%] text-[1em] font-semibold tracking-tight"
      style={{ color: c }}
    >
      <span className="w-[22%] text-center leading-none">9:41</span>
      <span className="flex w-[24%] items-center justify-center gap-[0.35em]">
        <svg viewBox="0 0 18 12" className="h-[0.8em] w-auto" fill={c}>
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <svg viewBox="0 0 16 12" className="h-[0.8em] w-auto" fill={c}>
          <path d="M8 2.3c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.9 10.9 0 0 0 8 .5 10.9 10.9 0 0 0 .5 3.5l1.2 1.3A9.1 9.1 0 0 1 8 2.3Z" />
          <path d="M8 5.9c1.4 0 2.7.5 3.7 1.4l1.2-1.3A7.1 7.1 0 0 0 8 4.1 7.1 7.1 0 0 0 3.1 6l1.2 1.3c1-.9 2.3-1.4 3.7-1.4Z" />
          <path d="M8 9.4c.5 0 1 .2 1.3.5L8 11.5 6.7 9.9c.3-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg viewBox="0 0 27 13" className="h-[0.85em] w-auto">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke={c} strokeOpacity="0.4" />
          <rect x="2.5" y="2.5" width="19" height="8" rx="2" fill={c} />
          <path d="M25 4.5v4c.8-.3 1.5-1.1 1.5-2s-.7-1.7-1.5-2Z" fill={c} fillOpacity="0.45" />
        </svg>
      </span>
    </div>
  );
}

/**
 * A realistic CSS phone: a near-black titanium body with side buttons, a Dynamic Island, the iOS status
 * bar and a home indicator. Decorative: wrap it in something with role="img" when it carries meaning.
 */
export default function PhoneFrame({
  children,
  className = "",
  width = 12.5,
  screenClassName = "bg-white",
  statusBar = "dark",
}: {
  children: ReactNode;
  className?: string;
  /** In rem, so it grows with the text size setting. */
  width?: number;
  screenClassName?: string;
  /** Status bar icon colour, or false to hide it. */
  statusBar?: "dark" | "light" | false;
}) {
  return (
    <div
      style={{ width: `${width}rem`, fontSize: `${(width * 0.042).toFixed(3)}rem` }}
      className={`relative mx-auto aspect-[9/19.5] max-w-full shrink-0 rounded-[15%/7%] bg-[#0b0b10] p-[3.2%] shadow-[0_0_0_1.5px_#3a3a46,0_0_0_3px_#0b0b10,0_40px_80px_-20px_rgb(5_3_60/0.55),0_18px_36px_-18px_rgb(0_0_0/0.5)] ${className}`}
    >
      {/* Side buttons */}
      <span aria-hidden="true" className="absolute top-[17%] -left-[1.6%] h-[4%] w-[1.6%] rounded-l-sm bg-[#2a2a33]" />
      <span aria-hidden="true" className="absolute top-[25%] -left-[1.6%] h-[7.5%] w-[1.6%] rounded-l-sm bg-[#2a2a33]" />
      <span aria-hidden="true" className="absolute top-[34%] -left-[1.6%] h-[7.5%] w-[1.6%] rounded-l-sm bg-[#2a2a33]" />
      <span aria-hidden="true" className="absolute top-[27%] -right-[1.6%] h-[11%] w-[1.6%] rounded-r-sm bg-[#2a2a33]" />
      <div className={`relative h-full w-full overflow-hidden rounded-[12.5%/5.8%] ${screenClassName}`}>
        {/* Dynamic Island */}
        <div className="absolute top-[1.9%] left-1/2 z-40 aspect-[37/11] w-[31%] -translate-x-1/2 rounded-full bg-black" />
        {statusBar && <StatusBar tone={statusBar} />}
        {children}
        {/* Home indicator */}
        <div
          className={`absolute bottom-[1.2%] left-1/2 z-40 h-[0.6%] w-[36%] -translate-x-1/2 rounded-full ${
            statusBar === "light" ? "bg-white/90" : "bg-black/85"
          }`}
        />
      </div>
    </div>
  );
}

/** A mock Instagram feed; `plus` lets the caller wrap the + button (e.g. with the magic lens). */
export function InstagramScreen({ plus }: { plus?: ReactNode }) {
  return (
    <div className="flex h-full flex-col pt-[18%] text-[0.55rem] text-[#0a0a0a]">
      <div className="flex items-center justify-between px-3 pb-2">
        <span className="text-[0.75rem] font-bold italic">Instagram</span>
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full border-2 border-[#0a0a0a]" />
          <span className="h-3 w-3 rounded-sm border-2 border-[#0a0a0a]" />
        </span>
      </div>
      <div className="flex gap-2 px-3 pb-2">
        {["#f5c54a", "#e7798f", "#8c86ff", "#2e8a50"].map((c) => (
          <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c, boxShadow: "0 0 0 2px #e7798f" }} />
        ))}
      </div>
      <div className="flex items-center gap-1.5 px-3 pb-1.5">
        <span className="h-4 w-4 rounded-full bg-[#d9d6fc]" />
        <span className="h-1.5 w-12 rounded-full bg-[#e5e5e5]" />
      </div>
      <div className="mx-0 flex-1 bg-gradient-to-br from-[#ffe2b8] via-[#f8c9d4] to-[#c9c5ff]">
        <div className="flex h-full items-end justify-center pb-4">
          <span className="h-10 w-16 rounded-t-full bg-[#2e8a50]/40" />
        </div>
      </div>
      <div className="flex items-center justify-around border-t border-[#e5e5e5] px-2 pt-2.5 pb-[1.2rem]">
        <span className="h-3.5 w-3.5 rounded-sm border-2 border-[#0a0a0a]" />
        <span className="h-3.5 w-3.5 rounded-full border-2 border-[#0a0a0a]" />
        {plus ?? <PlusButton />}
        <span className="h-3.5 w-3.5 rounded-sm border-2 border-[#0a0a0a]" />
        <span className="h-3.5 w-3.5 rounded-full bg-[#d9d6fc]" />
      </div>
    </div>
  );
}

export function PlusButton() {
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-[#0a0a0a] text-[0.8rem] leading-none font-bold">
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
        className={`pointer-events-none absolute top-1/2 left-1/2 h-[2.6rem] w-[2.6rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#3d33f0] bg-[#3d33f0]/10 shadow-[0_0_0_4px_rgba(61,51,240,0.22),0_0_18px_6px_rgba(61,51,240,0.4)] ${pulse ? "animate-pulse-ring" : ""}`}
      />
    </span>
  );
}
