import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, MapPin, Heart, Thermometer, CloudRain, Wallet, Wifi, ShieldCheck } from "lucide-react";
import BlurText from "@/components/BlurText";
import voyageBg from "@/assets/voyage-bg.jpg";
import RegionGlobe from "@/components/RegionGlobe";
import RegionChip from "@/components/RegionChip";
import { useMockAuth } from "@/context/MockAuth";
import { SITES } from "@/data/sites";
import type { RegionId } from "@/data/regions";
import { CLIMATES, type ClimateId } from "@/data/climates";

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

export default function Discover() {
  const [selectedClimate, setSelectedClimate] = useState<ClimateId | "all">("all");
  const [selectedRegion, setSelectedRegion] = useState<RegionId | "all">("all");
  const navigate = useNavigate();
  const { user, openLogin } = useMockAuth();

  const visibleSites = useMemo(
    () =>
      SITES.filter(
        (s) =>
          (selectedRegion === "all" || s.regionId === selectedRegion) &&
          (selectedClimate === "all" || s.climateId === selectedClimate),
      ),
    [selectedRegion, selectedClimate],
  );

  const handleConfigure = () => {
    if (user) navigate("/configurator");
    else openLogin(() => navigate("/configurator"));
  };

  return (
    <div className="relative min-h-screen w-full bg-[#01030f] text-white overflow-hidden">
      <VoyageScene className="fixed inset-0 w-full h-full z-0 opacity-80" />
      <div className="fixed inset-0 z-0 bg-[#020618]/55" aria-hidden />
      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-20">
        <div className="mx-auto max-w-[1400px]">
          {/* Header */}
          <p className="text-sm font-body text-white/80 mb-4 text-center">// Voyages</p>
          <div className="max-w-3xl mx-auto text-center">
            <BlurText
              text="Find terrain that matches your engine."
              className="font-heading text-white text-5xl md:text-6xl lg:text-[5rem] leading-[0.9] tracking-[-3px]"
            />
          </div>
          <motion.p
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
            className="mt-6 max-w-xl mx-auto text-center text-sm md:text-base text-white/80 font-body font-light leading-tight"
          >
            Browse pre-cleared parcels worldwide. Every site reports live solar, wind, and water yields.
          </motion.p>

          {/* Globe */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
            className="mt-10 liquid-glass rounded-[1.5rem] overflow-hidden"
          >
            <RegionGlobe
              selectedRegion={selectedRegion}
              onSelect={setSelectedRegion}
              className="w-full h-[420px] md:h-[520px]"
            />
          </motion.div>

          {/* Active region chip */}
          <div className="mt-5">
            <RegionChip region={selectedRegion} onClear={() => setSelectedRegion("all")} />
          </div>

          {/* Filter pills */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {[{ id: "all" as const, label: "All climates" }, ...CLIMATES].map((c) => {
              const isActive = selectedClimate === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClimate(c.id)}
                  className={`px-4 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                    isActive ? "bg-white text-black" : "liquid-glass text-white/90"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </motion.div>

          {/* Cards grid */}
          {visibleSites.length === 0 ? (
            <p className="mt-10 text-white/70 font-body text-sm">
              No voyages charted here yet. Try another region.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleSites.map((s, i) => (
                <motion.article
                  key={s.title}
                  initial={{ filter: "blur(10px)", opacity: 0, y: 30 }}
                  animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.25rem] p-6 flex flex-col min-h-[280px]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="liquid-glass icon-box-glass">
                      <MapPin className="h-5 w-5 text-white" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5 max-w-[65%]">
                      <span className="liquid-glass tag-glass">Available</span>
                    </div>
                  </div>
                  <div className="flex-1" />
                  <div className="mt-6">
                    <p className="text-xs text-white/70 font-body inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.region}
                    </p>
                    <div className="mt-3">
                      <img
                        src={s.image}
                        alt={`${s.title} landscape`}
                        loading="lazy"
                        className="w-full h-56 rounded-xl object-cover border border-white/15"
                      />
                      <h3 className="mt-4 font-heading text-white text-3xl md:text-[2.25rem] tracking-[-1px] leading-none">
                        {s.title}
                      </h3>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      <span className="liquid-glass tag-glass">
                        <Thermometer className="h-3 w-3" /> {s.temperature}
                      </span>
                      <span className="liquid-glass tag-glass">
                        <CloudRain className="h-3 w-3" /> {s.rainfall}
                      </span>
                      <span className="liquid-glass tag-glass">
                        <Wallet className="h-3 w-3" /> {s.costOfLiving}
                      </span>
                      <span className="liquid-glass tag-glass">
                        <Wifi className="h-3 w-3" /> {s.internetSpeed}
                      </span>
                      <span className="liquid-glass tag-glass">
                        <ShieldCheck className="h-3 w-3" /> {s.safety}
                      </span>
                    </div>
                    <div className="mt-5 flex items-center gap-3">
                      <button
                        onClick={handleConfigure}
                        className="liquid-glass-strong rounded-full px-4 py-2 text-xs font-body font-medium text-white inline-flex items-center gap-1.5"
                      >
                        Configure <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                      </button>
                      <button className="liquid-glass w-9 h-9 rounded-full flex items-center justify-center text-white">
                        <Heart className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
