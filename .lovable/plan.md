# Add "Engine on its way" congratulations panel

After the user clicks **Pay & Confirm** on the Payment panel, show a new full-screen confirmation panel with the message:

> "Congratulations, your Nomadic Engine is on its way."

This replaces the current `ConfirmedOverlay` ("Welcome home.") as the post-payment screen, matching the simpler tone the user asked for.

## Changes

**`src/components/worlds/ReservationCustomizer.tsx`**
- Swap the `<ConfirmedOverlay />` render in the `r.stage === "confirmed"` branch for a new `<EngineOnTheWayOverlay />` component.

**`src/components/worlds/EngineOnTheWayOverlay.tsx`** (new)
- Full-screen overlay matching existing glassmorphism style (`liquid-glass`, dark backdrop blur, framer-motion fade/scale in).
- Centered card containing:
  - Small check / sparkle icon in a translucent circle.
  - Heading (font-heading, large): "Congratulations,"
  - Subheading line: "your Nomadic Engine is on its way."
  - Short supporting line: reservation reference + total (reuse props from current overlay so we keep the receipt info).
  - Two buttons: "Download receipt" (placeholder) and "Continue" → calls `onContinue` to return to configure stage (same behavior as today).
- Props mirror `ConfirmedOverlay`: `reservationRef`, `colors`, `total`, `onContinue`.

## Notes
- Keep the existing `NightSkyScene` background visible behind the overlay (overlay uses `bg-black/70` like the current one).
- No backend or payment logic changes — purely a presentation swap on the final stage.
- `ConfirmedOverlay.tsx` can be left in the codebase unused, or deleted. Recommend deleting to avoid drift.
