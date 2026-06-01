## Goal

When a location is selected, position the pin in the upper portion of the map view (not centered) so the popup card — which opens downward from the marker — is fully visible.

## Change

In `src/components/RegionGlobe.tsx`, in the focus-point effect:

- Replace the current `map.flyTo({ center: focusPoint, zoom: 3.6, ... })` with a flyTo that uses a vertical `offset` to push the pin up. Mapbox's `offset: [x, y]` shifts the target point in screen pixels relative to the map center — a negative `y` value moves the pin upward in the viewport.
- Use roughly `offset: [0, -180]` (tunable) so the pin lands ~180px above center, leaving the lower ~360px of the map free for the popup card (popup is ~300px tall + 18px offset).
- Keep zoom at 3.6 and duration 1800ms.

No other files change. No data, no popup layout, no sidebar changes.

## Out of scope

- Popup anchor logic, popup size, sidebar layout, marker styling.
