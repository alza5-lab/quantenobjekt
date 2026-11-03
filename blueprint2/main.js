// EYE OF RESONANCE // BLUEPRINT 2 · CONSTRUCTION / STRUCTURE / ARCHITECTURE
// A Unified Model of Perception, Consciousness and the Quantum Network · Gravity Point = Axon-Knoten
// Konzept: Luca Matteo Balzano 1991 · shivas_ocean · Story/UI: MindDrop · Look: Creator 2 · JDZ / LMB • v4.0 • 2026
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

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
// Farb-Grading: Mind<->AI (Farbton), Blueprint (Mono-Cyan + Raster)
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uAI: { value: 0 }, uMono: { value: 0 }, uGrid: { value: 0 }, uPx: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAI,uMono,uGrid,uPx; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
      { float L0=dot(c,vec3(.299,.587,.114)); c=max(vec3(0.),mix(vec3(L0),c,1.28)); }
      if(uAI>0.001){ float Y=dot(c,vec3(.299,.587,.114)), I=dot(c,vec3(.596,-.274,-.322)), Qq=dot(c,vec3(.211,-.523,.312)); float a=uAI*1.05, ca=cos(a), sa=sin(a); float I2=I*ca-Qq*sa, Q2=I*sa+Qq*ca; c=max(vec3(0.),vec3(Y+.956*I2+.621*Q2, Y-.272*I2-.647*Q2, Y-1.106*I2+1.703*Q2)); }
      float l=dot(c,vec3(.3,.55,.15));
      if(uMono>0.001){ vec3 m=vec3(.5,.85,1.)*l*1.3+vec3(.9,.97,1.)*pow(l,2.5)*.5; c=mix(c,m,uMono); }
      if(uGrid>0.001){ vec2 p=gl_FragCoord.xy/uPx; float g1=max(1.-smoothstep(0.,1.1,abs(mod(p.x,24.)-12.)-10.9),1.-smoothstep(0.,1.1,abs(mod(p.y,24.)-12.)-10.9)); float g2=max(1.-smoothstep(0.,1.3,abs(mod(p.x,120.)-60.)-58.7),1.-smoothstep(0.,1.3,abs(mod(p.y,120.)-60.)-58.7));
        vec3 bg=vec3(.015,.05,.12)+vec3(.12,.3,.55)*(g1*.18+g2*.38); c+=bg*uGrid*(1.-clamp(l*2.5,0.,1.)); }
      gl_FragColor=vec4(c,1.); }`
});
composer.addPass(grade);
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
const PSZ = { value: 1 }; // globaler Punktgrößen-Faktor (Blueprint/Simulation)
let GLOWK = 1, FILLK = 1;

// generic glowing point cloud (per-point color, size in world units, alpha)
function makePoints(n, opt = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n).fill(opt.size || .08), alpha = new Float32Array(n).fill(1);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('col', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTex }, uPR: { value: 1 }, uH: { value: 800 }, uK: { value: 1 }, uSz: PSZ }, ...ADD,
    vertexShader: `attribute vec3 col; attribute float size; attribute float alpha; uniform float uPR,uH,uSz; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*uSz*uPR*uH/max(.05,-mv.z),0.,180.); vC=col; vA=alpha; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uK; varying vec3 vC; varying float vA; void main(){ float a=texture2D(uMap,gl_PointCoord).a*vA*uK; if(a<.003) discard; gl_FragColor=vec4(vC*a,1.); }`
  });
  UPT.push(mat);
  const mesh = new THREE.Points(geo, mat); mesh.frustumCulled = false;
  return { geo, pos, col, size, alpha, mesh, mat, n, up() { geo.attributes.position.needsUpdate = true; geo.attributes.col.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; } };
}
function lineMat(color, op = .5) { return new THREE.LineBasicMaterial({ color, opacity: op, ...ADD }); }
function vlineMat(op = 1) { return new THREE.LineBasicMaterial({ vertexColors: true, opacity: op, ...ADD }); }
function glowSprite(color, s, op = 1) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color, opacity: op, ...ADD })); m.material.userData.glow = 1; m.scale.setScalar(s); return m; }
function fillMat(color, op) { const m = new THREE.MeshBasicMaterial({ color, opacity: op, ...ADD, side: THREE.DoubleSide }); m.userData.fill = 1; return m; }

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
  const G = GR[g] || (GR[g] = { items: [], f: 1, fl: 0 }); if (!obj.userData.grp) obj.userData.grp = g;
  obj.traverse(o => { if (!o.material) return; const m = o.material; if (m.userData.b0 === undefined) m.userData.b0 = m.uniforms && m.uniforms.uK ? m.uniforms.uK.value : m.opacity; G.items.push({ o, m, b: m.userData.b0 }); });
  return obj;
}
function applyGroups() {
  for (const k in GR) { const G = GR[k], f = G.f; for (const it of G.items) { if (it.m.uniforms && it.m.uniforms.uK) it.m.uniforms.uK.value = it.b * f; else it.m.opacity = it.b * f * (it.m.userData.glow ? GLOWK : it.m.userData.fill ? FILLK : 1); it.o.visible = f > .004; } }
}
function circlePts(r, n, y = 0, f) { const a = []; for (let i = 0; i <= n; i++) { const t = i / n * TAU; const rr2 = f ? f(t) * r : r; a.push(new V3(Math.cos(t) * rr2, y, Math.sin(t) * rr2)); } return a; }
function lineLoop(pts, mat) { return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat); }
const root = new THREE.Group(); scene.add(root);

// Sterne
const stars = makePoints(3200);
{ for (let i = 0; i < stars.n; i++) { const u = R() * 2 - 1, a = R() * TAU, r = 160 + R() * 260, s = Math.sqrt(1 - u * u); stars.pos.set([Math.cos(a) * s * r, u * r, Math.sin(a) * s * r], i * 3); const c = R() < .2 ? C.vi : R() < .4 ? C.cy : C.wh; const b = .25 + R() * .6; stars.col.set([c.r * b, c.g * b, c.b * b], i * 3); stars.size[i] = .5 + R() * 1.4; stars.alpha[i] = .4 + R() * .6; } stars.up(); scene.add(stars.mesh); }

// ================================================================ OBJEKT (Blueprint 2): Gravity Point in der Mitte, Resonance Rings, Field Expansion, Funnel, Quantum Lattice 8³, Ring Topology
const KY = 0;                 // Gravity Point = Axon-Knoten (Zentrum)
const TOPO_Y = -5.8;          // Ring Topology (Basis)
const FIELD_Y = 3.0;          // Field Expansion (Kuppel)
const LAT_Y0 = -5.0, LAT_Y1 = -2.9;   // Quantum Lattice
const IF_Y = 7.15;            // Universal Interface (Hex-Platte)
const P = { freq: .45, coh: .72, sym: .8, ent: .18, awa: .7, exp: .5 };
let symK = 8;

// ---- Lichtachse
const axisG = new THREE.Group(); root.add(axisG);
{
  const g = new THREE.BufferGeometry().setFromPoints([new V3(0, -7.2, 0), new V3(0, 7.9, 0)]);
  axisG.add(new THREE.Line(g, lineMat(new THREE.Color(1.6, 2.4, 3.2), .9)));
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 15, 10, 1, true), fillMat(new THREE.Color(.25, .55, 1), .35));
  cyl.position.y = .35; axisG.add(cyl);
}
const axisP = makePoints(170); axisG.add(axisP.mesh);
const axisS = Array.from({ length: axisP.n }, () => ({ y: rr(-7, 7.8), v: rr(.6, 2.2), r: rr(0, .08), a: rr(0, TAU) }));
reg('axis', axisG);

// ---- Ring Topology (Basis, Universal Model)
const topoG = new THREE.Group(); topoG.position.y = TOPO_Y; root.add(topoG);
const topoSpin = [];
{
  const radii = [1.2, 2.0, 2.8, 3.6, 4.4, 5.2, 6.0, 6.8, 7.6];
  radii.forEach((r, i) => {
    const c = _c1.copy(C.cy).lerp(C.vi, (i % 3) / 3).multiplyScalar(i === 6 ? 2.0 : .9 + .2 * (i % 2));
    topoG.add(lineLoop(circlePts(r, 220, 0), lineMat(c.clone(), i === 6 ? .9 : .42)));
    if (i % 2 === 0) topoG.add(lineLoop(circlePts(r + .06, 220, .02), lineMat(c.clone().multiplyScalar(.6), .28)));
  });
  const sp = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; sp.push(new V3(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2), new V3(Math.cos(a) * 7.6, 0, Math.sin(a) * 7.6)); }
  topoG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(sp), lineMat(new THREE.Color(.25, .45, 1), .1)));
  for (const [r, y] of [[2.4, .5], [3.3, .6], [4.6, .36]]) topoG.add(lineLoop(circlePts(r, 200, y), lineMat(new THREE.Color(.7, .5, 1.6), .45)));
  for (let j = 0; j < 4; j++) {
    const n = 60 + j * 24, r = 2.0 + j * 1.6, pp = makePoints(n);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; pp.pos.set([Math.cos(a) * r, .01, Math.sin(a) * r], i * 3); const c = i % 6 === 0 ? C.wh : j % 2 ? C.vi : C.cy; const b = i % 6 === 0 ? 1.5 : .85; pp.col.set([c.r * b, c.g * b, c.b * b], i * 3); pp.size[i] = i % 6 === 0 ? .12 : .06; pp.alpha[i] = .9; }
    pp.up(); const g = new THREE.Group(); g.add(pp.mesh); topoG.add(g); topoSpin.push({ g, v: (j % 2 ? -1 : 1) * (.04 + j * .015) });
  }
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.1, 7.8, 96, 1), fillMat(new THREE.Color(.05, .09, .3), .32));
  disc.rotation.x = -Math.PI / 2; topoG.add(disc);
}
reg('topo', topoG);

// ---- Resonance Rings (Perception / Daten): Bänder aus feinen Kreisen, oben und unten, gegenläufig
const QR = [
  { y: 2.45, r: 4.1, w: .16, n: 5, dir: 1 },
  { y: 1.5, r: 5.5, w: .3, n: 8, big: true, dir: 1 },
  { y: .5, r: 6.4, w: .24, n: 7, big: true, dir: -1 },
  { y: -.5, r: 6.1, w: .3, n: 8, big: true, dir: 1 },
  { y: -1.5, r: 5.0, w: .22, n: 6, dir: -1 },
  { y: -2.45, r: 3.9, w: .16, n: 5, dir: 1 }];
const ringG = new THREE.Group(); root.add(ringG);
const RSEG = 180;
const ringLines = [];
QR.forEach((q, qi) => {
  q.lines = []; q.spin = 0;
  for (let j = 0; j < q.n; j++) {
    const u = q.n > 1 ? j / (q.n - 1) - .5 : 0;
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RSEG + 1) * 3), 3));
    const c = _c1.copy(C.cy).lerp(C.bl, .45 + Math.abs(u) * 1.1); if (j === (q.n >> 1)) c.lerp(C.cy, .6);
    const m = lineMat(c.clone().multiplyScalar(q.big ? 1.25 : 1.0), q.big ? .5 + .35 * (1 - Math.abs(u) * 2) : .5);
    const L = new THREE.Line(geo, m); L.frustumCulled = false; ringG.add(L);
    const ln = { q, L, geo, dr: u * q.w * 2, dy: Math.sin(j * 2.1) * q.w * .18, m: 2 + (j * 7 + qi * 3) % 5, ph: j * 1.7 + qi, tx: Math.sin(j * 3.7 + qi), tz: Math.cos(j * 2.3 + qi * 1.3) };
    q.lines.push(ln); ringLines.push(ln);
  }
  if (q.big) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RSEG + 1) * 3), 3)); const L = new THREE.Line(geo, lineMat(new THREE.Color(1.7, .45, 1.8), .5)); L.frustumCulled = false; ringG.add(L); const ln = { q, L, geo, dr: -1.0, dy: .02, m: 3, ph: qi * 2, tx: .3, tz: -.4, mag: true }; q.lines.push(ln); ringLines.push(ln); }
});
for (const q of QR.filter(q => q.big)) { const d = new THREE.Mesh(new THREE.RingGeometry(q.r - .55, q.r + .55, 128, 1), fillMat(new THREE.Color(.06, .16, .5), .45)); d.rotation.x = -Math.PI / 2; d.position.y = q.y; ringG.add(d); }
let symEff = P.sym, ringRigid = 0, ringBreath = 0;
function ringRad(q, a, extra = 0) { const s = 1 - symEff; return (q.r + extra) * (1 + s * .09 * Math.sin(3 * a + q.y) + s * .05 * Math.sin(5 * a - q.y * 2)); }
let ringAmp = 0;
function updateRings(t, dt) {
  const free = 1 - ringRigid, chaos = (1 - P.coh) * free, fq = .4 + P.freq * 2.2;
  const br = 1 + ringBreath * .035 * Math.sin(t * (1.1 + P.freq * 1.4));
  for (const q of QR) q.spin += dt * q.dir * (.05 + P.freq * .08) * free;
  for (const ln of ringLines) {
    const q = ln.q, a = ln.geo.attributes.position.array;
    const amp = chaos * (q.big ? .42 : .25) + ringAmp * .12 * free, tl = chaos * .22;
    for (let i = 0; i <= RSEG; i++) {
      const th = i / RSEG * TAU, r = ringRad(q, th, ln.dr) * br;
      const wav = (Math.sin(ln.m * th + t * fq * (1 + ln.ph * .1) + ln.ph + q.spin * 3) * amp + Math.sin(2 * th + t * fq * .5) * .03 * (1 + P.freq)) * (ln.q.rf ?? 1);
      const x = Math.cos(th + q.spin) * r, z = Math.sin(th + q.spin) * r;
      a[i * 3] = x; a[i * 3 + 1] = q.y + ln.dy + wav + (x * ln.tx + z * ln.tz) * tl * .12; a[i * 3 + 2] = z;
    }
    ln.geo.attributes.position.needsUpdate = true;
  }
}
reg('ring', ringG);

// ---- Ringknoten + Synaptic Links
const synG = new THREE.Group(); root.add(synG);
const nodeP = makePoints(512); synG.add(nodeP.mesh);
let synLines = null, RN = [];
function buildSyn() {
  RN = [];
  QR.forEach((q, qi) => { const n = symK * (q.big ? 4 : 2); for (let i = 0; i < n; i++) { const a = i / n * TAU + (qi % 2) * Math.PI / n; const r = ringRad(q, a); RN.push({ q, qi, a, i, n, p: new V3(Math.cos(a) * r, q.y, Math.sin(a) * r) }); } });
  nodeP.geo.setDrawRange(0, RN.length);
  RN.forEach((nd, i) => { nodeP.pos.set([nd.p.x, nd.p.y, nd.p.z], i * 3); });
  nodeP.up();
  const seg = [];
  const byQ = QR.map((q, qi) => RN.filter(n => n.qi === qi));
  byQ.forEach((ns, qi) => { const n = ns.length; const step = Math.max(2, Math.round(n / symK) + 1); ns.forEach((a, i) => { if (QR[qi].big && i % 2 === 0) seg.push(a.p, ns[(i + step) % n].p); seg.push(a.p, ns[(i + 1) % n].p); }); });
  for (const [qa, qb] of [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]]) { const A = byQ[qa], B = byQ[qb]; A.forEach((a, i) => { if (i % 2) return; const b = B[Math.round(i / A.length * B.length) % B.length]; seg.push(a.p, b.p); }); }
  if (synLines) { synG.remove(synLines); synLines.geometry.dispose(); }
  synLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seg), synMat); synG.add(synLines);
  if (GR.syn) { GR.syn.items = GR.syn.items.filter(it => it.o.parent); reg('syn', synLines); GR.syn.items = dedupe(GR.syn.items); }
}
function dedupe(items) { const s = new Set(); return items.filter(it => { if (s.has(it.o)) return false; s.add(it.o); return true; }); }
const synMat = lineMat(new THREE.Color(.55, .75, 1.6), .2);
buildSyn(); reg('syn', synG);

// ---- Resonance Core: magenta Drahtkugel um den Gravity Point
const resG = new THREE.Group(); root.add(resG);
{
  const s = []; const R0 = 1.6;
  for (let i = 0; i < 12; i++) { const lo = i / 12 * TAU; const c = []; for (let k = 0; k <= 96; k++) { const a = k / 96 * TAU; c.push(new V3(Math.cos(a) * Math.cos(lo) * R0, Math.sin(a) * R0, Math.cos(a) * Math.sin(lo) * R0)); } for (let k = 0; k < 96; k++) s.push(c[k], c[k + 1]); }
  for (const la of [-.9, -.45, 0, .45, .9]) { const c = circlePts(Math.cos(la) * R0, 120, Math.sin(la) * R0); for (let k = 0; k < 120; k++) s.push(c[k], c[k + 1]); }
  resG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(1.5, .4, 1.6), .22)));
}
const resP = makePoints(360); resG.add(resP.mesh);
{ for (let i = 0; i < resP.n; i++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u); resP.pos.set([Math.cos(a) * s * 1.6, u * 1.6, Math.sin(a) * s * 1.6], i * 3); const c = R() < .6 ? C.mg : C.vi; resP.col.set([c.r * 1.2, c.g * 1.2, c.b * 1.2], i * 3); resP.size[i] = .03 + R() * .045; resP.alpha[i] = .45 + R() * .5; } resP.up(); }
reg('res', resG);

// ---- Funnel / Vortex unter dem Gravity Point
const funG = new THREE.Group(); root.add(funG);
function funR(y) { return y > -3.4 ? .32 + 1.38 * Math.pow(sat((y + 3.4) / 2.5), 1.8) : .32 + 1.3 * Math.pow(sat((-3.4 - y) / 1.3), 1.5); }
{
  const s = [];
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; for (let k = 0; k < 56; k++) { const y0 = -.9 - k / 56 * 3.8, y1 = -.9 - (k + 1) / 56 * 3.8; s.push(new V3(Math.cos(a) * funR(y0), y0, Math.sin(a) * funR(y0)), new V3(Math.cos(a) * funR(y1), y1, Math.sin(a) * funR(y1))); } }
  funG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.4, .8, 2.0), .3)));
  const c2 = []; for (let k = 0; k <= 12; k++) { const y = -.9 - k / 12 * 3.8; const c = circlePts(funR(y), 96, y); for (let j = 0; j < 96; j++) c2.push(c[j], c[j + 1]); }
  funG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(c2), lineMat(new THREE.Color(.5, 1.1, 2.2), .45)));
}
const funP = makePoints(320); funG.add(funP.mesh);
const FUS = Array.from({ length: funP.n }, () => ({ s: R(), a: R() * TAU, v: rr(.05, .14) }));
reg('funnel', funG);

// ---- Quantum Lattice (8³ Impulse Field): zylindrisches Gitter 8 Ebenen × 8 Radien × 8 Winkel
const meshG = new THREE.Group(); root.add(meshG);
const MN = 8, M3 = [];
const LAT_C = (LAT_Y0 + LAT_Y1) / 2;
for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) for (let k = 0; k < MN; k++) { const y = LAT_Y0 + i / (MN - 1) * (LAT_Y1 - LAT_Y0), r = 1.75 + j / (MN - 1) * 3.6, a = k / MN * TAU + (i % 2) * TAU / 16 + j * .09; M3.push({ b: new V3(Math.cos(a) * r, y, Math.sin(a) * r), w: Math.sin(i * 1.3 + j * 2.1 + k * .7), ijk: [i, j, k], e: 0, mem: 0, p: new V3() }); }
const meshP = makePoints(M3.length); meshG.add(meshP.mesh);
const meshLinkGeo = new THREE.BufferGeometry(); const MLINK = [];
{ const idx = (i, j, k) => (i * MN + j) * MN + k; for (let i = 0; i < MN; i++) for (let j = 0; j < MN; j++) for (let k = 0; k < MN; k++) { if (i < MN - 1) MLINK.push([idx(i, j, k), idx(i + 1, j, k)]); if (j < MN - 1) MLINK.push([idx(i, j, k), idx(i, j + 1, k)]); MLINK.push([idx(i, j, k), idx(i, j, (k + 1) % MN)]); } }
meshLinkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MLINK.length * 6), 3));
meshLinkGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MLINK.length * 6), 3));
const meshLinks = new THREE.LineSegments(meshLinkGeo, vlineMat(.9)); meshLinks.frustumCulled = false; meshG.add(meshLinks);
const MNB = M3.map(() => []); MLINK.forEach(([a, b]) => { MNB[a].push(b); MNB[b].push(a); });
reg('mesh', meshG);

// ---- Field Expansion (Universum / Wachstum): Kuppel mit Knotenkugel und Wirbel oben
const fieldG = new THREE.Group(); fieldG.position.y = FIELD_Y; root.add(fieldG);
const fieldCore = new THREE.Group(); fieldG.add(fieldCore);
const FNODES = [];
const DOME_H = 2.75, DOME_R = 4.7;
{
  const s = [];
  const lat = [[0, 4.7], [.7, 4.3], [1.35, 3.55], [1.95, 2.5], [2.4, 1.35]];
  lat.forEach(([y, r], li) => { const c = circlePts(r, 160, y); for (let k = 0; k < 160; k++) s.push(c[k], c[k + 1]); const n = 14 - li * 2; for (let i = 0; i < n; i++) { const a = i / n * TAU + li * .2; FNODES.push(new V3(Math.cos(a) * r, y, Math.sin(a) * r)); } });
  for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; for (let k = 0; k < 24; k++) { const P0 = f => { const y = f * 2.5, r = DOME_R * Math.sqrt(Math.max(0, 1 - (y / DOME_H) ** 2)); return new V3(Math.cos(a) * r, y, Math.sin(a) * r); }; s.push(P0(k / 24), P0((k + 1) / 24)); } }
  for (let i = 0; i < FNODES.length; i++) for (let j = i + 1; j < FNODES.length; j++) { const d = FNODES[i].distanceTo(FNODES[j]); if (d < 1.6 && (i * 7 + j) % 3 === 0) s.push(FNODES[i], FNODES[j]); }
  fieldCore.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.45, .75, 1.8), .36)));
  // Knotenkugel oben
  const t = []; for (let i = 0; i < 8; i++) { const lo = i / 8 * TAU; const c = []; for (let k = 0; k <= 48; k++) { const a = k / 48 * TAU; c.push(new V3(Math.cos(a) * Math.cos(lo) * .62, 2.7 + Math.sin(a) * .62, Math.cos(a) * Math.sin(lo) * .62)); } for (let k = 0; k < 48; k++) t.push(c[k], c[k + 1]); }
  for (const y of [-.35, 0, .35]) { const c = circlePts(Math.sqrt(.62 * .62 - y * y), 64, 2.7 + y); for (let k = 0; k < 64; k++) t.push(c[k], c[k + 1]); }
  // Wirbel (Sanduhr) ganz oben
  const hr = y => .22 + 1.1 * Math.abs(y - 3.75) ** 1.3;
  for (let k = 0; k <= 6; k++) { const y = 3.3 + k / 6 * .95; const c = circlePts(hr(y), 64, y); for (let j = 0; j < 64; j++) t.push(c[j], c[j + 1]); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; for (let k = 0; k < 12; k++) { const y0 = 3.3 + k / 12 * .95, y1 = 3.3 + (k + 1) / 12 * .95; t.push(new V3(Math.cos(a) * hr(y0), y0, Math.sin(a) * hr(y0)), new V3(Math.cos(a) * hr(y1), y1, Math.sin(a) * hr(y1))); } }
  fieldCore.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(t), lineMat(new THREE.Color(.7, .9, 2.2), .5)));
  const fs = glowSprite(new THREE.Color(.8, 1.3, 2.6), 1.2, .7); fs.position.y = 2.7; fieldCore.add(fs);
}
const fieldNodeP = makePoints(FNODES.length); fieldCore.add(fieldNodeP.mesh);
FNODES.forEach((p, i) => { fieldNodeP.pos.set([p.x, p.y, p.z], i * 3); const c = i % 4 === 1 ? C.mg : i % 5 ? C.cy : C.wh; fieldNodeP.col.set([c.r * 1.5, c.g * 1.5, c.b * 1.5], i * 3); fieldNodeP.size[i] = i % 5 ? .11 : .19; fieldNodeP.alpha[i] = 1; }); fieldNodeP.up();
reg('field', fieldG);

// ---- Awareness Layer: violetter Wirbel um den Kern
const awaG = new THREE.Group(); awaG.position.y = .05; root.add(awaG);
const awaP = makePoints(2400); awaG.add(awaP.mesh);
const AWS = [];
for (let i = 0; i < awaP.n; i++) { const arm = i % 3, r = 1.7 + Math.pow(R(), .8) * 4.6, a = arm / 3 * TAU + Math.log(r) * 2.3 + gauss() * .3; AWS.push({ r, a, y: gauss() * .1 * (r / 3), ph: R() * TAU }); const c = _c1.copy(C.vi).lerp(C.mg, R() * .7); const b = .45 + R() * .5; awaP.col.set([c.r * b, c.g * b, c.b * b], i * 3); awaP.size[i] = .04 + R() * .07; awaP.alpha[i] = .35 + R() * .45; }
for (const r of [2.3, 3.5, 4.7]) awaG.add(lineLoop(circlePts(r, 160, 0, a => 1 + .03 * Math.sin(5 * a + r)), lineMat(new THREE.Color(1.1, .45, 1.9), .25)));
reg('awa', awaG);

// ---- Universal Interface: Hex-Platte über allem
const ifG = new THREE.Group(); ifG.position.y = IF_Y; root.add(ifG);
const ifNodes = [];
{
  const s = []; const hex = (r, y = 0) => { const p = []; for (let i = 0; i <= 6; i++) { const a = i / 6 * TAU + Math.PI / 6; p.push(new V3(Math.cos(a) * r, y, Math.sin(a) * r)); } return p; };
  for (const r of [3.9, 3.75]) { const h = hex(r); for (let i = 0; i < 6; i++) s.push(h[i], h[i + 1]); h.slice(0, 6).forEach(p => ifNodes.push(p)); }
  for (const r of [.8, 1.4, 2.0, 2.6]) { const c = circlePts(r, 120, 0); for (let k = 0; k < 120; k++) s.push(c[k], c[k + 1]); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; s.push(new V3(Math.cos(a) * 1.0, 0, Math.sin(a) * 1.0), new V3(Math.cos(a) * (i % 2 ? 3.2 : 3.75), 0, Math.sin(a) * (i % 2 ? 3.2 : 3.75))); }
  ifG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.55, .9, 2.0), .38)));
  const pl = new THREE.Mesh(new THREE.CircleGeometry(3.8, 6), fillMat(new THREE.Color(.03, .08, .25), .3)); pl.rotation.x = -Math.PI / 2; pl.rotation.z = Math.PI / 6; ifG.add(pl);
}
const ifP = makePoints(ifNodes.length + 36); ifG.add(ifP.mesh);
{ let k = 0; for (const p of ifNodes) { ifP.pos.set([p.x, 0, p.z], k * 3); ifP.col.set([1.4, 2.0, 2.6], k * 3); ifP.size[k] = .16; ifP.alpha[k] = 1; k++; } for (let i = 0; i < 36; i++) { const a = i / 36 * TAU, r = [1.4, 2.0, 2.6][i % 3]; ifP.pos.set([Math.cos(a) * r, 0, Math.sin(a) * r], k * 3); ifP.col.set([.8, 1.4, 2.2], k * 3); ifP.size[k] = .08; ifP.alpha[k] = .9; k++; } ifP.up(); }
reg('iface', ifG);

// ---- Staub (Entropy)
const dust = makePoints(1400); root.add(dust.mesh);
const DS = Array.from({ length: dust.n }, () => { const a = R() * TAU, r = 1 + Math.pow(R(), .7) * 8.5, y = rr(-6, 7); return { b: new V3(Math.cos(a) * r, y, Math.sin(a) * r), ph: R() * TAU, s: rr(.03, .08), c: R() < .5 ? C.cy : R() < .5 ? C.vi : C.bl }; });
reg('dust', dust.mesh);

// ---- 4D: Tesserakt-Projektion um den Kern
const tessG = new THREE.Group(); root.add(tessG);
const TV = []; for (let i = 0; i < 16; i++) TV.push([(i & 1) ? 1 : -1, (i & 2) ? 1 : -1, (i & 4) ? 1 : -1, (i & 8) ? 1 : -1]);
const TE = []; for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (j > i) TE.push([i, j]); }
const tessGeo = new THREE.BufferGeometry(); tessGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TE.length * 2 * 3 * 8), 3)); tessGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(TE.length * 2 * 3 * 8), 3));
const tessL = new THREE.LineSegments(tessGeo, vlineMat(.85)); tessL.frustumCulled = false; tessG.add(tessL);
const tessP = makePoints(16); tessG.add(tessP.mesh);
function rot4(v, a, b, c) { let [x, y, z, w] = v; let ca = Math.cos(a), sa = Math.sin(a); [x, w] = [x * ca - w * sa, x * sa + w * ca]; ca = Math.cos(b); sa = Math.sin(b); [y, w] = [y * ca - w * sa, y * sa + w * ca]; ca = Math.cos(c); sa = Math.sin(c); [z, w] = [z * ca - w * sa, z * sa + w * ca]; return [x, y, z, w]; }
function proj4(v, s) { const k = 2.6 / (2.6 - v[3] * .9); return [v[0] * k * s, v[1] * k * s, v[2] * k * s, k]; }
function updateTess(t) {
  const a = t * .31, b = t * .23, c = t * .17, S = 3.3, pa = tessGeo.attributes.position.array, ca = tessGeo.attributes.color.array; const PV = TV.map(v => proj4(rot4(v, a, b, c), S)); let k = 0;
  for (const [i, j] of TE) { for (let q = 0; q < 8; q++) { for (const f of [q / 8, (q + 1) / 8]) { const v = TV[i].map((x, d) => lerp(x, TV[j][d], f)); const p = proj4(rot4(v, a, b, c), S); pa[k] = p[0]; pa[k + 1] = p[1]; pa[k + 2] = p[2]; const g = sat((p[3] - .7) * 1.4); _c1.copy(C.vi).lerp(C.cy, g).multiplyScalar(.7 + g * 1.2); ca[k] = _c1.r; ca[k + 1] = _c1.g; ca[k + 2] = _c1.b; k += 3; } } }
  tessGeo.attributes.position.needsUpdate = true; tessGeo.attributes.color.needsUpdate = true;
  PV.forEach((p, i) => { tessP.pos.set([p[0], p[1], p[2]], i * 3); tessP.col.set([.8 * p[3], 1.4 * p[3], 2 * p[3]], i * 3); tessP.size[i] = .14 * p[3]; tessP.alpha[i] = 1; }); tessP.up();
}
reg('tess', tessG);

// ================================================================ AXON-KNOTEN: Netze mit wandernden Impulsen
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
  fire(p, e = 1, v, delay = 0, s0 = 0) { if (this.pulses.length > 460) return; this.pulses.push({ p, s: s0, s0, v: v || (this.opt.v || 5), e, d: delay, fired: 0 }); }
  update(dt, onArrive, base = 1, learn = false) {
    const hp = this.hp; let h = 0;
    for (let k = this.pulses.length - 1; k >= 0; k--) {
      const u = this.pulses[k]; if (u.d > 0) { u.d -= dt; continue; }
      u.s += u.v * dt / u.p.L;
      for (const kid of u.p.kids) if (!(u.fired & (1 << (kid.ki & 30))) && u.s >= u.p.cum[kid.i0] && u.p.cum[kid.i0] >= u.s0) { u.fired |= 1 << (kid.ki & 30); if (kid.grow > .5) this.fire(kid, u.e * .85, u.v * .9); }
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

const straightPts = (A, B, n) => { const o = []; for (let i = 0; i < n; i++) o.push(A.clone().lerp(B, i / (n - 1))); return o; };

// ---- Gravity Point (Axon-Knoten): helle violett-weiße Kugel in der Mitte
const kernG = new THREE.Group(); kernG.position.y = KY; root.add(kernG);
const somaP = makePoints(900); kernG.add(somaP.mesh);
const SOMA = [];
for (let i = 0; i < somaP.n; i++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), r = Math.pow(R(), .45) * .58; SOMA.push({ b: new V3(Math.cos(a) * s * r, u * r, Math.sin(a) * s * r), r, ph: R() * TAU }); const c = r < .2 ? C.wh : R() < .6 ? C.mg : C.vi; const b = r < .2 ? .7 : .45; somaP.col.set([c.r * b, c.g * b, c.b * b], i * 3); somaP.size[i] = .022 + R() * .04; somaP.alpha[i] = .14 + R() * .3; }
const kCore = glowSprite(new THREE.Color(1.3, 1.0, 1.9), .9, 1); kernG.add(kCore);
const kCore2 = glowSprite(new THREE.Color(1.0, .25, 1.5), 2.2, .25); kernG.add(kCore2);
{ // Glas-Kugel mit Drahtnetz
  const s = []; const R0 = .62;
  for (let i = 1; i < 6; i++) { const la = -Math.PI / 2 + i / 6 * Math.PI; const c = circlePts(Math.cos(la) * R0, 64, Math.sin(la) * R0); for (let k = 0; k < 64; k++) s.push(c[k], c[k + 1]); }
  for (let i = 0; i < 10; i++) { const lo = i / 10 * TAU; for (let k = 0; k < 32; k++) { const a0 = -Math.PI / 2 + k / 32 * Math.PI, a1 = -Math.PI / 2 + (k + 1) / 32 * Math.PI; s.push(new V3(Math.cos(a0) * Math.cos(lo) * R0, Math.sin(a0) * R0, Math.cos(a0) * Math.sin(lo) * R0), new V3(Math.cos(a1) * Math.cos(lo) * R0, Math.sin(a1) * R0, Math.cos(a1) * Math.sin(lo) * R0)); } }
  kernG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(1.3, .9, 2.2), .45)));
}
const kRings = []; for (let i = 0; i < 4; i++) { const L = lineLoop(circlePts(.75 + i * .14, 72, 0), lineMat(i % 2 ? new THREE.Color(1.7, .5, 1.9) : new THREE.Color(.6, 1.6, 2.4), .6)); kernG.add(L); kRings.push(L); }
// Iris im Kern: blickt bei Human-Centric zum Menschen (Finger/Maus)
const gpLook = new THREE.Group(); kernG.add(gpLook);
const irisRings = [];
for (let i = 0; i < 5; i++) { const r = .1 + i * .075; const L = lineLoop(circlePts(r, 64, 0).map(p => new V3(p.x, p.z, 0)), lineMat((i % 2 ? C.mg : C.cy).clone().multiplyScalar(1.6), .8)); L.position.z = .5 - i * .01; gpLook.add(L); irisRings.push({ L, r, i }); }
const pupil = glowSprite(new THREE.Color(1.0, 1.3, 1.9), .34, 1); pupil.position.z = .55; gpLook.add(pupil);
reg('kernel', kernG);

// ---- Neural Branches (Synapsen / Lernen): vom Kern sternförmig in alle Ringe, Kuppel und Gitter
const AXN = new Net('axon', new THREE.Color(1.7, .35, 1.7), new THREE.Color(.35, .75, 1.9), { v: 5.2, hc: new THREE.Color(1, .85, 1), maxP: 380 });
root.add(AXN.g);
const KC = new V3(0, KY, 0);
const AXT = [];
function axTargets() {
  const T = [];
  [6, 10, 12, 10, 8, 6].forEach((n, qi) => { const q = QR[qi]; for (let i = 0; i < n; i++) { const a = (i + .5 * (qi % 2)) / n * TAU + qi * .21; const r = ringRad(q, a); T.push({ type: 'ring', qi, p: new V3(Math.cos(a) * r, q.y, Math.sin(a) * r) }); } });
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + .4; T.push({ type: 'field', p: new V3(Math.cos(a) * 4.65, FIELD_Y + .02, Math.sin(a) * 4.65) }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + .8; T.push({ type: 'top', p: new V3(Math.cos(a) * .55, FIELD_Y + 2.45, Math.sin(a) * .55) }); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .2; T.push({ type: 'lat', p: new V3(Math.cos(a) * 3.2, LAT_Y1, Math.sin(a) * 3.2) }); }
  return T;
}
const AX_NS = 60, BR_NS = 20;
function makeAxonPts(tg, rnd) {
  const dir = tg.p.clone().sub(KC); const out = new V3(dir.x, 0, dir.z); if (out.lengthSq() < .01) out.set(rnd() - .5, 0, rnd() - .5); out.normalize();
  const up = tg.p.y > KY;
  const A = KC.clone().addScaledVector(out, .6).add(new V3(0, up ? .12 : -.12, 0));
  let opt = { out: out.clone().add(new V3(0, tg.type === 'ring' ? (tg.p.y * .12 + .25) : .3, 0)).normalize(), amp: .07, k1: .36 };
  if (tg.type === 'field') opt = { out: out.clone().add(new V3(0, .55, 0)).normalize(), k1: .45, amp: .05, in2: out.clone().multiplyScalar(1.6).add(new V3(0, -1.6, 0)) };
  if (tg.type === 'top') opt = { out: out.clone().multiplyScalar(.4).add(new V3(0, 1, 0)).normalize(), k1: .3, amp: .04, in2: new V3(0, -1, 0) };
  if (tg.type === 'lat') opt = { out: out.clone().add(new V3(0, -.9, 0)).normalize(), k1: .35, amp: .05, in2: new V3(0, .8, 0) };
  return { org: organicPath(A, tg.p, AX_NS, opt, rnd), geo: straightPts(A, tg.p, AX_NS) };
}
function branchPts(par, i0, rnd, len) { const a = par.org[i0], b = par.org[Math.min(par.n - 1, i0 + 2)]; const d = b.clone().sub(a).normalize(); d.add(new V3(rnd() - .5, (rnd() - .5) * .8 + .25, rnd() - .5).multiplyScalar(1.4)); const org = wanderPath(a, d, len, BR_NS, rnd, .55); return { org, geo: straightPts(par.geo[i0], org[BR_NS - 1], BR_NS) }; }
function setOG(p, o) { p.org = o.org; p.geo = o.geo; }
let GEOW = 0;   // 0 organisch (Brain) .. 1 geometrisch (System)
function blendPath(p) { for (let i = 0; i < p.n; i++) p.pts[i].copy(p.org[i]).lerp(p.geo[i], GEOW); AXN.measure(p); AXN.write(p); }
function growAxon(tg, rnd) {
  const o = makeAxonPts(tg, rnd);
  const p = AXN.add(o.org.map(v => v.clone()), { tg, bead: 6, bs: .085, ts: .042, end: .18, main: true, ord: rnd() }); setOG(p, o);
  for (let b = 0; b < 2; b++) { const i0 = 12 + Math.floor(rnd() * 38); const ob = branchPts(p, i0, rnd, .7 + rnd() * 1.5); const k = AXN.add(ob.org.map(v => v.clone()), { parent: p, i0, bead: 7, bs: .06, ts: .03, end: .1, ki: b * 2, w: .35 }); setOG(k, ob); p.kids.push(k); }
  return p;
}
{ const rnd = rng(77); for (const tg of axTargets()) { AXT.push(tg); growAxon(tg, rnd); } }
// Dendriten direkt am Kern
const DEN = [];
{ const rnd = rng(5); for (let i = 0; i < 40; i++) { const u = rnd() * 2 - 1, a = rnd() * TAU, s = Math.sqrt(1 - u * u); const d = new V3(Math.cos(a) * s, u * .8, Math.sin(a) * s); const A = KC.clone().addScaledVector(d, .6); const org = wanderPath(A, d, .5 + rnd() * 1.1, 16, rnd, .7); const p = AXN.add(org.map(v => v.clone()), { bead: 5, bs: .05, ts: .035, end: .08, den: true, w: .45, dim: .55 }); p.org = org; p.geo = straightPts(A, org[15], 16); DEN.push(p); } }
// Adaptive Learning: Sprossen wachsen dort, wo berührt wird
const SPR = [];
for (let i = 0; i < 28; i++) { const org = Array.from({ length: BR_NS }, () => KC.clone()); const p = AXN.add(org.map(v => v.clone()), { bead: 5, bs: .07, ts: .035, end: .14, sprout: true, w: .9 }); p.org = org; p.geo = org.map(v => v.clone()); p.grow = -1; p.sg = 0; SPR.push(p); }
let sprI = 0;
AXN.build();
reg('axon', AXN.g);
const MAINS = AXN.paths.filter(p => p.main);
function sproutAt(path, i0, dir) {
  const p = SPR[sprI++ % SPR.length]; const A = path.pts[i0].clone();
  const org = wanderPath(A, dir, 1.0 + R() * 1.2, BR_NS, R, .45); for (let i = 0; i < p.n; i++) { p.org[i].copy(org[i]); p.geo[i].copy(A).lerp(org[BR_NS - 1], i / (BR_NS - 1)); }
  blendPath(p); p.grow = 0; p.sg = 1; p.w = 1.2; p.tg = path.tg; return p;
}
function updateSprouts(dt) { for (const p of SPR) { if (p.sg) { p.grow = Math.min(1, p.grow + dt * .8); if (p.grow >= 1) p.sg = 0; } } }

// Self-Organizing: Äste ziehen sich zurück und wachsen zu neuen Zielen
const rewiring = [];
function rewireOne(rnd = R) { const cand = MAINS.filter(p => !p.rw); if (!cand.length) return; const p = cand[Math.floor(rnd() * cand.length)]; p.rw = { ph: 0 }; rewiring.push(p); }
function updateRewire(dt) {
  for (let k = rewiring.length - 1; k >= 0; k--) {
    const p = rewiring[k];
    if (p.rw.ph === 0) { p.grow = Math.max(0, p.grow - dt * .9); if (p.grow <= 0) {
        const tg = AXT[Math.floor(R() * AXT.length)]; const tg2 = { type: tg.type, qi: tg.qi, p: tg.p.clone() }; if (tg.type === 'ring') { const a = Math.atan2(tg.p.z, tg.p.x) + rr(-.25, .25); const r = ringRad(QR[tg.qi], a); tg2.p.set(Math.cos(a) * r, tg.p.y, Math.sin(a) * r); }
        const o = makeAxonPts(tg2, R); for (let i = 0; i < p.n; i++) { p.org[i].copy(o.org[i]); p.geo[i].copy(o.geo[i]); } p.tg = tg2; blendPath(p);
        for (const kid of p.kids) { const i0 = 12 + Math.floor(R() * 38); kid.i0 = i0; const ob = branchPts(p, i0, R, .7 + R() * 1.5); for (let i = 0; i < kid.n; i++) { kid.org[i].copy(ob.org[i]); kid.geo[i].copy(ob.geo[i]); } blendPath(kid); }
        p.rw.ph = 1; } }
    else { p.grow = Math.min(1, p.grow + dt * .45); if (p.grow >= 1) { delete p.rw; rewiring.splice(k, 1); } }
    for (const kid of p.kids) kid.grow = sat((p.grow - p.cum[kid.i0]) / Math.max(.05, 1 - p.cum[kid.i0]));
  }
}

// ---- Harmonic Bridge (Integration): magenta Bögen zwischen den Ringen und zum Resonance Core
const BRN = new Net('bridge', new THREE.Color(1.5, .3, 1.4), new THREE.Color(1.9, .6, 2.1), { v: 4.2, hc: new THREE.Color(1, .6, 1), maxP: 140 });
root.add(BRN.g);
const BRIDGE_BY_Q = QR.map(() => []);
{
  const rnd = rng(31);
  for (let qi = 0; qi < 5; qi++) { const qa = QR[qi], qb = QR[qi + 1]; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + qi * .6; const A = new V3(Math.cos(a) * ringRad(qa, a), qa.y, Math.sin(a) * ringRad(qa, a)), B = new V3(Math.cos(a) * ringRad(qb, a), qb.y, Math.sin(a) * ringRad(qb, a)); const pts = []; for (let k = 0; k < 34; k++) { const t = k / 33; const p = A.clone().lerp(B, t); const bul = Math.sin(Math.PI * t) * .9; p.x += Math.cos(a) * bul; p.z += Math.sin(a) * bul; pts.push(p); } const p = BRN.add(pts, { bead: 6, bs: .06, ts: .03, end: .1, w: .45 }); BRIDGE_BY_Q[qi].push(p); BRIDGE_BY_Q[qi + 1].push(p); } }
  for (const qi of [2, 3]) { const q = QR[qi]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + qi * .5; const r = ringRad(q, a); const A = new V3(Math.cos(a) * r, q.y, Math.sin(a) * r); const B = new V3(Math.cos(a) * 1.62, q.y * .5, Math.sin(a) * 1.62); const pts = organicPath(A, B, 40, { out: new V3(0, qi === 2 ? 1 : -1, 0).add(B.clone().sub(A).normalize()).normalize(), k1: .4, amp: .02, in2: new V3(Math.cos(a), qi === 2 ? .6 : -.6, Math.sin(a)) }, rnd); BRIDGE_BY_Q[qi].push(BRN.add(pts, { bead: 8, bs: .07, ts: .03, end: .14, w: .5, toCore: true })); } }
  BRN.build();
}
reg('bridge', BRN.g);

// ---- Myzel in der Kuppel (Field Expansion wächst mit Expansion)
const MYN = new Net('myc', new THREE.Color(.35, .6, 1.6), new THREE.Color(.6, .5, 1.8), { v: 2.6, hc: new THREE.Color(.7, .9, 1), maxP: 120 });
fieldCore.add(MYN.g);
{
  const rnd = rng(11);
  FNODES.forEach((A, i) => {
    if (i % 2) return; const d = new V3(A.x, .35 + rnd() * .5, A.z).normalize(); const len = 1.3 + rnd() * 2.2; const p = MYN.add(wanderPath(A, d, len, 24, rnd, .5), { bead: 5, bs: .06, ts: .03, end: .1, th: rnd() * .6 });
    for (let b = 0; b < 2; b++) { const i0 = 6 + Math.floor(rnd() * 14); const k = MYN.add(wanderPath(p.pts[i0], new V3(d.x + rnd() - .5, rnd() * .8, d.z + rnd() - .5), .6 + rnd() * 1.3, 16, rnd, .7), { parent: p, i0, bead: 5, bs: .05, ts: .025, end: .07, ki: b * 2, th: p.th + .15 + rnd() * .3 }); p.kids.push(k); }
  });
  MYN.build();
}
let mycK = 1;
function updateMycel(dt) { const ex = P.exp * mycK; for (const p of MYN.paths) { const tgt = sat((ex * 1.25 - p.th) * 1.6); p.grow += (tgt - p.grow) * Math.min(1, dt * 1.5); } }

// ---- Explosionsansicht: senkrechte Verbinder zwischen den Schichten
const connG = new THREE.Group(); root.add(connG);
{ const s = []; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + .1, r = [1.2, 2.4, 3.6, 4.6][i % 4]; s.push(new V3(Math.cos(a) * r, -12.2, Math.sin(a) * r), new V3(Math.cos(a) * r, 9.6, Math.sin(a) * r)); } connG.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.45, .7, 1.8), .2))); }
reg('conn', connG);

// ================================================================ MODULE
const MOD = { axon: 0, field: 0, growth: 0, stab: 0, gal: 0 };
// AXON STRUCTURE (Multi-Branch Network): Neuron im Detail am Kern
const modAx = new THREE.Group(); root.add(modAx);
const NEU = new Net('neu', new THREE.Color(1.4, .4, 1.9), new THREE.Color(.4, .8, 2.0), { v: 3.2, hc: new THREE.Color(1, .9, 1), maxP: 260 });
modAx.add(NEU.g);
const NEU_ROOT = [];
{
  const rnd = rng(404);
  function tree(A, d, len, dep, parent) {
    const pts = wanderPath(A, d, len, 12, rnd, .35); const p = NEU.add(pts, { bead: 4, bs: .07 - dep * .012, ts: .04 - dep * .006, end: dep === 3 ? .1 : .05, parent, i0: parent ? parent.n - 1 : 0, ki: 0, w: .7 });
    if (parent) { p.ki = parent.kids.length * 2; parent.kids.push(p); } else NEU_ROOT.push(p);
    if (dep < 3) for (let b = 0; b < 2; b++) { const nd = d.clone().add(new V3(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(1.1)).normalize(); tree(pts[11], nd, len * .68, dep + 1, p); }
  }
  for (let i = 0; i < 7; i++) { const u = (i / 6) * 1.6 - .8, a = i * 2.4; const d = new V3(Math.cos(a) * Math.sqrt(1 - u * u), u, Math.sin(a) * Math.sqrt(1 - u * u)); tree(d.clone().multiplyScalar(.55), d, 1.5 + rnd() * .6, 0, null); }
  // Axon-Hügel + langes Axon nach unten mit Myelin
  const ax = NEU.add(wanderPath(new V3(0, -.6, 0), new V3(.15, -1, .1), 3.4, 30, rnd, .15), { bead: 3, bs: .12, ts: .045, end: .14, w: .8 }); NEU_ROOT.push(ax);
  NEU.build();
}
const neuSoma = glowSprite(new THREE.Color(1.4, .7, 2.2), 1.0, .5); modAx.add(neuSoma);
reg('mAx', modAx);
// RESONANCE FIELD (Frequency Coherence): stehende Welle
const modField = new THREE.Group(); root.add(modField);
const RFN = 26, RFS = 120; const rfLines = [];
for (let i = 0; i < RFN; i++) { const r = .7 + i * .27; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((RFS + 1) * 3), 3)); const c = _c1.copy(C.mg).lerp(C.cy, sat(i / 8)).lerp(C.bl, sat((i - 14) / 12)); const L = new THREE.Line(geo, lineMat(c.clone().multiplyScalar(1.5), .7)); L.frustumCulled = false; modField.add(L); rfLines.push({ L, geo, r }); }
{ const s = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; s.push(new V3(Math.cos(a) * .7, 0, Math.sin(a) * .7), new V3(Math.cos(a) * 7.5, 0, Math.sin(a) * 7.5)); } modField.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(s), lineMat(new THREE.Color(.4, .7, 1.8), .18))); }
const rfP = makePoints(RFN * 12); modField.add(rfP.mesh);
reg('mField', modField);
// GROWTH PATTERN (Organic Expansion): Lichtbaum mit Krone und Wurzeln
const modGrow = new THREE.Group(); root.add(modGrow);
const GRN = new Net('grow', new THREE.Color(.35, .75, 2.0), new THREE.Color(1.3, .45, 1.9), { v: 3.6, hc: new THREE.Color(.9, 1, 1), maxP: 300 });
modGrow.add(GRN.g);
const GR_ROOT = []; let GR_MAXD = 0;
{
  const rnd = rng(1991);
  function br(A, d, len, dep, max, parent, root2) {
    const pts = wanderPath(A, d, len, 10, rnd, .18); const p = GRN.add(pts, { bead: 4, bs: .07 * (1 - dep / (max + 2)), ts: .05 * (1 - dep / (max + 2)), end: dep === max ? .1 : .04, parent, i0: parent ? parent.n - 1 : 0, ki: 0, dep, w: .7 });
    GR_MAXD = Math.max(GR_MAXD, dep);
    if (parent) { p.ki = parent.kids.length * 2; parent.kids.push(p); } else GR_ROOT.push(p);
    if (dep < max) { const nb = dep < 1 ? 3 : 2; for (let b = 0; b < nb; b++) { const sp = root2 ? .9 : .62; const nd = d.clone().add(new V3((rnd() - .5) * sp * 2, root2 ? -rnd() * .2 : rnd() * .25, (rnd() - .5) * sp * 2)).normalize(); br(pts[9], nd, len * (root2 ? .7 : .74), dep + 1, max, p, root2); } }
  }
  br(new V3(0, .5, 0), new V3(0, 1, 0), 2.2, 0, 6, null, false);
  br(new V3(0, -.5, 0), new V3(0, -1, 0), 1.4, 0, 5, null, true);
  GRN.build();
}
let growT = 0;
reg('mGrow', modGrow);
// DYNAMIC STABILITY (Balance & Adaptation): Partikel auf der ∞-Bahn um den Kern
const modStab = new THREE.Group(); root.add(modStab);
const stabLines = []; for (let j = 0; j < 4; j++) { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(241 * 3), 3)); const L = new THREE.Line(geo, lineMat(_c1.copy(C.cy).lerp(C.bl, j / 4).clone().multiplyScalar(1.5 - j * .2), .75 - j * .12)); L.frustumCulled = false; modStab.add(L); stabLines.push({ L, geo, j }); }
const stabP = makePoints(900); modStab.add(stabP.mesh);
const STS = Array.from({ length: stabP.n }, () => ({ t: R() * TAU, v: rr(.35, .7), o: gauss() * .2, o2: gauss() * .2 }));
function lemn(t, aL, aR, out) { const s = Math.sin(t), c = Math.cos(t), d = 1 + s * s; const a = c > 0 ? aR : aL; return out.set(a * c / d, a * s * c / d, 0); }
reg('mStab', modStab);
// INFINITE POTENTIAL (Beyond Limits): Galaxie
const modGal = new THREE.Group(); root.add(modGal);
const galP = makePoints(9000); modGal.add(galP.mesh);
{ for (let i = 0; i < galP.n; i++) { const arm = i % 3, r = 8 + Math.pow(R(), .8) * 32, a = arm / 3 * TAU + Math.log(r / 8) * 2.4 + gauss() * .28 * (1 - r / 48); const y = gauss() * .5 * (1 - r / 52); galP.pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); const c = _c1.copy(C.cy).lerp(C.vi, sat((r - 8) / 26)).lerp(C.wh, R() < .1 ? .7 : 0); const b = .8 + R() * .9; galP.col.set([c.r * b, c.g * b, c.b * b], i * 3); galP.size[i] = .08 + R() * .16; galP.alpha[i] = .4 + R() * .6; } galP.up(); }
const galCore = glowSprite(new THREE.Color(.8, .5, 1.6), 22, .3); modGal.add(galCore);
reg('mGal', modGal);

// ================================================================ BLUEPRINT: Labels + Maßlinien (nicht im Gruppen-Register, Sichtbarkeit über BP)
const BPL = [];
function bpAdd(parent, obj) { parent.add(obj); let g = null; for (let q = parent; q && !g; q = q.parent) g = q.userData.grp; obj.traverse(o => { if (o.material) { BPL.push({ o, m: o.material, b: o.material.opacity, g }); o.material.opacity = 0; o.visible = false; } }); return obj; }
const bpLineMat = () => new THREE.LineBasicMaterial({ color: new THREE.Color(.75, .95, 1.6), opacity: .75, transparent: true, depthWrite: false, toneMapped: false });
function bpLabel(parent, anchor, off, t1, t2) {
  const tip = anchor.clone().add(off); const g = new THREE.Group();
  g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([anchor, tip, tip.clone().add(new V3(off.x > 0 ? .9 : -.9, 0, 0))]), bpLineMat()));
  const dot = glowSprite(new THREE.Color(1.2, 1.8, 2.4), .3, 1); dot.position.copy(anchor); g.add(dot);
  const sp = textSprite([{ t: t1, c: '#e8fbff', g: 'rgba(58,214,255,.9)' }, { t: t2, s: .78, c: '#9fdcff', g: 'rgba(58,214,255,.6)' }], { h: .78, align: off.x > 0 ? 'left' : 'right', fs: 40 });
  sp.position.copy(tip).add(new V3(off.x > 0 ? 1.0 : -1.0, 0, 0)); g.add(sp);
  return bpAdd(parent, g);
}
function bpDim(parent, A, B, label, nrm, lx = 0, ly = 0) {
  const g = new THREE.Group(); const t = nrm.clone().multiplyScalar(.25);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([A, B, A.clone().add(t), A.clone().sub(t), B.clone().add(t), B.clone().sub(t)]), bpLineMat()));
  // Pfeilspitzen
  const d = B.clone().sub(A).normalize().multiplyScalar(.3); const n2 = nrm.clone().multiplyScalar(.12);
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([A, A.clone().add(d).add(n2), A, A.clone().add(d).sub(n2), B, B.clone().sub(d).add(n2), B, B.clone().sub(d).sub(n2)]), bpLineMat()));
  const sp = textSprite([{ t: label, c: '#e8fbff', g: 'rgba(58,214,255,.9)' }], { h: .42, fs: 40 }); sp.position.copy(A).lerp(B, .5).add(new V3(lx, ly, 0)); g.add(sp);
  return bpAdd(parent, g);
}
{
  const fq = QR[1];
  bpLabel(fieldG, new V3(2.6, 1.9, 0), new V3(2.6, 1.4, 0), 'FIELD EXPANSION', 'Universum / Wachstum');
  bpLabel(ringG, new V3(fq.r * .95, fq.y, 0), new V3(1.6, 1.4, 0), 'RESONANCE RINGS', 'Perception / Daten');
  bpLabel(AXN.g, new V3(2.4, .9, .3), new V3(5.4, 1.0, 0), 'NEURAL BRANCHES', 'Synapsen / Lernen');
  bpLabel(BRN.g, new V3(6.2, 0, 0), new V3(2.0, -.2, 0), 'HARMONIC BRIDGE', 'Integration');
  bpLabel(kernG, new V3(-.5, -.2, 0), new V3(-4.2, -1.6, 0), 'GRAVITY POINT', 'Axon-Knoten');
  bpLabel(meshG, new V3(4.6, LAT_Y1 - .4, 0), new V3(3.6, -.4, 0), 'QUANTUM LATTICE', '8³ Impulse Field');
  bpLabel(topoG, new V3(-6.8, 0, 0), new V3(-2.0, -.9, 0), 'RING TOPOLOGY', 'Universal Model');
  bpLabel(awaG, new V3(-4.4, 0, 0), new V3(-3.4, 1.6, 0), 'AWARENESS LAYER', 'Resonanz-Wirbel');
  bpLabel(ifG, new V3(-5.0, 0, 0), new V3(-2.2, .7, 0), 'UNIVERSAL INTERFACE', 'Mensch · System');
  bpDim(root, new V3(-9.6, TOPO_Y, 0), new V3(-9.6, IF_Y, 0), 'H 12.95', new V3(1, 0, 0), -.9, 0);
  bpDim(root, new V3(-7.6, TOPO_Y - .9, 0), new V3(7.6, TOPO_Y - .9, 0), 'Ø 15.20', new V3(0, 1, 0), 0, -.4);
  bpDim(fieldG, new V3(-DOME_R, -.25, 2.2), new V3(DOME_R, -.25, 2.2), 'Ø 9.40', new V3(0, 1, 0), 0, -.35);
  bpDim(root, new V3(QR[2].r, -.0, 3.4), new V3(-QR[2].r, 0, 3.4), 'Ø 12.80', new V3(0, 1, 0), 0, -.35);
}

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
try { Object.assign(ST, JSON.parse(localStorage.getItem('qob2') || '{}')); } catch (_) { }
const saveS = () => { try { localStorage.setItem('qob2', JSON.stringify({ snd: ST.snd })); } catch (_) { } };
let started = false, manual = false, lastNow = performance.now(), frameN = 0;
let dimV = 3, dimT = 3, H = 1, iso = null, modK = null, lockF = 0, locked = false, lockT = 0;
const SYS = { self: true, multi: true, learn: true, ethic: true, human: true };
const IFX = { mind: 0, brain: 0, human: 1, real: 0, eth: 0 }; const IFV = { ...IFX };
let BP = 0, BPV = 0, EXP = 0, EXV = 0;
let kFlash = 0, topFlash = 0, topoFlash = 0, fieldFlash = 0, synFlash = 0, latFlash = 0, lastInput = 0, nFired = 0, nArrive = 0, synAct = 0;
const ISO = {}; for (const k in GR) ISO[k] = 1;
function toast(t, s = 2.4) { const e = $('toast'); e.textContent = t; e.classList.remove('hide'); e.style.opacity = 1; toastT = s; }
let toastT = 0;

// Architecture Layers 1-6
const LAY = [
  { n: 'CORE · GRAVITY POINT', s: 'Der Kern zündet als einzelner Lichtpunkt. Von hier geht jede Verbindung aus.', g: ['kernel', 'res', 'axis'] },
  { n: 'NEURAL LATTICE', s: 'Axone wachsen aus dem Kern. Darunter das Quantum Lattice: 8³ Impulse.', g: ['axon', 'mesh'] },
  { n: 'RESONANCE RINGS', s: 'Die Ringe entfalten sich oben und unten und drehen gegenläufig.', g: ['ring', 'syn', 'bridge', 'funnel', 'topo'] },
  { n: 'FIELD EXPANSION', s: 'Das Feld wächst nach außen wie eine Baumkrone. Das Netz hat keinen Rand.', g: ['field'] },
  { n: 'AWARENESS LAYER', s: 'Die Ringe atmen synchron. Der Kern beginnt zu leuchten.', g: ['awa'] },
  { n: 'UNIVERSAL INTERFACE', s: 'Die Schnittstelle zu Mensch und System. Das Netz ist online.', g: ['iface'] }];
const G2L = {}; LAY.forEach((l, i) => l.g.forEach(g => G2L[g] = i));
const LV = [1, 1, 1, 1, 1, 1];
const BUILD = { on: false, t: 0, L: 0, dur: [5, 8, 8, 7, 7, 6], done: true };

// Key Elements (Tap-Texte aus dem Konzept)
const EL = {
  gp: { n: 'GRAVITY POINT (Axon-Knoten)', s: 'Axon-Knoten. Zentraler Netzwerk-Kern für Resonanz, Verbindung und Bewusstsein.', g: ['kernel', 'axon', 'res'], t: new V3(0, 0, 0), d: 8, ph: 1.28 },
  res: { n: 'RESONANCE CORE', s: 'Wahrnehmung ist Resonanz, nicht Abbild.', g: ['res', 'kernel'], t: new V3(0, 0, 0), d: 9.5, ph: 1.3 },
  net: { n: 'NEURAL NETWORK · NEURAL BRANCHES', s: 'Synapsen. Hier lernt das Netz.', g: ['axon', 'kernel'], t: new V3(0, 0, 0), d: 21, ph: 1.15 },
  ring: { n: 'QUANTUM RING · RESONANCE RINGS', s: 'Perception, Daten. Kohärenz richtet die Ringe aus, Entropie bringt sie zum Flattern.', g: ['ring', 'syn'], t: new V3(0, 0, 0), d: 22, ph: 1.12 },
  field: { n: 'FIELD LAYER · FIELD EXPANSION', s: 'Universum, Wachstum. Das Netz hat keinen Rand.', g: ['field'], t: new V3(0, FIELD_Y + 1.4, 0), d: 15, ph: 1.05 },
  syn: { n: 'SYNAPTIC LINK', s: 'Zwischen zwei Punkten entsteht Bedeutung.', g: ['syn', 'ring'], t: new V3(0, .3, 0), d: 18, ph: .95 },
  bridge: { n: 'HARMONIC BRIDGE', s: 'Integration. Was getrennt schwingt, findet hier zusammen.', g: ['bridge', 'ring', 'res'], t: new V3(0, 0, 0), d: 18, ph: 1.3 },
  lat: { n: 'QUANTUM LATTICE 8³', s: '8³ Impulse. Jeder Knoten ein möglicher Zustand.', g: ['mesh', 'funnel'], t: new V3(0, LAT_C, 0), d: 16, ph: 1.2 }
};
LAY.forEach((l, i) => EL['L' + i] = { n: `LAYER ${i + 1} · ${l.n}`, s: l.s, g: l.g, layer: i });

const DTH = { kernel: -9, axis: .45, axon: .55, topo: 1.45, ring: 1.55, syn: 1.75, iface: 1.9, awa: 2.2, funnel: 2.3, field: 2.45, res: 2.55, mesh: 2.65, bridge: 2.75, dust: 2.5, conn: 2.5, tess: 3.25, mAx: .5, mField: 1.5, mGrow: 1.5, mStab: 1.5, mGal: 1.5 };
const GAIN = { ring: .6, topo: .55, axon: .85, field: .75, axis: .6, syn: .8, res: .42, kernel: 1, mesh: .55, funnel: .6, awa: .5, iface: .32, bridge: .9, conn: .8, mField: .8, mGal: .7 };
const MODG = { axon: 'mAx', field: 'mField', growth: 'mGrow', stab: 'mStab', gal: 'mGal' };
const MODN = { axon: 'AXON STRUCTURE · Multi-Branch Network', field: 'RESONANCE FIELD · Frequency Coherence', growth: 'GROWTH PATTERN · Organic Expansion', stab: 'DYNAMIC STABILITY · Balance & Adaptation', gal: 'INFINITE POTENTIAL · Beyond Limits' };
const DNAME = ['D0 POINT', 'D1 LINE', 'D2 PLANE', 'D3 SPACE', '4D TESSERACT'];

// Ethical AI Core: goldener Ring um den Gravity Point
const ethicRing = lineLoop(circlePts(1.0, 160, 0), lineMat(new THREE.Color(2.4, 1.6, .5), .8)); kernG.add(ethicRing);
const ethicRing2 = lineLoop(circlePts(1.08, 160, 0), lineMat(new THREE.Color(2.0, 1.3, .4), .4)); ethicRing2.rotation.x = Math.PI / 2; kernG.add(ethicRing2);

// Explosionsansicht: y-Versatz je Gruppe
const EXS = { kernel: -12, res: -12, axis: 0, mesh: -4.4, funnel: -5.2, topo: -.4, ring: -3, syn: -3, bridge: -3, axon: -3, field: -2.4, awa: 5.6, iface: 2.4 };
const GO = [['kernel', kernG], ['res', resG], ['mesh', meshG], ['funnel', funG], ['topo', topoG], ['ring', ringG], ['syn', synG], ['bridge', BRN.g], ['axon', AXN.g], ['field', fieldG], ['awa', awaG], ['iface', ifG]];
for (const [, o] of GO) o.userData.y0 = o.position.y;
const exLab = []; const LYC = [-12, LAT_C - 4.4, -3, FIELD_Y - 2.4 + 1.3, 5.6, IF_Y + 2.4];
LAY.forEach((l, i) => { const sp = textSprite([{ t: `0${i + 1}`, c: '#9fe8ff', g: 'rgba(58,214,255,.9)' }, { t: l.n, s: .62, c: '#e8fbff', g: 'rgba(122,92,255,.8)' }], { h: 1.05, align: 'right', fs: 40 }); sp.position.set(-9.2, LYC[i], 0); sp.material.opacity = 0; sp.visible = false; root.add(sp); exLab.push(sp); });

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
function axV() { return 5.2 * (1 + P.freq * .5); }
function fireKernel(strength = 1) {
  const coh = P.coh; kFlash = 1; nFired++;
  if (IFX.human < .5) { // Human: ein einzelner Impuls
    const live = MAINS.filter(p => p.grow > .6); const p = live[Math.floor(R() * live.length)]; if (p) AXN.fire(p, strength * 1.2, axV());
    for (let i = 0; i < 4; i++) AXN.fire(DEN[Math.floor(R() * DEN.length)], .7, 3.5);
  } else {
    for (const p of MAINS) { if (p.grow < .6) continue; const dl = (1 - coh) * R() * 1.1, v = axV() * (1 + (1 - coh) * (R() - .5) * .9); AXN.fire(p, strength, v, dl); }
    for (const p of DEN) AXN.fire(p, .7 * strength, 3.5, R() * .1);
  }
  SND.ev((G, t) => { aThump(G, t, .32); aWhoosh(G, t + .05, 1.6, .05, 300, 2400); });
}
function fireOne() { const n = IFX.human < .5 ? 1 : 2; for (let k = 0; k < n; k++) { const p = MAINS[Math.floor(R() * MAINS.length)]; if (p.grow > .8) AXN.fire(p, .55 + R() * .3, 4.2 + P.freq * 3); } }
const mHit = [];
function meshTrigger(pos, e = 1) { let bi = 0, bd = 1e9; for (let i = 0; i < M3.length; i += 2) { const d = M3[i].p.distanceToSquared(pos); if (d < bd) { bd = d; bi = i; } } meshKick(bi, e); latFlash = Math.min(1, latFlash + .3); }
function meshKick(i, e) { const m = M3[i]; if (m.e > e * .9) return; m.e = Math.max(m.e, e); m.mem = 1; if (e > .3) { const nb = MNB[i]; for (let k = 0; k < 2; k++) mHit.push({ i: nb[Math.floor(R() * nb.length)], e: e * (.72 + P.coh * .16), d: .07 + (1 - P.coh) * R() * .12 }); } }
function onAxArrive(p, u) {
  nArrive++; p.lastA = T; if (p.parent) p.parent.lastA = T;
  if (!p.tg || p.parent || p.den) return;
  const tg = p.tg, end = p.pts[p.n - 1];
  if (tg.type === 'ring') {
    ringAmp = Math.min(1.6, ringAmp + .2 * u.e); synFlash = Math.min(1, synFlash + .2);
    for (const nd of RN) if (nd.qi === tg.qi && nd.p.distanceToSquared(end) < 1.4) nd.fl = 1;
    const L = BRIDGE_BY_Q[tg.qi]; if (L.length && R() < .55) BRN.fire(L[Math.floor(R() * L.length)], u.e * .9, 4.2, (1 - P.coh) * R() * .3);
    if (tg.qi >= 4) meshTrigger(new V3(end.x * .6, LAT_Y1, end.z * .6), u.e * .8);
    SND.ping(noteFor(tg.p.y, tg.qi), .045 * u.e, 1.8, clamp(end.x / 6, -1, 1));
  } else if (tg.type === 'field') { fieldFlash = Math.min(1, fieldFlash + .35); const near = MYN.paths.filter(m => !m.parent && m.grow > .3); for (let k = 0; k < 3 && near.length; k++) MYN.fire(near[Math.floor(R() * near.length)], u.e, 2.6); SND.ping(PENTA[10], .035 * u.e, 2.4, clamp(end.x / 6, -1, 1)); }
  else if (tg.type === 'top') { topFlash = Math.min(1.5, topFlash + .4); fieldFlash = Math.min(1, fieldFlash + .2); SND.ping(PENTA[13], .035 * u.e, 2.6, 0); }
  else if (tg.type === 'lat') { meshTrigger(end, u.e); SND.ping(PENTA[1] * 2, .04 * u.e, 1.6, clamp(end.x / 6, -1, 1)); }
}
function onBrArrive(p, u) { if (p.toCore) { kFlash = Math.min(1, kFlash + .15 * u.e); SND.ping(PENTA[12], .025 * u.e, 2.6, 0); } }

// ================================================================ UI
const CAL = [
  ['freq', '1 · Frequency', 'Ring-Schwingung, Impulsrate, Tonhöhe'],
  ['coh', '2 · Coherence', 'Ringe ausgerichtet oder chaotisch, Impulse synchron'],
  ['sym', '3 · Symmetry', 'Radiale Symmetrie-Ordnung der Ringe'],
  ['ent', '4 · Entropy', 'Rauschen und Zittern'],
  ['awa', '5 · Awareness', 'Glühen des Kerns, Wirbel der Awareness-Schicht'],
  ['exp', '6 · Expansion', 'Field Expansion, Wachstum der Kuppel']
];
$('cals').innerHTML = CAL.map(([k, n, d]) => `<label class="cal" title="${d}"><span class="cn">${n}</span><span class="cv" id="v_${k}">0.00</span><input type="range" id="s_${k}" min="0" max="1" step="0.01"><span class="cd">${d}</span></label>`).join('');
function setP(k, v, fromUI) { P[k] = clamp(+v, 0, 1); $('v_' + k).textContent = k === 'sym' ? `${P[k].toFixed(2)} · k${3 + Math.round(P.sym * 9)}` : P[k].toFixed(2); if (!fromUI) $('s_' + k).value = P[k]; $('s_' + k).style.setProperty('--p', (P[k] * 100) + '%'); SND.params(); }
for (const [k] of CAL) { const s = $('s_' + k); s.addEventListener('input', () => { setP(k, s.value, true); lastInput = T; }); setP(k, P[k]); }
function setDim(d, instant) { if (!SYS.multi) d = Math.min(d, 3); dimT = clamp(d, 0, 4); if (instant) dimV = dimT; $('dimR').value = dimT; $('dimR').style.setProperty('--p', (dimT * 25) + '%'); document.querySelectorAll('#dims button').forEach(b => b.classList.toggle('on', +b.dataset.d === Math.round(dimT))); }
document.querySelectorAll('#dims button').forEach(b => b.onclick = () => { if (+b.dataset.d === 4 && !SYS.multi) { toast('MULTI-DIMENSIONAL IST AUS · 4D GESPERRT'); return; } setDim(+b.dataset.d); SND.ev((G, t) => aWhoosh(G, t, 1.2, .05, 200, 1800)); toast(DNAME[+b.dataset.d]); });
$('dimR').addEventListener('input', e => setDim(+e.target.value));
function setH(h) { H = h; document.querySelectorAll('#hh button').forEach(b => b.classList.toggle('on', +b.dataset.h === h)); if (h === 1) { for (const p of rewiring) { p.rw.ph = 1; } } }
document.querySelectorAll('#hh button').forEach(b => b.onclick = () => { setH(+b.dataset.h); toast(H === 1 ? 'H1 · STABILITY: NETZ HÄLT SEINE FORM' : 'H2 · ADAPTATION: AXONE WACHSEN NEU'); if (H === 2 && SYS.self) rewireOne(); });
function isoBtns() { document.querySelectorAll('#keys button,#lays button[data-el]').forEach(b => b.classList.toggle('on', b.dataset.el === iso)); }
function setIso(k) {
  iso = iso === k ? null : k; isoBtns();
  if (iso) {
    const e = EL[iso]; showTip(e.n, e.s);
    if (e.layer !== undefined) { if (EXP) layerCamEx(e.layer); else layerCam(e.layer); }
    else { goal.t.copy(e.t); goal.d = e.d * (camera.aspect < 1 ? 1.45 : 1); goal.ph = e.ph; }
    if (iso === 'gp') fireKernel(); if (dimT < 3) setDim(3); SND.ev((G, t) => aBell(G, t, 523.3, .04));
  } else { hideTip(); overviewGoal(); }
}
document.querySelectorAll('#keys button,#lays button[data-el]').forEach(b => b.onclick = () => { setIso(b.dataset.el); closePanels(); });
let tipT = 0; function showTip(t, s) { $('tipT').textContent = t; $('tipX').textContent = s; $('tip').classList.remove('hide'); tipT = 7; }
function hideTip() { $('tip').classList.add('hide'); tipT = 0; }
$('tip').onclick = hideTip;
const SYSN = { self: 'Self-Organizing: Äste suchen sich neue Wege', multi: 'Multi-Dimensional: 4D erlaubt', learn: 'Adaptive Learning: Äste wachsen, wo du berührst', ethic: 'Ethical AI Core: Würde als feste Mitte', human: 'Human-Centric: der Kern sieht dich an' };
document.querySelectorAll('#sys button').forEach(b => b.onclick = () => {
  const k = b.dataset.sys; SYS[k] = !SYS[k]; b.classList.toggle('on', SYS[k]);
  if (k === 'multi' && !SYS.multi && dimT > 3) setDim(3);
  if (k === 'self' && SYS.self) rewireOne();
  toast(`${SYSN[k].split(':')[0].toUpperCase()}: ${SYS[k] ? 'AN' : 'AUS'}`); if (SYS[k]) showTip(SYSN[k].split(':')[0], SYSN[k].split(': ')[1] + '.');
  SND.ev((G, t) => aPing(G, t, SYS[k] ? 880 : 440, .03, .5, 0, .3));
});
// Interface-Paare: echte Schalter
const IFN = { mind: ['MIND', 'AI', 'Farbe wandert von Cyan zu Magenta.'], brain: ['BRAIN', 'SYSTEM', 'Organisch gegen geometrisch.'], human: ['HUMAN', 'NETWORK', 'Ein Impuls gegen viele.'], real: ['REALITY', 'SIMULATION', 'Fest gegen Drahtgitter.'], eth: ['ETHICS', 'CONTROL', 'Ringe schwingen frei oder sind starr.'] };
function setIF(k, v) {
  IFX[k] = v; const b = document.querySelector(`#ifx button[data-if="${k}"]`); if (b) b.classList.toggle('r', !!v);
  if (k === 'eth' && v) { toast('Resonanz statt Kontrolle.', 3.5); showTip('ETHICS ↔ CONTROL', 'Resonanz statt Kontrolle. Die Ringe erstarren.'); }
  else toast(`${IFN[k][0]} ↔ ${IFN[k][1]}: ${IFN[k][v ? 1 : 0]}`);
  if (k === 'human') fireKernel(.9);
  SND.ev((G, t) => aPing(G, t, v ? 659.3 : 523.3, .03, .6, v ? .5 : -.5, .3));
}
document.querySelectorAll('#ifx button').forEach(b => b.onclick = () => setIF(b.dataset.if, IFX[b.dataset.if] ? 0 : 1));
const INFO = [['WebGL2 / Three.js', 'Echtzeit-3D mit Bloom, Qualitätsstufen und Touch-Steuerung.'], ['Neural Branches', 'Hebb-Lernen: Adaptive Learning stärkt benutzte Äste und lässt neue sprießen.'], ['Resonance Rings', 'Bänder aus feinen Kreisen, Kohärenz und Entropie steuern die Schwingung.'], ['Quantum Lattice', '8 × 8 × 8 Knoten, jeder merkt sich den letzten Impuls.'], ['Blueprint', 'Drahtgitter mit Maßlinien und Beschriftung, wie eine technische Zeichnung.'], ['Web Audio', 'Generativer Klang: Drone, Glocken, jeder Ring ein eigener Ton.']];
$('chips').innerHTML = INFO.map(([n], i) => `<button data-i="${i}">${n}</button>`).join('');
$('chips').querySelectorAll('button').forEach(b => b.onclick = () => { $('chips').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); $('infoT').textContent = INFO[+b.dataset.i][1]; });
function setMod(k) {
  modK = modK === k ? null : k;
  document.querySelectorAll('#mods button').forEach(b => b.classList.toggle('on', b.dataset.m === modK));
  if (modK) { if (EXP) setEx(0); toast(MODN[modK]); if (dimT < 3) setDim(3); SND.ev((G, t) => aWhoosh(G, t, 1.4, .05, 300, 2200)); if (modK === 'growth') growT = 0; }
  overviewGoal();
}
document.querySelectorAll('#mods button').forEach(b => b.onclick = () => setMod(b.dataset.m));
$('bFire').onclick = () => { fireKernel(); lastInput = T; };
$('bView').onclick = () => { iso = null; isoBtns(); hideTip(); overviewGoal(); };
function setBP(v) { BP = v; $('bBP').textContent = BP ? 'BLUEPRINT' : 'SOLID'; $('bBP').classList.toggle('on', !!BP); document.body.classList.toggle('bp', !!BP); }
$('bBP').onclick = () => { setBP(BP ? 0 : 1); toast(BP ? 'BLUEPRINT · DRAHTGITTER MIT MASSEN' : 'SOLID'); SND.ev((G, t) => aPing(G, t, BP ? 784 : 392, .03, .8, 0, .3)); };
function setEx(v) { EXP = v; $('bEx').classList.toggle('on', !!EXP); if (EXP && modK) setMod(modK); overviewGoal(); }
$('bEx').onclick = () => { if (BUILD.on) return; setEx(EXP ? 0 : 1); toast(EXP ? 'EXPLODE · SECHS SCHICHTEN' : 'ZUSAMMENGESETZT'); SND.ev((G, t) => aWhoosh(G, t, 1.4, .05, 200, 1600)); };
$('bBuild').onclick = () => { closePanels(); startBuild(); };
function closePanels() { $('pL').classList.remove('open'); $('pR').classList.remove('open'); }
$('bPL').onclick = () => { $('pR').classList.remove('open'); $('pL').classList.toggle('open'); };
$('bPR').onclick = () => { $('pL').classList.remove('open'); $('pR').classList.toggle('open'); };
document.querySelectorAll('[data-close]').forEach(b => b.onclick = closePanels);

// ================================================================ BAUEN (Schicht für Schicht)
function startBuild() {
  if (EXP) setEx(0); if (modK) setMod(modK); iso = null; isoBtns(); hideTip(); if (dimT < 3) setDim(3, true);
  BUILD.on = true; BUILD.done = false; BUILD.t = 0; BUILD.L = 0; for (let i = 0; i < 6; i++) LV[i] = 0;
  for (const p of MAINS) { p.grow = 0; delete p.rw; } rewiring.length = 0;
  document.body.classList.add('building'); $('build').classList.remove('hide'); $('online').classList.add('hide');
  layerStart(0);
}
function layerStart(L) {
  BUILD.L = L; BUILD.t = 0; layerCam(L); updBuildBar();
  const l = LAY[L]; showTip(`LAYER ${L + 1}/6 · ${l.n}`, l.s);
  if (L === 0) { kFlash = 1.2; SND.ev((G, t) => { aThump(G, t, .4); aBell(G, t + .1, 261.6, .04); }); }
  else SND.ev((G, t) => { aWhoosh(G, t, 1.6, .05, 200, 1800 + L * 300); aBell(G, t + .2, PENTA[4 + L * 2], .035); });
  if (L === 1) setTimeout(() => fireKernel(.8), 2600);
}
function layerNext() { if (!BUILD.on) return; for (let i = 0; i <= BUILD.L; i++) LV[i] = Math.max(LV[i], .999); if (BUILD.L < 5) layerStart(BUILD.L + 1); else endBuild(); }
function endBuild() {
  BUILD.on = false; BUILD.done = true; for (let i = 0; i < 6; i++) LV[i] = 1; for (const p of MAINS) p.grow = 1;
  document.body.classList.remove('building'); $('build').classList.add('hide');
  $('online').classList.remove('hide'); setTimeout(() => $('online').classList.add('hide'), 5200);
  overviewGoal(); fireKernel(1.1); hideTip();
  SND.ev((G, t) => { aChoir(G, t, 5, [220, 277.2, 329.6, 440, 554.4], .045); aBell(G, t, 880, .04); });
  toast('SYSTEM ONLINE · One Network. Infinite Possibilities.', 4.5);
}
$('bNext').onclick = () => layerNext();
$('bSkip').onclick = () => endBuild();
function updBuildBar() { $('bbT').textContent = `LAYER ${BUILD.L + 1}/6 · ${LAY[BUILD.L].n}`; document.querySelectorAll('#bbD i').forEach((e, i) => { e.classList.toggle('on', i < BUILD.L); e.classList.toggle('cur', i === BUILD.L); }); $('bNext').textContent = BUILD.L < 5 ? 'WEITER ›' : 'FERTIG ›'; }
const LCAM = [[0, 0, 0, 7, 1.35], [0, -.8, 0, 17, 1.2], [0, 0, 0, 24, 1.12], [0, 2.5, 0, 22, 1.05], [0, .5, 0, 25, 1.3]];
function layerCam(L) { if (L >= 5) { overviewGoal(); return; } const c = LCAM[L]; goal.t.set(c[0], c[1], c[2]); goal.d = c[3] * (camera.aspect < 1 ? 1.45 : 1); goal.ph = c[4]; }
function layerCamEx(L) { goal.t.set(0, LYC[L], 0); goal.d = (camera.aspect < 1 ? 30 : 20); goal.ph = 1.25; }
function updateBuild(dt) {
  if (!BUILD.on) return;
  BUILD.t += dt; const L = BUILD.L, d = BUILD.dur[L];
  LV[L] = Math.max(LV[L], sat(BUILD.t / (d * .7)));
  for (let i = 0; i < L; i++) LV[i] = 1;
  goal.th += dt * .09;
  if (!BUILD.manual && BUILD.t > d) layerNext();
  if (L === 4 && (frameN % 40) === 0) fireKernel(.6);
}

// ================================================================ SYNERGY + TOPOLOGY (2D-Canvas)
const synC = $('synC'), sg2 = synC.getContext('2d');
const MET = [[0, 0, 0]]; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; MET.push([Math.cos(a), Math.sin(a), (i % 2 ? .6 : -.6)]); } for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; MET.push([Math.cos(a) * 2, Math.sin(a) * 2, 0]); }
function drawSyn(t) {
  const W = synC.width, Hh = synC.height; sg2.clearRect(0, 0, W, Hh); const s = Hh * .19, cx = W / 2, cy = Hh * .5; const ca = Math.cos(t * .4), sa = Math.sin(t * .4);
  const tl = .5 + .3 * Math.sin(t * .3), ct = Math.cos(tl), st2 = Math.sin(tl);
  const P2 = MET.map(([x, y, z]) => { const X = x * ca - y * sa, Y0 = x * sa + y * ca; const Y = Y0 * ct - z * st2, Z2 = Y0 * st2 + z * ct; const k = 3.2 / (3.2 + Z2 * .5); return [cx + X * s * k, cy + Y * s * k, Z2]; });
  const gl = .14 + synAct * .75 + lockF * .3; sg2.lineWidth = 1;
  sg2.shadowColor = 'rgba(255,79,216,.9)'; sg2.shadowBlur = 4 + synAct * 14;
  for (let i = 0; i < 13; i++) for (let j = i + 1; j < 13; j++) { sg2.strokeStyle = `rgba(${j > 6 && i > 6 ? '255,79,216' : '58,214,255'},${clamp(gl * (i && j ? .55 : .8), 0, 1).toFixed(3)})`; sg2.beginPath(); sg2.moveTo(P2[i][0], P2[i][1]); sg2.lineTo(P2[j][0], P2[j][1]); sg2.stroke(); }
  for (const [x, y] of P2) { sg2.strokeStyle = `rgba(122,92,255,${(.3 + synAct * .5).toFixed(3)})`; sg2.beginPath(); sg2.arc(x, y, s * .5, 0, TAU); sg2.stroke(); sg2.fillStyle = '#ffe6fb'; sg2.beginPath(); sg2.arc(x, y, 2 + synAct * 2, 0, TAU); sg2.fill(); }
  sg2.shadowBlur = 0; sg2.fillStyle = 'rgba(230,200,255,.9)'; sg2.font = '600 14px NBMono, monospace'; sg2.textAlign = 'center'; sg2.fillText(`SYNAPSEN AKTIV ${Math.round(synAct * 100)}%`, W / 2, Hh * .97);
}
const topC = $('topC'), tg2 = topC.getContext('2d');
const TOPN = MAINS.map(p => { const v = p.tg.p.clone(); v.y *= .8; return v.normalize(); });
function drawTopo(t) {
  const W = topC.width, Hh = topC.height; tg2.clearRect(0, 0, W, Hh); const cx = W / 2, cy = Hh * .46, s = Hh * .36; const a = t * .3, ca = Math.cos(a), sa = Math.sin(a), tl = .35, ct = Math.cos(tl), st = Math.sin(tl);
  const pr = (x, y, z) => { const X = x * ca + z * sa, Z = -x * sa + z * ca; const Y = y * ct - Z * st, Z2 = y * st + Z * ct; return [cx + X * s, cy - Y * s, Z2]; };
  tg2.lineWidth = 1;
  for (let i = -3; i <= 3; i++) { const la = i / 3.6 * Math.PI / 2, r = Math.cos(la), y = Math.sin(la); tg2.strokeStyle = `rgba(58,214,255,${i ? .22 : .5})`; tg2.beginPath(); for (let k = 0; k <= 48; k++) { const b = k / 48 * TAU; const [x2, y2] = pr(Math.cos(b) * r, y, Math.sin(b) * r); k ? tg2.lineTo(x2, y2) : tg2.moveTo(x2, y2); } tg2.stroke(); }
  for (let i = 0; i < 6; i++) { const b = i / 6 * Math.PI; tg2.strokeStyle = 'rgba(122,92,255,.22)'; tg2.beginPath(); for (let k = 0; k <= 48; k++) { const la = k / 48 * TAU; const [x2, y2] = pr(Math.cos(la) * Math.cos(b), Math.sin(la), Math.cos(la) * Math.sin(b)); k ? tg2.lineTo(x2, y2) : tg2.moveTo(x2, y2); } tg2.stroke(); }
  let n = 0; const [ox, oy] = pr(0, 0, 0);
  MAINS.forEach((p, i) => { const v = TOPN[i]; const [x, y, z] = pr(v.x, v.y, v.z); const on = p.lastA !== undefined && T - p.lastA < 2.5 && p.grow > .5; if (on) n++; const ap = on ? 1 - (T - p.lastA) / 2.5 : 0; if (on) { tg2.strokeStyle = `rgba(255,120,230,${(.15 + ap * .5).toFixed(3)})`; tg2.beginPath(); tg2.moveTo(ox, oy); tg2.lineTo(x, y); tg2.stroke(); } tg2.fillStyle = on ? `rgba(255,${200 + ap * 55 | 0},255,1)` : `rgba(90,140,200,${(.4 + z * .2).toFixed(2)})`; tg2.beginPath(); tg2.arc(x, y, on ? 2.2 + ap * 2 : 1.5, 0, TAU); tg2.fill(); });
  tg2.fillStyle = '#ffffff'; tg2.beginPath(); tg2.arc(ox, oy, 3 + kFlash * 3, 0, TAU); tg2.fill();
  topoCount = n; tg2.fillStyle = 'rgba(200,240,255,.9)'; tg2.font = '600 14px NBMono, monospace'; tg2.textAlign = 'center'; tg2.fillText(`${n}/${MAINS.length} KNOTEN VERBUNDEN`, W / 2, Hh * .97);
}
let topoCount = 0;

// ================================================================ KAMERA + EINGABE
const cam = { pos: new V3(), tgt: new V3() };
const orb = { th: .35, ph: 1.32, d: 26, t: new V3(0, .2, 0) }, goal = { th: .35, ph: 1.32, d: 26, t: new V3(0, .2, 0) };
function overviewGoal() {
  const por = camera.aspect < 1; goal.ph = 1.36; goal.d = por ? 39 : 31; goal.t.set(0, por ? 1.0 : .5, 0);
  if (EXP) { goal.d = por ? 80 : 52; goal.t.set(0, -2.6, 0); goal.ph = 1.4; }
  if (modK === 'axon') { goal.d = por ? 13 : 9; goal.t.set(0, -.4, 0); goal.ph = 1.35; }
  if (modK === 'field') { goal.d = por ? 28 : 19; goal.t.set(0, 0, 0); goal.ph = 1.05; }
  if (modK === 'growth') { goal.d = por ? 30 : 20; goal.t.set(0, 1.4, 0); goal.ph = 1.42; }
  if (modK === 'stab') { goal.d = por ? 24 : 16; goal.t.set(0, 0, 0); goal.ph = 1.5; }
  if (modK === 'gal') { goal.d = por ? 96 : 62; goal.ph = 1.0; goal.t.set(0, 0, 0); }
}
function freeCam(dt) {
  const k = 1 - Math.exp(-dt * (BUILD.on ? 1.4 : 3.0)); let dth = goal.th - orb.th; dth = Math.atan2(Math.sin(dth), Math.cos(dth));
  orb.th += dth * k; orb.ph = lerp(orb.ph, goal.ph, k); orb.d = lerp(orb.d, goal.d, k * (modK === 'gal' ? .6 : 1)); orb.t.lerp(goal.t, k);
  const s = Math.sin(orb.ph); cam.tgt.copy(orb.t); cam.pos.set(orb.t.x + orb.d * s * Math.sin(orb.th), orb.t.y + orb.d * Math.cos(orb.ph), orb.t.z + orb.d * s * Math.cos(orb.th));
  camera.position.copy(cam.pos); camera.lookAt(cam.tgt);
}
const ptr = { x: 0, y: 0, has: false, t: -99 };
const pts = new Map(); let pinch0 = 0, d0 = 0, drag = null;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); d0 = goal.d; } lastInput = T; });
canvas.addEventListener('pointermove', e => {
  ptr.x = e.clientX / innerWidth * 2 - 1; ptr.y = -(e.clientY / innerHeight) * 2 + 1; ptr.has = true; ptr.t = T;
  if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) goal.d = clamp(d0 * pinch0 / d, 3.5, 130); return; }
  if (drag) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy); goal.th -= dx * .006; goal.ph = clamp(goal.ph - dy * .005, .25, 2.85); }
});
function endPtr(e) { const was = pts.size; pts.delete(e.pointerId); if (was === 1 && drag) { if (drag.moved < 10 && performance.now() - drag.t < 500) tapAt(e.clientX, e.clientY); drag = null; } if (pts.size < 2) pinch0 = 0; }
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); goal.d = clamp(goal.d * Math.exp(e.deltaY * .001), 3.5, 130); lastInput = T; }, { passive: false });
const _sp = new V3();
function scr(v) { _sp.copy(v).project(camera); return [(_sp.x * .5 + .5) * innerWidth, (-_sp.y * .5 + .5) * innerHeight, _sp.z]; }
const _wv = new V3();
function tapAt(x, y) {
  lastInput = T; ptr.x = x / innerWidth * 2 - 1; ptr.y = -(y / innerHeight) * 2 + 1; ptr.has = true; ptr.t = T;
  const wk = new V3(); kernG.getWorldPosition(wk); const [kx, ky] = scr(wk); const kr = Math.max(40, 1.0 * innerHeight / orb.d * 2.2);
  if (Math.hypot(kx - x, ky - y) < kr) { fireKernel(); showTip(EL.gp.n, EL.gp.s); toast('IMPULS · GRAVITY POINT · ALLE ÄSTE'); return; }
  if (dimV > 2.3 && !EXV) {
    const wf = new V3(0, FIELD_Y + 2.7, 0).applyMatrix4(fieldG.parent.matrixWorld); const [fx, fy] = scr(wf); const er = Math.max(34, .9 * innerHeight / orb.d * 2);
    if (Math.hypot(fx - x, fy - y) < er) { showTip(EL.field.n, EL.field.s); fieldFlash = 1; topFlash = 1.2; const near = MYN.paths.filter(m => !m.parent && m.grow > .3); for (let k = 0; k < 6 && near.length; k++) MYN.fire(near[Math.floor(R() * near.length)], 1, 2.6); SND.ping(PENTA[13], .05, 2.6, 0); return; }
  }
  // nächster Ast feuert ab dem berührten Punkt
  let best = null, bi = 0, bd = 1e9;
  for (const p of AXN.paths) { if (p.grow < .5 || p.den) continue; for (let i = 2; i < p.n; i += 3) { _wv.copy(p.pts[i]).applyMatrix4(AXN.g.matrixWorld); const [nx, ny, nz] = scr(_wv); if (nz > 1) continue; const d = Math.hypot(nx - x, ny - y); if (d < bd) { bd = d; best = p; bi = i; } } }
  if (best) {
    AXN.fire(best, 1, axV() * .9, 0, best.cum[bi]); best.w = Math.min(1.6, best.w + .35); best.fl = 1;
    if (SYS.learn && bd < 90) { const d = best.pts[Math.min(best.n - 1, bi + 1)].clone().sub(best.pts[bi]).normalize(); d.add(new V3(R() - .5, R() - .3, R() - .5).multiplyScalar(1.6)).normalize(); const s = sproutAt(best, bi, d); setTimeout(() => AXN.fire(s, .9, 3.5), 900); }
    let nd = null, nb = 30; for (const n of RN) { _wv.copy(n.p).applyMatrix4(synG.matrixWorld); const [nx, ny, nz] = scr(_wv); if (nz > 1) continue; const d = Math.hypot(nx - x, ny - y); if (d < nb) { nb = d; nd = n; } }
    if (nd) { nd_fl(nd); showTip(EL.syn.n, EL.syn.s); }
    else if (best.tg && best.tg.type === 'lat' && bi > best.n * .6) showTip(EL.lat.n, EL.lat.s);
    else showTip('NEURAL BRANCHES', SYS.learn ? 'Synapsen. Hier lernt das Netz. Ein neuer Ast wächst, wo du berührst.' : 'Synapsen. Hier lernt das Netz.');
    SND.ping(noteFor(best.pts[bi].y, 2), .05, 1.6, clamp(best.pts[bi].x / 6, -1, 1));
  } else fireOne();
}
function nd_fl(nd) { nd.fl = 1; for (const o of RN) if (o.qi === nd.qi && Math.abs(o.i - nd.i) === 1) o.fl = .6; ringAmp = Math.min(1.5, ringAmp + .3); }

// ================================================================ GP-IRIS (Human-Centric)
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _ray = new V3(), _lt = new V3(), _ep = new V3();
function updateIris(dt) {
  kernG.getWorldPosition(_ep);
  const usePtr = SYS.human && ptr.has && (T - ptr.t) < 6;
  let tx, ty; if (usePtr) { tx = ptr.x; ty = ptr.y; } else { tx = Math.sin(T * .37) * .25; ty = Math.sin(T * .23) * .15; }
  _ray.set(tx, ty, .5).unproject(camera).sub(camera.position).normalize();
  _lt.copy(camera.position).addScaledVector(_ray, camera.position.distanceTo(_ep) * .8);
  if (!SYS.human) _lt.set(_ep.x + Math.sin(T * .2) * 5, _ep.y + 2, _ep.z + Math.cos(T * .2) * 5);
  _q0.copy(gpLook.quaternion); gpLook.lookAt(_lt); _q1.copy(gpLook.quaternion); gpLook.quaternion.copy(_q0).slerp(_q1, 1 - Math.exp(-dt * (2 + P.awa * 6)));
  const glow = .5 + P.awa * .8 + kFlash * .9 + lockF * .6 + LV[4] * ringBreath * .3 * Math.sin(T * (1.1 + P.freq * 1.4));
  pupil.material.opacity = Math.min(1, .3 + glow * .35) * GR.kernel.f * (SYS.human ? 1 : .5); pupil.scale.setScalar(.3 + P.awa * .14 + kFlash * .2);
  irisRings.forEach(({ L }, i) => { L.rotation.z = T * (.2 + i * .05) * (i % 2 ? 1 : -1); L.scale.setScalar(1 + Math.sin(T * 2 + i) * .03 * (1 + kFlash)); L.material.opacity = (SYS.human ? .8 : .3) * GR.kernel.f; });
}

// ================================================================ RESONANCE LOCK
function updateLock(dt) {
  const want = P.coh > .95 && P.awa >= .99 && !IFX.eth;
  if (want && !locked) { locked = true; lockT = 0; $('lock').classList.remove('hide'); fireKernel(1.2); SND.ev((G, t) => { aChoir(G, t, 6, [220, 277.2, 329.6, 440, 554.4], .05); aBell(G, t, 880, .05); }); SND.params(); }
  if (!want && locked) { locked = false; $('lock').classList.add('hide'); SND.params(); }
  lockF += ((locked ? 1 : 0) - lockF) * Math.min(1, dt * 2);
  if (locked) { lockT += dt; const per = 2.6 - P.freq * 1.4; if (lockT > per) { lockT = 0; fireKernel(1); SND.ev((G, t) => aBell(G, t, 440, .025)); } }
}

// ================================================================ FRAME
let spontA = 0, rewA = 0, idleFire = 0, geoNow = 0;
function updateMesh(dt) {
  const f4 = sat(dimV - 3), ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent;
  for (let k = mHit.length - 1; k >= 0; k--) { const h = mHit[k]; h.d -= dt; if (h.d <= 0) { mHit.splice(k, 1); meshKick(h.i, h.e); } }
  if (mHit.length > 900) mHit.length = 900;
  const a4 = T * .35 * f4, ex = .9 + P.exp * .2, bp = .25 + WF * .35;
  for (let i = 0; i < M3.length; i++) {
    const m = M3[i]; m.e = Math.max(0, m.e - dt * 2.2); m.mem = Math.max(0, m.mem - dt * .12);
    let x = m.b.x * ex, y = m.b.y, z = m.b.z * ex;
    if (f4 > 0) { const v = rot4([x / 3, (y - LAT_C) / 3, z / 3, m.w], a4, a4 * .7, a4 * .4); const p = proj4(v, 3); x = lerp(x, p[0], f4); y = lerp(y, p[1] + LAT_C, f4); z = lerp(z, p[2], f4); }
    if (ent > 0) { const j = ent * .2; x += Math.sin(T * 7.1 + i) * j; y += Math.sin(T * 6.3 + i * 1.7) * j; z += Math.sin(T * 5.7 + i * 2.3) * j; }
    m.p.set(x, y, z); meshP.pos[i * 3] = x; meshP.pos[i * 3 + 1] = y; meshP.pos[i * 3 + 2] = z;
    const e = m.e, mm = m.mem * .5, b = bp + latFlash * .2;
    meshP.col[i * 3] = C.bl.r * b + e * 1.6 + mm * .3; meshP.col[i * 3 + 1] = C.bl.g * b + e * 2.2 + mm * .6; meshP.col[i * 3 + 2] = C.bl.b * b * 1.4 + e * 2.6 + mm * .8;
    meshP.size[i] = .06 + e * .15; meshP.alpha[i] = .65 + e * .35;
  }
  meshP.up();
  const lp = meshLinkGeo.attributes.position.array, lc = meshLinkGeo.attributes.color.array, lb = .07 + WF * .1;
  for (let k = 0; k < MLINK.length; k++) { const [a, b] = MLINK[k], A = M3[a], B = M3[b]; const o = k * 6; lp[o] = A.p.x; lp[o + 1] = A.p.y; lp[o + 2] = A.p.z; lp[o + 3] = B.p.x; lp[o + 4] = B.p.y; lp[o + 5] = B.p.z; const e = Math.min(A.e, B.e) * 1.5 + (A.e + B.e) * .2; lc[o] = C.cy.r * lb + e * .9; lc[o + 1] = C.cy.g * lb + e * 1.4; lc[o + 2] = C.cy.b * lb + e * 1.8; lc[o + 3] = lc[o]; lc[o + 4] = lc[o + 1]; lc[o + 5] = lc[o + 2]; }
  meshLinkGeo.attributes.position.needsUpdate = true; meshLinkGeo.attributes.color.needsUpdate = true;
}
function updateNodes(dt) {
  const ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent;
  RN.forEach((nd, i) => {
    nd.fl = Math.max(0, (nd.fl || 0) - dt * 1.8); const major = nd.i % 4 === 0; const c = major ? C.wh : (nd.qi % 2 ? C.vi : C.cy); const b = (major ? 1.6 : 1.1) + nd.fl * 2.5 + lockF * .6 * (.5 + .5 * Math.sin(T * 6));
    nodeP.col[i * 3] = c.r * b; nodeP.col[i * 3 + 1] = c.g * b; nodeP.col[i * 3 + 2] = c.b * b; nodeP.size[i] = (major ? .19 : .11) * (1 + nd.fl * .9); nodeP.alpha[i] = 1;
    const q = nd.q, a = nd.a + q.spin, r = ringRad(q, nd.a); const j = ent * .12 * (1 - ringRigid);
    nodeP.pos[i * 3] = Math.cos(a) * r + Math.sin(T * 9 + i) * j; nodeP.pos[i * 3 + 1] = q.y + Math.sin(T * 8 + i * 2) * j; nodeP.pos[i * 3 + 2] = Math.sin(a) * r + Math.sin(T * 7 + i * 3) * j;
  });
  nodeP.up();
}
let WF = 0;
function frame(dt) {
  T += dt; frameN++;
  updateBuild(dt);
  // Dimension
  dimV += (dimT - dimV) * Math.min(1, dt * 1.6); if (Math.abs(dimT - dimV) < .002) dimV = dimT;
  const sx = Math.max(.002, ease(dimV)), sz = Math.max(.002, ease(dimV - 1)), sy = Math.max(.002, ease(dimV - 2));
  root.scale.set(sx, sy, sz);
  // Blueprint / Interface-Paare / Explode glätten
  const kk = Math.min(1, dt * 2.5);
  BPV += (BP - BPV) * kk; for (const k in IFX) IFV[k] += (IFX[k] - IFV[k]) * kk; EXV += (EXP - EXV) * Math.min(1, dt * 1.8);
  WF = Math.max(BPV, IFV.real);
  PSZ.value = 1 - .5 * WF; GLOWK = 1 - .7 * WF; FILLK = 1 - .85 * WF;
  bloom.strength = TIERS[tier].bl * (1 - .5 * WF) * (1 + LV[4] * 0);
  grade.uniforms.uMono.value = BPV * .8; grade.uniforms.uGrid.value = BPV; grade.uniforms.uAI.value = IFV.mind; grade.uniforms.uPx.value = renderer.getPixelRatio();
  // Module
  for (const k in MOD) MOD[k] += ((modK === k ? 1 : 0) - MOD[k]) * Math.min(1, dt * 2.5);
  // Gruppenfaktoren
  const mA = MOD.axon * .85 + MOD.field * .72 + MOD.growth * .75 + MOD.stab * .72 + MOD.gal * .15;
  for (const g in GR) {
    const th = DTH[g] ?? 2.5; let f = g === 'kernel' ? 1 : sat((dimV - th) * 1.8);
    if (g === 'tess') f = sat((dimV - 3.05) * 1.6) * (1 - EXV);
    if (g.startsWith('m') && g !== 'mesh') { const mk = Object.keys(MODG).find(k => MODG[k] === g); f *= MOD[mk] || 0; }
    else if (g !== 'tess') f *= clamp(1 - mA, .07, 1);
    const it = iso ? (EL[iso].g.includes(g) ? 1 : (g === 'axis' || g === 'dust' || g === 'kernel' ? .25 : .06)) : 1;
    ISO[g] = (ISO[g] ?? 1) + (it - (ISO[g] ?? 1)) * Math.min(1, dt * 3);
    if (G2L[g] !== undefined) f *= sat(LV[G2L[g]] * 1.5);
    if (g === 'dust') f *= LV[3] * (1 - MOD.gal * .7) * (1 - EXV * .6);
    if (g === 'axis') f *= 1 - EXV * .8;
    if (g === 'axon') f *= 1 - EXV * .65;
    if (g === 'conn') f = EXV;
    if (g === 'kernel' && BUILD.on && BUILD.L === 0) f *= 1 + kFlash * .4;
    GR[g].f = (GAIN[g] ?? 1) * f * ISO[g] * (1 + lockF * .25 * (.5 + .5 * Math.sin(T * 6.28 / 1.2)));
  }
  applyGroups();
  for (const b of BPL) { const gf = b.g ? Math.min(1, GR[b.g].f * 1.6) : 1; const o = b.b * BPV * gf * (1 - EXV); b.m.opacity = o; b.o.visible = o > .004; }
  exLab.forEach((s, i) => { s.material.opacity = EXV * (iso && iso !== 'L' + i ? .35 : 1); s.visible = EXV > .01; });
  // Explode-Positionen
  for (const [g, o] of GO) o.position.y = o.userData.y0 + (EXS[g] || 0) * ease(EXV);
  const kgeo = ethicRing.visible = ethicRing2.visible = SYS.ethic && GR.kernel.f > .01; ethicRing.material.opacity = .8 * GR.kernel.f; ethicRing2.material.opacity = .45 * GR.kernel.f; ethicRing.rotation.z = T * .2; ethicRing.rotation.x = Math.PI / 2 + Math.sin(T * .3) * .3; ethicRing2.rotation.y = -T * .15;
  // Symmetrie
  const k = 3 + Math.round(P.sym * 9); if (k !== symK) { symK = k; buildSyn(); }
  // Build-Animationen
  const L0 = LV[0], L1 = LV[1], L2 = LV[2], L3 = LV[3], L4 = LV[4], L5 = LV[5];
  kernG.scale.setScalar(Math.max(.001, ease(L0 * 1.4)) * (1 + (BUILD.on && BUILD.L === 0 ? kFlash * .3 : 0)));
  axisG.scale.y = Math.max(.001, ease(L0 * 1.3 - .3)); resG.scale.setScalar(Math.max(.001, ease(L0 * 1.3 - .35)));
  if (BUILD.on || L1 < 1) { for (const p of MAINS) { p.grow = sat(L1 * 1.6 - p.ord * .6); for (const kid of p.kids) kid.grow = sat((p.grow - p.cum[kid.i0]) / Math.max(.05, 1 - p.cum[kid.i0])); } for (const p of DEN) p.grow = sat(L1 * 3); }
  meshG.scale.setScalar(Math.max(.001, ease(L1 * 1.3 - .3)));
  const ru = Math.max(.001, ease(L2 * 1.2)), ruy = Math.max(.001, ease(L2 * 1.5 - .3));
  ringG.scale.set(ru, ruy, ru); synG.scale.copy(ringG.scale); BRN.g.scale.copy(ringG.scale); topoG.scale.set(ru, 1, ru); funG.scale.set(1, ruy, 1);
  mycK = L3; ringBreath = L4 * (1 - ringRigid);
  awaG.scale.setScalar(Math.max(.001, .3 + .7 * ease(L4)));
  ifG.position.y = ifG.userData.y0 + (EXS.iface * ease(EXV)) + (1 - ease(L5)) * 3; ifG.scale.setScalar(Math.max(.001, ease(L5)));
  document.body.classList.toggle('building', BUILD.on && L5 < .3);
  // Brain↔System: Geometrie mischen
  GEOW = ease(IFV.brain); if (Math.abs(GEOW - geoNow) > .002) { geoNow = GEOW; for (const p of AXN.paths) if (p.org && !p.sprout) blendPath(p); for (const p of SPR) if (p.grow >= 0) blendPath(p); }
  for (const q of QR) q.rf = 1 - .85 * IFV.brain;
  symEff = lerp(P.sym, 1, IFV.brain);
  // Ringe (Ethics↔Control)
  ringRigid = IFV.eth;
  ringAmp = Math.max(.25 + .2 * Math.sin(T * (1 + P.freq * 3)), ringAmp - dt * 1.2); if (locked) ringAmp = Math.max(ringAmp, .6 + .5 * Math.sin(T * 5.2));
  const coh0 = P.coh; if (locked) P.coh = 1; updateRings(T, dt); P.coh = coh0;
  if (dimV > 3) { const f4 = (dimV - 3) * (1 - ringRigid); ringG.rotation.set(Math.sin(T * .4) * .25 * f4, 0, Math.cos(T * .33) * .2 * f4); synG.rotation.copy(ringG.rotation); } else { ringG.rotation.set(0, 0, 0); synG.rotation.set(0, 0, 0); }
  synMat.color.setRGB(.55 + IFV.eth * .3, .75, 1.6 - IFV.eth * .3);
  updateNodes(dt);
  if (GR.tess.f > .004) updateTess(T);
  // Achse (Daten aufwärts)
  for (let i = 0; i < axisP.n; i++) { const s = axisS[i]; s.y += s.v * dt * (.6 + P.freq); if (s.y > 7.8) s.y = -7; axisP.pos.set([Math.cos(s.a + T) * s.r, s.y, Math.sin(s.a + T) * s.r], i * 3); const b = 1.2 + Math.sin(s.y * 3 + T * 4) * .4; axisP.col.set([.5 * b, 1.4 * b, 1.8 * b], i * 3); axisP.size[i] = .06; axisP.alpha[i] = .8; } axisP.up();
  topoSpin.forEach(o => o.g.rotation.y = T * o.v * (1 - ringRigid * .9));
  // Gravity Point
  kFlash = Math.max(0, kFlash - dt * 1.4);
  const brK = L4 * .06 * Math.sin(T * (1.1 + P.freq * 1.4));
  for (let i = 0; i < somaP.n; i++) { const s = SOMA[i], br = 1 + .04 * Math.sin(T * (2 + P.freq * 4) + s.ph) + kFlash * .3 * (1 - s.r) + brK; somaP.pos[i * 3] = s.b.x * br; somaP.pos[i * 3 + 1] = s.b.y * br; somaP.pos[i * 3 + 2] = s.b.z * br; } somaP.geo.attributes.position.needsUpdate = true;
  kCore.scale.setScalar(.6 + .08 * Math.sin(T * (2 + P.freq * 4)) + kFlash * .45 + lockF * .3 + P.awa * .15 + Math.min(.4, brK * 2)); kCore2.material.opacity = (.16 + kFlash * .22 + L4 * .1 * P.awa) * GR.kernel.f * GLOWK; kCore2.scale.setScalar(2.2 + kFlash * .9);
  kRings.forEach((r, i) => { r.rotation.x = T * (.3 + i * .17); r.rotation.y = T * (.21 + i * .1) * (i % 2 ? -1 : 1); r.scale.setScalar(1 + kFlash * .3 * (i + 1) / 4); });
  // Spontane Impulse, Self-Organizing
  spontA += dt * (.25 + P.freq * 3.2) * (BUILD.on && BUILD.L < 1 ? 0 : 1); while (spontA > 1) { spontA -= 1; fireOne(); }
  if (SYS.self && !BUILD.on && LV[1] >= 1) { rewA += dt; if (rewA > (H === 2 ? 2.4 - P.freq : 7.5)) { rewA = 0; rewireOne(); } }
  updateRewire(dt); updateSprouts(dt);
  if (started && T - lastInput > 14 && !manual && !BUILD.on) { idleFire += dt; if (idleFire > 7) { idleFire = 0; fireKernel(.9); } }
  AXN.update(dt, onAxArrive, 1 + lockF * .4 + L4 * .1, SYS.learn); BRN.update(dt, onBrArrive, 1, SYS.learn);
  synAct += (sat(AXN.pulses.length / 70 + synFlash * .3) - synAct) * Math.min(1, dt * 3);
  updateMycel(dt); MYN.update(dt, null, 1 + fieldFlash * .6);
  fieldCore.scale.setScalar((.85 + P.exp * .3) * (.15 + .85 * ease(L3))); fieldCore.rotation.y = T * .05 * (1 - ringRigid); fieldFlash = Math.max(0, fieldFlash - dt);
  topFlash = Math.max(0, topFlash - dt * 1.2);
  // Resonance Core, Funnel, Awareness, Interface
  resG.rotation.y = T * .12; resG.scale.multiplyScalar(1 + .025 * Math.sin(T * (1.5 + P.freq * 4)) * (1 - ringRigid) + lockF * .05 * Math.sin(T * 6.28 / 1.2));
  for (let i = 0; i < funP.n; i++) { const s = FUS[i]; s.s = (s.s + s.v * dt * (.6 + P.freq)) % 1; const y = -.9 - s.s * 3.8, r = funR(y), a = s.a + s.s * 9 + T * .4; funP.pos.set([Math.cos(a) * r, y, Math.sin(a) * r], i * 3); const b = 1 + latFlash; funP.col.set([.6 * b, 1.3 * b, 2.2 * b], i * 3); funP.size[i] = .06; funP.alpha[i] = .85; } funP.up();
  latFlash = Math.max(0, latFlash - dt);
  updateMesh(dt);
  { const sp = (.12 + P.freq * .25) * (1 - ringRigid * .85); const br = 1 + L4 * .05 * Math.sin(T * (1.1 + P.freq * 1.4)); for (let i = 0; i < awaP.n; i++) { const s = AWS[i]; s.a += dt * sp * (2.2 / s.r); const r = s.r * br; awaP.pos[i * 3] = Math.cos(s.a) * r; awaP.pos[i * 3 + 1] = s.y + Math.sin(T * 1.3 + s.ph) * .04; awaP.pos[i * 3 + 2] = Math.sin(s.a) * r; } awaP.geo.attributes.position.needsUpdate = true; }
  ifG.rotation.y = -T * .03;
  // Staub (Entropy)
  { const ent = SYS.ethic ? Math.min(P.ent, .6) : P.ent; for (let i = 0; i < dust.n; i++) { const d = DS[i]; const j = .15 + ent * 1.1; dust.pos[i * 3] = d.b.x + Math.sin(T * (.5 + ent * 3) + d.ph) * j; dust.pos[i * 3 + 1] = d.b.y + Math.cos(T * (.4 + ent * 2.7) + d.ph * 1.3) * j; dust.pos[i * 3 + 2] = d.b.z + Math.sin(T * (.45 + ent * 3.1) + d.ph * .7) * j; const b = .3 + ent * 1.2; dust.col[i * 3] = d.c.r * b; dust.col[i * 3 + 1] = d.c.g * b; dust.col[i * 3 + 2] = d.c.b * b; dust.size[i] = d.s; dust.alpha[i] = .25 + ent * .7; } dust.up(); }
  synFlash = Math.max(0, synFlash - dt * .8); synMat.opacity = (.22 + synFlash * .3 + lockF * .2) * GR.syn.f;
  topoFlash = Math.max(0, topoFlash - dt);
  updateModules(dt);
  updateLock(dt);
  if (!drag && T - lastInput > 6 && !iso && !BUILD.on) goal.th += dt * .045;
  freeCam(dt);
  updateIris(dt);
  stars.mesh.rotation.y = T * .003;
  if (frameN % 2 === 0) { drawSyn(T); drawTopo(T); }
  if ((frameN & 7) === 0) statusLine();
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.add('hide'); }
  if (tipT > 0 && !BUILD.on) { tipT -= dt; if (tipT <= 0) hideTip(); }
  if (rec && (frameN & 7) === 0) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; }
  if (BUILD.on && (frameN & 3) === 0) $('bbP').style.width = (((BUILD.L + sat(BUILD.t / BUILD.dur[BUILD.L])) / 6) * 100).toFixed(1) + '%';
}
let neuA = 0, grA = 0;
function updateModules(dt) {
  if (MOD.axon > .01) {
    modAx.position.y = kernG.position.y; modAx.rotation.y = T * .08; neuA += dt * (1.2 + P.freq * 3);
    while (neuA > 1) { neuA -= 1; const p = NEU_ROOT[Math.floor(R() * NEU_ROOT.length)]; NEU.fire(p, 1, 2.6 + P.freq * 2.5); if (R() < .4) NEU.fire(NEU_ROOT[NEU_ROOT.length - 1], 1.2, 3.5); }
    NEU.update(dt, null, 1.1); neuSoma.material.opacity = (.3 + .15 * Math.sin(T * 3)) * GR.mAx.f * GLOWK;
  }
  if (MOD.field > .01) {
    const kw = 1.2 + P.freq * 2.5, om = 2 + P.freq * 4, A = .55 + P.coh * .45; let n = 0;
    for (const { geo, r } of rfLines) { const a = geo.attributes.position.array; const y0 = A * Math.cos(kw * r) * Math.cos(om * T) * (1 - r / 14); const ch = (1 - P.coh) * .3; for (let i = 0; i <= RFS; i++) { const th = i / RFS * TAU; a[i * 3] = Math.cos(th) * r; a[i * 3 + 1] = y0 + Math.sin(th * 3 + T * 2 + r) * ch; a[i * 3 + 2] = Math.sin(th) * r; } geo.attributes.position.needsUpdate = true; for (let j = 0; j < 12 && n < rfP.n; j++, n++) { const th = j / 12 * TAU + r * .4; rfP.pos.set([Math.cos(th) * r, y0, Math.sin(th) * r], n * 3); const b = 1 + Math.abs(y0) * 1.5; rfP.col.set([.6 * b, 1.4 * b, 2 * b], n * 3); rfP.size[n] = .09; rfP.alpha[n] = 1; } }
    rfP.up(); modField.rotation.y = T * .04;
  }
  if (MOD.growth > .01) {
    growT += dt; const gT = Math.min(1.25, (growT % 10) / 7);
    for (const p of GRN.paths) p.grow = sat(gT * (GR_MAXD + 1.5) - p.dep);
    grA += dt; if (grA > .6) { grA = 0; for (const p of GR_ROOT) GRN.fire(p, 1, 3 + P.freq * 2); }
    GRN.update(dt, null, 1.2); modGrow.rotation.y = T * .06;
  }
  if (MOD.stab > .01) {
    modStab.rotation.y = orb.th; const h2 = H === 2 ? 1 : 0; const b0 = 5.5;
    const aR = b0 * (1 + (h2 ? .22 : .03) * Math.sin(T * .7)), aL = b0 * (1 - (h2 ? .22 : .03) * Math.sin(T * .7));
    modStab.rotation.z = h2 ? Math.sin(T * .25) * .35 : 0; const spr = (1 - P.coh) * .9 + .08;
    for (const { geo, j } of stabLines) { const a = geo.attributes.position.array; const s = 1 + (j - 1.5) * .035; for (let i = 0; i <= 240; i++) { const t = i / 240 * TAU; lemn(t, aL * s, aR * s, _w); a[i * 3] = _w.x; a[i * 3 + 1] = _w.y; a[i * 3 + 2] = (j - 1.5) * .15 * Math.sin(t * 2 + T); } geo.attributes.position.needsUpdate = true; }
    for (let i = 0; i < stabP.n; i++) { const s = STS[i]; s.t += dt * s.v * (.6 + P.freq * 1.5); lemn(s.t, aL, aR, _w); stabP.pos.set([_w.x + s.o * spr, _w.y + s.o2 * spr, s.o2 * spr * 1.5], i * 3); const c = _c1.copy(C.cy).lerp(C.mg, .5 + .5 * Math.sin(s.t)); stabP.col.set([c.r * 1.4, c.g * 1.4, c.b * 1.4], i * 3); stabP.size[i] = .08; stabP.alpha[i] = .9; }
    stabP.up();
  }
  if (MOD.gal > .01) modGal.rotation.y = T * .03;
}
function statusLine() {
  const d = Math.min(4, Math.round(dimV)); const nL = LV.filter(v => v >= .99).length;
  const s = BUILD.on ? `LAYER ${BUILD.L + 1}/6 · ${LAY[BUILD.L].n} · ${Math.round(sat(BUILD.t / BUILD.dur[BUILD.L]) * 100)}%`
    : `GP ONLINE · COHERENCE ${P.coh.toFixed(2)} · ENTROPY ${P.ent.toFixed(2)} · ${DNAME[d]} · ${nL}/6 LAYERS · ${H === 1 ? 'H1 STABILITY' : 'H2 ADAPTATION'}${IFX.eth ? ' · CONTROL' : ''}${locked ? ' · RESONANCE LOCK' : ''}`;
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
      const name = `eye-of-resonance-blueprint2-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
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
  bloom.strength = Tt.bl; stars.geo.setDrawRange(0, Math.round(stars.n * (.5 + .5 * Tt.amb))); dust.geo.setDrawRange(0, Math.round(dust.n * (.4 + .6 * Tt.amb))); galP.geo.setDrawRange(0, Math.round(galP.n * (.35 + .65 * Tt.amb))); awaP.geo.setDrawRange(0, Math.round(awaP.n * (.5 + .5 * Tt.amb)));
  resize(); $('bQ').textContent = 'GRAFIK ' + Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 52 : 40; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(), uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of UPT) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  if (!iso && !BUILD.on) overviewGoal();
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
function enter(build = true) {
  if (started) return; started = true; lastInput = T; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  if (ST.snd) SND.unlock(); SND.params();
  if (build) { startBuild(); toast('BAUEN · SCHICHT FÜR SCHICHT · WEITER ODER ÜBERSPRINGEN', 4); }
  else { setDim(0, true); setTimeout(() => setDim(3), 400); setTimeout(() => fireKernel(), 2600); toast('TIPPE DEN GRAVITY POINT AN · JEDE BERÜHRUNG FEUERT EINEN AST', 4.5); }
}
$('go').onclick = () => enter(true);
$('go2').onclick = () => enter(false);
try { await Promise.race([document.fonts.load('600 40px NBMono'), new Promise(r => setTimeout(r, 2000))]); } catch (_) { }
if (Q.has('dim')) setDim(+Q.get('dim'), true);
for (let i = 0; i < 40; i++) frame(1 / 60);
$('go').disabled = $('go2').disabled = false; $('go').textContent = 'BAUEN'; $('go2').textContent = 'ERKUNDEN';
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && !Q.has('nosw') && !VIDEO) { const regSW = () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }); if (document.readyState === 'complete') regSW(); else addEventListener('load', regSW); }

// Test-Schnittstelle
window.__B2 = window.__V4 = {
  ready: true, get state() { return { dimV, H, iso, modK, locked, P: { ...P }, symK, tier: TIERS[tier].n, pulses: AXN.pulses.length + BRN.pulses.length + MYN.pulses.length, nFired, nArrive, rewiring: rewiring.length, sys: { ...SYS }, ifx: { ...IFX }, BP, EXP, LV: [...LV], build: { on: BUILD.on, L: BUILD.L }, topo: topoCount, synAct, sprouts: SPR.filter(p => p.grow > 0).length }; },
  setManual(v) { manual = v; }, step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) frame(dt); composer.render(); },
  fire: fireKernel, set: setP, dim: setDim, mod: setMod, el: setIso, h: setH, enter, bp: setBP, ex: setEx, ifx: setIF, tap: tapAt,
  sys(k, v) { SYS[k] = v; document.querySelector(`#sys button[data-sys="${k}"]`)?.classList.toggle('on', v); },
  build: startBuild, next: layerNext, endBuild, buildManual(v) { BUILD.manual = v; },
  cam(th, ph, d, t) { goal.th = orb.th = th; goal.ph = orb.ph = ph; goal.d = orb.d = d; if (t) { goal.t.set(...t); orb.t.set(...t); } },
  pointer(x, y) { ptr.x = x; ptr.y = y; ptr.has = true; ptr.t = T; }, tier(t) { autoQ = false; applyTier(t); },
  _d: { GR, applyGroups, render: () => composer.render(), root, scene, kernG, camera },
  dbg: () => ({ draw: renderer.info.render.calls, tri: renderer.info.render.triangles, pts: renderer.info.render.points, lines: renderer.info.render.lines })
};
