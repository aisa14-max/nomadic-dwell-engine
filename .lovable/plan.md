## Changes to Worlds / Configurator

### 1. Remove "Save draft"
- In `src/pages/Configurator.tsx`, delete the "Save draft" button; keep only "Continue configuration".

### 2. Keep top Nav visible inside the customizer
- `ReservationCustomizer` currently renders as a `fixed inset-0 z-50` full-screen overlay that covers the global `Nav`.
- Change it to sit **below** the nav: drop `inset-0`, use `top-[var(--nav-h)] left-0 right-0 bottom-0` (or `top-20` matching current nav height) and lower z-index below the Nav's z-index.
- Add a small "// Worlds" label or breadcrumb inside the customizer's top-left (next to the X button) so the page identity is reinforced.
- Verify Nav stays on top across all stages (configure / summary / payment / confirmed).

### 3. Picker opens directly above the clicked part in the bottom strip
- Today the picker (`PickerColumn`) is positioned above the **hotspot on the dwelling** using `activePartCfg.hotspot.x/y`.
- New behavior: when a part button in `PartsStrip` is clicked, the picker pops up **directly above that button** in the strip, anchored to the button's horizontal center, with a small gap, and an arrow/tail pointing down to the button.
- Implementation:
  - Lift the picker render out of the dwelling area and into the `PartsStrip` container (or render it as a sibling positioned relative to the strip).
  - `PartsStrip` measures each button (refs + `getBoundingClientRect` or a CSS `relative` parent with `absolute` child using the button's index → `left: calc((i + .5) * (100% / n))`).
  - Use `AnimatePresence` for rise/fade; click outside still closes.
  - Remove on-dwelling hotspot click as the picker trigger (hotspots can remain as visual cues only, or be removed entirely — propose removing to avoid two triggers).
- Applies uniformly to all 7 parts: Membrane, End Wall, Interior, Rib, Platform, Skylight, Entry door.

### 4. Zoom out the perspective dwelling
- In `ReservationCustomizer`, the wrapper is `max-w-5xl aspect-[8/5]` and `Dwelling` fills it. Reduce visual size so the full structure (including the receding far end and ground shadow) is comfortably in frame above the bottom strip and below the top nav.
- Approach: shrink the viewport wrapper (`max-w-4xl`, reduce aspect to `aspect-[16/9]`), and inside `Dwelling.tsx` reduce the geometry scale (~0.8×) and recentre so nothing clips. Keep `overflow: visible`.

### 5. Background: dark navy starry sky + sand ground
- Replace the current black + amber radial gradient background in `ReservationCustomizer` with:
  - Sky: deep navy gradient (e.g. `#070b1f → #0d1638 → #1a2350`) covering the top ~65%.
  - Stars: subtle generated star field (small white dots via CSS `radial-gradient` layers or a lightweight SVG with ~80 randomly placed circles at low opacity, with a few brighter ones). No animation required (optional gentle twinkle via `animate-pulse` on a subset).
  - Sand: warm sand gradient at the bottom ~35% (e.g. `#c9a173 → #8a6a44`) with a soft horizon blur where the two meet.
- Update the ground shadow color under the dwelling in `Dwelling.tsx` to read correctly against sand (darker, warmer).

### Files to touch
- `src/pages/Configurator.tsx` — remove Save draft.
- `src/components/worlds/ReservationCustomizer.tsx` — non-fullscreen positioning, new background, move picker out of dwelling area, shrink viewport.
- `src/components/worlds/PartsStrip.tsx` — host the popover picker anchored above each button.
- `src/components/worlds/PickerColumn.tsx` — minor: add a downward arrow/tail; no logic change.
- `src/components/worlds/Dwelling.tsx` — scale geometry down ~0.8×, adjust shadow tone.
- `src/components/worlds/Hotspots.tsx` — remove or convert to non-interactive markers (propose: remove, since the strip is now the sole trigger).

### Open question
The strip currently lists 7 parts but an earlier instruction said "Other: Skylight and entry door — there was a final one, we are now ignoring it." Your message lists all 7 (Membrane, End Wall, Interior, Rib, Platform, Skylight, Entry door). I'll proceed with all 7 as listed in your latest message unless you say otherwise.
