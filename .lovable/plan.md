# Redesign map pin popup on Voyages

Replace the default white Mapbox popup with a dark, branded card that matches the rest of the Voyages UI.

## Scope

Only `src/components/RegionGlobe.tsx` and a small CSS addition (either inline `<style>` injection alongside the existing `rg-pulse` keyframes, or `src/index.css`). No data, routing, or filter changes.

## Visual spec

- Container: `#111114` background, 0.5px solid `rgba(255,255,255,0.12)` border, 12px radius, subtle shadow, ~260px wide.
- Layout: horizontal flex.
  - Left: 40×40 rounded thumbnail (use `site.image` from `SITES`).
  - Right column:
    - Site name — italic, white, ~14px (matches `font-heading` italic vibe).
    - Region — 11px, `rgba(255,255,255,0.55)`.
- Below the row: a single line of climate chips (temperature, rainfall, cost, internet, safety) — same icons/values as the sidebar, slightly smaller (`10px`), in pill style `bg-white/8 text-white/80`.
- Footer right: "View site →" — 11px, white, underlined on hover; clicking it triggers the same action as selecting the site (fly to / focus). For now it just closes/keeps popup — no new routing.
- Mapbox tip (the little arrow): recolored to `#111114`.
- Fade in: 200ms ease — applied via CSS on `.mapboxgl-popup-content` opacity transition (popup mounts with `opacity:0` then `1` on next frame).

## Implementation notes

1. Extend the `focusPoint` effect in `RegionGlobe.tsx`:
   - Accept a richer `focusSite` prop from `Discover.tsx`: `{ coords, title, region, image, chips: [{icon, value, tone}] }` (or pass the full `Site` object — simpler).
   - Update `RegionGlobeProps` and the call site in `Discover.tsx` (`handleShowOnMap` already has the site — pass the whole `s`).
2. Build popup HTML as a string with inline styles (Mapbox popups take HTML). Use Lucide-equivalent inline SVGs for the 5 chip icons, or simple unicode/letters — inline SVG paths copied from lucide is cleanest.
3. Override Mapbox popup chrome via a one-time injected `<style>` block (next to existing `rg-pulse-style`):

```css
.mapboxgl-popup.rg-popup .mapboxgl-popup-content {
  background: #111114;
  border: 0.5px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  color: #fff;
  opacity: 0;
  transition: opacity 200ms ease;
}
.mapboxgl-popup.rg-popup.rg-popup-visible .mapboxgl-popup-content { opacity: 1; }
.mapboxgl-popup.rg-popup .mapboxgl-popup-tip { border-top-color: #111114; border-bottom-color: #111114; }
.mapboxgl-popup.rg-popup .mapboxgl-popup-close-button { color: rgba(255,255,255,0.6); }
```

4. Add the `rg-popup` className via `new mapboxgl.Popup({ className: "rg-popup", offset: 18, closeButton: false })`. After `marker.togglePopup()`, `requestAnimationFrame(() => popup.addClassName("rg-popup-visible"))` to trigger the fade.
5. "View site →" anchor: add `data-action="view"` and attach a delegated click listener on the popup's DOM element that calls a passed-in callback (e.g. `onViewSite?: (title) => void`). For now wire it to a no-op or to re-focus — Discover doesn't currently have a per-site detail route.

## Out of scope

- New routes or detail pages.
- Changes to the sidebar card layout.
- Changes to the globe styling itself.
