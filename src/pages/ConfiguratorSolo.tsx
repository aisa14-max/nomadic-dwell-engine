import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { ZoomIn, ZoomOut, ArrowRight, ArrowLeft, Send, Loader2, X, ChevronDown, ChevronLeft, ChevronRight, Compass, LayoutGrid, Maximize2, Minimize2, Clock, Zap, Weight, Square, ClipboardList, Users, CalendarRange, Laptop, Layers, MousePointer2, Lock, type LucideIcon } from "lucide-react";
import BlurText from "@/components/BlurText";
import { Switch } from "@/components/ui/switch";
import landscapeBg from "@/assets/configurator-landscape-bg-v2.png";
// Solo dwelling's own exterior render, replacing the shared baked dwelling
// used on the other configurator pages — only this file points here, the
// main/couple pages still use their own asset (configurator-dwelling-baked-crop.png).
// exterior-0 is the initial dwelling shown before any zone is added;
// exterior-1 (imported below as withGrowDwelling) is what it fades into
// once a zone is added — same mechanism the main page already uses for
// its own grow-bay overlay, just pointed at the solo renders instead.
import dwellingFg from "@/assets/configurator-solo-exterior-0.png";
// Bedroom/bathroom hotspot peeks — full-canvas renders (same 8192x5504 as
// the exterior shots) with real alpha transparency around the interior
// content, so they drop straight on top of the exterior as a plain
// full-bleed overlay — no small-patch pixel math needed, unlike the old
// CUTAWAY_PATCH_BOXES system these replace for this page.
import soloBedroom0 from "@/assets/configurator-solo-bedroom-0.png";
import soloBathroom0 from "@/assets/configurator-solo-bathroom-0.png";
// Post-kitchen-added peeks — the dwelling widens once Kitchen is dropped
// (exterior-1), so bedroom/bathroom shift position and get their own
// re-rendered peeks to match; kitchen gets its first peek here too. Used
// once zoneAdded is true instead of the *-0 set above.
import soloBedroom1 from "@/assets/configurator-solo-bedroom-1.png";
import soloKitchen1 from "@/assets/configurator-solo-kitchen-1.png";
import soloBathroom1 from "@/assets/configurator-solo-bathroom-1.png";
// Solo's own 360° panoramas — wired in one at a time; bathroom first.
import soloPanoramaBathroom from "@/assets/configurator-solo-panorama-bathroom.png";
import soloPanoramaKitchen from "@/assets/configurator-solo-panorama-kitchen.png";
import soloPanoramaBedroom from "@/assets/configurator-solo-panorama-bedroom.png";
// Entrance/hallway scene — not tied to its own exterior hotspot, only
// reachable via the door marker inside the Bathroom panorama (and back).
import soloPanoramaEntrance from "@/assets/configurator-solo-panorama-entrance.png";
import { PanoramaViewer, type PanoramaMarker } from "@/components/worlds/PanoramaViewer";
import windowsOnDwelling from "@/assets/configurator-windows-on-dwelling.png";
// Rib × membrane colour variants — solo's own re-rendered set (not the
// generic family-page assets these replaced), one per combo except the
// default (PETG Clear rib + Beige membrane), which keeps using dwellingFg/
// shorterDwelling below since it's just the plain, already-wired render.
import dwellingBlackBeige from "@/assets/configurator-solo-rib-black-fabric-beige.png";
import dwellingBlackGreen from "@/assets/configurator-solo-rib-black-fabric-green.png";
import dwellingBlackRed from "@/assets/configurator-solo-rib-black-fabric-red.png";
import dwellingClearGreen from "@/assets/configurator-solo-rib-clear-fabric-green.png";
import dwellingClearRed from "@/assets/configurator-solo-rib-clear-fabric-red.png";
// Same 5 combos, for the "make the dwelling shorter" state.
import dwellingBlackBeigeShort from "@/assets/configurator-solo-rib-black-fabric-beige-short.png";
import dwellingBlackGreenShort from "@/assets/configurator-solo-rib-black-fabric-green-short.png";
import dwellingBlackRedShort from "@/assets/configurator-solo-rib-black-fabric-red-short.png";
import dwellingClearGreenShort from "@/assets/configurator-solo-rib-clear-fabric-green-short.png";
import dwellingClearRedShort from "@/assets/configurator-solo-rib-clear-fabric-red-short.png";
import withGrowDwelling from "@/assets/configurator-solo-exterior-1.png";
// Chat-triggered "make the dwelling shorter" overlay — same full-canvas
// exterior render technique as withGrowDwelling above, just swapped in by
// the assistant instead of the zone-drop flow. This is the default
// (PETG Clear rib + Beige membrane) state; see _shorterDwellingImg for the
// other 5 rib/membrane combos.
import shorterDwelling from "@/assets/configurator-solo-exterior-shorter.png";
// Zone peeks for the shorter dwelling — own re-rendered set (same technique
// as the *-0/*-1 peeks above), used instead of them while showShorterOverlay
// is on since the shorter render's roofline sits lower.
import soloBedroomShort from "@/assets/configurator-solo-bedroom-short.png";
import soloKitchenShort from "@/assets/configurator-solo-kitchen-short.png";
import soloBathroomShort from "@/assets/configurator-solo-bathroom-short.png";
import topViewImg from "@/assets/configurator-plan-single-compact.png";
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
import { PARTS, PartId, DEPOSIT_RATE } from "@/data/dwellingParts";
import { applyPlanDiscount } from "@/data/plans";
import { useMockAuth } from "@/context/MockAuth";
import { SITES } from "@/data/sites";

// Dwelling variant for "solo" households — one of 3 occupant-based
// dwellings (family -> main Configurator, couple -> ConfiguratorCouple,
// solo -> this page). Cloned from Configurator.tsx as a starting skeleton;
// the actual solo-dwelling assets/content get dropped in here separately.
// No backend for this build, same as the page it was cloned from — see
// ConfiguratorPortfolio.tsx for the live-connected version.

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

// Fallback replies for anything the baked demo doesn't recognize — picked at
// random so hammering the chat with different requests doesn't just repeat
// the same line. Each one owns naming the one capability that's actually
// wired up, so the dead end still points somewhere instead of just refusing.
const UNRECOGNIZED_REQUEST_LINES = [
  (cap: string) => `Can't do that yet — but ${cap} is possible.`,
  (cap: string) => `Not wired up yet. Try: ${cap}.`,
  (cap: string) => `Coming soon! For now: ${cap}.`,
  (cap: string) => `Outside my skills right now — ${cap} isn't though.`,
  (cap: string) => `Not yet possible, but ${cap} is.`,
] as const;
function pickUnrecognizedReply(capability: string): string {
  const line = UNRECOGNIZED_REQUEST_LINES[Math.floor(Math.random() * UNRECOGNIZED_REQUEST_LINES.length)];
  return line(capability);
}

// Layout Zones — reuses the same bed/living/kitchen/dining ids as the
// hover/click zone hotspots on the rendered dwelling (see DWELLING_HOTSPOTS'
// polygon overlay), so the sidebar list and the viewport zones speak the same
// vocabulary even though this list doesn't (yet) regenerate that render.
type ZoneId = "bed" | "living" | "kitchen" | "dining" | "grow";
type ZoneSize = "S" | "M" | "L";
const ZONE_LABELS: Record<ZoneId, string> = {
  bed: "Extra Bed", living: "Extra Couch", kitchen: "Kitchen", dining: "Extra Table", grow: "Plant Bay",
};
// Kitchen leads the list and is the only zone that's actually interactive
// right now — the rest (Plant Bay included) render locked/"coming soon" in
// ZoneCard below (see the `locked` check there) until their own drag/resize
// flows are ready.
const ALL_ZONE_IDS: ZoneId[] = ["kitchen", "grow", "bed", "living", "dining"];
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
  // Only Kitchen is wired up for drag right now — every other zone (Plant
  // Bay included) shows locked and inert with a "Coming soon" tag until it
  // gets the same treatment.
  const locked = zone.id !== "kitchen";

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

export default function ConfiguratorSolo() {
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

  // On the add-ons page, the order/price panel used to sit there from the
  // moment you arrived, competing with the dwelling for attention right
  // away. Now it only appears once you've actually started (opened a step
  // or picked something) — before that it's just add-ons + dwelling, two
  // panels, not three.
  const addOnsEngaged = r.activePart !== null || r.configured.size > 0;

  // Add-ons should only ever show the plain exterior dwelling — any zone
  // peek left open from the design stage (clicked a hotspot, never closed
  // it before hitting Continue configuration) would otherwise carry straight
  // into the static customise-stage scene, since that scene reuses the same
  // CUTAWAY_IMAGES/activeCutaway state instead of resetting it.
  const enterCustomise = () => {
    setActiveCutaway(null);
    setClickedHotspotId(null);
    setShowNext(true);
    r.setStage("configure");
  };
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
    : stage === "plans" ? "lg:grid-cols-[0px_1fr_520px]"
    // Before add-ons are engaged, the order panel isn't rendered at all
    // (see addOnsEngaged above) — collapsing its column to 0 instead of
    // leaving it reserved-but-empty lets the viewport grow into that space,
    // then the same grid-template-columns transition below eases it back
    // down to 360px right as the order panel slides in.
    : stage === "customise" && !addOnsEngaged ? "lg:grid-cols-[220px_1fr_0px]"
    : "lg:grid-cols-[220px_1fr_360px]";
  const [engineReady, setEngineReady] = useState(false);
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [showLayoutZones, setShowLayoutZones] = useState(false);
  // Demo-mode progressive unlock: each panel opens the next. "Seen" (not the
  // panel's own open/closed toggle) is what stays true once a step has been
  // visited, so collapsing a panel later doesn't re-lock what comes after it.
  // Your Summary is a static block now (always visible, nothing to "open"),
  // so it counts as seen immediately — Site Selector starts unlocked.
  const briefSeen = true;
  const [siteSeen, setSiteSeen] = useState(false);
  // The "Start here" arrival nudge dismisses on its own once the panel is
  // opened, but its own close (X) button just hides the nudge — it doesn't
  // fast-forward the step the way Skip does.
  const [siteHintDismissed, setSiteHintDismissed] = useState(false);
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
  // The chat's own glow waits a bit longer than exploreSeen itself — flipping
  // Step Inside on fires it immediately, but that's exactly when visitors are
  // busy looking at the 360° panorama they just opened, not the sidebar, so
  // the glow was starting (and often finishing invisibly) while nobody could
  // see it. Delayed until they've had time to actually look around.
  const [chatGlowReady, setChatGlowReady] = useState(false);
  useEffect(() => {
    if (!exploreSeen) return;
    const t = setTimeout(() => setChatGlowReady(true), 6000);
    return () => clearTimeout(t);
  }, [exploreSeen]);
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
  // The add-ons viewport grows wider (right column collapses) before
  // add-ons are engaged — see gridCols/addOnsEngaged above. The background
  // is object-cover, so a wider box on the same fixed height just reveals
  // more of the scene horizontally, making the sited dwelling within it
  // read smaller against the frame instead of staying the same size. This
  // tracks how much wider the box currently is than its normal (engaged)
  // width and feeds that back in as extra zoom, so the framing stays
  // consistent regardless of which width state it's in.
  const viewportNormalWidthRef = useRef(0);
  const [viewportBgZoomBoost, setViewportBgZoomBoost] = useState(1);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w <= 0) return;
      if (stage !== "customise" || addOnsEngaged) {
        viewportNormalWidthRef.current = w;
        setViewportBgZoomBoost(1);
      } else if (viewportNormalWidthRef.current > 0) {
        setViewportBgZoomBoost(w / viewportNormalWidthRef.current);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [stage, addOnsEngaged]);
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
  // Which hotspot's cutaway is currently showing (null = none). Each zone
  // has its own full-canvas peek render, not a small positioned patch:
  // those images are already the same 8192x5504 canvas as the exterior
  // shots with real alpha transparency around the interior content, so they
  // drop straight on top as a plain full-bleed overlay. See the "Dwelling
  // structure" comment further down for how they're rendered. CUTAWAY_IMAGES
  // itself is defined further down (depends on zoneAdded — kitchen widens
  // the dwelling and bedroom/bathroom get re-rendered peeks to match).
  const [activeCutaway, setActiveCutaway] = useState<string | null>(null);
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
  // Dropping Kitchen doesn't leave a pin on the viewport like the other
  // zones (there's nowhere sensible to pin it — dropping it changes the
  // whole dwelling render) — a brief confirmation toast instead.
  const [zoneDropToast, setZoneDropToast] = useState(false);
  // Chat-triggered overlay — typing "add more windows" crossfades this in over
  // the dwelling the same pixel-aligned way the hotspot cutaways do.
  const [showWindowsOverlay, setShowWindowsOverlay] = useState(false);
  // Same mechanism, for the "make the dwelling shorter" suggestion.
  const [showShorterOverlay, setShowShorterOverlay] = useState(false);
  // The dwelling's base render (exterior-0) is missing the kitchen bay by
  // default — an overlay showing it (exterior-1, imported as withGrowDwelling)
  // fades IN once the user drags the Kitchen zone onto the viewport (see
  // handleZoneDragDrop), at which point it stays for good (one-way switch,
  // not tied to a pin staying placed — kitchen doesn't leave one).
  const [zoneAdded, setZoneAdded] = useState(false);
  // Bedroom/bathroom get re-rendered peeks once the dwelling widens for
  // kitchen (see the import comment above) — kitchen only has one peek
  // since it doesn't exist before that point. The shorter dwelling gets its
  // own re-rendered set (its roofline sits lower than either tall state),
  // checked first since "shorter" can be triggered from either zone state.
  const CUTAWAY_IMAGES: Record<string, string> = showShorterOverlay
    ? { bedroom: soloBedroomShort, kitchen: soloKitchenShort, bathroom: soloBathroomShort }
    : zoneAdded
    ? { bedroom: soloBedroom1, kitchen: soloKitchen1, bathroom: soloBathroom1 }
    : { bedroom: soloBedroom0, bathroom: soloBathroom0 };
  // "Explore more" on a hotspot takes over the whole viewport with a real
  // drag-around 360° panorama for that section. Only zones with an actual
  // panorama get an entry here — add one as each new panorama arrives; that's
  // also what makes the button appear on that hotspot's tooltip.
  const [activeExplore, setActiveExplore] = useState<string | null>(null);
  // Mouse-wheel zoom + left-click-drag pan, alongside the existing +/-
  // buttons. Pan resets whenever zoom returns to 1 — otherwise the scene
  // could stay visibly offset even at rest scale, with nothing to pan. Both
  // are skipped entirely while the 360° panorama (activeExplore) is open —
  // photo-sphere-viewer already owns left-click-drag and wheel-zoom for
  // looking around, and this viewport's own listeners would otherwise
  // fight it for the same gestures on the same element underneath.
  const [pan, setPan] = useState({ x: 0, y: 0 });
  useEffect(() => { if (zoom === 1) setPan({ x: 0, y: 0 }); }, [zoom]);
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    // Native listener (not React's onWheel) — React 17+ registers wheel
    // handlers as passive by default, so preventDefault() inside a plain
    // onWheel prop silently does nothing and the page scrolls underneath.
    const onWheel = (e: WheelEvent) => {
      if (activeExplore) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((z) => Math.min(2, Math.max(1, +(z + delta).toFixed(2))));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [activeExplore]);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const handleViewportPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || zoom <= 1 || activeExplore) return;
    e.preventDefault();
    isPanningRef.current = true;
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleViewportPointerMove = (e: React.PointerEvent) => {
    if (!isPanningRef.current) return;
    setPan({
      x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
      y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
    });
  };
  const stopPanning = () => { isPanningRef.current = false; };
  // One entry per zone that actually has a panorama, plus "entrance" — a
  // hallway/connector scene with no exterior hotspot of its own, only
  // reachable via the door marker inside Bathroom (and back).
  type PanoramaSceneId = "bathroom" | "kitchen" | "bedroom" | "entrance";
  // Which hotspot opens which panorama scene. Add an entry here as each new
  // panorama comes online; that's also what makes "Explore more" appear on
  // that hotspot's tooltip instead of "Coming soon". "entrance" itself has
  // no exterior dot of its own — it's opened via the standalone ground-level
  // dot that appears once Bathroom's dot is clicked (see near
  // DWELLING_HOTSPOTS' render call below), which reuses this same
  // activeExplore/panoramaScene mechanism directly.
  const SECTION_EXPLORE: Record<string, { type: "panorama"; scene: PanoramaSceneId }> = {
    bathroom: { type: "panorama", scene: "bathroom" },
    kitchen: { type: "panorama", scene: "kitchen" },
    bedroom: { type: "panorama", scene: "bedroom" },
    entrance: { type: "panorama", scene: "entrance" },
  };
  // The panorama tour — same linked, Street-View-style mechanism as the main
  // dwelling (each scene can carry spotlight markers to walk into another
  // scene), just with solo's own zone ids instead of s1-s8. Opens on
  // whichever scene SECTION_EXPLORE maps the clicked hotspot to.
  // Bathroom <-> Entrance is the first inter-scene link: marker x/y are real
  // pixel positions on each door, found by cropping and grid-measuring the
  // actual equirectangular renders (both on the visible door panel, just
  // above its handle) — not eyeballed on the full sphere.
  const [panoramaScene, setPanoramaScene] = useState<PanoramaSceneId>("bathroom");
  // Memoized so PanoramaViewer's marker prop keeps a stable reference across
  // Configurator's frequent re-renders (chat streaming, etc.) — otherwise its
  // "sync markers with the plugin" effect re-fires on every render, tearing
  // down and rebuilding the marker DOM mid-click.
  const PANORAMA_SCENES = useMemo<Record<PanoramaSceneId, { src: string; markers: PanoramaMarker[] }>>(
    () => ({
      bathroom: {
        src: soloPanoramaBathroom,
        // On the bathroom's own door — leads back out to the entrance/hallway.
        markers: [
          { id: "to-entrance", x: 7950, y: 2600, onClick: () => setPanoramaScene("entrance") },
        ],
      },
      kitchen: {
        src: soloPanoramaKitchen,
        // Same open-plan shot as the bedroom panorama, camera facing the
        // other way — the bed is visible here too. On the floor beside it —
        // leads back into the bedroom.
        markers: [
          { id: "to-bedroom", x: 2000, y: 2970, onClick: () => setPanoramaScene("bedroom") },
        ],
      },
      bedroom: {
        src: soloPanoramaBedroom,
        // Same crop-and-measure approach as the bathroom/entrance door
        // markers. On the open floor just right of the wooden board by the
        // sink — leads out to the entrance/hallway.
        markers: [
          { id: "to-entrance", x: 1300, y: 2872, onClick: () => setPanoramaScene("entrance") },
          // On the floor in front of the fridge — leads into the kitchen.
          { id: "to-kitchen", x: 6733, y: 3328, onClick: () => setPanoramaScene("kitchen") },
        ],
      },
      entrance: {
        src: soloPanoramaEntrance,
        markers: [
          // On the closed door partway down the hallway — leads into the bathroom.
          { id: "to-bathroom", x: 5600, y: 2600, onClick: () => setPanoramaScene("bathroom") },
          // On the floor at the archway threshold, right beside the bed/beanbag
          // visible through it — leads into the bedroom.
          { id: "to-bedroom", x: 3982, y: 2842, onClick: () => setPanoramaScene("bedroom") },
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

  // 2 zones before Kitchen is dropped, 3 after (it slots in between, per
  // CUTAWAY_IMAGES above). x/y are the top-center of each zone's own peek
  // image's real (alpha-channel) content — i.e. the middle of its roofline —
  // computed directly from each configurator-solo-*.png, not eyeballed:
  // every image's non-transparent bounding box gave a top edge at y≈22.4%,
  // nudged down 1.5% (same margin the old roofline-scanned s1-s8 set used)
  // so the dot sits just below the actual roof edge instead of clipping it.
  // Bedroom and bathroom shift x once kitchen widens the dwelling — verified
  // against the actual exterior-1 render, not assumed to stay put.
  // Chat-triggered "make the dwelling shorter" swap keeps the same x-span as
  // the post-kitchen render (its alpha bbox is pixel-identical left/right/
  // bottom edge to exterior-1 — only the roofline drops), so only y moves:
  // measured top edge at each zone's x-center is y≈32.9–33.7%, nudged down
  // 1.5% the same way as the tall-dwelling set above.
  const DWELLING_HOTSPOTS = showShorterOverlay
    ? [
        { id: "bedroom", x: 37.0, y: 34.9 },
        { id: "kitchen", x: 52.9, y: 34.9 },
        { id: "bathroom", x: 62.6, y: 34.9 },
      ]
    : zoneAdded
    ? [
        { id: "bedroom", x: 37.0, y: 23.9 },
        { id: "kitchen", x: 52.9, y: 23.9 },
        { id: "bathroom", x: 62.6, y: 23.9 },
      ]
    : [
        { id: "bedroom", x: 47.0, y: 23.9 },
        { id: "bathroom", x: 62.6, y: 23.9 },
      ];

  // Zone names — purely a label, not tied to any real per-zone data.
  const HOTSPOT_LABELS: Record<string, string> = {
    bedroom: "Bedroom",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    entrance: "Entrance",
  };
  // Zone names on the plan view, x = centre of each zone's room as a % of the
  // plan image's width (configurator-plan-single-compact.png, cropped to the
  // plan itself, 2184px). Alternates above/below the plan, starting above.
  const PLAN_ZONE_LABELS = [
    { id: "bedroom", x: 27 },
    { id: "kitchen", x: 63 },
    { id: "bathroom", x: 86 },
  ];

  // Standalone ground-level dot, not part of the roofline set above — only
  // appears once Bathroom's own dot has been clicked, as a second way into
  // the panorama tour (straight to Entrance) alongside Bathroom's own
  // "Explore more". Reuses renderHotspots as a real hotspot (same glow,
  // tooltip, "Explore more" via SECTION_EXPLORE.entrance) rather than a
  // one-off button, just rendered conditionally and positioned lower.
  const ENTRANCE_GROUND_HOTSPOT = [{ id: "entrance", x: 62.6, y: 73.6 }];

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
            {/* Ghost-cursor demo, Bedroom only — glides from the label down onto
                "Explore more" and taps it, on a loop, until actually clicked. */}
            {h.id === "bedroom" && showExploreCursorHint && exploreUnlocked && (
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
      if (id === "kitchen") {
        setZoneAdded(true);
        setZoneDropToast(true);
        setTimeout(() => setZoneDropToast(false), 2500);
        removeZone("kitchen");
        // Close Add Zones now that its one job is done — otherwise the
        // still-open zone carousel keeps the newly-glowing Step Inside
        // switch (see its panel-glow-pulse condition further down, gated on
        // zoneAdded) crowded out below it instead of being the obvious next
        // thing to notice.
        setShowLayoutZones(false);
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
  // thumbnail too, instead of the default catalog photo.
  // Pinned alternates, in order: Yukon Bend is always the second suggestion
  // (right after the onboarding pick), then Atacama Plateau — so they are
  // always offered, not just whichever 3 come first in the catalog.
  const _pinnedSites = ["Yukon Bend", "Atacama Plateau"]
    .map((t) => SITES.find((s) => s.title === t && !s.locked))
    .filter((s): s is (typeof SITES)[number] => !!s && s.title !== _primarySite.title);
  const _otherSites = SITES.filter(
    (s) =>
      !s.locked &&
      s.title !== _primarySite.title &&
      !_pinnedSites.some((p) => p.title === s.title),
  );
  const _extraSites = [..._pinnedSites, ..._otherSites]
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
      lastSettledSiteIdxRef.current = finalRealIdx;
    }, 130);
  };
  const _siteName = activeSite.title;
  const _siteRegion = activeSite.region;
  // Every site can carry its own elevation-view landscape backdrop; sites
  // without one fall back to the generic default scene.
  const _landscapeBg = activeSite.landscapeImage ?? landscapeBg;
  const _landscapeZoom = activeSite.landscapeImage ? activeSite.landscapeZoom ?? 1 : 1;
  const _landscapeOffsetY = activeSite.landscapeImage ? activeSite.landscapeOffsetY ?? 0 : 0;
  // Rib Colour (an add-on, not a design-stage choice) recolors the cross-braced
  // overlay's ribs black instead of swapping in an unrelated scene — keeps the
  // actual site background intact instead of jumping to a different photo.
  const _ribIsBlack = r.configured.get("rib") === "petg-black";
  const _dwellingImg =
    r.configured.get("membrane") === "green" ? (_ribIsBlack ? dwellingBlackGreen : dwellingClearGreen)
    : r.configured.get("membrane") === "red" ? (_ribIsBlack ? dwellingBlackRed : dwellingClearRed)
    : _ribIsBlack ? dwellingBlackBeige
    : dwellingFg;
  // Same rib/membrane combo logic, for the "make the dwelling shorter" state.
  const _shorterDwellingImg =
    r.configured.get("membrane") === "green" ? (_ribIsBlack ? dwellingBlackGreenShort : dwellingClearGreenShort)
    : r.configured.get("membrane") === "red" ? (_ribIsBlack ? dwellingBlackRedShort : dwellingClearRedShort)
    : _ribIsBlack ? dwellingBlackBeigeShort
    : shorterDwelling;
  // The kitchen-added overlay (exterior-1) is a full (uncolored) dwelling
  // replacement, not a small patch, and there's no colored version of it —
  // it used to only show for the default rib/membrane combo, which meant
  // picking any other add-on color made it vanish and fall back to
  // exterior-0 (the pre-zone render), reading as a glitch. Now the
  // zone-added view always wins once a zone's been added — a custom
  // rib/membrane color won't visibly change the exterior until there's a
  // colored render of this overlay to swap in.
  const _showZoneOverlay = zoneAdded;

  const greeting: string = locationState?.reply?.trim()
    ? locationState.reply
    : _siteName
      ? `Hi! I've designed your ${_spec.dining_style ?? "compact"} dwelling at ${_siteName}. Anything to adjust?`
      : "Hi! Anything you'd like to adjust about your dwelling?";

  // The very first chip row offers only the one suggestion that actually
  // works, so a first-time visitor's first click is guaranteed to succeed.
  // Every chip row after that (once any message has been sent) swaps to the
  // dead-end options instead — they fall through to pickUnrecognizedReply —
  // so "Make the dwelling shorter" is never offered a second time.
  const suggestions: string[] = messages.some((m) => m.role === "user")
    ? ["Add bracings", "Add a skylight", "Make it wider"]
    : ["Make the dwelling shorter"];
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [introPhase, setIntroPhase] = useState<"idle" | "typing" | "streaming" | "ready">("idle");
  // After the change is applied, the assistant asks whether to keep it.
  const [shorterConfirmPending, setShorterConfirmPending] = useState(false);
  const [shorterLoading, setShorterLoading] = useState(false);

  useEffect(() => {
    // Also held back until exploreSeen — the assistant stays locked and
    // silent until Step Inside has been switched on at least once, then
    // starts typing its greeting.
    if (!engineReady || !exploreSeen) return;
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
  }, [engineReady, exploreSeen]);
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
    // Chat-triggered changes render on the exterior dwelling viewport, which
    // the 360° panorama takeover covers completely — sending a message while
    // still inside it would apply the change somewhere the visitor can't
    // see. Same reset as the panorama's own close button.
    if (activeExplore) {
      setActiveExplore(null);
      setClickedHotspotId(null);
      setActiveCutaway(null);
      setPanoramaTourStep(0);
    }
    setShowSuggestions(false);
    const userMsg: ChatMsg = { role: "user", content: text };
    const chatHistory = messages.filter((m) => m.content !== "");
    setMessages([...chatHistory, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    await new Promise((r) => setTimeout(r, 400));
    const addsWindows = text.toLowerCase().includes("add more windows");
    if (addsWindows) setShowWindowsOverlay(true);
    const makesShorter = text.toLowerCase().includes("shorter");
    if (makesShorter) {
      // Spinner over the viewport while the "render" happens, then reveal
      // the shorter overlay — same beat as the assistant's own typing
      // dots, which are still showing since the message isn't set yet.
      setShorterLoading(true);
      await new Promise((r) => setTimeout(r, 1500));
      setShorterLoading(false);
      setShowShorterOverlay(true);
      setShorterConfirmPending(true);
    }
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "assistant",
        content: addsWindows
          ? "Added more windows — take a look!"
          : makesShorter
          ? "Shortened it — like it?"
          : pickUnrecognizedReply("shortening the dwelling"),
      };
      return next;
    });
    setIsStreaming(false);
    // Bring the suggestion chip back after anything that isn't itself
    // heading into a confirm-pending state, so a dead-end reply still
    // leaves an obvious way back to the one thing that actually works —
    // otherwise the chip vanishes for good after the very first message.
    if (!makesShorter) setShowSuggestions(true);
  };

  // Yes/No reply to "Do you like this change?" after the shorter swap —
  // Yes leaves showShorterOverlay on, No flips it back to the original.
  const handleShorterChoice = async (liked: boolean) => {
    if (isStreaming) return;
    setShorterConfirmPending(false);
    const userMsg: ChatMsg = { role: "user", content: liked ? "Yes, keep it" : "No, go back" };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setIsStreaming(true);
    await new Promise((r) => setTimeout(r, 400));
    if (!liked) setShowShorterOverlay(false);
    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: "assistant",
        content: liked
          ? "Great — keeping it!"
          : "No problem — reverted!",
      };
      return next;
    });
    setIsStreaming(false);
    setShowSuggestions(true);
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
  // Neither the onboarding spec above nor these stats ever reacted to what
  // actually happens on the dwelling afterward — adding the Kitchen zone or
  // shortening it from chat changed the render but left Assembly
  // time/Energy/Mass/Area exactly as they were. Rough multiplier since
  // there's no live backend call here to recompute the real figures.
  const _zoneMultiplier = (zoneAdded ? 1.3 : 1) * (showShorterOverlay ? 0.8 : 1);
  const _areaM2Num = (_areaCm2 / 10000) * _zoneMultiplier;
  const _assembly  = Math.round(6.5 + _areaM2Num * 1.2);
  const _energy    = (1.8 + _areaM2Num * 0.5).toFixed(1);
  const _mass      = (0.25 + _areaM2Num * 0.13).toFixed(2);
  const _totalArea = Math.round(_areaM2Num);

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
          {/* relative z-20 here (not just on the ghost-cursor's own inner
              wrapper) is the actual fix for it rendering behind the chat
              panel below: this row and the grid row further down are direct
              siblings, so THIS is the level where their stacking order gets
              decided — a z-index set only on something nested deep inside
              this row can't win that comparison, no matter how high. */}
          <div className="relative z-20 flex items-end justify-between flex-wrap gap-6">
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
              {stage === "design" ? (
                <div className="relative z-30">
                  <button
                    onClick={enterCustomise}
                    disabled={!exploreSeen}
                    title={!exploreSeen ? "Open Site Selector, show the zones, add a zone, and step inside first" : undefined}
                    className={`bg-white text-black rounded-full px-5 py-2.5 text-sm font-body font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${exploreSeen ? "panel-glow-pulse" : ""}`}
                  >
                    {exploreSeen
                      ? <>Continue configuration <ArrowRight className="h-4 w-4" strokeWidth={2} /></>
                      : <>Continue configuration <Lock className="h-3.5 w-3.5" strokeWidth={2} /></>}
                  </button>
                  {/* Ghost-cursor nudge toward Continue configuration — once
                      they've actually sent a chat message, that's the next
                      obvious move, so it gets the same "here's what to do
                      next" treatment as the earlier steps instead of relying
                      on the button's own glow alone to be noticed. z-30 (on
                      this wrapper, and the cursor itself below) since the
                      header sits directly above the chat panel's own card —
                      without it the cursor was rendering behind that card
                      instead of in front of it. */}
                  {exploreSeen && messages.some((m) => m.role === "user") && (
                    <motion.div
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                      style={{ left: "50%", top: "220%" }}
                      animate={{
                        top: ["220%", "220%", "50%", "50%", "50%"],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [1, 1, 1, 0.72, 1],
                      }}
                      transition={{
                        duration: 2,
                        times: [0, 0.12, 0.55, 0.66, 0.88],
                        repeat: Infinity,
                        repeatDelay: 0.6,
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
                </div>
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
                <div className={`rounded-[1.5rem] ${!r.activePart && r.configured.size === 0 ? "panel-glow-pulse" : ""}`}>
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
              <div className={`relative rounded-[1.5rem] ${!siteSeen ? "panel-glow-pulse" : ""}`}>
              <motion.aside
                initial={blurInit}
                animate={blurIn}
                transition={{ duration: 0.7, delay: 0.7, ease: "easeOut" }}
                className="liquid-glass rounded-[1.5rem] p-4 shadow-lg shadow-black/20"
              >
                <div className="w-full flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      if (!briefSeen) return;
                      setShowSiteSelector((v) => !v);
                    }}
                    disabled={!briefSeen}
                    className="flex-1 min-w-0 flex items-center justify-between group disabled:cursor-not-allowed"
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
                  {/* Only once the carousel is actually open — before that,
                      "skip past a step you haven't looked at yet" doesn't
                      make sense. The default site is already a real pick
                      (onboarding's or a fallback), not a placeholder, so
                      this is a real way past the step once they've seen it,
                      not just a decoy next to the real interaction. Doesn't
                      close the panel — unlike Add Zones below, which closes
                      itself once its one job is done, Site Selector is left
                      open so browsing can continue afterward. */}
                  {showSiteSelector && !siteSeen && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSiteSeen(true); }}
                      className="shrink-0 text-[10px] font-body font-medium uppercase tracking-[0.08em] px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400/25 hover:text-emerald-200 transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>

                {/* Arrival nudge — the very first thing a visitor needs to do,
                    so it's shown from the moment the panel is interactive
                    (briefSeen is true immediately) until Site Selector is
                    actually opened (its job — get them to open it — is done
                    at that point, whether or not they go on to pick a site
                    or Skip) or its own X is dismissed. Same ghost-cursor +
                    dismissible bubble pattern as the hotspot arrival nudge
                    further down, just on a shorter loop — this is the very
                    first thing anyone sees, so it shouldn't feel like it's
                    idling between passes. */}
                {briefSeen && !showSiteSelector && !siteSeen && !siteHintDismissed && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <motion.div
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: "85%", top: "125%" }}
                      animate={{
                        left: ["85%", "85%", "45%", "45%", "45%"],
                        top: ["125%", "125%", "45%", "45%", "45%"],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [1, 1, 1, 0.72, 1],
                      }}
                      transition={{
                        duration: 1.8,
                        times: [0, 0.12, 0.55, 0.66, 0.88],
                        repeat: Infinity,
                        repeatDelay: 0.4,
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
                    <div className="absolute pointer-events-auto" style={{ right: "8px", top: "-40px", maxWidth: "170px" }}>
                      <div className="liquid-glass-strong rounded-xl pl-3.5 pr-2.5 py-2.5 flex items-start gap-2">
                        <p className="font-body text-[12px] text-white/90 leading-snug">
                          Start here
                        </p>
                        <button
                          onClick={() => setSiteHintDismissed(true)}
                          className="shrink-0 mt-0.5 text-white/40 hover:text-white/80"
                          aria-label="Dismiss hint"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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
                            onClick={() => { scrollToSiteLoopIdx(currentSiteLoopIdxRef.current - 1); setSiteSeen(true); }}
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
                                onClick={() => { scrollToSiteLoopIdx(li); setSiteSeen(true); }}
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
                            onClick={() => { scrollToSiteLoopIdx(currentSiteLoopIdxRef.current + 1); setSiteSeen(true); }}
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

              {/* siteSeen covers both real ways past Site Selector — picking
                  a different site in the carousel, or Skip — so either one
                  is enough to move the glow on to Show Zones. */}
              <div className={`rounded-[1.5rem] ${siteSeen && !dotsRevealed ? "panel-glow-pulse" : ""}`}>
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

              <div className={`rounded-[1.5rem] ${dotsRevealed && !zonesSeen ? "panel-glow-pulse" : ""}`}>
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
                              glow={z.id === "kitchen" && !zoneAdded}
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

              <div className={`rounded-[1.5rem] ${zoneAdded && !exploreSeen ? "panel-glow-pulse" : ""}`}>
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
                      if (checked && !exploreSeen) {
                        // First time this unlocks, pop the Bedroom tooltip open
                        // on its own (Explore more included) instead of leaving
                        // the user to guess which dot actually has a 360°
                        // view behind it.
                        setClickedHotspotId("bedroom");
                        setShowExploreCursorHint(true);
                      }
                      if (checked) setExploreSeen(true);
                    }}
                    aria-label="Unlock stepping inside a zone's 360° panorama"
                    title={!zoneAdded ? "Drop Kitchen onto the dwelling first" : undefined}
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
              {/* Section tabs + 2D/3D toggle — hidden entirely on the
                  add-ons page. The viewport there is a static exterior
                  scene (see stage === "customise" below), so neither the
                  "dwelling" label nor Elevation/Plan did anything useful;
                  dropping the whole row also lets this card's top edge
                  align flush with the Add-ons and Price & Order cards
                  beside it, instead of sitting lower under this row's own
                  height + margin like it used to. */}
              {stage !== "customise" && (
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1 bg-white/5 rounded-full p-1">
                  {/* "dwelling" is the only section this page ever has — no
                      other section to switch to, so it's shown (always
                      active) but not clickable, unlike the real 3D/Plan
                      toggle beside it. It used to still be a live button
                      that re-ran fetchRender on every click despite nothing
                      actually changing, which read as a glitch (a visible
                      re-render flash) rather than a no-op. */}
                  {(["dwelling"] as const).map((s) => (
                    <span
                      key={s}
                      className="px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em] bg-white text-black font-medium cursor-default"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                {/* Hidden on the subscription page too — same static-scene
                    reasoning as add-ons (see stage === "plans" below). */}
                {stage !== "plans" && (
                  <div className="flex gap-1 bg-white/5 rounded-full p-1">
                    {/* Always Elevation/Plan, never 2D — see Configurator.tsx
                        for why (activeSection used to flip this to a 2D/3D
                        toggle with no real 2D content behind it). */}
                    {(["3D", "plan"] as const).map((v) => (
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
                )}
              </div>
              )}

              <div
                ref={viewportRef}
                className={[
                  isFullscreen
                    ? "relative w-full h-full overflow-hidden liquid-glass rounded-none"
                    : "relative rounded-[1.25rem] overflow-hidden liquid-glass",
                  isZoneDragOver ? "ring-2 ring-white/50" : "",
                  zoom > 1 && !activeExplore ? "cursor-grab active:cursor-grabbing" : "",
                ].join(" ")}
                style={isFullscreen ? undefined : { height: "58vh" }}
                onPointerDown={handleViewportPointerDown}
                onPointerMove={handleViewportPointerMove}
                onPointerUp={stopPanning}
                onPointerLeave={stopPanning}
              >
                {stage === "customise" || stage === "plans" ? (
                    // Once configuration is continued, the viewport shows only
                    // a static scene — no hotspots, no zone interactions — but
                    // it's still the exact same background + dwelling render as
                    // the design stage (same landscape, same grow/shorter/windows
                    // overlays, same zoom), so nothing changes underneath when
                    // "Continue configuration" is clicked. Fire pit seating used
                    // to swap this out for an unrelated dedicated scene — dropped
                    // so the two stages always show the same picture.
                    <div
                      className="absolute inset-0"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: zoomOrigin ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : "50% 50%",
                      }}
                    >
                      <img
                        src={_landscapeBg}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: `translateY(${_landscapeOffsetY}%) scale(${_landscapeZoom * viewportBgZoomBoost})` }}
                      />
                      <div className="absolute inset-0 bg-black/30" aria-hidden />
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="relative translate-y-8"
                          style={{ aspectRatio: "8192/5504", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}
                        >
                          <img
                            src={_dwellingImg}
                            alt="Dwelling"
                            className="w-full h-full object-contain pointer-events-none"
                            style={{ opacity: showShorterOverlay ? 0 : 1 }}
                          />
                          <img
                            src={withGrowDwelling}
                            alt="Dwelling with the growing-plants bay"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: _showZoneOverlay && !showShorterOverlay ? 1 : 0 }}
                          />
                          {/* Full replacement, not an addition — the base/grow
                              layers above are hidden while this is showing (see their
                              opacity toggles) so none of the taller roofline shows
                              through the transparent area above this shorter one. */}
                          <img
                            src={_shorterDwellingImg}
                            alt="Shortened dwelling"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                            style={{ opacity: showShorterOverlay ? 1 : 0 }}
                          />
                          {/* Whichever zone was last peeked open in the design stage's
                              viewport carries through as the starting point here too,
                              instead of the cutaway just vanishing. Full-bleed overlay,
                              not a positioned patch — see the CUTAWAY_IMAGES comment. */}
                          {Object.entries(CUTAWAY_IMAGES).map(([id, img]) => (
                            <img
                              key={id}
                              src={img}
                              alt={`${HOTSPOT_LABELS[id] ?? id} detail`}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              style={{ opacity: activeCutaway === id ? 1 : 0 }}
                            />
                          ))}
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
                      animate={{ opacity: 1, scale: zoom, x: pan.x, y: pan.y }}
                      exit={{ opacity: 0, scale: 1.04 }}
                      transition={{
                        opacity: { duration: 0.5, ease: "easeOut" },
                        scale: { type: "spring", stiffness: 220, damping: 26 },
                        x: { type: "tween", duration: 0 },
                        y: { type: "tween", duration: 0 },
                      }}
                    >
                      {/* Architect-blueprint backdrop — a faint near-black navy
                          tint over the glass panel with a fine 24px grid plus a
                          stronger line every 120px. Oversized (-100% inset) so
                          zooming out/panning never reveals its edges. Same as
                          the Couple Standard plan in Configurator.tsx. */}
                      <div
                        aria-hidden
                        className="absolute -inset-full"
                        style={{
                          backgroundColor: "rgba(6,12,21,0.15)",
                          backgroundImage: [
                            "linear-gradient(rgba(150,190,235,0.22) 1px, transparent 1px)",
                            "linear-gradient(90deg, rgba(150,190,235,0.22) 1px, transparent 1px)",
                            "linear-gradient(rgba(150,190,235,0.08) 1px, transparent 1px)",
                            "linear-gradient(90deg, rgba(150,190,235,0.08) 1px, transparent 1px)",
                          ].join(", "),
                          backgroundSize: "120px 120px, 120px 120px, 24px 24px, 24px 24px",
                          backgroundPosition: "center center",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Box locked to the plan image's own aspect ratio so the
                            zone labels' %-x lines up with the drawing itself.
                            This plan is near-square, so it's sized by height
                            (leaving room above/below for the labels) rather
                            than by width like the long Couple/Spacious plans. */}
                        <div
                          className="relative"
                          style={{ aspectRatio: "2184/1624", height: "70%" }}
                        >
                          <img
                            src={topViewImg}
                            alt="Dwelling plan view"
                            className="absolute inset-0 w-full h-full object-contain"
                          />
                          {PLAN_ZONE_LABELS.map((z, i) => {
                            const above = i % 2 === 0;
                            return (
                              <div
                                key={z.id}
                                className={`absolute flex items-center pointer-events-none ${above ? "flex-col-reverse bottom-full mb-1" : "flex-col top-full mt-1"}`}
                                style={{ left: `${z.x}%`, transform: "translateX(-50%)" }}
                              >
                                <span className="w-px h-3 bg-white/50" />
                                {/* Same glass pill + type as the Show Zones hotspot labels. */}
                                <span className="liquid-glass-strong rounded-xl px-3.5 py-2.5 whitespace-nowrap font-body text-[11px] uppercase tracking-[0.14em] text-white/90">
                                  {HOTSPOT_LABELS[z.id]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    /* Zoomable scene — landscape + dwelling + hotspots scale together */
                    <motion.div
                      key="scene-3d"
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, scale: zoom, x: pan.x, y: pan.y }}
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
                        x: { type: "tween", duration: 0 },
                        y: { type: "tween", duration: 0 },
                      }}
                    >
                      {/* Landscape backdrop, matching the reference — sits behind everything else in this viewport */}
                      <img
                        src={_landscapeBg}
                        alt=""
                        aria-hidden
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ transform: `translateY(${_landscapeOffsetY}%) scale(${_landscapeZoom})` }}
                      />
                      <div className="absolute inset-0 bg-black/30" aria-hidden />

                      {/* Dwelling structure, composited over the landscape — aspect-locked
                          wrapper so the hotspot %-coordinates line up with the actual
                          image regardless of how it's letterboxed inside the viewport */}
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className="relative translate-y-8"
                          style={{ aspectRatio: "8192/5504", maxHeight: "100%", maxWidth: "100%", minWidth: 0, minHeight: 0 }}
                        >
                          <img
                            src={_dwellingImg}
                            alt="Dwelling"
                            className="w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: showShorterOverlay ? 0 : 1 }}
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
                            style={{ opacity: _showZoneOverlay && !showShorterOverlay ? 1 : 0 }}
                          />
                          {/* Chat-triggered "make the dwelling shorter" overlay — full
                              replacement, so the layers above are hidden while this is
                              on (their opacity toggles above) instead of the taller
                              roofline showing through this render's transparent area. */}
                          <img
                            src={_shorterDwellingImg}
                            alt="Shortened dwelling"
                            className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                            style={{ opacity: showShorterOverlay ? 1 : 0 }}
                          />
                          {/* Bedroom/bathroom peeks — full-bleed, same canvas as the
                              exterior shots with their own alpha transparency, so no
                              positioning math is needed (see CUTAWAY_IMAGES comment). */}
                          {Object.entries(CUTAWAY_IMAGES).map(([id, img]) => (
                            <img
                              key={id}
                              src={img}
                              alt={`${HOTSPOT_LABELS[id] ?? id} detail`}
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-500"
                              style={{ opacity: activeCutaway === id ? 1 : 0 }}
                            />
                          ))}
                          {/* Chat-triggered "add more windows" overlay — same crossfade
                              mechanism as the hotspot cutaways above. */}
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
                              one by one instead of just appearing. */}
                          {dotsRevealed && renderHotspots(DWELLING_HOTSPOTS, true)}

                          {/* Second way into the panorama tour — clicking Bathroom's own dot
                              reveals a ground-level Entrance dot too, near the base of the
                              dwelling, so there's an obvious path straight to the
                              hallway/entrance scene without having to go through Bathroom's
                              own "Explore more" and its in-panorama door marker first. */}
                          {dotsRevealed && exploreUnlocked && activeCutaway === "bathroom" && renderHotspots(ENTRANCE_GROUND_HOTSPOT, true)}

                          {/* Drop target hint — persistently glows the spot on the dwelling
                              where Kitchen actually attaches, once the Layout Zones panel is
                              actually open and before it's been dropped (not just while its
                              tile is mid-drag, and not before the panel with that tile in it
                              has even been opened) — so the target is discoverable without
                              pointing at a spot for a tile the visitor hasn't seen yet (the
                              drop itself still works anywhere in the viewport — this is
                              purely a visual aim). Positioned at the midpoint between the
                              Bedroom (47.0%) and Bathroom (62.6%) hotspots, on the same
                              roofline band (23.9%) — kitchen becomes the third zone, between
                              the other two. */}
                          <AnimatePresence>
                            {showLayoutZones && !zoneAdded && (
                              <motion.div
                                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
                                style={{ left: "54.8%", top: "23.9%" }}
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
                              to Bedroom's known (47.0, 23.9) position and "taps" it on a loop —
                              showing the mechanic instead of just describing it. Gated behind
                              dotsRevealed too, same as the hotspots themselves — otherwise
                              it'd demo tapping a dot that isn't on screen yet. */}
                          {showHotspotHint && dotsRevealed && (
                            <div className="absolute inset-0 z-20 pointer-events-none">
                              <motion.div
                                className="absolute -translate-x-1/2 -translate-y-1/2"
                                style={{ left: 0, top: 0 }}
                                animate={{
                                  left: ["16%", "16%", "47.0%", "47.0%", "47.0%"],
                                  top: ["16%", "16%", "23.9%", "23.9%", "23.9%"],
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

                {/* Confirmation toast for dropping Kitchen — no pin left behind
                    for it (see handleZoneDragDrop), just this brief message. */}
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
                      Zones: {(zoneAdded ? 1 : 0) + Object.keys(zonePins).length} active
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

                {/* Brief "rendering" spinner while the shorter swap is in flight —
                    sits on the outer viewport box (not the smaller aspect-locked
                    dwelling wrapper inside it), so it covers the whole rounded
                    viewport window edge-to-edge instead of floating as an
                    undersized rectangle with the dwelling peeking out around it. */}
                <AnimatePresence>
                  {shorterLoading && (
                    <motion.div
                      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Loader2 className="h-8 w-8 text-white/85 animate-spin" strokeWidth={1.5} />
                      <p className="font-body text-white/80 text-[11px] uppercase tracking-[0.18em]">
                        Shortening dwelling...
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
                  <Stat icon={Square} label="Total area" value={String(_totalArea)} unit="m²" />
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
                  {stage === "customise" && addOnsEngaged && (
                    <motion.div
                      key="customise"
                      initial={{ opacity: 0, x: rightColDirection < 0 ? -40 : 380 }}
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
                      className="w-[520px] shrink-0 h-full"
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

            {/* AI ASSIST — CHAT. Glow lives on this outer wrapper, not the
                liquid-glass card inside it — box-shadow gets clipped flat by
                the card's own overflow:hidden (needed for its rounded-corner
                clipping) when applied directly to it, so it sits one level
                up on a plain, non-clipping box instead — same pattern as the
                Site Selector wrapper above. The design/hidden toggle sits
                here too, so an off-stage chat still collapses to zero size
                instead of holding its grid cell open with hidden content.
                Delayed (chatGlowReady) and held open until an actual message
                is sent — see chatGlowReady's declaration for why. */}
            <div className={`${stage === "design" ? "flex flex-col" : "hidden"} rounded-[1.5rem] ${chatGlowReady && !messages.some((m) => m.role === "user") ? "panel-glow-pulse" : ""}`}>
            {/* The invisible tabs-row spacer lives INSIDE the same visual card
                as the rest of the chat, instead of as a separate sibling
                above it — so the card itself (and the glow wrapping it)
                starts flush at the top, level with Your Summary and the
                viewport's 2D/3D buttons, rather than floating below a gap
                with nothing glowing over it. It's placed AFTER the actual
                chat content (see below), not before it — before it, it was
                pushing the "Engine Assistant" header down below where Your
                Summary/2D-3D sit, the same misalignment one level in. Its
                own height still mirrors the viewport's "Section tabs" row
                exactly (same classes as one of its real pill buttons), which
                is what keeps this card's total height — and so its bottom
                edge — matching the viewport panel's, same as before. */}
            <motion.div
              initial={blurInit}
              animate={blurIn}
              transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
              className="liquid-glass rounded-[1.5rem] shadow-lg shadow-black/20 overflow-hidden flex flex-col min-h-0"
            >
              <aside className="flex flex-col min-h-0 shrink-0 p-6" style={{ height: "58vh" }}>
              <div className="flex items-center gap-3 shrink-0 pb-4 border-b border-white/10">
                <span className="relative inline-flex w-9 h-9 rounded-full bg-white/10 border border-white/15 items-center justify-center overflow-hidden">
                  <img src={assistantAvatar} alt="Engine Assistant" width={36} height={36} loading="lazy" className="w-full h-full object-contain" />
                </span>
                <div className="flex flex-col leading-tight">
                  <h3 className="text-sm font-body font-medium text-white">Engine Assistant</h3>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-body inline-flex items-center gap-1.5">
                    {!exploreSeen ? (
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
                className="chat-scrollbar mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-5 text-sm font-body"
              >
                {!exploreSeen && (
                  <div className="h-full flex flex-col items-center justify-center gap-4 text-center text-white/60">
                    <Lock className="h-8 w-8" strokeWidth={1.5} />
                    <p className="text-lg leading-snug font-body max-w-[300px]">
                      Complete the steps on the left — through Step Inside, then back out — to wake up the Engine Assistant.
                    </p>
                  </div>
                )}

                {exploreSeen && introPhase === "typing" && messages.length === 0 && (
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

                {shorterConfirmPending && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleShorterChoice(true)}
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
                      onClick={() => handleShorterChoice(false)}
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
                    !exploreSeen
                      ? "Locked — complete the steps on the left first"
                      : activeSection !== "dining" && activeSection !== "dwelling"
                      ? `Chat only available for dining`
                      : "Message Engine Assistant…"
                  }
                  disabled={!exploreSeen || isStreaming || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 outline-none font-body disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={!exploreSeen || isStreaming || !input.trim() || (activeSection !== "dining" && activeSection !== "dwelling")}
                  className="bg-white text-black rounded-full w-9 h-9 inline-flex items-center justify-center disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" strokeWidth={2} />
                </button>
              </form>
              </aside>
              {/* mt-3 here reproduces the real tabs row's mb-3 — without it
                  this spacer was ~12px short of the real row's footprint
                  (pill height + the margin before the viewport starts),
                  so the chat card's bottom sat that much above the
                  viewport's actual bottom edge. */}
              <div aria-hidden className="invisible shrink-0 flex items-center justify-between px-6 mt-3">
                <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-body uppercase tracking-[0.12em]">
                  dwelling
                </span>
              </div>
            </motion.div>
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
              className="relative w-full max-w-md max-h-[70vh] min-h-0"
            >
              <button
                type="button"
                onClick={() => r.setStage("summary")}
                aria-label="Back to plans"
                className="absolute -top-3 -right-3 z-10 liquid-glass rounded-full w-9 h-9 inline-flex items-center justify-center text-white/80 hover:text-white"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <PaymentPanel totals={pricedTotals} onSubmit={r.submitPayment} selectedPlan={selectedPlan} inline />
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
            total={pricedTotals.total}
            dwellingImage={showShorterOverlay ? _shorterDwellingImg : _dwellingImg}
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
