import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, RefreshCw } from "lucide-react";
import BlurText from "@/components/BlurText";
import atlas from "@/assets/cosmic-atlas.jpg";
import { useMockAuth } from "@/context/MockAuth";
import type { RegionId } from "@/data/regions";
import { REGIONS, REGION_LABEL } from "@/data/regions";

// ── Data ─────────────────────────────────────────────────────────────────────
type Person = {
  id: string;
  name: string;
  city: string;
  country: string;
  age: number;
  occupation: string;
  lat: number;
  lng: number;
  regionId: RegionId;
  avatar: string;
  exchangeOpen: boolean;
};

const av = (seed: string) =>
  `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;

const PEOPLE: Person[] = [
  // Europe
  { id: "p1",  name: "Kestrel Vale",   city: "Lisbon",      country: "Portugal", age: 32, occupation: "Writer",        lat: 38.7,  lng: -9.1,   regionId: "europe", avatar: av("kestrel"), exchangeOpen: true },
  { id: "p2",  name: "Aria Mzia",      city: "Tbilisi",     country: "Georgia",  age: 29, occupation: "Software engineer", lat: 41.7, lng: 44.8, regionId: "europe", avatar: av("aria"),    exchangeOpen: false },
  { id: "p3",  name: "Bram de Witt",   city: "Berlin",      country: "Germany",  age: 35, occupation: "Sound designer", lat: 52.5,  lng: 13.4,   regionId: "europe", avatar: av("bram"),    exchangeOpen: true },
  { id: "p4",  name: "Vega Lindqvist", city: "Stockholm",   country: "Sweden",   age: 27, occupation: "Industrial designer", lat: 59.3, lng: 18.07, regionId: "europe", avatar: av("vega"), exchangeOpen: true },
  { id: "p5",  name: "Echo Mägi",      city: "Tallinn",     country: "Estonia",  age: 30, occupation: "Backend dev",   lat: 59.43, lng: 24.75,  regionId: "europe", avatar: av("echo"),    exchangeOpen: false },
  { id: "p6",  name: "Rhea Konstas",   city: "Athens",      country: "Greece",   age: 34, occupation: "Archaeologist", lat: 37.98, lng: 23.7,   regionId: "europe", avatar: av("rhea"),    exchangeOpen: true },
  { id: "p7",  name: "Søren Holm",     city: "Reykjavík",   country: "Iceland",  age: 41, occupation: "Geologist",     lat: 64.1,  lng: -21.9,  regionId: "europe", avatar: av("soren"),   exchangeOpen: true },
  { id: "p8",  name: "Yara Demir",     city: "Istanbul",    country: "Türkiye",  age: 28, occupation: "Poet",          lat: 41.0,  lng: 28.9,   regionId: "europe", avatar: av("yara"),    exchangeOpen: false },

  // North America
  { id: "p9",  name: "Ilya Cruz",      city: "Mexico City", country: "Mexico",   age: 31, occupation: "Composer",      lat: 19.4,  lng: -99.1,  regionId: "north-america", avatar: av("ilya"),  exchangeOpen: true },
  { id: "p10", name: "Calla Mendez",   city: "Oaxaca",      country: "Mexico",   age: 26, occupation: "Textile artist", lat: 17.06, lng: -96.7, regionId: "north-america", avatar: av("calla"), exchangeOpen: true },
  { id: "p11", name: "Kai Mahelona",   city: "Honolulu",    country: "USA",      age: 33, occupation: "Surf instructor", lat: 21.3, lng: -157.8, regionId: "north-america", avatar: av("kai"), exchangeOpen: false },
  { id: "p12", name: "Juno Park",      city: "Portland",    country: "USA",      age: 29, occupation: "UX researcher", lat: 45.5,  lng: -122.6, regionId: "north-america", avatar: av("juno"),  exchangeOpen: true },
  { id: "p13", name: "Mara Belisle",   city: "Montréal",    country: "Canada",   age: 37, occupation: "Architect",     lat: 45.5,  lng: -73.56, regionId: "north-america", avatar: av("mara"),  exchangeOpen: true },

  // South America
  { id: "p14", name: "Iris Vidal",     city: "Buenos Aires", country: "Argentina", age: 30, occupation: "Filmmaker",   lat: -34.6, lng: -58.4,  regionId: "south-america", avatar: av("iris"),  exchangeOpen: true },
  { id: "p15", name: "Onyx Restrepo",  city: "Medellín",    country: "Colombia", age: 28, occupation: "Coffee roaster", lat: 6.25, lng: -75.6, regionId: "south-america", avatar: av("onyx"), exchangeOpen: true },
  { id: "p16", name: "Tova Lima",      city: "Florianópolis", country: "Brazil", age: 25, occupation: "Marine biologist", lat: -27.6, lng: -48.5, regionId: "south-america", avatar: av("tova"), exchangeOpen: false },
  { id: "p17", name: "Reno Castillo",  city: "Cusco",       country: "Peru",     age: 36, occupation: "Mountain guide", lat: -13.5, lng: -71.97, regionId: "south-america", avatar: av("reno"), exchangeOpen: true },

  // Africa
  { id: "p18", name: "Noor Bensaid",   city: "Marrakech",   country: "Morocco",  age: 32, occupation: "Ceramicist",    lat: 31.6,  lng: -7.99,  regionId: "africa", avatar: av("noor"),    exchangeOpen: true },
  { id: "p19", name: "Sana Diop",      city: "Dakar",       country: "Senegal",  age: 29, occupation: "Photographer",  lat: 14.7,  lng: -17.5,  regionId: "africa", avatar: av("sana"),    exchangeOpen: false },
  { id: "p20", name: "Atlas Nkosi",    city: "Cape Town",   country: "South Africa", age: 34, occupation: "Climber",   lat: -33.9, lng: 18.4,   regionId: "africa", avatar: av("atlas"),   exchangeOpen: true },
  { id: "p21", name: "Halima Said",    city: "Zanzibar",    country: "Tanzania", age: 27, occupation: "Chef",          lat: -6.16, lng: 39.2,   regionId: "africa", avatar: av("halima"),  exchangeOpen: true },
  { id: "p22", name: "Tarek Awad",     city: "Cairo",       country: "Egypt",    age: 38, occupation: "Documentarian", lat: 30.04, lng: 31.23,  regionId: "africa", avatar: av("tarek"),   exchangeOpen: false },

  // Asia
  { id: "p23", name: "Mira Suwan",     city: "Chiang Mai",  country: "Thailand", age: 31, occupation: "Filmmaker",     lat: 18.8,  lng: 98.9,   regionId: "asia", avatar: av("mira"),      exchangeOpen: true },
  { id: "p24", name: "Theo Nakamura",  city: "Tokyo",       country: "Japan",    age: 33, occupation: "Frontend dev",  lat: 35.6,  lng: 139.7,  regionId: "asia", avatar: av("theo"),      exchangeOpen: false },
  { id: "p25", name: "Hiro Tanizaki",  city: "Kyoto",       country: "Japan",    age: 40, occupation: "Tea master",    lat: 35.01, lng: 135.7,  regionId: "asia", avatar: av("hiro"),      exchangeOpen: true },
  { id: "p26", name: "Anya Sharma",    city: "Goa",         country: "India",    age: 28, occupation: "Yoga teacher",  lat: 15.3,  lng: 74.1,   regionId: "asia", avatar: av("anya"),      exchangeOpen: true },
  { id: "p27", name: "Park Min-jun",   city: "Seoul",       country: "South Korea", age: 30, occupation: "Game designer", lat: 37.56, lng: 126.97, regionId: "asia", avatar: av("minjun"), exchangeOpen: false },

  // Oceania
  { id: "p28", name: "Luma Pratama",   city: "Bali",        country: "Indonesia", age: 26, occupation: "Permaculturist", lat: -8.4, lng: 115.2, regionId: "oceania", avatar: av("luma"),   exchangeOpen: true },
  { id: "p29", name: "Wren Carter",    city: "Byron Bay",   country: "Australia", age: 31, occupation: "Illustrator",   lat: -28.6, lng: 153.6, regionId: "oceania", avatar: av("wren"),    exchangeOpen: true },
  { id: "p30", name: "Tane Wiremu",    city: "Wellington",  country: "New Zealand", age: 35, occupation: "Boat builder", lat: -41.3, lng: 174.78, regionId: "oceania", avatar: av("tane"), exchangeOpen: false },
];

// Equirectangular projection (whole world)
const project = (lat: number, lng: number, w: number, h: number) => ({
  x: ((lng + 180) / 360) * w,
  y: ((90 - lat) / 180) * h,
});

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Tribe() {
  const navigate = useNavigate();
  const { user, openLogin } = useMockAuth();

  // Auth gate
  useEffect(() => {
    if (!user) {
      openLogin(() => {
        // user came back via login; stay here
      });
    }
  }, [user, openLogin]);

  const [layer, setLayer] = useState(0); // 0 = entry, 1 = world, 2 = continent focus
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [focusRegion, setFocusRegion] = useState<RegionId | null>(null);

  // Read continent from Voyages page
  useEffect(() => {
    if (layer < 2) return;
    if (focusRegion) return;
    try {
      const stored = localStorage.getItem("voyages.selectedRegion");
      if (stored && stored !== "all") setFocusRegion(stored as RegionId);
      else setFocusRegion("europe"); // default focal continent
    } catch {
      setFocusRegion("europe");
    }
  }, [layer, focusRegion]);

  // Gradual reveal of 30 lights once map is shown
  useEffect(() => {
    if (layer < 1) return;
    setRevealedCount(0);
    let i = 0;
    const total = PEOPLE.length;
    const timer = window.setInterval(() => {
      i += 1;
      setRevealedCount(i);
      if (i >= total) window.clearInterval(timer);
    }, 110);
    return () => window.clearInterval(timer);
  }, [layer]);

  // Layout
  const wrapRef = useRef<HTMLDivElement>(null);
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

  const enterWorld = () => setLayer(1);
  const focusContinent = () => {
    if (layer >= 1 && layer < 2) setLayer(2);
  };

  // Camera transform for continent focus
  const camera = useMemo(() => {
    if (layer < 2 || !focusRegion || size.w === 0) {
      return { scale: 1, tx: 0, ty: 0 };
    }
    const region = REGIONS.find((r) => r.id === focusRegion);
    if (!region) return { scale: 1, tx: 0, ty: 0 };
    const [lng, lat] = region.center;
    const p = project(lat, lng, size.w, size.h);
    const scale = 1.9;
    const tx = size.w / 2 - p.x * scale;
    const ty = size.h / 2 - p.y * scale;
    return { scale, tx, ty };
  }, [layer, focusRegion, size]);

  // Decorative extra lights across the focused continent
  const continentSparkles = useMemo(() => {
    if (!focusRegion) return [] as { lat: number; lng: number; d: number }[];
    const inRegion = PEOPLE.filter((p) => p.regionId === focusRegion);
    if (inRegion.length === 0) return [];
    const out: { lat: number; lng: number; d: number }[] = [];
    for (let i = 0; i < 24; i++) {
      const seed = inRegion[i % inRegion.length];
      const jitterLat = (Math.sin(i * 13.37) * 6);
      const jitterLng = (Math.cos(i * 7.11) * 8);
      out.push({ lat: seed.lat + jitterLat, lng: seed.lng + jitterLng, d: i * 0.05 });
    }
    return out;
  }, [focusRegion]);

  const selectedPerson = PEOPLE.find((p) => p.id === selected) || null;

  // If not signed in, render a soft gate
  if (!user) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-white flex items-center justify-center">
        <div className="fixed inset-0 z-0">
          <img src={atlas} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-[#02030a]/80" />
        </div>
        <div className="relative z-10 text-center px-8 max-w-md">
          <BlurText
            text="Sign in to enter the tribe."
            className="font-heading text-3xl md:text-4xl text-white/90"
          />
          <p className="mt-6 text-sm text-white/55 font-body">
            The world only opens for those in motion.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <button
              onClick={() => openLogin()}
              className="rounded-full bg-white text-black px-5 py-2 text-sm font-body font-medium"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate("/")}
              className="liquid-glass rounded-full px-5 py-2 text-sm font-body text-white/80"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#02030a] text-white">
      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0">
        <motion.img
          src={atlas}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ opacity: layer === 0 ? 0.04 : layer === 1 ? 0.45 : 0.25 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
          style={{ filter: "saturate(0.85)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02030a]/40 via-[#02030a]/55 to-[#02030a]/85" />
      </div>

      {/* ── Layer 0: minimal entry ───────────────────────────────────────── */}
      <AnimatePresence>
        {layer === 0 && (
          <motion.button
            key="entry"
            type="button"
            onClick={enterWorld}
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
                  "radial-gradient(circle, rgba(255,230,180,0.95) 0%, rgba(255,200,140,0.25) 38%, rgba(255,255,255,0) 72%)",
              }}
              animate={{ scale: [1, 1.22, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <div className="flex flex-col items-center gap-3">
              <BlurText
                text="You are not alone in motion."
                className="font-heading text-3xl md:text-5xl text-white/90 text-center"
              />
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/45 font-body">
                Move or click to explore the tribe
              </p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Layer 1+: World ──────────────────────────────────────────────── */}
      {layer >= 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.6 }}
          className="relative z-10 min-h-screen w-full"
        >
          <div
            ref={wrapRef}
            className="relative h-screen w-full"
            onClick={() => { setSelected(null); focusContinent(); }}
          >
            {/* Continent fade veil */}
            <AnimatePresence>
              {layer >= 2 && (
                <motion.div
                  key="veil"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2 }}
                  className="absolute inset-0 pointer-events-none z-[1]"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(2,3,10,0) 28%, rgba(2,3,10,0.55) 60%, rgba(2,3,10,0.85) 100%)",
                  }}
                />
              )}
            </AnimatePresence>

            {/* Zoomable world plane */}
            <motion.div
              className="absolute inset-0 origin-top-left"
              animate={{ x: camera.tx, y: camera.ty, scale: camera.scale }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Continent sparkles (extra lights) */}
              {layer >= 2 && continentSparkles.map((s, i) => {
                const c = project(s.lat, s.lng, size.w, size.h);
                return (
                  <motion.span
                    key={`spark-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: c.x - 4,
                      top: c.y - 4,
                      width: 8,
                      height: 8,
                      background:
                        "radial-gradient(circle, rgba(255,240,200,0.9) 0%, rgba(255,200,140,0) 70%)",
                    }}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: [0.2, 0.9, 0.4], scale: [0.6, 1.1, 0.8] }}
                    transition={{
                      duration: 3.5 + (i % 5) * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: s.d,
                    }}
                  />
                );
              })}

              {/* Person lights */}
              {PEOPLE.slice(0, revealedCount).map((p) => {
                const c = project(p.lat, p.lng, size.w, size.h);
                const focused = !focusRegion || p.regionId === focusRegion;
                const r = 14;
                return (
                  <motion.button
                    key={p.id}
                    onMouseEnter={() => setHovered(p.id)}
                    onMouseLeave={() => setHovered((h) => (h === p.id ? null : h))}
                    onClick={(e) => { e.stopPropagation(); setSelected(p.id); }}
                    className="absolute rounded-full flex items-center justify-center group"
                    style={{
                      left: c.x - r,
                      top: c.y - r,
                      width: r * 2,
                      height: r * 2,
                      opacity: focused ? 1 : 0.35,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: focused ? 1 : 0.35 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                    aria-label={p.name}
                  >
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(255,235,190,0.55) 0%, rgba(255,200,140,0.15) 45%, rgba(255,255,255,0) 75%)",
                      }}
                    />
                    <motion.span
                      className="relative block rounded-full"
                      style={{
                        width: 5,
                        height: 5,
                        background: "rgba(255,250,235,1)",
                        boxShadow: "0 0 12px rgba(255,225,180,0.9)",
                      }}
                      animate={{ opacity: [0.7, 1, 0.7], scale: [0.9, 1.15, 0.9] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Hover label */}
            <AnimatePresence>
              {hovered && !selectedPerson && (() => {
                const p = PEOPLE.find((x) => x.id === hovered)!;
                const c = project(p.lat, p.lng, size.w, size.h);
                const x = c.x * camera.scale + camera.tx;
                const y = c.y * camera.scale + camera.ty;
                return (
                  <motion.div
                    key={`hov-${p.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute pointer-events-none z-10"
                    style={{ left: x + 16, top: y - 14 }}
                  >
                    <div className="liquid-glass rounded-2xl px-3 py-1.5 text-xs whitespace-nowrap">
                      <span className="font-heading text-sm text-white/95">{p.name}</span>
                      <span className="text-white/45 ml-2">{p.city}</span>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* Header */}
            <div className="absolute top-24 left-0 right-0 px-8 lg:px-16 pointer-events-none z-10">
              <div className="max-w-[1400px] mx-auto">
                <p className="text-[10px] uppercase tracking-[0.4em] text-white/45 font-body">
                  The Tribe · {PEOPLE.length} lives in motion
                </p>
                <h1 className="font-heading text-3xl md:text-4xl mt-2 text-white/90">
                  {layer < 2
                    ? "A small world, breathing."
                    : `Focused on ${REGION_LABEL[focusRegion as RegionId] ?? "your continent"}.`}
                </h1>
              </div>
            </div>

            {/* Hint */}
            <AnimatePresence>
              {layer === 1 && revealedCount >= PEOPLE.length && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-[0.4em] text-white/40 pointer-events-none"
                >
                  Click anywhere to focus your continent
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset focus */}
            {layer >= 2 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLayer(1); setSelected(null); }}
                className="absolute top-24 right-8 lg:right-16 z-20 liquid-glass rounded-full px-4 py-2 text-xs font-body text-white/80 inline-flex items-center gap-2"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Whole world
              </button>
            )}

            {/* Profile panel */}
            <AnimatePresence>
              {selectedPerson && (
                <motion.aside
                  key={`profile-${selectedPerson.id}`}
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-[320px] liquid-glass rounded-2xl p-5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 text-white/60 hover:text-white"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedPerson.avatar}
                      alt={selectedPerson.name}
                      className="h-16 w-16 rounded-full bg-white/10 border border-white/15"
                    />
                    <div>
                      <div className="font-heading text-2xl text-white/95 leading-tight">
                        {selectedPerson.name}
                      </div>
                      <div className="text-xs text-white/55 mt-1">
                        {selectedPerson.city}, {selectedPerson.country}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-body">
                    <div className="liquid-glass rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">Age</p>
                      <p className="mt-1 text-white/90 text-base font-heading">{selectedPerson.age}</p>
                    </div>
                    <div className="liquid-glass rounded-xl p-3">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-white/40">Occupation</p>
                      <p className="mt-1 text-white/90 text-sm">{selectedPerson.occupation}</p>
                    </div>
                  </div>
                  <div
                    className="mt-3 rounded-xl p-3 border"
                    style={{
                      borderColor: selectedPerson.exchangeOpen ? "rgba(126,224,200,0.35)" : "rgba(255,255,255,0.08)",
                      background: selectedPerson.exchangeOpen ? "rgba(126,224,200,0.08)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    <p className="text-[9px] uppercase tracking-[0.25em] text-white/50">Dwelling exchange</p>
                    <p className="mt-1 text-sm text-white/85">
                      {selectedPerson.exchangeOpen
                        ? "Open to exchanging their dwelling with yours."
                        : "Not currently open to exchange."}
                    </p>
                  </div>
                  <button
                    disabled={!selectedPerson.exchangeOpen}
                    className="mt-4 w-full h-10 rounded-full bg-white text-black text-sm font-body font-medium disabled:bg-white/15 disabled:text-white/40 transition-colors"
                  >
                    {selectedPerson.exchangeOpen ? "Propose an exchange" : "Send a quiet hello"}
                  </button>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
