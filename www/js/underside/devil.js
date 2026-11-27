// The host. Too big for the screen: horns past the top edge, shoulders past the bottom, long fingers
// curled over the sides of your monitor. It breathes. Its mouth is a crack with a fire behind it.
//   presence 0–1  rising out of the fog
//   speak    0–1  how open the mouth is (follow the voice)
//   rage     0–1  when you try to cancel your RSVP

const TAU = Math.PI * 2;
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawDevil(ctx, w, h, { t = 0, presence = 1, speak = 0, rage = 0 } = {}) {
  const u = Math.min(w, h);
  const shake = rage * u * 0.008;
  ctx.save();
  ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  // Red fog and the glow of something burning below
  const fog = ctx.createRadialGradient(w / 2, h * 1.05, u * 0.1, w / 2, h * 0.7, Math.max(w, h));
  fog.addColorStop(0, `rgba(${150 + rage * 80},${20 + rage * 10},8,1)`);
  fog.addColorStop(0.35, 'rgba(60,4,4,1)');
  fog.addColorStop(1, '#030000');
  ctx.fillStyle = fog;
  ctx.fillRect(-u, -u, w + u * 2, h + u * 2);

  // Embers drifting up
  for (let i = 0; i < 70; i += 1) {
    const speed = 0.04 + hash(i) * 0.08;
    const y = h - ((t * speed * h + hash(i * 7) * h) % (h * 1.1));
    const x = hash(i * 3) * w + Math.sin(t * 0.8 + i) * u * 0.02;
    const r = u * (0.0015 + hash(i * 5) * 0.003);
    ctx.fillStyle = `rgba(255,${120 + hash(i) * 80},40,${0.4 + hash(i * 11) * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fill();
  }

  const rise = 1 - presence;
  const cx = w / 2;
  const breathe = Math.sin(t * 0.9) * 0.012;
  const headY = h * (0.42 + rise * 0.7);
  const scale = u * (1.05 + breathe + presence * 0.05);

  // Shoulders and chest, a black mass filling the bottom of the screen
  ctx.fillStyle = '#040101';
  ctx.beginPath();
  ctx.moveTo(-u * 0.2, h + u);
  ctx.quadraticCurveTo(cx - scale * 0.75, headY + scale * 0.2, cx - scale * 0.18, headY + scale * 0.22);
  ctx.lineTo(cx + scale * 0.18, headY + scale * 0.22);
  ctx.quadraticCurveTo(cx + scale * 0.75, headY + scale * 0.2, w + u * 0.2, h + u);
  ctx.closePath();
  ctx.fill();

  // Horns: long, ridged, curling up and out past the top of the screen
  [-1, 1].forEach((s) => {
    ctx.save();
    ctx.translate(cx + s * scale * 0.13, headY - scale * 0.16);
    const steps = 26;
    for (let i = steps; i >= 0; i -= 1) {
      const k = i / steps;
      const x = s * (k * scale * 0.42 + Math.sin(k * 2.6) * scale * 0.08);
      const y = -k * scale * 0.62 + k * k * scale * 0.18;
      const r = scale * (0.05 * (1 - k) + 0.006);
      const g = ctx.createRadialGradient(x - s * r * 0.3, y - r * 0.3, 0, x, y, r);
      g.addColorStop(0, i % 3 === 0 ? '#4a3a32' : '#2c211c');
      g.addColorStop(1, '#0a0605');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  });

  // Head: long, gaunt, mostly in shadow, rim-lit red from below
  const head = ctx.createRadialGradient(cx, headY + scale * 0.12, scale * 0.02, cx, headY, scale * 0.24);
  head.addColorStop(0, `rgba(${90 + rage * 60},14,8,1)`);
  head.addColorStop(0.5, '#1a0504');
  head.addColorStop(1, '#050101');
  ctx.fillStyle = head;
  ctx.beginPath();
  ctx.ellipse(cx, headY, scale * 0.16, scale * 0.23, 0, 0, TAU);
  ctx.fill();

  // Eyes: molten, slit-pupilled, much too bright
  const blink = Math.sin(t * 0.7) > 0.992 ? 0.1 : 1;
  [-1, 1].forEach((s) => {
    const ex = cx + s * scale * 0.065;
    const ey = headY - scale * 0.04;
    const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, scale * (0.08 + rage * 0.05));
    glow.addColorStop(0, 'rgba(255,230,140,0.95)');
    glow.addColorStop(0.25, 'rgba(255,120,20,0.7)');
    glow.addColorStop(1, 'rgba(180,10,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(ex, ey, scale * (0.08 + rage * 0.05), 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff1b0';
    ctx.beginPath();
    ctx.ellipse(ex, ey, scale * 0.032, scale * 0.014 * blink, s * -0.25, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#120200';
    ctx.beginPath();
    ctx.ellipse(ex, ey, scale * 0.004, scale * 0.013 * blink, 0, 0, TAU);
    ctx.fill();
  });

  // Mouth: a crack with fire behind it, splitting wider when it talks
  const open = Math.min(1, speak + rage * 0.6);
  const mw = scale * (0.07 + open * 0.05);
  const my = headY + scale * 0.1;
  const fire = ctx.createLinearGradient(0, my - scale * 0.02, 0, my + scale * 0.05);
  fire.addColorStop(0, '#ffde7a');
  fire.addColorStop(0.5, '#ff5a10');
  fire.addColorStop(1, '#5a0400');
  ctx.fillStyle = fire;
  ctx.beginPath();
  ctx.moveTo(cx - mw, my - scale * 0.012);
  ctx.quadraticCurveTo(cx, my + scale * 0.005, cx + mw, my - scale * 0.012);
  ctx.quadraticCurveTo(cx, my + scale * (0.015 + open * 0.07), cx - mw, my - scale * 0.012);
  ctx.fill();
  ctx.fillStyle = '#0a0302';
  for (let i = 0; i < 14; i += 1) {
    const x = cx - mw * 0.9 + (i / 13) * mw * 1.8;
    ctx.beginPath();
    ctx.moveTo(x - scale * 0.005, my - scale * 0.01);
    ctx.lineTo(x + scale * 0.005, my - scale * 0.01);
    ctx.lineTo(x, my + scale * (0.008 + open * 0.02));
    ctx.fill();
  }

  // Fingers over the edges of your screen, top left and top right
  [[0, -1], [w, 1]].forEach(([edge, s]) => {
    for (let f = 0; f < 4; f += 1) {
      const y = h * (0.12 + f * 0.07) + rise * h * 0.6;
      const len = u * (0.12 + hash(f + s) * 0.05) * presence;
      ctx.strokeStyle = '#090202';
      ctx.lineCap = 'round';
      ctx.lineWidth = u * 0.018;
      ctx.beginPath();
      ctx.moveTo(edge, y);
      ctx.quadraticCurveTo(edge - s * len * 0.7, y - u * 0.01, edge - s * len, y + u * 0.03);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,40,20,0.35)';
      ctx.lineWidth = u * 0.004;
      ctx.stroke();
    }
  });

  ctx.restore();
}

/**
 * The host reaches for you: a huge black hand with long talons comes up out of the fog toward the
 * camera, fills the screen, and its nails catch the glass.  p: 0–1.
 */
export function drawDevilClaw(ctx, w, h, { p = 0, t = 0, clear = true } = {}) {
  if (clear) ctx.clearRect(0, 0, w, h);
  const u = Math.min(w, h);
  const reach = Math.min(1, p / 0.6);
  const scale = u * (0.25 + reach * reach * 1.3);
  const cx = w * 0.45 + (1 - reach) * w * 0.1;
  const cy = h * (1.15 - reach * 0.55);
  const tremble = Math.sin(t * 40) * u * 0.002;
  ctx.save();
  ctx.translate(cx + tremble, cy);
  ctx.rotate(-0.35);
  // Back of the hand, lit red from below
  const g = ctx.createRadialGradient(0, scale * 0.3, scale * 0.05, 0, 0, scale * 0.6);
  g.addColorStop(0, '#3a0806');
  g.addColorStop(0.6, '#120202');
  g.addColorStop(1, '#030000');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, scale * 0.2, scale * 0.3, scale * 0.35, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-scale * 0.18, scale * 0.3, scale * 0.36, scale * 0.9); // wrist going back into the dark
  // Five long fingers ending in talons, curling toward the glass as it arrives
  const curl = Math.max(0, (p - 0.55) / 0.45);
  for (let f = 0; f < 5; f += 1) {
    let a = -Math.PI / 2 + (f - 2) * 0.32 + (f === 0 ? -0.5 : 0);
    let x = (f - 2) * scale * 0.12;
    let y = -scale * 0.05;
    let width = scale * 0.07;
    const seg = scale * (f === 0 ? 0.2 : 0.3);
    for (let j = 0; j < 3; j += 1) {
      const nx = x + Math.cos(a) * seg;
      const ny = y + Math.sin(a) * seg;
      ctx.strokeStyle = '#0d0202';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      // red rim light along each joint
      ctx.strokeStyle = 'rgba(180,30,10,0.35)';
      ctx.lineWidth = width * 0.25;
      ctx.stroke();
      x = nx;
      y = ny;
      width *= 0.8;
      a += curl * 0.35 * (f < 2 ? -1 : 1);
    }
    // Talon: long, glinting
    const tg = ctx.createLinearGradient(x, y, x + Math.cos(a) * scale * 0.18, y + Math.sin(a) * scale * 0.18);
    tg.addColorStop(0, '#2a2420');
    tg.addColorStop(1, '#d8cfc0');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.5, y);
    ctx.lineTo(x + Math.cos(a) * scale * 0.2, y + Math.sin(a) * scale * 0.2);
    ctx.lineTo(x + width * 0.5, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
