import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, ArrowRight, ArrowLeft, Send, Loader2, X, ChevronDown, ChevronLeft, ChevronRight, Compass, LayoutGrid, Maximize2, Minimize2, Clock, Zap, Weight, Square, ClipboardList, Users, CalendarRange, Laptop, Lock, Lightbulb, MousePointer2, type LucideIcon } from "lucide-react";
import BlurText from "@/components/BlurText";
import { Switch } from "@/components/ui/switch";
import landscapeBg from "@/assets/configurator-landscape-bg-v2.png";
// Generous Single ("solo:generous") dwelling's own art, from the
// .lovable/scenario 3 webapp handoff — a single base elevation (incomplete
// vs. complete) plus one full-canvas cutaway per room, each already aligned
// to the same 4096x3058 canvas as the base so they drop straight on top as
// plain full-bleed overlays (same technique the other configurator pages
// use for their own hotspot peeks — no per-zone positioning math needed).
import baseIncomplete from "@/assets/configurator-generous-base-incomplete.png";
import baseComplete from "@/assets/configurator-generous-base-complete.png";
import zoneBedSmallImg from "@/assets/configurator-generous-zone-bed-small.png";
import zoneBedImg from "@/assets/configurator-generous-zone-bed.png";
import zoneKitchenImg from "@/assets/configurator-generous-zone-kitchen.png";
import zoneDiningImg from "@/assets/configurator-generous-zone-dining.png";
import zoneBathroomImg from "@/assets/configurator-generous-zone-bathroom.png";
import zoneClosetImg from "@/assets/configurator-generous-zone-closet.png";
import zoneLivingImg from "@/assets/configurator-generous-zone-living.png";
// Add Zones chip thumbnails — the same round icon renders every other
// configurator page uses for Bed/Kitchen/Dining/Living (from the .lovable
// "icons for zone layout" folder), not the interior cutaway shots above.
// Bathroom and Closet have no equivalent icon in that set, so their chips
// keep using their own scenario-3 cutaway crop instead.
import chipBed from "@/assets/zone-bed.png";
import chipKitchen from "@/assets/zone-kitchen.png";
import chipDining from "@/assets/zone-dining.png";
import chipLiving from "@/assets/zone-living.png";
import topViewImg from "@/assets/configurator-top-view.jpg";
import assistantAvatar from "@/assets/engine-assistant-avatar.png";
import AddOnsPanel from "@/components/worlds/AddOnsPanel";
import OrderPanel from "@/components/worlds/OrderPanel";
import PaymentPanel from "@/components/worlds/PaymentPanel";
import EngineOnTheWayOverlay from "@/components/worlds/EngineOnTheWayOverlay";
import { useReservation } from "@/hooks/useReservation";
import { PARTS, PartId, DEPOSIT_RATE, DWELLING_VALUE } from "@/data/dwellingParts";
import { applyPlanDiscount } from "@/data/plans";
import { useMockAuth } from "@/context/MockAuth";
import { SITES } from "@/data/sites";

// Dwelling variant for "solo" occupants who picked the "generous" scale —
// the one dwelling combo that had no real build behind it (see
// OnboardingFlow/Discover's CONFIGURATOR_ROUTES, which used to point
// "solo:generous" at the couple page as a placeholder). Cloned from
// ConfiguratorSolo.tsx — same page chrome AND same step-by-step reveal
// logic (Site Selector -> Show Zones -> Add Zones -> Step Inside -> Continue
// configuration) as every other dwelling page, just re-pointed at the
// scenario-3 hand-off's art: one base render (incomplete/complete) and 6
// draggable room zones. The one structural difference: every zone here has
// a real render (the other pages only have one "hero" zone actually wired
// up, the rest sit locked/"coming soon"), so all 6 are interactive from the
// start, and Step Inside has no panorama behind it (no scene assets for
// this dwelling) — it still exists as the same final unlock step, it just
// doesn't have an "Explore more" button on any hotspot.

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

// Fallback replies for anything the baked demo doesn't recognize.
const UNRECOGNIZED_REQUEST_LINES = [
  (cap: string) => `That one's still on my blueprint table — for now the only trick I've fully loaded is ${cap}. Want to try that instead?`,
  (cap: string) => `Ambitious! I'm not wired up for that yet, but ${cap} is a move I can actually pull off right now.`,
  (cap: string) => `Filed under "coming soon." Until then, ${cap} is the only lever running end-to-end on my end.`,
  (cap: string) => `My circuits aren't tuned for that request yet — but ${cap}? Fully loaded and ready.`,
  (cap: string) => `I hear you, I just can't act on it yet. Right now ${cap} is the only thing I've got working end-to-end.`,
] as const;
function pickUnrecognizedReply(capability: string): string {
  const line = UNRECOGNIZED_REQUEST_LINES[Math.floor(Math.random() * UNRECOGNIZED_REQUEST_LINES.length)];
  return line(capability);
}

// Layout Zones — the 6 rooms the scenario-3 hand-off shipped art for. Bed is
// the one zone with two states: it starts as the smaller render/label and
// swaps to the full one once it's actually placed (see zoneLabel/
// zoneChipImage below).
type ZoneId = "bed" | "kitchen" | "dining" | "bathroom" | "closet" | "living";
type ZoneSize = "S" | "M" | "L";
const ALL_ZONE_IDS: ZoneId[] = ["bed", "kitchen", "dining", "bathroom", "closet", "living"];
const ZONE_LABELS: Record<ZoneId, string> = {
  bed: "Bed bigger", kitchen: "Kitchen", dining: "Dining", bathroom: "Bathroom", closet: "Closet", living: "Living",
};
// All 6 zones have real art from the scenario-3 hand-off, so — unlike
// Kitchen-only on ConfiguratorSolo.tsx / Plant Bay-only on
// ConfiguratorCouple.tsx — none of them are locked here; every dot and
// every Add Zones chip is live from the start.
const isZoneLocked = (_id: ZoneId) => false;
// The room's actual render, shown on the dwelling once it's placed.
const ZONE_CUTAWAY_IMAGES: Record<ZoneId, string> = {
  bed: zoneBedSmallImg, kitchen: zoneKitchenImg, dining: zoneDiningImg, bathroom: zoneBathroomImg, closet: zoneClosetImg, living: zoneLivingImg,
};
// The Add Zones chip's own thumbnail — the site's existing round icon
// renders for the 4 zones that have one; Bathroom and Closet fall back to
// their cutaway crop since no equivalent icon exists for them.
const ZONE_CHIP_IMAGES: Record<ZoneId, string> = {
  bed: chipBed, kitchen: chipKitchen, dining: chipDining, bathroom: zoneBathroomImg, closet: zoneClosetImg, living: chipLiving,
};
const DEFAULT_ZONE_SIZES: Record<ZoneId, ZoneSize> = {
  bed: "L", kitchen: "S", dining: "M", bathroom: "S", closet: "S", living: "M",
};
const zoneLabel = (id: ZoneId, placed: boolean) => (id === "bed" && placed ? "Bed" : ZONE_LABELS[id]);
const zoneCutawayImage = (id: ZoneId, placed: boolean) => (id === "bed" && placed ? zoneBedImg : ZONE_CUTAWAY_IMAGES[id]);
// Bed's chip stays the same generic bed icon in both states — only its
// label swaps ("Bed smaller" -> "Bed") — since the chip no longer shows the
// actual room render.
const zoneChipImage = (id: ZoneId) => ZONE_CHIP_IMAGES[id];

// Hotspot dot positions — top-center of each room's own alpha-channel
// bounding box (computed directly from the scenario-3 PNGs, not eyeballed),
// nudged down slightly so the dot sits just below the roofline instead of
// clipping it — same convention the other configurator pages use for their
// own DWELLING_HOTSPOTS.
const DWELLING_HOTSPOTS: { id: ZoneId; x: number; y: number }[] = [
  { id: "bathroom", x: 19.6, y: 41.8 },
  { id: "kitchen",  x: 29.6, y: 42.0 },
  { id: "dining",   x: 39.9, y: 44.1 },
  { id: "living",   x: 53.8, y: 40.3 },
  { id: "closet",   x: 67.5, y: 43.6 },
  { id: "bed",      x: 81.3, y: 42.2 },
];
const HOTSPOT_LABELS: Record<ZoneId, string> = ZONE_LABELS;

// Horizontal carousel card — same shape/behavior as every other
// configurator page's Add/Layout Zones strip (image on top, label below).
// Drag-out-to-viewport is done with raw pointer events + a portaled ghost
// rather than framer-motion's `drag` prop — a free-drag element nested
// inside the accordion's overflow-hidden wrapper would have its movement
// clipped to the panel, never reaching the viewport. A portal to
// document.body sidesteps that entirely.
function ZoneCard({
  zone,
  placed,
  onDragStart,
  onDragMove,
  onDragDrop,
  glow = false,
}: {
  zone: { id: ZoneId; size: ZoneSize };
  placed: boolean;
  onDragStart: (id: ZoneId) => void;
  onDragMove: (id: ZoneId, point: { x: number; y: number }) => void;
  onDragDrop: (id: ZoneId, point: { x: number; y: number }) => void;
  glow?: boolean;
}) {
  const image = zoneChipImage(zone.id);
  const locked = isZoneLocked(zone.id);
  const [isDraggingOut, setIsDraggingOut] = useState(false);
  const [ghostPos, setGhostPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDraggingOut) return;
    const onMove = (e: PointerEvent) => {
      const p = { x: e.clientX, y: e.clientY };
      setGhostPos(p);
      onDragMove(zone.id, p);
    };
    const onUp = (e: PointerEvent) => {
      onDragDrop(zone.id, { x: e.clientX, y: e.clientY });
      setIsDraggingOut(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraggingOut]);

  return (
    <div
      onPointerDown={
        locked || placed
          ? undefined
          : (e) => {
              e.preventDefault();
              setGhostPos({ x: e.clientX, y: e.clientY });
              setIsDraggingOut(true);
              onDragStart(zone.id);
            }
      }
      style={{ touchAction: locked || placed ? "auto" : "none" }}
      title={
        locked
          ? `${ZONE_LABELS[zone.id]} — coming soon`
          : placed
          ? zoneLabel(zone.id, placed)
          : `Drag onto the viewport to place the ${ZONE_LABELS[zone.id]} zone`
      }
      className={`relative shrink-0 w-14 snap-start ${
        locked ? "cursor-not-allowed" : placed ? "cursor-default" : "cursor-grab active:cursor-grabbing"
      } ${isDraggingOut ? "opacity-30" : ""}`}
    >
      <div className={`w-14 h-14 rounded-full ${glow ? "panel-glow-pulse" : ""}`}>
        <div
          className={`w-full h-full rounded-full overflow-hidden border transition-colors ${
            locked
              ? "opacity-40 border-white/10"
              : placed
              ? "opacity-60 border-white/10"
              : "border-white/20 hover:border-white/50"
          }`}
        >
          <img
            src={image}
            alt=""
            className={`w-full h-full object-cover pointer-events-none ${locked ? "grayscale" : ""}`}
          />
        </div>
      </div>
      <p className="text-[8px] font-body text-white/70 text-center truncate px-0.5 py-0.5">
        {locked ? "Coming soon" : zoneLabel(zone.id, placed)}
      </p>
      {locked && (
        <Lock
          className="absolute top-0 right-0 h-2.5 w-2.5 text-white/50"
          strokeWidth={2}
          aria-label={`${ZONE_LABELS[zone.id]} locked`}
        />
      )}

      {isDraggingOut && createPortal(
        <img
          src={image}
          alt=""
          className="fixed z-[999] pointer-events-none w-10 h-10 rounded-full object-cover shadow-2xl scale-110"
          style={{ left: ghostPos.x, top: ghostPos.y, transform: "translate(-50%, -50%)" }}
        />,
        document.body,
      )}
    </div>
  );
}

export default function ConfiguratorSoloGenerous() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPlan, confirmPlan } = useMockAuth();
  const [showNext, setShowNext] = useState(false);
  const r = useReservation();
  const stage: "design" | "customise" | "plans" | "payment" | "confirmed" =
    !showNext ? "design"
    : r.stage === "summary" ? "plans"
    : r.stage === "payment" ? "payment"
    : r.stage === "confirmed" ? "confirmed"
    : "customise";

  const RIGHT_COL_ORDER = { customise: 0, plans: 1, payment: 2 } as const;
  const rightColIndex = stage in RIGHT_COL_ORDER ? RIGHT_COL_ORDER[stage as keyof typeof RIGHT_COL_ORDER] : 0;
  const prevRightColIndexRef = useRef(rightColIndex);
  const rightColDirection = rightColIndex - prevRightColIndexRef.current;
  useEffect(() => { prevRightColIndexRef.current = rightColIndex; }, [rightColIndex]);

  const enterCustomise = () => { setShowNext(true); r.setStage("configure"); };
  const pricedTotals = applyPlanDiscount(r.totals, selectedPlan, DEPOSIT_RATE);
  const handlePartToggle = (p: PartId) => r.setActive(r.activePart === p ? null : p);
  const handleOptionSelect = (optionId: string) => {
    const current = r.activePart;
    if (!current) return;
    r.selectOption(current, optionId);
    const idx = PARTS.findIndex((p) => p.id === current);
    const next = PARTS.slice(idx + 1).find((p) => !p.locked && !r.configured.has(p.id));
    r.setActive(next ? next.id : null);
  };

  const gridCols =
    stage === "payment" ? "lg:grid-cols-[0px_1fr_460px]"
    : stage === "plans" ? "lg:grid-cols-[0px_1fr_640px]"
    : "lg:grid-cols-[220px_1fr_360px]";
  const [engineReady, setEngineReady] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [showLayoutZones, setShowLayoutZones] = useState(false);
  // Toggle for the whole "glow whichever step is next" demo hint below.
  const [glowHintsEnabled, setGlowHintsEnabled] = useState(true);
  // Same progressive-unlock chain as the other configurator pages: Your
  // Summary is static (counts as seen immediately) -> Site Selector ->
  // Show Zones (reveals the glowing dots) -> Add Zones (drag a room onto
  // the dwelling) -> Step Inside (final unlock) -> Continue configuration.
  const briefSeen = true;
  const [siteSeen, setSiteSeen] = useState(false);
  const [siteChangeCount, setSiteChangeCount] = useState(0);
  const markSiteChanged = () => setSiteChangeCount((n) => n + 1);
  const [dotsRevealed, setDotsRevealed] = useState(false);
  const [zonesSeen, setZonesSeen] = useState(false);
  const [exploreUnlocked, setExploreUnlocked] = useState(false);
  const [exploreSeen, setExploreSeen] = useState(false);
  const [zones] = useState<{ id: ZoneId; size: ZoneSize }[]>(
    ALL_ZONE_IDS.map((id) => ({ id, size: DEFAULT_ZONE_SIZES[id] })),
  );
  const zoneScrollRef = useRef<HTMLDivElement>(null);
  const scrollStrip = (ref: React.RefObject<HTMLDivElement>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * 84, behavior: "smooth" });
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)));
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoneDragOver, setIsZoneDragOver] = useState(false);
  // Which rooms have actually been dropped onto the dwelling — drives the
  // cutaway overlays, the base-complete swap, and zoneAdded below. Every
  // zone here gets its own real cutaway once dropped (unlike the other
  // pages, where only the one "hero" zone actually changes the render and
  // the rest just drop an arbitrary pin) since scenario-3 shipped art for
  // all 6 rooms.
  const [placedZones, setPlacedZones] = useState<Set<ZoneId>>(new Set());
  const [activeCutaway, setActiveCutaway] = useState<ZoneId | null>(null);
  const [clickedHotspotId, setClickedHotspotId] = useState<ZoneId | null>(null);
  const [showHotspotHint, setShowHotspotHint] = useState(true);
  const dismissHotspotHint = () => setShowHotspotHint(false);
  const [rewardBurst, setRewardBurst] = useState<{ x: number; y: number } | null>(null);
  const [zoneDropToast, setZoneDropToast] = useState(false);
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

  // zoneAdded gates the rest of the flow (Step Inside, hints, etc.) on any
  // zone being placed — same as before, regardless of how it got placed.
  const zoneAdded = placedZones.size > 0;
  // Bed is the one zone with two renders, and the swap from the smaller one
  // to the full one — along with the base's own incomplete->complete
  // swap — only happens via an actual Add Zones drop, never from just
  // clicking Bed's dot (that only ever peeks the smaller render, same as
  // every other zone's dot). Separate from placedZones, which just tracks
  // "has this zone been opened at least once" for the generic zoneAdded/
  // chip-lock bookkeeping below.
  const [bedUpgraded, setBedUpgraded] = useState(false);
  const dwellingComplete = bedUpgraded;
  // Bed's own display state (label + image, both on its chip and on the
  // dwelling) reads bedUpgraded instead of the generic "has it been
  // placed" flag every other zone uses — see zoneLabel/zoneCutawayImage.
  const zonePlacedForDisplay = (id: ZoneId) => (id === "bed" ? bedUpgraded : placedZones.has(id));

  const focusHotspot = (h: { id: ZoneId; x: number; y: number }) => {
    setActiveCutaway((open) => (open === h.id ? null : h.id));
  };

  // Shared by both ways to reveal a zone — clicking its glowing dot directly
  // on the dwelling (peek only), and dragging its chip out of Add Zones and
  // dropping it on the viewport. `upgrade` is only ever passed true for
  // Bed's drag-drop — the one path allowed to swap it up to the full render
  // and flip the base to complete. Bed's chip stays draggable even after
  // its dot has already been peeked (see the `placed` prop passed to its
  // ZoneCard below), so this still needs to run again in that case, unlike
  // every other zone which is done for good after its first placement.
  const placeZone = (id: ZoneId, opts: { upgrade?: boolean } = {}) => {
    if (isZoneLocked(id)) return;
    const isBedUpgradeDrop = id === "bed" && opts.upgrade;
    if (placedZones.has(id) && !isBedUpgradeDrop) return;
    setPlacedZones((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    if (isBedUpgradeDrop) setBedUpgraded(true);
    setZoneDropToast(true);
    setTimeout(() => setZoneDropToast(false), 2500);
    setClickedHotspotId(id);
    setActiveCutaway(id);
  };

  const isPointInViewport = (point: { x: number; y: number }) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  };
  const [draggedZoneId, setDraggedZoneId] = useState<ZoneId | null>(null);
  const handleZoneDragStart = (id: ZoneId) => setDraggedZoneId(id);
  const handleZoneDragMove = (id: ZoneId, point: { x: number; y: number }) => {
    setIsZoneDragOver(isPointInViewport(point));
    setDraggedZoneId(id);
  };
  const handleZoneDragDrop = (id: ZoneId, point: { x: number; y: number }) => {
    if (isPointInViewport(point)) placeZone(id, { upgrade: id === "bed" });
    setIsZoneDragOver(false);
    setDraggedZoneId(null);
  };

  useEffect(() => {
    const t = setTimeout(() => setEngineReady(true), 3500);
    return () => clearTimeout(t);
  }, []);

  // Engine Assistant chat
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  type InitState = {
    spec?: Record<string, unknown>; dwelling_spec?: Record<string, unknown>;
    reply?: string; suggestions?: string[];
    site?: Record<string, unknown>; answers?: Record<string, string>;
  };
  const locationState: InitState | null = (() => {
    try {
      const raw = localStorage.getItem("configuratorInit")
               ?? sessionStorage.getItem("configuratorInit");
      if (raw) return JSON.parse(raw) as InitState;
    } catch { /* ignore */ }
    return (location.state as InitState | null) ?? null;
  })();
  const [spec] = useState<Record<string, unknown>>(
    locationState?.spec ?? {
      dining_style: "compact", num_chairs: 2, h: 7, d: 3,
      roof_style: "any", preferred_tags: [], corridor_side: "none", corridor_w: 2, seed: 42,
    },
  );
  const apiOnline = true;
  const [viewMode, setViewMode] = useState<"3D" | "plan">("3D");

  const _answers = locationState?.answers ?? {};
  const _occMap: Record<string, string> = {
    solo: "just you", couple: "two people",
    family: "your family", group: "a large group",
  };
  const _purMap: Record<string, string> = {
    work: "remote work", retreat: "relaxation",
    social: "hosting guests", research: "field research",
  };
  const _occStr = _occMap[_answers.occupants ?? ""] ?? "";
  const _purStr = _purMap[_answers.purpose ?? ""] ?? "";

  const _BRIEF_LABELS: Record<string, { label: string; Icon: LucideIcon }> = {
    occupants: { label: "People",   Icon: Users },
    duration:  { label: "Stay",     Icon: CalendarRange },
    purpose:   { label: "Use",      Icon: Laptop },
    priority:  { label: "Priority", Icon: Zap },
    scale:     { label: "Scale",    Icon: Square },
  };
  const _prettyAnswer = (v: string) =>
    v
      .replace(/^(\d+)_(\d+)_/, "$1–$2 ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const _briefRows = Object.entries(_BRIEF_LABELS)
    .filter(([key]) => _answers[key])
    .map(([key, { label, Icon }]) => ({ label, Icon, value: _prettyAnswer(_answers[key]) }));
  const _onboardingSiteName = String(locationState?.site?.name ?? "");
  const _onboardingSiteRegion = String(locationState?.site?.location ?? "");

  const _fallbackSite = SITES.find((s) => s.title === "Skye Moor")!;
  const _primarySite = SITES.find((s) => s.title === _onboardingSiteName) ?? {
    ..._fallbackSite,
    title: _onboardingSiteName || _fallbackSite.title,
    region: _onboardingSiteRegion || _fallbackSite.region,
  };
  const _pinnedSite = SITES.find((s) => s.title === "Atacama Plateau" && !s.locked);
  const _otherSites = SITES.filter(
    (s) => !s.locked && s.title !== _primarySite.title && s.title !== _pinnedSite?.title,
  );
  const _extraSites = [
    ...(_pinnedSite && _pinnedSite.title !== _primarySite.title ? [_pinnedSite] : []),
    ..._otherSites,
  ]
    .map((s) => (s.landscapeImage ? { ...s, image: s.landscapeImage } : s))
    .slice(0, 3);
  const SITE_OPTIONS = [_primarySite, ..._extraSites];
  const [selectedSiteIdx, setSelectedSiteIdx] = useState(0);
  const activeSite = SITE_OPTIONS[selectedSiteIdx] ?? SITE_OPTIONS[0];
  // Coverflow-style site strip that loops: a clone of the last site is
  // prepended and a clone of the first is appended, so there's always a
  // real card peeking on both sides — including past the actual ends.
  // Navigation (arrows, card taps, swipe) always just scrolls the strip;
  // once the scroll settles, if it landed on a clone we instantly (no
  // animation) reposition onto the matching real card, so looping past
  // either end feels continuous instead of sliding back across the list.
  // Same mechanism as ConfiguratorSolo.tsx's Site Selector, ported as-is.
  const _loopedSiteOptions = SITE_OPTIONS.length > 1
    ? [SITE_OPTIONS[SITE_OPTIONS.length - 1], ...SITE_OPTIONS, SITE_OPTIONS[0]]
    : SITE_OPTIONS;
  const _lastLoopIdx = _loopedSiteOptions.length - 1;
  const siteCarouselRef = useRef<HTMLDivElement | null>(null);
  const siteCarouselRoRef = useRef<ResizeObserver | null>(null);
  const siteCardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Tracks which loop index we're moving/moved to, updated synchronously
  // on every call — independent of `selectedSiteIdx`, which only catches up
  // once the debounced scroll-settle handler fires. The arrows read this
  // instead of `selectedSiteIdx` so a quick run of clicks keeps advancing
  // one step each, rather than several clicks in a row all re-targeting the
  // same still-stale position (which read as the strip "glitching" —
  // clicks not registering, or jumping more than one card at a time).
  const currentSiteLoopIdxRef = useRef(1);
  // Centers the given card by hand rather than via scrollIntoView — with a
  // scrollable ancestor chain (this strip inside an animated panel inside
  // the page), the browser's own "center" alignment doesn't reliably land
  // on the math we need for the loop trick below. Uses getBoundingClientRect
  // (viewport-relative, unambiguous) rather than offsetLeft — offsetLeft is
  // relative to the nearest *positioned* ancestor, which isn't necessarily
  // this scroll container, and was throwing every centering calc off by a
  // constant amount (the active card never actually reached true center).
  const scrollToSiteLoopIdx = useCallback((loopIdx: number, smooth = true) => {
    const container = siteCarouselRef.current;
    const card = siteCardRefs.current[loopIdx];
    if (!container || !card) return;
    currentSiteLoopIdxRef.current = loopIdx;
    const containerRect = container.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const cardCenterInContent = cardRect.left - containerRect.left + cardRect.width / 2 + container.scrollLeft;
    const target = cardCenterInContent - container.clientWidth / 2;
    container.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  }, []);
  // The strip lives inside a collapsed-by-default panel, so a plain
  // mount effect never sees the DOM node (it's still null at that point) —
  // this ref callback fires exactly when the panel expands and the strip
  // actually mounts instead. It measures the container in JS and applies
  // the card/spacer widths as CSS custom properties (percentage widths on
  // flex children of a `flex-1` container don't resolve against the size
  // this element actually ends up with, so pixel values measured straight
  // off the DOM are what let the boundary/clone cards reach true center,
  // which the loop trick above depends on), then lands centered on the
  // real first card — with the loop-clone peeking on its left — instead of
  // starting on the clone itself.
  const setSiteCarouselEl = useCallback((el: HTMLDivElement | null) => {
    siteCarouselRef.current = el;
    siteCarouselRoRef.current?.disconnect();
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const cardW = Math.round(w * 0.7);
      const spacerW = Math.max(0, Math.round((w - cardW) / 2));
      el.style.setProperty("--site-card-w", `${cardW}px`);
      el.style.setProperty("--site-spacer-w", `${spacerW}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    siteCarouselRoRef.current = ro;
    if (SITE_OPTIONS.length > 1) scrollToSiteLoopIdx(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollToSiteLoopIdx]);
  const siteScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  // A raw swipe/drag doesn't go through the arrow or card click handlers
  // (the only other places that mark siteChanged), so it's tracked here
  // instead — compared against the last real index this same handler saw,
  // which starts out matching the strip's own starting position, so the
  // very first settle right after mount correctly reads as "no change".
  const lastSettledSiteIdxRef = useRef(0);
  const handleSiteCarouselScroll = () => {
    if (siteScrollTimeoutRef.current) clearTimeout(siteScrollTimeoutRef.current);
    siteScrollTimeoutRef.current = setTimeout(() => {
      const container = siteCarouselRef.current;
      if (!container) return;
      const containerRect = container.getBoundingClientRect();
      const viewportCenter = containerRect.left + container.clientWidth / 2;
      let nearestLi = 0, nearestDist = Infinity;
      siteCardRefs.current.forEach((card, li) => {
        if (!card) return;
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;
        const dist = Math.abs(cardCenter - viewportCenter);
        if (dist < nearestDist) { nearestDist = dist; nearestLi = li; }
      });
      let finalRealIdx: number;
      if (nearestLi === 0) {
        scrollToSiteLoopIdx(_lastLoopIdx - 1, false);
        finalRealIdx = SITE_OPTIONS.length - 1;
      } else if (nearestLi === _lastLoopIdx) {
        scrollToSiteLoopIdx(1, false);
        finalRealIdx = 0;
      } else {
        finalRealIdx = nearestLi - 1;
      }
      setSelectedSiteIdx(finalRealIdx);
      if (finalRealIdx !== lastSettledSiteIdxRef.current) markSiteChanged();
      lastSettledSiteIdxRef.current = finalRealIdx;
    }, 130);
  };
  const _siteName = activeSite.title;
  const _landscapeBg = activeSite.landscapeImage ?? landscapeBg;
  const _landscapeZoom = activeSite.landscapeImage ? activeSite.landscapeZoom ?? 1 : 1;

  const greeting: string = locationState?.reply?.trim()
    ? locationState.reply
    : _siteName
      ? `Hi! I'm your Engine Assistant. I've designed a ${String(spec.dining_style ?? "compact")} dwelling${_occStr ? ` for ${_occStr}` : ""} at ${_siteName}${_purStr ? `, suited for ${_purStr}` : ""}. Is there anything you'd like to adjust?`
      : "Hi! I'm your Engine Assistant. Is there anything you'd like to adjust about your dwelling?";

  const suggestions: string[] = ["Add bracings", "Add a skylight", "Make it wider"];
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<"idle" | "typing" | "streaming" | "ready">("idle");

  useEffect(() => {
    if (!engineReady || !exploreSeen) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setIntroPhase("typing"), 1000));
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
            timers.push(setTimeout(() => { setIntroPhase("ready"); setShowSuggestions(true); }, 250));
          }
        };
        step();
      }, 2400),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineReady, exploreSeen]);

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
    await new Promise((res) => setTimeout(res, 400));
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = { role: "assistant", content: pickUnrecognizedReply("dropping zones onto the dwelling") };
      return next;
    });
    setIsStreaming(false);
    setShowSuggestions(true);
  };

  const _areaCm2 = (8 * 40) * (3 * 40);
  const _areaM2Num = _areaCm2 / 10000;
  const _assembly = Math.round(6.5 + _areaM2Num * 1.2);
  const _energy = (1.8 + _areaM2Num * 0.5).toFixed(1);
  const _mass = (0.25 + _areaM2Num * 0.13).toFixed(2);

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
              className="flex items-center gap-3"
            >
              {stage === "design" && (
                <label className="liquid-glass rounded-full pl-3 pr-1.5 py-1.5 inline-flex items-center gap-2 text-xs font-body text-white/70 cursor-pointer">
                  <Lightbulb className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Hints
                  <Switch
                    checked={glowHintsEnabled}
                    onCheckedChange={setGlowHintsEnabled}
                    aria-label="Toggle step-by-step glow hints"
                    className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/15 scale-90"
                  />
                </label>
              )}
              {stage === "design" ? (
                <button
                  onClick={enterCustomise}
                  disabled={!exploreSeen}
                  title={!exploreSeen ? "Open Site Selector, show the zones, add a zone, and step inside first" : undefined}
                  className={`bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${glowHintsEnabled && exploreSeen ? "panel-glow-pulse" : ""}`}
                >
                  {exploreSeen
                    ? <>Continue configuration <ArrowRight className="h-4 w-4" strokeWidth={2} /></>
                    : <>Continue configuration <Lock className="h-3.5 w-3.5" strokeWidth={2} /></>}
                </button>
              ) : stage === "plans" || stage === "payment" ? (
                <button
                  onClick={stage === "plans" ? () => r.setStage("configure") : () => r.setStage("summary")}
                  className="liquid-glass rounded-full px-5 py-2.5 text-sm font-body font-medium text-white/85 inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2} />
                  {stage === "plans" ? "Back to add-ons" : "Back to plans"}
                </button>
              ) : null}
            </motion.div>
          </div>

          <div
            className={`mt-10 grid grid-cols-1 gap-5 items-start ${gridCols}`}
            style={{ transition: "grid-template-columns 600ms cubic-bezier(0.6,0.2,0.2,1)" }}
          >
            {/* LEFT COLUMN */}
            <div className="flex flex-col gap-4 min-w-0">
              {stage === "customise" && (
                <div className={`rounded-[1.5rem] ${glowHintsEnabled && !r.activePart && r.configured.size === 0 ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-center gap-1.5 px-1 pb-2">
                    <span className="text-[10px] font-body uppercase tracking-[0.12em] text-white/60">Add-ons</span>
                  </div>
                  <AddOnsPanel
                    activePart={r.activePart}
                    configured={r.configured}
                    onTogglePart={handlePartToggle}
                    onSelectOption={handleOptionSelect}
                  />
                </motion.aside>
                </div>
              )}

              <div className={stage === "design" ? "flex flex-col gap-3" : "hidden"}>
                <motion.div
                  initial={blurInit}
                  animate={blurIn}
                  transition={{ duration: 0.7, delay: 0.65, ease: "easeOut" }}
                  className="px-1 pb-2 border-b border-white/10"
                >
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] text-white/50">
                    <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Your Summary
                  </span>
                  <div className="pt-2">
                    {_briefRows.length ? (
                      <dl className="space-y-1.5">
                        {_briefRows.map(({ label, Icon, value }) => (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <dt className="inline-flex items-center gap-1.5 text-[9px] font-body uppercase tracking-[0.1em] text-white/40 shrink-0">
                              <Icon className="h-3 w-3 text-white/45 shrink-0" strokeWidth={1.75} />
                              {label}
                            </dt>
                            <dd className="text-[10px] font-body text-white/85 text-right truncate">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : (
                      <p className="text-[10px] font-body text-white/40 leading-relaxed">
                        No questionnaire answers on file — this design is using defaults.
                      </p>
                    )}
                  </div>
                </motion.div>

                <div className={`rounded-[1.5rem] ${glowHintsEnabled && !siteSeen ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={blurInit}
                  animate={blurIn}
                  transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <button
                    onClick={() => {
                      if (!briefSeen) return;
                      const next = !showSiteSelector;
                      setShowSiteSelector(next);
                      if (next) setSiteSeen(true);
                    }}
                    className="w-full flex items-center justify-between group"
                    aria-expanded={showSiteSelector}
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] text-white/60">
                      <Compass className="h-3.5 w-3.5" strokeWidth={1.75} />
                      Site Selector
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-white/50 group-hover:text-white transition-transform duration-300 ${showSiteSelector ? "rotate-180" : ""}`}
                      strokeWidth={1.75}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {showSiteSelector && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 flex items-center gap-1">
                          {SITE_OPTIONS.length > 1 && (
                            <button
                              onClick={() => scrollToSiteLoopIdx(currentSiteLoopIdxRef.current - 1)}
                              className="shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                              aria-label="Previous site"
                            >
                              <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                          )}

                          <div
                            ref={setSiteCarouselEl}
                            onScroll={handleSiteCarouselScroll}
                            className="flex-1 min-w-0 flex gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          >
                            <div className="shrink-0 w-[var(--site-spacer-w)]" aria-hidden />
                            {_loopedSiteOptions.map((opt, li) => {
                              const realIdx = li === 0 ? SITE_OPTIONS.length - 1 : li === _lastLoopIdx ? 0 : li - 1;
                              const active = realIdx === selectedSiteIdx;
                              return (
                                <button
                                  key={`${opt.title}-${li}`}
                                  ref={(el) => (siteCardRefs.current[li] = el)}
                                  onClick={() => scrollToSiteLoopIdx(li)}
                                  aria-label={`Switch to ${opt.title}`}
                                  aria-pressed={active}
                                  className={[
                                    "shrink-0 w-[var(--site-card-w)] text-left rounded-[0.6rem] overflow-hidden border transition-all duration-300",
                                    active
                                      ? "border-white/30 opacity-100 scale-100"
                                      : "border-white/10 opacity-40 scale-[0.93]",
                                  ].join(" ")}
                                >
                                  {opt.image ? (
                                    <img src={opt.image} alt={opt.title} className="w-full h-16 object-cover" />
                                  ) : (
                                    <div className="w-full h-16 bg-white/5" />
                                  )}
                                  <div className="p-1.5">
                                    <p className="text-[10px] font-body text-white/90 truncate">{opt.title}</p>
                                    {active && opt.region && (
                                      <p className="text-[9px] font-body text-white/50 truncate">{opt.region}</p>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                            <div className="shrink-0 w-[var(--site-spacer-w)]" aria-hidden />
                          </div>

                          {SITE_OPTIONS.length > 1 && (
                            <button
                              onClick={() => scrollToSiteLoopIdx(currentSiteLoopIdxRef.current + 1)}
                              className="shrink-0 w-6 h-6 rounded-full inline-flex items-center justify-center bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                              aria-label="Next site"
                            >
                              <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.aside>
                </div>

                <div className={`rounded-[1.5rem] ${glowHintsEnabled && siteChangeCount >= 1 && !dotsRevealed ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={blurInit}
                  animate={blurIn}
                  transition={{ duration: 0.7, delay: 0.725, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] ${siteSeen ? "text-white/60" : "text-white/30"}`}>
                      {siteSeen ? <Zap className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Lock className="h-3 w-3" strokeWidth={1.75} />}
                      Show Zones
                    </span>
                    <Switch
                      checked={dotsRevealed}
                      disabled={!siteSeen}
                      onCheckedChange={(checked) => {
                        if (!siteSeen) return;
                        setDotsRevealed(checked);
                      }}
                      aria-label="Show the glowing zone dots on the dwelling"
                      title={!siteSeen ? "Open Site Selector first" : undefined}
                      className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/15"
                    />
                  </div>
                </motion.aside>
                </div>

                <div className={`rounded-[1.5rem] ${glowHintsEnabled && dotsRevealed && !zonesSeen ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={blurInit}
                  animate={blurIn}
                  transition={{ duration: 0.7, delay: 0.75, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <button
                    onClick={() => {
                      if (!dotsRevealed) return;
                      const next = !showLayoutZones;
                      setShowLayoutZones(next);
                      if (next) setZonesSeen(true);
                      dismissHotspotHint();
                      setClickedHotspotId(null);
                      setActiveCutaway(null);
                    }}
                    disabled={!dotsRevealed}
                    className="w-full flex items-center justify-between group disabled:cursor-not-allowed"
                    aria-expanded={showLayoutZones}
                    title={!dotsRevealed ? "Reveal the zones first" : undefined}
                  >
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] ${dotsRevealed ? "text-white/60" : "text-white/30"}`}>
                      {dotsRevealed ? <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Lock className="h-3 w-3" strokeWidth={1.75} />}
                      Add Zones
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-white/50 group-hover:text-white transition-transform duration-300 ${showLayoutZones ? "rotate-180" : ""} ${dotsRevealed ? "" : "opacity-0"}`}
                      strokeWidth={1.75}
                    />
                  </button>
                  <p className="text-[10px] font-body text-white/40 leading-relaxed pt-1.5">
                    Drag a zone onto the dwelling to add it.
                  </p>

                  <AnimatePresence initial={false}>
                    {showLayoutZones && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 flex items-center gap-1">
                          <button
                            onClick={() => scrollStrip(zoneScrollRef, -1)}
                            className="shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft className="h-3 w-3" strokeWidth={2} />
                          </button>
                          <div ref={zoneScrollRef} className="flex-1 flex gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory">
                            {zones.map((z) => (
                              <ZoneCard
                                key={z.id}
                                zone={z}
                                placed={zonePlacedForDisplay(z.id)}
                                onDragStart={handleZoneDragStart}
                                onDragMove={handleZoneDragMove}
                                onDragDrop={handleZoneDragDrop}
                                glow={glowHintsEnabled && !zoneAdded}
                              />
                            ))}
                          </div>
                          <button
                            onClick={() => scrollStrip(zoneScrollRef, 1)}
                            className="shrink-0 w-4 h-4 rounded-full inline-flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            aria-label="Scroll right"
                          >
                            <ChevronRight className="h-3 w-3" strokeWidth={2} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.aside>
                </div>

                <div className={`rounded-[1.5rem] ${glowHintsEnabled && zoneAdded && !exploreSeen ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={blurInit}
                  animate={blurIn}
                  transition={{ duration: 0.7, delay: 0.775, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] ${zoneAdded ? "text-white/60" : "text-white/30"}`}>
                      {zoneAdded ? <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Lock className="h-3 w-3" strokeWidth={1.75} />}
                      Step Inside
                    </span>
                    <Switch
                      checked={exploreUnlocked}
                      disabled={!zoneAdded}
                      onCheckedChange={(checked) => {
                        if (!zoneAdded) return;
                        setExploreUnlocked(checked);
                        if (checked) setExploreSeen(true);
                      }}
                      aria-label="Unlock the rest of the configurator"
                      title={!zoneAdded ? "Drop a zone onto the dwelling first" : undefined}
                      className="data-[state=checked]:bg-white data-[state=unchecked]:bg-white/15"
                    />
                  </div>
                </motion.aside>
                </div>
              </div>
            </div>

            {/* VIEWPORT */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
              className="relative flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  <span className="px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] bg-white text-black font-medium">
                    dwelling
                  </span>
                </div>
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  {(["3D", "plan"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className={[
                        "px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] transition-all",
                        viewMode === v ? "bg-white text-black font-medium" : "text-white/50 hover:text-white/80",
                      ].join(" ")}
                    >
                      {v === "3D" ? "Elevation" : v}
                    </button>
                  ))}
                </div>
              </div>

              <div
                ref={viewportRef}
                className={[
                  isFullscreen
                    ? "relative w-full h-full overflow-hidden liquid-glass rounded-none"
                    : "relative rounded-[1.25rem] overflow-hidden liquid-glass",
                  isZoneDragOver ? "ring-2 ring-white/50" : "",
                ].join(" ")}
                style={isFullscreen ? undefined : { height: "58vh" }}
              >
                <AnimatePresence mode="wait">
                  {engineReady && (
                    viewMode === "plan" ? (
                      <motion.div
                        key="plan-view"
                        className="absolute inset-0"
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: zoom }}
                        exit={{ opacity: 0, scale: 1.04 }}
                        transition={{ opacity: { duration: 0.5, ease: "easeOut" }, scale: { type: "spring", stiffness: 220, damping: 26 } }}
                      >
                        <img src={topViewImg} alt="Dwelling plan view" className="absolute inset-0 w-full h-full object-contain bg-[#faf8f4]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="scene-3d"
                        className="absolute inset-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, scale: zoom }}
                        exit={{ opacity: 0 }}
                        transition={{ opacity: { duration: 0.5, ease: "easeOut" }, scale: { type: "spring", stiffness: 220, damping: 26 } }}
                      >
                        <img
                          src={_landscapeBg}
                          alt=""
                          aria-hidden
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{ transform: `scale(${_landscapeZoom})` }}
                        />
                        <div className="absolute inset-0 bg-black/30" aria-hidden />

                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div
                            className="relative translate-y-8"
                            style={{ aspectRatio: "4096/3058", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}
                          >
                            {/* Base elevation — incomplete (torn edge) until the
                                first zone lands, then complete for good. */}
                            <img
                              src={dwellingComplete ? baseComplete : baseIncomplete}
                              alt="Dwelling"
                              className="w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            />
                            {/* Whichever room is currently open — same peek
                                mechanic as the compact solo dwelling's
                                CUTAWAY_IMAGES: only one shows at a time, not
                                a running collection of every zone ever
                                opened. Opening a different dot swaps this
                                straight to that room instead of layering on
                                top of the last one. */}
                            {ALL_ZONE_IDS.map((id) => (
                              <img
                                key={id}
                                src={zoneCutawayImage(id, zonePlacedForDisplay(id))}
                                alt={`${HOTSPOT_LABELS[id]} detail`}
                                className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                                style={{ opacity: activeCutaway === id ? 1 : 0 }}
                              />
                            ))}

                            {/* Glowing zone dots — held back until "Show Zones"
                                is switched on, then power on one by one. */}
                            {dotsRevealed && DWELLING_HOTSPOTS.filter((h) => !isZoneLocked(h.id)).map((h, i) => (
                              <div
                                key={h.id}
                                className="group absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11"
                                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                              >
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.2 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 15 }}
                                  className="absolute inset-0"
                                >
                                  <button
                                    className="absolute inset-0"
                                    aria-label={`Zone ${HOTSPOT_LABELS[h.id]}`}
                                    onClick={() => {
                                      if (showHotspotHint) {
                                        setRewardBurst({ x: h.x, y: h.y });
                                        setTimeout(() => setRewardBurst(null), 1000);
                                      }
                                      dismissHotspotHint();
                                      // Clicking an empty dot places that zone right
                                      // there, same as dragging its chip onto the
                                      // viewport — the PNG shows up on the dwelling,
                                      // not just as a thumbnail back in Add Zones.
                                      // Clicking an already-placed dot just re-opens
                                      // its name tag.
                                      if (!placedZones.has(h.id)) {
                                        placeZone(h.id);
                                      } else {
                                        setClickedHotspotId((id) => (id === h.id ? null : h.id));
                                        focusHotspot(h);
                                      }
                                    }}
                                  >
                                    <span
                                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full blur-md opacity-75 transition-all duration-300 group-hover:opacity-100 group-hover:w-14 group-hover:h-14"
                                      style={{
                                        background: "radial-gradient(circle, rgba(110,190,240,0.65) 0%, rgba(110,190,240,0.25) 45%, rgba(110,190,240,0) 75%)",
                                      }}
                                      aria-hidden
                                    />
                                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white transition-all duration-300 group-hover:w-3 group-hover:h-3" />
                                  </button>
                                </motion.div>
                                <div
                                  className={[
                                    "absolute left-1/2 bottom-full -translate-x-1/2 mb-3 transition-all duration-300 whitespace-nowrap",
                                    clickedHotspotId === h.id || activeCutaway === h.id
                                      ? "opacity-100 translate-y-0 pointer-events-auto"
                                      : "opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0",
                                  ].join(" ")}
                                >
                                  <div className="liquid-glass-strong rounded-xl px-3.5 py-2.5 flex flex-col items-center gap-1">
                                    <span className="font-body text-[11px] uppercase tracking-[0.14em] text-white/90">
                                      {zoneLabel(h.id, zonePlacedForDisplay(h.id))}
                                    </span>
                                    {!placedZones.has(h.id) && (
                                      <span className="font-body text-[9px] text-white/50">Not added yet</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Arrival nudge — shown fresh every time this page
                                mounts, dismissed for the rest of this visit the
                                moment any hotspot is clicked or via its own
                                close button. Same ghost-cursor mechanism as the
                                other configurator pages. */}
                            {showHotspotHint && dotsRevealed && (
                              <div className="absolute inset-0 z-20 pointer-events-none">
                                <motion.div
                                  className="absolute -translate-x-1/2 -translate-y-1/2"
                                  style={{ left: 0, top: 0 }}
                                  animate={{
                                    left: ["16%", "16%", "53.8%", "53.8%", "53.8%"],
                                    top: ["16%", "16%", "40.3%", "40.3%", "40.3%"],
                                    opacity: [0, 1, 1, 1, 0],
                                    scale: [1, 1, 1, 0.72, 1],
                                  }}
                                  transition={{
                                    duration: 3.2,
                                    times: [0, 0.1, 0.55, 0.66, 0.85],
                                    repeat: Infinity,
                                    repeatDelay: 1.4,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <MousePointer2
                                    className="h-5 w-5 text-white"
                                    style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
                                    fill="white"
                                    fillOpacity={0.15}
                                    strokeWidth={1.75}
                                  />
                                </motion.div>
                                <div className="absolute pointer-events-auto" style={{ left: "6%", top: "8%", maxWidth: "200px" }}>
                                  <div className="liquid-glass-strong rounded-xl pl-3.5 pr-2.5 py-2.5 flex items-start gap-2">
                                    <p className="font-body text-[12px] text-white/90 leading-snug">
                                      Click a glowing point to see each zone
                                    </p>
                                    <button
                                      onClick={dismissHotspotHint}
                                      aria-label="Dismiss hint"
                                      className="text-white/50 hover:text-white/90 shrink-0 mt-0.5"
                                    >
                                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* One-time reward burst on the first hotspot click. */}
                            <AnimatePresence>
                              {rewardBurst && (
                                <motion.div
                                  className="absolute z-30 pointer-events-none"
                                  style={{ left: `${rewardBurst.x}%`, top: `${rewardBurst.y}%` }}
                                  initial={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                >
                                  <motion.span
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                                    style={{ borderColor: "rgba(110,190,240,0.8)", width: 12, height: 12 }}
                                    initial={{ scale: 1, opacity: 0.9 }}
                                    animate={{ scale: 6, opacity: 0 }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                  />
                                  {[0, 60, 120, 180, 240, 300].map((angle) => (
                                    <motion.span
                                      key={angle}
                                      className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-white"
                                      initial={{ x: 0, y: 0, opacity: 1 }}
                                      animate={{
                                        x: Math.cos((angle * Math.PI) / 180) * 28,
                                        y: Math.sin((angle * Math.PI) / 180) * 28,
                                        opacity: 0,
                                      }}
                                      transition={{ duration: 0.6, ease: "easeOut" }}
                                    />
                                  ))}
                                  <motion.div
                                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 whitespace-nowrap"
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <span className="liquid-glass-strong rounded-full px-2.5 py-1 text-[10px] font-body uppercase tracking-[0.12em] text-white/90 inline-block">
                                      ✨ Discovered
                                    </span>
                                  </motion.div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Drop target hint — glows while Add Zones is open
                                and nothing has been placed yet, so the
                                mechanic is discoverable before the first drop.
                                Dead center rather than any one zone's own dot,
                                since all 6 are valid drop targets. */}
                            <AnimatePresence>
                              {showLayoutZones && !zoneAdded && (
                                <motion.div
                                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                                  style={{ left: "50%", top: "50%" }}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  <motion.div
                                    className="rounded-full border-2 border-dashed border-white/80"
                                    style={{ width: 64, height: 64, boxShadow: "0 0 24px 6px rgba(255,255,255,0.35)" }}
                                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                                  />
                                  <span className="absolute left-1/2 top-full -translate-x-1/2 mt-2 whitespace-nowrap liquid-glass-strong rounded-full px-2.5 py-1 text-[10px] font-body uppercase tracking-[0.1em] text-white/90">
                                    Drop here
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <AnimatePresence>
                          {zoneDropToast && (
                            <motion.div
                              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ duration: 0.3 }}
                            >
                              <span className="liquid-glass-strong rounded-full px-4 py-2 text-xs font-body text-white/90 inline-block whitespace-nowrap">
                                You added one more zone
                              </span>
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

                        <div className={`absolute bottom-4 left-4 flex-wrap gap-2 ${stage === "design" ? "flex" : "hidden"}`}>
                          {_siteName && <span className="liquid-glass tag-glass">Site: {_siteName}</span>}
                          {selectedPlan && (
                            <span className="liquid-glass tag-glass">
                              Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                            </span>
                          )}
                          {showLayoutZones && (
                            <span className="liquid-glass tag-glass">Zones: {placedZones.size} active</span>
                          )}
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {!engineReady && (
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
                        <p className="font-body text-white/85 text-sm tracking-wide">Preparing your Nomadic Engine...</p>
                        <p className="font-body text-white/40 text-[11px] uppercase tracking-[0.18em] mt-2">Calibrating modules</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {stage === "design" && (
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat icon={Clock} label="Assembly time" value={String(_assembly)} unit="hours" />
                  <Stat icon={Zap} label="Energy consumption" value={_energy} unit="kWh/d" />
                  <Stat icon={Weight} label="Total mass" value={_mass} unit="t" />
                  <Stat icon={Square} label="Total area" value="42" unit="m²" />
                </div>
              )}
            </motion.div>

            {/* RIGHT COLUMN — chat while designing, then price/order. */}
            {(stage === "customise" || stage === "plans") && (
              <motion.div
                key="order-col"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex gap-4 min-w-0 self-stretch h-full"
              >
                <AnimatePresence>
                  {stage === "customise" && (
                    <motion.div
                      key="customise"
                      initial={{ opacity: 0, x: rightColDirection < 0 ? -40 : 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: rightColDirection < 0 ? 40 : -40 }}
                      transition={{ duration: 0.5, ease: [0.6, 0.2, 0.2, 1] }}
                      className="w-[360px] shrink-0 h-full"
                    >
                      <OrderPanel
                        configured={r.configured}
                        totals={r.totals}
                        showPlans={false}
                        selectedPlan={selectedPlan}
                        onSelectPlan={confirmPlan}
                        onContinue={() => r.setStage("summary")}
                      />
                    </motion.div>
                  )}
                  {stage === "plans" && (
                    <motion.div
                      key="plans"
                      initial={{ opacity: 0, x: rightColDirection < 0 ? -40 : 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: rightColDirection < 0 ? 40 : -40 }}
                      transition={{ duration: 0.5, ease: [0.6, 0.2, 0.2, 1] }}
                      className="w-[640px] shrink-0 h-full"
                    >
                      <OrderPanel
                        configured={r.configured}
                        totals={r.totals}
                        showPlans={true}
                        selectedPlan={selectedPlan}
                        onSelectPlan={confirmPlan}
                        onBack={() => r.setStage("configure")}
                        onContinue={() => r.setStage("payment")}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* AI ASSIST — CHAT */}
            <div className={`${stage === "design" ? "min-h-0 overflow-hidden flex flex-col" : "hidden"} rounded-[1.5rem] ${glowHintsEnabled && exploreSeen && introPhase !== "ready" ? "panel-glow-pulse" : ""}`}>
              <div aria-hidden className="invisible shrink-0 flex items-center justify-between mb-3">
                <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em]">dwelling</span>
              </div>
              <motion.aside
                initial={blurInit}
                animate={blurIn}
                transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
                className="liquid-glass rounded-[1.5rem] p-6 shadow-lg shadow-black/20 flex flex-col min-h-0 shrink-0"
                style={{ height: "58vh" }}
              >
                <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/10">
                  <span className="relative inline-flex w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center overflow-hidden">
                    <img src={assistantAvatar} alt="Engine Assistant" width={36} height={36} loading="lazy" className="w-full h-full object-contain" />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
                    <span className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body inline-flex items-center gap-1.5">
                      {!exploreSeen ? (
                        <><Lock className="h-2.5 w-2.5" strokeWidth={2} /> locked</>
                      ) : (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                          {apiOnline ? "online" : "offline"}
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div ref={scrollRef} className="chat-scrollbar mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm font-body">
                  {!exploreSeen && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/60">
                      <Lock className="h-8 w-8" strokeWidth={1.5} />
                      <p className="text-lg leading-snug font-body max-w-[300px]">
                        Complete the steps on the left — through Step Inside — to wake up the Engine Assistant.
                      </p>
                    </div>
                  )}

                  {exploreSeen && introPhase === "typing" && messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex items-start gap-3">
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
                        <div className="bg-white text-black rounded-2xl px-4 py-2 max-w-[85%] leading-relaxed">{m.content}</div>
                      </div>
                    ) : (
                      <div key={i} className="flex items-start gap-3">
                        <img src={assistantAvatar} alt="" width={28} height={28} loading="lazy" className="w-7 h-7 rounded-full bg-white/5 border border-white/10 shrink-0 object-contain" />
                        <div className="text-white/90 leading-relaxed pr-2 flex-1 min-w-0 pt-0.5">
                          {m.content ? renderMd(m.content) : (
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
                            onClick={() => { setSelectedSuggestion(s); send(s); }}
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
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="mt-3 shrink-0 flex items-center gap-2 liquid-glass rounded-full pl-5 pr-2 py-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={!exploreSeen ? "Locked — complete the steps on the left first" : "Message Engine Assistant…"}
                    disabled={!exploreSeen || isStreaming}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!exploreSeen || isStreaming || !input.trim()}
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

      {/* Payment — full-screen modal. */}
      <AnimatePresence>
        {stage === "payment" && (
          <motion.div
            key="payment-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] backdrop-blur-md bg-black/70 flex items-center justify-center px-6"
          >
            <div className="confirm-particles absolute inset-0 pointer-events-none" />
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.6, 0.2, 0.2, 1] }}
              className="relative w-full max-w-lg max-h-[85vh]"
            >
              <button
                type="button"
                onClick={() => r.setStage("summary")}
                aria-label="Back to plans"
                className="absolute -top-3 -right-3 z-10 liquid-glass rounded-full w-9 h-9 inline-flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <PaymentPanel totals={pricedTotals} onSubmit={r.submitPayment} inline />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === "confirmed" && (
          <EngineOnTheWayOverlay
            reservationRef={r.reservationRef}
            colors={r.colors}
            total={r.totals.total + DWELLING_VALUE}
            onContinue={() => navigate("/tribe")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, label, value, unit }: { icon: LucideIcon; label: string; value: string; unit: string }) {
  return (
    <div className="w-full flex items-center gap-3 px-1">
      <Icon className="h-6 w-6 text-white/60 shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] uppercase tracking-[0.1em] text-white/50 font-body truncate">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-white font-medium text-sm">{value}</span>
          <span className="text-white/55 text-xs font-body">{unit}</span>
        </div>
      </div>
    </div>
  );
}
