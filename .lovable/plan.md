## Voyages Card Layout Update

### Current State
On the Discover (Voyages) page, each location card shows a tiny 56×56 px thumbnail image beside the location title in a horizontal row. The image is visually underwhelming and the title sits next to it rather than under it.

### Proposed Changes
1. **Enlarge the photo**: Change the location image from `h-14 w-14` (56 px) to a prominent card-width image — roughly `w-full h-48` (full-width, ~192 px tall) with `rounded-xl` or `rounded-[1rem]`.
2. **Move title below photo**: Restructure the card so the image sits at the top of the card body, and the location title (`h3`) appears directly underneath the image on its own line.
3. **Preserve existing styling**: Keep the liquid-glass card shell, tags, "Configure" button, and heart button unchanged. Maintain the existing animation timings.

### Technical Details
- File: `src/pages/Discover.tsx`
- Remove the `flex items-center gap-3` wrapper around the `<img>` and `<h3>`
- Stack them vertically: `<img className="w-full h-48 object-cover rounded-xl">` followed by `<h3>` with `mt-3`
- Remove the small `w-14 h-14` constraints and the `flex-shrink-0` class
- Keep the `border border-white/15` on the image

### Result
Each card will have a large, immersive landscape photo at the top with the bold location title directly underneath, creating a more visual, gallery-style browse experience that matches the atmospheric nature of the Voyages page.