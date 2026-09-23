import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useEffect } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  // React Router doesn't reset scroll on navigation by itself — without
  // this, landing on a new page still shows wherever the PREVIOUS page had
  // scrolled to (e.g. scrolling to the bottom of Landing, then clicking
  // through to Discover, opened Discover already scrolled past its own top
  // bar). mode="wait" below means the old page fully exits before the new
  // one enters, so this runs in that gap and is never a visible jump.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="min-h-screen bg-black"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
