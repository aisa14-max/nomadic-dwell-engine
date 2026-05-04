import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Heart, Sun, Wind, Droplets } from "lucide-react";
import VoyageScene from "@/components/VoyageScene";
import BlurText from "@/components/BlurText";

const filters = ["All terrain", "Forest", "Coastal", "Desert", "Alpine", "Moor", "< 7 days", "Long-stay"];

const sites = [
  { title: "Pine Hollow", region: "Lapland, SE", solar: "5.1", wind: "12", water: "Stream", climate: "Sub-arctic" },
  { title: "Mýrar Cliff", region: "Faroe, FO", solar: "3.8", wind: "34", water: "Rain", climate: "Maritime" },
  { title: "Atacama Plateau", region: "Antofagasta, CL", solar: "9.2", wind: "8", water: "Tank", climate: "Arid alpine" },
  { title: "Skye Moor", region: "Highlands, UK", solar: "3.2", wind: "26", water: "Spring", climate: "Temperate" },
  { title: "Mosi Plains", region: "Suðurland, IS", solar: "4.0", wind: "22", water: "Glacial", climate: "Sub-arctic" },
  { title: "Black Pines", region: "Karelia, FI", solar: "4.6", wind: "10", water: "Lake", climate: "Boreal" },
];

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Discover() {
  const [active, setActive] = useState(0);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <VoyageScene className="fixed inset-0 w-full h-full z-0" />
      <div className="fixed inset-0 z-0 bg-black/40" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-20">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <p className="text-sm font-body text-white/80 mb-4">// Voyages</p>
          <div className="max-w-3xl">
            <BlurText
              text="Find terrain that matches your engine."
              className="font-heading text-white text-5xl md:text-6xl lg:text-[5rem] leading-[0.9] tracking-[-3px]"
            />
          </div>
          <motion.p
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="mt-6 max-w-xl text-sm md:text-base text-white/80 font-body font-light leading-tight"
          >
            Browse pre-cleared parcels worldwide. Every site reports live solar, wind, and water yields.
          </motion.p>

          {/* Filter pills */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
            className="mt-10 flex flex-wrap gap-2"
          >
            {filters.map((f, i) => {
              const isActive = i === active;
              return (
                <button
                  key={f}
                  onClick={() => setActive(i)}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                    isActive ? "bg-white text-black" : "liquid-glass text-white/90"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </motion.div>

          {/* Cards grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((s, i) => (
              <motion.article
                key={s.title}
                initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.9 + i * 0.08, ease: "easeOut" }}
                className="liquid-glass rounded-[1.25rem] p-6 flex flex-col min-h-[280px]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="liquid-glass icon-box-glass">
                    <MapPin className="h-5 w-5 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[65%]">
                    <span className="liquid-glass tag-glass">{s.climate}</span>
                    <span className="liquid-glass tag-glass">Available</span>
                  </div>
                </div>
                <div className="flex-1" />
                <div className="mt-6">
                  <p className="text-xs text-white/70 font-body inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {s.region}
                  </p>
                  <h3 className="font-heading text-white text-3xl md:text-[2.25rem] tracking-[-1px] leading-none mt-2">
                    {s.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="liquid-glass tag-glass">
                      <Sun className="h-3 w-3" /> {s.solar} kWh
                    </span>
                    <span className="liquid-glass tag-glass">
                      <Wind className="h-3 w-3" /> {s.wind} km/h
                    </span>
                    <span className="liquid-glass tag-glass">
                      <Droplets className="h-3 w-3" /> {s.water}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-3">
                    <Link
                      to="/configurator"
                      className="liquid-glass-strong rounded-full px-4 py-2 text-xs font-body font-medium text-white inline-flex items-center gap-1.5"
                    >
                      Configure <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                    </Link>
                    <button className="liquid-glass w-9 h-9 rounded-full flex items-center justify-center text-white">
                      <Heart className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
