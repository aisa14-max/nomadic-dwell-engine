## Plan

Replace the option lists for all 7 parts in `src/data/dwellingParts.ts` with the new names. Keep existing prices (in order) and pick sensible hex swatches per name. No component changes required — `PartsStrip` / picker / totals read from this file.

### New options

- **Ribs (`rib`)**: White `#f2f2f2`, Grey `#7a808a`, Black `#1a1a1c`
- **Terraribs (`platform`)**: White `#ece9e2`, Grey `#9e9e9c`, Black `#1d1d1f`
- **Solid Walls (`endwall`)**: Wooden Panels `#a67648`, Purple Panels `#6b4a8a`, White Panels `#ececec`
- **Interior (`interior`)**: Green Boxy `#4a6b3a`, Yellow Organic `#d8b04a`, Cotton Grey `#bdbcb6`
- **Membrane (`membrane`)**: ETFE `#e8e2d4`, PTFE `#cfcfcf`, PVC Coated Polyester `#5d6e4a`
- **Additions (`skylight`)**: Solar Panel `#1c2a4a`, Bike Holder `#8a8a8e`, Extra Water Tank `#7aa0b8`
- **Exterior (`door`)**: Sitting `#a06a3a`, Plants `#4a7a3a`, Foldable Pool `#3a8ab8`

### Notes
- Keep existing `id` slugs where stable (e.g. `steel`→`white`, etc.) — change IDs to short kebab strings matching new names so any stored selections from old IDs naturally reset (acceptable since reservation state is in-memory).
- Prices keep current values per slot.
- No other files touched.
