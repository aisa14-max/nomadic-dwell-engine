## Goal

Replace the current two‑vanishing‑point converging grid in `IsometricTerrainScene` with a **true isometric lattice** of parallel lines at ±30° from horizontal, matching the standard isometric x/y axes of the dwelling.

## Changes

**File:** `src/components/IsometricTerrainScene.tsx` — only the `drawIsoGround` function.

1. Remove the `-12°` shear (`ctx.rotate`) and the `vpA` / `vpB` converging logic.
2. Draw two families of **parallel** lines covering the ground band (from `horizonY = 0.6 * h` to `h`, extended horizontally beyond canvas edges so rotated lines still fill the frame):
   - **Family A** at **+30°** from horizontal (rising left→right) — the "receding x‑axis".
   - **Family B** at **−30°** from horizontal (falling left→right) — the "receding y‑axis".
3. For each family, generate ~28 evenly spaced lines. Spacing measured perpendicular to the line direction so the diamonds look uniform. Each line is drawn long enough to span the full ground band after rotation.
4. Alpha falloff: fade lines toward the horizon (top of band) and toward the left/right edges, so focus stays under the dwelling. Use `rgba(255,255,255, 0.06–0.14)` and `lineWidth = 0.5`.
5. Clip the grid drawing to the ground band (`ctx.rect(0, horizonY, w, h - horizonY); ctx.clip()`) so lines don't bleed into the sky.
6. Keep the existing **fade overlay**, **side vignette**, **horizon haze**, **ridge silhouettes**, and **under‑glow** exactly as they are — they already work and are not the subject of this request.

## Technical notes

- Standard isometric projection uses 30° axes (tan 30° ≈ 0.577). To draw a line at angle `θ` passing through point `(x0, y0)`, extend by a large length `L` in both directions:
  ```text
  x1 = x0 - L*cos(θ),  y1 = y0 - L*sin(θ)
  x2 = x0 + L*cos(θ),  y2 = y0 + L*sin(θ)
  ```
- To space parallel lines evenly perpendicular to direction `θ`, step the anchor point along the perpendicular `(−sin θ, cos θ)` by a constant `step` (e.g. `step = h * 0.06`).
- Anchor range: start from a point well left/above the ground band and sweep until past the right/bottom, so the family covers the whole clipped region regardless of rotation.

## Out of scope

- No changes to `Dwelling.tsx`, `ReservationCustomizer.tsx`, ridge silhouettes, glow, or sky layers.
- No new dependencies; canvas 2D only.
