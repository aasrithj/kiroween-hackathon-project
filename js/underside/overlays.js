// Screen-level overlays that sit over every scene, upright:
//   blood     drips that run down from the top of the screen as dread rises, and splatter that stays
//             where something hit the glass
//   cracks    the screen breaking where the hammer landed
//   heartbeat red pulsing in the four corners: your pulse. The scarier it gets, the faster it beats.
// Blood is drawn dark (never a bright red flash) and capped so it frames the scene rather than hiding it.

import { drawCracks } from './creatures.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function createBloodLayer(canvas) {
  const ctx = canvas.getContext('2d');
  const drips = [];
  const splats = [];
  let seed = 1;
  let dirty = false;

  function splatter(x, y, size = 1) {
    splats.push({ x, y, r: size, seed: seed++, born: performance.now() });
    if (splats.length > 14) splats.shift();
  }

  function addDrip(w) {
    drips.push({
      x: hash(seed * 3.1) * w,
      len: 0,
      max: (0.03 + hash(seed * 7.7) * 0.12) * canvas.height,
      born: performance.now(),
      speed: 6 + hash(seed * 1.3) * 22,
      width: 2 + hash(seed * 5.9) * 5
    });
    seed += 1;
  }

  return {
    splatter: (xFrac, yFrac, size) => splatter(xFrac * canvas.width, yFrac * canvas.height, size),

    update(dt, dread, now) {
      const { width: w, height: h } = canvas;
      const want0 = dread < 0.3 ? 0 : 1;
      if (!drips.length && !splats.length && !want0) {
        if (dirty) ctx.clearRect(0, 0, w, h);
        dirty = false;
        return;
      }
      dirty = true;
      ctx.clearRect(0, 0, w, h);
      // More drips the deeper you are (none at all in the opening)
      const want = dread < 0.3 ? 0 : Math.floor((dread - 0.3) * 16);
      while (drips.length < want) addDrip(w);
      // Drips live a few seconds at the top edge, then fade and are replaced.
      for (let i = drips.length - 1; i >= 0; i -= 1) {
        if (now - drips[i].born > 6000) drips.splice(i, 1);
      }
      drips.forEach((d) => {
        const life = (now - d.born) / 6000;
        ctx.globalAlpha = life < 0.6 ? 1 : Math.max(0, 1 - (life - 0.6) / 0.4);
        d.len = Math.min(d.max, d.len + d.speed * dt * (d.len < d.max * 0.3 ? 1 : 0.35));
        const g = ctx.createLinearGradient(0, 0, 0, d.len);
        g.addColorStop(0, 'rgba(60,0,4,0.95)');
        g.addColorStop(1, 'rgba(95,6,10,0.9)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(d.x - d.width, 0);
        ctx.quadraticCurveTo(d.x - d.width * 0.4, d.len * 0.6, d.x - d.width * 0.3, d.len);
        ctx.arc(d.x, d.len, d.width * 0.55, Math.PI, 0, true);
        ctx.quadraticCurveTo(d.x + d.width * 0.4, d.len * 0.6, d.x + d.width, 0);
        ctx.closePath();
        ctx.fill();
        // A highlight down one side so it reads wet
        ctx.strokeStyle = 'rgba(255,170,170,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(d.x - d.width * 0.4, 2);
        ctx.lineTo(d.x - d.width * 0.25, d.len * 0.9);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // Splatter: an irregular blot, satellite drops, and a short run downward
      splats.forEach((s) => {
        const age = (now - s.born) / 1000;
        // Gone in a few seconds, so it never sits over text for long.
        const alpha = age < 2.5 ? 0.9 : Math.max(0, 0.9 - (age - 2.5) * 0.36);
        if (alpha <= 0) return;
        const r = Math.min(w, h) * 0.06 * s.r;
        ctx.fillStyle = `rgba(70,2,6,${alpha})`;
        ctx.beginPath();
        for (let i = 0; i <= 20; i += 1) {
          const a = (i / 20) * TAU;
          const rr = r * (0.6 + hash(s.seed * 13 + i) * 0.6);
          const px = s.x + Math.cos(a) * rr;
          const py = s.y + Math.sin(a) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.fill();
        for (let i = 0; i < 16; i += 1) {
          const a = hash(s.seed * 7 + i) * TAU;
          const dist = r * (1.1 + hash(s.seed * 3 + i) * 1.8);
          ctx.beginPath();
          ctx.arc(s.x + Math.cos(a) * dist, s.y + Math.sin(a) * dist, r * (0.04 + hash(s.seed + i) * 0.1), 0, TAU);
          ctx.fill();
        }
        const run = Math.min(r * 3, age * r * 0.4);
        ctx.fillRect(s.x - r * 0.08, s.y, r * 0.16, run);
      });
    }
  };
}

export function createCrackLayer(canvas) {
  const ctx = canvas.getContext('2d');
  let hit = null;
  return {
    hit(xFrac = 0.5, yFrac = 0.5) {
      hit = { x: xFrac * canvas.width, y: yFrac * canvas.height, seed: Math.random() * 1000, born: performance.now() };
    },
    update(now) {
      if (!hit) return;
      const age = (now - hit.born) / 1000;
      const amount = age < 1.8 ? 1 : Math.max(0, 1 - (age - 1.8) / 1.2);
      drawCracks(ctx, canvas.width, canvas.height, { x: hit.x, y: hit.y, seed: hit.seed, amount });
      if (amount <= 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hit = null;
      }
    }
  };
}

/**
 * Heartbeat envelope for the red corners: a double "lub-dub" per beat. Returns 0–1.
 * phase is in beats (0–1 within the current beat).
 */
export function heartEnvelope(phase) {
  const lub = Math.exp(-((phase - 0.05) ** 2) / 0.0025);
  const dub = 0.7 * Math.exp(-((phase - 0.22) ** 2) / 0.003);
  return Math.min(1, lub + dub);
}

/**
 * Hands on the glass. Pale hands slap against your screen from the other side, one after another,
 * press flat, then slide down, leaving dark prints.  p: 0–1. Returns the number of hands landed.
 */
const printCache = new WeakMap();
/** A dark, blood-tinted copy of the hand image, for the print it leaves on the glass. */
function bloodPrint(img) {
  if (printCache.has(img)) return printCache.get(img);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = 'rgba(85,4,9,0.7)';
  x.fillRect(0, 0, c.width, c.height);
  printCache.set(img, c);
  return c;
}

export function drawHandsOnGlass(ctx, w, h, { p = 0, count = 16, img = null } = {}) {
  const photo = img?.complete && img.naturalWidth ? img : null;
  ctx.clearRect(0, 0, w, h);
  const u = Math.min(w, h);
  let landed = 0;
  for (let i = 0; i < count; i += 1) {
    const appear = (i / count) * 0.55;
    if (p < appear) continue;
    landed += 1;
    const local = (p - appear) / (1 - appear);
    const x = (0.08 + hash(i * 3.3) * 0.84) * w;
    const y0 = (0.08 + hash(i * 5.7) * 0.6) * h;
    const slide = Math.max(0, local - 0.25) * u * (0.25 + hash(i) * 0.35);
    const size = u * (0.09 + hash(i * 9.1) * 0.06);
    const angle = (hash(i * 2.2) - 0.5) * 0.9;
    const slap = Math.max(0, 1 - local * 10); // a moment of impact: bigger, then flat
    // The print it leaves behind, smeared down the glass
    const mirror = hash(i * 4.4) > 0.5 ? -1 : 1;
    ctx.save();
    ctx.translate(x, y0);
    ctx.rotate(angle);
    if (photo) {
      const print = bloodPrint(photo);
      const s = size * 2.3;
      ctx.scale(mirror, 1);
      // smeared: draw the print several times down the path it slid
      for (let k = 0; k <= 4; k += 1) {
        ctx.globalAlpha = 0.5 - k * 0.08;
        ctx.drawImage(print, -s / 2, -s * 0.62 + (slide * k) / 4, s, s);
      }
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = 'rgba(80,4,8,0.55)';
      handShape(ctx, size);
      ctx.fill();
      ctx.fillRect(-size * 0.25, 0, size * 0.5, slide);
    }
    ctx.restore();
    // The hand itself, pressed flat and pale, sliding down and fading
    const fade = Math.max(0, 1 - Math.max(0, local - 0.55) * 2.4);
    if (fade <= 0) continue;
    ctx.save();
    ctx.translate(x, y0 + slide);
    ctx.rotate(angle);
    ctx.scale(1 + slap * 0.25, 1 + slap * 0.25);
    ctx.globalAlpha = fade;
    if (photo) {
      const s = size * 2.3;
      ctx.scale(mirror, 1);
      ctx.filter = `brightness(${0.75 + slap * 0.4}) contrast(1.1)`;
      ctx.drawImage(photo, -s / 2, -s * 0.62, s, s);
      ctx.filter = 'none';
      ctx.restore();
      continue;
    }
    const g = ctx.createRadialGradient(0, size * 0.2, size * 0.1, 0, 0, size * 1.1);
    g.addColorStop(0, 'rgba(215,205,195,0.95)');
    g.addColorStop(0.7, 'rgba(150,140,132,0.85)');
    g.addColorStop(1, 'rgba(60,54,50,0.6)');
    ctx.fillStyle = g;
    handShape(ctx, size);
    ctx.fill();
    // Fingertips whitening where they press against the glass
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    [-0.36, -0.13, 0.1, 0.32].forEach((fx, k) => {
      ctx.beginPath();
      ctx.ellipse(fx * size, -size * (0.95 + (k === 1 || k === 2 ? 0.12 : 0)), size * 0.07, size * 0.09, 0, 0, TAU);
      ctx.fill();
    });
    ctx.restore();
  }
  return landed;
}

function handShape(ctx, s) {
  ctx.beginPath();
  // palm
  ctx.ellipse(0, 0, s * 0.42, s * 0.5, 0, 0, TAU);
  // four long fingers
  [[-0.36, 0.95], [-0.13, 1.08], [0.1, 1.05], [0.32, 0.9]].forEach(([fx, len]) => {
    ctx.moveTo(fx * s + s * 0.08, -s * 0.3);
    ctx.ellipse(fx * s, -s * (0.3 + len * 0.42), s * 0.085, s * len * 0.42, 0, 0, TAU);
  });
  // thumb
  ctx.moveTo(s * 0.5, 0);
  ctx.ellipse(s * 0.5, -s * 0.05, s * 0.09, s * 0.3, -0.7, 0, TAU);
}

/**
 * Claw scratches dragged across the screen, left on a transparent layer: four parallel gouges with
 * pale scored edges and blood beading out along them.  p: 0–1 how far the claw has dragged.
 */
export function drawScratches(ctx, w, h, { p = 1, seed = 1, fade = 1 } = {}) {
  ctx.clearRect(0, 0, w, h);
  if (fade <= 0) return;
  const u = Math.min(w, h);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.lineCap = 'round';
  for (let c = 0; c < 4; c += 1) {
    const x0 = w * (0.22 + c * 0.09) + (hash(seed + c) - 0.5) * u * 0.03;
    const y0 = h * (0.12 + c * 0.03);
    const x1 = x0 + w * 0.36;
    const y1 = y0 + h * 0.7;
    const xe = x0 + (x1 - x0) * p;
    const ye = y0 + (y1 - y0) * p;
    // The gouge
    ctx.strokeStyle = 'rgba(30,0,2,0.95)';
    ctx.lineWidth = u * (0.012 - c * 0.0015);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.quadraticCurveTo((x0 + xe) / 2 + u * 0.03, (y0 + ye) / 2, xe, ye);
    ctx.stroke();
    // Scored pale edge
    ctx.strokeStyle = 'rgba(230,225,220,0.55)';
    ctx.lineWidth = Math.max(1, u * 0.0025);
    ctx.beginPath();
    ctx.moveTo(x0 - u * 0.006, y0);
    ctx.quadraticCurveTo((x0 + xe) / 2 + u * 0.024, (y0 + ye) / 2, xe - u * 0.006, ye);
    ctx.stroke();
    // Blood beading out along it
    ctx.fillStyle = 'rgba(95,4,10,0.9)';
    for (let b = 0; b < 9; b += 1) {
      const k = (b / 9) * p;
      const bx = x0 + (x1 - x0) * k + u * 0.01;
      const by = y0 + (y1 - y0) * k;
      ctx.beginPath();
      ctx.ellipse(bx, by + u * 0.01, u * 0.005, u * (0.008 + hash(seed * 7 + c * 9 + b) * 0.02), 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Blood rising from the bottom of the screen until there is nothing else.  p: 0–1. */
export function drawBloodFlood(ctx, w, h, { p = 0, t = 0 } = {}) {
  const level = h * (1 - p * 1.05);
  const g = ctx.createLinearGradient(0, level, 0, h);
  g.addColorStop(0, 'rgba(110,6,10,0.95)');
  g.addColorStop(0.15, 'rgba(60,0,4,0.98)');
  g.addColorStop(1, 'rgba(15,0,1,1)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += w / 40) {
    ctx.lineTo(x, level + Math.sin(x * 0.02 + t * 2) * h * 0.012 + Math.sin(x * 0.051 - t * 3) * h * 0.008);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  // And from the top, running down to meet it
  ctx.fillStyle = 'rgba(70,2,6,0.95)';
  for (let i = 0; i < 26; i += 1) {
    const x = hash(i * 3.7) * w;
    const len = Math.min(level, h * p * (0.6 + hash(i) * 0.9));
    const width = 3 + hash(i * 1.9) * 9;
    ctx.fillRect(x - width / 2, 0, width, len);
    ctx.beginPath();
    ctx.arc(x, len, width * 0.6, 0, TAU);
    ctx.fill();
  }
}
