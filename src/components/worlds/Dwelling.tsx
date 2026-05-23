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

  return (
    <svg
      viewBox="0 0 800 500"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: "visible" }}
    >
      {/* Ground shadow */}
      <ellipse cx="400" cy="450" rx="280" ry="22" fill="rgba(0,0,0,.45)" />

      {/* Platform */}
      <g data-part="platform" className={cls("platform")}>
        <polygon
          points="140,430 660,430 700,460 100,460"
          fill={colorOf("platform")}
          stroke="rgba(255,255,255,.25)"
          strokeWidth="1"
        />
        <polygon
          points="140,430 660,430 660,438 140,438"
          fill="rgba(0,0,0,.25)"
          stroke="none"
        />
      </g>

      {/* End wall back */}
      <g data-part="endwall" className={cls("endwall")}>
        <path
          d="M150 430 L150 240 Q400 90 650 240 L650 430 Z"
          fill={colorOf("endwall")}
          stroke="rgba(255,255,255,.2)"
          strokeWidth="1"
          opacity="0.85"
        />
      </g>

      {/* Ribs (structural arches) */}
      <g data-part="rib" className={cls("rib")}>
        {[200, 280, 360, 440, 520, 600].map((cx, i) => (
          <path
            key={i}
            d={`M${cx - 60} 430 Q${cx} 150 ${cx + 60} 430`}
            fill="none"
            stroke={colorOf("rib")}
            strokeWidth="3"
            opacity="0.9"
          />
        ))}
      </g>

      {/* Membrane (translucent outer shell) */}
      <g data-part="membrane" className={cls("membrane")}>
        <path
          d="M140 430 Q140 130 400 110 Q660 130 660 430 Z"
          fill={colorOf("membrane")}
          stroke="rgba(255,255,255,.35)"
          strokeWidth="1.5"
          opacity="0.78"
        />
      </g>

      {/* Skylight */}
      <g data-part="skylight" className={cls("skylight")}>
        <ellipse cx="480" cy="135" rx="55" ry="14" fill={colorOf("skylight")} stroke="rgba(255,255,255,.4)" />
        <ellipse cx="480" cy="133" rx="40" ry="8" fill="rgba(255,255,255,.25)" stroke="none" />
      </g>

      {/* Interior glow window */}
      <g data-part="interior" className={cls("interior")}>
        <path
          d="M320 430 L320 280 Q400 230 480 280 L480 430 Z"
          fill={colorOf("interior")}
          stroke="rgba(255,255,255,.3)"
          opacity="0.85"
        />
        <path
          d="M340 420 L340 295 Q400 255 460 295 L460 420"
          fill="rgba(255,255,255,.08)"
          stroke="none"
        />
      </g>

      {/* Entry door */}
      <g data-part="door" className={cls("door")}>
        <rect x="600" y="310" width="46" height="118" rx="6" fill={colorOf("door")} stroke="rgba(255,255,255,.3)" />
        <circle cx="638" cy="372" r="2" fill="rgba(255,255,255,.7)" />
      </g>
    </svg>
  );
}
