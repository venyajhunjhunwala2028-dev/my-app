import type { ReactNode } from "react";

/** Shared editorial palette: flat, muted, one line weight. */
export const P = {
  ink: "#2b2850",
  line: 3,
  indigo: "#5a50d8",
  indigoDark: "#3730a3",
  lavender: "#e4e1fa",
  lavenderDeep: "#cbc6f3",
  skin: "#f0c7a6",
  skinShade: "#dba889",
  hairGrey: "#d9d6e0",
  hairDark: "#5b4a42",
  green: "#cfe8d6",
  greenDeep: "#2e8a50",
  yellow: "#fbe7ad",
  yellowDeep: "#f5c54a",
  red: "#f8d3cd",
  redDeep: "#c2412f",
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
