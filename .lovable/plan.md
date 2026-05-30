## Goal
Refine the cursor-follow glow on the hero headline so it feels premium and cinematic — subtle amber light that traces the cursor without washing out the white letterforms.

## Changes (in `src/components/BlurText.tsx` only)

**Tighten the spotlight, soften the glow:**
- `RADIUS_FULL`: 60 → **40px** (narrower hot center, more precise tracking)
- `RADIUS_FADE`: 180 → **240px** (longer, smoother ombre tail on both sides)

**Reduce intensity so text stays legible:**
- Color blend: cap at **70% amber** instead of 100% (letters stay near-white with a warm amber tint rather than turning fully amber)
- Glow alpha: max `0.95` → **`0.55`** (softer halo)
- Glow blur: `4 + i*18` → **`0 + i*14`** (no idle blur, tighter max)
- Add a second, wider, very-faint shadow layer (`0 0 28px rgba(251,191,36, i*0.25)`) for a premium bloom feel

**Smoother trailing motion:**
- Transition: `180ms ease-out` → **`220ms cubic-bezier(0.22, 1, 0.36, 1)`** (gentle easing matches the hero's blur-in motion language)

**Easing curve on intensity:**
- Apply `easeOutQuad` (`1 - (1-i)²`) to the falloff so the glow rolls off organically instead of linearly

## Result
A focused warm spotlight trails the cursor with a long, gentle ombre falloff. Letters glow rather than recolor — premium and readable.
