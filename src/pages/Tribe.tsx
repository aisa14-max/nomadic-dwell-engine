import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import VoyageScene from "@/components/VoyageScene";
import BlurText from "@/components/BlurText";

type Node = {
  id: string;
  x: number; // 0-1
  y: number; // 0-1
  alias: string;
  city: string;
  distance: "close" | "near" | "far";
  stayDays: number;
  status: "open" | "focused" | "hidden";
  tags: string[];
};

const NODES: Node[] = [
  { id: "n1", x: 0.30, y: 0.40, alias: "Kestrel", city: "Lisbon",   distance: "close", stayDays: 12, status: "open",    tags: ["writing", "ocean"] },
  { id: "n2", x: 0.62, y: 0.32, alias: "Aria",    city: "Tbilisi",  distance: "near",  stayDays: 21, status: "focused", tags: ["code", "wine"] },
  { id: "n3", x: 0.72, y: 0.58, alias: "Mira",    city: "Chiang Mai", distance: "far", stayDays: 40, status: "open",    tags: ["film", "monsoon"] },
  { id: "n4", x: 0.38, y: 0.66, alias: "Ilya",    city: "Mexico City", distance: "near", stayDays: 8,  status: "open",   tags: ["sound", "design"] },
  { id: "n5", x: 0.52, y: 0.50, alias: "Noor",    city: "Marrakech", distance: "close", stayDays: 5,  status: "hidden", tags: ["weaving", "tea"] },
];

const CAMPS = [
  { id: "c1", x: 0.32, y: 0.50, name: "Salt & Page",     theme: "Writers by the Atlantic",   members: 14 },
  { id: "c2", x: 0.68, y: 0.42, name: "Quiet Signal",    theme: "Builders in the Caucasus",  members: 9  },
  { id: "c3", x: 0.62, y: 0.62, name: "Monsoon Studio",  theme: "Filmmakers in SE Asia",     members: 22 },
];

export default function Tribe() {
  // Progressive layer state
  const [layer, setLayer] = useState(0); // 0..6
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [showCamps, setShowCamps] = useState(false);
  const [showBuild, setShowBuild] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [interactions, setInteractions] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const bump = () => setInteractions((n) => n + 1);

  // Layer 0 -> 1 on first interaction
  const reveal = () => {
    bump();
    setLayer((l) => Math.max(l, 1));
  };

  // After enough interactions, slide in the side panel and camps
  useEffect(() => {
    if (interactions >= 3) setLayer((l) => Math.max(l, 3));
    if (interactions >= 4) setShowPanel(true);
    if (interactions >= 6) setShowCamps(true);
    if (interactions >= 9) setShowBuild(true);
    if (interactions >= 2) setShowPrivacy(true);
  }, [interactions]);

  // Connections derived from overlapping tags / stay windows
  const connections = useMemo(() => {
    if (layer < 3) return [];
    const out: { a: Node; b: Node; strength: number }[] = [];
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i], b = NODES[j];
        const shared = a.tags.some((t) => b.tags.includes(t));
        const overlap = Math.min(a.stayDays, b.stayDays) / Math.max(a.stayDays, b.stayDays);
        if (shared || overlap > 0.5) out.push({ a, b, strength: shared ? 0.7 : 0.3 });
      }
    }
    return out;
  }, [layer]);

  const selected = NODES.find((n) => n.id === selectedNode) || null;

  return (
    <div
      ref={wrapRef}
      onWheel={() => { reveal(); }}
      className="relative min-h-screen w-full overflow-hidden bg-[#01030f] text-white"
    >
      {/* Backdrop */}
      <div className="fixed inset-0 z-0">
        <VoyageScene className="absolute inset-0 opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02061a]/60 via-[#01030f]/80 to-[#01030f]" />
      </div>

      {/* Layer 0 — minimal entry */}
      <AnimatePresence>
        {layer === 0 && (
          <motion.button
            key="entry"
            type="button"
            onClick={reveal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.2 }}
            className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-8 cursor-pointer"
          >
            <motion.span
              className="block h-24 w-24 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0) 70%)",
              }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <BlurText
              text="You are not alone in motion."
              className="font-heading text-4xl md:text-5xl text-white/90 text-center"
            />
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-body">
              Move or click to explore the tribe
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Layer 1+ — Living map */}
      {layer >= 1 && (
        <div className="relative z-10 min-h-screen w-full">
          {/* Header */}
          <header className="pt-28 px-8 lg:px-16 max-w-[1400px] mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-body">
              The Tribe — a living map
            </p>
            <h1 className="font-heading text-5xl md:text-6xl mt-3 text-white/95">
              Nearby minds, in motion.
            </h1>
            <p className="font-body text-white/55 mt-3 max-w-xl text-sm">
              The more you explore, the more this world reveals itself.
            </p>
          </header>

          {/* Map area */}
          <div className="relative mx-auto mt-12 max-w-[1400px] px-8 lg:px-16">
            <div
              className="relative h-[640px] w-full rounded-[2rem] liquid-glass overflow-hidden"
              onClick={() => bump()}
            >
              {/* Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {connections.map(({ a, b, strength }, i) => (
                  <motion.line
                    key={i}
                    x1={`${a.x * 100}%`} y1={`${a.y * 100}%`}
                    x2={`${b.x * 100}%`} y2={`${b.y * 100}%`}
                    stroke={`rgba(255,255,255,${0.05 + strength * 0.25})`}
                    strokeWidth={0.6}
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.8, delay: i * 0.15 }}
                  />
                ))}
              </svg>

              {/* Camps (glowing regions) */}
              <AnimatePresence>
                {showCamps && CAMPS.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.4, delay: i * 0.3 }}
                    onClick={(e) => { e.stopPropagation(); bump(); }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group"
                    style={{ left: `${c.x * 100}%`, top: `${c.y * 100}%` }}
                  >
                    <span
                      className="block h-40 w-40 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(180,160,255,0.18) 0%, rgba(180,160,255,0.05) 40%, rgba(0,0,0,0) 70%)",
                      }}
                    />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 liquid-glass rounded-2xl px-4 py-3 text-center whitespace-nowrap">
                      <div className="font-heading text-lg">{c.name}</div>
                      <div className="text-[11px] uppercase tracking-[0.2em] text-white/50 mt-1">{c.theme}</div>
                      <div className="text-xs text-white/60 mt-2">{c.members} aligned</div>
                      <button className="btn-pill btn-white sm mt-3">Join camp</button>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>

              {/* Nodes */}
              {NODES.map((n, i) => (
                <motion.button
                  key={n.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(n.id);
                    setLayer((l) => Math.max(l, 2));
                    bump();
                  }}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1.4, delay: 0.4 + i * 0.25, ease: "easeOut" }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }}
                >
                  {/* Pulse */}
                  <motion.span
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block rounded-full"
                    style={{
                      background:
                        "radial-gradient(circle, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 70%)",
                      height: 56, width: 56,
                    }}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.15, 0.5] }}
                    transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Stay ring */}
                  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" width="34" height="34">
                    <circle cx="17" cy="17" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    <circle
                      cx="17" cy="17" r="14" fill="none"
                      stroke="rgba(255,255,255,0.7)" strokeWidth="1"
                      strokeDasharray={`${Math.min(n.stayDays, 60) / 60 * 88} 88`}
                      transform="rotate(-90 17 17)"
                    />
                  </svg>
                  <span className="relative block h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">
                    {n.distance}
                  </span>

                  {/* Identity thought-bubble */}
                  <AnimatePresence>
                    {selectedNode === n.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="absolute left-6 top-4 liquid-glass rounded-2xl p-4 min-w-[200px] text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-heading text-xl">{n.alias}</div>
                        <div className="text-xs text-white/55 mt-0.5">{n.city}</div>
                        <div className="flex items-center gap-2 mt-3 text-[11px] text-white/60">
                          <span className="h-1.5 w-1.5 rounded-full"
                            style={{ background: n.status === "open" ? "#7df0a0" : n.status === "focused" ? "#f0c97d" : "#888" }} />
                          <span className="uppercase tracking-[0.2em]">{n.status}</span>
                        </div>
                        <div className="text-xs text-white/45 mt-2">{n.stayDays}-day stay</div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {n.tags.map((t) => (
                            <span key={t} className="tag-glass border border-white/10">{t}</span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}

              {/* Hint at edges */}
              {layer < 3 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.3em] text-white/35">
                  Keep exploring — connections emerge
                </div>
              )}
            </div>

            {/* Layer 3 — alignment list */}
            <AnimatePresence>
              {layer >= 3 && (
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="mt-16"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Soft alignments</p>
                  <h2 className="font-heading text-3xl md:text-4xl mt-2">People you may naturally align with</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {NODES.slice(0, 3).map((n) => (
                      <div key={n.id} className="liquid-glass rounded-2xl p-5">
                        <div className="font-heading text-xl">{n.alias}</div>
                        <div className="text-xs text-white/50 mt-1">{n.city} · {n.stayDays}d</div>
                        <div className="text-xs text-white/60 mt-3">
                          Overlap on <span className="text-white/90">{n.tags.join(", ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Layer 6 — Build next to me */}
            <AnimatePresence>
              {showBuild && (
                <motion.section
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1 }}
                  className="my-24"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">Intentional connection</p>
                  <h2 className="font-heading text-3xl md:text-4xl mt-2">Choose to align your path with others</h2>
                  <div className="grid sm:grid-cols-3 gap-4 mt-6">
                    {["Open to co-locate", "Open to shared workspace", "Open to temporary collaboration"].map((label) => (
                      <button key={label} className="liquid-glass rounded-2xl p-6 text-left hover:bg-white/[0.04] transition-colors">
                        <div className="font-heading text-2xl">{label}</div>
                        <div className="text-xs text-white/50 mt-2 uppercase tracking-[0.2em]">Toggle intent</div>
                      </button>
                    ))}
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Layer 4 — Side panel: nearby minds */}
          <AnimatePresence>
            {showPanel && (
              <motion.aside
                initial={{ x: 380, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 380, opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="fixed right-6 top-24 bottom-6 w-[320px] z-20 liquid-glass rounded-[1.5rem] p-5 overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Nearby minds</p>
                    <h3 className="font-heading text-2xl mt-1">In your window</h3>
                  </div>
                  <button onClick={() => setShowPanel(false)} className="text-white/40 hover:text-white text-xs">close</button>
                </div>
                <div className="mt-5 space-y-3">
                  {NODES.map((n) => (
                    <div key={n.id} className="rounded-xl border border-white/10 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-heading text-lg">{n.alias}</div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">{n.distance}</span>
                      </div>
                      <div className="text-xs text-white/50">{n.city} · overlap {n.stayDays}d</div>
                      <div className="mt-3 flex gap-2">
                        <button className="btn-pill btn-white sm">Connect</button>
                        <button className="btn-pill sm text-white/80 border border-white/15">Invite</button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Privacy — subtle corner */}
          <AnimatePresence>
            {showPrivacy && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed bottom-5 left-5 z-20"
              >
                <details className="liquid-glass rounded-full px-4 py-2 text-xs text-white/60 font-body">
                  <summary className="cursor-pointer list-none">Presence</summary>
                  <div className="mt-3 space-y-2 pb-2">
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Visible to tribe</label>
                    <label className="flex items-center gap-2"><input type="checkbox" /> Anonymous mode</label>
                    <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> City-level only</label>
                  </div>
                </details>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
