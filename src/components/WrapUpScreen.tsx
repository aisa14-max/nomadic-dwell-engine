import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import StartOverButton from "@/components/StartOverButton";
import { WRAPUP_EVENT } from "@/lib/tribeStore";

type Props = {
  show: boolean;
  onClose: () => void;
  /** The line under "Thank you for exploring" — page-specific. */
  subtitle: string;
  /** Optional second path out, offered above Start Over (e.g. Tribe's wrap-up
      points at Under the Hood). Omitted entirely elsewhere — a page with no
      cross-promo is just a plain wrap-up screen, Start Over as the one CTA.
      `highlightId` (if given) is echoed to the nav via WRAPUP_EVENT so it can
      glow + point a cursor at whichever of its own controls shares that id,
      e.g. Under the Hood's nav button — not a route, just a shared string. */
  crossPromo?: { label: string; onClick: () => void; highlightId?: string };
};

/** The shared "you're done exploring, now what" screen — reached from the
 *  nav's "Ready to wrap up?" button (see Nav.tsx / tribeStore's WRAPUP_EVENT). */
export default function WrapUpScreen({ show, onClose, subtitle, crossPromo }: Props) {
  // Tells the nav to glow + point a cursor at whichever of its own controls
  // matches crossPromo.highlightId, so the suggestion in this modal ("have
  // you checked X?") is echoed by the real nav control leading there — not
  // just a button inside this card. Cleared on close/unmount so the nav
  // doesn't keep highlighting something after this screen is gone.
  useEffect(() => {
    const to = show && crossPromo?.highlightId ? crossPromo.highlightId : null;
    window.dispatchEvent(new CustomEvent(WRAPUP_EVENT, { detail: { type: "highlight", to } }));
    return () => {
      window.dispatchEvent(new CustomEvent(WRAPUP_EVENT, { detail: { type: "highlight", to: null } }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, crossPromo?.highlightId]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="wrap-up"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative liquid-glass-strong rounded-[1.5rem] p-8 w-full max-w-sm text-center"
          >
            <button
              onClick={onClose}
              aria-label="Keep exploring"
              className="absolute top-4 right-4 text-white/50 hover:text-white/90"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <div className="relative w-14 h-14 mx-auto rounded-full bg-emerald-400/10 border border-emerald-400/30 inline-flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
              <Sparkles className="relative h-7 w-7 text-emerald-300" strokeWidth={1.8} />
            </div>

            <p className="mt-5 text-[11px] uppercase tracking-[.2em] text-white/60 font-body">
              Thank you for exploring
            </p>
            <h2 className="font-heading text-2xl text-white/95 mt-2 leading-tight">
              {subtitle}
            </h2>

            <div className="mt-6 flex flex-col items-center gap-2">
              {crossPromo && (
                <button
                  onClick={crossPromo.onClick}
                  className="w-full rounded-full bg-white text-black hover:bg-white/90 px-6 py-3 text-sm font-body font-medium transition-colors"
                >
                  {crossPromo.label}
                </button>
              )}
              <StartOverButton
                className={[
                  "w-full rounded-full px-6 py-3 text-sm font-body font-medium inline-flex items-center justify-center gap-2 transition-colors",
                  crossPromo
                    ? "border border-white/25 text-white/80 hover:border-white/50 hover:bg-white/5 hover:text-white"
                    : "bg-white text-black hover:bg-white/90",
                ].join(" ")}
              />
              <button
                onClick={onClose}
                className="text-[12px] text-white/50 hover:text-white/85 font-body"
              >
                Keep exploring
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
