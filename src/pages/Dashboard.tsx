import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sun, BatteryFull, Wind, Droplets, Thermometer, AlertCircle, X, Home, Leaf, ArrowRight,
  Zap, Cloud, Users, Settings, Activity as ActivityIcon, Plug, ShieldCheck,
} from "lucide-react";
import FadingVideo from "@/components/FadingVideo";
import BlurText from "@/components/BlurText";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";

const tabs = ["Overview", "Energy", "Climate", "Activity"];

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Dashboard() {
  const [tab, setTab] = useState(0);
  const [solar] = useState(78);
  const [battery] = useState(92);
  const [wind] = useState(14);
  const [alert, setAlert] = useState(true);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <FadingVideo src={HERO_VIDEO} className="fixed inset-0 w-full h-full object-cover z-0 opacity-40" />
      <div className="fixed inset-0 z-0 bg-black/60" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-body text-white/80 mb-4">// Engine</p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-3xl">
              <BlurText
                text="Skye Moor · Engine 04A"
                className="font-heading text-white text-5xl md:text-6xl lg:text-[5rem] leading-[0.9] tracking-[-3px]"
              />
            </div>
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <span className="liquid-glass tag-glass inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                All systems nominal
              </span>
              <span className="liquid-glass tag-glass">Last sync 4s ago</span>
            </motion.div>
          </div>

          {/* Tabs */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
            className="mt-10 liquid-glass rounded-full inline-flex gap-0 p-1.5 relative"
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`relative px-5 py-2 rounded-full text-sm font-body font-medium transition-colors z-10 ${
                  tab === i ? "text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {tab === i && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-white -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                {t}
              </button>
            ))}
          </motion.div>

          {/* Panels */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
            >
              {tab === 0 && (
                <OverviewPanel
                  solar={solar} battery={battery} wind={wind}
                  alert={alert} dismissAlert={() => setAlert(false)}
                />
              )}
              {tab === 1 && <EnergyPanel solar={solar} battery={battery} />}
              {tab === 2 && <ClimatePanel />}
              {tab === 3 && <ActivityPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ============== Overview ============== */
function OverviewPanel({ solar, battery, wind, alert, dismissAlert }: {
  solar: number; battery: number; wind: number; alert: boolean; dismissAlert: () => void;
}) {
  return (
    <>
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="liquid-glass mt-6 rounded-[1rem] p-4 flex items-center gap-3 group transition-colors hover:border-amber-400/40"
          >
            <AlertCircle className="h-5 w-5 text-white group-hover:text-amber-300 transition-colors" strokeWidth={1.5} />
            <p className="flex-1 text-sm font-body text-white/90">
              Wind speed exceeds optimal turbine range. Consider feathering blades.
            </p>
            <button className="liquid-glass rounded-full px-3 py-1.5 text-xs font-body text-white transition-transform active:scale-95 hover:bg-white/10">Resolve</button>
            <button onClick={dismissAlert} className="text-white/70 hover:text-white transition-transform active:scale-90">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={Sun} label="Solar generation" value={solar} unit="%" />
        <PowerRunwayCard value={battery} />
        <StatCard icon={Wind} label="Wind speed" value={wind} unit="km/h" />
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="liquid-glass lg:col-span-2 rounded-[1.25rem] p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Internal climate</h3>
            <span className="liquid-glass tag-glass">Stable</span>
          </div>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { i: Thermometer, l: "Temp", v: "19.4", u: "°C" },
              { i: Droplets, l: "Humidity", v: "48", u: "%" },
              { i: Leaf, l: "Air quality", v: "AQI 12", u: "" },
              { i: Home, l: "Occupied", v: "2", u: "guests" },
            ].map((s) => (
              <motion.div key={s.l} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="cursor-default group">
                <div className="liquid-glass icon-box-glass mb-3 transition-all group-hover:bg-white/10" style={{ width: 36, height: 36 }}>
                  <s.i className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
                <p className="font-heading text-white text-2xl tracking-[-1px] leading-none">
                  {s.v} <span className="text-xs text-white/60 font-body">{s.u}</span>
                </p>
                <p className="text-xs mt-1 text-white/60 font-body">{s.l}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs mb-3 text-white/60 font-body">24h energy balance · hover to scrub</p>
            <Sparkline />
          </div>
        </div>

        <div className="liquid-glass rounded-[1.25rem] p-6">
          <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Engine assistant</h3>
          <p className="mt-3 text-sm font-body font-light text-white/80 leading-snug">
            Forecast suggests 6 hours of high wind tonight. I've scheduled
            battery topping at 22:00 and locked the solar array for storm mode.
          </p>
          <div className="mt-5 space-y-2">
            <motion.button
              whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body font-medium text-white w-full hover:bg-white/10 transition-colors active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
            >
              Review schedule
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }} whileHover={{ y: -1, boxShadow: "0 0 24px rgba(255,255,255,0.35)" }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="bg-white text-black rounded-full px-4 py-2.5 text-sm font-body font-medium w-full inline-flex items-center justify-center gap-1.5 group"
            >
              Initiate relocation
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
            </motion.button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-[0.16em] mb-3 text-white/60 font-body">Modules online</p>
            {["Sleep", "Galley", "Solar", "Water", "Sensors"].map((m) => (
              <div key={m} className="flex items-center justify-between py-2 text-sm font-body text-white/70 group cursor-default transition-colors hover:text-white">
                <span>{m}</span>
                <span className="liquid-glass tag-glass text-[10px] transition-all group-hover:text-emerald-300 group-hover:border-emerald-400/40">OK</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============== Energy ============== */
function EnergyPanel({ solar, battery }: { solar: number; battery: number }) {
  const today = 42.6, yesterday = 38.1;
  const delta = (((today - yesterday) / yesterday) * 100).toFixed(1);
  const sources = [
    { l: "Solar", v: 62, c: "bg-white" },
    { l: "Wind", v: 23, c: "bg-white/60" },
    { l: "Reserve", v: 15, c: "bg-white/30" },
  ];
  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="liquid-glass rounded-[1.25rem] p-6">
          <div className="liquid-glass icon-box-glass" style={{ width: 36, height: 36 }}>
            <Sun className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs mt-4 text-white/60 font-body">Solar generation today</p>
          <p className="mt-2 font-heading text-white text-4xl tracking-[-1px] leading-none">
            {today.toFixed(1)} <span className="text-sm text-white/60 font-body">kWh</span>
          </p>
          <p className="mt-2 text-xs text-emerald-300 font-body">▲ {delta}% vs. yesterday</p>
        </div>
        <PowerRunwayCard value={battery} />
        <div className="liquid-glass rounded-[1.25rem] p-6">
          <div className="liquid-glass icon-box-glass" style={{ width: 36, height: 36 }}>
            <Plug className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs mt-4 text-white/60 font-body">Net export to grid</p>
          <p className="mt-2 font-heading text-white text-4xl tracking-[-1px] leading-none">
            8.4 <span className="text-sm text-white/60 font-body">kWh</span>
          </p>
          <p className="mt-2 text-xs text-white/60 font-body">last 24h</p>
        </div>
      </div>

      <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Generation vs. draw</h3>
          <span className="liquid-glass tag-glass">24h</span>
        </div>
        <div className="mt-6 flex gap-4 text-xs font-body text-white/60">
          <span className="inline-flex items-center gap-2"><span className="w-3 h-[2px] bg-white" />Generation</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-[2px] bg-white/50" />Draw</span>
        </div>
        <div className="mt-3">
          <DualSparkline />
        </div>
      </div>

      <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
        <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Source breakdown</h3>
        <p className="text-xs mt-1 text-white/60 font-body">share of last hour</p>
        <div className="mt-6 space-y-4">
          {sources.map((s) => (
            <div key={s.l}>
              <div className="flex items-center justify-between text-sm font-body text-white/80">
                <span>{s.l}</span>
                <span className="font-heading text-white text-lg">{s.v}<span className="text-xs text-white/60 ml-0.5">%</span></span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${s.v}%` }}
                  transition={{ duration: 0.9, ease: [0, 0, 0.2, 1] }}
                  className={`h-full ${s.c}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== Climate ============== */
function ClimatePanel() {
  const tiles = [
    { i: Thermometer, l: "Temperature", v: "19.4", u: "°C" },
    { i: Droplets, l: "Humidity", v: "48", u: "%" },
    { i: Leaf, l: "Air quality", v: "AQI 12", u: "" },
    { i: Home, l: "Occupied", v: "2", u: "guests" },
  ];
  const compare = [
    { l: "Temperature", out: "8.1°C", in: "19.4°C" },
    { l: "Humidity", out: "72%", in: "48%" },
    { l: "Wind", out: "23 km/h", in: "—" },
    { l: "Light", out: "12 lux", in: "240 lux" },
  ];
  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((s) => (
          <motion.div key={s.l} whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="liquid-glass rounded-[1.25rem] p-6 group cursor-default"
          >
            <div className="liquid-glass icon-box-glass group-hover:bg-white/10 transition-all" style={{ width: 36, height: 36 }}>
              <s.i className="h-4 w-4 text-white" strokeWidth={1.5} />
            </div>
            <p className="text-xs mt-4 text-white/60 font-body">{s.l}</p>
            <p className="mt-2 font-heading text-white text-4xl tracking-[-1px] leading-none">
              {s.v} <span className="text-xs text-white/60 font-body">{s.u}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Interior temperature · 12h</h3>
          <span className="liquid-glass tag-glass">Stable</span>
        </div>
        <p className="text-xs mt-3 text-white/60 font-body">hover to scrub</p>
        <div className="mt-3">
          <Sparkline />
        </div>
      </div>

      <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
        <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Exterior vs. interior</h3>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {compare.map((c) => (
            <div key={c.l} className="liquid-glass rounded-[1rem] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/50 font-body">{c.l}</p>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <p className="text-[10px] text-white/40 font-body">out</p>
                  <p className="font-heading text-white text-xl">{c.out}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40 font-body">in</p>
                  <p className="font-heading text-white text-xl">{c.in}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============== Activity ============== */
const activityFilters = ["All", "System", "Climate", "Guests"];
const events: { t: string; cat: string; i: any; title: string; body: string }[] = [
  { t: "22:14", cat: "System", i: BatteryFull, title: "Battery topping started", body: "Charging from 86% to 100% — est. 38 min." },
  { t: "21:47", cat: "System", i: ShieldCheck, title: "Solar array locked", body: "Storm mode engaged ahead of forecast wind." },
  { t: "20:32", cat: "Climate", i: Thermometer, title: "Interior temp adjusted", body: "Target raised to 19.5°C for sleep cycle." },
  { t: "19:02", cat: "Guests", i: Users, title: "Guest arrival registered", body: "2 occupants checked in at the south hatch." },
  { t: "17:50", cat: "Climate", i: Cloud, title: "Air quality nominal", body: "AQI 12 — particulate filter cycled." },
  { t: "16:21", cat: "System", i: Zap, title: "Wind turbine peak", body: "Output hit 1.8kW at 31 km/h gust." },
  { t: "14:05", cat: "System", i: Settings, title: "Firmware sync", body: "Sensor module updated to v4.12.0." },
];

function ActivityPanel() {
  const [filter, setFilter] = useState("All");
  const list = filter === "All" ? events : events.filter((e) => e.cat === filter);
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 flex-wrap">
        {activityFilters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
              filter === f ? "bg-white text-black" : "liquid-glass text-white/70 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Event log</h3>
          <span className="liquid-glass tag-glass inline-flex items-center gap-1.5">
            <ActivityIcon className="h-3 w-3" strokeWidth={1.75} />
            {list.length} events
          </span>
        </div>

        <div className="mt-6 relative">
          <div className="absolute left-[22px] top-2 bottom-2 w-px bg-white/10" aria-hidden />
          <AnimatePresence mode="popLayout">
            {list.map((e, idx) => (
              <motion.div
                key={`${filter}-${e.t}-${e.title}`}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.22, delay: idx * 0.03, ease: [0, 0, 0.2, 1] }}
                className="relative flex gap-4 py-3 group"
              >
                <div className="relative z-10 liquid-glass icon-box-glass shrink-0 group-hover:bg-white/10 transition-colors" style={{ width: 44, height: 44 }}>
                  <e.i className="h-4 w-4 text-white" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <p className="font-heading text-white text-lg tracking-[-0.5px] leading-none">{e.title}</p>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-body">{e.cat}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-body text-white/70 leading-snug">{e.body}</p>
                </div>
                <span className="text-xs font-body text-white/50 tabular-nums shrink-0">{e.t}</span>
              </motion.div>
            ))}
          </AnimatePresence>
          {list.length === 0 && (
            <p className="text-sm text-white/50 font-body py-6 text-center">No events in this category.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============== Magnetic card wrapper ============== */
function useMagnet(strength = 8) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18 });
  const sy = useSpring(y, { stiffness: 200, damping: 18 });
  const ref = useRef<HTMLDivElement | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    x.set(nx * strength * 2);
    y.set(ny * strength * 2);
  };
  const onLeave = () => { x.set(0); y.set(0); };
  const rotateX = useTransform(sy, [-strength, strength], [3, -3]);
  const rotateY = useTransform(sx, [-strength, strength], [-3, 3]);
  return { ref, sx, sy, rotateX, rotateY, onMove, onLeave };
}

function StatCard({ icon: Icon, label, value, unit }: any) {
  const display = String(Math.round(value));
  const mag = useMagnet();
  const [hover, setHover] = useState(false);
  return (
    <motion.div
      ref={mag.ref}
      onMouseMove={mag.onMove}
      onMouseLeave={() => { mag.onLeave(); setHover(false); }}
      onMouseEnter={() => setHover(true)}
      whileTap={{ scale: 0.985 }}
      style={{ x: mag.sx, y: mag.sy, rotateX: mag.rotateX, rotateY: mag.rotateY, transformPerspective: 800 }}
      className="liquid-glass rounded-[1.25rem] p-6 relative overflow-hidden cursor-pointer will-change-transform"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="liquid-glass icon-box-glass" style={{ width: 36, height: 36 }}>
            <Icon className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs mt-4 text-white/60 font-body">{label}</p>
          <div className="mt-2 flex items-baseline gap-2 overflow-hidden h-[44px]">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={display}
                initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }}
                transition={{ duration: 0.18 }}
                className="font-heading text-white text-4xl tracking-[-1px] leading-none"
              >
                {display}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-white/60 font-body">{unit}</span>
          </div>
        </div>
        <svg width="68" height="68" viewBox="0 0 68 68" className="rotate-[-90deg]" style={{ filter: hover ? "drop-shadow(0 0 8px rgba(255,255,255,0.55))" : "none", transition: "filter 0.3s" }}>
          <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <motion.circle
            cx="34" cy="34" r="28" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 28}
            initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - Math.min(100, value) / 100) }}
            transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
          />
        </svg>
      </div>
    </motion.div>
  );
}

const DRAW_RATE = 11; // % per hour
const RING_R = 28;
const RING_C = 2 * Math.PI * RING_R;

function PowerRunwayCard({ value }: { value: number }) {
  const display = String(Math.round(value));
  const hours = Math.max(0, Math.round(value / DRAW_RATE));
  const low = value < 20;
  const target = RING_C * (1 - Math.min(100, Math.max(0, value)) / 100);
  const [offset, setOffset] = useState(RING_C);
  const [hover, setHover] = useState(false);
  const mag = useMagnet();
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <motion.div
      ref={mag.ref}
      onMouseMove={mag.onMove}
      onMouseLeave={() => { mag.onLeave(); setHover(false); }}
      onMouseEnter={() => setHover(true)}
      whileTap={{ scale: 0.985 }}
      style={{ x: mag.sx, y: mag.sy, rotateX: mag.rotateX, rotateY: mag.rotateY, transformPerspective: 800 }}
      className="liquid-glass rounded-[1.25rem] p-6 relative overflow-hidden cursor-pointer will-change-transform"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="liquid-glass icon-box-glass" style={{ width: 36, height: 36 }}>
            <BatteryFull className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-xs mt-4 text-white/60 font-body">Power runway</p>
          <div className="mt-2 flex items-baseline gap-2 overflow-hidden h-[44px]">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={display}
                initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "-100%" }}
                transition={{ duration: 0.18 }}
                className="font-heading text-white text-4xl tracking-[-1px] leading-none"
              >
                {display}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-white/60 font-body">%</span>
          </div>
          <p className="mt-2 text-xs text-white/60 font-body">~{hours}h remaining at current draw</p>
        </div>
        <svg width="68" height="68" viewBox="0 0 68 68" className="rotate-[-90deg]" style={{ filter: hover && !low ? "drop-shadow(0 0 8px rgba(255,255,255,0.55))" : "none", transition: "filter 0.3s" }}>
          <circle cx="34" cy="34" r={RING_R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <circle
            cx="34" cy="34" r={RING_R} fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={RING_C} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0, 0, 0.2, 1)" }}
            className={low ? "ring-amber-pulse" : undefined}
          />
        </svg>
      </div>
    </motion.div>
  );
}

/* ============== Sparkline (scrubbable) ============== */
function Sparkline() {
  const w = 800, h = 120;
  const points = useMemo(
    () => Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i * 0.45) * 18 + Math.cos(i * 0.2) * 6),
    []
  );
  const max = Math.max(...points), min = Math.min(...points);
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * w,
    y: h - ((p - min) / (max - min)) * h,
    v: p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number; v: number; i: number } | null>(null);

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * w;
    let nearest = 0, best = Infinity;
    coords.forEach((c, i) => { const d = Math.abs(c.x - px); if (d < best) { best = d; nearest = i; } });
    const c = coords[nearest];
    setHover({ x: c.x, y: c.y, v: c.v, i: nearest });
  };

  return (
    <svg
      ref={svgRef} viewBox={`0 0 ${w} ${h}`}
      className="w-full h-[120px] cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={onMove}
      onMouseLeave={() => setHover(null)}
    >
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#g)" />
      <motion.path
        d={path} fill="none" stroke="#ffffff" strokeWidth="1.5"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
      />
      {hover && (
        <g pointerEvents="none">
          <line x1={hover.x} x2={hover.x} y1={0} y2={h} stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 3" />
          <circle cx={hover.x} cy={hover.y} r="5" fill="#fff" style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))" }} />
          <g transform={`translate(${Math.min(Math.max(hover.x, 60), w - 60)}, ${Math.max(hover.y - 18, 14)})`}>
            <rect x="-52" y="-14" width="104" height="22" rx="11" fill="#fff" />
            <text x="0" y="1" textAnchor="middle" fontSize="11" fontFamily="Barlow, sans-serif" fontWeight="500" fill="#000" dominantBaseline="middle">
              {`${String(hover.i).padStart(2,"0")}:00 · ${hover.v.toFixed(1)}kW`}
            </text>
          </g>
        </g>
      )}
    </svg>
  );
}

/* ============== Dual sparkline (Energy tab) ============== */
function DualSparkline() {
  const w = 800, h = 160;
  const N = 28;
  const gen = useMemo(() => Array.from({ length: N }, (_, i) => 30 + Math.sin(i * 0.4) * 20 + Math.cos(i * 0.18) * 6), []);
  const draw = useMemo(() => Array.from({ length: N }, (_, i) => 25 + Math.sin(i * 0.5 + 1) * 10 + Math.cos(i * 0.22) * 5), []);
  const all = [...gen, ...draw];
  const max = Math.max(...all), min = Math.min(...all);
  const toPath = (arr: number[]) =>
    arr.map((p, i) => {
      const x = (i / (arr.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[160px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${toPath(gen)} L ${w} ${h} L 0 ${h} Z`} fill="url(#g2)" />
      <motion.path d={toPath(gen)} fill="none" stroke="#ffffff" strokeWidth="1.75"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
      />
      <motion.path d={toPath(draw)} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.25" strokeDasharray="3 3"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, delay: 0.2, ease: [0, 0, 0.2, 1] }}
      />
    </svg>
  );
}
