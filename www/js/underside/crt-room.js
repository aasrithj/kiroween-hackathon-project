// A real 3D living room at 3 AM, built with three.js: an old CRT television on a wooden stand,
// a lamp, a framed photograph, curtains, and an armchair in the foreground. The Smile Tapes play
// live on the TV's curved glass (a 2D canvas used as a texture), and the screen is the main light.
// Everything is procedural: geometry from primitives, textures painted on canvases at load time.

import * as THREE from '../../vendor/three/three.module.js';

const SCREEN_W = 512;
const SCREEN_H = 384;

export function createCrtRoom(canvas, { wallImage } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050303);
  scene.fog = new THREE.FogExp2(0x070404, 0.07);

  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.05, 40);
  const disposables = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };

  // ---------- the screen: a 2D canvas the tapes are drawn into ----------
  const screen = document.createElement('canvas');
  screen.width = SCREEN_W;
  screen.height = SCREEN_H;
  const screenTexture = track(new THREE.CanvasTexture(screen));
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  screenTexture.minFilter = THREE.LinearFilter;
  screenTexture.generateMipmaps = false;

  // ---------- painted textures ----------
  const wallpaper = track(paint(512, 512, drawWallpaper, [3, 1.6]));
  const wood = track(paint(512, 256, drawWood, [1, 1]));
  const carpet = track(paint(256, 256, drawCarpet, [6, 6]));
  const curtain = track(paint(256, 512, drawCurtain, [1, 1]));
  const fabric = track(paint(256, 256, drawFabric, [2, 2]));
  const grille = track(paint(128, 160, drawGrille, [1, 1]));
  const sheen = track(paint(256, 256, drawSheen, [1, 1]));
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 512;
  labelCanvas.height = 80;
  const labelTexture = track(new THREE.CanvasTexture(labelCanvas));
  labelTexture.colorSpace = THREE.SRGBColorSpace;

  const mat = (options) => track(new THREE.MeshStandardMaterial(options));
  const woodMat = mat({ map: wood, roughness: 0.72, metalness: 0.05, color: 0x8a6a58 });
  const plasticMat = mat({ color: 0x1a1513, roughness: 0.55, metalness: 0.1 });
  const darkMat = mat({ color: 0x050404, roughness: 0.9 });
  const knobMat = mat({ color: 0x0e0c0b, roughness: 0.35, metalness: 0.25, flatShading: true });
  const chromeMat = mat({ color: 0x9a9088, roughness: 0.25, metalness: 0.9 });

  // ---------- room ----------
  const floor = mesh(new THREE.PlaneGeometry(14, 14), mat({ map: carpet, roughness: 1, color: 0x6a4a44 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = mat({ map: wallpaper, roughness: 0.95, color: 0x9a7a74 });
  const backWall = mesh(new THREE.PlaneGeometry(12, 5), wallMat);
  backWall.position.set(0, 2.5, -0.75);
  backWall.receiveShadow = true;
  scene.add(backWall);
  const leftWall = mesh(new THREE.PlaneGeometry(10, 5), wallMat);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-3.2, 2.5, 3);
  scene.add(leftWall);

  // ---------- TV stand ----------
  const stand = new THREE.Group();
  const top = mesh(new THREE.BoxGeometry(1.9, 0.06, 0.72), woodMat);
  top.position.y = 0.62;
  const shelf = mesh(new THREE.BoxGeometry(1.8, 0.04, 0.66), woodMat);
  shelf.position.y = 0.2;
  stand.add(top, shelf);
  [[-0.9, -0.31], [0.9, -0.31], [-0.9, 0.31], [0.9, 0.31]].forEach(([x, z]) => {
    const leg = mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), woodMat);
    leg.position.set(x, 0.31, z);
    stand.add(leg);
  });
  // VHS tapes stacked on the shelf, spines out. The top one wears the current tape's label.
  const tapeMat = mat({ color: 0x0b0b0b, roughness: 0.5 });
  const labelMat = mat({ map: labelTexture, roughness: 0.8 });
  for (let i = 0; i < 4; i += 1) {
    const box = mesh(new THREE.BoxGeometry(0.42, 0.055, 0.24), i === 3 ? [tapeMat, tapeMat, tapeMat, tapeMat, labelMat, tapeMat] : tapeMat);
    box.position.set(-0.35 + (i % 2) * 0.03, 0.25 + i * 0.056, 0.1 - i * 0.01);
    box.rotation.y = (i % 2 ? 0.04 : -0.03);
    stand.add(box);
  }
  const vcr = mesh(new THREE.BoxGeometry(0.62, 0.11, 0.42), plasticMat);
  vcr.position.set(0.45, 0.28, 0.05);
  const vcrSlot = mesh(new THREE.BoxGeometry(0.3, 0.012, 0.01), darkMat);
  vcrSlot.position.set(0.42, 0.3, 0.265);
  const vcrLed = mesh(new THREE.BoxGeometry(0.06, 0.018, 0.005), track(new THREE.MeshBasicMaterial({ color: 0x40ff70 })));
  vcrLed.position.set(0.66, 0.29, 0.265);
  stand.add(vcr, vcrSlot, vcrLed);
  stand.traverse((child) => {
    child.castShadow = true;
    child.receiveShadow = true;
  });
  scene.add(stand);

  // ---------- the television ----------
  const tv = new THREE.Group();
  tv.position.set(0, 1.1, -0.05);
  const cabinetShape = roundedRectShape(1.34, 0.9, 0.09);
  const cabinetGeo = track(new THREE.ExtrudeGeometry(cabinetShape, {
    depth: 0.56,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: 10
  }));
  cabinetGeo.center();
  const cabinet = mesh(cabinetGeo, woodMat);
  cabinet.castShadow = true;
  tv.add(cabinet);
  const front = 0.32; // z of the cabinet's front face, in TV space

  // Bezel with a rounded window; the curved screen sits just behind it.
  const bezelShape = roundedRectShape(1.0, 0.78, 0.05);
  bezelShape.holes.push(roundedRectShape(0.84, 0.64, 0.09));
  const bezel = mesh(track(new THREE.ShapeGeometry(bezelShape, 12)), plasticMat);
  bezel.position.set(-0.16, 0, front + 0.004);
  tv.add(bezel);

  const screenGeo = track(new THREE.PlaneGeometry(0.88, 0.68, 40, 30));
  bulge(screenGeo, 0.055);
  const screenMat = track(new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }));
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(-0.16, 0, front - 0.03);
  tv.add(screenMesh);
  // A faint sheen on the glass
  const glassMat = track(new THREE.MeshBasicMaterial({ map: sheen, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  const glass = new THREE.Mesh(screenGeo, glassMat);
  glass.position.copy(screenMesh.position).add(new THREE.Vector3(0, 0, 0.004));
  tv.add(glass);

  // Control panel: two ridged knobs, a speaker grille, a little chrome badge.
  [0.2, 0.02].forEach((y, i) => {
    const knob = mesh(track(new THREE.CylinderGeometry(0.058, 0.066, 0.045, 18)), knobMat);
    knob.rotation.x = Math.PI / 2;
    knob.rotation.y = i ? 1.2 : -0.6;
    knob.position.set(0.47, y, front + 0.02);
    const pointer = mesh(new THREE.BoxGeometry(0.008, 0.05, 0.004), chromeMat);
    pointer.position.set(0, 0.024, 0);
    pointer.rotation.x = -Math.PI / 2;
    knob.add(pointer);
    tv.add(knob);
  });
  const grilleMesh = mesh(new THREE.PlaneGeometry(0.2, 0.25), mat({ map: grille, roughness: 0.8 }));
  grilleMesh.position.set(0.47, -0.24, front + 0.002);
  tv.add(grilleMesh);
  const badge = mesh(new THREE.BoxGeometry(0.12, 0.018, 0.006), chromeMat);
  badge.position.set(-0.16, -0.405, front + 0.003);
  tv.add(badge);

  // Rabbit-ear antenna
  const antennaBase = mesh(track(new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2)), plasticMat);
  antennaBase.position.set(0.12, 0.47, -0.05);
  tv.add(antennaBase);
  [-0.42, 0.38].forEach((tilt) => {
    const rod = mesh(track(new THREE.CylinderGeometry(0.005, 0.007, 0.95, 6)), chromeMat);
    rod.geometry.translate(0, 0.475, 0);
    rod.position.copy(antennaBase.position);
    rod.rotation.z = tilt;
    rod.rotation.x = -0.25;
    tv.add(rod);
  });
  tv.traverse((child) => {
    if (child !== screenMesh && child !== glass) child.castShadow = true;
  });
  scene.add(tv);

  // ---------- lamp ----------
  const lamp = new THREE.Group();
  lamp.position.set(-1.75, 0, -0.25);
  const lampBase = mesh(track(new THREE.CylinderGeometry(0.16, 0.2, 0.05, 20)), chromeMat);
  const pole = mesh(track(new THREE.CylinderGeometry(0.015, 0.015, 1.15, 8)), chromeMat);
  pole.position.y = 0.6;
  const shadeMat = mat({ color: 0x8a6a52, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x5a2c12, emissiveIntensity: 0.35 });
  const shade = mesh(track(new THREE.CylinderGeometry(0.15, 0.28, 0.34, 24, 1, true)), shadeMat);
  shade.position.y = 1.25;
  lamp.add(lampBase, pole, shade);
  const lampLight = new THREE.PointLight(0xff9a50, 6, 5, 2);
  lampLight.position.set(0, 1.15, 0.05);
  lamp.add(lampLight);
  scene.add(lamp);

  // ---------- framed photograph ----------
  const frame = new THREE.Group();
  frame.position.set(-1.05, 2.0, -0.72);
  frame.rotation.z = 0.035;
  frame.add(mesh(new THREE.BoxGeometry(0.62, 0.48, 0.03), woodMat));
  const photoMat = mat({ color: 0x777777, roughness: 0.6 });
  const photo = mesh(new THREE.PlaneGeometry(0.52, 0.38), photoMat);
  photo.position.z = 0.017;
  frame.add(photo);
  scene.add(frame);
  if (wallImage) {
    const loader = () => {
      const tex = track(new THREE.Texture(wallImage));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      photoMat.map = tex;
      photoMat.color.set(0x8a8070);
      photoMat.needsUpdate = true;
    };
    if (wallImage.complete && wallImage.naturalWidth) loader();
    else wallImage.addEventListener('load', loader, { once: true });
  }

  // ---------- curtains ----------
  const curtainMat = mat({ map: curtain, roughness: 1, side: THREE.DoubleSide, color: 0x9a6a64 });
  [1.7, 2.45].forEach((x, i) => {
    const geo = track(new THREE.PlaneGeometry(0.85, 3.6, 48, 1));
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v += 1) pos.setZ(v, Math.sin(pos.getX(v) * 22 + i) * 0.045);
    geo.computeVertexNormals();
    const panel = new THREE.Mesh(geo, curtainMat);
    panel.position.set(x, 1.8, -0.62);
    panel.receiveShadow = true;
    scene.add(panel);
  });

  // ---------- armchair, close to the camera, bottom left ----------
  const chair = new THREE.Group();
  chair.position.set(-1.35, 0, 2.75);
  chair.rotation.y = 0.5;
  const fabricMat = mat({ map: fabric, roughness: 1, color: 0x7a5a58 });
  const seatGeo = track(new THREE.ExtrudeGeometry(roundedRectShape(0.9, 0.5, 0.12), { depth: 0.8, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3 }));
  seatGeo.center();
  const seat = mesh(seatGeo, fabricMat);
  seat.position.y = 0.32;
  const armGeo = track(new THREE.ExtrudeGeometry(roundedRectShape(0.2, 0.75, 0.08), { depth: 0.85, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 3 }));
  armGeo.center();
  const armLeft = mesh(armGeo, fabricMat);
  armLeft.position.set(-0.5, 0.42, 0);
  const armRight = mesh(armGeo, fabricMat);
  armRight.position.set(0.5, 0.42, 0);
  chair.add(seat, armLeft, armRight);
  scene.add(chair);

  // ---------- lights ----------
  scene.add(new THREE.AmbientLight(0x3a2020, 1.4));
  const screenLight = new THREE.PointLight(0xc8d0ff, 3, 6, 2);
  screenLight.position.set(-0.16, 1.12, 0.75);
  screenLight.castShadow = true;
  screenLight.shadow.mapSize.set(512, 512);
  screenLight.shadow.bias = -0.002;
  scene.add(screenLight);

  // ---------- screen colour sampling, to tint the room with whatever is on the TV ----------
  const probe = document.createElement('canvas');
  probe.width = probe.height = 4;
  const probeCtx = probe.getContext('2d', { willReadFrequently: true });
  const glow = new THREE.Color(0.7, 0.75, 1);
  let frameCount = 0;
  let brightness = 0.6;

  // ---------- camera path: a slow push-in, then into the glass ----------
  const from = new THREE.Vector3(0.05, 1.25, 3.1);
  const near = new THREE.Vector3(-0.13, 1.12, 1.35);
  const inside = new THREE.Vector3(-0.16, 1.1, 0.62);
  const lookAt = new THREE.Vector3(-0.1, 1.1, 0);
  const camPos = new THREE.Vector3();

  function drawLabel(text) {
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = '#0b0b0b';
    ctx.fillRect(0, 0, 512, 80);
    ctx.fillStyle = '#e4dac2';
    ctx.fillRect(60, 12, 392, 56);
    ctx.fillStyle = '#1a1612';
    ctx.font = '600 40px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 42, 370);
    labelTexture.needsUpdate = true;
  }
  let currentLabel = '';

  return {
    screen,

    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    /** q: 0–1 progress through the tapes; pointer: -1…1; label: the tape on the shelf. */
    render({ q, now, pointer = { x: 0, y: 0 }, label = '', gentle = false }) {
      if (label !== currentLabel) {
        currentLabel = label;
        drawLabel(label);
      }
      screenTexture.needsUpdate = true;

      frameCount += 1;
      if (frameCount % 5 === 0) {
        probeCtx.drawImage(screen, 0, 0, 4, 4);
        const d = probeCtx.getImageData(0, 0, 4, 4).data;
        let r = 0;
        let g = 0;
        let b = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
        }
        const n = (d.length / 4) * 255;
        glow.setRGB(r / n, g / n, b / n);
        brightness = (r + g + b) / (3 * n);
      }
      const flicker = !gentle && Math.random() < 0.04 ? 0.45 : 1;
      screenLight.color.copy(glow).lerp(new THREE.Color(1, 1, 1), 0.25);
      screenLight.intensity = (5 + brightness * 22) * flicker;
      lampLight.intensity = 6 + Math.sin(now * 0.013) * 0.2 + (Math.random() < 0.01 ? -3.5 : 0);

      // Camera: push in across the three tapes, then through the glass at the very end.
      const push = smooth(Math.min(1, q / 0.9));
      camPos.lerpVectors(from, near, push);
      if (q > 0.9) camPos.lerp(inside, smooth((q - 0.9) / 0.1));
      const t = now / 1000;
      const sway = gentle ? 0 : 1;
      camPos.x += (Math.sin(t * 0.31) * 0.03 + pointer.x * 0.12) * sway;
      camPos.y += (Math.sin(t * 0.47) * 0.015 - pointer.y * 0.06) * sway;
      camera.position.copy(camPos);
      camera.lookAt(lookAt);
      camera.rotation.z += Math.sin(t * 0.23) * 0.006 * sway;

      renderer.render(scene, camera);
    },

    dispose() {
      disposables.forEach((thing) => thing.dispose?.());
      scene.traverse((child) => child.geometry?.dispose?.());
      renderer.dispose();
    }
  };

  function mesh(geometry, material) {
    track(geometry);
    return new THREE.Mesh(geometry, material);
  }
}

// ---------- geometry helpers ----------
export function roundedRectShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** Push a plane's centre forward like CRT glass. */
function bulge(geometry, depth) {
  const pos = geometry.attributes.position;
  geometry.computeBoundingBox();
  const { max } = geometry.boundingBox;
  for (let i = 0; i < pos.count; i += 1) {
    const u = pos.getX(i) / max.x;
    const v = pos.getY(i) / max.y;
    pos.setZ(i, depth * (1 - u * u) * (1 - v * v));
  }
  geometry.computeVertexNormals();
}

const smooth = (x) => {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
};

// ---------- painted textures ----------
export function paint(width, height, draw, repeat) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.anisotropy = 4;
  return texture;
}

function speckle(ctx, w, h, amount, alpha) {
  for (let i = 0; i < amount; i += 1) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * alpha})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}

export function drawWallpaper(ctx, w, h) {
  ctx.fillStyle = '#3a2020';
  ctx.fillRect(0, 0, w, h);
  // Faded damask: rows of four-petal flowers between thin stripes.
  for (let x = 0; x < w; x += 64) {
    ctx.fillStyle = 'rgba(255,220,200,0.05)';
    ctx.fillRect(x, 0, 3, h);
  }
  for (let y = 32; y < h; y += 96) {
    for (let x = 32; x < w; x += 64) {
      const ox = (y / 96) % 2 ? 32 : 0;
      ctx.fillStyle = 'rgba(120,70,60,0.35)';
      for (let p = 0; p < 4; p += 1) {
        ctx.beginPath();
        ctx.ellipse(x + ox + Math.cos((p * Math.PI) / 2) * 9, y + Math.sin((p * Math.PI) / 2) * 12, 7, 11, (p * Math.PI) / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Water stains
  for (let i = 0; i < 6; i += 1) {
    const g = ctx.createRadialGradient(Math.random() * w, Math.random() * h, 0, Math.random() * w, Math.random() * h, 60 + Math.random() * 120);
    g.addColorStop(0, 'rgba(20,8,4,0.35)');
    g.addColorStop(1, 'rgba(20,8,4,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  speckle(ctx, w, h, 4000, 0.35);
}

export function drawWood(ctx, w, h) {
  ctx.fillStyle = '#3b2416';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    const shade = 30 + Math.sin(y * 0.11) * 12 + Math.random() * 10;
    ctx.fillStyle = `rgba(${shade},${shade * 0.6},${shade * 0.35},0.35)`;
    ctx.fillRect(0, y + Math.sin(y * 0.05) * 3, w, 1);
  }
  speckle(ctx, w, h, 1500, 0.4);
}

function drawCarpet(ctx, w, h) {
  ctx.fillStyle = '#2d1715';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i += 1) {
    const v = 20 + Math.random() * 40;
    ctx.fillStyle = `rgba(${v + 20},${v * 0.55},${v * 0.5},0.5)`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 2);
  }
}

function drawCurtain(ctx, w, h) {
  ctx.fillStyle = '#4a2424';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = `rgba(210,170,160,${0.08 + Math.random() * 0.12})`;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  speckle(ctx, w, h, 3000, 0.5);
}

function drawFabric(ctx, w, h) {
  ctx.fillStyle = '#3a2626';
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) {
    for (let x = 0; x < w; x += 16) {
      ctx.fillStyle = (x + y) % 32 ? 'rgba(150,110,100,0.16)' : 'rgba(20,10,10,0.25)';
      ctx.fillRect(x, y, 16, 16);
    }
  }
  speckle(ctx, w, h, 2500, 0.5);
}

function drawGrille(ctx, w, h) {
  ctx.fillStyle = '#16110f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#030202';
  for (let y = 8; y < h - 8; y += 9) ctx.fillRect(8, y, w - 16, 4);
}

function drawSheen(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, 'rgba(255,255,255,0.0)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.22)');
  g.addColorStop(0.36, 'rgba(255,255,255,0.0)');
  g.addColorStop(1, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const v = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}
