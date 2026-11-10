import Frame, { P, type IllustrationProps } from "./Frame";

function Person({ x, top, body, hair, grey = false }: { x: number; top: number; body: string; hair: string; grey?: boolean }) {
  const r = 22;
  return (
    <g stroke={P.ink} strokeWidth={P.line}>
      <path d={`M${x - 40} 200 C${x - 38} ${top + 66} ${x - 22} ${top + 52} ${x} ${top + 52} C${x + 22} ${top + 52} ${x + 38} ${top + 66} ${x + 40} 200Z`} fill={body} />
      <circle cx={x} cy={top + r} r={r} fill={P.skin} />
      <path
        d={`M${x - r} ${top + r} C${x - r - 2} ${top + 2} ${x - 8} ${top - 4} ${x + 2} ${top - 2} C${x + 16} ${top} ${x + r + 2} ${top + 8} ${x + r} ${top + r - 2} C${x + 12} ${top + 10} ${x - 6} ${top + 10} ${x - r} ${top + r}Z`}
        fill={hair}
      />
      <circle cx={x - 7} cy={top + r + 2} r="1.8" fill={P.ink} stroke="none" />
      <circle cx={x + 7} cy={top + r + 2} r="1.8" fill={P.ink} stroke="none" />
      <path d={`M${x - 6} ${top + r + 10} q6 5 12 0`} fill="none" />
      {grey && (
        <g fill="none">
          <circle cx={x - 7} cy={top + r + 2} r="5.5" />
          <circle cx={x + 7} cy={top + r + 2} r="5.5" />
        </g>
      )}
    </g>
  );
}

/** Three generations together: help that feels like family. */
export default function Family(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect x="10" y="30" width="220" height="170" rx="85" fill={P.lavender} />
      <path d="M120 22 c-8 -12 -26 -4 -18 10 l18 16 l18 -16 c8 -14 -10 -22 -18 -10z" fill={P.red} stroke={P.ink} strokeWidth={P.line} />
      <Person x={64} top={74} body={P.indigo} hair={P.hairGrey} grey />
      <Person x={176} top={70} body={P.greenDeep} hair={P.hairDark} />
      <Person x={120} top={104} body={P.yellowDeep} hair={P.hairDark} />
    </Frame>
  );
}
