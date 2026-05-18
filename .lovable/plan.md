## Voyages page refinements

### 1. Float the status/filter chip over the map
In `src/pages/Discover.tsx`:
- Remove the chip currently rendered below the globe (`<RegionChip />` block under `mt-5`).
- Inside the globe's `motion.div` wrapper (which already has `relative`-able styling), render `<RegionChip />` absolutely positioned `top-3 right-3 z-20` as a floating overlay. Ensure the wrapper has `relative` so absolute positioning anchors correctly.

### 2. Widen the Mapbox container
In `src/pages/Discover.tsx`:
- Change the centered content wrapper from `max-w-[1400px]` to a wider, responsive setup so the globe extends further horizontally:
  - Keep the header (eyebrow, title, intro paragraph) inside a `max-w-[1400px] mx-auto` block.
  - Move the globe out of that constrained block and into a wrapper that uses the full page width with smaller side padding (e.g. wrapper uses `max-w-[1800px] mx-auto px-4 md:px-8`), while the outer page padding is reduced so the globe feels more immersive.
- Increase globe height slightly on large screens: `h-[460px] md:h-[620px] lg:h-[680px]`.
- Maintain responsive margins on mobile (still comfortable horizontal padding).

### 3. Compact data chips on each location card
In `src/pages/Discover.tsx` sidebar list:
- Replace the current single-line title + region with a more structured card:
  - Row 1: thumbnail + title + region (as today, but title slightly tighter).
  - Row 2: a wrap of small chips showing the structured fields from `SITES` (data already exists — no schema change needed):
    - `Temp · {temperature}` (one word, e.g. Cold / Temperate / Hot)
    - `Rain · {rainfall}` (one word, e.g. Dry / Moderate / Rainy)
    - `Cost · {costOfLiving}` (Low / Medium / High)
    - `Net · {internetSpeed}` (Slow / Medium / Fast)
    - `Safety · {safety}` (Low / Medium / High)
  - Chip styling: `text-[10px] font-body px-2 py-0.5 rounded-full liquid-glass text-white/85`, with subtle color accents per severity using existing semantic tokens (no new colors):
    - Low/Slow → muted/neutral
    - Medium → default
    - High/Fast → bright (white text, slightly stronger glass)
- Configure button stays on the right but card becomes vertical-friendly (chips wrap below the title row).
- Keep the existing data values — they already use the required one-word descriptors and Low/Medium/High categories per `src/data/sites.ts`. No data file changes required.

### Technical notes
- Files touched: `src/pages/Discover.tsx` only. `RegionChip` and `sites.ts` need no changes.
- Layout uses Tailwind responsive utilities; chip overlay uses absolute positioning inside the existing `liquid-glass rounded-[1.5rem] overflow-hidden` globe wrapper.
- No new dependencies.
