## Reposition pickers to open right above each visible part

The dwelling SVG (viewBox 800×500) renders the arches/structure in the lower half of the container, but the hotspots in `src/data/dwellingParts.ts` use percentages that don't match the new perspective geometry. The picker opens above the hotspot point, so each hotspot must sit at the top edge of its visible element.

### Computed top-edge positions (per `Dwelling.tsx` geometry)

| Part | SVG anchor | New hotspot % (x, y) |
|---|---|---|
| Membrane | Front rib apex (660, 130) | 52, 28 |
| End Wall | Back rib apex (190, 154) | 24, 33 |
| Interior | Front opening top (660, 140) | 52, 30 |
| Rib | Middle rib apex (~472, 150) | 59, 32 |
| Platform | Above front-top edge | 70, 65 |
| Skylight | Mid ridge (~425, 154) | 53, 33 |
| Entry Door | Door top (682, 301) | 85, 62 |

### Change

Update only the `hotspot` values in `src/data/dwellingParts.ts` to the table above. No other files change. Result: clicking MEMBRANE (or any other part, via hotspot dot or bottom strip) opens the picker tucked just above that element's top edge in the perspective view.