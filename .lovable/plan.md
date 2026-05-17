# Full-Screen Sign-In Layout

Replace the current small centered dialog in `src/components/LoginDialog.tsx` with an immersive full-viewport authentication experience that matches the site's dark futuristic aesthetic (same palette as VoyageScene / Discover: `#01030f` base, `#020618` overlay, liquid-glass panels, heading font, white/10 borders).

## Structure

```text
┌─────────────────────────────────────────────────────┐
│  [VoyageScene backdrop + dark overlay, fixed]       │
│                                                     │
│   ┌─────────────── max-w-[1100px] ──────────────┐   │
│   │  LEFT (hidden md+ split)   │  RIGHT FORM    │   │
│   │  • // Access               │  large inputs  │   │
│   │  • Big blurred headline    │  email         │   │
│   │  • Tagline copy            │  password      │   │
│   │  • Small feature bullets   │  Sign in btn   │   │
│   │                            │  divider       │   │
│   │                            │  helper text   │   │
│   └────────────────────────────┴────────────────┘   │
│                              [close X top-right]    │
└─────────────────────────────────────────────────────┘
```

- Mobile: single column, form only, copy collapses above.
- Desktop (md+): two-column split inside a large rounded liquid-glass card.

## Implementation details

- Keep using Radix `Dialog` (preserves a11y + existing `MockAuth` open/close wiring) but restyle `DialogContent`:
  - Remove `sm:max-w-lg`, `rounded-3xl`, `p-10`.
  - New classes: `max-w-none w-screen h-screen sm:rounded-none border-0 bg-transparent p-0 translate-x-0 translate-y-0 left-0 top-0 grid-cols-1`.
  - Override the default centered translate by setting `left-0 top-0` + removing translate utilities (use `!` modifier where needed to beat the base component classes).
- Inside, render a fixed full-screen container:
  - Layer 1: reuse `<VoyageScene className="fixed inset-0 -z-10 opacity-70" />` for visual continuity with Discover.
  - Layer 2: `bg-[#01030f]/85` overlay.
  - Layer 3: centered `flex items-center justify-center min-h-screen px-6`.
- Inner card: `liquid-glass rounded-[2rem] border border-white/10 w-full max-w-[1100px] grid md:grid-cols-2 overflow-hidden`.
  - Left pane (`hidden md:flex flex-col justify-between p-12`):
    - Eyebrow `// Access` (font-body, white/70).
    - `BlurText` headline: "Sign in to claim a parcel." (font-heading, ~5xl, `tracking-[-2px]`).
    - Subcopy paragraph (white/70).
    - Footer row with three muted bullets (e.g. "Live site telemetry", "Pre-cleared parcels", "Configurable engines").
  - Right pane (`p-10 md:p-14 flex flex-col justify-center gap-6`):
    - `DialogTitle` + `DialogDescription` (kept for a11y; visually shown here).
    - Form, larger spacing: inputs `h-12 text-base bg-white/5 border-white/15`.
    - Primary button full-width, `h-12 rounded-full bg-white text-black`.
    - Error line preserved.
    - Helper line: "No account? It's mocked — any email + password works." (matches existing MockAuth behavior).
- Close button: keep Radix's built-in `DialogPrimitive.Close` styling via the existing X (already in `ui/dialog.tsx`), but reposition to `top-6 right-6` and enlarge for full-screen context (override via wrapper or extra close button inside our content).
- Preserve all existing logic in `LoginDialog.tsx`: `handleSubmit`, `_pendingSuccess` callback, input validation, MockAuth integration. No changes to `MockAuth.tsx`, `Nav.tsx`, or routes.

## Aesthetic tokens (reuse, do not invent)

- Background: `#01030f`, overlay `#020618/85`.
- Glass: existing `liquid-glass` / `liquid-glass-strong` classes from `index.css`.
- Type: `font-heading` for title, `font-body` for everything else.
- Borders: `border-white/10` / `border-white/15`.
- Accent button: white pill on black text (matches Nav "Claim a Spot").

## Files touched

- `src/components/LoginDialog.tsx` — full rewrite of JSX/classes; logic unchanged.

No new dependencies. No backend or route changes.