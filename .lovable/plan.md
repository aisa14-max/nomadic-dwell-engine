## Click-triggered ombre glow on hero headline

Make the "Live anywhere across the wild Earth" headline light up letter-by-letter, left → right, in a warm amber ombre, every time the user clicks it. Fast wave (~700ms total), then letters settle back to white.

### Implementation

Update `src/components/BlurText.tsx`:
- Split each word into individual letters (still grouped by word so wrapping/spacing stays intact).
- Add internal state `glowKey` that bumps on click; clicking the headline re-triggers the wave.
- Each letter animates `textShadow` + `color` on a staggered delay based on its global letter index:
  - From white → bright amber (`#fbbf24`) with strong glow (`0 0 18px rgba(251,191,36,0.9)`) → back to white.
  - Per-letter duration ~280ms, stagger ~22ms per letter → full sweep ≈ 700ms across the line.
- Wrap the `<p>` with `onClick` + `cursor-pointer` so the whole headline is the trigger.
- Keep the existing blur-in entrance animation untouched.

Scope: only `BlurText.tsx`. No changes to `Landing.tsx` needed (it already uses this component for the headline).