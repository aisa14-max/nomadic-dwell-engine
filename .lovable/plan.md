# Wire up Engine dashboard tabs

Tabs currently only style the active pill — content doesn't change. I'll switch the page body to render per-tab content with a soft crossfade-and-slide between panels.

## Per-tab content

**Overview** (unchanged) — Alert banner, 3 stat ring cards (Solar / Power runway / Wind), Internal climate panel + sparkline, Engine assistant panel.

**Energy** — energy-focused dashboard:
- Three cards: Solar generation (today vs. yesterday delta), Battery state with the existing PowerRunwayCard, Net export to grid (kWh).
- Wide chart: 24h generation vs. draw, two stacked area lines (white solar, dimmer battery draw) — reuse the scrubbable sparkline pattern.
- Source breakdown row: Solar / Wind / Reserve with thin horizontal bars showing share of last hour.

**Climate** — interior + exterior sensors:
- Four large climate tiles (Temp, Humidity, Air quality, Occupied) promoted from the current Internal climate panel, sized up.
- 12h temperature trace using the same scrub sparkline.
- Exterior vs. interior comparison strip (two values side by side: 8.1°C outside / 19.4°C inside, etc.).

**Activity** — event log:
- Timeline list of recent engine events (mock): "22:14 · Battery topping started", "21:47 · Solar array locked for storm mode", "19:02 · Guest arrival registered", etc. Each row has a timestamp, icon, and short body.
- Filter chips above the list: All / System / Climate / Guests (visual only).

## Interaction

- Tab click sets state; selected pill animates with the existing `layoutId` spring (already in place).
- Panel container wraps content in `AnimatePresence mode="wait"` with `motion.div` keyed by tab index. Transition: `opacity 0→1` + `y: 12 → 0` over ~250ms, ease-out. Exit: opposite, slightly faster (~180ms).
- The alert banner stays only on Overview (it's the contextual home view).

## Technical notes

- All changes in `src/pages/Dashboard.tsx`.
- Extract the current Overview body into a `<OverviewPanel />` local component, add `<EnergyPanel />`, `<ClimatePanel />`, `<ActivityPanel />` siblings — all in the same file, reusing existing `StatCard`, `PowerRunwayCard`, `Sparkline`, magnetic-hover wrapper, and `liquid-glass` styling. No new files, no new deps.
- Mock data lives inline; live ticking (solar/battery/wind interval) keeps running so values stay fresh across tabs.
