## Voyages page — interactive globe + region filtering

### Goal
Replace the current static Voyages hero animation with an interactive 3D Mapbox globe. Users click a continent to filter the existing recommended sites list below.

### Layout

```
┌──────────────────────────────────────────────┐
│  // Voyages                                  │
│  Find terrain that matches your engine.      │
│  [short subtitle]                            │
│                                              │
│  ┌────────────── Mapbox globe ─────────────┐ │
│  │   (dark style, continent hotspots)      │ │
│  │   Selected: Europe   [× Clear]          │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Filter pills (climate / duration) — kept    │
│  Card grid — filtered by selected region     │
└──────────────────────────────────────────────┘
```

### Regions (7 continents)
Each has `id`, display `label`, and a center `[lng, lat]` for `flyTo`:

- `europe` — Europe
- `north-america` — North America
- `south-america` — South America
- `africa` — Africa
- `asia` — Asia
- `oceania` — Oceania
- `antarctica` — Antarctica

### Site → region mapping (existing 6 sites)
- Pine Hollow (Lapland, SE) → europe
- Mýrar Cliff (Faroe, FO) → europe
- Atacama Plateau (Antofagasta, CL) → south-america
- Skye Moor (Highlands, UK) → europe
- Mosi Plains (Suðurland, IS) → europe
- Black Pines (Karelia, FI) → europe

Continents with no sites show an empty state: "No voyages charted here yet."

### Map implementation (Mapbox GL JS, globe projection)
- Add `mapbox-gl` dependency.
- Store the Mapbox **public** token via the secrets tool as `VITE_MAPBOX_TOKEN` (public tokens are safe to ship; restrict by URL in Mapbox dashboard).
- `projection: 'globe'`, style `mapbox://styles/mapbox/dark-v11`, atmosphere fog tuned for the dark aesthetic, no default controls.
- Slow auto-rotation until first user interaction.
- Continent hotspots loaded from a GeoJSON `FeatureCollection`, rendered as:
  - `fill` layer (low-opacity white, raised on hover/selected via feature-state)
  - `line` layer (thin white stroke)
  - `symbol` layer with region label
- Click on a continent fill → `onSelect(regionId)` + `map.flyTo(center)`.
- Respect `prefers-reduced-motion` (skip auto-rotation).

### State & filtering
- `Discover.tsx` owns `selectedRegion: RegionId | 'all'` (default `all`).
- Each site object gains `region: RegionId`.
- Grid: `sites.filter(s => selectedRegion === 'all' || s.region === selectedRegion)`.
- Chip above grid shows active region with an "× Clear" button.

### File structure (separated by responsibility)

- **`src/data/regions.ts`** — `RegionId` type, `REGIONS` array (id, label, center), nothing else.
- **`src/data/continents.geo.json`** — simplified continent polygons; each feature has `properties.id` matching a `RegionId`. Sourced from a public-domain simplified continents GeoJSON.
- **`src/data/sites.ts`** — move the `sites` array out of `Discover.tsx`; add `region: RegionId` to each entry; keep image imports here.
- **`src/components/RegionGlobe.tsx`** — Mapbox component only. Props: `selectedRegion`, `onSelect`. Handles map init, layers, hover/click, flyTo, cleanup. No app state, no filtering logic.
- **`src/components/RegionChip.tsx`** — Small presentational chip showing the active region with a clear button.
- **`src/pages/Discover.tsx`** — Composition only: holds `selectedRegion` state, renders `RegionGlobe`, `RegionChip`, filter pills, and the filtered grid.
- **`index.html`** or `RegionGlobe.tsx` — import `mapbox-gl/dist/mapbox-gl.css`.
- **Keep** `src/components/VoyageScene.tsx` untouched (may be reused elsewhere).

### Implementation guardrails

Per your pointers:
- **No assumptions** — at build time I will stop and ask before proceeding if I hit any of these decision points:
  1. Where to source the continent GeoJSON (I'll propose 2–3 specific public-domain options and let you pick before adding the file).
  2. Globe height on desktop vs. mobile (I'll propose values and confirm).
  3. Whether the dropdown alternative is wanted (current plan: click-only, no dropdown).
  4. Whether to delete the now-unused `VoyageScene.tsx` (default: keep).
  5. Any styling choice not directly derivable from the existing `liquid-glass` / token system.
- **Separation of concerns** — data (`src/data/*`), presentation (`src/components/*`), and page composition (`src/pages/Discover.tsx`) live in distinct files; `RegionGlobe` owns zero app state.

### Build order
1. Request `VITE_MAPBOX_TOKEN` via secrets tool — wait for confirmation.
2. Ask which continent GeoJSON source to use — wait for answer.
3. Install `mapbox-gl`.
4. Add `src/data/regions.ts`, `src/data/continents.geo.json`, `src/data/sites.ts`.
5. Add `src/components/RegionGlobe.tsx` and `src/components/RegionChip.tsx`.
6. Refactor `src/pages/Discover.tsx` to use them.
7. Verify in preview, confirm with you before any further polish.

### Out of scope
- Per-country selection or zoom-to-country.
- Backend storage of sites.
- Adding more sites per continent.