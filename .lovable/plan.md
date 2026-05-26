## Goal

When a bottom tab is active in the Reservation Customizer, display that tab's PNG (Ribs/Terraribs/Solid Walls/Interior/Membrane/Additions/Exterior) floating in the main viewport behind the sliding options panel and other UI. Keep the existing slide-up options panel behavior exactly as-is.

## Behavior

- No tab active → no PNG shown (current view unchanged).
- Tab active → corresponding PNG fades in, centered in the main viewport, behind the picker panel, reserve card, and parts strip but above the starry sky.
- Switching tabs → PNG cross-fades to the new tab's image.
- PNG does not depend on which option (Cold Steel / Bronze / etc.) is selected — one image per tab.
- PNG is purely decorative: `pointer-events-none`, no click handling, doesn't interfere with hotspots or backdrop click-to-close.
- The existing `Dwelling` 3D-ish SVG and hotspots stay where they are; the PNG sits on top of the sky background but we'll layer it so it visually blends (slight opacity, soft drop shadow, mix-blend if needed) — PNGs have white backgrounds so we'll use `mix-blend-mode: screen` or `lighten` plus reduced opacity to blend into the dark sky.

## Files

1. **Copy 7 uploaded PNGs** into `src/assets/parts/`:
   - `Ribs.png`, `Terraribs.png`, `Solid_Walls.png`, `Interior.png`, `Membrane.png`, `Additions.png`, `Exterior.png`

2. **`src/data/dwellingParts.ts`** — add an `image` import per part (mapping partId → imported asset URL). Keeps the source of truth in one place.

3. **New `src/components/worlds/PartImageOverlay.tsx`** — small component that takes `activePart` and renders the corresponding image with an AnimatePresence cross-fade (200–300ms). White-background PNGs blended with `mixBlendMode: "screen"` + ~85% opacity + subtle drop shadow so they sit naturally on the night sky.

4. **`src/components/worlds/ReservationCustomizer.tsx`** — render `<PartImageOverlay activePart={r.activePart} />` inside the main viewport wrapper, positioned absolutely to fill the `aspect-[8/5]` container, with `z-index` below the parts strip / picker / reserve card but above the sky background. Existing `Dwelling`, hotspots, picker panel, reserve card all untouched.

## Notes

- No changes to options, prices, totals, hotspots, or reservation flow.
- Image stays visible the whole time the tab is active, including while the user picks an option from the slide-up panel.
- When the picker closes (backdrop click or stage change), `activePart` becomes null and the image fades out.
