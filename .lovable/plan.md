## Goal
Make the hero headline "Live anywhere across the wild Earth" light up as the cursor moves across it — each letter glows amber when the cursor is near, fading back to white as the cursor moves away. No click required.

## Approach
Update `src/components/BlurText.tsx` only:

1. Remove the click handler and `glowKey` state.
2. Track cursor position relative to the headline with `onMouseMove` (and clear on `onMouseLeave`).
3. For each letter span, measure its center x-position via a ref.
4. Compute each letter's glow intensity from its distance to the cursor x:
   - Within ~80px → full glow (amber `#fbbf24`, textShadow `0 0 18px rgba(251,191,36,0.95)`)
   - Falls off smoothly to 0 by ~180px → back to white, no shadow
5. Apply the computed `color` and `textShadow` inline via style (no framer animation needed for the follow effect — pure CSS transition `transition: color 150ms ease, text-shadow 150ms ease` gives a smooth trailing feel).
6. Keep the existing blur-in entrance animation untouched.

## Result
Moving the cursor left→right across the headline produces a soft amber "spotlight" of glowing letters that tracks the cursor, with a gentle ombre falloff on either side.
