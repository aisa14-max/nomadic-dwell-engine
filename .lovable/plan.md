# Redesign location map popup → lifestyle dashboard

The current popup mirrors the sidebar (thumbnail, title, climate chips). The redesign removes all duplicated fields and turns the popup into an inspiration card focused on lifestyle insights.

## What changes

**Removed from popup** (already in sidebar): small thumbnail, climate/cost/internet/safety chips, region line.

**New popup content** (top → bottom):
1. **Large hero image** — full-width, ~280×140, rounded top, subtle gradient overlay
2. **Title** in italic + small "Nomad Score" badge top-right of image (e.g. `87 / 100`)
3. **Why this site?** — one-line italic tagline (e.g. *"Equatorial canopy, off-grid stillness, deep-focus retreat."*)
4. **Lifestyle & atmosphere** — 1 short sentence describing pace / sensory feel
5. **Best nearby** — 3 pill tags (e.g. River kayaking · Canopy walks · Night sky)
6. **Community vibe** — 2–3 vibe chips with dot color (Quiet · Remote · Creative)
7. **Recommended Engine adaptations** — 2 chips with a small wrench icon (e.g. Humidity Shell · Solar Canopy)
8. Thin divider + footer link "Open site dossier →"

Visual: keep dark glassmorphism — `#111114` base with `backdrop-filter: blur(20px)`, 0.5px white/10 border, soft inner highlight on top edge, 14px radius, ~300px wide. Subtle vertical gradient from `#16161c` → `#0d0d11`. Nomad Score in a small pill with a faint glow tinted by score.

## Data

These fields don't exist in `src/data/sites.ts`. Add an optional `insights` block per site:

```ts
insights?: {
  tagline: string;          // "Why this site?"
  atmosphere: string;       // lifestyle sentence
  activities: string[];     // 3 items
  vibes: string[];          // 2–3 items
  adaptations: string[];    // 2 items
  nomadScore: number;       // 0–100
};
```

Populate insights for all 42 sites with concise, on-brand copy derived from region/climate. Provide a `getInsights(site)` fallback that synthesizes plausible defaults from `climateId` + levels so any site without explicit copy still renders gracefully.

## Files touched

- `src/data/sites.ts` — extend `Site` type, add `insights` to each entry, export `getInsights()` fallback.
- `src/components/RegionGlobe.tsx` — replace `buildPopupHtml` body with new dashboard layout; widen popup to 300px; update injected `.rg-popup` CSS for gradient bg + glass border + score-pill styles; keep existing 200ms fade and `data-rg-view` link.
- No changes to `Discover.tsx` sidebar or routing.

## Out of scope

- Sidebar card layout
- New routes or a real "site dossier" page (footer link continues to call existing `onViewSite`)
- Globe styling, filters, region selection
