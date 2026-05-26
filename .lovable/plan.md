When the user clicks "Continue" on the "Congratulations, your Nomadic Engine is on its way." confirmation panel, navigate them to the Engine page (`/dashboard`) instead of resetting the customizer back to the configure stage.

Changes:
- In `src/components/worlds/ReservationCustomizer.tsx`, import `useNavigate` from `react-router-dom`.
- Replace the `onContinue` callback on `<EngineOnTheWayOverlay>` from `() => r.setStage("configure")` to `() => navigate("/dashboard")`.

No other files need to change. The overlay will still animate in and out as before; only the Continue button's destination changes.