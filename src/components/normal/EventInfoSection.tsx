'use client';

export default function EventInfoSection() {
  return (
    <section
      id="event-info"
      className="relative z-10 py-20 px-4 max-w-3xl mx-auto"
      aria-label="Event information"
    >
      <div className="grid md:grid-cols-2 gap-8">
        {/* Date card */}
        <div className="bg-halloween-mist/40 backdrop-blur border border-halloween-purple/30 rounded-2xl p-6 hover:border-halloween-orange/50 transition-colors">
          <div className="text-halloween-orange text-4xl mb-3" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="16" y1="2" x2="16" y2="6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-halloween-ghost">When</h3>
          <p className="text-halloween-ghost/70">October 31st, 2026</p>
          <p className="text-halloween-ghost/70">Doors open at 8:00 PM</p>
        </div>

        {/* Location card */}
        <div className="bg-halloween-mist/40 backdrop-blur border border-halloween-purple/30 rounded-2xl p-6 hover:border-halloween-orange/50 transition-colors">
          <div className="text-halloween-orange text-4xl mb-3" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-halloween-ghost">Where</h3>
          <p className="text-halloween-ghost/70">The Old Mansion</p>
          <p className="text-halloween-ghost/70">1313 Shadow Lane</p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-8 bg-halloween-mist/40 backdrop-blur border border-halloween-purple/30 rounded-2xl p-8">
        <h3 className="text-2xl font-semibold mb-4 text-halloween-ghost text-center">
          About the Event
        </h3>
        <p className="text-halloween-ghost/70 text-center leading-relaxed">
          Join us for an unforgettable Halloween night filled with mystery, wonder, and a few
          surprises. Sign up to secure your spot. But beware: not everything is as it seems.
          Those who look closely enough may discover a door to another world.
        </p>
      </div>
    </section>
  );
}
