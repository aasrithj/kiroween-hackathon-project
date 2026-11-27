// The Smile Tapes: three home-made VHS tapes found in the Underside, played upright on "the TV".
// TAPE 1 · SMILE      a family photograph. Slowly, everyone in it starts to grin too wide.
// TAPE 2 · RULES      a calm instructional broadcast with rules for when "it" smiles.
// TAPE 3 · YOUR TURN  labelled with the visitor's name. Something smiles its way out of the dark.
// All original; the only borrowed thing is a public-domain 1920s spirit photograph.

import { drawGrinner, grain, tear } from './creatures.js';

const TAU = Math.PI * 2;
const HAND = '"Caveat", "Comic Sans MS", cursive';
const MONO = 'VT323, ui-monospace, monospace';

// Face positions in assets/underside/found/hope-couple-spirit.jpg (fractions of the image).
const FAMILY_FACES = [
  { x: 0.255, y: 0.555, w: 0.15 },
  { x: 0.745, y: 0.6, w: 0.14 },
  { x: 0.462, y: 0.255, w: 0.13 }
];

export function drawTape(ctx, w, h, { tape, index, phase, t, name, image, now, rules, onTv = false }) {
  // On the 3D TV the cassette sits on the shelf, so the screen shows NO SIGNAL while it loads.
  if (phase === 'label') return onTv ? drawNoSignal(ctx, w, h, { now, t }) : drawCassette(ctx, w, h, tape, index, name, t);
  if (phase === 'blue') return drawBlue(ctx, w, h, t);
  if (index === 0) drawFamily(ctx, w, h, image, t, now);
  else if (index === 1) drawRules(ctx, w, h, rules, t, now);
  else drawYourTurn(ctx, w, h, t, now);
  stamp(ctx, w, h, index === 2 ? 'OCT 31 2026  3:00 AM' : `OCT 31 199${4 + index}`);
  grain(ctx, w, h, 0.16);
  if (Math.random() < 0.05) tear(ctx, w, h, 3, w * 0.03);
}

function drawCassette(ctx, w, h, tape, index, name, t) {
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, w, h);
  const cw = Math.min(w * 0.62, h * 1.05);
  const ch = cw * 0.58;
  // Slides in from below, as if pushed into the VCR.
  const ease = 1 - (1 - Math.min(1, t * 1.6)) ** 3;
  const x = (w - cw) / 2;
  const y = h * 0.5 - ch / 2 + (1 - ease) * h * 0.6 - Math.max(0, t - 0.7) * h * 1.2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = cw * 0.08;
  roundRect(ctx, x, y, cw, ch, cw * 0.03);
  ctx.fillStyle = '#121212';
  ctx.fill();
  ctx.restore();
  // Spool windows
  ctx.fillStyle = '#1e1e1e';
  roundRect(ctx, x + cw * 0.22, y + ch * 0.56, cw * 0.56, ch * 0.26, ch * 0.05);
  ctx.fill();
  [0.36, 0.64].forEach((u) => {
    ctx.fillStyle = '#2c2621';
    ctx.beginPath();
    ctx.arc(x + cw * u, y + ch * 0.69, ch * 0.1, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(x + cw * u, y + ch * 0.69, ch * 0.035, 0, TAU);
    ctx.fill();
  });
  // Paper label, slightly crooked
  ctx.save();
  ctx.translate(x + cw * 0.5, y + ch * 0.27);
  ctx.rotate(index === 2 ? -0.035 : 0.015);
  ctx.fillStyle = '#e6dcc4';
  ctx.fillRect(-cw * 0.4, -ch * 0.17, cw * 0.8, ch * 0.34);
  ctx.strokeStyle = 'rgba(160,40,40,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-cw * 0.38, -ch * 0.08);
  ctx.lineTo(cw * 0.38, -ch * 0.08);
  ctx.stroke();
  ctx.fillStyle = '#1b1712';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${Math.round(ch * 0.12)}px ${HAND}`;
  const label = index === 2 && name ? `YOUR TURN, ${name}` : tape.label;
  ctx.fillText(label, 0, ch * 0.03, cw * 0.74);
  ctx.font = `${Math.round(ch * 0.075)}px ${HAND}`;
  ctx.fillText(`${tape.date}${tape.note ? `  ·  ${tape.note}` : ''}`, 0, ch * 0.12, cw * 0.74);
  ctx.font = `${Math.round(ch * 0.07)}px ${MONO}`;
  ctx.fillStyle = '#5c5242';
  ctx.fillText(`TAPE ${index + 1}/3`, 0, -ch * 0.125);
  ctx.restore();
  grain(ctx, w, h, 0.12);
}

/** Snow, a face in the snow, and NO SIGNAL. */
export function drawNoSignal(ctx, w, h, { now = 0, t = 0 } = {}) {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y += 1) {
    const row = Math.random() < 0.06 ? 1.6 : 0.7 + Math.random() * 0.5; // bright horizontal streaks
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const v = Math.min(255, Math.random() * 190 * row);
      data[i] = v;
      data[i + 1] = v * 0.94;
      data[i + 2] = v * 0.94;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // The face surfaces in the snow and sinks again.
  const presence = 0.25 + 0.35 * Math.max(0, Math.sin(now / 900 + t * 3));
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  drawGrinner(ctx, w, h, { t: now / 1000, scale: 0.62, cy: h * 0.42, dark: false, grin: 1, blood: 0.8, stare: 0.6, alpha: presence + 0.3 });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = presence;
  drawGrinner(ctx, w, h, { t: now / 1000, scale: 0.62, cy: h * 0.42, dark: false, grin: 1, blood: 0.8, stare: 0.6 });
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, h * 0.72, w, h * 0.12);
  ctx.font = `${Math.round(h * 0.1)}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,60,60,0.6)';
  ctx.fillText('NO SIGNAL', w / 2 + 3, h * 0.78);
  ctx.fillStyle = 'rgba(60,220,255,0.6)';
  ctx.fillText('NO SIGNAL', w / 2 - 3, h * 0.78);
  ctx.fillStyle = '#f2efe6';
  ctx.fillText('NO SIGNAL', w / 2, h * 0.78);
}

function drawBlue(ctx, w, h, t) {
  ctx.fillStyle = t < 0.3 ? '#000' : '#1f2fb8';
  ctx.fillRect(0, 0, w, h);
  if (t >= 0.3) {
    ctx.fillStyle = '#f2f2f2';
    ctx.font = `${Math.round(h * 0.08)}px ${MONO}`;
    ctx.textBaseline = 'top';
    ctx.fillText('PLAY ▶', w * 0.06, h * 0.08);
  }
}

function drawFamily(ctx, w, h, img, t, now) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  if (!img?.complete || !img.naturalWidth) return;
  // Slow push-in toward the faint figure behind the couple.
  const zoom = 1 + t * 0.35;
  const fit = Math.min(w / img.naturalWidth, h / img.naturalHeight) * 0.95 * zoom;
  const iw = img.naturalWidth * fit;
  const ih = img.naturalHeight * fit;
  const ix = (w - iw) / 2 - (FAMILY_FACES[2].x - 0.5) * iw * (zoom - 1);
  const iy = (h - ih) / 2 - (FAMILY_FACES[2].y - 0.5) * ih * (zoom - 1);
  ctx.save();
  ctx.filter = `grayscale(0.6) sepia(0.5) contrast(1.15) brightness(${0.95 - t * 0.25})`;
  ctx.drawImage(img, ix, iy, iw, ih);
  ctx.restore();

  // The smiles: they start small, then stretch past the edges of the faces.
  const grin = Math.max(0, (t - 0.3) / 0.6);
  if (grin <= 0) return;
  FAMILY_FACES.forEach((face, i) => {
    const fx = ix + face.x * iw;
    const fy = iy + face.y * ih;
    const fw = face.w * iw;
    const width = fw * (0.25 + grin * 0.9) * (i === 2 ? 1.2 : 1);
    const mouthY = fy + fw * 0.32;
    smile(ctx, fx, mouthY, width, fw * 0.08 * (0.4 + grin), Math.min(1, grin * 1.6));
    if (grin > 0.55) {
      // Eyes go hollow.
      ctx.fillStyle = `rgba(0,0,0,${Math.min(0.85, (grin - 0.55) * 2.2)})`;
      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.ellipse(fx + side * fw * 0.17, fy - fw * 0.05, fw * 0.09, fw * 0.07, 0, 0, TAU);
        ctx.fill();
      });
    }
  });
  if (t > 0.94) tear(ctx, w, h, 6, w * 0.05);
  void now;
}

function smile(ctx, x, y, width, depth, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y - depth * 0.6);
  ctx.quadraticCurveTo(x, y + depth * 0.6, x + width / 2, y - depth * 0.6);
  ctx.quadraticCurveTo(x, y + depth * 2.4, x - width / 2, y - depth * 0.6);
  ctx.closePath();
  ctx.fillStyle = '#120708';
  ctx.fill();
  ctx.clip();
  const teeth = Math.max(6, Math.round(width / 4));
  ctx.fillStyle = '#d9d1bd';
  for (let i = 0; i < teeth; i += 1) {
    const u = (i + 0.5) / teeth;
    const tx = x - width / 2 + u * width;
    ctx.fillRect(tx - width / teeth / 2.6, y - depth, width / teeth / 1.3, depth * 1.25);
  }
  ctx.restore();
}

function drawRules(ctx, w, h, rules, t, now) {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0d1a3a');
  bg.addColorStop(1, '#050a18');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const index = Math.min(rules.length - 1, Math.floor(t * rules.length));
  const last = index === rules.length - 1;

  ctx.fillStyle = 'rgba(220,226,240,0.7)';
  ctx.font = `${Math.round(h * 0.045)}px ${MONO}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(`SMILE SAFETY · RULE ${index + 1} OF ${rules.length}`, w * 0.06, h * 0.07);

  // The little mascot gets more teeth with every rule.
  const cx = w / 2;
  const cy = h * 0.4;
  const r = h * 0.14;
  if (last) {
    drawGrinner(ctx, w, h, { t: now / 1000, scale: 0.5, cx, cy, dark: false });
  } else {
    ctx.fillStyle = '#f0d24a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#111';
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.arc(cx + s * r * 0.35, cy - r * 0.25, r * (0.08 + index * 0.03), 0, TAU);
      ctx.fill();
    });
    smile(ctx, cx, cy + r * 0.25, r * (0.9 + index * 0.25), r * (0.08 + index * 0.05), 1);
  }

  ctx.fillStyle = '#f4f2ea';
  ctx.font = `${Math.round(h * (last ? 0.13 : 0.085))}px ${MONO}`;
  ctx.textAlign = 'center';
  ctx.fillText(rules[index], w / 2, h * 0.66, w * 0.9);
}

function drawYourTurn(ctx, w, h, t, now) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  // Stutter: the tape only updates a few times a second, like a damaged recording.
  const stepped = Math.floor(t * 28) / 28;
  if (t > 0.93) {
    // The tape ends in noise.
    const img = ctx.createImageData(w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 200;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return;
  }
  const alpha = Math.min(1, stepped * 1.6) * 0.9;
  const scale = 0.25 + stepped ** 2 * 1.1;
  drawGrinner(ctx, w, h, { t: now / 1000, scale, alpha, dark: false, cy: h * (0.62 - stepped * 0.1) });
}

function stamp(ctx, w, h, text) {
  ctx.save();
  // Top right, so it never collides with the camcorder's own clock at the bottom.
  ctx.font = `${Math.round(h * 0.05)}px ${MONO}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(245,240,225,0.85)';
  ctx.fillText(text, w * 0.95, h * 0.08);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
