# Engine Assistant chatbox refinements

Scope: `src/pages/Configurator.tsx` only. Keep glassmorphism + dark theme.

## Container
- Reduce aside height ~18%: change `height: "calc(58vh + 96px)"` → `"calc(48vh + 60px)"`.
- Remove flex-1 push so input sits closer to content: switch messages area from `flex-1` to `flex-1 min-h-0` and reduce `mt-3` on form to `mt-2`. Reduce top padding/gap so empty space between last suggestion row and input shrinks.
- Slightly increase assistant bubble max width: `max-w-[88%]` → `max-w-[94%]`.

## Suggestions list
- Expand to 6 items: `Change layout`, `Add workspace`, `Privacy`, `Storage`, `Lighting`, `Relax zone`.
- Grid: `grid-cols-2 md:grid-cols-3 gap-2.5` (responsive: 2 cols small, 3 cols larger).
- Cards: drop `aspect-square`, use fixed shorter height (`min-h-[64px]`) so cards are wider and shorter.
- Padding: `p-3` → `px-4 py-3` for more internal breathing room.
- Center text vertically + horizontally: `flex items-center justify-center text-center`.
- Text: `text-xs` (was `text-[11px]`) and `leading-snug` so labels fit on one line.
- Hover: keep glow + border highlight, add `whileHover={{ scale: 1.03 }}` via `motion.button` with `transition duration-250 ease-out`.
- Active/selected state: track `selectedSuggestion` in state. Selected card gets `bg-white/15 border-white/50 shadow-[0_0_28px_-4px_rgba(255,255,255,0.45)]`. On click: set selected, then call `send(label)` (existing behavior hides suggestions after send).

## Technical notes
- New state: `const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)`.
- Replace `<button>` inside suggestions map with `motion.button` using `whileHover` + `whileTap={{ scale: 0.98 }}`.
- No backend, no data, no other files touched.
