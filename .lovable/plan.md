# Power runway card

Replace the middle stat card in the Engine dashboard Overview ("Battery state") with a dynamic **Power runway** card. Visual styling, layout, and italic serif number typography stay identical to the other stat cards — only content and ring behavior change.

## Scope
File: `src/pages/Dashboard.tsx` (plus a small keyframe in `src/index.css` for the amber pulse).

Out of scope: other tabs, other cards, the climate panel, assistant panel.

## What changes

1. **Card content**
   - Label: `Power runway` (replaces `Battery state`)
   - Big number: battery % (unchanged value source — still the `battery` state, still rolls with the existing flip animation)
   - New line under the number/unit: `~{hours}h remaining at current draw`
     - `hours = round(battery / drawRate)` where `drawRate` is a constant average draw (`% per hour`). Default `drawRate = 11` so 92% ≈ 8h, matching the spec example.
     - Recomputes live as `battery` updates from the existing interval.

2. **Ring arc mount animation**
   - The ring currently animates via Framer Motion `strokeDashoffset`. Switch this single card's ring to a pure **CSS animation**: 1.2s `ease-out`, fills from `offset = circumference` (empty) → `offset = circumference * (1 - value/100)` (target).
   - Implemented with a CSS custom property `--ring-offset` and `@keyframes ring-fill` keyed to the value at mount. No re-trigger on every battery tick — value updates after mount transition smoothly via `transition: stroke-dashoffset 0.4s ease-out`.

3. **Low-battery state (`battery < 20`)**
   - Add `amber-pulse` class to the ring's `<circle>` stroke (and a faint matching `drop-shadow` filter).
   - Keyframe in `index.css`:
     ```
     @keyframes ring-amber-pulse {
       0%,100% { stroke: #f59e0b; filter: drop-shadow(0 0 2px rgba(245,158,11,0.4)); }
       50%     { stroke: #fbbf24; filter: drop-shadow(0 0 8px rgba(245,158,11,0.85)); }
     }
     .ring-amber-pulse { animation: ring-amber-pulse 1.6s ease-in-out infinite; }
     ```
   - Card background, border, and text colors stay unchanged. Only the ring stroke pulses amber.

4. **Component shape**
   - Extract a small `PowerRunwayCard` component inside `Dashboard.tsx` (mirrors `StatCard` styling/markup) so the existing `StatCard` stays untouched for Solar and Wind.

## Technical notes
- Circumference: `2π·28` (same as existing ring).
- Mount animation runs once via `useRef`-guarded inline `<style>`-less approach: set `style={{ strokeDashoffset: targetOffset }}` after a `useEffect` tick, with CSS `transition: stroke-dashoffset 1.2s cubic-bezier(0, 0, 0.2, 1)` for the first paint. Subsequent battery changes use the same transition (shorter `0.4s` is acceptable; spec only mandates 1.2s on mount, so we keep 1.2s for simplicity).
- `prefers-reduced-motion`: disable the amber pulse keyframe and shorten the ring fill to instant.
- No new dependencies.
