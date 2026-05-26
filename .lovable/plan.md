## Voyages page: icon chips + conditional Configure

**File:** `src/pages/Discover.tsx`

### 1. Replace label words with Lucide icons in site chips
Update the `chip()` helper in the sidebar to render an icon instead of the text label (`Temp`, `Rain`, `Cost`, `Net`, `Safety`):

- Temp → `Thermometer`
- Rain → `CloudRain`
- Cost → `DollarSign` (or `Wallet`)
- Net → `Wifi`
- Safety → `Shield`

Each chip becomes: `[icon] value` (icon ~12px, muted color; value in current white tone). Tooltip via `title` attribute keeps the label discoverable for accessibility.

### 2. Show Configure only after a location is selected
Currently the Configure button appears on every site row. Change behavior so it only appears when the user has clicked a row (i.e. `focusedSite?.title === s.title` — the `active` state already tracked).

- If `active` → show Configure button (top-right of row, as today).
- If not active → hide it; row only shows thumbnail, name, region, and icon chips.

Clicking a row sets it active (existing `handleShowOnMap`) and reveals Configure.

### Notes
- Pure presentation change in `Discover.tsx`; no data or routing changes.
- Icons imported from `lucide-react` (already used in the file).
- Tone logic for Cost/Net/Safety chips preserved.
