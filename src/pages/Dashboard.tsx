import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sun, BatteryFull, Wind, Droplets, Thermometer, AlertCircle, X, Home, Leaf, ArrowRight,
  Zap, Cloud, Users, Settings, Activity as ActivityIcon, Plug, ShieldCheck, ChevronDown,
} from "lucide-react";
import BlurText from "@/components/BlurText";
import { useMockAuth } from "@/context/MockAuth";
import { TOTAL_PARTS, pruneConfigured } from "@/data/dwellingParts";
import { SITES } from "@/data/sites";
import { TRIBES, tribeMembers, tribePresenceNear } from "@/data/tribe";
import { loadMyTribeId } from "@/lib/tribeStore";

// Mocked "portal" state — read directly from localStorage rather than the
// live useReservation hook, since this page just needs to know whether a
// design exists and how far along it is, not manage it.
//
// "delivered" and "reservationProgress" are deliberately independent: once
// an order is confirmed, reservationProgress resets to a fresh configuration
// (see useReservation.ts) so reopening the customizer doesn't replay the old
// receipt — "delivered" is what survives that reset, permanently, to answer
// "was anything ever actually delivered."
function readEnginePortalState() {
  let siteName: string | null = null;
  try {
    const raw = localStorage.getItem("configuratorInit");
    if (raw) siteName = (JSON.parse(raw)?.site?.name as string) ?? null;
  } catch { /* ignore */ }

  const delivered = localStorage.getItem("engineDelivered") === "true";

  let configuredCount = 0;
  try {
    const raw = localStorage.getItem("reservationProgress");
    if (raw) {
      const parsed = JSON.parse(raw);
      configuredCount = Array.isArray(parsed.configured) ? pruneConfigured(parsed.configured).length : 0;
    }
  } catch { /* ignore */ }

  return { siteName, delivered, configuredCount };
}

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Dashboard() {
  const navigate = useNavigate();
  const { selectedPlan } = useMockAuth();
  const [solar] = useState(78);
  const [battery] = useState(92);
  const [wind] = useState(14);
  const [alert, setAlert] = useState(true);
  const portal = useMemo(readEnginePortalState, []);

  // Reverse-playback loop for the background video — must be declared before
  // any early return below (Rules of Hooks: hooks can't be called
  // conditionally, and which state renders can change between mounts).
  const videoBgRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = videoBgRef.current;
    if (!video) return;
    let raf: number;
    const onEnded = () => {
      const step = () => {
        video.currentTime = Math.max(0, video.currentTime - 0.033);
        if (video.currentTime > 0) {
          raf = requestAnimationFrame(step);
        } else {
          video.play();
        }
      };
      raf = requestAnimationFrame(step);
    };
    video.addEventListener("ended", onEnded);
    return () => { video.removeEventListener("ended", onEnded); cancelAnimationFrame(raf); };
  }, []);

  const bg = (
    <>
      <video
        ref={videoBgRef}
        src="/engine-bg.mp4"
        autoPlay
        muted
        playsInline
        className="fixed inset-0 w-full h-full z-0 object-cover pointer-events-none opacity-70"
      />
      {/* Neutral black, matching the rest of the app — a navy tint here made
          this page look like a different site from the nav around it. */}
      <div className="fixed inset-0 z-0 bg-black/70" aria-hidden />
    </>
  );

  // No design started yet — nothing to monitor or resume.
  if (!portal.siteName) {
    return (
      <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
        {bg}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
          <div className="liquid-glass border border-white/10 rounded-[2rem] p-10 max-w-lg text-center">
            <p className="text-sm font-body text-white/60 mb-3">// Engine</p>
            <BlurText
              text="No engine yet."
              className="font-heading text-white text-4xl leading-none tracking-[-2px]"
            />
            <p className="font-body text-sm text-white/70 mt-4 mb-8">
              You haven't started designing a dwelling yet. Pick a site on Voyages to begin.
            </p>
            <button
              onClick={() => navigate("/discover")}
              className="inline-flex items-center gap-2 text-sm font-body font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
            >
              Start designing <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Design exists but the order isn't confirmed yet — offer to resume rather
  // than show fabricated "delivered" telemetry for something not built.
  if (!portal.delivered) {
    const pct = Math.round((portal.configuredCount / TOTAL_PARTS) * 100);
    return (
      <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
        {bg}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
          <div className="liquid-glass border border-white/10 rounded-[2rem] p-10 max-w-lg text-center">
            <p className="text-sm font-body text-white/60 mb-3">// Engine</p>
            <BlurText
              text={`${portal.siteName} — in progress`}
              className="font-heading text-white text-4xl leading-none tracking-[-2px]"
            />
            <p className="font-body text-sm text-white/70 mt-4">
              {selectedPlan
                ? `Plan: ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} · `
                : ""}
              {pct}% configured — your progress is saved.
            </p>
            <div className="w-full h-1.5 rounded-full bg-white/10 mt-4 mb-8 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <button
              onClick={() => navigate("/configurator")}
              className="inline-flex items-center gap-2 text-sm font-body font-medium bg-white text-black px-6 py-3 rounded-full hover:bg-white/90 transition-colors"
            >
              Continue configuring <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Who's around the site, and where the visitor stands with a tribe.
  const engineSite = SITES.find((s) => s.title === portal.siteName);
  const neighbours = engineSite ? tribePresenceNear(engineSite.coords[1], engineSite.coords[0]) : null;
  const myTribe = TRIBES.find((t) => t.id === loadMyTribeId()) ?? null;
  const goTribe = () =>
    navigate("/tribe", engineSite
      ? { state: { near: { lat: engineSite.coords[1], lng: engineSite.coords[0], label: engineSite.title } } }
      : undefined);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      {bg}

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-16">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-body text-white/80 mb-4">// Engine</p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-3xl">
              <BlurText
                text={`${portal.siteName} · Engine 04A`}
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

          {/* Alert */}
          <AnimatePresence>
            {alert && (
              <motion.div
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-glass mt-8 rounded-[1rem] p-4 flex items-center gap-3 group transition-colors hover:border-amber-400/40"
              >
                <AlertCircle className="h-5 w-5 text-white group-hover:text-amber-300 transition-colors" strokeWidth={1.5} />
                <p className="flex-1 text-sm font-body text-white/90">
                  Wind speed exceeds optimal turbine range. Consider feathering blades.
                </p>
                <button className="liquid-glass rounded-full px-3 py-1.5 text-xs font-body text-white transition-transform active:scale-95 hover:bg-white/10">Resolve</button>
                <button onClick={() => setAlert(false)} className="text-white/70 hover:text-white transition-transform active:scale-90">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Neighbours — closes the loop between the engine and the tribe */}
          <div className="liquid-glass mt-8 rounded-[1.25rem] p-5 flex items-center gap-4 flex-wrap">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{
                background: (myTribe ?? neighbours?.topTribe)?.color ?? "rgba(255,255,255,0.4)",
                boxShadow: `0 0 10px ${(myTribe ?? neighbours?.topTribe)?.color ?? "transparent"}`,
              }}
            />
            <p className="flex-1 min-w-[240px] text-sm font-body text-white/85 leading-snug">
              {myTribe ? (
                <>
                  You're in <span className="text-white">{myTribe.name}</span> with {tribeMembers.get(myTribe.id)?.length ?? 0} others
                  {neighbours && neighbours.total > 0 && <> · {neighbours.total} tribe members live within 2,500 km of {portal.siteName}</>}.
                </>
              ) : neighbours && neighbours.total > 0 && neighbours.topTribe ? (
                <>
                  {neighbours.total} tribe members live within 2,500 km of {portal.siteName}, mostly{" "}
                  <span className="text-white">{neighbours.topTribe.name}</span>. Join a tribe before your engine arrives.
                </>
              ) : (
                <>No tribe members near {portal.siteName} yet — join one and be the first neighbour.</>
              )}
            </p>
            <button
              onClick={goTribe}
              className="liquid-glass rounded-full px-4 py-2 text-xs font-body font-medium text-white hover:bg-white/10 inline-flex items-center gap-1.5"
            >
              {myTribe ? "Open your tribe" : "Meet the tribe"} <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>

          {/* Stat row */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Sun} label="Solar generation" value={solar} unit="%" />
            <PowerRunwayCard value={battery} />
            <StatCard icon={Wind} label="Wind speed" value={wind} unit="km/h" />
          </div>

          {/* Climate */}
          <SectionHeading title="Climate" tag="Stable" />
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { i: Thermometer, l: "Temp", v: "19.4", u: "°C" },
              { i: Droplets, l: "Humidity", v: "48", u: "%" },
              { i: Leaf, l: "Air quality", v: "AQI 12", u: "" },
              { i: Home, l: "Occupied", v: "2", u: "guests" },
            ].map((s) => (
              <motion.div
                key={s.l}
                whileHover={{ y: -3 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
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

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="liquid-glass rounded-[1.25rem] p-6">
              <h3 className="font-heading text-white text-2xl tracking-[-1px] leading-none">Interior temperature · 12h</h3>
              <p className="text-xs mt-3 text-white/60 font-body">hover to scrub</p>
              <div className="mt-3">
                <Sparkline />
              </div>
            </div>
            <div className="liquid-glass rounded-[1.25rem] p-6">
              <h3 className="font-heading text-white text-2xl tracking-[-1px] leading-none">Exterior vs. interior</h3>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { l: "Temperature", out: "8.1°C", in: "19.4°C" },
                  { l: "Humidity", out: "72%", in: "48%" },
                  { l: "Wind", out: "23 km/h", in: "—" },
                  { l: "Light", out: "12 lux", in: "240 lux" },
                ].map((c) => (
                  <div key={c.l} className="liquid-glass rounded-[1rem] p-3.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/50 font-body">{c.l}</p>
                    <div className="mt-2 flex items-baseline justify-between">
                      <div>
                        <p className="text-[10px] text-white/40 font-body">out</p>
                        <p className="font-heading text-white text-lg">{c.out}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/40 font-body">in</p>
                        <p className="font-heading text-white text-lg">{c.in}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Energy */}
          <SectionHeading
            title="Energy"
            tag="24h"
            trailing={
              <div className="flex items-center gap-4 text-xs font-body text-white/60">
                <span>Today <span className="text-white font-medium">42.6 kWh</span> <span className="text-emerald-300">▲11.8%</span></span>
                <span className="inline-flex items-center gap-1">
                  <Plug className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Net export <span className="text-white font-medium">8.4 kWh</span>
                </span>
              </div>
            }
          />
          <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
            <div className="flex items-center gap-4 text-xs font-body text-white/60">
              <span className="inline-flex items-center gap-2"><span className="w-3 h-[2px] bg-white" />Generation</span>
              <span className="inline-flex items-center gap-2"><span className="w-3 h-[2px] bg-white/50" />Draw</span>
            </div>
            <div className="mt-3">
              <DualSparkline />
            </div>
          </div>
          <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
            <h3 className="font-heading text-white text-2xl tracking-[-1px] leading-none">Source breakdown</h3>
            <p className="text-xs mt-1 text-white/60 font-body">share of last hour</p>
            <div className="mt-5 space-y-4">
              {[
                { l: "Solar", v: 62, c: "bg-white" },
                { l: "Wind", v: 23, c: "bg-white/60" },
                { l: "Reserve", v: 15, c: "bg-white/30" },
              ].map((s) => (
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

          {/* Assistant + modules — combined into one compact card */}
          <SectionHeading title="Assistant" />
          <div className="mt-4 liquid-glass rounded-[1.25rem] p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-body font-light text-white/80 leading-snug">
                Forecast suggests 6 hours of high wind tonight. I've scheduled
                battery topping at 22:00 and locked the solar array for storm mode.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <motion.button
                  whileTap={{ scale: 0.97 }} whileHover={{ y: -1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="liquid-glass rounded-full px-4 py-2 text-sm font-body font-medium text-white hover:bg-white/10 transition-colors active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)]"
                >
                  Review schedule
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }} whileHover={{ y: -1, boxShadow: "0 0 24px rgba(255,255,255,0.35)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                  className="bg-white text-black rounded-full px-4 py-2 text-sm font-body font-medium inline-flex items-center gap-1.5 group"
                >
                  Initiate relocation
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
                </motion.button>
              </div>
            </div>
            <div className="md:border-l md:border-white/10 md:pl-6">
              <p className="text-[11px] uppercase tracking-[0.16em] mb-3 text-white/60 font-body">Modules online</p>
              <div className="flex flex-wrap gap-2">
                {["Sleep", "Galley", "Solar", "Water", "Sensors"].map((m) => (
                  <span
                    key={m}
                    className="liquid-glass tag-glass inline-flex items-center gap-1.5 hover:text-emerald-300 hover:border-emerald-400/40 transition-colors cursor-default"
                  >
                    {m} <span className="text-emerald-300/90 text-[10px]">OK</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Activity — collapsed to a handful, expandable */}
          <SectionHeading title="Recent activity" />
          <ActivitySection />
        </div>
      </div>
    </div>
  );
}

/* ============== Section heading ============== */
function SectionHeading({ title, tag, trailing }: { title: string; tag?: string; trailing?: React.ReactNode }) {
  return (
    <div className="mt-12 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-white text-3xl tracking-[-1px] leading-none">{title}</h2>
        {tag && <span className="liquid-glass tag-glass">{tag}</span>}
      </div>
      {trailing}
    </div>
  );
}

/* ============== Activity (collapsed) ============== */
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
const COLLAPSED_COUNT = 4;

function ActivitySection() {
  const [filter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const filtered = filter === "All" ? events : events.filter((e) => e.cat === filter);
  const list = expanded ? filtered : filtered.slice(0, COLLAPSED_COUNT);

  return (
    <div className="mt-4 liquid-glass rounded-[1.25rem] p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {activityFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-body font-medium transition-colors ${
                filter === f ? "bg-white text-black" : "liquid-glass text-white/70 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="liquid-glass tag-glass inline-flex items-center gap-1.5">
          <ActivityIcon className="h-3 w-3" strokeWidth={1.75} />
          {filtered.length} events
        </span>
      </div>

      <div className="mt-5 relative">
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
        {filtered.length === 0 && (
          <p className="text-sm text-white/50 font-body py-6 text-center">No events in this category.</p>
        )}
      </div>

      {filtered.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-body text-white/60 hover:text-white transition-colors"
        >
          {expanded ? "Show fewer" : `View all ${filtered.length} events`}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
      )}
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

/* ============== Dual sparkline (Energy) ============== */
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
