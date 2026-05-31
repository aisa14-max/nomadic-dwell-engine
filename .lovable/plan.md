## Goal
Refine the cursor-follow glow on "Live anywhere across the wild Earth" — tighter spotlight + a more refined, on-brand warm yellow that harmonizes with the desert/nightfall hero.

## Changes (in `src/components/BlurText.tsx` only)

**Smaller radius (more focused spotlight):**
- `RADIUS_FULL`: 40 → **24px**
- `RADIUS_FADE`: 240 → **140px**

**Better yellow shade — warmer, softer, less neon:**
- Replace `rgb(251, 191, 36)` (Tailwind amber-400, a bit acidic/neon) with **`rgb(245, 200, 130)`** — a warm sandy gold that matches the desert nightfall palette (closer to candlelight / dune-at-dusk tone)
- Apply the same color to both the core glow and the bloom layer
- Letter color blend stays capped at 70% so text remains legible

**Subtle intensity tune to match the smaller radius:**
- Core shadow alpha: keep `intensity * 0.55`
- Bloom layer width: `28px` → **`22px`** (proportional to tighter radius)
- Bloom alpha: `intensity * 0.25` → **`intensity * 0.22`**

## Result
A tighter, more precise warm-gold spotlight that feels like candlelight tracing the headline — refined, desert-toned, and harmonious with the hero scene instead of neon amber.
