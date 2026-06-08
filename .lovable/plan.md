# Engine Assistant polish + Configurator loading state

Scope: `src/pages/Configurator.tsx` plus one new asset. No backend changes.

## 1. Alien avatar asset

Generate `src/assets/engine-assistant-avatar.png` (transparent PNG, ~512×512) — a small, cute, friendly alien character. Modern, minimal, professional but approachable. Soft pastel/neutral palette so it sits well on the dark glass UI. Import it and reuse for:
- Header avatar (replacing current gradient dot)
- Left-side avatar next to every assistant message and next to the typing indicator

## 2. Typing indicator everywhere

Currently the typing indicator only shows during the intro. Extend it to every assistant response:
- Show the avatar + 3 bouncing dots row whenever `isStreaming` is true and the last assistant message is empty, OR during the intro `typing` phase.
- Dots disappear the instant the first character of the assistant message renders (intro) or the first streamed token arrives (chat). Use the existing transition; if the message has content, render text, otherwise render dots — no overlap.

## 3. Assistant message layout

Each assistant row becomes: `[avatar 28px] [text]` with `items-start gap-3`. User messages stay right-aligned pill, no avatar. This applies to the streamed intro, normal replies, and the typing-only row.

## 4. Intro flow (already implemented, keep)

Empty → 600ms delay → typing dots (now with avatar) → ~1.4s → stream greeting char-by-char → reveal chips with stagger. No change to the timing logic; just swap dot-only row for `avatar + dots` and assistant messages for `avatar + text`.

## 5. Configurator viewport loading state

The left "Site: Skye Moor" viewport currently shows the dwelling PNG immediately. Replace initial render with a loading state:
- New local state `engineReady: boolean`, false on mount.
- While `!engineReady`: render a centered column inside the existing glass viewport:
  - Animated loader — a thin circular spinner (lucide `Loader2` with `animate-spin`) plus a subtle pulsing radial glow behind it.
  - Caption text: "Preparing your Nomadic Engine..." in body font, white/80, with a faint shimmer.
  - Optional 3-step progress hint ("Calibrating modules · Aligning frame · Finalizing render") cycling every ~1s for life.
- After ~3.5s, set `engineReady = true`.
- Transition: cross-fade — loader fades/blurs out, the `autorotate` dwelling image fades + scales in (opacity 0→1, scale 0.96→1, blur 12px→0) over ~700ms using framer-motion + AnimatePresence.
- Top-right control cluster and "Site: Skye Moor" tag stay visible during loading (they're scene chrome).

## Technical notes

- Use `imagegen` (premium not required, fast tier is fine) to create the avatar with `transparent_background: true`.
- Keep all existing chat logic, streaming, suggestion send flow, edge function — untouched.
- One new import: the avatar PNG; one new icon: `Loader2` from lucide-react.
- No new dependencies.

## Out of scope

Reservation customizer overlay, stats strip, hero, routing, backend.
