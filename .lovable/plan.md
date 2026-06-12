# Engine dashboard — tactile interactivity

Going with the **Tactile micro-interactions** direction. Keeps the existing dark glass layout and italic serif numerals intact, layers in physical-feeling hover/drag/scrub responses across the page.

## What changes

**Stat cards (Solar / Power runway / Wind)**
- Magnetic pointer pull: card tilts/translates ~6px toward cursor on hover, springs back on leave.
- Ring arc gains a soft white drop-shadow glow on hover.
- Click → quick "press" scale (0.98) with inset shadow flash.

**24h energy balance sparkline**
- Add a hover scrubber: a vertical tracking line + glowing dot follows the cursor along the curve.
- Tooltip pill above the dot shows the hovered hour + kW value (mocked).
- Fades in on enter, out on leave.

**Internal climate stat tiles (Temp / Humidity / AQI / Occupied)**
- Hover lifts the icon chip and brightens the number; tiny number tick re-runs the entrance tween.

**Alert banner**
- Hover brightens the border to amber; Resolve button gets active-press scale + inset shadow.

**Engine assistant**
- Buttons get tactile press: active scale 0.98 + inset shadow on "Review schedule"; primary "Initiate relocation" gains a soft white glow on hover and an arrow that nudges right.
- Module rows: hovered row brightens label and turns the OK chip emerald.

**Tabs**
- Add a sliding pill indicator that springs between tabs on click (Motion `layoutId`).

## Technical notes

- All work in `src/pages/Dashboard.tsx` plus a small keyframe/utility additions in `src/index.css`.
- Use existing `framer-motion` (already imported) for spring tweens and `layoutId` on the tab pill.
- Magnetic pull = `onMouseMove` reading bounding rect, mapping to a `motion` x/y with spring config `{ stiffness: 150, damping: 15 }`.
- Sparkline scrubber: track `mousemove` on the SVG, project x onto the sampled points array to find nearest y; render a `<line>` + `<circle>` + foreignObject tooltip.
- No layout changes, no color theme change, no new pages. Card backgrounds stay as-is.
