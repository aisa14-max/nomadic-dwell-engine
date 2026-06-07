## Goal
Replace the sky + stars backdrop in the reservation customizer with terrain that fills the entire viewport.

## Changes

**`src/components/worlds/ReservationCustomizer.tsx`**
- Remove `<NightSkyScene />` and its import.
- Remove the warm radial-gradient overlay div (the amber glow at top).
- Keep `<IsometricTerrainScene />` as the sole backdrop layer.
- Keep the dark base `bg-gradient-to-b` div (or swap to a flat dark ground tone) so the canvas has a neutral base while it paints.

**`src/components/IsometricTerrainScene.tsx`**
- Extend the isometric lattice to cover the full canvas height instead of only the bottom 40% band.
  - Set `horizonY = 0` and `bandH = h` so the ±30° grid families fill top to bottom.
  - Increase `halfCount` (e.g. 28 → 48) so the denser area still reads as ground at the wider coverage.
  - Recenter `cy` to `h * 0.5`.
- Remove sky-specific elements:
  - Drop `drawHorizonHaze()` call (warm horizon band).
  - Drop the distant ridge silhouettes (`ridges` array + `drawRidge` calls) — they imply a horizon line that no longer exists.
- Adjust the fade overlay to be a full-canvas vignette instead of a horizon-anchored gradient:
  - Replace the linear `fade` gradient (horizonY→bottom) with a subtle radial darkening from center so the grid stays legible behind the dwelling but edges fall off.
- Keep `drawUnderGlow()` (warm pool under the dwelling) — it grounds the model visually.

## Out of scope
- Dwelling rendering, hotspots, parts strip, panels — untouched.
- No new assets, no new dependencies.
