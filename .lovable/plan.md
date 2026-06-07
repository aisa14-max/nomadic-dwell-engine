## Goal
When users click **Continue configuration**, the customizer currently shows only a dark sky behind the isometric dwelling. Add a subtle terrain layer so the scene reads as ground + horizon + sky, matching the isometric perspective of the dwelling render.

## Scope
- File: `src/components/worlds/ReservationCustomizer.tsx` (background layers only)
- New file: `src/components/IsometricTerrainScene.tsx` (canvas-based terrain, similar style to `VoyageScene` / `NightSkyScene`)
- No changes to dwelling render, hotspots, picker, summary, payment, or data.

## Visual approach

```text
 ┌────────────────────────────────────────┐
 │  night sky (stars) — top 55%           │
 │  ······ ·  ·   ·   ··  ·               │
 │ ─ ─ ─ ─ ─ horizon haze ─ ─ ─ ─ ─ ─ ─    │
 │   distant ridge silhouette (faint)     │
 │  ▁▂▃▂▁▂▃▄▃▂▁▂▃▄▅▄▃▂▁                  │
 │   isometric ground plane (grid fades)  │
 │    ╱╲╱╲╱╲╱╲╱╲╱╲╱╲                      │
 │  warm amber glow under dwelling        │
 └────────────────────────────────────────┘
```

1. Keep existing `NightSkyScene` and base gradient — they handle the upper sky.
2. Add a new `IsometricTerrainScene` layered above the sky but below the dwelling:
   - Faint distant mountain ridge silhouette around 55–60% viewport height (one slow-drifting ridge, low alpha, similar to `VoyageScene` ridge generator).
   - Isometric ground plane: a perspective grid drawn from a vanishing horizon, lines fading outward, tilted ~30°, matching the dwelling's isometric angle. Lines use `rgba(255,255,255,0.05–0.1)`.
   - Soft radial warm-amber glow centered under the dwelling area to ground it (reuses the existing amber glow tone already in the file).
3. Slight vignette at edges so the terrain blends into the page chrome.

All drawing uses HTML canvas with `requestAnimationFrame` and `dpr` scaling, matching `VoyageScene` patterns. No external libs.

## Integration
In `ReservationCustomizer.tsx`, inside the background block:

```text
<bg gradient />
<NightSkyScene />                  ← unchanged (stars)
<IsometricTerrainScene />          ← NEW (ridge + iso ground + amber glow)
<existing amber radial overlay />  ← keep, slightly reduced opacity
```

Z-order remains behind the dwelling viewport.

## Acceptance
- Background no longer looks like flat sky — clear horizon line, faint mountains, and an isometric ground plane visible behind the dwelling.
- Performance stays smooth (single canvas, low line count).
- Dark, futuristic feel preserved — no bright colors, no obvious texture seams.
