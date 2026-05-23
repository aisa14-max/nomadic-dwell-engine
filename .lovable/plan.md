
# Worlds — Reservation Customizer

A four-stage flow (`configure → summary → payment → confirmed`) that opens when the user clicks **Continue configuration** on `/configurator`. The current Deployment-plan slide-in is replaced by this experience. Everything else on the Worlds page (hero, viewport, Engine Assistant) stays intact and is visible behind the customizer on entry, then is covered as panels expand.

## Parts model (7 parts, since you're dropping the 8th)

| # | Part        | Hotspot? |
|---|-------------|----------|
| 1 | Membrane    | yes      |
| 2 | End Wall    | yes      |
| 3 | Interior    | yes      |
| 4 | Rib         | yes      |
| 5 | Platform    | yes      |
| 6 | Skylight    | yes (new)|
| 7 | Entry Door  | yes (new)|

The spec's "8/8 complete" rule becomes **7/7**. Progress bar, Reserve enable, and configured-set checks all use 7.

Each part gets 3 named option swatches with placeholder GBP prices, e.g.:
- Membrane: Linen White £1,200 · Graphite £1,350 · Moss £1,400
- Skylight: Clear £600 · Tinted £750 · Smart Glass £1,100
- (full table lives in `src/data/dwellingParts.ts`)

## Stage layout

```text
configure         summary             payment
[ SVG + hotspots] [ SVG | summary  ]  [ SVG | sum (compact) | payment ]
[ parts strip   ]   rightInset 420       rightInset 880
[ Reserve card  ]
```

`rightInset` is the single source of truth for layout offset, derived from `stage`.

## Files to create

- `src/data/dwellingParts.ts` — parts, options (id, name, hex, price), tax rate, helpers (`subtotal`, `tax`, `total`, `dueToday`).
- `src/components/worlds/Dwelling.tsx` — stylized SVG dwelling. Each part is its own `<g data-part="membrane">` with separate fill targets so it can be desaturated, wireframe-stroked, or color-swapped independently. Exposes `<Dwelling colors={Record<partId, hex>} wireframePart={partId|null} />`.
- `src/components/worlds/Hotspot.tsx` — absolute-positioned glass pill marker with hover label 36px above. Coordinates live next to the SVG.
- `src/components/worlds/PartsStrip.tsx` — 7-cell bottom strip, swatch dots, active/configured/unconfigured visual states.
- `src/components/worlds/PickerColumn.tsx` — animated picker rising above the active cell (`pickerRise` 0.28s scale+slide); shows option name + price + color swatch.
- `src/components/worlds/ReserveCard.tsx` — top-right glass card with progress bar + locked/active states (breathing glow when complete).
- `src/components/worlds/SummaryPanel.tsx` — right slide-in, line items, totals, Confirm Reservation.
- `src/components/worlds/PaymentPanel.tsx` — form (real `<input>`s), floating labels, amber underline sweep, card preview, save-payment toggle, validation alert, Pay & Confirm.
- `src/components/worlds/ConfirmedOverlay.tsx` — full backdrop-blur overlay, fully colorized dwelling behind, breathing glow + particle field, HBTR-XXXXXX ref, Download / Continue Exploring.
- `src/components/worlds/ReservationCustomizer.tsx` — orchestrator: owns all state, renders stage-appropriate UI, handles transitions.
- `src/hooks/useReservation.ts` — `useReducer`-backed state for `stage`, `activePart`, `configured: Map<partId, optionId>`, `pickIdx`, `reservationRef`, plus derived `subtotal/tax/total/dueToday`.
- `src/styles/customizer.css` (or additions to `index.css`) — `pickerRise`, `partFlash`, `reserveActive` breathing, transition tokens.

## Files to edit

- `src/pages/Configurator.tsx` — replace the current "Deployment plan" `AnimatePresence` block. `Continue configuration` now opens `<ReservationCustomizer />` (full-viewport overlay with the hero/viewport visible only during stage=configure entry animation, then covered).
- `tailwind.config.ts` — register `pickerRise`, `partFlash`, `reserveActive` keyframes and the `cubic-bezier(.6,.2,.2,1)` easing token.

## Behavioral mapping to spec

- **§1 initial state** — `useReservation` starts `stage=configure`, `configured=∅`; Reserve disabled; totals £0.
- **§2 nav** — existing `<Nav>` stays; no destructive handlers added.
- **§3 hotspots** — rendered only when `stage==='configure' && activePart===null`; hover pill via Framer Motion.
- **§4 parts strip** — click logic exactly per spec; swatch dot from `configured.get(id)`; opacity/saturation via Tailwind utility classes driven by configured state.
- **§5 picker** — `pickerRise` keyframe; on option click: update `configured`, transition SVG group `filter: saturate(0→1)` over 0.6s, fire one-shot `partFlash` only if part wasn't previously configured (tracked via `flashedParts` set). Outside click (listener on overlay) clears `activePart`.
- **§6 reserve** — `disabled` attr + `aria-disabled`; progress = `configured.size/7`; gradient swap + `reserveActive` glow at 7/7.
- **§7 summary** — set `stage='summary'`, animate `rightInset` 0→420, slide panel `right: -440 → 16` over 0.65s with the spec easing. Hotspots/strip/reserve hidden via stage check. `×` returns to configure.
- **§8 payment** — `rightInset` 880, summary compacts to width 380 at `right: 484`, payment slides in. Inputs are real `<input>` with digit-only handlers (regex strip), maxLength 16/4, formatted card preview. Floating label = CSS `:not(:placeholder-shown)` + amber underline `scaleX` 0→1. Validation produces a single `alert()` per spec; Pay & Confirm becomes inert via `isSubmitting` ref to satisfy §14.
- **§9 confirmed** — overlay fades over 0.8s; ref generated once via `useMemo` keyed to session; Download = `alert()` stub; Continue Exploring → `stage='configure'` with all state preserved.
- **§10 pricing** — derived selectors in `useReservation`; all panels read from them so updates are automatic.
- **§11 transitions** — shared `EASE = [.6,.2,.2,1]`, `DURATION = 0.6`; reducer is idempotent so double-clicks collapse to final state.
- **§12 persistence** — in-memory only, as spec mandates (localStorage marked as future work, not implemented).
- **§13 a11y** — real inputs, `disabled` attr, named color options, tab order matches spec.
- **§14 edge cases** — `flashedParts` set, `isReserving` and `isSubmitting` guards.
- **§15 single sources of truth** — `configured` Map, `configured.size===7`, and `stage` are the only inputs to derived visuals.

## Out of scope (per your instructions)

- Esc-key back-navigation (spec marks as future).
- localStorage persistence (spec marks as recommended).
- Real payment processing / backend writes.
- The 8th part.

## Implementation order

1. Data + hook + CSS keyframes.
2. Dwelling SVG + Hotspot + PartsStrip + PickerColumn (stage=configure fully working).
3. ReserveCard + SummaryPanel + transition orchestration.
4. PaymentPanel + validation.
5. ConfirmedOverlay + reset flow.
6. Wire into `Configurator.tsx`, remove old Deployment-plan slide-in.
