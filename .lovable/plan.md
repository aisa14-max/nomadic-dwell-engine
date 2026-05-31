## Goal

On the Voyages page (`/discover`), in the open Locations sidebar, restructure each site card so the metadata chips (Hot, Wet, Low, Slow, Low) sit to the **right of the thumbnail** instead of below the entire card. This also lets the thumbnail grow larger.

## Changes (single file: `src/pages/Discover.tsx`)

Currently each site card is structured as:

```text
[ img 14x14 ] [ title + region ] [ Configure btn? ]
[ chips row spanning full width below ]
```

New structure:

```text
[ img ~20x20 ] [ title + region ]            [ Configure? ]
                [ chips wrapping beside img ]
```

Specifically:
- Wrap the thumbnail and the right-hand column (title + region + chips) in a single flex row.
- Move the chips block (`Temperature, Rainfall, Cost, Internet, Safety`) from below the outer card into the right-hand column, under the title/region.
- Enlarge the image from `w-14 h-14` to roughly `w-20 h-20` (80px) so it has more presence next to the chips.
- Keep `flex-wrap` on chips so they reflow gracefully in the 360px sidebar.
- Keep the Configure button position (top-right when active) unchanged.
- No changes to data, filtering, click behavior, or styling tokens.

## Out of scope

- No changes to globe, filters, header, or other pages.
- No design-system token changes.
