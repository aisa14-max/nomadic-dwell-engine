import { ArrowUpRight } from "lucide-react";
import { TOTAL_PARTS, gbp } from "@/data/dwellingParts";

type Props = {
  configuredCount: number;
  total: number;
  onReserve: () => void;
};

export default function ReserveCard({ configuredCount, total, onReserve }: Props) {
  const complete = configuredCount === TOTAL_PARTS;
  const pct = (configuredCount / TOTAL_PARTS) * 100;
  return (
    <div className={`liquid-glass rounded-2xl p-5 w-[280px] ${complete ? "anim-reserve-active" : ""}`}>
      <p className="text-[10px] font-body uppercase tracking-[.2em] text-white/60">Estimated total</p>
      <p className="font-heading text-white text-3xl mt-1 tracking-[-1px]">{gbp(total)}</p>
      <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full transition-all duration-500 cust-ease"
          style={{
            width: `${pct}%`,
            background: complete
              ? "linear-gradient(90deg,#e8b464,#f5d28a)"
              : "rgba(255,255,255,.7)",
          }}
        />
      </div>
      <p className="mt-2 text-[11px] font-body text-white/60">
        {configuredCount}/{TOTAL_PARTS} parts configured
      </p>
      <button
        onClick={onReserve}
        disabled={!complete}
        aria-disabled={!complete}
        className={`mt-4 w-full rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center justify-center gap-2 transition-all ${
          complete
            ? "bg-white text-black hover:opacity-90 cursor-pointer"
            : "bg-white/10 text-white/50 cursor-not-allowed"
        }`}
      >
        {complete ? "Reserve" : "Complete to Reserve"}
        {complete && <ArrowUpRight className="h-4 w-4" strokeWidth={2} />}
      </button>
    </div>
  );
}
