# Engine Assistant chat redesign

Scope: only the right-hand `<motion.aside>` in `src/pages/Configurator.tsx`. Backend (`supabase/functions/engine-chat`) and other components stay untouched.

## Intro sequence (on tab mount)

1. Empty transcript, no chips, no greeting.
2. After ~600 ms delay, show a typing indicator bubble (animated dots) on its own row — assistant "is typing".
3. After ~1.4 s of typing, replace the dots with the greeting message, then stream it in character-by-character (~18 ms/char) to feel like real typing:
   > "Hi, I'm your Engine Assistant 👋 Do you want to make any changes to your Nomadic Engine?"
4. Once the full text lands, fade + slide-up the action chips below the message (stagger ~60 ms each).

If the user types/sends before the intro finishes, skip remaining animation and reveal chips immediately.

## Action chips

Replace the current 6 suggestions with engine-customization-flavored options:
- Change Layout
- Modify Components
- Adjust Settings
- Add Features
- Materials & Finish
- Something else

Clicking a chip sends it as a user message through the existing `send()` streaming flow (already wired to the edge function). Chips hide after first send, exactly like today.

## Visual refresh — cleaner modern chatbot

Stay on the dark base but lighten the chat surface:

- Aside container: keep `liquid-glass` outer card but increase padding (`p-6`), thinner header, add subtle 1px divider under header.
- Header: small gradient avatar dot + "Engine Assistant" + tiny muted "online" caption underneath.
- Transcript: remove heavy bubbles for assistant — assistant messages render as plain text on the glass surface with generous line-height (`leading-relaxed`, `text-white/90`), no border, no background. Only user messages keep a filled pill (`bg-white text-black rounded-2xl px-4 py-2`, right-aligned, max-w 85%).
- Spacing: `space-y-5` between turns, comfortable left padding on assistant rows aligned with avatar.
- Typing indicator: three small dots in a row (no bubble), `text-white/50`, gentle bounce.
- Chips: pill-shaped (`rounded-full`), subtle white/8 background, thin white/15 border, hover lifts to white/15 with soft glow. Wrap as a flex row, not a strict grid, so they read as conversational suggestions.
- Composer: keep the rounded glass input + circular send button, slightly larger (h-11), refine placeholder to "Message Engine Assistant…".

## Technical notes

- All animation done with framer-motion + a couple of `setTimeout`s inside a single `useEffect`; cleanup on unmount.
- New local state: `phase: "idle" | "typing" | "streaming-intro" | "ready"`, `introText: string` (progressively built), `chipsVisible: boolean`.
- The existing `useEffect` that seeds the greeting and `showSuggestions` flag is replaced by the new intro sequencer.
- Suggestions list updated to the 6 options above; chip onClick continues to call `send(label)`.
- No changes to `messages` shape, `send()`, streaming logic, scroll behavior, or props.
- No new dependencies.

## Out of scope

- Configurator viewport, stats strip, hero, reservation customizer overlay, edge function, routing.
