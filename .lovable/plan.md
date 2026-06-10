Replace the Engine Assistant avatar image with the generated "Core" option and verify it renders clearly in the chat UI.

1. **Swap asset file** — Copy `/mnt/documents/engine-assistant-v1.png` (the "Core" option) over `src/assets/engine-assistant-avatar.png`. The new image is a 512x512 transparent PNG abstract geometric intelligence node.

2. **Verify usage sites** — The avatar is imported in `src/pages/Configurator.tsx` and rendered at:
   - Header: 36x36 (`w-full h-full` inside a 36px container)
   - Chat assistant messages: 28x28 (`w-7 h-7`)
   The user wants visual verification at 32px and 48px sizes in the chat UI.

3. **Visual check** — Take a preview screenshot of the Configurator chat panel to confirm the new avatar reads clearly, has good contrast against the dark glass UI, and the transparent PNG edges look clean at small sizes.

No code changes required beyond the asset replacement — the existing `import assistantAvatar` path stays the same.