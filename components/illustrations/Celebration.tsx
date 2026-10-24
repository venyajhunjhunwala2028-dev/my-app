import Frame, { P, type IllustrationProps } from "./Frame";

/** Success: a big tick with confetti. */
export default function Celebration(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <circle cx="120" cy="100" r="86" fill={P.green} />
      <circle cx="120" cy="100" r="50" fill={P.greenDeep} stroke={P.ink} strokeWidth={P.line} />
      <path d="M96 100 l16 16 l32 -34" fill="none" stroke={P.white} strokeWidth={P.line + 6} />
      <g stroke={P.ink} strokeWidth={P.line}>
        <rect x="40" y="38" width="14" height="14" rx="3" fill={P.yellowDeep} transform="rotate(18 47 45)" />
        <rect x="186" y="44" width="14" height="14" rx="3" fill={P.indigo} transform="rotate(-20 193 51)" />
        <circle cx="194" cy="150" r="8" fill={P.red} />
        <circle cx="44" cy="150" r="7" fill={P.lavenderDeep} />
      </g>
      <path d="M68 24 l6 12 M172 20 l-6 12 M206 98 h12 M22 98 h12" stroke={P.yellowDeep} strokeWidth={P.line + 1} />
    </Frame>
  );
}
