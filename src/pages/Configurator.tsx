import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, RotateCw, ZoomIn, ZoomOut, ArrowRight, Send, Loader2, X, Map, MapPin, Navigation } from "lucide-react";
import BlurText from "@/components/BlurText";
import landscapeBg from "@/assets/configurator-landscape-bg.jpg";
import landscapeNamib from "@/assets/configurator-landscape-namib.png";
import landscapeHighland from "@/assets/configurator-landscape-highland.png";
import dwellingFg from "@/assets/configurator-dwelling-fg.png";
import sectionVol2 from "@/assets/configurator-section-vol2.png";
import topViewImg from "@/assets/configurator-top-view.jpg";
import interior1Img from "@/assets/configurator-interior-1.jpg";
import interior2Img from "@/assets/configurator-interior-2.jpg";
import assistantAvatar from "@/assets/engine-assistant-avatar.png";
import ReservationCustomizer from "@/components/worlds/ReservationCustomizer";
import { useMockAuth } from "@/context/MockAuth";
import { SITES } from "@/data/sites";

// No backend for this build — this page is being rebuilt for the show
// (static/baked scenarios instead of a live Python backend). See
// ConfiguratorPortfolio.tsx for the original, still-live-connected version.

const blurInit = { filter: "blur(10px)", opacity: 0, y: 20 };
const blurIn = { filter: "blur(0px)", opacity: 1, y: 0 };

/** Render simple LLM markdown: **bold**, line breaks, double-newline paragraphs. */
function renderMd(text: string) {
  return text.split(/\n\n+/).map((para, pi) => (
    <p key={pi} className={pi > 0 ? "mt-2" : ""}>
      {para.split("\n").map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.split(/\*\*(.+?)\*\*/g).map((seg, si) =>
            si % 2 === 1 ? <strong key={si}>{seg}</strong> : seg,
          )}
        </span>
      ))}
    </p>
  ));
}

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function Configurator() {
  const location = useLocation();
  const { selectedPlan } = useMockAuth();
  const [showNext, setShowNext] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(true);
  const [siteSelectorView, setSiteSelectorView] = useState<"map" | "pin" | "route">("pin");
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)));
  const [showSectionVol2, setShowSectionVol2] = useState(false);
  const [showInterior, setShowInterior] = useState(false);
  const [showInterior2, setShowInterior2] = useState(false);

  // Hotspots for the 6 sections, positioned as % of the dwelling image's own
  // bounding box (not the viewport) — placed along the roofline by eye
  // against the actual asset. Purely visual for now, matching the reference's
  // glowing markers; not wired to real per-section data yet.
  const DWELLING_HOTSPOTS = [
    { id: "s1", x: 14.5, y: 48 },
    { id: "s2", x: 29.5, y: 46 },
    { id: "s3", x: 42,   y: 44.5 },
    { id: "s4", x: 57,   y: 44 },
    { id: "s5", x: 72,   y: 46 },
    { id: "s6", x: 86,   y: 48 },
  ];

  // Same 6 sections, re-measured against the top-view image — the dwelling
  // sits at a near-identical horizontal crop in both renders, so x barely
  // moves, but the body is vertically centered rather than following a
  // roofline, so y is a single flat value instead of per-section.
  const PLAN_HOTSPOTS = [
    { id: "s1", x: 13.5, y: 49 },
    { id: "s2", x: 28,   y: 49 },
    { id: "s3", x: 42.5, y: 49 },
    { id: "s4", x: 57.5, y: 49 },
    { id: "s5", x: 72,   y: 49 },
    { id: "s6", x: 86.5, y: 49 },
  ];

  // Shared so the 3D scene and the plan view render identical hotspots —
  // same glow, same s3 pin-on-click + "Explore inside" behavior.
  const renderHotspots = (hotspots: { id: string; x: number; y: number }[]) =>
    hotspots.map((h) => (
      <div
        key={h.id}
        className="group absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11"
        style={{ left: `${h.x}%`, top: `${h.y}%` }}
      >
        <button
          onClick={h.id === "s3" ? () => setShowSectionVol2((v) => !v) : undefined}
          className="absolute inset-0"
          aria-label={`Section ${h.id}`}
        >
          <span
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full blur-md opacity-75 transition-all duration-300 group-hover:opacity-100 group-hover:w-14 group-hover:h-14"
            style={{
              background:
                "radial-gradient(circle, rgba(110,190,240,0.65) 0%, rgba(110,190,240,0.25) 45%, rgba(110,190,240,0) 75%)",
            }}
            aria-hidden
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 group-hover:w-3 group-hover:h-3" />
        </button>

        {h.id === "s3" && (
          <div
            className={[
              "absolute left-1/2 bottom-full -translate-x-1/2 mb-3 transition-all duration-300 whitespace-nowrap",
              showSectionVol2
                ? "opacity-100 translate-y-0 pointer-events-auto"
                : "opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
            ].join(" ")}
          >
            <div className="liquid-glass-strong rounded-xl px-3.5 py-2.5 flex flex-col items-center gap-2">
              <span className="font-body text-[11px] uppercase tracking-[0.14em] text-white/90">
                Living Room
              </span>
              <button
                onClick={() => setShowInterior(true)}
                className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-body uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
              >
                Explore inside
              </button>
            </div>
          </div>
        )}
      </div>
    ));

  // ── Read onboarding init data ─────────────────────────────────────────────────
  type InitState = {
    spec?: Record<string, unknown>; dwelling_spec?: Record<string, unknown>;
    image_b64?: string; reply?: string; suggestions?: string[];
    site?: Record<string, unknown>; answers?: Record<string, string>;
  };
  // Read directly from storage on every render — cheap, synchronous, always fresh.
  // Checks both localStorage (new) and sessionStorage (legacy fallback).
  const locationState: InitState | null = (() => {
    try {
      const raw = localStorage.getItem("configuratorInit")
               ?? sessionStorage.getItem("configuratorInit");
      if (raw) return JSON.parse(raw) as InitState;
    } catch { /* ignore */ }
    return (location.state as InitState | null) ?? null;
  })();

  // Spec passed from onboarding; falls back to defaults if navigated directly.
  const [spec, setSpec] = useState<Record<string, unknown>>(
    locationState?.spec ?? {
      dining_style: "compact", num_chairs: 2, h: 7, d: 3,
      roof_style: "any", preferred_tags: [], corridor_side: "none", corridor_w: 2, seed: 42,
    },
  );
  // Static placeholder in place of a live-rendered image — the fetch to a
  // backend /render endpoint is gone; this will be replaced with real
  // baked-scenario art as the show rebuild progresses.
  const [sectionImage] = useState<string | null>(null);

  // No backend to check — "online" is cosmetic for now, matching the look
  // this page is being rebuilt toward.
  const apiOnline = true;
  const [activeSection, setActiveSection] = useState<string>("dwelling");
  const [viewMode, setViewMode] = useState<"2D" | "3D" | "plan">("3D");

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  // Dwelling spec now comes only from onboarding (no /dwelling-spec fallback fetch).
  const [dwellingSpec] = useState<Record<string, unknown> | null>(
    locationState?.dwelling_spec ?? null,
  );

  // Placeholder for what was fetchRender() — no network call, just a no-op
  // for now so existing call sites don't need to change yet.
  const fetchRender = (_section = activeSection, _view = viewMode, _overrideSpec?: Record<string, unknown>) => {
    /* intentionally empty — will be replaced with real baked-scenario logic */
  };

  // Hover is CSS-only — no API call, instant feedback via SVG polygon glow.
  const onSectionHover = (s: string) => setHoveredSection(s);
  const onSectionHoverEnd = () => setHoveredSection(null);

  // Build the per-section spec from the dwelling spec so renders match the dwelling.
  const sectionSpecFromDwelling = (sectionType: string): Record<string, unknown> => {
    // Dining is always driven by the user's onboarding spec — the dwelling already uses it.
    if (sectionType === "dining") return spec;
    if (!dwellingSpec) return spec;
    const fns = (dwellingSpec.functions as Array<Record<string, unknown>>) ?? [];
    const fn = fns.find((f) => f.type === sectionType);
    if (!fn) return spec;
    return {
      h:             dwellingSpec.H ?? 7,
      d:             fn.d            ?? 3,
      seed:          fn.seed         ?? 42,
      dining_style:  fn.dining_style ?? "compact",
      roof_style:    dwellingSpec.roof_style ?? fn.roof_style ?? "any",
      corridor_side: dwellingSpec.corridor_side ?? "none",
      corridor_w:    dwellingSpec.corridor_w    ?? 2,
      num_chairs:    fn.num_chairs   ?? 2,
      preferred_tags: fn.preferred_tags ?? [],
      w:             dwellingSpec.W  ?? undefined,
    };
  };

  const onSectionClick = (s: string) => {
    setActiveSection(s);
    setViewMode("3D");
    fetchRender(s, "3D", sectionSpecFromDwelling(s));
  };

  // Fresh render on mount.
  useEffect(() => { fetchRender(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setEngineReady(true), 3500);
    return () => clearTimeout(t);
  }, []);


  // Engine Assistant chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const _site    = locationState?.site;
  const _answers = locationState?.answers ?? {};
  const _spec    = locationState?.spec ?? spec;

  // Build greeting client-side so it always works regardless of LLM availability.
  const _occMap: Record<string, string> = {
    solo: "just you", couple: "two people",
    family: "your family", group: "a large group",
  };
  const _purMap: Record<string, string> = {
    work: "remote work", retreat: "relaxation",
    social: "hosting guests", research: "field research",
  };
  const _occStr = _occMap[_answers.occupants ?? ""] ?? "";
  const _purStr = _purMap[_answers.purpose   ?? ""] ?? "";
  const _onboardingSiteName = String(_site?.name ?? "");
  const _onboardingSiteRegion = String(_site?.location ?? "");

  // Site Selector — the onboarding pick plus two curated alternates the
  // user can switch between right here (static/baked, no re-render call).
  const _fallbackSite = SITES.find((s) => s.title === "Skye Moor")!;
  const _primarySite = SITES.find((s) => s.title === _onboardingSiteName) ?? {
    ..._fallbackSite,
    title: _onboardingSiteName || _fallbackSite.title,
    region: _onboardingSiteRegion || _fallbackSite.region,
  };
  const _extraSites = ["Namib Dune", "Highland Spire"]
    .filter((t) => t !== _primarySite.title)
    .map((t) => SITES.find((s) => s.title === t)!)
    .slice(0, 2);
  const SITE_OPTIONS = [_primarySite, ..._extraSites];
  const [selectedSiteIdx, setSelectedSiteIdx] = useState(0);
  const activeSite = SITE_OPTIONS[selectedSiteIdx] ?? SITE_OPTIONS[0];
  const _siteName = activeSite.title;
  const _siteRegion = activeSite.region;
  const _siteThumb = activeSite.image;
  // Namib Dune and Highland Spire get their own landscape backdrops in the
  // viewport; every other site still falls back to the default scene.
  const _landscapeBg =
    activeSite.title === "Namib Dune" ? landscapeNamib
    : activeSite.title === "Highland Spire" ? landscapeHighland
    : landscapeBg;

  const greeting: string = locationState?.reply?.trim()
    ? locationState.reply
    : _siteName
      ? `Hi! I'm your Engine Assistant. I've designed a ${_spec.dining_style ?? "compact"} dining space${_occStr ? ` for ${_occStr}` : ""} at ${_siteName}${_purStr ? `, suited for ${_purStr}` : ""}. Is there anything you'd like to adjust?`
      : "Hi! I'm your Engine Assistant. Is there anything you'd like to adjust about your dining space?";

  // Build suggestions client-side from spec so they're always contextual.
  const _tags = (_spec.preferred_tags as string[] | undefined) ?? [];
  const suggestions: string[] = locationState?.suggestions?.length
    ? locationState.suggestions
    : [
        _spec.dining_style === "compact"
          ? "Make it more spacious and open"
          : "Make it more compact and efficient",
        ((_spec.h as number) ?? 7) <= 8
          ? "Raise the ceiling — make it feel more dramatic"
          : "Lower the ceiling for a cosier feel",
        _tags.includes("more_shelves")
          ? "Remove the overhead shelves"
          : "Add storage shelves above the table",
        _answers.occupants === "solo"
          ? "Give the single-person setup more presence"
          : "Make it feel more intimate for two",
      ];
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<"idle" | "typing" | "streaming" | "ready">("idle");

  useEffect(() => {
    if (!engineReady) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => setIntroPhase("typing"), 1000),
    );
    timers.push(
      setTimeout(() => {
        setIntroPhase("streaming");
        setMessages([{ role: "assistant", content: "" }]);
        let i = 0;
        const step = () => {
          i += 1;
          setMessages([{ role: "assistant", content: greeting.slice(0, i) }]);
          if (i < greeting.length) {
            timers.push(setTimeout(step, 18));
          } else {
            timers.push(
              setTimeout(() => {
                setIntroPhase("ready");
                setShowSuggestions(true);
              }, 250),
            );
          }
        };
        step();
      }, 2400),
    );
    return () => timers.forEach(clearTimeout);
  }, [engineReady]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // No backend call — placeholder reply so the chat UI stays functional
  // while this page is rebuilt. Will be replaced with the baked-scenario
  // keyword-matched responses discussed for the show.
  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    setShowSuggestions(false);
    const userMsg: ChatMsg = { role: "user", content: text };
    const chatHistory = messages.filter((m) => m.content !== "");
    setMessages([...chatHistory, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    await new Promise((r) => setTimeout(r, 400));
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "assistant",
        content: "Chat isn't wired up to a live backend in this build yet.",
      };
      return next;
    });
    setIsStreaming(false);
  };

  // Dining floor area in cm² — mirrors _dining_W logic in api.py
  const _dStyle   = (spec.dining_style as string) ?? "compact";
  const _nChairs  = (spec.num_chairs  as number) ?? 2;
  const _corrSide = (spec.corridor_side as string) ?? "none";
  const _corrW    = (spec.corridor_w  as number) ?? 2;
  const _inner    = _nChairs === 2
    ? (_dStyle === "compact" ? 6 : 8)
    : (_dStyle === "compact" ? 4 : 5);
  const _W        = _inner + (_corrSide !== "none" ? _corrW : 0);
  const _D        = (spec.d as number) ?? 3;
  const _areaCm2   = (_W * 40) * (_D * 40);
  const _areaM2Num = _areaCm2 / 10000;
  const _areaM2    = _areaM2Num.toFixed(2);
  const _assembly  = Math.round(6.5 + _areaM2Num * 1.2);
  const _energy    = (1.8 + _areaM2Num * 0.5).toFixed(1);
  const _mass      = (0.25 + _areaM2Num * 0.13).toFixed(2);

  return (
    <div className="relative min-h-screen w-full bg-black text-white overflow-hidden">
      <video
        src="/configurator-bg.mp4"
        autoPlay
        muted
        playsInline
        className="fixed inset-0 w-full h-full z-0 object-cover pointer-events-none"
      />
      <div className="fixed inset-0 z-0 bg-black/55" aria-hidden />

      <div className="relative z-10 pt-32 px-8 md:px-16 lg:px-20 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <p className="text-sm font-body text-white/80 mb-4">
            {_siteName ? `// ${_siteName}` : "// Worlds"}
          </p>
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
              <button
                onClick={() => setShowNext(true)}
                className="bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2"
              >
                Continue configuration <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          <div
            className={[
              "mt-10 grid grid-cols-1 gap-5 items-start",
              showSiteSelector ? "lg:grid-cols-[220px_1fr_360px]" : "lg:grid-cols-[1fr_360px]",
            ].join(" ")}
          >
            {/* LEFT SIDEBAR — Site Selector (matches the reference; other
                panels from the reference intentionally not built yet) */}
            {showSiteSelector && (
              <motion.aside
                initial={blurInit}
                animate={blurIn}
                transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                className="liquid-glass rounded-[1rem] p-2.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-body uppercase tracking-[0.12em] text-white/60">
                    Site Selector
                  </span>
                  <button
                    onClick={() => setShowSiteSelector(false)}
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center text-white/50 hover:text-white transition-colors"
                    aria-label="Close site selector"
                  >
                    <X className="h-3 w-3" strokeWidth={1.75} />
                  </button>
                </div>

                <div className="flex gap-0.5 bg-white/5 rounded-full p-0.5 mb-2 w-fit">
                  {([
                    { id: "map" as const, Icon: Map },
                    { id: "pin" as const, Icon: MapPin },
                    { id: "route" as const, Icon: Navigation },
                  ]).map(({ id, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setSiteSelectorView(id)}
                      className={[
                        "w-6 h-6 rounded-full inline-flex items-center justify-center transition-all",
                        siteSelectorView === id
                          ? "bg-white text-black"
                          : "text-white/50 hover:text-white/80",
                      ].join(" ")}
                      aria-label={id}
                    >
                      <Icon className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                  ))}
                </div>

                <div className="rounded-[0.75rem] overflow-hidden border border-white/10 bg-white/[0.03]">
                  {_siteThumb ? (
                    <img src={_siteThumb} alt={_siteName} className="w-full h-16 object-cover" />
                  ) : (
                    <div className="w-full h-16 bg-white/5" />
                  )}
                  <div className="p-2">
                    <p className="text-[11px] font-body text-white/90">
                      Site: {_siteName || "—"}
                    </p>
                    {_siteRegion && (
                      <p className="text-[9px] font-body text-white/50 mt-0.5">{_siteRegion}</p>
                    )}
                  </div>
                </div>

                {SITE_OPTIONS.length > 1 && (
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {SITE_OPTIONS.map((opt, i) => (
                      <button
                        key={opt.title}
                        onClick={() => setSelectedSiteIdx(i)}
                        aria-label={`Switch to ${opt.title}`}
                        aria-pressed={i === selectedSiteIdx}
                        className={[
                          "rounded-[0.5rem] overflow-hidden border transition-colors",
                          i === selectedSiteIdx
                            ? "border-white/60"
                            : "border-white/10 hover:border-white/30",
                        ].join(" ")}
                      >
                        <img src={opt.image} alt={opt.title} className="w-full h-10 object-cover" />
                        <p className="text-[8px] font-body text-white/70 truncate px-1 py-0.5">
                          {opt.title}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.aside>
            )}

            {/* VIEWPORT */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
              className="relative flex flex-col"
            >
              {/* Section tabs + 2D/3D toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  {(["dwelling", "dining", "kitchen", "living", "bed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        // When switching to a non-dwelling section, "plan" is invalid → fall back to "3D"
                        const v = s === "dwelling"
                          ? (viewMode === "plan" ? "plan" : "3D")
                          : (viewMode === "plan" ? "3D" : viewMode);
                        setActiveSection(s);
                        setViewMode(v);
                        fetchRender(s, v);
                      }}
                      className={[
                        "px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] transition-all",
                        activeSection === s
                          ? "bg-white text-black font-medium"
                          : "text-white/50 hover:text-white/80",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  {(activeSection === "dwelling"
                    ? (["3D", "plan"] as const)
                    : (["2D", "3D"] as const)
                  ).map((v) => (
                    <button
                      key={v}
                      onClick={() => { setViewMode(v); fetchRender(activeSection, v); }}
                      className={[
                        "px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] transition-all",
                        viewMode === v
                          ? "bg-white text-black font-medium"
                          : "text-white/50 hover:text-white/80",
                      ].join(" ")}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div
                className="relative rounded-[1.25rem] overflow-hidden liquid-glass"
                style={{ height: "58vh" }}
              >
                <AnimatePresence mode="wait">
                  {showInterior2 ? (
                    /* Second interior angle — reached from the carpet-corner hotspot in interior 1 */
                    <motion.div
                      key="interior-view-2"
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <img
                        src={interior2Img}
                        alt="Living room interior, alternate angle"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setShowInterior2(false)}
                        className="absolute top-4 left-4 liquid-glass rounded-full w-9 h-9 inline-flex items-center justify-center text-white/80 hover:text-white"
                        aria-label="Back to previous view"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : showInterior ? (
                    /* Interior takeover — crossfades in over everything else when
                       "Explore inside" is clicked on the living room hotspot */
                    <motion.div
                      key="interior-view"
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <img
                        src={interior1Img}
                        alt="Living room interior"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {/* Carpet-corner hotspot, in front of the shelf — same
                          aura-glow marker language as the dwelling hotspots */}
                      <button
                        onClick={() => setShowInterior2(true)}
                        className="group absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11"
                        style={{ left: "22%", top: "75%" }}
                        aria-label="Explore alternate angle"
                      >
                        <span
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full blur-md opacity-75 transition-all duration-300 group-hover:opacity-100 group-hover:w-14 group-hover:h-14"
                          style={{
                            background:
                              "radial-gradient(circle, rgba(110,190,240,0.65) 0%, rgba(110,190,240,0.25) 45%, rgba(110,190,240,0) 75%)",
                          }}
                          aria-hidden
                        />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 group-hover:w-3 group-hover:h-3" />
                      </button>
                      <button
                        onClick={() => setShowInterior(false)}
                        className="absolute top-4 left-4 liquid-glass rounded-full w-9 h-9 inline-flex items-center justify-center text-white/80 hover:text-white"
                        aria-label="Back to dwelling view"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : activeSection === "dwelling" && viewMode === "plan" ? (
                    /* Plan view — top-down render, crossfades in over the 3D scene */
                    <motion.div
                      key="plan-view"
                      className="absolute inset-0"
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: zoom }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 220, damping: 26 },
                      }}
                    >
                      <img
                        src={topViewImg}
                        alt="Dwelling plan view"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      {renderHotspots(PLAN_HOTSPOTS)}
                    </motion.div>
                  ) : (
                    /* Zoomable scene — landscape + dwelling + hotspots scale together */
                    <motion.div
                      key="scene-3d"
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, scale: zoom }}
                      exit={{ opacity: 0 }}
                      transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 220, damping: 26 },
                      }}
                    >
                      {/* Landscape backdrop, matching the reference — sits behind everything else in this viewport */}
                      <img
                        src={_landscapeBg}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/30" aria-hidden />

                      {/* Dwelling structure, composited over the landscape — aspect-locked
                          wrapper so the hotspot %-coordinates line up with the actual
                          image regardless of how it's letterboxed inside the viewport */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="relative"
                          style={{ aspectRatio: "2400/1792", maxHeight: "100%", maxWidth: "100%", width: "100%" }}
                        >
                          <img
                            src={dwellingFg}
                            alt="Dwelling"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                          {/* Vol2 shares the exact same 2400x1792 canvas as the base dwelling
                              render (just with the section 3 bay opened to a cutaway), so it's
                              pixel-aligned and can sit directly on top with a plain fade. */}
                          <img
                            src={sectionVol2}
                            alt="Section detail"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: showSectionVol2 ? 1 : 0 }}
                          />
                          {/* Same aura-glow-behind-a-white-core look as the Tribe page's
                              node markers, shifted bluer. The button itself is sized to
                              match the visible glow (not just the core dot) so hover
                              actually triggers when the cursor is over the glow. */}
                          {renderHotspots(DWELLING_HOTSPOTS)}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {!engineReady ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, filter: "blur(12px)" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-5 pointer-events-none"
                    >
                      <div className="absolute w-64 h-64 rounded-full bg-white/5 blur-3xl animate-pulse" />
                      <Loader2 className="h-10 w-10 text-white/80 animate-spin relative" strokeWidth={1.5} />
                      <div className="relative text-center">
                        <p className="font-body text-white/85 text-sm tracking-wide">
                          Preparing your Nomadic Engine...
                        </p>
                        <p className="font-body text-white/40 text-[11px] uppercase tracking-[0.18em] mt-2">
                          Calibrating modules
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="engine"
                      initial={{ opacity: 0, scale: 0.96, filter: "blur(12px)" }}
                      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
                    >
                      {sectionImage ? (
                        activeSection === "dwelling" && viewMode === "3D" ? (
                          /* Square container — matches square matplotlib figure, so SVG overlay aligns exactly */
                          <div className="relative" style={{ aspectRatio: "1/1", maxHeight: "100%", maxWidth: "100%" }}>
                            {/* Hovered section name — top-left corner, Barlow font */}
                            <div
                              className="absolute top-3 left-3 z-10 pointer-events-none transition-opacity duration-200"
                              style={{ opacity: hoveredSection ? 1 : 0 }}
                            >
                              <span className="font-body text-[11px] uppercase tracking-[0.22em] text-white/60">
                                {hoveredSection ?? ""}
                              </span>
                            </div>
                            <img
                              src={`data:image/png;base64,${sectionImage}`}
                              alt="Dwelling render"
                              className="w-full h-full"
                              style={{ objectFit: "fill" }}
                            />
                            {/* Zone hotspots — convex hull of each section's 8 projected corners, back→front */}
                            <svg
                              className="absolute inset-0 w-full h-full"
                              viewBox="0 0 100 100"
                              preserveAspectRatio="none"
                              style={{ pointerEvents: "none" }}
                            >
                              <defs>
                                <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="1.8" result="blur" />
                                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                              </defs>
                              {([
                                ["bed",     "39.9,18.9 49.9,14.4 78.7,20.7 77.9,58.5 68.6,64.2 40.2,56.4"],
                                ["living",  "29.3,23.6 39.9,18.9 84.5,29.1 83.5,68.3 73.8,74.4 30.0,61.9"],
                                ["kitchen", "18.2,28.5 29.3,23.6 58.9,30.6 58.7,70.1 48.3,76.3 19.2,67.7"],
                                ["dining",  "6.5,33.8  18.2,28.5 58.7,38.6 58.5,79.4 47.6,86.1 7.9,73.8"],
                              ] as const).map(([s, pts]) => (
                                <g key={s} style={{ pointerEvents: "all" }}>
                                  <polygon
                                    points={pts}
                                    fill={hoveredSection === s ? "rgba(255,255,255,0.09)" : "transparent"}
                                    stroke={hoveredSection === s ? "rgba(255,255,255,0.5)" : "transparent"}
                                    strokeWidth="0.4"
                                    filter={hoveredSection === s ? "url(#zone-glow)" : undefined}
                                    style={{ cursor: "pointer", transition: "fill 0.2s, stroke 0.2s" }}
                                    onMouseEnter={() => onSectionHover(s)}
                                    onMouseLeave={onSectionHoverEnd}
                                    onClick={() => onSectionClick(s)}
                                  />
                                </g>
                              ))}
                            </svg>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={`data:image/png;base64,${sectionImage}`}
                              alt="Section render"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>


                <div className="absolute top-4 right-4 liquid-glass rounded-full flex flex-col gap-1 p-1.5">
                  {[
                    { Icon: Box, onClick: undefined },
                    { Icon: RotateCw, onClick: undefined },
                    { Icon: ZoomIn, onClick: zoomIn },
                    { Icon: ZoomOut, onClick: zoomOut },
                  ].map(({ Icon, onClick }, i) => (
                    <button
                      key={i}
                      onClick={onClick}
                      disabled={!onClick}
                      className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>

                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  {_siteName && (
                    <span className="liquid-glass tag-glass">Site: {_siteName}</span>
                  )}
                  {selectedPlan && (
                    <span className="liquid-glass tag-glass">
                      Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                    </span>
                  )}
                </div>

              </div>

              {/* Performance strip */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Assembly time" value={String(_assembly)} unit="hours" />
                <Stat label="Energy consumption" value={_energy} unit="kWh/d" />
                <Stat label="Total mass" value={_mass} unit="t" />
                <Stat label="Total area" value={_areaM2} unit="m²" />
              </div>
            </motion.div>

            {/* AI ASSIST — CHAT */}
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] p-6 flex flex-col h-[calc(58vh+10rem)]"
            >
              <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/10">
                <span className="relative inline-flex w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center overflow-hidden">
                  <img src={assistantAvatar} alt="Engine Assistant" width={36} height={36} loading="lazy" className="w-full h-full object-contain" />
                </span>
                <div className="flex flex-col leading-tight">
                  <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body inline-flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      apiOnline === null  ? "bg-white/30 animate-pulse" :
                      apiOnline           ? "bg-emerald-400 animate-pulse" :
                                            "bg-red-400"
                    }`} />
                    {apiOnline === null ? "connecting" : apiOnline ? "online" : "offline"}
                  </span>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm font-body"
              >
                {introPhase === "typing" && messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <img src={assistantAvatar} alt="" width={28} height={28} loading="lazy" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 shrink-0 object-contain" />
                    <span className="inline-flex gap-1 items-center pt-2 text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:120ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:240ms]" />
                    </span>
                  </motion.div>
                )}

                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="bg-white text-black rounded-2xl px-4 py-2 max-w-[85%] leading-relaxed">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start gap-3">
                      <img src={assistantAvatar} alt="" width={28} height={28} loading="lazy" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 shrink-0 object-contain" />
                      <div className="text-white/90 leading-relaxed pr-2 flex-1 min-w-0 pt-0.5">
                        {m.content ? (
                          renderMd(m.content)
                        ) : (
                          <span className="inline-flex gap-1 items-center pt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:120ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:240ms]" />
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                )}


                {showSuggestions && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {suggestions.map((s, idx) => {
                      const isSelected = selectedSuggestion === s;
                      return (
                        <motion.button
                          key={s}
                          type="button"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.06, ease: "easeOut" }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setSelectedSuggestion(s);
                            send(s);
                          }}
                          className={`rounded-full px-4 py-2 text-xs font-body border transition-[background,border,box-shadow] duration-300 ${
                            isSelected
                              ? "bg-white/15 border-white/50 text-white shadow-[0_0_24px_-6px_rgba(255,255,255,0.5)]"
                              : "bg-white/[0.06] text-white/85 border-white/15 hover:bg-white/15 hover:border-white/35 hover:shadow-[0_0_20px_-6px_rgba(255,255,255,0.35)]"
                          }`}
                        >
                          {s}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>


              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="mt-3 shrink-0 flex items-center gap-2 liquid-glass rounded-full pl-5 pr-2 py-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    activeSection !== "dining" && activeSection !== "dwelling"
                      ? `Chat only available for dining`
                      : "Message Engine Assistant…"
                  }
                  disabled={isStreaming || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isStreaming || !input.trim() || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="bg-white text-black rounded-full w-9 h-9 inline-flex items-center justify-center disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
            </motion.aside>
          </div>
        </div>
      </div>

      {/* Reservation customizer — opens on Continue configuration */}
      <AnimatePresence>
        {showNext && <ReservationCustomizer onClose={() => setShowNext(false)} />}
      </AnimatePresence>
    </div>
  );
}


function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="liquid-glass rounded-[1rem] p-4 cursor-default border border-white/10 hover:border-white/30 hover:bg-white/[0.06] hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.25)] transition-[background,border,box-shadow] duration-300"
    >
      <p className="text-[11px] uppercase tracking-[0.14em] text-white/60 font-body">{label}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-heading text-white text-3xl tracking-[-1px] leading-none">{value}</span>
        <span className="text-xs text-white/60 font-body">{unit}</span>
      </div>
    </motion.div>
  );
}
