import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TribeWorld, { TRIBE_NODES, INTENT_COLOR_HEX } from "@/components/tribe/TribeWorld";
import BlurText from "@/components/BlurText";

const PHASES = [
  { key: "presence",  range: [0.00, 0.15] as const, eyebrow: "Phase I — Pure Presence",       title: "The tribe exists… but not yet revealed." },
  { key: "signals",   range: [0.15, 0.32] as const, eyebrow: "Phase II — Life Signals",       title: "Anonymous orbits. Faint motion." },
  { key: "identity",  range: [0.32, 0.50] as const, eyebrow: "Phase III — Identity Emergence", title: "Aliases surface. Somewhere in motion." },
  { key: "relations", range: [0.50, 0.65] as const, eyebrow: "Phase IV — Relationship Field", title: "Invisible alignments detected." },
  { key: "reveal",    range: [0.65, 0.85] as const, eyebrow: "Phase V — World Reveal",        title: "Reality resolves into geography." },
  { key: "global",    range: [0.85, 1.00] as const, eyebrow: "Phase VI — Living World Map",   title: "A tribe across Earth." },
];

const RADIAL_ACTIONS = [
  { label: "Connect",        angle: -90 },
  { label: "Collaborate",    angle: -36 },
  { label: "Align travel",   angle:  18 },
  { label: "Join camp",      angle:  72 },
  { label: "Suggest overlap",angle: 126 },
];

export default function Tribe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const alignRef = useRef(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [picked, setPicked] = useState<{ id: string; x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [align, setAlign] = useState(false);
  const [campOpen, setCampOpen] = useState(false);

  // Sync align state to ref
  useEffect(() => { alignRef.current = align; }, [align]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight;
      const p = Math.max(0, Math.min(1, el.scrollTop / Math.max(1, max)));
      progressRef.current = p;
      const i = PHASES.findIndex((ph) => p >= ph.range[0] && p < ph.range[1]);
      setPhaseIdx(i < 0 ? PHASES.length - 1 : i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const pickedNode = useMemo(
    () => (picked ? TRIBE_NODES.find((n) => n.id === picked.id) ?? null : null),
    [picked]
  );
  const hoverNode = useMemo(
    () => (hover ? TRIBE_NODES.find((n) => n.id === hover) ?? null : null),
    [hover]
  );

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-[#01030f] text-white select-none">
      {/* WebGL world */}
      <div className="fixed inset-0 z-0">
        <TribeWorld
          progressRef={progressRef}
          alignRef={alignRef}
          containerRef={containerRef}
          onPick={(id, screen) => setPicked(id && screen ? { id, x: screen.x, y: screen.y } : null)}
          onHover={(id) => setHover(id)}
        />
      </div>

      {/* Scroll driver */}
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
                  transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
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

      {/* Brand */}
      <div className="fixed top-6 left-8 z-30 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/45 font-body">
          Nomadic Engine — The Tribe
        </p>
      </div>

      {/* Phase rail (right) */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
        {PHASES.map((ph, i) => (
          <div key={ph.key} className="group flex items-center gap-3 justify-end">
            <span className={`text-[10px] uppercase tracking-[0.25em] transition-opacity duration-500 ${
              phaseIdx === i ? "opacity-90" : "opacity-0 group-hover:opacity-60"
            }`}>
              {ph.key}
            </span>
            <span className={`h-[1px] transition-all duration-700 ${
              phaseIdx === i ? "w-10 bg-white/90" : "w-4 bg-white/25"
            }`} />
          </div>
        ))}
      </div>

      {/* Interaction hint */}
      <AnimatePresence>
        {phaseIdx <= 1 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 text-[10px] uppercase tracking-[0.4em] text-white/45 pointer-events-none"
          >
            scroll to assemble · drag to shift perspective
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover emotion chip */}
      <AnimatePresence>
        {hoverNode && !pickedNode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-[180px] z-30 pointer-events-none"
          >
            <div
              className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.3em] backdrop-blur-md"
              style={{
                borderColor: INTENT_COLOR_HEX[hoverNode.intent] + "55",
                color: INTENT_COLOR_HEX[hoverNode.intent],
                background: "rgba(0,0,0,0.35)",
              }}
            >
              {hoverNode.emotion}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial action menu + identity card on pick */}
      <AnimatePresence>
        {pickedNode && picked && (
          <>
            {/* Radial actions floating near node */}
            <motion.div
              key="radial"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-30 pointer-events-none"
              style={{ left: picked.x, top: picked.y, transform: "translate(-50%, -50%)" }}
            >
              {RADIAL_ACTIONS.map((a, i) => {
                const r = 92;
                const rad = (a.angle * Math.PI) / 180;
                const x = Math.cos(rad) * r;
                const y = Math.sin(rad) * r;
                return (
                  <motion.button
                    key={a.label}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{ opacity: 1, x, y }}
                    exit={{ opacity: 0, x: 0, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-auto absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/20 bg-black/45 backdrop-blur-md px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-white/85 hover:bg-white hover:text-black transition-colors"
                  >
                    {a.label}
                  </motion.button>
                );
              })}
              {/* center ring */}
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="h-10 w-10 rounded-full border"
                style={{
                  borderColor: INTENT_COLOR_HEX[pickedNode.intent],
                  boxShadow: `0 0 24px ${INTENT_COLOR_HEX[pickedNode.intent]}66`,
                }}
              />
            </motion.div>

            {/* Identity card (bottom-left) */}
            <motion.div
              key="id-card"
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-8 bottom-8 z-30 w-[300px] rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-xl p-5"
            >
              <p
                className="text-[10px] uppercase tracking-[0.3em]"
                style={{ color: INTENT_COLOR_HEX[pickedNode.intent] }}
              >
                Signal — {pickedNode.intent}
              </p>
              <div className="font-heading text-2xl mt-2">{pickedNode.name}</div>
              <div className="text-xs text-white/55 mt-1">
                {progressRef.current < 0.65 ? "somewhere in motion…" : pickedNode.city}
              </div>
              {/* stay ring */}
              <div className="mt-4 flex items-center gap-3">
                <svg width="36" height="36" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                  <circle
                    cx="18" cy="18" r="14" fill="none"
                    stroke={INTENT_COLOR_HEX[pickedNode.intent]}
                    strokeWidth="2"
                    strokeDasharray={`${Math.min(pickedNode.stayDays, 60) / 60 * 88} 88`}
                    transform="rotate(-90 18 18)"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="text-[11px] text-white/55">
                  {pickedNode.stayDays}-day stay<br/>
                  <span className="text-white/40">{pickedNode.emotion}</span>
                </div>
              </div>
              <p className="text-xs text-white/65 mt-3 italic">"{pickedNode.signal}"</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Camp panel button — global phase */}
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
                  <div className="text-[11px] text-white/45 mt-2 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                    {c.members} aligned now
                  </div>
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

      {/* Align my movement — top right in late phases */}
      <AnimatePresence>
        {phaseIdx >= 5 && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed top-8 right-8 z-30"
          >
            <button
              onClick={() => setAlign((v) => !v)}
              className={`rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.3em] border transition-colors ${
                align
                  ? "bg-white text-black border-white"
                  : "bg-white/[0.04] border-white/15 hover:bg-white/[0.08]"
              }`}
            >
              {align ? "Movement aligned" : "Align my movement"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy */}
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
