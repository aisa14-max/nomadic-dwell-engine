import { motion } from "framer-motion";
import { useState } from "react";
import { MapPin, Heart, Sliders, Sun, Wind, Drop } from "@phosphor-icons/react";
import forest from "@/assets/dest-forest.jpg";
import coast from "@/assets/dest-coast.jpg";
import desert from "@/assets/dest-desert.jpg";
import highland from "@/assets/dest-highland.jpg";
import hero from "@/assets/hero-landscape.jpg";

const ease = [0.16, 1, 0.3, 1] as const;

const filters = ["All terrain", "Forest", "Coastal", "Desert", "Alpine", "Moor", "< 7 days", "Long-stay"];

const sites = [
  { img: forest, title: "Pine Hollow", region: "Lapland, SE", solar: "5.1", wind: "12", water: "Stream", climate: "Sub-arctic" },
  { img: coast, title: "Mýrar Cliff", region: "Faroe, FO", solar: "3.8", wind: "34", water: "Rain", climate: "Maritime" },
  { img: desert, title: "Atacama Plateau", region: "Antofagasta, CL", solar: "9.2", wind: "8", water: "Tank", climate: "Arid alpine" },
  { img: highland, title: "Skye Moor", region: "Highlands, UK", solar: "3.2", wind: "26", water: "Spring", climate: "Temperate" },
  { img: hero, title: "Mosi Plains", region: "Suðurland, IS", solar: "4.0", wind: "22", water: "Glacial", climate: "Sub-arctic" },
  { img: forest, title: "Black Pines", region: "Karelia, FI", solar: "4.6", wind: "10", water: "Lake", climate: "Boreal" },
];

export default function Discover() {
  const [active, setActive] = useState(0);

  return (
    <div className="pt-28 px-6 pb-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "#6B6660" }}>Discovery</p>
            <h1 className="mt-2 font-display text-[44px] leading-tight">Find terrain that matches your engine.</h1>
          </div>
          <button className="btn-pill btn-secondary"><Sliders size={14} /> Advanced filters</button>
        </div>

        {/* Filter pills */}
        <div className="mt-8 flex flex-wrap gap-2">
          {filters.map((f, i) => {
            const isActive = i === active;
            return (
              <motion.button
                key={f}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: i * 0.04, ease }}
                onClick={() => setActive(i)}
                className="relative inline-flex items-center px-4 h-9 rounded-full text-[13px] font-medium overflow-hidden border"
                style={{
                  borderColor: isActive ? "#1A1A17" : "rgba(0,0,0,0.15)",
                  color: isActive ? "#FBFAF8" : "#1A1A17",
                  background: "transparent",
                  borderWidth: "0.5px",
                  transition: "color 200ms cubic-bezier(0.16,1,0.3,1), border-color 200ms",
                }}
              >
                <span
                  className="absolute inset-0"
                  style={{
                    background: "#1A1A17",
                    clipPath: isActive ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
                    transition: "clip-path 200ms cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
                <span className="relative z-10">{f}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {sites.map((s, i) => {
              const row = Math.floor(i / 3);
              const col = i % 3;
              return (
                <motion.article
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: row * 0.08 + col * 0.05, ease }}
                  className="group card-a overflow-hidden relative"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={s.img} alt={s.title} loading="lazy" className="w-full h-full object-cover img-tint transition-transform duration-[300ms] group-hover:scale-[1.04]" />
                  </div>

                  {/* hover actions */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 translate-y-1.5 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                    <button className="btn-pill sm" style={{ background: "rgba(15,15,13,0.85)", color: "#FBFAF8" }}>Configure</button>
                    <button className="w-8 h-8 rounded-full inline-flex items-center justify-center" style={{ background: "rgba(15,15,13,0.85)", color: "#FBFAF8" }}>
                      <Heart size={14} />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-[19px]">{s.title}</h3>
                        <p className="text-[12px] mt-0.5 inline-flex items-center gap-1" style={{ color: "#6B6660" }}>
                          <MapPin size={11} /> {s.region}
                        </p>
                      </div>
                      <span className="tag-pill tag-neutral">{s.climate}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="tag-pill tag-green"><Sun size={11} weight="bold" /> {s.solar} kWh</span>
                      <span className="tag-pill tag-green"><Wind size={11} weight="bold" /> {s.wind} km/h</span>
                      <span className="tag-pill tag-green"><Drop size={11} weight="bold" /> {s.water}</span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {/* Map panel */}
          <motion.aside
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease }}
            className="hidden lg:block sticky top-28 h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border"
            style={{ background: "#F0EDE6", borderColor: "rgba(0,0,0,0.08)" }}
          >
            <div className="relative w-full h-full">
              {/* Stylised map */}
              <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="400" height="600" fill="url(#grid)" />
                <path d="M 30 200 Q 120 150 180 220 T 360 200 L 380 400 Q 280 460 200 420 T 40 400 Z" fill="rgba(107,148,85,0.18)" stroke="rgba(107,148,85,0.4)" strokeWidth="0.5" />
                <path d="M 60 300 Q 130 280 200 320 T 340 310" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              </svg>

              {[
                { x: 22, y: 38 }, { x: 55, y: 28 }, { x: 38, y: 58 },
                { x: 70, y: 65 }, { x: 48, y: 75 }, { x: 30, y: 50 },
              ].map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 + i * 0.06, ease }}
                  className="absolute"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: "#1A1A17", boxShadow: "0 0 0 4px rgba(138,184,110,0.25)" }} />
                </motion.div>
              ))}

              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[12px]" style={{ color: "#6B6660" }}>
                <span>{sites.length} sites in view</span>
                <button className="btn-pill sm btn-secondary">Expand map</button>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
