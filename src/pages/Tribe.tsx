import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import BlurText from "@/components/BlurText";
import atlas from "@/assets/cosmic-atlas.jpg";

// ── Data ─────────────────────────────────────────────────────────────────────
type Intention = "create" | "travel" | "work" | "rest" | "explore";

type Person = {
  id: string;
  alias: string;
  city: string;
  lat: number;
  lng: number;
  intention: Intention;
  tags: string[];
  stayDays: number;
  age: number;
  occupation: string;
  avatar: string;
  openToExchange: boolean;
};

const INTENTION_COLOR: Record<Intention, string> = {
  create: "#f4c25a",   // warm gold
  travel: "#7ee0c8",   // teal
  work:   "#a48bff",   // violet
  rest:   "#ffb6a3",   // peach
  explore:"#9cd4ff",   // sky
};

const RAW_PEOPLE: Omit<Person, "avatar" | "age" | "occupation" | "openToExchange">[] = [
  { id: "p1",  alias: "Kestrel", city: "Lisbon",        lat: 38.7,  lng: -9.1,  intention: "create",  tags: ["writing","ocean"],      stayDays: 28 },
  { id: "p2",  alias: "Aria",    city: "Tbilisi",       lat: 41.7,  lng: 44.8,  intention: "work",    tags: ["code","wine"],          stayDays: 21 },
  { id: "p3",  alias: "Mira",    city: "Chiang Mai",    lat: 18.8,  lng: 98.9,  intention: "create",  tags: ["film","monsoon"],       stayDays: 40 },
  { id: "p4",  alias: "Ilya",    city: "Mexico City",   lat: 19.4,  lng: -99.1, intention: "create",  tags: ["sound","design"],       stayDays: 18 },
  { id: "p5",  alias: "Noor",    city: "Marrakech",     lat: 31.6,  lng: -7.99, intention: "rest",    tags: ["weaving","tea"],        stayDays: 12 },
  { id: "p6",  alias: "Søren",   city: "Reykjavík",     lat: 64.1,  lng: -21.9, intention: "explore", tags: ["geology","ice"],        stayDays: 9  },
  { id: "p7",  alias: "Luma",    city: "Bali",          lat: -8.4,  lng: 115.2, intention: "rest",    tags: ["yoga","ocean"],         stayDays: 35 },
  { id: "p8",  alias: "Atlas",   city: "Cape Town",     lat: -33.9, lng: 18.4,  intention: "travel",  tags: ["mountain","wind"],      stayDays: 14 },
  { id: "p9",  alias: "Yara",    city: "Istanbul",      lat: 41.0,  lng: 28.9,  intention: "create",  tags: ["bazaar","writing"],     stayDays: 22 },
  { id: "p10", alias: "Theo",    city: "Tokyo",         lat: 35.6,  lng: 139.7, intention: "work",    tags: ["code","ramen"],         stayDays: 30 },
  { id: "p11", alias: "Iris",    city: "Buenos Aires",  lat: -34.6, lng: -58.4, intention: "create",  tags: ["tango","film"],         stayDays: 16 },
  { id: "p12", alias: "Bram",    city: "Berlin",        lat: 52.5,  lng: 13.4,  intention: "work",    tags: ["code","techno"],        stayDays: 45 },
  { id: "p13", alias: "Sana",    city: "Dakar",         lat: 14.7,  lng: -17.5, intention: "explore", tags: ["ocean","textile"],      stayDays: 11 },
  { id: "p14", alias: "Onyx",    city: "Medellín",      lat: 6.25,  lng: -75.6, intention: "travel",  tags: ["mountain","coffee"],    stayDays: 19 },
  { id: "p15", alias: "Kai",     city: "Honolulu",      lat: 21.3,  lng: -157.8,intention: "rest",    tags: ["surf","ocean"],         stayDays: 25 },
  { id: "p16", alias: "Vega",    city: "Stockholm",     lat: 59.3,  lng: 18.07, intention: "create",  tags: ["design","ice"],         stayDays: 17 },
  { id: "p17", alias: "Rhea",    city: "Athens",        lat: 37.98, lng: 23.7,  intention: "create",  tags: ["ruins","wine"],         stayDays: 23 },
  { id: "p18", alias: "Juno",    city: "Kyoto",         lat: 35.01, lng: 135.7, intention: "rest",    tags: ["tea","writing"],        stayDays: 31 },
  { id: "p19", alias: "Calla",   city: "Oaxaca",        lat: 17.06, lng: -96.7, intention: "create",  tags: ["weaving","sound"],      stayDays: 26 },
  { id: "p20", alias: "Echo",    city: "Tallinn",       lat: 59.43, lng: 24.75, intention: "work",    tags: ["code","forest"],        stayDays: 13 },
];

const OCCUPATIONS: Record<Intention, string[]> = {
  create:  ["Writer", "Filmmaker", "Sound Designer", "Ceramicist", "Illustrator", "Poet"],
  work:    ["Software Engineer", "Product Designer", "Researcher", "Architect"],
  travel:  ["Photographer", "Travel Journalist", "Mountain Guide"],
  rest:    ["Yoga Teacher", "Herbalist", "Tea Curator", "Translator"],
  explore: ["Geologist", "Marine Biologist", "Cartographer"],
};

const PEOPLE: Person[] = RAW_PEOPLE.map((p, i) => {
  const occs = OCCUPATIONS[p.intention];
  const seed = i + 11;
  return {
    ...p,
    age: 24 + ((i * 7) % 22),
    occupation: occs[i % occs.length],
    avatar: `https://i.pravatar.cc/200?img=${seed}`,
    openToExchange: i % 3 !== 0,
  };
});

// Equirectangular projection
const project = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng + 180) / 360) * w,
  y: ((90 - lat) / 180) * h,
});

const shareScore = (a: Person, b: Person) => {
  const shared = a.tags.filter((t) => b.tags.includes(t)).length;
  const intent = a.intention === b.intention ? 1 : 0;
  const overlap = Math.min(a.stayDays, b.stayDays) / Math.max(a.stayDays, b.stayDays);
  return shared * 0.4 + intent * 0.25 + overlap * 0.35;
};

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Tribe() {
  const [layer, setLayer] = useState(0);
  const [interactions, setInteractions] = useState(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<number | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const mouseRef = useRef({ x: 0, y: 0, has: false });
  const camRef = useRef({ x: 0, y: 0 }); // camera offset drift

  const bump = () => setInteractions((n) => n + 1);

  // Reveal sequence
  useEffect(() => {
    if (interactions >= 2) setLayer((l) => Math.max(l, 2)); // connections
    if (interactions >= 4) setLayer((l) => Math.max(l, 3)); // camps
    if (interactions >= 3) setShowPrivacy(true);
    if (interactions >= 6) setShowHint(true);
  }, [interactions]);

  // Auto reveal map shortly after entry click
  const enter = () => {
    setLayer(1);
    bump();
  };

  // Compute connections
  const connections = useMemo(() => {
    const out: { a: Person; b: Person; s: number }[] = [];
    for (let i = 0; i < PEOPLE.length; i++) {
      for (let j = i + 1; j < PEOPLE.length; j++) {
        const s = shareScore(PEOPLE[i], PEOPLE[j]);
        if (s > 0.45) out.push({ a: PEOPLE[i], b: PEOPLE[j], s });
      }
    }
    return out;
  }, []);

  // Compute camps: clusters of ≥3 people within proximity
  const camps = useMemo(() => {
    const visited = new Set<string>();
    const groups: Person[][] = [];
    const distDeg = 35; // rough angular proximity
    for (const p of PEOPLE) {
      if (visited.has(p.id)) continue;
      const g = [p];
      visited.add(p.id);
      for (const q of PEOPLE) {
        if (visited.has(q.id)) continue;
        const d = Math.hypot(p.lat - q.lat, p.lng - q.lng);
        if (d < distDeg) {
          g.push(q);
          visited.add(q.id);
        }
      }
      if (g.length >= 3) groups.push(g);
    }
    const themes = [
      { name: "Salt & Page",    theme: "Atlantic writers" },
      { name: "Quiet Signal",   theme: "Caucasus builders" },
      { name: "Monsoon Studio", theme: "Southeast filmmakers" },
      { name: "Pacific Drift",  theme: "Island restorers" },
      { name: "Northern Glow",  theme: "Arctic explorers" },
    ];
    return groups.map((members, i) => {
      const cx = members.reduce((s, m) => s + m.lng, 0) / members.length;
      const cy = members.reduce((s, m) => s + m.lat, 0) / members.length;
      return { ...themes[i % themes.length], members, lat: cy, lng: cx, id: i };
    });
  }, []);

  // ── Canvas render loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (layer < 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t0 = performance.now();

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top, has: true };
    };
    const onLeave = () => (mouseRef.current.has = false);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    // Pre-seed particle drift positions per node
    const drift = PEOPLE.map(() => ({
      ax: Math.random() * Math.PI * 2,
      ay: Math.random() * Math.PI * 2,
      sp: 0.0004 + Math.random() * 0.0008,
    }));
    // Dust particles
    const dust = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00005,
      vy: (Math.random() - 0.5) * 0.00003,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.4 + 0.1,
    }));

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Camera drift toward cursor
      if (mouseRef.current.has) {
        const tx = (mouseRef.current.x - w / 2) * 0.02;
        const ty = (mouseRef.current.y - h / 2) * 0.02;
        camRef.current.x += (tx - camRef.current.x) * 0.04;
        camRef.current.y += (ty - camRef.current.y) * 0.04;
      } else {
        camRef.current.x *= 0.98;
        camRef.current.y *= 0.98;
      }
      const camX = camRef.current.x, camY = camRef.current.y;

      // Dust drift
      ctx.globalCompositeOperation = "lighter";
      for (const d of dust) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0) d.x += 1; if (d.x > 1) d.x -= 1;
        if (d.y < 0) d.y += 1; if (d.y > 1) d.y -= 1;
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,200,255,${d.a * 0.25})`;
        ctx.arc(d.x * w - camX, d.y * h - camY, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Global pulse wave every ~12s
      const pulseT = (t % 12) / 12;
      if (pulseT < 0.6) {
        const pr = pulseT * Math.max(w, h) * 1.4;
        const alpha = (1 - pulseT / 0.6) * 0.06;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(160,200,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.arc(w / 2 - camX, h / 2 - camY, pr, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Compute node positions (with micro-orbital motion)
      const pos = PEOPLE.map((p, i) => {
        const base = project(p.lat, p.lng, w, h);
        const d = drift[i];
        const ox = Math.cos(d.ax + t * d.sp * 60) * 6;
        const oy = Math.sin(d.ay + t * d.sp * 50) * 4;
        return { x: base.x + ox - camX, y: base.y + oy - camY, p };
      });

      // Connections (layer 2+)
      if (layer >= 2) {
        ctx.globalCompositeOperation = "lighter";
        for (const c of connections) {
          const a = pos.find((n) => n.p.id === c.a.id)!;
          const b = pos.find((n) => n.p.id === c.b.id)!;
          const isHi =
            hovered === c.a.id || hovered === c.b.id ||
            selected === c.a.id || selected === c.b.id;
          const baseA = 0.06 + c.s * 0.10;
          const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + (a.x + b.y) * 0.005);
          const alpha = isHi ? Math.min(0.9, baseA + 0.3 + pulse * 0.15) : baseA + pulse * 0.04;

          // Curved bezier with slight underwater wobble
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const nx = -(b.y - a.y);
          const ny = (b.x - a.x);
          const nl = Math.hypot(nx, ny) || 1;
          const curve = 40 + 30 * Math.sin(t * 0.6 + c.s * 5);
          const cx = mx + (nx / nl) * curve;
          const cy = my + (ny / nl) * curve;

          ctx.beginPath();
          const g = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
          g.addColorStop(0, `rgba(125,200,255,${alpha})`);
          g.addColorStop(1, `rgba(180,140,255,${alpha})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = isHi ? 1.2 : 0.6;
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(cx, cy, b.x, b.y);
          ctx.stroke();
        }
      }

      // Camps (layer 3+)
      if (layer >= 3) {
        ctx.globalCompositeOperation = "lighter";
        for (const camp of camps) {
          const c = project(camp.lat, camp.lng, w, h);
          const cx = c.x - camX, cy = c.y - camY;
          const breathe = 1 + 0.08 * Math.sin(t * 0.7 + camp.id);
          const R = (60 + camp.members.length * 14) * breathe;
          const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
          grd.addColorStop(0, "rgba(140,230,180,0.22)");
          grd.addColorStop(0.5, "rgba(140,230,180,0.07)");
          grd.addColorStop(1, "rgba(140,230,180,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Nodes
      for (const n of pos) {
        const color = INTENTION_COLOR[n.p.intention];
        const breathe = 0.85 + 0.15 * Math.sin(t * 1.2 + n.x * 0.01);
        const isHi = hovered === n.p.id || selected === n.p.id;
        const auraR = (isHi ? 38 : 24) * breathe;

        // aura
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, auraR);
        grd.addColorStop(0, hexA(color, 0.55));
        grd.addColorStop(0.4, hexA(color, 0.18));
        grd.addColorStop(1, hexA(color, 0));
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, auraR, 0, Math.PI * 2);
        ctx.fill();

        // core
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(n.x, n.y, isHi ? 3 : 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [layer, connections, camps, hovered, selected]);

  // Hover/click hit testing via DOM overlay (positioned absolutely)
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    if (layer < 1) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    r();
    const ro = new ResizeObserver(r);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layer]);

  const selectedPerson = PEOPLE.find((p) => p.id === selected) || null;
  const hoveredPerson = PEOPLE.find((p) => p.id === hovered) || null;
  const activeCamp = selectedCamp != null ? camps[selectedCamp] : null;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-white">
      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0">
        <img
          src={atlas}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-[0.55]"
          style={{ filter: "blur(0.5px) saturate(0.85)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02030a]/40 via-[#02030a]/55 to-[#02030a]/80" />
        {/* subtle noise */}
        <div
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />
      </div>

      {/* ── Layer 0: minimal entry ───────────────────────────────────────── */}
      <AnimatePresence>
        {layer === 0 && (
          <motion.button
            key="entry"
            type="button"
            onClick={enter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.4 }}
            className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center gap-10 cursor-pointer"
          >
            <motion.span
              className="block h-28 w-28 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,230,180,0.9) 0%, rgba(255,200,140,0.2) 38%, rgba(255,255,255,0) 72%)",
                filter: "blur(0.4px)",
              }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <BlurText
              text="You are not alone in motion."
              className="font-heading text-4xl md:text-5xl text-white/90 text-center"
            />
            <p className="text-[11px] uppercase tracking-[0.35em] text-white/40 font-body">
              Move or click to explore the tribe
            </p>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Layer 1+: Living world ───────────────────────────────────────── */}
      {layer >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
          className="relative z-10 min-h-screen w-full"
        >
          {/* World container — fullscreen, scroll deepens layers */}
          <div
            ref={wrapRef}
            className="relative h-screen w-full"
            onWheel={(e) => { if (e.deltaY > 0) bump(); }}
            onClick={() => { bump(); setSelected(null); setSelectedCamp(null); }}
          >
            <canvas ref={canvasRef} className="absolute inset-0" />

            {/* DOM overlay: invisible hit zones for nodes & camps */}
            <div className="absolute inset-0">
              {/* Camp hit zones */}
              {layer >= 3 && camps.map((camp, i) => {
                const c = project(camp.lat, camp.lng, size.w, size.h);
                const r = 60 + camp.members.length * 14;
                return (
                  <button
                    key={`camp-${i}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedCamp(i); setSelected(null); bump(); }}
                    className="absolute rounded-full"
                    style={{
                      left: c.x - r, top: c.y - r,
                      width: r * 2, height: r * 2,
                    }}
                    aria-label={camp.name}
                  />
                );
              })}
              {/* Person hit zones */}
              {PEOPLE.map((p) => {
                const c = project(p.lat, p.lng, size.w, size.h);
                const r = 22;
                return (
                  <button
                    key={p.id}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered((h) => (h === p.id ? null : h))}
                    onClick={(e) => { e.stopPropagation(); setSelected(p.id); setSelectedCamp(null); bump(); }}
                    className="absolute rounded-full"
                    style={{ left: c.x - r, top: c.y - r, width: r * 2, height: r * 2 }}
                    aria-label={p.alias}
                  />
                );
              })}
            </div>

            {/* Header overlay */}
            <div className="absolute top-24 left-0 right-0 px-8 lg:px-16 pointer-events-none">
              <div className="max-w-[1400px] mx-auto">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-body">
                  The Tribe · 20 lives in orbit
                </p>
                <h1 className="font-heading text-3xl md:text-4xl mt-2 text-white/90">
                  A small world, breathing.
                </h1>
              </div>
            </div>

            {/* Hover thought-bubble */}
            <AnimatePresence>
              {hoveredPerson && !selectedPerson && (
                <motion.div
                  key={`hover-${hoveredPerson.id}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: project(hoveredPerson.lat, hoveredPerson.lng, size.w, size.h).x + 18,
                    top:  project(hoveredPerson.lat, hoveredPerson.lng, size.w, size.h).y - 14,
                  }}
                >
                  <div className="liquid-glass rounded-2xl px-3 py-2 text-xs">
                    <span className="font-heading text-sm text-white/90">{hoveredPerson.alias}</span>
                    <span className="text-white/40 ml-2">{hoveredPerson.city}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected person card */}
            <AnimatePresence>
              {selectedPerson && (
                <motion.div
                  key={`sel-${selectedPerson.id}`}
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute z-20"
                  style={{
                    left: Math.min(size.w - 260, project(selectedPerson.lat, selectedPerson.lng, size.w, size.h).x + 24),
                    top:  Math.min(size.h - 200, project(selectedPerson.lat, selectedPerson.lng, size.w, size.h).y - 10),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="liquid-glass rounded-2xl p-4 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: INTENTION_COLOR[selectedPerson.intention], boxShadow: `0 0 10px ${INTENTION_COLOR[selectedPerson.intention]}` }}
                      />
                      <span className="font-heading text-xl text-white/95">{selectedPerson.alias}</span>
                    </div>
                    <div className="text-xs text-white/50 mt-1">{selectedPerson.city}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-3">
                      {selectedPerson.intention} · {selectedPerson.stayDays}d window
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {selectedPerson.tags.map((t) => (
                        <span key={t} className="tag-glass border border-white/10 text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Selected camp card */}
            <AnimatePresence>
              {activeCamp && (
                <motion.div
                  key={`camp-${activeCamp.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute z-20"
                  style={{
                    left: Math.min(size.w - 280, project(activeCamp.lat, activeCamp.lng, size.w, size.h).x + 30),
                    top:  Math.min(size.h - 220, project(activeCamp.lat, activeCamp.lng, size.w, size.h).y + 10),
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="liquid-glass rounded-2xl p-4 min-w-[240px]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Emergent camp</p>
                    <div className="font-heading text-2xl mt-1">{activeCamp.name}</div>
                    <div className="text-xs text-white/55 mt-1">{activeCamp.theme}</div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-3">
                      {activeCamp.members.length} aligned
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {activeCamp.members.map((m) => (
                        <span key={m.id} className="tag-glass border border-white/10 text-[10px]">{m.alias}</span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Exploration hint */}
            <AnimatePresence>
              {layer < 3 && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/35 pointer-events-none"
                >
                  {layer < 2 ? "hover · click · scroll to reveal" : "keep exploring — camps emerge"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Side hint panel after depth */}
            <AnimatePresence>
              {showHint && (
                <motion.aside
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-[220px] liquid-glass rounded-2xl p-4 text-xs text-white/65"
                >
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">Legend</p>
                  <div className="mt-3 space-y-2">
                    {(Object.keys(INTENTION_COLOR) as Intention[]).map((k) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full"
                          style={{ background: INTENTION_COLOR[k], boxShadow: `0 0 8px ${INTENTION_COLOR[k]}` }} />
                        <span className="capitalize">{k}</span>
                      </div>
                    ))}
                    <div className="pt-3 mt-3 border-t border-white/10 text-white/45">
                      Lines: shared intention · Clouds: emergent camps
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>

            {/* Privacy control */}
            <AnimatePresence>
              {showPrivacy && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-5 left-5 z-30"
                >
                  <details className="liquid-glass rounded-full px-4 py-2 text-xs text-white/60 font-body">
                    <summary className="cursor-pointer list-none tracking-[0.2em] uppercase text-[10px]">Presence</summary>
                    <div className="mt-3 space-y-2 pb-2">
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Visible to tribe</label>
                      <label className="flex items-center gap-2"><input type="checkbox" /> Anonymous mode</label>
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> City-level only</label>
                      <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Show connections</label>
                    </div>
                  </details>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ── helpers ──
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
