// Original creatures, drawn procedurally on 2D canvas. None of these reproduce an existing character.
// They are fallbacks for the Spline scenes and the source of the jumpscare face.

const TAU = Math.PI * 2;
let noiseTile = null;

function getNoiseTile() {
  if (noiseTile) return noiseTile;
  noiseTile = document.createElement('canvas');
  noiseTile.width = noiseTile.height = 160;
  const nctx = noiseTile.getContext('2d');
  const img = nctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  return noiseTile;
}

/** Overlay animated grain onto whatever is already drawn. */
export function grain(ctx, w, h, amount = 0.12) {
  const tile = getNoiseTile();
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.random() * 160;
  const oy = -Math.random() * 160;
  for (let x = ox; x < w; x += 160) for (let y = oy; y < h; y += 160) ctx.drawImage(tile, x, y);
  ctx.restore();
}

/** Tear the frame: shift a few horizontal bands sideways (tape tracking damage). */
export function tear(ctx, w, h, bands = 4, maxShift = 40) {
  for (let i = 0; i < bands; i += 1) {
    const y = Math.random() * h;
    const bh = 4 + Math.random() * h * 0.06;
    const shift = (Math.random() - 0.5) * 2 * maxShift;
    ctx.drawImage(ctx.canvas, 0, y, w, bh, shift, y, w, bh);
  }
}

// ---------------------------------------------------------------------------------------------
// The Grinner: a long, hairless, paper-pale face with mismatched hollow eyes and a smile that keeps
// stretching past where a face should end. Animated: the grin widens in jerks, the pinprick pupils
// dart, and it bleeds from the eyes and gums.
//   grin  0–1.4  how far the smile has stretched (1 reaches the ears, more climbs the temples)
//   blood 0–1    how far the bleeding has run
//   stare 0–1    how twitchy it is (pupil darts, frame-skip head jerks)
// ---------------------------------------------------------------------------------------------
export function drawGrinner(ctx, w, h, {
  t = 0, scale = 1, alpha = 1, cx = w / 2, cy = h * 0.52, dark = true, grin = 0.7, blood = 0, stare = 0, sad = 0
} = {}) {
  ctx.save();
  ctx.globalAlpha = alpha;
  if (dark) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
  }
  const r = Math.min(w, h) * 0.3 * scale;
  const ry = r * 1.5;
  const tick = Math.floor(t * 14); // twitches happen on a coarse clock, like dropped frames
  const jerk = stare * (hash(tick) > 0.8 ? (hash(tick + 7) - 0.5) * r * 0.12 : 0);
  ctx.translate(cx + jerk, cy + jerk * 0.4);
  ctx.rotate(Math.sin(t * 2.1) * 0.03 - 0.06 + stare * (hash(tick + 3) > 0.85 ? 0.12 : 0));
  ctx.scale(1 + stare * Math.sin(t * 31) * 0.012, 1);

  // Head, lit from below; the edges dissolve into the dark.
  const skin = ctx.createRadialGradient(0, ry * 0.25, r * 0.05, 0, 0, ry * 1.02);
  skin.addColorStop(0, '#f1ebdd');
  skin.addColorStop(0.45, '#cfc7b5');
  skin.addColorStop(0.72, '#6e685d');
  skin.addColorStop(0.9, 'rgba(30,27,24,0.6)');
  skin.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.08, ry * 1.05, 0, 0, TAU);
  ctx.fill();

  const brow = ctx.createLinearGradient(0, -ry, 0, -ry * 0.1);
  brow.addColorStop(0, 'rgba(0,0,0,0.75)');
  brow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = brow;
  ctx.fillRect(-r * 1.1, -ry * 1.05, r * 2.2, ry * 0.95);
  [-1, 1].forEach((side) => {
    const hollow = ctx.createRadialGradient(side * r * 0.55, ry * 0.12, 0, side * r * 0.55, ry * 0.12, r * 0.38);
    hollow.addColorStop(0, 'rgba(25,20,18,0.45)');
    hollow.addColorStop(1, 'rgba(25,20,18,0)');
    ctx.fillStyle = hollow;
    ctx.beginPath();
    ctx.arc(side * r * 0.55, ry * 0.12, r * 0.38, 0, TAU);
    ctx.fill();
  });

  // Hairline cracks in the skin
  ctx.strokeStyle = 'rgba(40,30,26,0.5)';
  ctx.lineWidth = Math.max(1, r * 0.006);
  for (let c = 0; c < 5; c += 1) {
    let x = (hash(c * 11) - 0.5) * r * 1.2;
    let y = -ry * (0.55 + hash(c * 5) * 0.3);
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k += 1) {
      x += (hash(c * 31 + k) - 0.5) * r * 0.12;
      y += r * 0.06;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Eyes: hollow, too big, not level.
  const eyes = [
    { x: -r * 0.38, y: -ry * 0.3, rx: r * 0.27, ry: r * 0.31 },
    { x: r * 0.36, y: -ry * 0.24, rx: r * 0.22, ry: r * 0.25 }
  ];
  eyes.forEach((eye, i) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = r * 0.25;
    ctx.fillStyle = '#050404';
    ctx.beginPath();
    ctx.ellipse(eye.x, eye.y, eye.rx, eye.ry, i ? 0.15 : -0.1, 0, TAU);
    ctx.fill();
    ctx.restore();
    const dart = stare * r * 0.06;
    ctx.fillStyle = '#f4f1ea';
    ctx.beginPath();
    ctx.arc(eye.x + (hash(tick * 2 + i) - 0.5) * dart, eye.y + (hash(tick * 3 + i) - 0.5) * dart, r * 0.028, 0, TAU);
    ctx.fill();
  });

  // Blood tears from the bottom of each eye
  if (blood > 0) {
    eyes.forEach((eye, i) => {
      for (let s = 0; s < 3; s += 1) {
        const sx = eye.x + (s - 1) * eye.rx * 0.45 + (hash(i * 9 + s) - 0.5) * eye.rx * 0.2;
        const sy = eye.y + eye.ry * 0.8;
        const len = blood * ry * (0.45 + hash(i * 13 + s) * 0.75);
        bloodStream(ctx, sx, sy, len, r * (0.035 + hash(s + i) * 0.03), t + s);
      }
    });
  }

  // Nostrils: two slits, no nose
  ctx.fillStyle = '#1c1715';
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * r * 0.07, ry * 0.08, r * 0.025, r * 0.06, side * 0.3, 0, TAU);
    ctx.fill();
  });

  // The smile. As `grin` grows, the corners run past the cheeks and climb toward the temples.
  // With `sad`, the whole mouth turns over into a frown (same teeth, same width).
  const mw = r * (0.55 + grin * 0.62);
  const top = ry * 0.22;
  ctx.save();
  if (sad > 0) {
    const pivot = top + ry * 0.15;
    ctx.translate(0, pivot);
    ctx.scale(1, 1 - 2 * Math.min(1, sad));
    ctx.translate(0, -pivot);
  }
  const lift = ry * (0.1 + grin * 0.3);
  const left = { x: -mw, y: top - lift };
  const right = { x: mw * 0.97, y: top - lift * 1.1 };
  const dip = ry * (0.16 + grin * 0.1);
  const drop = ry * (0.4 + grin * 0.25);
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.quadraticCurveTo(0, top + dip, right.x, right.y);
  ctx.quadraticCurveTo(0, top + drop, left.x, left.y);
  ctx.closePath();
  ctx.fillStyle = '#120505';
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#3b1012';
  ctx.beginPath();
  ctx.moveTo(left.x, left.y);
  ctx.quadraticCurveTo(0, top + dip, right.x, right.y);
  ctx.lineTo(right.x, right.y + ry * 0.06);
  ctx.quadraticCurveTo(0, top + dip + ry * 0.08, left.x, left.y + ry * 0.06);
  ctx.fill();
  const count = Math.round(22 + grin * 16);
  for (let i = 0; i < count; i += 1) {
    const u = i / (count - 1);
    const x = left.x + (right.x - left.x) * u;
    const yTop = quadY(left.y, top + dip, right.y, u) + ry * 0.02;
    const yBottom = quadY(left.y, top + drop, right.y, u) - ry * 0.01;
    const tw = ((right.x - left.x) / count) * 0.85;
    const lenTop = (yBottom - yTop) * (0.4 + 0.14 * Math.sin(i * 12.9898));
    const lenBottom = (yBottom - yTop) * (0.32 + 0.12 * Math.sin(i * 78.233));
    const shade = ctx.createLinearGradient(0, yTop, 0, yTop + lenTop);
    shade.addColorStop(0, blood > 0.3 && i % 3 === 0 ? '#7a3a30' : '#d8d0bc');
    shade.addColorStop(1, '#8f8775');
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.moveTo(x - tw / 2, yTop);
    ctx.lineTo(x + tw / 2, yTop);
    ctx.lineTo(x + tw * 0.1, yTop + lenTop);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9d9583';
    ctx.beginPath();
    ctx.moveTo(x - tw / 2, yBottom);
    ctx.lineTo(x + tw / 2, yBottom);
    ctx.lineTo(x - tw * 0.1, yBottom - lenBottom);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.restore();

  // Blood spilling over the lower lip
  if (blood > 0 && sad < 0.5) {
    for (let s = 0; s < 6; s += 1) {
      const u = 0.18 + s * 0.13;
      const x = left.x + (right.x - left.x) * u;
      const y = quadY(left.y, top + drop, right.y, u) - ry * 0.02;
      bloodStream(ctx, x, y, blood * ry * (0.2 + hash(s * 3) * 0.5), r * 0.03, t + s * 0.7);
    }
  }

  // Creases from the corners of the smile up toward the eyes
  ctx.strokeStyle = 'rgba(50,42,36,0.55)';
  ctx.lineWidth = r * 0.018;
  [[left, -1], [right, 1]].forEach(([corner, side]) => {
    ctx.beginPath();
    ctx.moveTo(corner.x, corner.y);
    ctx.quadraticCurveTo(corner.x + side * r * 0.05, corner.y - ry * 0.25, side * r * 0.45, -ry * 0.06);
    ctx.stroke();
  });

  // Skin grain
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.05, ry * 1.02, 0, 0, TAU);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.55 * alpha;
  const tile = getNoiseTile();
  for (let gx = -r * 1.1; gx < r * 1.1; gx += 160) for (let gy = -ry * 1.1; gy < ry * 1.1; gy += 160) ctx.drawImage(tile, gx, gy);
  ctx.restore();

  ctx.restore();
}

/** A dark, tapering run of blood with a drop at the end. Deliberately dark: never a bright red flash. */
function bloodStream(ctx, x, y, length, width, t) {
  if (length <= 0) return;
  const g = ctx.createLinearGradient(0, y, 0, y + length);
  g.addColorStop(0, 'rgba(70,4,6,0.95)');
  g.addColorStop(1, 'rgba(30,0,2,0.9)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y);
  const wob = Math.sin(t * 1.7) * width * 0.4;
  ctx.quadraticCurveTo(x - width * 0.3 + wob, y + length * 0.5, x - width * 0.15, y + length);
  ctx.lineTo(x + width * 0.15, y + length);
  ctx.quadraticCurveTo(x + width * 0.3 + wob, y + length * 0.5, x + width / 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y + length, width * 0.32, width * 0.45, 0, 0, TAU);
  ctx.fill();
}

function quadY(a, control, b, u) {
  return (1 - u) * (1 - u) * a + 2 * (1 - u) * u * control + u * u * b;
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** A free-floating grinning mouth (no face), for things growing in the corners. */
function mouth(ctx, x, y, width, open, angle, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const depth = width * (0.08 + open * 0.18);
  ctx.beginPath();
  ctx.moveTo(-width / 2, -depth * 0.8);
  ctx.quadraticCurveTo(0, depth * 0.4, width / 2, -depth * 0.8);
  ctx.quadraticCurveTo(0, depth * 2.6, -width / 2, -depth * 0.8);
  ctx.closePath();
  ctx.fillStyle = '#120505';
  ctx.fill();
  ctx.save();
  ctx.clip();
  const teeth = Math.max(8, Math.round(width / 5));
  for (let i = 0; i < teeth; i += 1) {
    const u = (i + 0.5) / teeth;
    const tx = -width / 2 + u * width;
    ctx.fillStyle = '#d4ccb8';
    ctx.fillRect(tx - width / teeth / 2.8, -depth, width / teeth / 1.4, depth * (1 + Math.sin(i * 3.3 + t) * 0.1));
    ctx.fillRect(tx - width / teeth / 2.8, depth * 0.9, width / teeth / 1.4, depth * 0.9);
  }
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Corner growth: black veins creep in from the corners of the screen. Grinning mouths and eyes
// open at their tips. Drawn on a transparent canvas over whatever is showing. p: 0–1.
// ---------------------------------------------------------------------------------------------
export function drawCornerCreep(ctx, w, h, { p = 0, t = 0 } = {}) {
  ctx.clearRect(0, 0, w, h);
  if (p <= 0) return;
  const diag = Math.hypot(w, h);
  const corners = [[0, 0], [w, 0], [0, h], [w, h]];
  corners.forEach(([ox, oy], c) => {
    // Darkness pooling in the corner
    const pool = ctx.createRadialGradient(ox, oy, 0, ox, oy, diag * 0.42 * p);
    pool.addColorStop(0, 'rgba(0,0,0,0.95)');
    pool.addColorStop(0.6, 'rgba(0,0,0,0.6)');
    pool.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pool;
    ctx.fillRect(0, 0, w, h);

    const toward = Math.atan2(h / 2 - oy, w / 2 - ox);
    for (let v = 0; v < 6; v += 1) {
      const seed = c * 17 + v * 5;
      const angle = toward + (hash(seed) - 0.5) * 1.3;
      const length = diag * (0.16 + hash(seed + 1) * 0.24) * p;
      let x = ox;
      let y = oy;
      let a = angle;
      const steps = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pts = [[x, y]];
      for (let s = 0; s < steps; s += 1) {
        x += Math.cos(a) * (length / steps);
        y += Math.sin(a) * (length / steps);
        a += (hash(seed * 7 + s) - 0.5) * 0.5 + Math.sin(t * 2 + s + v) * 0.03;
        pts.push([x, y]);
      }
      // Taper by drawing the vein in three passes, thick near the corner, thin at the tip
      [[1, 0.006, 'rgba(60,0,0,0.35)', 2.2], [1, 0.006, 'rgba(4,2,2,0.95)', 1], [0.5, 0.003, 'rgba(4,2,2,0.95)', 1]].forEach(([frac, width, colour, grow]) => {
        ctx.strokeStyle = colour;
        ctx.lineWidth = Math.max(1, diag * width * grow);
        ctx.beginPath();
        const end = Math.max(2, Math.round(pts.length * frac));
        pts.slice(frac === 1 ? 0 : pts.length - end).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
        ctx.stroke();
      });
      // At the tips: a face. Dark head, wide white eyes, a grin underneath, always upright.
      const open = Math.max(0, (p - 0.35 - hash(seed + 2) * 0.3) / 0.4);
      if (open <= 0 || v % 2 === 1) continue;
      const size = diag * (0.035 + hash(seed + 3) * 0.03) * Math.min(1, open);
      const fx = x;
      const fy = y;
      const head = ctx.createRadialGradient(fx, fy, size * 0.1, fx, fy, size * 1.1);
      head.addColorStop(0, '#0b0606');
      head.addColorStop(0.85, '#050303');
      head.addColorStop(1, 'rgba(60,0,0,0)');
      ctx.fillStyle = head;
      ctx.beginPath();
      ctx.ellipse(fx, fy, size * 0.85, size * 1.05, 0, 0, TAU);
      ctx.fill();
      [-1, 1].forEach((side, e) => {
        const ex = fx + side * size * 0.32;
        const ey = fy - size * 0.22 + e * size * 0.04;
        ctx.fillStyle = '#ecebe4';
        ctx.beginPath();
        ctx.ellipse(ex, ey, size * 0.2, size * 0.24, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#050505';
        ctx.beginPath();
        ctx.arc(ex + Math.sin(t * 2 + seed) * size * 0.04, ey, size * 0.06, 0, TAU);
        ctx.fill();
      });
      mouth(ctx, fx, fy + size * 0.38, size * 1.15 * (0.6 + Math.min(1, open) * 0.4), Math.min(1, open), 0, t);
    }
  });
}

// ---------------------------------------------------------------------------------------------
// The Long One: an impossibly tall, thin thing that leans out of the top-right corner, grinning
// and bleeding. It snaps off its own forearm and holds it out to you, palm open, with a tag.
//   emerge 0–1  leaning in from the corner
//   detach 0–1  the forearm separating at the elbow
//   offer  0–1  the forearm coming toward the camera, palm opening
// ---------------------------------------------------------------------------------------------
export function drawLongOne(ctx, w, h, { emerge = 0, slash = 0, detach = 0, offer = 0, t = 0, tag = 'FOR YOU' } = {}) {
  ctx.clearRect(0, 0, w, h);
  if (emerge <= 0) return;
  const e = easeOut(emerge);
  const u = h;
  const S = { x: lerpN(w * 1.15, w * 0.8, e), y: lerpN(-u * 0.25, u * 0.1, e) }; // shoulder
  const H = { x: lerpN(w * 1.1, w * 0.6, e), y: lerpN(-u * 0.1, u * 0.36, e) }; // head, hanging forward
  const E = { x: S.x - u * 0.2, y: S.y + u * 0.3 }; // elbow
  ctx.save();

  // Emaciated torso coming out of the corner, ribs showing
  limb(ctx, S.x + u * 0.02, S.y, w * 1.25, -u * 0.45, u * 0.09, u * 0.15);
  ctx.save();
  ctx.translate(S.x + u * 0.02, S.y);
  ctx.rotate(Math.atan2(-u * 0.45 - S.y, w * 1.25 - S.x));
  ctx.strokeStyle = 'rgba(40,34,28,0.55)';
  ctx.lineWidth = u * 0.006;
  for (let r = 0; r < 7; r += 1) {
    const x = u * (0.08 + r * 0.045);
    ctx.beginPath();
    ctx.moveTo(x, -u * (0.04 + r * 0.004));
    ctx.quadraticCurveTo(x + u * 0.02, 0, x, u * (0.04 + r * 0.004));
    ctx.stroke();
  }
  ctx.restore();

  // Neck: far too long, bent
  const neckMid = { x: S.x - u * 0.06, y: lerpN(S.y, H.y, 0.5) - u * 0.04 };
  limb(ctx, S.x - u * 0.01, S.y + u * 0.01, neckMid.x, neckMid.y, u * 0.03, u * 0.024);
  limb(ctx, neckMid.x, neckMid.y, H.x + u * 0.02, H.y - u * 0.06, u * 0.024, u * 0.022);

  // Second arm, braced against the edge of the screen
  const E2 = { x: S.x + u * 0.12, y: S.y + u * 0.33 };
  const W2 = { x: w * 0.985, y: S.y + u * 0.62 };
  limb(ctx, S.x + u * 0.04, S.y + u * 0.01, E2.x, E2.y, u * 0.03, u * 0.022);
  limb(ctx, E2.x, E2.y, W2.x, W2.y, u * 0.022, u * 0.016);
  hand(ctx, W2.x, W2.y, u * 0.11, Math.PI * 0.62, t, 0.35);

  // Upper arm (stays attached)
  limb(ctx, S.x - u * 0.02, S.y + u * 0.01, E.x, E.y, u * 0.032, u * 0.026);
  if (detach > 0) stump(ctx, E.x, E.y, u * 0.018, detach, t);

  // Mottled skin: noise laid only onto what has been drawn (source-atop), never onto empty screen.
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = 0.22;
  const skinTile = getNoiseTile();
  for (let gx = 0; gx < w; gx += 160) for (let gy = 0; gy < h; gy += 160) ctx.drawImage(skinTile, gx, gy);
  ctx.globalAlpha = 1;
  // Darkness pooling out of the corner hides most of it; only the face and the arm come forward.
  const dark = ctx.createRadialGradient(w, 0, 0, w, 0, Math.hypot(w, h) * 0.55);
  dark.addColorStop(0, 'rgba(0,0,0,0.92)');
  dark.addColorStop(0.55, 'rgba(0,0,0,0.45)');
  dark.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';

  // The cut: a long nail drawn across the elbow leaves a bright line, then a spray.
  if (slash > 0) {
    const reach = Math.min(1, slash * 1.6);
    const fade = 1 - Math.max(0, (slash - 0.6) / 0.4);
    ctx.save();
    ctx.strokeStyle = `rgba(255,248,235,${0.9 * fade})`;
    ctx.shadowColor = 'rgba(255,240,220,0.9)';
    ctx.shadowBlur = u * 0.02;
    ctx.lineWidth = u * 0.004;
    ctx.beginPath();
    ctx.moveTo(E.x - u * 0.05, E.y - u * 0.03);
    ctx.lineTo(E.x - u * 0.05 + u * 0.1 * reach, E.y - u * 0.03 + u * 0.06 * reach);
    ctx.stroke();
    ctx.restore();
    // Spray: dark droplets thrown out and falling
    for (let d = 0; d < 26; d += 1) {
      const dir = -Math.PI * 0.15 + (hash(d * 3) - 0.5) * 1.6;
      const speed = u * (0.08 + hash(d * 7) * 0.3);
      const k = Math.min(1, slash * 1.3 + detach * 0.5);
      const dx = E.x + Math.cos(dir) * speed * k;
      const dy = E.y + Math.sin(dir) * speed * k + u * 0.25 * k * k;
      ctx.fillStyle = `rgba(${50 + hash(d) * 30},2,4,${0.9 - detach * 0.3})`;
      ctx.beginPath();
      ctx.ellipse(dx, dy, u * (0.002 + hash(d * 5) * 0.005), u * (0.003 + hash(d * 5) * 0.007), dir, 0, TAU);
      ctx.fill();
    }
  }

  // Head
  drawGrinner(ctx, w, h, { t, scale: 0.26, cx: H.x, cy: H.y, dark: false, grin: 0.9 + detach * 0.4, blood: 0.5 + detach * 0.5, stare: 1 });

  // Forearm: hangs from the elbow, then comes loose and is held out toward the camera.
  const o = easeInOut(offer);
  const gap = detach * u * 0.04;
  const fx = lerpN(E.x - gap * 0.6, w * 0.5, o);
  const fy = lerpN(E.y + gap, u * 1.12, o);
  const angle = lerpN(Math.PI * 0.82, 0, o); // 0 = hand up, palm facing you
  const scale = 1 + o * 1.9;
  ctx.save();
  ctx.translate(fx, fy);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  const L = u * 0.3;
  limb(ctx, 0, 0, 0, -L, u * 0.028, u * 0.019);
  if (detach > 0) {
    // The cut end: dark flesh, a white ring of bone
    ctx.fillStyle = '#2a0204';
    ctx.beginPath();
    ctx.ellipse(0, 0, u * 0.015, u * 0.006, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d9d0bb';
    ctx.beginPath();
    ctx.ellipse(0, 0, u * 0.005, u * 0.002, 0, 0, TAU);
    ctx.fill();
    if (o < 0.6) bloodStream(ctx, 0, 0, u * 0.07 * detach * (1 - o), u * 0.008, t);
  }
  const curl = 1 - Math.min(1, Math.max(0, (offer - 0.45) / 0.45));
  hand(ctx, 0, -L, u * 0.12, -Math.PI / 2, t, curl);
  if (offer > 0.75) {
    // A paper tag tied round the wrist
    const a = Math.min(1, (offer - 0.75) / 0.2);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(u * 0.012, -L * 0.88);
    ctx.rotate(-0.18);
    ctx.strokeStyle = 'rgba(200,190,170,0.8)';
    ctx.lineWidth = u * 0.002;
    ctx.beginPath();
    ctx.moveTo(-u * 0.012, 0);
    ctx.lineTo(u * 0.02, u * 0.006);
    ctx.stroke();
    ctx.fillStyle = '#ded3ba';
    ctx.fillRect(u * 0.02, -u * 0.008, u * 0.1, u * 0.03);
    ctx.fillStyle = '#5a0a0a';
    ctx.beginPath();
    ctx.arc(u * 0.03, u * 0.007, u * 0.003, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2a1a14';
    ctx.font = `600 ${Math.round(u * 0.019)}px "Caveat", cursive`;
    ctx.textBaseline = 'middle';
    ctx.fillText(tag, u * 0.038, u * 0.007, u * 0.078);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

/** A tapered, shaded limb segment from a to b, with a swollen knuckle at b. */
function limb(ctx, ax, ay, bx, by, wa, wb) {
  const len = Math.hypot(bx - ax, by - ay);
  ctx.save();
  ctx.translate(ax, ay);
  ctx.rotate(Math.atan2(by - ay, bx - ax));
  const g = ctx.createLinearGradient(0, -wa / 2, 0, wa / 2);
  g.addColorStop(0, '#2e2a25');
  g.addColorStop(0.35, '#c9c2b2');
  g.addColorStop(0.55, '#a39c8c');
  g.addColorStop(1, '#1e1b18');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(0, -wa / 2);
  ctx.lineTo(len, -wb / 2);
  ctx.arc(len, 0, wb / 2, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(0, wa / 2);
  ctx.arc(0, 0, wa / 2, Math.PI / 2, -Math.PI / 2);
  ctx.fill();
  const k = ctx.createRadialGradient(len - wb * 0.15, -wb * 0.2, 0, len, 0, wb * 0.75);
  k.addColorStop(0, '#cfc8b8');
  k.addColorStop(1, 'rgba(40,36,31,0)');
  ctx.fillStyle = k;
  ctx.beginPath();
  ctx.arc(len, 0, wb * 0.75, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function stump(ctx, x, y, r, detach, t) {
  ctx.fillStyle = '#2a0204';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#d4cab4';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.35, 0, TAU);
  ctx.fill();
  bloodStream(ctx, x, y + r * 0.5, r * 9 * detach, r * 0.6, t);
}

/** A bony hand: narrow palm, five long jointed fingers with dark nails. curl 0 = open, 1 = curled. */
function hand(ctx, x, y, length, angle, t, curl) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);
  const pw = length * 0.5;
  const ph = length * 0.46;
  const g = ctx.createLinearGradient(-pw / 2, 0, pw / 2, 0);
  g.addColorStop(0, '#3a352f');
  g.addColorStop(0.5, '#c4bdad');
  g.addColorStop(1, '#3a352f');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-pw * 0.32, 0);
  ctx.quadraticCurveTo(-pw * 0.62, -ph * 0.45, -pw * 0.52, -ph);
  ctx.quadraticCurveTo(0, -ph * 1.1, pw * 0.52, -ph);
  ctx.quadraticCurveTo(pw * 0.6, -ph * 0.45, pw * 0.32, 0);
  ctx.closePath();
  ctx.fill();
  // Tendons under the skin
  ctx.strokeStyle = 'rgba(60,54,46,0.45)';
  ctx.lineWidth = length * 0.012;
  for (let f = 1; f < 5; f += 1) {
    ctx.beginPath();
    ctx.moveTo((f - 2.5) * pw * 0.12, -ph * 0.08);
    ctx.lineTo((f - 2.5) * pw * 0.24, -ph * 0.95);
    ctx.stroke();
  }
  for (let f = 0; f < 5; f += 1) {
    const thumb = f === 0;
    const spread = (f - 2) * (0.22 - curl * 0.14) + (thumb ? -0.5 : 0);
    const twitch = Math.sin(t * 9 + f * 2.3) * 0.05;
    let a = -Math.PI / 2 + spread + twitch;
    let px = thumb ? -pw * 0.5 : (f - 2.5) * pw * 0.26;
    let py = thumb ? -ph * 0.35 : -ph * (f === 1 || f === 4 ? 0.97 : 1.02);
    let width = length * (thumb ? 0.1 : 0.085);
    const seg = length * (thumb ? 0.22 : f === 4 ? 0.26 : 0.34);
    for (let j = 0; j < 3; j += 1) {
      const nx = px + Math.cos(a) * seg;
      const ny = py + Math.sin(a) * seg;
      limb(ctx, px, py, nx, ny, width, width * 0.82);
      px = nx;
      py = ny;
      width *= 0.82;
      // Joints bend inward like real fingers, with a little resting curl even when open.
      a += (curl * 0.75 + 0.08 * (j + 1)) * (thumb ? 1 : f < 2 ? -0.6 : 0.6) * (j === 0 ? 0.6 : 1);
    }
    ctx.fillStyle = '#1a1410';
    ctx.beginPath();
    ctx.moveTo(px - width * 0.35, py);
    ctx.lineTo(px + Math.cos(a) * width * 2.2, py + Math.sin(a) * width * 2.2);
    ctx.lineTo(px + width * 0.35, py);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The hammer. The Grinner rushes at you holding a mallet, swings, and hits the screen. Then it steps
 * back, and its smile turns over into a sad face.  t: 0–1.  Returns true at the moment of impact.
 */
export function drawHammerFace(ctx, w, h, { t = 0, now = 0 } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const u = Math.min(w, h);
  const rush = Math.min(1, t / 0.45);
  const swing = Math.max(0, Math.min(1, (t - 0.38) / 0.17));
  const back = Math.max(0, (t - 0.62) / 0.38);
  const scale = 0.35 + easeIn(rush) * 0.85 - back * 0.25;
  // It keeps smiling. Always.
  drawGrinner(ctx, w, h, { t: now / 1000, scale, grin: 1.1 + back * 0.2, blood: 0.5 + back * 0.5, stare: 1, cy: h * 0.55, dark: false });
  // The mallet: raised over its head, then brought down at you
  ctx.save();
  ctx.translate(w * 0.5 + u * 0.42 * scale, h * 0.5 - u * 0.1 * scale);
  ctx.rotate(-1.9 + swing * 2.3 - back * 0.6);
  const len = u * 0.75 * scale;
  const handle = ctx.createLinearGradient(-u * 0.02, 0, u * 0.02, 0);
  handle.addColorStop(0, '#3a2414');
  handle.addColorStop(0.5, '#8a5a32');
  handle.addColorStop(1, '#2a180c');
  ctx.fillStyle = handle;
  ctx.fillRect(-u * 0.018 * scale, -len, u * 0.036 * scale, len);
  const head = ctx.createLinearGradient(0, -len - u * 0.08 * scale, 0, -len + u * 0.04 * scale);
  head.addColorStop(0, '#9a9a9e');
  head.addColorStop(0.5, '#4a4a4e');
  head.addColorStop(1, '#1e1e22');
  ctx.fillStyle = head;
  ctx.fillRect(-u * 0.11 * scale, -len - u * 0.08 * scale, u * 0.22 * scale, u * 0.12 * scale);
  // Blood on the striking face once it has hit
  if (t > 0.55) {
    ctx.fillStyle = 'rgba(70,4,6,0.9)';
    ctx.fillRect(-u * 0.11 * scale, -len + u * 0.02 * scale, u * 0.22 * scale, u * 0.02 * scale);
  }
  ctx.restore();
  grain(ctx, w, h, 0.25);
  return t >= 0.55;
}

/**
 * Cracked glass, spreading from an impact point, drawn on its own transparent layer.
 * seed fixes the pattern; amount 0–1 fades it.
 */
export function drawCracks(ctx, w, h, { x = w / 2, y = h / 2, seed = 1, amount = 1 } = {}) {
  ctx.clearRect(0, 0, w, h);
  if (amount <= 0) return;
  const u = Math.min(w, h);
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.lineCap = 'round';
  // Radial cracks
  const rays = 14;
  for (let i = 0; i < rays; i += 1) {
    let a = (i / rays) * TAU + (hash(seed + i) - 0.5) * 0.4;
    let px = x;
    let py = y;
    const len = u * (0.25 + hash(seed * 3 + i) * 0.55);
    const steps = 10;
    ctx.beginPath();
    ctx.moveTo(px, py);
    for (let k = 0; k < steps; k += 1) {
      a += (hash(seed * 7 + i * 13 + k) - 0.5) * 0.35;
      px += Math.cos(a) * (len / steps);
      py += Math.sin(a) * (len / steps);
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(235,240,245,0.75)';
    ctx.lineWidth = Math.max(1, u * 0.0022);
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 3;
    ctx.stroke();
  }
  // Concentric rings around the impact
  for (let r = 1; r <= 3; r += 1) {
    ctx.beginPath();
    for (let i = 0; i <= rays; i += 1) {
      const a = (i / rays) * TAU;
      const rr = u * 0.05 * r * (0.85 + hash(seed + r * 31 + i) * 0.3);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(220,228,235,0.55)';
    ctx.lineWidth = Math.max(1, u * 0.0016);
    ctx.stroke();
  }
  // Crushed centre
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(x, y, u * 0.02, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** A photograph lunging at the camera, zooming into a focus point. t: 0–1. */
export function drawLunge(ctx, w, h, img, { focus = [0.5, 0.5], t = 0 } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  if (!img?.complete || !img.naturalWidth) return false;
  const zoom = 1 + easeIn(t) * 1.6;
  const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const iw = img.naturalWidth * fit;
  const ih = img.naturalHeight * fit;
  const x = w / 2 - focus[0] * iw;
  const y = h / 2 - focus[1] * ih;
  ctx.save();
  ctx.filter = `contrast(${1.3 + t * 0.4}) brightness(${1.05 - t * 0.2})`;
  ctx.drawImage(img, x + (Math.random() - 0.5) * 12 * t, y + (Math.random() - 0.5) * 12 * t, iw, ih);
  ctx.restore();
  tear(ctx, w, h, 5 + Math.round(t * 6), w * 0.06);
  grain(ctx, w, h, 0.25);
  return true;
}

const lerpN = (a, b, t) => a + (b - a) * t;
const easeOut = (x) => 1 - (1 - x) ** 3;
const easeIn = (x) => x * x * x;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

// ---------------------------------------------------------------------------------------------
// Eyes in the dark. Each pair opens at a point in the beat's progress, blinks, and tracks the pointer.
// ---------------------------------------------------------------------------------------------
export function createEyeField(count, seed = 7) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    x: 0.08 + rand() * 0.84,
    y: 0.08 + rand() * 0.84,
    size: 0.018 + rand() * 0.035 * (i === count - 1 ? 3.2 : 1),
    openAt: i / count,
    blinkSeed: rand() * 10,
    lag: 0.04 + rand() * 0.1,
    lookX: 0,
    lookY: 0
  }));
}

export function drawEyeField(ctx, w, h, eyes, { progress, pointer, t }) {
  ctx.fillStyle = '#020203';
  ctx.fillRect(0, 0, w, h);
  eyes.forEach((eye) => {
    const open = clamp01((progress - eye.openAt) * 6);
    if (open <= 0) return;
    const blink = Math.sin(t * 0.9 + eye.blinkSeed * 4.1) > 0.985 ? 0.08 : 1;
    const ex = eye.x * w;
    const ey = eye.y * h;
    const size = eye.size * Math.min(w, h) * 2.2;
    const dx = pointer.x - ex;
    const dy = pointer.y - ey;
    const dist = Math.hypot(dx, dy) || 1;
    eye.lookX += ((dx / dist) * Math.min(1, dist / (size * 6)) - eye.lookX) * eye.lag;
    eye.lookY += ((dy / dist) * Math.min(1, dist / (size * 6)) - eye.lookY) * eye.lag;
    [-1, 1].forEach((side) => {
      drawEye(ctx, ex + side * size * 1.25, ey, size, open * blink, eye.lookX, eye.lookY);
    });
  });
}

function drawEye(ctx, x, y, size, open, lookX, lookY) {
  const height = size * 0.48 * open;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.quadraticCurveTo(x, y - height * 2, x + size, y);
  ctx.quadraticCurveTo(x, y + height * 2, x - size, y);
  ctx.closePath();
  const sclera = ctx.createRadialGradient(x, y, 0, x, y, size);
  sclera.addColorStop(0, '#bdb6a3');
  sclera.addColorStop(1, '#4b463c');
  ctx.fillStyle = sclera;
  ctx.fill();
  ctx.clip();
  const ix = x + lookX * size * 0.45;
  const iy = y + lookY * size * 0.3;
  ctx.fillStyle = '#17110c';
  ctx.beginPath();
  ctx.arc(ix, iy, size * 0.42, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(ix, iy, size * 0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(ix - size * 0.12, iy - size * 0.12, size * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// Corridor with a figure. `near` runs 0 (far end) to 1 (filling the frame).
// ---------------------------------------------------------------------------------------------
export function drawCorridor(ctx, w, h, { near = 0, flicker = 1, figure = true, t = 0 } = {}) {
  ctx.fillStyle = '#030303';
  ctx.fillRect(0, 0, w, h);
  const vx = w / 2;
  const vy = h * 0.46;
  const endW = w * 0.09;
  const endH = h * 0.2;

  // Far light
  const glow = ctx.createRadialGradient(vx, vy, 0, vx, vy, w * 0.5);
  glow.addColorStop(0, `rgba(196,180,140,${0.32 * flicker})`);
  glow.addColorStop(0.3, `rgba(70,62,48,${0.18 * flicker})`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Walls, ceiling, and floor as perspective planes
  ctx.strokeStyle = `rgba(120,110,90,${0.16 * flicker})`;
  ctx.lineWidth = 1;
  [[0, 0], [w, 0], [0, h], [w, h]].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(vx + Math.sign(x - vx || 1) * endW / 2, vy + Math.sign(y - vy || 1) * endH / 2);
    ctx.stroke();
  });
  for (let i = 1; i < 9; i += 1) {
    const d = (i / 9) ** 1.8;
    const rw = endW + (w - endW) * d;
    const rh = endH + (h - endH) * d;
    ctx.strokeStyle = `rgba(110,100,80,${0.05 + 0.06 * d * flicker})`;
    ctx.strokeRect(vx - rw / 2, vy - rh / 2, rw, rh);
  }
  ctx.fillStyle = `rgba(210,195,150,${0.5 * flicker})`;
  ctx.fillRect(vx - endW / 2, vy - endH / 2, endW, endH);

  if (figure) drawFigure(ctx, vx, vy + endH / 2, near, h, t, flicker);

  // Fog
  const fog = ctx.createLinearGradient(0, 0, 0, h);
  fog.addColorStop(0, 'rgba(0,0,0,0.75)');
  fog.addColorStop(0.5, 'rgba(10,10,10,0.1)');
  fog.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 0, w, h);
}

function drawFigure(ctx, x, floorY, near, h, t, flicker) {
  const depth = near * near;
  const height = h * (0.18 + depth * 1.35);
  const baseY = floorY + depth * h * 0.55;
  const top = baseY - height;
  const unit = height / 8;
  const sway = Math.sin(t * 0.7) * unit * 0.05;
  ctx.save();
  ctx.translate(x + sway, 0);
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  // Legs
  ctx.lineWidth = unit * 0.32;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * unit * 0.25, top + unit * 4.4);
    ctx.lineTo(side * unit * 0.32, baseY);
    ctx.stroke();
  });
  // Torso: narrow, too long
  ctx.beginPath();
  ctx.moveTo(-unit * 0.55, top + unit * 1.45);
  ctx.lineTo(unit * 0.55, top + unit * 1.5);
  ctx.lineTo(unit * 0.35, top + unit * 4.6);
  ctx.lineTo(-unit * 0.35, top + unit * 4.6);
  ctx.closePath();
  ctx.fill();
  // Arms: reach below the knees, fingers splayed
  ctx.lineWidth = unit * 0.18;
  [-1, 1].forEach((side) => {
    const handX = side * unit * 0.85;
    const handY = top + unit * 6.4;
    ctx.beginPath();
    ctx.moveTo(side * unit * 0.5, top + unit * 1.55);
    ctx.quadraticCurveTo(side * unit * 0.95, top + unit * 3.6, handX, handY);
    ctx.stroke();
    ctx.lineWidth = unit * 0.06;
    for (let f = 0; f < 4; f += 1) {
      ctx.beginPath();
      ctx.moveTo(handX, handY);
      ctx.lineTo(handX + side * unit * (0.05 + f * 0.08), handY + unit * (0.6 + f * 0.05));
      ctx.stroke();
    }
    ctx.lineWidth = unit * 0.18;
  });
  // Neck and tilted head
  ctx.lineWidth = unit * 0.16;
  ctx.beginPath();
  ctx.moveTo(0, top + unit * 1.5);
  ctx.lineTo(unit * 0.12, top + unit * 0.75);
  ctx.stroke();
  ctx.save();
  ctx.translate(unit * 0.18, top + unit * 0.45);
  ctx.rotate(0.5);
  ctx.beginPath();
  ctx.ellipse(0, 0, unit * 0.34, unit * 0.46, 0, 0, TAU);
  ctx.fill();
  // When close, two faint pinpoints where eyes should be
  if (near > 0.55) {
    ctx.fillStyle = `rgba(230,225,210,${(near - 0.55) * 2 * flicker})`;
    ctx.beginPath();
    ctx.arc(-unit * 0.12, -unit * 0.06, unit * 0.035, 0, TAU);
    ctx.arc(unit * 0.12, -unit * 0.04, unit * 0.035, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------
// A doorway, slightly open. With `peek`, a pale face and long fingers appear at the door's edge.
// ---------------------------------------------------------------------------------------------
export function drawDoorway(ctx, w, h, { open = 0.1, peek = 0, light = 1, t = 0, picture = null } = {}) {
  ctx.fillStyle = '#050403';
  ctx.fillRect(0, 0, w, h);
  const dw = Math.min(w * 0.34, h * 0.42);
  const dh = dw * 2.1;
  const dx = (w - dw) / 2;
  const dy = h * 0.5 - dh / 2;

  // Wallpaper wash from a bare bulb above
  const lamp = ctx.createRadialGradient(w / 2, dy - h * 0.05, 0, w / 2, dy, h * 0.9);
  lamp.addColorStop(0, `rgba(170,150,105,${0.35 * light})`);
  lamp.addColorStop(0.6, `rgba(40,34,24,${0.25 * light})`);
  lamp.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, w, h);

  if (picture) drawWallPicture(ctx, dx - dw * 0.95, dy + dh * 0.12, dw * 0.55, picture, light, t);

  // Frame
  ctx.fillStyle = `rgba(52,44,34,${0.9 * light + 0.1})`;
  ctx.fillRect(dx - dw * 0.08, dy - dw * 0.08, dw * 1.16, dh + dw * 0.08);
  // Darkness beyond the door
  ctx.fillStyle = '#000';
  ctx.fillRect(dx, dy, dw, dh);

  // Door leaf hinged on the left, rotating away
  const leaf = dw * (1 - open * 0.85);
  const shade = ctx.createLinearGradient(dx, 0, dx + leaf, 0);
  shade.addColorStop(0, `rgba(96,82,64,${light})`);
  shade.addColorStop(1, `rgba(40,33,25,${light})`);
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(dx, dy);
  ctx.lineTo(dx + leaf, dy + dh * 0.02 * open);
  ctx.lineTo(dx + leaf, dy + dh - dh * 0.02 * open);
  ctx.lineTo(dx, dy + dh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = `rgba(150,130,90,${0.8 * light})`;
  ctx.beginPath();
  ctx.arc(dx + leaf - dw * 0.08, dy + dh * 0.52, dw * 0.025, 0, TAU);
  ctx.fill();

  if (peek > 0) {
    const edge = dx + leaf;
    const gap = dw - leaf;
    const fy = dy + dh * 0.22;
    const fr = dw * 0.16;
    ctx.save();
    ctx.beginPath();
    ctx.rect(edge, dy, gap, dh);
    ctx.clip();
    const shown = fr * 1.2 * peek;
    const fx = edge + shown - fr * 0.5;
    const face = ctx.createRadialGradient(fx - fr * 0.3, fy - fr * 0.3, fr * 0.1, fx, fy, fr * 1.4);
    face.addColorStop(0, `rgba(226,219,204,${light})`);
    face.addColorStop(0.7, `rgba(120,112,100,${light})`);
    face.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = face;
    ctx.beginPath();
    ctx.ellipse(fx, fy + Math.sin(t * 0.5) * 2, fr, fr * 1.35, 0.12, 0, TAU);
    ctx.fill();
    // One wide eye, staring
    ctx.fillStyle = '#e9e4d8';
    ctx.beginPath();
    ctx.ellipse(fx - fr * 0.25, fy - fr * 0.15, fr * 0.26, fr * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(fx - fr * 0.33, fy - fr * 0.14, fr * 0.07, 0, TAU);
    ctx.fill();
    // Hair hanging past the face
    ctx.strokeStyle = 'rgba(5,4,4,0.9)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 26; i += 1) {
      const sx = fx - fr * 0.1 + i * fr * 0.05;
      ctx.beginPath();
      ctx.moveTo(sx, fy - fr * 1.3);
      ctx.quadraticCurveTo(sx + Math.sin(i + t) * 4, fy, sx + Math.sin(i * 3.1) * 8, fy + fr * (1.5 + (i % 5) * 0.25));
      ctx.stroke();
    }
    ctx.restore();
    // Fingers curled around the edge of the door
    ctx.fillStyle = `rgba(200,192,176,${light})`;
    for (let f = 0; f < 4; f += 1) {
      const y = dy + dh * 0.46 + f * dw * 0.06;
      ctx.beginPath();
      ctx.ellipse(edge - dw * 0.02, y, dw * 0.055 * peek, dw * 0.018, 0, 0, TAU);
      ctx.fill();
    }
  }
}

/** A framed picture hanging crooked beside the door. `picture` is an Image or 'grinner'. */
function drawWallPicture(ctx, x, y, width, picture, light, t) {
  const height = width * 1.3;
  ctx.save();
  ctx.translate(x + width / 2, y);
  ctx.rotate(0.05 + Math.sin(t * 0.3) * 0.004);
  ctx.fillStyle = `rgba(30,22,15,${light})`;
  ctx.fillRect(-width / 2 - width * 0.08, -width * 0.08, width * 1.16, height + width * 0.16);
  ctx.fillStyle = '#000';
  ctx.fillRect(-width / 2, 0, width, height);
  if (picture === 'grinner') {
    ctx.beginPath();
    ctx.rect(-width / 2, 0, width, height);
    ctx.clip();
    drawGrinner(ctx, width, height, { t, scale: 1.3, cx: 0, cy: height * 0.55, alpha: light, dark: false });
  } else if (picture?.complete && picture.naturalWidth) {
    const fit = Math.max(width / picture.naturalWidth, height / picture.naturalHeight);
    const sw = width / fit;
    const sh = height / fit;
    ctx.filter = `grayscale(1) sepia(0.4) contrast(1.2) brightness(${0.35 + light * 0.45})`;
    ctx.drawImage(picture, (picture.naturalWidth - sw) / 2, (picture.naturalHeight - sh) / 2, sw, sh, -width / 2, 0, width, height);
    ctx.filter = 'none';
  }
  ctx.restore();
}

/** One found photograph, harsh and torn, for single-frame flashes. */
export function drawFoundFrame(ctx, w, h, img, { alpha = 1, tears = 0 } = {}) {
  if (!img?.complete || !img.naturalWidth) return false;
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = alpha;
  const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const iw = img.naturalWidth * fit;
  const ih = img.naturalHeight * fit;
  ctx.filter = 'grayscale(1) contrast(1.35) brightness(0.9)';
  ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
  ctx.restore();
  if (tears) tear(ctx, w, h, tears, w * 0.08);
  return true;
}

// ---------------------------------------------------------------------------------------------
// "Enhance": zoom into a photograph's dark corner until something looks back.
// ---------------------------------------------------------------------------------------------
export function drawEnhance(ctx, w, h, img, { zoom = 1, tx = 0.8, ty = 0.3, reveal = 0, t = 0 } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  if (img?.complete && img.naturalWidth) {
    const fit = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / (fit * zoom);
    const sh = h / (fit * zoom);
    const sx = clamp(img.naturalWidth * tx - sw / 2, 0, img.naturalWidth - sw);
    const sy = clamp(img.naturalHeight * ty - sh / 2, 0, img.naturalHeight - sh);
    ctx.save();
    ctx.imageSmoothingEnabled = zoom < 3;
    ctx.filter = `grayscale(1) contrast(${1.1 + zoom * 0.05}) brightness(${0.85 - zoom * 0.02})`;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    ctx.restore();
  }
  if (reveal > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    drawGrinner(ctx, w, h, { t, scale: 0.55, alpha: reveal * 0.55, cx: w * 0.5, cy: h * 0.5, dark: false });
    ctx.restore();
  }
  grain(ctx, w, h, 0.1 + zoom * 0.02);
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Severed parts raining down: forearms with hands, loose hands, fingers. Each tumbles as it falls,
 * shows a dark cut with a ring of bone, and trails blood. Drawn over whatever is already there.
 * p: 0–1 through the downpour. Returns how many have hit the floor (for thuds).
 */
export function drawSeveredRain(ctx, w, h, { p = 0, t = 0, count = 22 } = {}) {
  const u = Math.min(w, h);
  let landed = 0;
  for (let i = 0; i < count; i += 1) {
    const start = (i / count) * 0.7;
    if (p < start) continue;
    const k = (p - start) / (1 - start);
    const kind = i % 3; // 0 forearm + hand, 1 hand, 2 finger
    const size = u * (kind === 0 ? 0.32 : kind === 1 ? 0.16 : 0.07) * (0.8 + hash(i * 4.1) * 0.5);
    const x = (0.06 + hash(i * 2.9) * 0.88) * w;
    const floor = h * (0.82 + hash(i * 6.3) * 0.14);
    const fall = Math.min(1, k * 2.4);
    const y = -size + (floor + size) * fall * fall;
    const onFloor = fall >= 1;
    if (onFloor) landed += 1;
    const spin = onFloor ? hash(i) * TAU : k * (4 + hash(i * 8) * 6) + hash(i) * TAU;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    if (kind === 0) {
      limb(ctx, 0, 0, 0, -size * 0.7, size * 0.11, size * 0.08);
      hand(ctx, 0, -size * 0.7, size * 0.38, -Math.PI / 2, t, 0.4 + hash(i) * 0.5);
    } else if (kind === 1) {
      hand(ctx, 0, 0, size, -Math.PI / 2, t, 0.3 + hash(i) * 0.6);
    } else {
      limb(ctx, 0, 0, 0, -size, size * 0.2, size * 0.16);
    }
    // The cut end: dark flesh, a ring of bone
    const cr = kind === 0 ? size * 0.055 : kind === 1 ? size * 0.13 : size * 0.1;
    ctx.fillStyle = '#2a0204';
    ctx.beginPath();
    ctx.ellipse(0, 0, cr, cr * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#ddd2bc';
    ctx.beginPath();
    ctx.ellipse(0, 0, cr * 0.35, cr * 0.18, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
    // Blood trailing behind it while it falls, pooling once it lands
    ctx.fillStyle = 'rgba(70,2,6,0.85)';
    if (!onFloor) {
      ctx.fillRect(x - u * 0.003, Math.max(0, y - size * 1.4), u * 0.006, size * 1.2);
    } else {
      ctx.beginPath();
      ctx.ellipse(x, floor + size * 0.1, size * (0.5 + (k - 0.42) * 0.8), size * 0.12, 0, 0, TAU);
      ctx.fill();
    }
  }
  return landed;
}

/** A wooden mallet, bloodied, at a rotation; drawn in the caller's coordinates. */
function drawMallet(ctx, len, width, bloody) {
  const handle = ctx.createLinearGradient(-width, 0, width, 0);
  handle.addColorStop(0, '#3a2414');
  handle.addColorStop(0.5, '#8a5a32');
  handle.addColorStop(1, '#2a180c');
  ctx.fillStyle = handle;
  ctx.fillRect(-width / 2, -len, width, len);
  const head = ctx.createLinearGradient(0, -len - width * 2.4, 0, -len + width * 1.2);
  head.addColorStop(0, '#9a9a9e');
  head.addColorStop(0.5, '#4a4a4e');
  head.addColorStop(1, '#1e1e22');
  ctx.fillStyle = head;
  ctx.fillRect(-width * 3, -len - width * 2.4, width * 6, width * 3.4);
  if (bloody) {
    ctx.fillStyle = 'rgba(80,4,8,0.95)';
    ctx.fillRect(-width * 3, -len + width * 0.4, width * 6, width * 0.6);
    for (let i = 0; i < 4; i += 1) ctx.fillRect(-width * 2.5 + i * width * 1.5, -len + width, width * 0.35, width * (1 + hash(i) * 3));
  }
}

/**
 * Another blow, already up close: the face fills the screen, the mallet goes up, and comes down on
 * the glass again. Blood spatters the face more each time.  k: 0–1.  Returns true at impact.
 */
export function drawHammerBeat(ctx, w, h, { k = 0, now = 0, blow = 1 } = {}) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const u = Math.min(w, h);
  const lunge = k > 0.6 && k < 0.85 ? 0.12 : 0;
  drawGrinner(ctx, w, h, { t: now / 1000, scale: 1.15 + lunge, grin: 1.25, blood: Math.min(1, 0.6 + blow * 0.2), stare: 1, cy: h * 0.55, dark: false });
  // Spatter across the face, growing with every blow
  ctx.fillStyle = 'rgba(80,3,8,0.9)';
  for (let i = 0; i < blow * 14; i += 1) {
    ctx.beginPath();
    ctx.arc(w * (0.3 + hash(i * 3.1) * 0.4), h * (0.25 + hash(i * 5.3) * 0.55), u * (0.003 + hash(i) * 0.012), 0, TAU);
    ctx.fill();
  }
  const raise = k < 0.6 ? k / 0.6 : 1;
  const strike = k < 0.6 ? 0 : Math.min(1, (k - 0.6) / 0.15);
  ctx.save();
  ctx.translate(w * 0.5 + u * 0.48, h * 0.62);
  ctx.rotate(-1.5 - raise * 0.9 + strike * 2.6);
  drawMallet(ctx, u * 0.85, u * 0.04, true);
  ctx.restore();
  grain(ctx, w, h, 0.25);
  return k >= 0.74;
}

/**
 * It turns the severed forearm around and drives the broken bone end into your screen.
 * Drawn over the current scene (no clear).  k: 0–1 for one stab.  Returns true at impact.
 */
export function drawBoneStab(ctx, w, h, { k = 0, t = 0 } = {}) {
  const u = Math.min(w, h);
  // wind back, thrust, hold, pull out
  const thrust = k < 0.45 ? 0 : k < 0.62 ? easeIn((k - 0.45) / 0.17) : k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2;
  const tipX = w * (0.78 - thrust * 0.28) + Math.sin(t * 30) * u * 0.004 * thrust;
  const tipY = h * (0.3 + thrust * 0.2);
  const scale = 0.6 + thrust * 2.4;
  const angle = Math.atan2(tipY + h, tipX - w * 1.4); // the arm comes from below right, toward the glass
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle - Math.PI / 2);
  ctx.scale(scale, scale);
  // the forearm, held by its wrist off screen
  limb(ctx, 0, u * 0.06, 0, u * 0.5, u * 0.05, u * 0.06);
  // the broken end: splintered white bone, stained dark
  ctx.fillStyle = '#e8dfcc';
  ctx.beginPath();
  ctx.moveTo(-u * 0.02, u * 0.07);
  ctx.lineTo(-u * 0.008, -u * 0.02);
  ctx.lineTo(u * 0.002, u * 0.03);
  ctx.lineTo(u * 0.012, -u * 0.04);
  ctx.lineTo(u * 0.022, u * 0.07);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(70,4,6,0.9)';
  ctx.beginPath();
  ctx.ellipse(0, u * 0.075, u * 0.03, u * 0.012, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-u * 0.004, u * 0.07, u * 0.008, u * 0.06);
  ctx.restore();
  return k >= 0.6 && k < 0.66;
}

/** Just the grin (black mouth, long teeth, dark gums), centred, for a decal on a 3D head. */
export function drawGrinDecal(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  mouth(ctx, w / 2, h * 0.45, w * 0.92, 1, 0, 0);
  ctx.fillStyle = 'rgba(70,4,6,0.9)';
  for (let i = 0; i < 5; i += 1) ctx.fillRect(w * (0.25 + i * 0.12), h * 0.55, w * 0.02, h * (0.1 + hash(i) * 0.3));
}
