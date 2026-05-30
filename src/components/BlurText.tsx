import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";

export default function BlurText({
  text,
  className = "",
  stepDuration = 0.35,
  delayPerWord = 100,
}: {
  text: string;
  className?: string;
  stepDuration?: number;
  delayPerWord?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { amount: 0.1, once: true });
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cursorX, setCursorX] = useState<number | null>(null);

  const words = text.split(" ");
  let globalLetterIndex = 0;

  const handleMove = useCallback((e: React.MouseEvent<HTMLParagraphElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setCursorX(e.clientX - rect.left);
  }, []);

  const RADIUS_FULL = 60;
  const RADIUS_FADE = 180;

  const getStyleForLetter = (idx: number) => {
    const el = letterRefs.current[idx];
    if (!el || cursorX === null) {
      return { color: "#ffffff", textShadow: "0 0 0px rgba(251,191,36,0)" };
    }
    const parentRect = ref.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const centerX = r.left - parentRect.left + r.width / 2;
    const dist = Math.abs(centerX - cursorX);
    let intensity = 0;
    if (dist <= RADIUS_FULL) intensity = 1;
    else if (dist >= RADIUS_FADE) intensity = 0;
    else intensity = 1 - (dist - RADIUS_FULL) / (RADIUS_FADE - RADIUS_FULL);

    // Blend white -> amber
    const r1 = 255, g1 = 255, b1 = 255;
    const r2 = 251, g2 = 191, b2 = 36;
    const cr = Math.round(r1 + (r2 - r1) * intensity);
    const cg = Math.round(g1 + (g2 - g1) * intensity);
    const cb = Math.round(b1 + (b2 - b1) * intensity);
    const glow = intensity * 0.95;
    const blur = 4 + intensity * 18;
    return {
      color: `rgb(${cr},${cg},${cb})`,
      textShadow: `0 0 ${blur}px rgba(251,191,36,${glow})`,
    };
  };

  return (
    <p
      ref={ref}
      className={className}
      onMouseMove={handleMove}
      onMouseLeave={() => setCursorX(null)}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        rowGap: "0.1em",
      }}
    >
      {words.map((w, wi) => (
        <motion.span
          key={wi}
          initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
          animate={
            inView
              ? {
                  filter: ["blur(10px)", "blur(5px)", "blur(0px)"],
                  opacity: [0, 0.5, 1],
                  y: [50, -5, 0],
                }
              : {}
          }
          transition={{
            duration: stepDuration * 2,
            times: [0, 0.5, 1],
            ease: "easeOut",
            delay: (wi * delayPerWord) / 1000,
          }}
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
