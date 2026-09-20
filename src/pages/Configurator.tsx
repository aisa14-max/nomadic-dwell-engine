import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, ArrowRight, ArrowLeft, Send, Loader2, X, ChevronDown, ChevronLeft, ChevronRight, Compass, LayoutGrid, Maximize2, Minimize2, Clock, Zap, Weight, Square, ClipboardList, Users, CalendarRange, Laptop, Layers, MousePointer2, Lock, Lightbulb, type LucideIcon } from "lucide-react";
import BlurText from "@/components/BlurText";
import { Switch } from "@/components/ui/switch";
import landscapeBg from "@/assets/configurator-landscape-bg-v2.png";
import dwellingFg from "@/assets/configurator-dwelling-baked-crop.png";
import bedroomPanorama from "@/assets/configurator-bedroom-panorama.jpg";
import livingroomPanorama from "@/assets/configurator-livingroom-panorama.jpg";
import kitchenPanorama from "@/assets/configurator-kitchen-panorama.jpg";
import plantsPanorama from "@/assets/configurator-plants-panorama.jpg";
import bathroomPanorama from "@/assets/configurator-bathroom-panorama.jpg";
// Per-zone cutaway "patches" — small crops of just the interior peek (not a
// full flattened dwelling render). Placed at a fixed position/size on top of
// whichever base layer is currently showing (plain, bracing, grown, etc.)
// instead of replacing the whole canvas, so a patch never hides an unrelated
// customization elsewhere on the dwelling. See CUTAWAY_PATCH_BOXES below for
// their placement, measured in the same pixel space as the base render.
import patchPlants from "@/assets/configurator-patch-plants.png";
import patchEngine from "@/assets/configurator-patch-engine.png";
import patchBathroom from "@/assets/configurator-patch-bathroom.png";
import patchDining from "@/assets/configurator-patch-dining.png";
import patchKitchen from "@/assets/configurator-patch-kitchen.png";
import patchStorage from "@/assets/configurator-patch-storage.png";
import patchLiving from "@/assets/configurator-patch-living.png";
import patchWorking from "@/assets/configurator-patch-working.png";
import patchBed from "@/assets/configurator-patch-bed.png";
import patchTerrace from "@/assets/configurator-patch-terrace.png";
import { PanoramaViewer, type PanoramaMarker } from "@/components/worlds/PanoramaViewer";
import windowsOnDwelling from "@/assets/configurator-windows-on-dwelling.png";
import changedBracing from "@/assets/configurator-changed-bracing.png";
import changedBracingBlack from "@/assets/configurator-changed-bracing-black.png";
import bracingBlackGreen from "@/assets/configurator-bracing-black-green.png";
import bracingBlackRed from "@/assets/configurator-bracing-black-red.png";
import bracingClearGreen from "@/assets/configurator-bracing-clear-green.png";
import bracingClearRed from "@/assets/configurator-bracing-clear-red.png";
import dwellingBlackBeige from "@/assets/configurator-dwelling-black-beige.png";
import dwellingBlackGreen from "@/assets/configurator-dwelling-black-green.png";
import dwellingBlackRed from "@/assets/configurator-dwelling-black-red.png";
import dwellingClearGreen from "@/assets/configurator-dwelling-clear-green.png";
import dwellingClearRed from "@/assets/configurator-dwelling-clear-red.png";
import withGrowDwelling from "@/assets/configurator-with-grow.png";
import topViewImg from "@/assets/configurator-top-view.jpg";
import assistantAvatar from "@/assets/engine-assistant-avatar.png";
import zoneBed from "@/assets/zone-bed.png";
import zoneLiving from "@/assets/zone-living.png";
import zoneKitchen from "@/assets/zone-kitchen.png";
import zoneDining from "@/assets/zone-dining.png";
import zoneGrow from "@/assets/zone-grow.png";
import AddOnsPanel from "@/components/worlds/AddOnsPanel";
import OrderPanel from "@/components/worlds/OrderPanel";
import PaymentPanel from "@/components/worlds/PaymentPanel";
import EngineOnTheWayOverlay from "@/components/worlds/EngineOnTheWayOverlay";
import { useReservation } from "@/hooks/useReservation";
import { PARTS, PartId, DEPOSIT_RATE, DWELLING_VALUE } from "@/data/dwellingParts";
import { applyPlanDiscount } from "@/data/plans";
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

// Layout Zones — reuses the same bed/living/kitchen/dining ids as the
// hover/click zone hotspots on the rendered dwelling (see DWELLING_HOTSPOTS'
// polygon overlay), so the sidebar list and the viewport zones speak the same
// vocabulary even though this list doesn't (yet) regenerate that render.
type ZoneId = "bed" | "living" | "kitchen" | "dining" | "grow";
type ZoneSize = "S" | "M" | "L";
const ZONE_LABELS: Record<ZoneId, string> = {
  bed: "Extra Bed", living: "Extra Couch", kitchen: "Extra Counter", dining: "Extra Table", grow: "Plant Bay",
};
// Grow Plants leads the list and is the only zone that's actually
// interactive right now — the rest render locked/"coming soon" in ZoneRow
// below (see the `locked` check there) until their own drag/resize flows
// are ready.
const ALL_ZONE_IDS: ZoneId[] = ["grow", "bed", "living", "kitchen", "dining"];
// Real renders of each pod module, from the .lovable "icons for zone layout"
// folder — replaces the earlier lucide-icon + gradient-tint placeholders.
const ZONE_IMAGES: Record<ZoneId, string> = {
  bed: zoneBed, living: zoneLiving, kitchen: zoneKitchen, dining: zoneDining, grow: zoneGrow,
};
// Realistic starting proportions rather than every zone defaulting to the
// same size — bed and living read as the primary rooms, kitchen compact.
const DEFAULT_ZONE_SIZES: Record<ZoneId, ZoneSize> = {
  bed: "L", living: "M", kitchen: "S", dining: "M", grow: "S",
};

// Horizontal carousel card — same shape/behavior as the Site Selector's
// thumbnail strip (image on top, label below, scrolled with chevrons)
// instead of the old vertical stacked-row list.
function ZoneCard({
  zone,
  onDragStart,
  onDragMove,
  onDragDrop,
  glow = false,
}: {
  zone: { id: ZoneId; size: ZoneSize };
  onDragStart: (id: ZoneId) => void;
  onDragMove: (id: ZoneId, point: { x: number; y: number }) => void;
  onDragDrop: (id: ZoneId, point: { x: number; y: number }) => void;
  glow?: boolean;
}) {
  const image = ZONE_IMAGES[zone.id];
  // Only Grow Plants is wired up for drag right now — every other zone
  // shows locked and inert with a "Coming soon" tag until it gets the same
  // treatment.
  const locked = zone.id !== "grow";

  // Drag-out-to-viewport is done with raw pointer events + a portaled ghost
  // rather than framer-motion's `drag` prop — a free-drag element nested
  // inside the accordion's overflow-hidden wrapper clipped movement to the
  // panel, never reaching the viewport. A portal to document.body sidesteps
  // that entirely.
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
        locked
          ? undefined
          : (e) => {
              e.preventDefault();
              setGhostPos({ x: e.clientX, y: e.clientY });
              setIsDraggingOut(true);
              onDragStart(zone.id);
            }
      }
      style={{ touchAction: locked ? "auto" : "none" }}
      title={
        locked
          ? `${ZONE_LABELS[zone.id]} — coming soon`
          : `Drag onto the viewport to place the ${ZONE_LABELS[zone.id]} zone`
      }
      className={`relative shrink-0 w-14 snap-start ${
        locked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
      } ${isDraggingOut ? "opacity-30" : ""}`}
    >
      {/* The glow (and its rounding) lives on this w-14 h-14 wrapper —
          exactly the circle's own footprint, not the taller card below that
          also includes the label — otherwise round-full stretches into a
          pill shape hugging the whole card instead of the circle. Image
          clipping is a level deeper still, since an overflow-hidden
          ancestor would clip the glow's box-shadow off at the card's own
          edge, same issue as the sidebar panels had. */}
      <div className={`w-14 h-14 rounded-full ${glow ? "panel-glow-pulse" : ""}`}>
        <div
          className={`w-full h-full rounded-full overflow-hidden border transition-colors ${
            locked
              ? "opacity-40 border-white/10"
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
        {locked ? "Coming soon" : ZONE_LABELS[zone.id]}
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

export default function Configurator() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedPlan, confirmPlan } = useMockAuth();
  // Customisation is a second stage of THIS page rather than a separate
  // screen: the dwelling viewport stays put while the side columns change.
  //   design    -> Brief/Site/Material/Packs | viewport | Chat
  //   customise -> Add-ons                   | viewport | Price & Order
  //   payment   -> (collapsed)               | viewport | Payment
  //   plan      -> subscription packages
  //   confirmed -> engine on the way
  const [showNext, setShowNext] = useState(false);
  const r = useReservation();
  // The reservation hook's own stages map onto the page's:
  //   configure -> customise (add-ons)
  //   summary   -> plans     (subscription tiers, shown above the order)
  //   payment   -> payment   (order slides left, card details slide in)
  const stage: "design" | "customise" | "plans" | "payment" | "confirmed" =
    !showNext ? "design"
    : r.stage === "summary" ? "plans"
    : r.stage === "payment" ? "payment"
    : r.stage === "confirmed" ? "confirmed"
    : "customise";

  // Tracks whether the right-column slot (Your reservation → Choose your
  // plan → Secure checkout) is moving forward (Continue buttons) or backward
  // (Back buttons), so each slide enters/exits from the matching side —
  // combined with the grid-template-columns transition below (the viewport
  // resizing), this is what makes the two sides slide past each other.
  const RIGHT_COL_ORDER = { customise: 0, plans: 1, payment: 2 } as const;
  const rightColIndex = stage in RIGHT_COL_ORDER ? RIGHT_COL_ORDER[stage as keyof typeof RIGHT_COL_ORDER] : 0;
  const prevRightColIndexRef = useRef(rightColIndex);
  const rightColDirection = rightColIndex - prevRightColIndexRef.current;
  useEffect(() => { prevRightColIndexRef.current = rightColIndex; }, [rightColIndex]);

  const enterCustomise = () => { setShowNext(true); r.setStage("configure"); };
  // Payment must charge the same number the order summary shows, so both read
  // the discount from one helper rather than each doing their own arithmetic.
  const pricedTotals = applyPlanDiscount(r.totals, selectedPlan, DEPOSIT_RATE);
  const handlePartToggle = (p: PartId) => r.setActive(r.activePart === p ? null : p);
  // Add-ons are a gated sequence, so choosing one opens the next step that
  // still needs an answer rather than leaving the user to hunt for it.
  const handleOptionSelect = (optionId: string) => {
    const current = r.activePart;
    if (!current) return;
    r.selectOption(current, optionId);
    const idx = PARTS.findIndex((p) => p.id === current);
    const next = PARTS.slice(idx + 1).find((p) => !p.locked && !r.configured.has(p.id));
    r.setActive(next ? next.id : null);
  };

  // Grid widens the right column as the flow progresses, and drops the left
  // one at payment — that's what produces the "viewport slides left" move,
  // without transforms that would overflow the container.
  // Customise used to widen both side columns vs. design, which shrank the
  // viewport (the "1fr" middle column) right when you clicked "Continue
  // configuration" — kept it identical to design's widths so the viewport
  // doesn't resize on that transition.
  const gridCols =
    // Order panel no longer shows at payment (see below), so this column
    // only needs to fit PaymentPanel alone now, not both side by side.
    stage === "payment" ? "lg:grid-cols-[0px_1fr_460px]"
    // Plans stage gives the reservation/plan-picker panel more room (and the
    // now-static dwelling viewport correspondingly less) since there's no
    // interaction happening in the viewport at this stage.
    : stage === "plans" ? "lg:grid-cols-[0px_1fr_640px]"
    : "lg:grid-cols-[220px_1fr_360px]";
  const [engineReady, setEngineReady] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [showLayoutZones, setShowLayoutZones] = useState(false);
  // Toggle for the whole "glow whichever step is next" demo hint below — on
  // by default, but a presenter may want to turn it off mid-demo.
  const [glowHintsEnabled, setGlowHintsEnabled] = useState(true);
  // Demo-mode progressive unlock: each panel opens the next. "Seen" (not the
  // panel's own open/closed toggle) is what stays true once a step has been
  // visited, so collapsing a panel later doesn't re-lock what comes after it.
  // Your Summary is a static block now (always visible, nothing to "open"),
  // so it counts as seen immediately — Site Selector starts unlocked.
  const briefSeen = true;
  const [siteSeen, setSiteSeen] = useState(false);
  // Distinct from siteSeen (which only tracks the panel being opened, and
  // still gates unlocking Show Zones on its own): Show Zones should only
  // glow once the visitor has actually picked a different site in the
  // carousel, not merely opened the panel and looked at the default pick.
  // A counter (not a plain seen/unseen flag) since it's driven from a
  // shared settle handler that's easiest to reason about as "how many real
  // navigations has this landed on so far".
  const [siteChangeCount, setSiteChangeCount] = useState(0);
  const markSiteChanged = () => setSiteChangeCount((n) => n + 1);
  // Toggle sitting between Site Selector and Layout Zones — flipping it on
  // is what reveals the glowing roofline dots and unlocks the Layout Zones
  // panel in turn. Unlike the "seen" flags below, this one is a genuine
  // live two-way switch — flipping it back off re-hides the dots.
  const [dotsRevealed, setDotsRevealed] = useState(false);
  const [zonesSeen, setZonesSeen] = useState(false);
  // Final step, unlocked once Layout Zones has been opened — a second live
  // toggle (same two-way behavior as dotsRevealed above) that gates whether
  // the "Explore more" button on a hotspot actually opens its 360° panorama.
  // exploreSeen is the one-way flag (flips true the first time it's switched
  // on) that gates Continue configuration, same relationship dotsRevealed
  // has to zonesSeen.
  const [exploreUnlocked, setExploreUnlocked] = useState(false);
  const [exploreSeen, setExploreSeen] = useState(false);
  const [zones, setZones] = useState<{ id: ZoneId; size: ZoneSize }[]>(
    ALL_ZONE_IDS.map((id) => ({ id, size: DEFAULT_ZONE_SIZES[id] })),
  );
  const removeZone = (id: ZoneId) =>
    setZones((prev) => prev.filter((z) => z.id !== id));
  const zoneScrollRef = useRef<HTMLDivElement>(null);
  const scrollStrip = (ref: React.RefObject<HTMLDivElement>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * 84, behavior: "smooth" });
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom((z) => Math.min(2, +(z + 0.15).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)));
  // True browser Fullscreen API rather than a CSS overlay — a fixed-position
  // overlay gets trapped inside PageTransition's transformed wrapper (same
  // bug as the reservation modal), and this also actually fills the whole
  // screen (hides browser chrome) instead of just the page content area.
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Dropping a zone tile from the Layout Zones panel onto the viewport
  // focuses that zone — see handleZoneDrop below, defined after onSectionClick.
  const [isZoneDragOver, setIsZoneDragOver] = useState(false);
  // Pins are stored as % of the viewport's own box, not raw pixels, so they
  // stay put relative to the render if the viewport is resized.
  const [zonePins, setZonePins] = useState<Partial<Record<ZoneId, { x: number; y: number }>>>({});
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
  // Which hotspot's cutaway is currently showing (null = none). Every hotspot
  // has a small interior-peek "patch" image here — see CUTAWAY_PATCH_BOXES
  // below for where each one sits on the dwelling canvas. Deliberately NOT a
  // full flattened dwelling render: an earlier version baked the whole
  // building into each cutaway image, which meant opening any cutaway
  // silently hid other customizations (e.g. changed bracing) everywhere
  // outside the peek window, since that flattened image only ever showed the
  // plain base. A small positioned patch can't cover anything it doesn't
  // overlap, so whatever's showing elsewhere on the dwelling stays visible.
  const [activeCutaway, setActiveCutaway] = useState<string | null>(null);
  const CUTAWAY_IMAGES: Record<string, string> = {
    s1: patchPlants,
    s1b: patchEngine,
    s2: patchBathroom,
    s3: patchDining,
    s4: patchKitchen,
    s4b: patchStorage,
    s5: patchLiving,
    s6: patchWorking,
    s7: patchBed,
    s8: patchTerrace,
  };
  // Pixel placement of each patch on the base dwelling's own canvas
  // (configurator-dwelling-baked-crop.png is CUTAWAY_CANVAS_W×CUTAWAY_CANVAS_H).
  // The aspect-locked wrapper is stuck at a fixed "2400/1792" CSS ratio that
  // does NOT match this image's real ratio, so object-contain letterboxes it
  // — the image only actually fills a horizontal band of the wrapper's
  // height, centered, not the full box. DWELLING_HOTSPOTS' own % coordinates
  // are hand-calibrated against that already-letterboxed rendering, so they
  // don't need this; a patch computed straight from raw image-pixel
  // fractions does, or it overflows past the roofline into the letterboxed
  // empty space above/below (confirmed via getBoundingClientRect — the
  // wrapper box itself really is taller than the visible dwelling image).
  const CUTAWAY_CANVAS_W = 4066;
  const CUTAWAY_CANVAS_H = 1005;
  const WRAPPER_ASPECT_W = 2400;
  const WRAPPER_ASPECT_H = 1792;
  const CUTAWAY_IMG_HEIGHT_FRAC =
    (WRAPPER_ASPECT_W / WRAPPER_ASPECT_H) / (CUTAWAY_CANVAS_W / CUTAWAY_CANVAS_H);
  const CUTAWAY_IMG_TOP_FRAC = (1 - CUTAWAY_IMG_HEIGHT_FRAC) / 2;
  const CUTAWAY_PATCH_BOXES: Record<string, [number, number, number, number]> = {
    s1: [66, 178.5, 413, 891.5],
    s1b: [302, 138.5, 567, 879.5],
    s2: [446, 74.5, 875, 891.5],
    s3: [752, 54.5, 1387, 901.5],
    s4: [1318, 194.5, 1647, 899.5],
    s4b: [1596, 172.5, 2127, 901.5],
    s5: [2082, 56.5, 2631, 903.5],
    s6: [2576, 48.5, 3233, 921.5],
    s7: [3184, 82.5, 3677, 909.5],
    s8: [3574, 184.5, 4001, 891.5],
  };
  // Which hotspot's dot was clicked — gates the "Explore more" button so it
  // only appears after a deliberate click, not just on hover.
  const [clickedHotspotId, setClickedHotspotId] = useState<string | null>(null);
  // Arrival nudge pointing at the Living hotspot — shown fresh every time
  // someone lands on this page (no localStorage persistence), dismissed for
  // the rest of this visit the moment any hotspot is clicked or its own
  // close button is used.
  const [showHotspotHint, setShowHotspotHint] = useState(true);
  const dismissHotspotHint = () => {
    setShowHotspotHint(false);
  };
  // Ghost-cursor demo inside the Bed tooltip, from its label down to the
  // "Explore more" button — plays once, right when Step Inside auto-opens
  // that tooltip, so the next click target is obvious. Dismissed the moment
  // "Explore more" is actually clicked.
  const [showExploreCursorHint, setShowExploreCursorHint] = useState(false);
  // First-time, 2-step walkthrough for the 360° panorama takeover: 1)
  // glowing dots jump between rooms, 2) here's how to get back out. Each
  // step advances on its own "Got it" click; 0 means hidden (not started
  // yet, or the tour is already finished).
  const [panoramaTourStep, setPanoramaTourStep] = useState<0 | 1 | 2>(0);
  const [panoramaTourSeen, setPanoramaTourSeen] = useState(false);
  // Small spark burst + "Discovered" chip played once, right on the very
  // first hotspot a user ever clicks — a little reward for finding the
  // mechanic, positioned at that hotspot's own %-coordinates.
  const [rewardBurst, setRewardBurst] = useState<{ x: number; y: number } | null>(null);
  // Dropping Plant Bay doesn't leave a pin on the viewport like the other
  // zones (there's nowhere sensible to pin it — dropping it changes the
  // whole dwelling render) — a brief confirmation toast instead.
  const [growDropToast, setGrowDropToast] = useState(false);
  // Chat-triggered overlay — typing "add more windows" crossfades this in over
  // the dwelling the same pixel-aligned way the hotspot cutaways do.
  const [showWindowsOverlay, setShowWindowsOverlay] = useState(false);
  // Same mechanism, for the "change the bracing type" suggestion — swaps the
  // rib bracing pattern while the landscape background stays untouched.
  const [showBracingOverlay, setShowBracingOverlay] = useState(false);
  // The dwelling's base render is missing its Grow Plants bay by default —
  // an overlay showing the bay fades IN once the user drags the Grow Plants
  // zone onto the viewport (see handleZoneDragDrop), at which point it stays
  // for good (one-way switch, not tied to the pin staying placed).
  const [plantsGrown, setPlantsGrown] = useState(false);
  // "Explore more" on a hotspot takes over the whole viewport with a real
  // drag-around 360° panorama for that section. Only zones with an actual
  // panorama get an entry here — add one as each new panorama arrives; that's
  // also what makes the button appear on that hotspot's tooltip.
  const [activeExplore, setActiveExplore] = useState<string | null>(null);
  // The Engine Assistant chat specifically waits for a full round trip —
  // stepped inside a 360° panorama AND backed all the way out again — not
  // just exploreSeen (which flips true the moment "Step Inside" is merely
  // switched on, before the visitor has actually been through the door;
  // that's still the right trigger for unlocking Continue configuration
  // and the rest, just not for waking up the chat).
  const [hasExitedExplore, setHasExitedExplore] = useState(false);
  const hasEnteredExploreRef = useRef(false);
  useEffect(() => {
    if (activeExplore) {
      hasEnteredExploreRef.current = true;
    } else if (hasEnteredExploreRef.current) {
      setHasExitedExplore(true);
    }
  }, [activeExplore]);
  type PanoramaSceneId = "bedroom" | "livingroom" | "kitchen" | "plants" | "bathroom";
  // Which hotspot opens which panorama scene — multiple hotspots can point at
  // the same scene (e.g. two dots sharing one room). Add an entry here as
  // each new panorama comes online; that's also what makes "Explore more"
  // appear on that hotspot's tooltip instead of "Coming soon".
  const SECTION_EXPLORE: Record<string, { type: "panorama"; scene: PanoramaSceneId }> = {
    s7: { type: "panorama", scene: "bedroom" },
    s5: { type: "panorama", scene: "livingroom" },
    s6: { type: "panorama", scene: "livingroom" },
    s4: { type: "panorama", scene: "kitchen" },
    s3: { type: "panorama", scene: "kitchen" },
    s4b: { type: "panorama", scene: "kitchen" },
    s2: { type: "panorama", scene: "bathroom" },
    s1: { type: "panorama", scene: "plants" },
    s1b: { type: "panorama", scene: "plants" },
  };
  // The panorama tour — multiple linked scenes, Street-View style. Each scene
  // has its own spotlight marker(s) to walk into the next one; marker x/y are
  // pixel positions on that scene's own equirectangular source image. Opens
  // on whichever scene SECTION_EXPLORE maps the clicked hotspot to.
  const [panoramaScene, setPanoramaScene] = useState<PanoramaSceneId>("bedroom");
  // Memoized so PanoramaViewer's marker prop keeps a stable reference across
  // Configurator's frequent re-renders (chat streaming, etc.) — otherwise its
  // "sync markers with the plugin" effect re-fires on every render, tearing
  // down and rebuilding the marker DOM mid-click.
  const PANORAMA_SCENES = useMemo<Record<PanoramaSceneId, { src: string; markers: PanoramaMarker[] }>>(
    () => ({
      bedroom: {
        src: bedroomPanorama,
        // y kept well above the floor/navbar band — a marker down near the
        // bottom of the frame sits under the floating navbar pill and never
        // receives clicks (the navbar is fixed to the screen, not the sphere).
        markers: [
          { id: "to-livingroom", x: 2100, y: 1200, onClick: () => setPanoramaScene("livingroom") },
        ],
      },
      livingroom: {
        src: livingroomPanorama,
        // x kept off the image's 0/width wrap seam — a marker placed right at
        // that boundary never resolves as visible. y moved down toward the
        // walkway/floor near the shelving (was up near the skylight seam) —
        // kept short of the bedroom marker's floor-adjacent y (1200/2025) so
        // it doesn't drop into the same under-navbar dead zone noted there.
        // Now leads into the kitchen rather than back to the bedroom.
        markers: [
          { id: "to-kitchen", x: 1230, y: 1300, onClick: () => setPanoramaScene("kitchen") },
        ],
      },
      kitchen: {
        src: kitchenPanorama,
        markers: [
          // Toward the shelving/orange-couch nook shared with the livingroom
          // scene — the same landmarks visible from that side of the room.
          { id: "to-livingroom", x: 5040, y: 1400, onClick: () => setPanoramaScene("livingroom") },
          // Near the grey nook wall/chairs, by the shelf — leads into the
          // growing-plants bay.
          { id: "to-plants", x: 1450, y: 1650, onClick: () => setPanoramaScene("plants") },
        ],
      },
      plants: {
        src: plantsPanorama,
        markers: [
          // Through the doorway on the right, where the shared hallway with
          // the bunk/orange-chair nook is visible — leads back into the kitchen.
          { id: "to-kitchen", x: 5384, y: 1400, onClick: () => setPanoramaScene("kitchen") },
          // On the door itself (the grey fabric-clad door beside the sink
          // unit) — leads into the bathroom.
          { id: "to-bathroom", x: 3987, y: 1400, onClick: () => setPanoramaScene("bathroom") },
        ],
      },
      bathroom: {
        src: bathroomPanorama,
        // On the door on the right side of this scene — the same door that
        // was entered from, leads back to the growing-plants bay.
        markers: [
          { id: "to-plants", x: 4016, y: 1600, onClick: () => setPanoramaScene("plants") },
        ],
      },
    }),
    [],
  );
  // Where a scene zoom is anchored. Set from a hotspot's own coordinates so the
  // view pushes in on that section rather than the middle of the dwelling.
  const [zoomOrigin, setZoomOrigin] = useState<{ x: number; y: number } | null>(null);
  const HOTSPOT_ZOOM = 1.75;
  // Auto-zoom-on-click is off for now (user request) — flip this back to
  // true to restore the push-in effect in focusHotspot below.
  const AUTO_ZOOM_ON_HOTSPOT = false;

  /** Clicking a section marker reveals its cutaway (and, if enabled, pushes the view in on it). */
  const focusHotspot = (h: { id: string; x: number; y: number }) => {
    setActiveCutaway((open) => {
      const next = open === h.id ? null : h.id;
      if (AUTO_ZOOM_ON_HOTSPOT) {
        setZoomOrigin(next ? { x: h.x, y: h.y } : null);
        setZoom(next ? HOTSPOT_ZOOM : 1);
      }
      return next;
    });
  };

  // Hotspots along the roofline, positioned as % of the dwelling wrapper's
  // own box (not the viewport, and not the raw image — the image is
  // letterboxed inside the wrapper by object-contain, so x/y here already
  // account for that). x values target the actual detected peaks/dips of
  // the roofline (dense-scanned against the baked-crop asset for the
  // topmost non-background pixel, +1.5% margin), not eyeballed. Purely
  // visual for now, matching the reference's glowing markers; not wired to
  // real per-section data yet.
  const DWELLING_HOTSPOTS = [
    { id: "s1", x: 5,  y: 40.86 },
    { id: "s1b", x: 11, y: 39.5 },
    { id: "s2", x: 18, y: 36.97 },
    { id: "s3", x: 27, y: 36.24 },
    { id: "s4", x: 36, y: 40.76 },
    { id: "s4b", x: 46, y: 40.96 },
    { id: "s5", x: 58, y: 38.36 },
    { id: "s6", x: 70, y: 35.99 },
    { id: "s7", x: 84, y: 38.5 },
    { id: "s8", x: 92, y: 41.12 },
  ];

  // Zone names, left to right along the roofline (matches DWELLING_HOTSPOTS'
  // x order above) — purely a label, not tied to any real per-zone data.
  const HOTSPOT_LABELS: Record<string, string> = {
    s1: "Plant Bay",
    s1b: "Engine",
    s2: "Bathroom",
    s3: "Dining",
    s4: "Kitchen",
    s4b: "Lab Storage",
    s5: "Living",
    s6: "Working",
    s7: "Bed",
    s8: "Terrace",
  };

  // Shared so the 3D scene and the plan view render identical hotspots —
  // same glow; clicking the pin itself triggers the zoom + cutaway reveal via
  // focusHotspot for whichever hotspots have an entry in CUTAWAY_IMAGES (a
  // pixel-aligned exterior detail, purely cosmetic). The tooltip itself stays
  // open for any clicked hotspot, and shows an "Explore more" button for
  // whichever hotspots have an entry in SECTION_EXPLORE — that's the one that
  // takes over the viewport with that section's render.
  const renderHotspots = (hotspots: { id: string; x: number; y: number }[], lightUp = false) =>
    hotspots.map((h, i) => (
      <div
        key={h.id}
        className="group absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11"
        style={{ left: `${h.x}%`, top: `${h.y}%` }}
      >
        {/* Separate inner wrapper for the light-up animation — Framer Motion
            manages this element's own transform for the scale animation, so
            it can't share a node with the -translate-x/y-1/2 centering
            classes above (its animated transform would silently replace
            them, since inline style always wins over the class). */}
        <motion.div
          initial={lightUp ? { opacity: 0, scale: 0.2 } : false}
          animate={lightUp ? { opacity: 1, scale: 1 } : undefined}
          transition={lightUp ? { delay: i * 0.07, type: "spring", stiffness: 300, damping: 15 } : undefined}
          className="absolute inset-0"
        >
          <button
            className="absolute inset-0"
            aria-label={`Section ${h.id}`}
            onClick={() => {
              // showHotspotHint still reads its pre-dismiss value here, so this
              // is true only for the very first hotspot a user ever clicks.
              if (showHotspotHint) {
                setRewardBurst({ x: h.x, y: h.y });
                setTimeout(() => setRewardBurst(null), 1000);
              }
              setClickedHotspotId((id) => (id === h.id ? null : h.id));
              if (CUTAWAY_IMAGES[h.id]) focusHotspot(h);
              dismissHotspotHint();
            }}
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
        </motion.div>

        <div
          className={[
            "absolute left-1/2 bottom-full -translate-x-1/2 mb-3 transition-all duration-300 whitespace-nowrap",
            clickedHotspotId === h.id || activeCutaway === h.id
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
          ].join(" ")}
        >
          <div className="relative liquid-glass-strong rounded-xl px-3.5 py-2.5 flex flex-col items-center gap-2">
            {/* Ghost-cursor demo, Bed only — glides from the label down onto
                "Explore more" and taps it, on a loop, until actually clicked. */}
            {h.id === "s7" && showExploreCursorHint && exploreUnlocked && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                style={{ left: "2%", top: "92%" }}
                animate={{
                  left: ["2%", "2%", "58%", "58%", "58%"],
                  top: ["92%", "92%", "78%", "78%", "78%"],
                  opacity: [0, 1, 1, 1, 0],
                  scale: [1, 1, 1, 0.72, 1],
                }}
                transition={{
                  duration: 2.2,
                  times: [0, 0.12, 0.55, 0.66, 0.9],
                  repeat: Infinity,
                  repeatDelay: 0.8,
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
            <span className="font-body text-[11px] uppercase tracking-[0.14em] text-white/90">
              {HOTSPOT_LABELS[h.id] ?? h.id}
            </span>
            {/* No "Locked" state here — at this stage (Show Zones on, Step
                Inside not unlocked yet) the panel just shows the zone's
                name above and nothing else, rather than a disabled button. */}
            {(clickedHotspotId === h.id || activeCutaway === h.id) && SECTION_EXPLORE[h.id] && exploreUnlocked && (
              <button
                onClick={() => {
                  setActiveExplore(h.id);
                  setPanoramaScene(SECTION_EXPLORE[h.id].scene);
                  setShowExploreCursorHint(false);
                  if (!panoramaTourSeen) {
                    setPanoramaTourStep(1);
                    setPanoramaTourSeen(true);
                  }
                }}
                className="px-3 py-1 rounded-full bg-white text-black text-[10px] font-body uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
              >
                Explore more
              </button>
            )}
          </div>
        </div>
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

  // Dragging a zone panel from the Layout Zones sidebar onto the viewport —
  // dropping it drops a pin at the exact release point AND focuses that
  // zone (same as clicking its hotspot). Point is in client/page
  // coordinates, same space as getBoundingClientRect(), since both come
  // from the pointer event.
  const isPointInViewport = (point: { x: number; y: number }) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return false;
    return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  };
  // Which zone tile is currently being dragged out of the sidebar — lets the
  // viewport show a "drop here" target hint for the specific zone in play
  // (see the Plant Bay target glow below), not just a generic hover state.
  const [draggedZoneId, setDraggedZoneId] = useState<ZoneId | null>(null);
  const handleZoneDragStart = (id: ZoneId) => setDraggedZoneId(id);
  const handleZoneDragMove = (id: ZoneId, point: { x: number; y: number }) => {
    setIsZoneDragOver(isPointInViewport(point));
    setDraggedZoneId(id);
  };
  const handleZoneDragDrop = (id: ZoneId, point: { x: number; y: number }) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (rect && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
      if (id === "grow") {
        setPlantsGrown(true);
        setGrowDropToast(true);
        setTimeout(() => setGrowDropToast(false), 2500);
        removeZone("grow");
      } else {
        const x = Math.min(100, Math.max(0, ((point.x - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((point.y - rect.top) / rect.height) * 100));
        setZonePins((prev) => ({ ...prev, [id]: { x, y } }));
      }
      onSectionClick(id);
    }
    setIsZoneDragOver(false);
    setDraggedZoneId(null);
  };
  const removeZonePin = (id: ZoneId) =>
    setZonePins((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

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

  // Sidebar brief summary. Reads the answers generically rather than mapping
  // every option id, so it keeps working if the questionnaire's options change.
  // Icons echo the questionnaire's own iconography so a row reads the same way
  // the question did.
  const _BRIEF_LABELS: Record<string, { label: string; Icon: LucideIcon }> = {
    occupants: { label: "People",   Icon: Users },
    duration:  { label: "Stay",     Icon: CalendarRange },
    purpose:   { label: "Use",      Icon: Laptop },
    priority:  { label: "Priority", Icon: Zap },
    scale:     { label: "Scale",    Icon: Square },
  };
  const _prettyAnswer = (v: string) =>
    v
      // "1_3_months" would otherwise read as "1 3 Months" (i.e. thirteen) —
      // keep numeric ranges joined by a dash.
      .replace(/^(\d+)_(\d+)_/, "$1–$2 ")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  const _briefRows = Object.entries(_BRIEF_LABELS)
    .filter(([key]) => _answers[key])
    .map(([key, { label, Icon }]) => ({ label, Icon, value: _prettyAnswer(_answers[key]) }));
  const _onboardingSiteName = String(_site?.name ?? "");
  const _onboardingSiteRegion = String(_site?.location ?? "");

  // Site Selector — the onboarding pick plus three unlocked alternates the
  // user can switch between right here (static/baked, no re-render call).
  // Always exactly 4 choices, and never a "Coming soon" site.
  const _fallbackSite = SITES.find((s) => s.title === "Skye Moor")!;
  const _primarySite = SITES.find((s) => s.title === _onboardingSiteName) ?? {
    ..._fallbackSite,
    title: _onboardingSiteName || _fallbackSite.title,
    region: _onboardingSiteRegion || _fallbackSite.region,
  };
  // Sites with their own landscape backdrop use it for the Site Selector
  // thumbnail too, instead of the default catalog photo. Atacama Plateau is
  // pinned first among the alternates so it's always offered as a choice,
  // not just whichever 3 happen to come first in the catalog.
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
  const _siteRegion = activeSite.region;
  // Every site can carry its own elevation-view landscape backdrop; sites
  // without one fall back to the generic default scene.
  const _landscapeBg = activeSite.landscapeImage ?? landscapeBg;
  const _landscapeZoom = activeSite.landscapeImage ? activeSite.landscapeZoom ?? 1 : 1;
  // Rib Colour (an add-on, not a design-stage choice) recolors the cross-braced
  // overlay's ribs black instead of swapping in an unrelated scene — keeps the
  // actual site background intact instead of jumping to a different photo.
  const _ribIsBlack = r.configured.get("rib") === "petg-black";
  // Two separate tables, same rib-colour × membrane-pattern logic — one for
  // the normal (default) bracing state, one for the cross-braced overlay —
  // so both possibilities stay correctly colored instead of just one.
  const _dwellingImg =
    r.configured.get("membrane") === "green" ? (_ribIsBlack ? dwellingBlackGreen : dwellingClearGreen)
    : r.configured.get("membrane") === "red" ? (_ribIsBlack ? dwellingBlackRed : dwellingClearRed)
    : _ribIsBlack ? dwellingBlackBeige
    : dwellingFg;
  // The grow-bay overlay is a full (uncolored) dwelling replacement, not a
  // small patch — with no rib/membrane-colored versions of it, it would
  // otherwise sit on top of _dwellingImg and hide any custom colour picked
  // above. Only show it for the default rib/membrane combo.
  const _showGrowOverlay = plantsGrown && _dwellingImg === dwellingFg;
  const _bracingImg =
    r.configured.get("membrane") === "green" ? (_ribIsBlack ? bracingBlackGreen : bracingClearGreen)
    : r.configured.get("membrane") === "red" ? (_ribIsBlack ? bracingBlackRed : bracingClearRed)
    : _ribIsBlack ? changedBracingBlack
    : changedBracing;

  const greeting: string = locationState?.reply?.trim()
    ? locationState.reply
    : _siteName
      ? `Hi! I'm your Engine Assistant. I've designed a ${_spec.dining_style ?? "compact"} dining space${_occStr ? ` for ${_occStr}` : ""} at ${_siteName}${_purStr ? `, suited for ${_purStr}` : ""}. Is there anything you'd like to adjust?`
      : "Hi! I'm your Engine Assistant. Is there anything you'd like to adjust about your dining space?";

  // Build suggestions client-side from spec so they're always contextual.
  const suggestions: string[] = [
    "Change the bracing type of the rib",
  ];
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<"idle" | "typing" | "streaming" | "ready">("idle");
  // After the bracing change is applied, the assistant asks whether to keep
  // it — Yes leaves showBracingOverlay on, No flips it back off.
  const [bracingConfirmPending, setBracingConfirmPending] = useState(false);
  // Brief spinner over the viewport while the bracing swap "renders", before
  // the cross-braced overlay actually reveals.
  const [bracingLoading, setBracingLoading] = useState(false);

  useEffect(() => {
    // Also held back until hasExitedExplore — the assistant stays locked and
    // silent until the whole step sequence (Site Selector → ... → Explore
    // Inside Zone, then back out of the panorama) has been completed, then
    // starts typing its greeting.
    if (!engineReady || !hasExitedExplore) return;
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
  }, [engineReady, hasExitedExplore]);
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
    const addsWindows = text.toLowerCase().includes("add more windows");
    if (addsWindows) setShowWindowsOverlay(true);
    const changesBracing = text.toLowerCase().includes("bracing");
    if (changesBracing) {
      // Spinner over the viewport while the "render" happens, then reveal
      // the cross-braced overlay — same beat as the assistant's own typing
      // dots, which are still showing since the message isn't set yet.
      setBracingLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setBracingLoading(false);
      setShowBracingOverlay(true);
      setBracingConfirmPending(true);
    }
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "assistant",
        content: addsWindows
          ? "Added more windows along the wall — take a look at the dwelling."
          : changesBracing
          ? "Switched the rib bracing to a cross-braced pattern — take a look at the dwelling. Do you like this change?"
          : "Got it — that change has been adapted into your design.",
      };
      return next;
    });
    setIsStreaming(false);
  };

  // Yes/No reply to "Do you like this change?" after the bracing swap —
  // Yes leaves showBracingOverlay on, No flips it back to the original.
  const handleBracingChoice = async (liked: boolean) => {
    if (isStreaming) return;
    setBracingConfirmPending(false);
    const userMsg: ChatMsg = { role: "user", content: liked ? "Yes, keep it" : "No, go back" };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setIsStreaming(true);
    await new Promise((r) => setTimeout(r, 400));
    if (!liked) setShowBracingOverlay(false);
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "assistant",
        content: liked
          ? "Great — keeping the cross-braced ribs."
          : "No problem — reverted back to the original bracing.",
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
                // No way back to the design step once add-ons begin: design is
                // finished in one go. Later steps still step back one at a time.
                <button
                  onClick={
                    stage === "plans" ? () => r.setStage("configure")
                    : () => r.setStage("summary")
                  }
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
            {/* LEFT COLUMN — design panels in stage 1, add-ons in stage 2,
                collapsed entirely at payment. */}
            <div className="flex flex-col gap-4 min-w-0">
              {stage === "customise" && (
                // Glow hint on arrival — same non-clipping wrapper pattern as the
                // Site Selector; it stops as soon as an add-on is opened or chosen.
                <div className={`rounded-[1.5rem] ${glowHintsEnabled && !r.activePart && r.configured.size === 0 ? "panel-glow-pulse" : ""}`}>
                <motion.aside
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
                >
                  <div className="flex items-center gap-1.5 px-1 pb-2">
                    <Layers className="h-3.5 w-3.5 text-white/60" strokeWidth={1.75} />
                    <span className="text-[10px] font-body uppercase tracking-[0.12em] text-white/60">
                      Add-ons
                    </span>
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

              {/* Design-stage panels — kept mounted only in stage 1 */}
              <div className={stage === "design" ? "flex flex-col gap-3" : "hidden"}>
              {/* Summary of the onboarding answers — otherwise the choices that
                  drove this design are invisible once you're in the configurator.
                  Deliberately NOT styled like the panels below it (no glass card,
                  no shadow, no chevron) — it's passive context, not a step, so it
                  shouldn't read as one more thing to open. */}
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
                          <dd className="text-[10px] font-body text-white/85 text-right truncate">
                            {value}
                          </dd>
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

              {/* Glow lives on this wrapper, not the liquid-glass card inside it —
                  box-shadow (for a crisp outline instead of drop-shadow's soft
                  haze) gets clipped flat by the card's own overflow:hidden
                  (needed for its border-gradient trick) when applied directly
                  to it, so it has to sit one level up on a plain, non-clipping
                  box instead. */}
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
                  disabled={!briefSeen}
                  className="w-full flex items-center justify-between group disabled:cursor-not-allowed"
                  aria-expanded={showSiteSelector}
                  aria-disabled={!briefSeen}
                  title={!briefSeen ? "Open Your Summary first" : undefined}
                >
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] ${briefSeen ? "text-white/60" : "text-white/30"}`}>
                    {briefSeen ? <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Lock className="h-3 w-3" strokeWidth={1.75} />}
                    Site Selector
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-white/50 group-hover:text-white transition-transform duration-300 ${showSiteSelector ? "rotate-180" : ""} ${briefSeen ? "" : "opacity-0"}`}
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
                    // Close whatever dot panel Show Zones left open — otherwise
                    // it keeps floating over the viewport while Add Zones is
                    // also open, covering the very dwelling you're dragging onto.
                    setClickedHotspotId(null);
                    setActiveCutaway(null);
                  }}
                  disabled={!dotsRevealed}
                  className="w-full flex items-center justify-between group disabled:cursor-not-allowed"
                  aria-expanded={showLayoutZones}
                  aria-disabled={!dotsRevealed}
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
                        <div
                          ref={zoneScrollRef}
                          className="flex-1 flex gap-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory"
                        >
                          {zones.map((z) => (
                            <ZoneCard
                              key={z.id}
                              zone={z}
                              onDragStart={handleZoneDragStart}
                              onDragMove={handleZoneDragMove}
                              onDragDrop={handleZoneDragDrop}
                              glow={glowHintsEnabled && z.id === "grow" && !plantsGrown}
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

              <div className={`rounded-[1.5rem] ${glowHintsEnabled && plantsGrown && !exploreSeen ? "panel-glow-pulse" : ""}`}>
              <motion.aside
                initial={blurInit}
                animate={blurIn}
                transition={{ duration: 0.7, delay: 0.775, ease: "easeOut" }}
                className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-body uppercase tracking-[0.12em] ${plantsGrown ? "text-white/60" : "text-white/30"}`}>
                    {plantsGrown ? <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Lock className="h-3 w-3" strokeWidth={1.75} />}
                    Step Inside
                  </span>
                  <Switch
                    checked={exploreUnlocked}
                    disabled={!plantsGrown}
                    onCheckedChange={(checked) => {
                      if (!plantsGrown) return;
                      setExploreUnlocked(checked);
                      if (checked && !exploreSeen) {
                        // First time this unlocks, pop the Bed tooltip open on
                        // its own (Explore more included) instead of leaving
                        // the user to guess which dot actually has a 360°
                        // view behind it.
                        setClickedHotspotId("s7");
                        setShowExploreCursorHint(true);
                      }
                      if (checked) setExploreSeen(true);
                    }}
                    aria-label="Unlock stepping inside a zone's 360° panorama"
                    title={!plantsGrown ? "Drop Plant Bay onto the dwelling first" : undefined}
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
              {/* Section tabs + 2D/3D toggle */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  {(["dwelling"] as const).map((s) => (
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
                      {/* "3D" reads as "Elevation" for the exterior dwelling view — same
                          underlying viewMode value, just a clearer label. Once inside a
                          360° panorama (activeExplore), it reverts to plain "3D" since
                          "Elevation" (an exterior architectural view) no longer applies. */}
                      {v === "3D" ? (activeExplore ? "3D" : "Elevation") : v}
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
                {stage === "customise" || stage === "plans" ? (
                    // Once configuration is continued, the viewport shows only
                    // a static scene — no hotspots, no zone interactions — but
                    // it's still the exact same background + dwelling render as
                    // the design stage (same landscape, same grow/bracing/windows
                    // overlays, same zoom), so nothing changes underneath when
                    // "Continue configuration" is clicked. Fire pit seating used
                    // to swap this out for an unrelated dedicated scene — dropped
                    // so the two stages always show the same picture.
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: zoomOrigin ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : "50% 50%",
                      }}
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
                          style={{ aspectRatio: "2400/1792", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}
                        >
                          <img src={_dwellingImg} alt="Dwelling" className="w-full h-full object-contain pointer-events-none" />
                          <img
                            src={withGrowDwelling}
                            alt="Dwelling with the growing-plants bay"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: _showGrowOverlay ? 1 : 0 }}
                          />
                          <img
                            src={_bracingImg}
                            alt="Dwelling with cross-braced ribs"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: showBracingOverlay ? 1 : 0 }}
                          />
                          {/* Whichever zone patch was last peeked open in the design
                              stage's viewport carries through as the starting point
                              here too, instead of the cutaway just vanishing. */}
                          {Object.entries(CUTAWAY_IMAGES).map(([id, img]) => {
                            const [x0, y0, x1, y1] = CUTAWAY_PATCH_BOXES[id];
                            return (
                              <img
                                key={id}
                                src={img}
                                alt="Section detail"
                                className="absolute pointer-events-none"
                                style={{
                                  left: `${(x0 / CUTAWAY_CANVAS_W) * 100}%`,
                                  top: `${(CUTAWAY_IMG_TOP_FRAC + (y0 / CUTAWAY_CANVAS_H) * CUTAWAY_IMG_HEIGHT_FRAC) * 100}%`,
                                  width: `${((x1 - x0) / CUTAWAY_CANVAS_W) * 100}%`,
                                  height: `${((y1 - y0) / CUTAWAY_CANVAS_H) * CUTAWAY_IMG_HEIGHT_FRAC * 100}%`,
                                  opacity: activeCutaway === id ? 1 : 0,
                                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                                  maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                                }}
                              />
                            );
                          })}
                          <img
                            src={windowsOnDwelling}
                            alt="Dwelling with more windows"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: showWindowsOverlay ? 1 : 0 }}
                          />
                        </div>
                      </div>
                    </div>
                ) : (
                  <>
                <AnimatePresence mode="wait">
                  {engineReady && (activeSection === "dwelling" && viewMode === "plan" ? (
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
                        className="absolute inset-0 w-full h-full object-contain bg-[#faf8f4]"
                      />
                    </motion.div>
                  ) : (
                    /* Zoomable scene — landscape + dwelling + hotspots scale together */
                    <motion.div
                      key="scene-3d"
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, scale: zoom }}
                      exit={{ opacity: 0 }}
                      // Anchor the scale on the focused hotspot so the zoom
                      // pushes in on that section; falls back to centre for the
                      // manual zoom buttons.
                      style={{
                        transformOrigin: zoomOrigin
                          ? `${zoomOrigin.x}% ${zoomOrigin.y}%`
                          : "50% 50%",
                        transition: "transform-origin 600ms cubic-bezier(0.6,0.2,0.2,1)",
                      }}
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
                        style={{ transform: `scale(${_landscapeZoom})` }}
                      />
                      <div className="absolute inset-0 bg-black/30" aria-hidden />

                      {/* Dwelling structure, composited over the landscape — aspect-locked
                          wrapper so the hotspot %-coordinates line up with the actual
                          image regardless of how it's letterboxed inside the viewport */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="relative translate-y-8"
                          style={{ aspectRatio: "2400/1792", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}
                        >
                          <img
                            src={_dwellingImg}
                            alt="Dwelling"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                          {/* The dwelling starts without the growing-plants bay — this fades
                              IN once Grow Plants is dropped onto the viewport. Placed right
                              after the base (before the cutaways/other overlays below) so
                              those still render on top of it once active, instead of this
                              masking them. */}
                          <img
                            src={withGrowDwelling}
                            alt="Dwelling with the growing-plants bay"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: _showGrowOverlay ? 1 : 0 }}
                          />
                          {/* Chat-triggered "change the bracing type" overlay — placed
                              behind the per-zone cutaways below (unlike the windows
                              overlay after them) so a cutaway a user has open stays
                              visible on top instead of this covering it. */}
                          <img
                            src={_bracingImg}
                            alt="Dwelling with cross-braced ribs"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: showBracingOverlay ? 1 : 0 }}
                          />
                          {/* Each cutaway is a small patch, not a full dwelling replacement —
                              sized/positioned from CUTAWAY_PATCH_BOXES (pixel coordinates on
                              the same canvas as the base render) so it only ever covers its
                              own peek window, leaving bracing/grow/etc. visible around it. */}
                          {Object.entries(CUTAWAY_IMAGES).map(([id, img]) => {
                            const [x0, y0, x1, y1] = CUTAWAY_PATCH_BOXES[id];
                            return (
                              <img
                                key={id}
                                src={img}
                                alt="Section detail"
                                className="absolute pointer-events-none transition-opacity duration-500"
                                style={{
                                  left: `${(x0 / CUTAWAY_CANVAS_W) * 100}%`,
                                  top: `${(CUTAWAY_IMG_TOP_FRAC + (y0 / CUTAWAY_CANVAS_H) * CUTAWAY_IMG_HEIGHT_FRAC) * 100}%`,
                                  width: `${((x1 - x0) / CUTAWAY_CANVAS_W) * 100}%`,
                                  height: `${((y1 - y0) / CUTAWAY_CANVAS_H) * CUTAWAY_IMG_HEIGHT_FRAC * 100}%`,
                                  opacity: activeCutaway === id ? 1 : 0,
                                  // Soft vertical feather — the patch is a plain rectangular
                                  // photo crop, taller than the roofline opening it sits in,
                                  // so a hard edge pokes past the fabric into sky/ground. This
                                  // fades it into whatever's behind instead of a hard cutoff.
                                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                                  maskImage: "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)",
                                }}
                              />
                            );
                          })}
                          {/* Chat-triggered "add more windows" overlay — same pixel-aligned
                              crossfade mechanism as the hotspot cutaways above. */}
                          <img
                            src={windowsOnDwelling}
                            alt="Dwelling with more windows"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: showWindowsOverlay ? 1 : 0 }}
                          />
                          {/* Same aura-glow-behind-a-white-core look as the Tribe page's
                              node markers, shifted bluer. The button itself is sized to
                              match the visible glow (not just the core dot) so hover
                              actually triggers when the cursor is over the glow. Held back
                              until the "Reveal Zones" toggle is switched on, then powers on
                              along the roofline one by one instead of just appearing.
                              s1 (Plant Bay) is left out until the bay actually
                              exists on the dwelling — i.e. until Grow Plants is dropped
                              from the Layout Zones panel — then it joins the rest. */}
                          {dotsRevealed && renderHotspots(
                            DWELLING_HOTSPOTS.filter((h) => h.id !== "s1" || plantsGrown),
                            true,
                          )}

                          {/* Drop target hint — while the Plant Bay tile is being dragged
                              out of the sidebar, glow the spot on the dwelling where the
                              bay actually attaches, so it's obvious where to drop it (the
                              drop itself still works anywhere in the viewport — this is
                              purely a visual aim). Positioned in the same %-of-wrapper
                              space as DWELLING_HOTSPOTS, centered on s1's own coordinates. */}
                          <AnimatePresence>
                            {draggedZoneId === "grow" && !plantsGrown && (
                              <motion.div
                                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                                style={{ left: "5%", top: "40.86%" }}
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

                          {/* Arrival nudge — shown fresh every time this page mounts,
                              dismissed for the rest of this visit the moment any hotspot is
                              clicked or via its own close button. A ghost cursor glides over
                              to Living's known (58, 38.36) position and "taps" it on a loop —
                              showing the mechanic instead of just describing it. Gated behind
                              dotsRevealed too, same as the hotspots themselves — otherwise
                              it'd demo tapping a dot that isn't on screen yet. */}
                          {showHotspotHint && dotsRevealed && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                              <motion.div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ left: 0, top: 0 }}
                                animate={{
                                  left: ["16%", "16%", "58%", "58%", "58%"],
                                  top: ["16%", "16%", "38.36%", "38.36%", "38.36%"],
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
                              <div
                                className="absolute pointer-events-auto"
                                style={{ left: "6%", top: "8%", maxWidth: "200px" }}
                              >
                                <div className="liquid-glass-strong rounded-xl pl-3.5 pr-2.5 py-2.5 flex items-start gap-2">
                                  <p className="font-body text-[12px] text-white/90 leading-snug">
                                    Click a glowing point to see what's tailored for you
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

                          {/* One-time reward burst — a little spark + "Discovered" chip
                              the moment a user finds the mechanic (see rewardBurst above). */}
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
                        </div>
                      </div>
                    </motion.div>
                  ))}
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
                          <div className="relative" style={{ aspectRatio: "1/1", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}>
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

                {/* Zone pins — dropped from the Layout Zones panel, positioned
                    as % of the viewport box so they hold their place on resize. */}
                <div className="absolute inset-0 z-30 pointer-events-none">
                  {ALL_ZONE_IDS.filter((id) => zonePins[id]).map((id) => {
                    const pos = zonePins[id]!;
                    return (
                      <div
                        key={id}
                        className="absolute pointer-events-auto group"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -100%)" }}
                      >
                        <img
                          src={ZONE_IMAGES[id]}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-white/50 shadow-lg"
                        />
                        {/* Pin tail */}
                        <div className="w-2 h-2 rotate-45 mx-auto -mt-1 border-r border-b border-white/50 bg-black/70" />
                        <button
                          type="button"
                          onClick={() => removeZonePin(id)}
                          aria-label={`Remove ${ZONE_LABELS[id]} pin`}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black/80 border border-white/30 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Confirmation toast for dropping Plant Bay — no pin left behind
                    for it (see handleZoneDragDrop), just this brief message. */}
                <AnimatePresence>
                  {growDropToast && (
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
                      disabled={!onClick}
                      className="w-8 h-8 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </button>
                  ))}
                </div>

                {/* Context tags belong to the design stage — once customising,
                    the order panel carries that information instead. */}
                <div className={`absolute bottom-4 left-4 flex-wrap gap-2 ${stage === "design" ? "flex" : "hidden"}`}>
                  {_siteName && (
                    <span className="liquid-glass tag-glass">Site: {_siteName}</span>
                  )}
                  {selectedPlan && (
                    <span className="liquid-glass tag-glass">
                      Plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                    </span>
                  )}
                  {showLayoutZones && (
                    <span className="liquid-glass tag-glass">
                      Zones: {(plantsGrown ? 1 : 0) + Object.keys(zonePins).length} active
                    </span>
                  )}
                </div>

                {/* Section interior takeover — full viewport, closeable back to the main
                    scene. A real drag-around 360° panorama (photo-sphere-viewer) opening
                    on whichever scene SECTION_EXPLORE maps the clicked hotspot to — all
                    scenes are linked together via PANORAMA_SCENES' spotlight markers, so
                    from any entry point you can still walk to every other room. */}
                <AnimatePresence>
                  {activeExplore && SECTION_EXPLORE[activeExplore] && (
                    <motion.div
                      key={`explore-${activeExplore}`}
                      className="absolute inset-0 z-40"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <PanoramaViewer
                        src={PANORAMA_SCENES[panoramaScene].src}
                        markers={PANORAMA_SCENES[panoramaScene].markers}
                      />
                      <button
                        onClick={() => {
                          // Also clear the hotspot's own open/click state — otherwise
                          // clicking the same dot again just toggles it closed (since
                          // it never got the chance to "close" while the panorama was
                          // covering it), which reads as the dot doing nothing.
                          setActiveExplore(null);
                          setClickedHotspotId(null);
                          setActiveCutaway(null);
                          setPanoramaTourStep(0);
                        }}
                        aria-label="Close interior view"
                        className="absolute top-4 right-4 z-10 rounded-full w-11 h-11 inline-flex items-center justify-center text-white bg-black/70 border border-white/40 shadow-lg hover:bg-black/85 hover:border-white/70 transition-colors"
                      >
                        <X className="h-5 w-5" strokeWidth={2} />
                      </button>
                      {/* First-time, 3-step walkthrough for anyone who has never opened
                          the panorama before — separate from the close button's own
                          highlight in step 3, which points at the real button above
                          rather than duplicating it. */}
                      <AnimatePresence mode="wait">
                        {panoramaTourStep === 1 && (
                          <motion.div
                            key="tour-1"
                            className="absolute top-20 left-1/2 -translate-x-1/2 z-20"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="liquid-glass-strong rounded-xl px-4 py-3 flex items-center gap-3">
                              <p className="font-body text-[12px] text-white/90 leading-snug">
                                See a glowing dot? Click it to step into another room
                              </p>
                              <button
                                onClick={() => setPanoramaTourStep(2)}
                                className="shrink-0 px-3 py-1 rounded-full bg-white text-black text-[10px] font-body uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
                              >
                                Got it
                              </button>
                            </div>
                          </motion.div>
                        )}
                        {panoramaTourStep === 2 && (
                          <motion.div
                            key="tour-2"
                            className="absolute top-4 right-20 z-20"
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="liquid-glass-strong rounded-xl px-4 py-3 flex items-center gap-3 whitespace-nowrap">
                              <p className="font-body text-[12px] text-white/90 leading-snug">
                                Exit anytime from here
                              </p>
                              <button
                                onClick={() => setPanoramaTourStep(0)}
                                className="shrink-0 px-3 py-1 rounded-full bg-white text-black text-[10px] font-body uppercase tracking-[0.1em] hover:bg-white/90 transition-colors"
                              >
                                Got it
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {/* Pulsing ring around the real close button while step 2 points
                          at it — clicking the button itself (its own handler above
                          resets activeExplore) also ends the tour via this same flag
                          reset, so it doesn't linger into the next time someone opens
                          the panorama within this visit. */}
                      {panoramaTourStep === 2 && (
                        <motion.div
                          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full pointer-events-none border-2 border-white/80"
                          animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </>
                )}

                {/* Brief "rendering" spinner while the bracing swap is in flight —
                    sits on the outer viewport box (not the smaller aspect-locked
                    dwelling wrapper inside it), so it covers the whole rounded
                    viewport window edge-to-edge instead of floating as an
                    undersized rectangle with the dwelling peeking out around it. */}
                <AnimatePresence>
                  {bracingLoading && (
                    <motion.div
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Loader2 className="h-8 w-8 text-white/85 animate-spin" strokeWidth={1.5} />
                      <p className="font-body text-white/80 text-[11px] uppercase tracking-[0.18em]">
                        Updating bracing...
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Performance strip — design stage only; from customisation on,
                  the right-hand panel is the thing to read. */}
              {stage === "design" && (
                <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat icon={Clock} label="Assembly time" value={String(_assembly)} unit="hours" />
                  <Stat icon={Zap} label="Energy consumption" value={_energy} unit="kWh/d" />
                  <Stat icon={Weight} label="Total mass" value={_mass} unit="t" />
                  <Stat icon={Square} label="Total area" value="32" unit="m²" />
                </div>
              )}
            </motion.div>

            {/* RIGHT COLUMN — chat while designing, then price/order.
                Payment has moved to its own full-screen modal (below),
                matching the Congratulations overlay, so it's no longer part
                of this sliding slot. */}
            {(stage === "customise" || stage === "plans") && (
              <motion.div
                key="order-col"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="flex gap-4 min-w-0 self-stretch h-full"
              >
                {/* Your reservation and Choose your plan are two slides of one
                    strip. Unlike a crossfade, these are normal flex children
                    (not stacked on top of each other) — so while one is still
                    sliding out and the next is sliding in, both are genuinely
                    on screen side by side at once, same as the viewport
                    easing wider/narrower next to them. */}
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

            {/* AI ASSIST — CHAT. Glow lives on this wrapper, not the
                liquid-glass aside inside it — see the Site Selector wrapper
                above for why. The design/hidden toggle moves here too, so an
                off-stage chat still collapses to zero size instead of a
                wrapper div holding its grid cell open with hidden content. */}
            <div
              className={`${stage === "design" ? "h-full" : "hidden"} rounded-[1.5rem] ${glowHintsEnabled && hasExitedExplore && introPhase !== "ready" ? "panel-glow-pulse" : ""}`}
            >
            <motion.aside
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.5rem] p-6 shadow-lg shadow-black/20 flex flex-col self-stretch h-full"
            >
              <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/10">
                <span className="relative inline-flex w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center overflow-hidden">
                  <img src={assistantAvatar} alt="Engine Assistant" width={36} height={36} loading="lazy" className="w-full h-full object-contain" />
                </span>
                <div className="flex flex-col leading-tight">
                  <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body inline-flex items-center gap-1.5">
                    {!hasExitedExplore ? (
                      <>
                        <Lock className="h-2.5 w-2.5" strokeWidth={2} />
                        locked
                      </>
                    ) : (
                      <>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          apiOnline === null  ? "bg-white/30 animate-pulse" :
                          apiOnline           ? "bg-emerald-400 animate-pulse" :
                                                "bg-red-400"
                        }`} />
                        {apiOnline === null ? "connecting" : apiOnline ? "online" : "offline"}
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm font-body"
              >
                {!hasExitedExplore && (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/60">
                    <Lock className="h-8 w-8" strokeWidth={1.5} />
                    <p className="text-lg leading-snug font-body max-w-[300px]">
                      Complete the steps on the left — through Step Inside, then back out — to wake up the Engine Assistant.
                    </p>
                  </div>
                )}

                {hasExitedExplore && introPhase === "typing" && messages.length === 0 && (
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

                {bracingConfirmPending && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleBracingChoice(true)}
                      className="rounded-full px-4 py-2 text-xs font-body border bg-white/[0.06] text-white/85 border-white/15 hover:bg-white/15 hover:border-white/35 hover:shadow-[0_0_20px_-6px_rgba(255,255,255,0.35)] transition-[background,border,box-shadow] duration-300"
                    >
                      Yes, keep it
                    </motion.button>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.06, ease: "easeOut" }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleBracingChoice(false)}
                      className="rounded-full px-4 py-2 text-xs font-body border bg-white/[0.06] text-white/85 border-white/15 hover:bg-white/15 hover:border-white/35 hover:shadow-[0_0_20px_-6px_rgba(255,255,255,0.35)] transition-[background,border,box-shadow] duration-300"
                    >
                      No, go back
                    </motion.button>
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
                    !hasExitedExplore
                      ? "Locked — complete the steps on the left first"
                      : activeSection !== "dining" && activeSection !== "dwelling"
                      ? `Chat only available for dining`
                      : "Message Engine Assistant…"
                  }
                  disabled={!hasExitedExplore || isStreaming || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!hasExitedExplore || isStreaming || !input.trim() || (activeSection !== "dining" && activeSection !== "dwelling")}
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

      {/* Payment — full-screen modal styled like the Congratulations overlay
          below (backdrop blur, particles, centered glass card), reached from
          Choose your plan's "Continue to payment". */}
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

      {/* Reservation customizer — opens on Continue configuration */}
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


// Deliberately plain, not a card — these are read-only figures, not a
// control, so they shouldn't carry the same glass/hover treatment as the
// interactive panels around them (same reasoning as Your Summary above).
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
