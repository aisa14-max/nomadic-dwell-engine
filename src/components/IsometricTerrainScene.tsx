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
      // horizontal, matching the standard iso x/y axes of the dwelling.
      const horizonY = 0.6 * h;
      const groundBottom = h;
      const bandH = groundBottom - horizonY;

      ctx.save();
      // Clip to the ground band so rotated lines don't bleed into the sky.
      ctx.beginPath();
      ctx.rect(0, horizonY, w, bandH);
      ctx.clip();

      const drawFamily = (thetaDeg: number) => {
        const theta = (thetaDeg * Math.PI) / 180;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        // Perpendicular direction for stepping between parallel lines
        const px = -sin;
        const py = cos;

        const cx = w * 0.5;
        const cy = horizonY + bandH * 0.55;
        const step = h * 0.055;
        const halfCount = 28;
        const L = Math.max(w, h) * 1.6; // line half-length

        for (let i = -halfCount; i <= halfCount; i++) {
          const ax = cx + px * step * i;
          const ay = cy + py * step * i;

          // Alpha falloff: dim toward horizon (top of band) and toward edges.
          const vertNorm = Math.min(1, Math.abs(ay - cy) / (bandH * 0.6));
          const horizNorm = Math.min(1, Math.abs(ax - cx) / (w * 0.55));
          const alpha = 0.14 * (1 - vertNorm * 0.55) * (1 - horizNorm * 0.6);
          if (alpha <= 0.01) continue;

          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(ax - cos * L, ay - sin * L);
          ctx.lineTo(ax + cos * L, ay + sin * L);
          ctx.stroke();
        }
      };

      // +30° rising left→right, and -30° falling left→right
      drawFamily(-30); // rising to the right (screen y inverted)
      drawFamily(30);  // falling to the right

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
