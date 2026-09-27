import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// The desktop tiling (Configurator*/Under the Hood/Tribe/etc.) is built
// entirely on Tailwind's lg: breakpoint (min-width: 1024px) — stacks below
// that, tiles above it. Rather than rewrite every page's layout for a
// separate mobile variant, this makes mobile browsers THINK they're on a
// desktop-width screen: swapping the viewport meta tag's width from
// "device-width" to a fixed 1400px (matching the app's own max-w-[1400px]
// containers) makes every existing lg: class activate untouched, and the
// mobile browser then auto-zooms the whole rendered page out to fit the
// real physical screen — same tiling, just smaller, with zero per-page
// layout changes. Landscape only — stretching the same desktop tiling to
// fit a portrait-width phone made everything look stretched/oversized, so
// portrait deliberately stays on the normal responsive mobile layout.
//
// The INITIAL page load is handled by a plain inline <script> in
// index.html instead of here — it runs before any CSS/React, so the page
// never actually paints in the wrong layout to begin with (a React effect,
// even useLayoutEffect, still runs after the browser has already committed
// to a first layout pass based on the original static tag). This component
// takes over from there for everything that happens AFTER first load —
// syncing on mount (safe no-op if the inline script already got it right),
// and reacting to live resize/rotation. Threshold (700) and target width
// (1400) must stay identical to index.html's copy of this same check.
const NORMAL_CONTENT = "width=device-width, initial-scale=1.0";
const DESKTOP_CONTENT = "width=1400";
const PHYSICAL_SHORT_SIDE_CEILING = 700;

function isMobileDevice(): boolean {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return false;
  // matchMedia reads the actual device orientation, not the page's current
  // CSS viewport — unaffected by whatever this component last set the meta
  // tag to, unlike window.innerWidth/innerHeight (see below).
  if (!window.matchMedia("(orientation: landscape)").matches) return false;
  // screen.width/height reflect the PHYSICAL display and are unaffected by
  // our own viewport-meta override, unlike window.innerWidth/innerHeight —
  // those report relative to whatever the CURRENT declared viewport is, so
  // checking them here would go stale the moment this component first
  // switches the tag.
  const shortSide = Math.min(window.screen.width, window.screen.height);
  return shortSide < PHYSICAL_SHORT_SIDE_CEILING;
}

/** Removes and re-inserts the meta tag after changing it — on iOS Safari
 *  (and some Android WebViews) a JS-driven viewport-meta change doesn't
 *  always trigger an immediate re-layout; the page keeps the OLD viewport
 *  until something else (e.g. a scroll) forces a reflow. Re-inserting the
 *  element forces the browser to re-parse it right away instead. */
function forceReflow(meta: Element) {
  const parent = meta.parentNode;
  if (!parent) return;
  parent.removeChild(meta);
  parent.appendChild(meta);
}

// A live rotation is where the browser visibly struggles to re-flow
// instantly — the device is physically rotating, the viewport meta is
// changing, Tailwind's media queries are re-evaluating, all at slightly
// different times depending on the browser. Rather than fight to make that
// transition instant and seamless (which is exactly what kept glitching),
// this covers the screen the moment ANY change starts, lets everything
// settle underneath while nobody's looking, then reveals it — turning "the
// tiling visibly breaks for a moment" into a brief, ordinary-looking
// loading transition. SETTLE_MS waits for the rotation/resize to actually
// finish before re-measuring and applying; HIDE_MS is extra breathing room
// after that for the new layout to actually paint before the cover lifts.
const SETTLE_MS = 200;
const HIDE_MS = 150;

/** Mounted once, globally — see the top comment for what this actually does.
 *  Renders only a full-screen cover during a live resize/rotation, nothing
 *  otherwise; the actual mechanism is entirely the <meta name="viewport">
 *  mutation in the effect below. */
export default function MobileTiledViewport() {
  const [covering, setCovering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const apply = () => {
      const next = isMobileDevice() ? DESKTOP_CONTENT : NORMAL_CONTENT;
      if (meta.getAttribute("content") === next) return;
      meta.setAttribute("content", next);
      forceReflow(meta);
    };
    // Sync on mount — the inline script in index.html should already have
    // this right, so this is normally a no-op; it's a safety net, not the
    // primary mechanism, so it deliberately does NOT show the cover (a
    // fresh page load has nothing stale underneath to hide).
    apply();

    const onChange = () => {
      setCovering(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        apply();
        timerRef.current = setTimeout(() => setCovering(false), HIDE_MS);
      }, SETTLE_MS);
    };

    window.addEventListener("resize", onChange);
    window.addEventListener("orientationchange", onChange);

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("orientationchange", onChange);
      if (timerRef.current) clearTimeout(timerRef.current);
      meta.setAttribute("content", NORMAL_CONTENT);
    };
  }, []);

  return (
    <AnimatePresence>
      {covering && (
        <motion.div
          key="rotation-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] bg-black"
          aria-hidden
        />
      )}
    </AnimatePresence>
  );
}
