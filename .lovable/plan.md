Remove the duplicate "Log in" button from the navigation bar.

- In `src/components/Nav.tsx`, the right-side auth area currently shows two identical buttons:
  - "Sign in" (liquid-glass)
  - "Log in" (white filled)
  Both call `openLogin()`.

- The rest of the app uses "Sign in" consistently (dialog title, submit button, "Sign out" counterpart).

- Change: remove the "Log in" button and keep only the "Sign in" button. No other files affected.

Result: a single, consistent "Sign in" button in the nav when the user is not authenticated.