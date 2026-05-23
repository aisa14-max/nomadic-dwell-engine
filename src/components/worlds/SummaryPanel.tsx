import { motion } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { PARTS, findOption, gbp } from "@/data/dwellingParts";

type Totals = { subtotal: number; tax: number; total: number; dueToday: number };

type Props = {
  configured: Map<string, string>;
  totals: Totals;
  compact: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const EASE = [0.6, 0.2, 0.2, 1] as const;

export default function SummaryPanel({ configured, totals, compact, onClose, onConfirm }: Props) {
  return (
    <motion.aside
      initial={{ x: 440, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 440, opacity: 0 }}
      transition={{ duration: 0.65, ease: EASE }}
      className="fixed top-4 bottom-4 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col"
      style={{
        right: compact ? 484 : 16,
        width: compact ? 380 : 420,
      }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-body">Your reservation</p>
          <h2 className="font-heading text-2xl text-white mt-0.5">Summary</h2>
        </div>
        <button
          onClick={onClose}
          className="liquid-glass rounded-full w-9 h-9 inline-flex items-center justify-center text-white/80 hover:text-white"
          aria-label="Close summary"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {PARTS.map((p) => {
          const optId = configured.get(p.id);
          const opt = optId ? findOption(p.id as any, optId) : null;
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5 border-b border-white/5"
            >
              {opt ? (
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shrink-0"
                  style={{ background: opt.hex }}
                />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-[.14em] text-white/55 font-body">
                  {p.label}
                </p>
                <p className="text-sm font-body text-white truncate">{opt?.name ?? "—"}</p>
              </div>
              <p className="text-sm font-body text-white/85">{opt ? gbp(opt.price) : "—"}</p>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-4 border-t border-white/10 space-y-1.5">
        <Row label="Subtotal" value={gbp(totals.subtotal)} />
        <Row label="Tax & Permits" value={gbp(totals.tax)} muted />
        <div className="h-px bg-white/10 my-2" />
        <Row label="Total" value={gbp(totals.total)} bold />
        {!compact && (
          <button
            onClick={onConfirm}
            className="mt-4 w-full bg-white text-black rounded-full px-5 py-3 text-sm font-body font-medium inline-flex items-center justify-center gap-2"
          >
            Confirm Reservation <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        )}
        {compact && (
          <p className="mt-3 text-[11px] font-body text-white/50 text-center">
            Complete payment to confirm
          </p>
        )}
      </div>
    </motion.aside>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs font-body ${muted ? "text-white/55" : "text-white/80"}`}>{label}</span>
      <span
        className={`font-body ${
          bold ? "font-heading text-white text-xl tracking-[-.5px]" : "text-sm text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
