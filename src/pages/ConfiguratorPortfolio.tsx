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

// Response shape of POST /furniture-options — mirrors app.py's picker column
// (_chair_options/_table_options/_shelf_options): every catalog variant that
// fits the currently-placed module's h/d slot, plus which one is active.
type FurnitureOptions = {
  chair_options: { left: string; right: string; h: number }[];
  table_options: string[];
  shelf_options: string[];
  current: Record<string, string>;
  thumbnails: Record<string, string>; // module_id -> base64 PNG
};

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

  // Manual per-zone furniture picks (chair_left/chair_right/table/shelf →
  // module_id), dining/3D only — same role as Streamlit's
  // st.session_state.module_overrides. Persists across section/view
  // switches (so leaving and returning to Dining/3D keeps your picks, same
  // as Streamlit's rerun-persistent session state); reset only when the
  // chat assistant produces a new spec (see send() below), since a fresh
  // layout can't be assumed to still fit the old picks.
  const [manualOverrides, setManualOverrides] = useState<Record<string, string>>({});
  const [furnitureOptions, setFurnitureOptions] = useState<FurnitureOptions | null>(null);

  const fetchRender = (
    section = activeSection,
    view = viewMode,
    overrideSpec?: Record<string, unknown>,
    overrideOverrides?: Record<string, string>,
  ) => {
    const gen = ++fetchGenRef.current;
    setSectionImage(null);
    const manual_overrides = section === "dining" ? (overrideOverrides ?? manualOverrides) : undefined;
    fetch(`${API}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: overrideSpec ?? spec, section, view, manual_overrides }),
    })
      .then((r) => r.json())
      .then((d) => { if (gen === fetchGenRef.current && d.image_b64) setSectionImage(d.image_b64); })
      .catch(() => {});
  };

  const fetchFurnitureOptionsFor = (targetSpec: Record<string, unknown>, overrides: Record<string, string>) => {
    fetch(`${API}/furniture-options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: targetSpec, manual_overrides: overrides }),
    })
      .then((r) => r.json())
      .then((d: FurnitureOptions) => setFurnitureOptions(d))
      .catch(() => setFurnitureOptions(null));
  };

  // Fetch/refresh the picker options whenever Dining/3D is the active view,
  // or (while already there) whenever the spec itself changes — e.g. a chat
  // edit. Doesn't depend on manualOverrides itself; picking an option goes
  // through applyOverride below, which fetches its own fresh options.
  useEffect(() => {
    if (activeSection === "dining" && viewMode === "3D") {
      fetchFurnitureOptionsFor(spec, manualOverrides);
    } else {
      setFurnitureOptions(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, viewMode, spec]);

  const applyOverride = (patch: Record<string, string>) => {
    const next = { ...manualOverrides, ...patch };
    setManualOverrides(next);
    fetchRender("dining", "3D", spec, next);
    fetchFurnitureOptionsFor(spec, next);
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

  // Quick-action suggestions — derived from the LIVE spec state (not
  // locationState.spec/.suggestions, which are frozen at onboarding and
  // never updated after a chat edit), so each one flips to its opposite the
  // moment the dwelling actually reaches that state. Chair/table height are
  // independent of each other and of dining_style — they're driven by their
  // own preferred_tags (tall_chairs/low_chairs, tall_table/low_table, or
  // the compound tall_furniture/low_furniture) and only fall back to
  // dining_style's default when no explicit tag is set, mirroring exactly
  // how llm.py + solver3d resolve furniture height (see
  // _apply_furniture_height in llm.py and _chair_rule_3d/_table_rule_3d in
  // solver3d.py). Phrased to contain the literal keyword substrings those
  // same functions key on ("higher chair(s)"/"lower chair(s)"/"higher
  // table"/"lower table"/"shelves"), so the intended tag always lands
  // instead of depending on the LLM inferring it from a paraphrase.
  const _tags = (spec.preferred_tags as string[] | undefined) ?? [];
  const _hasTag = (t: string) => _tags.includes(t);
  const chairsHigh = _hasTag("tall_chairs") || _hasTag("tall_furniture")
    ? true
    : _hasTag("low_chairs") || _hasTag("low_furniture")
      ? false
      : spec.dining_style === "spacious";
  const tableHigh = _hasTag("tall_table") || _hasTag("tall_furniture")
    ? true
    : _hasTag("low_table") || _hasTag("low_furniture")
      ? false
      : spec.dining_style === "spacious";
  const hasShelves = spec.roof_style === "divided" || _hasTag("more_shelves") || _hasTag("wide_shelves");

  // Picking a different-height chair needs more than a zone_override — the
  // chair zone's own vertical span only resizes via preferred_tags
  // (tall_chairs/low_chairs), independent of the table and of dining_style
  // (verified server-side: solving "compact" + preferred_tags:
  // ["tall_chairs"] places a full h3 chair next to a normal h2 table). So
  // this patches spec.preferred_tags to match whichever height was picked,
  // on top of the usual manual_overrides module pick.
  const applyChairOverride = (opt: { left: string; right: string; h: number }) => {
    const nextTags = [
      ..._tags.filter((t) => t !== "tall_chairs" && t !== "low_chairs"),
      opt.h === 3 ? "tall_chairs" : "low_chairs",
    ];
    const nextSpec = { ...spec, preferred_tags: nextTags };
    const nextOverrides = { ...manualOverrides, chair_left: opt.left, chair_right: opt.right };
    setSpec(nextSpec);
    setManualOverrides(nextOverrides);
    fetchRender("dining", "3D", nextSpec, nextOverrides);
    fetchFurnitureOptionsFor(nextSpec, nextOverrides);
  };

  const suggestions: string[] = [
    spec.dining_style === "compact"
      ? "Make it more spacious and open"
      : "Make it more compact and efficient",
    chairsHigh ? "I'd like lower chairs" : "I'd like higher chairs",
    tableHigh ? "I'd like a lower table" : "I'd like a higher table",
    hasShelves
      ? "Remove the overhead shelves"
      : "Add storage shelves above the table",
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
        // A new layout can't be assumed to still fit the old manual picks —
        // same as Streamlit, which clears module_overrides on every chat edit.
        setManualOverrides({});
        // Re-render with the correct section + view (chat API always returns dining-2D
        // which would be wrong in dwelling mode or 3D mode).
        fetchRender(activeSection, viewMode, data.spec as Record<string, unknown>, {});
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

      <div className="relative z-10 pt-16 px-8 md:px-16 lg:px-20 pb-12">
        <div className="mx-auto max-w-[1400px]">
          <div className="flex items-end justify-between flex-wrap gap-6">
            <div>
              <BlurText
                text="How does the engine actually work?"
                className="font-heading text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.05] tracking-[-1px] whitespace-nowrap"
              />
              <p className="mt-3 text-sm font-body text-white/50 max-w-xl">
                This is a demo version of the back-end system section generator of Nomadic Engine.
              </p>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[240px_1fr_360px] gap-5">
            {/* FURNITURE STYLE PICKER — left column, mirrors app.py's picker
                column (chair/table/shelf variants that fit the currently-
                placed module's h/d slot). Dining/3D only, same scope the
                Streamlit reference uses (_picker_result is only ever set in
                that branch). Column stays reserved at every section/view so
                the grid doesn't reflow when switching in and out of it. */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.8, ease: "easeOut" }}
              className="liquid-glass rounded-[1.25rem] shadow-lg shadow-black/20 p-5 flex flex-col"
              style={{ height: "calc(58vh + 2.625rem)" }}
            >
              <h3 className="text-sm font-body font-medium text-white mb-3 shrink-0">Furniture styles</h3>
              {activeSection !== "dining" || viewMode !== "3D" ? (
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 text-center px-2">
                  <Lock className="h-5 w-5 text-white/30" strokeWidth={1.5} />
                  <p className="text-white/40 text-xs font-body leading-relaxed">
                    Open Dining in 3D to swap chair, table, and shelf styles.
                  </p>
                </div>
              ) : !furnitureOptions ? (
                <div className="flex-1 min-h-0 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-white/40 animate-spin" strokeWidth={1.5} />
                </div>
              ) : (
                <div className="chat-scrollbar flex-1 min-h-0 overflow-y-auto pr-1 space-y-5">
                  {furnitureOptions.chair_options.length > 1 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body mb-2">Chair style</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {furnitureOptions.chair_options.map((opt) => {
                          const active = furnitureOptions.current.chair_left === opt.left;
                          const thumb = furnitureOptions.thumbnails[opt.left];
                          return (
                            <button
                              key={opt.left}
                              onClick={() => applyChairOverride(opt)}
                              title={opt.left}
                              className={[
                                "rounded-xl overflow-hidden text-[10px] font-body text-center border transition-all",
                                active
                                  ? "bg-white/15 border-white shadow-[0_0_12px_-2px_rgba(255,255,255,0.5)]"
                                  : "bg-white/[0.06] border-white/15 hover:bg-white/15 hover:border-white/35",
                              ].join(" ")}
                            >
                              {thumb && (
                                <img
                                  src={`data:image/png;base64,${thumb}`}
                                  alt={opt.left}
                                  className="w-full aspect-square object-contain"
                                />
                              )}
                              <span className={`block px-1.5 py-1.5 truncate ${active ? "text-white font-medium" : "text-white/75"}`}>
                                {opt.left.replace(/^chair_left_/, "").replace(/_/g, " ")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {furnitureOptions.table_options.length > 1 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body mb-2">Table style</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {furnitureOptions.table_options.map((mid) => {
                          const active = furnitureOptions.current.table === mid;
                          const thumb = furnitureOptions.thumbnails[mid];
                          return (
                            <button
                              key={mid}
                              onClick={() => applyOverride({ table: mid })}
                              title={mid}
                              className={[
                                "rounded-xl overflow-hidden text-[10px] font-body text-center border transition-all",
                                active
                                  ? "bg-white/15 border-white shadow-[0_0_12px_-2px_rgba(255,255,255,0.5)]"
                                  : "bg-white/[0.06] border-white/15 hover:bg-white/15 hover:border-white/35",
                              ].join(" ")}
                            >
                              {thumb && (
                                <img
                                  src={`data:image/png;base64,${thumb}`}
                                  alt={mid}
                                  className="w-full aspect-square object-contain"
                                />
                              )}
                              <span className={`block px-1.5 py-1.5 truncate ${active ? "text-white font-medium" : "text-white/75"}`}>
                                {mid.replace(/^table_/, "").replace(/_/g, " ")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {furnitureOptions.shelf_options.length > 1 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body mb-2">Shelf style</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {furnitureOptions.shelf_options.map((mid) => {
                          const active = furnitureOptions.current.shelf === mid;
                          const thumb = furnitureOptions.thumbnails[mid];
                          return (
                            <button
                              key={mid}
                              onClick={() => applyOverride({ shelf: mid })}
                              title={mid}
                              className={[
                                "rounded-xl overflow-hidden text-[10px] font-body text-center border transition-all",
                                active
                                  ? "bg-white/15 border-white shadow-[0_0_12px_-2px_rgba(255,255,255,0.5)]"
                                  : "bg-white/[0.06] border-white/15 hover:bg-white/15 hover:border-white/35",
                              ].join(" ")}
                            >
                              {thumb && (
                                <img
                                  src={`data:image/png;base64,${thumb}`}
                                  alt={mid}
                                  className="w-full aspect-square object-contain"
                                />
                              )}
                              <span className={`block px-1.5 py-1.5 truncate ${active ? "text-white font-medium" : "text-white/75"}`}>
                                {mid.replace(/^shelf_/, "").replace(/_/g, " ")}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {furnitureOptions.chair_options.length <= 1 &&
                    furnitureOptions.table_options.length <= 1 &&
                    furnitureOptions.shelf_options.length <= 1 && (
                      <p className="text-white/35 text-xs font-body leading-relaxed pt-6 text-center">
                        No alternate styles available for this layout.
                      </p>
                    )}
                </div>
              )}
            </motion.div>

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
                                first step's own hint: a dismissible "Got it" pill,
                                same liquid-glass-strong style as the immersive-view
                                panorama walkthrough hints on Configurator.tsx, since
                                the plain small-caps label alone was too easy to miss. */}
                            <div className="absolute top-3 left-3 z-20 pointer-events-none">
                              <AnimatePresence mode="wait">
                                {!hasHoveredSection ? (
                                  <motion.div
                                    key="hint"
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.25 }}
                                    className="liquid-glass-strong rounded-xl px-4 py-3 flex items-center gap-3 pointer-events-auto"
                                  >
                                    <p className="font-body text-[12px] text-white/90 leading-snug whitespace-nowrap">
                                      See a glowing section? Hover or click it to explore
                                    </p>
                                    <button
                                      onClick={() => setHasHoveredSection(true)}
                                      className="shrink-0 px-3 py-1 rounded-full bg-white text-black text-[10px] font-body uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
                                    >
                                      Got it
                                    </button>
                                  </motion.div>
                                ) : hoveredSection ? (
                                  <motion.span
                                    key="readout"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="font-body text-[11px] uppercase tracking-[0.22em] text-white/60"
                                  >
                                    {hoveredSection}
                                  </motion.span>
                                ) : null}
                              </AnimatePresence>
                            </div>
                            {/* Ghost cursor tapping the glowing "living" demo zone —
                                same traveling-cursor mechanic as the section-tab hints
                                below, just anchored at that zone's hull centroid
                                (~53%, 45% in the 0–100 SVG viewBox) instead of centered
                                on a whole button, so the glow doesn't just sit there
                                unexplained until someone happens to mouse over it. */}
                            {!hasHoveredSection && (
                              <motion.div
                                className="absolute left-[53%] top-[45%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
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
                                  className="h-5 w-5 text-white"
                                  style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}
                                  fill="white"
                                  fillOpacity={0.15}
                                  strokeWidth={1.75}
                                />
                              </motion.div>
                            )}
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
                Explicit height: "58vh" on the aside itself (matching the
                viewport panel's own inline height), not h-full on an
                outer fixed-height wrapper — h-full depended on a CSS Grid
                row stretching to the viewport panel's height, which stopped
                holding once this page started rendering inside other
                wrappers (the Under the Hood popup) instead of only as its
                own top-level route, and the chat kept growing with the
                conversation instead of scrolling internally.
                The invisible tabs-row spacer below (after the aside, not
                before it) reproduces the Section-tabs row's own height +
                mb-3 margin, so this card's total height — and so its
                bottom edge — lines up with the viewport panel's, the same
                spacer trick the other configurator pages' chat panels use.
                liquid-glass + rounded-[1.25rem] live on THIS outer wrapper,
                not the aside — they used to be on the aside alone, which
                only covers the 58vh it's actually sized to, leaving the
                spacer's extra space see-through: the glow (also on this
                wrapper) reached the full aligned height, but the visible
                glass panel behind it stopped short of it. Moving the glass
                itself out here makes it span the same full height the glow
                already does — same structure the other configurator
                pages' chat wrappers use.
                The aside's own height below is 58vh PLUS the tabs-row's
                height/margin (rather than 58vh with a separate invisible
                spacer after it) — a separate spacer left the actual chat
                content (header/messages/input) sized to just the 58vh
                portion, floating in the upper part of the now-taller glass
                card with dead space below the input field. Folding that
                extra height into the aside itself instead lets its own
                flex children (the message list is flex-1) absorb it, so
                the content genuinely fills the card top-to-bottom. */}
            <div className={`liquid-glass rounded-[1.25rem] shadow-lg shadow-black/20 min-h-0 overflow-hidden flex flex-col ${hasClickedDining && introPhase !== "ready" ? "panel-glow-pulse" : ""}`}>
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="p-6 flex flex-col min-h-0 shrink-0"
              style={{ height: "calc(58vh + 2.625rem)" }}
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
