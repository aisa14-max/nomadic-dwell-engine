// Frozen snapshot of the Streamlit/FastAPI-connected configurator, saved for
// portfolio use before the show-specific redesign (matching the new reference
// look) begins on the main Configurator page. Not linked in nav — reachable
// directly at /configurator-portfolio. Kept deliberately unmodified from the
// original; if you want to improve THIS version later, edit this file, not
// pages/Configurator.tsx (that one is now the show build).
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ZoomIn, ZoomOut, Maximize2, Minimize2, Send, Loader2, Lock, MousePointer2 } from "lucide-react";
import BlurText from "@/components/BlurText";
import dwelling from "@/assets/dwelling-hero.png";
import assistantAvatar from "@/assets/engine-assistant-avatar.png";
import { useMockAuth } from "@/context/MockAuth";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

// Zone hotspots on the dwelling render — convex hull of each section's 8
// projected corners, back→front. Shared between the interactive polygons
// and the guided-tour hint layer that pulses them before the first hover.
const ZONE_HOTSPOTS = [
  // All four verified against the actual default-spec render (projected
  // through the exact same matplotlib transform api.py uses — view_init
  // elev=25/azim=-60, box_aspect to scale — then convex-hulled from each
  // zone's real 8 corners), not eyeballed. Each zone's left edge is exactly
  // the previous zone's right edge at their shared depth boundary, since
  // they're placed back-to-back along the depth axis (dining → kitchen →
  // living → bed) — though each zone's own width can differ (dining/kitchen
  // 6, living 7, bed 8, per dwelling.py's per-section fn_W), so their right
  // edges don't all line up the way their left edges do.
  ["bed",     "40.5,20.0 51.7,13.0 90.3,21.2 89.2,56.3 79.3,64.8 41.1,55.1"],
  ["living",  "31.7,25.6 40.6,20.0 75.0,27.6 74.2,63.5 66.3,70.2 32.5,61.3"],
  ["kitchen", "19.2,33.5 31.7,25.6 61.5,32.4 61.4,68.9 49.9,78.2 20.4,70.1"],
  ["dining",  "9.2,39.7 19.3,33.4 49.8,40.7 49.8,78.2 40.8,85.7 10.7,77.1"],
] as const;

export default function ConfiguratorPortfolio() {
  const location = useLocation();
  const { selectedPlan } = useMockAuth();
  const [engineReady, setEngineReady] = useState(false);

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
  const [sectionImage, setSectionImage] = useState<string | null>(
    locationState?.image_b64 ?? null,
  );

  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [activeSection, setActiveSection] = useState<string>("dwelling");
  const [viewMode, setViewMode] = useState<"2D" | "3D" | "plan">("3D");

  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)));
  // True browser Fullscreen API, same approach as the main Configurator page.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewportRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };
  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === viewportRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const check = () =>
      fetch(`${API}/health`, { signal: AbortSignal.timeout(3000) })
        .then((r) => setApiOnline(r.ok))
        .catch(() => setApiOnline(false));
    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  // Guided first step: the zone hotspots on the dwelling render are otherwise
  // invisible until you happen to mouse over one — nothing hints they're
  // there, let alone clickable. This one-way flag keeps them visibly glowing
  // until the visitor actually clicks one — a stray hover while the mouse
  // just passes over the viewport isn't a deliberate enough signal that the
  // hint's been noticed, so hover alone doesn't dismiss it (see onSectionClick).
  const [hasHoveredSection, setHasHoveredSection] = useState(false);
  // Guided tour, in order after the hover step above:
  //   click a zone → click 2D → click Kitchen → click Dining (unlocks chat)
  // Each flag is one-way, same reasoning as hasHoveredSection throughout.
  const [hasClicked2D, setHasClicked2D] = useState(false);
  const [hasClickedKitchen, setHasClickedKitchen] = useState(false);
  // Final step: the assistant only edits the dining spec, so it stays fully
  // locked — no greeting, no input — until the visitor has clicked into the
  // dining section at least once.
  const [hasClickedDining, setHasClickedDining] = useState(false);
  // Dwelling spec: seeded from onboarding (has correct W + roof_style), falls back to /dwelling-spec.
  const [dwellingSpec, setDwellingSpec] = useState<Record<string, unknown> | null>(
    locationState?.dwelling_spec ?? null,
  );

  useEffect(() => {
    if (dwellingSpec) return; // already have it from onboarding
    fetch(`${API}/dwelling-spec`)
      .then((r) => r.json())
      .then((d) => setDwellingSpec(d))
      .catch(() => {});
  }, []);

  // Incremented on every new fetch — stale callbacks check against this and drop their result.
  const fetchGenRef = useRef(0);

  const fetchRender = (section = activeSection, view = viewMode, overrideSpec?: Record<string, unknown>) => {
    const gen = ++fetchGenRef.current;
    setSectionImage(null);
    fetch(`${API}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: overrideSpec ?? spec, section, view }),
    })
      .then((r) => r.json())
      .then((d) => { if (gen === fetchGenRef.current && d.image_b64) setSectionImage(d.image_b64); })
      .catch(() => {});
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
    // A click is the deliberate "I got it" signal — a stray hover while the
    // mouse just passes over the viewport shouldn't be enough to dismiss the
    // hint before it's actually been noticed.
    setHasHoveredSection(true);
    if (s === "kitchen") setHasClickedKitchen(true);
    if (s === "dining") setHasClickedDining(true);
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
  const _siteName = String(_site?.name ?? "");

  const greeting: string = locationState?.reply?.trim()
    ? locationState.reply
    : _siteName
      ? `Hi! I'm your Engine Assistant. I've designed a ${_spec.dining_style ?? "compact"} dwelling${_occStr ? ` for ${_occStr}` : ""} at ${_siteName}${_purStr ? `, suited for ${_purStr}` : ""}. Is there anything you'd like to adjust?`
      : "Hi! I'm your Engine Assistant. Is there anything you'd like to adjust about your dwelling?";

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
    // Held back until hasClickedDining — the assistant only edits the dining
    // spec, so it stays locked and silent until the visitor has actually
    // clicked into that section, then starts typing its greeting.
    if (!engineReady || !hasClickedDining) return;
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
  }, [engineReady, hasClickedDining]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming) return;
    setShowSuggestions(false);
    const userMsg: ChatMsg = { role: "user", content: text };
    const chatHistory = messages.filter((m) => m.content !== "");
    setMessages([...chatHistory, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const resp = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_spec: spec,
          message: text,
          history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) throw new Error("Assistant unavailable.");
      setApiOnline(true);
      const data = await resp.json();

      if (data.spec) {
        setSpec(data.spec);
        // Re-render with the correct section + view (chat API always returns dining-2D
        // which would be wrong in dwelling mode or 3D mode).
        fetchRender(activeSection, viewMode, data.spec as Record<string, unknown>);
      }

      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: data.reply ?? "Done." };
        return next;
      });
    } catch (e) {
      setApiOnline(false);
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong.",
        };
        return next;
      });
    } finally {
      setIsStreaming(false);
      // Suggestions reappear after every reply, not just the first greeting,
      // so there's always a quick next move to tap instead of typing.
      setSelectedSuggestion(null);
      setShowSuggestions(true);
    }
  };


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
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
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
                  {/* Fifth/sixth guided steps: after 2D, point at Kitchen, then
                      at Dining (which also unlocks the chat) — one at a time. */}
                  {(() => {
                    // Dismissed for good the moment dining is clicked, however
                    // it was reached — clicking out of order (e.g. dining
                    // before kitchen) shouldn't leave a stale kitchen hint.
                    const hintTarget = hasClickedDining ? null
                      : hasClicked2D && !hasClickedKitchen ? "kitchen"
                      : hasClickedKitchen ? "dining"
                      : null;
                    return (["dwelling", "dining", "kitchen", "living", "bed"] as const).map((s) => (
                      <div key={s} className="relative">
                        {s === hintTarget && (
                          <motion.div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                            animate={{
                              x: [-22, -22, 0, 0, 0],
                              y: [18, 18, 0, 0, 0],
                              opacity: [0, 1, 1, 1, 0],
                              scale: [1, 1, 1, 0.72, 1],
                            }}
                            transition={{
                              duration: 2.2,
                              times: [0, 0.3, 0.55, 0.7, 1],
                              repeat: Infinity,
                              repeatDelay: 0.9,
                              ease: "easeInOut",
                            }}
                          >
                            <MousePointer2
                              className="h-4 w-4 text-white"
                              style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
                              fill="white"
                              fillOpacity={0.15}
                              strokeWidth={1.75}
                            />
                          </motion.div>
                        )}
                        <button
                          onClick={() => {
                            // Every section click starts fresh on 3D, regardless of
                            // whatever view mode the previously-active section was left on.
                            setActiveSection(s);
                            setViewMode("3D");
                            fetchRender(s, "3D");
                            if (s === "kitchen") setHasClickedKitchen(true);
                            if (s === "dining") setHasClickedDining(true);
                          }}
                          className={[
                            "px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] transition-all",
                            activeSection === s
                              ? "bg-white text-black font-medium"
                              : "text-white/50 hover:text-white/80",
                            s === hintTarget ? "panel-glow-pulse" : "",
                          ].join(" ")}
                        >
                          {s}
                        </button>
                      </div>
                    ));
                  })()}
                </div>
                <div
                  className={[
                    "relative flex gap-1 bg-white/5 rounded-full p-1",
                    activeSection !== "dwelling" && !hasClicked2D ? "panel-glow-pulse" : "",
                  ].join(" ")}
                >
                  {/* Fourth guided step: 2D only exists once a zone section is
                      picked — a ghost cursor glides in onto the button and taps
                      it, same traveling-cursor mechanic as the "Join the Tribe"
                      hint on Tribe.tsx, instead of just glowing in place. */}
                  {activeSection !== "dwelling" && !hasClicked2D && (
                    <motion.div
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                      style={{ left: "16%", top: "50%" }}
                      animate={{
                        x: [-22, -22, 0, 0, 0],
                        y: [18, 18, 0, 0, 0],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [1, 1, 1, 0.72, 1],
                      }}
                      transition={{
                        duration: 2.2,
                        times: [0, 0.3, 0.55, 0.7, 1],
                        repeat: Infinity,
                        repeatDelay: 0.9,
                        ease: "easeInOut",
                      }}
                    >
                      <MousePointer2
                        className="h-4 w-4 text-white"
                        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
                        fill="white"
                        fillOpacity={0.15}
                        strokeWidth={1.75}
                      />
                    </motion.div>
                  )}
                  {(activeSection === "dwelling"
                    ? (["3D", "plan"] as const)
                    : (["2D", "3D"] as const)
                  ).map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setViewMode(v);
                        fetchRender(activeSection, v);
                        if (v === "2D") setHasClicked2D(true);
                      }}
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
                ref={viewportRef}
                className={
                  isFullscreen
                    ? "relative w-full h-full overflow-hidden liquid-glass rounded-none"
                    : "relative rounded-[1.25rem] overflow-hidden liquid-glass"
                }
                style={isFullscreen ? undefined : { height: "58vh" }}
              >
                <AnimatePresence mode="wait">
                  {!engineReady ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, filter: "blur(12px)" }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="absolute inset-0 flex flex-col items-center justify-center gap-5"
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
                      animate={{ opacity: 1, scale: zoom, filter: "blur(0px)" }}
                      transition={{
                        opacity: { duration: 0.8, ease: "easeOut" },
                        filter: { duration: 0.8, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 220, damping: 26 },
                      }}
                      className="absolute inset-0 flex items-center justify-center p-4"
                    >
                      {sectionImage ? (
                        activeSection === "dwelling" && viewMode === "3D" ? (
                          /* Square container — matches square matplotlib figure, so SVG overlay aligns exactly */
                          <div className="relative" style={{ aspectRatio: "1/1", maxHeight: "100%", maxWidth: "100%" }}>
                            {/* Hovered section name — top-left corner, Barlow font.
                                Before the first hover, this doubles as the guided
                                first step's own hint text. */}
                            <div
                              className="absolute top-3 left-3 z-10 pointer-events-none transition-opacity duration-200"
                              style={{ opacity: hoveredSection || !hasHoveredSection ? 1 : 0 }}
                            >
                              <span className="font-body text-[11px] uppercase tracking-[0.22em] text-white/60">
                                {hoveredSection ?? "Hover a section to explore"}
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
                              {/* Guided-tour hint layer — the interactive polygons below stay
                                  fully transparent until hovered, so nothing signals a
                                  first-time visitor that these shapes exist at all. This
                                  purely decorative, non-interactive layer pulses their
                                  outlines until hasHoveredSection flips true once. */}
                              {!hasHoveredSection && ZONE_HOTSPOTS.map(([s, pts]) => (
                                <polygon
                                  key={`hint-${s}`}
                                  points={pts}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.55)"
                                  strokeWidth="0.4"
                                  className="zone-hint-pulse"
                                  style={{ pointerEvents: "none" }}
                                />
                              ))}
                              {/* One zone demonstrates the actual hover look (filled +
                                  glow), so the hint reads as "this is what hovering does"
                                  rather than just an outline around each shape. */}
                              {!hasHoveredSection && (() => {
                                const demo = ZONE_HOTSPOTS.find(([s]) => s === "living");
                                if (!demo) return null;
                                const [, demoPts] = demo;
                                return (
                                  <polygon
                                    points={demoPts}
                                    fill="rgba(255,255,255,0.09)"
                                    stroke="rgba(255,255,255,0.5)"
                                    strokeWidth="0.4"
                                    filter="url(#zone-glow)"
                                    className="zone-demo-pulse"
                                    style={{ pointerEvents: "none" }}
                                  />
                                );
                              })()}
                              {ZONE_HOTSPOTS.map(([s, pts]) => (
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
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 text-white/40 animate-spin" strokeWidth={1.5} />
                          <p className="font-body text-white/30 text-xs uppercase tracking-widest">Solving…</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>


                <div className="absolute top-4 right-4 liquid-glass rounded-full flex flex-col gap-1 p-1.5">
                  {[
                    { Icon: ZoomIn, onClick: zoomIn },
                    { Icon: ZoomOut, onClick: zoomOut },
                    { Icon: isFullscreen ? Minimize2 : Maximize2, onClick: toggleFullscreen },
                  ].map(({ Icon, onClick }, i) => (
                    <button
                      key={i}
                      onClick={onClick}
                      className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white"
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
            </motion.div>

            {/* AI ASSIST — CHAT. Seventh guided step: the moment dining unlocks
                it, glow draws the eye over here — liquid-glass clips box-shadow,
                so (same as the guided-tour panels on Configurator.tsx) the glow
                has to land on this plain outer wrapper, not the panel itself.
                overflow-hidden here (not just min-h-0) matters: a CSS Grid item
                left at the default overflow:visible still contributes its full
                CONTENT height to the row's auto-sizing, growing chain length or
                not — that's what was pushing the row taller (and misaligning it
                from the viewport panel) as the conversation got longer, instead
                of stretching to match the viewport panel from the first message. */}
            <div className={`rounded-[1.25rem] h-full min-h-0 overflow-hidden ${hasClickedDining && introPhase !== "ready" ? "panel-glow-pulse" : ""}`}>
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] p-6 flex flex-col h-full min-h-0"
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
                className="chat-scrollbar mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm font-body"
              >
                {!hasClickedDining && (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                    <Lock className="h-5 w-5 text-white/30" strokeWidth={1.5} />
                    <p className="text-white/40 text-xs font-body leading-relaxed">
                      Click the <span className="text-white/60">Dining</span> section to unlock the Engine Assistant.
                    </p>
                  </div>
                )}

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
                    !hasClickedDining
                      ? "Click Dining to unlock the assistant"
                      : activeSection !== "dining" && activeSection !== "dwelling"
                        ? `Chat only available for dining`
                        : "Message Engine Assistant…"
                  }
                  disabled={!hasClickedDining || isStreaming || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!hasClickedDining || isStreaming || !input.trim() || (activeSection !== "dining" && activeSection !== "dwelling")}
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
      </div>

    </div>
  );
}
