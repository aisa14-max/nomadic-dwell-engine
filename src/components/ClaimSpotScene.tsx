import { useEffect, useRef } from "react";
import claimNight from "@/assets/claim-night.jpg";

const GRID_BG =
  "linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)";

type Props = { className?: string };

/**
 * Dark night habitat backdrop for the Claim a Spot (Configurator) page.
 * Animated starfield with twinkle, slow drift, and occasional shooting stars.
 */
export default function ClaimSpotScene({ className = "" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Mouse tilt parallax on the animated grid layer
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0; // target -1..1
    let cx = 0, cy = 0; // current
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      const rotY = cx * 8; // deg
      const rotX = -cy * 6;
      const trX = cx * -14;
      const trY = cy * -10;
      el.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${trX.toFixed(2)}px, ${trY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

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

      const count = Math.floor((w * h) / 3500);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h * 0.7,
        r: Math.random() * 1.3 + 0.2,
        base: Math.random() * 0.5 + 0.3,
        tw: Math.random() * 0.6 + 0.2,
        phase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.025,
      }));
    };

    const spawnShoot = () => {
      const fromLeft = Math.random() > 0.5;
      shoots.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.45,
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

      for (const s of stars) {
        s.phase += (dt / 1000) * s.tw * 2;
        s.x += s.vx;
        if (s.x > w + 2) s.x = -2;
        if (s.x < -2) s.x = w + 2;
        const a = s.base + Math.sin(s.phase) * 0.4;
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      shootTimer += dt;
      if (shootTimer > 3500 + Math.random() * 4000) {
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
    <div className={`overflow-hidden ${className}`} aria-hidden>
      <img
        src={claimNight}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* subtle slow drifting fog/clouds */}
      <div className="absolute inset-0 claim-fog" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
