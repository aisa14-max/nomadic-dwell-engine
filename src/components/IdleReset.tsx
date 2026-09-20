import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useMockAuth } from "@/context/MockAuth";
import { IDLE_RESET_MS } from "@/config/features";
import { restartApp } from "@/lib/restart";

// Scroll doesn't bubble, so everything is listened for in the capture phase.
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "wheel", "touchstart", "scroll"] as const;
const CHECK_EVERY_MS = 5000;

/**
 * Sends a walked-away-from app back to the start: after IDLE_RESET_MS with no
 * activity it wipes the session (same as going Home) and reloads onto the
 * home page's reveal puzzle. Renders nothing.
 */
export default function IdleReset() {
  const { signOut } = useMockAuth();
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  useEffect(() => {
    if (!IDLE_RESET_MS) return;
    let lastActive = Date.now();
    const markActive = () => { lastActive = Date.now(); };
    for (const type of ACTIVITY_EVENTS) window.addEventListener(type, markActive, { passive: true, capture: true });

    const timer = window.setInterval(() => {
      if (Date.now() - lastActive < IDLE_RESET_MS) return;
      lastActive = Date.now();
      // Already sitting on the un-solved puzzle: nothing to reset.
      const onPuzzle = pathRef.current === "/" && sessionStorage.getItem("homeRevealed") !== "1";
      if (onPuzzle) return;
      restartApp(signOut);
    }, CHECK_EVERY_MS);

    return () => {
      window.clearInterval(timer);
      for (const type of ACTIVITY_EVENTS) window.removeEventListener(type, markActive, { capture: true });
    };
  }, [signOut]);

  return null;
}
