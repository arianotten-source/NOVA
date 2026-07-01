import { useEffect, useRef } from 'react';

export default function HomeBackground({ glow = 0.5 }: { glow?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.00012,
      vy: (Math.random() - 0.5) * 0.0001,
      a: 0.06 + Math.random() * 0.14,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createRadialGradient(w * 0.5, h * 0.32, 0, w * 0.5, h * 0.38, w * 0.85);
      grad.addColorStop(0, `rgba(0, 90, 130, ${0.1 + glow * 0.06})`);
      grad.addColorStop(0.5, `rgba(50, 25, 90, ${0.06 + glow * 0.04})`);
      grad.addColorStop(1, 'rgba(5, 8, 16, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${p.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [glow]);

  return (
    <div className="fixed inset-0 -z-10 bg-[#04060e]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 28%, rgba(0,80,120,0.14), transparent 65%), radial-gradient(ellipse 70% 50% at 75% 85%, rgba(70,35,110,0.1), transparent)',
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden />
    </div>
  );
}
