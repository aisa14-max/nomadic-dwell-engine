## Sequence chat intro after engine loader

Currently in `src/pages/Configurator.tsx`, the chat intro timers (typing dots at 600ms, greeting stream at 2000ms) run in parallel with the engine `engineReady` loader (3500ms). The chat starts typing while "Preparing your Nomadic Engine..." is still on screen.

### Change

Gate the chat intro effect on `engineReady`:

1. Change the intro `useEffect` dependency from `[]` to `[engineReady]`, and early-return when `!engineReady`.
2. Once `engineReady` flips to true (after the 3.5s loader and cross-fade to the dwelling PNG), start the existing timing: 600ms → typing dots → ~1.4s → stream greeting char-by-char → reveal chips.
3. Keep the chat panel visible but empty (no avatar+dots, no greeting) while the engine is still loading. `introPhase` stays `"idle"` and `messages` stays `[]`, which already renders nothing in the scroll area.

### Optional polish

Add a tiny extra delay (~400ms) after `engineReady` becomes true before the first typing dots, so the engine reveal animation (0.8s fade/scale/blur) visually settles before the assistant starts. Net first-dot timing = engine reveal done + 600ms.

### Out of scope

No changes to loader duration, greeting text, suggestion chips, streaming logic, or layout.
