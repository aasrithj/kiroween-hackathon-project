'use client';

import HeroSection from './HeroSection';
import EventInfoSection from './EventInfoSection';
import SignupForm from './SignupForm';
import TriggerButton from './TriggerButton';

export default function NormalView() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-halloween-black via-halloween-deepPurple to-halloween-black">
      {/* Ambient floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-halloween-orange/20 animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${Math.random() * 4 + 4}s`,
            }}
          />
        ))}
      </div>

      <HeroSection />
      <EventInfoSection />
      <section id="signup" className="relative z-10 py-20 px-4 max-w-2xl mx-auto">
        <h2 className="text-4xl font-creepy text-center mb-8 text-glow-orange" style={{ fontFamily: 'Creepster, cursive' }}>
          Reserve Your Spot
        </h2>
        <SignupForm />
      </section>
      <TriggerButton />
    </div>
  );
}
