import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sun, BatteryFull, Wind, Droplets, Thermometer, AlertCircle, X, Home, Leaf } from "lucide-react";
import FadingVideo from "@/components/FadingVideo";
import BlurText from "@/components/BlurText";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4";

const tabs = ["Overview", "Energy", "Climate", "Activity"];

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Dashboard() {
  const [tab, setTab] = useState(0);
  const [solar, setSolar] = useState(0);
  const [battery, setBattery] = useState(0);
  const [wind, setWind] = useState(0);
  const [alert, setAlert] = useState(true);

  useEffect(() => {
    const targets = { solar: 78, battery: 92, wind: 14 };
    const start = performance.now();
    const dur = 1000;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setSolar(Math.round(targets.solar * e));
      setBattery(Math.round(targets.battery * e));
      setWind(Math.round(targets.wind * e));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      setSolar((s) => Math.max(40, Math.min(99, s + (Math.random() - 0.5) * 4)));
      setBattery((s) => Math.max(70, Math.min(100, s + (Math.random() - 0.5) * 2)));
      setWind((s) => Math.max(4, Math.min(40, s + (Math.random() - 0.5) * 3)));
    }, 2200);
    return () => clearInterval(i);
  }, []);

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
            className="mt-10 liquid-glass rounded-full inline-flex gap-0 p-1.5"
          >
            {tabs.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`relative px-5 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                  tab === i ? "bg-white text-black" : "text-white/70"
                }`}
              >
                {t}
              </button>
            ))}
          </motion.div>

          {/* Alert */}
          <AnimatePresence>
            {alert && (
              <motion.div
                initial={{ y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -16, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="liquid-glass mt-6 rounded-[1rem] p-4 flex items-center gap-3"
              >
                <AlertCircle className="h-5 w-5 text-white" strokeWidth={1.5} />
                <p className="flex-1 text-sm font-body text-white/90">
                  Wind speed exceeds optimal turbine range. Consider feathering blades.
                </p>
                <button className="liquid-glass rounded-full px-3 py-1.5 text-xs font-body text-white">Resolve</button>
                <button onClick={() => setAlert(false)} className="text-white/70 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard delay={0.9} icon={Sun} label="Solar generation" value={solar} unit="%" />
            <PowerRunwayCard delay={1.0} value={battery} />
            <StatCard delay={1.1} icon={Wind} label="Wind speed" value={wind} unit="km/h" />

          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.2, ease: "easeOut" }}
              className="liquid-glass lg:col-span-2 rounded-[1.25rem] p-6"
            >
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
                  <div key={s.l}>
                    <div className="liquid-glass icon-box-glass mb-3" style={{ width: 36, height: 36 }}>
                      <s.i className="h-4 w-4 text-white" strokeWidth={1.5} />
                    </div>
                    <p className="font-heading text-white text-2xl tracking-[-1px] leading-none">
                      {s.v}{" "}
                      <span className="text-xs text-white/60 font-body">{s.u}</span>
                    </p>
                    <p className="text-xs mt-1 text-white/60 font-body">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Sparkline */}
              <div className="mt-8">
                <p className="text-xs mb-3 text-white/60 font-body">24h energy balance</p>
                <Sparkline />
              </div>
            </motion.div>

            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.3, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] p-6"
            >
              <h3 className="font-heading text-white text-3xl tracking-[-1px] leading-none">Engine assistant</h3>
              <p className="mt-3 text-sm font-body font-light text-white/80 leading-snug">
                Forecast suggests 6 hours of high wind tonight. I've scheduled
                battery topping at 22:00 and locked the solar array for storm mode.
              </p>
              <div className="mt-5 space-y-2">
                <button className="liquid-glass rounded-full px-4 py-2.5 text-sm font-body font-medium text-white w-full">
                  Review schedule
                </button>
                <button className="bg-white text-black rounded-full px-4 py-2.5 text-sm font-body font-medium w-full">
                  Initiate relocation
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-[11px] uppercase tracking-[0.16em] mb-3 text-white/60 font-body">Modules online</p>
                {["Sleep", "Galley", "Solar", "Water", "Sensors"].map((m) => (
                  <div key={m} className="flex items-center justify-between py-2 text-sm font-body text-white/90">
                    <span>{m}</span>
                    <span className="liquid-glass tag-glass text-[10px]">OK</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, delay = 0 }: any) {
  const display = String(Math.round(value));
  return (
    <motion.div
      initial={blurInit}
      animate={blurIn}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className="liquid-glass rounded-[1.25rem] p-6 relative overflow-hidden"
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
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.18 }}
                className="font-heading text-white text-4xl tracking-[-1px] leading-none"
              >
                {display}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-white/60 font-body">{unit}</span>
          </div>
        </div>
        <svg width="68" height="68" viewBox="0 0 68 68" className="rotate-[-90deg]">
          <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
          <motion.circle
            cx="34"
            cy="34"
            r="28"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
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

function Sparkline() {
  const points = Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i * 0.45) * 18 + Math.cos(i * 0.2) * 6);
  const max = Math.max(...points),
    min = Math.min(...points);
  const w = 800,
    h = 120;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / (max - min)) * h;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#g)" />
      <motion.path
        d={path}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
      />
    </svg>
  );
}
