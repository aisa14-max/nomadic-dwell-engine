## Add hover glow to hero stat cards

In `src/pages/Landing.tsx`, enhance the two `StatGlass` cards so they "light up" when hovered:

- Add a smooth transition + on-hover:
  - Brighter glass background and border (`hover:bg-white/15`, `hover:border-white/40`)
  - Soft amber outer glow via box-shadow (`hover:shadow-[0_0_40px_rgba(251,191,36,0.35)]`)
  - Slight lift (`hover:-translate-y-1`)
  - Icon and value tint to warm amber on hover
- Wrap with `transition-all duration-300 ease-out` and `group` so the icon/value can react via `group-hover:` classes.

Scope: only the `StatGlass` component in `Landing.tsx`. No other sections, no logic changes.