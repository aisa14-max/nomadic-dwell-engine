## Plan

Show the attached wireframe PNG as a default image on the reservation customizer immediately on landing, before any panel option is selected. Once the user selects a material option, the existing per-part PNG behavior takes over (replaces the default).

### Steps

1. **Add asset**: Copy `user-uploads://dodatak_2.png` to `src/assets/parts/Default.png`.

2. **Update `PartImageOverlay.tsx`**:
   - Import the new default image.
   - Accept `activePart: PartId | null`. When `null`, render the default image with the same styling (screen blend, drop shadow, fade-in).
   - Keep AnimatePresence so it cross-fades to the selected part image when one is chosen.

3. **Update `ReservationCustomizer.tsx`**:
   - Keep `shownPart` state as-is (starts `null`).
   - Always render `<PartImageOverlay activePart={shownPart} />` during the `configure` stage (already the case). No logic change needed beyond the overlay now showing the default when `shownPart` is null.

### Notes
- No changes to selection logic, panels, hotspots, or totals.
- The default PNG disappears (cross-fades) the moment a material is chosen and is replaced by the part-specific PNG.
