import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode, useEffect, useRef, useState } from "react";

const darkRoutes = ["/configurator", "/dashboard", "/booking", "/plan"];
const isDark = (path: string) => darkRoutes.some((r) => path.startsWith(r));

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const prevPath = useRef(location.pathname);
  const [sweeping, setSweeping] = useState(false);

  useEffect(() => {
    const wasDark = isDark(prevPath.current);
    const nowDark = isDark(location.pathname);
    if (wasDark !== nowDark) {
      setSweeping(true);
      const t = setTimeout(() => setSweeping(false), 700);
      return () => clearTimeout(t);
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const dark = isDark(location.pathname);

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: dark ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dark ? 0.2 : 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={dark ? "surface-dark min-h-screen" : "min-h-screen"}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {sweeping && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 100%)" }}
            animate={{ clipPath: "circle(150% at 100% 100%)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{ background: "#0F0F0D" }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
