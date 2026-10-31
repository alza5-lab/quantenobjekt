// DIE ARCHITEKTUR DER KI // 3D-Videosystem · shivas_ocean · Luca Matteo Balzano 1991
// Konzept: Luca · Story/UI: MindDrop · Look: Creator 2 · Build: 9D · Agent ProtOtype_
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
if (VIDEO) { document.documentElement.classList.add('video'); if (innerHeight > innerWidth) document.documentElement.classList.add('portrait'); }

// ---------------------------------------------------------------- palette (Konzept: Cyan #3ad6ff, Violett #7a5cff, Gold #ffc24a)
const C = { cy: new THREE.Color('#3ad6ff'), vi: new THREE.Color('#7a5cff'), au: new THREE.Color('#ffc24a'), wh: new THREE.Color('#ffffff'), bl: new THREE.Color('#2f6bff'), pk: new THREE.Color('#ff5ad1'), or: new THREE.Color('#ff8a3a') };
const RAIN = [new THREE.Color('#7a5cff'), new THREE.Color('#3a7bff'), new THREE.Color('#3ad6ff'), new THREE.Color('#ffc24a'), new THREE.Color('#ff7a3a'), new THREE.Color('#ff5ad1')];
function rainbow(u, out = new THREE.Color()) { u = ((u % 1) + 1) % 1; const f = u * (RAIN.length - 1), i = Math.floor(f); return out.copy(RAIN[i]).lerp(RAIN[Math.min(RAIN.length - 1, i + 1)], f - i); }
const GLSL_RAIN = `
vec3 rainbow(float u){ u=clamp(u,0.,1.)*5.;
 vec3 c0=vec3(.478,.361,1.),c1=vec3(.227,.482,1.),c2=vec3(.227,.839,1.),c3=vec3(1.,.761,.29),c4=vec3(1.,.478,.227),c5=vec3(1.,.353,.82);
 if(u<1.) return mix(c0,c1,u); if(u<2.) return mix(c1,c2,u-1.); if(u<3.) return mix(c2,c3,u-2.); if(u<4.) return mix(c3,c4,u-3.); return mix(c4,c5,u-4.); }`;

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') || VIDEO });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 600);
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .55, .42, .3);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 4, bl: .55, amb: 1 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 2, bl: .5, amb: .8 },
  { n: 'MITTEL', pr: 1, s: 0, bl: .45, amb: .6 },
  { n: 'NIEDRIG', pr: .75, s: 0, bl: .4, amb: .4 }];
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

// ---------------------------------------------------------------- space background: stars, nebula, galaxies
const stars = (() => {
  const n = 5200, P = makePoints(n);
  for (let i = 0; i < n; i++) {
    const u = rr(-1, 1), a = rr(0, TAU), r = rr(160, 260), s = Math.sqrt(1 - u * u);
    P.pos.set([Math.cos(a) * s * r, u * r * .8, Math.sin(a) * s * r], i * 3);
    const c = R() < .7 ? new THREE.Color(.85, .9, 1) : R() < .5 ? C.vi.clone() : C.au.clone(); const k = rr(.35, 1.1);
    P.col.set([c.r * k, c.g * k, c.b * k], i * 3); P.size[i] = rr(.4, 1.5) * (R() < .03 ? 2.4 : 1); P.alpha[i] = rr(.4, 1);
  }
  P.up(); scene.add(P.mesh); return P;
})();
const galaxyTex = ctex(256, 256, (g, w) => {
  g.translate(w / 2, w / 2);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(255,240,220,1)'); gr.addColorStop(.12, 'rgba(255,200,140,.6)'); gr.addColorStop(.5, 'rgba(110,90,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w);
  for (let i = 0; i < 2600; i++) { const arm = i % 2, t = Math.random() * 4.2, r = 6 + t * 26 + Math.random() * 8, a = t * 1.2 + arm * Math.PI + (Math.random() - .5) * .5; g.fillStyle = `rgba(${150 + Math.random() * 100 | 0},${170 + Math.random() * 80 | 0},255,${.25 * (1 - t / 4.4)})`; g.fillRect(Math.cos(a) * r, Math.sin(a) * r * .55, 1.6, 1.6); }
});
const nebTex = ctex(256, 256, (g, w) => { for (let i = 0; i < 60; i++) { const x = w / 2 + (Math.random() - .5) * w * .5, y = w / 2 + (Math.random() - .5) * w * .5, r = 20 + Math.random() * 70; const gr = g.createRadialGradient(x, y, 0, x, y, r); const c = Math.random() < .5 ? '122,92,255' : Math.random() < .5 ? '47,107,255' : '255,140,90'; gr.addColorStop(0, `rgba(${c},.10)`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(0, 0, w, w); } });
for (const [x, y, z, s, rot] of [[-70, 38, -120, 34, .4], [85, 30, -110, 24, -.6], [40, 60, -150, 18, 1.2], [-110, -10, -60, 20, 2]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: galaxyTex, ...ADD, opacity: .9 })); m.position.set(x, y, z); m.lookAt(0, 0, 0); m.rotateZ(rot); scene.add(m);
}
for (const [x, y, z, s] of [[-60, 20, -90, 140], [70, -5, -100, 150], [0, 40, -140, 160], [20, -30, -80, 120]]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ map: nebTex, ...ADD, opacity: .16, depthWrite: false })); m.position.set(x, y, z); m.lookAt(0, 0, 0); m.visible = false; scene.add(m);
}

// ================================================================ LAYOUT (world units)
const LY = [4.6, 3.45, 2.3, 1.15, 0];          // Embedding (oben) → Output-Layer (unten)
const LNAME = [['EMBEDDING LAYER', 'semantische Abbildung'], ['TRANSFORMER-BLOCK', 'Attention'], ['TRANSFORMER-BLOCK', 'Feedforward'], ['DIE ZWIEBEL', 'mehrschichtige Repräsentation'], ['OUTPUT-LAYER', 'Distribution über Tokens']];
const NL = 5, NN = 16, HALF = 2.2;
const WIN = { a: new V3(-21, 4.9, 0), b: new V3(-10.2, 4.9, 0) };   // Input-Welle
const WOUT = { a: new V3(6.1, .8, 0), b: new V3(21, .8, 0) };     // Output-Welle
const VC = new V3(-7, 4.95, 0);                                    // Vektorraum
const WM = new V3(-7.3, 1.7, 0);                                   // Gewichtsmatrix
const OB = new V3(8.8, 6.4, -.6);                                  // Blackbox
const FY = -2.2;                                                   // Fibonacci-Boden
const EP = new V3(0, -5.3, 4.6);                                   // Emergenz-Portal
const CH = new V3(-9.6, -2.05, 5.2), QA = new V3(9.6, -.9, 5.2);   // Chip, Qubit

// ================================================================ TOWER
const tower = new THREE.Group(); scene.add(tower);
const netTex = (seed) => ctex(512, 512, (g, w) => {
  const r = rng(seed); const pts = []; for (let i = 0; i < 70; i++) pts.push([r() * w, r() * w]);
  g.globalCompositeOperation = 'lighter';
  for (const [x, y] of pts) for (const [x2, y2] of pts) { const d = Math.hypot(x - x2, y - y2); if (d > 2 && d < 120 && r() < .5) { g.strokeStyle = r() < .3 ? `rgba(255,194,74,${.25 * (1 - d / 120)})` : `rgba(150,120,255,${.35 * (1 - d / 120)})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); } }
  for (let i = 0; i < 260; i++) { g.fillStyle = r() < .3 ? 'rgba(255,210,140,.5)' : 'rgba(170,150,255,.45)'; g.fillRect(r() * w, r() * w, 1.5, 1.5); }
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w * .7); gr.addColorStop(0, 'rgba(255,190,90,.22)'); gr.addColorStop(.4, 'rgba(110,80,255,.10)'); gr.addColorStop(1, 'rgba(60,40,200,.04)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
function roundRect(s, r) { const sh = new THREE.Shape(), h = s / 2; sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r); sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h); sh.lineTo(-h + r, h); sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h); return sh; }
const slabShape = roundRect(HALF * 2, .38);
const slabGeo = new THREE.ExtrudeGeometry(slabShape, { depth: .16, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2, curveSegments: 6 });
slabGeo.rotateX(-Math.PI / 2); slabGeo.translate(0, -.08, 0);
const outlinePts = slabShape.getPoints(10).map(p => new V3(p.x, 0, -p.y));
const LAYERS = [];
for (let L = 0; L < NL; L++) {
  const g = new THREE.Group(); g.position.y = LY[L]; tower.add(g);
  const glassM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.22, .14, .62), opacity: .07, ...ADD, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(slabGeo, glassM));
  const faceM = new THREE.MeshBasicMaterial({ map: netTex(100 + L), opacity: .5, ...ADD, side: THREE.DoubleSide });
  const face = new THREE.Mesh(new THREE.ShapeGeometry(slabShape), faceM); face.rotation.x = -Math.PI / 2; face.position.y = .1; g.add(face);
  const edgeM = new THREE.LineBasicMaterial({ color: new THREE.Color(.62, .55, 1.35), opacity: .9, ...ADD });
  for (const y of [.11, -.11]) { const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(outlinePts), edgeM); ln.position.y = y; g.add(ln); }
  const nodes = [];
  const r2 = rng(500 + L);
  for (let i = 0; i < NN; i++) { const gx = i % 4, gz = i / 4 | 0; nodes.push(new V3((gx - 1.5) * 1.1 + (r2() - .5) * .42, .14, (gz - 1.5) * 1.1 + (r2() - .5) * .42)); }
  LAYERS.push({ g, glassM, faceM, edgeM, nodes, glow: new Float32Array(NN), flash: 0 });
}
const nodeW = (L, i, out = new V3()) => out.copy(LAYERS[L].nodes[i]).add(new V3(0, LY[L], 0));
// nodes: instanced spheres + glow points
const nodeGold = []; { const r3 = rng(77); for (let i = 0; i < NL * NN; i++) nodeGold.push(r3() < .55); }
const nodeMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.085, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff }), NL * NN);
const nodeGlowP = makePoints(NL * NN);
{ const m = new THREE.Matrix4(), v = new V3(); for (let L = 0; L < NL; L++) for (let i = 0; i < NN; i++) { const k = L * NN + i; nodeW(L, i, v); m.makeTranslation(v.x, v.y, v.z); nodeMesh.setMatrixAt(k, m); nodeGlowP.pos.set([v.x, v.y, v.z], k * 3); const c = nodeGold[k] ? C.au : C.vi; nodeMesh.setColorAt(k, c.clone().multiplyScalar(1.6)); } }
tower.add(nodeMesh); scene.add(nodeGlowP.mesh);
// static connections: intra-layer web + inter-layer links
const LINKS = []; // [L,i,L2,j]
{
  const r4 = rng(4242);
  for (let L = 0; L < NL; L++) for (let i = 0; i < NN; i++) {
    const a = LAYERS[L].nodes[i]; const near = LAYERS[L].nodes.map((b, j) => [a.distanceTo(b), j]).filter(x => x[1] !== i).sort((x, y) => x[0] - y[0]);
    for (let k = 0; k < 3; k++) if (near[k][1] > i || k === 0) LINKS.push([L, i, L, near[k][1]]);
    if (L < NL - 1) { const used = new Set(); for (let k = 0; k < 3; k++) { let j = r4() * NN | 0; if (used.has(j)) continue; used.add(j); LINKS.push([L, i, L + 1, j]); } }
  }
}
const linkGeo = new THREE.BufferGeometry(); {
  const p = new Float32Array(LINKS.length * 6), c = new Float32Array(LINKS.length * 6), a = new V3(), b = new V3();
  LINKS.forEach(([L, i, L2, j], k) => { nodeW(L, i, a); nodeW(L2, j, b); p.set([a.x, a.y, a.z, b.x, b.y, b.z], k * 6); const col = (L === L2 ? (k % 3 ? C.vi : C.au) : (k % 2 ? C.au : C.vi)).clone().multiplyScalar(L === L2 ? .35 : .22); c.set([col.r, col.g, col.b, col.r, col.g, col.b], k * 6); });
  linkGeo.setAttribute('position', new THREE.BufferAttribute(p, 3)); linkGeo.setAttribute('color', new THREE.BufferAttribute(c, 3));
}
const linkMat = vlineMat(1); tower.add(new THREE.LineSegments(linkGeo, linkMat));
// dynamic highlight lines (attention arcs, flows)
const HL_MAX = 1400;
const hlGeo = new THREE.BufferGeometry(); const hlPos = new Float32Array(HL_MAX * 6), hlCol = new Float32Array(HL_MAX * 6);
hlGeo.setAttribute('position', new THREE.BufferAttribute(hlPos, 3)); hlGeo.setAttribute('color', new THREE.BufferAttribute(hlCol, 3));
const hlLines = new THREE.LineSegments(hlGeo, vlineMat(1)); hlLines.frustumCulled = false; scene.add(hlLines);
let hlN = 0; const _hc = new THREE.Color();
function hl(a, b, col, k, bend = 0) {
  if (k < .01) return;
  if (bend) { // arc made of 8 segments
    const m = new V3().addVectors(a, b).multiplyScalar(.5); m.y += bend; let prev = a.clone();
    for (let s = 1; s <= 8; s++) { const t = s / 8, q = new V3().copy(a).multiplyScalar((1 - t) * (1 - t)).addScaledVector(m, 2 * t * (1 - t)).addScaledVector(b, t * t); hlSeg(prev, q, col, k); prev = q; }
  } else hlSeg(a, b, col, k);
}
function hlSeg(a, b, col, k) { if (hlN >= HL_MAX) return; hlPos.set([a.x, a.y, a.z, b.x, b.y, b.z], hlN * 6); _hc.copy(col).multiplyScalar(k); hlCol.set([_hc.r, _hc.g, _hc.b, _hc.r, _hc.g, _hc.b], hlN * 6); hlN++; }

// golden central beam
const beamCore = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 8.4, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.0, .35), ...ADD }));
beamCore.position.y = 2.6; tower.add(beamCore);
const beamGlowM = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .32, .1), opacity: .26, ...ADD, side: THREE.DoubleSide });
const beamGlow = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, 8.4, 16, 1, true), beamGlowM); beamGlow.position.y = 2.6; tower.add(beamGlow);
for (const L of LY) { const s = glowSprite(new THREE.Color(1, .75, .35), 1.0, .8); s.position.set(0, L + .12, 0); tower.add(s); }
// halo top
const ringTex = ctex(512, 512, (g, w) => { g.translate(w / 2, w / 2); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const r = 60 + i * 7.5 + Math.random() * 3; g.strokeStyle = i % 4 === 0 ? 'rgba(255,200,110,.9)' : i % 3 === 0 ? 'rgba(140,110,255,.55)' : 'rgba(255,190,90,.25)'; g.lineWidth = i % 4 === 0 ? 3 : 1; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); } const gr = g.createRadialGradient(0, 0, 0, 0, 0, w / 2); gr.addColorStop(0, 'rgba(255,220,150,.0)'); gr.addColorStop(.2, 'rgba(255,200,120,.25)'); gr.addColorStop(.5, 'rgba(120,90,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-w / 2, -w / 2, w, w); });
const halo = new THREE.Group(); halo.position.y = 5.75; tower.add(halo);
const haloDisc = new THREE.Mesh(new THREE.CircleGeometry(2.1, 64), new THREE.MeshBasicMaterial({ map: ringTex, ...ADD, side: THREE.DoubleSide, opacity: .95 })); haloDisc.rotation.x = -Math.PI / 2; halo.add(haloDisc);
const haloT1 = new THREE.Mesh(new THREE.TorusGeometry(1.55, .028, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.5, .6), ...ADD })); haloT1.rotation.x = Math.PI / 2; halo.add(haloT1);
const haloT2 = new THREE.Mesh(new THREE.TorusGeometry(.75, .02, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, .7), ...ADD })); haloT2.rotation.x = Math.PI / 2; halo.add(haloT2);
// swirl portal shader (bottom + emergence)
function swirlMat(cA, cB, arms = 3) {
  return new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uK: { value: 1 }, uA: { value: cA }, uB: { value: cB }, uArms: { value: arms } }, ...ADD, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec2 vUv; uniform float uT,uK,uArms; uniform vec3 uA,uB;
    void main(){ vec2 p=vUv*2.-1.; float r=length(p); if(r>1.) discard; float a=atan(p.y,p.x);
      float s=sin(a*uArms+log(r+.002)*7.-uT*1.4); float arms=pow(.5+.5*s,5.);
      float rings=pow(.5+.5*sin(r*46.-uT*2.2),10.)*.5;
      float fall=smoothstep(1.,.25,r);
      vec3 c=mix(uA,uB,smoothstep(.75,.12,r));
      vec3 col=c*(arms*.9+rings)*fall + vec3(1.,.9,.72)*pow(smoothstep(.28,0.,r),2.)*1.6;
      gl_FragColor=vec4(col*uK,1.); }`
  });
}
const portalM = swirlMat(new THREE.Vector3(.48, .36, 1), new THREE.Vector3(1, .76, .29), 3);
const portal = new THREE.Mesh(new THREE.CircleGeometry(3.4, 96), portalM); portal.rotation.x = -Math.PI / 2; portal.position.y = -.85; tower.add(portal);
for (const [r, c] of [[2.6, new THREE.Color(1.6, 1.05, .4)], [3.25, new THREE.Color(.6, .45, 1.6)], [1.6, new THREE.Color(.8, .6, 1.8)]]) { const t = new THREE.Mesh(new THREE.TorusGeometry(r, .018, 6, 128), new THREE.MeshBasicMaterial({ color: c, ...ADD })); t.rotation.x = Math.PI / 2; t.position.y = -.84; tower.add(t); }
const towerGlow = glowSprite(new THREE.Color(.45, .3, 1), 13, .22); towerGlow.position.set(0, 2.4, -1); scene.add(towerGlow);
// layer labels (left side)
const layerLabels = [];

// ================================================================ WAVES (Input / Output) // rainbow strands
const WSTR = 16, WSEG = 170;
function waveY(u, s, t, dir) { const env = Math.pow(Math.sin(Math.PI * u), .6), k = 9 + s * .35, ph = s * .45; return [env * (Math.sin(u * k - t * 2.2 * dir + ph) * .8 + .25 * Math.sin(u * 23 + t * 1.3 + s)), env * .6 * Math.cos(u * k * .7 - t * 1.7 + ph * 1.3)]; }
function makeWave(A, B, amp, dir, hueOff) {
  const n = WSTR * WSEG * 2, u = new Float32Array(n), s = new Float32Array(n), p = new Float32Array(n * 3);
  let k = 0; for (let st = 0; st < WSTR; st++) for (let i = 0; i < WSEG; i++) { for (const d of [0, 1]) { u[k] = (i + d) / WSEG; s[k] = st; k++; } }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('aU', new THREE.BufferAttribute(u, 1)); geo.setAttribute('aS', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uAmp: { value: amp }, uK: { value: 1 }, uDir: { value: dir }, uA: { value: A }, uB: { value: B }, uPulse: { value: -1 }, uHue: { value: hueOff } }, ...ADD,
    vertexShader: GLSL_RAIN + `attribute float aU; attribute float aS; uniform float uT,uAmp,uK,uDir,uPulse,uHue; uniform vec3 uA,uB; varying vec3 vC; varying float vA;
      void main(){ float u=aU; vec3 p=mix(uA,uB,u); float env=pow(sin(3.14159*u),.6); float k=9.+aS*.35, ph=aS*.45;
        p.y+=uAmp*env*(sin(u*k-uT*2.2*uDir+ph)*.8+.25*sin(u*23.+uT*1.3+aS)); p.z+=uAmp*env*.6*cos(u*k*.7-uT*1.7+ph*1.3);
        vC=rainbow(fract(uHue+u*.9+aS*.012)); vA=env*uK*(.32+.22*sin(aS*1.7)) + (uPulse>-.5? exp(-pow((u-uPulse)*9.,2.))*1.4*env:0.);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ gl_FragColor=vec4(vC*vA,1.); }`
  });
  const m = new THREE.LineSegments(geo, mat); m.frustumCulled = false; scene.add(m);
  return { m, mat, A, B, amp, dir, pt(u, s, t, out = new V3()) { const [dy, dz] = waveY(u, s, t, dir); return out.copy(A).lerp(B, u).add(new V3(0, amp * dy, amp * dz)); } };
}
const waveIn = makeWave(WIN.a, WIN.b, .75, 1, 0);
const waveOut = makeWave(WOUT.a, WOUT.b, .75, 1, .05);
// faint wave particles sparkle
const waveDust = makePoints(420);

// ================================================================ TOKEN CUBES
const TOKMAX = 24;
const cubeGeo = new THREE.BoxGeometry(.34, .34, .34), cubeEdge = new THREE.EdgesGeometry(cubeGeo);
const CUBES = [];
for (let i = 0; i < TOKMAX; i++) {
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  const m = new THREE.Mesh(cubeGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: .22, ...ADD })); g.add(m);
  const e = new THREE.LineSegments(cubeEdge, new THREE.LineBasicMaterial({ color: 0xffffff, ...ADD })); g.add(e);
  const cv = document.createElement('canvas'); cv.width = 320; cv.height = 112; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); lab.scale.set(.98, .34, 1); lab.center.set(1, .5); lab.position.set(-.3, 0, 0); g.add(lab);
  CUBES.push({ g, m, e, lab, cv, tex, owner: null });
}
function cubeLabel(c, txt, id, col) {
  const g = c.cv.getContext('2d'); g.clearRect(0, 0, 320, 112); g.textAlign = 'right'; g.textBaseline = 'middle';
  g.font = `600 40px ${FONT}`; g.shadowColor = '#' + col.getHexString(); g.shadowBlur = 14; g.fillStyle = '#fff'; g.fillText(txt.replace(/ /g, '·'), 312, 38);
  g.font = `400 26px ${FONT}`; g.shadowBlur = 0; g.fillStyle = 'rgba(200,215,255,.75)'; g.fillText('#' + id, 312, 84); c.tex.needsUpdate = true;
}

// ================================================================ VEKTORRAUM (point cloud in high-dim space)
const vecG = new THREE.Group(); vecG.position.copy(VC); scene.add(vecG);
{
  const s = 1.35, o = new V3(-s, -s, -s);
  const ax = [[o, new V3(s + .3, -s, -s), C.cy], [o, new V3(-s, s + .3, -s), C.au], [o, new V3(-s, -s, s + .3), C.vi]];
  for (const [a, b, c] of ax) { vecG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(c.clone().multiplyScalar(1.3), .9))); const cone = new THREE.Mesh(new THREE.ConeGeometry(.05, .16, 10), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.5) })); cone.position.copy(b); cone.lookAt(b.clone().add(b.clone().sub(a))); cone.rotateX(Math.PI / 2); vecG.add(cone); }
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(s * 2, s * 2, s * 2)), lineMat(new THREE.Color(.35, .4, .8), .25)); vecG.add(box);
  const gp = []; for (let i = 0; i <= 6; i++) { const v = -s + i * s / 3; gp.push(new V3(v, -s, -s), new V3(v, -s, s), new V3(-s, -s, v), new V3(s, -s, v)); }
  vecG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gp), lineMat(new THREE.Color(.3, .35, .7), .18)));
}
const VCL = []; for (let i = 0; i < 8; i++) VCL.push(new V3(rr(-.9, .9), rr(-.9, .9), rr(-.9, .9)));
const vecPts = makePoints(760, { size: .055 });
for (let i = 0; i < 760; i++) { const k = i % 8, c = VCL[k]; const p = new V3(c.x + gauss() * .2, c.y + gauss() * .2, c.z + gauss() * .2).clampScalar(-1.3, 1.3); vecPts.pos.set([p.x, p.y, p.z], i * 3); const col = rainbow(k / 8); vecPts.col.set([col.r, col.g, col.b], i * 3); vecPts.alpha[i] = rr(.35, .9); vecPts.size[i] = rr(.035, .075); }
vecPts.up(); vecG.add(vecPts.mesh);
function vecPosFor(id, out = new V3()) { const r = rng(id); const c = VCL[id % 8]; return out.set(c.x + (r() - .5) * .35, c.y + (r() - .5) * .35, c.z + (r() - .5) * .35).add(VC); }

// ================================================================ GEWICHTSMATRIX (heatmap)
const WCOLS = 12, WROWS = 7, WCELL = .3;
const wmG = new THREE.Group(); wmG.position.copy(WM); scene.add(wmG);
const wmMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(WCELL * .88, WCELL * .88), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .92, side: THREE.DoubleSide }), WCOLS * WROWS);
const W = { v: new Float32Array(WCOLS * WROWS), tg: new Float32Array(WCOLS * WROWS), ph: new Float32Array(WCOLS * WROWS), fl: new Float32Array(WCOLS * WROWS), upd: 0, wave: -1 };
{ const m = new THREE.Matrix4(); for (let r = 0; r < WROWS; r++) for (let c = 0; c < WCOLS; c++) { const k = r * WCOLS + c; m.makeTranslation((c - (WCOLS - 1) / 2) * WCELL, ((WROWS - 1) / 2 - r) * WCELL, 0); wmMesh.setMatrixAt(k, m); W.v[k] = W.tg[k] = R(); W.ph[k] = rr(0, TAU); wmMesh.setColorAt(k, new THREE.Color()); } }
wmG.add(wmMesh);
{ const w = WCOLS * WCELL / 2 + .08, h = WROWS * WCELL / 2 + .08; const fr = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new V3(-w, -h, 0), new V3(w, -h, 0), new V3(w, h, 0), new V3(-w, h, 0)]), lineMat(new THREE.Color(1.4, 1, .4), .85)); wmG.add(fr); }
const wColA = new THREE.Color(.04, .1, .42), wColB = new THREE.Color(.15, .65, 1.1), wColC = new THREE.Color(1.5, 1.05, .32), _wc = new THREE.Color();
function wColor(v, f, out) { if (v < .55) out.copy(wColA).lerp(wColB, v / .55); else out.copy(wColB).lerp(wColC, (v - .55) / .45); out.multiplyScalar(.62); return out.lerp(C.wh, Math.min(.4, f * .5)); }
// weight lines matrix → tower
const WLINK = []; { const r5 = rng(9); for (let i = 0; i < 14; i++) { const row = r5() * WROWS | 0, L = 1 + (r5() * 3 | 0); const cands = LAYERS[L].nodes.map((n, j) => [n.x, j]).sort((a, b) => a[0] - b[0]); WLINK.push({ row, L, j: cands[r5() * 5 | 0][1], k: row * WCOLS + WCOLS - 1 }); } }

// ================================================================ OUTPUT-VERTEILUNG (Balken)
const NB = 5, BAR0 = new V3(2.95, -.12, .9), BARD = .5, BARH = 1.7;
const barG = new THREE.Group(); scene.add(barG);
const BARS = [];
for (let i = 0; i < NB; i++) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(.3, 1, .3), new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: .65, ...ADD })); m.geometry.translate(0, .5, 0);
  m.position.set(BAR0.x + i * BARD, BAR0.y, BAR0.z); barG.add(m);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, ...ADD })); m.add(e);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const lab = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false })); lab.scale.set(.62, .23, 1); lab.position.set(BAR0.x + i * BARD, BAR0.y - .2, BAR0.z + .05); barG.add(lab);
  BARS.push({ m, e, lab, cv, tex, h: .1, p: .1, word: '' });
}
{ const a = BAR0.clone().add(new V3(-.3, 0, 0)), b = BAR0.clone().add(new V3(BARD * (NB - 1) + .3, 0, 0)); barG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), lineMat(new THREE.Color(1.4, 1, .4), .9))); }
function barLabel(b, word, p, win) { const g = b.cv.getContext('2d'); g.clearRect(0, 0, 256, 96); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `${win ? 600 : 400} 30px ${FONT}`; g.fillStyle = win ? '#ffd27a' : '#cfe8ff'; g.shadowColor = win ? '#ffc24a' : '#3ad6ff'; g.shadowBlur = 10; g.fillText(word.length > 11 ? word.slice(0, 10) + '.' : word, 128, 30); g.shadowBlur = 0; g.font = `400 24px ${FONT}`; g.fillStyle = 'rgba(200,220,255,.7)'; g.fillText((p * 100).toFixed(0) + '%', 128, 72); b.tex.needsUpdate = true; }
const barTop = (i, out = new V3()) => out.set(BAR0.x + i * BARD, BAR0.y + BARS[i].h * BARH + .1, BAR0.z);

// ================================================================ BLACKBOX: drei Organe
const bbG = new THREE.Group(); bbG.position.copy(OB); scene.add(bbG);
const ORG = [];
// Gehirn: Punktwolke + Drahtgitter, Seitenansicht wie im Look
{
  const g = new THREE.Group(); g.position.set(-2.75, 0, 0); bbG.add(g);
  const geo = new THREE.IcosahedronGeometry(1, 4); const p = geo.attributes.position, v = new V3();
  const shape = (v) => { const gy = Math.sin(v.x * 9 + v.y * 4) * Math.sin(v.y * 11 - v.z * 6) * .055; v.multiplyScalar(1 + gy); v.x *= 1.05; v.y *= .74; v.z *= .82; if (v.y < -.2 && v.x < -.1) v.y *= .9; return v; };
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); shape(v); p.setXYZ(i, v.x, v.y, v.z); }
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat(new THREE.Color(.5, .32, 1.2), .22)); g.add(wire);
  const P = makePoints(1500, { size: .045 }); const r6 = rng(31);
  for (let i = 0; i < 1500; i++) {
    const u = r6() * 2 - 1, a = r6() * TAU, s = Math.sqrt(1 - u * u); v.set(Math.cos(a) * s, u, Math.sin(a) * s); shape(v).multiplyScalar(.9 + r6() * .12);
    if (i < 160) { v.set(-.55 + r6() * .5, -.62 + r6() * .28, (r6() - .5) * .6); } // Kleinhirn
    if (i >= 160 && i < 220) { const t = r6(); v.set(-.18 + t * .12, -.55 - t * .55, (r6() - .5) * .12); } // Stamm
    P.pos.set([v.x, v.y, v.z], i * 3); const gold = r6() < .12; const c = gold ? C.au.clone().multiplyScalar(1.4) : C.vi.clone().lerp(C.pk, r6() * .3).multiplyScalar(.9 + r6() * .5);
    P.col.set([c.r, c.g, c.b], i * 3); P.size[i] = gold ? .09 : rr(.03, .06); P.alpha[i] = rr(.4, 1);
  }
  P.up(); g.add(P.mesh);
  ORG.push({ g, P, wire, k: 0, name: ['GEHIRN', 'Architektur & Logik'], col: C.vi });
}
// Datenbank: gestapelte Glaszylinder
{
  const g = new THREE.Group(); bbG.add(g);
  for (let i = 0; i < 4; i++) {
    const y = -.62 + i * .38; const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.62, .62, .32, 48, 1, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(.1, .3, 1), opacity: .2, ...ADD })); cyl.position.y = y; g.add(cyl);
    for (const dy of [-.16, .16]) { const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 64 }, (_, k) => new V3(Math.cos(k / 64 * TAU) * .62, 0, Math.sin(k / 64 * TAU) * .62))), lineMat(new THREE.Color(.45, .75, 1.8), .9)); ring.position.y = y + dy; g.add(ring); }
  }
  const P = makePoints(420, { size: .035 }); const r7 = rng(32);
  for (let i = 0; i < 420; i++) { const a = r7() * TAU, lay = r7() * 4 | 0, y = -.62 + lay * .38 + (r7() - .5) * .24; const rad = r7() < .7 ? .6 : r7() * .55; P.pos.set([Math.cos(a) * rad, y, Math.sin(a) * rad], i * 3); const c = (r7() < .15 ? C.au : C.cy).clone().multiplyScalar(1.2); P.col.set([c.r, c.g, c.b], i * 3); P.alpha[i] = rr(.3, 1); }
  P.up(); g.add(P.mesh);
  const top = glowSprite(new THREE.Color(.4, .8, 1.6), .7, .9); top.position.y = .62; g.add(top);
  ORG.push({ g, P, k: 0, name: ['DATENBANK', 'Wissen & Kontext'], col: C.bl });
}
// Vernetzung: Netz-Kugel
{
  const g = new THREE.Group(); g.position.set(2.75, 0, 0); bbG.add(g);
  const ico = new THREE.IcosahedronGeometry(.95, 1); const ed = new THREE.LineSegments(new THREE.EdgesGeometry(ico, 1), lineMat(new THREE.Color(.35, .6, 1.8), .8)); g.add(ed);
  const ip = ico.attributes.position, seen = new Map(), v = new V3(); const pts = [];
  for (let i = 0; i < ip.count; i++) { v.fromBufferAttribute(ip, i); const key = v.toArray().map(x => x.toFixed(3)).join(); if (!seen.has(key)) { seen.set(key, 1); pts.push(v.clone()); } }
  const P = makePoints(pts.length + 1, { size: .12 }); pts.forEach((q, i) => { P.pos.set([q.x, q.y, q.z], i * 3); const c = (i % 7 === 0 ? C.au : i % 5 === 0 ? C.pk : C.cy).clone().multiplyScalar(1.4); P.col.set([c.r, c.g, c.b], i * 3); });
  P.pos.set([0, 0, 0], pts.length * 3); P.col.set([1.4, 1.6, 2], pts.length * 3); P.size[pts.length] = .3; P.up(); g.add(P.mesh);
  const chords = []; const r8 = rng(33); for (let i = 0; i < 26; i++) chords.push(pts[r8() * pts.length | 0], pts[r8() * pts.length | 0]);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(chords), lineMat(new THREE.Color(.3, .5, 1.4), .25)));
  ORG.push({ g, P, k: 0, name: ['VERNETZUNG', 'Verbindung & Skalierung'], col: C.cy });
}
const orgLabels = ORG.map((o, i) => { const s = textSprite([{ t: o.name[0], c: '#ffffff' }, { t: o.name[1], s: .72, c: '#b9c6ff', w: 400 }], { h: .5, fs: 40 }); s.position.set((i - 1) * 2.75, -1.45, 0); bbG.add(s); return s; });
const bbStream = makePoints(150, { size: .07 });
bbStream.mesh.frustumCulled = false; scene.add(bbStream.mesh);
const bbPhase = Array.from({ length: 150 }, () => [R(), rr(-.1, .1), rr(-.1, .1), R() * 3 | 0]);
// sanfter Rahmen der Blackbox
const bbFrame = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.4, 3.6, 2.6)), lineMat(new THREE.Color(.5, .45, 1.2), .12)); bbFrame.position.set(0, -.25, 0); bbG.add(bbFrame);

// ================================================================ FEEDBACK-BOGEN (gold)
const fbCurve = new THREE.CatmullRomCurve3([new V3(21, .8, 0), new V3(22.2, -1.2, 3), new V3(15, -2.65, 7.6), new V3(0, -2.95, 9.6), new V3(-15, -2.5, 7.6), new V3(-22.4, 1.4, 3), new V3(-21.2, 4.9, 0)], false, 'centripetal');
const fbMat = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uK: { value: 1 }, uP: { value: -1 } }, ...ADD,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `varying vec2 vUv; uniform float uT,uK,uP; void main(){ float x=vUv.x;
    float flow=pow(.5+.5*sin(x*90.-uT*3.),6.)*.5; float big=uP>-.5? exp(-pow((x-uP)*16.,2.))*4.:0.;
    float edge=1.-abs(vUv.y-.5)*2.; vec3 c=vec3(1.,.72,.26); gl_FragColor=vec4(c*(.45+flow+big)*uK*(.4+.6*edge),1.); }`
});
const fbTube = new THREE.Mesh(new THREE.TubeGeometry(fbCurve, 500, .055, 8, false), fbMat); scene.add(fbTube);
const fbArrow = new THREE.Mesh(new THREE.ConeGeometry(.16, .42, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.4, .5) }));
{ const e = fbCurve.getPointAt(1), d = fbCurve.getTangentAt(1); fbArrow.position.copy(e); fbArrow.quaternion.setFromUnitVectors(new V3(0, 1, 0), d); scene.add(fbArrow); }

// ================================================================ FIBONACCI-BODEN
const fibG = new THREE.Group(); fibG.position.set(0, FY, 2.2); scene.add(fibG);
const FIB_S = .2;
{
  // Fibonacci-Quadrate und Viertelbögen (echte Kachelung)
  const F = [1, 1, 2, 3, 5, 8, 13, 21, 34]; let bb = null; const sq = [], arcs = [];
  for (let i = 0; i < F.length; i++) {
    const s = F[i]; let x0, y0, cx, cy, a0;
    if (i === 0) { x0 = 0; y0 = 0; cx = 1; cy = 1; a0 = Math.PI; bb = [0, 0, 1, 1]; }
    else {
      const d = (i - 1) % 4;
      if (d === 0) { x0 = bb[2]; y0 = bb[1]; cx = x0; cy = y0 + s; a0 = 1.5 * Math.PI; }
      else if (d === 1) { x0 = bb[0]; y0 = bb[3]; cx = x0; cy = y0; a0 = 0; }
      else if (d === 2) { x0 = bb[0] - s; y0 = bb[1]; cx = x0 + s; cy = y0; a0 = .5 * Math.PI; }
      else { x0 = bb[0]; y0 = bb[1] - s; cx = x0 + s; cy = y0 + s; a0 = Math.PI; }
      bb = [Math.min(bb[0], x0), Math.min(bb[1], y0), Math.max(bb[2], x0 + s), Math.max(bb[3], y0 + s)];
    }
    sq.push([x0, y0, s]); arcs.push([cx, cy, s, a0]);
  }
  const ox = (bb[0] + bb[2]) / 2, oy = (bb[1] + bb[3]) / 2; const M = (x, y) => new V3((x - ox) * FIB_S, 0, -(y - oy) * FIB_S);
  const sp = []; for (const [x, y, s] of sq) { const a = M(x, y), b = M(x + s, y), c = M(x + s, y + s), d = M(x, y + s); sp.push(a, b, b, c, c, d, d, a); }
  fibG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sp), lineMat(new THREE.Color(1.3, .9, .35), .55)));
  const spiral = []; for (const [cx, cy, r, a0] of arcs) for (let k = 0; k <= 24; k++) { const a = a0 + k / 24 * Math.PI / 2; spiral.push(M(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); }
  window.__fibSpiral = new THREE.CatmullRomCurve3(spiral);
  fibG.add(new THREE.Mesh(new THREE.TubeGeometry(window.__fibSpiral, 600, .045, 6, false), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.45, .5) })));
}
// großer goldener Ring + Raster
const fibRing = new THREE.Mesh(new THREE.TorusGeometry(10.5, .05, 8, 220), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.3, .45) })); fibRing.rotation.x = Math.PI / 2; fibRing.scale.set(1, .62, 1); fibG.add(fibRing);
{
  const gp = []; const N = 18, S = 1.6; for (let i = -N; i <= N; i++) { gp.push(new V3(i * S, 0, -N * S), new V3(i * S, 0, N * S), new V3(-N * S, 0, i * S), new V3(N * S, 0, i * S)); }
  const grid = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gp), lineMat(new THREE.Color(.8, .55, .22), .12)); grid.position.y = -.02; fibG.add(grid);
  const P = makePoints(37 * 37, { size: .07 }); let k = 0; for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) { const d = Math.hypot(i, j) / N; P.pos.set([i * S, 0, j * S], k * 3); const c = C.au.clone().multiplyScalar(1.2); P.col.set([c.r, c.g, c.b], k * 3); P.alpha[k] = (1 - d) * (R() < .3 ? 1 : .35); P.size[k] = R() < .1 ? .16 : .06; k++; }
  P.up(); fibG.add(P.mesh);
}
// Naturmuster-Kacheln: Fibonacci · Nautilus · Sonnenblume · Blatt · Galaxie · Waben
const PHI = (1 + Math.sqrt(5)) / 2, GA = Math.PI * (3 - Math.sqrt(5));
const natTex = [
  ctex(256, 256, (g, w) => { g.strokeStyle = '#ffc24a'; g.lineWidth = 2.5; g.shadowColor = '#ffc24a'; g.shadowBlur = 8; const s = 8.5; let x = 20, y = 30; g.strokeRect(20, 30, 21 * s * 1.15, 13 * s * 1.15); const k = 1.15 * s; g.strokeRect(20, 30, 13 * k, 13 * k); g.strokeRect(20 + 13 * k, 30, 8 * k, 8 * k); g.strokeRect(20 + 16 * k, 30 + 8 * k, 5 * k, 5 * k); g.strokeRect(20 + 13 * k, 30 + 10 * k, 3 * k, 3 * k); g.beginPath(); g.arc(20 + 13 * k, 30 + 13 * k, 13 * k, Math.PI, 1.5 * Math.PI); g.arc(20 + 13 * k, 30 + 8 * k, 8 * k, 1.5 * Math.PI, 0); g.arc(20 + 16 * k, 30 + 8 * k, 5 * k, 0, .5 * Math.PI); g.stroke(); }),
  ctex(256, 256, (g, w) => { g.translate(w / 2, w / 2); const b = Math.log(PHI) / (Math.PI / 2); const r = th => 3 * Math.exp(b * th); g.fillStyle = 'rgba(210,170,130,.95)'; g.beginPath(); for (let th = 0; th < 4.2 * Math.PI; th += .05) g.lineTo(Math.cos(th) * r(th) * .62, Math.sin(th) * r(th) * .62); g.closePath(); const gr = g.createRadialGradient(0, 0, 4, 0, 0, 110); gr.addColorStop(0, '#fff2d8'); gr.addColorStop(.6, '#c9925e'); gr.addColorStop(1, '#6b4426'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(90,50,25,.8)'; g.lineWidth = 2; for (let th = .6; th < 4.2 * Math.PI; th += .42) { g.beginPath(); g.moveTo(Math.cos(th) * r(th) * .62, Math.sin(th) * r(th) * .62); g.lineTo(Math.cos(th) * r(th - 2 * Math.PI) * .62, Math.sin(th) * r(th - 2 * Math.PI) * .62); g.stroke(); } g.beginPath(); for (let th = 0; th < 4.2 * Math.PI; th += .05) g.lineTo(Math.cos(th) * r(th) * .62, Math.sin(th) * r(th) * .62); g.strokeStyle = '#fff0d0'; g.stroke(); }),
  ctex(256, 256, (g, w) => { g.translate(w / 2, w / 2); for (let i = 0; i < 26; i++) { g.save(); g.rotate(i / 26 * TAU); g.fillStyle = i % 2 ? '#ffc21a' : '#ffb000'; g.beginPath(); g.ellipse(0, -84, 13, 38, 0, 0, TAU); g.fill(); g.restore(); } g.fillStyle = '#3b2108'; g.beginPath(); g.arc(0, 0, 62, 0, TAU); g.fill(); for (let i = 0; i < 520; i++) { const r = 2.7 * Math.sqrt(i), a = i * GA; g.fillStyle = `rgb(${120 + (i % 7) * 12},${70 + (i % 5) * 8},20)`; g.beginPath(); g.arc(Math.cos(a) * r, Math.sin(a) * r, 1.8, 0, TAU); g.fill(); } }),
  ctex(256, 256, (g, w) => { g.translate(w / 2, w / 2); g.rotate(-.7); const gr = g.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, '#2f6b1c'); gr.addColorStop(.5, '#6fae36'); gr.addColorStop(1, '#2c5a18'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -112); g.bezierCurveTo(78, -60, 70, 60, 0, 112); g.bezierCurveTo(-70, 60, -78, -60, 0, -112); g.fill(); g.strokeStyle = 'rgba(230,240,190,.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -105); g.lineTo(0, 118); g.stroke(); g.lineWidth = 1.2; for (let i = -4; i <= 4; i++) { const y = i * 22; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(25, y - 18, 50 - Math.abs(i) * 6, y - 34); g.moveTo(0, y); g.quadraticCurveTo(-25, y - 18, -50 + Math.abs(i) * 6, y - 34); g.stroke(); } }),
  ctex(256, 256, (g, w) => { g.drawImage(galaxyTex.image, 0, 0, w, w); g.globalCompositeOperation = 'lighter'; g.drawImage(galaxyTex.image, 0, 0, w, w); }),
  ctex(256, 256, (g, w) => { g.strokeStyle = '#ffb83a'; g.lineWidth = 3; g.shadowColor = '#ffa000'; g.shadowBlur = 10; const r = 22, h = Math.sqrt(3) * r; for (let row = -1; row < 8; row++) for (let col = -1; col < 8; col++) { const x = col * 1.5 * r + 16, y = row * h + (col % 2 ? h / 2 : 0) + 10; const d = Math.hypot(x - w / 2, y - w / 2); if (d > 118) continue; g.fillStyle = `rgba(255,170,40,${.22 * (1 - d / 120)})`; g.beginPath(); for (let k = 0; k < 6; k++) g.lineTo(x + Math.cos(k * Math.PI / 3) * r * .92, y + Math.sin(k * Math.PI / 3) * r * .92); g.closePath(); g.fill(); g.stroke(); } })
];
const NAT = natTex.map((t, i) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.55), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: .95 }));
  m.position.set((i - 2.5) * 1.78, FY + .95, 6.6); m.rotation.x = -.22; scene.add(m);
  const gl = glowSprite(i === 3 ? new THREE.Color(.3, .6, .2) : new THREE.Color(.9, .6, .2), 2.6, .25); gl.position.copy(m.position).add(new V3(0, 0, -.1)); scene.add(gl); return m;
});
const natLabel = textSprite([{ t: 'GEOMETRISCHE GRUNDLAGE', c: '#ffd27a', g: 'rgba(255,170,40,.9)' }, { t: 'Fibonacci · Goldener Schnitt · Naturmuster', s: .7, c: '#ffe7b8', w: 400 }], { h: .62 }); natLabel.position.set(0, FY + 2.3, 6.4); scene.add(natLabel);

// ================================================================ EMERGENZ-PORTAL
const emG = new THREE.Group(); emG.position.copy(EP); scene.add(emG);
const emDisc = new THREE.Mesh(new THREE.CircleGeometry(2.25, 96), swirlMat(new THREE.Vector3(.23, .6, 1), new THREE.Vector3(.6, .4, 1), 5)); emG.add(emDisc);
const emT1 = new THREE.Mesh(new THREE.TorusGeometry(2.3, .07, 10, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.35, .45) })); emG.add(emT1);
const emT2 = new THREE.Mesh(new THREE.TorusGeometry(2.62, .025, 6, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .9, 2), ...ADD })); emG.add(emT2);
const EMN = 900; const emP = makePoints(EMN, { size: .05 }); emG.add(emP.mesh);
let emE = 0; // 0 = einfache Struktur, 1 = komplexes Verhalten

// ================================================================ PHYSIK: Chip (GPU/TPU)
const chipG = new THREE.Group(); chipG.position.copy(CH); chipG.rotation.y = .5; scene.add(chipG);
const dieTex = ctex(256, 256, (g, w) => { g.fillStyle = '#0b0f1a'; g.fillRect(0, 0, w, w); g.strokeStyle = 'rgba(255,190,80,.7)'; g.lineWidth = 1; for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { g.strokeRect(14 + i * 14.3, 14 + j * 14.3, 11, 11); } const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,220,140,.8)'); gr.addColorStop(.5, 'rgba(255,170,60,.25)'); gr.addColorStop(1, 'rgba(255,150,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
chipG.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, .16, 2.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(.05, .06, .1) })));
const chipDie = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: dieTex, color: new THREE.Color(1.4, 1.2, 1) })); chipDie.rotation.x = -Math.PI / 2; chipDie.position.y = .085; chipG.add(chipDie);
{
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, .04, .22), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.15, .45) }), 64); const m = new THREE.Matrix4(), q = new THREE.Quaternion(); let k = 0;
  for (let s = 0; s < 4; s++) for (let i = 0; i < 16; i++) { const t = (i - 7.5) * .12; const a = s * Math.PI / 2; q.setFromAxisAngle(new V3(0, 1, 0), a); const p = new V3(t, 0, 1.2).applyQuaternion(q); m.compose(p, q, new V3(1, 1, 1)); pins.setMatrixAt(k++, m); }
  chipG.add(pins);
  const tr = []; const r9 = rng(51); for (let i = 0; i < 40; i++) { const a = Math.floor(r9() * 4) * Math.PI / 2, t = (r9() - .5) * 1.8, L = 1.3 + r9() * 2.2; const d = new V3(Math.sin(a), 0, Math.cos(a)), side = new V3(d.z, 0, -d.x); const p0 = d.clone().multiplyScalar(1.32).addScaledVector(side, t), p1 = p0.clone().addScaledVector(d, L * .6), p2 = p1.clone().addScaledVector(side, (r9() - .5) * 1.2).addScaledVector(d, L * .4); tr.push(p0, p1, p1, p2); }
  const trl = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(tr), lineMat(new THREE.Color(1.2, .8, .3), .6)); trl.position.y = -.07; chipG.add(trl);
}
const chipGlow = glowSprite(new THREE.Color(1, .65, .25), 3, .5); chipGlow.position.y = .3; chipG.add(chipGlow);
const chipLabel = textSprite([{ t: 'GPU / TPU', c: '#ffd27a', g: 'rgba(255,170,40,.9)' }, { t: 'quanteninspirierte Algorithmen', s: .7, c: '#ffe7b8', w: 400 }], { h: .5 }); chipLabel.position.set(CH.x, CH.y + 1.05, CH.z); scene.add(chipLabel);
// ================================================================ ZUKUNFT: Qubit-Atom
const qG = new THREE.Group(); qG.position.copy(QA); scene.add(qG);
qG.add(new THREE.Mesh(new THREE.SphereGeometry(.22, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.9, 2.4) })));
qG.add(glowSprite(new THREE.Color(.4, .7, 1.5), 1.8, .8));
qG.add(new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.15, 16, 10)), lineMat(new THREE.Color(.3, .5, 1.2), .12)));
const QORB = [];
for (let i = 0; i < 3; i++) { const o = new THREE.Group(); o.rotation.set(i * 1.05, i * .7, 0); qG.add(o); const t = new THREE.Mesh(new THREE.TorusGeometry(.95, .012, 6, 120), new THREE.MeshBasicMaterial({ color: (i === 1 ? C.vi : C.cy).clone().multiplyScalar(1.8), ...ADD })); o.add(t); const e = glowSprite(i === 2 ? new THREE.Color(1.6, 1.1, .4) : new THREE.Color(.6, .9, 2), .32, 1); o.add(e); QORB.push({ o, e, sp: .8 + i * .35 }); }
const qLabel = textSprite([{ t: 'QUBITS', c: '#bfe8ff', g: 'rgba(58,214,255,.9)' }, { t: 'Muster · Überlagerung · Verbindung', s: .7, c: '#d8ecff', w: 400 }], { h: .5 }); qLabel.position.set(QA.x, QA.y + 1.6, QA.z); scene.add(qLabel);

// ================================================================ DATENSTROM (Regenbogen-Partikelfluss durchs ganze System)
const streamPath = (() => {
  const pts = [new V3(-21.5, 4.9, 0), new V3(-16, 4.9, 0), new V3(-10.6, 4.9, 0), new V3(-9.4, 4.95, .2), VC.clone().add(new V3(-.8, .2, 0)), VC.clone().add(new V3(.8, -.1, .2)), new V3(-3.4, 5.6, 0), new V3(-1.2, 5.3, .4)];
  for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 2.25 + Math.PI, r = 1.15 + .25 * Math.sin(t * 9); pts.push(new V3(Math.cos(a) * r, 4.9 - t * 4.8, Math.sin(a) * r)); }
  pts.push(new V3(2.5, .35, .7), new V3(4, 1.6, .9), new V3(5.6, 1, .3), new V3(6.4, .8, 0), new V3(13, .8, 0), new V3(20.6, .8, 0));
  for (let i = 1; i <= 24; i++) pts.push(fbCurve.getPointAt(i / 24));
  const cv = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); return cv.getSpacedPoints(2400);
})();
const STRN = 520; const stream = makePoints(STRN, { size: .07 }); scene.add(stream.mesh);
const strPh = Array.from({ length: STRN }, () => [R(), rr(.6, 1.4), rr(0, TAU), rr(.03, .22), R()]);
const STRK = (() => { // Anteil der Strecke, die auf dem Feedback-Bogen liegt (für Gold)
  let best = 0, bd = 1e9; const e = new V3(20.6, .8, 0); streamPath.forEach((p, i) => { const d = p.distanceTo(e); if (d < bd) { bd = d; best = i; } }); return best / (streamPath.length - 1);
})();

// ================================================================ TOKEN-FLUSS (ein Reiz wandert durchs System)
const PP = 34, MSGMAX = 4, TOKN = 6;
const flowP = makePoints(MSGMAX * TOKN * PP, { size: .09 }); scene.add(flowP.mesh);
const PH = Array.from({ length: PP }, () => [R(), new V3(gauss(), gauss(), gauss()).normalize().multiplyScalar(rr(.3, 1))]);
const VOCAB = ['Resonanz', 'Muster', 'Balance', 'Licht', 'Verbindung', 'Herz', 'Hirn', 'Welle', 'Netz', 'Sinn', 'Zukunft', 'Klang', 'Ordnung', 'Natur', 'Energie', 'Kontrolle', 'Sprache', 'Wissen'];
function tokenize(text) {
  const words = text.trim().slice(0, 48).split(/\s+/).filter(Boolean); const toks = [];
  for (const w0 of words) { let w = w0, first = true; while (w.length) { let n; const pm = w.match(/^[^\p{L}\p{N}]+/u); if (pm) n = pm[0].length; else { const m = w.search(/[^\p{L}\p{N}]/u); const L = m < 0 ? w.length : m; n = L <= 5 ? L : Math.ceil(L / Math.ceil(L / 5)); } toks.push((first && toks.length ? ' ' : '') + w.slice(0, n)); w = w.slice(n); first = false; } }
  return toks.length ? toks.slice(0, TOKN) : ['Reiz'];
}
const MSGS = []; let msgSerial = 0;
function makeMsg(text, opt = {}) {
  const toks = opt.toks || tokenize(text); const h0 = hashStr(text.toLowerCase());
  let slot = 0; if (!opt.tour) { const used = new Set(MSGS.map(m => m.slot)); slot = -1; for (let s = 1; s < MSGMAX; s++) if (!used.has(s)) { slot = s; break; } if (slot < 0) { const old = MSGS.filter(m => !m.tour).sort((a, b) => a.serial - b.serial)[0]; killMsg(old); slot = old.slot; } }
  const msg = { text, slot, serial: msgSerial++, tour: !!opt.tour, p: opt.p0 || 0, last: opt.p0 || 0, toks: [], vis: true };
  toks.forEach((t, k) => {
    const id = (hashStr(t + k) % 50257); const r = rng(id + 7 * k); const nodes = []; for (let L = 0; L < NL; L++) nodes.push(r() * NN | 0);
    msg.toks.push({ t, id, col: rainbow(.05 + k / Math.max(1, toks.length) * .8), vec: vecPosFor(id), nodes, cube: CUBES[slot * TOKN + k] });
    const c = CUBES[slot * TOKN + k]; c.owner = msg; cubeLabel(c, t, id, msg.toks[k].col); c.m.material.color.copy(msg.toks[k].col); c.e.material.color.copy(msg.toks[k].col).multiplyScalar(1.6);
  });
  for (let k = toks.length; k < TOKN; k++) { const c = CUBES[slot * TOKN + k]; c.owner = null; c.g.visible = false; }
  if (opt.cand) msg.cand = opt.cand; else {
    const r = rng(h0); const pool = VOCAB.slice(); const cand = []; for (let i = 0; i < NB; i++) cand.push(pool.splice(r() * pool.length | 0, 1)[0]);
    const lg = cand.map(() => r() * 3); lg[0] += 1.2; const ex = lg.map(Math.exp), s = ex.reduce((a, b) => a + b, 0); msg.cand = cand.map((w, i) => [w, ex[i] / s]).sort((a, b) => b[1] - a[1]);
  }
  msg.win = 0; if (!opt.tour) MSGS.push(msg); return msg;
}
function killMsg(m) { const i = MSGS.indexOf(m); if (i >= 0) MSGS.splice(i, 1); for (let k = 0; k < TOKN; k++) { const c = CUBES[m.slot * TOKN + k]; if (c.owner === m) { c.owner = null; c.g.visible = false; } } const b = m.slot * TOKN * PP; flowP.alpha.fill(0, b, b + TOKN * PP); }
const tokPos = (k, n, out = new V3()) => out.set(-9.45, 4.95 + ((n - 1) / 2 - k) * .62, .3);
const _a = new V3(), _b = new V3(), _m = new V3(), _q = new V3(), _col = new THREE.Color();
function bez(a, m, b, t, out) { const u = 1 - t; return out.set(a.x * u * u + 2 * m.x * u * t + b.x * t * t, a.y * u * u + 2 * m.y * u * t + b.y * t * t, a.z * u * u + 2 * m.z * u * t + b.z * t * t); }
function flowPos(msg, k, j, p, out) {
  const tk = msg.toks[k], n = msg.toks.length, h = PH[j][0], J = PH[j][1];
  if (p < 1) { waveIn.pt(.5 + .45 * h, j % WSTR, T, _a); tokPos(k, n, _b); const a = ease((p - .25 * h) / .7); return out.lerpVectors(_a, _b, a).addScaledVector(J, .17 * (1 - a) + .07); }
  if (p < 2) { tokPos(k, n, _a); const a = ease((p - 1 - .2 * h) / .75); _m.addVectors(_a, tk.vec).multiplyScalar(.5).add(_q.set(0, .9, .7)); return bez(_a, _m, tk.vec, a, out).addScaledVector(J, .05 + .1 * Math.sin(Math.PI * a)); }
  if (p < 3) { nodeW(0, tk.nodes[0], _b); const a = ease((p - 2 - .2 * h) / .75); _m.addVectors(tk.vec, _b).multiplyScalar(.5).add(_q.set(0, 1.5, .3)); return bez(tk.vec, _m, _b, a, out).addScaledVector(J, .05 + .12 * Math.sin(Math.PI * a)); }
  if (p < 4) { const sub = (p - 3) * 4, li = Math.min(3, Math.floor(sub)), f = sub - li; nodeW(li, tk.nodes[li], _a); nodeW(li + 1, tk.nodes[li + 1], _b); const a = ease((f - .4 - .1 * h) / .5); _m.addVectors(_a, _b).multiplyScalar(.5).addScaledVector(J, .35); return bez(_a, _m, _b, a, out).addScaledVector(J, .06); }
  if (p < 5) { const f = p - 4; nodeW(4, tk.nodes[4], _a); barTop(msg.win, _b); if (f < .35) { const a = ease((f - .1 * h) / .25); _m.addVectors(_a, _b).multiplyScalar(.5).add(_q.set(0, .9, .3)); return bez(_a, _m, _b, a, out).addScaledVector(J, .05); } const u = clamp((f - .35) / .65 * 1.15 - h * .15, 0, 1); if (u <= 0) return out.copy(_b).addScaledVector(J, .06); return waveOut.pt(u, j % WSTR, T, out); }
  const u = clamp((p - 5) * 1.25 - h * .22, 0, 1); return out.copy(fbCurve.getPointAt(u)).addScaledVector(J, .09);
}
function flowCol(msg, k, j, p, out) {
  const tk = msg.toks[k], h = PH[j][0];
  if (p < 3) return out.copy(tk.col).multiplyScalar(1.5);
  if (p < 4) { const nc = (j % 2 ? C.au : C.vi); return out.copy(tk.col).lerp(nc, ease(p - 3)).multiplyScalar(1.6); }
  if (p < 5) { const f = p - 4; return f < .35 ? out.copy(C.au).multiplyScalar(1.7) : rainbow(clamp((f - .35) / .65 * 1.15 - h * .15, 0, 1) * .9 + .02, out).multiplyScalar(1.7); }
  return out.copy(C.au).multiplyScalar(1.8);
}
function updateMsgParticles(msg) {
  const base = msg.slot * TOKN * PP, n = msg.toks.length, p = msg.p, vis = msg.vis && p >= 0 && p < 6.05;
  for (let k = 0; k < TOKN; k++) for (let j = 0; j < PP; j++) {
    const i = base + k * PP + j;
    if (!vis || k >= n) { flowP.alpha[i] = 0; continue; }
    flowPos(msg, k, j, p, _a); flowCol(msg, k, j, p, _col);
    flowP.pos[i * 3] = _a.x; flowP.pos[i * 3 + 1] = _a.y; flowP.pos[i * 3 + 2] = _a.z; flowP.col[i * 3] = _col.r; flowP.col[i * 3 + 1] = _col.g; flowP.col[i * 3 + 2] = _col.b;
    let al = sat(p / .15) * (1 - ease((p - 5.8) / .2)); if (p > 4.35 && p < 5) { const u = clamp((p - 4.35) / .65 * 1.15 - PH[j][0] * .15, 0, 1); al *= 1 - ease((u - .9) / .1); } if (p >= 5 && p < 5.1) al *= ease((p - 5) / .1);
    flowP.alpha[i] = al * (.7 + .3 * Math.sin(T * 7 + j)); flowP.size[i] = .075 * (1 + PH[j][0] * .6);
  }
  for (let k = 0; k < n; k++) {
    const c = msg.toks[k].cube; const s = vis ? ease((p - .45) / .3) * (1 - ease((p - 1.12) / .3)) : 0;
    c.g.visible = s > .01; if (c.g.visible) { tokPos(k, n, c.g.position); c.g.scale.setScalar(s); c.m.rotation.set(T * .4 + k, T * .6 + k * .7, 0); c.e.rotation.copy(c.m.rotation); c.lab.material.opacity = s; }
  }
}
// Hervorhebungen durch einen Reiz: Attention-Bögen, Feedforward, Embedding, Output
function msgHighlights(msg) {
  const p = msg.p; if (!msg.vis || p < 0 || p >= 6.05) return 0; const n = msg.toks.length, tk = msg.toks;
  if (p > 1.9 && p < 3.05) { const I = Math.sin(Math.PI * sat((p - 2.05) / 1)); for (const t of tk) { nodeW(0, t.nodes[0], _b); hl(t.vec, _b, t.col, I * .9, 1.2); } LAYERS[0].flash = Math.max(LAYERS[0].flash, I * .6); }
  if (p >= 2.75 && p < 4) {
    const sub = Math.max(0, (p - 3) * 4), li = Math.min(3, Math.floor(sub)), f = p < 3 ? 0 : sub - li;
    const I = p < 3 ? sat((p - 2.75) / .25) : Math.sin(Math.PI * sat(f / .45)) * (f < .45 ? 1 : 0) + (f >= .45 ? 0 : 0);
    const L = LAYERS[li], acol = li === 1 ? C.au : li === 2 ? C.cy : C.vi;
    for (let a = 0; a < n; a++) { nodeW(li, tk[a].nodes[li], _a); L.glow[tk[a].nodes[li]] = Math.max(L.glow[tk[a].nodes[li]], .4 + I);
      for (let b = a + 1; b < n; b++) { nodeW(li, tk[b].nodes[li], _b); hl(_a, _b, acol, I * 1.4, .45 + .15 * ((a + b) % 3)); }
      for (let q = 0; q < 3; q++) { const o = (tk[a].nodes[li] + 3 + q * 5) % NN; nodeW(li, o, _b); hl(_a, _b, acol, I * .55, .25); L.glow[o] = Math.max(L.glow[o], I * .6); } }
    L.flash = Math.max(L.flash, I * .8);
    if (p >= 3 && f > .4) { const I2 = Math.sin(Math.PI * sat((f - .4) / .6)); for (const t of tk) { nodeW(li, t.nodes[li], _a); for (let q = 0; q < 3; q++) { const o = q ? (t.nodes[li + 1] + q * 4) % NN : t.nodes[li + 1]; nodeW(li + 1, o, _b); hl(_a, _b, q ? C.vi : C.au, I2 * (q ? .5 : 1.1)); } } LAYERS[li + 1].flash = Math.max(LAYERS[li + 1].flash, I2 * .5); }
  }
  if (p >= 3.9 && p < 4.5) { const I = Math.sin(Math.PI * sat((p - 3.9) / .6)); for (const t of tk) { nodeW(4, t.nodes[4], _a); LAYERS[4].glow[t.nodes[4]] = 1.2; for (let i = 0; i < NB; i++) { barTop(i, _b); hl(_a, _b, i === msg.win ? C.au : C.cy, I * (i === msg.win ? 1 : .3), .3); } } LAYERS[4].flash = Math.max(LAYERS[4].flash, I * .8); }
  return 1;
}
// Ereignisse (für Klang + Gewichts-Update), identisch live und offline
function flowEvents(p0, p1, n, out) {
  const X = (th) => p0 < th && p1 >= th;
  for (let k = 0; k < n; k++) { if (X(.62 + k * .06)) out.push(['tick', 1300 + k * 170]); if (X(1.78 + k * .05)) out.push(['ping', PENTA[2 + k], .05]); }
  if (X(2.8)) out.push(['ping', 440, .07], ['swoosh', .6]);
  for (let li = 0; li < 4; li++) if (X(3.05 + li * .25)) out.push(['ping', PENTA[3 + li * 2], .065], ['ping', PENTA[5 + li * 2], .04]);
  if (X(4)) out.push(['ping', 220, .08]); if (X(4.15)) out.push(['arp', [523.3, 659.3, 880]]); if (X(4.4)) out.push(['swoosh', 1.2]);
  if (X(5.02)) out.push(['gliss', 220, 660, 1.4]); if (X(5.55)) out.push(['wupd']);
  return out;
}

// ================================================================ TOUR: Kapitel, Kamera, Zeitachse
const CHAP = [
  { t: 0, no: 0, k: 'INTRO', title: 'DIE ARCHITEKTUR DER KI / LLM', text: 'Mathematik · Muster · Emergenz' },
  { t: 5, no: 1, k: 'INPUT', title: 'INPUT · DER REIZ', text: 'Text, Bild, Ton, Kontext. Alles beginnt als Reiz. Tokenisierung: Zahlen werden zu Vektoren.' },
  { t: 12, no: 2, k: 'VEKTOREN', title: 'VEKTOREN · DIE SPRACHE DER MASCHINE', text: 'Wörter, Bilder, Bedeutungen werden als Zahlenvektoren im hochdimensionalen Raum dargestellt. Bedeutung wird zu Position.' },
  { t: 19, no: 3, k: 'GEWICHTUNG', title: 'GEWICHTUNG · DIE LERNKRAFT', text: 'Millionen bis Milliarden Gewichte verbinden Vektoren. Training passt sie kontinuierlich an, nicht nur richtig oder falsch.' },
  { t: 26, no: 4, k: 'ZWIEBEL', title: 'DIE ZWIEBEL · SCHICHTEN', text: 'Embedding, Transformer-Blöcke mit Attention und Feedforward, mehrschichtige Repräsentation. Jede Schicht sieht ein bisschen tiefer.' },
  { t: 37, no: 5, k: 'BLACKBOX', title: 'DIE BLACKBOX · DAS ZUSAMMENSPIEL', text: 'Gehirn: Architektur & Logik. Datenbank: Wissen & Kontext. Vernetzung: Verbindung & Skalierung. Zusammen erzeugen sie Intelligenz im Muster.' },
  { t: 45, no: 6, k: 'OUTPUT', title: 'OUTPUT · DIE ANTWORT', text: 'Der Output-Layer bildet eine Verteilung über Tokens. Aus Wahrscheinlichkeit wird Sprache: Text, Bild, Entscheidung.' },
  { t: 53, no: 7, k: 'FEEDBACK', title: 'FEEDBACK · DER KREISLAUF', text: 'Die Antwort wird bewertet: durch Nutzer, Daten oder statistische Signale. Das Modell lernt weiter.' },
  { t: 60, no: 8, k: 'GRUNDLAGE', title: 'GEOMETRISCHE GRUNDLAGE', text: 'Fibonacci · Goldener Schnitt · Naturmuster. Die Architektur folgt universellen Mustern, wie in der Natur.' },
  { t: 68, no: 9, k: 'EMERGENZ', title: 'EMERGENZ', text: 'Aus einfacher Struktur entsteht komplexes Verhalten.' },
  { t: 74, no: 10, k: 'ZUKUNFT', title: 'PHYSIK & MÖGLICHE ZUKUNFT', text: 'Heute: Hochleistungsrechner mit GPUs und TPUs, quanteninspirierte Algorithmen. Morgen vielleicht Qubits. Die Prinzipien bleiben: Muster, Überlagerung, Verbindung.' },
  { t: 80, no: 11, k: 'FINALE', title: 'Resonanz statt Kontrolle.', text: 'Balance · Hier und Jetzt · Mit Herz und Hirn' }
];
const DUR = 88;
const chapAt = t => { let i = 0; for (let k = 0; k < CHAP.length; k++) if (t >= CHAP[k].t) i = k; return i; };
const P_KEYS = [[5.4, 0], [11.2, 1], [12.5, 1], [18, 2], [19.6, 2], [25.6, 3], [26.6, 3], [36, 4], [45.3, 4], [52.4, 5], [53.4, 5], [59.8, 6.02]];
function tourP(t) { if (t < P_KEYS[0][0]) return -1; for (let i = 0; i < P_KEYS.length - 1; i++) { const [t0, p0] = P_KEYS[i], [t1, p1] = P_KEYS[i + 1]; if (t < t1) return lerp(p0, p1, (t - t0) / (t1 - t0)); } return 6.1; }
const TOUR_TOKS = ['Was', ' ist', ' Intellig', 'enz', '?'];
const TOUR_CAND = [['Resonanz', .46], ['Muster', .21], ['Balance', .15], ['Verbindung', .11], ['Kontrolle', .07]];
const tourMsg = makeMsg('Was ist Intelligenz?', { tour: true, toks: TOUR_TOKS, cand: TOUR_CAND });
// Kamera-Schlüsselbilder [t, pos, ziel]
const CK = [
  [0, [0, 4, 30], [0, 2, 0]], [3.5, [-4, 5, 22], [-3, 2.6, 0]],
  [5, [-15, 6.6, 9.5], [-14, 4.8, 0]], [9, [-11.5, 6, 6.2], [-10.5, 4.9, 0]], [11.5, [-9.6, 5.6, 4.6], [-8.8, 4.9, .2]],
  [12.5, [-5.6, 6.6, 5.4], [-7.2, 4.9, 0]], [16, [-8.8, 6.4, 4.8], [-7, 4.9, 0]], [18.5, [-6, 5.6, 6.5], [-5.6, 4.7, 0]],
  [19.5, [-8.4, 2.6, 6], [-7, 1.7, 0]], [23, [-6, 2.4, 5.2], [-6.6, 1.7, 0]], [25.4, [-3.5, 4.6, 8.2], [-2.2, 3.4, 0]],
  [26.6, [5.4, 7.6, 8.6], [0, 4, 0]], [29.5, [7, 4.8, 7.4], [0, 3, 0]], [32.5, [-6.6, 3.6, 7.2], [0, 2, 0]], [35.5, [-5.2, 1.6, 7.8], [0, .9, 0]],
  [37, [5.5, 7.2, 8.6], [8, 6.2, -.6]], [41, [9, 7, 6.2], [8.8, 6.1, -.6]], [44.4, [11.6, 6.9, 5.6], [10.2, 6, -.6]],
  [45.4, [4.4, 2.6, 6.2], [3.8, .6, .5]], [49, [6.4, 2.9, 8.2], [5.8, .7, .3]], [52.4, [13, 2.6, 8.5], [14, .8, 0]],
  [53.4, [8, 5, 24], [1, .2, 4]], [56.5, [-2, 3, 21], [-6, 0, 5]], [59.6, [-11, 4, 16], [-10, 1.2, 4]],
  [60.6, [0, 6.4, 15.5], [0, -2, 3]], [64, [3.2, 4.2, 11.8], [0, -2.2, 3.4]], [67.4, [-1.6, .9, 12.6], [0, -2.1, 5.8]],
  [68.6, [0, -3.2, 16.5], [0, -5, 4.6]], [72, [2, -3.9, 13.6], [0, -5.2, 4.6]], [73.6, [0, -3.8, 14.8], [0, -5.2, 4.6]],
  [74.6, [-5.6, .2, 11.2], [-9.4, -1.8, 5]], [77, [5.4, .6, 11.4], [9.4, -1, 5]], [79.4, [0, 2, 22], [0, 1, 2]],
  [80.4, [0, 2.4, 21], [0, 2.2, 0]], [84, [0, 3.6, 28], [0, 1.8, 0]], [88, [0, 5, 36], [0, 1.6, 0]]
];
const camPC = new THREE.CatmullRomCurve3(CK.map(k => new V3(...k[1])), false, 'centripetal');
const camTC = new THREE.CatmullRomCurve3(CK.map(k => new V3(...k[2])), false, 'centripetal');
function tourCam(t, pos, tgt) {
  t = clamp(t, 0, DUR); let i = 0; while (i < CK.length - 2 && t >= CK[i + 1][0]) i++;
  const f = sat((t - CK[i][0]) / (CK[i + 1][0] - CK[i][0])); const fe = f * .55 + ease(f) * .45; const u = (i + fe) / (CK.length - 1);
  camPC.getPoint(u, pos); camTC.getPoint(u, tgt);
  pos.x += Math.sin(t * .37) * .08; pos.y += Math.sin(t * .29 + 1) * .06;
  const asp = camera.aspect; if (asp < 1) { pos.sub(tgt).multiplyScalar(1 + (1 - asp) * 1.05).add(tgt); }
}

// ================================================================ KLANG (generativ, Web Audio)
const PENTA = [110, 130.8, 146.8, 164.8, 196, 220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
const CHORDS = [[110, 164.8, 220, 261.6], [110, 164.8, 246.9, 329.6], [87.3, 130.8, 220, 261.6], [130.8, 196, 261.6, 329.6], [98, 146.8, 246.9, 293.7], [73.4, 146.8, 220, 349.2], [110, 164.8, 220, 261.6], [87.3, 174.6, 220, 261.6], [65.4, 196, 261.6, 329.6], [82.4, 164.8, 246.9, 329.6], [87.3, 174.6, 246.9, 329.6], [110, 164.8, 277.2, 329.6]];
function buildAudio(ctx, live) {
  const G = { ctx, live };
  G.master = ctx.createGain(); G.master.gain.value = live ? 0 : .95;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
  G.bus = ctx.createGain(); G.bus.connect(comp); comp.connect(lim); lim.connect(G.master); G.master.connect(ctx.destination);
  if (live && ctx.createMediaStreamDestination) { G.recDest = ctx.createMediaStreamDestination(); G.master.connect(G.recDest); }
  const sr = ctx.sampleRate, len = Math.floor(sr * 3.8), ir = ctx.createBuffer(2, len, sr);
  const r = rng(77); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const conv = ctx.createConvolver(); conv.buffer = ir; G.rev = ctx.createGain(); G.rev.gain.value = .9; const wet = ctx.createGain(); wet.gain.value = .55; G.rev.connect(conv); conv.connect(wet); wet.connect(comp);
  const nb = ctx.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1; G.noise = nb;
  // Drone: 4 Stimmen + Sub
  G.voices = []; const dg = ctx.createGain(); dg.gain.value = 1; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = .8; dg.connect(lp); lp.connect(G.bus); const ds = ctx.createGain(); ds.gain.value = .5; lp.connect(ds); ds.connect(G.rev);
  const lfo = ctx.createOscillator(); lfo.frequency.value = .06; const lfoG = ctx.createGain(); lfoG.gain.value = 320; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
  for (let i = 0; i < 4; i++) { const g = ctx.createGain(); g.gain.value = .032; g.connect(dg); const os = [-7, 7].map(c => { const o = ctx.createOscillator(); o.type = i === 0 ? 'triangle' : 'sawtooth'; o.frequency.value = CHORDS[0][i]; o.detune.value = c + i; o.connect(g); o.start(); return o; }); G.voices.push(os); }
  G.sub = ctx.createOscillator(); G.sub.frequency.value = 55; const sg = ctx.createGain(); sg.gain.value = .07; G.sub.connect(sg); sg.connect(G.bus); G.sub.start();
  G.lp = lp; return G;
}
function aChord(G, when, ch, tc = .5) { const f = CHORDS[ch % CHORDS.length]; G.voices.forEach((os, i) => os.forEach(o => o.frequency.setTargetAtTime(f[i], when, tc))); G.sub.frequency.setTargetAtTime(f[0] / 2, when, tc); }
function aOut(G, node, pan, wetv) { const ctx = G.ctx; let n = node; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); n = p; } n.connect(G.bus); if (wetv) { const w = ctx.createGain(); w.gain.value = wetv; n.connect(w); w.connect(G.rev); } }
function aPing(G, when, f, a = .06, dec = 1.6, pan = 0, wetv = .7) { const ctx = G.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(); o.frequency.value = f; o2.frequency.value = f * 2.76; g2.gain.value = .15; o.connect(g); o2.connect(g2); g2.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + dec); aOut(G, g, pan, wetv); o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05); }
function aTick(G, when, f, a = .035) { const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .003); g.gain.exponentialRampToValueAtTime(.0001, when + .09); aOut(G, g, (f % 7) / 7 - .5, .3); o.start(when); o.stop(when + .12); }
function aWhoosh(G, when, dur = 1.8, a = .1, f0 = 250, f1 = 2600) { const ctx = G.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = G.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(f0, when); bp.frequency.exponentialRampToValueAtTime(f1, when + dur * .55); bp.frequency.exponentialRampToValueAtTime(f0 * 1.5, when + dur); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + dur * .5); g.gain.linearRampToValueAtTime(0, when + dur); s.connect(bp); bp.connect(g); aOut(G, g, 0, .6); s.start(when); s.stop(when + dur + .05); }
function aThump(G, when, a = .3) { const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(70, when); o.frequency.exponentialRampToValueAtTime(36, when + .35); o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + .6); aOut(G, g, 0, .15); o.start(when); o.stop(when + .65); }
function aGliss(G, when, f0, f1, dur, a = .045) { const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(f0, when); o.frequency.exponentialRampToValueAtTime(f1, when + dur); o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + dur * .3); g.gain.linearRampToValueAtTime(0, when + dur); aOut(G, g, 0, .8); o.start(when); o.stop(when + dur + .05); }
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
function playEv(G, when, e) {
  switch (e[0]) {
    case 'tick': return aTick(G, when, e[1]); case 'ping': return aPing(G, when, e[1], e[2] || .06, e[3] || 1.6, e[4] || 0);
    case 'swoosh': return aWhoosh(G, when, e[1] || 1, .05, 400, 3200); case 'whoosh': return aWhoosh(G, when, 1.8, .09);
    case 'arp': return e[1].forEach((f, i) => aPing(G, when + i * .11, f, .05, 1.4, (i - 1) * .4));
    case 'gliss': return aGliss(G, when, e[1], e[2], e[3]); case 'thump': return aThump(G, when, e[1] || .28);
    case 'bell': return aBell(G, when, e[1], e[2] || .05); case 'choir': return aChoir(G, when, e[1], e[2], e[3] || .045);
    case 'chord': return aChord(G, when, e[1]); case 'wupd': for (let i = 0; i < 6; i++) aTick(G, when + i * .05, 2000 + i * 230, .02); return;
  }
}
// Kapitel-Ereignisse der Tour (Klangpartitur)
const TOUR_EV = (() => {
  const ev = []; const E = (t, ...e) => ev.push([t, e]);
  CHAP.forEach((c, i) => { if (i) E(c.t - .8, 'whoosh'); E(c.t, 'chord', i); });
  [220, 329.6, 440, 659.3].forEach((f, i) => E(.6 + i * .55, 'bell', f, .045));
  for (let t = 19.8; t < 25.6; t += .37) E(t, 'tick', 900 + ((t * 100) % 7) * 120);
  for (let t = 37.6; t < 44.8; t += .92) E(t, 'thump', .26);
  [[38.3, 196], [39.4, 293.7], [40.5, 440], [42, 587.3]].forEach(([t, f]) => E(t, 'ping', f, .07, 2.2));
  [1, 1, 2, 3, 5, 8].reduce((acc, f, i) => { const t = 60.8 + acc * .26; E(t, 'bell', PENTA[6 + i], .04); return acc + f; }, 0);
  for (let k = 0; k < 34; k++) E(68.4 + 5.2 * Math.pow(k / 34, .7), 'ping', PENTA[(k * 3) % 11 + 5], .022 + .02 * (k / 34), 1.2, Math.sin(k * 1.7) * .8);
  for (let k = 0; k < 8; k++) E(74.6 + k * .66, 'bell', [659.3, 880, 784, 1046.5][k % 4], .028);
  E(80, 'choir', 8.6, [220, 277.2, 329.6, 440, 554.4], .045); E(80.3, 'bell', 880, .05); E(84.2, 'bell', 440, .045);
  return ev.sort((a, b) => a[0] - b[0]);
})();

// ================================================================ STATE
const ST = { vol: .85, snd: true };
try { const s = JSON.parse(localStorage.getItem('kia.s') || '{}'); if (s.snd !== undefined) ST.snd = s.snd; } catch (_) { }
const saveS = () => { try { localStorage.setItem('kia.s', JSON.stringify({ snd: ST.snd })); } catch (_) { } };
let mode = 'tour', playing = false, tt = 0, started = false, manual = false, curChap = -1, freeChord = 0, freeChordT = 0, idle = 0;
let toastT = 0;
function toast(t, s = 2.4) { const e = $('toast'); e.textContent = t; e.classList.remove('hide'); e.style.opacity = 1; toastT = s; }

// ================================================================ SOUND (live)
const SND = (() => {
  let ctx = null, G = null; const st = { ev: 0 };
  function unlock() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { ctx = new AC(); G = buildAudio(ctx, true); } catch (e) { console.warn(e); ctx = null; return; } }
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
    if (ctx.state !== 'running') ctx.resume().catch(() => { });
    vol(); syncChord(true);
  }
  function vol() { if (!G) return; const v = (ST.snd || window.__recOn) ? ST.vol * (ST.snd ? 1 : .0001) : 0; G.master.gain.setTargetAtTime(v, ctx.currentTime, .2); }
  function ev(e, delay = 0) { if (!G || (!ST.snd && !window.__recOn)) return; st.ev++; try { playEv(G, ctx.currentTime + .03 + delay, e); } catch (err) { console.warn(err); } }
  function syncChord(instant) { if (!G) return; const ch = mode === 'tour' ? chapAt(tt) : freeChord; aChord(G, ctx.currentTime, ch, instant ? .05 : .6); }
  return { unlock, vol, ev, syncChord, recTracks: () => G && G.recDest ? G.recDest.stream.getAudioTracks() : [], get ctx() { return ctx; }, stats: st };
})();
function sndBtn() { $('bSnd').textContent = ST.snd ? 'TON AN' : 'TON AUS'; $('bSnd').classList.toggle('on', ST.snd); }
$('bSnd').onclick = () => { ST.snd = !ST.snd; if (ST.snd) SND.unlock(); SND.vol(); sndBtn(); saveS(); toast(ST.snd ? 'TON AN' : 'TON AUS'); };
sndBtn();
let evI = 0;
function resetEvI() { evI = 0; while (evI < TOUR_EV.length && TOUR_EV[evI][0] < tt) evI++; }

// ================================================================ KAMERA
const cam = { pos: new V3(0, 4, 30), tgt: new V3(0, 2, 0) };
const orb = { th: .3, ph: 1.32, d: 30, t: new V3(0, 1.6, 1.5) }, goal = { th: .3, ph: 1.32, d: 30, t: new V3(0, 1.6, 1.5) };
const _tp = new V3(), _tt = new V3();
function orbFrom(pos, tgt, o) { const off = pos.clone().sub(tgt); o.d = off.length(); o.th = Math.atan2(off.x, off.z); o.ph = Math.acos(clamp(off.y / o.d, -1, 1)); o.t.copy(tgt); }
function freeCam(dt) {
  const k = 1 - Math.exp(-dt * 3.2); let dth = goal.th - orb.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  orb.th += dth * k; orb.ph = lerp(orb.ph, goal.ph, k); orb.d = lerp(orb.d, goal.d, k); orb.t.lerp(goal.t, k);
  const s = Math.sin(orb.ph); cam.tgt.copy(orb.t); cam.pos.set(orb.t.x + orb.d * s * Math.sin(orb.th), orb.t.y + orb.d * Math.cos(orb.ph), orb.t.z + orb.d * s * Math.cos(orb.th));
}
function applyCam() { camera.position.copy(cam.pos); camera.lookAt(cam.tgt); }
function overviewGoal() { goal.th = .32; goal.ph = 1.33; goal.d = camera.aspect < 1 ? 44 : 30; goal.t.set(0, 1.6, 1.5); }

// ================================================================ UI: Karten, Overlays, Zeitachse
function setCard(i) {
  const c = CHAP[i]; if (!c || !c.no || c.no > 10) { $('card').classList.add('hide'); return; }
  $('cNo').textContent = c.no; $('cT').textContent = c.title; $('cX').textContent = c.text; $('card').classList.remove('hide', 'out'); $('card').classList.add('in');
}
function hideCard() { $('card').classList.remove('in'); $('card').classList.add('out'); }
let cardFor = -1, cardFreeT = 0;
function setStatus() { const i = mode === 'tour' ? chapAt(tt) : curChap; const c = CHAP[Math.max(0, i)]; $('stK').textContent = mode === 'tour' ? (c.no ? `KAPITEL ${c.no}/11 · ${c.k}` : 'INTRO') : (i > 0 ? `FREI · ${c.k}` : 'FREI ERKUNDEN'); }
// markers
{
  const mk = $('marks'); CHAP.forEach((c, i) => { if (!i) return; const b = document.createElement('button'); b.className = 'mk'; b.style.left = (c.t / DUR * 100) + '%'; b.textContent = c.no <= 10 ? c.no : '∞'; b.title = c.title; b.onclick = e => { e.stopPropagation(); seek(c.t + .01, true); }; mk.appendChild(b); });
  $('tDur').textContent = fmtT(DUR);
}
function playBtn() { $('bPlay').classList.toggle('playing', playing); $('bPlay').setAttribute('aria-label', playing ? 'Pause' : 'Abspielen'); }
function setMode(m, keep) {
  if (m === mode && !keep) return; mode = m; document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); document.body.classList.toggle('free', m === 'frei');
  if (m === 'frei') { playing = false; playBtn(); orbFrom(cam.pos, cam.tgt, orb); orbFrom(cam.pos, cam.tgt, goal); hideCard(); $('finale').classList.add('hide'); $('intro').classList.add('hide'); curChap = -1; }
  else { resetEvI(); }
  SND.syncChord(); setStatus();
}
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { if (b.dataset.mode === 'tour') { setMode('tour'); if (tt >= DUR - .05) seek(0); playing = true; playBtn(); } else { setMode('frei'); overviewGoal(); toast('FREI ERKUNDEN · TIPP EINE STATION AN'); } });
function seek(t, play) { setMode('tour', true); tt = clamp(t, 0, DUR); tourMsg.last = tourP(tt); tourMsg.p = tourMsg.last; resetEvI(); cardFor = -1; SND.syncChord(true); if (play !== undefined) { playing = play; playBtn(); } }
$('bPlay').onclick = () => { if (mode !== 'tour') setMode('tour'); if (tt >= DUR - .05) seek(0); playing = !playing; playBtn(); if (playing && !SND.ctx && ST.snd) SND.unlock(); };
{
  const tr = $('track'); let drag = false;
  const at = e => { const r = tr.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * DUR; };
  tr.addEventListener('pointerdown', e => { if (e.target.classList.contains('mk')) return; drag = true; tr.setPointerCapture(e.pointerId); seek(at(e)); });
  tr.addEventListener('pointermove', e => { if (drag) seek(at(e)); });
  tr.addEventListener('pointerup', () => drag = false); tr.addEventListener('pointercancel', () => drag = false);
}
// Reiz-Eingabe
$('pform').addEventListener('submit', e => { e.preventDefault(); const v = $('prompt').value.trim(); if (!v) { $('prompt').focus(); return; } sendReiz(v); $('prompt').value = ''; $('prompt').blur(); });
function sendReiz(text) {
  if (!SND.ctx && ST.snd) SND.unlock();
  if (mode === 'tour') { setMode('frei'); goal.th = .2; goal.ph = 1.36; goal.d = camera.aspect < 1 ? 50 : 34; goal.t.set(-1, 2.2, 1); }
  const m = makeMsg(text); toast(`REIZ: ${m.toks.map(t => t.t.trim()).join(' · ')}`); flowPanel(m, true); return m;
}
// Fluss-Anzeige
let flowShown = null, flowStage = '';
const STAGES = [[0, 'TOKENISIERUNG'], [1, 'VEKTOREN'], [2, 'EMBEDDING'], [3, 'ATTENTION'], [3.5, 'FEEDFORWARD'], [3.75, 'ZWIEBEL'], [4, 'OUTPUT-VERTEILUNG'], [4.35, 'ANTWORT'], [5, 'FEEDBACK'], [5.55, 'GEWICHTE LERNEN']];
function flowPanel(m, force) {
  const el = $('flow'); if (!m) { if (flowShown) { el.classList.add('hide'); flowShown = null; } return; }
  if (flowShown !== m || force) { flowShown = m; el.classList.remove('hide'); $('fIn').textContent = '„' + m.text + '“'; $('fTok').innerHTML = m.toks.map(t => `<span style="border-color:#${t.col.getHexString()}">${t.t.trim().replace(/[<>&]/g, '')}<i>#${t.id}</i></span>`).join(''); flowStage = ''; }
  let s = STAGES[0][1]; for (const [p, n] of STAGES) if (m.p >= p) s = n; if (s !== flowStage) { flowStage = s; $('fStage').textContent = '▸ ' + s; }
  $('fOut').innerHTML = m.p >= 4.3 ? `ANTWORT <b>${m.cand[0][0]}</b> ${(m.cand[0][1] * 100).toFixed(0)}%` : '&nbsp;';
}

// ================================================================ INTERAKTION (drehen, zoomen, antippen)
const HOT = [[1, new V3(-14, 4.9, 0)], [1, new V3(-9.45, 4.95, .3)], [2, VC], [3, WM], [4, new V3(0, 2.3, 0)], [4, new V3(0, 4.6, 0)], [4, new V3(0, .3, 0)], [5, OB], [5, OB.clone().add(new V3(-2.75, 0, 0))], [5, OB.clone().add(new V3(2.75, 0, 0))], [6, new V3(4, .7, .9)], [6, new V3(12, .8, 0)], [7, new V3(0, -2.95, 9.6)], [7, new V3(-15, -2.5, 7.6)], [8, new V3(0, FY, 4)], [8, new V3(0, FY + .9, 6.6)], [9, EP], [10, CH], [10, QA]];
function project(p) { const v = p.clone().project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; }
function pickAt(x, y) { let best = null, bd = 70; for (const [ch, p] of HOT) { const [sx, sy, sz] = project(p); if (sz > 1) continue; const d = Math.hypot(sx - x, sy - y); if (d < bd) { bd = d; best = ch; } } return best; }
function focusChap(i, signal) {
  const c = CHAP[i]; if (!c) return; setMode('frei'); curChap = i; const next = CHAP[i + 1] ? CHAP[i + 1].t : DUR;
  tourCam((c.t + next) / 2, _tp, _tt); orbFrom(_tp, _tt, goal); setCard(i); cardFreeT = 12; setStatus(); SND.ev(['whoosh']);
  if (i === 4 || signal) { const w = VOCAB[(Math.random() * VOCAB.length) | 0]; const m = makeMsg(w, { p0: i === 4 ? 2.7 : 0 }); flowPanel(m, true); }
}
{
  const pts = new Map(); let pinch0 = 0, d0 = 0, moved = 0, downT = 0;
  canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; downT = performance.now(); idle = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); d0 = goal.d; } });
  canvas.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; const pr = pts.get(e.pointerId), dx = e.clientX - pr[0], dy = e.clientY - pr[1]; pts.set(e.pointerId, [e.clientX, e.clientY]); moved += Math.abs(dx) + Math.abs(dy); idle = 0;
    if (moved > 8 && mode === 'tour') { setMode('frei'); toast('FREI · TOUR PAUSIERT'); }
    if (mode !== 'frei') return;
    if (pts.size === 1) { goal.th -= dx * .0055; goal.ph = clamp(goal.ph - dy * .0045, .08, 3.0); if (cardFreeT > 0 && moved > 40) { hideCard(); cardFreeT = 0; } }
    else if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch0 > 0) goal.d = clamp(d0 * pinch0 / d, 2.5, 70); }
  });
  const up = e => { const was = pts.has(e.pointerId); pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (was && moved < 8 && performance.now() - downT < 450 && started) { const ch = pickAt(e.clientX, e.clientY); if (ch) focusChap(ch); else if (mode === 'frei') { SND.ev(['ping', PENTA[5 + (Math.random() * 8 | 0)], .05]); } } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => { e.preventDefault(); idle = 0; if (mode === 'tour') setMode('frei'); goal.d = clamp(goal.d * Math.exp(e.deltaY * .0012), 2.5, 70); }, { passive: false });
  addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { e.preventDefault(); $('bPlay').click(); } if (e.key === 'ArrowRight') seek(tt + 5); if (e.key === 'ArrowLeft') seek(tt - 5); });
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
      const name = `ki-architektur-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
    toast('REC LÄUFT · TIPP: TOUR VON VORN STARTEN');
  } catch (err) { rec = null; window.__recOn = false; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});

// ================================================================ QUALITÄT + GRÖSSE
let uH = 800;
function applyTier(t) {
  tier = t; const Tt = TIERS[t]; renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl; stream.geo.setDrawRange(0, Math.round(STRN * Tt.amb)); stars.geo.setDrawRange(0, Math.round(stars.n * (.5 + .5 * Tt.amb)));
  resize(); $('stQ').textContent = 'GRAFIK ' + Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 58 : 42; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(); uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of UPT) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  for (const L of layerLabels) L.visible = true;
}
addEventListener('resize', resize);
$('bQ').onclick = () => { autoQ = false; applyTier((tier + 1) % 4); toast('GRAFIK: ' + TIERS[tier].n); };

// ================================================================ GEWICHTE
let wSerial = 0;
function weightUpdate() { W.wave = 0; W.done = new Uint8Array(WCOLS); W.r = rng(1000 + wSerial++); }
function updWeights(dt) {
  if (W.wave >= 0) { W.wave += dt * 1.5; const col = Math.floor(W.wave * WCOLS); for (let c = 0; c < WCOLS && c <= col; c++) { const cc = WCOLS - 1 - c; if (W.done[cc]) continue; W.done[cc] = 1; for (let r = 0; r < WROWS; r++) { const k = r * WCOLS + cc; W.fl[k] = 1; W.tg[k] = clamp(W.tg[k] + (W.r() - .5) * .55, .02, .98); } } if (W.wave > 1.05) W.wave = -1; }
  const cont = (mode === 'tour' && chapAt(tt) === 3) ? 7 : .8; if (Math.random() < dt * cont) { const k = Math.random() * W.v.length | 0; W.fl[k] = Math.max(W.fl[k], .7); W.tg[k] = clamp(W.tg[k] + (Math.random() - .5) * .35, .02, .98); }
  for (let k = 0; k < W.v.length; k++) { W.v[k] = lerp(W.v[k], clamp(W.tg[k] + .07 * Math.sin(T * .8 + W.ph[k]), 0, 1), 1 - Math.exp(-dt * 2)); W.fl[k] *= Math.exp(-dt * 2.4); wmMesh.setColorAt(k, wColor(W.v[k], W.fl[k], _wc)); }
  wmMesh.instanceColor.needsUpdate = true;
}
const cellW = (k, out = new V3()) => out.set(WM.x + ((k % WCOLS) - (WCOLS - 1) / 2) * WCELL, WM.y + ((WROWS - 1) / 2 - Math.floor(k / WCOLS)) * WCELL, WM.z);

// ================================================================ FRAME
let lastNow = performance.now(), frameN = 0, wLinkK = 0, bbK = .3, barsOwner = null;
const fpsWin = []; let lowT = 0, warm = 0;
const _v = new V3(), _v2 = new V3();
function frame(dt) {
  T += dt; const t = T;
  if (mode === 'tour' && playing && started) { tt += dt; if (tt >= DUR) { tt = DUR; playing = false; playBtn(); toast('ENDE · ▶ FÜR NOCHMAL', 3); } }
  const ch = mode === 'tour' ? chapAt(tt) : curChap;
  if (mode === 'tour' && ch !== cardFor) { cardFor = ch; if (VIDEO) setCard(ch); else { hideCard(); setTimeout(() => { if (mode === 'tour' && cardFor === ch) setCard(ch); }, 350); } if (started) SND.syncChord(); setStatus(); }
  if (VIDEO && mode === 'tour') { const c0 = CHAP[ch], nx = CHAP[ch + 1] ? CHAP[ch + 1].t : DUR, o = Math.min(sat((tt - c0.t - .25) / .7), sat((nx - tt - .1) / .45)); const cd = $('card'); cd.style.opacity = o.toFixed(3); cd.style.transform = `translateY(${((1 - o) * 10).toFixed(1)}px)`; }
  if (VIDEO && mode === 'tour') { const c = CHAP[ch]; if (c.no >= 1 && c.no <= 10 && $('cT').textContent !== c.title) setCard(ch); }
  if (mode === 'frei') { freeChordT -= dt; if (freeChordT <= 0) { freeChordT = 14; freeChord = [0, 2, 3, 4, 6, 8][(frameN / 7 | 0) % 6]; SND.syncChord(); } if (cardFreeT > 0) { cardFreeT -= dt; if (cardFreeT <= 0) hideCard(); } }
  // Overlays Intro/Finale
  const tourVis = mode === 'tour' && started;
  $('intro').classList.toggle('hide', !(tourVis && tt > .2 && tt < 4.7)); $('finale').classList.toggle('hide', !(tourVis && tt >= 80.6));
  if (tourVis && tt >= 80.6) $('finale').style.opacity = ease((tt - 80.6) / 1.6); if (tourVis && tt < 4.7) $('intro').style.opacity = ease((tt - .2) / 1) * (1 - ease((tt - 3.9) / .8));
  // Tour-Reiz
  tourMsg.vis = mode === 'tour'; const tp = tourP(tt);
  if (mode === 'tour') { const ev = []; if (tp > tourMsg.last && tp - tourMsg.last < .5) flowEvents(tourMsg.last, tp, tourMsg.toks.length, ev); for (const e of ev) { if (e[0] === 'wupd') weightUpdate(); if (started) SND.ev(e); } }
  tourMsg.p = tp; tourMsg.last = tp;
  for (let i = MSGS.length - 1; i >= 0; i--) { const m = MSGS[i]; const p0 = m.p; m.p += dt * .52; const ev = []; flowEvents(p0, m.p, m.toks.length, ev); for (const e of ev) { if (e[0] === 'wupd') weightUpdate(); SND.ev(e); } if (m.p > 6.1) killMsg(m); }
  // Hervorhebungen
  hlN = 0; for (const L of LAYERS) { L.glow.fill(0); }
  if (mode === 'tour') { msgHighlights(tourMsg); updateMsgParticles(tourMsg); } else { tourMsg.vis = false; updateMsgParticles(tourMsg); }
  for (const m of MSGS) { msgHighlights(m); updateMsgParticles(m); }
  flowP.up();
  let fm = MSGS.length ? MSGS[MSGS.length - 1] : (mode === 'tour' && tp >= 0 && tp < 6.05 ? tourMsg : null); flowPanel(fm);
  // Gewichte + Verbindungen Matrix → Turm
  updWeights(dt);
  const wkT = (mode === 'tour' && ch === 3 ? 1 : 0) + Math.max(0, ...MSGS.map(m => (m.p > 2.4 && m.p < 4 ? .6 : 0)), mode === 'tour' && tp > 2.4 && tp < 4 ? .5 : 0);
  wLinkK = lerp(wLinkK, Math.min(1, wkT), 1 - Math.exp(-dt * 3));
  for (const wl of WLINK) { cellW(wl.k, _v); nodeW(wl.L, wl.j, _v2); const pulse = .5 + .5 * Math.sin(t * 3 + wl.k); wColor(W.v[wl.k], W.fl[wl.k], _col); hl(_v, _v2, _col, (.12 + wLinkK * (.5 + .5 * pulse)) * 1.1, .3); }
  // Ebenen
  for (let L = 0; L < NL; L++) { const Ly = LAYERS[L]; Ly.flash *= Math.exp(-dt * 2.5); const f = Ly.flash; const amb = .5 + .5 * Math.sin(t * 1.3 - L * .8);
    Ly.glassM.opacity = .13 + f * .22 + amb * .03; Ly.faceM.opacity = .62 + f * .5; Ly.edgeM.color.setRGB(.62 + f, .55 + f * .6, 1.35 + f * .4);
    for (let i = 0; i < NN; i++) { const k = L * NN + i, g = Ly.glow[i], gold = nodeGold[k]; const c = gold ? C.au : C.vi; const tw = .25 + .15 * Math.sin(t * 2 + k * 1.7); nodeGlowP.col.set([c.r * (.8 + g), c.g * (.8 + g), c.b * (.8 + g)], k * 3); nodeGlowP.size[k] = .26 + g * .45; nodeGlowP.alpha[k] = tw * .7 + g * .8; } }
  nodeGlowP.up();
  // Strahl, Halo, Portal
  const bp = .75 + .25 * Math.sin(t * 2.1); beamGlowM.opacity = .4 + .25 * bp; beamCore.material.color.setRGB(2.2 + bp * .6, 1.5 + bp * .3, .55);
  halo.rotation.y = t * .25; haloDisc.rotation.z = -t * .1; haloT2.scale.setScalar(1 + .06 * Math.sin(t * 1.6));
  portalM.uniforms.uT.value = t; portalM.uniforms.uK.value = .9 + .2 * Math.sin(t * .8);
  // Wellen
  waveIn.mat.uniforms.uT.value = t; waveOut.mat.uniforms.uT.value = t;
  let outPulse = -1, fbP = -1, inK = 0;
  for (const m of [tourMsg, ...MSGS]) { if (!m.vis) continue; if (m.p > 4.35 && m.p < 5) outPulse = (m.p - 4.35) / .65; if (m.p >= 5 && m.p < 6.05) fbP = sat((m.p - 5) * 1.15); if (m.p >= 0 && m.p < 1) inK = Math.max(inK, Math.sin(Math.PI * m.p)); }
  waveIn.mat.uniforms.uK.value = 1 + inK * .8; waveOut.mat.uniforms.uPulse.value = outPulse; waveOut.mat.uniforms.uK.value = 1 + (outPulse >= 0 ? .6 : 0);
  waveIn.mat.uniforms.uPulse.value = inK > 0 ? .95 - inK * .3 : -1;
  fbMat.uniforms.uT.value = t; fbMat.uniforms.uP.value = fbP; fbMat.uniforms.uK.value = 1 + (fbP >= 0 ? .5 : 0) + (mode === 'tour' && ch === 7 ? .4 : 0);
  // Balken
  let act = null; for (const m of [mode === 'tour' ? tourMsg : null, ...MSGS]) if (m && m.vis && m.p >= 3.7 && m.p < 6.3) act = m;
  if (act && barsOwner !== act) { barsOwner = act; BARS.forEach((b, i) => { b.word = act.cand[i][0]; barLabel(b, act.cand[i][0], act.cand[i][1], i === 0); }); }
  BARS.forEach((b, i) => { const tg = act ? act.cand[i][1] * 1.9 * ease((act.p - 3.85) / .4) + .03 : .05 + .03 * Math.sin(t * 1.2 + i); b.h = lerp(b.h, tg, 1 - Math.exp(-dt * 4)); b.m.scale.y = Math.max(.02, b.h * BARH); const win = act && i === 0; b.m.material.color.copy(win ? C.au : C.cy).multiplyScalar(win ? 1.5 : .9); b.e.material.color.copy(b.m.material.color).multiplyScalar(1.4); b.lab.material.opacity = act ? 1 : .45; });
  // Blackbox
  bbK = lerp(bbK, (mode === 'tour' && ch === 5) || curChap === 5 ? 1 : .35, 1 - Math.exp(-dt * 2));
  const beat = Math.pow(.5 + .5 * Math.sin(t * TAU / .92), 10);
  ORG[0].g.rotation.y = Math.sin(t * .3) * .35; ORG[0].P.mat.uniforms.uK.value = .7 + bbK * .6 + beat * .5 * bbK; ORG[0].g.scale.setScalar(1 + beat * .03 * bbK);
  ORG[1].g.rotation.y = t * .3; ORG[1].P.mat.uniforms.uK.value = .7 + bbK * .5 + .3 * Math.sin(t * 4);
  ORG[2].g.rotation.y = t * .22; ORG[2].g.rotation.x = Math.sin(t * .2) * .3; ORG[2].P.mat.uniforms.uK.value = .8 + bbK * .5 + beat * .4 * bbK;
  bbG.position.y = OB.y + Math.sin(t * .6) * .08;
  for (let i = 0; i < 150; i++) {
    const [ph, jy, jz, lane] = bbPhase[i]; const u = (ph + t * (.25 + .2 * bbK)) % 1;
    if (lane === 2) { _v.set(1.6, 3.6, 0); _v2.copy(OB).add(new V3(-3.7, -.2, 0)); } else { _v.copy(OB).add(new V3(lane ? .65 : -1.75, 0, 0)); _v2.copy(OB).add(new V3(lane ? 1.75 : -.65, 0, 0)); }
    _a.lerpVectors(_v, _v2, u); _a.y += Math.sin(u * Math.PI) * (lane === 2 ? 1.2 : .12) + jy; _a.z += jz; bbStream.pos.set([_a.x, _a.y, _a.z], i * 3);
    const c = C.au; const a = Math.sin(Math.PI * u) * (lane === 2 ? .45 : .9) * (.5 + .7 * bbK); bbStream.col.set([c.r * 1.6, c.g * 1.6, c.b * 1.6], i * 3); bbStream.alpha[i] = a; bbStream.size[i] = lane === 2 ? .06 : .085;
  }
  bbStream.up();
  // Datenstrom
  const NS = streamPath.length - 1, sk = mode === 'tour' && (ch === 0 || ch === 11) ? 1 : .8;
  for (let i = 0; i < STRN; i++) {
    const [ph, sp, a0, r, hu] = strPh[i]; const u = (ph + t * .012 * sp) % 1; const f = u * NS, i0 = Math.floor(f), fr = f - i0; const A = streamPath[i0], B = streamPath[Math.min(NS, i0 + 1)];
    const ang = a0 + t * 1.1 * sp; stream.pos[i * 3] = lerp(A.x, B.x, fr) + Math.cos(ang) * r * .4; stream.pos[i * 3 + 1] = lerp(A.y, B.y, fr) + Math.sin(ang) * r; stream.pos[i * 3 + 2] = lerp(A.z, B.z, fr) + Math.cos(ang * 1.3) * r;
    if (u < STRK) rainbow(sat(u / STRK) * .92 + hu * .08, _col); else _col.copy(C.au); stream.col[i * 3] = _col.r * 1.4; stream.col[i * 3 + 1] = _col.g * 1.4; stream.col[i * 3 + 2] = _col.b * 1.4;
    stream.alpha[i] = sk * (.35 + .4 * Math.sin(t * 3 + i)) * sat(u * 60) * sat((1 - u) * 60); stream.size[i] = .05 + .05 * hu;
  }
  stream.up();
  // Fibonacci
  fibG.rotation.y = t * .03; fibRing.material.color.setRGB(1.8 + .4 * Math.sin(t), 1.2 + .25 * Math.sin(t), .45);
  NAT.forEach((m, i) => { m.position.y = FY + .95 + Math.sin(t * .8 + i) * .05; });
  // Emergenz
  const eT = mode === 'tour' ? (ch === 9 ? ease((tt - 68.4) / 4.8) : ch > 9 ? 1 : 0) : .5 + .5 * Math.sin(t * .12); emE = lerp(emE, eT, 1 - Math.exp(-dt * 3));
  emDisc.material.uniforms.uT.value = t; emDisc.material.uniforms.uK.value = .55 + emE * .7; emT1.rotation.z = t * .1; emT2.rotation.z = -t * .07;
  for (let i = 0; i < EMN; i++) {
    const r0 = Math.sqrt((i + .5) / EMN) * 2.05, a0 = i * GA; const a = a0 + t * .25 * (1 + emE * 2.4 / (r0 + .35)); const r = r0 * (1 + emE * .16 * Math.sin(5 * a0 + t * 1.3 + r0 * 6));
    emP.pos[i * 3] = Math.cos(a) * r; emP.pos[i * 3 + 1] = Math.sin(a) * r; emP.pos[i * 3 + 2] = emE * .6 * Math.sin(a0 * 3 + t * 1.1 + r0 * 7) * r0 + .05;
    rainbow(lerp(.55, (r0 / 2.05) * .9 + .05 * Math.sin(a0), emE), _col).lerp(C.au, (1 - emE) * .6); emP.col.set([_col.r * 1.5, _col.g * 1.5, _col.b * 1.5], i * 3); emP.alpha[i] = .55 + .35 * Math.sin(t * 2 + i); emP.size[i] = .04 + emE * .04 * (.5 + .5 * Math.sin(i));
  }
  emP.up();
  // Chip, Qubit
  const zk = mode === 'tour' && ch === 10 ? 1 : 0; chipGlow.material.opacity = .35 + .35 * zk + .1 * Math.sin(t * 3); chipDie.material.color.setRGB(1.2 + .5 * zk + .2 * Math.sin(t * 5), 1.05 + .3 * zk, .9);
  QORB.forEach((q, i) => { const a = t * q.sp * (1.5 + zk) + i * 2; q.e.position.set(Math.cos(a) * .95, Math.sin(a) * .95, 0); }); qG.rotation.y = t * .2;
  stars.mat.uniforms.uK.value = .9 + .1 * Math.sin(t * .5);
  hlGeo.setDrawRange(0, hlN * 2); hlGeo.attributes.position.needsUpdate = true; hlGeo.attributes.color.needsUpdate = true;
  // Kamera
  if (mode === 'tour') { tourCam(tt, cam.pos, cam.tgt); } else { idle += dt; if (idle > 10 && cardFreeT <= 0) goal.th += dt * .04; freeCam(dt); }
  applyCam();
  // HUD
  if ((frameN & 3) === 0) { $('tfill').style.width = (tt / DUR * 100) + '%'; $('thumb').style.left = (tt / DUR * 100) + '%'; $('tNow').textContent = fmtT(tt); if (rec) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; } }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) { $('toast').style.opacity = 0; setTimeout(() => toastT <= 0 && $('toast').classList.add('hide'), 500); } }
  frameN++;
}
function render() { composer.render(); }
function loop(now) {
  requestAnimationFrame(loop);
  if (manual) return;
  let dt = (now - lastNow) / 1000; lastNow = now; if (!(dt > 0)) return; dt = Math.min(dt, .066);
  frame(dt); render();
  if (autoQ && started) {
    warm += dt; fpsWin.push(dt); if (fpsWin.length > 90) fpsWin.shift();
    if (warm > 4 && fpsWin.length >= 60) { const fps = fpsWin.length / fpsWin.reduce((a, b) => a + b, 0); if (fps < 40) { lowT += dt; if (lowT > 3 && tier < 3) { applyTier(tier + 1); toast('GRAFIK: ' + TIERS[tier].n); lowT = 0; fpsWin.length = 0; warm = 2; } } else lowT = Math.max(0, lowT - dt); }
  }
}

// ================================================================ START
function enter(m) {
  if (started) return; started = true; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  if (ST.snd) SND.unlock();
  if (m === 'frei') { setMode('frei', true); overviewGoal(); toast('FREI ERKUNDEN · TIPP EINE STATION AN ODER GIB EINEN REIZ EIN', 4); }
  else { setMode('tour', true); seek(0, true); }
}
$('goTour').onclick = () => enter('tour'); $('goFree').onclick = () => enter('frei');
async function loadFonts() { try { await Promise.race([Promise.all([document.fonts.load('600 40px NBMono'), document.fonts.load('400 40px NBMono')]), new Promise(r => setTimeout(r, 2500))]); } catch (_) { } }
await loadFonts();
// Ebenen-Beschriftung (links) + Kapitel-Beschriftungen
LNAME.forEach((n, L) => { const s = textSprite([{ t: n[0], c: '#e6e0ff' }, { t: n[1], s: .75, c: '#b8b0ff', w: 400 }], { h: .42, align: 'right' }); s.position.set(-2.55, LY[L] + .05, 0); scene.add(s); layerLabels.push(s); });
{ const s = textSprite([{ t: 'INPUT', c: '#bfe8ff', g: 'rgba(58,214,255,.9)' }, { t: 'Text · Bild · Ton · Kontext', s: .72, c: '#d8ecff', w: 400 }], { h: .5 }); s.position.set(-15.5, 6.5, 0); scene.add(s); }
{ const s = textSprite([{ t: 'VEKTORRAUM', c: '#bfe8ff', g: 'rgba(58,214,255,.9)' }, { t: 'Bedeutung wird Position', s: .72, c: '#d8ecff', w: 400 }], { h: .5 }); s.position.set(VC.x, VC.y + 1.9, 0); scene.add(s); }
{ const s = textSprite([{ t: 'GEWICHTE', c: '#ffd27a', g: 'rgba(255,170,40,.9)' }, { t: 'Training passt sie an', s: .72, c: '#ffe7b8', w: 400 }], { h: .5 }); s.position.set(WM.x, WM.y + 1.55, 0); scene.add(s); }
{ const s = textSprite([{ t: 'OUTPUT', c: '#bfe8ff', g: 'rgba(58,214,255,.9)' }, { t: 'Text · Bild · Entscheidung', s: .72, c: '#d8ecff', w: 400 }], { h: .5 }); s.position.set(15.5, 2.5, 0); scene.add(s); }
{ const s = textSprite([{ t: 'FEEDBACK', c: '#ffd27a', g: 'rgba(255,170,40,.9)' }, { t: 'Das Modell lernt weiter', s: .72, c: '#ffe7b8', w: 400 }], { h: .55 }); s.position.set(0, -2.15, 10.4); scene.add(s); }
{ const s = textSprite([{ t: 'EMERGENZ', c: '#ffd27a', g: 'rgba(255,170,40,.9)' }, { t: 'Aus einfacher Struktur entsteht komplexes Verhalten', s: .62, c: '#ffe7b8', w: 400 }], { h: .55 }); s.position.set(EP.x, EP.y - 3.05, EP.z); scene.add(s); }
{ const s = textSprite([{ t: 'DIE BLACKBOX', c: '#e6e0ff' }, { t: 'Drei Organe in einem System', s: .72, c: '#b8b0ff', w: 400 }], { h: .5 }); s.position.set(OB.x, OB.y + 1.75, OB.z); scene.add(s); }
applyTier(tier); tourCam(0, cam.pos, cam.tgt); applyCam();
requestAnimationFrame(loop);
frame(.016); render();
for (const id of ['goTour', 'goFree']) $(id).disabled = false; $('goTour').textContent = 'TOUR STARTEN'; $('goFree').textContent = 'FREI ERKUNDEN';
if (Q.has('go')) enter(Q.get('go') === 'frei' ? 'frei' : 'tour');
if ('serviceWorker' in navigator && !Q.has('nosw') && !VIDEO) { const reg = () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }); if (document.readyState === 'complete') reg(); else addEventListener('load', reg); }

// ================================================================ VIDEO-SPUR (offline gerendert, für die MP4)
async function renderAudio() {
  const sr = 44100, OC = window.OfflineAudioContext || window.webkitOfflineAudioContext; const oc = new OC(2, Math.ceil(sr * (DUR + .5)), sr);
  const G = buildAudio(oc, false); aChord(G, 0, 0, .01);
  for (const [t, e] of TOUR_EV) playEv(G, Math.max(0, t), e);
  let last = -1; const n = tourMsg.toks.length; for (let t = 0; t < DUR; t += 1 / 120) { const p = tourP(t); const ev = []; if (p > last) flowEvents(last, p, n, ev); for (const e of ev) playEv(G, t, e); last = p; }
  G.master.gain.setValueAtTime(0, 0); G.master.gain.linearRampToValueAtTime(.95, 1.2); G.master.gain.setValueAtTime(.95, DUR - 2.5); G.master.gain.linearRampToValueAtTime(0, DUR + .3);
  const buf = await oc.startRendering(); const L = buf.getChannelData(0), Rr = buf.getChannelData(1), N = L.length;
  const ab = new ArrayBuffer(44 + N * 4), dv = new DataView(ab); const ws = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); dv.setUint32(4, 36 + N * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); ws(36, 'data'); dv.setUint32(40, N * 4, true);
  let pk = 0; for (let i = 0; i < N; i++) { pk = Math.max(pk, Math.abs(L[i]), Math.abs(Rr[i])); dv.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true); dv.setInt16(46 + i * 4, clamp(Rr[i], -1, 1) * 32767, true); }
  const u8 = new Uint8Array(ab); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return { b64: btoa(s), peak: pk, dur: N / sr };
}

// ================================================================ TEST-HOOKS
window.__KI = {
  ready: true,
  setManual(v) { manual = v; lastNow = performance.now(); },
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); render(); },
  enter, seek(t, play = false) { seek(t, play); }, setMode, focus: focusChap, send: sendReiz, setTier(t) { autoQ = false; applyTier(t); },
  videoStart() { started = true; $('start').classList.add('hide'); setMode('tour', true); seek(0, true); manual = true; },
  videoFrame(t, dt = 1 / 30) { if (!started) this.videoStart(); playing = true; tt = Math.max(0, t - dt); T = 10 + t - dt; frame(dt); render(); },
  renderAudio,
  state() { return { tier: TIERS[tier].n, mode, playing, tt: +tt.toFixed(2), chap: chapAt(tt), p: +tourMsg.p.toFixed(3), msgs: MSGS.length, hl: hlN, cam: camera.position.toArray().map(v => +v.toFixed(2)), audio: SND.ctx ? SND.ctx.state : 'none', ev: SND.stats.ev }; },
  dbg: { bloom, scene, renderer, composer, camera },
  pick: pickAt, project(x, y, z) { return project(new V3(x, y, z)); }
};
