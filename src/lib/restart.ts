/**
 * Puts the whole app back to the very beginning, as for a brand-new visitor:
 * wipes the saved session and reloads onto the home page's puzzle. Used by the
 * Start over button and by the idle timeout.
 */
export function restartApp(signOut: () => void) {
  signOut();
  try { sessionStorage.clear(); } catch { /* ignore */ }
  window.location.replace("/");
}
