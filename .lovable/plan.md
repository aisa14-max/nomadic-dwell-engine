## Goal

Add a **mockup** login gate to the Configure flow. Browsing voyages stays public; pressing **Configure** on a site card prompts an email login, and after "signing in" the user proceeds to `/configurator`.

No backend, no Lovable Cloud auth, no persisted accounts — purely client-side state so the flow can be demoed.

## UX flow

1. User browses `/discover` freely (no change).
2. User clicks **Configure** on a site card.
   - If "logged in" → navigate to `/configurator` as today.
   - If not → open a login modal.
3. Login modal: email + password fields, single **Sign in** button. Any non-empty values succeed.
4. On success: modal closes, mock auth state flips to logged-in, user is sent to `/configurator`.
5. Nav shows a small **Sign out** affordance when logged in (so the gate can be re-tested).

## Implementation

**New: `src/context/MockAuth.tsx`**
- `MockAuthProvider` with `useState<{ email: string } | null>(null)`.
- Hook `useMockAuth()` exposes `user`, `signIn(email)`, `signOut()`.
- No persistence (refresh = logged out). This is explicitly a mockup.
- Wrap `<App />` children in `src/App.tsx` with the provider.

**New: `src/components/LoginDialog.tsx`**
- Built on existing shadcn `Dialog`.
- Controlled via `open` / `onOpenChange` props plus an `onSuccess` callback.
- Form: email + password inputs (shadcn `Input`), **Sign in** button. Validation: both fields non-empty.
- Submit calls `signIn(email)` then `onSuccess()`.
- Styled with existing `liquid-glass` tokens to match the dark Discover aesthetic.

**Edit: `src/pages/Discover.tsx`**
- Replace the `<Link to="/configurator">` Configure button with a `<button>` that:
  - If `user` exists → `navigate("/configurator")`.
  - Else → set local `pendingNavigate = "/configurator"` and open `LoginDialog`.
- Render one `LoginDialog` at page level; on success, navigate to the pending route.

**Edit: `src/components/Nav.tsx`** (light touch)
- When `user` is set, show a small "Sign out" text button. Otherwise nothing — login is contextual to the Configure action, not a global nav item.

## Out of scope

- Real authentication, Lovable Cloud, password reset, signup, social providers.
- Persisting login across reloads.
- Gating any route other than `/configurator` access from the Configure button (typing the URL directly still works — it's a mockup).
- Profile data, avatars, saved voyages.
