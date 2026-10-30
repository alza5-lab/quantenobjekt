// ORBFALL // UNIT 33-3 · shivas_ocean · Luca Matteo Balzano 1991
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const V3 = THREE.Vector3;
const $ = id => document.getElementById(id);
const TAU = Math.PI * 2;
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const IS_TOUCH = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) && navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.body.classList.add('touch');

// ---------- Settings ----------
const S = Object.assign({ q: 'auto', view: 'tps', sens: 1, sound: 1, invert: 0, mode: 'time', val: 180 }, JSON.parse(localStorage.getItem('orbfall.settings') || '{}'));
const saveS = () => localStorage.setItem('orbfall.settings', JSON.stringify(S));

// ---------- Renderer ----------
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05060a);
scene.fog = new THREE.FogExp2(0x0a0b10, 0.010);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 500);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.45, 0.82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const TIERS = [
  { name: 'ULTRA', pr: 2, shadow: 2048, bloom: true, part: 1 },
  { name: 'HOCH', pr: 1.5, shadow: 1024, bloom: true, part: 1 },
  { name: 'MITTEL', pr: 1, shadow: 1024, bloom: false, part: 0.7 },
  { name: 'NIEDRIG', pr: 0.75, shadow: 0, bloom: false, part: 0.45 },
];
let tier = 1;

// ---------- Environment map ----------
function makeEnv() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x0c0d12, side: THREE.BackSide })));
  const g = new THREE.BoxGeometry(1, 1, 1);
  const panels = [[0xfff1d6, 5, 0, 6.9, 0, 12, .1, 4], [0x40e0ff, 2.5, -14.9, 4, 0, .1, 2, 14], [0xff3030, 2.2, 14.9, 4, 0, .1, 2, 14], [0xffc890, 4, 0, 3, -14.9, 16, 4, .1], [0xa64dff, 1.6, 0, 2, 14.9, 10, 1.5, .1]];
  for (const [c, i, x, y, z, w, h, d] of panels) { const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i) })); m.position.set(x, y, z); m.scale.set(w, h, d); s.add(m); }
  const pm = new THREE.PMREMGenerator(renderer);
  const t = pm.fromScene(s, 0.04).texture; pm.dispose(); return t;
}
scene.environment = makeEnv();
scene.environmentIntensity = 0.55;

// ---------- Canvas textures ----------
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  return t;
}
function drawWear(g, w, h, base = '#ddd3bc', amt = 1) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700 * amt; i++) { const a = rand(.02, .07); g.fillStyle = Math.random() < .55 ? `rgba(110,85,50,${a})` : `rgba(255,252,240,${a})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, rand(2, 24), 0, TAU); g.fill(); }
  for (let i = 0; i < 2600 * amt; i++) { g.fillStyle = `rgba(40,30,20,${rand(.05, .35)})`; g.fillRect(Math.random() * w, Math.random() * h, rand(.5, 2), rand(.5, 2)); }
  g.lineWidth = 1;
  for (let i = 0; i < 46 * amt; i++) { g.strokeStyle = `rgba(55,42,30,${rand(.25, .6)})`; g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += rand(-16, 16); y += rand(-16, 16); g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 14 * amt; i++) { g.fillStyle = `rgba(30,24,18,${rand(.3, .7)})`; g.beginPath(); const x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) g.lineTo(x + rand(-6, 6), y + rand(-4, 4)); g.fill(); }
  for (let i = 0; i < 70 * amt; i++) { const x = Math.random() * w, y = Math.random() * h; g.fillStyle = 'rgba(45,38,30,.75)'; g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,240,.45)'; g.beginPath(); g.arc(x - .7, y - .7, 1, 0, TAU); g.fill(); }
}
const wearTex = canvasTex(512, 512, (g, w, h) => {
  drawWear(g, w, h);
  g.strokeStyle = 'rgba(60,48,36,.5)'; g.lineWidth = 2;
  for (let i = 0; i < 4; i++) { g.beginPath(); const y = rand(0, h); g.moveTo(0, y); g.lineTo(w, y + rand(-24, 24)); g.stroke(); }
});

const M = {
  cream: new THREE.MeshStandardMaterial({ color: 0xfff0d6, map: wearTex, roughness: .55, metalness: .06, bumpMap: wearTex, bumpScale: .45 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x19191b, roughness: .72, metalness: .25 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2c2c30, roughness: .38, metalness: .9 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x6a6a70, roughness: .3, metalness: 1 }),
  red: new THREE.MeshStandardMaterial({ color: 0xa8151a, roughness: .55, metalness: .05 }),
  hole: new THREE.MeshStandardMaterial({ color: 0x030303, roughness: .25, metalness: .6 }),
};

function labelMat(text) {
  const t = canvasTex(256, 96, (g, w, h) => {
    g.fillStyle = '#e7ddc5'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1b1712'; g.lineWidth = 7; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = '#15120e'; g.font = 'bold 56px "Arial Narrow", "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3);
    for (let i = 0; i < 350; i++) { g.fillStyle = `rgba(70,50,30,${rand(.05, .3)})`; g.fillRect(Math.random() * w, Math.random() * h, rand(1, 3), rand(1, 3)); }
    for (const [x, y] of [[16, 16], [w - 16, 16], [16, h - 16], [w - 16, h - 16]]) { g.fillStyle = '#2a241c'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.MeshStandardMaterial({ map: t, roughness: .7, polygonOffset: true, polygonOffsetFactor: -2 });
}

// ---------- Rounded box geometry ----------
const _rb = new Map();
function rbox(w, h, d, r = .08, s = 8) {
  const key = [w, h, d, r, s].join();
  if (_rb.has(key)) return _rb.get(key);
  r = Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001);
  const g = new THREE.BoxGeometry(1, 1, 1, s, s, s);
  const p = g.attributes.position, n = g.attributes.normal;
  const half = [w / 2, h / 2, d / 2], k = 2 / s, lim = .5 - k;
  const v = new V3(), inner = new V3(), off = new V3();
  for (let i = 0; i < p.count; i++) {
    const c = [p.getX(i), p.getY(i), p.getZ(i)];
    for (let a = 0; a < 3; a++) { const ac = Math.abs(c[a]), sg = Math.sign(c[a]); c[a] = sg * (ac <= lim ? ac / lim * (half[a] - r) : (half[a] - r) + (ac - lim) / k * r); }
    v.set(c[0], c[1], c[2]);
    inner.set(clamp(v.x, -(half[0] - r), half[0] - r), clamp(v.y, -(half[1] - r), half[1] - r), clamp(v.z, -(half[2] - r), half[2] - r));
    off.copy(v).sub(inner); const L = off.length();
    if (L > 1e-6) { off.multiplyScalar(1 / L); v.copy(inner).addScaledVector(off, r); n.setXYZ(i, off.x, off.y, off.z); }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  _rb.set(key, g); return g;
}
function part(geo, mat, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
const grp = (parent, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
function decal(parent, text, w, h, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), labelMat(text)); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m;
}
function stripe(parent, w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) { const m = part(new THREE.BoxGeometry(w, h, d), M.red, parent, x, y, z, rx, ry, rz); m.castShadow = false; return m; }
function disc(parent, r, len, x, y, z, axis = 'x', mat = M.rubber) {
  const g = grp(parent, x, y, z);
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  part(new THREE.CylinderGeometry(r, r, len, 22), mat, g, 0, 0, 0, ...rot);
  part(new THREE.CylinderGeometry(r * .62, r * .62, len + .04, 18), M.metal, g, 0, 0, 0, ...rot);
  part(new THREE.TorusGeometry(r * .8, r * .09, 8, 22), M.steel, g, ...(axis === 'x' ? [len / 2, 0, 0] : [0, 0, len / 2]), ...(axis === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]));
  part(new THREE.TorusGeometry(r * .8, r * .09, 8, 22), M.steel, g, ...(axis === 'x' ? [-len / 2, 0, 0] : [0, 0, -len / 2]), ...(axis === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]));
  return g;
}
function cable(parent, pts, r = .045) {
  const c = new THREE.CatmullRomCurve3(pts.map(p => new V3(...p)));
  const m = part(new THREE.TubeGeometry(c, 16, r, 7), M.rubber, parent); return m;
}

// ---------- Mech UNIT 33-3 ----------
function buildCannon(parent, s) {
  // arm cannon mounted along the forearm (arm axis is -y)
  const c = grp(parent, s * .06, -.5, .12);
  part(rbox(.34, .62, .34, .06), M.metal, c, 0, 0, 0);
  part(new THREE.CylinderGeometry(.12, .14, .9, 16), M.rubber, c, 0, -.62, 0);
  part(new THREE.CylinderGeometry(.155, .155, .16, 16), M.cream, c, 0, -.42, 0);
  part(new THREE.CylinderGeometry(.155, .155, .12, 16), M.cream, c, 0, -.86, 0);
  stripe(c, .02, .14, .02, 0, -.86, .16);
  for (let i = 0; i < 3; i++) part(new THREE.CylinderGeometry(.04, .04, .7, 8), M.steel, c, Math.cos(i * 2.1) * .09, -.72, Math.sin(i * 2.1) * .09);
  part(new THREE.TorusGeometry(.13, .03, 8, 16), M.steel, c, 0, -1.08, 0, Math.PI / 2, 0, 0);
  cable(c, [[.12, .2, -.12], [.22, -.1, -.18], [.14, -.4, -.1]], .035);
  const muzzle = grp(c, 0, -1.12, 0);
  return { c, muzzle };
}
function buildForearm(fa, s, gun) {
  part(rbox(.56, .7, .58, .16), M.cream, fa, 0, -.36, 0);
  part(rbox(.62, .22, .62, .08), M.cream, fa, 0, -.62, 0);
  stripe(fa, .02, .36, .07, s * .29, -.34, .06);
  part(new THREE.CylinderGeometry(.18, .2, .16, 14), M.rubber, fa, 0, -.76, 0);
  const hand = grp(fa, 0, -.88, 0);
  part(rbox(.36, .26, .32, .06), M.rubber, hand, 0, -.04, 0);
  part(rbox(.38, .14, .3, .05), M.cream, hand, 0, -.02, .02);
  for (let i = 0; i < 4; i++) {
    const f = grp(hand, -.13 + i * .087, -.16, .07);
    part(rbox(.07, .14, .09, .025, 6), M.cream, f, 0, -.05, 0);
    part(rbox(.065, .11, .085, .025, 6), M.rubber, f, 0, -.15, .02, -.5);
    f.rotation.x = gun ? -1.1 : -.35;
  }
  const th = grp(hand, -s * .2, -.07, .08); part(rbox(.08, .16, .09, .025, 6), M.cream, th, 0, -.06, 0); th.rotation.z = s * .5;
  let muzzle = null;
  if (gun) muzzle = buildCannon(fa, s).muzzle;
  return { hand, muzzle };
}
function buildMech() {
  const root = new THREE.Group();
  const body = grp(root);
  const pelvis = grp(body, 0, 1.74, 0);
  part(rbox(.98, .4, .64, .12), M.rubber, pelvis, 0, 0, 0);
  part(rbox(.46, .34, .22, .07), M.cream, pelvis, 0, -.06, .3);
  part(rbox(.3, .28, .5, .08), M.cream, pelvis, .5, -.02, 0); part(rbox(.3, .28, .5, .08), M.cream, pelvis, -.5, -.02, 0);
  const torso = grp(pelvis, 0, .16, 0);
  part(new THREE.CylinderGeometry(.36, .42, .34, 16), M.rubber, torso, 0, .08, 0);
  for (let i = 0; i < 4; i++) part(new THREE.TorusGeometry(.38, .035, 6, 18), M.metal, torso, 0, -.02 + i * .07, 0, Math.PI / 2, 0, 0);
  part(rbox(.86, .4, .62, .13), M.cream, torso, 0, .38, .06);
  stripe(torso, .05, .2, .02, 0, .26, .38);
  part(rbox(.6, .22, .14, .05), M.cream, torso, 0, .45, .37);
  decal(torso, '000-01', .4, .145, 0, .455, .442);
  part(rbox(.18, .1, .1, .03), M.rubber, torso, 0, .14, .4);
  // chest
  part(rbox(1.46, .66, .92, .18), M.cream, torso, 0, .9, .02);
  part(rbox(.64, .44, .2, .07), M.cream, torso, -.36, .93, .44);
  part(rbox(.64, .44, .2, .07), M.cream, torso, .36, .93, .44);
  decal(torso, '33-3', .38, .145, .36, .97, .542);
  stripe(torso, .04, .22, .02, -.5, 1.02, .545);
  stripe(torso, .04, .14, .02, -.42, 1.27, .25, -.6);
  part(rbox(1.0, .22, .72, .08), M.cream, torso, 0, 1.28, -.04);
  part(rbox(.5, .2, .3, .06), M.cream, torso, -.36, 1.34, .2, -.3, 0, .2);
  part(rbox(.5, .2, .3, .06), M.cream, torso, .36, 1.34, .2, -.3, 0, -.2);
  part(rbox(.4, .3, .3, .05), M.rubber, torso, 0, .78, .3);
  // side ribs
  for (const s of [-1, 1]) { part(rbox(.2, .5, .6, .06), M.rubber, torso, s * .55, .55, 0); for (let i = 0; i < 3; i++) part(rbox(.22, .1, .5, .03), M.cream, torso, s * .58, .4 + i * .14, .04); }
  // neck + cables
  const neck = grp(torso, 0, 1.34, .02);
  part(new THREE.CylinderGeometry(.14, .2, .32, 12), M.rubber, neck, 0, .08, 0);
  for (const s of [-1, 1]) { cable(torso, [[s * .2, 1.2, -.25], [s * .3, 1.42, -.1], [s * .12, 1.48, .05]], .05); cable(torso, [[s * .45, 1.25, -.2], [s * .5, 1.45, -.32], [s * .3, 1.3, -.5]], .055); }
  const head = grp(torso, 0, 1.34, .14);
  part(rbox(.42, .7, .36, .1), M.cream, head, 0, .32, 0);
  part(rbox(.36, .5, .06, .05), M.cream, head, 0, .38, .18);
  for (let i = 0; i < 3; i++) {
    part(new THREE.CylinderGeometry(.068, .068, .1, 18), M.hole, head, 0, .56 - i * .14, .2, Math.PI / 2);
    part(new THREE.TorusGeometry(.072, .014, 8, 18), M.metal, head, 0, .56 - i * .14, .215);
  }
  part(rbox(.2, .025, .02, .01, 6), M.rubber, head, 0, .08, .19);
  part(rbox(.46, .16, .3, .05), M.rubber, head, 0, .02, -.04);
  // backpack
  const pack = grp(torso, 0, .92, -.62);
  part(rbox(1.0, 1.0, .46, .1), M.rubber, pack, 0, 0, 0);
  part(rbox(.9, .45, .4, .08), M.cream, pack, 0, .32, -.12);
  part(rbox(.42, .34, .36, .06), M.metal, pack, 0, -.18, -.18);
  for (const s of [-1, 1]) {
    part(new THREE.CylinderGeometry(.16, .16, .8, 16), M.cream, pack, s * .36, -.05, -.26);
    part(new THREE.CylinderGeometry(.1, .12, .2, 12), M.metal, pack, s * .36, -.52, -.26);
    part(new THREE.CylinderGeometry(.06, .06, .24, 10), M.hole, pack, s * .36, -.62, -.26);
    cable(pack, [[s * .2, .3, .1], [s * .5, .2, -.1], [s * .45, -.3, -.3]], .045);
  }
  stripe(pack, .03, .3, .02, .2, .32, -.33);
  const jet = grp(pack, 0, -.62, -.26);
  // shoulders & arms (mech right = -x carries the cannon and 9D-011)
  const arms = {};
  for (const s of [-1, 1]) {
    const sh = grp(torso, s * .96, 1.06, 0);
    part(new THREE.SphereGeometry(.26, 16, 12), M.rubber, sh, 0, 0, 0);
    const paul = grp(sh, s * .1, .12, 0);
    part(rbox(.66, .52, .84, .2), M.cream, paul, 0, 0, 0);
    part(rbox(.6, .16, .78, .06), M.cream, paul, s * .03, -.3, 0);
    if (s < 0) decal(paul, '9D-011', .46, .17, -.02, .02, .425);
    stripe(paul, .02, .3, .05, s * .335, -.02, .2);
    const ua = grp(sh, s * .06, -.06, 0);
    part(rbox(.42, .62, .46, .12), M.cream, ua, 0, -.5, 0);
    part(new THREE.CylinderGeometry(.17, .17, .24, 12), M.rubber, ua, 0, -.15, 0);
    stripe(ua, .02, .36, .06, s * .215, -.5, 0);
    disc(ua, .17, .5, 0, -.86, 0, 'x');
    const fa = grp(ua, 0, -.86, 0);
    const fr = buildForearm(fa, s, s < 0);
    arms[s < 0 ? 'R' : 'L'] = { sh, ua, fa, hand: fr.hand, muzzle: fr.muzzle };
  }
  // legs
  const legs = {};
  for (const s of [-1, 1]) {
    const hip = grp(body, s * .42, 1.66, 0);
    part(new THREE.SphereGeometry(.25, 14, 10), M.rubber, hip, 0, 0, 0);
    part(rbox(.68, .86, .74, .24), M.cream, hip, s * .02, -.44, .02);
    part(rbox(.2, .7, .6, .06), M.rubber, hip, -s * .3, -.42, 0);
    part(rbox(.12, .6, .56, .05), M.cream, hip, s * .37, -.46, 0);
    stripe(hip, .04, .3, .02, s * .05, -.5, .4);
    const knee = grp(hip, 0, -.86, 0);
    disc(knee, .2, .64, 0, 0, 0, 'x');
    part(rbox(.4, .34, .22, .07), M.cream, knee, 0, .02, .3, .15);
    part(rbox(.22, .2, .12, .04), M.rubber, knee, 0, -.06, .42);
    const shin = grp(knee, 0, 0, 0);
    part(rbox(.56, .68, .6, .16), M.cream, shin, 0, -.4, .0);
    part(rbox(.4, .46, .3, .07), M.rubber, shin, 0, -.36, -.24);
    stripe(shin, .045, .34, .02, 0, -.4, .31);
    const ankle = grp(shin, 0, -.6, 0);
    disc(ankle, .14, .62, 0, 0, 0, 'x');
    part(rbox(.62, .26, .9, .1), M.cream, ankle, 0, -.06, .12);
    part(rbox(.64, .1, .92, .04), M.rubber, ankle, 0, -.17, .12);
    part(rbox(.5, .18, .2, .05), M.cream, ankle, 0, -.04, .6);
    part(rbox(.66, .06, .12, .02), M.rubber, ankle, 0, -.1, .52);
    legs[s < 0 ? 'R' : 'L'] = { hip, knee, shin, ankle };
  }
  root.traverse(o => { if (o.isMesh && o.material === M.red) o.castShadow = false; });
  return { root, body, pelvis, torso, head, arms, legs, jet, muzzle: arms.R.muzzle };
}
const mech = buildMech();
scene.add(mech.root);

// First person viewmodel (gun arm)
const vm = new THREE.Group();
{
  const fa = grp(vm);
  const r = buildForearm(fa, -1, true);
  vm.userData.muzzle = r.muzzle;
  fa.rotation.set(Math.PI / 2, Math.PI, 0);
  vm.position.set(.3, -.3, -.78); vm.scale.setScalar(.26);
  vm.traverse(o => { if (o.isMesh) { o.castShadow = false; } });
  vm.visible = false; camera.add(vm);
}

// ---------- Arena ----------
const HALF = 46;
const BOXES = [], RAMPS = [], SOLIDS = [];
const wallTex = canvasTex(512, 512, (g, w, h) => {
  drawWear(g, w, h, '#cdc2a9', .7);
  g.fillStyle = 'rgba(40,30,20,.08)'; for (let x = 0; x < w; x += 4) g.fillRect(x, 0, 2, h * rand(.3, 1));
  g.strokeStyle = 'rgba(40,32,24,.6)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke();
  g.fillStyle = '#a8191d'; g.fillRect(0, h * .78, w, h * .045); g.fillRect(0, h * .85, w, h * .015);
  g.font = 'bold 190px "Arial Black", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#a8191d'; g.fillText('9D', w * .28, h * .42);
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(205,194,169,${rand(.3, .9)})`; g.fillRect(rand(0, w * .55), rand(h * .2, h * .6), rand(2, 9), rand(1, 4)); }
  for (let i = 0; i < 6; i++) { const x = rand(w * .55, w * .95); g.fillStyle = '#a8191d'; g.beginPath(); g.moveTo(x, h * .3); g.lineTo(x + 30, h * .3); g.lineTo(x + 10, h * .42); g.lineTo(x - 20, h * .42); g.fill(); }
  g.fillStyle = 'rgba(20,16,12,.7)'; g.font = 'bold 22px Arial'; g.textAlign = 'left'; g.fillText('SEKTOR 33 · UNIT 9D-011', w * .56, h * .62);
});
const blockTex = canvasTex(256, 256, (g, w, h) => {
  drawWear(g, w, h, '#d3c8ae', .5);
  g.fillStyle = '#a8191d'; g.fillRect(0, h * .1, w, h * .06);
  for (let x = -40; x < w; x += 36) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 18, h); g.lineTo(x + 48, h * .86); g.lineTo(x + 30, h * .86); g.fillStyle = '#1a1714'; g.fill(); }
  g.strokeStyle = 'rgba(40,32,24,.6)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
  g.fillStyle = 'rgba(25,20,15,.8)'; g.font = 'bold 26px Arial'; g.fillText('33-3', 14, h * .45);
});
const panelTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#16171b'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '255,255,255' : '0,0,0'},${rand(.02, .06)})`; g.fillRect(Math.random() * w, Math.random() * h, rand(1, 6), rand(1, 6)); }
  g.strokeStyle = '#2a2c33'; g.lineWidth = 3; for (let i = 0; i <= 2; i++) { g.beginPath(); g.moveTo(i * w / 2, 0); g.lineTo(i * w / 2, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 2); g.lineTo(w, i * h / 2); g.stroke(); }
  for (let x = 8; x < w; x += w / 2) for (let y = 8; y < h; y += h / 2) for (const [a, b] of [[0, 0], [w / 2 - 16, 0], [0, h / 2 - 16], [w / 2 - 16, h / 2 - 16]]) { g.fillStyle = '#3a3c44'; g.beginPath(); g.arc(x + a + 4, y + b + 4, 3, 0, TAU); g.fill(); }
});
const grateTex = canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2b2d33'; for (let y = 0; y < h; y += 16) g.fillRect(0, y, w, 5);
  g.fillStyle = '#1d1f24'; for (let x = 0; x < w; x += 64) g.fillRect(x, 0, 6, h);
  g.fillStyle = '#a8191d'; g.fillRect(0, 0, 10, h); g.fillRect(w - 10, 0, 10, h);
});
const FLOOR_PX = 2048, FS = FLOOR_PX / (HALF * 2);
const fx = x => (x + HALF) * FS;
const floorTex = canvasTex(FLOOR_PX, FLOOR_PX, (g, w, h) => {
  g.fillStyle = '#07080a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${rand(.005, .03)})`; g.fillRect(Math.random() * w, Math.random() * h, rand(1, 4), rand(1, 4)); }
  g.strokeStyle = '#15181f'; g.lineWidth = 2;
  for (let x = -HALF; x <= HALF; x += 4) { g.beginPath(); g.moveTo(fx(x), 0); g.lineTo(fx(x), h); g.stroke(); g.beginPath(); g.moveTo(0, fx(x)); g.lineTo(w, fx(x)); g.stroke(); }
  for (const [x, z, sw, sd] of [[-8, 28, 6, 4], [8, -28, 6, 4], [28, 0, 4, 8], [-28, 0, 4, 8], [0, 12, 4, 3], [0, -12, 4, 3]]) {
    g.fillStyle = '#121419'; g.fillRect(fx(x - sw / 2), fx(z - sd / 2), sw * FS, sd * FS);
    g.fillStyle = '#05060a'; for (let k = 0; k < sd * FS; k += 7) g.fillRect(fx(x - sw / 2) + 4, fx(z - sd / 2) + k, sw * FS - 8, 3);
  }
  g.strokeStyle = '#3a1416'; g.lineWidth = 6; g.setLineDash([24, 18]);
  g.strokeRect(fx(-8), fx(-8), 16 * FS, 16 * FS); g.setLineDash([]);
});
const laneTex = canvasTex(FLOOR_PX, FLOOR_PX, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const line = (pts, c, lw) => { g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); pts.forEach(([x, z], i) => i ? g.lineTo(fx(x), fx(z)) : g.moveTo(fx(x), fx(z))); g.stroke(); };
  g.shadowBlur = 10;
  for (const [c, lw] of [['#0d6f9a', 5], ['#38dcff', 2]]) {
    g.shadowColor = c;
    line([[-HALF + 1, 0], [-6, 0]], c, lw); line([[6, 0], [HALF - 1, 0]], c, lw);
    line([[0, -HALF + 1], [0, -6]], c, lw); line([[0, 6], [0, HALF - 1]], c, lw);
    line([[-14, -14], [14, -14], [14, 14], [-14, 14], [-14, -14]], c, lw);
  }
  g.shadowColor = '#ff2020';
  line([[-6, -6], [6, -6], [6, 6], [-6, 6], [-6, -6]], '#ff3030', 3);
  for (const s of [-1, 1]) { line([[s * 20, s * 42], [s * 42, s * 42], [s * 42, s * 20]], '#a64dff', 3); line([[s * 42, -s * 20], [s * 42, -s * 42], [s * 20, -s * 42]], '#ffb21f', 2); }
  g.shadowBlur = 0;
});
floorTex.anisotropy = laneTex.anisotropy = 12;
const floorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: floorTex, roughness: .38, metalness: .35, envMapIntensity: .3, emissive: 0xffffff, emissiveMap: laneTex, emissiveIntensity: 1.4 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), floorMat);
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

function boxGeoUV(w, h, d, tile) {
  const g = new THREE.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile, uv.getY(i) * dims[f][1] / tile); }
  return g;
}
const MA = {
  wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: .85, metalness: .02, bumpMap: wallTex, bumpScale: .6 }),
  block: new THREE.MeshStandardMaterial({ map: blockTex, roughness: .8, metalness: .03 }),
  panel: new THREE.MeshStandardMaterial({ map: panelTex, roughness: .45, metalness: .75 }),
  grate: new THREE.MeshStandardMaterial({ map: grateTex, roughness: .5, metalness: .8 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: .5, metalness: .8 }),
  glass: new THREE.MeshStandardMaterial({ color: 0x050608, roughness: .05, metalness: .9, transparent: true, opacity: .55 }),
};
const glowMat = c => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(2.2), toneMapped: false });
function addBox(x, z, w, d, h, mat = MA.block, tile = 4, y0 = 0, collide = true) {
  const m = new THREE.Mesh(boxGeoUV(w, h, d, tile), mat);
  m.position.set(x, y0 + h / 2, z); m.castShadow = true; m.receiveShadow = true; scene.add(m);
  const b = { min: new V3(x - w / 2, y0, z - d / 2), max: new V3(x + w / 2, y0 + h, z + d / 2), mesh: m };
  if (collide) BOXES.push(b);
  return b;
}
// perimeter walls
for (const [x, z, w, d] of [[0, -HALF - 1, HALF * 2 + 4, 2], [0, HALF + 1, HALF * 2 + 4, 2], [-HALF - 1, 0, 2, HALF * 2 + 4], [HALF + 1, 0, 2, HALF * 2 + 4]]) addBox(x, z, w, d, 12, MA.wall, 8);
// wall top glow trims
for (const [x, z, w, d, c] of [[0, -HALF + .02, HALF * 2, .06, 0xff3030], [0, HALF - .02, HALF * 2, .06, 0xff3030], [-HALF + .02, 0, .06, HALF * 2, 0x38dcff], [HALF - .02, 0, .06, HALF * 2, 0x38dcff]]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, .12, d), glowMat(c)); m.position.set(x, 1.0, z); scene.add(m);
}
// cover blocks
const COVER = [[-12, -8, 6, 2, 2.2], [12, -8, 6, 2, 2.2], [-12, 8, 6, 2, 2.2], [12, 8, 6, 2, 2.2], [0, -22, 10, 2, 2.6], [0, 22, 10, 2, 2.6], [-22, 0, 2, 10, 2.6], [22, 0, 2, 10, 2.6],
  [-36, 8, 4, 4, 3.2], [36, -8, 4, 4, 3.2], [-8, 36, 4, 4, 3.2], [8, -36, 4, 4, 3.2], [-18, -30, 3, 3, 1.6], [18, 30, 3, 3, 1.6], [30, -14, 3, 3, 1.6], [-30, 14, 3, 3, 1.6],
  [-40, -6, 3, 6, 5], [40, 6, 3, 6, 5], [14, -42, 6, 3, 5], [-14, 42, 6, 3, 5]];
for (const [x, z, w, d, h] of COVER) addBox(x, z, w, d, h, MA.block, 4);
// platforms + ramps
function addRamp(x0, x1, z0, z1, axis, a, b, h0, h1) {
  const r = { x0, x1, z0, z1, axis, a, b, h0, h1 }; RAMPS.push(r);
  const run = Math.abs(b - a), rise = h1 - h0, L = Math.hypot(run, rise), wid = axis === 'z' ? x1 - x0 : z1 - z0;
  const g = new THREE.BoxGeometry(axis === 'z' ? wid : L, .3, axis === 'z' ? L : wid);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * wid / 4, uv.getY(i) * L / 4);
  const m = new THREE.Mesh(g, MA.grate); m.receiveShadow = true; m.castShadow = true;
  const ang = Math.atan2(rise, b - a);
  m.position.set((x0 + x1) / 2, (h0 + h1) / 2 - .15, (z0 + z1) / 2);
  if (axis === 'z') m.rotation.x = -ang; else m.rotation.z = ang;
  scene.add(m);
  // side rails
  for (const s of [0, 1]) {
    const rl = new THREE.Mesh(new THREE.BoxGeometry(axis === 'z' ? .12 : L, .12, axis === 'z' ? L : .12), glowMat(0xff3030));
    rl.position.copy(m.position); rl.rotation.copy(m.rotation);
    if (axis === 'z') rl.position.x = s ? x1 : x0; else rl.position.z = s ? z1 : z0;
    rl.position.y += .2; scene.add(rl);
  }
  return r;
}
function addPlatform(x, z, w, d, h, accent) {
  const b = addBox(x, z, w, d, h, MA.panel, 4);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .25, d + .1), M.cream); trim.position.set(x, h - .12, z); trim.castShadow = true; scene.add(trim);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(w + .14, .06, d + .14), glowMat(accent)); gl.position.set(x, h - .35, z); scene.add(gl);
  // railing glass
  return b;
}
addPlatform(-32, -32, 16, 16, 4, 0x38dcff); addRamp(-35, -29, -24, -12, 'z', -12, -24, 0, 4);
addPlatform(32, 32, 16, 16, 4, 0x38dcff); addRamp(29, 35, 12, 24, 'z', 12, 24, 0, 4);
addPlatform(32, -32, 12, 12, 2, 0xffb21f); addRamp(18, 26, -35, -29, 'x', 18, 26, 0, 2);
addPlatform(-32, 32, 12, 12, 2, 0xffb21f); addRamp(-26, -18, 29, 35, 'x', -18, -26, 0, 2);
for (const [x, z] of [[-32, -32], [32, 32]]) { addBox(x + 3, z + 3, 2.5, 2.5, 1.6, MA.block, 4, 4); }

// central core
const core = new THREE.Group(); scene.add(core);
addBox(0, 0, 8, 8, .5, MA.panel, 4);
addBox(0, 0, 3.2, 3.2, 7.5, MA.dark, 4, .5).mesh.visible = false;
const coreMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xff2a2a, emissiveIntensity: 2.2, roughness: .3 });
{
  const c = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 7, 24, 1, true), coreMat); c.position.y = 4; core.add(c);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 7, 6, 1, true), MA.glass); sh.position.y = 4; core.add(sh);
  for (let i = 0; i < 6; i++) { const p = part(rbox(.3, 7, .3, .06), M.cream, core, Math.cos(i / 6 * TAU) * 1.6, 4, Math.sin(i / 6 * TAU) * 1.6); }
  part(new THREE.CylinderGeometry(2, 2.2, .6, 6), M.cream, core, 0, .8, 0);
  part(new THREE.CylinderGeometry(2, 2, .4, 6), M.cream, core, 0, 7.6, 0);
}
const coreRings = [];
for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * .5, .05, 8, 64), glowMat(i === 1 ? 0xffffff : 0xff3030)); r.position.y = 3 + i * 1.6; core.add(r); coreRings.push(r); }

// spawn portals
const PORTALS = [];
for (const [x, z, ry] of [[0, -HALF + .1, 0], [0, HALF - .1, Math.PI], [-HALF + .1, 0, Math.PI / 2], [HALF - .1, 0, -Math.PI / 2], [-HALF + .1, -24, Math.PI / 2], [HALF - .1, 24, -Math.PI / 2]]) {
  const g = new THREE.Group(); g.position.set(x, 8, z); g.rotation.y = ry; scene.add(g);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, .12, 10, 40), glowMat(0xff3030)); g.add(ring);
  const d = new THREE.Mesh(new THREE.CircleGeometry(1.7, 32), new THREE.MeshBasicMaterial({ color: 0x000000 })); d.position.z = -.02; g.add(d);
  part(rbox(4.6, 4.6, .5, .2), M.cream, g, 0, 0, -.2);
  const inward = new V3(0, 0, 1).applyAxisAngle(new V3(0, 1, 0), ry);
  PORTALS.push({ g, ring, pos: new V3(x, 8, z).addScaledVector(inward, 2.5) });
}

// sky + surroundings
{
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 top = vec3(.008,.01,.02); vec3 hor = vec3(.16,.07,.05); float sun = pow(max(dot(vP, normalize(vec3(.4,.08,-.9))),0.),24.); vec3 c = mix(hor, top, smoothstep(-.02,.45,h)) + vec3(1.,.5,.25)*sun*.8; gl_FragColor = vec4(c,1.); }'
  }));
  scene.add(sky);
  const winTex = canvasTex(128, 256, (g, w, h) => { g.fillStyle = '#0b0c10'; g.fillRect(0, 0, w, h); for (let y = 6; y < h; y += 10) for (let x = 6; x < w; x += 12) if (Math.random() < .14) { g.fillStyle = Math.random() < .2 ? '#ff3a2a' : '#ffcf8a'; g.fillRect(x, y, 6, 3); } });
  const tm = new THREE.MeshStandardMaterial({ color: 0x15161b, roughness: .8, metalness: .4, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: .9 });
  for (let i = 0; i < 26; i++) {
    const a = i / 26 * TAU + rand(-.08, .08), r = rand(64, 120), hh = rand(18, 70), w = rand(6, 16);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, w), tm); m.position.set(Math.cos(a) * r, hh / 2, Math.sin(a) * r); scene.add(m);
    if (Math.random() < .4) { const b = new THREE.Mesh(new THREE.BoxGeometry(.4, .4, .4), glowMat(0xff3030)); b.position.set(m.position.x, hh + .5, m.position.z); scene.add(b); }
  }
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ color: 0x050507, roughness: .9 })); outer.rotation.x = -Math.PI / 2; outer.position.y = -.05; scene.add(outer);
  // overhead gantries
  for (const z of [-20, 20]) { part(new THREE.BoxGeometry(HALF * 2 + 4, .8, 1.2), MA.dark, scene, 0, 15, z); for (const x of [-30, 0, 30]) { const l = new THREE.Mesh(new THREE.BoxGeometry(2.4, .1, .5), glowMat(0xfff1d6)); l.position.set(x, 14.55, z); scene.add(l); } }
}

// lights
const hemi = new THREE.HemisphereLight(0x8a96b0, 0x0a0a0d, .55); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd6a8, 2.4);
sun.position.set(26, 48, -30); sun.target.position.set(0, 0, 0); scene.add(sun, sun.target);
sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 52, bottom: -52, near: 5, far: 140 });
sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
const coreLight = new THREE.PointLight(0xff2a2a, 60, 32, 1.6); coreLight.position.set(0, 4, 0); scene.add(coreLight);
const fill1 = new THREE.PointLight(0x38dcff, 40, 40, 1.6); fill1.position.set(-30, 7, -30); scene.add(fill1);
const fill2 = new THREE.PointLight(0xa64dff, 40, 40, 1.6); fill2.position.set(30, 7, 30); scene.add(fill2);
const boomLight = new THREE.PointLight(0xffaa66, 0, 26, 1.5); scene.add(boomLight);
const muzzleLight = new THREE.PointLight(0xffd0a0, 0, 10, 1.8); scene.add(muzzleLight);

// collision helpers
function groundAt(x, z, y, rad = .3) {
  let h = 0;
  for (const b of BOXES) if (x > b.min.x - rad && x < b.max.x + rad && z > b.min.z - rad && z < b.max.z + rad && b.max.y <= y + .75 && b.max.y > h) h = b.max.y;
  for (const r of RAMPS) if (x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) {
    const c = r.axis === 'z' ? z : x; const t = clamp((c - r.a) / (r.b - r.a), 0, 1); const rh = r.h0 + (r.h1 - r.h0) * t;
    if (rh <= y + .75 && rh > h) h = rh;
  }
  return h;
}
function pushOut(p, R, y0, y1) {
  for (const b of BOXES) {
    if (b.max.y <= y0 + .75 || b.min.y >= y1) continue;
    const cx = clamp(p.x, b.min.x, b.max.x), cz = clamp(p.z, b.min.z, b.max.z);
    const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
    if (d2 < R * R) {
      if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x += dx / d * (R - d); p.z += dz / d * (R - d); }
      else { const opts = [[b.min.x - R - p.x, 0], [b.max.x + R - p.x, 0], [0, b.min.z - R - p.z], [0, b.max.z + R - p.z]]; opts.sort((a, c) => Math.abs(a[0] + a[1]) - Math.abs(c[0] + c[1])); p.x += opts[0][0]; p.z += opts[0][1]; }
    }
  }
  p.x = clamp(p.x, -HALF + R, HALF - R); p.z = clamp(p.z, -HALF + R, HALF - R);
}
function rayBox(o, d, b, tmax) {
  let t0 = 0, t1 = tmax;
  for (const a of ['x', 'y', 'z']) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < b.min[a] || o[a] > b.max[a]) return Infinity; continue; }
    const inv = 1 / d[a]; let tn = (b.min[a] - o[a]) * inv, tf = (b.max[a] - o[a]) * inv;
    if (tn > tf) { const t = tn; tn = tf; tf = t; }
    t0 = Math.max(t0, tn); t1 = Math.min(t1, tf); if (t0 > t1) return Infinity;
  }
  return t0;
}
function rayWorld(o, d, tmax) {
  let t = tmax;
  if (d.y < 0) t = Math.min(t, -o.y / d.y);
  for (const b of BOXES) { const bt = rayBox(o, d, b, t); if (bt < t) t = bt; }
  for (const r of RAMPS) { // approx: sample
    const bb = { min: new V3(r.x0, 0, r.z0), max: new V3(r.x1, Math.max(r.h0, r.h1), r.z1) };
    const bt = rayBox(o, d, bb, t); if (bt < t) { for (let s = bt; s < Math.min(t, bt + 20); s += .25) { const px = o.x + d.x * s, py = o.y + d.y * s, pz = o.z + d.z * s; if (px < r.x0 || px > r.x1 || pz < r.z0 || pz > r.z1) continue; const c = r.axis === 'z' ? pz : px; const rh = r.h0 + (r.h1 - r.h0) * clamp((c - r.a) / (r.b - r.a), 0, 1); if (py <= rh) { t = s; break; } } }
  }
  return t;
}
function pointBlocked(p) {
  if (p.y < 0) return true;
  for (const b of BOXES) if (p.x > b.min.x && p.x < b.max.x && p.y > b.min.y && p.y < b.max.y && p.z > b.min.z && p.z < b.max.z) return true;
  return false;
}

// ---------- FX: particles ----------
const PN = 2400;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PN * 3), pCol = new Float32Array(PN * 3), pSize = new Float32Array(PN), pAlpha = new Float32Array(PN);
const pVel = new Float32Array(PN * 3), pLife = new Float32Array(PN), pMax = new Float32Array(PN), pDrag = new Float32Array(PN), pGrav = new Float32Array(PN), pS0 = new Float32Array(PN);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('pcol', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('psize', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
pGeo.setAttribute('palpha', new THREE.BufferAttribute(pAlpha, 1).setUsage(THREE.DynamicDrawUsage));
const pMat = new THREE.ShaderMaterial({
  uniforms: { uK: { value: 500 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'attribute vec3 pcol; attribute float psize; attribute float palpha; uniform float uK; varying vec3 vC; varying float vA; void main(){ vC=pcol; vA=palpha; vec4 mv = modelViewMatrix*vec4(position,1.); gl_PointSize = palpha>0. ? max(1.5, psize*uK/-mv.z) : 0.; gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'varying vec3 vC; varying float vA; void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard; float a = smoothstep(.5,.0,d); gl_FragColor = vec4(vC*a*vA, 1.); }'
});
const points = new THREE.Points(pGeo, pMat); points.frustumCulled = false; scene.add(points);
let pHead = 0;
function emit(p, vx, vy, vz, c, size, life, drag = 1, grav = 0) {
  const i = pHead; pHead = (pHead + 1) % PN;
  pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z;
  pVel[i * 3] = vx; pVel[i * 3 + 1] = vy; pVel[i * 3 + 2] = vz;
  pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
  pS0[i] = size; pSize[i] = size; pLife[i] = life; pMax[i] = life; pDrag[i] = drag; pGrav[i] = grav; pAlpha[i] = 1;
}
function updateParticles(dt) {
  for (let i = 0; i < PN; i++) {
    if (pLife[i] <= 0) { if (pAlpha[i] !== 0) pAlpha[i] = 0; continue; }
    pLife[i] -= dt; const k = Math.max(0, pLife[i] / pMax[i]);
    const dr = Math.exp(-pDrag[i] * dt);
    pVel[i * 3] *= dr; pVel[i * 3 + 1] = pVel[i * 3 + 1] * dr - pGrav[i] * dt; pVel[i * 3 + 2] *= dr;
    pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    if (pPos[i * 3 + 1] < .02) { pPos[i * 3 + 1] = .02; pVel[i * 3 + 1] *= -.3; }
    pAlpha[i] = k; pSize[i] = pS0[i] * (.4 + .6 * k);
  }
  pGeo.attributes.position.needsUpdate = pGeo.attributes.pcol.needsUpdate = pGeo.attributes.psize.needsUpdate = pGeo.attributes.palpha.needsUpdate = true;
}
const _c = new THREE.Color();
function sparks(p, col, n, speed, size = .25, life = .5, grav = 6) {
  n = Math.round(n * TIERS[tier].part);
  for (let i = 0; i < n; i++) {
    const u = rand(-1, 1), th = rand(0, TAU), s = Math.sqrt(1 - u * u), sp = speed * rand(.3, 1);
    _c.set(col).multiplyScalar(rand(1.5, 4));
    emit(p, Math.cos(th) * s * sp, u * sp, Math.sin(th) * s * sp, _c, size * rand(.6, 1.4), life * rand(.5, 1.2), 2.2, grav);
  }
}
// debris (cream shell chunks)
const DN = 160;
const debris = new THREE.InstancedMesh(rbox(.32, .14, .26, .05, 6), M.cream, DN);
debris.castShadow = true; debris.frustumCulled = false; scene.add(debris);
const dState = Array.from({ length: DN }, () => ({ p: new V3(0, -50, 0), v: new V3(), r: new V3(), w: new V3(), life: 0, s: 1 }));
let dHead = 0; const _o = new THREE.Object3D(); const HIDEV = new V3(0, -60, 0);
function chunks(p, n, sc = 1, speed = 8) {
  for (let i = 0; i < n; i++) { const d = dState[dHead]; dHead = (dHead + 1) % DN; d.p.copy(p); d.v.set(rand(-1, 1), rand(.2, 1.4), rand(-1, 1)).multiplyScalar(speed * rand(.4, 1)); d.r.set(rand(0, TAU), rand(0, TAU), 0); d.w.set(rand(-9, 9), rand(-9, 9), rand(-9, 9)); d.life = rand(1.2, 2.2); d.s = sc * rand(.6, 1.3); }
}
function updateDebris(dt) {
  for (let i = 0; i < DN; i++) {
    const d = dState[i];
    if (d.life > 0) {
      d.life -= dt; d.v.y -= 22 * dt; d.p.addScaledVector(d.v, dt); d.r.addScaledVector(d.w, dt);
      if (d.p.y < .08) { d.p.y = .08; d.v.y *= -.35; d.v.x *= .6; d.v.z *= .6; d.w.multiplyScalar(.6); }
    }
    _o.position.copy(d.life > 0 ? d.p : HIDEV); _o.rotation.set(d.r.x, d.r.y, d.r.z); _o.scale.setScalar(d.life > 0 ? d.s * Math.min(1, d.life * 2) : .001); _o.updateMatrix();
    debris.setMatrixAt(i, _o.matrix);
  }
  debris.instanceMatrix.needsUpdate = true;
}
// tracers
const TRN = 28; const tracers = [];
const trGeo = new THREE.BoxGeometry(.05, .05, 1); trGeo.translate(0, 0, .5);
for (let i = 0; i < TRN; i++) { const m = new THREE.Mesh(trGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd9a0).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); m.visible = false; scene.add(m); tracers.push({ m, t: 0 }); }
let trHead = 0;
function tracer(a, b, col = 0xffd9a0) { const t = tracers[trHead]; trHead = (trHead + 1) % TRN; t.m.position.copy(a); t.m.lookAt(b); t.m.scale.set(1, 1, a.distanceTo(b)); t.m.material.color.set(col).multiplyScalar(3); t.m.material.opacity = 1; t.m.visible = true; t.t = .07; }
// shock rings
const rings = [];
function ring(p, col, maxR, dur = .45, flat = true) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 8, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  m.position.copy(p); if (flat) m.rotation.x = Math.PI / 2; else m.lookAt(camera.position);
  scene.add(m); rings.push({ m, t: 0, dur, maxR });
}
function updateFX(dt) {
  updateParticles(dt); updateDebris(dt);
  for (const t of tracers) if (t.t > 0) { t.t -= dt; t.m.material.opacity = Math.max(0, t.t / .07); if (t.t <= 0) t.m.visible = false; }
  for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; const k = r.t / r.dur; r.m.scale.setScalar(.2 + k * r.maxR); r.m.material.opacity = 1 - k; if (k >= 1) { scene.remove(r.m); r.m.geometry.dispose(); r.m.material.dispose(); rings.splice(i, 1); } }
  boomLight.intensity = Math.max(0, boomLight.intensity - dt * 900);
  muzzleLight.intensity = Math.max(0, muzzleLight.intensity - dt * 400);
}
function explode(p, col, scale = 1) {
  sparks(p, col, 50 * scale, 14 * Math.sqrt(scale), .32 * Math.sqrt(scale), .6, 4);
  sparks(p, 0xff8a3a, 30 * scale, 8 * Math.sqrt(scale), .5 * Math.sqrt(scale), .8, 2);
  sparks(p, 0xffffff, 10 * scale, 4, .9 * Math.sqrt(scale), .18, 0);
  chunks(p, Math.round(6 * Math.min(scale, 3)), Math.sqrt(scale), 8);
  ring(p, col, 3 * scale, .4, false);
  boomLight.position.copy(p); boomLight.color.set(col).lerp(_c.set(0xffaa66), .5); boomLight.intensity = 220 * Math.min(scale, 3);
  shake(Math.min(.5, .9 * scale / (1 + P.pos.distanceTo(p) * .15)));
}

// ---------- Audio ----------
let AC = null, noiseBuf = null;
function audio() {
  if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); noiseBuf = AC.createBuffer(1, AC.sampleRate * .6, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } catch (e) { AC = null; } }
  if (AC && AC.state === 'suspended') AC.resume();
}
function tone(type, f0, f1, dur, vol, delay = 0) {
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .02);
}
function noise(dur, vol, freq, q = 1) {
  const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(60, t + dur); f.Q.value = q;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(f).connect(g).connect(AC.destination); s.start(t); s.stop(t + dur);
}
let lastShotSfx = 0;
function sfx(k) {
  if (!AC || !S.sound) return;
  const now = AC.currentTime;
  switch (k) {
    case 'shot': if (now - lastShotSfx < .045) return; lastShotSfx = now; tone('square', 220, 70, .07, .045); noise(.06, .07, 3000); break;
    case 'charge': tone('sawtooth', 120, 40, .45, .08); noise(.4, .18, 1800); break;
    case 'boom': noise(.6, .35, 900); tone('sine', 90, 30, .5, .2); break;
    case 'bigboom': noise(1.2, .5, 600); tone('sine', 60, 20, 1.2, .3); break;
    case 'hit': tone('sine', 1300, 900, .05, .04); break;
    case 'hurt': tone('sawtooth', 140, 60, .18, .1); break;
    case 'pick': tone('sine', 520, 1040, .12, .08); tone('sine', 780, 1560, .14, .06, .08); break;
    case 'shock': noise(.7, .35, 2400, 4); tone('sine', 200, 40, .7, .25); break;
    case 'enemy': tone('triangle', 600, 300, .12, .03); break;
    case 'wave': tone('square', 330, 330, .12, .05); tone('square', 495, 495, .18, .05, .14); break;
    case 'reload': tone('square', 300, 250, .05, .03); tone('square', 500, 450, .05, .03, .5); break;
    case 'jump': noise(.35, .12, 1400); break;
  }
}

// ---------- Drones (Orbs) ----------
const DT = {
  seeker: { name: 'SEEKER', col: 0x22e6ff, r: .55, hp: 1, speed: 9.5, pts: 100, look: 'scout' },
  mini: { name: 'MINI', col: 0x22e6ff, r: .36, hp: 1, speed: 11, pts: 50, look: 'scout' },
  shooter: { name: 'SHOOTER', col: 0xa64dff, r: .8, hp: 3, speed: 6.5, pts: 250, look: 'armored' },
  splitter: { name: 'SPLITTER', col: 0xffb21f, r: .95, hp: 4, speed: 5, pts: 300, look: 'armored' },
  pulse: { name: 'PULSE', col: 0x3dff8a, r: .95, hp: 5, speed: 5, pts: 350, look: 'heavy' },
  core: { name: 'CORE ORB', col: 0xff2a2a, r: 2.4, hp: 40, speed: 2.6, pts: 2500, look: 'heavy' },
};
const shellTex = canvasTex(512, 256, (g, w, h) => {
  drawWear(g, w, h, '#ddd3bc', .6);
  g.fillStyle = '#a8151a';
  for (let k = 0; k < 4; k++) { const x = w * (.125 + k * .25) + w * .05; g.fillRect(x, h * .08, w * .018, h * .36); g.fillRect(x, h * .56, w * .018, h * .36); }
  g.fillRect(0, h * .47, w, h * .012);
});
const innerTex = canvasTex(256, 128, (g, w, h) => {
  g.fillStyle = '#121215'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { const c = rand(20, 60) | 0; g.fillStyle = `rgb(${c},${c},${c + 4})`; g.fillRect(rand(0, w), rand(0, h), rand(3, 18), rand(2, 10)); }
  g.strokeStyle = '#3a3a40'; for (let y = 8; y < h; y += 12) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, { repeat: [3, 1] });
const DM = {
  shell: new THREE.MeshStandardMaterial({ map: shellTex, roughness: .55, metalness: .08, bumpMap: shellTex, bumpScale: .5, side: THREE.DoubleSide }),
  inner: new THREE.MeshStandardMaterial({ map: innerTex, roughness: .45, metalness: .85 }),
};
const eyeMats = {}; for (const k in DT) eyeMats[k] = new THREE.MeshStandardMaterial({ color: 0x000000, emissive: DT[k].col, emissiveIntensity: 4, toneMapped: false });
const DG = {
  plates: [], inner: new THREE.SphereGeometry(.84, 24, 16), band: new THREE.TorusGeometry(.88, .07, 8, 32),
  eyeRing: new THREE.CylinderGeometry(.42, .46, .3, 24), eyeLens: new THREE.SphereGeometry(.24, 18, 12), eyeRim: new THREE.TorusGeometry(.34, .04, 8, 24),
  cap: new THREE.SphereGeometry(.34, 16, 10, 0, TAU, 0, Math.PI / 2), capRing: new THREE.CylinderGeometry(.36, .36, .1, 18),
};
for (let half = 0; half < 2; half++) for (let k = 0; k < 4; k++) {
  const ps = k * Math.PI / 2 + .13, pl = Math.PI / 2 - .26;
  const ts = half ? Math.PI / 2 + .1 : .12, tl = Math.PI / 2 - .22;
  DG.plates.push(new THREE.SphereGeometry(1, 20, 10, ps, pl, ts, tl));
}
const projGeo = new THREE.SphereGeometry(.24, 12, 8);
function makeDroneMesh(type) {
  const t = DT[type], g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
  const mk = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; body.add(m); return m; };
  mk(DG.inner, DM.inner);
  mk(DG.band, M.rubber, 0, 0, 0, Math.PI / 2);
  const shell = new THREE.Group(); body.add(shell);
  for (const pg of DG.plates) { const m = new THREE.Mesh(pg, DM.shell); m.castShadow = true; shell.add(m); }
  const eyeScale = t.look === 'heavy' ? 1.25 : t.look === 'scout' ? .95 : .8;
  const eye = new THREE.Group(); eye.position.z = .9; eye.scale.setScalar(eyeScale); body.add(eye);
  const er = new THREE.Mesh(DG.eyeRing, M.metal); er.rotation.x = Math.PI / 2; eye.add(er);
  const lens = new THREE.Mesh(DG.eyeLens, eyeMats[type]); lens.position.z = .12; eye.add(lens);
  const rim = new THREE.Mesh(DG.eyeRim, M.cream); rim.position.z = .16; eye.add(rim);
  if (t.look !== 'scout') for (const s of [-1, 1]) { const c = mk(DG.cap, DM.shell, s * .93, 0, 0, 0, 0, -s * Math.PI / 2); c.scale.set(1, t.look === 'heavy' ? .7 : 1.1, 1); mk(DG.capRing, M.rubber, s * .9, 0, 0, 0, 0, Math.PI / 2); }
  else mk(DG.capRing, M.metal, -.9, 0, 0, 0, 0, Math.PI / 2);
  let shields = null;
  if (type === 'core') { shields = []; for (let i = 0; i < 2; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1.45 + i * .2, .035, 8, 64), glowMat(i ? 0xffffff : 0xff3030)); g.add(r); shields.push(r); } }
  if (type === 'pulse') { const r = new THREE.Mesh(new THREE.TorusGeometry(1.25, .03, 6, 48), glowMat(0x3dff8a)); r.rotation.x = Math.PI / 2; g.add(r); shields = [r]; }
  g.scale.setScalar(t.r);
  scene.add(g);
  return { g, body, shell, eye, lens, shields };
}
const drones = [];
const eproj = [];
let hpMul = 1, spdMul = 1, dmgMul = 1;
class Drone {
  constructor(type, pos) {
    this.type = type; this.t = DT[type]; this.mesh = makeDroneMesh(type); this.pos = this.mesh.g.position; this.pos.copy(pos);
    this.vel = new V3(); this.hp = Math.ceil(this.t.hp * (type === 'core' ? 1 + (G.wave / 5 - 1) * .5 : hpMul)); this.maxhp = this.hp; this.r = this.t.r;
    this.cool = rand(1.2, 2.8); this.ph = rand(0, TAU); this.dir = Math.random() < .5 ? -1 : 1; this.switchT = rand(2, 5);
    this.flash = 0; this.charge = 0; this.age = 0; this.alive = true; this.spawnCD = 3; this.alt = rand(3, 7);
    this.mesh.g.scale.setScalar(.01);
  }
}
function spawnDrone(type, pos) {
  const d = new Drone(type, pos || PORTALS[(Math.random() * PORTALS.length) | 0].pos);
  if (!pos) { const pt = PORTALS.reduce((a, b) => a.pos.distanceTo(d.pos) < b.pos.distanceTo(d.pos) ? a : b); ring(d.pos, d.t.col, 2.5, .5, false); }
  drones.push(d); return d;
}
function removeDrone(d) {
  d.alive = false; scene.remove(d.mesh.g);
  const i = drones.indexOf(d); if (i >= 0) drones.splice(i, 1);
}
const _v = new V3(), _w = new V3(), _tgt = new V3();
function droneFire(d, dir, speed, dmg, col) {
  const m = new THREE.Mesh(projGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(3), toneMapped: false }));
  m.position.copy(d.pos).addScaledVector(dir, d.r + .3); scene.add(m);
  eproj.push({ m, v: dir.clone().multiplyScalar(speed), dmg, col, life: 6 });
  sfx('enemy');
}
function updateDrones(dt) {
  const chest = _tgt.copy(P.pos); chest.y += 2.3;
  for (let i = drones.length - 1; i >= 0; i--) {
    const d = drones[i]; if (!d.alive) continue;
    d.age += dt; d.cool -= dt; d.switchT -= dt; d.flash = Math.max(0, d.flash - dt * 6);
    const sc = d.r * Math.min(1, d.age * 2.5) * (1 + d.flash * .15 + d.charge * .25);
    d.mesh.g.scale.setScalar(Math.max(.01, sc));
    _v.copy(chest).sub(d.pos); const dist = _v.length(); _v.multiplyScalar(1 / Math.max(dist, .001));
    const sp = d.t.speed * spdMul;
    const want = _w.set(0, 0, 0);
    const tang = new V3(-_v.z, 0, _v.x).normalize().multiplyScalar(d.dir);
    if (d.switchT <= 0) { d.dir *= -1; d.switchT = rand(2, 5); }
    const alive = P.alive && G.state === 'play';
    switch (d.type) {
      case 'seeker': case 'mini': {
        want.copy(_v).multiplyScalar(sp); want.addScaledVector(tang, Math.sin(d.age * 3 + d.ph) * sp * .35);
        want.y += Math.sin(d.age * 4 + d.ph) * 1.5;
        if (alive && dist < d.r + 1.2) { hurt(d.type === 'mini' ? 6 * dmgMul : 10 * dmgMul, d.pos); explode(d.pos, d.t.col, .6); sfx('boom'); removeDrone(d); continue; }
        break;
      }
      case 'shooter': case 'splitter': {
        const keep = d.type === 'shooter' ? 15 : 11;
        want.copy(_v).multiplyScalar(clamp((dist - keep) * .6, -sp, sp));
        want.addScaledVector(tang, sp * .8);
        want.y += (P.pos.y + d.alt - d.pos.y) * 1.2;
        if (alive && d.cool <= 0 && dist < 45) {
          if (d.type === 'shooter') { const lead = _w.clone(); const aim = chest.clone().addScaledVector(P.vel, dist / 16 * .5).sub(d.pos).normalize(); droneFire(d, aim, 15 * Math.min(1.5, spdMul), 8 * dmgMul, 0xc07bff); d.cool = rand(1.6, 2.6) / Math.min(1.6, spdMul); }
          else { for (let k = -1; k <= 1; k++) { const aim = chest.clone().sub(d.pos).normalize().applyAxisAngle(new V3(0, 1, 0), k * .16); droneFire(d, aim, 12, 6 * dmgMul, 0xffc04a); } d.cool = rand(2.8, 3.8) / Math.min(1.6, spdMul); }
        }
        break;
      }
      case 'pulse': {
        if (d.charge > 0) {
          d.charge += dt / 1.2; want.set(0, 0, 0);
          if (d.charge >= 1) {
            d.charge = 0; d.cool = 4.5;
            ring(new V3(d.pos.x, Math.max(.3, d.pos.y - 1), d.pos.z), 0x3dff8a, 8, .5, true); ring(d.pos, 0x3dff8a, 6, .4, false); sparks(d.pos, 0x3dff8a, 40, 12, .3, .4, 0); sfx('shock');
            if (alive && P.pos.distanceTo(d.pos) < 8.5) { hurt(22 * dmgMul, d.pos); _w.copy(P.pos).sub(d.pos).setY(0).normalize(); P.vel.addScaledVector(_w, 12); P.vel.y = 6; P.grounded = false; }
          }
        } else {
          want.copy(_v).multiplyScalar(clamp((dist - 5) * .7, -sp, sp)); want.addScaledVector(tang, sp * .3);
          want.y += (P.pos.y + 3.0 - d.pos.y) * 1.4;
          if (alive && d.cool <= 0 && dist < 8) d.charge = .001;
        }
        if (d.mesh.shields) { d.mesh.shields[0].scale.setScalar(1 + d.charge * 2.5); d.mesh.shields[0].rotation.z += dt * 3; }
        d.mesh.lens.scale.setScalar(1 + d.charge * .8);
        break;
      }
      case 'core': {
        _w.set(Math.cos(d.age * .25) * 14, 10 + Math.sin(d.age * .7) * 1.5, Math.sin(d.age * .25) * 14);
        want.copy(_w).sub(d.pos).multiplyScalar(.8);
        d.spawnCD -= dt;
        const rage = d.hp < d.maxhp * .5 ? 1.6 : 1;
        if (alive && d.spawnCD <= 0 && drones.length < 30) { d.spawnCD = 4.5 / rage; for (let k = 0; k < 2; k++) { const s = spawnDrone('seeker', d.pos.clone().add(new V3(rand(-2, 2), -2.5, rand(-2, 2)))); s.vel.set(rand(-6, 6), -4, rand(-6, 6)); } }
        if (alive && d.cool <= 0) {
          d.cool = 2.8 / rage;
          const n = 10; for (let k = 0; k < n; k++) { const a = k / n * TAU + d.age; const dir = new V3(Math.cos(a), -.25, Math.sin(a)).normalize(); droneFire(d, dir, 11, 7 * dmgMul, 0xff4040); }
          droneFire(d, chest.clone().sub(d.pos).normalize(), 16, 10 * dmgMul, 0xffffff);
        }
        d.mesh.shields[0].rotation.x += dt * 1.3; d.mesh.shields[0].rotation.y += dt * .7;
        d.mesh.shields[1].rotation.y -= dt * 1.1; d.mesh.shields[1].rotation.z += dt * .5;
        break;
      }
    }
    // separation
    for (const o of drones) { if (o === d) continue; _w.copy(d.pos).sub(o.pos); const l = _w.length(), m = d.r + o.r + .4; if (l < m && l > .001) want.addScaledVector(_w, (m - l) / l * 6); }
    const acc = d.type === 'seeker' || d.type === 'mini' ? 4 : 2.5;
    d.vel.lerp(want, 1 - Math.exp(-acc * dt));
    d.pos.addScaledVector(d.vel, dt);
    // world collision
    for (const b of BOXES) {
      const cx = clamp(d.pos.x, b.min.x, b.max.x), cy = clamp(d.pos.y, b.min.y, b.max.y), cz = clamp(d.pos.z, b.min.z, b.max.z);
      _w.set(d.pos.x - cx, d.pos.y - cy, d.pos.z - cz); const l = _w.length();
      if (l < d.r && l > 1e-5) d.pos.addScaledVector(_w, (d.r - l) / l); else if (l <= 1e-5) d.pos.y = b.max.y + d.r;
    }
    d.pos.x = clamp(d.pos.x, -HALF + d.r, HALF - d.r); d.pos.z = clamp(d.pos.z, -HALF + d.r, HALF - d.r); d.pos.y = clamp(d.pos.y, d.r + .3, 16);
    // orientation: eye faces player
    d.mesh.g.lookAt(chest);
    d.mesh.shell.rotation.z = Math.sin(d.age * (d.type === 'core' ? .6 : 1.6) + d.ph) * .22;
    d.mesh.body.position.y = Math.sin(d.age * 3 + d.ph) * .06;
    if (d.type === 'core') bossUI(d);
  }
  // enemy projectiles
  for (let i = eproj.length - 1; i >= 0; i--) {
    const p = eproj[i]; p.life -= dt; p.m.position.addScaledVector(p.v, dt);
    if (Math.random() < .6) { _c.set(p.col).multiplyScalar(1.6); emit(p.m.position, rand(-.4, .4), rand(-.4, .4), rand(-.4, .4), _c, .35, .25, 3, 0); }
    const pp = p.m.position; let dead = p.life <= 0 || pointBlocked(pp) || Math.abs(pp.x) > HALF || Math.abs(pp.z) > HALF;
    if (!dead && P.alive && G.state === 'play') {
      const yy = clamp(pp.y, P.pos.y + .6, P.pos.y + 3.6);
      if (Math.hypot(pp.x - P.pos.x, pp.y - yy, pp.z - P.pos.z) < 1.0) { hurt(p.dmg, pp); dead = true; }
    }
    if (dead) { sparks(pp, p.col, 10, 5, .25, .3, 3); scene.remove(p.m); p.m.material.dispose(); eproj.splice(i, 1); }
  }
}

// ---------- Game state ----------
const MAG = 36;
const SPAWN = new V3(0, 0, 34);
const P = { pos: SPAWN.clone(), vel: new V3(), yaw: 0, pitch: 0, hp: 100, shield: 50, shDelay: 0, ammo: MAG, reloadT: 0, fireT: 0, charging: false, charge: 0, chargeCD: 0, skillCD: 0, over: 0, grounded: true, boost: true, alive: true, hitT: 0, recoil: 0, walk: 0, aim: 0, aimHold: 0, dieT: 0 };
const G = { state: 'menu', mode: 'time', limit: 180, target: 50, time: 0, kills: 0, score: 0, wave: 0, combo: 0, comboT: 0, mult: 1, bestMult: 1, bestCombo: 0, shots: 0, hits: 0, queue: [], spawnT: 0, waveBreak: 0, view: S.view, shake: 0, camDist: 5, endT: 0 };
const pickups = [];
let T = 0;
function shake(a) { G.shake = Math.min(1, G.shake + a); }

function camFwd(out) { const cp = Math.cos(P.pitch); return out.set(-Math.sin(P.yaw) * cp, Math.sin(P.pitch), -Math.cos(P.yaw) * cp); }
const _f = new V3(), _r = new V3(), _m = new V3(), _hit = new V3();
function muzzlePos(out) { if (G.view === 'fps') { vm.updateMatrixWorld(true); vm.userData.muzzle.getWorldPosition(out); } else { mech.root.updateMatrixWorld(true); mech.muzzle.getWorldPosition(out); } return out; }

function fireShot() {
  const dir = camFwd(new V3());
  const moving = Math.hypot(P.vel.x, P.vel.z) > 1;
  const spr = (moving ? .014 : .005) + (P.grounded ? 0 : .01);
  dir.x += rand(-spr, spr); dir.y += rand(-spr, spr); dir.z += rand(-spr, spr); dir.normalize();
  const o = camera.position;
  const tMin = G.view === 'tps' ? G.camDist : .2;
  let best = rayWorld(o, dir, 160), hitD = null;
  const tol = IS_TOUCH ? .35 : .12;
  for (const d of drones) {
    _w.copy(d.pos).sub(o); const tc = _w.dot(dir); if (tc < tMin || tc > best) continue;
    const d2 = _w.lengthSq() - tc * tc, rr = d.r * Math.min(1, d.age * 2.5) + tol;
    if (d2 < rr * rr) { const th = tc - Math.sqrt(Math.max(0, rr * rr - d2)); if (th < best) { best = Math.max(th, tMin); hitD = d; } }
  }
  _hit.copy(o).addScaledVector(dir, best);
  muzzlePos(_m);
  tracer(_m, _hit, P.over > 0 ? 0xffc04a : 0xffd9a0);
  muzzleLight.position.copy(_m); muzzleLight.intensity = 60;
  _c.set(0xffc080).multiplyScalar(3); emit(_m, 0, 0, 0, _c, .7, .05, 0, 0);
  G.shots++; P.recoil = 1; P.aimHold = 2.2; sfx('shot');
  if (hitD) { G.hits++; damageDrone(hitD, 1, _hit); }
  else if (best < 160) sparks(_hit, 0xffc080, 5, 5, .18, .25, 8);
}
function damageDrone(d, dmg, at) {
  if (!d.alive) return;
  if (d.type === 'core' && d.age < 1.5) dmg *= .2;
  d.hp -= dmg; d.flash = 1;
  sparks(at || d.pos, d.t.col, 8, 6, .22, .3, 6); hitmark(false); sfx('hit');
  if (d.hp <= 0) killDrone(d, true);
}
function killDrone(d, byPlayer) {
  const big = d.type === 'core' ? 4 : d.type === 'mini' ? .5 : d.r;
  explode(d.pos.clone(), d.t.col, big); sfx(d.type === 'core' ? 'bigboom' : 'boom');
  const pos = d.pos.clone(); removeDrone(d);
  if (!byPlayer) return;
  G.kills++;
  G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 3;
  G.mult = Math.min(5, 1 + Math.floor((G.combo - 1) / 2)); G.bestMult = Math.max(G.bestMult, G.mult); G.bestCombo = Math.max(G.bestCombo, G.combo);
  const pts = d.t.pts * G.mult; G.score += pts; popup(`+${pts}${G.mult > 1 ? ' x' + G.mult : ''}`);
  hitmark(true);
  if (d.type === 'splitter') for (let k = 0; k < 3; k++) { const m = spawnDrone('mini', pos.clone().add(new V3(rand(-.6, .6), rand(0, .6), rand(-.6, .6)))); m.age = .4; m.vel.set(rand(-8, 8), rand(2, 6), rand(-8, 8)); }
  if (d.type === 'core') { banner('CORE ORB ZERSTÖRT', `+${pts}`); dropPickup('health', pos); dropPickup('over', pos.clone().add(new V3(2, 0, 0))); $('boss').classList.add('hidden'); }
  else { const r = Math.random(); if (r < (d.type === 'mini' ? .03 : .1)) dropPickup('health', pos); else if (r > (d.type === 'mini' ? .985 : .94)) dropPickup('over', pos); }
  if (G.mode === 'count' && G.kills >= G.target) endGame(true);
}
function fireCharged(power) {
  const dir = camFwd(new V3()); muzzlePos(_m);
  const aimT = Math.min(rayWorld(camera.position, dir, 160), 160);
  const target = camera.position.clone().addScaledVector(dir, aimT);
  const v = target.sub(_m).normalize().multiplyScalar(38);
  const m = new THREE.Mesh(new THREE.SphereGeometry(.22 + power * .3, 14, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff5040).multiplyScalar(4), toneMapped: false }));
  m.position.copy(_m); scene.add(m);
  pproj.push({ m, v, power, life: 3 });
  P.recoil = 2; P.aimHold = 2.2; shake(.15 + power * .2); sfx('charge'); G.shots++;
}
const pproj = [];
function updatePlayerProj(dt) {
  for (let i = pproj.length - 1; i >= 0; i--) {
    const p = pproj[i]; p.life -= dt; const steps = 3; let boom = p.life <= 0;
    for (let s = 0; s < steps && !boom; s++) {
      p.m.position.addScaledVector(p.v, dt / steps);
      if (pointBlocked(p.m.position)) boom = true;
      for (const d of drones) if (d.pos.distanceTo(p.m.position) < d.r + .3 + p.power * .3) { boom = true; break; }
    }
    _c.set(0xff5040).multiplyScalar(2); emit(p.m.position, rand(-1, 1), rand(-1, 1), rand(-1, 1), _c, .5 + p.power * .4, .3, 3, 0);
    if (boom) {
      const R = 2 + p.power * 3.5, dmg = 2 + p.power * 6; let hit = false;
      for (const d of [...drones]) { const dd = d.pos.distanceTo(p.m.position) - d.r; if (dd < R) { hit = true; damageDrone(d, dmg * (dd < 1 ? 1 : .6)); } }
      if (hit) G.hits++;
      explode(p.m.position.clone(), 0xff5040, .8 + p.power); sfx('boom');
      scene.remove(p.m); p.m.geometry.dispose(); p.m.material.dispose(); pproj.splice(i, 1);
    }
  }
}
function shockwave() {
  if (G.state !== 'play' || P.skillCD > 0 || !P.alive) return;
  P.skillCD = 10; sfx('shock'); shake(.4);
  const c = P.pos.clone(); c.y += 1;
  ring(c, 0x38dcff, 9, .5, true); ring(c.clone().setY(c.y + 1), 0xffffff, 7, .35, true); sparks(c, 0x38dcff, 80, 18, .3, .5, 0);
  for (const d of [...drones]) { _w.copy(d.pos).sub(c); const l = _w.length(); if (l < 9 + d.r) { d.vel.addScaledVector(_w.normalize(), 16); damageDrone(d, 3); } }
  for (let i = eproj.length - 1; i >= 0; i--) if (eproj[i].m.position.distanceTo(c) < 9) { scene.remove(eproj[i].m); eproj.splice(i, 1); }
}
function reload() { if (P.reloadT > 0 || P.ammo >= MAG || G.state !== 'play') return; P.reloadT = 1.3; sfx('reload'); }
function hurt(dmg, from) {
  if (!P.alive || G.state !== 'play') return;
  if (G.godmode) return;
  P.shDelay = 3.5; P.hitT = .35;
  const s = Math.min(P.shield, dmg); P.shield -= s; dmg -= s; P.hp -= dmg;
  $('vig').style.opacity = clamp(.35 + dmg / 30, .3, .9); shake(.2); sfx('hurt');
  if (P.hp <= 0) { P.hp = 0; P.alive = false; P.dieT = 2.2; G.state = 'dying'; banner('UNIT 33-3 OFFLINE', 'SIGNAL VERLOREN', 2.2); explode(P.pos.clone().setY(P.pos.y + 2.2), 0xff3030, 1.5); }
}
const PK = { health: { col: 0x3dff8a }, over: { col: 0xffb21f } };
function dropPickup(type, pos) {
  const g = new THREE.Group(); g.position.copy(pos);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(.42, 0), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: PK[type].col, emissiveIntensity: 3, toneMapped: false })); g.add(core);
  const r = new THREE.Mesh(new THREE.TorusGeometry(.7, .04, 6, 28), glowMat(PK[type].col)); r.rotation.x = Math.PI / 2; g.add(r);
  if (type === 'health') { const c1 = new THREE.Mesh(new THREE.BoxGeometry(.5, .14, .14), glowMat(0xffffff)); const c2 = c1.clone(); c2.rotation.z = Math.PI / 2; c1.position.y = c2.position.y = 1; g.add(c1, c2); }
  scene.add(g); pickups.push({ type, g, t: 16, vy: 0, base: groundAt(pos.x, pos.z, pos.y) + 1 });
}
function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i]; p.t -= dt; const g = p.g;
    if (g.position.y > p.base) { p.vy -= 18 * dt; g.position.y = Math.max(p.base, g.position.y + p.vy * dt); }
    else g.position.y = p.base + Math.sin(T * 3 + i) * .15;
    g.rotation.y += dt * 2; g.visible = p.t > 3 || Math.sin(T * 20) > 0;
    const dx = g.position.x - P.pos.x, dz = g.position.z - P.pos.z;
    if (P.alive && G.state === 'play' && dx * dx + dz * dz < 3.2 && Math.abs(g.position.y - P.pos.y - 1) < 2.6) {
      if (p.type === 'health') { P.hp = Math.min(100, P.hp + 35); toast('+35 HP'); } else { P.over = 8; toast('OVERCHARGE · DOPPELTE FEUERRATE'); }
      sparks(g.position, PK[p.type].col, 30, 6, .3, .5, 0); sfx('pick'); p.t = 0;
    }
    if (p.t <= 0) { scene.remove(g); pickups.splice(i, 1); }
  }
}

// ---------- Waves ----------
function startWave(n) {
  G.wave = n; hpMul = 1 + (n - 1) * .08; spdMul = Math.min(1.8, 1 + (n - 1) * .055); dmgMul = Math.min(2, 1 + (n - 1) * .06);
  const q = [];
  const boss = n % 5 === 0;
  const seek = 3 + Math.round(n * 1.4) - (boss ? 2 : 0);
  for (let i = 0; i < seek; i++) q.push('seeker');
  for (let i = 0; i < Math.floor(n * .7); i++) q.push('shooter');
  for (let i = 0; i < Math.max(0, Math.floor((n - 1) / 2)); i++) q.push('splitter');
  for (let i = 0; i < Math.max(0, Math.floor((n - 2) / 2)); i++) q.push('pulse');
  for (let i = q.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [q[i], q[j]] = [q[j], q[i]]; }
  if (boss) q.unshift('core');
  G.queue = q; G.spawnT = .8;
  if (boss) { banner('CORE ORB DETECTED', `WAVE ${String(n).padStart(2, '0')} // BOSS`, 2.6); shake(.3); }
  else banner(`WAVE ${String(n).padStart(2, '0')} // ORBS INCOMING`, `${q.length} ORBS`, 2.2);
  sfx('wave');
}
function updateWaves(dt) {
  if (G.waveBreak > 0) { G.waveBreak -= dt; if (G.waveBreak <= 0) startWave(G.wave + 1); return; }
  G.spawnT -= dt;
  const maxAlive = 10 + G.wave * 2;
  if (G.queue.length && G.spawnT <= 0 && drones.length < maxAlive) { spawnDrone(G.queue.shift()); G.spawnT = Math.max(.25, .95 - G.wave * .05); }
  if (!G.queue.length && !drones.length) { G.waveBreak = 2.2; P.shield = Math.min(50, P.shield + 25); }
}

// ---------- Player ----------
const keys = {};
const inp = { fire: false, sx: 0, sy: 0, jumpQ: false };
function updatePlayer(dt) {
  if (!P.alive) return;
  let fwd = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - inp.sy;
  let str = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + inp.sx;
  const mag = Math.hypot(fwd, str); if (mag > 1) { fwd /= mag; str /= mag; }
  const sprint = (keys.ShiftLeft || keys.ShiftRight || Math.hypot(inp.sx, inp.sy) > .95) && fwd > .3 && !P.charging;
  const spd = sprint ? 10.5 : 6.5;
  _f.set(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); _r.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  const wx = (_f.x * fwd + _r.x * str) * spd, wz = (_f.z * fwd + _r.z * str) * spd;
  const k = 1 - Math.exp(-(P.grounded ? 9 : 2.5) * dt);
  P.vel.x += (wx - P.vel.x) * k; P.vel.z += (wz - P.vel.z) * k;
  if (inp.jumpQ) {
    if (P.grounded) { P.vel.y = 9.5; P.grounded = false; P.boost = true; sfx('jump'); }
    else if (P.boost) { P.vel.y = 8; P.boost = false; sfx('jump'); for (let i = 0; i < 26; i++) { mech.jet.getWorldPosition(_m); _c.set(0x38dcff).multiplyScalar(3); emit(_m, rand(-1, 1), rand(-9, -4), rand(-1, 1), _c, .45, .4, 2, 0); } }
  }
  inp.jumpQ = false;
  P.vel.y -= 24 * dt;
  const wasG = P.grounded;
  P.pos.addScaledVector(P.vel, dt);
  pushOut(P.pos, .75, P.pos.y, P.pos.y + 3.6);
  const g = groundAt(P.pos.x, P.pos.z, P.pos.y);
  if (P.pos.y <= g || (wasG && P.vel.y <= 0 && P.pos.y - g < .45)) { if (!wasG && P.vel.y < -12) { shake(.15); sparks(P.pos, 0xd9cdb0, 14, 4, .3, .4, 4); } P.pos.y = g; P.vel.y = Math.max(0, P.vel.y); P.grounded = true; P.boost = true; }
  else P.grounded = false;
  // weapons
  P.fireT -= dt; P.chargeCD -= dt; P.skillCD = Math.max(0, P.skillCD - dt); P.over = Math.max(0, P.over - dt); P.aimHold -= dt;
  if (P.reloadT > 0) { P.reloadT -= dt; if (P.reloadT <= 0) P.ammo = MAG; }
  if (P.charging) { P.charge = Math.min(1, P.charge + dt / 1.1); P.aimHold = 2.2; }
  if (inp.fire && P.reloadT <= 0 && !P.charging) {
    if (P.fireT < -.1) P.fireT = 0;
    let n = 0;
    while (P.fireT <= 0 && n++ < 4) { if (P.ammo <= 0) { reload(); break; } fireShot(); P.ammo--; P.fireT += 1 / (P.over > 0 ? 18 : 9); }
  } else P.fireT = Math.max(P.fireT, 0);
  // shield regen
  P.shDelay -= dt; if (P.shDelay <= 0) P.shield = Math.min(50, P.shield + 14 * dt);
  P.hitT = Math.max(0, P.hitT - dt);
}
function startCharge() { if (G.state === 'play' && P.alive && P.chargeCD <= 0 && P.reloadT <= 0) { P.charging = true; P.charge = 0; } }
function releaseCharge() { if (!P.charging) return; P.charging = false; P.chargeCD = .7; fireCharged(Math.max(.15, P.charge)); P.charge = 0; }

// ---------- Mech animation ----------
function animMech(dt) {
  const sp = Math.hypot(P.vel.x, P.vel.z);
  const A = clamp(sp / 6.5, 0, 1.3), run = clamp((sp - 6.5) / 4, 0, 1);
  P.walk += dt * sp * 1.15;
  const air = !P.grounded && P.alive;
  const L = mech.legs, AR = mech.arms;
  for (const [s, leg] of [[1, L.L], [-1, L.R]]) {
    const ph = P.walk + (s > 0 ? 0 : Math.PI);
    const tH = air ? -.6 + s * .15 : -Math.sin(ph) * .55 * A;
    const tK = air ? .9 : Math.max(0, Math.cos(ph)) * .95 * A + .05;
    leg.hip.rotation.x = lerp(leg.hip.rotation.x, tH, 1 - Math.exp(-14 * dt));
    leg.knee.rotation.x = lerp(leg.knee.rotation.x, tK, 1 - Math.exp(-14 * dt));
    leg.ankle.rotation.x = -(leg.hip.rotation.x + leg.knee.rotation.x) * .85;
    leg.hip.rotation.z = s * .04;
  }
  mech.body.position.y = -Math.abs(Math.sin(P.walk)) * .09 * A + (air ? -.1 : 0) - (P.alive ? 0 : 0);
  mech.body.rotation.z = Math.sin(P.walk) * .03 * A;
  P.recoil = Math.max(0, P.recoil - dt * 9);
  mech.torso.rotation.x = .1 * run + .03 * A - P.recoil * .03;
  mech.torso.rotation.y = Math.sin(P.walk) * .06 * A;
  mech.torso.rotation.z = Math.sin(T * 48) * .09 * P.hitT;
  mech.head.rotation.x = clamp(-P.pitch * .5, -.4, .35);
  const aimT = (P.aimHold > 0 || inp.fire || P.charging) && P.alive && G.state !== 'menu' ? 1 : 0;
  P.aim = lerp(P.aim, aimT, 1 - Math.exp(-12 * dt));
  const swing = Math.sin(P.walk) * .45 * A;
  // gun arm (R)
  AR.R.ua.rotation.x = lerp(swing + .05, -Math.PI / 2 - P.pitch - P.recoil * .06, P.aim);
  AR.R.ua.rotation.z = lerp(-.12, -.05, P.aim);
  AR.R.ua.rotation.y = lerp(0, -.12, P.aim);
  AR.R.fa.rotation.x = lerp(-.25, 0, P.aim) - P.recoil * .1;
  // support arm (L)
  AR.L.ua.rotation.x = lerp(-swing + .05, -.55 - P.pitch * .5, P.aim * .8);
  AR.L.ua.rotation.z = lerp(.12, .35, P.aim * .8);
  AR.L.fa.rotation.x = lerp(-.25, -1.25, P.aim * .8);
  M.cream.emissive.setRGB(P.hitT * 1.2, P.hitT * .1, 0);
  // death
  if (!P.alive) { mech.body.rotation.x = lerp(mech.body.rotation.x, -1.35, 1 - Math.exp(-3 * dt)); mech.body.position.y = lerp(mech.body.position.y, -.2, .05); }
  else mech.body.rotation.x = 0;
  mech.root.position.copy(P.pos);
  mech.root.rotation.y = P.yaw + Math.PI;
}

// ---------- Camera ----------
function updateCamera(dt) {
  if (G.state === 'menu') {
    const a = T * .22;
    camera.position.set(P.pos.x + Math.sin(a) * 7.6 - 1, 2.6 + Math.sin(T * .3) * .4, P.pos.z + Math.cos(a) * 7.6);
    camera.lookAt(P.pos.x - .6, 2.2, P.pos.z);
    mech.root.visible = true; vm.visible = false; return;
  }
  camFwd(_f); _r.set(Math.cos(P.yaw), 0, -Math.sin(P.yaw));
  if (G.view === 'fps' && P.alive) {
    mech.root.visible = false; vm.visible = true;
    camera.position.set(P.pos.x, P.pos.y + 3.5 + mech.body.position.y * .6, P.pos.z).addScaledVector(_r, 0).add(_m.set(-Math.sin(P.yaw) * .4, 0, -Math.cos(P.yaw) * .4));
    const sp = Math.hypot(P.vel.x, P.vel.z) / 6.5;
    vm.position.set(.3 + Math.sin(P.walk) * .012 * sp, -.3 + Math.abs(Math.cos(P.walk)) * .01 * sp, -.78 + P.recoil * .03);
    vm.rotation.set(P.recoil * .04, 0, 0);
    G.camDist = 0;
  } else {
    mech.root.visible = true; vm.visible = false;
    const piv = _m.set(P.pos.x, P.pos.y + 3.2, P.pos.z);
    const want = piv.clone().addScaledVector(_f, camera.aspect < 1 ? -8.2 : -7.4).addScaledVector(_r, camera.aspect < 1 ? 1.25 : 2.7); want.y += .55;
    const dir = want.clone().sub(piv); let len = dir.length(); dir.multiplyScalar(1 / len);
    const t = rayWorld(piv, dir, len + .3); if (t < len + .3) len = Math.max(.6, t - .35);
    camera.position.copy(piv).addScaledVector(dir, len);
    G.camDist = Math.max(0, piv.clone().sub(camera.position).dot(_f)) + .6;
  }
  if (G.shake > 0) { camera.position.x += rand(-1, 1) * G.shake * .25; camera.position.y += rand(-1, 1) * G.shake * .25; G.shake = Math.max(0, G.shake - dt * 2.5); }
  camera.lookAt(_hit.copy(camera.position).add(camFwd(_f)));
}

// ---------- HUD ----------
const H = {}; for (const id of ['kills', 'time', 'timel', 'wave', 'mult', 'combobar', 'score', 'hpbar', 'shbar', 'hpv', 'ammo', 'reload', 'skillv', 'over', 'chargebar', 'charge', 'bosshp', 'boss', 'banner', 'bt', 'bs', 'toast', 'hitm', 'vig', 'popups', 'hint']) H[id] = $(id);
const hudCache = {};
function setT(id, v) { if (hudCache[id] !== v) { hudCache[id] = v; H[id].textContent = v; } }
function setW(id, v) { const s = (v * 100).toFixed(1) + '%'; if (hudCache[id] !== s) { hudCache[id] = s; H[id].style.width = s; } }
const fmtT = s => { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
function updateHUD() {
  setT('kills', String(G.kills).padStart(3, '0') + (G.mode === 'count' ? `/${G.target}` : ''));
  setT('timel', G.mode === 'time' ? 'TIME' : 'ZEIT');
  setT('time', G.mode === 'time' ? fmtT(G.limit - G.time) : fmtT(G.time));
  setT('wave', String(G.wave).padStart(2, '0'));
  setT('mult', 'x' + G.mult); setW('combobar', G.comboT / 3);
  setT('score', 'SCORE ' + G.score.toLocaleString('de-DE'));
  setW('hpbar', P.hp / 100); setW('shbar', P.shield / 50);
  setT('hpv', `${Math.ceil(P.hp)} HP · ${Math.floor(P.shield)} SCHILD`);
  const a = `${P.ammo}`; if (hudCache.ammo !== a) { hudCache.ammo = a; H.ammo.innerHTML = `${P.ammo}<small>/${MAG}</small>`; H.ammo.classList.toggle('low', P.ammo <= 8); }
  H.reload.classList.toggle('on', P.reloadT > 0);
  setT('skillv', P.skillCD > 0 ? P.skillCD.toFixed(1) + ' s' : 'BEREIT');
  H.over.classList.toggle('hidden', P.over <= 0);
  H.charge.classList.toggle('on', P.charging); setW('chargebar', P.charge);
  const vo = parseFloat(H.vig.style.opacity || 0); if (vo > 0) H.vig.style.opacity = Math.max(0, vo - .03);
  if (G.state === 'play' && P.hp < 30) H.vig.style.opacity = Math.max(vo, .25 + Math.sin(T * 6) * .1);
}
function bossUI(d) { H.boss.classList.remove('hidden'); H.bosshp.style.width = (d.hp / d.maxhp * 100) + '%'; }
let bannerTO, toastTO, hitTO;
function banner(t, s = '', dur = 2.2) { H.bt.textContent = t; H.bs.textContent = s; H.banner.classList.add('on'); clearTimeout(bannerTO); bannerTO = setTimeout(() => H.banner.classList.remove('on'), dur * 1000); }
function toast(t) { H.toast.textContent = t; H.toast.classList.add('on'); clearTimeout(toastTO); toastTO = setTimeout(() => H.toast.classList.remove('on'), 1600); }
function hitmark(kill) { H.hitm.classList.add('on'); H.hitm.classList.toggle('kill', kill); clearTimeout(hitTO); hitTO = setTimeout(() => H.hitm.classList.remove('on'), kill ? 220 : 90); }
function popup(t) { const e = document.createElement('div'); e.className = 'pop'; e.textContent = t; H.popups.appendChild(e); setTimeout(() => e.remove(), 900); }

// ---------- Flow ----------
const show = (id, on) => $(id).classList.toggle('hidden', !on);
const hsKey = () => `orbfall.hs.${G.mode}${G.mode === 'time' ? G.limit : G.target}`;
function readHS(mode = S.mode, val = S.val) { try { return JSON.parse(localStorage.getItem(`orbfall.hs.${mode}${val}`)) || { score: 0, kills: 0 }; } catch (e) { return { score: 0, kills: 0 }; } }
function clearWorld() {
  for (const d of [...drones]) removeDrone(d);
  for (const p of eproj) scene.remove(p.m); eproj.length = 0;
  for (const p of pproj) scene.remove(p.m); pproj.length = 0;
  for (const p of pickups) scene.remove(p.g); pickups.length = 0;
}
function resetPlayer() {
  Object.assign(P, { hp: 100, shield: 50, shDelay: 0, ammo: MAG, reloadT: 0, fireT: 0, charging: false, charge: 0, chargeCD: 0, skillCD: 0, over: 0, grounded: true, boost: true, alive: true, hitT: 0, recoil: 0, aim: 0, aimHold: 0, yaw: 0, pitch: -.05 });
  P.pos.copy(SPAWN); P.vel.set(0, 0, 0); mech.body.rotation.x = 0;
}
function startGame() {
  audio(); clearWorld(); resetPlayer();
  Object.assign(G, { mode: S.mode, limit: S.mode === 'time' ? S.val : 0, target: S.mode === 'count' ? S.val : 0, time: 0, kills: 0, score: 0, wave: 0, combo: 0, comboT: 0, mult: 1, bestMult: 1, bestCombo: 0, shots: 0, hits: 0, queue: [], waveBreak: 0, state: 'play', view: S.view });
  show('menu', false); show('end', false); show('pause', false); show('hud', true); show('touch', IS_TOUCH);
  $('bv').textContent = G.view === 'tps' ? 'EGO' : '3RD';
  H.boss.classList.add('hidden');
  startWave(1);
  lockPointer();
  fpsAcc = 0; fpsN = 0; fpsGrace = 3;
}
function endGame(win) {
  if (G.state === 'end') return;
  G.state = 'end'; inp.fire = false; P.charging = false;
  if (document.pointerLockElement) document.exitPointerLock();
  const acc = G.shots ? Math.round(G.hits / G.shots * 100) : 0;
  $('endt').textContent = win ? 'COUNT COMPLETE' : 'UNIT 33-3 OFFLINE';
  $('endt').style.color = win ? '' : '#ff4a4a';
  $('e_k').textContent = G.kills; $('e_s').textContent = G.score.toLocaleString('de-DE'); $('e_a').textContent = acc + '%';
  $('e_c').textContent = 'x' + G.bestMult + ' · ' + G.bestCombo + 'er'; $('e_w').textContent = G.wave; $('e_t').textContent = fmtT(G.time);
  const hs = readHS(G.mode, G.mode === 'time' ? G.limit : G.target);
  const isNew = G.score > hs.score;
  if (isNew) localStorage.setItem(hsKey(), JSON.stringify({ score: G.score, kills: G.kills, acc, wave: G.wave, date: Date.now() }));
  $('e_hs').innerHTML = isNew ? `<span class="newhs">NEUER HIGHSCORE ${G.score.toLocaleString('de-DE')}</span>` : `HIGHSCORE ${hs.score.toLocaleString('de-DE')} · ${hs.kills} KILLS`;
  show('hud', false); show('touch', false); show('end', true);
  menuHS();
}
function toMenu() {
  clearWorld(); resetPlayer(); G.state = 'menu'; G.kills = 0;
  show('end', false); show('pause', false); show('hud', false); show('touch', false); show('menu', true);
  if (document.pointerLockElement) document.exitPointerLock();
  menuHS();
}
function pause() { if (G.state !== 'play') return; G.state = 'pause'; inp.fire = false; P.charging = false; P.charge = 0; show("pause", true); }
function resume() { if (G.state !== 'pause') return; G.state = 'play'; show('pause', false); lockPointer(); last = performance.now(); }
function toggleView() { G.view = G.view === 'tps' ? 'fps' : 'tps'; S.view = G.view; saveS(); $('bv').textContent = G.view === 'tps' ? 'EGO' : '3RD'; toast(G.view === 'tps' ? 'THIRD PERSON' : 'EGO-ANSICHT'); syncSeg(); }
let hadLock = false;
function lockPointer() { if (IS_TOUCH || manual) return; try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) { } }

// ---------- Input ----------
addEventListener('keydown', e => {
  keys[e.code] = true;
  if (G.state === 'play') {
    if (e.code === 'Space') { inp.jumpQ = true; e.preventDefault(); }
    if (e.code === 'KeyR') reload();
    if (e.code === 'KeyV') toggleView();
    if (e.code === 'KeyQ') shockwave();
    if (e.code === 'KeyP' || e.code === 'Escape') pause();
  } else if (G.state === 'pause' && (e.code === 'KeyP' || e.code === 'Enter')) resume();
  else if (G.state === 'menu' && e.code === 'Enter') startGame();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; inp.fire = false; });
canvas.addEventListener('mousedown', e => {
  audio();
  if (G.state !== 'play' || IS_TOUCH) return;
  if (document.pointerLockElement !== canvas) { lockPointer(); return; }
  if (e.button === 0) inp.fire = true;
  if (e.button === 2) startCharge();
});
addEventListener('mouseup', e => { if (e.button === 0) inp.fire = false; if (e.button === 2) releaseCharge(); });
addEventListener('mousemove', e => {
  if (document.pointerLockElement === canvas && G.state === 'play') {
    const k = .0022 * S.sens;
    P.yaw -= e.movementX * k; P.pitch = clamp(P.pitch - e.movementY * k * (S.invert ? -1 : 1), -1.15, 1.1);
  }
});
canvas.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('pointerlockchange', () => {
  const on = document.pointerLockElement === canvas;
  if (on) hadLock = true; else { inp.fire = false; if (G.state === 'play' && hadLock) pause(); }
  H.hint.classList.toggle('hidden', on || IS_TOUCH);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
// touch
{
  const zl = $('tzl'), zr = $('tzr'), base = $('sbase'), knob = $('sknob');
  let sid = null, so = null, lid = null, ll = null;
  const look = (dx, dy) => { const k = .0052 * S.sens; P.yaw -= dx * k; P.pitch = clamp(P.pitch - dy * k * (S.invert ? -1 : 1), -1.15, 1.1); };
  zl.addEventListener('pointerdown', e => { e.preventDefault(); audio(); sid = e.pointerId; so = { x: e.clientX, y: e.clientY }; base.style.left = e.clientX + 'px'; base.style.top = e.clientY + 'px'; zl.setPointerCapture(e.pointerId); });
  zl.addEventListener('pointermove', e => { if (e.pointerId !== sid) return; let dx = e.clientX - so.x, dy = e.clientY - so.y; const l = Math.hypot(dx, dy), m = 56; if (l > m) { dx *= m / l; dy *= m / l; } inp.sx = dx / m; inp.sy = dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`; });
  const sEnd = e => { if (e.pointerId !== sid) return; sid = null; inp.sx = inp.sy = 0; knob.style.transform = ''; base.style.left = ''; base.style.top = ''; };
  zl.addEventListener('pointerup', sEnd); zl.addEventListener('pointercancel', sEnd);
  zr.addEventListener('pointerdown', e => { e.preventDefault(); audio(); lid = e.pointerId; ll = { x: e.clientX, y: e.clientY }; zr.setPointerCapture(e.pointerId); });
  zr.addEventListener('pointermove', e => { if (e.pointerId !== lid) return; look(e.clientX - ll.x, e.clientY - ll.y); ll = { x: e.clientX, y: e.clientY }; });
  const lEnd = e => { if (e.pointerId === lid) lid = null; };
  zr.addEventListener('pointerup', lEnd); zr.addEventListener('pointercancel', lEnd);
  const btn = (id, down, up, aim) => {
    const el = $(id); let pid = null, pl = null;
    el.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); audio(); pid = e.pointerId; pl = { x: e.clientX, y: e.clientY }; el.classList.add('on'); el.setPointerCapture(e.pointerId); down && down(); });
    el.addEventListener('pointermove', e => { if (aim && e.pointerId === pid) { look(e.clientX - pl.x, e.clientY - pl.y); pl = { x: e.clientX, y: e.clientY }; } });
    const end = e => { if (e.pointerId !== pid) return; pid = null; el.classList.remove('on'); up && up(); };
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  };
  btn('bf', () => inp.fire = true, () => inp.fire = false, true);
  btn('bj', () => inp.jumpQ = true);
  btn('bc', startCharge, releaseCharge, true);
  btn('bq', shockwave);
  btn('brl', reload);
  btn('bv', toggleView);
  btn('bp', pause);
  document.addEventListener('gesturestart', e => e.preventDefault());
}
// menu UI
function syncSeg() {
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.m === S.mode && +b.dataset.v === S.val));
  document.querySelectorAll('#qsel button').forEach(b => b.classList.toggle('on', b.dataset.q === String(S.q)));
  document.querySelectorAll('#vsel button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  document.querySelectorAll('#ssel button').forEach(b => b.classList.toggle('on', +b.dataset.s === S.sound));
  document.querySelectorAll('#isel button').forEach(b => b.classList.toggle('on', +b.dataset.i === S.invert));
  $('sens').value = S.sens;
}
function menuHS() { const h = readHS(); $('menuhs').textContent = h.score ? `HIGHSCORE ${h.score.toLocaleString('de-DE')} · ${h.kills} KILLS` : 'HIGHSCORE NOCH OFFEN'; }
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { S.mode = b.dataset.m; S.val = +b.dataset.v; saveS(); syncSeg(); menuHS(); });
document.querySelectorAll('#qsel button').forEach(b => b.onclick = () => { S.q = b.dataset.q; saveS(); syncSeg(); setTier(S.q === 'auto' ? autoStart() : +S.q); });
document.querySelectorAll('#vsel button').forEach(b => b.onclick = () => { S.view = b.dataset.v; G.view = S.view; saveS(); syncSeg(); });
document.querySelectorAll('#ssel button').forEach(b => b.onclick = () => { S.sound = +b.dataset.s; saveS(); syncSeg(); });
document.querySelectorAll('#isel button').forEach(b => b.onclick = () => { S.invert = +b.dataset.i; saveS(); syncSeg(); });
$('sens').oninput = e => { S.sens = +e.target.value; saveS(); };
$('startbtn').onclick = startGame;
$('setbtn').onclick = () => $('settings').classList.toggle('hidden');
$('resbtn').onclick = resume; $('pmenubtn').onclick = toMenu; $('pviewbtn').onclick = () => { toggleView(); };
$('retrybtn').onclick = startGame; $('emenubtn').onclick = toMenu;
$('ctrlhelp').innerHTML = IS_TOUCH
  ? '<b>Links</b> Stick laufen (ganz drücken = Sprint) · <b>Rechts</b> wischen zum Zielen · <b>FEUER</b> halten und ziehen · <b>LADUNG</b> halten = Ladeschuss · <b>SCHOCK</b> Schockwelle · <b>SPRUNG</b> 2x = Booster'
  : '<b>WASD</b> laufen · <b>Shift</b> Sprint · <b>Maus</b> zielen · <b>Linksklick</b> Arm-Kanone · <b>Rechtsklick</b> halten = Ladeschuss · <b>Q</b> Schockwelle · <b>Space</b> Sprung, 2x Booster · <b>R</b> nachladen · <b>V</b> Ego / Third Person · <b>Esc</b> Pause';

// ---------- Quality ----------
function autoStart() { return 1; }
function setTier(i) {
  tier = clamp(i, 0, 3); const t = TIERS[tier];
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, t.pr));
  const sh = t.shadow > 0;
  if (renderer.shadowMap.enabled !== sh) { renderer.shadowMap.enabled = sh; scene.traverse(o => { if (o.material) [].concat(o.material).forEach(m => m.needsUpdate = true); }); }
  sun.castShadow = sh;
  if (sh && sun.shadow.mapSize.x !== t.shadow) { sun.shadow.mapSize.set(t.shadow, t.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  resize();
}
let fpsAcc = 0, fpsN = 0, fpsGrace = 3;
function fpsMonitor(dt) {
  if (S.q !== 'auto' || G.state !== 'play' || manual) return;
  if (fpsGrace > 0) { fpsGrace -= dt; return; }
  fpsAcc += dt; fpsN++;
  if (fpsAcc >= 3) { const fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; if (fps < 42 && tier < 3) { setTier(tier + 1); toast(`QUALITÄT: ${TIERS[tier].name} (${Math.round(fps)} FPS)`); fpsGrace = 2; } }
}
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(w, h);
  camera.aspect = w / h; camera.fov = w / h < 1 ? 82 : 70; camera.updateProjectionMatrix();
  pMat.uniforms.uK.value = h * renderer.getPixelRatio() / (2 * Math.tan(camera.fov * Math.PI / 360));
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 200));

// ---------- Loop ----------
let last = performance.now(), manual = false, camOverride = false;
function update(dt) {
  T += dt;
  if (G.state === 'play') {
    G.time += dt;
    G.comboT = Math.max(0, G.comboT - dt); if (G.comboT <= 0) { G.combo = 0; G.mult = 1; }
    updatePlayer(dt); updateWaves(dt); updateDrones(dt); updatePlayerProj(dt); updatePickups(dt);
    if (G.mode === 'time' && G.time >= G.limit) endGame(true);
  } else if (G.state === 'dying') {
    P.dieT -= dt; P.vel.multiplyScalar(.9); updateDrones(dt); if (P.dieT <= 0) endGame(false);
  }
  if (G.state !== 'pause') {
    animMech(dt);
    for (let i = 0; i < coreRings.length; i++) { coreRings[i].rotation.x = Math.PI / 2 + Math.sin(T * .7 + i) * .25; coreRings[i].rotation.y += dt * (i % 2 ? -.6 : .4); }
    coreMat.emissiveIntensity = 2 + Math.sin(T * 2) * .6;
    floorMat.emissiveIntensity = 1.2 + Math.sin(T * 1.3) * .25;
    for (const p of PORTALS) p.ring.rotation.z += dt;
    updateFX(dt);
  }
  if (!camOverride) updateCamera(dt);
  if (G.state === 'play' || G.state === 'dying') updateHUD();
}
function render() {
  if (TIERS[tier].bloom) composer.render(); else renderer.render(scene, camera);
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = clamp((now - last) / 1000, 0, .05); last = now;
  if (dt <= 0) return;
  if (manual) return;
  update(dt); render(); fpsMonitor(dt);
}

// ---------- Boot ----------
syncSeg(); menuHS();
setTier(S.q === 'auto' ? autoStart() : +S.q);
let READY = false;
try { renderer.compile(scene, camera); } catch (e) { }
update(1 / 60); render();
READY = true;
$('load').classList.add('hidden'); show('menu', true);
requestAnimationFrame(frame);

// test / debug hooks
window.__OF = {
  get ready() { return READY; }, G, P, get drones() { return drones; }, S, TIERS, get tier() { return tier; },
  setManual(v) { manual = v; }, step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) update(dt); render(); },
  start(mode = 'time', val = 180) { S.mode = mode; S.val = val; startGame(); },
  aim(yaw, pitch) { P.yaw = yaw; P.pitch = pitch; },
  aimAt(i = 0) { const d = drones[i]; if (!d) return false; for (let k = 0; k < 4; k++) { const v = d.pos.clone().sub(camera.position); P.yaw = Math.atan2(-v.x, -v.z); P.pitch = Math.atan2(v.y, Math.hypot(v.x, v.z)); updateCamera(0); } return true; },
  fire(on) { inp.fire = on; }, spawn(type, x, y, z) { const d = spawnDrone(type, new V3(x, y, z)); d.age = 1; return drones.indexOf(d); },
  setView(v) { G.view = v; }, setTier, shockwave, end: endGame, hurt, god(v) { G.godmode = v; }, killAll() { for (const d of [...drones]) killDrone(d, true); },
  move(x, y) { inp.sx = x; inp.sy = y; }, jump() { inp.jumpQ = true; },
  mech, camera, scene, renderer, toMenu,
  photo(px, py, pz, tx, ty, tz, fov = 40) { camOverride = true; camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); camera.fov = fov; camera.updateProjectionMatrix(); mech.root.visible = true; vm.visible = false; render(); },
  freeCam() { camOverride = false; resize(); },
};
