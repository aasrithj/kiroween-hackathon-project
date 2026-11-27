import {
  TITLE_FONT,
  TITLE_LINES,
  TITLE_PULL_FROM,
  TITLE_SHOTS,
  TITLE_TIMING
} from './config.js';
import {
  buildSchedule,
  clamp,
  closeUpScale,
  drift,
  intensity,
  isSettled,
  letterMotion,
  masterAlpha,
  pullCamera,
  shotAt,
  shotCamera,
  skipDip,
  skipTarget,
  smooth
} from './logic/title-sequence.js';

const FONT_WEIGHT = 800;
const MAX_PIXEL_RATIO = 1.5;

// Neon palette: one red hue, from deep crimson glow to a bright red tube. No white core, no fill.
const NEON = Object.freeze({
  outerGlow: '#9e0b06',
  innerGlow: '#e0170e',
  tube: '#ff2b1c',
  highlight: '#ff6a55'
});

/**
 * Draws the Nocturne Night title sequence on a canvas. It never ends: once the full title has
 * resolved it stays on screen, pulsing gently, until destroy() is called.
 * elements: { canvas, bloom, haze, grain, frame }. frame receives --title-bottom (px), the bottom
 * edge of the resolved title, so text can sit underneath it.
 * options: { onSettle() } runs once when the full title is on screen; { still } draws only that
 * final frame, with no motion (reduced motion).
 * Returns { start, skip, destroy }.
 */
export function createTitleSequence(elements, { onSettle, still = false } = {}) {
  const { canvas, bloom, haze, grain, frame: titleFrame } = elements;
  const ctx = canvas.getContext('2d');
  const bloomCtx = bloom.getContext('2d');
  const schedule = buildSchedule(TITLE_SHOTS, TITLE_TIMING);

  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let letters = [];
  let bounds = null;
  let startTime = 0;
  let frameId = 0;
  let running = false;
  let settled = false;
  let settleTimer = 0;
  // Skip intro: when it was pressed (performance.now()), and the timer for the jump.
  let skippedAt = null;
  let skipTimer = 0;

  // Film grain: one noise tile that CSS moves around, so there is no per-frame work.
  const buildGrain = () => {
    const tile = document.createElement('canvas');
    tile.width = 256;
    tile.height = 256;
    const tileCtx = tile.getContext('2d');
    const image = tileCtx.createImageData(256, 256);
    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255 | 0;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
    tileCtx.putImageData(image, 0, 0);
    grain.style.backgroundImage = `url(${tile.toDataURL()})`;
  };

  const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    bloom.width = Math.max(1, Math.round(width / 4));
    bloom.height = Math.max(1, Math.round(height / 4));
  };

  // Measures every letter once, in world units.
  const layout = () => {
    letters = [];
    let baseline = 0;
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;

    TITLE_LINES.forEach((line, lineIndex) => {
      ctx.font = `${FONT_WEIGHT} ${line.size}px ${TITLE_FONT}`;
      const chars = [...line.text];
      const advances = chars.map((char) => ctx.measureText(char).width);
      const total = advances.reduce((sum, value) => sum + value, 0) + line.track * (chars.length - 1);
      if (lineIndex > 0) baseline += line.size * 1.1;
      let x = -total / 2;

      chars.forEach((char, charIndex) => {
        const metrics = ctx.measureText(char);
        const box = {
          x0: x - metrics.actualBoundingBoxLeft,
          x1: x + metrics.actualBoundingBoxRight,
          y0: baseline - metrics.actualBoundingBoxAscent,
          y1: baseline + metrics.actualBoundingBoxDescent
        };
        letters.push({
          ch: char,
          size: line.size,
          x,
          y: baseline,
          b: box,
          font: `${FONT_WEIGHT} ${line.size}px ${TITLE_FONT}`,
          cx: (box.x0 + box.x1) / 2,
          cy: (box.y0 + box.y1) / 2,
          ...letterMotion(letters.length)
        });
        x0 = Math.min(x0, box.x0);
        x1 = Math.max(x1, box.x1);
        y0 = Math.min(y0, box.y0);
        y1 = Math.max(y1, box.y1);
        x += advances[charIndex] + line.track;
      });
    });

    bounds = { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  };

  // Fit the whole title inside the frame, with room for the controls at the bottom.
  const fitScale = () => Math.min(width * 0.84 / bounds.w, height * 0.56 / bounds.h);

  // Layered strokes make the neon tube. Blur is faked by widening and dimming strokes.
  const drawLetter = (letter, index, camera, alpha, time) => {
    const light = intensity(letter, time, schedule);
    if (alpha <= 0.001) return;

    const offset = drift(letter, time, schedule);
    const scale = offset.s;
    const k = camera.s * scale;
    const ox = letter.cx + offset.x + (letter.x - letter.cx) * scale;
    const oy = letter.cy + offset.y + (letter.y - letter.cy) * scale;

    const sx0 = width / 2 + (letter.cx + offset.x + (letter.b.x0 - letter.cx) * scale - camera.x) * camera.s;
    const sx1 = width / 2 + (letter.cx + offset.x + (letter.b.x1 - letter.cx) * scale - camera.x) * camera.s;
    const sy0 = height / 2 + (letter.cy + offset.y + (letter.b.y0 - letter.cy) * scale - camera.y) * camera.s;
    const sy1 = height / 2 + (letter.cy + offset.y + (letter.b.y1 - letter.cy) * scale - camera.y) * camera.s;
    const margin = 160;
    if (sx1 < -margin || sx0 > width + margin || sy1 < -margin || sy0 > height + margin) return;

    // Depth of field: the focused letter racks from soft to sharp, neighbours stay soft.
    let blur = 0;
    if (camera.z > 1.4) {
      const distance = Math.abs(index - camera.focus) + (letters[camera.focus].size !== letter.size ? 2 : 0);
      blur = index === camera.focus
        ? camera.rack * 18
        : Math.min(26, 5 + distance * 3.5) * clamp((camera.z - 1.4) / 4);
    }

    const lineWidth = 2.8 * letter.size / 200;
    const spread = blur / k;
    const lineWidthPx = lineWidth * k;
    const sharp = 1 / (1 + blur / (lineWidthPx * 0.9 + 2));

    ctx.setTransform(
      k * pixelRatio, 0, 0, k * pixelRatio,
      (width / 2 + (ox - camera.x) * camera.s) * pixelRatio,
      (height / 2 + (oy - camera.y) * camera.s) * pixelRatio
    );
    ctx.font = letter.font;
    const a = clamp(alpha * light);

    ctx.strokeStyle = NEON.outerGlow;
    ctx.globalAlpha = a * 0.07 * (0.6 + 0.4 * sharp);
    ctx.lineWidth = lineWidth * 9 + spread * 2.4;
    ctx.strokeText(letter.ch, 0, 0);

    ctx.strokeStyle = NEON.innerGlow;
    ctx.globalAlpha = a * 0.18 * (0.5 + 0.5 * sharp);
    ctx.lineWidth = lineWidth * 3.4 + spread * 1.6;
    ctx.strokeText(letter.ch, 0, 0);

    ctx.strokeStyle = NEON.tube;
    ctx.globalAlpha = a * (0.3 + 0.65 * sharp);
    ctx.lineWidth = lineWidth + spread * 0.9;
    ctx.strokeText(letter.ch, 0, 0);

    if (sharp > 0.4) {
      ctx.strokeStyle = NEON.highlight;
      ctx.globalAlpha = a * 0.4 * sharp * sharp;
      ctx.lineWidth = lineWidth * 0.35;
      ctx.strokeText(letter.ch, 0, 0);
    }
  };

  const renderScene = (camera, alpha, time) => {
    for (let i = 0; i < letters.length; i += 1) drawLetter(letters[i], i, camera, alpha, time);
  };

  const drawAt = (time, dip = 1) => {
    const fit = fitScale();
    const alpha = masterAlpha(schedule, time) * dip;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round';

    let hazeAmount = 0;
    const shot = shotAt(schedule, time);

    const closeFit = closeUpScale(fit, height, bounds);

    if (shot) {
      // Hard cut: exactly one framing at a time.
      const camera = shotCamera(shot, letters, time, closeFit, schedule);
      camera.z = camera.s / fit;
      renderScene(camera, alpha, time);
    } else if (time >= schedule.pullStart) {
      const camera = pullCamera(TITLE_PULL_FROM, letters, bounds, time, fit, schedule, closeFit);
      renderScene(camera, alpha, time);
      hazeAmount = smooth((camera.progress - 0.3) / 0.7);
    }

    haze.style.opacity = String(hazeAmount * alpha);

    // Cheap bloom: a quarter-size copy that CSS blurs on the GPU.
    bloomCtx.globalCompositeOperation = 'copy';
    bloomCtx.drawImage(canvas, 0, 0, bloom.width, bloom.height);
  };

  // Where the bottom of the resolved title sits on screen, for the text underneath it.
  const publishTitleBottom = () => {
    if (!bounds || !titleFrame) return;
    const bottom = height / 2 + (bounds.y1 - bounds.cy) * fitScale();
    titleFrame.style.setProperty('--title-bottom', `${Math.round(bottom)}px`);
  };

  const settle = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(settleTimer);
    onSettle?.();
  };

  const clock = () => (still ? schedule.end : performance.now() - startTime);

  // The sequence follows the wall clock, like the music, so it never pauses.
  // Browsers stop drawing frames while the page is hidden (alt-tab, another desktop, a covering
  // window). The clock keeps running, so on return the picture is wherever the music is.
  const frame = () => {
    frameId = 0;
    if (!running) return;

    const time = clock();
    const dip = skippedAt === null ? 1 : skipDip(performance.now() - skippedAt, TITLE_TIMING);
    drawAt(time, dip);
    if (isSettled(schedule, time)) settle();
    if (!still) frameId = window.requestAnimationFrame(frame);
  };

  // Redraw as soon as the page is visible again instead of waiting for the next scheduled frame.
  const onVisibility = () => {
    if (!running || document.hidden || still) return;
    window.cancelAnimationFrame(frameId);
    frameId = window.requestAnimationFrame(frame);
  };

  const handleResize = () => {
    resize();
    if (!bounds) return;
    layout();
    publishTitleBottom();
    // A still frame is not redrawn by the loop, so redraw it at the new size.
    if (still && running) frame();
  };

  const start = async () => {
    // Start the clock now, together with the music, not after the font loads.
    startTime = performance.now();
    buildGrain();
    resize();
    if (document.fonts) {
      try {
        await document.fonts.load(`${FONT_WEIGHT} 200px ${TITLE_FONT}`);
        await document.fonts.ready;
      } catch {
        // Fall back to the system serif already in the font stack.
      }
    }
    layout();
    publishTitleBottom();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('resize', handleResize);

    running = true;
    if (still) {
      frame();
      return;
    }
    // Frames do not run while the page is hidden, so a timer makes sure the text and button
    // still appear on time and are there when the visitor comes back.
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, Math.max(0, schedule.end - clock()));
    frameId = window.requestAnimationFrame(frame);
  };

  const destroy = () => {
    running = false;
    window.cancelAnimationFrame(frameId);
    window.clearTimeout(settleTimer);
    window.clearTimeout(skipTimer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', handleResize);
  };

  // Skip intro: the current shot fades to black, the clock jumps into the zoom-out, and the
  // picture fades back in to play the last few seconds of it. The title then settles as usual.
  const skip = () => {
    if (settled || still || skippedAt !== null) return;
    const target = skipTarget(schedule, TITLE_TIMING);
    // Already in the last part of the zoom-out: nothing to skip, let it finish.
    if (clock() >= target) return;

    skippedAt = performance.now();
    // A timer, not a frame, does the jump, so it also happens while the tab is hidden.
    skipTimer = window.setTimeout(() => {
      startTime = performance.now() - target;
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(settle, Math.max(0, schedule.end - clock()));
    }, TITLE_TIMING.skipFadeOut);
  };

  return { start, skip, destroy };
}
