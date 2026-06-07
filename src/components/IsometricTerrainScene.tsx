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
      // True two-axis isometric ground grid. Two off-screen vanishing points
      // sit roughly on the horizon to the left and right, producing the
      // classic iso "diamond" lattice rather than a one-point perspective.
      const horizonY = 0.6 * h;
      const groundBottom = h;

      ctx.save();

      // Slight shear to match the dwelling's -12° ground rotation.
      // Pivot around bottom-center so the grid still fills the frame.
      const pivotX = w * 0.5;
      const pivotY = groundBottom;
      const angle = (-12 * Math.PI) / 180;
      ctx.translate(pivotX, pivotY);
      ctx.rotate(angle);
      ctx.translate(-pivotX, -pivotY);

      // Vanishing points (off-canvas, near the horizon)
      const vpA = { x: -w * 0.6, y: horizonY };   // upper-left
      const vpB = { x: w * 1.6,  y: horizonY };   // upper-right

      const linesPerAxis = 22;
      // Spread bottom anchor points across a wider-than-canvas band so the
      // grid still covers the frame after the rotation.
      const spread = w * 1.8;
      const startX = w * 0.5 - spread * 0.5;

      const drawConverging = (vp: { x: number; y: number }) => {
        for (let i = 0; i <= linesPerAxis; i++) {
          const t = i / linesPerAxis;
          const xBottom = startX + t * spread;
          // distance from canvas center for alpha falloff
          const distNorm = Math.min(1, Math.abs(xBottom - w * 0.5) / (w * 0.55));
          const alpha = 0.1 * (1 - distNorm * 0.55);
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(xBottom, groundBottom + 40);
          ctx.lineTo(vp.x, vp.y);
          ctx.stroke();
        }
      };

      drawConverging(vpA);
      drawConverging(vpB);

      ctx.restore();

      // Soft fade overlay on the ground to dim distant grid (drawn after
      // restore so it stays axis-aligned with the canvas)
      const fade = ctx.createLinearGradient(0, horizonY, 0, groundBottom);
      fade.addColorStop(0, "rgba(1,3,15,0.9)");
      fade.addColorStop(0.35, "rgba(1,3,15,0.25)");
      fade.addColorStop(1, "rgba(1,3,15,0.55)");
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
