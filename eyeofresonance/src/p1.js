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
