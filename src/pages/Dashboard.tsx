import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Sun, BatteryHigh as Battery, Wind, Drop, Thermometer, WarningCircle, X, House, Leaf } from "@phosphor-icons/react";

const ease = [0.16, 1, 0.3, 1] as const;
const tabs = ["Overview", "Energy", "Climate", "Activity"];

export default function Dashboard() {
  const [tab, setTab] = useState(0);
  const [solar, setSolar] = useState(0);
  const [battery, setBattery] = useState(0);
  const [wind, setWind] = useState(0);
  const [alert, setAlert] = useState(true);

  // Initial count-up
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

  // Live tick
  useEffect(() => {
    const i = setInterval(() => {
      setSolar((s) => Math.max(40, Math.min(99, s + (Math.random() - 0.5) * 4)));
      setBattery((s) => Math.max(70, Math.min(100, s + (Math.random() - 0.5) * 2)));
      setWind((s) => Math.max(4, Math.min(40, s + (Math.random() - 0.5) * 3)));
    }, 2200);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="pt-28 px-6 pb-16 min-h-screen">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#9A9589" }}>Live operation</p>
            <h1 className="mt-2 font-display text-[40px] leading-tight" style={{ color: "#E8E3D8" }}>Skye Moor · Engine 04A</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="tag-pill tag-green pulse-nominal">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#8AB86E" }} />
              All systems nominal
            </span>
            <span className="tag-pill tag-neutral">Last sync 4s ago</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 p-1 rounded-full w-fit" style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}>
          {tabs.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className="relative px-5 h-9 rounded-full text-[13px] font-medium" style={{ color: tab === i ? "#E8E3D8" : "#9A9589" }}>
              {tab === i && (
                <motion.span layoutId="tab-indicator" className="absolute inset-0 rounded-full" style={{ background: "#2A2A25" }} transition={{ duration: 0.25, ease }} />
              )}
              <span className="relative z-10">{t}</span>
            </button>
          ))}
        </div>

        {/* Alert */}
        <AnimatePresence>
          {alert && (
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="mt-6 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(160,118,94,0.08)", border: "0.5px solid rgba(160,118,94,0.4)" }}
            >
              <WarningCircle size={18} color="#A0765E" weight="regular" />
              <div className="flex-1">
                <p className="text-[13px]" style={{ color: "#E8E3D8" }}>Wind speed exceeds optimal turbine range. Consider feathering blades.</p>
              </div>
              <button className="btn-pill sm btn-secondary">Resolve</button>
              <button onClick={() => setAlert(false)} className="icon-bare w-8 h-8" style={{ color: "#E8E3D8" }}>
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard delay={0.0} icon={Sun} label="Solar generation" value={solar} unit="%" arc />
          <StatCard delay={0.1} icon={Battery} label="Battery state" value={battery} unit="%" arc />
          <StatCard delay={0.2} icon={Wind} label="Wind speed" value={wind} unit="km/h" arc />
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Climate panel */}
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[20px]" style={{ color: "#E8E3D8" }}>Internal climate</h3>
              <span className="tag-pill tag-green">Stable</span>
            </div>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { i: Thermometer, l: "Temp", v: "19.4", u: "°C" },
                { i: Drop, l: "Humidity", v: "48", u: "%" },
                { i: Leaf, l: "Air quality", v: "AQI 12", u: "" },
                { i: House, l: "Occupied", v: "2", u: "guests" },
              ].map((s, i) => (
                <motion.div
                  key={s.l}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06, ease }}
                >
                  <div className="icon-box mb-3"><s.i size={18} color="#8AB86E" /></div>
                  <p className="font-mono-data text-[22px]" style={{ color: "#E8E3D8" }}>{s.v} <span className="text-[12px]" style={{ color: "#9A9589" }}>{s.u}</span></p>
                  <p className="text-[12px] mt-0.5" style={{ color: "#9A9589" }}>{s.l}</p>
                </motion.div>
              ))}
            </div>

            {/* Sparkline */}
            <div className="mt-8">
              <p className="text-[12px] mb-3" style={{ color: "#9A9589" }}>24h energy balance</p>
              <Sparkline />
            </div>
          </div>

          {/* Side */}
          <div className="rounded-2xl p-6" style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <h3 className="font-display text-[20px]" style={{ color: "#E8E3D8" }}>Engine assistant</h3>
            <p className="mt-3 text-[13px] font-light" style={{ color: "#9A9589" }}>
              Forecast suggests 6 hours of high wind tonight. I've scheduled
              battery topping at 22:00 and locked the solar array for storm mode.
            </p>
            <div className="mt-5 space-y-2">
              <button className="btn-pill btn-secondary w-full">Review schedule</button>
              <button className="btn-pill btn-deploy w-full">Initiate relocation</button>
            </div>

            <div className="mt-8 pt-6 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[11px] uppercase tracking-[0.16em] mb-3" style={{ color: "#9A9589" }}>Modules online</p>
              {["Sleep", "Galley", "Solar", "Water", "Sensors"].map((m, i) => (
                <div key={m} className="flex items-center justify-between py-2 text-[13px]" style={{ color: "#E8E3D8" }}>
                  <span>{m}</span>
                  <span className="tag-pill tag-green text-[10px]">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, unit, delay = 0, arc }: any) {
  const display = String(Math.round(value));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease }}
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="icon-box"><Icon size={18} color="#8AB86E" /></div>
          <p className="text-[12px] mt-4" style={{ color: "#9A9589" }}>{label}</p>
          <div className="mt-2 flex items-baseline gap-2 overflow-hidden h-[44px]">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={display}
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ duration: 0.18 }}
                className="font-mono-data text-[40px] leading-none"
                style={{ color: "#E8E3D8" }}
              >
                {display}
              </motion.span>
            </AnimatePresence>
            <span className="font-mono-data text-[14px]" style={{ color: "#9A9589" }}>{unit}</span>
          </div>
        </div>
        {arc && (
          <svg width="68" height="68" viewBox="0 0 68 68" className="rotate-[-90deg]">
            <circle cx="34" cy="34" r="28" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
            <motion.circle
              cx="34" cy="34" r="28" fill="none"
              stroke="#8AB86E" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 28 * (1 - Math.min(100, value) / 100) }}
              transition={{ duration: 0.8, ease: [0, 0, 0.2, 1] }}
            />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

function Sparkline() {
  const points = Array.from({ length: 28 }, (_, i) => 30 + Math.sin(i * 0.45) * 18 + Math.cos(i * 0.2) * 6);
  const max = Math.max(...points), min = Math.min(...points);
  const w = 800, h = 120;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min)) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[120px]">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8AB86E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8AB86E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill="url(#g)" />
      <motion.path
        d={path}
        fill="none"
        stroke="#8AB86E"
        strokeWidth="1.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0, 0, 0.2, 1] }}
      />
    </svg>
  );
}
