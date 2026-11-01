---
inclusion: always
---

# Project: Upside Down Escape

## Overview
Dual-dimension Halloween web application for the Kiroween 2026 Hackathon (Costume Contest / Haunting UI track).

## Tech Stack
- Framework: Next.js 14 (App Router) with TypeScript
- Styling: Tailwind CSS 3
- Animation: GSAP 3 with @gsap/react (useGSAP hook)
- 3D: Spline (@splinetool/react-spline) with fallback
- State: Zustand 4 with persist middleware
- Audio: Web Audio API (synthesized, no audio files)
- Testing: Vitest + fast-check (PBT) + React Testing Library
- Canvas: 2D Canvas with requestAnimationFrame for particle effects

## Architecture
- Strict logic/UI boundary: pure TypeScript functions in src/logic/ for state machines, timers, clue tracking, and validation
- Presentation layer in src/components/ handles all React, GSAP, Spline, Canvas, and Web Audio
- Zustand store in src/store/ wires logic to presentation

## Code Conventions
- Use EARS-pattern requirement references in comments (e.g., _Requirements: 3.3_)
- Use TypeScript strict mode
- Prefer functional React components with hooks
- Use useGSAP() hook for all GSAP animations with proper cleanup
- Use Tailwind utility classes for styling; extend theme via tailwind.config.ts
- All interactive elements must have min 44x44px target size
- All non-decorative images/3D must have alt/aria-label
