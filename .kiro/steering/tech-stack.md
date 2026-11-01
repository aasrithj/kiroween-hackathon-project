---
inclusion: always
---

# Tech Stack Guidelines

## Next.js App Router
- Use "use client" for components using hooks, state, or browser APIs
- Server components for layout and static content
- Use next/dynamic for code-splitting heavy components (Spline, Upside Down dimension)
- App directory structure: src/app/layout.tsx, src/app/page.tsx, src/app/globals.css

## GSAP
- Always use the useGSAP() hook from @gsap/react for cleanup
- Register plugins once: gsap.registerPlugin(ScrollTrigger, useGSAP)
- Use gsap.context() with { scope } to restrict selector text
- Use ScrollTrigger on top-level tweens, not nested ones

## Zustand
- Single store with persist middleware for localStorage/sessionStorage
- Use selectors to prevent unnecessary re-renders: useAppStore((s) => s.field)
- Actions defined inline in the store creator

## fast-check PBT
- Each property test runs minimum 100 iterations
- Test ONLY the pure logic layer (no React/DOM dependencies)
- Tag each test: // Feature: upside-down-escape, Property N: <description>
- Use fc.assert(fc.property(...)) pattern with Vitest

## Audio
- AudioManager is a singleton with Web Audio API
- All sounds synthesized programmatically (no audio files needed)
- Mute state persists to localStorage
- Audio must be unlocked by user gesture before playback
