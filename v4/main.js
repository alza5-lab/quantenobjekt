// EYE OF RESONANCE // QUANTENOBJEKT v4.0 · Recursive Architecture for Consciousness, Perception and AI
// Gravity Point = Axonal Network Kernel · Konzept: Luca Matteo Balzano 1991 · shivas_ocean · Story/UI: MindDrop · Look: Creator 2 · JDZ / LMB · v4.0 · 2026
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sat = v => clamp(v, 0, 1);
const ease = t => { t = sat(t); return t * t * (3 - 2 * t); };
const ease2 = t => { t = sat(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const Q = new URLSearchParams(location.search);
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(1991);
const rr = (a, b) => a + (b - a) * R();
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const IS_TOUCH = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) && navigator.maxTouchPoints > 0;
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const VIDEO = Q.has('video');
const pad2 = n => String(n).padStart(2, '0');
const fmtT = s => `${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}`;
let T = 0;


// ---------------------------------------------------------------- palette (Konzept: Cyan #3ad6ff, Blau #4a7bff, Violett #7a5cff, Magenta #ff4fd8, Gold #ffc24a)
const C = { cy: new THREE.Color('#3ad6ff'), bl: new THREE.Color('#4a7bff'), vi: new THREE.Color('#7a5cff'), mg: new THREE.Color('#ff4fd8'), au: new THREE.Color('#ffc24a'), wh: new THREE.Color('#ffffff'), dk: new THREE.Color('#1a2a6a') };
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') || VIDEO });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.05, 900);
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .45, .32);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 4, bl: .55, amb: 1 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 2, bl: .52, amb: .8 },
  { n: 'MITTEL', pr: 1, s: 0, bl: .5, amb: .6 },
  { n: 'NIEDRIG', pr: .75, s: 0, bl: .45, amb: .4 }];
const QN = { ultra: 0, hoch: 1, mittel: 2, niedrig: 3 }; let tier = Q.has('q') ? clamp((QN[(Q.get('q') || '').toLowerCase()] ?? +Q.get('q')) | 0, 0, 3) : (IS_TOUCH ? 1 : 0);
let autoQ = !Q.has('q') && !Q.has('noauto') && !VIDEO;

// ---------------------------------------------------------------- textures
function ctex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const dotTex = ctex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.22, 'rgba(255,255,255,.8)'); gr.addColorStop(.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
const UPT = []; // materials that need uPR/uH

// generic glowing point cloud (per-point color, size in world units, alpha)
function makePoints(n, opt = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n).fill(opt.size || .08), alpha = new Float32Array(n).fill(1);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('col', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTex }, uPR: { value: 1 }, uH: { value: 800 }, uK: { value: 1 } }, ...ADD,
    vertexShader: `attribute vec3 col; attribute float size; attribute float alpha; uniform float uPR,uH; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*uPR*uH/max(.05,-mv.z),0.,180.); vC=col; vA=alpha; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uK; varying vec3 vC; varying float vA; void main(){ float a=texture2D(uMap,gl_PointCoord).a*vA*uK; if(a<.003) discard; gl_FragColor=vec4(vC*a,1.); }`
  });
  UPT.push(mat);
  const mesh = new THREE.Points(geo, mat); mesh.frustumCulled = false;
  return { geo, pos, col, size, alpha, mesh, mat, n, up() { geo.attributes.position.needsUpdate = true; geo.attributes.col.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; } };
}
function lineMat(color, op = .5) { return new THREE.LineBasicMaterial({ color, opacity: op, ...ADD }); }
function vlineMat(op = 1) { return new THREE.LineBasicMaterial({ vertexColors: true, opacity: op, ...ADD }); }
function glowSprite(color, s, op = 1) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, opacity: op, ...ADD })); m.scale.setScalar(s); return m; }

// text label sprite (world height h)
let FONT = '"NBMono", ui-monospace, Menlo, monospace';
function textSprite(lines, opt = {}) {
  const fs = opt.fs || 44, pad = 22, lh = fs * 1.28;
  const meas = document.createElement('canvas').getContext('2d');
  let w = 10; lines.forEach((l, i) => { meas.font = `${l.w || (i ? 400 : 600)} ${l.s ? fs * l.s : fs}px ${l.f || FONT}`; w = Math.max(w, meas.measureText(l.t).width + (l.ls ?? .12) * (l.s ? fs * l.s : fs) * l.t.length + 8); });
  const W = Math.ceil(w + pad * 2), H = Math.ceil(lines.reduce((a, l) => a + (l.s ? lh * l.s : lh), 0) + pad * 2);
  const tex = ctex(W, H, g => {
    let y = pad; g.textBaseline = 'top'; g.textAlign = opt.align || 'center';
    const x = opt.align === 'left' ? pad : opt.align === 'right' ? W - pad : W / 2;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i], f = l.s ? fs * l.s : fs; g.font = `${l.w || (i ? 400 : 600)} ${f}px ${l.f || FONT}`;
      g.shadowColor = l.g || 'rgba(122,92,255,.9)'; g.shadowBlur = 18; g.fillStyle = l.c || '#ffffff';
      if (g.letterSpacing !== undefined) g.letterSpacing = (l.ls ?? .12) * f + 'px';
      g.fillText(l.t, x, y); g.shadowBlur = 0; g.fillText(l.t, x, y); y += l.s ? lh * l.s : lh;
    }
  });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: opt.op ?? 1, toneMapped: false }));
  const h = opt.h || .3; sp.scale.set(h * W / H, h, 1);
  if (opt.align === 'left') sp.center.set(0, .5); if (opt.align === 'right') sp.center.set(1, .5);
  return sp;
}

// ---------------------------------------------------------------- Gruppen-Register (Sichtbarkeit, Isolation, Dimension)
const GR = {};
function reg(g, obj) {
  const G = GR[g] || (GR[g] = { items: [], f: 1, fl: 0 });
  obj.traverse(o => { if (!o.material) return; const m = o.material; if (m.userData.b0 === undefined) m.userData.b0 = m.uniforms && m.uniforms.uK ? m.uniforms.uK.value : m.opacity; G.items.push({ o, m, b: m.userData.b0 }); });
  return obj;
}
function applyGroups() {
  for (const k in GR) { const G = GR[k], f = G.f; for (const it of G.items) { if (it.m.uniforms && it.m.uniforms.uK) it.m.uniforms.uK.value = it.b * f; else it.m.opacity = it.b * f; it.o.visible = f > .004; } }
}
function circlePts(r, n, y = 0, f) { const a = []; for (let i = 0; i <= n; i++) { const t = i / n * TAU; const rr2 = f ? f(t) * r : r; a.push(new V3(Math.cos(t) * rr2, y, Math.sin(t) * rr2)); } return a; }
function lineLoop(pts, mat) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); }
const root = new THREE.Group(); scene.add(root);

// Sterne
const stars = makePoints(3200);
{ for (let i = 0; i < stars.n; i++) { const u = R() * 2 - 1, a = R() * TAU, r = 160 + R() * 260, s = Math.sqrt(1 - u * u); stars.pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); const c = R() < .2 ? C.vi : R() < .4 ? C.cy : C.wh; const b = .25 + R() * .6; stars.col.set([c.r * b, c.g * b, c.b * b], i * 3); stars.size[i] = .5 + R() * 1.4; stars.alpha[i] = .4 + R() * .6; } stars.up(); scene.add(stars.mesh); }

// ================================================================ OBJEKT: Achse, Ring Topology, Quantum Rings, Eye Core, Resonance Core, Neural Matter, Universal Field
const KY = -2.55;          // Gravity Point = Axonal Network Kernel
const TOPO_Y = -4.35;      // 3D Ring Topology (Universe Model)
const FIELD_Y = 3.15;      // Universal Field
const P = { freq: .45, coh: .72, sym: .8, ent: .18, awa: .7, exp: .5 };   // Calibrations
let symK = 8;              // radiale Symmetrie-Ordnung

// ---- Lichtachse
const axisG = new THREE.Group(); root.add(axisG);
{
  const g = new THREE.BufferGeometry().setFromPoints([new V3(0, -6.6, 0), new V3(0, 7.8, 0)]);
  axisG.add(new THREE.Line(g, lineMat(new THREE.Color(1.6, 2.4, 3.2), .9)));
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 14.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(.25, .55, 1), opacity: .35, ...ADD }));
  cyl.position.y = .6; axisG.add(cyl);
}
const axisP = makePoints(160); axisG.add(axisP.mesh);
const axisS = Array.from({ length: axisP.n }, () => ({ y: rr(-6.5, 7.6), v: rr(.6, 2.2), r: rr(0, .09), a: rr(0, TAU) }));
reg('axis', axisG);

// ---- 3D Ring Topology (Boden)
const topoG = new THREE.Group(); topoG.position.y = TOPO_Y; root.add(topoG);
const topoSpin = [];
{
  const radii = [1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8, 7.6];
  radii.forEach((r, i) => {
    const c = _c1.copy(C.cy).lerp(C.vi, (i % 3) / 3).multiplyScalar(i === 5 ? 2.2 : .9 + .2 * (i % 2));
    topoG.add(lineLoop(circlePts(r, 220, 0), lineMat(c.clone(), i === 5 ? .95 : .45)));
    if (i % 2 === 0) topoG.add(lineLoop(circlePts(r + .06, 220, .02), lineMat(c.clone().multiplyScalar(.6), .3)));
  });
  const sp = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; sp.push(new V3(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2), new V3(Math.cos(a) * 7.6, 0, Math.sin(a) * 7.6)); }
  topoG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sp), lineMat(new THREE.Color(.25, .45, 1), .12)));
  // zweite, leicht gehobene Ringebene
  for (const [r, y] of [[2.6, .55], [3.4, .62], [4.8, .38]]) topoG.add(lineLoop(circlePts(r, 200, y), lineMat(new THREE.Color(.7, .5, 1.6), .5)));
  // rotierende Knotenringe
  for (let j = 0; j < 4; j++) {
    const n = 60 + j * 24, r = 2.0 + j * 1.6, pp = makePoints(n);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; pp.pos.set([Math.cos(a) * r, .01, Math.sin(a) * r], i * 3); const c = i % 6 === 0 ? C.wh : j % 2 ? C.vi : C.cy; const b = i % 6 === 0 ? 1.6 : .9; pp.col.set([c.r * b, c.g * b, c.b * b], i * 3); pp.size[i] = i % 6 === 0 ? .12 : .06; pp.alpha[i] = .9; }
    pp.up(); const g = new THREE.Group(); g.add(pp.mesh); topoG.add(g); topoSpin.push({ g, v: (j % 2 ? -1 : 1) * (.04 + j * .015) });
  }
  // große äußere Scheibe (Universe Model)
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.1, 7.8, 96, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(.05, .09, .3), opacity: .35, ...ADD, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; topoG.add(disc);
}
reg('topo', topoG);

// ---- Quantum Rings (Bänder aus vielen feinen Kreisen)
const QR = [
  { y: 1.05, r: 5.0, w: .34, n: 9, big: true },
  { y: -1.0, r: 4.7, w: .32, n: 9, big: true },
  { y: 2.3, r: 3.1, w: .16, n: 5 },
  { y: -2.05, r: 3.3, w: .16, n: 5 }];
const ringG = new THREE.Group(); root.add(ringG);
const RSEG = 180;
const ringLines = [];
QR.forEach((q, qi) => {
  q.lines = [];
  for (let j = 0; j < q.n; j++) {
    const u = q.n > 1 ? j / (q.n - 1) - .5 : 0;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RSEG + 1) * 3), 3));
    const c = _c1.copy(C.cy).lerp(C.bl, Math.abs(u) * 1.6); if (j === (q.n >> 1)) c.lerp(C.wh, .35);
    const m = lineMat(c.clone().multiplyScalar(q.big ? 1.5 : 1.1), q.big ? .55 + .35 * (1 - Math.abs(u) * 2) : .5);
    const L = new THREE.Line(geo, m); L.frustumCulled = false; ringG.add(L);
    const ln = { q, L, geo, dr: u * q.w * 2, dy: Math.sin(j * 2.1) * q.w * .18, m: 2 + (j * 7 + qi * 3) % 5, ph: j * 1.7 + qi, tx: Math.sin(j * 3.7 + qi) , tz: Math.cos(j * 2.3 + qi * 1.3) };
    q.lines.push(ln); ringLines.push(ln);
  }
  // innerer Magenta-Ring an großen Ringen
  if (q.big) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RSEG + 1) * 3), 3)); const L = new THREE.Line(geo, lineMat(new THREE.Color(1.8, .45, 1.7), .55)); L.frustumCulled = false; ringG.add(L); const ln = { q, L, geo, dr: -1.05, dy: .02, m: 3, ph: qi * 2, tx: .3, tz: -.4, mag: true }; q.lines.push(ln); ringLines.push(ln); }
});
// Halo-Scheiben unter den großen Ringen (weiches Leuchten)
for (const q of QR.filter(q => q.big)) { const d = new THREE.Mesh(new THREE.RingGeometry(q.r - .55, q.r + .55, 128, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(.06, .16, .5), opacity: .5, ...ADD, side: THREE.DoubleSide })); d.rotation.x = -Math.PI / 2; d.position.y = q.y; ringG.add(d); }
function ringRad(q, a, extra = 0) { const s = 1 - P.sym; return (q.r + extra) * (1 + s * .09 * Math.sin(3 * a + q.y) + s * .05 * Math.sin(5 * a - q.y * 2)); }
let ringAmp = 0;
function updateRings(t) {
  const chaos = (1 - P.coh), fq = .4 + P.freq * 2.2;
  for (const ln of ringLines) {
    const q = ln.q, a = ln.geo.attributes.position.array;
    const amp = chaos * (q.big ? .42 : .25) + ringAmp * .12, tl = chaos * .22;
    for (let i = 0; i <= RSEG; i++) {
      const th = i / RSEG * TAU, r = ringRad(q, th, ln.dr);
      const wav = Math.sin(ln.m * th + t * fq * (1 + ln.ph * .1) + ln.ph) * amp + Math.sin(2 * th + t * fq * .5) * .03 * (1 + P.freq);
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      a[i * 3] = x; a[i * 3 + 1] = q.y + ln.dy + wav + (x * ln.tx + z * ln.tz) * tl * .12; a[i * 3 + 2] = z;
    }
    ln.geo.attributes.position.needsUpdate = true;
  }
}
reg('ring', ringG);

// ---- Ringknoten + Synaptic Links (abhängig von Symmetrie-Ordnung k)
const synG = new THREE.Group(); root.add(synG);
const nodeP = makePoints(512); synG.add(nodeP.mesh);
let synLines = null, RN = [];   // ring nodes {q, a, p: V3}
function buildSyn() {
  RN = [];
  QR.forEach((q, qi) => { const n = symK * (q.big ? 4 : 2); for (let i = 0; i < n; i++) { const a = i / n * TAU + (qi % 2) * Math.PI / n; const r = ringRad(q, a); RN.push({ q, qi, a, i, n, p: new V3(Math.cos(a) * r, q.y, Math.sin(a) * r) }); } });
  nodeP.geo.setDrawRange(0, RN.length);
  RN.forEach((nd, i) => { nodeP.pos.set([nd.p.x, nd.p.y, nd.p.z], i * 3); const major = nd.i % 4 === 0; const c = major ? C.wh : (nd.qi % 2 ? C.vi : C.cy); const b = major ? 1.8 : 1.2; nodeP.col.set([c.r * b, c.g * b, c.b * b], i * 3); nodeP.size[i] = major ? .19 : .11; nodeP.alpha[i] = .95; });
  nodeP.up();
  const seg = [];
  // Sternpolygon {n/k} in jedem großen Ring + Verbindungen zwischen Ringen
  const byQ = QR.map((q, qi) => RN.filter(n => n.qi === qi));
  byQ.forEach((ns, qi) => { const n = ns.length; const step = Math.max(2, Math.round(n / symK) * 1 + 1); ns.forEach((a, i) => { if (QR[qi].big && i % 2 === 0) seg.push(a.p, ns[(i + step) % n].p); seg.push(a.p, ns[(i + 1) % n].p); }); });
  for (const [qa, qb] of [[0, 2], [1, 3], [0, 1]]) { const A = byQ[qa], B = byQ[qb]; A.forEach((a, i) => { if (i % 2) return; const b = B[Math.round(i / A.length * B.length) % B.length]; seg.push(a.p, b.p); }); }
  if (synLines) { synG.remove(synLines); synLines.geometry.dispose(); }
  synLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), synMat); synG.add(synLines);
  if (GR.syn) { GR.syn.items = GR.syn.items.filter(it => it.o.parent); reg('syn', synLines); GR.syn.items = dedupe(GR.syn.items); }
}
function dedupe(items) { const s = new Set(); return items.filter(it => { if (s.has(it.o)) return false; s.add(it.o); return true; }); }
const synMat = lineMat(new THREE.Color(.55, .75, 1.6), .22);
buildSyn(); reg('syn', synG);

// ---- Eye Core (Consciousness Interface)
const eyeG = new THREE.Group(); root.add(eyeG);       // Kugel (fest)
const eyeLook = new THREE.Group(); eyeG.add(eyeLook);  // Blick (folgt Finger/Maus)
{
  // Drahtkugel
  const sph = []; const R0 = 1.55;
  for (let i = 1; i < 9; i++) { const la = -Math.PI / 2 + i / 9 * Math.PI, y = Math.sin(la) * R0, r = Math.cos(la) * R0; const c = circlePts(r, 96, y); for (let k = 0; k < c.length - 1; k++) sph.push(c[k], c[k + 1]); }
  for (let i = 0; i < 16; i++) { const lo = i / 16 * TAU; for (let k = 0; k < 48; k++) { const a0 = -Math.PI / 2 + k / 48 * Math.PI, a1 = -Math.PI / 2 + (k + 1) / 48 * Math.PI; sph.push(new V3(Math.cos(a0) * Math.cos(lo) * R0, Math.sin(a0) * R0, Math.cos(a0) * Math.sin(lo) * R0), new V3(Math.cos(a1) * Math.cos(lo) * R0, Math.sin(a1) * R0, Math.cos(a1) * Math.sin(lo) * R0)); } }
  eyeG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sph), lineMat(new THREE.Color(.35, .55, 1.5), .28)));
  const glass = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(.04, .05, .22), opacity: .3, ...ADD }));
  eyeG.add(glass);
}
// Iris: konzentrische Ringe + Fasern, Pupille
const irisRings = [];
for (let i = 0; i < 11; i++) {
  const r = .16 + i * .095, c = i % 3 === 0 ? C.mg : i % 2 ? C.vi : C.cy;
  const L = lineLoop(circlePts(r, 96, 0).map(p => new V3(p.x, p.z, 0)), lineMat(c.clone().multiplyScalar(1.5 + (i < 3 ? 1 : 0)), .85)); L.position.z = 1.05 - i * .012; eyeLook.add(L); irisRings.push({ L, r, i });
}
{ const s = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, r0 = .22, r1 = .62 + (i % 4) * .1 + (i % 3) * .05; s.push(new V3(Math.cos(a) * r0, Math.sin(a) * r0, 1.06), new V3(Math.cos(a + .08) * r1, Math.sin(a + .08) * r1, 1.0)); } eyeLook.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.6, 1.6, 2.2), .5))); }
const pupil = glowSprite(new THREE.Color(.25, 1.2, 1.35), .55, 1); pupil.position.z = 1.12; eyeLook.add(pupil);
const pupilCore = glowSprite(new THREE.Color(.9, 1.8, 1.8), .16, 1); pupilCore.position.z = 1.14; eyeLook.add(pupilCore);
const eyeHalo = glowSprite(new THREE.Color(.2, .35, 1.2), 4.2, .3); eyeG.add(eyeHalo);
// Lider (Mandelform, magenta) in Blickrichtung
const lidMat = lineMat(new THREE.Color(2.2, .6, 2.0), .9);
const lidGeo = new THREE.BufferGeometry(); lidGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(2 * 81 * 3), 3));
const lids = new THREE.LineSegments(lidGeo, lidMat); lids.frustumCulled = false; eyeLook.add(lids);
function setLids(open) {
  const a = lidGeo.attributes.position.array; let k = 0; const W = 2.35, H = .42 + open * .62;
  for (const sgn of [1, -1]) for (let i = 0; i < 80; i++) { for (const j of [i, i + 1]) { const u = j / 80 * 2 - 1; a[k++] = u * W; a[k++] = sgn * H * (1 - u * u) ; a[k++] = .95 - Math.abs(u) * .5; } }
  lidGeo.attributes.position.needsUpdate = true;
}
setLids(.7);
// Äquator-Ring (magenta, horizontal) wie Vorlage
const eyeEq = lineLoop(circlePts(4.2, 200, .02), lineMat(new THREE.Color(2.2, .5, 2.0), .75)); eyeG.add(eyeEq);
const eyeEq2 = lineLoop(circlePts(3.4, 200, -.02, a => 1 + .02 * Math.sin(6 * a)), lineMat(new THREE.Color(1.2, .4, 1.8), .45)); eyeG.add(eyeEq2);
reg('eye', eyeG);

// ---- Resonance Core (Perception / Data): magenta Sphäre
const resG = new THREE.Group(); root.add(resG);
{
  const s = []; const R0 = 2.45;
  for (let i = 0; i < 12; i++) { const lo = i / 12 * TAU; const c = []; for (let k = 0; k <= 96; k++) { const a = k / 96 * TAU; c.push(new V3(Math.cos(a) * Math.cos(lo) * R0, Math.sin(a) * R0, Math.cos(a) * Math.sin(lo) * R0)); } for (let k = 0; k < 96; k++) s.push(c[k], c[k + 1]); }
  for (const la of [-.9, -.45, 0, .45, .9]) { const c = circlePts(Math.cos(la) * R0, 120, Math.sin(la) * R0); for (let k = 0; k < 120; k++) s.push(c[k], c[k + 1]); }
  resG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(1.5, .35, 1.4), .3)));
}
const resP = makePoints(420); resG.add(resP.mesh);
{ for (let i = 0; i < resP.n; i++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u); resP.pos.set([Math.cos(a) * s * 2.45, u * 2.45, Math.sin(a) * s * 2.45], i * 3); const c = R() < .6 ? C.mg : C.vi; resP.col.set([c.r * 1.4, c.g * 1.4, c.b * 1.4], i * 3); resP.size[i] = .035 + R() * .05; resP.alpha[i] = .5 + R() * .5; } resP.up(); }
reg('res', resG);

// ---- Neural Matter (8³ Impulse Field)
const meshG = new THREE.Group(); root.add(meshG);
const MN = 8, MS = 5.6, M3 = [];
for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) for (let k = 0; k < MN; k++) { const u = v => (v / (MN - 1) - .5) * MS; M3.push({ b: new V3(u(i), u(j) * .9, u(k)), w: Math.sin(i * 1.3 + j * 2.1 + k * .7) * 1.0, ijk: [i, j, k], e: 0, mem: 0, p: new V3() }); }
const meshP = makePoints(M3.length); meshG.add(meshP.mesh);
const meshLinkGeo = new THREE.BufferGeometry(); const MLINK = [];
{ const idx = (i, j, k) => (i * MN + j) * MN + k; for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) for (let k = 0; k < MN; k++) { if (i < MN - 1) MLINK.push([idx(i, j, k), idx(i + 1, j, k)]); if (j < MN - 1) MLINK.push([idx(i, j, k), idx(i, j + 1, k)]); if (k < MN - 1) MLINK.push([idx(i, j, k), idx(i, j, k + 1)]); } }
meshLinkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MLINK.length * 6), 3));
meshLinkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MLINK.length * 6), 3));
const meshLinks = new THREE.LineSegments(meshLinkGeo, vlineMat(.9)); meshLinks.frustumCulled = false; meshG.add(meshLinks);
const MNB = M3.map(() => []); MLINK.forEach(([a, b]) => { MNB[a].push(b); MNB[b].push(a); });
reg('mesh', meshG);

// ---- Universal Field (Expansion / Mycelium Growth)
const fieldG = new THREE.Group(); fieldG.position.y = FIELD_Y; root.add(fieldG);
const fieldCore = new THREE.Group(); fieldG.add(fieldCore);
const FNODES = [];
{
  const s = [];
  const lat = [[0, 4.3], [.55, 3.9], [1.05, 3.0], [1.45, 1.8]];
  lat.forEach(([y, r], li) => { const c = circlePts(r, 160, y); for (let k = 0; k < 160; k++) s.push(c[k], c[k + 1]); const n = 12 + li * 2; for (let i = 0; i < n; i++) { const a = i / n * TAU + li * .2; FNODES.push(new V3(Math.cos(a) * r, y, Math.sin(a) * r)); } });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; for (let k = 0; k < 24; k++) { const f0 = k / 24, f1 = (k + 1) / 24; const P0 = (f) => { const y = f * 1.6, r = 4.3 * Math.sqrt(Math.max(0, 1 - (y / 1.75) ** 2)); return new V3(Math.cos(a) * r, y, Math.sin(a) * r); }; s.push(P0(f0), P0(f1)); } }
  // Netz zwischen Knoten
  for (let i = 0; i < FNODES.length; i++) for (let j = i + 1; j < FNODES.length; j++) { const d = FNODES[i].distanceTo(FNODES[j]); if (d < 1.55 && (i * 7 + j) % 3 === 0) s.push(FNODES[i], FNODES[j]); }
  fieldCore.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.45, .75, 1.8), .38)));
  // kleine Kugel oben
  const t = []; for (let i = 0; i < 8; i++) { const lo = i / 8 * TAU; const c = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * TAU; c.push(new V3(Math.cos(a) * Math.cos(lo) * .72, 1.15 + Math.sin(a) * .72, Math.cos(a) * Math.sin(lo) * .72)); } for (let k = 0; k < 48; k++) t.push(c[k], c[k + 1]); }
  for (const y of [-.4, 0, .4]) { const c = circlePts(Math.sqrt(.72 * .72 - y * y), 64, 1.15 + y); for (let k = 0; k < 64; k++) t.push(c[k], c[k + 1]); }
  fieldCore.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(t), lineMat(new THREE.Color(.7, .9, 2.2), .55)));
  const fs = glowSprite(new THREE.Color(.8, 1.4, 2.6), 1.3, .8); fs.position.y = 1.15; fieldCore.add(fs);
}
const fieldNodeP = makePoints(FNODES.length); fieldCore.add(fieldNodeP.mesh);
FNODES.forEach((p, i) => { fieldNodeP.pos.set([p.x, p.y, p.z], i * 3); const c = i % 5 ? C.cy : C.wh; fieldNodeP.col.set([c.r * 1.6, c.g * 1.6, c.b * 1.6], i * 3); fieldNodeP.size[i] = i % 5 ? .12 : .2; fieldNodeP.alpha[i] = 1; }); fieldNodeP.up();
reg('field', fieldG);

// ---- Staub / Rauschen (Entropy)
const dust = makePoints(1400); root.add(dust.mesh);
const DS = Array.from({ length: dust.n }, () => { const a = R() * TAU, r = 1 + Math.pow(R(), .7) * 8, y = rr(-5, 6); return { b: new V3(Math.cos(a) * r, y, Math.sin(a) * r), ph: R() * TAU, s: rr(.03, .08), c: R() < .5 ? C.cy : R() < .5 ? C.vi : C.bl }; });
reg('dust', dust.mesh);

// ---- 4D: Tesserakt-Projektion
const tessG = new THREE.Group(); root.add(tessG);
const TV = []; for (let i = 0; i < 16; i++) TV.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
const TE = []; for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) TE.push([i, j]); }
const tessGeo = new THREE.BufferGeometry(); tessGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TE.length * 2 * 3 * 8), 3)); tessGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TE.length * 2 * 3 * 8), 3));
const tessL = new THREE.LineSegments(tessGeo, vlineMat(.85)); tessL.frustumCulled = false; tessG.add(tessL);
const tessP = makePoints(16); tessG.add(tessP.mesh);
function rot4(v, a, b, c) { // xw, yw, zw Rotation
  let [x, y, z, w] = v; let ca = Math.cos(a), sa = Math.sin(a); [x, w] = [x * ca - w * sa, x * sa + w * ca]; ca = Math.cos(b); sa = Math.sin(b); [y, w] = [y * ca - w * sa, y * sa + w * ca]; ca = Math.cos(c); sa = Math.sin(c); [z, w] = [z * ca - w * sa, z * sa + w * ca]; return [x, y, z, w];
}
function proj4(v, s) { const k = 2.6 / (2.6 - v[3] * .9); return [v[0] * k * s, v[1] * k * s, v[2] * k * s, k]; }
function updateTess(t) {
  const a = t * .31, b = t * .23, c = t * .17, S = 3.6, pa = tessGeo.attributes.position.array, ca = tessGeo.attributes.color.array; const PV = TV.map(v => proj4(rot4(v, a, b, c), S)); let k = 0;
  // jede Kante in 8 Teile, damit sie sich biegt (Zwischenpunkte auch in 4D rotiert)
  for (const [i, j] of TE) { for (let q = 0; q < 8; q++) { for (const f of [q / 8, (q + 1) / 8]) { const v = TV[i].map((x, d) => lerp(x, TV[j][d], f)); const p = proj4(rot4(v, a, b, c), S); pa[k] = p[0]; pa[k + 1] = p[1] + .2; pa[k + 2] = p[2]; const g = sat((p[3] - .7) * 1.4); _c1.copy(C.vi).lerp(C.cy, g).multiplyScalar(.7 + g * 1.2); ca[k] = _c1.r; ca[k + 1] = _c1.g; ca[k + 2] = _c1.b; k += 3; } } }
  tessGeo.attributes.position.needsUpdate = true; tessGeo.attributes.color.needsUpdate = true;
  PV.forEach((p, i) => { tessP.pos.set([p[0], p[1] + .2, p[2]], i * 3); tessP.col.set([.8 * p[3], 1.4 * p[3], 2 * p[3]], i * 3); tessP.size[i] = .14 * p[3]; tessP.alpha[i] = 1; }); tessP.up();
}
reg('tess', tessG);

// ================================================================ AXONAL NETWORK KERNEL: Netze mit wandernden Impulsen
class Net {
  constructor(name, cA, cB, opt = {}) { this.name = name; this.cA = cA; this.cB = cB; this.paths = []; this.pulses = []; this.opt = opt; this.g = new THREE.Group(); }
  add(pts, meta = {}) { const p = Object.assign({ pts, n: pts.length, grow: 1, gT: 1, w: meta.w ?? .5, kids: [], parent: null, i0: 0, fl: 0 }, meta); this.measure(p); this.paths.push(p); return p; }
  measure(p) { p.cum = new Float32Array(p.n); let L = 0; for (let i = 1; i < p.n; i++) { L += p.pts[i].distanceTo(p.pts[i - 1]); p.cum[i] = L; } p.L = Math.max(L, .001); for (let i = 0; i < p.n; i++) p.cum[i] /= p.L; }
  build() {
    let nv = 0, np = 0; for (const p of this.paths) { p.off = nv; p.poff = np; nv += (p.n - 1) * 2; np += p.n; }
    this.lg = new THREE.BufferGeometry(); this.lpos = new Float32Array(nv * 3); this.lcol = new Float32Array(nv * 3);
    this.lg.setAttribute('position', new THREE.BufferAttribute(this.lpos, 3)); this.lg.setAttribute('color', new THREE.BufferAttribute(this.lcol, 3));
    this.lines = new THREE.LineSegments(this.lg, vlineMat(this.opt.lop ?? 1)); this.lines.frustumCulled = false; this.g.add(this.lines);
    this.pp = makePoints(np); this.g.add(this.pp.mesh);
    this.hp = makePoints(this.opt.maxP || 260); this.g.add(this.hp.mesh);
    for (const p of this.paths) this.write(p);
    this.sc = new Float32Array(np * 3);
  }
  write(p) {
    let k = p.off * 3; for (let i = 0; i < p.n - 1; i++) { const a = p.pts[i], b = p.pts[i + 1]; this.lpos[k++] = a.x; this.lpos[k++] = a.y; this.lpos[k++] = a.z; this.lpos[k++] = b.x; this.lpos[k++] = b.y; this.lpos[k++] = b.z; }
    for (let i = 0; i < p.n; i++) { const a = p.pts[i]; this.pp.pos.set([a.x, a.y, a.z], (p.poff + i) * 3); const bead = p.bead && i % p.bead === 0 && i > 0; this.pp.size[p.poff + i] = bead ? (p.bs || .085) : (p.ts || .04); this.pp.alpha[p.poff + i] = bead ? 1 : .4; }
    if (p.n) { const e = p.n - 1; this.pp.size[p.poff + e] = p.end || this.pp.size[p.poff + e]; }
    this.lg.attributes.position.needsUpdate = true; this.pp.geo.attributes.position.needsUpdate = true; this.pp.geo.attributes.size.needsUpdate = true;
  }
  fire(p, e = 1, v, delay = 0) { if (this.pulses.length > 420) return; this.pulses.push({ p, s: 0, v: v || (this.opt.v || 5), e, d: delay, fired: 0 }); }
  update(dt, onArrive, base = 1, learn = false) {
    const hp = this.hp; let h = 0;
    for (let k = this.pulses.length - 1; k >= 0; k--) {
      const u = this.pulses[k]; if (u.d > 0) { u.d -= dt; continue; }
      u.s += u.v * dt / u.p.L;
      for (const kid of u.p.kids) if (!(u.fired & (1 << (kid.ki & 30))) && u.s >= u.p.cum[kid.i0]) { u.fired |= 1 << (kid.ki & 30); if (kid.grow > .5) this.fire(kid, u.e * .85, u.v * .9); }
      if (learn) u.p.w = Math.min(1.6, u.p.w + dt * .25);
      if (u.s >= 1) { this.pulses.splice(k, 1); u.p.fl = 1; if (onArrive) onArrive(u.p, u); continue; }
      if (h < hp.n && u.p.grow > u.s) { const i = Math.min(u.p.n - 1, Math.floor(u.s * (u.p.n - 1))); const a = u.p.pts[i]; hp.pos.set([a.x, a.y, a.z], h * 3); const c = this.opt.hc || C.wh; hp.col.set([c.r * 1.3 * u.e, c.g * 1.3 * u.e, c.b * 1.3 * u.e], h * 3); hp.size[h] = .13 * (.6 + .4 * u.e); hp.alpha[h] = 1; h++; }
    }
    hp.geo.setDrawRange(0, h); hp.up();
    const lc = this.lcol, pc = this.pp.col, pa = this.pp.alpha, cA = this.cA, cB = this.cB;
    for (const p of this.paths) {
      if (!learn) p.w += (.5 - p.w) * Math.min(1, dt * .08);
      p.fl = Math.max(0, p.fl - dt * 1.6);
      const ps = []; for (const u of this.pulses) if (u.p === p && u.d <= 0) ps.push(u);
      const bw = base * (.16 + .34 * p.w) * (p.dim ?? 1) * (p.parent || p.den ? .7 : 1);
      for (let i = 0; i < p.n; i++) {
        const s = p.cum[i]; let m = s <= p.grow ? 1 : 0; if (m && p.grow < 1) m = sat((p.grow - s) * 12);
        let I = 0; for (const u of ps) { const d = (s - u.s) * p.L; if (d < .9 && d > -.9) I += Math.exp(-d * d / .03) * u.e; }
        const f = s; _c1.copy(cA).lerp(cB, f).multiplyScalar(bw + p.fl * .5); _c1.r += I * 1.0; _c1.g += I * 1.35; _c1.b += I * 1.6;
        const j = (p.poff + i) * 3; pc[j] = _c1.r * m; pc[j + 1] = _c1.g * m; pc[j + 2] = _c1.b * m;
      }
      let k = p.off * 3; for (let i = 0; i < p.n - 1; i++) { const a = (p.poff + i) * 3, b = a + 3; lc[k++] = pc[a] * .8; lc[k++] = pc[a + 1] * .8; lc[k++] = pc[a + 2] * .8; lc[k++] = pc[b] * .8; lc[k++] = pc[b + 1] * .8; lc[k++] = pc[b + 2] * .8; }
    }
    this.lg.attributes.color.needsUpdate = true; this.pp.geo.attributes.col.needsUpdate = true;
  }
}

// Pfad-Generator: Bezier + organisches Wackeln (axon-artig)
const _t1 = new V3(), _t2 = new V3();
function organicPath(A, B, n, opt = {}, rnd = R) {
  const d = B.clone().sub(A), L = d.length();
  const out = opt.out || new V3(d.x, 0, d.z).normalize();
  const P1 = A.clone().add(out.clone().multiplyScalar(L * (opt.k1 ?? .35))).add(new V3((rnd() - .5), (rnd() - .5) * .6 + (opt.up ?? 0), (rnd() - .5)).multiplyScalar(L * .25));
  const P2 = B.clone().add(opt.in2 || new V3((rnd() - .5), -(opt.k2 ?? .3), (rnd() - .5)).multiplyScalar(L * .3));
  const side = new V3().crossVectors(d, new V3(0, 1, 0)); if (side.lengthSq() < 1e-4) side.set(1, 0, 0); side.normalize(); const up2 = new V3().crossVectors(side, d).normalize();
  const f1 = 2 + rnd() * 3, f2 = 3 + rnd() * 4, ph1 = rnd() * TAU, ph2 = rnd() * TAU, amp = (opt.amp ?? .09) * L;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), it = 1 - t;
    const p = new V3().addScaledVector(A, it * it * it).addScaledVector(P1, 3 * it * it * t).addScaledVector(P2, 3 * it * t * t).addScaledVector(B, t * t * t);
    const env = Math.sin(Math.PI * t); p.addScaledVector(side, Math.sin(t * f1 * Math.PI + ph1) * amp * env * .5).addScaledVector(up2, Math.sin(t * f2 * Math.PI + ph2) * amp * env * .35);
    pts.push(p);
  }
  return pts;
}
function wanderPath(A, dir, len, n, rnd = R, curl = .5) {
  const pts = [A.clone()]; const d = dir.clone().normalize(); const p = A.clone(); const st = len / (n - 1);
  for (let i = 1; i < n; i++) { d.x += (rnd() - .5) * curl; d.y += (rnd() - .5) * curl * .7; d.z += (rnd() - .5) * curl; d.normalize(); p.addScaledVector(d, st); pts.push(p.clone()); }
  return pts;
}

// ---- Kernel-Körper (Soma)
const kernG = new THREE.Group(); kernG.position.y = KY; root.add(kernG);
const somaP = makePoints(1100); kernG.add(somaP.mesh);
const SOMA = [];
for (let i = 0; i < somaP.n; i++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), r = Math.pow(R(), .45) * .62; SOMA.push({ b: new V3(Math.cos(a) * s * r, u * r * .85, Math.sin(a) * s * r), r, ph: R() * TAU }); const c = r < .25 ? C.cy : R() < .6 ? C.vi : C.bl; const b = r < .25 ? 1.0 : .6; somaP.col.set([c.r * b, c.g * b, c.b * b], i * 3); somaP.size[i] = .022 + R() * .04; somaP.alpha[i] = .25 + R() * .4; }
const kCore = glowSprite(new THREE.Color(.35, 1.5, 1.7), .8, 1); kernG.add(kCore);
const kCore2 = glowSprite(new THREE.Color(.5, .25, 1.4), 2.6, .35); kernG.add(kCore2);
const kRings = []; for (let i = 0; i < 4; i++) { const L = lineLoop(circlePts(.2 + i * .13, 64, 0), lineMat(i % 2 ? new THREE.Color(1.6, .5, 1.8) : new THREE.Color(.5, 1.8, 2.4), .8)); kernG.add(L); kRings.push(L); }
{ const s = []; for (let i = 0; i < 5; i++) { const c = circlePts(1.5 + i * .08, 140, 0, a => 1 + .04 * Math.sin(3 * a + i)); for (let k = 0; k < 140; k++) s.push(c[k], c[k + 1]); } const ov = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.5, .6, 1.8), .35)); ov.scale.y = .55; ov.rotation.x = .25; kernG.add(ov); }
// Membranschalen
{ const s = []; for (let i = 0; i < 6; i++) { const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(i * .5, i * 1.1, i * .3)); const c = circlePts(.66, 80, 0).map(p => p.applyQuaternion(q)); for (let k = 0; k < 80; k++) s.push(c[k], c[k + 1]); } kernG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.6, .5, 1.9), .3))); }
reg('kernel', kernG);

// ---- Axone vom Kernel zu allen Schichten
const AXN = new Net('axon', new THREE.Color(.55, .35, 1.6), new THREE.Color(.25, .8, 1.8), { v: 5.2, hc: new THREE.Color(.8, 1, 1), maxP: 320 });
root.add(AXN.g);
const KC = new V3(0, KY, 0);
const AXT = [];   // Zielpool
function axTargets() {
  const T = [];
  for (const [qi, n] of [[0, 11], [1, 11], [2, 5], [3, 6]]) { const q = QR[qi]; for (let i = 0; i < n; i++) { const a = (i + .5 * (qi % 2)) / n * TAU; const r = ringRad(q, a); T.push({ type: 'ring', qi, p: new V3(Math.cos(a) * r, q.y, Math.sin(a) * r) }); } }
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .3, r = i % 2 ? 3.6 : 5.2; T.push({ type: 'topo', p: new V3(Math.cos(a) * r, TOPO_Y, Math.sin(a) * r) }); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .5, la = -.75; T.push({ type: 'eye', p: new V3(Math.cos(a) * Math.cos(la) * 1.55, Math.sin(la) * 1.55, Math.sin(a) * Math.cos(la) * 1.55) }); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + .9; T.push({ type: 'field', p: new V3(Math.cos(a) * 4.25, FIELD_Y + .02, Math.sin(a) * 4.25) }); }
  return T;
}
const AX_NS = 64, BR_NS = 22;
function makeAxonPts(tg, rnd) {
  const dir = tg.p.clone().sub(KC); const out = new V3(dir.x, 0, dir.z); if (out.lengthSq() < .01) out.set(rnd() - .5, 0, rnd() - .5); out.normalize();
  const A = KC.clone().addScaledVector(out, .5).add(new V3(0, (tg.p.y > KY ? .25 : -.2), 0));
  let opt = { out: out.clone().add(new V3(0, tg.type === 'topo' ? -.6 : .35, 0)).normalize(), amp: .07, k1: .38 };
  if (tg.type === 'field') opt = { out: out.clone().add(new V3(0, .2, 0)).normalize(), k1: .55, amp: .05, in2: out.clone().multiplyScalar(2.2).add(new V3(0, -2.2, 0)) };
  if (tg.type === 'eye') opt = { out: out.clone().add(new V3(0, .9, 0)).normalize(), k1: .3, amp: .05, in2: new V3(0, -1, 0) };
  return organicPath(A, tg.p, AX_NS, opt, rnd);
}
function branchPts(par, i0, rnd, len) { const a = par.pts[i0], b = par.pts[Math.min(par.n - 1, i0 + 2)]; const d = b.clone().sub(a).normalize(); d.add(new V3(rnd() - .5, (rnd() - .5) * .8, rnd() - .5).multiplyScalar(1.4)); return wanderPath(a, d, len, BR_NS, rnd, .55); }
let axSeed = 77;
function growAxon(tg, rnd) {
  const p = AXN.add(makeAxonPts(tg, rnd), { tg, bead: 6, bs: .09, ts: .045, end: .2, main: true });
  for (let b = 0; b < 3; b++) { const i0 = 10 + Math.floor(rnd() * 44); const k = AXN.add(branchPts(p, i0, rnd, .7 + rnd() * 1.6), { parent: p, i0, bead: 7, bs: .06, ts: .03, end: .11, ki: b * 2, w: .35 }); p.kids.push(k); }
  return p;
}
{ const rnd = rng(axSeed); for (const tg of axTargets()) { AXT.push(tg); growAxon(tg, rnd); } }
// Dendriten direkt am Kernel (Look 02: Zelle mit Fortsätzen)
const DEN = [];
{ const rnd = rng(5); for (let i = 0; i < 44; i++) { const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u); const d = new V3(Math.cos(a) * s, u * .8, Math.sin(a) * s); const A = KC.clone().addScaledVector(d, .55); const p = AXN.add(wanderPath(A, d, .5 + rnd() * 1.2, 16, rnd, .7), { bead: 5, bs: .05, ts: .035, end: .08, den: true, w: .45 }); DEN.push(p); } }
AXN.build();
reg('axon', AXN.g);
const MAINS = AXN.paths.filter(p => p.main);

// H2 Adaptation: Axone ziehen sich zurück und wachsen zu neuen Zielen
let rewireT = 0; const rewiring = [];
function rewireOne(rnd = R) {
  const cand = MAINS.filter(p => !p.rw); if (!cand.length) return; const p = cand[Math.floor(rnd() * cand.length)];
  p.rw = { ph: 0 };
  rewiring.push(p);
}
function updateRewire(dt) {
  for (let k = rewiring.length - 1; k >= 0; k--) {
    const p = rewiring[k];
    if (p.rw.ph === 0) { p.grow = Math.max(0, p.grow - dt * .9); if (p.grow <= 0) { // neues Ziel
        const tg = AXT[Math.floor(R() * AXT.length)]; const tg2 = { type: tg.type, qi: tg.qi, p: tg.p.clone().add(new V3(rr(-.4, .4), 0, rr(-.4, .4))) }; if (tg.type === 'eye' || tg.type === 'field') tg2.p.copy(tg.p);
        const np = makeAxonPts(tg2, R); for (let i = 0; i < p.n; i++) p.pts[i].copy(np[i]); p.tg = tg2; AXN.measure(p); AXN.write(p);
        for (const kid of p.kids) { const i0 = 10 + Math.floor(R() * 44); kid.i0 = i0; const bp = branchPts(p, i0, R, .7 + R() * 1.6); for (let i = 0; i < kid.n; i++) kid.pts[i].copy(bp[i]); AXN.measure(kid); AXN.write(kid); }
        p.rw.ph = 1; } }
    else { p.grow = Math.min(1, p.grow + dt * .45); if (p.grow >= 1) { delete p.rw; rewiring.splice(k, 1); } }
    for (const kid of p.kids) kid.grow = sat((p.grow - p.cum[kid.i0]) / Math.max(.05, 1 - p.cum[kid.i0]));
  }
}

// ---- Harmonic Bridge: magenta Bögen Ringe -> Eye Core und Ring <-> Ring
const BRN = new Net('bridge', new THREE.Color(1.5, .3, 1.4), new THREE.Color(1.9, .6, 2.1), { v: 4.2, hc: new THREE.Color(1, .6, 1), maxP: 120 });
root.add(BRN.g);
const BRIDGE_BY_Q = [[], [], [], []];
function buildBridges() {
  const rnd = rng(31);
  for (const qi of [0, 1]) { const q = QR[qi]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + qi * .5; const r = ringRad(q, a); const A = new V3(Math.cos(a) * r, q.y, Math.sin(a) * r); const B = new V3(Math.cos(a) * 1.6, q.y * .35, Math.sin(a) * 1.6); const pts = organicPath(A, B, 40, { out: new V3(0, qi ? 1 : -1, 0).add(B.clone().sub(A).normalize()).normalize(), k1: .4, amp: .02, in2: new V3(Math.cos(a), qi ? -.6 : .6, Math.sin(a)) }, rnd); const p = BRN.add(pts, { bead: 8, bs: .07, ts: .03, end: .14, w: .5, toEye: true }); BRIDGE_BY_Q[qi].push(p); } }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .2; const A = new V3(Math.cos(a) * ringRad(QR[1], a), QR[1].y, Math.sin(a) * ringRad(QR[1], a)), B = new V3(Math.cos(a) * ringRad(QR[0], a), QR[0].y, Math.sin(a) * ringRad(QR[0], a)); const pts = []; for (let k = 0; k < 40; k++) { const t = k / 39; const p = A.clone().lerp(B, t); const bul = Math.sin(Math.PI * t) * 1.1; p.x += Math.cos(a) * bul; p.z += Math.sin(a) * bul; pts.push(p); } BRIDGE_BY_Q[1].push(BRN.add(pts, { bead: 6, bs: .06, ts: .03, end: .1, w: .45 })); }
  BRN.build();
}
buildBridges(); reg('bridge', BRN.g);

// ---- Myzel (Universal Field, Expansion)
const MYN = new Net('myc', new THREE.Color(.35, .6, 1.6), new THREE.Color(.6, .5, 1.8), { v: 2.6, hc: new THREE.Color(.7, .9, 1), maxP: 120 });
fieldCore.add(MYN.g);
{
  const rnd = rng(11);
  FNODES.forEach((A, i) => {
    if (i % 2) return; const d = new V3(A.x, .25 + rnd() * .5, A.z).normalize(); const len = 1.4 + rnd() * 2.4; const p = MYN.add(wanderPath(A, d, len, 26, rnd, .5), { bead: 5, bs: .06, ts: .03, end: .1, th: rnd() * .6 });
    for (let b = 0; b < 2; b++) { const i0 = 6 + Math.floor(rnd() * 16); const k = MYN.add(wanderPath(p.pts[i0], new V3(d.x + rnd() - .5, rnd() * .7, d.z + rnd() - .5), .6 + rnd() * 1.4, 16, rnd, .7), { parent: p, i0, bead: 5, bs: .05, ts: .025, end: .07, ki: b * 2, th: p.th + .15 + rnd() * .3 }); p.kids.push(k); }
  });
  MYN.build();
}
function updateMycel(dt) { const ex = P.exp; for (const p of MYN.paths) { const tgt = sat((ex * 1.25 - p.th) * 1.6); p.grow += (tgt - p.grow) * Math.min(1, dt * 1.5); } }

// ================================================================ MODULE (Overlays)
const MOD = { ring: 0, grid: 0, fib: 0, lorenz: 0, galaxy: 0 };
// RING STRUCTURE (8x8): Torus-Gitter
const modRing = new THREE.Group(); root.add(modRing);
const TOR = { R: 6.3, r: 1.45 };
function torusP(u, v, out = new V3()) { const c = TOR.R + TOR.r * Math.cos(v); return out.set(Math.cos(u) * c, TOR.r * Math.sin(v) * .85, Math.sin(u) * c); }
{
  const s = [];
  for (let i = 0; i < 8; i++) { const u = i / 8 * TAU; for (let k = 0; k < 64; k++) s.push(torusP(u, k / 64 * TAU), torusP(u, (k + 1) / 64 * TAU)); }
  for (let j = 0; j < 8; j++) { const v = j / 8 * TAU; for (let k = 0; k < 200; k++) s.push(torusP(k / 200 * TAU, v), torusP((k + 1) / 200 * TAU, v)); }
  modRing.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.5, 1.3, 2.4), .75)));
  const f = []; for (let i = 0; i < 48; i++) { const u = i / 48 * TAU; for (let k = 0; k < 32; k++) f.push(torusP(u, k / 32 * TAU), torusP(u, (k + 1) / 32 * TAU)); }
  modRing.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(f), lineMat(new THREE.Color(.3, .6, 1.6), .18)));
}
const torNodes = makePoints(64); modRing.add(torNodes.mesh);
for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const p = torusP(i / 8 * TAU, j / 8 * TAU); const k = i * 8 + j; torNodes.pos.set([p.x, p.y, p.z], k * 3); torNodes.col.set([1.4, 2.2, 2.8], k * 3); torNodes.size[k] = .2; torNodes.alpha[k] = 1; } torNodes.up();
const torFlow = makePoints(420); modRing.add(torFlow.mesh);
const TFS = Array.from({ length: torFlow.n }, () => ({ u: R() * TAU, v: R() * TAU, du: rr(.15, .5), dv: rr(.6, 1.6) }));
reg('mRing', modRing);
// QUANTUM GRID: Würfelrahmen ums 8³-Feld
const modGrid = new THREE.Group(); root.add(modGrid);
{ const h = MS / 2 + .25, s = []; const c = [-h, h]; for (const x of c) for (const y of c) { s.push(new V3(x, y * .9, -h), new V3(x, y * .9, h)); s.push(new V3(x, -h * .9, y), new V3(x, h * .9, y)); s.push(new V3(-h, x * .9, y), new V3(h, x * .9, y)); } modGrid.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.9, .7, 2.4), .8))); }
reg('mGrid', modGrid);
// FIBONACCI FLOW: goldene Spirale durchs Netz
const modFib = new THREE.Group(); root.add(modFib);
const PHI = (1 + Math.sqrt(5)) / 2;
const fibPts = []; for (let i = 0; i <= 600; i++) { const th = i / 600 * 4.3 * Math.PI; const r = .12 * Math.pow(PHI, th / (Math.PI / 2)); fibPts.push(new V3(Math.cos(th) * r, -.3 + th * .12 - 1.2, Math.sin(th) * r)); }
const fibCurve = new THREE.CatmullRomCurve3(fibPts);
modFib.add(new THREE.Mesh(new THREE.TubeGeometry(fibCurve, 600, .04, 6, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, .4), ...ADD, opacity: 1 })));
{ // goldene Rechtecke (flach)
  const s = []; let x = 0, z = 0, a = .12 * 1.0, dir = 0; const sq = []; let w = .35;
  for (let i = 0; i < 9; i++) { sq.push([x, z, w, dir]); const nx = [[w, 0], [0, w], [-w, 0], [0, -w]][dir]; x += nx[0] * .0; dir = (dir + 1) % 4; w *= PHI; }
  for (let i = 1; i < 8; i++) { const r = .12 * Math.pow(PHI, i); const c = circlePts(r, 120, -1.5); for (let k = 0; k < 120; k += 2) s.push(c[k], c[k + 1]); }
  modFib.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(1.6, 1.0, .3), .35)));
}
const fibFlow = makePoints(260); modFib.add(fibFlow.mesh); const FFS = Array.from({ length: fibFlow.n }, () => ({ s: R(), v: rr(.03, .09) }));
reg('mFib', modFib);
// LORENZ ATTRACTOR: live integriert
const modLor = new THREE.Group(); root.add(modLor);
const LN = 900, LTR = 36, LH = 70;
const lorP = makePoints(LN); modLor.add(lorP.mesh);
const LS = Array.from({ length: LN }, (_, i) => [rr(-15, 15), rr(-15, 15), rr(5, 40)]);
const lorTrG = new THREE.BufferGeometry(); const lorTrPos = new Float32Array(LTR * (LH - 1) * 2 * 3), lorTrCol = new Float32Array(LTR * (LH - 1) * 2 * 3);
lorTrG.setAttribute('position', new THREE.BufferAttribute(lorTrPos, 3)); lorTrG.setAttribute('color', new THREE.BufferAttribute(lorTrCol, 3));
const lorTr = new THREE.LineSegments(lorTrG, vlineMat(.9)); lorTr.frustumCulled = false; modLor.add(lorTr);
const LHIST = Array.from({ length: LTR }, () => []);
function lorMap(s, out) { const k = .3; return out.set((s[0] + s[1]) * .707 * k * .8, (s[2] - 25) * k + .4, (s[0] - s[1]) * .707 * k * .6); }
function lorStep(s, h) { const sg = 10, rh = 28, bt = 8 / 3; const dx = sg * (s[1] - s[0]), dy = s[0] * (rh - s[2]) - s[1], dz = s[0] * s[1] - bt * s[2]; s[0] += dx * h; s[1] += dy * h; s[2] += dz * h; }
for (const s of LS) for (let i = 0; i < 400; i++) lorStep(s, .005);
for (let t = 0; t < LTR; t++) { const p = lorMap(LS[t * 20], new V3()); for (let k = 0; k < LH; k++) LHIST[t].push(p.clone()); }
reg('mLor', modLor);
// NETWORK EXPANSION: Galaxie
const modGal = new THREE.Group(); root.add(modGal);
const galP = makePoints(9000); modGal.add(galP.mesh);
{ for (let i = 0; i < galP.n; i++) { const arm = i % 3, r = 7 + Math.pow(R(), .8) * 30, a = arm / 3 * TAU + Math.log(r / 7) * 2.4 + gauss() * .28 * (1 - r / 45); const y = gauss() * .5 * (1 - r / 50) - .4; galP.pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); const c = _c1.copy(C.cy).lerp(C.vi, sat((r - 7) / 25)).lerp(C.wh, R() < .1 ? .7 : 0); const b = .8 + R() * .9; galP.col.set([c.r * b, c.g * b, c.b * b], i * 3); galP.size[i] = .08 + R() * .16; galP.alpha[i] = .4 + R() * .6; } galP.up(); }
const galCore = glowSprite(new THREE.Color(.6, .5, 1.6), 22, .35); galCore.position.y = -.4; modGal.add(galCore);
reg('mGal', modGal);

// ================================================================ KLANG (generativ, Web Audio)
const PENTA = [130.8, 146.8, 164.8, 196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880];
function buildAudio(ctx) {
  const G = { ctx };
  G.master = ctx.createGain(); G.master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
  G.bus = ctx.createGain(); G.bus.connect(comp); comp.connect(lim); lim.connect(G.master); G.master.connect(ctx.destination);
  if (ctx.createMediaStreamDestination) { G.recDest = ctx.createMediaStreamDestination(); G.master.connect(G.recDest); }
  const sr = ctx.sampleRate, len = Math.floor(sr * 4.2), ir = ctx.createBuffer(2, len, sr);
  const r = rng(77); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 2.4); }
  const conv = ctx.createConvolver(); conv.buffer = ir; G.rev = ctx.createGain(); G.rev.gain.value = .9; const wet = ctx.createGain(); wet.gain.value = .6; G.rev.connect(conv); conv.connect(wet); wet.connect(comp);
  const nb = ctx.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1; G.noise = nb;
  // Drone (folgt Frequency), Quinte + Oktave, Tiefpass öffnet mit Awareness
  const dg = ctx.createGain(); dg.gain.value = 1; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 1; dg.connect(lp); lp.connect(G.bus); const ds = ctx.createGain(); ds.gain.value = .6; lp.connect(ds); ds.connect(G.rev);
  G.trem = ctx.createGain(); G.trem.gain.value = 1; G.trem.connect(dg);
  const lfo = ctx.createOscillator(); lfo.frequency.value = .5; const lfoG = ctx.createGain(); lfoG.gain.value = .25; lfo.connect(lfoG); lfoG.connect(G.trem.gain); lfo.start(); G.lfo = lfo;
  G.osc = []; for (const [mul, type, gv, dt] of [[1, 'sawtooth', .03, -6], [1, 'sawtooth', .03, 6], [1.5, 'triangle', .03, 0], [2, 'sawtooth', .014, 3], [3, 'sine', .012, 0]]) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = 55 * mul; o.detune.value = dt; g.gain.value = gv; o.connect(g); g.connect(G.trem); o.start(); G.osc.push({ o, mul }); }
  G.sub = ctx.createOscillator(); G.sub.frequency.value = 27.5; const sg = ctx.createGain(); sg.gain.value = .08; G.sub.connect(sg); sg.connect(G.bus); G.sub.start();
  // Rauschen für Entropy
  const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true; const nbp = ctx.createBiquadFilter(); nbp.type = 'bandpass'; nbp.frequency.value = 2400; nbp.Q.value = .7; G.ng = ctx.createGain(); G.ng.gain.value = 0; ns.connect(nbp); nbp.connect(G.ng); G.ng.connect(G.bus); ns.start();
  G.lp = lp; return G;
}
function aParams(G, P, lock) {
  const ctx = G.ctx, t = ctx.currentTime; const base = 41.2 * Math.pow(2, P.freq * 1.0);   // E1 .. E2
  for (const v of G.osc) v.o.frequency.setTargetAtTime(base * v.mul * (lock ? 1 : 1 + (1 - P.coh) * .012 * Math.sin(v.mul * 7)), t, .3);
  G.sub.frequency.setTargetAtTime(base / 2, t, .3);
  G.lfo.frequency.setTargetAtTime(.15 + P.freq * 2.2, t, .3);
  G.lp.frequency.setTargetAtTime(280 + P.awa * 1500 + (lock ? 900 : 0), t, .4);
  G.ng.gain.setTargetAtTime(P.ent * P.ent * .02, t, .3);
}
function aOut(G, node, pan, wetv) { const ctx = G.ctx; let n = node; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); n = p; } n.connect(G.bus); if (wetv) { const w = ctx.createGain(); w.gain.value = wetv; n.connect(w); w.connect(G.rev); } }
function aPing(G, when, f, a = .06, dec = 1.6, pan = 0, wetv = .7) { const ctx = G.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(); o.frequency.value = f; o2.frequency.value = f * 2.76; g2.gain.value = .15; o.connect(g); o2.connect(g2); g2.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + dec); aOut(G, g, pan, wetv); o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05); }
function aWhoosh(G, when, dur = 1.8, a = .1, f0 = 250, f1 = 2600) { const ctx = G.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = G.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(f0, when); bp.frequency.exponentialRampToValueAtTime(f1, when + dur * .55); bp.frequency.exponentialRampToValueAtTime(f0 * 1.5, when + dur); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + dur * .5); g.gain.linearRampToValueAtTime(0, when + dur); s.connect(bp); bp.connect(g); aOut(G, g, 0, .6); s.start(when); s.stop(when + dur + .05); }
function aThump(G, when, a = .3) { const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(70, when); o.frequency.exponentialRampToValueAtTime(36, when + .35); o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + .6); aOut(G, g, 0, .15); o.start(when); o.stop(when + .65); }
function aBell(G, when, f, a = .05) { const ctx = G.ctx, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(); c.frequency.value = f; m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 2, when); mg.gain.exponentialRampToValueAtTime(1, when + 1.5); m.connect(mg); mg.connect(c.frequency); c.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + 2.4); aOut(G, g, Math.sin(f) * .6, .9); c.start(when); m.start(when); c.stop(when + 2.5); m.stop(when + 2.5); }
function aChoir(G, when, dur, freqs, a = .05) {
  const ctx = G.ctx; freqs.forEach((f, i) => {
    const g = ctx.createGain(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), mix = ctx.createGain(); f1.type = f2.type = 'bandpass'; f1.frequency.value = 760; f1.Q.value = 5; f2.frequency.value = 1150; f2.Q.value = 6; mix.gain.value = 1;
    const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 4.6 + i * .3; vg.gain.value = f * .006; vib.connect(vg);
    for (const dt of [-8, 8]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = dt; vg.connect(o.frequency); o.connect(f1); o.connect(f2); o.start(when); o.stop(when + dur + .1); }
    f1.connect(mix); f2.connect(mix); mix.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + dur * .35); g.gain.setValueAtTime(a, when + dur * .6); g.gain.linearRampToValueAtTime(0, when + dur);
    aOut(G, g, (i / (freqs.length - 1) - .5) * 1.2, 1.1); vib.start(when); vib.stop(when + dur + .1);
  });
}

// ================================================================ ZUSTAND
const ST = { snd: true, vol: .9 };
try { Object.assign(ST, JSON.parse(localStorage.getItem('qo4') || '{}')); } catch (_) { }
const saveS = () => { try { localStorage.setItem('qo4', JSON.stringify({ snd: ST.snd })); } catch (_) { } };
let started = false, manual = false, lastNow = performance.now(), frameN = 0;
let dimV = 3, dimT = 3, H = 1, iso = null, modK = null, lockF = 0, locked = false, lockT = 0;
const SYS = { touch: true, mmai: true, qres: true, learn: false, ethic: true };
let kFlash = 0, eyeFlash = 0, topoFlash = 0, fieldFlash = 0, synFlash = 0, lastInput = 0, nFired = 0, nArrive = 0;
const ISO = {}; for (const k in GR) ISO[k] = 1;
function toast(t, s = 2.4) { const e = $('toast'); e.textContent = t; e.classList.remove('hide'); e.style.opacity = 1; toastT = s; }
let toastT = 0;

// Elemente (Key Elements) mit Tap-Texten aus dem Konzept
const EL = {
  gp: { n: 'GRAVITY POINT (GP)', s: 'Axonal Network Kernel. Hier beginnt jede Verbindung.', g: ['kernel', 'axon'], t: new V3(0, KY, 0), d: 7.5, ph: 1.22 },
  res: { n: 'RESONANCE CORE', s: 'Wahrnehmung ist Resonanz, nicht Abbild.', g: ['res', 'eye'], t: new V3(0, 0, 0), d: 10.5, ph: 1.35 },
  mesh: { n: 'NEURAL MESH · NEURAL MATTER', s: '8³ Impulse. Jeder Knoten erinnert sich an den letzten Funken.', g: ['mesh'], t: new V3(0, 0, 0), d: 14, ph: 1.15 },
  ring: { n: 'QUANTUM RING', s: 'Resonanzbänder um das Auge. Kohärenz richtet sie aus, Entropie bringt sie zum Flattern.', g: ['ring', 'syn'], t: new V3(0, 0, 0), d: 16, ph: 1.08 },
  field: { n: 'FIELD LAYER · UNIVERSAL FIELD', s: 'Das Netz wächst wie Myzel, ohne Rand.', g: ['field'], t: new V3(0, FIELD_Y + .7, 0), d: 11.5, ph: 1.0 },
  syn: { n: 'SYNAPTIC LINK', s: 'Zwischen zwei Punkten entsteht Bedeutung.', g: ['syn', 'ring'], t: new V3(0, .3, 0), d: 14.5, ph: .9 },
  bridge: { n: 'HARMONIC BRIDGE', s: 'Verbindung zwischen Welten, die gleich schwingen.', g: ['bridge', 'eye', 'ring'], t: new V3(0, 0, 0), d: 12.5, ph: 1.3 },
  eye: { n: 'EYE CORE', s: 'Das Interface sieht zurück.', g: ['eye'], t: new V3(0, 0, 0), d: 6.2, ph: 1.5 }
};

// Dimension: Schwellen pro Gruppe (D0 Punkt → D1 Linie → D2 Ebene → D3 Raum → 4D)
const DTH = { kernel: -9, axis: .45, axon: .55, topo: 1.45, ring: 1.55, syn: 1.75, field: 2.45, eye: 2.35, res: 2.55, mesh: 2.65, bridge: 2.75, dust: 2.5, tess: 3.25, mRing: 1.5, mGrid: 2.5, mFib: 1.5, mLor: 2.5, mGal: 1.5 };
const GAIN = { ring: .55, topo: .5, axon: .75, field: .7, axis: .6, eye: .9, syn: .8, res: .6, kernel: .9, mesh: .75, mRing: .6, mGal: .7 };
const MODG = { ring: 'mRing', grid: 'mGrid', fib: 'mFib', lorenz: 'mLor', galaxy: 'mGal' };
const MODN = { ring: 'RING STRUCTURE (8x8) · Resonance Lattice', grid: 'QUANTUM GRID · 8³ Field', fib: 'FIBONACCI FLOW · Growth Pattern', lorenz: 'LORENZ ATTRACTOR · Dynamic Stability', galaxy: 'NETWORK EXPANSION · Infinite Potential' };
const DNAME = ['D0 POINT', 'D1 LINE', 'D2 PLANE', 'D3 SPACE', '4D TESSERACT'];

// Ethical Core: goldener Ring um das Auge
const ethicRing = lineLoop(circlePts(1.95, 160, 0), lineMat(new THREE.Color(2.4, 1.6, .5), .8)); ethicRing.rotation.x = Math.PI / 2; eyeG.add(ethicRing);
const ethicRing2 = lineLoop(circlePts(1.85, 160, 0), lineMat(new THREE.Color(2.0, 1.3, .4), .4)); eyeG.add(ethicRing2);

// ================================================================ KLANG
const SND = (() => {
  let ctx = null, G = null, pc = 0, pT = 0;
  function unlock() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { ctx = new AC(); G = buildAudio(ctx); } catch (e) { console.warn(e); ctx = null; return; } }
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
    if (ctx.state !== 'running') ctx.resume().catch(() => { });
    vol();
  }
  function vol() { if (!G) return; const v = ST.snd ? ST.vol : (window.__recOn ? .0001 : 0); G.master.gain.setTargetAtTime(v, ctx.currentTime, .2); }
  function on() { return G && ST.snd && ctx.state === 'running'; }
  function ping(f, a = .05, dec = 1.6, pan = 0) { if (!on()) return; const now = ctx.currentTime; if (now - pT > .1) { pT = now; pc = 0; } if (++pc > 3) return; aPing(G, now + .02, f, a, dec, pan, .8); }
  function ev(fn) { if (!on()) return; try { fn(G, ctx.currentTime + .02); } catch (e) { console.warn(e); } }
  function params() { if (G) aParams(G, P, locked); }
  return { unlock, vol, ping, ev, params, recTracks: () => G && G.recDest ? G.recDest.stream.getAudioTracks() : [], get ctx() { return ctx; } };
})();
function sndBtn() { $('bSnd').textContent = ST.snd ? 'TON AN' : 'TON AUS'; $('bSnd').classList.toggle('on', ST.snd); }
$('bSnd').onclick = () => { ST.snd = !ST.snd; if (ST.snd) SND.unlock(); SND.vol(); sndBtn(); saveS(); toast(ST.snd ? 'TON AN · IPHONE: STUMMSCHALTER AUS' : 'TON AUS'); };
sndBtn();

// ================================================================ IMPULSE
const _w = new V3();
function noteFor(y, i = 0) { const k = clamp(Math.round((y + 4.5) / 1.1) + i, 0, PENTA.length - 1); return PENTA[k] * 2; }
function fireKernel(strength = 1) {
  const coh = P.coh; kFlash = 1; nFired++;
  for (const p of MAINS) { if (p.grow < .6) continue; const dl = (1 - coh) * R() * 1.1, v = 5.2 * (1 + P.freq * .5) * (1 + (1 - coh) * (R() - .5) * .9); AXN.fire(p, strength, v, dl); }
  for (const p of DEN) AXN.fire(p, .7 * strength, 3.5, R() * .1);
  SND.ev((G, t) => { aThump(G, t, .32); aWhoosh(G, t + .05, 1.6, .05, 300, 2400); });
}
function fireOne() { const p = MAINS[Math.floor(R() * MAINS.length)]; if (p.grow > .8) AXN.fire(p, .55 + R() * .3, 4.2 + P.freq * 3); }
const mHit = []; // Neural-Mesh-Impulse
function meshTrigger(pos, e = 1) { let bi = 0, bd = 1e9; for (let i = 0; i < M3.length; i += 3) { const d = M3[i].p.distanceToSquared(pos); if (d < bd) { bd = d; bi = i; } } meshKick(bi, e); }
function meshKick(i, e) { const m = M3[i]; if (m.e > e * .9) return; m.e = Math.max(m.e, e); m.mem = 1; if (e > .3) { const nb = MNB[i]; const n = SYS.mmai ? 2 : 1; for (let k = 0; k < n; k++) mHit.push({ i: nb[Math.floor(R() * nb.length)], e: e * (.72 + P.coh * .16), d: .07 + (1 - P.coh) * R() * .12 }); } }
function onAxArrive(p, u) {
  nArrive++;
  if (!p.tg) return;
  const tg = p.tg, end = p.pts[p.n - 1];
  if (tg.type === 'ring') {
    ringAmp = Math.min(1.6, ringAmp + .22 * u.e); synFlash = Math.min(1, synFlash + .2);
    for (const nd of RN) if (nd.qi === tg.qi && nd.p.distanceToSquared(end) < 1.2) nd.fl = 1;
    if (tg.qi < 2 && R() < .7) { const L = BRIDGE_BY_Q[tg.qi].filter(b => b.toEye); BRN.fire(L[Math.floor(R() * L.length)], u.e * .9, 4.2, (1 - P.coh) * R() * .3); }
    meshTrigger(end.clone().multiplyScalar(.55), u.e);
    SND.ping(noteFor(tg.p.y, tg.qi), .045 * u.e, 1.8, clamp(end.x / 6, -1, 1));
  } else if (tg.type === 'eye') { eyeFlash = Math.min(1.5, eyeFlash + .35 * u.e); meshTrigger(end, u.e); SND.ping(PENTA[12] * (locked ? 1 : 1), .04 * u.e, 2.2, 0); }
  else if (tg.type === 'topo') { topoFlash = Math.min(1, topoFlash + .3); SND.ping(PENTA[2], .04 * u.e, 1.4, clamp(end.x / 6, -1, 1)); }
  else if (tg.type === 'field') { fieldFlash = Math.min(1, fieldFlash + .35); const near = MYN.paths.filter(m => !m.parent && m.grow > .3); for (let k = 0; k < 3 && near.length; k++) MYN.fire(near[Math.floor(R() * near.length)], u.e, 2.6); SND.ping(PENTA[10], .035 * u.e, 2.4, clamp(end.x / 6, -1, 1)); }
}
function onBrArrive(p, u) { if (p.toEye) { eyeFlash = Math.min(1.5, eyeFlash + .3 * u.e); SND.ping(PENTA[13], .03 * u.e, 2.6, 0); } }

// ================================================================ UI
const CAL = [
  ['freq', '1 · Frequency', 'Ring-Schwingung, Impulsrate, Tonhöhe'],
  ['coh', '2 · Coherence', 'Ringe ausgerichtet oder chaotisch, Impulse synchron'],
  ['sym', '3 · Symmetry', 'Radiale Symmetrie-Ordnung der Ringe'],
  ['ent', '4 · Entropy', 'Rauschen und Zittern'],
  ['awa', '5 · Awareness', 'Augenglühen, Öffnung, Blickverfolgung'],
  ['exp', '6 · Expansion', 'Universal Field, Myzel-Wachstum']
];
$('cals').innerHTML = CAL.map(([k, n, d]) => `<label class="cal" title="${d}"><span class="cn">${n}</span><span class="cv" id="v_${k}">0.00</span><input type="range" id="s_${k}" min="0" max="1" step="0.01"><span class="cd">${d}</span></label>`).join('');
function setP(k, v, fromUI) { P[k] = clamp(+v, 0, 1); $('v_' + k).textContent = k === 'sym' ? `${P[k].toFixed(2)} · k${3 + Math.round(P.sym * 9)}` : P[k].toFixed(2); if (!fromUI) $('s_' + k).value = P[k]; $('s_' + k).style.setProperty('--p', (P[k] * 100) + '%'); SND.params(); }
for (const [k] of CAL) { const s = $('s_' + k); s.addEventListener('input', () => { setP(k, s.value, true); lastInput = T; }); setP(k, P[k]); }
function setDim(d, instant) { dimT = clamp(d, 0, 4); if (instant) dimV = dimT; $('dimR').value = dimT; document.querySelectorAll('#dims button').forEach(b => b.classList.toggle('on', +b.dataset.d === Math.round(dimT))); }
document.querySelectorAll('#dims button').forEach(b => b.onclick = () => { setDim(+b.dataset.d); SND.ev((G, t) => aWhoosh(G, t, 1.2, .05, 200, 1800)); toast(DNAME[+b.dataset.d]); });
$('dimR').addEventListener('input', e => setDim(+e.target.value));
function setH(h) { H = h; document.querySelectorAll('#hh button').forEach(b => b.classList.toggle('on', +b.dataset.h === h)); if (h === 1) { for (const p of rewiring) { p.rw.ph = 1; } } }
document.querySelectorAll('#hh button').forEach(b => b.onclick = () => { setH(+b.dataset.h); toast(H === 1 ? 'H1 · STABILITY: NETZ HÄLT SEINE FORM' : 'H2 · ADAPTATION: AXONE WACHSEN NEU'); if (H === 2) rewireOne(); });
function setIso(k) {
  iso = iso === k ? null : k;
  document.querySelectorAll('#keys button').forEach(b => b.classList.toggle('on', b.dataset.el === iso));
  if (iso) { const e = EL[iso]; showTip(e.n, e.s); goal.t.copy(e.t); goal.d = e.d * (camera.aspect < 1 ? 1.45 : 1); goal.ph = e.ph; if (iso === 'gp') fireKernel(); if (dimT < 3) setDim(3); SND.ev((G, t) => aBell(G, t, 523.3, .04)); }
  else { hideTip(); overviewGoal(); }
}
document.querySelectorAll('#keys button').forEach(b => b.onclick = () => { setIso(b.dataset.el); closePanels(); });
let tipT = 0; function showTip(t, s) { $('tipT').textContent = t; $('tipX').textContent = s; $('tip').classList.remove('hide'); tipT = 7; }
function hideTip() { $('tip').classList.add('hide'); tipT = 0; }
$('tip').onclick = hideTip;
document.querySelectorAll('#sys button').forEach(b => b.onclick = () => { const k = b.dataset.sys; SYS[k] = !SYS[k]; b.classList.toggle('on', SYS[k]); const n = b.querySelector('span').textContent; toast(`${n.toUpperCase()}: ${SYS[k] ? 'AN' : 'AUS'}`); SND.ev((G, t) => aPing(G, t, SYS[k] ? 880 : 440, .03, .5, 0, .3)); });
const INFO = {
  if: [['Web / API', 'Läuft direkt im Browser mit WebGL2, ohne Installation.'], ['VR / AR', 'Gedacht für räumliches Erleben. Hier als 360° Orbit mit Touch.'], ['Neural Devices', 'Konzept: Neuro-Sensoren könnten den Kernel anregen. Hier nicht angeschlossen.'], ['Biofeedback', 'Konzept: Puls und Atem als Frequency und Coherence. Hier stellvertretend über die Regler.'], ['Global Network', 'Konzept: viele Objekte als ein Netz. Hier ein einzelnes Objekt.']],
  ap: [['Research', 'Ein Denkmodell für Wahrnehmung, Netze und Emergenz.'], ['Education', 'Dimensionen, Attraktoren und Fibonacci zum Anfassen.'], ['Therapy', 'Konzept: ruhige Kohärenz-Übung mit Klang. Kein medizinisches Werkzeug.'], ['Art & Culture', 'Ein lebendes Bild, das auf Berührung antwortet.'], ['Human Rights', 'Ethical Core: Würde und Freiheit als feste Mitte jedes Systems.']],
  ts: [['WebGL2 / Three.js', 'Echtzeit-3D mit Bloom, Qualitätsstufen und Touch-Steuerung.'], ['AI / ML Models', 'Konzept. Hier sichtbar als Hebb-Lernen: Dynamic Learning stärkt benutzte Axone.'], ['Quantum Simulation', 'Konzept. Hier als Bild: Resonanzringe und 4D-Projektion.'], ['Semantic Layer', 'Konzept: Bedeutung entsteht in den Verbindungen, nicht in den Punkten.'], ['Open Source API', 'Konzept: offene Schnittstellen für eigene Module.']]
};
let tab = 'if';
function renderChips() { $('chips').innerHTML = INFO[tab].map(([n], i) => `<button data-i="${i}">${n}</button>`).join(''); $('chips').querySelectorAll('button').forEach(b => b.onclick = () => { $('chips').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('infoT').textContent = INFO[tab][+b.dataset.i][1]; }); $('infoT').textContent = 'Antippen für eine kurze Erklärung.'; }
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { tab = b.dataset.tab; document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b)); renderChips(); });
renderChips();
function setMod(k) {
  modK = modK === k ? null : k;
  document.querySelectorAll('#mods button').forEach(b => b.classList.toggle('on', b.dataset.m === modK));
  if (modK) { toast(MODN[modK]); if (dimT < 3 && modK !== 'fib' && modK !== 'ring') setDim(3); SND.ev((G, t) => aWhoosh(G, t, 1.4, .05, 300, 2200)); }
  if (modK === 'galaxy') { goal.d = camera.aspect < 1 ? 92 : 58; goal.ph = 1.0; goal.t.set(0, 0, 0); }
  else if (!iso) overviewGoal();
}
document.querySelectorAll('#mods button').forEach(b => b.onclick = () => setMod(b.dataset.m));
$('bFire').onclick = () => { fireKernel(); lastInput = T; };
$('bView').onclick = () => { iso = null; document.querySelectorAll('#keys button').forEach(b => b.classList.remove('on')); hideTip(); overviewGoal(); };
function closePanels() { $('pL').classList.remove('open'); $('pR').classList.remove('open'); }
$('bPL').onclick = () => { $('pR').classList.remove('open'); $('pL').classList.toggle('open'); };
$('bPR').onclick = () => { $('pL').classList.remove('open'); $('pR').classList.toggle('open'); };
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closePanels);

// Synergy Matrix: rotierender Metatron-Würfel (2D-Canvas)
const synC = $('synC'), sg2 = synC.getContext('2d');
const MET = [[0, 0, 0]]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; MET.push([Math.cos(a), Math.sin(a), (i % 2 ? .6 : -.6)]); } for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; MET.push([Math.cos(a) * 2, Math.sin(a) * 2, 0]); }
function drawSyn(t) {
  const W = synC.width, Hh = synC.height; sg2.clearRect(0, 0, W, Hh); const s = Hh * .2, cx = W / 2, cy = Hh / 2; const ca = Math.cos(t * .4), sa = Math.sin(t * .4), cb = Math.cos(.35), sb = Math.sin(.35);
  const tl = .5 + .3 * Math.sin(t * .3), ct = Math.cos(tl), st2 = Math.sin(tl);
  const P2 = MET.map(([x, y, z]) => { const X = x * ca - y * sa, Y0 = x * sa + y * ca; const Y = Y0 * ct - z * st2, Z2 = Y0 * st2 + z * ct; const k = 3.2 / (3.2 + Z2 * .5); return [cx + X * s * k, cy + Y * s * k, Z2]; });
  sg2.lineWidth = 1; const gl = .25 + synFlash * .6 + lockF * .4;
  for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) { sg2.strokeStyle = `rgba(${j > 6 && i > 6 ? '255,79,216' : '58,214,255'},${(gl * (i && j ? .55 : .8)).toFixed(3)})`; sg2.beginPath(); sg2.moveTo(P2[i][0], P2[i][1]); sg2.lineTo(P2[j][0], P2[j][1]); sg2.stroke(); }
  for (const [x, y] of P2) { sg2.strokeStyle = 'rgba(122,92,255,.55)'; sg2.beginPath(); sg2.arc(x, y, s * .5, 0, TAU); sg2.stroke(); sg2.fillStyle = '#bff3ff'; sg2.beginPath(); sg2.arc(x, y, 2.2, 0, TAU); sg2.fill(); }
  sg2.fillStyle = 'rgba(200,240,255,.85)'; sg2.font = '600 15px NBMono, monospace'; sg2.textAlign = 'center'; sg2.fillText('HUMAN', W * .14, Hh * .14); sg2.fillText('AI', W * .86, Hh * .14); sg2.fillText('ETHICS', W / 2, Hh * .97);
}

// ================================================================ KAMERA + EINGABE
const cam = { pos: new V3(), tgt: new V3() };
const orb = { th: .35, ph: 1.32, d: 21, t: new V3(0, .2, 0) }, goal = { th: .35, ph: 1.32, d: 21, t: new V3(0, .2, 0) };
function overviewGoal() { goal.ph = 1.32; goal.d = camera.aspect < 1 ? 35 : 26; goal.t.set(0, camera.aspect < 1 ? .2 : .1, 0); if (modK === 'galaxy') { goal.d = camera.aspect < 1 ? 92 : 58; goal.ph = 1.0; } }
function freeCam(dt) {
  const k = 1 - Math.exp(-dt * 3.0); let dth = goal.th - orb.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  orb.th += dth * k; orb.ph = lerp(orb.ph, goal.ph, k); orb.d = lerp(orb.d, goal.d, k); orb.t.lerp(goal.t, k);
  const s = Math.sin(orb.ph); cam.tgt.copy(orb.t); cam.pos.set(orb.t.x + orb.d * s * Math.sin(orb.th), orb.t.y + orb.d * Math.cos(orb.ph), orb.t.z + orb.d * s * Math.cos(orb.th));
  camera.position.copy(cam.pos); camera.lookAt(cam.tgt);
}
const ptr = { x: 0, y: 0, has: false, t: -99 };
const pts = new Map(); let pinch0 = 0, d0 = 0, drag = null;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); d0 = goal.d; } lastInput = T; });
canvas.addEventListener('pointermove', e => {
  ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.has = true; ptr.t = T;
  if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) goal.d = clamp(d0 * pinch0 / d, 3.5, 120); return; }
  if (drag && SYS.touch) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); goal.th -= dx * .006; goal.ph = clamp(goal.ph - dy * .005, .25, 2.85); }
});
function endPtr(e) { const was = pts.size; pts.delete(e.pointerId); if (was === 1 && drag) { if (drag.moved < 10 && performance.now() - drag.t < 500) tapAt(e.clientX, e.clientY); drag = null; } if (pts.size < 2) pinch0 = 0; }
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.d = clamp(goal.d * Math.exp(e.deltaY * .001), 3.5, 120); lastInput = T; }, { passive: false });
const _sp = new V3();
function scr(v) { _sp.copy(v).project(camera); return [(_sp.x * .5 + .5) * innerWidth, (-_sp.y * .5 + .5) * innerHeight, _sp.z]; }
function tapAt(x, y) {
  lastInput = T; ptr.x = x / innerWidth * 2 - 1; ptr.y = -(y / innerHeight) * 2 + 1; ptr.has = true; ptr.t = T;
  const wk = new V3(); kernG.getWorldPosition(wk); const [kx, ky] = scr(wk); const kr = Math.max(46, 1.2 * innerHeight / orb.d * 2.2);
  if (Math.hypot(kx - x, ky - y) < kr) { fireKernel(); showTip(EL.gp.n, EL.gp.s); toast('IMPULS · GRAVITY POINT'); return; }
  const we = new V3(); eyeG.getWorldPosition(we); const [ex, ey] = scr(we); const er = Math.max(40, 1.55 * innerHeight / orb.d * 2.0);
  if (dimV > 2.3 && Math.hypot(ex - x, ey - y) < er) { showTip(EL.eye.n, EL.eye.s); blinkT = 0; eyeFlash = 1; SND.ev((G, t) => aBell(G, t, 659.3, .045)); return; }
  const wf = new V3(0, FIELD_Y + 1.15, 0).applyMatrix4(root.matrixWorld); const [fx, fy] = scr(wf);
  if (dimV > 2.3 && Math.hypot(fx - x, fy - y) < er) { showTip(EL.field.n, EL.field.s); fieldFlash = 1; return; }
  // nächster Ringknoten
  let best = null, bd = 34; for (const nd of RN) { const w = nd.p.clone().applyMatrix4(root.matrixWorld); const [nx, ny, nz] = scr(w); if (nz > 1) continue; const d = Math.hypot(nx - x, ny - y); if (d < bd) { bd = d; best = nd; } }
  if (best) { nd_fl(best); showTip(EL.syn.n, EL.syn.s); SND.ping(noteFor(best.q.y, best.i % 5), .05, 1.6, 0); return; }
  fireOne();
}
function nd_fl(nd) { nd.fl = 1; for (const o of RN) if (o.qi === nd.qi && Math.abs(o.i - nd.i) === 1) o.fl = .6; ringAmp = Math.min(1.5, ringAmp + .3); }

// ================================================================ AUGE
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _ray = new V3(), _lt = new V3(), _ep = new V3(), _up = new V3(0, 1, 0);
let blinkT = 3, openNow = .8;
function updateEye(dt) {
  eyeG.getWorldPosition(_ep);
  const camDist = camera.position.distanceTo(_ep);
  const usePtr = SYS.touch && ptr.has && (T - ptr.t) < 6;
  let tx = 0, ty = 0; if (usePtr) { tx = ptr.x; ty = ptr.y; } else { tx = Math.sin(T * .37) * .25 + Math.sin(T * 1.3) * .05; ty = Math.sin(T * .23) * .15; }
  _ray.set(tx, ty, .5).unproject(camera).sub(camera.position).normalize();
  _lt.copy(camera.position).addScaledVector(_ray, camDist * .8);
  const tr = .15 + .85 * P.awa; _lt.lerp(camera.position, 1 - tr);
  _m4.lookAt(_lt, _ep, _up); _q1.setFromRotationMatrix(_m4);   // +z zeigt zum Ziel
  const pq = new THREE.Quaternion(); eyeG.getWorldQuaternion(pq); _q1.premultiply(pq.invert());
  eyeLook.quaternion.slerp(_q1, 1 - Math.exp(-dt * (2 + P.awa * 8)));
  blinkT -= dt; let bl = 1; if (blinkT < 0) { const k = -blinkT / .22; bl = k < .5 ? 1 - k * 2 : (k - .5) * 2; if (k >= 1) blinkT = 3 + R() * 5; }
  const tgtOpen = clamp(.15 + .85 * P.awa + lockF * .4, 0, 1.2) * clamp(bl, 0, 1);
  openNow += (tgtOpen - openNow) * Math.min(1, dt * 10); setLids(openNow);
  const glow = .5 + P.awa * .8 + eyeFlash * .9 + lockF * .7;
  pupil.material.opacity = Math.min(1, .35 + glow * .35); pupil.scale.setScalar(.38 + P.awa * .22 + eyeFlash * .25 + lockF * .2);
  pupilCore.scale.setScalar(.12 + eyeFlash * .12 + lockF * .1); eyeHalo.material.opacity = (.25 + glow * .22) * GR.eye.f; eyeHalo.scale.setScalar(3.6 + P.awa * 1.2 + lockF * 1.5);
  irisRings.forEach(({ L: r }, i) => { r.rotation.z = T * (.1 + i * .015) * (i % 2 ? 1 : -1); r.scale.setScalar(.85 + .15 * openNow + Math.sin(T * 2 + i) * .01 * (1 + eyeFlash)); });
  eyeFlash = Math.max(0, eyeFlash - dt * 1.2);
}

// ================================================================ RESONANCE LOCK
function updateLock(dt) {
  const want = P.coh > .95 && P.awa >= .99;
  if (want && !locked) { locked = true; lockT = 0; $('lock').classList.remove('hide'); fireKernel(1.2); SND.ev((G, t) => { aChoir(G, t, 6, [220, 277.2, 329.6, 440, 554.4], .05); aBell(G, t, 880, .05); }); SND.params(); }
  if (!want && locked) { locked = false; $('lock').classList.add('hide'); SND.params(); }
  lockF += ((locked ? 1 : 0) - lockF) * Math.min(1, dt * 2);
  if (locked) { lockT += dt; const per = 2.6 - P.freq * 1.4; if (lockT > per) { lockT = 0; fireKernel(1); SND.ev((G, t) => aBell(G, t, 440, .025)); } }
}

// ================================================================ FRAME
let spontA = 0, rewA = 0, symShown = symK, idleFire = 0;
function updateMesh(dt) {
  const f4 = sat(dimV - 3), gridB = MOD.grid, ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent;
  for (let k = mHit.length - 1; k >= 0; k--) { const h = mHit[k]; h.d -= dt; if (h.d <= 0) { mHit.splice(k, 1); meshKick(h.i, h.e); } }
  if (mHit.length > 900) mHit.length = 900;
  const a4 = T * .35 * f4, ex = .92 + P.exp * .16;
  for (let i = 0; i < M3.length; i++) {
    const m = M3[i]; m.e = Math.max(0, m.e - dt * 2.2); m.mem = Math.max(0, m.mem - dt * .12);
    let x = m.b.x * ex, y = m.b.y * ex, z = m.b.z * ex;
    if (f4 > 0) { const v = rot4([x / 2.8, y / 2.8, z / 2.8, m.w], a4, a4 * .7, a4 * .4); const p = proj4(v, 2.8); x = lerp(x, p[0], f4); y = lerp(y, p[1], f4); z = lerp(z, p[2], f4); }
    if (ent > 0) { const j = ent * .22; x += Math.sin(T * 7.1 + i) * j; y += Math.sin(T * 6.3 + i * 1.7) * j; z += Math.sin(T * 5.7 + i * 2.3) * j; }
    m.p.set(x, y, z); meshP.pos[i * 3] = x; meshP.pos[i * 3 + 1] = y; meshP.pos[i * 3 + 2] = z;
    const e = m.e, mm = m.mem * .5, b = .2 + gridB * .7;
    meshP.col[i * 3] = C.vi.r * b + e * 1.6 + mm * .3; meshP.col[i * 3 + 1] = C.vi.g * b + e * 2.2 + mm * .6; meshP.col[i * 3 + 2] = C.vi.b * b + e * 2.6 + mm * .8;
    meshP.size[i] = .055 + e * .15 + gridB * .05; meshP.alpha[i] = .6 + e * .4;
  }
  meshP.up();
  const lp = meshLinkGeo.attributes.position.array, lc = meshLinkGeo.attributes.color.array, lb = .05 + gridB * .3;
  for (let k = 0; k < MLINK.length; k++) { const [a, b] = MLINK[k], A = M3[a], B = M3[b]; const o = k * 6; lp[o] = A.p.x; lp[o + 1] = A.p.y; lp[o + 2] = A.p.z; lp[o + 3] = B.p.x; lp[o + 4] = B.p.y; lp[o + 5] = B.p.z; const e = Math.min(A.e, B.e) * 1.5 + (A.e + B.e) * .2; lc[o] = C.vi.r * lb + e * .9; lc[o + 1] = C.vi.g * lb + e * 1.4; lc[o + 2] = C.vi.b * lb + e * 1.8; lc[o + 3] = lc[o]; lc[o + 4] = lc[o + 1]; lc[o + 5] = lc[o + 2]; }
  meshLinkGeo.attributes.position.needsUpdate = true; meshLinkGeo.attributes.color.needsUpdate = true;
}
function updateNodes(dt) {
  const ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent;
  RN.forEach((nd, i) => { nd.fl = Math.max(0, (nd.fl || 0) - dt * 1.8); const major = nd.i % 4 === 0; const c = major ? C.wh : (nd.qi % 2 ? C.vi : C.cy); const b = (major ? 1.6 : 1.1) + nd.fl * 2.5 + lockF * .6 * (.5 + .5 * Math.sin(T * 6)); nodeP.col[i * 3] = c.r * b; nodeP.col[i * 3 + 1] = c.g * b; nodeP.col[i * 3 + 2] = c.b * b; nodeP.size[i] = (major ? .19 : .11) * (1 + nd.fl * .9); const j = ent * .12; nodeP.pos[i * 3] = nd.p.x + Math.sin(T * 9 + i) * j; nodeP.pos[i * 3 + 1] = nd.p.y + Math.sin(T * 8 + i * 2) * j; nodeP.pos[i * 3 + 2] = nd.p.z + Math.sin(T * 7 + i * 3) * j; });
  nodeP.up();
}
function frame(dt) {
  T += dt; frameN++;
  // Dimension
  dimV += (dimT - dimV) * Math.min(1, dt * 1.6); if (Math.abs(dimT - dimV) < .002) dimV = dimT;
  const sx = Math.max(.002, ease(dimV)), sz = Math.max(.002, ease(dimV - 1)), sy = Math.max(.002, ease(dimV - 2));
  root.scale.set(sx, sy, sz);
  // Module
  for (const k in MOD) MOD[k] += ((modK === k ? 1 : 0) - MOD[k]) * Math.min(1, dt * 2.5);
  // Gruppenfaktoren
  for (const g in GR) {
    const th = DTH[g] ?? 2.5; let f = g === 'kernel' ? 1 : sat((dimV - th) * 1.8);
    if (g === 'tess') f = sat((dimV - 3.05) * 1.6);
    if (MODG.ring && g.startsWith('m')) { const mk = Object.keys(MODG).find(k => MODG[k] === g); f *= MOD[mk] || 0; }
    const it = iso ? (EL[iso].g.includes(g) ? 1 : (g === 'axis' || g === 'dust' || g === 'kernel' ? .25 : .07)) : 1;
    ISO[g] = (ISO[g] ?? 1) + (it - (ISO[g] ?? 1)) * Math.min(1, dt * 3);
    let gal = MOD.galaxy > .01 && (g === 'dust') ? 1 - MOD.galaxy * .7 : 1;
    if (g === 'axis') f *= SYS.mmai ? 1 : .35;
    if (!g.startsWith('m') || g === 'mesh') { const mA = Math.max(MOD.ring, MOD.fib, MOD.lorenz * 1.25) * .62 + MOD.grid * (g === 'mesh' ? -.6 : .55) + MOD.galaxy * .15; f *= clamp(1 - mA, .1, 1.6); }
    GR[g].f = (GAIN[g] ?? 1) * f * ISO[g] * gal * (1 + lockF * .25 * (.5 + .5 * Math.sin(T * 6.28 / 1.2)));
  }
  applyGroups();
  ethicRing.visible = ethicRing2.visible = SYS.ethic && GR.eye.f > .01; ethicRing.material.opacity = .8 * GR.eye.f * (SYS.ethic ? 1 : 0); ethicRing2.material.opacity = .4 * GR.eye.f; ethicRing.rotation.z = T * .2; ethicRing2.rotation.y = -T * .15;
  // Symmetrie
  const k = 3 + Math.round(P.sym * 9); if (k !== symK) { symK = k; buildSyn(); }
  // Ringe
  ringAmp = Math.max(SYS.qres ? .25 + .2 * Math.sin(T * (1 + P.freq * 3)) : 0, ringAmp - dt * 1.2); if (locked) ringAmp = Math.max(ringAmp, .6 + .5 * Math.sin(T * 5.2));
  const coh0 = P.coh; if (locked) P.coh = 1; updateRings(T); P.coh = coh0;
  if (dimV > 3) { const f4 = dimV - 3; ringG.rotation.set(Math.sin(T * .4) * .25 * f4, 0, Math.cos(T * .33) * .2 * f4); synG.rotation.copy(ringG.rotation); } else { ringG.rotation.set(0, 0, 0); synG.rotation.set(0, 0, 0); }
  updateNodes(dt);
  if (GR.tess.f > .004) updateTess(T);
  // Achse (Daten aufwärts)
  for (let i = 0; i < axisP.n; i++) { const s = axisS[i]; s.y += s.v * dt * (.6 + P.freq); if (s.y > 7.6) s.y = -6.5; axisP.pos.set([Math.cos(s.a + T) * s.r, s.y, Math.sin(s.a + T) * s.r], i * 3); const b = 1.2 + Math.sin(s.y * 3 + T * 4) * .4; axisP.col.set([.5 * b, 1.4 * b, 1.8 * b], i * 3); axisP.size[i] = .06; axisP.alpha[i] = .8; } axisP.up();
  topoSpin.forEach(o => o.g.rotation.y = T * o.v);
  // Kernel
  kFlash = Math.max(0, kFlash - dt * 1.4);
  for (let i = 0; i < somaP.n; i++) { const s = SOMA[i], br = 1 + .04 * Math.sin(T * (2 + P.freq * 4) + s.ph) + kFlash * .25 * (1 - s.r); somaP.pos[i * 3] = s.b.x * br; somaP.pos[i * 3 + 1] = s.b.y * br; somaP.pos[i * 3 + 2] = s.b.z * br; } somaP.geo.attributes.position.needsUpdate = true;
  kCore.scale.setScalar(.7 + .1 * Math.sin(T * (2 + P.freq * 4)) + kFlash * 1.0 + lockF * .3); kCore2.material.opacity = (.3 + kFlash * .5) * GR.kernel.f;
  kRings.forEach((r, i) => { r.rotation.x = T * (.3 + i * .17); r.rotation.y = T * (.21 + i * .1) * (i % 2 ? -1 : 1); r.scale.setScalar(1 + kFlash * .3 * (i + 1) / 4); });
  // Spontane Impulse (Frequency) und H2
  spontA += dt * (.25 + P.freq * 3.2) * (SYS.mmai ? 1 : .5); while (spontA > 1) { spontA -= 1; fireOne(); }
  if (H === 2) { rewA += dt; if (rewA > 2.2 - P.freq) { rewA = 0; rewireOne(); } }
  updateRewire(dt);
  if (started && T - lastInput > 14 && !manual) { idleFire += dt; if (idleFire > 7) { idleFire = 0; fireKernel(.9); } }
  AXN.update(dt, onAxArrive, 1 + lockF * .4, SYS.learn); BRN.update(dt, onBrArrive, 1, SYS.learn);
  updateMycel(dt); MYN.update(dt, null, 1 + fieldFlash * .6);
  fieldCore.scale.setScalar(.85 + P.exp * .3); fieldCore.rotation.y = T * .05; fieldFlash = Math.max(0, fieldFlash - dt);
  // Resonanzkugel + Mesh
  resG.rotation.y = T * .12; resG.scale.setScalar(1 + (SYS.qres ? .025 * Math.sin(T * (1.5 + P.freq * 4)) : 0) + lockF * .05 * Math.sin(T * 6.28 / 1.2));
  updateMesh(dt);
  // Staub (Entropy)
  { const ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent; for (let i = 0; i < dust.n; i++) { const d = DS[i]; const j = .15 + ent * 1.1; dust.pos[i * 3] = d.b.x + Math.sin(T * (.5 + ent * 3) + d.ph) * j; dust.pos[i * 3 + 1] = d.b.y + Math.cos(T * (.4 + ent * 2.7) + d.ph * 1.3) * j; dust.pos[i * 3 + 2] = d.b.z + Math.sin(T * (.45 + ent * 3.1) + d.ph * .7) * j; const b = .3 + ent * 1.2; dust.col[i * 3] = d.c.r * b; dust.col[i * 3 + 1] = d.c.g * b; dust.col[i * 3 + 2] = d.c.b * b; dust.size[i] = d.s; dust.alpha[i] = .25 + ent * .7; } dust.up(); }
  synFlash = Math.max(0, synFlash - dt * .8); synMat.opacity = (.22 + synFlash * .3 + lockF * .2) * GR.syn.f;
  topoFlash = Math.max(0, topoFlash - dt);
  // Module animieren
  if (MOD.ring > .01) { modRing.rotation.y = T * .05; for (let i = 0; i < torFlow.n; i++) { const s = TFS[i]; s.u += s.du * dt * (.5 + P.freq); s.v += s.dv * dt * (.5 + P.freq); const p = torusP(s.u, s.v, _w); torFlow.pos.set([p.x, p.y, p.z], i * 3); torFlow.col.set([.8, 1.8, 2.4], i * 3); torFlow.size[i] = .1; torFlow.alpha[i] = .9; } torFlow.up(); for (let i = 0; i < 64; i++) torNodes.size[i] = .18 + .1 * Math.max(0, Math.sin(T * 3 - i * .4)); torNodes.geo.attributes.size.needsUpdate = true; }
  if (MOD.fib > .01) { modFib.rotation.y = -T * .1; for (let i = 0; i < fibFlow.n; i++) { const s = FFS[i]; s.s = (s.s + s.v * dt * (.5 + P.freq * 1.5) * (P.exp + .5)) % 1; const p = fibCurve.getPointAt(s.s, _w); fibFlow.pos.set([p.x, p.y, p.z], i * 3); const b = 1.4 + s.s; fibFlow.col.set([2.4 * b * .7, 1.5 * b * .7, .35], i * 3); fibFlow.size[i] = .08 + s.s * .2; fibFlow.alpha[i] = 1; } fibFlow.up(); }
  if (MOD.lorenz > .01) {
    const steps = 3, h = .0035 * (.6 + P.freq * 1.4);
    for (let i = 0; i < LN; i++) { const s = LS[i]; for (let k2 = 0; k2 < steps; k2++) lorStep(s, h); if (P.ent > .3 && R() < P.ent * .002) { s[0] += gauss(); } const p = lorMap(s, _w); lorP.pos.set([p.x, p.y, p.z], i * 3); const c = _c1.copy(C.cy).lerp(C.mg, sat((s[2] - 10) / 35)); lorP.col.set([c.r * 1.1, c.g * 1.1, c.b * 1.1], i * 3); lorP.size[i] = .1; lorP.alpha[i] = 1; }
    lorP.up();
    for (let t2 = 0; t2 < LTR; t2++) { const Hs = LHIST[t2]; const p = lorMap(LS[t2 * 20], new V3()); Hs.push(p); if (Hs.length > LH) Hs.shift(); }
    let o = 0; for (let t2 = 0; t2 < LTR; t2++) { const Hs = LHIST[t2]; for (let k2 = 0; k2 < LH - 1; k2++) { const a = Hs[Math.min(k2, Hs.length - 1)] || _w, b = Hs[Math.min(k2 + 1, Hs.length - 1)] || _w; const f = k2 / (LH - 1); lorTrPos.set([a.x, a.y, a.z, b.x, b.y, b.z], o * 6); const c = _c1.copy(C.vi).lerp(C.cy, f); const q = f * f * .7; lorTrCol.set([c.r * q, c.g * q, c.b * q, c.r * q, c.g * q, c.b * q], o * 6); o++; } }
    lorTrG.attributes.position.needsUpdate = true; lorTrG.attributes.color.needsUpdate = true;
  }
  if (MOD.galaxy > .01) modGal.rotation.y = T * .03;
  // Auge, Lock, Kamera
  updateLock(dt);
  if (SYS.touch && !drag && T - lastInput > 6 && !iso) goal.th += dt * .045;
  freeCam(dt);
  updateEye(dt);
  stars.mesh.rotation.y = T * .003;
  if (frameN % 2 === 0) drawSyn(T);
  if ((frameN & 7) === 0) statusLine();
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.add('hide'); }
  if (tipT > 0) { tipT -= dt; if (tipT <= 0) hideTip(); }
  if (rec && (frameN & 7) === 0) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; }
}
function statusLine() {
  const d = Math.min(4, Math.round(dimV)); const s = `GP ONLINE · COHERENCE ${P.coh.toFixed(2)} · ENTROPY ${P.ent.toFixed(2)} · ${DNAME[d]} · ${H === 1 ? 'H1 STABILITY' : 'H2 ADAPTATION'}${locked ? ' · RESONANCE LOCK' : ''}`;
  if ($('status').textContent !== s) $('status').textContent = s; $('status').classList.toggle('lk', locked);
}

// ================================================================ REC (Canvas + Ton)
let rec = null, recChunks = [], recStart = 0, recUrl = null;
function pickMime() { if (!window.MediaRecorder) return null; const mp4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4']; const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const safari = /^((?!chrome|chromium|android|crios).)*safari/i.test(navigator.userAgent); const c = safari ? [...mp4, ...webm] : [...webm, ...mp4]; for (const m of c) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) { } } return ''; }
$('bRec').addEventListener('click', () => {
  if (rec) { try { rec.requestData(); } catch (_) { } rec.stop(); return; }
  const mime = pickMime(); if (mime === null || !canvas.captureStream) { toast('REC WIRD VON DIESEM BROWSER NICHT UNTERSTÜTZT'); return; }
  try {
    if (!SND.ctx) SND.unlock(); window.__recOn = true; SND.vol();
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...SND.recTracks()]); window.__recAudio = stream.getAudioTracks().length;
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 12e6 } : { videoBitsPerSecond: 12e6 }); recChunks = [];
    const r = rec;
    r.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
    r.onstop = () => {
      const type = r.mimeType || mime || 'video/webm', ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(recChunks, { type: type.split(';')[0] });
      rec = null; window.__recOn = false; SND.vol(); $('bRec').classList.remove('on');
      if (!blob.size) { $('rectime').classList.add('hide'); toast('REC: KEINE VIDEODATEN, BITTE LÄNGER AUFNEHMEN'); window.__lastRec = { size: 0, type }; return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `eye-of-resonance-v4-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
    toast('REC LÄUFT · NOCHMAL TIPPEN ZUM STOPPEN');
  } catch (err) { rec = null; window.__recOn = false; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});

// ================================================================ QUALITÄT + GRÖSSE
function applyTier(t) {
  tier = t; const Tt = TIERS[t]; renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl; stars.geo.setDrawRange(0, Math.round(stars.n * (.5 + .5 * Tt.amb))); dust.geo.setDrawRange(0, Math.round(dust.n * (.4 + .6 * Tt.amb))); galP.geo.setDrawRange(0, Math.round(galP.n * (.35 + .65 * Tt.amb)));
  resize(); $('bQ').textContent = 'GRAFIK ' + Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 52 : 40; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(), uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of UPT) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  if (!iso) overviewGoal();
}
addEventListener('resize', resize);
$('bQ').onclick = () => { autoQ = false; applyTier((tier + 1) % 4); toast('GRAFIK: ' + TIERS[tier].n); };
applyTier(tier);
orb.d = goal.d; orb.ph = goal.ph; orb.t.copy(goal.t);

let warm = 0, lowT = 0; const fpsWin = [];
function loop(now) {
  requestAnimationFrame(loop);
  if (manual) return;
  let dt = (now - lastNow) / 1000; lastNow = now; if (!(dt > 0)) return; dt = Math.min(dt, .066);
  frame(dt); composer.render();
  if (autoQ && started) {
    warm += dt; fpsWin.push(dt); if (fpsWin.length > 90) fpsWin.shift();
    if (warm > 4 && fpsWin.length >= 60) { const fps = fpsWin.length / fpsWin.reduce((a, b) => a + b, 0); if (fps < 40) { lowT += dt; if (lowT > 3 && tier < 3) { applyTier(tier + 1); toast('GRAFIK: ' + TIERS[tier].n); lowT = 0; fpsWin.length = 0; warm = 2; } } else lowT = Math.max(0, lowT - dt); }
  }
}

// ================================================================ START
function enter() {
  if (started) return; started = true; lastInput = T; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  if (ST.snd) SND.unlock(); SND.params();
  setDim(0, true); setTimeout(() => setDim(3), 400);
  setTimeout(() => fireKernel(), 2600);
  toast('TIPPE DEN GRAVITY POINT AN · DAS AUGE FOLGT DIR', 4.5);
}
$('go').onclick = enter;
try { await Promise.race([document.fonts.load('600 40px NBMono'), new Promise(r => setTimeout(r, 2000))]); } catch (_) { }
if (Q.has('dim')) setDim(+Q.get('dim'), true);
for (let i = 0; i < 40; i++) frame(1 / 60);
$('go').disabled = false; $('go').textContent = 'INITIALIZE';
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && !Q.has('nosw') && !VIDEO) { const regSW = () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }); if (document.readyState === 'complete') regSW(); else addEventListener('load', regSW); }

// Test-Schnittstelle
window.__V4 = {
  ready: true, get state() { return { dimV, H, iso, modK, locked, lockF, P: { ...P }, symK, tier: TIERS[tier].n, pulses: AXN.pulses.length + BRN.pulses.length + MYN.pulses.length, nFired, nArrive, rewiring: rewiring.length, sys: { ...SYS } }; },
  setManual(v) { manual = v; }, step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) frame(dt); composer.render(); },
  fire: fireKernel, set: setP, dim: setDim, mod: setMod, el: setIso, h: setH, enter,
  cam(th, ph, d, t) { goal.th = orb.th = th; goal.ph = orb.ph = ph; goal.d = orb.d = d; if (t) { goal.t.set(...t); orb.t.set(...t); } },
  pointer(x, y) { ptr.x = x; ptr.y = y; ptr.has = true; ptr.t = T; }, tier(t) { autoQ = false; applyTier(t); },
  _d: { GR, applyGroups, render: () => composer.render(), root, scene },
  dbg: () => ({ draw: renderer.info.render.calls, tri: renderer.info.render.triangles, pts: renderer.info.render.points, lines: renderer.info.render.lines })
};
