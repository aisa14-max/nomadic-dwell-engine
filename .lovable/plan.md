## Summary

Update the Configurator Worlds page stat panel values and add a glow hover effect to all four panels.

## Changes

### File: `src/pages/Configurator.tsx`

1. **Update stat values** (lines 177-180):
   - Assembly time: `14` → `10`, unit: `days` → `hours`
   - Total area: `42` → `25`

2. **Add hover glow effect to `Stat` component** (around line 264):
   - Wrap the panel `div` with `motion.div` from Framer Motion
   - Add `whileHover` prop with a subtle scale (1.03) and brightness/glow effect
   - Use a CSS box-shadow or border-color transition to create a "light up" feel on the liquid-glass panel
   - Keep the transition smooth and subtle to match the premium aesthetic

## Technical approach
- Use Framer Motion `motion.div` for the hover animation since it's already imported in the file
- Apply a `whileHover={{ scale: 1.03 }}` with a transition that also brightens the border or adds a soft box-shadow glow
- Ensure the liquid-glass background subtly brightens on hover using Tailwind hover classes combined with motion