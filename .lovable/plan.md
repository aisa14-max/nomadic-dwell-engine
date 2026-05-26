# Fix: onboarding interrupted by redirect to Worlds

## Root cause

On the Voyages page, clicking **Configure** while signed out calls:

```ts
openLogin(() => navigate("/configurator"))
```

After the user signs in, two things happen at once:

1. `signIn()` opens the onboarding dialog (`setOnboardingOpen(true)` in `MockAuth`).
2. The `pendingSuccess` callback fires `navigate("/configurator")` — this jumps the underlying route to the Worlds page while the onboarding modal is still mounted on top.

`OnboardingFlow` already handles its own navigation: on the last question's **See my proposal**, it closes itself and calls `navigate("/configurator")`. So the post-login callback is redundant and is what causes the premature jump to Worlds.

## Change

**File: `src/pages/Discover.tsx`** — drop the post-login navigation; let onboarding finish first.

```ts
const handleConfigure = () => {
  if (user) navigate("/configurator");
  else openLogin(); // onboarding modal opens on sign-in; it navigates to /configurator at the end
};
```

No other files need changes:
- `MockAuth.signIn` already opens onboarding.
- `OnboardingFlow.goNext` already routes to `/configurator` after the 5th question.
- `LoginDialog` already handles the `pendingSuccess` cleanly when it's null.

## Result

- Sign in → land on Question 1 of onboarding.
- Answer all 5 questions → on **See my proposal**, modal closes and the app navigates to Worlds (`/configurator`).
- No mid-onboarding redirect.
