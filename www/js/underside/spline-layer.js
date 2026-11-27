// Spline scenes for the Underside. See docs/spline-brief.md for what each scene must contain.
//
// Each slot is an upright, fixed canvas that fades in while its section is on screen. (The rest of the
// world is rotated 180°, and Spline's own pointer tracking would be mirrored inside a rotated parent.
// So the scenes are authored hanging upside down instead, and rendered upright here.)
//
// Contract with every scene (all optional):
//   variable `dread`  number 0–100, pushed while the slot is visible
//   variable `near`   number 0–100, how close the creature should be (figure slot)
//   object `Trigger`  receives `mouseDown` on story beats (jumpscare, door slam)

import { SPLINE_RUNTIME_URL, SPLINE_SCENES } from '../config.js';

let runtimePromise = null;
const loadRuntime = () => {
  runtimePromise ??= import(/* @vite-ignore */ SPLINE_RUNTIME_URL);
  return runtimePromise;
};

export function createSplineLayer(host) {
  const slots = new Map();

  Object.entries(SPLINE_SCENES).forEach(([name, url]) => {
    if (!url) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'spline-slot';
    canvas.dataset.slot = name;
    canvas.setAttribute('aria-hidden', 'true');
    host.append(canvas);
    slots.set(name, { url, canvas, app: null, state: 'idle', lastPush: 0, visible: 0 });
  });

  async function ensure(slot) {
    if (slot.state !== 'idle') return;
    slot.state = 'loading';
    try {
      const { Application } = await loadRuntime();
      slot.app = new Application(slot.canvas);
      await slot.app.load(slot.url);
      slot.state = 'ready';
      document.documentElement.classList.add(`has-spline-${slot.canvas.dataset.slot}`);
    } catch (error) {
      console.warn(`Spline scene "${slot.canvas.dataset.slot}" failed; using the canvas fallback.`, error);
      slot.state = 'failed';
      slot.canvas.remove();
    }
  }

  return {
    /** True when a scene for this slot loaded, so the canvas fallback can stand down. */
    isReady: (name) => slots.get(name)?.state === 'ready',

    /** visibility 0–1 for each slot (how much of its section is on screen), plus variables. */
    update(name, visibility, variables = {}, now = performance.now()) {
      const slot = slots.get(name);
      if (!slot) return;
      if (visibility > 0 || slot.state === 'idle') {
        // Start loading a little before the section arrives.
        if (visibility > -0.5) ensure(slot);
      }
      slot.visible = Math.max(0, visibility);
      slot.canvas.style.opacity = String(slot.visible);
      if (slot.state !== 'ready') return;
      if (slot.visible > 0 && now - slot.lastPush > 100) {
        slot.lastPush = now;
        Object.entries(variables).forEach(([key, value]) => {
          try {
            slot.app.setVariable(key, value);
          } catch {
            // The scene does not declare this variable; that is allowed.
          }
        });
      }
    },

    trigger(name, objectName = 'Trigger') {
      const slot = slots.get(name);
      if (slot?.state !== 'ready') return;
      try {
        slot.app.emitEvent('mouseDown', objectName);
      } catch {
        // No such object in this scene.
      }
    },

    dispose() {
      slots.forEach((slot) => {
        slot.app?.dispose?.();
        slot.canvas.remove();
      });
      slots.clear();
    }
  };
}
