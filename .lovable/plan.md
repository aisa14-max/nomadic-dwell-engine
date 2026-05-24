## Changes

**1. `src/pages/Configurator.tsx`**
- Remove the "Save draft" button from the header actions row. Keep only the "Continue configuration" button.

**2. `src/components/worlds/ReservationCustomizer.tsx`**
- Keep the top Nav bar visible when the customizer opens (currently the full-screen `fixed inset-0 z-50` black overlay covers it).
- Lower the overlay's z-index below the Nav (Nav is `z-50`) — use `z-40` on the customizer root, and adjust its inner controls (close button, parts strip, reserve card, summary/payment) so they still layer correctly under the Nav but above the page.
- Pad the customizer top content (the close `X` and the Reserve card) down so they don't collide with the floating Nav pill (~`top-24` instead of `top-4` / `top-6`).
- The Nav already shows "Worlds" as active because the route stays `/configurator`, so no Nav changes are needed.

No business logic changes; visuals/layout only.