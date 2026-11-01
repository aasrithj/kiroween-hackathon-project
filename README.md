# Upside Down Escape

A dual-dimension, Halloween-themed web application built for the Kiroween 2026 Hackathon (Costume Contest / Haunting UI track).

## What It Is

A polished Halloween event landing page where users sign up for a spooky event. But hidden at the bottom is a tempting button that transports the user into a Stranger Things-inspired "Upside Down" dimension -- a dark escape room where they must discover clues and find the exit before the timer runs out. Fail, and they get jumpscared.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS -- styling and responsive design
- GSAP -- cinematic dimension transitions and scroll animations
- Spline -- 3D hero element (with animated fallback)
- Zustand -- state management
- Web Audio API -- synthesized sound effects (no audio files needed)
- Canvas/WebGL -- particle effects in the Upside Down
- fast-check -- property-based testing for the pure logic layer
- Vitest + React Testing Library -- unit and integration tests

## Getting Started

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev` (then open http://localhost:3000)
3. Run tests: `npm test`
4. Build for production: `npm run build`

## How Kiro Was Used

### Spec-Driven Development
The entire project was built using Kiro spec-driven workflow:
- Requirements: 13 EARS-pattern requirements covering both dimensions, transitions, escape mechanics, jumpscare, responsive design, accessibility, and performance
- Design: Layered architecture with pure logic layer (state machines, timer, clue engine, signup validator) separated from presentation layer, 9 correctness properties for PBT
- Tasks: 16 epics with 58 leaf tasks across 17 dependency waves

### Steering
Custom steering files in .kiro/steering/ guided Kiro responses with project-specific conventions and tech stack preferences.

### Property-Based Testing
9 correctness properties validated with fast-check, covering the dimension state machine, timer engine, clue discovery, and signup validation.

## Project Structure

```
src/
  app/              Next.js App Router (layout, page, globals.css)
  logic/            Pure logic layer (testable via PBT)
  store/            Zustand store with persistence
  audio/            Web Audio API sound synthesis
  components/
    normal/         Normal Dimension (Halloween landing page)
    transition/     Cinematic dimension transition overlay
    upside-down/    Upside Down escape room
  types/            Shared TypeScript types
  lib/              Escape room data
  test/             PBT test suite
```

## License

MIT
