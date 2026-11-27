// The gallery, as a place: a long museum corridor, upside down, that you walk through with a
// flashlight. Portraits hang on both walls. Each one changes after you have walked past it.
// At the far end something stands in the dark, and every time the flashlight cuts out, it is closer.
// It starts in 80s red neon and goes colder as you go deeper.

import * as THREE from '../../vendor/three/three.module.js';
import { drawWallpaper, drawWood, paint } from './crt-room.js';
import { drawGrinner } from './creatures.js';

const SPACING = 2.6;
const HALF_WIDTH = 1.3;

export function createGalleryHall(canvas, images, { gentle = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030202);
  scene.fog = new THREE.FogExp2(0x040202, 0.14);
  const camera = new THREE.PerspectiveCamera(52, 16 / 9, 0.05, 60);
  camera.up.set(0, -1, 0); // the world is upside down

  const disposables = [];
  const track = (thing) => {
    disposables.push(thing);
    return thing;
  };
  const length = images.length * SPACING + 8;

  // ---------- corridor ----------
  const wallpaper = track(paint(512, 512, drawWallpaper, [length / 3, 1.2]));
  const wood = track(paint(512, 256, drawWood, [2, length / 2]));
  const wallMat = track(new THREE.MeshStandardMaterial({ map: wallpaper, roughness: 0.95, color: 0x8a6a66 }));
  const floorMat = track(new THREE.MeshStandardMaterial({ map: wood, roughness: 0.6, color: 0x6a4a3a }));
  const ceilMat = track(new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 1 }));

  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(HALF_WIDTH * 2, length)), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -length / 2 + 2;
  floor.receiveShadow = true;
  const ceiling = new THREE.Mesh(track(new THREE.PlaneGeometry(HALF_WIDTH * 2, length)), ceilMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3, -length / 2 + 2);
  scene.add(floor, ceiling);
  [-1, 1].forEach((side) => {
    const wall = new THREE.Mesh(track(new THREE.PlaneGeometry(length, 3)), wallMat);
    wall.rotation.y = -side * Math.PI / 2;
    wall.position.set(side * HALF_WIDTH, 1.5, -length / 2 + 2);
    wall.receiveShadow = true;
    scene.add(wall);
    // Dado rail and skirting, for depth
    const railMat = track(new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.6 }));
    [0.95, 0.08].forEach((y) => {
      const rail = new THREE.Mesh(track(new THREE.BoxGeometry(0.04, y > 0.5 ? 0.05 : 0.16, length)), railMat);
      rail.position.set(side * (HALF_WIDTH - 0.02), y, -length / 2 + 2);
      scene.add(rail);
    });
  });
  // A dead end: a door at the end of the hall
  const endWall = new THREE.Mesh(track(new THREE.PlaneGeometry(HALF_WIDTH * 2, 3)), wallMat);
  endWall.position.set(0, 1.5, -length + 2);
  scene.add(endWall);
  const door = new THREE.Mesh(track(new THREE.BoxGeometry(0.95, 2.1, 0.05)), track(new THREE.MeshStandardMaterial({ color: 0x24160e, roughness: 0.7 })));
  door.position.set(0, 1.05, -length + 2.03);
  scene.add(door);

  // ---------- portraits ----------
  const frameMat = track(new THREE.MeshStandardMaterial({ color: 0x5a4224, roughness: 0.35, metalness: 0.75 }));
  const brassMat = track(new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.3, metalness: 0.9, emissive: 0x221100 }));
  const portraits = images.map((img, i) => {
    const side = i % 2 ? 1 : -1;
    const z = -2.5 - i * SPACING;
    const aspect = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.78;
    const ph = 1.35;
    const pw = Math.min(1.9, Math.max(0.75, ph * aspect));
    const group = new THREE.Group();
    group.position.set(side * (HALF_WIDTH - 0.03), 1.62, z);
    group.rotation.y = -side * Math.PI / 2;
    group.rotation.z = (Math.random() - 0.5) * 0.05; // hung slightly crooked

    const texture = track(new THREE.Texture(img));
    texture.colorSpace = THREE.SRGBColorSpace;
    if (img.complete && img.naturalWidth) texture.needsUpdate = true;
    else img.addEventListener('load', () => (texture.needsUpdate = true), { once: true });
    // Lit by its own picture light: the image glows faintly even when the flashlight is elsewhere.
    const photoMat = track(new THREE.MeshStandardMaterial({
      map: texture, roughness: 0.55, color: 0xb0a89a, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 0.32
    }));
    const photo = new THREE.Mesh(track(new THREE.PlaneGeometry(pw, ph)), photoMat);
    photo.position.z = 0.03;
    group.add(photo);
    // Heavy carved frame: four bevelled bars
    const t = 0.11;
    [[0, ph / 2 + t / 2, pw + t * 2, t], [0, -ph / 2 - t / 2, pw + t * 2, t], [pw / 2 + t / 2, 0, t, ph], [-pw / 2 - t / 2, 0, t, ph]].forEach(([x, y, bw, bh]) => {
      const bar = new THREE.Mesh(track(new THREE.BoxGeometry(bw, bh, 0.07)), frameMat);
      bar.position.set(x, y, 0.035);
      bar.castShadow = true;
      group.add(bar);
    });
    // Brass picture light above
    const lamp = new THREE.Mesh(track(new THREE.CylinderGeometry(0.025, 0.025, pw * 0.6, 10)), brassMat);
    lamp.rotation.z = Math.PI / 2;
    lamp.position.set(0, ph / 2 + 0.2, 0.15);
    group.add(lamp);
    scene.add(group);
    photo.userData.index = i;
    return { img, photoMat, photo, z, side, changed: false };
  });

  // Once you have walked past a portrait, it is not the same portrait any more.
  function change(portrait, index) {
    portrait.changed = true;
    const { img } = portrait;
    if (!img.naturalWidth) return;
    const c = document.createElement('canvas');
    c.width = Math.min(1024, img.naturalWidth);
    c.height = Math.round((c.width / img.naturalWidth) * img.naturalHeight);
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, c.width, c.height);
    ctx.globalCompositeOperation = 'screen';
    const spots = [[0.72, 0.28], [0.25, 0.3], [0.7, 0.68], [0.3, 0.7]];
    const [fx, fy] = spots[index % spots.length];
    drawGrinner(ctx, c.width, c.height, { t: index, scale: 0.42, alpha: 0.6, cx: c.width * fx, cy: c.height * fy, dark: false, grin: 1.1, blood: 0.6 });
    const tex = track(new THREE.CanvasTexture(c));
    tex.colorSpace = THREE.SRGBColorSpace;
    portrait.photoMat.map = tex;
    portrait.photoMat.emissiveMap = tex;
    portrait.photoMat.needsUpdate = true;
  }

  // ---------- the thing at the end of the hall ----------
  const figureCanvas = document.createElement('canvas');
  figureCanvas.width = 256;
  figureCanvas.height = 768;
  drawFigureCard(figureCanvas);
  const figureTex = track(new THREE.CanvasTexture(figureCanvas));
  figureTex.colorSpace = THREE.SRGBColorSpace;
  const figure = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.8, 2.6)),
    track(new THREE.MeshStandardMaterial({ map: figureTex, transparent: true, alphaTest: 0.05, roughness: 1, side: THREE.DoubleSide }))
  );
  figure.position.set(0.2, 1.3, -12);
  scene.add(figure);
  let figureDistance = 13;

  // ---------- light ----------
  const ambient = new THREE.AmbientLight(0x2a1010, 0.6);
  scene.add(ambient);
  // 80s red neon glow at the far end of the hall; it dies as dread rises.
  const neon = new THREE.PointLight(0xff2a18, 14, 18, 1.6);
  scene.add(neon);
  const flashlight = new THREE.SpotLight(0xffe2b8, 38, 14, 0.36, 0.55, 1.6);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(512, 512);
  scene.add(flashlight, flashlight.target);

  const raycaster = new THREE.Raycaster();
  let flickerUntil = 0;
  let nextFlicker = 0;

  return {
    resize(width, height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    },

    /** q: 0–1 through the gallery; pointer -1…1; dread 0–1. Returns nothing; draws a frame. */
    render({ q, now, pointer = { x: 0, y: 0 }, dread = 0 }) {
      const t = now / 1000;
      const z = 1.5 - q * (length - 6);
      const bob = gentle ? 0 : Math.sin(t * 3.4) * 0.025 * Math.min(1, q * 20);
      camera.position.set(Math.sin(t * 0.4) * 0.08, 1.55 + bob, z);
      // Turn toward the next portrait as you reach it; the pointer adds to that.
      const next = portraits.find((p) => p.z < z - 0.6);
      const near = next ? Math.max(0, Math.min(1, 1 - (z - next.z - 1) / 3)) : 0;
      const turn = next ? next.side * HALF_WIDTH * 1.6 * near * near : 0;
      const look = new THREE.Vector3(turn - pointer.x * 1.2, 1.6 + pointer.y * 0.6, z - 4 + near * 2.2);
      camera.lookAt(look);
      camera.rotateZ(Math.sin(t * 0.25) * 0.03);

      // Flashlight follows the look direction; now and then it cuts out.
      flashlight.position.copy(camera.position);
      flashlight.target.position.copy(look);
      if (!gentle && now > nextFlicker) {
        nextFlicker = now + 3500 + Math.random() * 4000;
        flickerUntil = now + 140 + Math.random() * 160;
        // While it was dark, it moved.
        figureDistance = Math.max(4.5, figureDistance - 2.2);
      }
      const dark = now < flickerUntil;
      flashlight.intensity = dark ? 0 : 38 * (0.92 + Math.random() * 0.08);

      const neonAmount = Math.max(0, 1 - dread * 2.6);
      neon.position.set(0, 2.6, z - 9);
      neon.intensity = 14 * neonAmount;
      ambient.color.setRGB(0.16 * neonAmount + 0.05, 0.05, 0.05);

      // The figure keeps its distance, except when it doesn't. It leaves before you reach the end.
      const end = -length + 4;
      figure.visible = z - figureDistance > end;
      figure.position.set(0.25, 1.3, Math.max(end, z - figureDistance));
      figure.lookAt(camera.position.x, 1.3, camera.position.z);

      portraits.forEach((p, i) => {
        if (!p.changed && z < p.z - 1.2) change(p, i);
      });

      renderer.render(scene, camera);
    },

    /** Which portrait is under a point (normalised device coords, -1…1). Returns its index or -1. */
    pick(x, y) {
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const hit = raycaster.intersectObjects(portraits.map((p) => p.photo))[0];
      return hit ? hit.object.userData.index : -1;
    },

    /** The host's portrait answers: its colour floods red and it glows. */
    wake(index) {
      const p = portraits[index];
      if (!p) return;
      p.photoMat.emissive.set(0xff2010);
      p.photoMat.emissiveIntensity = 0.9;
      p.photoMat.needsUpdate = true;
    },

    /** Change a portrait right now (clicking the wrong one). */
    spoil(index) {
      const p = portraits[index];
      if (p && !p.changed) change(p, index);
    },

    dispose() {
      disposables.forEach((thing) => thing.dispose?.());
      scene.traverse((child) => child.geometry?.dispose?.());
      renderer.dispose();
    }
  };
}

/** A tall, thin silhouette with a pale grin, painted on a transparent card. */
function drawFigureCard(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#060505';
  // Legs, body, long arms
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h);
  ctx.lineTo(w * 0.45, h * 0.55);
  ctx.lineTo(w * 0.36, h * 0.2);
  ctx.lineTo(w * 0.64, h * 0.2);
  ctx.lineTo(w * 0.55, h * 0.55);
  ctx.lineTo(w * 0.58, h);
  ctx.closePath();
  ctx.fill();
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#060505';
  ctx.lineWidth = w * 0.05;
  [[0.38, 0.12], [0.62, 0.88]].forEach(([from, to]) => {
    ctx.beginPath();
    ctx.moveTo(w * from, h * 0.22);
    ctx.quadraticCurveTo(w * (from < 0.5 ? 0.22 : 0.78), h * 0.45, w * to, h * 0.72);
    ctx.stroke();
  });
  // Neck and head
  ctx.lineWidth = w * 0.04;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.2);
  ctx.lineTo(w * 0.53, h * 0.12);
  ctx.stroke();
  drawGrinner(ctx, w, h, { t: 0, scale: 0.36, cx: w * 0.54, cy: h * 0.085, dark: false, grin: 1.15, blood: 0.5 });
}
