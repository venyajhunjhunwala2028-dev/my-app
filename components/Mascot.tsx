import type { ReactNode } from "react";

export type MascotMood = "ready" | "thinking" | "success" | "warning" | "celebrate";

export const MASCOT_MOODS: readonly MascotMood[] = ["ready", "thinking", "success", "warning", "celebrate"];

const INK = "#1c1b2e";
const BODY = "#5a50d8";
const BODY_SHADE = "#463cc0";
const FACE = "#f4f2ff";
const CHEEK = "#f6b7c4";

function Eyes({ mood }: { mood: MascotMood }) {
  switch (mood) {
    case "success":
    case "celebrate":
      // Happy, closed "smiling" eyes.
      return (
        <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
          <path d="M37 55 q6 -7 12 0" />
          <path d="M71 55 q6 -7 12 0" />
        </g>
      );
    case "thinking":
      // Looking up and to the side.
      return (
        <g fill={INK}>
          <circle cx="45" cy="52" r="5.5" />
          <circle cx="79" cy="52" r="5.5" />
          <circle cx="46.5" cy="50" r="1.8" fill="#fff" />
          <circle cx="80.5" cy="50" r="1.8" fill="#fff" />
        </g>
      );
    case "warning":
      // Worried: round eyes under slanted brows.
      return (
        <g>
          <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round">
            <path d="M35 44 l12 -4" />
            <path d="M85 44 l-12 -4" />
          </g>
          <g fill={INK}>
            <circle cx="43" cy="55" r="5.5" />
            <circle cx="77" cy="55" r="5.5" />
          </g>
        </g>
      );
    default:
      return (
        <g fill={INK}>
          <ellipse cx="43" cy="55" rx="5.5" ry="6.5" />
          <ellipse cx="77" cy="55" rx="5.5" ry="6.5" />
          <circle cx="44.8" cy="52.6" r="1.9" fill="#fff" />
          <circle cx="78.8" cy="52.6" r="1.9" fill="#fff" />
        </g>
      );
  }
}

function Mouth({ mood }: { mood: MascotMood }) {
  const stroke = { fill: "none", stroke: INK, strokeWidth: 4, strokeLinecap: "round" as const };
  switch (mood) {
    case "thinking":
      return <path d="M52 73 q5 -2 14 1" {...stroke} />;
    case "warning":
      return <path d="M50 76 q10 -7 20 0" {...stroke} />;
    case "success":
      return <path d="M46 69 q14 12 28 0" {...stroke} />;
    case "celebrate":
      return <path d="M45 68 q15 0 30 0 q-2 13 -15 13 q-13 0 -15 -13z" fill={INK} />;
    default:
      return <path d="M49 70 q11 9 22 0" {...stroke} />;
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
          <circle cx="104" cy="88" r="13" fill="#2e8a50" stroke="#fff" strokeWidth="3" />
          <path d="M98 88 l4.5 4.5 l8 -9" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "warning":
      return (
        <g>
          <circle cx="106" cy="22" r="12" fill="#f5c54a" stroke="#fff" strokeWidth="3" />
          <path d="M106 15 v8" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="106" cy="28.5" r="2" fill={INK} />
        </g>
      );
    case "celebrate":
      return (
        <g>
          <rect x="8" y="14" width="7" height="7" rx="1.5" fill="#f5c54a" transform="rotate(20 11 17)" />
          <rect x="104" y="8" width="7" height="7" rx="1.5" fill="#2e8a50" transform="rotate(-15 107 11)" />
          <circle cx="114" cy="36" r="4" fill="#e7798f" />
          <circle cx="6" cy="44" r="3.5" fill="#7c74ff" />
          <path d="M20 4 l3 6" stroke="#e7798f" strokeWidth="3" strokeLinecap="round" />
          <path d="M96 0 l-2 6" stroke="#f5c54a" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/**
 * Tech Helper's friendly companion: a soft indigo shape with a kind face.
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
  /** Gentle idle bob; always off under prefers-reduced-motion. */
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
      <path d="M64 16 v-8" stroke={BODY_SHADE} strokeWidth="4" strokeLinecap="round" />
      <circle cx="64" cy="7" r="5" fill="#f5c54a" />
      {/* Body: a soft rounded squircle. */}
      <path
        d="M64 16 C100 16 112 30 112 62 C112 96 98 112 64 112 C30 112 16 96 16 62 C16 30 28 16 64 16Z"
        fill={BODY}
      />
      <path
        d="M24 82 C30 102 44 112 64 112 C84 112 98 102 104 82 C96 96 82 102 64 102 C46 102 32 96 24 82Z"
        fill={BODY_SHADE}
        opacity="0.6"
      />
      {/* Face plate */}
      <rect x="27" y="34" width="74" height="56" rx="26" fill={FACE} />
      <ellipse cx="35" cy="70" rx="5.5" ry="3.5" fill={CHEEK} opacity={mood === "warning" ? 0 : 0.9} />
      <ellipse cx="93" cy="70" rx="5.5" ry="3.5" fill={CHEEK} opacity={mood === "warning" ? 0 : 0.9} />
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      <Accessory mood={mood} />
    </svg>
  );

  if (!children) return figure;
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      {figure}
      <p className="relative mb-6 rounded-3xl rounded-bl-md bg-card px-5 py-3 text-lg font-semibold shadow-card">
        {children}
      </p>
    </div>
  );
}
