# Spline brief: Underside scenes

The Underside already runs without Spline: every creature has a hand-drawn canvas fallback. Spline scenes replace the fallbacks with real 3D. There are three slots. Build any of them in the Spline editor, export, paste the URL into `js/config.js`, and it appears automatically.

## How a scene plugs in

1. In Spline, choose **Export → Code → Vanilla JS** and copy the `https://prod.spline.design/…/scene.splinecode` URL.
2. Paste it into `SPLINE_SCENES` in `js/config.js` (`watcher`, `door`, or `figure`).
3. The site loads `@splinetool/runtime` only when at least one URL is set. If loading fails, it falls back to the canvas creature silently.

Each scene is drawn **upright, over** the upside-down world. Because the world is inverted, **build every scene hanging from the ceiling**: things should dangle, crawl, or stand upside down.

The site pushes these **Variables**. Create them in Spline's Variables panel (Number type) to use them:

| Variable | Range | Meaning |
|---|---|---|
| `dread` | 0–100 | How deep the visitor is. Use it in conditions: more fog, faster twitching, lights failing. |
| `near` | 0–100 | Figure slot only: how close the creature should be to the camera. |

The site also fires **`mouseDown` on an object named `Trigger`** at story beats (the jumpscare). Add an invisible object called `Trigger` with a Mouse Down event if you want a reaction, such as a lunge, a light blowout, or a head snap.

Keep each scene **under 5 MB**, with **transparent or pure black background**, **no text**, and **camera fixed** (disable orbit/zoom in Play Settings).

## Slot 1: `watcher` (eyes beat)

A huge, pale, hairless head hanging upside down from the ceiling, filling the lower half of the frame.
- **Events:** **Look At** (mouse) on the head, with heavy damping so it turns slowly, a beat late. A second **Look At** on each eye with less damping, so the eyes arrive first.
- **States:** Base (eyes half-closed) → Open (eyes wide). Use a condition on `dread > 55` to switch.
- **Lighting:** one cold point light below the chin, nothing else. Fog on.
- **Idle:** very slow breathing (scale 1.00 → 1.015, 4 s loop). Every 7 s, a 0.1 s head-twitch.

## Slot 2: `door` (rooms beat)

A plain interior door in a dark wall, seen straight on, upside down (hinges at the top of the frame).
- **Animation:** the door's open angle follows `dread`: closed at 60, a hand's width at 75, wide open at 90.
- **Peek:** long pale fingers (5 thin stretched capsules) curl around the door edge when `dread > 70`.
- **Light:** a bare bulb on a cord, swinging slightly. Its intensity flickers (Spline's Light state with a random-delay loop).

## Slot 3: `figure` (broadcast beat)

A tall, thin humanoid standing at the far end of a corridor, built from stretched primitives: long neck, arms past the knees, head tilted 30°.
- **Position:** its Z position follows `near`: far end of the corridor at 0, filling the frame at 100. Use a **State** per 25 steps; the site's static cuts hide the transition, so switch states instantly (duration 0).
- **Trigger:** on `Trigger` mouseDown, snap the head straight and lunge the whole body to the camera in 0.15 s.
- **Material:** matte black with a faint rim light, so it reads as a silhouette.

## Rules (from the hackathon)

- The work must be ours. Build it yourself, or remix a Spline Community file. Community files are **CC BY 4.0**, so add the author and link to `ASSETS.md`.
- Do not recreate an existing character (Jeff the Killer, Momo, Smile Dog, film monsters). Inspired-by is fine; lookalike is not.
- Keep flashes under 3 per second. No bright full-frame red.
