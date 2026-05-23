import { motion } from "framer-motion";
import { Download, ArrowRight, Check } from "lucide-react";
import Dwelling from "./Dwelling";
import { PartId, gbp } from "@/data/dwellingParts";

type Props = {
  reservationRef: string;
  colors: Partial<Record<PartId, string>>;
  total: number;
  onContinue: () => void;
};

export default function ConfirmedOverlay({ reservationRef, colors, total, onContinue }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.6, 0.2, 0.2, 1] }}
      className="fixed inset-0 z-[60] backdrop-blur-md bg-black/70 flex items-center justify-center px-6"
    >
      {/* Particles */}
      <div className="confirm-particles absolute inset-0 pointer-events-none" />

      {/* Background dwelling */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50 anim-reserve-active rounded-full mx-auto my-auto" style={{ maxWidth: 900, maxHeight: 600, animation: "none" }}>
        <Dwelling colors={colors} wireframePart={null} fullyColorized className="w-full max-w-3xl" />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6, ease: [0.6, 0.2, 0.2, 1] }}
        className="relative liquid-glass rounded-3xl p-8 max-w-md w-full text-center"
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-white/10 inline-flex items-center justify-center anim-reserve-active">
          <Check className="h-7 w-7 text-white" strokeWidth={2} />
        </div>
        <p className="mt-5 text-[11px] uppercase tracking-[.2em] text-white/60 font-body">Reservation confirmed</p>
        <h1 className="font-heading text-white text-4xl mt-2 tracking-[-1px]">Welcome home.</h1>
        <p className="mt-4 text-sm font-body text-white/75 leading-relaxed">
          Your engine is reserved. Our deployment team will reach out within 48 hours to confirm
          your site visit and final logistics.
        </p>

        <div className="mt-6 liquid-glass rounded-2xl p-4 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-body">Reference</p>
            <p className="font-heading text-white text-lg tracking-[1px] mt-0.5">{reservationRef}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-body">Total</p>
            <p className="font-heading text-white text-lg tracking-[-.5px] mt-0.5">{gbp(total)}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => alert("Download placeholder — confirmation PDF coming soon.")}
            className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body font-medium text-white inline-flex items-center justify-center gap-2 flex-1"
          >
            <Download className="h-4 w-4" strokeWidth={2} /> Download
          </button>
          <button
            onClick={onContinue}
            className="bg-white text-black rounded-full px-4 py-2.5 text-sm font-body font-medium inline-flex items-center justify-center gap-2 flex-1"
          >
            Continue <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
