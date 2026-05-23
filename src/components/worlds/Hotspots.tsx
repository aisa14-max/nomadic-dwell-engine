import { PARTS, PartId } from "@/data/dwellingParts";

type Props = {
  activePart: PartId | null;
  configured: Map<PartId, string>;
  onClick: (p: PartId) => void;
};

export default function Hotspots({ activePart, configured, onClick }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {PARTS.map((p) => {
        const isActive = activePart === p.id;
        const done = configured.has(p.id);
        return (
          <button
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              onClick(p.id);
            }}
            className="group absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
            style={{ left: `${p.hotspot.x}%`, top: `${p.hotspot.y}%` }}
            aria-label={`Configure ${p.label}`}
          >
            <span
              className={`block w-3.5 h-3.5 rounded-full border border-white/70 ${
                isActive ? "bg-white" : done ? "bg-white/70" : "bg-white/20"
              } shadow-[0_0_18px_rgba(255,255,255,.6)] transition-all`}
            />
            <span className="absolute left-1/2 -translate-x-1/2 -top-9 liquid-glass rounded-full px-3 py-1 text-[11px] font-body whitespace-nowrap text-white opacity-0 group-hover:opacity-100 transition-opacity">
              {p.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
