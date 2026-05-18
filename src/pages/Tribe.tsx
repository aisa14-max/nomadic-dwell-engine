import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TribeWorld, { TRIBE_NODES } from "@/components/tribe/TribeWorld";
import BlurText from "@/components/BlurText";

const PHASES = [
  { key: "presence",   range: [0.00, 0.18] as const, eyebrow: "Phase I — Pure Presence",     title: "The tribe exists… but not yet revealed." },
  { key: "signals",    range: [0.18, 0.40] as const, eyebrow: "Phase II — Life Signals",     title: "Faint movements. Anonymous orbits." },
  { key: "identity",   range: [0.40, 0.55] as const, eyebrow: "Phase III — Identity",        title: "Aliases. Intentions. Somewhere in motion." },
  { key: "relations",  range: [0.55, 0.70] as const, eyebrow: "Phase IV — Relationship Field", title: "Invisible alignments detected." },
  { key: "reveal",     range: [0.70, 0.85] as const, eyebrow: "Phase V — World Reveal",      title: "Reality is resolving." },
  { key: "global",     range: [0.85, 1.00] as const, eyebrow: "Phase VI — Living World Map", title: "A tribe across Earth." },
];

export default function Tribe() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pickedRef = useRef<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [campOpen, setCampOpen] = useState(false);
  const [intent, setIntent] = useState(false);

  // Scroll progress 0..1 over a tall scroll container
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = Math.max(0, Math.min(1, el.scrollTop / Math.max(1, max)));
      progressRef.current = p;
      // pick phase
      const i = PHASES.findIndex((ph) => p >= ph.range[0] && p < ph.range[1]);
      setPhaseIdx(i < 0 ? PHASES.length - 1 : i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const pickedNode = useMemo(
    () => TRIBE_NODES.find((n) => n.id === picked) ?? null,
    [picked]
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#01030f] text-white">
      {/* Persistent WebGL scene */}
      <div className="fixed inset-0 z-0">
        <TribeWorld
          progressRef={progressRef}
          pickedRef={pickedRef}
          onPick={(id) => setPicked(id)}
        />
      </div>

      {/* Scroll driver — invisible long page */}
      <div
        ref={scrollerRef}
        className="absolute inset-0 z-10 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
      >
        {PHASES.map((ph, i) => (
          <section
            key={ph.key}
            className="snap-start h-screen w-full flex flex-col justify-end p-10 lg:p-16 pointer-events-none"
          >
            <AnimatePresence mode="wait">
              {phaseIdx === i && (
                <motion.div
                  key={ph.key}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
                  transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-xl pointer-events-auto"
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-white/45 font-body">
                    {ph.eyebrow}
                  </p>
                  <BlurText
                    text={ph.title}
                    className="font-heading text-4xl md:text-5xl text-white/95 mt-4 leading-[1.05]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        ))}
      </div>

      {/* Top brand row */}
      <div className="fixed top-6 left-8 z-30 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/45 font-body">
          Nomadic Engine — The Tribe
        </p>
      </div>

      {/* Phase progress rail */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
        {PHASES.map((ph, i) => (
          <div
            key={ph.key}
            className="group flex items-center gap-3 justify-end"
          >
            <span
              className={`text-[10px] uppercase tracking-[0.25em] transition-opacity duration-500 ${
                phaseIdx === i ? "opacity-90" : "opacity-0 group-hover:opacity-60"
              }`}
            >
              {ph.key}
            </span>
            <span
              className={`h-[1px] transition-all duration-700 ${
                phaseIdx === i ? "w-10 bg-white/90" : "w-4 bg-white/25"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Scroll hint */}
      <AnimatePresence>
        {phaseIdx === 0 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-[10px] uppercase tracking-[0.4em] text-white/45 pointer-events-none"
          >
            scroll to assemble the world ↓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity bubble — when a node is picked (mostly after reveal) */}
      <AnimatePresence>
        {pickedNode && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-8 bottom-8 z-30 w-[300px] rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Signal — {pickedNode.intent}
            </p>
            <div className="font-heading text-2xl mt-2">{pickedNode.name}</div>
            <div className="text-xs text-white/55 mt-1">
              {progressRef.current < 0.55 ? "somewhere in motion…" : pickedNode.city}
            </div>
            <p className="text-xs text-white/55 mt-3 italic">
              “I build while moving.”
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Connect", "Align travel", "Suggest overlap"].map((a) => (
                <button
                  key={a}
                  className="text-[11px] uppercase tracking-[0.2em] rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/[0.08] transition-colors"
                >
                  {a}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camp panel — appears in global phase */}
      <AnimatePresence>
        {phaseIdx >= 5 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setCampOpen((v) => !v)}
            className="fixed bottom-8 right-8 z-30 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl px-5 py-3 text-[11px] uppercase tracking-[0.3em] hover:bg-white/[0.08] transition-colors"
          >
            Camps · 3 forming
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {campOpen && (
          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-8 bottom-24 z-30 w-[320px] rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Emergent camps</p>
            <h3 className="font-heading text-2xl mt-2">Settlements forming</h3>
            <div className="mt-4 space-y-3">
              {[
                { name: "Salt & Page",    city: "Lisbon",     members: 14, theme: "Writers by the Atlantic" },
                { name: "Quiet Signal",   city: "Tbilisi",    members:  9, theme: "Builders in the Caucasus" },
                { name: "Monsoon Studio", city: "Chiang Mai", members: 22, theme: "Filmmakers in SE Asia" },
              ].map((c) => (
                <div key={c.name} className="rounded-xl border border-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-heading text-lg">{c.name}</div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{c.city}</span>
                  </div>
                  <div className="text-xs text-white/55 mt-1">{c.theme}</div>
                  <div className="text-[11px] text-white/45 mt-2">{c.members} aligned now</div>
                  <div className="mt-3 flex gap-2">
                    <button className="text-[11px] uppercase tracking-[0.2em] rounded-full border border-white/20 px-3 py-1.5 hover:bg-white/[0.08]">Observe</button>
                    <button className="text-[11px] uppercase tracking-[0.2em] rounded-full bg-white text-black px-3 py-1.5 hover:bg-white/90">Join</button>
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Build next to me — last phase intent */}
      <AnimatePresence>
        {phaseIdx >= 5 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-8 right-8 z-30"
          >
            <button
              onClick={() => setIntent((v) => !v)}
              className={`rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.3em] border transition-colors ${
                intent
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.04] border-white/15 hover:bg-white/[0.08]"
              }`}
            >
              {intent ? "Movement aligned" : "Align my movement"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy — bottom-left when picked is closed */}
      {!pickedNode && phaseIdx >= 1 && (
        <details className="fixed bottom-8 left-8 z-30 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-xl px-4 py-2 text-[11px] text-white/70">
          <summary className="cursor-pointer list-none uppercase tracking-[0.3em]">Presence</summary>
          <div className="mt-3 space-y-2 pb-1">
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Visible to tribe</label>
            <label className="flex items-center gap-2"><input type="checkbox" /> Anonymous mode</label>
            <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> City-level only</label>
          </div>
        </details>
      )}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
