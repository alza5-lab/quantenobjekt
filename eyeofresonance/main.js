// EYE OF RESONANCE // das originale erste System · shivas_ocean · Luca Matteo Balzano 1991
// Ψ = (S³ · F²) / A → Σ(T · R) + ε
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const Q = new URLSearchParams(location.search);
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(1991);
const rr = (a, b) => a + (b - a) * R();
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
const IS_TOUCH = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) && navigator.maxTouchPoints > 0;
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const pad2 = n => String(n).padStart(2, '0');
let T = 0;

// ---------------------------------------------------------------- layout (world units, see README: origin = Ψ core = cube center)
const L = {
  psiLabel: new V3(-2.55, 0.02, 0),
  arrowY: -0.32, arrowX0: 1.28, arrowX1: 3.15,      // vector: from the source structure to the sum structure
  sumC: new V3(6.05, -1.32, 0), archR: 2.85, archD: 0.78,
  ringX: [-1.18, 0, 1.18], ringY: [0.0, 0.98, 1.96], // 3 × 3 matrix (relative to sumC)
  epsC: new V3(9.55, 0.15, 0)
};
const C = { cy: new THREE.Color('#5ff6ff'), ice: new THREE.Color('#bff8ff'), white: new THREE.Color('#ffffff'), gold: new THREE.Color('#ffc76a'), steel: new THREE.Color('#aab6bf'), amber: new THREE.Color('#ff9a4a') };

// ---------------------------------------------------------------- parameters (the live math)
const P = { S: 1, F: 1.5, A: 1, T: 1, R: 1, eps: 0.3 };
const PR = { S: [.5, 1.5], F: [.5, 3], A: [.5, 3], T: [0, 2], R: [.5, 1.5], eps: [0, 1] };
const PRESETS = [
  { n: 'URSPRUNG', v: { S: 1, F: 1.5, A: 1, T: 1, R: 1, eps: .3 } },
  { n: 'RESONANZ', v: { S: 1.12, F: 2.6, A: .8, T: 1.6, R: 1.25, eps: .2 } },
  { n: 'STILLE', v: { S: .8, F: .6, A: 2.6, T: .35, R: .8, eps: .04 } },
  { n: 'UNSCHÄRFE', v: { S: 1, F: 1.5, A: 1, T: 1, R: 1, eps: 1 } },
  { n: 'EXPANSION', v: { S: 1.5, F: 2.2, A: .6, T: 1.3, R: 1.45, eps: .45 } }
];
const ST = { vol: .75, snd: true, q: null };
try { const s = JSON.parse(localStorage.getItem('eor.s') || '{}'); if (s.P) Object.assign(P, s.P); if (s.vol !== undefined) ST.vol = s.vol; if (s.snd !== undefined) ST.snd = s.snd; } catch (_) { }
if (Q.has('fresh')) Object.assign(P, PRESETS[0].v);
const saveS = () => { try { localStorage.setItem('eor.s', JSON.stringify({ P, vol: ST.vol, snd: ST.snd })); } catch (_) { } };
// per ring factors: rows scale the tangent, columns scale the radius (mean 1, so Σ = 9 · T · R at rest)
const RING = []; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) RING.push({ i, j, k: j * 3 + i, tf: [.8, 1, 1.2][j], rf: [.82, 1, 1.18][i], ph: R() * TAU, rot: R() * TAU, flash: 0, rev: 0 });
const M = { S3: 1, F2: 1, N: 1, Sig: 9, xi: 0, psi: 1, rate: 1, energy: .5 };
function compute() {
  M.S3 = P.S ** 3; M.F2 = P.F ** 2; M.N = M.S3 * M.F2 / P.A;
  M.Sig = 0; for (const r of RING) { r.Ti = P.T * r.tf; r.Ri = P.R * r.rf; M.Sig += r.Ti * r.Ri; }
  M.rate = clamp(.8 * M.N, .15, 14);
  M.psi = M.N * M.Sig + P.eps * M.xi;
  M.energy = clamp(Math.log10(1 + Math.max(0, M.N * M.Sig)) / Math.log10(1 + 600), 0, 1);
}

// ---------------------------------------------------------------- terms (Lucas Geometrie, wörtlich nah)
const TERMS = {
  psi: { k: 'Ψ', n: 'DAS ZENTRUM', f: 'Eine leicht leuchtende Ikosaeder- und Sphären-Matrix im Ursprung (0, 0, 0). Sie bündelt die gesamte Energie des Systems.', m: 'Leuchtkraft und Blitze folgen dem Live-Wert Ψ = S³ · F² / A · Σ(T · R) + ε · ξ(t).', note: 110 },
  S: { k: '<i>S</i><sup>3</sup>', n: 'KUBISCHES VOLUMEN', f: 'Ein transparenter Wireframe-Würfel mit Kantenlänge 2.0. Seine Eckpunkte sind feine Knotenpunkte.', m: 'REGLER S: Kantenlänge 2.0 · S, das Volumen wächst mit S³.', note: 146.8 },
  F: { k: '<i>F</i><sup>2</sup>', n: 'FREQUENZ-EBENEN', f: 'Zwei orthogonale, in sich vibrierende Sinus-Gitterebenen. Sie kreuzen sich im Zentrum des Würfels und schneiden das Volumen in hochfrequente Sektoren.', m: 'REGLER F: Wellenzahl und Vibration der Ebenen, Beitrag F².', note: 220 },
  A: { k: '<i>A</i>', n: 'BASIS-ABSCHIRMUNG', f: 'Eine flache, kreisrunde Basisplatte direkt unter dem Würfel. Als mathematischer Nenner fängt sie das Feld nach unten ab und normiert es.', m: 'REGLER A: Radius der Platte. Größeres A teilt den Zähler, weniger Pulse.', note: 98 },
  arrow: { k: '→', n: 'TRANSFORMATIONSVEKTOR', f: 'Ein horizontaler, strahlenförmiger Vektorpfeil. Er erstreckt sich dynamisch von der linken Quellstruktur zur rechten Summenstruktur.', m: 'Pulsrate = 0.8 · S³ · F² / A pro Sekunde. Jeder Puls trägt Energie in einen Ring.', note: 293.7 },
  sigma: { k: 'Σ', n: 'DAS SUMMENGITTER', f: 'Das übergeordnete Gitter. Es hält die Matrix der Ringe zusammen und summiert ihre Resonanz.', m: 'Σ(T · R) = Summe der neun Ringe, in Ruhe 9 · T · R.', note: 329.6 },
  TR: { k: '<i>T</i> · <i>R</i>', n: 'TANGENTE &amp; RESONANZ', f: 'Eine geordnete Matrix aus 3 × 3 kleinen rotierenden Ringen mit Radius R. Durch jeden Ring verläuft eine lineare Tangente T.', m: 'REGLER T: Länge der Tangenten. REGLER R: Ringradius. Drehung ∝ T · R.', note: 392, gold: true },
  eps: { k: '<i>ε</i>', n: 'DAS RAUSCHFELD', f: 'Eine Wolke aus feinen, zufällig verteilten Mikropunkten. Sie schwebt lose um das rechte Feld und zeigt die quantenmechanische Unschärfe.', m: 'REGLER ε: Dichte und Zittern der Punkte, Rauschen in Ψ.', note: 440 }
};
for (const k in TERMS) TERMS[k].h = 0;
let SEL = null;

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 400);
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .6, .45, .62);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 4, eps: 1, bl: .62 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 2, eps: .8, bl: .6 },
  { n: 'MITTEL', pr: 1, s: 0, eps: .6, bl: .56 },
  { n: 'NIEDRIG', pr: .75, s: 0, eps: .4, bl: .52 }];
let tier = Q.has('q') ? clamp(+Q.get('q') | 0, 0, 3) : (IS_TOUCH ? 1 : 0);
let autoQ = !Q.has('q') && !Q.has('noauto');

// environment for metal: a dark room with a few soft light panels
{
  const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x05070a, side: THREE.BackSide })));
  const panel = (w, h, col, x, y, z, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); es.add(m); };
  panel(14, 3, 0xbfd8e6, 0, 12, 0, 0, Math.PI / 2); panel(6, 8, 0x5fd0ff, -14, 2, 0, Math.PI / 2); panel(6, 8, 0xffd9a8, 14, 3, -2, -Math.PI / 2);
  panel(10, 2, 0x8899aa, 0, 4, 14); panel(8, 2, 0x223344, 0, -6, -14);
  scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose();
}
scene.add(new THREE.HemisphereLight(0x9fdfff, 0x080604, .35));
const key = new THREE.DirectionalLight(0xdff4ff, 1.1); key.position.set(-4, 8, 7); scene.add(key);
const rim = new THREE.DirectionalLight(0xffc89a, .5); rim.position.set(10, 3, -6); scene.add(rim);

// ---------------------------------------------------------------- textures
function ctex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
const dotTex = ctex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const stoneTex = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#6c6b6a'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26000; i++) { const v = Math.random(); g.fillStyle = `rgba(${90 + v * 90 | 0},${90 + v * 88 | 0},${92 + v * 86 | 0},${.08 + Math.random() * .18})`; const s = Math.random() * 3; g.fillRect(Math.random() * w, Math.random() * h, s, s); }
  g.globalAlpha = .12; g.strokeStyle = '#2a2a2a'; for (let i = 0; i < 40; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (Math.random() - .5) * 60; y += (Math.random() - .5) * 60; g.lineTo(x, y); } g.stroke(); }
});
function labelTex(txt, font, col, glow, w = 512, h = 256) {
  return ctex(w, h, (g) => { g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = glow; g.shadowBlur = 28; g.fillStyle = col; g.fillText(txt, w / 2, h / 2 + 8); g.shadowBlur = 10; g.fillText(txt, w / 2, h / 2 + 8); });
}
const ADD = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };

// ---------------------------------------------------------------- starfield
const stars = (() => {
  const n = 2600, pos = new Float32Array(n * 3), sz = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { const u = R() * 2 - 1, a = R() * TAU, r = 70 + R() * 60, s = Math.sqrt(1 - u * u); pos.set([Math.cos(a) * s * r + 3.5, u * r * .7, Math.sin(a) * s * r], i * 3); sz[i] = .5 + R() ** 3 * 2.6; ph[i] = R() * TAU; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('sz', new THREE.BufferAttribute(sz, 1)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({ ...ADD, uniforms: { uT: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute float sz; attribute float ph; uniform float uT; uniform float uPR; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=sz*uPR; vA=.35+.65*(.5+.5*sin(uT*.7+ph)); }`,
    fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); gl_FragColor=vec4(vec3(.75,.88,1.)*a*vA*.8,1.); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return m;
})();

// ---------------------------------------------------------------- generic flow-line material (dashes that travel along the line)
function flowMat(col, opts = {}) {
  return new THREE.ShaderMaterial({ ...ADD, uniforms: { uT: { value: 0 }, uC: { value: col.clone() }, uK: { value: 1 }, uSp: { value: opts.sp || 1 }, uRep: { value: opts.rep || 4 } },
    vertexShader: `attribute float t; varying float vT; void main(){ vT=t; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT,uK,uSp,uRep; uniform vec3 uC; varying float vT; void main(){ float f=fract(vT*uRep-uT*uSp); float a=.18+.82*smoothstep(.0,.15,f)*smoothstep(.55,.15,f); gl_FragColor=vec4(uC*a*uK,1.); }` });
}
function polyGeo(lines) { // lines: array of arrays of V3 -> LineSegments with attribute t (0..1 along each)
  const pos = [], t = [];
  for (const pts of lines) for (let i = 0; i < pts.length - 1; i++) { pos.push(pts[i].x, pts[i].y, pts[i].z, pts[i + 1].x, pts[i + 1].y, pts[i + 1].z); t.push(i / (pts.length - 1), (i + 1) / (pts.length - 1)); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('t', new THREE.Float32BufferAttribute(t, 1)); return g;
}

// ---------------------------------------------------------------- SOURCE STRUCTURE: cube S³ around the core Ψ, planes F², plate A
const source = new THREE.Group(); scene.add(source);
const cubeG = new THREE.Group(); source.add(cubeG);
// Ψ core: icosahedron shell + sphere matrix + lightning, perfectly centered in (0,0,0)
const core = new THREE.Group(); scene.add(core);
const coreShellGeo = new THREE.IcosahedronGeometry(.62, 0);
const coreGlass = new THREE.Mesh(coreShellGeo, new THREE.MeshStandardMaterial({ color: 0x9fe8ff, metalness: .2, roughness: .05, transparent: true, opacity: .16, depthWrite: false, envMapIntensity: 1.6 }));
const coreEdgeMat = new THREE.LineBasicMaterial({ color: C.cy.clone(), ...ADD });
const coreEdges = new THREE.LineSegments(new THREE.EdgesGeometry(coreShellGeo), coreEdgeMat);
const matrixGeo = new THREE.IcosahedronGeometry(.44, 2);
const coreMatrixMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#3aa9c8'), ...ADD, opacity: .55 });
const coreMatrix = new THREE.LineSegments(new THREE.WireframeGeometry(matrixGeo), coreMatrixMat);
const coreNodeMat = new THREE.PointsMaterial({ color: C.ice.clone(), size: .05, map: dotTex, ...ADD });
const coreNodes = new THREE.Points(matrixGeo, coreNodeMat);
const coreHeart = new THREE.Mesh(new THREE.SphereGeometry(.085, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 3.2, 3.4) }));
const coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: C.cy.clone(), ...ADD, opacity: .5 })); coreHalo.scale.setScalar(2);
const coreLight = new THREE.PointLight(0x7fefff, 3, 7, 1.8);
core.add(coreGlass, coreEdges, coreMatrix, coreNodes, coreHeart, coreHalo, coreLight);
// lightning inside the core
const BOLTS = 10, BSEG = 7, boltPos = new Float32Array(BOLTS * BSEG * 6), boltT = new Float32Array(BOLTS);
const boltGeo = new THREE.BufferGeometry(); boltGeo.setAttribute('position', new THREE.BufferAttribute(boltPos, 3));
const boltMat = new THREE.LineBasicMaterial({ color: new THREE.Color(1.6, 2.4, 2.6), ...ADD });
const bolts = new THREE.LineSegments(boltGeo, boltMat); bolts.frustumCulled = false; core.add(bolts);
const icoV = (() => { const p = coreShellGeo.attributes.position, out = []; for (let i = 0; i < p.count; i++) { const v = new V3().fromBufferAttribute(p, i); if (!out.some(o => o.distanceTo(v) < 1e-3)) out.push(v); } return out; })();
function regenBolt(b) {
  const end = icoV[(Math.random() * icoV.length) | 0].clone().multiplyScalar(.97), a = new V3(), c = new V3();
  for (let s = 0; s < BSEG; s++) {
    const t0 = s / BSEG, t1 = (s + 1) / BSEG; const j = .09 * (1 - Math.abs(t1 * 2 - 1) * .3);
    if (s === 0) a.set(0, 0, 0); else a.copy(c);
    c.copy(end).multiplyScalar(t1); if (s < BSEG - 1) c.add(new V3((Math.random() - .5) * j * 2, (Math.random() - .5) * j * 2, (Math.random() - .5) * j * 2));
    boltPos.set([a.x, a.y, a.z, c.x, c.y, c.z], (b * BSEG + s) * 6); void t0;
  }
  boltT[b] = .05 + Math.random() * .25;
}
for (let b = 0; b < BOLTS; b++) regenBolt(b);

// S³: wireframe cube edge 2.0 (scaled by S), node points at the corners, faint 3×3×3 sub-grid, glass
const cubeEdgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#bfefff'), ...ADD, opacity: .95 });
cubeG.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2, 2, 2)), cubeEdgeMat));
const subPts = [];
for (const a of [-1 / 3, 1 / 3]) for (const b of [-1, -1 / 3, 1 / 3, 1]) { subPts.push([a, b, -1], [a, b, 1], [a, -1, b], [a, 1, b], [b, a, -1], [b, a, 1], [-1, a, b], [1, a, b], [-1, b, a], [1, b, a], [b, -1, a], [b, 1, a]); }
{ const pos = []; for (const a of [-1 / 3, 1 / 3]) for (const b of [-1, 1]) { pos.push(a, b, -1, a, b, 1, a, -1, b, a, 1, b, -1, a, b, 1, a, b, b, a, -1, b, a, 1, -1, b, a, 1, b, a, a, -1, b, a, 1, b); }
  // face grid lines (thirds) on all 6 faces
  const fl = []; for (const a of [-1 / 3, 1 / 3]) for (const f of [-1, 1]) { fl.push(a, -1, f, a, 1, f, -1, a, f, 1, a, f, f, -1, a, f, 1, a, f, a, -1, f, a, 1, -1, f, a, 1, f, a, a, f, -1, a, f, 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3)); void pos;
  cubeG.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color('#5fb9d6'), ...ADD, opacity: .28 }))); }
const cubeGlassMat = new THREE.MeshStandardMaterial({ color: 0xbfeaff, metalness: .1, roughness: .02, transparent: true, opacity: .07, depthWrite: false, envMapIntensity: 2.2 });
cubeG.add(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), cubeGlassMat));
const cornerMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1.4, 1.5) });
const corners = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(.045, 12, 8), cornerMat); m.position.set(x, y, z); cubeG.add(m); corners.push(m); }
const lattMat = new THREE.PointsMaterial({ color: C.ice.clone(), size: .035, map: dotTex, ...ADD, opacity: .5 });
{ const p = []; for (const x of [-1, -1 / 3, 1 / 3, 1]) for (const y of [-1, -1 / 3, 1 / 3, 1]) for (const z of [-1, -1 / 3, 1 / 3, 1]) if (Math.abs(x) + Math.abs(y) + Math.abs(z) < 2.9) p.push(x, y, z); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); cubeG.add(new THREE.Points(g, lattMat)); }

// F²: two orthogonal vibrating sine-grid planes crossing in the cube center
const planeMat = new THREE.ShaderMaterial({ ...ADD, uniforms: { uT: { value: 0 }, uF: { value: 1.5 }, uAmp: { value: .13 }, uK: { value: 1 }, uPh: { value: 0 } },
  vertexShader: `uniform float uT,uF,uAmp,uPh; varying float vC; varying float vE;
    void main(){ vec3 p=position; float k=3.14159*uF*1.25; float w=2.2+uF*1.6;
      float e=smoothstep(1.0,.82,abs(p.x))*smoothstep(1.0,.82,abs(p.y));
      float d=sin(k*p.x-uT*w+uPh)*(.65+.35*cos(k*.6*p.y+uT*.9+uPh*2.));
      p.z+=uAmp*d*e; vC=d*e; vE=e; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
  fragmentShader: `uniform float uK; varying float vC; varying float vE; void main(){ vec3 base=vec3(.55,.62,.68); vec3 hot=vec3(.55,1.1,1.25); float c=abs(vC); vec3 col=mix(base,hot,smoothstep(.45,1.,c)); gl_FragColor=vec4(col*(.32+.68*c)*uK*(.55+.45*vE),1.); }` });
function gridPlaneGeo(n = 15, res = 72) {
  const pos = []; for (let a = 0; a < n; a++) { const v = -1 + 2 * a / (n - 1); for (let s = 0; s < res; s++) { const u0 = -1 + 2 * s / res, u1 = -1 + 2 * (s + 1) / res; pos.push(u0, v, 0, u1, v, 0, v, u0, 0, v, u1, 0); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); return g;
}
const pgeo = gridPlaneGeo();
const planeA = new THREE.LineSegments(pgeo, planeMat); // xy plane (normal z)
const planeMat2 = planeMat.clone(); planeMat2.uniforms.uPh.value = 1.7;
const planeB = new THREE.LineSegments(pgeo, planeMat2); planeB.rotation.y = Math.PI / 2; // zy plane (normal x)
cubeG.add(planeA, planeB);

// A: flat circular base plate directly under the cube, the denominator that catches the field
const plateG = new THREE.Group(); source.add(plateG);
const plateMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: 0xb9bbbd, metalness: .35, roughness: .62, envMapIntensity: .9 });
const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 96, 1), plateMat); plateG.add(plate);
const plateRimMat = new THREE.MeshBasicMaterial({ color: C.cy.clone(), ...ADD, opacity: .8 });
const plateRim = new THREE.Mesh(new THREE.TorusGeometry(1, .012, 8, 128), plateRimMat); plateRim.rotation.x = Math.PI / 2; plateG.add(plateRim);
const plateRings = new THREE.Mesh(new THREE.RingGeometry(.2, 1, 96, 6), new THREE.MeshBasicMaterial({ color: C.cy.clone(), ...ADD, opacity: .035, wireframe: true })); plateRings.rotation.x = -Math.PI / 2; plateG.add(plateRings);
// field lines from the cube's lower half down into the plate
const fieldMat = flowMat(C.cy, { sp: .8, rep: 2 });
let fieldLines = null;
function buildField() {
  if (fieldLines) { source.remove(fieldLines); fieldLines.geometry.dispose(); }
  const S = P.S, y0 = -S, r = plateR(), yb = plateY() + .075, lines = [];
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + .1; const p0 = new V3(Math.cos(a) * S * .86, y0 + .15 * S, Math.sin(a) * S * .86), p2 = new V3(Math.cos(a) * r * .92, yb, Math.sin(a) * r * .92);
    const pts = []; for (let s = 0; s <= 12; s++) { const t = s / 12; const p = p0.clone().lerp(p2, t); p.y = lerp(p0.y, yb, Math.sin(t * Math.PI / 2)); pts.push(p); } lines.push(pts); }
  fieldLines = new THREE.LineSegments(polyGeo(lines), fieldMat); source.add(fieldLines);
}
const plateR = () => 1.55 * Math.sqrt(P.A);
const plateY = () => -P.S - .24;

// ---------------------------------------------------------------- the vector →
const arrowG = new THREE.Group(); scene.add(arrowG);
const metal = new THREE.MeshStandardMaterial({ color: 0xc9d2d8, metalness: 1, roughness: .26, envMapIntensity: 1.3 });
const shaft = new THREE.Mesh(new THREE.BoxGeometry(1, .15, .26), metal); arrowG.add(shaft);
const headShape = new THREE.Shape(); headShape.moveTo(0, -.36); headShape.lineTo(.52, 0); headShape.lineTo(0, .36); headShape.lineTo(0, -.36);
const headGeo = new THREE.ConeGeometry(.42, .62, 4, 1); headGeo.rotateY(Math.PI / 4); headGeo.rotateZ(-Math.PI / 2); headGeo.scale(1, .8, 1.15); headGeo.translate(.31, 0, 0);
const headMat = metal.clone(); headMat.emissive = new THREE.Color(0x2fd8ff); headMat.emissiveIntensity = .35; headMat.flatShading = true;
const head = new THREE.Mesh(headGeo, headMat); head.add(new THREE.LineSegments(new THREE.EdgesGeometry(headGeo), new THREE.LineBasicMaterial({ color: new THREE.Color(.5, 1.3, 1.5), transparent: true, opacity: .7 }))); arrowG.add(head);
const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.9, 2.2, 2.5), ...ADD, opacity: .9 });
const beam = new THREE.Mesh(new THREE.BoxGeometry(1, .014, .07), beamMat); beam.position.y = .082; arrowG.add(beam);
let arrowGrow = Q.has('shot') ? 1 : 0;
function layoutArrow(t) {
  const x0 = L.arrowX0 * Math.max(1, P.S * .9) + (P.S - 1) * .1, x1 = L.arrowX1, len = Math.max(.01, (x1 - .6 - x0) * arrowGrow);
  arrowG.position.set(x0, L.arrowY, 0); shaft.scale.x = len; shaft.position.x = len / 2; beam.scale.x = len * (.96 + .04 * Math.sin(t * 6)); beam.position.x = len / 2; head.position.x = len - .02; head.visible = arrowGrow > .05;
}
// pulses: core → cube face → arrow → one of the nine rings
const pulseCurves = [];
function ringWorld(r) { return new V3(L.sumC.x + L.ringX[r.i], L.sumC.y + 1.25 + L.ringY[r.j] - 1.0, 0); }
function buildCurves() {
  pulseCurves.length = 0;
  for (const r of RING) { const e = ringWorld(r); pulseCurves.push(new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(.8 * P.S, L.arrowY * .6, 0), new V3(L.arrowX0 + .2, L.arrowY + .06, 0), new V3(L.arrowX1 - .2, L.arrowY + .06, 0), new V3(L.arrowX1 + .55, L.arrowY + .1 + (e.y - L.arrowY) * .25, 0), e], false, 'centripetal', .5)); }
}
const PMAX = 64, pulses = [];
const pulseGeo = new THREE.BufferGeometry(); const pulsePos = new Float32Array(PMAX * 3), pulseA = new Float32Array(PMAX);
pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3)); pulseGeo.setAttribute('a', new THREE.BufferAttribute(pulseA, 1));
const pulseMat = new THREE.ShaderMaterial({ ...ADD, uniforms: { uPR: { value: 1 }, uH: { value: 800 } },
  vertexShader: `attribute float a; uniform float uPR,uH; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uH*uPR*.16*a/-mv.z; vA=a; }`,
  fragmentShader: `varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,0.,d); a=a*a; gl_FragColor=vec4(vec3(.9,1.8,2.)*a*min(vA,1.2),1.); }` });
const pulsePts = new THREE.Points(pulseGeo, pulseMat); pulsePts.frustumCulled = false; scene.add(pulsePts);
let pulseAcc = 0;
function spawnPulse(force) {
  if (pulses.length >= PMAX) return; const r = RING[(Math.random() * 9) | 0];
  pulses.push({ r, c: pulseCurves[r.k], u: 0, sp: .42 + Math.random() * .08, en: force ? 1.6 : .7 + .5 * M.energy });
}

// ---------------------------------------------------------------- SUM STRUCTURE Σ(T · R)
const sumG = new THREE.Group(); sumG.position.copy(L.sumC); scene.add(sumG);
// Σ lattice: a half-cylinder vault of crossing metal ribs over the ring matrix
const archMetal = new THREE.MeshStandardMaterial({ color: 0xc3cbd1, metalness: 1, roughness: .3, envMapIntensity: 1.25, emissive: new THREE.Color('#5ff6ff'), emissiveIntensity: 0 });
{
  const Ra = L.archR, D = L.archD, geos = [];
  const tube = pts => geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, .028, 6, false));
  const P2 = (th, z, r = Ra) => new V3(Math.cos(th) * r, Math.sin(th) * r, z);
  const K = 11, d = .95;
  for (let k = 0; k < K; k++) for (const sgn of [1, -1]) { // crossing helix ribs
    const th0 = .08 + (Math.PI - .16 - d) * k / (K - 1); const pts = []; for (let s = 0; s <= 24; s++) { const t = s / 24; const th = sgn > 0 ? th0 + d * t : th0 + d * (1 - t); pts.push(P2(th, -D + 2 * D * t)); } tube(pts);
  }
  for (const z of [-D, 0, D]) { const pts = []; for (let s = 0; s <= 48; s++) pts.push(P2(.04 + (Math.PI - .08) * s / 48, z, z === 0 ? Ra + .06 : Ra)); tube(pts); }
  for (let k = 0; k <= 6; k++) { const th = .05 + (Math.PI - .1) * k / 6; tube([P2(th, -D), P2(th, 0, Ra + .02), P2(th, D)]); }
  for (const g of geos) sumG.add(new THREE.Mesh(g, archMetal));
  // feet
  for (const x of [-Ra, Ra]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.12, .16, .14, 24), archMetal); f.position.set(x, -.02, 0); sumG.add(f); }
}
// nine gyroscope rings with a gold tangent each
const ringMetal = new THREE.MeshStandardMaterial({ color: 0xd8dee2, metalness: 1, roughness: .22, envMapIntensity: 1.4, emissive: new THREE.Color('#5ff6ff'), emissiveIntensity: 0 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc76a, metalness: 1, roughness: .28, envMapIntensity: 1.3, emissive: new THREE.Color('#ffb347'), emissiveIntensity: .25 });
const torusG = new THREE.TorusGeometry(1, .055, 10, 64);
const rodGeo = new THREE.CylinderGeometry(.022, .022, 1, 8); rodGeo.rotateZ(Math.PI / 2);
const capGeo = new THREE.SphereGeometry(.035, 10, 8);
for (const r of RING) {
  const g = new THREE.Group(); g.position.copy(ringWorld(r)).sub(L.sumC); sumG.add(g);
  const outer = new THREE.Group(), mid = new THREE.Group(), inner = new THREE.Group(); g.add(outer); outer.add(mid); mid.add(inner);
  const t1 = new THREE.Mesh(torusG, ringMetal), t2 = new THREE.Mesh(torusG, ringMetal), t3 = new THREE.Mesh(torusG, ringMetal);
  outer.add(t1); t2.scale.setScalar(.78); t2.rotation.y = Math.PI / 2; mid.add(t2); t3.scale.setScalar(.56); t3.rotation.x = Math.PI / 2; inner.add(t3);
  const hubM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 2.1, 2.3) });
  const hub = new THREE.Mesh(new THREE.SphereGeometry(.06, 14, 10), hubM); g.add(hub);
  const rodG = new THREE.Group(); outer.add(rodG); // tangent touches the outer ring at its top point, turns with it
  const rod = new THREE.Mesh(rodGeo, goldMat); rodG.add(rod); const c1 = new THREE.Mesh(capGeo, goldMat), c2 = new THREE.Mesh(capGeo, goldMat); rodG.add(c1, c2);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: dotTex, color: C.cy.clone(), ...ADD, opacity: 0 })); halo.scale.setScalar(1.4); g.add(halo);
  Object.assign(r, { g, outer, mid, inner, t1, rodG, rod, c1, c2, hubM, halo, rad: .3 });
}
function layoutRings() {
  for (const r of RING) {
    const rad = .33 * r.Ri; r.rad = rad; r.t1.scale.setScalar(rad); r.mid.scale.setScalar(rad);
    const len = .25 + .62 * r.Ti; r.rod.scale.x = len; r.rodG.position.set(0, rad * 1.055, 0); r.c1.position.x = -len / 2; r.c2.position.x = len / 2; r.rodG.visible = r.Ti > .005;
  }
}
// sum threads: gold lines across the 3 × 3 matrix and up to the vault
const threadMat = flowMat(C.gold, { sp: .5, rep: 3 }); threadMat.uniforms.uK.value = .5;
let threads = null;
function buildThreads() {
  if (threads) { sumG.remove(threads); threads.geometry.dispose(); }
  const lines = [], rp = RING.map(r => ringWorld(r).sub(L.sumC));
  const seg = (a, b, sag = 0) => { const pts = []; for (let s = 0; s <= 10; s++) { const t = s / 10; const p = a.clone().lerp(b, t); p.y -= Math.sin(t * Math.PI) * sag; p.z += Math.sin(t * Math.PI) * sag * .4; pts.push(p); } lines.push(pts); };
  for (const r of RING) { const a = rp[r.k]; if (r.i < 2) seg(a, rp[r.k + 1], .06); if (r.j < 2) seg(a, rp[r.k + 3], .04); if (r.i < 2 && r.j < 2) seg(a, rp[r.k + 4], .08); if (r.i > 0 && r.j < 2) seg(a, rp[r.k + 2], .08); }
  for (const r of RING) { const a = rp[r.k]; const th = Math.atan2(a.y, a.x); const b = new V3(Math.cos(th) * L.archR, Math.sin(th) * L.archR, (r.k % 2 ? .5 : -.5) * L.archD); seg(a, b, -.05); }
  threads = new THREE.LineSegments(polyGeo(lines), threadMat); sumG.add(threads);
}
buildThreads();

// ---------------------------------------------------------------- NOISE FIELD + ε
const EMAX = 9000;
const noise = (() => {
  const pos = new Float32Array(EMAX * 3), ph = new Float32Array(EMAX * 4);
  for (let i = 0; i < EMAX; i++) {
    let x, y, z; const k = R();
    if (k < .55) { x = L.sumC.x + gauss() * 2.4; y = .15 + gauss() * 1.3; z = gauss() * 1.4; } // loose cloud around the sum field
    else if (k < .9) { const a = R() * TAU * 3, rr2 = .15 + Math.pow(R(), .7) * 1.6; const arm = a + rr2 * 2.2; x = L.epsC.x + Math.cos(arm) * rr2 * 1.1; y = L.epsC.y + Math.sin(arm) * rr2 * .32 + gauss() * .05; z = Math.sin(arm) * rr2 * .9; } // swirl disc at ε
    else { x = L.epsC.x - .8 + gauss() * 1.2; y = L.epsC.y + gauss() * .9; z = gauss() * .9; }
    pos.set([x, y, z], i * 3); ph.set([R() * TAU, R() * TAU, R() * TAU, R()], i * 4);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('ph', new THREE.BufferAttribute(ph, 4));
  const m = new THREE.ShaderMaterial({ ...ADD, uniforms: { uT: { value: 0 }, uE: { value: .3 }, uPR: { value: 1 }, uH: { value: 800 }, uK: { value: 1 }, uC: { value: new THREE.Vector3(...L.epsC.toArray()) } },
    vertexShader: `attribute vec4 ph; uniform float uT,uE,uPR,uH; uniform vec3 uC; varying float vA; varying float vW;
      void main(){ vec3 p=position; vec3 d=p-uC; float r=length(d.xz); float sw=step(r,2.2)*step(abs(d.y),.9);
        float ang=uT*(.35+.25*sw)/(.4+r*.6)*sw; float cs=cos(ang),sn=sin(ang); d.xz=mat2(cs,-sn,sn,cs)*d.xz; p=uC+d;
        float j=.05+uE*.42; p+=j*vec3(sin(uT*(1.3+ph.w)+ph.x),sin(uT*(1.1+ph.w*.7)+ph.y),sin(uT*(.9+ph.w*1.3)+ph.z));
        vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; float s=.5+ph.w*1.1; gl_PointSize=max(1.,uH*uPR*.014*s/-mv.z);
        vA=.4+.6*(.5+.5*sin(uT*3.*(.5+ph.w)+ph.x*3.)); vW=step(.94,ph.w); }`,
    fragmentShader: `uniform float uK; varying float vA; varying float vW; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d); vec3 c=mix(vec3(.75,.95,1.),vec3(1.4,.75,.35),vW); gl_FragColor=vec4(c*a*vA*.75*uK,1.); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { g, m };
})();
function noiseCount() { return Math.round(EMAX * TIERS[tier].eps * (.06 + .94 * Math.pow(P.eps, .8))); }

// ---------------------------------------------------------------- labels Ψ = , Σ , ε , A (KaTeX fonts)
const labels = {};
async function makeLabels() {
  try { await Promise.race([Promise.all([document.fonts.load('200px KMain'), document.fonts.load('italic 200px KMath'), document.fonts.load('200px KMath')]), new Promise(r => setTimeout(r, 3000))]); } catch (_) { }
  const mk = (txt, font, col, glow, w, h, sc, pos, parent = scene) => { const m = new THREE.SpriteMaterial({ map: labelTex(txt, font, col, glow, w, h), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }); const s = new THREE.Sprite(m); s.scale.set(sc * w / h, sc, 1); s.position.copy(pos); parent.add(s); return s; };
  labels.psi = mk('Ψ =', '200px KMain', '#bdfbff', '#5ff6ff', 640, 300, 1.05, L.psiLabel);
  labels.sigma = mk('Σ', '220px KMain', '#d8fdff', '#5ff6ff', 300, 300, .82, new V3(0, L.archR + .55, 0), sumG);
  labels.eps = mk('ε', '220px KMath', '#d8fdff', '#5ff6ff', 300, 300, .8, L.epsC.clone().add(new V3(.05, .05, .2)));
  // engraved A on the plate rim (decal facing the viewer)
  const aTex = ctex(256, 256, (g) => { g.font = '190px KMath'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(30,32,34,.85)'; g.fillText('A', 128, 140); g.fillStyle = 'rgba(220,235,240,.35)'; g.fillText('A', 126, 137); });
  const aM = new THREE.Mesh(new THREE.PlaneGeometry(.5, .5), new THREE.MeshBasicMaterial({ map: aTex, transparent: true, depthWrite: false })); aM.rotation.x = -Math.PI / 2; plateG.add(aM); labels.A = aM;
  const aGlow = mk('A', '190px KMath', '#9fe9ff', '#5ff6ff', 256, 256, .42, new V3(0, 0, 0), plateG); aGlow.material.opacity = 0; labels.Aglow = aGlow;
  layoutAll();
}

// ---------------------------------------------------------------- layout from parameters
let lastSA = '';
function layoutAll() {
  compute();
  cubeG.scale.setScalar(P.S);
  const r = plateR(), y = plateY(); plate.scale.set(r, .15, r); plateG.position.y = y; plate.position.y = 0; plateRim.scale.setScalar(r * 1.002); plateRim.position.y = .076; plateRings.scale.setScalar(r * .98); plateRings.position.y = .077;
  if (labels.A) { labels.A.position.set(0, .078, r * .7); labels.A.scale.setScalar(.8 + .25 * Math.sqrt(P.A)); labels.Aglow.position.set(0, .3, r * .7); }
  const key = P.S.toFixed(3) + '|' + P.A.toFixed(3); if (key !== lastSA) { lastSA = key; buildField(); buildCurves(); }
  layoutRings(); layoutArrow(T);
  noise.g.setDrawRange(0, noiseCount()); noise.m.uniforms.uE.value = P.eps;
  planeMat.uniforms.uF.value = planeMat2.uniforms.uF.value = P.F;
  planeMat.uniforms.uAmp.value = planeMat2.uniforms.uAmp.value = .07 + .05 * Math.min(P.F, 2.5);
  hudSliders();
}

// ---------------------------------------------------------------- picking
const pickList = [];
const pickMat = new THREE.MeshBasicMaterial({ visible: false });
function addPick(term, geo, parent, pos, kind) { const m = new THREE.Mesh(geo, pickMat); if (pos) m.position.copy(pos); m.userData = { term, kind }; parent.add(m); pickList.push(m); return m; }
addPick('psi', new THREE.SphereGeometry(.68, 16, 12), core);
addPick('psi', new THREE.PlaneGeometry(1.6, .9), scene, L.psiLabel);
addPick('S', new THREE.BoxGeometry(2.04, 2.04, 2.04), cubeG, null, 'cube');
addPick('F', new THREE.BoxGeometry(2, 2, .3), cubeG); addPick('F', new THREE.BoxGeometry(.3, 2, 2), cubeG);
addPick('A', new THREE.CylinderGeometry(1, 1, 1.4, 32), plate);
{ const m = addPick('arrow', new THREE.BoxGeometry(1, .5, .6), scene); m.position.set((L.arrowX0 + L.arrowX1) / 2, L.arrowY, 0); m.scale.x = L.arrowX1 - L.arrowX0; }
for (const r of RING) addPick('TR', new THREE.SphereGeometry(.42, 12, 10), r.g);
addPick('sigma', new THREE.CylinderGeometry(L.archR + .15, L.archR + .15, L.archD * 2 + .3, 32, 1, false, -Math.PI / 2, Math.PI), sumG, null, 'arch'); { const a = pickList[pickList.length - 1]; a.rotation.x = -Math.PI / 2; a.material = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }); }
addPick('sigma', new THREE.SphereGeometry(.5, 12, 8), sumG, new V3(0, L.archR + .55, 0));
addPick('eps', new THREE.SphereGeometry(1.25, 16, 12), scene, L.epsC);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickAt(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickList, false); if (!hits.length) return null;
  const solid = hits.filter(h => !h.object.userData.kind);
  const cube = hits.find(h => h.object.userData.kind === 'cube');
  if (window.__dbgPick) console.log('PICKDBG', JSON.stringify(hits.map(h => [h.object.userData.term, h.object.userData.kind || '', +h.distance.toFixed(2)])));
  if (cube) { const p = cubeG.worldToLocal(cube.point.clone()); const n = [p.x, p.y, p.z].filter(c => Math.abs(c) > .8).length; if (n >= 2 && (!solid.length || cube.distance <= solid[0].distance + .01)) return 'S'; }
  if (solid.some(h => h.object.userData.term === 'psi') && !solid.some(h => h.object.userData.term === 'TR')) return 'psi';
  if (solid.length) return solid[0].object.userData.term;
  return hits[0].object.userData.term;
}

// ---------------------------------------------------------------- camera: orbit with tween, tour
const cam = { th: 0, ph: .12, d: 14, t: new V3(3.6, .1, 0) }, goal = { th: 0, ph: .12, d: 14, t: new V3(3.6, .1, 0) };
const FOCUS = {
  psi: { t: [0, -.1, 0], d: 5.0, th: .38, ph: .14 }, S: { t: [0, 0, 0], d: 5.4, th: -.55, ph: .38 }, F: { t: [0, 0, 0], d: 4.4, th: .8, ph: .22 },
  A: { t: [0, -1.1, 0], d: 5.6, th: .18, ph: .55 }, arrow: { t: [2.1, -.3, 0], d: 4.6, th: .28, ph: .25 }, sigma: { t: [6.05, .1, 0], d: 7.8, th: -.18, ph: .22 },
  TR: { t: [6.05, -.1, 0], d: 4.9, th: .3, ph: .06 }, eps: { t: [8.9, .1, 0], d: 5.8, th: .45, ph: .14 }
};
const KEYPTS = [[-3.4, .55, 0], [-3.4, -.5, 0], [-1.6, -1.55, 1.6], [1.6, -1.55, -1.6], [1.2, 1.2, 1.2], [-1.2, 1.2, -1.2], [3.2, 1.5, 0], [6.05, 2.05, 0], [3.1, -1.4, .9], [8.95, -1.4, -.9], [11.2, .6, 0], [11.2, -.3, 1], [8.9, -1.4, .9]].map(a => new V3(...a));
const tmpCam = new THREE.PerspectiveCamera();
function overview() {
  const asp = innerWidth / innerHeight, portrait = asp < .9;
  const th = portrait ? 1.08 : .0, ph = portrait ? .3 : .13; let t = portrait ? new V3(4.4, -.1, 0) : new V3(3.9, .05, 0);
  const ylo = portrait ? -.6 : -.62, yhi = portrait ? .56 : .62, xm = portrait ? .97 : .92;
  const dr = $('drawer'), dOpen = !portrait && !dr.classList.contains('hide') && innerHeight >= 500; const xl = dOpen ? -1 + 2 * (dr.getBoundingClientRect().right + 10) / innerWidth : -xm;
  tmpCam.copy(camera); tmpCam.aspect = asp; tmpCam.updateProjectionMatrix();
  const fits = (d, tt) => { placeCam(tmpCam, th, ph, d, tt); tmpCam.updateMatrixWorld(); for (const p of KEYPTS) { const v = p.clone().project(tmpCam); if (v.z > 1 || v.x > xm || v.x < xl || v.y < ylo || v.y > yhi) return false; } return true; };
  let d = 20;
  for (let pass = 0; pass < 4; pass++) {
    let lo = 3, hi = 80; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (fits(m, t)) hi = m; else lo = m; } d = hi;
    placeCam(tmpCam, th, ph, d, t); tmpCam.updateMatrixWorld(); let mn = 9, mx = -9, yn = 9, yx = -9; for (const p of KEYPTS) { const v = p.clone().project(tmpCam); mn = Math.min(mn, v.x); mx = Math.max(mx, v.x); yn = Math.min(yn, v.y); yx = Math.max(yx, v.y); }
    const hw = Math.tan(tmpCam.fov * Math.PI / 360) * d, sx = ((mn + mx) / 2 - (xl + xm) / 2) * hw * asp, sy = ((yn + yx) / 2 - (ylo + yhi) / 2) * hw;
    const right = new V3().setFromMatrixColumn(tmpCam.matrixWorld, 0), up = new V3().setFromMatrixColumn(tmpCam.matrixWorld, 1);
    t = t.clone().addScaledVector(right, sx).addScaledVector(up, sy);
  }
  return { th, ph, d: d * 1.02, t };
}
function placeCam(c, th, ph, d, t) { c.position.set(t.x + Math.sin(th) * Math.cos(ph) * d, t.y + Math.sin(ph) * d, t.z + Math.cos(th) * Math.cos(ph) * d); c.lookAt(t); }
function goTo(v, instant) { goal.th = v.th; goal.ph = v.ph; goal.d = v.d; goal.t.copy(v.t); if (instant) { cam.th = v.th; cam.ph = v.ph; cam.d = v.d; cam.t.copy(v.t); } }
function focusTerm(k) {
  const f = FOCUS[k]; const asp = innerWidth / innerHeight, d = f.d * (asp < 1 ? 1 / Math.sqrt(Math.max(.4, asp)) : 1), t = new V3(...f.t);
  const dr = $('drawer'); if (asp < .9 && !dr.classList.contains('hide')) t.y -= d * .3; // portrait: keep the object above the open slider panel
  else if (asp >= .9 && !dr.classList.contains('hide') && innerHeight >= 500) { t.x -= d * .18 * Math.cos(f.th); t.z += d * .18 * Math.sin(f.th); }
  goTo({ th: f.th, ph: f.ph, d, t });
}
let mode = 'orbit', idle = 0, tourI = -1, tourT = 0;
const TOUR = ['psi', 'S', 'F', 'A', 'arrow', 'TR', 'sigma', 'eps', null];
function updateCamera(dt) {
  idle += dt;
  if (mode === 'tour') { tourT -= dt; if (tourT <= 0) { tourI = (tourI + 1) % TOUR.length; const k = TOUR[tourI]; if (k) { select(k, false); focusTerm(k); } else { select(null); goTo(overview()); } tourT = k ? 5.5 : 7; } goal.th += dt * .025; }
  const k = 1 - Math.exp(-dt * 2.4);
  cam.th = lerp(cam.th, goal.th, k); cam.ph = lerp(cam.ph, goal.ph, k); cam.d = lerp(cam.d, goal.d, k); cam.t.lerp(goal.t, k);
  let th = cam.th; if (mode === 'orbit' && idle > 6 && !SEL) th += Math.sin((idle - 6) * .18) * .14 * Math.min(1, (idle - 6) / 4);
  placeCam(camera, th, cam.ph, cam.d, cam.t);
}
// pointer input
const ptrs = new Map(); let pinch0 = 0, d0 = 0, down = null;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); idle = 0; if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); d0 = goal.d; if (down) down.moved = 99; } });
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (!IS_TOUCH) hover(e.clientX, e.clientY); return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; idle = 0;
  if (ptrs.size === 1) { if (down) down.moved += Math.abs(dx) + Math.abs(dy); if (!down || down.moved > 6) { if (mode === 'tour') setMode('orbit'); goal.th -= dx * .006; goal.ph = clamp(goal.ph + dy * .005, -.35, 1.25); cam.th = lerp(cam.th, goal.th, .5); } }
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) goal.d = clamp(d0 * pinch0 / dd, 2.2, 70); }
});
const endPtr = e => { ptrs.delete(e.pointerId); if (down && ptrs.size === 0) { if (down.moved < 8 && performance.now() - down.t < 450) tap(e.clientX, e.clientY); down = null; } if (ptrs.size < 2) pinch0 = 0; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); idle = 0; goal.d = clamp(goal.d * Math.exp(e.deltaY * .0012), 2.2, 70); }, { passive: false });
function tap(x, y) { const k = pickAt(x, y); if (mode === 'tour') setMode('orbit'); if (k) { select(k, true); SND.term(k); if (k === 'arrow') { for (let i = 0; i < 4; i++) setTimeout(() => spawnPulse(true), i * 120); } } else select(null); }
function hover(x, y) { const k = pickAt(x, y); const tip = $('tip'); canvas.style.cursor = k ? 'pointer' : 'grab'; if (k) { tip.innerHTML = TERMS[k].n; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.remove('hide'); } else tip.classList.add('hide'); hoverK = k; }
let hoverK = null;

// ---------------------------------------------------------------- selection + HUD
function select(k, focus) {
  SEL = k; document.querySelectorAll('#formula .t').forEach(s => s.classList.toggle('on', s.dataset.term === k));
  document.querySelectorAll('#drawer label').forEach(l => l.classList.toggle('on', !!k && (l.dataset.k === k || (k === 'TR' && (l.dataset.k === 'T' || l.dataset.k === 'R')))));
  if (!k) { $('info').classList.add('hide'); return; }
  const t = TERMS[k]; $('iK').innerHTML = t.k; $('iT').innerHTML = t.n; $('iF').innerHTML = t.f; $('iM').innerHTML = t.m; $('info').classList.toggle('gold', !!t.gold); $('info').classList.remove('hide');
  if (focus) focusTerm(k);
}
$('infoX').onclick = () => select(null);
document.querySelectorAll('#formula .t').forEach(s => s.addEventListener('click', e => { e.stopPropagation(); const k = s.dataset.term; if (mode === 'tour') setMode('orbit'); if (SEL === k) { select(null); goTo(overview()); } else { select(k, true); SND.term(k); } }));
const f3 = v => v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3);
function hudSliders() { for (const k in P) { const s = $('s_' + k); if (s && document.activeElement !== s) s.value = P[k]; $('v_' + k).textContent = P[k].toFixed(2); } $('s_vol').value = ST.vol; $('v_vol').textContent = Math.round(ST.vol * 100) + '%'; }
function hudLive() {
  $('vS3').textContent = f3(M.S3); $('vF2').textContent = f3(M.F2); $('vA').textContent = f3(P.A); $('vN').textContent = f3(M.N); $('vP').textContent = M.rate.toFixed(2);
  $('vSig').textContent = f3(M.Sig); $('vE').textContent = (P.eps * M.xi >= 0 ? '+' : '') + (P.eps * M.xi).toFixed(3); $('vPsi').textContent = f3(Math.abs(M.psi)) .replace(/^/, M.psi < 0 ? '−' : '');
  let st = 'Ψ // RESONANZ STABIL', hot = false;
  if (M.Sig < .4) st = 'Σ RUHT // OHNE TANGENTE KEINE RESONANZ, Ψ IST NUR NOCH RAUSCHEN';
  else if (P.eps > .8) st = 'ε DOMINIERT // DIE UNSCHÄRFE ÜBERLAGERT DAS FELD';
  else if (M.N > 12) { st = 'ZÄHLER ÜBERLÄDT DEN KERN // Ψ STEIGT'; hot = true; }
  else if (M.N < .25) st = 'A SCHIRMT AB // DAS FELD WIRD NORMIERT';
  else if (M.energy > .55) { st = 'Ψ // HOHE RESONANZ'; hot = true; }
  const el = $('status'); if (el.textContent !== st) el.textContent = st; el.classList.toggle('hot', hot);
}
let presetAnim = null;
function setP(k, v) { P[k] = clamp(v, PR[k][0], PR[k][1]); layoutAll(); saveS(); SND.param(k); }
for (const k in P) { const s = $('s_' + k); s.addEventListener('input', () => { presetAnim = null; setP(k, +s.value); idle = 0; }); s.addEventListener('pointerdown', () => { const t = k === 'T' || k === 'R' ? 'TR' : k; if (SEL !== t) select(t, false); }); }
$('s_vol').addEventListener('input', () => { ST.vol = +$('s_vol').value; $('v_vol').textContent = Math.round(ST.vol * 100) + '%'; SND.vol(); saveS(); });
PRESETS.forEach((p, i) => { const b = document.createElement('button'); b.textContent = p.n; b.onclick = () => { presetAnim = { from: { ...P }, to: p.v, t: 0 }; document.querySelectorAll('#presets button').forEach((x, j) => x.classList.toggle('on', j === i)); toast(p.n); SND.term('psi'); }; $('presets').appendChild(b); });
function setMode(m) { mode = m; document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); if (m === 'tour') { tourI = -1; tourT = 0; } else { tourT = 0; } }
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { setMode(b.dataset.mode); if (b.dataset.mode === 'orbit') { select(null); goTo(overview()); } });
$('bReset').onclick = () => { setMode('orbit'); select(null); goTo(overview()); idle = 0; };
$('bPulse').onclick = () => { for (let i = 0; i < 9; i++) setTimeout(() => spawnPulse(true), i * 90); SND.term('arrow'); };
const drawerOpen = v => { $('drawer').classList.toggle('hide', !v); $('bDrawer').classList.toggle('on', v); };
$('bDrawer').onclick = () => { drawerOpen($('drawer').classList.contains('hide')); if (!SEL && mode === 'orbit') goTo(overview()); else if (SEL) focusTerm(SEL); };
drawerOpen(!(innerWidth < 760 || innerHeight < 500));
let toastT = 0; function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('hide'); el.style.opacity = 1; toastT = 2.2; }
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { $('bPulse').click(); e.preventDefault(); } if (e.code === 'KeyR') $('bReset').click(); if (e.code === 'Escape') select(null); });

// ---------------------------------------------------------------- SOUND: generative Web Audio, every term has its voice
const SND = (() => {
  let ctx = null, master, lim, comp, filtA, rev, wet, recDest = null, coreG, coreO = [], fG, fO1, fO2, fTrem, fTremG, subG, subO, epsG, epsBP, built = false;
  const st = { nodes: 0, ev: {} }; const ev = k => { st.ev[k] = (st.ev[k] || 0) + 1; };
  const n = x => { st.nodes++; return x; };
  const osc = (type, f) => { const o = n(ctx.createOscillator()); o.type = type; o.frequency.value = f; return o; };
  const gain = v => { const g = n(ctx.createGain()); g.gain.value = v; return g; };
  const filt = (type, f, q = .7) => { const b = n(ctx.createBiquadFilter()); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84].map(m => 440 * Math.pow(2, (m - 69) / 12));
  let noiseBuf;
  function impulse(sec, decay) { const len = ctx.sampleRate * sec | 0, b = ctx.createBuffer(2, len, ctx.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += (Math.random() * 2 - 1 - lp) * (.25 + .75 * (1 - t)); d[i] = lp * Math.pow(1 - t, decay); } } return b; }
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { ctx = new AC(); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    master = gain(0); comp = n(ctx.createDynamicsCompressor()); comp.threshold.value = -20; comp.ratio.value = 3.5; comp.attack.value = .01; comp.release.value = .3;
    lim = n(ctx.createDynamicsCompressor()); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
    // A = the denominator: a lowpass that normalizes the whole field
    filtA = filt('lowpass', 4000, .5);
    filtA.connect(comp); comp.connect(lim); const trim = gain(.85); lim.connect(trim); trim.connect(master); master.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) { recDest = ctx.createMediaStreamDestination(); master.connect(recDest); }
    rev = n(ctx.createConvolver()); rev.buffer = impulse(4.5, 2.2); wet = gain(.5); rev.connect(wet); wet.connect(filtA);
    // Ψ core drone: root, fifth, octave with slow breathing
    coreG = gain(0); coreG.connect(filtA); const cw = gain(.4); coreG.connect(cw); cw.connect(rev);
    [[1, .5, .05], [1.5, .22, .071], [2, .18, .043], [1.003, .3, .062]].forEach(([r, a, lf]) => { const o = osc('sine', 55 * r), g = gain(a), l = osc('sine', lf), lg = gain(a * .4); l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(coreG); o.start(); l.start(); coreO.push([o, r]); });
    // S³ sub body
    subG = gain(0); subO = osc('triangle', 55); const sl = filt('lowpass', 240); subO.connect(sl); sl.connect(subG); subG.connect(filtA); subO.start();
    // F² vibrating planes: two detuned voices, tremolo at the plane frequency
    fG = gain(0); fTremG = gain(.5); fTrem = osc('sine', 4); const tg = gain(.5); fTrem.connect(tg); tg.connect(fTremG.gain);
    fO1 = osc('triangle', 220); fO2 = osc('sine', 221.5); const fl = filt('bandpass', 800, .6); fO1.connect(fl); fO2.connect(fl); fl.connect(fTremG); fTremG.connect(fG); fG.connect(filtA); const fw = gain(.5); fG.connect(fw); fw.connect(rev);
    fO1.start(); fO2.start(); fTrem.start();
    // ε: airy noise
    epsG = gain(0); const ns = n(ctx.createBufferSource()); ns.buffer = noiseBuf; ns.loop = true; epsBP = filt('bandpass', 3200, .9); ns.connect(epsBP); epsBP.connect(epsG); epsG.connect(filtA); const ew = gain(.6); epsG.connect(ew); ew.connect(rev); ns.start();
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => { }); else if (ST.snd || window.__recOn) ctx.resume().catch(() => { }); });
    const kick = () => { if (ctx && (ST.snd || window.__recOn) && ctx.state !== 'running') ctx.resume().catch(() => { }); };
    addEventListener('pointerdown', kick, true); addEventListener('touchend', kick, true); addEventListener('keydown', kick, true);
    built = true; params(true); return true;
  }
  function unlock() {
    if (!ctx && !build()) return; try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
    if (ctx.state !== 'running') ctx.resume().catch(() => { });
    vol(); 
  }
  const now = () => ctx.currentTime;
  function vol() { if (!ctx) return; const v = (ST.snd || window.__recOn) ? ST.vol * (ST.snd ? 1 : .0001) : 0; master.gain.setTargetAtTime(v, now(), .15); }
  function params(instant) {
    if (!built) return; const tc = instant ? .01 : .25, t = now();
    const root = 55 * Math.pow(2, (P.S - 1) * .5);
    for (const [o, r] of coreO) o.frequency.setTargetAtTime(root * r, t, tc);
    coreG.gain.setTargetAtTime(.1 + .22 * M.energy, t, tc);
    subO.frequency.setTargetAtTime(root, t, tc); subG.gain.setTargetAtTime(.05 * Math.min(1.6, M.S3), t, tc);
    const ff = 130.8 * (1 + P.F * .75); fO1.frequency.setTargetAtTime(ff, t, tc); fO2.frequency.setTargetAtTime(ff * 1.007 + P.F, t, tc); fTrem.frequency.setTargetAtTime((2.2 + P.F * 1.6) / TAU * 3, t, tc); fG.gain.setTargetAtTime(.025 + .012 * P.F, t, tc);
    filtA.frequency.setTargetAtTime(900 + 6000 / P.A, t, tc);
    epsG.gain.setTargetAtTime(.002 + .05 * P.eps * P.eps, t, tc); epsBP.frequency.setTargetAtTime(2200 + 2400 * P.eps, t, tc);
  }
  function blip(f, a, dec, type = 'sine', panX = 0, wetv = .5, delay = 0) {
    if (!built || !ST.snd && !window.__recOn) return; const t = now() + delay;
    const o = osc(type, f), o2 = osc('sine', f * 2.76), g = gain(0), g2 = gain(.18), p = ctx.createStereoPanner ? n(ctx.createStereoPanner()) : null;
    o.connect(g); o2.connect(g2); g2.connect(g); if (p) { p.pan.value = clamp(panX, -1, 1); g.connect(p); p.connect(filtA); } else g.connect(filtA);
    const w = gain(wetv); g.connect(w); w.connect(rev);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dec);
    o.start(t); o2.start(t); o.stop(t + dec + .05); o2.stop(t + dec + .05);
  }
  let arrT = 0, chT = 0, grT = 0;
  function update(dt) {
    if (!built) return; arrT -= dt; chT -= dt; grT -= dt;
    if (P.eps > .02 && Math.random() < P.eps * 18 * dt && grT <= 0) { grT = .02; blip(3000 + Math.random() * 5000, .012 * P.eps, .03, 'sine', .4 + Math.random() * .6, .7); ev('grain'); }
  }
  const panOf = x => clamp((x - 3.8) / 6, -1, 1);
  function arrive(r) { if (arrT > 0) return; arrT = .09; blip(PENTA[3 + r.k % 9] , .07, .55, 'triangle', panOf(ringWorld(r).x), .5); ev('arrive'); }
  function chime(r) { if (chT > 0) return; chT = .12; blip(PENTA[r.k % 12] * 2, .028 * (.5 + .5 * Math.min(1.5, r.Ti)), 1.8, 'sine', panOf(ringWorld(r).x), .8); ev('chime'); }
  function term(k) { if (!built) return; const f = TERMS[k] ? TERMS[k].note : 220; blip(f, .12, 1.6, 'triangle', 0, .7); blip(f * 1.5, .05, 1.2, 'sine', 0, .7, .08); ev('term'); }
  let pT = 0; function param() { const t = performance.now(); if (t - pT > 40) { pT = t; params(); } }
  return { unlock, vol, params, update, arrive, chime, term, param, recTracks: () => recDest ? recDest.stream.getAudioTracks() : [], get ctx() { return ctx; }, stats: st };
})();
function sndBtn() { $('bSnd').textContent = ST.snd ? 'TON AN' : 'TON AUS'; $('bSnd').classList.toggle('on', ST.snd); }
$('bSnd').onclick = () => { ST.snd = !ST.snd; if (ST.snd) SND.unlock(); SND.vol(); sndBtn(); saveS(); toast(ST.snd ? 'TON AN' : 'TON AUS'); };
sndBtn();

// ---------------------------------------------------------------- REC (canvas + audio)
let rec = null, recChunks = [], recStart = 0, recUrl = null;
function pickMime() { if (!window.MediaRecorder) return null; const mp4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4']; const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const safari = /^((?!chrome|chromium|android|crios).)*safari/i.test(navigator.userAgent); const c = safari ? [...mp4, ...webm] : [...webm, ...mp4]; for (const m of c) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) { } } return ''; }
$('bRec').addEventListener('click', () => {
  if (rec) { try { rec.requestData(); } catch (_) { } rec.stop(); return; }
  const mime = pickMime(); if (mime === null || !canvas.captureStream) { toast('REC WIRD VON DIESEM BROWSER NICHT UNTERSTÜTZT'); return; }
  try {
    if (!SND.ctx) SND.unlock(); window.__recOn = true; SND.vol();
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...SND.recTracks()]); window.__recAudio = stream.getAudioTracks().length;
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 10e6 } : { videoBitsPerSecond: 10e6 }); recChunks = [];
    const r = rec;
    r.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
    r.onstop = () => {
      const type = r.mimeType || mime || 'video/webm', ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(recChunks, { type: type.split(';')[0] });
      rec = null; window.__recOn = false; SND.vol(); $('bRec').classList.remove('on');
      if (!blob.size) { $('rectime').classList.add('hide'); toast('REC: KEINE VIDEODATEN, BITTE LÄNGER AUFNEHMEN'); window.__lastRec = { size: 0, type }; return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `eye-of-resonance-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
  } catch (err) { rec = null; window.__recOn = false; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});

// ---------------------------------------------------------------- quality + resize
let uH = 800;
function applyTier(t) {
  tier = t; const Tt = TIERS[t];
  renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl; noise.g.setDrawRange(0, noiseCount());
  resize();
  document.querySelectorAll('#qual button').forEach(b => b.classList.toggle('on', +b.dataset.q === t)); $('mQ').textContent = Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 54 : 42; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(); uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of [pulseMat, noise.m]) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  stars.uniforms.uPR.value = pr;
  if (!SEL && mode === 'orbit') goTo(overview(), !started);
}
addEventListener('resize', () => { resize(); drawerOpen(!(innerWidth < 760 || innerHeight < 500) || !$('drawer').classList.contains('hide')); });
document.querySelectorAll('#qual button').forEach(b => b.onclick = () => { autoQ = false; applyTier(+b.dataset.q); toast('GRAFIK: ' + TIERS[tier].n); });

// ---------------------------------------------------------------- frame
let started = false, manual = false, lastNow = performance.now(), frameN = 0, xiT = 0, xiA = 0, xiB = 0;
const fpsWin = []; let lowT = 0, warm = 0;
const tmpV = new V3();
function frame(dt) {
  T += dt; const t = T;
  // preset morph
  if (presetAnim) { presetAnim.t = Math.min(1, presetAnim.t + dt / 1.2); const e = presetAnim.t * presetAnim.t * (3 - 2 * presetAnim.t); for (const k in P) P[k] = lerp(presetAnim.from[k], presetAnim.to[k], e); layoutAll(); SND.param(); if (presetAnim.t >= 1) { presetAnim = null; saveS(); } }
  // ε · ξ(t): smooth random walk in [-1, 1]
  xiT -= dt; if (xiT <= 0) { xiA = xiB; xiB = Math.random() * 2 - 1; xiT = .35; } M.xi = lerp(xiA, xiB, 1 - xiT / .35) + (Math.random() - .5) * .15 * P.eps;
  compute();
  const E = M.energy, hk = 1 - Math.exp(-dt * 6);
  for (const k in TERMS) { const tg = (SEL === k ? 1 : 0) + (hoverK === k ? .45 : 0); TERMS[k].h = lerp(TERMS[k].h, Math.min(1, tg), hk); }
  const H = k => TERMS[k].h;
  // Ψ core
  const beat = Math.pow(.5 + .5 * Math.sin(t * (1.2 + E * 2.2) * Math.PI), 6);
  core.scale.setScalar((.85 + .15 * P.S) * (1 + beat * .03 * (.4 + E) + H('psi') * .08));
  coreEdges.rotation.y = coreGlass.rotation.y = t * .12; coreEdges.rotation.x = coreGlass.rotation.x = Math.sin(t * .2) * .2;
  coreMatrix.rotation.y = -t * .25; coreMatrix.rotation.z = t * .11; coreNodes.rotation.copy(coreMatrix.rotation);
  const ck = .5 + E * .8 + beat * .2 + H('psi') * .45;
  coreEdgeMat.color.copy(C.cy).multiplyScalar(.9 * ck); coreMatrixMat.opacity = .35 + .4 * E; coreNodeMat.opacity = .5 + .4 * E;
  coreHeart.material.color.setRGB(1.2 * ck, 1.9 * ck, 2.1 * ck); coreHalo.material.opacity = .1 + .14 * E + .1 * H('psi'); coreHalo.scale.setScalar(1.6 + E * 1.1);
  coreLight.intensity = 1.2 + E * 3.5 + beat;
  for (let b = 0; b < BOLTS; b++) { boltT[b] -= dt * (1 + E * 2); if (boltT[b] <= 0) regenBolt(b); } boltGeo.attributes.position.needsUpdate = true;
  boltMat.opacity = clamp(.25 + E * .9 + (Math.random() < .1 ? .4 : 0), 0, 1); boltGeo.setDrawRange(0, Math.round(BOLTS * (.3 + .7 * Math.min(1, E * 1.6))) * BSEG * 2);
  if (labels.psi) labels.psi.material.opacity = .85 + .15 * Math.sin(t * 1.5) + H('psi') * .3;
  // S³ cube
  cubeEdgeMat.color.setRGB(.6, .85, .95).multiplyScalar(.7 + H('S') * 1.1 + .1 * Math.sin(t * 2)); cornerMat.color.setRGB(.75, 1.1, 1.2).multiplyScalar(.8 + H('S') * 1 + beat * .2);
  for (const c of corners) c.scale.setScalar((1 + H('S') * .5) * Math.min(1, cam.d / 7) / Math.max(.6, P.S));
  // F² planes
  planeMat.uniforms.uT.value = planeMat2.uniforms.uT.value = t; planeMat.uniforms.uK.value = planeMat2.uniforms.uK.value = .8 + H('F') * 1.3 + E * .3;
  // A plate
  plateRimMat.opacity = .35 + .45 / Math.sqrt(P.A) + H('A') * .8; plateMat.emissive.setRGB(0, .05, .07).multiplyScalar(H('A') * 3); if (labels.Aglow) labels.Aglow.material.opacity = H('A') * .9;
  plateRings.rotation.z = t * .05;
  fieldMat.uniforms.uT.value = t; fieldMat.uniforms.uSp.value = .3 + Math.min(3, M.N) * .5; fieldMat.uniforms.uK.value = (.25 + .45 * Math.min(1, M.N / 6)) * (1 + H('A') * 1.5);
  // → vector + pulses
  if (started) arrowGrow = Math.min(1, arrowGrow + dt * .7); layoutArrow(t);
  beamMat.color.setRGB(.9, 2.2, 2.5).multiplyScalar(.5 + .5 * Math.min(1, M.N / 4) + H('arrow') * 1.2); metal.emissive.copy(C.cy); metal.emissiveIntensity = H('arrow') * .25; headMat.emissiveIntensity = .35 + H('arrow') * .6;
  if (arrowGrow > .9) { pulseAcc += dt * M.rate; while (pulseAcc >= 1) { pulseAcc -= 1; spawnPulse(false); } }
  for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i]; p.u += dt * p.sp * (1 + Math.min(1.5, M.N * .08)); if (p.u >= 1) { p.r.flash = Math.min(1.6, p.r.flash + p.en * .8); SND.arrive(p.r); pulses.splice(i, 1); } }
  for (let i = 0; i < PMAX; i++) { if (i < pulses.length) { const p = pulses[i]; p.c.getPointAt(Math.min(1, p.u), tmpV); pulsePos.set([tmpV.x, tmpV.y, tmpV.z], i * 3); pulseA[i] = p.en * (p.u < .06 ? p.u / .06 : 1); } else pulseA[i] = 0; }
  pulseGeo.attributes.position.needsUpdate = true; pulseGeo.attributes.a.needsUpdate = true;
  // Σ(T · R) rings
  for (const r of RING) {
    const w = 1.2 * r.Ti * r.Ri; r.rot += dt * w; r.outer.rotation.y = r.rot + r.ph; r.mid.rotation.x = r.rot * 1.3 + r.ph; r.inner.rotation.z = r.rot * 1.7;
    const rev = Math.floor((r.rot + r.ph) / TAU); if (rev !== r.rev) { if (r.rev !== 0 && w > .05) SND.chime(r); r.rev = rev; }
    r.flash *= Math.exp(-dt * 2.2); const fk = r.flash + H('TR') * .5;
    r.hubM.color.setRGB(.9, 1.5, 1.7).multiplyScalar(.35 + fk * .9 + .25 * Math.min(1, r.Ti * r.Ri)); r.halo.material.opacity = Math.min(.5, r.flash * .28 + H('TR') * .12);
  }
  ringMetal.emissiveIntensity = H('TR') * .22; goldMat.emissiveIntensity = .2 + .35 * Math.min(1, P.T) + H('TR') * .6;
  archMetal.emissiveIntensity = H('sigma') * .22 + .03 * E; threadMat.uniforms.uT.value = t; threadMat.uniforms.uSp.value = .2 + M.Sig * .05; threadMat.uniforms.uK.value = (.25 + .35 * Math.min(1, M.Sig / 12)) * (1 + H('sigma') * 1.6 + H('TR') * .8);
  if (labels.sigma) labels.sigma.material.opacity = .75 + .25 * Math.min(1, M.Sig / 9) + H('sigma') * .3;
  // ε noise
  noise.m.uniforms.uT.value = t; noise.m.uniforms.uK.value = .7 + .5 * P.eps + H('eps') * 1.2;
  if (labels.eps) { labels.eps.material.opacity = .8 + H('eps') * .3; labels.eps.position.x = L.epsC.x + .05 + P.eps * .06 * Math.sin(t * 13); }
  stars.uniforms.uT.value = t;
  SND.update(dt); if ((frameN & 15) === 0) SND.params();
  updateCamera(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) { $('toast').style.opacity = 0; setTimeout(() => toastT <= 0 && $('toast').classList.add('hide'), 500); } }
  if ((frameN++ & 5) === 0) { hudLive(); if (rec) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; } }
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

// ---------------------------------------------------------------- start
function enter() {
  if (started) return; started = true; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  if (ST.snd) SND.unlock(); idle = 0; toast('Ψ = S³ · F² / A → Σ(T · R) + ε');
  setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => spawnPulse(true), i * 160); }, 1500);
}
$('go').onclick = enter;
await makeLabels();
applyTier(tier); layoutAll(); goTo(overview(), true);
requestAnimationFrame(loop);
frame(.016); render();
$('go').disabled = false; $('go').textContent = 'SYSTEM STARTEN';
if (Q.has('go')) enter();
if ('serviceWorker' in navigator && !Q.has('nosw')) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }));
if (document.readyState === 'complete' && 'serviceWorker' in navigator && !Q.has('nosw')) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { });

// ---------------------------------------------------------------- test hooks
window.__EOR = {
  ready: true,
  setManual(v) { manual = v; lastNow = performance.now(); },
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); render(); },
  state() { return { tier: TIERS[tier].n, mode, sel: SEL, P: { ...P }, M: { ...M }, pulses: pulses.length, noise: noiseCount(), cam: camera.position.toArray().map(v => +v.toFixed(2)), d: +cam.d.toFixed(2) }; },
  set(k, v) { setP(k, v); }, preset(i) { $('presets').children[i].click(); }, select(k, f = true) { select(k, f); }, focus: focusTerm, overview() { select(null); goTo(overview(), true); }, setMode, enter, spawnPulse,
  setTier(t) { autoQ = false; applyTier(t); }, pick: pickAt,
  audio() { const c = SND.ctx; return { state: c ? c.state : 'none', nodes: SND.stats.nodes, ev: SND.stats.ev, recAudio: window.__recAudio || 0 }; },
  project(x, y, z) { const v = new V3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; },
  snap() { cam.th = goal.th; cam.ph = goal.ph; cam.d = goal.d; cam.t.copy(goal.t); updateCamera(0); render(); }
};
