import Frame, { P, type IllustrationProps } from "./Frame";

/** A protective shield in front of a suspicious message. */
export default function ScamShield(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <circle cx="120" cy="100" r="86" fill={P.yellow} />
      {/* Suspicious message behind */}
      <rect x="28" y="44" width="104" height="70" rx="14" fill={P.white} stroke={P.ink} strokeWidth={P.line} />
      <path d="M44 66 h62 M44 82 h72 M44 98 h40" stroke={P.lavenderDeep} strokeWidth={P.line + 3} />
      <circle cx="124" cy="48" r="13" fill={P.redDeep} stroke={P.ink} strokeWidth={P.line} />
      <path d="M124 41 v8" stroke={P.white} strokeWidth={P.line + 0.5} />
      <circle cx="124" cy="54.5" r="1.8" fill={P.white} />
      {/* Shield */}
      <path d="M160 58 L206 74 V112 C206 142 186 162 160 172 C134 162 114 142 114 112 V74Z" fill={P.indigo} stroke={P.ink} strokeWidth={P.line} />
      <path d="M160 72 L194 84 V112 C194 134 180 150 160 158Z" fill={P.indigoDark} opacity="0.5" />
      <path d="M142 114 l12 12 l24 -26" fill="none" stroke={P.white} strokeWidth={P.line + 4} />
    </Frame>
  );
}
