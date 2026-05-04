import { useEffect, useRef } from "react";

type Props = { className?: string };

/**
 * Voyage scene — a slow cinematic parallax of drifting terrain silhouettes
 * with a faint compass rose, latitude lines and a wandering wayfinding path.
 * Matches the "Find terrain that matches your engine" voyages theme.
 */
export default function VoyageScene({ className = "" }: Props) {
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

    // Mountain layer generator — deterministic per layer using seeded noise
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
      { pts: makeRidge(1.2, 0.18, 6),  speed: 0.0018, baseY: 0.78, alpha: 0.18 },
      { pts: makeRidge(3.8, 0.22, 8),  speed: 0.0036, baseY: 0.84, alpha: 0.28 },
      { pts: makeRidge(7.4, 0.16, 11), speed: 0.0066, baseY: 0.92, alpha: 0.45 },
    ];

    const drawRidge = (
      r: { pts: number[]; speed: number; baseY: number; alpha: number },
      t: number
    ) => {
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
      const grad = ctx.createLinearGradient(0, r.baseY * h - 60, 0, h);
      grad.addColorStop(0, `rgba(255,255,255,${r.alpha * 0.15})`);
      grad.addColorStop(1, `rgba(0,0,0,${r.alpha})`);
      ctx.fillStyle = grad;
      ctx.fill();

      // Crisp ridge line
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const x = (i / N) * w;
        const idx = (i + Math.floor(offset * N)) % N;
        const y = r.baseY * h + r.pts[idx] * h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${r.alpha * 0.4})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    };

    const drawCompass = (t: number) => {
      const cx = w * 0.82;
      const cy = h * 0.28;
      const radius = Math.min(w, h) * 0.13;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((t * 0.00003) % (Math.PI * 2));
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      // Tick marks
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const r1 = radius * (i % 8 === 0 ? 0.85 : 0.93);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
        ctx.strokeStyle = `rgba(255,255,255,${i % 8 === 0 ? 0.35 : 0.15})`;
        ctx.stroke();
      }
      // Needle
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.55);
      ctx.lineTo(radius * 0.06, 0);
      ctx.lineTo(0, radius * 0.55);
      ctx.lineTo(-radius * 0.06, 0);
      ctx.closePath();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fill();
      ctx.restore();
    };

    const drawLatLines = (t: number) => {
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      const spacing = 80;
      const off = (t * 0.004) % spacing;
      for (let y = -spacing + off; y < h * 0.7; y += spacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        // Slight curve to suggest globe
        for (let x = 0; x <= w; x += 20) {
          const yy = y + Math.sin((x / w) * Math.PI) * 6;
          ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    };

    const drawPath = (t: number) => {
      // Wandering wayfinding path with a moving dot
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.setLineDash([3, 6]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      const pts: [number, number][] = [];
      for (let i = 0; i <= 60; i++) {
        const p = i / 60;
        const x = p * w;
        const y =
          h * 0.55 +
          Math.sin(p * 6 + t * 0.00009) * h * 0.05 +
          Math.sin(p * 13 + t * 0.00015) * h * 0.02;
        pts.push([x, y]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const prog = ((t * 0.000018) % 1);
      const idx = Math.floor(prog * (pts.length - 1));
      const [px, py] = pts[idx];
      // Glow
      const g = ctx.createRadialGradient(px, py, 0, px, py, 18);
      g.addColorStop(0, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(px, py, 2.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBackdrop = (t: number) => {
      // Subtle aurora-ish gradient that breathes
      const breathe = 0.5 + Math.sin(t * 0.00012) * 0.5;
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, `rgba(20,30,50,${0.6 + breathe * 0.1})`);
      g.addColorStop(0.55, "rgba(8,10,18,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0.95)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Drifting horizon haze
      const haze = ctx.createRadialGradient(
        w * (0.4 + Math.sin(t * 0.00006) * 0.1),
        h * 0.65,
        0,
        w * 0.5,
        h * 0.65,
        Math.max(w, h) * 0.6
      );
      haze.addColorStop(0, "rgba(180,170,150,0.08)");
      haze.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    };

    const tick = (now: number) => {
      ctx.clearRect(0, 0, w, h);
      drawBackdrop(now);
      drawLatLines(now);
      drawCompass(now);
      for (const r of ridges) drawRidge(r, now);
      drawPath(now);
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
