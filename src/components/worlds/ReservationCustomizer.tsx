import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useReservation } from "@/hooks/useReservation";
import { PARTS, PartId } from "@/data/dwellingParts";
import Dwelling from "./Dwelling";
import Hotspots from "./Hotspots";
import PartsStrip from "./PartsStrip";
import ReserveCard from "./ReserveCard";
import SummaryPanel from "./SummaryPanel";
import PaymentPanel from "./PaymentPanel";
import ConfirmedOverlay from "./ConfirmedOverlay";

const EASE = [0.6, 0.2, 0.2, 1] as const;

type Props = { onClose: () => void };

export default function ReservationCustomizer({ onClose }: Props) {
  const r = useReservation();
  const [flashAt, setFlashAt] = useState<{ id: PartId; key: number } | null>(null);

  // close picker on outside click — listener on overlay
  const handleBackdrop = () => {
    if (r.activePart) r.setActive(null);
  };

  const handlePartClick = (p: PartId) => {
    if (r.activePart === p) r.setActive(null);
    else r.setActive(p);
  };

  const handleSelectOption = (optionId: string) => {
    if (!r.activePart) return;
    const wasConfigured = r.configured.has(r.activePart);
    r.selectOption(r.activePart, optionId);
    if (!wasConfigured) setFlashAt({ id: r.activePart, key: Date.now() });
  };

  // clear flash after animation
  useEffect(() => {
    if (!flashAt) return;
    const t = setTimeout(() => setFlashAt(null), 1200);
    return () => clearTimeout(t);
  }, [flashAt]);

  const rightInset = r.stage === "payment" ? 880 : r.stage === "summary" ? 420 : 0;

  const flashPos = useMemo(() => {
    if (!flashAt) return null;
    const p = PARTS.find((x) => x.id === flashAt.id);
    return p ? p.hotspot : null;
  }, [flashAt]);

  return (
    <div className="fixed inset-0 z-40 bg-black overflow-hidden" onClick={handleBackdrop}>
      {/* Close to return to base Configurator */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-24 left-4 z-40 liquid-glass rounded-full w-10 h-10 inline-flex items-center justify-center text-white/80 hover:text-white"
        aria-label="Exit customizer"
      >
        <X className="h-4 w-4" strokeWidth={1.5} />
      </button>

      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0c] via-black to-[#050505]" />
      <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(232,180,100,.18), transparent 70%)",
      }} />

      {/* Main viewport (slides left to accommodate right panels) */}
      <motion.div
        animate={{ x: -rightInset / 2 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative w-full h-full flex flex-col items-center justify-center px-8"
      >
        <div className="relative w-full max-w-5xl aspect-[8/5]" onClick={(e) => e.stopPropagation()}>
          <Dwelling
            colors={r.colors}
            wireframePart={r.stage === "configure" ? r.activePart : null}
            fullyColorized={r.stage === "confirmed"}
            className="w-full h-full"
          />

          {/* Hotspots */}
          {r.stage === "configure" && !r.activePart && (
            <Hotspots
              activePart={r.activePart}
              configured={r.configured}
              onClick={handlePartClick}
            />
          )}

          {/* Flash halo */}
          {flashPos && (
            <div
              key={flashAt!.key}
              className="anim-part-flash absolute w-24 h-24 rounded-full bg-white/70 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${flashPos.x}%`, top: `${flashPos.y}%`, filter: "blur(8px)" }}
            />
          )}
        </div>
      </motion.div>

      {/* Parts strip — hidden outside configure */}
      <AnimatePresence>
        {r.stage === "configure" && (
          <motion.div
            initial={{ x: "-50%", y: 80, opacity: 0 }}
            animate={{ x: "-50%", y: 0, opacity: 1 }}
            exit={{ x: "-50%", y: 80, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute bottom-6 left-1/2 z-30 w-[min(1100px,calc(100%-48px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <PartsStrip
              activePart={r.activePart}
              configured={r.configured}
              onClick={handlePartClick}
              showPicker
              selectedOptionId={r.activePart ? r.configured.get(r.activePart) : undefined}
              onSelectOption={handleSelectOption}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reserve card */}
      <AnimatePresence>
        {r.stage === "configure" && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute top-24 right-6 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <ReserveCard
              configuredCount={r.configured.size}
              total={r.totals.total}
              onReserve={() => r.setStage("summary")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary panel */}
      <AnimatePresence>
        {(r.stage === "summary" || r.stage === "payment") && (
          <div onClick={(e) => e.stopPropagation()}>
            <SummaryPanel
              configured={r.configured as unknown as Map<string, string>}
              totals={r.totals}
              compact={r.stage === "payment"}
              onClose={() => r.setStage("configure")}
              onConfirm={() => r.setStage("payment")}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Payment panel */}
      <AnimatePresence>
        {r.stage === "payment" && (
          <div onClick={(e) => e.stopPropagation()}>
            <PaymentPanel totals={r.totals} onSubmit={r.submitPayment} />
          </div>
        )}
      </AnimatePresence>

      {/* Confirmed */}
      <AnimatePresence>
        {r.stage === "confirmed" && (
          <ConfirmedOverlay
            reservationRef={r.reservationRef}
            colors={r.colors}
            total={r.totals.total}
            onContinue={() => r.setStage("configure")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
