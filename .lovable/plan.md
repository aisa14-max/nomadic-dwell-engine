## Goal

Rename and reorder the customizer parts strip from:
`Membrane, End Wall, Interior, Rib, Platform, Skylight, Entry Door`
to:
`Ribs, Terraribs, Solid Walls, Interior, Membrane, Additions, Exterior`

Keep all existing per-part options (names, hex, prices) and hotspot positions — only the label and order change.

## Mapping (old → new)

1. Rib → **Ribs**
2. Platform → **Terraribs**
3. End Wall → **Solid Walls**
4. Interior → **Interior**
5. Membrane → **Membrane**
6. Skylight → **Additions**
7. Entry Door → **Exterior**

PartId values stay the same internally (so saved selections, hotspots, dwelling rendering, and reservation logic all keep working). Only the `label` strings and array order in `PARTS` change.

## Files

- `src/data/dwellingParts.ts` — update each part's `label` and reorder the `PARTS` array per the mapping above. No other changes.

That's the entire change — the parts strip, hotspots, picker, summary, and payment panels all read from `PARTS`, so they'll reflect the new labels and order automatically.
