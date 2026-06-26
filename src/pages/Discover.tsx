import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, MapPin, X, Thermometer, CloudRain, DollarSign, Wifi, Shield } from "lucide-react";
import { REGION_LABEL } from "@/data/regions";
import BlurText from "@/components/BlurText";
import NightSkyScene from "@/components/NightSkyScene";
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
  const { user, openLoginForSite, openOnboardingWithSite } = useMockAuth();
  const globeRef = useRef<HTMLDivElement | null>(null);
  const [focusedSite, setFocusedSite] = useState<typeof SITES[number] | null>(null);

  const handleShowOnMap = (s: typeof SITES[number]) => {
    setFocusedSite(s);
    globeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleRegionSelect = (id: RegionId) => {
    setSelectedRegion(id);
  };

  const visibleSites = useMemo(
    () =>
      SITES.filter(
        (s) =>
          (selectedRegion === "all" || s.regionId === selectedRegion) &&
          (selectedClimate === "all" || s.climateId === selectedClimate),
      ),
    [selectedRegion, selectedClimate],
  );

  const handleConfigure = (s?: typeof SITES[number]) => {
    const site = s ?? focusedSite;
    if (!site) return;
    const payload = {
      name:         site.title,
      location:     site.region,
      temperature:  site.temperature,
      precipitation: site.rainfall,
      climate_zone: site.climateId,
    };
    if (user) openOnboardingWithSite(payload);
    else openLoginForSite(payload);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#02030a] text-white overflow-hidden">
      {/* Animated stars-at-night background */}
      <NightSkyScene className="fixed inset-0 w-full h-full z-0" />
      {/* Subtle vignette for legibility */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(2,3,10,0.7) 100%)",
        }}
      />

      {/* Continent locations + climate filters panel */}
      <AnimatePresence>
        {selectedRegion !== "all" && (
          <motion.aside
            key="region-sidebar"
            initial={{ x: -360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -360, opacity: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="fixed left-4 top-24 bottom-4 w-[360px] z-30 liquid-glass rounded-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-white/10">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-body">Locations</p>
                <h2 className="font-heading text-white text-2xl leading-none mt-1 truncate">
                  {REGION_LABEL[selectedRegion as Exclude<typeof selectedRegion, "all">]}
                </h2>
                <p className="text-xs text-white/60 font-body mt-1">{visibleSites.length} sites</p>
              </div>
              <button
                onClick={() => { setSelectedRegion("all"); setFocusedSite(null); setSelectedClimate("all"); }}
                className="liquid-glass w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Climate filters */}
            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/60 font-body mb-2">Climate</p>
              <div className="flex flex-wrap gap-1.5">
                {[{ id: "all" as const, label: "All" }, ...CLIMATES].map((c) => {
                  const isActive = selectedClimate === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClimate(c.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-body font-medium transition-colors ${
                        isActive ? "bg-white text-black" : "liquid-glass text-white/90"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {visibleSites.length === 0 ? (
                <p className="text-white/60 text-sm font-body p-3">No locations match these filters.</p>
              ) : (
                visibleSites.map((s) => {
                  const active = focusedSite?.title === s.title;
                  const chip = (label: string, Icon: typeof Thermometer, value: string, tone: "low" | "mid" | "high" = "mid") => {
                    const toneCls =
                      tone === "high"
                        ? "bg-white/15 text-white"
                        : tone === "low"
                        ? "bg-white/5 text-white/60"
                        : "bg-white/10 text-white/85";
                    return (
                      <span key={label} title={label} className={`text-[10px] font-body px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${toneCls}`}>
                        <Icon className="h-3 w-3 opacity-70" strokeWidth={2} />
                        {value}
                      </span>
                    );
                  };
                  const levelTone = (l: "Low" | "Medium" | "High") =>
                    (l === "High" ? "high" : l === "Low" ? "low" : "mid") as "low" | "mid" | "high";
                  const netTone = (n: "Slow" | "Medium" | "Fast") =>
                    (n === "Fast" ? "high" : n === "Slow" ? "low" : "mid") as "low" | "mid" | "high";
                  return (
                    <div
                      key={s.title}
                      className={`rounded-xl p-2 transition-colors ${
                        active ? "bg-white/15" : "hover:bg-white/8"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleShowOnMap(s)}
                          className="flex items-start gap-3 min-w-0 flex-1 text-left"
                        >
                          <img
                            src={s.image}
                            alt=""
                            loading="lazy"
                            className="w-20 h-20 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-heading text-white text-base leading-tight truncate">{s.title}</p>
                            <p className="text-[11px] text-white/60 font-body inline-flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 shrink-0" /> {s.region}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {chip("Temperature", Thermometer, s.temperature)}
                              {chip("Rainfall", CloudRain, s.rainfall)}
                              {chip("Cost of living", DollarSign, s.costOfLiving, levelTone(s.costOfLiving))}
                              {chip("Internet speed", Wifi, s.internetSpeed, netTone(s.internetSpeed))}
                              {chip("Safety", Shield, s.safety, levelTone(s.safety))}
                            </div>
                          </div>
                        </button>
                        {active && (
                          <button
                            onClick={() => handleConfigure()}
                            className="liquid-glass-strong rounded-full px-2.5 py-1.5 text-[10px] font-body font-medium text-white inline-flex items-center gap-1 shrink-0"
                          >
                            Configure <ArrowUpRight className="h-3 w-3" strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="relative z-10 pt-32 pb-20">
        <div className="mx-auto max-w-[1400px] px-8 md:px-16 lg:px-20">
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
            Browse pre-cleared parcels worldwide. Tap a continent to reveal its sites.
          </motion.p>
        </div>

        {/* Globe (wider, immersive) */}
        <div className="mx-auto max-w-[1800px] px-4 md:px-8 mt-10">
          <motion.div
            ref={globeRef}
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
            className="relative liquid-glass rounded-[1.5rem] overflow-hidden scroll-mt-24"
          >
            <RegionGlobe
              selectedRegion={selectedRegion}
              onSelect={handleRegionSelect}
              focusPoint={focusedSite?.coords ?? null}
              focusLabel={focusedSite?.title}
              focusSite={focusedSite}
              onViewSite={() => handleConfigure()}
              className="w-full h-[460px] md:h-[620px] lg:h-[680px]"
            />
            {/* Floating status/filter chip */}
            <div className="absolute top-3 right-3 z-20">
              <RegionChip region={selectedRegion} onClear={() => setSelectedRegion("all")} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
