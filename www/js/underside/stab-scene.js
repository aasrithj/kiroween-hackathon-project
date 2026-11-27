// A 3D scene for the ending: the party, after. A dining room lit by one swinging bulb. The tall pale
// thing stands at the table over the party cake with a carving knife, and stabs it, again and again,
// faster, until the cake bleeds across the tablecloth. Then it turns its head to you, and comes.
// Built procedurally in three.js; the face is the Grinner painted onto a canvas texture.

import * as THREE from '../../vendor/three/three.module.js';
import { drawGrinDecal, drawGrinner } from './creatures.js';
import { GLTFLoader } from '../../vendor/three/addons/loaders/GLTFLoader.js';

export const STAB_SCENE_SECONDS = 7.4;
const STABS = [1.6, 2.5, 3.15, 3.65, 4.05, 4.4]; // seconds; each one faster than the last

export function createStabScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020101);
  scene.fog = new THREE.FogExp2(0x030101, 0.18);
  const camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 30);
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };
  const mat = (o) => keep(new THREE.MeshStandardMaterial(o));

  // Room
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(12, 12)), mat({ color: 0x1a0e0a, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(keep(new THREE.PlaneGeometry(12, 6)), mat({ color: 0x2a1614, roughness: 1 }));
  wall.position.set(0, 3, -2.6);
  scene.add(floor, wall);

  // Table with a white cloth
  const cloth = mat({ color: 0xe8e2d6, roughness: 0.85 });
  const top = new THREE.Mesh(keep(new THREE.BoxGeometry(2.6, 0.08, 1.3)), cloth);
  top.position.set(0, 0.8, 0);
  top.receiveShadow = true;
  scene.add(top);
  const drape = new THREE.Mesh(keep(new THREE.BoxGeometry(2.66, 0.5, 1.36)), cloth);
  drape.position.set(0, 0.56, 0);
  scene.add(drape);

  // The party cake: two tiers, white frosting, candles still lit
  const cake = new THREE.Group();
  cake.position.set(0.15, 0.84, 0.05);
  const frosting = mat({ color: 0xf2ece4, roughness: 0.6 });
  const tier1 = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 32)), frosting);
  tier1.position.y = 0.11;
  const tier2 = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 32)), frosting);
  tier2.position.y = 0.3;
  [tier1, tier2].forEach((m) => {
    m.castShadow = true;
    cake.add(m);
  });
  const flames = [];
  for (let i = 0; i < 5; i += 1) {
    const a = (i / 5) * Math.PI * 2;
    const candle = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6)), mat({ color: 0xd8c8f0 }));
    candle.position.set(Math.cos(a) * 0.12, 0.43, Math.sin(a) * 0.12);
    const flame = new THREE.Mesh(keep(new THREE.SphereGeometry(0.012, 6, 6)), keep(new THREE.MeshBasicMaterial({ color: 0xffb050 })));
    flame.position.set(candle.position.x, 0.5, candle.position.z);
    flames.push(flame);
    cake.add(candle, flame);
  }
  scene.add(cake);

  // Blood: stains that spread on the cake and the cloth, and drops thrown out by each stab
  const stainTex = keep(radialTexture('rgba(90,0,6,1)', 'rgba(60,0,4,0)'));
  const stainMat = keep(new THREE.MeshBasicMaterial({ map: stainTex, transparent: true, depthWrite: false }));
  const stains = [];
  function addStain(x, y, z, size, onCake) {
    const m = new THREE.Mesh(keep(new THREE.PlaneGeometry(1, 1)), stainMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.scale.setScalar(0.01);
    scene.add(m);
    stains.push({ m, target: size, onCake });
  }
  const dropGeo = keep(new THREE.SphereGeometry(0.014, 6, 6));
  const dropMat = keep(new THREE.MeshStandardMaterial({ color: 0x5a0206, roughness: 0.2, metalness: 0.1 }));
  const drops = [];
  function spray(origin, count) {
    for (let i = 0; i < count; i += 1) {
      const d = new THREE.Mesh(dropGeo, dropMat);
      d.position.copy(origin);
      const v = new THREE.Vector3((Math.random() - 0.5) * 2.2, 1 + Math.random() * 2, (Math.random() - 0.2) * 2.2);
      scene.add(d);
      drops.push({ d, v, alive: true });
    }
  }

  // The thing: tall, too thin, pale, with the Grinner's face
  const skin = mat({ color: 0xbdb5a6, roughness: 0.65 });
  const body = new THREE.Group();
  body.position.set(0.15, 0, -0.75);
  const torso = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.16, 0.95, 6, 12)), skin);
  torso.position.y = 1.65;
  torso.castShadow = true;
  body.add(torso);
  const neck = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 10)), skin);
  neck.position.y = 2.35;
  body.add(neck);
  const headPivot = new THREE.Group();
  headPivot.position.y = 2.62;
  const head = new THREE.Mesh(keep(new THREE.SphereGeometry(0.2, 24, 18)), skin);
  head.scale.set(1, 1.35, 1);
  const faceCanvas = document.createElement('canvas');
  faceCanvas.width = faceCanvas.height = 512;
  const faceCtx = faceCanvas.getContext('2d');
  const faceTex = keep(new THREE.CanvasTexture(faceCanvas));
  faceTex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(keep(new THREE.PlaneGeometry(0.42, 0.52)), keep(new THREE.MeshBasicMaterial({ map: faceTex, transparent: true })));
  face.position.z = 0.17;
  headPivot.add(head, face);

  // A real, scanned human head (Lee Perry-Smith by Infinite-Realities, CC BY 3.0) replaces the
  // painted one when it loads: eyes gone black, a grin cut far too wide.
  let realHead = false;
  new GLTFLoader().load('./assets/underside/models/head.glb', (gltf) => {
    const model = gltf.scene;
    const tex = new THREE.TextureLoader().load('./assets/underside/models/head-color.jpg');
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = false;
    keep(tex);
    const skinMat = mat({ map: tex, color: 0xd8cfc4, roughness: 0.55 });
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = skinMat;
        child.castShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = 0.5 / size.y;
    model.scale.setScalar(scale);
    const centre = box.getCenter(new THREE.Vector3()).multiplyScalar(scale);
    model.position.sub(centre);
    const holder = new THREE.Group();
    holder.add(model);
    // Eyes: two black voids where the eyes were
    const voidMat = keep(new THREE.MeshBasicMaterial({ color: 0x000000 }));
    const sw = size.x * scale;
    const sh = size.y * scale;
    const sd = size.z * scale;
    [-1, 1].forEach((side) => {
      const eye = new THREE.Mesh(keep(new THREE.SphereGeometry(sw * 0.085, 16, 12)), voidMat);
      eye.position.set(side * sw * 0.17, sh * 0.1, sd * 0.36);
      eye.scale.set(1.2, 0.9, 0.5);
      holder.add(eye);
    });
    // The grin, as a decal across the mouth and cheeks
    const grinCanvas = document.createElement('canvas');
    grinCanvas.width = 512;
    grinCanvas.height = 256;
    drawGrinDecal(grinCanvas.getContext('2d'), 512, 256);
    const grinTex = keep(new THREE.CanvasTexture(grinCanvas));
    grinTex.colorSpace = THREE.SRGBColorSpace;
    const grin = new THREE.Mesh(keep(new THREE.PlaneGeometry(sw * 0.95, sw * 0.47)), keep(new THREE.MeshBasicMaterial({ map: grinTex, transparent: true })));
    grin.position.set(0, -sh * 0.2, sd * 0.42);
    holder.add(grin);
    headPivot.add(holder);
    head.visible = false;
    face.visible = false;
    realHead = true;
  }, undefined, () => {
    // Keep the painted head if the model can't load.
  });
  headPivot.rotation.y = Math.PI * 0.9; // facing the cake, away from you
  body.add(headPivot);
  // Arms: shoulder → elbow → hand, the right one holding a carving knife
  function arm(side) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.22, 2.1, 0);
    const upper = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.045, 0.6, 4, 8)), skin);
    upper.position.y = -0.35;
    const elbow = new THREE.Group();
    elbow.position.y = -0.7;
    const fore = new THREE.Mesh(keep(new THREE.CapsuleGeometry(0.038, 0.62, 4, 8)), skin);
    fore.position.y = -0.36;
    const hand = new THREE.Group();
    hand.position.y = -0.72;
    elbow.add(fore, hand);
    shoulder.add(upper, elbow);
    body.add(shoulder);
    return { shoulder, elbow, hand };
  }
  const right = arm(1);
  const left = arm(-1);
  left.shoulder.rotation.z = 0.2;
  left.elbow.rotation.x = -0.4;
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(keep(new THREE.BoxGeometry(0.035, 0.42, 0.006)), mat({ color: 0xc8c8cc, metalness: 0.95, roughness: 0.2 }));
  blade.position.y = -0.27;
  const bloodOnBlade = new THREE.Mesh(keep(new THREE.BoxGeometry(0.037, 0.2, 0.008)), dropMat);
  bloodOnBlade.position.y = -0.38;
  bloodOnBlade.visible = false;
  const handle = new THREE.Mesh(keep(new THREE.BoxGeometry(0.04, 0.14, 0.03)), mat({ color: 0x2a1a10 }));
  knife.add(blade, bloodOnBlade, handle);
  right.hand.add(knife);
  scene.add(body);

  // One bulb on a cord, swinging
  const bulbPivot = new THREE.Group();
  bulbPivot.position.set(0.1, 3.4, 0);
  const cord = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.004, 0.004, 1.2, 4)), mat({ color: 0x111111 }));
  cord.position.y = -0.6;
  const bulb = new THREE.Mesh(keep(new THREE.SphereGeometry(0.05, 10, 10)), keep(new THREE.MeshBasicMaterial({ color: 0xffe2a8 })));
  bulb.position.y = -1.22;
  const light = new THREE.PointLight(0xffd8a0, 9, 7, 1.6);
  light.position.y = -1.25;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  bulbPivot.add(cord, bulb, light);
  scene.add(bulbPivot);
  scene.add(new THREE.AmbientLight(0x2a1010, 0.5));
  // A cold rim light from behind so its outline reads against the dark
  const rim = new THREE.DirectionalLight(0x8090c0, 1.2);
  rim.position.set(-1, 3, -3);
  scene.add(rim);

  const stabbed = new Set();

  return {
    duration: STAB_SCENE_SECONDS,
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    /** t: seconds since the scene started. onStab(i) fires at each stab; onLunge fires once. */
    render(t, { onStab, onLunge } = {}) {
      // Camera: slow push in from the doorway; at the end it is the one being approached
      const push = Math.min(1, t / 5.5);
      camera.position.set(1.3 - push * 0.8, 1.9 - push * 0.1, 3.8 - push * 1.5);
      camera.lookAt(0.15, 1.75 - push * 0.15, -0.5);
      camera.rotation.z += Math.sin(t * 1.3) * 0.01;

      bulbPivot.rotation.z = Math.sin(t * 1.6) * 0.35;
      light.intensity = 9 * (Math.random() < 0.03 ? 0.2 : 1);
      flames.forEach((f, i) => f.scale.setScalar(0.8 + Math.sin(t * 20 + i) * 0.25));

      // The stabbing arm: raise, then drive down into the cake
      let phase = 0;
      for (let i = STABS.length - 1; i >= 0; i -= 1) {
        if (t >= STABS[i] - 0.5) {
          const local = (t - (STABS[i] - 0.5)) / 0.5;
          phase = Math.min(1, local);
          if (local >= 1 && !stabbed.has(i)) {
            stabbed.add(i);
            bloodOnBlade.visible = true;
            spray(new THREE.Vector3(0.15 + (Math.random() - 0.5) * 0.1, 1.15, 0.05), 26 + i * 6);
            addStain(0.15 + (Math.random() - 0.5) * 0.25, 1.161, 0.05 + (Math.random() - 0.5) * 0.15, 0.18 + i * 0.04, true);
            addStain((Math.random() - 0.5) * 1.6, 0.845, (Math.random() - 0.5) * 0.8, 0.3 + i * 0.12, false);
            onStab?.(i);
          }
          break;
        }
      }
      const up = phase < 0.65 ? phase / 0.65 : 1 - (phase - 0.65) / 0.35;
      right.shoulder.rotation.x = -0.6 - up * 2.0 + (phase > 0.65 ? 0.5 : 0);
      right.elbow.rotation.x = -0.3 - up * 0.8;
      knife.rotation.x = Math.PI + up * 0.4;
      torso.rotation.x = 0.15 + (phase > 0.65 ? 0.12 : 0);

      // Then it stops. Its head turns all the way round to look at you. Then it comes.
      if (t > 4.9) {
        const k = Math.min(1, (t - 4.9) / 0.5);
        headPivot.rotation.y = Math.PI * 0.9 * (1 - k * k);
      }
      if (t > 6.2) {
        const k = Math.min(1, (t - 6.2) / 0.9);
        body.position.z = -0.75 + k * k * 3.3;
        body.position.y = k * 0.3;
        if (k > 0.05) onLunge?.();
      }

      // Face: painted fresh each frame so it twitches (only while the painted head is in use)
      if (!realHead) faceCtx.clearRect(0, 0, 512, 512);
      if (!realHead) {
        drawGrinner(faceCtx, 512, 512, { t, scale: 1.5, cy: 280, dark: false, grin: 1.2, blood: 0.4 + stabbed.size * 0.1, stare: 1 });
        faceTex.needsUpdate = true;
      }
      // Twitch: the head jerks on a coarse clock
      const tick = Math.floor(t * 8);
      headPivot.rotation.z = Math.sin(tick * 12.9898) > 0.8 ? 0.25 : 0;

      // Blood physics
      drops.forEach((p) => {
        if (!p.alive) return;
        p.v.y -= 9.8 * 0.016;
        p.d.position.addScaledVector(p.v, 0.016);
        const surface = Math.abs(p.d.position.x) < 1.3 && Math.abs(p.d.position.z) < 0.65 ? 0.845 : 0.01;
        if (p.d.position.y <= surface) {
          p.alive = false;
          p.d.position.y = surface;
          p.d.scale.set(2.2, 0.2, 2.2);
        }
      });
      stains.forEach((s) => {
        s.m.scale.setScalar(s.m.scale.x + (s.target - s.m.scale.x) * 0.04);
      });

      renderer.render(scene, camera);
    },

    dispose() {
      disposables.forEach((x) => x.dispose?.());
      renderer.dispose();
    }
  };
}

function radialTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.7, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= 24; i += 1) {
    const a = (i / 24) * Math.PI * 2;
    const r = 44 + Math.sin(i * 7.3) * 10 + Math.cos(i * 3.1) * 8;
    if (i === 0) ctx.moveTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
    else ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
  }
  ctx.fill();
  return new THREE.CanvasTexture(c);
}
