// The nursery. A porcelain baby doll in a rocking chair, lit by moonlight. Every time the music box
// winds down, the doll is a little less like a baby doll.
//   stage   0–1   0 = sweet porcelain doll, 1 = something wearing one
//   wind    0–1   how wound the music box is (the crank turns while you hold)
//   look    -1–1  where the head is turned (0 = toward you)
//   light   0–1   the lamp flickers when the music stops

const TAU = Math.PI * 2;
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export function drawNursery(ctx, w, h, { t = 0, stage = 0, wind = 0, look = 0, light = 1, crank = 0, near = 0, headless = false } = {}) {
  const u = Math.min(w, h);
  // ---------- room ----------
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, `rgba(${46 * light + 8},${34 * light + 6},${40 * light + 8},1)`);
  wall.addColorStop(0.7, `rgba(${30 * light + 4},${22 * light + 4},${26 * light + 4},1)`);
  wall.addColorStop(1, '#070506');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  // Faded wallpaper: small repeating rabbits gone grey (just soft ovals pairs)
  ctx.fillStyle = `rgba(200,170,180,${0.05 * light})`;
  for (let y = u * 0.05; y < h * 0.7; y += u * 0.12) {
    for (let x = (y / (u * 0.12)) % 2 ? u * 0.06 : 0; x < w; x += u * 0.12) {
      ctx.beginPath();
      ctx.ellipse(x, y, u * 0.012, u * 0.02, 0, 0, TAU);
      ctx.ellipse(x + u * 0.02, y - u * 0.025, u * 0.004, u * 0.014, 0.2, 0, TAU);
      ctx.fill();
    }
  }
  // Moonlight through a window, falling across the floor
  const wx = w * 0.12;
  const wy = h * 0.12;
  const ww = u * 0.26;
  const wh = u * 0.34;
  ctx.fillStyle = 'rgba(120,150,200,0.22)';
  ctx.fillRect(wx, wy, ww, wh);
  ctx.strokeStyle = 'rgba(10,8,10,0.9)';
  ctx.lineWidth = u * 0.012;
  ctx.strokeRect(wx, wy, ww, wh);
  ctx.beginPath();
  ctx.moveTo(wx + ww / 2, wy);
  ctx.lineTo(wx + ww / 2, wy + wh);
  ctx.moveTo(wx, wy + wh / 2);
  ctx.lineTo(wx + ww, wy + wh / 2);
  ctx.stroke();
  const beam = ctx.createLinearGradient(wx, wy, w * 0.6, h);
  beam.addColorStop(0, 'rgba(140,170,220,0.16)');
  beam.addColorStop(1, 'rgba(140,170,220,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(wx, wy + wh);
  ctx.lineTo(wx + ww, wy + wh);
  ctx.lineTo(w * 0.78, h);
  ctx.lineTo(w * 0.32, h);
  ctx.closePath();
  ctx.fill();
  // Floor
  const floor = ctx.createLinearGradient(0, h * 0.72, 0, h);
  floor.addColorStop(0, '#120c0a');
  floor.addColorStop(1, '#050303');
  ctx.fillStyle = floor;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  // Crib bars on the right
  ctx.fillStyle = `rgba(20,14,12,${0.95})`;
  for (let i = 0; i < 9; i += 1) ctx.fillRect(w * 0.8 + i * u * 0.03, h * 0.34, u * 0.012, h * 0.44);
  ctx.fillRect(w * 0.79, h * 0.33, u * 0.3, u * 0.02);
  ctx.fillRect(w * 0.79, h * 0.76, u * 0.3, u * 0.02);

  // ---------- rocking chair, rocking on its own ----------
  const cx = w * 0.52;
  const floorY = h * (0.97 + near * 0.42);
  const rock = Math.sin(t * 1.3) * 0.06 * (1 - stage * 0.6);
  ctx.save();
  ctx.translate(cx, floorY);
  ctx.scale(1.55 + near * 1.1, 1.55 + near * 1.1); // every time the music stops, it is closer
  ctx.rotate(rock);
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = u * 0.016;
  ctx.lineCap = 'round';
  // rocker
  ctx.beginPath();
  ctx.arc(0, -u * 0.62, u * 0.64, Math.PI * 0.38, Math.PI * 0.62);
  ctx.stroke();
  // legs, seat, back spindles
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(s * u * 0.2, -u * 0.02);
    ctx.lineTo(s * u * 0.17, -u * 0.22);
    ctx.lineTo(s * u * 0.16, -u * 0.62);
    ctx.stroke();
  });
  ctx.fillStyle = '#2f1e12';
  ctx.fillRect(-u * 0.19, -u * 0.24, u * 0.38, u * 0.035);
  for (let i = 0; i < 5; i += 1) ctx.fillRect(-u * 0.13 + i * u * 0.06, -u * 0.6, u * 0.012, u * 0.36);
  ctx.fillRect(-u * 0.18, -u * 0.63, u * 0.36, u * 0.04);

  drawDoll(ctx, u, { t, stage, look, headless });
  ctx.restore();

  // ---------- music box on the floor ----------
  drawMusicBox(ctx, w * 0.27, h * 0.9, u * 0.09, { crank, wind, stage });

  // Lamp-flicker darkness
  if (light < 1) {
    ctx.fillStyle = `rgba(0,0,0,${(1 - light) * 0.85})`;
    ctx.fillRect(0, 0, w, h);
  }
  // Vignette
  const v = ctx.createRadialGradient(w / 2, h * 0.55, u * 0.2, w / 2, h * 0.55, Math.max(w, h) * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

function drawDoll(ctx, u, { t, stage, look, headless = false }) {
  const headR = u * 0.075;
  // ---------- body in a lace dress, sitting ----------
  const dress = ctx.createLinearGradient(-u * 0.12, -u * 0.42, u * 0.12, -u * 0.22);
  dress.addColorStop(0, '#d8d2c6');
  dress.addColorStop(0.5, '#efe9de');
  dress.addColorStop(1, '#a59e92');
  ctx.fillStyle = dress;
  ctx.beginPath();
  ctx.moveTo(-u * 0.06, -u * 0.42);
  ctx.quadraticCurveTo(-u * 0.16, -u * 0.28, -u * 0.14, -u * 0.22);
  ctx.lineTo(u * 0.14, -u * 0.22);
  ctx.quadraticCurveTo(u * 0.16, -u * 0.28, u * 0.06, -u * 0.42);
  ctx.closePath();
  ctx.fill();
  // Folds in the fabric, and the shadow the head casts on the collar
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(80,70,60,0.35)';
  ctx.lineWidth = u * 0.006;
  for (let f = -3; f <= 3; f += 1) {
    ctx.beginPath();
    ctx.moveTo(f * u * 0.012, -u * 0.4);
    ctx.quadraticCurveTo(f * u * 0.03, -u * 0.3, f * u * 0.045, -u * 0.22);
    ctx.stroke();
  }
  const collar = ctx.createRadialGradient(0, -u * 0.42, 0, 0, -u * 0.42, u * 0.1);
  collar.addColorStop(0, 'rgba(30,20,20,0.6)');
  collar.addColorStop(1, 'rgba(30,20,20,0)');
  ctx.fillStyle = collar;
  ctx.fillRect(-u * 0.2, -u * 0.5, u * 0.4, u * 0.2);
  ctx.restore();
  // The collar soaks through with blood, spreading down the dress
  if (stage > 0.3) {
    const soak = ctx.createRadialGradient(0, -u * 0.41, 0, 0, -u * 0.41, u * (0.03 + stage * 0.13));
    soak.addColorStop(0, `rgba(90,4,8,${0.5 + stage * 0.4})`);
    soak.addColorStop(1, 'rgba(90,4,8,0)');
    ctx.fillStyle = soak;
    ctx.fillRect(-u * 0.18, -u * 0.45, u * 0.36, u * 0.25);
  }
  // Open scissors in its lap, the blades dark
  if (stage > 0.6) {
    ctx.save();
    ctx.translate(u * 0.05, -u * 0.27);
    ctx.rotate(-0.5);
    [0.18, -0.18].forEach((a) => {
      ctx.save();
      ctx.rotate(a);
      const blade = ctx.createLinearGradient(0, 0, u * 0.09, 0);
      blade.addColorStop(0, '#c8c8cc');
      blade.addColorStop(0.6, '#6a1a1c');
      blade.addColorStop(1, '#3a0206');
      ctx.fillStyle = blade;
      ctx.beginPath();
      ctx.moveTo(0, -u * 0.004);
      ctx.lineTo(u * 0.09, 0);
      ctx.lineTo(0, u * 0.004);
      ctx.fill();
      ctx.strokeStyle = '#2a2a2e';
      ctx.lineWidth = u * 0.004;
      ctx.beginPath();
      ctx.arc(-u * 0.015, 0, u * 0.01, 0, TAU);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }
  // Lace scallops at the hem; they darken as stains spread
  ctx.fillStyle = stage > 0.6 ? `rgba(70,8,10,${(stage - 0.6) * 1.6})` : 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 9; i += 1) {
    ctx.beginPath();
    ctx.arc(-u * 0.13 + i * u * 0.0325, -u * 0.22, u * 0.014, 0, Math.PI);
    ctx.fill();
  }
  // Porcelain arms and dangling legs
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#e6d6cc';
  ctx.lineWidth = u * 0.022;
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(s * u * 0.06, -u * 0.39);
    ctx.quadraticCurveTo(s * u * 0.13, -u * 0.33, s * u * 0.08 + (stage > 0.85 ? s * u * 0.06 : 0), -u * 0.27);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * u * 0.05, -u * 0.22);
    ctx.lineTo(s * u * 0.055, -u * 0.12);
    ctx.stroke();
  });
  ctx.fillStyle = '#3a2418';
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.ellipse(s * u * 0.056, -u * 0.11, u * 0.022, u * 0.012, 0, 0, TAU);
    ctx.fill();
  });

  // ---------- head ----------
  // At the end the head turns too far: it snaps sideways, the way necks don't.
  const snap = stage > 0.9 ? (stage - 0.9) * 10 : 0;
  // Skipped-frame twitches once it has started to go wrong
  const tick = Math.floor(t * 9);
  const twitch = stage > 0.3 && hash(tick) > 0.86 ? (hash(tick + 3) - 0.5) * 0.7 * stage : 0;
  const tilt = look * 0.5 + snap * 1.45 + Math.sin(t * 0.6) * 0.03 + twitch;
  ctx.save();
  ctx.translate(0, -u * 0.47);
  ctx.rotate(tilt);

  if (!headless) {
    drawDollHead(ctx, headR, { t, stage });
  } else {
    // Where the head was: a ragged porcelain collar, dark inside, still dripping.
    ctx.fillStyle = '#0a0304';
    ctx.beginPath();
    ctx.ellipse(0, headR * 0.9, headR * 0.45, headR * 0.16, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(70,4,6,0.95)';
    ctx.fillRect(-headR * 0.05, headR * 0.95, headR * 0.1, headR * 1.4);
  }
  ctx.restore();
}

/** The doll's porcelain head, centred on the origin (used on the body, and when it comes off). */
export function drawDollHead(ctx, headR, { t = 0, stage = 0 } = {}) {
  // Curls behind the face
  ctx.fillStyle = '#6b4a2a';
  for (let i = 0; i < 16; i += 1) {
    const a = Math.PI * 0.95 + (i / 15) * Math.PI * 1.1;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * headR * 1.05, Math.sin(a) * headR * 1.0 + headR * 0.1, headR * 0.32, 0, TAU);
    ctx.fill();
  }
  // Porcelain face, with a glossy highlight
  const skin = ctx.createRadialGradient(-headR * 0.3, -headR * 0.35, headR * 0.1, 0, 0, headR * 1.1);
  skin.addColorStop(0, '#fff8f2');
  skin.addColorStop(0.55, '#f0dfd5');
  skin.addColorStop(1, '#bfa498');
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.08, 0, 0, TAU);
  ctx.fill();
  // Cold moonlight catching the left edge; deep shadow under the brow and chin
  const rim = ctx.createLinearGradient(-headR, 0, -headR * 0.4, 0);
  rim.addColorStop(0, 'rgba(150,180,255,0.55)');
  rim.addColorStop(1, 'rgba(150,180,255,0)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.08, 0, 0, TAU);
  ctx.fill();
  const occlusion = ctx.createRadialGradient(0, headR * 0.2, headR * 0.6, 0, headR * 0.2, headR * 1.2);
  occlusion.addColorStop(0, 'rgba(40,20,20,0)');
  occlusion.addColorStop(1, `rgba(40,20,20,${0.45 + stage * 0.3})`);
  ctx.fillStyle = occlusion;
  ctx.beginPath();
  ctx.ellipse(0, 0, headR, headR * 1.08, 0, 0, TAU);
  ctx.fill();
  // Painted rosy cheeks (they run when it changes)
  [-1, 1].forEach((s) => {
    const cheek = ctx.createRadialGradient(s * headR * 0.5, headR * 0.3, 0, s * headR * 0.5, headR * 0.3, headR * 0.3);
    cheek.addColorStop(0, 'rgba(230,110,120,0.5)');
    cheek.addColorStop(1, 'rgba(230,110,120,0)');
    ctx.fillStyle = cheek;
    ctx.beginPath();
    ctx.arc(s * headR * 0.5, headR * 0.3, headR * 0.3, 0, TAU);
    ctx.fill();
    if (stage > 0.45) {
      ctx.fillStyle = `rgba(150,50,60,${Math.min(0.7, (stage - 0.45) * 2)})`;
      ctx.fillRect(s * headR * 0.5 - headR * 0.02, headR * 0.3, headR * 0.04, headR * 0.6 * (stage - 0.45));
    }
  });

  // Cracks spreading from the crown
  if (stage > 0.12) {
    ctx.strokeStyle = 'rgba(40,26,22,0.85)';
    ctx.lineWidth = Math.max(1, headR * 0.025);
    const cracks = 3 + Math.floor(stage * 5);
    for (let c = 0; c < cracks; c += 1) {
      let x = (hash(c) - 0.5) * headR * 0.9;
      let y = -headR * 0.95;
      const steps = Math.floor(3 + (stage - 0.12) * 14);
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let k = 0; k < steps; k += 1) {
        x += (hash(c * 13 + k) - 0.5) * headR * 0.3;
        y += headR * 0.13;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // A piece of the cheek has fallen out. Inside, something wet looks back at you.
  if (stage > 0.5) {
    ctx.save();
    ctx.fillStyle = '#050303';
    ctx.beginPath();
    ctx.moveTo(headR * 0.22, headR * 0.02);
    ctx.lineTo(headR * 0.74, headR * 0.1);
    ctx.lineTo(headR * 0.66, headR * 0.52);
    ctx.lineTo(headR * 0.3, headR * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.clip();
    const ex = headR * 0.48;
    const ey = headR * 0.27;
    const blink = Math.sin(t * 1.7) > 0.97 ? 0.15 : 1;
    const sclera = ctx.createRadialGradient(ex, ey, 0, ex, ey, headR * 0.16);
    sclera.addColorStop(0, '#f0e2d8');
    sclera.addColorStop(0.7, '#d8a8a0');
    sclera.addColorStop(1, '#5a1a1a');
    ctx.fillStyle = sclera;
    ctx.beginPath();
    ctx.ellipse(ex, ey, headR * 0.15, headR * 0.11 * blink, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,20,20,0.7)'; // bloodshot
    ctx.lineWidth = Math.max(1, headR * 0.008);
    for (let v = 0; v < 6; v += 1) {
      const a = (v / 6) * TAU;
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a) * headR * 0.14, ey + Math.sin(a) * headR * 0.1);
      ctx.lineTo(ex + Math.cos(a + 0.3) * headR * 0.07, ey + Math.sin(a + 0.3) * headR * 0.05);
      ctx.stroke();
    }
    ctx.fillStyle = '#3a2412';
    ctx.beginPath();
    ctx.arc(ex - headR * 0.01, ey, headR * 0.055 * blink, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ex - headR * 0.01, ey, headR * 0.025 * blink, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(ex - headR * 0.03, ey - headR * 0.02, headR * 0.01, 0, TAU);
    ctx.fill();
    ctx.restore();
    // jagged porcelain edge
    ctx.strokeStyle = '#f6ece4';
    ctx.lineWidth = Math.max(1, headR * 0.015);
    ctx.beginPath();
    ctx.moveTo(headR * 0.22, headR * 0.02);
    ctx.lineTo(headR * 0.74, headR * 0.1);
    ctx.lineTo(headR * 0.66, headR * 0.52);
    ctx.lineTo(headR * 0.3, headR * 0.46);
    ctx.closePath();
    ctx.stroke();
  }

  // Eyes: glass, blue, with lashes. Then one rolls back. Then both are black with a red point.
  [-1, 1].forEach((s) => {
    const ex = s * headR * 0.36;
    const ey = -headR * 0.08;
    const er = headR * 0.2;
    ctx.fillStyle = '#f4f2ee';
    ctx.beginPath();
    ctx.ellipse(ex, ey, er, er * 0.85, 0, 0, TAU);
    ctx.fill();
    const rolled = stage > 0.3 && s === 1 && stage < 0.7;
    if (stage >= 0.7) {
      ctx.fillStyle = '#020101';
      ctx.beginPath();
      ctx.ellipse(ex, ey, er * 1.05, er * 0.95, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff2a12';
      ctx.shadowColor = '#ff2a12';
      ctx.shadowBlur = er;
      ctx.beginPath();
      ctx.arc(ex + Math.sin(t * 3 + s) * er * 0.1, ey, er * 0.13, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (!rolled) {
      const iris = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 0.62);
      iris.addColorStop(0, '#0b1a2a');
      iris.addColorStop(0.4, '#2f6aa0');
      iris.addColorStop(1, '#173450');
      ctx.fillStyle = iris;
      ctx.beginPath();
      ctx.arc(ex, ey + er * 0.05, er * (0.62 - stage * 0.3), 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(ex, ey + er * 0.05, er * 0.22, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.arc(ex - er * 0.2, ey - er * 0.2, er * 0.12, 0, TAU);
      ctx.fill();
    } else {
      // Rolled back: just the bottom sliver of iris
      ctx.fillStyle = '#2f6aa0';
      ctx.beginPath();
      ctx.ellipse(ex, ey - er * 0.75, er * 0.5, er * 0.18, 0, 0, Math.PI);
      ctx.fill();
    }
    // Lashes
    ctx.strokeStyle = '#1a120e';
    ctx.lineWidth = Math.max(1, headR * 0.02);
    for (let l = 0; l < 6; l += 1) {
      const a = Math.PI + 0.3 + (l / 5) * (Math.PI - 0.6);
      ctx.beginPath();
      ctx.moveTo(ex + Math.cos(a) * er, ey + Math.sin(a) * er * 0.85);
      ctx.lineTo(ex + Math.cos(a) * er * 1.35, ey + Math.sin(a) * er * 1.25);
      ctx.stroke();
    }
    // Blood tears in the final stage
    if (stage > 0.75) {
      const g = ctx.createLinearGradient(0, ey + er, 0, ey + er + headR * 1.2);
      g.addColorStop(0, 'rgba(70,4,6,0.95)');
      g.addColorStop(1, 'rgba(30,0,2,0.85)');
      ctx.fillStyle = g;
      ctx.fillRect(ex - er * 0.12, ey + er * 0.7, er * 0.24, headR * 1.2 * (stage - 0.75) * 4);
    }
  });

  // Mouth: a painted rosebud, then a split from cheek to cheek with tiny teeth,
  // then the jaw comes unhinged: hanging open far too wide, black inside, long teeth.
  if (stage > 0.88) {
    const drop = headR * (0.55 + Math.sin(t * 7) * 0.04);
    ctx.fillStyle = '#060102';
    ctx.beginPath();
    ctx.moveTo(-headR * 0.5, headR * 0.3);
    ctx.quadraticCurveTo(0, headR * 0.22, headR * 0.5, headR * 0.3);
    ctx.quadraticCurveTo(headR * 0.4, headR * 0.3 + drop * 1.6, 0, headR * 0.3 + drop * 1.7);
    ctx.quadraticCurveTo(-headR * 0.4, headR * 0.3 + drop * 1.6, -headR * 0.5, headR * 0.3);
    ctx.fill();
    ctx.fillStyle = '#e6dcc6';
    for (let i = 0; i < 12; i += 1) {
      const x = -headR * 0.42 + (i / 11) * headR * 0.84;
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.03, headR * 0.29);
      ctx.lineTo(x + headR * 0.03, headR * 0.29);
      ctx.lineTo(x, headR * (0.29 + 0.18 + hash(i) * 0.12));
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(70,4,6,0.95)';
    ctx.fillRect(-headR * 0.04, headR * 0.3 + drop * 1.6, headR * 0.08, headR * 0.6);
  } else if (stage < 0.5) {
    ctx.fillStyle = '#c2505c';
    ctx.beginPath();
    ctx.ellipse(0, headR * 0.5, headR * 0.12, headR * 0.07, 0, 0, TAU);
    ctx.fill();
  } else {
    const grin = Math.min(1, (stage - 0.5) / 0.35);
    const mw = headR * (0.25 + grin * 0.75);
    ctx.fillStyle = '#140406';
    ctx.beginPath();
    ctx.moveTo(-mw, headR * 0.38 - grin * headR * 0.15);
    ctx.quadraticCurveTo(0, headR * 0.55, mw, headR * 0.38 - grin * headR * 0.15);
    ctx.quadraticCurveTo(0, headR * (0.62 + grin * 0.35), -mw, headR * 0.38 - grin * headR * 0.15);
    ctx.fill();
    ctx.fillStyle = '#e8e0cc';
    const teeth = 10 + Math.round(grin * 10);
    for (let i = 0; i < teeth; i += 1) {
      const x = -mw * 0.85 + (i / (teeth - 1)) * mw * 1.7;
      ctx.beginPath();
      ctx.moveTo(x - headR * 0.03, headR * 0.47);
      ctx.lineTo(x + headR * 0.03, headR * 0.47);
      ctx.lineTo(x, headR * (0.56 + grin * 0.06));
      ctx.closePath();
      ctx.fill();
    }
  }

  // Lace bonnet
  ctx.strokeStyle = 'rgba(240,236,228,0.85)';
  ctx.lineWidth = headR * 0.12;
  ctx.beginPath();
  ctx.arc(0, headR * 0.1, headR * 1.15, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
}

function drawMusicBox(ctx, x, y, size, { crank, wind, stage }) {
  ctx.save();
  ctx.translate(x, y);
  // Lacquered box
  const g = ctx.createLinearGradient(-size, -size * 0.6, size, 0);
  g.addColorStop(0, '#3a1218');
  g.addColorStop(0.5, '#6a2a30');
  g.addColorStop(1, '#2a0a10');
  ctx.fillStyle = g;
  ctx.fillRect(-size, -size * 0.6, size * 2, size * 0.6);
  ctx.fillStyle = '#c9a25a';
  ctx.fillRect(-size, -size * 0.62, size * 2, size * 0.05);
  // Lid slightly open; a tiny dancer inside who faces the wall when it's over
  ctx.save();
  ctx.translate(0, -size * 0.6);
  ctx.rotate(-0.35);
  ctx.fillStyle = '#4a1a20';
  ctx.fillRect(-size, -size * 0.06, size * 2, size * 0.06);
  ctx.restore();
  ctx.fillStyle = '#e8ddd0';
  ctx.beginPath();
  ctx.ellipse(0, -size * 0.75, size * 0.05, size * 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = stage > 0.6 ? '#1a0306' : '#e8b8c0';
  ctx.beginPath();
  ctx.arc(0, -size * 0.9, size * 0.05, 0, TAU);
  ctx.fill();
  // Crank on the side, turning while wound
  ctx.translate(size, -size * 0.3);
  ctx.rotate(crank);
  ctx.strokeStyle = '#d8b46a';
  ctx.lineWidth = size * 0.06;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size * 0.28, 0);
  ctx.lineTo(size * 0.28, size * 0.18);
  ctx.stroke();
  ctx.restore();
  // Wind meter is drawn by the DOM button; `wind` is here for future use.
  void wind;
}

/**
 * The head comes off. It drops from the chair, bounces once, then rolls across the floor straight at
 * you, getting bigger, and stops face-up against the glass with its eyes open.  p: 0–1.
 * Returns 'impact' on the frame it hits the glass.
 */
export function drawRollingHead(ctx, w, h, { p = 0, t = 0, stage = 1, near = 0 } = {}) {
  const u = Math.min(w, h);
  const startX = w * 0.52;
  const startY = h * (0.97 + near * 0.42) - u * 0.47 * (1.55 + near * 1.1);
  const floor = h * 0.86;
  const r0 = u * 0.075 * (1.55 + near * 1.1);
  let x;
  let y;
  let r;
  let spin;
  if (p < 0.25) {
    // Falling, with a bounce
    const k = p / 0.25;
    const fall = k < 0.7 ? (k / 0.7) ** 2 : 1 - Math.sin(((k - 0.7) / 0.3) * Math.PI) * 0.12;
    x = startX + k * u * 0.05;
    y = startY + (floor - startY) * fall;
    r = r0;
    spin = k * 1.2;
  } else if (p < 0.85) {
    // Rolling toward the camera: bigger, lower, faster
    const k = (p - 0.25) / 0.6;
    const ease = k * k;
    x = startX + u * 0.05 + Math.sin(k * 7) * u * 0.02;
    r = r0 * (1 + ease * 5.5);
    y = floor + ease * (h * 0.62 - floor) + r * 0.2;
    spin = 1.2 + ease * 9;
  } else {
    // Stopped against the glass, upright, staring
    const k = (p - 0.85) / 0.15;
    x = startX + u * 0.05;
    r = r0 * 6.5;
    y = h * 0.62 + r * 0.2;
    spin = (1 - Math.min(1, k * 3)) * 10.2 + Math.min(1, k * 3) * Math.round(10.2 / TAU) * TAU;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  drawDollHead(ctx, r, { t, stage });
  ctx.restore();
  return p >= 0.85 ? 'impact' : '';
}
