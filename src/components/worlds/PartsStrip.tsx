import { PARTS, PartId, findOption } from "@/data/dwellingParts";

type Props = {
  activePart: PartId | null;
  configured: Map<PartId, string>;
  onClick: (p: PartId) => void;
};

export default function PartsStrip({ activePart, configured, onClick }: Props) {
  return (
    <div className="liquid-glass rounded-2xl p-2 flex gap-2 items-stretch">
      {PARTS.map((p) => {
        const optId = configured.get(p.id);
        const opt = optId ? findOption(p.id, optId) : null;
        const isActive = activePart === p.id;
        const isConfigured = !!opt;
        return (
          <button
            key={p.id}
            onClick={(e) => {
              e.stopPropagation();
              onClick(p.id);
            }}
            className={`relative flex-1 min-w-[88px] rounded-xl px-3 py-3 text-left transition-all cust-ease ${
              isActive ? "bg-white/15 ring-1 ring-white/40" : "bg-white/[.04] hover:bg-white/[.08]"
            } ${isConfigured ? "opacity-100" : "opacity-[.62]"}`}
          >
            <span
              className={`block text-[10px] font-body uppercase tracking-[.14em] mb-1 ${
                isConfigured ? "text-white/80" : "text-white/50"
              }`}
              style={{ filter: isConfigured ? "none" : "saturate(0)" }}
            >
              {p.label}
            </span>
            <span className="block text-xs font-body text-white/70 truncate">
              {opt ? opt.name : "Select"}
            </span>
            {opt && (
              <span
                className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border border-white/60"
                style={{ background: opt.hex }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
