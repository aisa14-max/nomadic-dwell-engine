# Move Legend + Emergent Camps to bottom of /tribe

## Goal
Currently the **Legend** floats on the right edge and the **Emergent Camp** card pops up next to the clicked camp on the map. Move both into a unified, fixed strip pinned to the bottom of the viewport.

## Changes (single file: `src/pages/Tribe.tsx`)

1. **Legend panel** (currently `motion.aside` anchored `right-6 top-1/2`)
   - Move into a new bottom bar container.
   - Convert from vertical stack to a horizontal row of intention chips (color dot + label) so it fits a bottom strip.
   - Keep the "Lines / Clouds" caption as a small line of text inside the same strip.

2. **Emergent Camp card** (currently absolute-positioned near the clicked camp)
   - Move into the same bottom bar, on the opposite side from the legend.
   - Keep all info: camp name, theme, member count, member tag list.
   - Animate in/out from the bottom (`y: 20 → 0`) instead of map-anchored position.
   - Clicking a camp still selects it; closing handled by clicking elsewhere as today.

3. **Bottom bar container**
   - Fixed to bottom of viewport, full width, centered max-width, `liquid-glass` background, rounded top corners.
   - Layout: legend on the left, camp card (or empty hint state) on the right.
   - Sits above the existing "exploration hint" text — move that small hint to the top-center or hide it once the bar is visible to avoid stacking.
   - Visible from `layer >= 1` (legend) and `layer >= 3` (camps), matching current reveal rules.

4. **Cleanup**
   - Remove the old right-side `motion.aside` and the map-anchored camp `motion.div`.
   - Keep selected-person card behavior unchanged (still floats next to the clicked node).

## Visual reference

```text
┌──────────────────────────── /tribe ────────────────────────────┐
│                                                                │
│                       [ animated world ]                       │
│                                                                │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ ● create  ● travel  ● work  ● rest  ● explore  │  Camp:    │ │
│ │ lines = shared intent · clouds = camps         │  Salt&Page│ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Out of scope
- No data, animation engine, or canvas logic changes.
- No new components or routes.
