## Goal
After the user answers all 5 onboarding questions, take them straight to the Worlds page, and update the top-right nav button to show a "Signed in" state instead of "Sign in".

## Changes

### 1. `src/components/OnboardingFlow.tsx` — force redirect to Worlds
On the final step's `goNext`:
- Call `completeOnboarding()`
- Reset local state (`stepIdx`, `answers`)
- Clear any `_pendingSuccess` callback (so a stale Discover callback can't override the destination)
- Always `navigate("/configurator")` — no conditional fallback

This guarantees Question 5 → Worlds, every time.

### 2. `src/components/Nav.tsx` — "Signed in" button when authenticated
Replace the current signed-in state (which shows "Sign out") with a single pill labeled **"Signed in"**:
- Style: same liquid-glass rounded pill as today, with a small status dot (e.g. a 6px emerald circle) before the label to make the state obvious.
- Clicking it calls `signOut()` (keep the existing action so users can still sign out — only the label and visual change).
- Unauthenticated state keeps the current white "Sign in" button untouched.

No other files affected. No auth/business-logic changes — purely flow + label.

## Result
Voyages → Configure → Sign In → Q1–Q5 → **Worlds** (immediate), with the nav reflecting "Signed in" once authenticated.
