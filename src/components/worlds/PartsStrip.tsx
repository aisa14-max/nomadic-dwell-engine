import { AnimatePresence, motion } from "framer-motion";
import { PARTS, PartId, findOption } from "@/data/dwellingParts";
import PickerColumn from "./PickerColumn";

type Props = {
  activePart: PartId | null;
  configured: Map<PartId, string>;
  onClick: (p: PartId) => void;
  onSelectOption: (optionId: string) => void;
};

const EASE = [0.6, 0.2, 0.2, 1] as const;

export default function PartsStrip({ activePart, configured, onClick, onSelectOption }: Props) {
  const n = PARTS.length;
  const activeIdx = activePart ? PARTS.findIndex((p) => p.id === activePart) : -1;

  return (
    <div className="relative w-full">
      {/* Popover picker positioned above the active button */}
      <AnimatePresence>
        {activePart && activeIdx >= 0 && (
          <motion.div
            key={activePart}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="absolute bottom-full mb-3 -translate-x-1/2"
            style={{ left: `calc((100% / ${n}) * ${activeIdx + 0.5})` }}
            onClick={(e) => e.stopPropagation()}
          >
            <PickerColumn
              activePart={activePart}
              selectedOptionId={configured.get(activePart)}
              onSelect={onSelectOption}
            />
            {/* Tail pointing down to the active button */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45 bg-white/10 border-r border-b border-white/15"
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="liquid-glass rounded-2xl p-2 flex gap-2 items-stretch w-full">
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
              className={`relative flex-1 min-w-0 basis-0 rounded-xl px-3 py-3 text-left transition-all cust-ease ${
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
    </div>
  );
}
