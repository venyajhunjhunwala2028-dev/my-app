import type { ReactNode } from "react";

/** Shared palette: flat, electric blue and ink, one line weight (matches globals.css). */
export const P = {
  ink: "#0a0a0a",
  line: 3,
  indigo: "#3d33f0",
  indigoDark: "#2a21c9",
  lavender: "#eeedfe",
  lavenderDeep: "#d9d6fc",
  skin: "#f0c7a6",
  skinShade: "#dba889",
  hairGrey: "#e5e5e5",
  hairDark: "#5b4a42",
  green: "#e8f5ec",
  greenDeep: "#1d6b3a",
  yellow: "#f4f4f1",
  yellowDeep: "#f5c54a",
  red: "#fdeeec",
  redDeep: "#a8261b",
  white: "#ffffff",
} as const;

/** Decorative by default; pass `title` when the picture carries meaning. */
export default function Frame({
  title,
  className = "",
  children,
  viewBox = "0 0 240 200",
}: {
  title?: string;
  className?: string;
  children: ReactNode;
  viewBox?: string;
}) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true as const };
  return (
    <svg viewBox={viewBox} className={`h-auto w-full ${className}`} focusable="false" {...a11y}>
      {title && <title>{title}</title>}
      <g strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

export type IllustrationProps = { title?: string; className?: string };
