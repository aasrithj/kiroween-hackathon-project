// Low-poly 3D gore set-pieces (three.js, flat shaded). The victims are party guests in party hats;
// the killer is the tall pale thing with the grin. Stylised on purpose: horror-film violence, not
// photoreal. Every scene is short, time-driven, and disposes everything it made when it ends.
//
//   throat    a seated guest's throat is cut; arterial spray; the head comes off; bugs from the neck
//   hand      a cleaver takes a hand off at the wrist; the stump spurts; the fingers keep twitching
//   stabline  it walks down a row of guests and stabs each one; they drop
//   gut       a guest on the table; it pulls the intestines out; bugs come with them
//   bugface   a face too close to the camera; the jaw drops; bugs pour out at you
//   facewall  a wall of faces looking away, until they all turn to look at you at once
//
// play(name, { onHit }) resolves when the scene ends. onHit(kind) fires on each wound, for sound.

import * as THREE from '../../vendor/three/three.module.js';
import { drawGrinDecal } from './creatures.js';

export const SCENES = Object.freeze({ throat: 7.5, hand: 5.5, stabline: 6.8, gut: 6.5, bugface: 4.8, facewall: 4.4 });

const SKIN = [0xd8b8a0, 0xc89878, 0xa87858, 0x7a5038, 0xe8c8b0];
const SHIRT = [0x3a4a6a, 0x6a3a3a, 0x3a5a4a, 0x5a4a6a, 0x6a6a3a];
const HAT = [0xff4a6a, 0x4ac0ff, 0xffd04a, 0x8aff6a, 0xc86aff];

export function createMassacre(canvas, { quality = 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 40);

  // The grin texture, shared by every killer and face
  const grinCanvas = document.createElement('canvas');
  grinCanvas.width = 512;
  grinCanvas.height = 256;
  drawGrinDecal(grinCanvas.getContext('2d'), 512, 256);
  const grinTex = new THREE.CanvasTexture(grinCanvas);
  grinTex.colorSpace = THREE.SRGBColorSpace;

  return {
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },
    play(name, { onHit } = {}) {
      const build = BUILDERS[name];
      if (!build) return Promise.resolve();
      const ctx = makeContext(grinTex, quality);
      const scene = build(ctx);
      const duration = SCENES[name];
      const start = performance.now();
      return new Promise((resolve) => {
        const frame = (now) => {
          const t = (now - start) / 1000;
          ctx.t = t;
          scene.update(t, camera, onHit);
          ctx.gore.update(1 / 60);
          renderer.render(ctx.scene, camera);
          if (t < duration) requestAnimationFrame(frame);
          else {
            ctx.dispose();
            resolve();
          }
        };
        requestAnimationFrame(frame);
      });
    },
    dispose() {
      grinTex.dispose();
      renderer.dispose();
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------------------------
function makeContext(grinTex, quality) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030101);
  scene.fog = new THREE.FogExp2(0x040101, 0.12);
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };
  const mat = (color, extra = {}) => keep(new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.8, ...extra }));
  const box = (w, h, d, material) => new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), material);

  // Room: floor, back wall, one hard light from above, a little red from below
  const floor = new THREE.Mesh(keep(new THREE.PlaneGeometry(20, 20)), mat(0x1a0e0c));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const wall = new THREE.Mesh(keep(new THREE.PlaneGeometry(20, 8)), mat(0x241414));
  wall.position.set(0, 4, -3);
  scene.add(wall);
  const top = new THREE.PointLight(0xffe0b0, 14, 10, 1.6);
  top.position.set(0, 3.4, 0.6);
  scene.add(top);
  const under = new THREE.PointLight(0xa01008, 4, 8, 1.8);
  under.position.set(0, 0.3, 2);
  scene.add(under, new THREE.AmbientLight(0x2a1212, 0.7));

  const gore = makeGore(scene, keep, mat, quality);
  const ctx = {
    scene, keep, mat, box, gore, grinTex, t: 0, light: top,
    person: (opts) => makePerson(ctx, opts),
    killer: () => makeKiller(ctx),
    table: (w = 2.4, d = 1.1) => {
      const g = new THREE.Group();
      const cloth = mat(0xe6e0d2);
      const topBox = box(w, 0.08, d, cloth);
      topBox.position.y = 0.8;
      g.add(topBox);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
        const leg = box(0.07, 0.8, 0.07, mat(0x2a1a10));
        leg.position.set(x * (w / 2 - 0.1), 0.4, z * (d / 2 - 0.1));
        g.add(leg);
      });
      scene.add(g);
      return g;
    },
    dispose() {
      gore.dispose();
      disposables.forEach((x) => x.dispose?.());
    }
  };
  return ctx;
}

/** A low-poly party guest. Joints are pivots you can rotate. */
function makePerson(ctx, { skin = SKIN[0], shirt = SHIRT[0], hat = HAT[0], seated = false } = {}) {
  const { mat, box } = ctx;
  const skinMat = mat(skin);
  const g = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = seated ? 0.55 : 0.95;
  g.add(hips);
  const torso = box(0.42, 0.62, 0.24, mat(shirt));
  torso.position.y = 0.33;
  hips.add(torso);
  const neck = new THREE.Group();
  neck.position.y = 0.66;
  hips.add(neck);
  const neckMesh = box(0.1, 0.12, 0.1, skinMat);
  neckMesh.position.y = 0.04;
  neck.add(neckMesh);
  const head = new THREE.Group();
  head.position.y = 0.2;
  neck.add(head);
  const skull = new THREE.Mesh(ctx.keep(new THREE.IcosahedronGeometry(0.15, 1)), skinMat);
  skull.scale.set(1, 1.18, 1);
  head.add(skull);
  // eyes, and a party hat
  const eyeMat = mat(0x0a0808);
  [-1, 1].forEach((s) => {
    const eye = box(0.035, 0.025, 0.02, eyeMat);
    eye.position.set(s * 0.055, 0.03, 0.14);
    head.add(eye);
  });
  const hatMesh = new THREE.Mesh(ctx.keep(new THREE.ConeGeometry(0.09, 0.26, 7)), mat(hat, { roughness: 0.5 }));
  hatMesh.position.y = 0.26;
  hatMesh.rotation.z = 0.15;
  head.add(hatMesh);
  // arms
  const arm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.27, 0.58, 0);
    const upper = box(0.1, 0.32, 0.1, mat(shirt));
    upper.position.y = -0.16;
    const elbow = new THREE.Group();
    elbow.position.y = -0.32;
    const fore = box(0.085, 0.3, 0.085, skinMat);
    fore.position.y = -0.15;
    const wrist = new THREE.Group();
    wrist.position.y = -0.3;
    const hand = box(0.1, 0.12, 0.05, skinMat);
    hand.position.y = -0.06;
    wrist.add(hand);
    elbow.add(fore, wrist);
    shoulder.add(upper, elbow);
    hips.add(shoulder);
    return { shoulder, elbow, wrist, hand };
  };
  const leg = (side) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.11, 0, 0);
    const thigh = box(0.13, 0.46, 0.13, mat(0x1a1a22));
    thigh.position.y = -0.23;
    const knee = new THREE.Group();
    knee.position.y = -0.46;
    const shin = box(0.11, 0.46, 0.11, mat(0x1a1a22));
    shin.position.y = -0.23;
    knee.add(shin);
    hip.add(thigh, knee);
    hips.add(hip);
    if (seated) {
      hip.rotation.x = -Math.PI / 2;
      knee.rotation.x = Math.PI / 2;
    }
    return { hip, knee };
  };
  const person = { g, hips, torso, neck, head, arms: [arm(-1), arm(1)], legs: [leg(-1), leg(1)], skinMat };
  ctx.scene.add(g);
  return person;
}

/** The killer: tall, thin, pale, black eyes, the grin. Holds a blade in its right hand. */
function makeKiller(ctx, { blade = 'knife' } = {}) {
  const { mat, box } = ctx;
  const skin = mat(0xc8c0b2, { roughness: 0.6 });
  const g = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 1.3;
  g.add(hips);
  const torso = box(0.34, 0.95, 0.2, skin);
  torso.position.y = 0.48;
  hips.add(torso);
  const neck = new THREE.Group();
  neck.position.y = 1.0;
  hips.add(neck);
  const neckMesh = box(0.07, 0.32, 0.07, skin);
  neckMesh.position.y = 0.16;
  neck.add(neckMesh);
  const head = new THREE.Group();
  head.position.y = 0.42;
  neck.add(head);
  const skull = new THREE.Mesh(ctx.keep(new THREE.IcosahedronGeometry(0.17, 1)), skin);
  skull.scale.set(0.95, 1.35, 1);
  head.add(skull);
  const voids = mat(0x000000, { roughness: 1 });
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(ctx.keep(new THREE.IcosahedronGeometry(0.045, 0)), voids);
    eye.position.set(s * 0.065, 0.05, 0.14);
    head.add(eye);
  });
  const grin = new THREE.Mesh(ctx.keep(new THREE.PlaneGeometry(0.3, 0.15)), ctx.keep(new THREE.MeshBasicMaterial({ map: ctx.grinTex, transparent: true })));
  grin.position.set(0, -0.1, 0.16);
  head.add(grin);
  const arm = (side) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.22, 0.92, 0);
    const upper = box(0.07, 0.62, 0.07, skin);
    upper.position.y = -0.31;
    const elbow = new THREE.Group();
    elbow.position.y = -0.62;
    const fore = box(0.06, 0.6, 0.06, skin);
    fore.position.y = -0.3;
    const hand = new THREE.Group();
    hand.position.y = -0.62;
    elbow.add(fore, hand);
    shoulder.add(upper, elbow);
    hips.add(shoulder);
    return { shoulder, elbow, hand };
  };
  const arms = [arm(-1), arm(1)];
  [-1, 1].forEach((side) => {
    const leg = box(0.09, 1.3, 0.09, skin);
    leg.position.set(side * 0.1, -0.65, 0);
    hips.add(leg);
  });
  // The blade
  const weapon = new THREE.Group();
  const steel = mat(0xc8c8cc, { metalness: 0.9, roughness: 0.25 });
  if (blade === 'cleaver') {
    const head2 = box(0.02, 0.3, 0.18, steel);
    head2.position.set(0, -0.25, 0.06);
    weapon.add(head2);
  } else {
    const b = box(0.02, 0.4, 0.05, steel);
    b.position.y = -0.28;
    weapon.add(b);
  }
  const grip = box(0.04, 0.14, 0.04, mat(0x2a1a10));
  grip.position.y = -0.02;
  weapon.add(grip);
  arms[1].hand.add(weapon);
  ctx.scene.add(g);
  return { g, hips, neck, head, arms, weapon };
}

/** Blood (instanced low-poly droplets with gravity), pools, intestines and bugs. */
function makeGore(scene, keep, mat, quality) {
  const max = Math.round(700 * quality);
  const geo = keep(new THREE.TetrahedronGeometry(0.018, 0));
  const bloodMat = keep(new THREE.MeshStandardMaterial({ color: 0x6a0208, roughness: 0.25, metalness: 0.1, flatShading: true }));
  const drops = new THREE.InstancedMesh(geo, bloodMat, max);
  drops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  drops.count = 0;
  scene.add(drops);
  const parts = [];
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3();
  const pools = [];
  const poolMat = keep(new THREE.MeshStandardMaterial({ color: 0x3a0004, roughness: 0.15, metalness: 0.2 }));

  const bugGeo = keep(new THREE.SphereGeometry(0.02, 5, 4));
  const bugMat = keep(new THREE.MeshStandardMaterial({ color: 0x140e08, roughness: 0.4 }));
  const bugMax = Math.round(260 * quality);
  const bugs = new THREE.InstancedMesh(bugGeo, bugMat, bugMax);
  bugs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  bugs.count = 0;
  scene.add(bugs);
  const bugList = [];
  const guts = [];

  return {
    /** A squirt: count drops from origin along dir with spread. */
    spray(origin, dir, { count = 30, speed = 3, spread = 0.35 } = {}) {
      for (let i = 0; i < count && parts.length < max; i += 1) {
        const v = dir.clone().normalize().multiplyScalar(speed * (0.6 + Math.random() * 0.6));
        v.x += (Math.random() - 0.5) * spread * speed;
        v.y += (Math.random() - 0.5) * spread * speed;
        v.z += (Math.random() - 0.5) * spread * speed;
        parts.push({ p: origin.clone(), v, alive: true, rot: Math.random() * 6 });
      }
    },
    /** A spreading pool at a point on a surface of height y. */
    pool(x, y, z, size) {
      const m = new THREE.Mesh(keep(new THREE.CircleGeometry(1, 9)), poolMat);
      m.rotation.x = -Math.PI / 2;
      m.position.set(x, y + 0.002, z);
      m.scale.setScalar(0.01);
      scene.add(m);
      pools.push({ m, size });
    },
    /** Bugs pouring from a point and spreading across the surface around it. */
    bugs(origin, count, surfaceY = 0) {
      for (let i = 0; i < count && bugList.length < bugMax; i += 1) {
        bugList.push({ p: origin.clone(), a: Math.random() * Math.PI * 2, speed: 0.15 + Math.random() * 0.4, y: surfaceY, delay: Math.random() * 1.2 });
      }
    },
    /** Intestines: a glossy tube that grows along a path from `from` over time. */
    guts(points) {
      const g = { points, grown: 0, mesh: null };
      guts.push(g);
      return g;
    },
    update(dt) {
      let n = 0;
      parts.forEach((part) => {
        if (part.alive) {
          part.v.y -= 9.8 * dt;
          part.p.addScaledVector(part.v, dt);
          const surface = part.surface ?? 0;
          if (part.p.y <= surface) {
            part.alive = false;
            part.p.y = surface + 0.003;
          }
        }
        if (n >= max) return;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), part.rot);
        sc.set(part.alive ? 1 : 2.4, part.alive ? 1.6 : 0.15, part.alive ? 1 : 2.4);
        m4.compose(part.p, q, sc);
        drops.setMatrixAt(n, m4);
        n += 1;
      });
      drops.count = n;
      drops.instanceMatrix.needsUpdate = true;
      pools.forEach((p) => p.m.scale.setScalar(p.m.scale.x + (p.size - p.m.scale.x) * 0.03));
      let b = 0;
      bugList.forEach((bug) => {
        if (bug.delay > 0) {
          bug.delay -= dt;
          return;
        }
        bug.a += (Math.random() - 0.5) * 0.9;
        bug.p.x += Math.cos(bug.a) * bug.speed * dt;
        bug.p.z += Math.sin(bug.a) * bug.speed * dt;
        if (bug.p.y > bug.y) bug.p.y = Math.max(bug.y, bug.p.y - dt * 1.5);
        m4.compose(bug.p, q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -bug.a), sc.set(1.6, 0.6, 1));
        bugs.setMatrixAt(b, m4);
        b += 1;
      });
      bugs.count = b;
      bugs.instanceMatrix.needsUpdate = true;
      guts.forEach((gut) => {
        if (gut.grown >= gut.points.length) return;
        gut.grown = Math.min(gut.points.length, gut.grown + dt * 9);
        const count = Math.max(2, Math.floor(gut.grown));
        if (gut.mesh) {
          scene.remove(gut.mesh);
          gut.mesh.geometry.dispose();
        }
        const curve = new THREE.CatmullRomCurve3(gut.points.slice(0, count));
        gut.mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, count * 4, 0.035, 6), gut.mat || (gut.mat = keep(new THREE.MeshStandardMaterial({ color: 0x9a3a44, roughness: 0.2, metalness: 0.1 }))));
        scene.add(gut.mesh);
      });
    },
    dispose() {
      guts.forEach((g) => g.mesh?.geometry.dispose());
      drops.dispose();
      bugs.dispose();
    }
  };
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const ease = (x) => (x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
const pick = (list, i) => list[i % list.length];

// ---------------------------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------------------------
const BUILDERS = {
  throat(ctx) {
    ctx.table();
    const guest = ctx.person({ seated: true, skin: SKIN[1], shirt: SHIRT[1], hat: HAT[2] });
    guest.g.position.set(0, 0, 0.95);
    guest.g.rotation.y = Math.PI;
    guest.arms.forEach((a) => {
      a.shoulder.rotation.x = -1.1;
    });
    const killer = ctx.killer();
    killer.g.position.set(0, 0, 1.45);
    killer.g.rotation.y = Math.PI;
    let cut = false;
    let fell = false;
    let headVel = null;
    const headWorld = new THREE.Group();
    return {
      update(t, cam, onHit) {
        cam.position.set(1.6 - ease(t / 6) * 0.7, 1.5, -1.3 + ease(t / 6) * 0.4);
        cam.lookAt(0, 1.2, 1);
        // Its long arm comes round the front of the throat, and draws across
        const reach = ease((t - 0.4) / 1);
        killer.arms[1].shoulder.rotation.x = -reach * 1.5;
        killer.arms[1].shoulder.rotation.z = reach * 0.9;
        killer.arms[1].elbow.rotation.x = -reach * 0.9;
        killer.hips.rotation.x = reach * 0.25;
        const draw = ease((t - 1.5) / 0.4);
        killer.arms[1].shoulder.rotation.y = -draw * 1.1;
        if (t > 1.7 && !cut) {
          cut = true;
          onHit?.('slice');
        }
        // Arterial spray, in pulses, from the front of the neck
        if (cut && t < 4.6) {
          const pulse = (t * 2.6) % 1 < 0.35;
          if (pulse) ctx.gore.spray(V(0, 1.38, 0.82), V(0, 0.6, -1), { count: 6, speed: 3.2, spread: 0.3 });
          if (Math.floor(t * 2.6) !== Math.floor((t - 1 / 60) * 2.6)) onHit?.('squirt');
        }
        // The head tips, then comes off and drops to the table, then the floor
        if (t > 3.0 && !fell) {
          fell = true;
          const world = new THREE.Vector3();
          guest.head.getWorldPosition(world);
          guest.neck.remove(guest.head);
          headWorld.position.copy(world);
          headWorld.add(guest.head);
          guest.head.position.set(0, 0, 0);
          ctx.scene.add(headWorld);
          headVel = V(0.25, 0.6, -0.9);
          ctx.gore.pool(0, 0.845, 0.4, 0.45);
          onHit?.('sever');
        }
        if (fell) {
          headVel.y -= 9.8 / 60;
          headWorld.position.addScaledVector(headVel, 1 / 60);
          headWorld.rotation.x += 0.12;
          const ground = Math.abs(headWorld.position.z) < 0.55 && Math.abs(headWorld.position.x) < 1.2 ? 0.98 : 0.15;
          if (headWorld.position.y < ground) {
            headWorld.position.y = ground;
            headVel.y = Math.abs(headVel.y) * 0.3;
            headVel.x *= 0.6;
            headVel.z *= 0.6;
          }
          // The stump keeps spurting upward, weaker
          if (t < 5.2 && (t * 3) % 1 < 0.3) ctx.gore.spray(V(0, 1.42, 0.95), V(0, 1, 0.1), { count: 4, speed: 2.2, spread: 0.4 });
        }
        if (t > 4.6 && t < 4.65) {
          ctx.gore.bugs(V(0, 1.42, 0.95), 140, 0.845);
          onHit?.('bugs');
        }
        ctx.light.intensity = 14 * (Math.random() < 0.04 ? 0.2 : 1);
      }
    };
  },

  hand(ctx) {
    ctx.table(1.6, 1);
    const guest = ctx.person({ seated: true, skin: SKIN[0], shirt: SHIRT[2], hat: HAT[1] });
    guest.g.position.set(-0.2, 0, 0.75);
    guest.g.rotation.y = Math.PI;
    const arm = guest.arms[0];
    arm.shoulder.rotation.x = -1.35;
    arm.elbow.rotation.x = 0.2;
    const killer = ctx.killer({ blade: 'cleaver' });
    killer.g.position.set(0.35, 0, -0.75);
    let chopped = false;
    let hand = null;
    return {
      update(t, cam, onHit) {
        cam.position.set(1.1, 1.45, 0.7);
        cam.lookAt(-0.05, 0.85, 0.15);
        const up = ease(t / 1.1);
        const down = ease((t - 1.25) / 0.12);
        killer.arms[1].shoulder.rotation.x = -2.6 * up + 2.6 * down * up;
        killer.arms[1].shoulder.rotation.z = 0.4;
        if (t > 1.37 && !chopped) {
          chopped = true;
          hand = arm.wrist;
          const world = new THREE.Vector3();
          hand.getWorldPosition(world);
          arm.elbow.remove(hand);
          hand.position.copy(world);
          hand.rotation.set(-Math.PI / 2, 0, 0.3);
          ctx.scene.add(hand);
          ctx.gore.pool(world.x, 0.845, world.z, 0.25);
          onHit?.('chop');
        }
        if (chopped && t < 4.5 && (t * 3.2) % 1 < 0.35) {
          ctx.gore.spray(V(-0.05, 0.9, 0.3), V(0.3, 0.8, -0.6), { count: 5, speed: 2.4, spread: 0.35 });
          if (Math.floor(t * 3.2) !== Math.floor((t - 1 / 60) * 3.2)) onHit?.('squirt');
        }
        if (hand) {
          hand.position.x -= 0.004;
          hand.rotation.z = 0.3 + Math.sin(t * 25) * 0.08; // the fingers keep twitching
        }
      }
    };
  },

  stabline(ctx) {
    const guests = [-1.4, 0, 1.4].map((x, i) => {
      const p = ctx.person({ skin: pick(SKIN, i + 2), shirt: pick(SHIRT, i + 3), hat: pick(HAT, i) });
      p.g.position.set(x, 0, 0);
      p.arms.forEach((a) => {
        a.shoulder.rotation.z = (a === p.arms[0] ? 1 : -1) * 0.2;
      });
      return { p, fall: 0, hit: false, at: 1.0 + i * 1.3 };
    });
    [-1.4, 0, 1.4].forEach((x) => {
      const lamp = new THREE.PointLight(0xffd8b0, 6, 4, 1.6);
      lamp.position.set(x, 2.6, 1.2);
      ctx.scene.add(lamp);
    });
    const killer = ctx.killer();
    killer.g.position.set(-2.6, 0, 0.6);
    return {
      update(t, cam, onHit) {
        const focus = -1.4 + Math.min(2.8, Math.max(0, (t - 0.6) / 3.4) * 2.8);
        cam.position.set(focus + 1.9, 1.7, 2.4);
        cam.lookAt(focus, 1.15, 0.1);
        const target = guests.find((g) => !g.hit) || guests[2];
        killer.g.position.x += (target.p.g.position.x + 0.15 - killer.g.position.x) * 0.06;
        killer.g.lookAt(target.p.g.position.x, 0, 0);
        guests.forEach((g, i) => {
          const local = t - g.at;
          const thrust = local > -0.35 && local < 0.15 ? ease((local + 0.35) / 0.3) : 0;
          if (target === g) killer.arms[1].shoulder.rotation.x = -1.4 - thrust * 0.2;
          killer.arms[1].elbow.rotation.x = -thrust * 0.1;
          if (local > 0 && !g.hit) {
            g.hit = true;
            onHit?.('stab');
            ctx.gore.spray(V(g.p.g.position.x, 1.25, 0.15), V(0.4, 0.4, 1), { count: 45, speed: 3, spread: 0.45 });
            ctx.gore.pool(g.p.g.position.x, 0, -0.4, 0.7);
          }
          if (g.hit) {
            g.fall = Math.min(1, g.fall + 1 / 60 / 0.55);
            g.p.g.rotation.x = -ease(g.fall) * (Math.PI / 2);
            g.p.neck.rotation.x = -ease(g.fall) * 0.6;
            if (g.fall < 1 && (t * 4) % 1 < 0.3) ctx.gore.spray(V(g.p.g.position.x, 0.9 - g.fall * 0.7, 0.15), V(0, 1, 0.3), { count: 3, speed: 1.6 });
          }
        });
        if (t > 5.4) killer.head.rotation.y = Math.min(Math.PI * 0.8, (t - 5.4) * 3);
      }
    };
  },

  gut(ctx) {
    ctx.table(2.4, 1);
    const guest = ctx.person({ skin: SKIN[3], shirt: SHIRT[0], hat: HAT[4] });
    guest.g.position.set(0, 0.9, 0);
    guest.g.rotation.x = -Math.PI / 2;
    guest.g.rotation.z = Math.PI / 2;
    const killer = ctx.killer();
    killer.g.position.set(0, 0, -0.85);
    const belly = V(0.05, 1.08, 0);
    const path = [belly.clone()];
    for (let i = 1; i < 28; i += 1) {
      const up = Math.min(1, i / 9);
      path.push(V(0.05 + Math.sin(i * 0.9) * 0.25, 1.08 + up * 0.9 - Math.max(0, i - 14) * 0.08, -i * 0.02 + Math.cos(i * 1.3) * 0.15));
    }
    let gut = null;
    return {
      update(t, cam, onHit) {
        cam.position.set(1.3 - t * 0.12, 1.9, 1.6 - t * 0.1);
        cam.lookAt(0, 1.1, 0);
        const reach = ease(t / 0.8);
        killer.hips.rotation.x = reach * 0.5;
        killer.arms.forEach((a, i) => {
          a.shoulder.rotation.x = -reach * 1.2 - (t > 1.2 ? Math.sin(t * 3 + i) * 0.4 : 0);
        });
        if (t > 1.2 && !gut) {
          gut = ctx.gore.guts(path);
          onHit?.('tear');
          ctx.gore.spray(belly, V(0, 1, 0), { count: 40, speed: 2, spread: 0.6 });
          ctx.gore.pool(0, 0.845, 0, 0.8);
        }
        if (gut && (t * 2) % 1 < 0.05) onHit?.('squelch');
        if (t > 3.4 && t < 3.45) {
          ctx.gore.bugs(belly, 160, 0.845);
          onHit?.('bugs');
        }
        guest.neck.rotation.x = Math.sin(t * 18) * 0.04 * Math.max(0, 1 - t / 3); // it was still moving
      }
    };
  },

  bugface(ctx) {
    const guest = ctx.person({ skin: SKIN[4], shirt: SHIRT[4], hat: HAT[3] });
    guest.g.position.set(0, -0.5, 1.6);
    const jaw = ctx.box(0.16, 0.05, 0.12, guest.skinMat);
    jaw.position.set(0, -0.12, 0.06);
    guest.head.add(jaw);
    const mouth = ctx.box(0.16, 0.01, 0.02, ctx.mat(0x000000));
    mouth.position.set(0, -0.08, 0.14);
    guest.head.add(mouth);
    const eyeWhite = ctx.mat(0xe8e0d0);
    [-1, 1].forEach((s) => {
      const white = ctx.box(0.04, 0.03, 0.02, eyeWhite);
      white.position.set(s * 0.055, 0.03, 0.141);
      guest.head.add(white);
    });
    // A cold light on the face from just below the camera
    const faceLight = new THREE.PointLight(0xdde4ff, 5, 3, 1.5);
    faceLight.position.set(0.1, 1.15, 2.1);
    ctx.scene.add(faceLight);
    let poured = false;
    return {
      update(t, cam, onHit) {
        cam.position.set(0, 1.33, 2.25 - ease(t / 4) * 0.2);
        cam.lookAt(0, 1.31, 1.6);
        const open = ease((t - 0.9) / 0.5);
        mouth.scale.set(1 - open * 0.2, 1 + open * 6, 1);
        mouth.position.y = -0.08 - open * 0.03;
        jaw.position.y = -0.12 - open * 0.08;
        guest.head.rotation.z = Math.sin(t * 20) * 0.02 * open;
        if (t > 1.3 && !poured) {
          poured = true;
          onHit?.('bugs');
        }
        if (poured && t < 4) {
          // they come out of the mouth toward you, falling
          for (let i = 0; i < 3; i += 1) ctx.gore.bugs(V((Math.random() - 0.5) * 0.06, 1.2, 1.78), 1, -0.5);
          ctx.gore.spray(V(0, 1.2, 1.76), V(0, -0.2, 1), { count: 1, speed: 1.4, spread: 0.3 });
        }
      }
    };
  },

  facewall(ctx) {
    const faces = [];
    for (let r = 0; r < 4; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const holder = new THREE.Group();
        holder.position.set((c - 3) * 0.55, 0.6 + r * 0.55, -1.2 + Math.random() * 0.1);
        const skull = new THREE.Mesh(ctx.keep(new THREE.IcosahedronGeometry(0.2, 1)), ctx.mat(pick(SKIN, r + c)));
        skull.scale.set(1, 1.2, 1);
        const grin = new THREE.Mesh(ctx.keep(new THREE.PlaneGeometry(0.28, 0.14)), ctx.keep(new THREE.MeshBasicMaterial({ map: ctx.grinTex, transparent: true })));
        grin.position.set(0, -0.08, 0.19);
        const voids = ctx.mat(0x000000);
        [-1, 1].forEach((s) => {
          const eye = new THREE.Mesh(ctx.keep(new THREE.IcosahedronGeometry(0.04, 0)), voids);
          eye.position.set(s * 0.07, 0.05, 0.17);
          holder.add(eye);
        });
        holder.add(skull, grin);
        holder.rotation.y = Math.PI * (0.55 + Math.random() * 0.3) * (Math.random() < 0.5 ? 1 : -1);
        ctx.scene.add(holder);
        faces.push({ holder, from: holder.rotation.y });
      }
    }
    let turned = false;
    return {
      update(t, cam, onHit) {
        cam.position.set(0, 1.4, 2.4 - ease(t / 4) * 0.6);
        cam.lookAt(0, 1.4, -1.2);
        // They all turn at the same instant, and stare
        const snap = t > 2 ? 1 : 0;
        if (snap && !turned) {
          turned = true;
          onHit?.('turn');
        }
        faces.forEach((f) => {
          f.holder.rotation.y = f.from * (1 - snap);
          f.holder.rotation.z = snap ? Math.sin(t * 9 + f.from) * 0.03 : 0;
        });
        ctx.light.color.setHex(t > 2 ? 0xff6050 : 0xffe0b0);
      }
    };
  }
};
