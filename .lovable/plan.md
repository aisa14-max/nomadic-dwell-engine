## Update Landing Hero Stats

In `src/pages/Landing.tsx`, update the two `StatGlass` cards in the hero:

1. **Average Engine Setup Time**
   - Value: `34.5 Min` → `7.2 Hours`
   - Icon: replace the generic clock SVG with a more fitting Lucide icon `Timer` (stopwatch-style, better represents setup duration)

2. **Operators Across the Globe**
   - Value: `2.8K+` → `1.2K+`
   - Icon: replace the basic globe SVG with Lucide `Globe2` (more detailed continents, stronger visual)

### Technical notes
- Import `Timer` and `Globe2` from `lucide-react` (alongside existing `ArrowUpRight`, `Play`).
- Pass them as `<Timer className="w-7 h-7 text-white" strokeWidth={1.5} />` etc. into the existing `StatGlass` `icon` prop — no structural changes needed.
