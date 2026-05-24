import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useReservation } from "@/hooks/useReservation";
import { PARTS, PartId } from "@/data/dwellingParts";
import Dwelling from "./Dwelling";
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
    <div
      className="fixed top-24 inset-x-0 bottom-0 z-40 overflow-hidden"
      onClick={handleBackdrop}
    >
      {/* Sky: deep navy gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #050818 0%, #0a1230 30%, #131e48 55%, #2a2a3d 70%, #6b5a3e 78%, #b08a5a 88%, #d4a86a 100%)",
        }}
      />

      {/* Stars */}
      <div
        className="absolute inset-0 opacity-80 pointer-events-none"
        style={{
          background: `
            radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,.9), transparent 60%),
            radial-gradient(1px 1px at 27% 32%, rgba(255,255,255,.7), transparent 60%),
            radial-gradient(1.5px 1.5px at 42% 12%, rgba(255,255,255,.95), transparent 60%),
            radial-gradient(1px 1px at 58% 24%, rgba(255,255,255,.6), transparent 60%),
            radial-gradient(1px 1px at 71% 8%, rgba(255,255,255,.85), transparent 60%),
            radial-gradient(1.5px 1.5px at 84% 28%, rgba(255,255,255,.8), transparent 60%),
            radial-gradient(1px 1px at 92% 14%, rgba(255,255,255,.7), transparent 60%),
            radial-gradient(1px 1px at 7% 42%, rgba(255,255,255,.65), transparent 60%),
            radial-gradient(1px 1px at 33% 48%, rgba(255,255,255,.55), transparent 60%),
            radial-gradient(1px 1px at 48% 38%, rgba(255,255,255,.5), transparent 60%),
            radial-gradient(1px 1px at 64% 52%, rgba(255,255,255,.6), transparent 60%),
            radial-gradient(1.2px 1.2px at 77% 44%, rgba(255,255,255,.7), transparent 60%),
            radial-gradient(1px 1px at 89% 56%, rgba(255,255,255,.5), transparent 60%),
            radial-gradient(1px 1px at 18% 60%, rgba(255,255,255,.45), transparent 60%)
          `,
          maskImage: "linear-gradient(180deg, #000 0%, #000 60%, transparent 75%)",
          WebkitMaskImage: "linear-gradient(180deg, #000 0%, #000 60%, transparent 75%)",
        }}
      />

      {/* Soft horizon glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 18% at 50% 78%, rgba(255,210,150,.25), transparent 70%)",
        }}
      />

      {/* Close + page identity */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="liquid-glass rounded-full w-10 h-10 inline-flex items-center justify-center text-white/80 hover:text-white"
          aria-label="Exit customizer"
        >
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <span className="text-xs font-body text-white/70 uppercase tracking-[.18em]">
          // Worlds · Configure
        </span>
      </div>

      {/* Main viewport */}
      <motion.div
        animate={{ x: -rightInset / 2 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative w-full h-full flex flex-col items-center justify-center px-8"
      >
        <div
          className="relative w-full max-w-3xl aspect-[16/9]"
          onClick={(e) => e.stopPropagation()}
        >
          <Dwelling
            colors={r.colors}
            wireframePart={r.stage === "configure" ? r.activePart : null}
            fullyColorized={r.stage === "confirmed"}
            className="w-full h-full"
          />

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

      {/* Parts strip */}
      <AnimatePresence>
        {r.stage === "configure" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[min(1100px,calc(100%-48px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <PartsStrip
              activePart={r.activePart}
              configured={r.configured}
              onClick={handlePartClick}
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
            className="absolute top-6 right-6 z-30"
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

      <AnimatePresence>
        {r.stage === "payment" && (
          <div onClick={(e) => e.stopPropagation()}>
            <PaymentPanel totals={r.totals} onSubmit={r.submitPayment} />
          </div>
        )}
      </AnimatePresence>

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
