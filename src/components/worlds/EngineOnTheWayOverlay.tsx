import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { PartId, gbp } from "@/data/dwellingParts";

type Props = {
  reservationRef: string;
  colors: Partial<Record<PartId, string>>;
  total: number;
  onContinue: () => void;
  /** The exterior render as last configured (rib/membrane colour, and
      shortened if that's the state it was left in) — so the confirmation
      screen actually shows the dwelling being delivered, not just a price
      and a reference number. */
  dwellingImage?: string;
  /** The 5 recoloured rib/membrane renders were baked ~6% shorter
      (vertically only — measured bounding box of the opaque pixels: same
      width, less height) than the default clear-rib/beige-membrane render
      they share a canvas size with. Rather than shrink the default down,
      this stretches the others vertically to match it, clipped by the
      same overflow-hidden frame the default is already naturally cropped
      by. A uniform scale() would also widen them ~6% they don't need
      (their width already matches), so this is Y-only. 1 (no correction)
      for the default render. */
  dwellingImageScale?: number;
};

export default function EngineOnTheWayOverlay({ reservationRef, total, onContinue, dwellingImage, dwellingImageScale = 1 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.6, 0.2, 0.2, 1] }}
      className="fixed inset-0 z-[60] backdrop-blur-md bg-black/70 flex items-center justify-center px-6"
    >
      <div className="confirm-particles absolute inset-0 pointer-events-none" />

      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.6, 0.2, 0.2, 1] }}
        className="relative liquid-glass rounded-3xl p-8 max-w-sm w-full text-center"
      >
        {/* Emerald matches the "confirmed" state used elsewhere in the app
            (e.g. Profile's Order confirmed check) rather than the amber
            pulse used for in-progress reservation states. */}
        <div className="relative w-14 h-14 mx-auto rounded-full bg-emerald-400/10 border border-emerald-400/30 inline-flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <Sparkles className="relative h-7 w-7 text-emerald-300" strokeWidth={1.8} />
        </div>

        <p className="mt-6 text-[11px] uppercase tracking-[.2em] text-white/60 font-body">
          Payment confirmed
        </p>
        <h1 className="font-heading text-white text-4xl mt-3 tracking-[-1px] leading-tight">
          Congratulations,
        </h1>
        <p className="font-heading text-white/90 text-2xl mt-1 tracking-[-.5px] leading-tight">
          your Nomadic Engine is on its way.
        </p>

        {/* The finalized dwelling — so this screen shows what's actually
            being delivered, not just a reference number and a price. Kept
            small and centered rather than full-card-width, so the card
            stays close to its original small/square shape instead of
            stretching tall around a big image. */}
        {dwellingImage && (
          <div
            className="mt-5 mx-auto w-40 rounded-xl overflow-hidden liquid-glass"
            style={{ aspectRatio: "8192/5504" }}
          >
            <img
              src={dwellingImage}
              alt="Your finished dwelling"
              className="w-full h-full object-contain"
              style={dwellingImageScale !== 1 ? { transform: `scaleY(${dwellingImageScale})` } : undefined}
            />
          </div>
        )}

        <div className="mt-7 liquid-glass rounded-2xl p-4 flex items-center justify-between">
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-body">Reference</p>
            <p className="font-heading text-white text-lg tracking-[1px] mt-0.5">{reservationRef}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-body">Total</p>
            <p className="font-heading text-white text-lg tracking-[-.5px] mt-0.5">{gbp(total)}</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="mt-7 w-full bg-white text-black rounded-full px-4 py-2.5 text-sm font-body font-medium inline-flex items-center justify-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </motion.div>
    </motion.div>
  );
}
