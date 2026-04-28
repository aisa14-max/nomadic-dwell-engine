import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Bed, Cookie, Drop, Sun, Wind, Wrench, Plus, Check, Cube, ArrowsClockwise, MagnifyingGlassPlus, MagnifyingGlassMinus } from "@phosphor-icons/react";
import dwelling from "@/assets/dwelling-iso.png";

const ease = [0.16, 1, 0.3, 1] as const;

type Mod = { id: string; name: string; icon: any; cat: string; kwh: number; weight: number; };

const modules: Mod[] = [
  { id: "sleep", name: "Sleeping pod", icon: Bed, cat: "Habitation", kwh: 0.4, weight: 280 },
  { id: "kitchen", name: "Galley module", icon: Cookie, cat: "Habitation", kwh: 1.2, weight: 320 },
  { id: "water", name: "Water reclaim", icon: Drop, cat: "Systems", kwh: 0.6, weight: 210 },
  { id: "solar", name: "Solar array", icon: Sun, cat: "Energy", kwh: -4.2, weight: 140 },
  { id: "wind", name: "Wind turbine", icon: Wind, cat: "Energy", kwh: -1.8, weight: 95 },
  { id: "workshop", name: "Workshop bay", icon: Wrench, cat: "Aux", kwh: 0.8, weight: 360 },
];

export default function Configurator() {
  const [added, setAdded] = useState<string[]>(["sleep", "solar", "water"]);
  const [draft, setDraft] = useState({ kwh: 0, weight: 0 });

  useEffect(() => {
    const sel = modules.filter((m) => added.includes(m.id));
    setDraft({
      kwh: sel.reduce((s, m) => s + m.kwh, 0),
      weight: sel.reduce((s, m) => s + m.weight, 0),
    });
  }, [added]);

  const toggle = (id: string) =>
    setAdded((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div className="pt-28 px-6 pb-12 min-h-screen">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#9A9589" }}>Configurator</p>
            <h1 className="mt-2 font-display text-[40px] leading-tight" style={{ color: "#E8E3D8" }}>Compose your engine.</h1>
          </div>
          <div className="flex gap-2">
            <button className="btn-pill btn-secondary">Save draft</button>
            <button className="btn-pill btn-deploy">Continue to plan</button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[300px_1fr_280px] gap-5">
          {/* MODULES PANEL */}
          <aside>
            <h3 className="text-[12px] uppercase tracking-[0.16em] mb-3" style={{ color: "#9A9589" }}>Modules</h3>
            <div className="space-y-2">
              {modules.map((m) => {
                const on = added.includes(m.id);
                return (
                  <motion.button
                    key={m.id}
                    onClick={() => toggle(m.id)}
                    layout
                    className="group w-full text-left rounded-2xl p-4 flex items-center gap-3 border"
                    style={{
                      background: on ? "#1C1C19" : "#161614",
                      borderColor: on ? "rgba(138,184,110,0.35)" : "rgba(255,255,255,0.06)",
                      transition: "background-color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms",
                    }}
                  >
                    <div className="icon-box" style={{ borderColor: on ? "#8AB86E" : undefined }}>
                      <m.icon size={20} weight="regular" color={on ? "#8AB86E" : "#9A9589"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium" style={{ color: "#E8E3D8" }}>{m.name}</p>
                      <p className="text-[11px]" style={{ color: "#9A9589" }}>{m.cat} · {m.kwh > 0 ? `+${m.kwh}` : m.kwh} kWh</p>
                    </div>
                    <AnimatePresence>
                      {on ? (
                        <motion.span
                          key="added"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.18 }}
                          className="tag-pill tag-green"
                        >
                          <Check size={10} weight="bold" /> Added
                        </motion.span>
                      ) : (
                        <Plus size={16} className="opacity-50" color="#9A9589" />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </aside>

          {/* VIEWPORT */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease }}
              className="relative rounded-2xl overflow-hidden render-glow"
              style={{ background: "radial-gradient(ellipse at center, #1C1C19 0%, #0F0F0D 70%)", height: "62vh", border: "0.5px solid rgba(255,255,255,0.06)" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="autorotate">
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={added.join("-")}
                      src={dwelling}
                      alt="Modular dwelling render"
                      initial={{ scale: 1.06, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4, ease }}
                      className="max-h-[55vh] max-w-[80%] object-contain drop-shadow-[0_30px_60px_rgba(138,184,110,0.15)]"
                    />
                  </AnimatePresence>
                </div>
              </div>

              {/* Toolbar */}
              <div className="absolute top-4 right-4 flex flex-col gap-3 p-2 rounded-full" style={{ background: "rgba(15,15,13,0.6)" }}>
                {[Cube, ArrowsClockwise, MagnifyingGlassPlus, MagnifyingGlassMinus].map((I, i) => (
                  <button key={i} className="icon-bare w-8 h-8" style={{ color: "#E8E3D8" }}>
                    <I size={16} />
                  </button>
                ))}
              </div>

              {/* Floating tags */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="tag-pill tag-green">{added.length} modules</span>
                <span className="tag-pill tag-neutral" style={{ color: "#9A9589" }}>Site: Skye Moor</span>
              </div>
            </motion.div>

            {/* Performance strip */}
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="Net energy" value={(-draft.kwh).toFixed(1)} unit="kWh/d" good={-draft.kwh >= 0} />
              <Stat label="Total mass" value={(draft.weight / 1000).toFixed(2)} unit="t" good={draft.weight < 1500} />
              <Stat label="Habitable" value={String(added.filter((id) => modules.find((m) => m.id === id)?.cat === "Habitation").length)} unit="modules" good />
              <Stat label="Climate fit" value="92" unit="%" good />
            </div>
          </div>

          {/* AI ASSIST */}
          <aside className="rounded-2xl p-5" style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full pulse-nominal" style={{ background: "#8AB86E" }} />
              <h3 className="text-[13px] font-medium" style={{ color: "#8AB86E" }}>Engine Assistant</h3>
            </div>
            <div className="mt-5 space-y-4 text-[13px] font-light" style={{ color: "#E8E3D8" }}>
              <AssistantMsg delay={0.1}>
                Your current setup yields a net surplus on Skye Moor. The wind turbine
                would push you well past 100% autonomy.
              </AssistantMsg>
              <AssistantMsg delay={0.6}>
                If you add the galley module, expect a 1.2 kWh/d draw — still within envelope.
              </AssistantMsg>
              <AssistantMsg delay={1.2} typing>
                Want me to suggest a deployment window with stable conditions
              </AssistantMsg>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, good }: { label: string; value: string; unit: string; good: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#161614", border: "0.5px solid rgba(255,255,255,0.06)" }}>
      <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "#9A9589" }}>{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <motion.span
          key={value}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="font-mono-data text-[26px]"
          style={{ color: "#E8E3D8" }}
        >
          {value}
        </motion.span>
        <span className="font-mono-data text-[12px]" style={{ color: "#9A9589" }}>{unit}</span>
      </div>
      <span className={`tag-pill mt-3 ${good ? "tag-green" : "tag-alert"}`}>{good ? "Good" : "Review"}</span>
    </div>
  );
}

function AssistantMsg({ children, delay = 0, typing = false }: { children: React.ReactNode; delay?: number; typing?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, maxHeight: 0 }}
      animate={{ opacity: 1, maxHeight: 200 }}
      transition={{ duration: 0.3, delay, ease }}
      className="overflow-hidden"
    >
      <p>
        {children}
        {typing && <span className="caret" style={{ color: "#8AB86E" }} />}
      </p>
    </motion.div>
  );
}
