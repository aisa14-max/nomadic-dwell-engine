import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";

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
  const [glowKey, setGlowKey] = useState(0);
  const words = text.split(" ");

  // Global letter index across all words (for left-to-right ombre stagger)
  let globalLetterIndex = 0;

  return (
    <p
      ref={ref}
      className={className}
      onClick={() => setGlowKey((k) => k + 1)}
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        rowGap: "0.1em",
        cursor: "pointer",
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
            return (
              <motion.span
                key={`${glowKey}-${idx}`}
                initial={false}
                animate={{
                  color: ["#ffffff", "#fbbf24", "#ffffff"],
                  textShadow: [
                    "0 0 0px rgba(251,191,36,0)",
                    "0 0 18px rgba(251,191,36,0.95)",
                    "0 0 0px rgba(251,191,36,0)",
                  ],
                }}
                transition={{
                  duration: 0.28,
                  ease: "easeOut",
                  delay: idx * 0.022,
                }}
                style={{ display: "inline-block" }}
              >
                {ch}
              </motion.span>
            );
          })}
        </motion.span>
      ))}
    </p>
  );
}
