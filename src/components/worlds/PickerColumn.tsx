import { PARTS, PartId, gbp } from "@/data/dwellingParts";

type Props = {
  activePart: PartId;
  selectedOptionId: string | undefined;
  onSelect: (optionId: string) => void;
};

export default function PickerColumn({ activePart, selectedOptionId, onSelect }: Props) {
  const part = PARTS.find((p) => p.id === activePart)!;
  return (
    <div
      key={activePart}
      className="anim-picker-rise liquid-glass rounded-2xl p-3 w-[260px]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-body uppercase tracking-[.18em] text-white/60 px-2 mb-2">
        {part.label}
      </p>
      <div className="flex flex-col gap-1">
        {part.options.map((o) => {
          const active = selectedOptionId === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                active ? "bg-white/15" : "hover:bg-white/[.06]"
              }`}
            >
              <span
                className="w-5 h-5 rounded-full border border-white/40 shrink-0"
                style={{ background: o.hex }}
              />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-body text-white truncate">{o.name}</span>
              </span>
              <span className="text-xs font-body text-white/70">{gbp(o.price)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
