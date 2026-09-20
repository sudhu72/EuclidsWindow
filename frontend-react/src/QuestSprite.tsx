// Hand-authored inline-SVG "sprite" for Math Quest. No image assets exist
// anywhere in this app (confirmed: no public/ or assets/ dir in
// frontend-react, and the Manim pipeline explicitly forbids loading files) —
// so poses are procedurally drawn shapes animated with CSS, the same
// code-only-assets philosophy the rest of the app already uses. Swapping in
// richer art later only means changing this one file; callers just pass
// skin/pose.
export type QuestSkin = "detective" | "explorer";
export type QuestPose = "idle" | "walk" | "success" | "stuck";

const SKIN_STYLE: Record<QuestSkin, { coat: string; hat: string; skin: string }> = {
  detective: { coat: "#44403c", hat: "#1c1917", skin: "#e7b98f" },
  explorer: { coat: "#78350f", hat: "#a16207", skin: "#e7b98f" },
};

export default function QuestSprite({
  skin,
  pose,
  size = 96,
}: {
  skin: QuestSkin;
  pose: QuestPose;
  size?: number;
}) {
  const c = SKIN_STYLE[skin];
  return (
    <svg
      viewBox="0 0 100 120"
      width={size}
      height={(size * 120) / 100}
      className={`qst-sprite qst-pose-${pose}`}
      role="img"
      aria-label={`${skin === "detective" ? "Detective" : "Explorer"} — ${pose}`}
    >
      <g className="qst-sprite-body">
        <line className="qst-leg qst-leg-l" x1="42" y1="80" x2="38" y2="108" stroke={c.coat} strokeWidth="7" strokeLinecap="round" />
        <line className="qst-leg qst-leg-r" x1="58" y1="80" x2="62" y2="108" stroke={c.coat} strokeWidth="7" strokeLinecap="round" />
        <rect x="32" y="50" width="36" height="36" rx="14" fill={c.coat} />
        <line className="qst-arm qst-arm-l" x1="34" y1="58" x2="18" y2="78" stroke={c.coat} strokeWidth="7" strokeLinecap="round" />
        <line className="qst-arm qst-arm-r" x1="66" y1="58" x2="82" y2="78" stroke={c.coat} strokeWidth="7" strokeLinecap="round" />
        <circle cx="50" cy="36" r="18" fill={c.skin} />
        {skin === "detective" ? (
          <path d="M30 28 Q50 6 70 28 L65 31 Q50 17 35 31 Z" fill={c.hat} />
        ) : (
          <path d="M28 26 Q50 2 72 26 L67 31 Q50 13 33 31 Z" fill={c.hat} />
        )}
        <circle cx="44" cy="37" r="2.2" fill="#292524" />
        <circle cx="56" cy="37" r="2.2" fill="#292524" />
        {pose === "stuck" && (
          <text x="72" y="22" fontSize="18" fill="#b45309" className="qst-sprite-stuckmark">
            ?
          </text>
        )}
        {pose === "success" && (
          <>
            <text x="10" y="28" fontSize="16" className="qst-sprite-spark qst-spark-a">✦</text>
            <text x="82" y="42" fontSize="14" className="qst-sprite-spark qst-spark-b">✦</text>
            <text x="50" y="10" fontSize="14" className="qst-sprite-spark qst-spark-c">✦</text>
          </>
        )}
      </g>
    </svg>
  );
}
