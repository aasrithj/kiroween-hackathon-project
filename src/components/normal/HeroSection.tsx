'use client';

import { useEffect, useRef, useState } from 'react';

export default function HeroSection() {
  const [splineFailed, setSplineFailed] = useState(true); // Default to fallback for out-of-box experience
  const containerRef = useRef<HTMLDivElement>(null);

  // Try to load Spline dynamically
  useEffect(() => {
    let cancelled = false;
    import('@splinetool/react-spline')
      .then((mod) => {
        if (!cancelled && containerRef.current) {
          setSplineFailed(false);
        }
      })
      .catch(() => {
        // Spline not available, use fallback
        setSplineFailed(true);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 z-10"
      aria-label="Hero section with Halloween event information"
    >
      {/* Animated Jack-o-Lantern */}
      <div className="relative mb-8 animate-float" aria-label="Animated 3D Halloween pumpkin">
        <svg width="160" height="160" viewBox="0 0 200 200" className="drop-shadow-[0_0_30px_rgba(255,107,26,0.6)]">
          {/* Pumpkin body */}
          <ellipse cx="100" cy="115" rx="75" ry="70" fill="#FF6B1A" />
          <ellipse cx="70" cy="110" rx="25" ry="65" fill="#FF8C00" opacity="0.6" />
          <ellipse cx="130" cy="110" rx="25" ry="65" fill="#FF8C00" opacity="0.6" />
          <ellipse cx="100" cy="115" rx="75" ry="70" fill="none" stroke="#CC4400" strokeWidth="2" />

          {/* Stem */}
          <path d="M 95 50 Q 95 35 105 35 Q 115 35 110 50" fill="#2D5F2D" stroke="#1A3D1A" strokeWidth="2" />

          {/* Eyes (triangular) */}
          <polygon points="75,95 85,80 90,100" fill="#1A0A2E" />
          <polygon points="125,95 115,80 110,100" fill="#1A0A2E" />

          {/* Glowing eyes */}
          <polygon points="78,93 84,84 87,97" fill="#FFD700" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </polygon>
          <polygon points="122,93 116,84 113,97" fill="#FFD700" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </polygon>

          {/* Nose */}
          <polygon points="100,105 95,115 105,115" fill="#1A0A2E" />

          {/* Mouth (jagged smile) */}
          <path
            d="M 65 130 L 75 140 L 85 130 L 95 140 L 105 130 L 115 140 L 125 130 L 135 140"
            fill="#1A0A2E"
            stroke="#1A0A2E"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Title */}
      <h1
        className="text-6xl md:text-8xl text-center mb-4 text-glow-orange"
        style={{ fontFamily: 'Creepster, cursive' }}
      >
        The Upside Down Escape
      </h1>

      {/* Description */}
      <p className="text-lg md:text-xl text-center text-halloween-ghost/80 max-w-xl mb-8">
        Step into the shadows. A Halloween experience awaits those brave enough to seek what lurks beneath the surface.
      </p>

      {/* CTA scroll hint */}
      <a
        href="#signup"
        className="text-halloween-purple hover:text-halloween-orange transition-colors animate-bounce text-sm"
        aria-label="Scroll to sign up"
      >
        Scroll to join the nightmare...
      </a>

      {/* Spline fallback status */}
      {splineFailed && (
        <span className="sr-only" aria-label="3D animation unavailable, showing static animated fallback">
          3D animation unavailable, showing animated fallback
        </span>
      )}
    </section>
  );
}
