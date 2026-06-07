## Goal
Make the terrain grid lines align with the isometric projection of the dwelling (which recedes from front-right toward back-left at roughly -12°), so the ground feels like one continuous iso plane under the structure instead of a centered one-point perspective.

## Change — `src/components/IsometricTerrainScene.tsx`

Replace the current centered grid (horizon lines + radial lines to center vanishing point) with a true **two-axis isometric grid** matching the dwelling's axes:

1. **Two vanishing directions, not one center point**
   - Axis A (depth, matching dwelling's receding axis): vanishing point off-screen to the **upper-left**, ~`(w * -0.1, h * 0.5)`.
   - Axis B (cross-depth): vanishing point off-screen to the **upper-right**, ~`(w * 1.1, h * 0.5)`.
   - This produces the classic iso "diamond" ground grid instead of a one-point perspective.

2. **Grid construction**
   - Horizon line at ~`y = 0.6 * h`.
   - Draw ~18 lines along axis A spaced evenly along the bottom edge, each line going from its bottom-edge point toward vanishing point A.
   - Draw ~18 lines along axis B similarly toward vanishing point B.
   - Lines clipped above the horizon.
   - Stroke `rgba(255,255,255,0.06–0.10)`, thinner toward horizon (alpha falloff by distance from bottom).

3. **Subtle skew to match dwelling tilt**
   - Apply `ctx.transform` with a slight shear so the grid axes match the dwelling's `-12°` ground rotation (the same rotation used on the platform shadow in `Dwelling.tsx`).

4. **Keep existing layers**
   - Ridge silhouettes, horizon haze, warm under-glow, side vignette, and ground fade overlay all unchanged.
   - Only the grid line block (`drawIsoGround` line-drawing portion) is rewritten.

## Technical notes
- All within one component, canvas 2D, no new deps.
- Vanishing points placed off-canvas guarantees lines stay roughly parallel-looking on screen (true iso feel) rather than dramatically converging.
- Bottom-edge spacing stays uniform; perceived convergence comes from the off-screen VPs.

No other files change.
