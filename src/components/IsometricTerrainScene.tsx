import { useEffect, useRef } from "react";

type Props = { className?: string };

/**
 * Isometric terrain backdrop — distant ridge silhouette + perspective ground
 * grid + warm under-glow. Designed to sit behind the isometric dwelling render
 * in the reservation customizer.
 */
export default function IsometricTerrainScene({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Distant ridge points
    const makeRidge = (seed: number, amp: number, freq: number) => {
      const pts: number[] = [];
      const N = 400;
      for (let i = 0; i <= N; i++) {
        const x = i / N;
        const v =
          Math.sin(x * freq + seed) * 0.5 +
          Math.sin(x * freq * 2.3 + seed * 1.7) * 0.3 +
          Math.sin(x * freq * 5.1 + seed * 2.9) * 0.2;
        pts.push(v * amp);
      }
      return pts;
    };

    const ridges = [
      { pts: makeRidge(2.1, 0.06, 7),  baseY: 0.58, alpha: 0.35, speed: 0.0008 },
      { pts: makeRidge(5.6, 0.09, 10), baseY: 0.63, alpha: 0.55, speed: 0.0016 },
    ];

    const drawRidge = (r: typeof ridges[number], t: number) => {
      const N = r.pts.length - 1;
      const offset = (t * r.speed) % 1;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const idx = (i + Math.floor(offset * N)) % N;
        const y = r.baseY * h + r.pts[idx] * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, r.baseY * h - 40, 0, h);
      g.addColorStop(0, `rgba(20,28,52,${r.alpha * 0.5})`);
      g.addColorStop(1, `rgba(2,4,12,${r.alpha})`);
      ctx.fillStyle = g;
      ctx.fill();

      // Crisp ridge edge
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const idx = (i + Math.floor(offset * N)) % N;
        const y = r.baseY * h + r.pts[idx] * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha * 0.25})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    const drawHorizonHaze = () => {
      const horizon = 0.6 * h;
      const g = ctx.createLinearGradient(0, horizon - 60, 0, horizon + 30);
      g.addColorStop(0, "rgba(232,180,100,0)");
      g.addColorStop(0.6, "rgba(232,180,100,0.06)");
      g.addColorStop(1, "rgba(232,180,100,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, horizon - 60, w, 90);
    };

    const drawIsoGround = () => {
      // Perspective grid radiating from a vanishing point near horizon center.
      // Lines fade as they recede and as they go off to the sides.
      const horizonY = 0.62 * h;
      const vpX = w * 0.5;
      const groundBottom = h;

      ctx.save();

      // Horizontal grid lines (parallel to horizon, spaced via perspective)
      const rows = 14;
      for (let i = 1; i <= rows; i++) {
        // non-linear spacing for perspective
        const t = i / rows;
        const y = horizonY + (groundBottom - horizonY) * Math.pow(t, 1.6);
        const alpha = 0.05 + 0.08 * t;
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Radial lines converging to vanishing point
      const cols = 22;
      for (let i = -cols; i <= cols; i++) {
        const xOffset = (i / cols) * w * 1.2;
        const xBottom = vpX + xOffset;
        const distNorm = Math.min(1, Math.abs(i) / cols);
        const alpha = 0.12 * (1 - distNorm * 0.7);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(vpX, horizonY);
        ctx.lineTo(xBottom, groundBottom);
        ctx.stroke();
      }

      // Soft fade overlay on the ground to dim distant grid
      const fade = ctx.createLinearGradient(0, horizonY, 0, groundBottom);
      fade.addColorStop(0, "rgba(1,3,15,0.85)");
      fade.addColorStop(0.4, "rgba(1,3,15,0.25)");
      fade.addColorStop(1, "rgba(1,3,15,0.6)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, horizonY, w, groundBottom - horizonY);

      // Side vignette to keep focus center
      const side = ctx.createRadialGradient(
        w * 0.5, h * 0.75, Math.min(w, h) * 0.15,
        w * 0.5, h * 0.75, Math.max(w, h) * 0.7
      );
      side.addColorStop(0, "rgba(0,0,0,0)");
      side.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = side;
      ctx.fillRect(0, horizonY - 20, w, groundBottom - horizonY + 20);

      ctx.restore();
    };

    const drawUnderGlow = () => {
      const cx = w * 0.5;
      const cy = h * 0.78;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.45);
      g.addColorStop(0, "rgba(232,180,100,0.16)");
      g.addColorStop(0.5, "rgba(232,180,100,0.05)");
      g.addColorStop(1, "rgba(232,180,100,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, h * 0.45, w, h * 0.55);
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      drawHorizonHaze();
      for (const r of ridges) drawRidge(r, now);
      drawIsoGround();
      drawUnderGlow();
      raf = requestAnimationFrame(tick);
    };

    resize();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
