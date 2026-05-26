## Root cause

In `LoginDialog.handleSubmit`, after a successful sign-in the dialog immediately fires the `pendingSuccess` callback that `Discover.handleConfigure` registered with `openLogin(() => navigate("/configurator"))`. At the same time, `MockAuth.signIn` opens the onboarding modal. The result: onboarding mounts, but the navigation to `/configurator` (Worlds) fires on the same tick, unmounting the onboarding flow as soon as the user clicks the first answer (the click lands during the re-render/transition, and the page is already Worlds).

There is also no route protection — `/configurator` is reachable directly even when onboarding hasn't completed.

## Fix

1. **Defer the post-login callback until onboarding completes.**
   - In `src/context/MockAuth.tsx`:
     - Rename the intent of `_pendingSuccess` from "fire on login close" to "fire on onboarding complete".
     - Add an `onboardingComplete: boolean` state (default `false`, reset to `false` on `signIn`, set to `true` via a new `completeOnboarding()` action).
     - Expose `completeOnboarding()` and keep `closeOnboarding()` available for the cancel/escape path (which should NOT fire the pending callback and should NOT mark onboarding complete).
   - In `src/components/LoginDialog.tsx` `handleSubmit`: call `signIn(email)` and `closeLogin()`, but **do not** call `cb?.()` and **do not** clear `_pendingSuccess`. The pending callback now belongs to the onboarding flow.
   - In `src/components/OnboardingFlow.tsx`:
     - On the last step's "See my proposal" click: call `completeOnboarding()` (which internally closes the modal, marks complete, consumes `_pendingSuccess`), then if no pending callback was set, fall back to `navigate("/configurator")`.
     - On back-out / Escape (existing `handleOpenChange(false)` path): just close, do not navigate, do not consume callback.

2. **Protect Worlds (and Engine) routes.**
   - Add a small `RequireOnboarding` wrapper in `src/App.tsx` (or a new `src/components/RequireOnboarding.tsx`) that reads `user` and `onboardingComplete` from `useMockAuth`:
     - If no `user`: redirect to `/discover` and call `openLogin(() => navigate(targetPath))` so completing login+onboarding lands them back on Worlds.
     - If `user` but `!onboardingComplete`: redirect to `/discover` and reopen the onboarding modal via a new `openOnboarding()` action on `MockAuth`.
   - Wrap `<Route path="/configurator">` and `<Route path="/dashboard">` with `RequireOnboarding`.

3. **Sign-in UI state is already correct.** `Nav.tsx` already swaps the Sign in / Log in buttons for a "Sign out" pill as soon as `user` is set by `signIn`. No change needed there. Verify by clicking sign-in and confirming the nav updates before the onboarding modal interaction.

## Resulting flow

Voyages → click Configure (not signed in) → Sign In dialog → submit → Onboarding Q1 → Q2 → Q3 → Q4 → Q5 → "See my proposal" → Worlds (`/configurator`). Direct navigation to `/configurator` or `/dashboard` while not signed in or mid-onboarding bounces back to `/discover` and reopens the appropriate modal.

## Files touched

- `src/context/MockAuth.tsx` — add `onboardingComplete`, `completeOnboarding`, `openOnboarding`; reset on `signIn`; keep `_pendingSuccess` until onboarding finishes.
- `src/components/LoginDialog.tsx` — stop firing `_pendingSuccess` on login submit.
- `src/components/OnboardingFlow.tsx` — on final step, call `completeOnboarding()` and run pending callback (fallback navigate).
- `src/App.tsx` (+ new `src/components/RequireOnboarding.tsx`) — guard `/configurator` and `/dashboard`.