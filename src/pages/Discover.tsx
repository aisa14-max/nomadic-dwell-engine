import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpRight, MapPin, X, Thermometer, CloudRain, DollarSign, Wifi, Shield, Loader2, ChevronDown, Lock } from "lucide-react";
import { REGIONS, REGION_LABEL } from "@/data/regions";
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
  const { openOnboardingWithSite, user, openLogin } = useMockAuth();
  const navigate = useNavigate();
  // Set when this is the final step before the configurator, so the wait is
  // visible rather than the page appearing to freeze.
  const [loadingSite, setLoadingSite] = useState<string | null>(null);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const [focusedSite, setFocusedSite] = useState<typeof SITES[number] | null>(null);
  const [globeInteracted, setGlobeInteracted] = useState(false);

  // Eases the page so the planet sits in the middle of the screen. Used whenever
  // the globe is interacted with (site picked, continent/climate chosen, or the
  // planet itself dragged or clicked). Skips the scroll if it is already centred.
  const centerGlobe = () => {
    const el = globeRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (Math.abs(r.top + r.height / 2 - window.innerHeight / 2) < 60) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleShowOnMap = (s: typeof SITES[number]) => {
    setFocusedSite(s);
    centerGlobe();
  };

  // Touching the planet re-centres the page once the drag or click ends, so the
  // page never scrolls underneath the pointer mid-drag.
  const handleGlobePointerDown = () => {
    window.addEventListener("pointerup", centerGlobe, { once: true });
  };

  // Arriving from a tribe chapter's "Voyages nearby": open that region with the site focused.
  const location = useLocation();
  const focusTitle = (location.state as { focusSite?: string } | null)?.focusSite;
  useEffect(() => {
    const site = focusTitle ? SITES.find((s) => s.title === focusTitle) : undefined;
    if (!site) return;
    setSelectedRegion(site.regionId);
    setFocusedSite(site);
    const id = window.setTimeout(centerGlobe, 500);
    return () => window.clearTimeout(id);
  }, [focusTitle]);

  // The continent/climate filter pills sit above the globe, so picking one
  // doesn't bring it into view on its own — this does, matching how sites
  // in the sidebar already scroll to it via handleShowOnMap above.
  const scrollToGlobe = centerGlobe;

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
    if (!site || site.locked) return;
    const payload = {
      name:         site.title,
      location:     site.region,
      temperature:  site.temperature,
      precipitation: site.rainfall,
      climate_zone: site.climateId,
    };

    // Quick-start path: the questionnaire is already answered and we were sent
    // here purely to collect the missing site. Don't ask the questions again —
    // attach the site to the saved brief and go straight to the configurator.
    if (sessionStorage.getItem("awaitingSite") === "true") {
      sessionStorage.removeItem("awaitingSite");
      // Occupants + scale together pick which dwelling variant to land on —
      // same mapping as OnboardingFlow's CONFIGURATOR_ROUTES, kept in sync
      // here since quick-start reaches the configurator through this path
      // instead. Only compact-solo and couple-standard are fully built;
      // solo-generous ("spacious") routes to the couple page for now — see
      // OnboardingFlow.tsx for the full explanation.
      let target = "/configurator";
      try {
        const raw = localStorage.getItem("configuratorInit");
        const init = raw ? JSON.parse(raw) as Record<string, unknown> : {};
        const answers = (init.answers ?? {}) as Record<string, string>;
        const configuratorRoutes: Record<string, string> = {
          "solo:compact":    "/configurator-solo",
          "solo:generous":   "/configurator-couple",
          "couple:standard": "/configurator",
        };
        target = configuratorRoutes[`${answers.occupants}:${answers.scale}`] ?? target;
        localStorage.setItem("configuratorInit", JSON.stringify({ ...init, site: payload }));
      } catch { /* ignore — configurator falls back to defaults */ }

      const proceed = () => {
        setLoadingSite(site.title);
        // Brief hold so the loading state is actually seen before the route swap.
        window.setTimeout(() => navigate(target), 1400);
      };
      // The brief is only now complete, so this is the first and only point
      // we ask who they are — and not at all if they're already signed in.
      if (user) proceed();
      else openLogin(proceed);
      return;
    }

    // Sign-up now happens after the questionnaire, not before — see OnboardingFlow.
    openOnboardingWithSite(payload);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#02030a] text-white overflow-hidden">
      {/* Final-step loading state — the brief is complete and the dwelling is
          being assembled, so hold the user here rather than dropping them into
          an empty configurator. */}
      <AnimatePresence>
        {loadingSite && (
          <motion.div
            key="site-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-5 bg-[#02030a]/92 backdrop-blur-sm"
          >
            <div className="absolute w-72 h-72 rounded-full bg-white/5 blur-3xl animate-pulse" aria-hidden />
            <Loader2 className="relative h-10 w-10 text-white/80 animate-spin" strokeWidth={1.5} />
            <div className="relative text-center">
              <p className="font-body text-white/85 text-sm tracking-wide">
                Configuring your engine for {loadingSite}…
              </p>
              <p className="font-body text-white/40 text-[11px] uppercase tracking-[0.18em] mt-2">
                Matching your brief to the terrain
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      <div className="relative z-10 pt-32 pb-20">
        <div className="mx-auto max-w-[1400px] px-8 md:px-16 lg:px-20">
          {/* Header */}
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

          {/* Text-pill fallback for picking a continent — the globe is a WebGL
              canvas with no native keyboard/screen-reader path, so this is the
              only way in for anyone not dragging a 3D globe with a mouse. */}
          <motion.div
            initial={blurInit}
            animate={blurIn}
            transition={{ duration: 0.7, delay: 0.65, ease: "easeOut" }}
            className="mt-6 flex flex-wrap items-center justify-center gap-1.5"
            role="group"
            aria-label="Filter by continent"
          >
            {[{ id: "all" as const, label: "All" }, ...REGIONS].map((r) => {
              const isActive = selectedRegion === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => { setSelectedRegion(r.id); scrollToGlobe(); }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-body font-medium transition-colors ${
                    isActive ? "bg-white text-black" : "liquid-glass text-white/90"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Globe (wider, immersive) */}
        <div className="relative mx-auto max-w-[1800px] px-4 md:px-8 mt-10">
          <motion.div
            ref={globeRef}
            onPointerDown={handleGlobePointerDown}
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
              onFirstInteract={() => setGlobeInteracted(true)}
              sites={selectedRegion === "all" ? [] : visibleSites}
              onSiteClick={handleShowOnMap}
              onClose={() => setFocusedSite(null)}
              className="w-full h-[460px] md:h-[620px] lg:h-[680px]"
            />
            {/* Floating status/filter chip */}
            <div className="absolute top-3 right-3 z-20">
              <RegionChip region={selectedRegion} onClear={() => setSelectedRegion("all")} />
            </div>

            {/* Comet hint — just a soft glowing light with a short fading
                trail, sweeping left-to-right across the globe on a loop. No
                path, no arrowhead — the light itself is the whole hint. */}
            <AnimatePresence>
              {selectedRegion === "all" && !globeInteracted && (
                <motion.div
                  key="drag-hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
                >
                  <svg viewBox="0 0 100 100" className="w-[70%] max-w-[480px] aspect-square">
                    <defs>
                      <radialGradient id="discover-orbit-hint-glow">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    {/* Soft glowing head with a short trail of fading,
                        shrinking echoes close behind it — reads as one smooth
                        streak of light rather than separate dots. */}
                    {[
                      { r: 0.9, o: 0.08, delay: 0.2 },
                      { r: 1.15, o: 0.16, delay: 0.15 },
                      { r: 1.4, o: 0.28, delay: 0.1 },
                      { r: 1.7, o: 0.45, delay: 0.05 },
                      { r: 2.6, o: 0.85, delay: 0, glow: true },
                    ].map((dot, i) => (
                      <motion.circle
                        key={i}
                        r={dot.r}
                        fill={dot.glow ? "url(#discover-orbit-hint-glow)" : "#fff"}
                        fillOpacity={dot.glow ? 1 : dot.o}
                        initial={{ cx: 88, cy: 59, opacity: 0 }}
                        animate={{ cx: [88, 50, 12, 12], cy: [59, 68, 59, 59], opacity: [0, dot.o, dot.o, 0] }}
                        transition={{
                          duration: 2,
                          times: [0, 0.5, 0.85, 1],
                          repeat: Infinity,
                          repeatDelay: 1.3,
                          delay: dot.delay,
                          ease: "easeInOut",
                        }}
                      />
                    ))}
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt to pick a continent — pairs with the idle pulse on the
                globe's continent shapes; both disappear on first interaction. */}
            <AnimatePresence>
              {selectedRegion === "all" && (
                <motion.div
                  key="continent-callout"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
                >
                  <span className="liquid-glass rounded-full px-5 py-2 text-sm font-body text-white/90">
                    Select a continent to begin
                  </span>
                  <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronDown className="h-5 w-5 text-white/70" strokeWidth={2} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Locations panel — docked to the globe box itself (same height,
              scrolls with it) rather than floating over the full viewport. */}
          <AnimatePresence>
            {selectedRegion !== "all" && (
              <motion.aside
                key="region-sidebar"
                initial={{ x: -360, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -360, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="absolute left-4 md:left-8 top-4 bottom-4 w-[360px] z-30 liquid-glass rounded-2xl flex flex-col overflow-hidden"
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
                          onClick={() => { setSelectedClimate(c.id); scrollToGlobe(); }}
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
                              <div className="relative shrink-0">
                                <img
                                  src={s.image}
                                  alt=""
                                  loading="lazy"
                                  className={`w-20 h-20 rounded-lg object-cover border border-white/10 ${
                                    s.locked ? "grayscale opacity-50" : ""
                                  }`}
                                />
                                {s.locked && (
                                  <span className="absolute inset-0 flex items-center justify-center">
                                    <Lock className="h-5 w-5 text-white/80" strokeWidth={1.75} />
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-heading text-base leading-tight truncate ${s.locked ? "text-white/70" : "text-white"}`}>
                                  {s.title}
                                </p>
                                <p className="text-[11px] text-white/60 font-body inline-flex items-center gap-1 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" /> {s.region}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {s.locked ? (
                                    <span className="text-[10px] font-body font-medium uppercase tracking-[0.1em] px-2 py-0.5 rounded-full inline-flex items-center gap-1 bg-white/10 text-white/70 border border-white/15">
                                      <Lock className="h-3 w-3 opacity-80" strokeWidth={2} />
                                      Coming soon
                                    </span>
                                  ) : (
                                    <>
                                      {chip("Temperature", Thermometer, s.temperature)}
                                      {chip("Rainfall", CloudRain, s.rainfall)}
                                      {chip("Cost of living", DollarSign, s.costOfLiving, levelTone(s.costOfLiving))}
                                      {chip("Internet speed", Wifi, s.internetSpeed, netTone(s.internetSpeed))}
                                      {chip("Safety", Shield, s.safety, levelTone(s.safety))}
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>
                            {active && !s.locked && (
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
        </div>
      </div>
    </div>
  );
}
