## Goal

Animate the grid background on `/configurator` with a continuous slow drift plus subtle mouse-driven 3D tilt, so the grid feels alive and spatial behind the engine model.

## Where it lives

The background is rendered by `src/components/ClaimSpotScene.tsx`, mounted via `ClaimSpotScene className="fixed inset-0 ..."` in `src/pages/Configurator.tsx` (line 162). It currently shows a static `claim-night.jpg` (the perspective grid you see) plus a starfield canvas and fog layer.

## Approach

Add a dedicated animated SVG grid layer on top of the static image inside `ClaimSpotScene`, then drive two motion sources:

1. **Continuous drift** — the grid pattern slowly pans diagonally (≈40s loop) using a CSS keyframe on `background-position`. Gives constant ambient motion.
2. **Mouse tilt** — listen to `pointermove` on `window`; map cursor to a normalized `-1..1` range and apply a smoothed `rotateX` / `rotateY` (max ±6°) plus a tiny `translate` to the grid layer. `perspective: 1200px` on the parent gives real depth. Smooth with `requestAnimationFrame` + lerp so it never jitters.

The existing starfield canvas and the static night image stay — the new layer sits between them, at low opacity, so the look is enhanced, not replaced.

## Files to change

- `src/components/ClaimSpotScene.tsx`
  - Add a `gridRef` div with an SVG dot/line grid as `background-image` and a slow drift keyframe.
  - Add a `useEffect` that attaches `pointermove`, runs a rAF lerp loop, and writes `transform: perspective(1200px) rotateX() rotateY() translate3d()` to `gridRef`.
  - Wrap the new layer in a `perspective` container with `transform-style: preserve-3d`.
  - Respect `prefers-reduced-motion` — skip the tilt loop and disable the drift keyframe.

- `src/index.css`
  - Add a `@keyframes grid-drift` (translate background-position from `0 0` to `80px 80px`) and a `.grid-drift` utility class with `animation: grid-drift 40s linear infinite`.

## Tuning defaults

- Grid: 48px cell, 1px lines at `rgba(255,255,255,0.06)` with a stronger dot at intersections at `rgba(255,255,255,0.12)`.
- Tilt max: 6° on X, 8° on Y. Lerp factor 0.06.
- Drift speed: 40s per loop, linear.
- Opacity of new layer: 0.6, blend `screen` so it brightens the existing grid rather than overpowering it.

## Out of scope

No changes to the loader, engine reveal, chat, or any other Configurator behavior.