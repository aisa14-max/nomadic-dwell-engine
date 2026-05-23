import { PartId } from "@/data/dwellingParts";

type Props = {
  colors: Partial<Record<PartId, string>>;
  wireframePart: PartId | null;
  /** force all parts colorized regardless of configured state */
  fullyColorized?: boolean;
  className?: string;
};

const FALLBACK: Record<PartId, string> = {
  membrane: "#e8e2d4",
  endwall: "#6e5440",
  interior: "#d6cfc0",
  rib: "#7a808a",
  platform: "#8a8278",
  skylight: "#cfe6f2",
  door: "#a06a3a",
};

// ---- Perspective geometry ---------------------------------------------------
// Tunnel recedes from near (right, front) to far (left, back).
const N_RIBS = 6;
type Rib = { cx: number; cy: number; hw: number; h: number; s: number; t: number };
const RIBS: Rib[] = Array.from({ length: N_RIBS }, (_, i) => {
  const t = i / (N_RIBS - 1);
  const cx = 660 - t * 470;     // 660 → 190
  const cy = 425 - t * 100;     // 425 → 325
  const s = 1 - t * 0.42;       // 1 → 0.58
  return { cx, cy, hw: 78 * s, h: 295 * s, s, t };
});
const FRONT = RIBS[0];
const BACK = RIBS[N_RIBS - 1];

const archPath = (r: Rib) =>
  `M${r.cx - r.hw} ${r.cy} Q${r.cx} ${r.cy - r.h} ${r.cx + r.hw} ${r.cy}`;

const archClosed = (r: Rib) => `${archPath(r)} Z`;

// Outer membrane silhouette (front opening + tunnel sides + back arch)
const MEMBRANE_D = `
  M${FRONT.cx + FRONT.hw} ${FRONT.cy}
  L${BACK.cx + BACK.hw} ${BACK.cy}
  Q${BACK.cx} ${BACK.cy - BACK.h} ${BACK.cx - BACK.hw} ${BACK.cy}
  L${FRONT.cx - FRONT.hw} ${FRONT.cy}
  Q${FRONT.cx} ${FRONT.cy - FRONT.h} ${FRONT.cx + FRONT.hw} ${FRONT.cy} Z
`;

// Platform: tilted quadrilateral under the ribs (top surface + a thin front face)
const PLATFORM_TOP = [
  [FRONT.cx + FRONT.hw + 22, FRONT.cy + 6],
  [BACK.cx + BACK.hw + 14, BACK.cy + 4],
  [BACK.cx - BACK.hw - 14, BACK.cy + 4],
  [FRONT.cx - FRONT.hw - 22, FRONT.cy + 6],
]
  .map((p) => p.join(","))
  .join(" ");

const PLATFORM_FRONT = [
  [FRONT.cx + FRONT.hw + 22, FRONT.cy + 6],
  [FRONT.cx - FRONT.hw - 22, FRONT.cy + 6],
  [FRONT.cx - FRONT.hw - 22, FRONT.cy + 22],
  [FRONT.cx + FRONT.hw + 22, FRONT.cy + 22],
]
  .map((p) => p.join(","))
  .join(" ");

export default function Dwelling({ colors, wireframePart, fullyColorized, className }: Props) {
  const colorOf = (p: PartId) => colors[p] ?? (fullyColorized ? FALLBACK[p] : "#2a2a2c");
  const cls = (p: PartId) => {
    const isConfigured = !!colors[p] || fullyColorized;
    const isWire = wireframePart === p;
    return [
      "dwell-part",
      !isConfigured && !isWire ? "is-dim" : "",
      isWire ? "is-wire" : "",
    ].join(" ");
  };

  // Skylights sit on the apex line between successive ribs
  const skylights = RIBS.slice(0, -1).map((r, i) => {
    const next = RIBS[i + 1];
    const x = (r.cx + next.cx) / 2;
    const y = (r.cy - r.h + (next.cy - next.h)) / 2 + 4;
    const rx = 14 * ((r.s + next.s) / 2);
    const ry = 4 * ((r.s + next.s) / 2);
    return { x, y, rx, ry };
  });

  return (
    <svg
      viewBox="0 0 800 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Ground shadow — elongated along the receding axis */}
      <ellipse
        cx={(FRONT.cx + BACK.cx) / 2 + 10}
        cy={(FRONT.cy + BACK.cy) / 2 + 40}
        rx="320"
        ry="20"
        fill="rgba(0,0,0,.45)"
        transform={`rotate(-12 ${(FRONT.cx + BACK.cx) / 2} ${(FRONT.cy + BACK.cy) / 2 + 40})`}
      />

      {/* Platform */}
      <g data-part="platform" className={cls("platform")}>
        <polygon
          points={PLATFORM_TOP}
          fill={colorOf("platform")}
          stroke="rgba(255,255,255,.25)"
          strokeWidth="1"
        />
        <polygon
          points={PLATFORM_FRONT}
          fill="rgba(0,0,0,.35)"
          stroke="rgba(255,255,255,.12)"
          strokeWidth="1"
        />
      </g>

      {/* Interior — softly lit volume seen through the front opening */}
      <g data-part="interior" className={cls("interior")}>
        <path
          d={`
            M${FRONT.cx - FRONT.hw + 18} ${FRONT.cy - 4}
            L${BACK.cx - BACK.hw + 10} ${BACK.cy - 2}
            Q${BACK.cx} ${BACK.cy - BACK.h * 0.78} ${BACK.cx + BACK.hw - 10} ${BACK.cy - 2}
            L${FRONT.cx + FRONT.hw - 18} ${FRONT.cy - 4}
            Q${FRONT.cx} ${FRONT.cy - FRONT.h * 0.82} ${FRONT.cx - FRONT.hw + 18} ${FRONT.cy - 4} Z
          `}
          fill={colorOf("interior")}
          opacity="0.55"
        />
      </g>

      {/* End wall (back arch closure) */}
      <g data-part="endwall" className={cls("endwall")}>
        <path
          d={archClosed(BACK)}
          fill={colorOf("endwall")}
          stroke="rgba(255,255,255,.25)"
          strokeWidth="1"
          opacity="0.92"
        />
      </g>

      {/* Ribs — receding arches */}
      <g data-part="rib" className={cls("rib")}>
        {RIBS.map((r, i) => (
          <path
            key={i}
            d={archPath(r)}
            fill="none"
            stroke={colorOf("rib")}
            strokeWidth={2 + 1.5 * r.s}
            strokeLinecap="round"
            opacity={0.55 + 0.45 * r.s}
          />
        ))}
        {/* Top ridge line connecting apexes */}
        <path
          d={`M${FRONT.cx} ${FRONT.cy - FRONT.h} L${BACK.cx} ${BACK.cy - BACK.h}`}
          stroke={colorOf("rib")}
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        {/* Eave lines along the sides */}
        <path
          d={`M${FRONT.cx + FRONT.hw} ${FRONT.cy} L${BACK.cx + BACK.hw} ${BACK.cy}`}
          stroke={colorOf("rib")}
          strokeWidth="1"
          opacity="0.55"
        />
        <path
          d={`M${FRONT.cx - FRONT.hw} ${FRONT.cy} L${BACK.cx - BACK.hw} ${BACK.cy}`}
          stroke={colorOf("rib")}
          strokeWidth="1"
          opacity="0.55"
        />
      </g>

      {/* Membrane — translucent outer skin */}
      <g data-part="membrane" className={cls("membrane")}>
        <path
          d={MEMBRANE_D}
          fill={colorOf("membrane")}
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.5"
          opacity="0.55"
        />
      </g>

      {/* Skylights — small luminous ovals along the ridge */}
      <g data-part="skylight" className={cls("skylight")}>
        {skylights.map((s, i) => (
          <g key={i}>
            <ellipse
              cx={s.x}
              cy={s.y}
              rx={s.rx}
              ry={s.ry}
              fill={colorOf("skylight")}
              stroke="rgba(255,255,255,.45)"
            />
            <ellipse
              cx={s.x}
              cy={s.y - 1}
              rx={s.rx * 0.7}
              ry={s.ry * 0.55}
              fill="rgba(255,255,255,.35)"
            />
          </g>
        ))}
      </g>

      {/* Entry door — on the near (front) opening, right side */}
      <g data-part="door" className={cls("door")}>
        {(() => {
          const dh = FRONT.h * 0.42;
          const dw = FRONT.hw * 0.42;
          const dx = FRONT.cx + FRONT.hw * 0.28;
          const dyTop = FRONT.cy - dh;
          // Slightly arched door
          const d = `
            M${dx} ${FRONT.cy}
            L${dx} ${dyTop + 12}
            Q${dx + dw / 2} ${dyTop - 6} ${dx + dw} ${dyTop + 12}
            L${dx + dw} ${FRONT.cy} Z
          `;
          return (
            <>
              <path
                d={d}
                fill={colorOf("door")}
                stroke="rgba(255,255,255,.35)"
                strokeWidth="1"
              />
              <circle cx={dx + dw - 6} cy={FRONT.cy - dh * 0.45} r="2" fill="rgba(255,255,255,.7)" />
            </>
          );
        })()}
      </g>
    </svg>
  );
}
