import { useEffect } from "react";

// The desktop tiling (Configurator*/Under the Hood/etc.) is built entirely
// on Tailwind's lg: breakpoint (min-width: 1024px) — stacks below that,
// tiles above it. Rather than rewrite every page's layout for a separate
// mobile-landscape variant, this makes mobile browsers in landscape THINK
// they're on a desktop-width screen: swapping the viewport meta tag's width
// from "device-width" to a fixed 1400px (matching the app's own
// max-w-[1400px] containers) makes every existing lg: class activate
// untouched, and the mobile browser then auto-zooms the whole rendered page
// out to fit the real physical screen — same tiling, just smaller, with
// zero per-page layout changes. Reverts back to device-width on portrait,
// or on anything already wide enough to be a real desktop viewport.
const NORMAL_CONTENT = "width=device-width, initial-scale=1.0";
const DESKTOP_CONTENT = "width=1400";

// A desktop browser resized narrow+short is already >= lg width most of the
// time, so width/height alone mostly disambiguate it from a phone/tablet in
// landscape — the touch-capability check is the actual guard against that
// edge case, not this height number.
const LANDSCAPE_HEIGHT_CEILING = 600;

function isMobileLandscape(): boolean {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) return false;
  const { innerWidth: w, innerHeight: h } = window;
  return w < 1024 && w > h && h < LANDSCAPE_HEIGHT_CEILING;
}

/** Mounted once, globally — see the top comment for what this actually does.
 *  Renders nothing; it only ever touches the <meta name="viewport"> tag. */
export default function MobileLandscapeViewport() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return;

    const apply = () => {
      meta.setAttribute("content", isMobileLandscape() ? DESKTOP_CONTENT : NORMAL_CONTENT);
    };

    apply();
    window.addEventListener("resize", apply);
    // orientationchange fires slightly before window dimensions actually
    // update on some mobile browsers — the short delay re-measures after
    // the rotation has actually settled instead of racing it.
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
