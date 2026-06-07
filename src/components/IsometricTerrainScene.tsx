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

    // (ridges + horizon haze removed — terrain now covers full viewport)

    const drawIsoGround = () => {
      // True isometric lattice: two families of parallel lines at ±30° from
      // horizontal, filling the entire viewport.
      const drawFamily = (thetaDeg: number) => {
        const theta = (thetaDeg * Math.PI) / 180;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const px = -sin;
        const py = cos;

        const cx = w * 0.5;
        const cy = h * 0.5;
        const step = h * 0.055;
        const halfCount = 48;
        const L = Math.max(w, h) * 1.6;

        for (let i = -halfCount; i <= halfCount; i++) {
          const ax = cx + px * step * i;
          const ay = cy + py * step * i;

          const vertNorm = Math.min(1, Math.abs(ay - cy) / (h * 0.55));
          const horizNorm = Math.min(1, Math.abs(ax - cx) / (w * 0.55));
          const alpha = 0.14 * (1 - vertNorm * 0.5) * (1 - horizNorm * 0.55);
          if (alpha <= 0.01) continue;

          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(ax - cos * L, ay - sin * L);
          ctx.lineTo(ax + cos * L, ay + sin * L);
          ctx.stroke();
        }
      };

      drawFamily(-30);
      drawFamily(30);

      // Full-canvas radial vignette darkening toward edges
      const vign = ctx.createRadialGradient(
        w * 0.5, h * 0.55, Math.min(w, h) * 0.1,
        w * 0.5, h * 0.55, Math.max(w, h) * 0.75
      );
      vign.addColorStop(0, "rgba(1,3,15,0)");
      vign.addColorStop(1, "rgba(1,3,15,0.75)");
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, w, h);
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
