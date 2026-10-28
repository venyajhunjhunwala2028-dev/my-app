import Frame, { P, type IllustrationProps } from "./Frame";

/** An older woman smiling at her phone. */
export default function OlderPersonPhone(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <circle cx="120" cy="104" r="88" fill={P.lavender} />
      {/* Body */}
      <path d="M58 200 C60 150 84 132 120 132 C156 132 180 150 182 200Z" fill={P.indigo} stroke={P.ink} strokeWidth={P.line} />
      <path d="M106 132 L120 150 L134 132" fill={P.white} stroke={P.ink} strokeWidth={P.line} />
      {/* Neck and head */}
      <path d="M110 118 v16 h20 v-16" fill={P.skin} stroke={P.ink} strokeWidth={P.line} />
      <circle cx="120" cy="88" r="32" fill={P.skin} stroke={P.ink} strokeWidth={P.line} />
      {/* Grey bun and hair */}
      <circle cx="120" cy="48" r="13" fill={P.hairGrey} stroke={P.ink} strokeWidth={P.line} />
      <path d="M88 90 C84 60 100 54 120 54 C142 54 156 62 152 90 C146 74 132 68 118 70 C104 72 94 78 88 90Z" fill={P.hairGrey} stroke={P.ink} strokeWidth={P.line} />
      {/* Glasses */}
      <g fill="none" stroke={P.ink} strokeWidth={P.line}>
        <circle cx="108" cy="92" r="8" />
        <circle cx="132" cy="92" r="8" />
        <path d="M116 92 h8" />
      </g>
      <path d="M111 106 q9 7 18 0" fill="none" stroke={P.ink} strokeWidth={P.line} />
      <circle cx="98" cy="104" r="4" fill={P.red} />
      <circle cx="142" cy="104" r="4" fill={P.red} />
      {/* Hand holding phone */}
      <rect x="148" y="132" width="34" height="56" rx="7" fill={P.ink} />
      <rect x="152" y="138" width="26" height="42" rx="3" fill={P.yellow} />
      <circle cx="165" cy="159" r="7" fill={P.yellowDeep} />
      <path d="M140 176 C146 166 154 164 160 170 C164 176 160 186 150 188 C144 188 140 184 140 176Z" fill={P.skin} stroke={P.ink} strokeWidth={P.line} />
      {/* Sparkle */}
      <path d="M196 70 v14 M189 77 h14" stroke={P.yellowDeep} strokeWidth={P.line + 1} />
    </Frame>
  );
}
