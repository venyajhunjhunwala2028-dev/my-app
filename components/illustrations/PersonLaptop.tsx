import Frame, { P, type IllustrationProps } from "./Frame";

/** A person working calmly at a laptop. */
export default function PersonLaptop(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect x="20" y="20" width="200" height="160" rx="80" fill={P.green} />
      {/* Person */}
      <path d="M72 168 C74 128 92 114 120 114 C148 114 166 128 168 168Z" fill={P.yellowDeep} stroke={P.ink} strokeWidth={P.line} />
      <path d="M112 100 v16 h16 v-16" fill={P.skin} stroke={P.ink} strokeWidth={P.line} />
      <circle cx="120" cy="76" r="28" fill={P.skin} stroke={P.ink} strokeWidth={P.line} />
      <path d="M92 76 C90 50 106 44 122 44 C140 44 152 54 148 74 C140 62 126 58 112 60 C102 62 96 68 92 76Z" fill={P.hairDark} stroke={P.ink} strokeWidth={P.line} />
      <circle cx="110" cy="80" r="2.6" fill={P.ink} />
      <circle cx="130" cy="80" r="2.6" fill={P.ink} />
      <path d="M112 92 q8 6 16 0" fill="none" stroke={P.ink} strokeWidth={P.line} />
      {/* Laptop */}
      <path d="M62 128 h116 l-10 46 h-96z" fill={P.lavenderDeep} stroke={P.ink} strokeWidth={P.line} />
      <circle cx="120" cy="150" r="7" fill={P.white} stroke={P.ink} strokeWidth={P.line} />
      <rect x="40" y="172" width="160" height="10" rx="5" fill={P.indigo} stroke={P.ink} strokeWidth={P.line} />
      {/* Floating chat bubble */}
      <path d="M168 36 h42 a10 10 0 0 1 10 10 v16 a10 10 0 0 1 -10 10 h-26 l-10 9 v-9 h-6 a10 10 0 0 1 -10 -10 v-16 a10 10 0 0 1 10 -10z" fill={P.white} stroke={P.ink} strokeWidth={P.line} />
      <g fill={P.indigo}>
        <circle cx="178" cy="54" r="3.5" />
        <circle cx="190" cy="54" r="3.5" />
        <circle cx="202" cy="54" r="3.5" />
      </g>
    </Frame>
  );
}
