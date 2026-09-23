import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Settings, Sparkles, X } from "lucide-react";
import BlurText from "@/components/BlurText";
import WrapUpScreen from "@/components/WrapUpScreen";
import { useMockAuth } from "@/context/MockAuth";
import { WRAPUP_EVENT, requestWrapUp } from "@/lib/tribeStore";
import ConfiguratorPortfolio from "@/pages/ConfiguratorPortfolio";

// Same near-black background as the Tribe page's layer-0 entrance, but a
// little cluster of meshing gears instead of Tribe's warm glow orb — playful
// "under the hood" motion rather than mood lighting or a blueprint.
//
// After the reveal beat, this hands off to ConfiguratorPortfolio — the
// frozen, still-live-backend-connected build (chat + real /render calls to
// the FastAPI service), as opposed to the main Configurator page, which now
// runs on baked static scenes for the show. That frozen file is intentionally
// left unmodified elsewhere; only this handoff timing lives here.
const REVEAL_MS = 2200;

/** Under the Hood as a popup over whatever page you're on — same pattern as
 *  LoginDialog/OnboardingFlow (Radix Dialog, global open state on
 *  MockAuth), not a routed page. Closing it returns you exactly where you
 *  were, nothing navigates. */
export default function UnderTheHoodDialog() {
  const { underHoodOpen, closeUnderHood } = useMockAuth();
  const [showEngine, setShowEngine] = useState(false);
  // No global Nav to hang a "Ready to wrap up?" off while this is open (it
  // hides for every full-panel modal — see Nav's onboardingOpen/loginOpen/
  // planSelectionOpen check, extended below), so this popup carries its
  // own, in its header next to Close. Always available — unlike Tribe's,
  // there's no engagement signal from the frozen ConfiguratorPortfolio
  // build to gate it on.
  const [showEndScreen, setShowEndScreen] = useState(false);

  useEffect(() => {
    if (!underHoodOpen) { setShowEngine(false); return; }
    const t = setTimeout(() => setShowEngine(true), REVEAL_MS);
    return () => clearTimeout(t);
  }, [underHoodOpen]);

  // Defensive — same lock PaymentPanel uses, so the page behind can never
  // scroll while this is open regardless of what Radix's own modal scroll
  // lock does or doesn't cover. This component is always mounted (see
  // App.tsx), so it's gated on underHoodOpen rather than mount/unmount.
  useEffect(() => {
    if (!underHoodOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [underHoodOpen]);

  useEffect(() => {
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: string } | undefined;
      if (detail?.type === "open") setShowEndScreen(true);
    };
    window.addEventListener(WRAPUP_EVENT, onEvent);
    return () => window.removeEventListener(WRAPUP_EVENT, onEvent);
  }, []);

  return (
    <DialogPrimitive.Root open={underHoodOpen} onOpenChange={(open) => { if (!open) closeUnderHood(); }}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[70] overflow-y-auto flex items-start justify-center p-2 md:p-3 text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">Under the Hood</DialogPrimitive.Title>

          <DialogPrimitive.Close
            className="fixed top-6 right-6 z-20 liquid-glass w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </DialogPrimitive.Close>

          {/* panel-glow-pulse on a plain wrapper, not the button itself —
              .liquid-glass has its own overflow:hidden for its border-
              gradient trick, which clips a box-shadow glow applied
              directly to it (see the same note elsewhere in this app). */}
          <div className="fixed top-6 right-24 z-20 rounded-full panel-glow-pulse">
            <button
              type="button"
              onClick={() => requestWrapUp()}
              className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body font-medium text-white/90 hover:text-white inline-flex items-center gap-2"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              Ready to wrap up?
            </button>
          </div>

          {/* The actual popup panel — liquid-glass-strong/rounded-[2rem],
              same card language as the questionnaire. Deliberately NOT
              height-capped or internally scrollable (that was tried twice —
              max-h+overflow-y-auto, then a definite h-[95vh] — and both
              still left ConfiguratorPortfolio's own chat panel growing
              instead of scrolling internally, since that frozen file's own
              "keeps getting taller" fix apparently needs more than just a
              definite ancestor height to behave the way it does as a real
              standalone page). Instead this card is left to size itself
              exactly the way it would on its own route (auto height, no
              cap) — same environment its internal fixes are actually
              proven to work in — and the OUTER Content wrapper above
              scrolls the whole modal if it runs past the viewport, rather
              than this div scrolling its own content. transform-gpu still
              matters: it's a no-op transform, but any transform makes this
              div a containing block for position:fixed descendants —
              ConfiguratorPortfolio's own background video and dark overlay
              are `fixed inset-0`, so without this they'd size to the real
              viewport and paint behind the backdrop margin instead of
              filling (and staying clipped to) just this card. */}
          <div className="relative w-full max-w-[1500px] my-auto liquid-glass-strong border border-white/10 rounded-[2rem] overflow-hidden transform-gpu">
          <AnimatePresence mode="wait">
            {!showEngine ? (
              <motion.div
                key="reveal"
                exit={{ opacity: 0, filter: "blur(12px)" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative min-h-[70vh] w-full overflow-hidden bg-[#02030a] text-white"
              >
                <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-gradient-to-b from-[#02030a]/40 via-[#02030a]/55 to-[#02030a]/80" />
                  <div
                    className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                    }}
                  />
                </div>

                <div className="relative z-10 flex min-h-[70vh] w-full flex-col items-center justify-center gap-10">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Big gear, slow clockwise */}
                    <motion.div
                      className="absolute"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      style={{ filter: "drop-shadow(0 0 10px rgba(150,210,255,0.25))" }}
                    >
                      <Settings className="h-28 w-28 text-white/70" strokeWidth={1.25} />
                    </motion.div>
                    {/* Small gear, faster counter-clockwise, meshed top-right */}
                    <motion.div
                      className="absolute -top-2 right-0"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                      style={{ filter: "drop-shadow(0 0 8px rgba(150,210,255,0.25))" }}
                    >
                      <Settings className="h-14 w-14 text-white/50" strokeWidth={1.25} />
                    </motion.div>
                    {/* Smallest gear, quickest counter-clockwise, meshed bottom-left */}
                    <motion.div
                      className="absolute -bottom-3 -left-3"
                      animate={{ rotate: -360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(150,210,255,0.2))" }}
                    >
                      <Settings className="h-9 w-9 text-white/40" strokeWidth={1.25} />
                    </motion.div>
                  </div>
                  <BlurText
                    text="See how your Engine thinks."
                    className="font-heading text-4xl md:text-5xl text-white/90 text-center"
                  />
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/40 font-body text-center">
                    (step inside the configurator's mind)
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="engine"
                initial={{ opacity: 0, filter: "blur(12px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <ConfiguratorPortfolio />
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* Not nested inside the card div above — it needs to cover the
              full screen, and that div's overflow-hidden (for its own
              rounded corners) would clip it to the card's bounds instead. */}
          <WrapUpScreen
            show={showEndScreen}
            onClose={() => setShowEndScreen(false)}
            subtitle="You've seen how your Engine thinks."
          />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
