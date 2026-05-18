import { useEffect, useRef } from "react";

type Props = { className?: string };

/**
 * Full-viewport animated night sky: deep gradient backdrop with twinkling
 * stars across the entire canvas, slow horizontal drift, and occasional
 * shooting stars. Pure canvas, no foreground image.
 */
export default function NightSkyScene({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = {
      x: number; y: number; r: number;
      base: number; tw: number; phase: number; vx: number;
      hue: number;
    };
    type Shoot = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    let stars: Star[] = [];
    let shoots: Shoot[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((w * h) / 2200);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.2,
        base: Math.random() * 0.55 + 0.25,
        tw: Math.random() * 0.6 + 0.15,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.03,
        hue: Math.random() < 0.15 ? (Math.random() < 0.5 ? 210 : 45) : 0,
      }));
    };

    const spawnShoot = () => {
      const fromLeft = Math.random() > 0.5;
      shoots.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.6,
        vx: fromLeft ? 6 + Math.random() * 4 : -(6 + Math.random() * 4),
        vy: 1.2 + Math.random() * 1.5,
        life: 0,
        max: 70 + Math.random() * 40,
      });
    };

    let last = performance.now();
    let shootTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      // Gradient backdrop
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#02030a");
      g.addColorStop(0.5, "#070b1f");
      g.addColorStop(1, "#0a0820");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Twinkling stars
      for (const s of stars) {
        s.phase += (dt / 1000) * s.tw * 2;
        s.x += s.vx;
        if (s.x > w + 2) s.x = -2;
        if (s.x < -2) s.x = w + 2;
        const a = s.base + Math.sin(s.phase) * 0.4;
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        if (s.hue === 0) {
          ctx.fillStyle = "#ffffff";
        } else if (s.hue === 210) {
          ctx.fillStyle = "#b8d4ff";
        } else {
          ctx.fillStyle = "#ffe7b8";
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo for bigger stars
        if (s.r > 1) {
          ctx.globalAlpha = Math.max(0, Math.min(1, a * 0.25));
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Shooting stars
      shootTimer += dt;
      if (shootTimer > 3500 + Math.random() * 3500) {
        shootTimer = 0;
        spawnShoot();
      }
      shoots = shoots.filter((sh) => sh.life < sh.max);
      for (const sh of shoots) {
        sh.life += 1;
        sh.x += sh.vx;
        sh.y += sh.vy;
        const tailX = sh.x - sh.vx * 8;
        const tailY = sh.y - sh.vy * 8;
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.95)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(sh.x, sh.y);
        ctx.stroke();
      }

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
