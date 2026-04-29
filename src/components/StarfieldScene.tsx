import { useEffect, useRef } from "react";
import habitatNight from "@/assets/habitat-night.jpg";

type Props = { className?: string };

/**
 * Static night-habitat backdrop with an animated starfield (twinkle + slow drift)
 * and a couple of occasional shooting stars. Canvas-based for smoothness.
 */
export default function StarfieldScene({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

    type Star = { x: number; y: number; r: number; base: number; tw: number; phase: number; vx: number };
    type Shoot = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    let stars: Star[] = [];
    let shoots: Shoot[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Stars only in upper ~65% (sky region)
      const count = Math.floor((w * h) / 4500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.65,
        r: Math.random() * 1.2 + 0.2,
        base: Math.random() * 0.5 + 0.3,
        tw: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.02,
      }));
    };

    const spawnShoot = () => {
      const fromLeft = Math.random() > 0.5;
      shoots.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.4,
        vx: fromLeft ? 6 + Math.random() * 4 : -(6 + Math.random() * 4),
        vy: 1.5 + Math.random() * 1.5,
        life: 0,
        max: 60 + Math.random() * 30,
      });
    };

    let last = performance.now();
    let shootTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(50, now - last);
      last = now;

      ctx.clearRect(0, 0, w, h);

      // Twinkling stars
      for (const s of stars) {
        s.phase += (dt / 1000) * s.tw * 2;
        s.x += s.vx;
        if (s.x > w + 2) s.x = -2;
        if (s.x < -2) s.x = w + 2;
        const a = s.base + Math.sin(s.phase) * 0.35;
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Shooting stars
      shootTimer += dt;
      if (shootTimer > 4000 + Math.random() * 4000) {
        shootTimer = 0;
        spawnShoot();
      }
      shoots = shoots.filter((sh) => sh.life < sh.max);
      for (const sh of shoots) {
        sh.life += 1;
        sh.x += sh.vx;
        sh.y += sh.vy;
        const tailX = sh.x - sh.vx * 6;
        const tailY = sh.y - sh.vy * 6;
        const grad = ctx.createLinearGradient(tailX, tailY, sh.x, sh.y);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(1, "rgba(255,255,255,0.9)");
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
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <img
        src={habitatNight}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
