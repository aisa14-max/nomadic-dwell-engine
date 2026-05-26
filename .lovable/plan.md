Replace the dwelling image on the Worlds (`/configurator`) page with the uploaded PNG.

### Steps

1. Copy `user-uploads://image_2026-05-26_211156986.png` → `src/assets/dwelling-hero.png`.
2. In `src/pages/Configurator.tsx`, change the import on line 6 from `@/assets/skye-moor.jpg` to the new PNG. No other changes.
