import { useLayoutEffect } from "react";

// The desktop tiling (Configurator*/Under the Hood/Tribe/etc.) is built
// entirely on Tailwind's lg: breakpoint (min-width: 1024px) — stacks below
// that, tiles above it. Rather than rewrite every page's layout for a
// separate mobile variant, this makes mobile browsers THINK they're on a
// desktop-width screen: swapping the viewport meta tag's width from
// "device-width" to a fixed 1400px (matching the app's own max-w-[1400px]
// containers) makes every existing lg: class activate untouched, and the
// mobile browser then auto-zooms the whole rendered page out to fit the
// real physical screen — same tiling, just smaller, in both portrait and
// landscape, with zero per-page layout changes. Reverts back to
// device-width on anything already wide enough to be a real desktop
// viewport (a phone/tablet is the only thing this ever touches).
const NORMAL_CONTENT = "width=device-width, initial-scale=1.0";
const DESKTOP_CONTENT = "width=1400";

// Anything with a physical short side at or above this is treated as a real
// desktop/tablet-in-desktop-mode screen, not a phone — touch-capability
// (checked separately below) is what actually disambiguates a phone from a
// small desktop browser window at a similar width.
const PHYSICAL_SHORT_SIDE_CEILING = 700;

function isMobileDevice(): boolean {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return false;
  // screen.width/height reflect the PHYSICAL display and are unaffected by
  // our own viewport-meta override. window.innerWidth is not safe to use
  // here: once this component has already switched the meta tag to
  // width=1400, innerWidth starts reporting relative to that declared
  // 1400px layout instead of the real device width, so a plain
  // width/height check here would go stale the moment it first fires.
  // Locked to BOTH orientations now (not landscape-only) — deliberately no
  // orientation check here, matching-portrait was the whole point of the
  // last fix, not an oversight.
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

/** Mounted once, globally — see the top comment for what this actually does.
 *  Renders nothing; it only ever touches the <meta name="viewport"> tag.
 *  useLayoutEffect (not useEffect) so this runs before the browser paints
 *  the first frame, instead of after — cuts down the window where the page
 *  is briefly visible in the wrong (stacked) layout before switching. */
export default function MobileTiledViewport() {
  useLayoutEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const apply = () => {
      const next = isMobileDevice() ? DESKTOP_CONTENT : NORMAL_CONTENT;
      if (meta.getAttribute("content") === next) return;
      meta.setAttribute("content", next);
      forceReflow(meta);
    };

    apply();
    window.addEventListener("resize", apply);
    // orientationchange fires slightly before window dimensions actually
    // update on some mobile browsers — the short delay re-measures after
    // the rotation has actually settled instead of racing it. Kept even
    // though the tiling no longer depends on orientation, since rotating
    // still changes which dimension is "short" for the reflow trick above.
    const onOrientation = () => setTimeout(apply, 100);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", onOrientation);
      meta.setAttribute("content", NORMAL_CONTENT);
    };
  }, []);

  return null;
}
