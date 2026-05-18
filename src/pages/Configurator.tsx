import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Bed, Cookie, Droplets, Sun, Wind, Wrench, Plus, Check, Box, RotateCw, ZoomIn, ZoomOut, ArrowRight, X, Calendar, MapPin, Truck, Shield } from "lucide-react";
import BlurText from "@/components/BlurText";
import ClaimSpotScene from "@/components/ClaimSpotScene";
import dwelling from "@/assets/dwelling-iso.png";

type Mod = { id: string; name: string; icon: any; cat: string; kwh: number; weight: number };

const modules: Mod[] = [
  { id: "sleep", name: "Sleeping pod", icon: Bed, cat: "Habitation", kwh: 0.4, weight: 280 },
  { id: "kitchen", name: "Galley module", icon: Cookie, cat: "Habitation", kwh: 1.2, weight: 320 },
  { id: "water", name: "Water reclaim", icon: Droplets, cat: "Systems", kwh: 0.6, weight: 210 },
  { id: "solar", name: "Solar array", icon: Sun, cat: "Energy", kwh: -4.2, weight: 140 },
  { id: "wind", name: "Wind turbine", icon: Wind, cat: "Energy", kwh: -1.8, weight: 95 },
  { id: "workshop", name: "Workshop bay", icon: Wrench, cat: "Aux", kwh: 0.8, weight: 360 },
];

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Configurator() {
  const [added, setAdded] = useState<string[]>(["sleep", "solar", "water"]);
  const [draft, setDraft] = useState({ kwh: 0, weight: 0 });
  const [showNext, setShowNext] = useState(false);

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
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <ClaimSpotScene className="fixed inset-0 w-full h-full z-0" />
      <div className="fixed inset-0 z-0 bg-black/55" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-body text-white/80 mb-4">// Worlds</p>
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div className="max-w-3xl">
              <BlurText
                text="Compose your engine."
                className="font-heading text-white text-5xl md:text-6xl lg:text-[5rem] leading-[0.9] tracking-[-3px]"
              />
            </div>
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
              className="flex gap-3"
            >
              <button className="liquid-glass rounded-full px-5 py-2.5 text-sm font-body font-medium text-white">
                Save draft
              </button>
              <button
                onClick={() => setShowNext(true)}
                className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2"
              >
                Continue configuration <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] gap-5">
            {/* MODULES */}
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
            >
              <h3 className="text-xs uppercase tracking-[0.16em] mb-3 text-white/70 font-body">Modules</h3>
              <div className="space-y-2">
                {modules.map((m) => {
                  const on = added.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggle(m.id)}
                      className={`liquid-glass w-full text-left rounded-[1rem] p-4 flex items-center gap-3 transition-opacity ${
                        on ? "opacity-100" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="liquid-glass icon-box-glass" style={{ width: 36, height: 36 }}>
                        <m.icon className="h-4 w-4 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-white">{m.name}</p>
                        <p className="text-xs text-white/60 font-body">
                          {m.cat} · {m.kwh > 0 ? `+${m.kwh}` : m.kwh} kWh
                        </p>
                      </div>
                      <AnimatePresence>
                        {on ? (
                          <motion.span
                            key="added"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.18 }}
                            className="bg-white text-black rounded-full px-2 py-0.5 text-[10px] font-body font-semibold inline-flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" strokeWidth={3} /> Added
                          </motion.span>
                        ) : (
                          <Plus className="h-4 w-4 text-white/60" strokeWidth={1.5} />
                        )}
                      </AnimatePresence>
                    </button>
                  );
                })}
              </div>
            </motion.aside>

            {/* VIEWPORT */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
              className="relative"
            >
              <div
                className="liquid-glass relative rounded-[1.25rem] overflow-hidden"
                style={{ height: "58vh" }}
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
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="max-h-[50vh] max-w-[80%] object-contain drop-shadow-[0_30px_60px_rgba(255,255,255,0.08)]"
                      />
                    </AnimatePresence>
                  </div>
                </div>

                <div className="absolute top-4 right-4 liquid-glass rounded-full flex flex-col gap-1 p-1.5">
                  {[Box, RotateCw, ZoomIn, ZoomOut].map((I, i) => (
                    <button key={i} className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white">
                      <I className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>

                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <span className="liquid-glass tag-glass">{added.length} modules</span>
                  <span className="liquid-glass tag-glass">Site: Skye Moor</span>
                </div>
              </div>

              {/* Performance strip */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Net energy" value={(-draft.kwh).toFixed(1)} unit="kWh/d" />
                <Stat label="Total mass" value={(draft.weight / 1000).toFixed(2)} unit="t" />
                <Stat
                  label="Habitable"
                  value={String(added.filter((id) => modules.find((m) => m.id === id)?.cat === "Habitation").length)}
                  unit="modules"
                />
                <Stat label="Climate fit" value="92" unit="%" />
              </div>
            </motion.div>

            {/* AI ASSIST */}
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] p-5"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
              </div>
              <div className="mt-5 space-y-4 text-sm font-body font-light text-white/90">
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
            </motion.aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="liquid-glass rounded-[1rem] p-4">
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-body">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <motion.span
          key={value}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="font-heading text-white text-3xl tracking-[-1px] leading-none"
        >
          {value}
        </motion.span>
        <span className="text-xs text-white/60 font-body">{unit}</span>
      </div>
    </div>
  );
}

function AssistantMsg({ children, delay = 0, typing = false }: { children: React.ReactNode; delay?: number; typing?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, maxHeight: 0 }}
      animate={{ opacity: 1, maxHeight: 200 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <p>
        {children}
        {typing && <span className="caret text-white" />}
      </p>
    </motion.div>
  );
}
