import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

export default function BlurText({
  text,
  className = "",
  stepDuration = 0.35,
  delayPerWord = 100,
  enableSweep = false,
}: {
  text: string;
  className?: string;
  stepDuration?: number;
  delayPerWord?: number;
  enableSweep?: boolean;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { amount: 0.1, once: true });
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [sweepIdx, setSweepIdx] = useState<number | null>(null);

  const words = text.split(" ");
  const totalLetters = text.replace(/ /g, "").length;

  // Sweep by letter index so it follows reading order: line 1 first, then line 2
  useEffect(() => {
    if (!inView || !enableSweep) return;

    const sweepTimer = setTimeout(() => {
      const SWEEP_DURATION = 4000;
      const start = performance.now();
      let raf: number;

      const tick = (now: number) => {
        const t = Math.min((now - start) / SWEEP_DURATION, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        setSweepIdx(eased * (totalLetters + 8) - 4);
        if (t < 1) {
          raf = requestAnimationFrame(tick);
        } else {
          setSweepIdx(null);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }, 200);

    return () => clearTimeout(sweepTimer);
  }, [inView, enableSweep, totalLetters]);

  const RADIUS_FULL = 1.5;
  const RADIUS_FADE = 8;

  const getStyleForLetter = (idx: number) => {
    if (sweepIdx === null) {
      return { color: "#ffffff", textShadow: "none" };
    }
    const dist = Math.abs(idx - sweepIdx);
    let linear = 0;
    if (dist <= RADIUS_FULL) linear = 1;
    else if (dist >= RADIUS_FADE) linear = 0;
    else linear = 1 - (dist - RADIUS_FULL) / (RADIUS_FADE - RADIUS_FULL);
    const intensity = 1 - (1 - linear) * (1 - linear);

    const blend = intensity * 0.75;
    const cr = Math.round(255 + (245 - 255) * blend);
    const cg = Math.round(255 + (200 - 255) * blend);
    const cb = Math.round(255 + (130 - 255) * blend);

    return {
      color: `rgb(${cr},${cg},${cb})`,
      textShadow: `0 0 ${intensity * 18}px rgba(245,200,130,${intensity * 0.6}), 0 0 30px rgba(245,200,130,${intensity * 0.28})`,
    };
  };

  let globalLetterIndex = 0;

  return (
    <p
      ref={ref}
      className={className}
      style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", rowGap: "0.1em" }}
    >
      {words.map((w, wi) => (
        <motion.span
          key={wi}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={
            inView
              ? { filter: ["blur(10px)", "blur(5px)", "blur(0px)"], opacity: [0, 0.5, 1], y: [50, -5, 0] }
              : {}
          }
          transition={{ duration: stepDuration * 2, times: [0, 0.5, 1], ease: "easeOut", delay: (wi * delayPerWord) / 1000 }}
          style={{ display: "inline-block", marginRight: "0.28em", whiteSpace: "nowrap" }}
        >
          {w.split("").map((ch) => {
            const idx = globalLetterIndex++;
            const s = getStyleForLetter(idx);
            return (
              <span
                key={idx}
                ref={(el) => (letterRefs.current[idx] = el)}
                style={{
                  display: "inline-block",
                  color: s.color,
                  textShadow: s.textShadow,
                  transition: "color 180ms ease-out, text-shadow 180ms ease-out",
                }}
              >
                {ch}
              </span>
            );
          })}
        </motion.span>
      ))}
    </p>
  );
}
