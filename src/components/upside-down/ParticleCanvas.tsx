'use client';

import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; life: number }> = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create particles
    const createParticle = () => ({
      x: Math.random() * canvas.width,
      y: canvas.height + Math.random() * 50,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -(Math.random() * 1.5 + 0.5),
      size: Math.random() * 3 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      life: 1,
    });

    // Initialize particles
    for (let i = 0; i < 60; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      particles.push(p);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fog gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, 'rgba(26, 37, 53, 0.15)');
      gradient.addColorStop(1, 'rgba(10, 25, 41, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.002;

        if (p.y < -10 || p.life <= 0) {
          particles[i] = createParticle();
          return;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(90, 90, 106, ${p.opacity * p.life})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
