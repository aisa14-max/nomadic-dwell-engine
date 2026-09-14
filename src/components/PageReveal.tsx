import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import nomadicLogo from "@/assets/nomadic-logo.png";

const GRID = 3;
const TILE = 76; // px — size of one piece once assembled
const GRID_SIZE = GRID * TILE;
const START_RADIUS = 210;

// Deterministic scatter per piece so the layout doesn't reshuffle on re-render.
const TILTS = [-26, 16, -14, 28, -20, 12, -30, 22, -18];
// Piece 0 used to sit almost straight up, overlapping the title — moved into
// the empty gap on the left instead.
const ANGLE_JITTER = [255, 10, -8, 18, -20, 6, -12, 16, -6];
const RADIUS_JITTER = [-20, -25, 55, -40, 20, 60, -15, 35, -50];

type Piece = { id: number; row: number; col: number; angle: number; radius: number; tilt: number };

const PIECES: Piece[] = Array.from({ length: GRID * GRID }, (_, i) => ({
  id: i,
  row: Math.floor(i / GRID),
  col: i % GRID,
  angle: (360 / (GRID * GRID)) * i - 90 + ANGLE_JITTER[i],
  radius: START_RADIUS + RADIUS_JITTER[i],
  tilt: TILTS[i],
}));

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

export default function PageReveal({ onComplete }: { onComplete: () => void }) {
  const [placed, setPlaced] = useState<number[]>([]);
  const [exiting, setExiting] = useState(false);
  const total = PIECES.length;

  const layout = useMemo(
    () =>
      PIECES.map((p) => ({
        ...p,
        start: polar(p.angle, p.radius),
        target: { x: (p.col - 1) * TILE, y: (p.row - 1) * TILE },
      })),
    [],
  );

  const finish = (delay: number) => {
    setExiting(true);
    setTimeout(onComplete, delay);
  };

  const handlePlace = (id: number) => {
    if (placed.includes(id) || exiting) return;
    const next = [...placed, id];
    setPlaced(next);
    if (next.length === total) {
      setTimeout(() => finish(700), 500);
    }
  };

  const progress = placed.length / total;

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-[radial-gradient(ellipse_at_center,#0c1330_0%,#070b1f_45%,#03040d_100%)] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={exiting ? { opacity: 0, scale: 1.5, filter: "blur(16px)" } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Title floats near the top, independent of the grid's centering */}
      <div className="absolute top-24 md:top-28 left-1/2 -translate-x-1/2 px-6 text-center">
        <motion.h1
          className="font-heading italic text-white text-4xl md:text-5xl tracking-[-1px] text-center"
          animate={{
            textShadow:
              progress > 0
                ? `0 0 ${20 + progress * 30}px rgba(255,244,214,${0.15 + progress * 0.35})`
                : "0 0 0px rgba(255,244,214,0)",
          }}
          transition={{ duration: 0.4 }}
        >
          Nomadic Engine
        </motion.h1>
        <motion.p
          className="mt-3 text-sm uppercase tracking-[0.25em] text-white/50 font-body text-center"
          animate={{
            textShadow: [
              "0 0 6px rgba(255,244,214,0.15)",
              "0 0 16px rgba(255,244,214,0.5)",
              "0 0 6px rgba(255,244,214,0.15)",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          Click on the squares to assemble your dwelling
        </motion.p>
      </div>

      {/* Grid + pieces — centered on the page regardless of title height */}
      <div className="relative flex flex-col items-center px-6">
        <div
          className="relative max-w-[85vw] max-h-[85vw]"
          style={{ width: (START_RADIUS + 60) * 2 + TILE, height: (START_RADIUS + 60) * 2 + TILE }}
        >
          {/* target grid outline — shows where each piece slots in */}
          <div
            className="absolute left-1/2 top-1/2 grid pointer-events-none"
            style={{
              width: GRID_SIZE,
              height: GRID_SIZE,
              marginLeft: -GRID_SIZE / 2,
              marginTop: -GRID_SIZE / 2,
              gridTemplateColumns: `repeat(${GRID}, ${TILE}px)`,
              gridTemplateRows: `repeat(${GRID}, ${TILE}px)`,
            }}
          >
            {Array.from({ length: GRID * GRID }).map((_, i) => (
              <div key={i} className="border border-white/[0.03]" />
            ))}
          </div>

          {layout.map(({ id, row, col, tilt, start, target }) => {
            const isPlaced = placed.includes(id);
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => handlePlace(id)}
                aria-label={`Place logo piece ${id + 1}`}
                className={`liquid-glass absolute left-1/2 top-1/2 rounded-none overflow-hidden ${
                  isPlaced ? "cursor-default" : "cursor-pointer hover:bg-white/15"
                }`}
                style={{
                  width: TILE,
                  height: TILE,
                  marginLeft: -TILE / 2,
                  marginTop: -TILE / 2,
                  backgroundImage: `url(${nomadicLogo})`,
                  backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                  backgroundPosition: `${-col * TILE}px ${-row * TILE}px`,
                  backgroundRepeat: "no-repeat",
                }}
                initial={false}
                animate={
                  isPlaced
                    ? { x: target.x, y: target.y, rotate: 0, scale: 1 }
                    : { x: start.x, y: start.y, rotate: tilt, scale: 0.88 }
                }
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
              >
                {isPlaced && (
                  <span className="absolute inset-0 bg-[#fff4d6]/40 anim-part-flash pointer-events-none" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => finish(500)}
        className="absolute bottom-8 right-8 text-xs text-white/40 hover:text-white/70 font-body transition-colors"
      >
        Skip intro
      </button>
    </motion.div>
  );
}
