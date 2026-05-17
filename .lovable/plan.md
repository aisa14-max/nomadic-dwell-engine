## Update Discover filter pills — terrain → climate classifications

### What
Replace the current terrain + duration filter bar on `/discover` with climate-classification pills.

### Changes

**`src/pages/Discover.tsx`**
- Swap the `filters` array from:
  `["All terrain", "Forest", "Coastal", "Desert", "Alpine", "Moor", "< 7 days", "Long-stay"]`
  to:
  `["All climates", "Tropical", "Dry/Arid", "Temperate", "Continental", "Polar", "Mountain/Alpine"]`
- Keep the existing `active` index state and visual highlighting behavior (white = active, liquid-glass = inactive).
- The climate pills remain visual-only for now; the live filtering is still driven by the globe region selection. Climate-based filtering will be wired once site data is remapped to the new categories.

### Out of scope
- No changes to `src/data/sites.ts` or site climate values.
- No new filtering logic beyond the existing region filter.
