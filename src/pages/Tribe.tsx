import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import BlurText from "@/components/BlurText";

// ── Types & Data ─────────────────────────────────────────────────────────────
type Intention = "Create" | "Travel" | "Work" | "Rest" | "Explore";

const INTENTION_COLOR: Record<Intention, string> = {
  Create:  "#e8a020",
  Travel:  "#0fb880",
  Work:    "#7c4fd0",
  Rest:    "#e06060",
  Explore: "#4090e0",
};

type Person = {
  id: string;
  name: string;
  city: string;
  continent: string;
  lat: number;
  lon: number;
  age: number;
  occupation: string;
  intention: Intention;
  tags: [string, string];
  openExchange: boolean;
};

const RAW: Omit<Person, "id">[] = [
  // North America (6)
  { name: "Ilya Vance",  city: "Mexico City",   continent: "North America", lat: 19.4,  lon: -99.1,  age: 31, occupation: "Sound Designer", intention: "Create",  tags: ["sound","design"],     openExchange: true  },
  { name: "Calla Reyes", city: "Oaxaca",        continent: "North America", lat: 17.06, lon: -96.7,  age: 28, occupation: "Ceramicist",     intention: "Create",  tags: ["weaving","clay"],     openExchange: false },
  { name: "Kai Holm",    city: "Honolulu",      continent: "North America", lat: 21.3,  lon: -157.8, age: 34, occupation: "Surf Instructor",intention: "Rest",    tags: ["surf","ocean"],       openExchange: true  },
  { name: "Mara Quinn",  city: "Portland",      continent: "North America", lat: 45.5,  lon: -122.6, age: 29, occupation: "Software Eng.",  intention: "Work",    tags: ["code","coffee"],      openExchange: false },
  { name: "Theo Park",   city: "Montréal",      continent: "North America", lat: 45.5,  lon: -73.6,  age: 33, occupation: "Researcher",     intention: "Work",    tags: ["AI","jazz"],          openExchange: true  },
  { name: "Wren Beck",   city: "Asheville",     continent: "North America", lat: 35.6,  lon: -82.6,  age: 26, occupation: "Cartographer",   intention: "Explore", tags: ["maps","forest"],      openExchange: false },
  // South America (6)
  { name: "Iris Romano", city: "Buenos Aires",  continent: "South America", lat: -34.6, lon: -58.4,  age: 30, occupation: "Filmmaker",      intention: "Create",  tags: ["tango","film"],       openExchange: true  },
  { name: "Onyx Vela",   city: "Medellín",      continent: "South America", lat: 6.25,  lon: -75.6,  age: 27, occupation: "Photographer",   intention: "Travel",  tags: ["mountain","coffee"],  openExchange: false },
  { name: "Lía Andrade", city: "Cusco",         continent: "South America", lat: -13.5, lon: -71.97, age: 35, occupation: "Mountain Guide", intention: "Travel",  tags: ["andes","quechua"],    openExchange: true  },
  { name: "Tomé Silva",  city: "Florianópolis", continent: "South America", lat: -27.6, lon: -48.5,  age: 24, occupation: "Marine Biolog.", intention: "Explore", tags: ["coral","surf"],       openExchange: false },
  { name: "Sol Vargas",  city: "Bogotá",        continent: "South America", lat: 4.7,   lon: -74.07, age: 32, occupation: "Product Designer",intention: "Work",   tags: ["UX","arepa"],         openExchange: true  },
  { name: "Inti Cruz",   city: "La Paz",        continent: "South America", lat: -16.5, lon: -68.15, age: 38, occupation: "Herbalist",      intention: "Rest",    tags: ["coca","altitude"],    openExchange: false },
  // Europe (6)
  { name: "Kestrel Vey", city: "Lisbon",        continent: "Europe",        lat: 38.7,  lon: -9.1,   age: 29, occupation: "Writer",         intention: "Create",  tags: ["writing","ocean"],    openExchange: true  },
  { name: "Bram Hugo",   city: "Berlin",        continent: "Europe",        lat: 52.5,  lon: 13.4,   age: 33, occupation: "Software Eng.",  intention: "Work",    tags: ["code","techno"],      openExchange: false },
  { name: "Rhea Solon",  city: "Athens",        continent: "Europe",        lat: 37.98, lon: 23.7,   age: 31, occupation: "Architect",      intention: "Create",  tags: ["ruins","wine"],       openExchange: true  },
  { name: "Vega Lind",   city: "Stockholm",     continent: "Europe",        lat: 59.3,  lon: 18.07,  age: 26, occupation: "Illustrator",    intention: "Create",  tags: ["design","ice"],       openExchange: false },
  { name: "Echo Tamm",   city: "Tallinn",       continent: "Europe",        lat: 59.43, lon: 24.75,  age: 28, occupation: "Researcher",     intention: "Work",    tags: ["forest","code"],      openExchange: true  },
  { name: "Søren Falk",  city: "Reykjavík",     continent: "Europe",        lat: 64.1,  lon: -21.9,  age: 36, occupation: "Geologist",      intention: "Explore", tags: ["geology","ice"],      openExchange: false },
  // Africa (6)
  { name: "Noor Idris",  city: "Marrakech",     continent: "Africa",        lat: 31.6,  lon: -7.99,  age: 34, occupation: "Tea Curator",    intention: "Rest",    tags: ["weaving","tea"],      openExchange: true  },
  { name: "Atlas Mboya", city: "Cape Town",     continent: "Africa",        lat: -33.9, lon: 18.4,   age: 30, occupation: "Travel Journ.",  intention: "Travel",  tags: ["mountain","wind"],    openExchange: false },
  { name: "Sana Diop",   city: "Dakar",         continent: "Africa",        lat: 14.7,  lon: -17.5,  age: 27, occupation: "Marine Biolog.", intention: "Explore", tags: ["ocean","textile"],    openExchange: true  },
  { name: "Amara Okafor",city: "Lagos",         continent: "Africa",        lat: 6.5,   lon: 3.4,    age: 32, occupation: "Filmmaker",      intention: "Create",  tags: ["afrobeat","film"],    openExchange: false },
  { name: "Zewdi Haile", city: "Addis Ababa",   continent: "Africa",        lat: 9.03,  lon: 38.74,  age: 29, occupation: "Translator",     intention: "Rest",    tags: ["coffee","poetry"],    openExchange: true  },
  { name: "Karim Saad",  city: "Cairo",         continent: "Africa",        lat: 30.04, lon: 31.24,  age: 37, occupation: "Architect",      intention: "Work",    tags: ["desert","stone"],     openExchange: false },
  // Asia (6)
  { name: "Mira Chand",  city: "Chiang Mai",    continent: "Asia",          lat: 18.8,  lon: 98.9,   age: 28, occupation: "Filmmaker",      intention: "Create",  tags: ["film","monsoon"],     openExchange: true  },
  { name: "Theo Sato",   city: "Tokyo",         continent: "Asia",          lat: 35.6,  lon: 139.7,  age: 31, occupation: "Software Eng.",  intention: "Work",    tags: ["code","ramen"],       openExchange: false },
  { name: "Juno Mori",   city: "Kyoto",         continent: "Asia",          lat: 35.01, lon: 135.7,  age: 33, occupation: "Tea Curator",    intention: "Rest",    tags: ["tea","writing"],      openExchange: true  },
  { name: "Aria Beridze",city: "Tbilisi",       continent: "Asia",          lat: 41.7,  lon: 44.8,   age: 29, occupation: "Software Eng.",  intention: "Work",    tags: ["code","wine"],        openExchange: false },
  { name: "Yara Demir",  city: "Istanbul",      continent: "Asia",          lat: 41.0,  lon: 28.9,   age: 34, occupation: "Writer",         intention: "Create",  tags: ["bazaar","writing"],   openExchange: true  },
  { name: "Devi Rao",    city: "Goa",           continent: "Asia",          lat: 15.3,  lon: 74.1,   age: 26, occupation: "Yoga Teacher",   intention: "Rest",    tags: ["yoga","ocean"],       openExchange: false },
  // Oceania (6)
  { name: "Luma Wira",   city: "Bali",          continent: "Oceania",       lat: -8.4,  lon: 115.2,  age: 30, occupation: "Yoga Teacher",   intention: "Rest",    tags: ["yoga","ocean"],       openExchange: true  },
  { name: "Marlo Reef",  city: "Sydney",        continent: "Oceania",       lat: -33.87,lon: 151.2,  age: 28, occupation: "Photographer",   intention: "Travel",  tags: ["harbour","surf"],     openExchange: false },
  { name: "Tane Pita",   city: "Auckland",      continent: "Oceania",       lat: -36.85,lon: 174.76, age: 32, occupation: "Mountain Guide", intention: "Travel",  tags: ["alps","maori"],       openExchange: true  },
  { name: "Nala Veka",   city: "Suva",          continent: "Oceania",       lat: -18.14,lon: 178.44, age: 27, occupation: "Marine Biolog.", intention: "Explore", tags: ["coral","reef"],       openExchange: false },
  { name: "Quill Hart",  city: "Wellington",    continent: "Oceania",       lat: -41.29,lon: 174.77, age: 35, occupation: "Researcher",     intention: "Work",    tags: ["wind","code"],        openExchange: true  },
  { name: "Pira Ono",    city: "Cairns",        continent: "Oceania",       lat: -16.92,lon: 145.77, age: 24, occupation: "Cartographer",   intention: "Explore", tags: ["reef","map"],         openExchange: false },
];

const PEOPLE: Person[] = RAW.map((p, i) => ({ ...p, id: `p${i + 1}` }));

type Camp = { id: string; name: string; lat: number; lon: number; continent: string; themes: string[]; members: string[] };
const CAMPS: Camp[] = [
  { id: "c1", name: "Sierra Studio",      lat: 19.4,  lon: -99.1,  continent: "North America", themes: ["sound","craft"],         members: ["IV","CR","MQ","TP"] },
  { id: "c2", name: "Patagonia Circle",   lat: -41.0, lon: -71.5,  continent: "South America", themes: ["wilderness","film"],     members: ["IR","OV","LA","SV"] },
  { id: "c3", name: "Atlantic Atelier",   lat: 38.7,  lon: -9.1,   continent: "Europe",        themes: ["writing","ocean"],       members: ["KV","RS","VL","ET"] },
  { id: "c4", name: "Atlas Encampment",   lat: 31.6,  lon: -7.99,  continent: "Africa",        themes: ["weaving","tea"],         members: ["NI","AM","SD","AO"] },
  { id: "c5", name: "Monsoon House",      lat: 18.8,  lon: 98.9,   continent: "Asia",          themes: ["film","code"],           members: ["MC","TS","JM","YD"] },
  { id: "c6", name: "Coral Camp",         lat: -8.4,  lon: 115.2,  continent: "Oceania",       themes: ["yoga","reef"],           members: ["LW","TP","NV","PO"] },
];

const CONTINENT_LABELS: { name: string; lat: number; lon: number; nomads: number }[] = [
  { name: "NORTH AMERICA", lat: 48,  lon: -100, nomads: 6 },
  { name: "SOUTH AMERICA", lat: -15, lon: -60,  nomads: 6 },
  { name: "EUROPE",        lat: 54,  lon: 15,   nomads: 6 },
  { name: "AFRICA",        lat: 3,   lon: 20,   nomads: 6 },
  { name: "ASIA",          lat: 40,  lon: 95,   nomads: 6 },
  { name: "OCEANIA",       lat: -25, lon: 140,  nomads: 6 },
];

// ── Terrain colour from centroid (lat, lon) ─────────────────────────────────
function terrainColor(lat: number, lon: number) {
  const absLat = Math.abs(lat);
  if (absLat > 65) return "#12161e";
  if (absLat > 58) return "#13181c";
  if (lat >= 14 && lat <= 34 && lon >= -22 && lon <= 55) return "#1e1507";
  if (lat >= 18 && lat <= 44 && lon >= 58 && lon <= 82) return "#1c1807";
  if (absLat < 14) return "#0d1f10";
  if (absLat < 28) return "#111e0c";
  return "#151e11";
}

// rough centroid from polygon coords
function centroidOf(geo: any): [number, number] {
  try {
    const coords = geo.geometry.type === "Polygon"
      ? geo.geometry.coordinates[0]
      : geo.geometry.coordinates[0][0];
    let sx = 0, sy = 0, n = 0;
    for (const [x, y] of coords) { sx += x; sy += y; n++; }
    return [sy / n, sx / n]; // [lat, lon]
  } catch { return [0, 0]; }
}

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Layers ──────────────────────────────────────────────────────────────────
type LayerKey = "people" | "connections" | "camps" | "events" | "intention" | "rhythm";
const LAYERS: { key: LayerKey; label: string }[] = [
  { key: "people",      label: "People" },
  { key: "connections", label: "Connections" },
  { key: "camps",       label: "Camps" },
  { key: "events",      label: "Events" },
  { key: "intention",   label: "Intention flow" },
  { key: "rhythm",      label: "Natural rhythm" },
];

// ── Page ────────────────────────────────────────────────────────────────────
export default function Tribe() {
  const [entered, setEntered] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    people: true, connections: true, camps: true, events: true, intention: true, rhythm: true,
  });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Particle canvas overlay
  useEffect(() => {
    if (!entered) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const colors = ["#0fb880", "#e8a020", "#7c4fd0", "#4090e0"];

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const parts = Array.from({ length: 65 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      r: 0.4 + Math.random() * 1.1,
      o: 0.15 + Math.random() * 0.25,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.globalAlpha = p.o;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, p.r), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [entered]);

  // Connection pairs by shared intention (cap a few per intention)
  const connections = useMemo(() => {
    const pairs: { a: Person; b: Person; color: string }[] = [];
    const byInt = new Map<Intention, Person[]>();
    PEOPLE.forEach(p => {
      if (!byInt.has(p.intention)) byInt.set(p.intention, []);
      byInt.get(p.intention)!.push(p);
    });
    byInt.forEach((arr, intent) => {
      for (let i = 0; i < arr.length; i++) {
        for (let j = i + 1; j < Math.min(arr.length, i + 3); j++) {
          pairs.push({ a: arr[i], b: arr[j], color: INTENTION_COLOR[intent] });
        }
      }
    });
    return pairs;
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: "#05070e", color: "rgba(240,237,232,.85)", fontFamily: "Arial, sans-serif" }}>
      <style>{`
        @keyframes oceanShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes mistA { 0%{transform:translate(-10%,0)} 50%{transform:translate(15%,8%)} 100%{transform:translate(-10%,0)} }
        @keyframes mistB { 0%{transform:translate(10%,5%)} 50%{transform:translate(-15%,-6%)} 100%{transform:translate(10%,5%)} }
        @keyframes campPulse { 0%{r:10;opacity:.6} 100%{r:18;opacity:0} }
        @keyframes dotPulse { 0%,100%{opacity:.85;transform:scale(1)} 50%{opacity:1;transform:scale(1.18)} }
        .tribe-heading { font-family: Georgia, serif; font-style: italic; }
        .tribe-caps { text-transform: uppercase; letter-spacing: .16em; font-size: 9.5px; color: rgba(240,237,232,.55); }
      `}</style>

      {/* Ocean background */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(135deg, #040810, #07101e, #091520, #050b16)",
          backgroundSize: "400% 400%",
          animation: "oceanShift 14s ease-in-out infinite",
        }}
      />
      {/* Mist drifts */}
      <div className="fixed pointer-events-none -z-10" style={{ left: "18%", top: "55%", width: 520, height: 520, borderRadius: "50%", background: "rgba(170,200,210,1)", opacity: 0.1, filter: "blur(40px)", animation: "mistA 22s ease-in-out infinite" }} />
      <div className="fixed pointer-events-none -z-10" style={{ left: "62%", top: "40%", width: 480, height: 480, borderRadius: "50%", background: "rgba(190,180,160,1)", opacity: 0.08, filter: "blur(40px)", animation: "mistB 27s ease-in-out infinite" }} />

      {/* Intro: glowing orb */}
      <AnimatePresence>
        {!entered && (
          <motion.button
            key="intro"
            type="button"
            onClick={() => setEntered(true)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="fixed inset-0 z-30 flex flex-col items-center justify-center cursor-pointer"
            style={{ background: "transparent" }}
          >
            <motion.div
              animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: 18, height: 18, borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,255,255,.95), rgba(255,255,255,0) 70%)",
                boxShadow: "0 0 80px rgba(255,255,255,.45), 0 0 24px rgba(255,255,255,.7)",
              }}
            />
            <div className="mt-12 max-w-xl text-center px-6">
              <BlurText text="You are not alone in motion." className="tribe-heading text-[28px] md:text-[34px] text-white/90" />
              <p className="mt-4 text-[11px] tracking-[.18em] uppercase text-white/40">(move or click to explore the tribe)</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Map view */}
      <AnimatePresence>
        {entered && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 1.4 }}
            className="fixed inset-0"
            onClick={() => { setSelectedPerson(null); setSelectedCamp(null); }}
          >
            {/* Map container leaves room for sidebar (right 214) and bottom panel */}
            <div className="absolute inset-0" style={{ right: 214, bottom: 188 }}>
              <ComposableMap
                projection="geoNaturalEarth1"
                projectionConfig={{ scale: 175 }}
                width={1100}
                height={600}
                style={{ width: "100%", height: "100%" }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const [lat, lon] = centroidOf(geo);
                      const fill = terrainColor(lat, lon);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="rgba(255,255,255,.04)"
                          strokeWidth={0.4}
                          style={{ default: { outline: "none" }, hover: { outline: "none", fill }, pressed: { outline: "none" } }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Connections */}
                {visible.connections && connections.map((c, i) => (
                  <Line
                    key={i}
                    from={[c.a.lon, c.a.lat]}
                    to={[c.b.lon, c.b.lat]}
                    stroke={c.color}
                    strokeWidth={0.7}
                    strokeOpacity={0.09}
                    strokeDasharray="4,8"
                  />
                ))}

                {/* Continent labels */}
                {CONTINENT_LABELS.map((c) => (
                  <Marker key={c.name} coordinates={[c.lon, c.lat]}>
                    <text textAnchor="middle" style={{ fontFamily: "Arial", fontSize: 8, letterSpacing: 2, fill: "rgba(240,237,232,.26)" }}>{c.name}</text>
                    <text textAnchor="middle" y={10} style={{ fontFamily: "Arial", fontSize: 7, fill: "rgba(240,237,232,.18)" }}>{c.nomads} nomads · 1 camp</text>
                  </Marker>
                ))}

                {/* Camps */}
                {visible.camps && CAMPS.map((camp) => (
                  <Marker
                    key={camp.id}
                    coordinates={[camp.lon, camp.lat]}
                    onClick={(e: any) => { e.stopPropagation(); setSelectedCamp(camp); setSelectedPerson(null); }}
                    style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: { cursor: "pointer" } }}
                  >
                    <circle r={10} fill="none" stroke="#e8a020" strokeWidth={0.8} style={{ animation: "campPulse 2.6s ease-out infinite", transformOrigin: "center" }} />
                    <circle r={2.4} fill="#e8a020" />
                  </Marker>
                ))}

                {/* People */}
                {visible.people && PEOPLE.map((p) => {
                  const color = INTENTION_COLOR[p.intention];
                  return (
                    <Marker
                      key={p.id}
                      coordinates={[p.lon, p.lat]}
                      onClick={(e: any) => { e.stopPropagation(); setSelectedPerson(p); setSelectedCamp(null); }}
                      style={{ default: { cursor: "pointer" }, hover: { cursor: "pointer" }, pressed: { cursor: "pointer" } }}
                    >
                      <circle r={5} fill={color} opacity={0.22} />
                      <circle r={1.6} fill={color} style={{ animation: "dotPulse 2.4s ease-in-out infinite", transformOrigin: "center" }} />
                    </Marker>
                  );
                })}
              </ComposableMap>
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{ right: 214, bottom: 188, background: "radial-gradient(ellipse at 50% 48%, transparent 32%, rgba(3,5,12,.78) 100%)" }} />
            {/* Particle canvas */}
            <canvas ref={canvasRef} className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 214, bottom: 188, width: "auto", height: "auto" }} />

            {/* Profile card */}
            <AnimatePresence>
              {selectedPerson && (
                <motion.div
                  key={selectedPerson.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute z-20 p-4 w-[260px]"
                  style={{
                    top: "20%", left: "30%",
                    background: "rgba(6,10,20,.96)", borderRadius: 13,
                    border: "1px solid rgba(255,255,255,.08)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[11px]" style={{ background: INTENTION_COLOR[selectedPerson.intention] + "33", color: INTENTION_COLOR[selectedPerson.intention], border: `1px solid ${INTENTION_COLOR[selectedPerson.intention]}55` }}>
                        {selectedPerson.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div className="tribe-heading text-[19px] leading-none text-white/95">{selectedPerson.name}</div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-white/60">
                          <span style={{ width: 6, height: 6, borderRadius: 99, background: INTENTION_COLOR[selectedPerson.intention], boxShadow: `0 0 6px ${INTENTION_COLOR[selectedPerson.intention]}` }} />
                          {selectedPerson.city}
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setSelectedPerson(null)} className="text-white/40 hover:text-white/80 text-sm">×</button>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px] text-white/70">
                    <div className="flex justify-between"><span className="tribe-caps">Age</span><span>{selectedPerson.age}</span></div>
                    <div className="flex justify-between"><span className="tribe-caps">Occupation</span><span>{selectedPerson.occupation}</span></div>
                    <div className="flex justify-between"><span className="tribe-caps">Intention</span><span style={{ color: INTENTION_COLOR[selectedPerson.intention] }}>{selectedPerson.intention}</span></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedPerson.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5" style={{ border: "1px solid rgba(255,255,255,.16)", borderRadius: 20, color: "rgba(240,237,232,.7)" }}>{t}</span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[10px]">
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: selectedPerson.openExchange ? "#0fb880" : "#e06060" }} />
                    <span className="text-white/60">{selectedPerson.openExchange ? "Open to dwelling exchange" : "Not exchanging right now"}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camp card */}
            <AnimatePresence>
              {selectedCamp && (
                <motion.div
                  key={selectedCamp.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className="absolute z-20 p-4 w-[240px]"
                  style={{ top: "28%", left: "42%", background: "rgba(6,10,20,.96)", borderRadius: 13, border: "1px solid rgba(255,255,255,.08)", backdropFilter: "blur(16px)" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between">
                    <div className="tribe-heading text-[15px] text-white/95">{selectedCamp.name}</div>
                    <button onClick={() => setSelectedCamp(null)} className="text-white/40 hover:text-white/80 text-sm">×</button>
                  </div>
                  <div className="mt-1 text-[10px] text-white/55">{selectedCamp.themes.join(" · ")}</div>
                  <div className="mt-3 flex items-center">
                    {selectedCamp.members.slice(0, 4).map((m, i) => (
                      <div key={i} style={{ marginLeft: i === 0 ? 0 : -7, width: 24, height: 24, borderRadius: 99, background: "#0c1322", border: "1px solid rgba(255,255,255,.15)", color: "rgba(232,160,32,.9)", fontSize: 9 }} className="flex items-center justify-center">{m}</div>
                    ))}
                    <div className="ml-2 text-[10px] text-white/60">+{Math.max(0, selectedCamp.members.length - 4)} more</div>
                  </div>
                  <div className="mt-2 text-[10px] text-white/50">{selectedCamp.members.length * 4 + 12} members</div>
                  <button className="mt-3 w-full text-[11px] py-1.5 rounded-full" style={{ background: "rgba(232,160,32,.15)", border: "1px solid rgba(232,160,32,.4)", color: "#e8a020" }}>View camp</button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      {entered && <Sidebar visible={visible} setVisible={setVisible} />}

      {/* Bottom ticker + panel */}
      {entered && <BottomPanel />}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ visible, setVisible }: { visible: Record<LayerKey, boolean>; setVisible: (v: any) => void }) {
  const dots: { label: string; color: string }[] = [
    { label: "In motion",      color: "#0fb880" },
    { label: "Settling",       color: "#e8a020" },
    { label: "Exploring",      color: "#7c4fd0" },
    { label: "Taking a break", color: "#e06060" },
    { label: "Working",        color: "#4090e0" },
  ];
  return (
    <aside
      className="fixed top-0 right-0 h-full z-20"
      style={{ width: 214, background: "rgba(4,7,16,.92)", backdropFilter: "blur(10px)", borderLeft: "1px solid rgba(255,255,255,.06)", fontFamily: "Arial, sans-serif" }}
    >
      <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="tribe-caps">Live movement</div>
        <p className="mt-2 text-[10px] leading-snug" style={{ color: "rgba(240,237,232,.5)" }}>
          Every particle is a nomad. Every line is a potential connection.
        </p>
        <div className="mt-3 space-y-1.5">
          {dots.map(d => (
            <div key={d.label} className="flex items-center gap-2 text-[11px]" style={{ color: "rgba(240,237,232,.65)" }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: d.color, boxShadow: `0 0 5px ${d.color}88` }} />
              {d.label}
            </div>
          ))}
        </div>
      </div>
      <div className="p-4" style={{ borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <div className="tribe-caps">Layers of the world</div>
        <div className="mt-3 space-y-1.5">
          {LAYERS.map(l => {
            const on = visible[l.key];
            return (
              <button
                key={l.key}
                onClick={() => setVisible((v: any) => ({ ...v, [l.key]: !v[l.key] }))}
                className="w-full flex items-center gap-2 text-[11px] py-0.5 text-left transition-opacity"
                style={{ color: "rgba(240,237,232,.65)", opacity: on ? 1 : 0.35 }}
              >
                <EyeIcon on={on} />
                {l.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-4">
        <div className="tribe-caps">The art of movement</div>
        <p className="mt-2 tribe-heading text-[12px] leading-snug" style={{ color: "rgba(240,237,232,.6)" }}>
          We don’t just show data. We show flow, intention and human rhythm.
        </p>
      </div>
    </aside>
  );
}

function EyeIcon({ on }: { on: boolean }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {on ? (
        <>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M3 3l18 18" />
          <path d="M10.6 6.1A10.9 10.9 0 0 1 12 6c6.5 0 10 6 10 6a16.7 16.7 0 0 1-3.2 4.1" />
          <path d="M6.6 6.6A16.6 16.6 0 0 0 2 12s3.5 6 10 6a10.7 10.7 0 0 0 4.4-1" />
        </>
      )}
    </svg>
  );
}

// ── Bottom panel ────────────────────────────────────────────────────────────
function BottomPanel() {
  const flows = [
    { name: "Oceanic flow",  count: 341, blurb: "Coastal towns, surf, salt air.",        grad: "linear-gradient(135deg,#0a2335,#0c4a64)" },
    { name: "Mountain flow", count: 267, blurb: "Altitude, snow lines, slow ascents.",  grad: "linear-gradient(135deg,#1a1f26,#3a4452)" },
    { name: "Desert flow",   count: 189, blurb: "Dunes, dry heat, long horizons.",      grad: "linear-gradient(135deg,#2a1a0a,#5a3a18)" },
    { name: "Jungle flow",   count: 215, blurb: "Humid greens, river paths.",            grad: "linear-gradient(135deg,#0d2014,#1a3a22)" },
  ];
  return (
    <>
      <div className="fixed left-0 z-10 text-center" style={{ right: 214, bottom: 196, fontFamily: "Arial", fontSize: 8, letterSpacing: ".18em", color: "rgba(240,237,232,.2)" }}>
        KEEP EXPLORING — CAMPS EMERGE
      </div>
      <div
        className="fixed bottom-0 left-0 z-10"
        style={{ right: 214, background: "linear-gradient(to top, rgba(3,5,12,.97) 55%, transparent)", padding: "22px 24px 16px" }}
      >
        <div className="grid grid-cols-12 gap-5">
          {/* Left */}
          <div className="col-span-3">
            <div className="tribe-caps">Global nomads right now</div>
            <div className="tribe-heading text-[34px] leading-none mt-1 text-white/90">3,385</div>
            <div className="text-[10px] mt-1" style={{ color: "rgba(240,237,232,.5)" }}>in 118 countries</div>
            <p className="tribe-heading text-[11px] mt-2" style={{ color: "rgba(240,237,232,.55)" }}>The map breathes. It changes with time, with seasons, with us.</p>
          </div>
          {/* Centre */}
          <div className="col-span-6">
            <div className="tribe-caps">Flows shaping the world now</div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {flows.map(f => (
                <div key={f.name} className="p-2" style={{ border: "1px solid rgba(255,255,255,.06)", borderRadius: 8, background: "rgba(8,12,22,.6)" }}>
                  <div style={{ height: 28, borderRadius: 4, background: f.grad }} />
                  <div className="tribe-heading text-[11px] mt-1.5 text-white/85">{f.name}</div>
                  <div className="text-[12px]" style={{ color: "#e8a020", fontFamily: "Georgia, serif" }}>{f.count}</div>
                  <div className="text-[9px]" style={{ color: "rgba(240,237,232,.4)" }}>{f.blurb}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Right */}
          <div className="col-span-3">
            <div className="p-3" style={{ background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 12, backdropFilter: "blur(14px)" }}>
              <div className="tribe-heading text-[12px] text-white/85">Choose to align your path with others</div>
              <div className="mt-2 space-y-1.5 text-[11px]" style={{ color: "rgba(240,237,232,.7)" }}>
                <button className="w-full text-left hover:text-white">📍 Open to co-locate</button>
                <button className="w-full text-left hover:text-white">🏢 Open to shared workspace</button>
                <button className="w-full text-left hover:text-white">🤝 Open to collaboration</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
