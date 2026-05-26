## Plan

Keep the currently shown part PNG (e.g. Exterior) visible after clicking **Reserve**, sliding along with the main viewport as the summary/payment panels open.

### Change

In `src/components/worlds/ReservationCustomizer.tsx`:

- Currently `<PartImageOverlay activePart={shownPart} />` is rendered only when `r.stage === "configure"`. Remove that stage gate so it also renders during `summary` and `payment`.
- The overlay lives inside the main viewport `<motion.div>` that already animates `x: -rightInset / 2`, so it will automatically slide left as the right panels open — no extra animation work needed.
- Hide it on `confirmed` (full-screen overlay takes over).
- Do not reset `shownPart` when leaving `configure`; update the existing `useEffect` so it only clears on `confirmed` (or stays as-is and we simply guard rendering on stage !== "confirmed").

### Notes
- No changes to selection logic, hotspots, panels, totals, or the default landing PNG behavior.
- Default landing PNG continues to show until a material is chosen; whatever PNG is currently visible at Reserve time stays visible through summary/payment.
