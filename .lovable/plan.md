## Change

PNG overlay should be driven by the **last part the user picked an option for**, not by which tab is currently active.

## Behavior

- Open customizer → no PNG.
- Click Ribs tab → picker opens, **no PNG yet**.
- Click "Matte Black" (or Bronze / Cold Steel) → Ribs.png fades in.
- Switch to Terraribs tab and just browse → Ribs.png **stays**.
- Click "Poured Concrete" in Terraribs → cross-fade to Terraribs.png.
- Same rule for all 7 panels.
- Going to summary/payment → overlay hides (unchanged).

## Implementation

1. **`ReservationCustomizer.tsx`** — add local state `const [shownPart, setShownPart] = useState<PartId | null>(null)`. In `handleSelectOption`, after `r.selectOption(...)`, call `setShownPart(r.activePart)`. Pass `shownPart` (instead of `r.activePart`) to `<PartImageOverlay />`.

2. No changes to `PartImageOverlay.tsx`, picker, hotspots, totals, or reservation flow.

3. Optional polish: reset `shownPart` to `null` when leaving the `configure` stage so reopening starts clean.
