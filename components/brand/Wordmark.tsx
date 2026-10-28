/**
 * The Tech Helper brand: a lowercase, rounded, bold "tech helper" (Fredoka, see app/layout.tsx) with a small
 * spark (✳︎) as its accent. Ink on white, or white on the electric blue and night surfaces.
 */

export type WordmarkTone = "ink" | "white";

/** The spark: eight rounded spokes. Also the app icon (public/icons/icon.svg). Decorative. */
export function BrandGlyph({ className = "", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false" data-testid="brand-glyph">
      <g stroke={color} strokeWidth="15" strokeLinecap="round">
        <path d="M50 12v76" />
        <path d="M12 50h76" />
        <path d="M23.1 23.1l53.8 53.8" />
        <path d="M76.9 23.1L23.1 76.9" />
      </g>
    </svg>
  );
}

export default function Wordmark({
  tone = "ink",
  size = 1.5,
  glyph = true,
  accent,
  className = "",
}: {
  /** "ink": black on white. "white": white on blue or night. */
  tone?: WordmarkTone;
  /** Font size: a number is in rem (so it grows with the text size setting); a string is any CSS length. */
  size?: number | string;
  /** Show the ✳︎ spark after the name. */
  glyph?: boolean;
  /** The spark's colour; by default blue on ink, white on white. */
  accent?: "blue" | "same";
  className?: string;
}) {
  const color = tone === "white" ? "text-white" : "text-foreground";
  const sparkBlue = accent ? accent === "blue" : tone === "ink";
  return (
    <span
      data-testid="wordmark"
      data-tone={tone}
      style={{ fontSize: typeof size === "number" ? `${size}rem` : size }}
      className={`inline-flex items-start font-brand leading-none font-semibold tracking-[-0.015em] whitespace-nowrap ${color} ${className}`}
    >
      <span>tech helper</span>
      {glyph && (
        <BrandGlyph
          className={`ml-[0.08em] h-[0.42em] w-[0.42em] shrink-0 ${sparkBlue ? "text-primary" : ""}`}
          color="currentColor"
        />
      )}
    </span>
  );
}
