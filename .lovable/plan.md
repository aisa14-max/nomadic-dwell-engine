## Goal
Shift the Voyages page background to a "Deep midnight" navy across all VoyageScene gradients and the page overlay.

## Changes

**`src/components/VoyageScene.tsx`** — `drawBackdrop`:
- Top gradient stop: `rgba(15,30,80,...)` → `rgba(6,12,40,0.85)`
- Mid stop: `rgba(8,18,55,0.9)` → `rgba(3,8,30,0.95)`
- Bottom stop: `rgba(2,6,28,0.98)` → `rgba(1,3,15,1)`
- Horizon haze: warm beige `rgba(180,170,150,0.08)` → cool deep-navy glow `rgba(20,40,90,0.12)` so it doesn't read warm against midnight.

**`src/pages/Discover.tsx`** — page shell:
- Base bg `bg-[#020618]` → `bg-[#01030f]`
- Overlay `bg-[#0a1a44]/40` → `bg-[#020618]/55` (slightly darker tint)
- Keep `VoyageScene` opacity at `80`.

No other files touched. Ridges, compass, lat lines, and path stay white/translucent and read fine on the darker base.