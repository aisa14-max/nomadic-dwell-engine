/**
 * The Engine page (`pages/Dashboard.tsx`, route `/engine`) is built but hidden
 * from visitors for now. Set this to `true` to bring it back: it restores the
 * nav link (desktop + mobile), the route, and the order-panel copy that mentions it.
 */
export const ENGINE_PAGE_ENABLED = false;

/** Where the hidden Engine URLs (/engine, /dashboard) send visitors instead. */
export const ENGINE_REDIRECT: { to: string; state?: { tab: string } } = ENGINE_PAGE_ENABLED
  ? { to: "/engine" }
  : { to: "/profile", state: { tab: "Orders" } };

/**
 * After this long with no mouse, touch, keyboard or scroll activity the whole app
 * resets and reloads onto the home page's build-the-engine reveal, as if a new
 * visitor had arrived. Set to 0 to turn the idle reset off.
 */
export const IDLE_RESET_MS = 5 * 60 * 1000;
