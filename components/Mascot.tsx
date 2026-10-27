import type { ReactNode } from "react";

export type MascotMood = "ready" | "thinking" | "success" | "warning" | "celebrate";

export const MASCOT_MOODS: readonly MascotMood[] = ["ready", "thinking", "success", "warning", "celebrate"];

// Flat and minimal: one electric-blue shape with white features, no shading or blush.
const INK = "#0a0a0a";
const BODY = "#3d33f0";
const FEATURE = "#ffffff";
const GREEN = "#1d6b3a";
const AMBER = "#f5c54a";

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "success":
    case "celebrate":
      // Happy, closed "smiling" eyes.
      return (
        <g fill="none" stroke={FEATURE} strokeWidth="5" strokeLinecap="round">
          <path d="M38 57 q6 -7 12 0" />
          <path d="M78 57 q6 -7 12 0" />
        </g>
      );
    case "thinking":
      // Looking up and to the side.
      return (
        <g fill={FEATURE}>
          <circle cx="49" cy="51" r="6" />
          <circle cx="85" cy="51" r="6" />
        </g>
      );
    case "warning":
      // Worried: round eyes under slanted brows.
      return (
        <g>
          <g fill="none" stroke={FEATURE} strokeWidth="4" strokeLinecap="round">
            <path d="M36 45 l12 -4" />
            <path d="M92 45 l-12 -4" />
          </g>
          <g fill={FEATURE}>
            <circle cx="44" cy="56" r="6" />
            <circle cx="84" cy="56" r="6" />
          </g>
        </g>
      );
    default:
      return (
        <g fill={FEATURE}>
          <ellipse cx="44" cy="55" rx="6" ry="7.5" />
          <ellipse cx="84" cy="55" rx="6" ry="7.5" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: MascotMood }) {
  const stroke = { fill: "none", stroke: FEATURE, strokeWidth: 5, strokeLinecap: "round" as const };
  switch (mood) {
    case "thinking":
      return <path d="M56 76 q5 -2 14 1" {...stroke} />;
    case "warning":
      return <path d="M54 79 q10 -7 20 0" {...stroke} />;
    case "success":
      return <path d="M50 72 q14 12 28 0" {...stroke} />;
    case "celebrate":
      return <path d="M49 71 q15 0 30 0 q-2 13 -15 13 q-13 0 -15 -13z" fill={FEATURE} />;
    default:
      return <path d="M53 73 q11 9 22 0" {...stroke} />;
  }
}

/** The small extra that makes each mood readable at a glance. */
function Accessory({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "thinking":
      return (
        <g fill={BODY}>
          <circle cx="104" cy="24" r="3.5" />
          <circle cx="112" cy="16" r="4.5" />
          <circle cx="121" cy="7" r="5.5" />
        </g>
      );
    case "success":
      // A green check badge (the thumbs-up moment).
      return (
        <g>
          <circle cx="106" cy="92" r="13" fill={GREEN} stroke="#fff" strokeWidth="3" />
          <path d="M100 92 l4.5 4.5 l8 -9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "warning":
      return (
        <g>
          <circle cx="108" cy="22" r="12" fill={AMBER} stroke="#fff" strokeWidth="3" />
          <path d="M108 15 v8" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="108" cy="28.5" r="2" fill={INK} />
        </g>
      );
    case "celebrate":
      return (
        <g>
          <rect x="8" y="14" width="7" height="7" rx="1.5" fill={AMBER} transform="rotate(20 11 17)" />
          <rect x="106" y="8" width="7" height="7" rx="1.5" fill={INK} transform="rotate(-15 109 11)" />
          <circle cx="116" cy="36" r="4" fill={BODY} />
          <circle cx="6" cy="44" r="3.5" fill={INK} />
          <path d="M20 4 l3 6" stroke={BODY} strokeWidth="3" strokeLinecap="round" />
          <path d="M98 0 l-2 6" stroke={AMBER} strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * Tech Helper's friendly companion: a flat electric-blue shape with a simple white face.
 * Decorative (aria-hidden) unless `label` is given. Optional speech bubble as children.
 */
export default function Mascot({
  mood = "ready",
  size = 4,
  label,
  animate = true,
  children,
  className = "",
}: {
  mood?: MascotMood;
  /** Width in rem, so it grows with the text size setting. */
  size?: number;
  label?: string;
  /** A barely-there idle breath; always off under prefers-reduced-motion. */
  animate?: boolean;
  /** A speech bubble, e.g. "Hi! I'm your Tech Helper 👋". */
  children?: ReactNode;
  className?: string;
}) {
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  const figure = (
    <svg
      viewBox="0 0 128 120"
      width={`${size}rem`}
      height={`${(size * 120) / 128}rem`}
      data-mood={mood}
      data-testid="mascot"
      className={`shrink-0 overflow-visible ${animate ? "animate-float" : ""} ${children ? "" : className}`}
      focusable="false"
      {...a11y}
    >
      {label && <title>{label}</title>}
      {/* Antenna: a little "digital" touch. */}
      <path d="M64 18 v-9" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
      <circle cx="64" cy="7" r="5.5" fill={BODY} />
      {/* Body: one flat, soft squircle. */}
      <path d="M64 18 C104 18 116 32 116 64 C116 98 102 114 64 114 C26 114 12 98 12 64 C12 32 24 18 64 18Z" fill={BODY} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      <Accessory mood={mood} />
    </svg>
  );

  if (!children) return figure;
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      {figure}
      <p className="relative mb-6 rounded-3xl rounded-bl-md border border-border bg-card px-5 py-3 text-lg font-semibold">
        {children}
      </p>
    </div>
  );
}
