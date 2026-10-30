// NeuraBlackbox – shivas_ocean · Luca Matteo Balzano 1991
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const FALLBACK = {"title": "NeuraBlackbox", "intro": "Jeder Gedanke beginnt als Signal. Tauch ein in die Blackbox, Schicht für Schicht, bis zum Kern.", "axes": {"bio": ["Biologie", "Evolution", "Neurologie"], "human": ["Anthropologie", "Ethik", "Kommunikation"]}, "layers": [{"id": "L01", "name": "SIGNAL", "color": "#3ad6ff", "tagline": "Reize treffen ein", "bio": "Sinneszelle, Aktionspotenzial, Ionenkanal", "machine": "Input, Sensor, Bit", "human": "Wahrnehmung: Was erreicht mich?", "nodes": ["Reiz", "Schwelle", "Impuls", "Rauschen", "Aufmerksamkeit"], "hover": "Nicht jeder Reiz wird zum Signal. Erst die Schwelle entscheidet."}, {"id": "L02", "name": "NETWORK", "color": "#7a5cff", "tagline": "Verbindungen entstehen", "bio": "Axon, Dendrit, Synapse, Myelin", "machine": "Leiterbahn, Bus, Graph", "human": "Kommunikation: Sprache, Beziehung, Gruppe", "nodes": ["Synapse", "Axon", "Knoten", "Resonanz", "Empathie"], "hover": "Was zusammen feuert, verbindet sich. Bei Neuronen wie bei Menschen."}, {"id": "L03", "name": "MEMORY", "color": "#ffc24a", "tagline": "Muster werden gespeichert", "bio": "Plastizität, Hippocampus, DNA als Langzeitspeicher der Evolution", "machine": "Speicher, Gewicht, Cache", "human": "Kultur und Ethik: was eine Gemeinschaft sich merkt", "nodes": ["Muster", "Erinnerung", "Gen", "Ritual", "Wert"], "hover": "Evolution ist Gedächtnis über Generationen. Kultur ist Gedächtnis über Gespräche."}, {"id": "L04", "name": "CORE", "color": "#ffffff", "tagline": "Bewusstsein, Energie, Ursprung", "bio": "Integration, Bewusstsein, Leben selbst", "machine": "Prozessorkern, Taktgeber", "human": "Ich und Wir: Sinn, Verantwortung", "nodes": ["Kern", "Feld", "Einheit", "Sinn"], "hover": "You are inside the core. Hier hören Ebenen auf, getrennt zu sein."}], "orbits": [{"color": "#3ad6ff", "meaning": "Information"}, {"color": "#7a5cff", "meaning": "Verbindung"}, {"color": "#ffc24a", "meaning": "Erinnerung"}, {"color": "#3dff9a", "meaning": "Wachstum / Leben"}], "links": [["Impuls", "Synapse", "Ein Signal braucht einen Weg"], ["Resonanz", "Muster", "Wiederholung wird zu Struktur"], ["Empathie", "Wert", "Aus Mitgefühl wird Ethik"], ["Gen", "Kern", "Leben erinnert sich an sich selbst"]], "ui": {"controls": ["ENERGY FLUX", "ORBIT DENSITY", "CORE SCALE", "EXPAND LAYERS", "ENTER", "REC", "RESET VIEW"], "status": "SYS // NEURABLACKBOX v0.1 · SIGNAL STABLE · LAYERS 4/4", "lensToggle": ["BIO", "MACHINE", "HUMAN"]}, "credit": "Konzept: Luca · shivas_ocean"};
const Q = new URLSearchParams(location.search);
const IS_MOBILE = matchMedia('(pointer:coarse)').matches || /iPhone|iPad|Android/i.test(navigator.userAgent);
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R0 = rng(91);
const col = h => new THREE.Color(h);
const C = { cy: col('#3ad6ff'), bl: col('#2f7bff'), vi: col('#7a5cff'), au: col('#ffc24a'), gr: col('#3dff9a'), wh: col('#ffffff'), pk: col('#c86bff') };
const LENS_ACC = { bio: '#3dff9a', machine: '#3ad6ff', human: '#8a6cff' };
let SEM = FALLBACK;

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.03, 400);
camera.rotation.order = 'YXZ';
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.42, 0.32);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 4, orb: 1, bl: 0.62 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 2, orb: 0.8, bl: 0.58 },
  { n: 'NIEDRIG', pr: 1, s: 0, orb: 0.55, bl: 0.55 }];
let tier = Q.has('q') ? clamp(+Q.get('q') | 0, 0, 2) : 0;
let autoQ = !Q.has('q') && !Q.has('noauto');
const TEX = (IS_MOBILE || Q.has('lowtex')) ? 1024 : 2048;

// ---------------------------------------------------------------- env map + lights
{
  const pm = new THREE.PMREMGenerator(renderer);
  const es = new THREE.Scene(); es.background = new THREE.Color(0x000000);
  const panel = (c, k, w, h, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
  panel('#2a6cff', 2.2, 12, 3, 0, 9, 0);
  panel('#ffffff', 3.0, 7, 0.5, 7, 5, 5);
  panel('#3ad6ff', 1.4, 9, 0.8, -8, 2, -3);
  panel('#7a5cff', 1.1, 6, 0.8, 3, -2, -8);
  panel('#ffffff', 1.2, 0.6, 6, -6, 3, 6);
  scene.environment = pm.fromScene(es, 0.03).texture;
}
scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x020305, 0.35));
const key = new THREE.DirectionalLight(0xdfe8ff, 1.1); key.position.set(6, 14, 9); scene.add(key);

// ---------------------------------------------------------------- shared shaders
const FRESNEL_VS = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ vP=position; vec4 mv = modelViewMatrix * vec4(position,1.0);
 #ifdef USE_INSTANCING
 mv = modelViewMatrix * instanceMatrix * vec4(position,1.0);
 #endif
 vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`;
function fresnelMat(c, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uC: { value: c.clone() }, uC2: { value: (opts.c2 || c).clone() }, uI: { value: opts.i ?? 1 }, uP: { value: opts.p ?? 2.5 }, uB: { value: opts.b ?? 0.03 }, uT: { value: 0 }, uG: { value: opts.grid ?? 0 }, uInv: { value: opts.inv ? 1 : 0 } },
    vertexShader: FRESNEL_VS,
    fragmentShader: `uniform vec3 uC,uC2; uniform float uI,uP,uB,uT,uG,uInv; varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main(){ float f = 1.0-abs(dot(normalize(vN),normalize(vV)));
      float a = uInv>0.5 ? pow(1.0-f,3.0) : pow(f,uP) + uB;
      if(uG>0.0){ float lat = smoothstep(0.965,1.0,abs(sin(vP.y*15.0)));
        float ang = atan(vP.z,vP.x)+uT*0.15; float lon = smoothstep(0.975,1.0,abs(sin(ang*10.0)));
        float sw = smoothstep(0.92,1.0,abs(sin(ang*3.0 + vP.y*4.0 - uT*0.8)));
        a += uG*(max(lat,lon)*(0.25+f*0.8) + sw*0.18); }
      gl_FragColor = vec4(mix(uC,uC2,f)*a*uI, 1.0); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: opts.side ?? THREE.FrontSide
  });
}
const edgeBoxMat = (k = 1) => new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uK: { value: k } },
  vertexShader: `varying vec3 vP; varying vec3 vC; void main(){ vP=position;
   #ifdef USE_INSTANCING_COLOR
   vC=instanceColor;
   #else
   vC=vec3(1.0);
   #endif
   gl_Position = projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }`,
  fragmentShader: `uniform float uT,uK; varying vec3 vP; varying vec3 vC;
   void main(){ vec3 a=abs(vP)*2.0; float ex=smoothstep(0.88,1.0,a.x), ey=smoothstep(0.88,1.0,a.y), ez=smoothstep(0.88,1.0,a.z);
     float e=max(max(ex*ey,ey*ez),ex*ez);
     float lines = max(smoothstep(0.9,1.0,abs(sin(vP.x*19.0+vP.y*3.0))), smoothstep(0.93,1.0,abs(sin(vP.z*17.0-vP.y*5.0+uT*0.4))));
     float inner = 0.03 + 0.05*max(max(ex,ey),ez) + lines*0.08;
     gl_FragColor = vec4(vC*(e*1.7+inner)*uK,1.0); }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
});

// ---------------------------------------------------------------- geometry constants
const BW = 10, BH = 0.14, NL = 4;
const S_BASE = 2.4, S_EXP = 4.1;
let S = S_BASE, St = S_BASE;
const layerY = i => (1.5 - i) * S;
const CORE_Y = 1.05;
const PILLARS = [[4.55, 4.55], [-4.55, 4.55], [4.55, -4.55], [-4.55, -4.55], [0, 4.6], [0, -4.6], [4.6, 0], [-4.6, 0], [2.75, 2.75], [-2.75, 2.75], [2.75, -2.75], [-2.75, -2.75]];
const INNER_P = [8, 9, 10, 11];
let flux = 1, density = 1, coreScale = 1, lens = 'machine';

// ---------------------------------------------------------------- board textures
function drawBoard(li, T) {
  const r = rng(1000 + li * 77);
  const cb = document.createElement('canvas'); cb.width = cb.height = T; const b = cb.getContext('2d');
  const cm = document.createElement('canvas'); cm.width = cm.height = T; const m = cm.getContext('2d');
  const k = T / 10; const X = x => (x + 5) * k;
  const g = b.createLinearGradient(0, 0, T, T); g.addColorStop(0, '#0a0d12'); g.addColorStop(.5, '#06080b'); g.addColorStop(1, '#0a0c10');
  b.fillStyle = g; b.fillRect(0, 0, T, T); m.fillStyle = '#000'; m.fillRect(0, 0, T, T);
  for (let i = 0; i < 2500; i++) { b.fillStyle = `rgba(140,170,200,${r() * 0.05})`; b.fillRect(r() * T, r() * T, 1.2, 1.2); }
  b.strokeStyle = 'rgba(110,140,170,0.04)'; b.lineWidth = 1;
  for (let x = -5; x <= 5.001; x += 0.25) { b.beginPath(); b.moveTo(X(x), 0); b.lineTo(X(x), T); b.stroke(); b.beginPath(); b.moveTo(0, X(x)); b.lineTo(T, X(x)); b.stroke(); }
  b.strokeStyle = 'rgba(140,170,200,0.22)'; b.lineWidth = 0.03 * k; b.strokeRect(0.12 * k, 0.12 * k, T - 0.24 * k, T - 0.24 * k);
  b.strokeStyle = 'rgba(140,170,200,0.10)'; b.lineWidth = 0.015 * k; b.strokeRect(0.34 * k, 0.34 * k, T - 0.68 * k, T - 0.68 * k);
  m.strokeStyle = 'rgb(0,0,90)'; m.lineWidth = 0.02 * k; m.strokeRect(0.12 * k, 0.12 * k, T - 0.24 * k, T - 0.24 * k);
  const chipH = [1.15, 0.72, 0.5, 1.45][li];
  const avoid = (x, z, pad = 0.2) => (Math.abs(x) < chipH + pad && Math.abs(z) < chipH + pad) || (Math.abs(Math.abs(x) - 4.55) < 0.45 && Math.abs(Math.abs(z) - 4.55) < 0.45);
  const traces = [];
  const trace = (pts, w, glow = 1) => traces.push({ pts, w, ph: r(), glow });
  const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]].map(([x, z]) => { const l = Math.hypot(x, z); return [x / l, z / l]; });
  const walkT = (x, z, di, segs, minL, maxL) => {
    const pts = [[x, z]];
    for (let s = 0; s < segs; s++) {
      const L = lerp(minL, maxL, r()); let nx = clamp(x + DIRS[di][0] * L, -4.72, 4.72), nz = clamp(z + DIRS[di][1] * L, -4.72, 4.72);
      pts.push([nx, nz]); x = nx; z = nz;
      const turn = r() < 0.5 ? 1 : 7; const nd = (di + turn) % 8;
      if (DIRS[nd][0] * x + DIRS[nd][1] * z >= -0.2) di = nd; else di = (di + 8 - turn) % 8;
      if (Math.abs(x) > 4.6 || Math.abs(z) > 4.6) break;
    }
    return pts;
  };
  const nPin = [30, 22, 18, 26][li];
  for (let side = 0; side < 4; side++) for (let p = 0; p < nPin; p++) {
    if (r() > 0.85) continue;
    const o = (p / (nPin - 1) - 0.5) * chipH * 1.8; let x, z, di;
    if (side === 0) { x = chipH + 0.05; z = o; di = 0; } else if (side === 1) { x = -chipH - 0.05; z = o; di = 4; } else if (side === 2) { x = o; z = chipH + 0.05; di = 2; } else { x = o; z = -chipH - 0.05; di = 6; }
    trace(walkT(x, z, di, 2 + (r() * 4 | 0), 0.25, 1.6), 0.018 + r() * 0.012, 1);
  }
  const nBus = [12, 16, 22, 30][li];
  for (let i = 0; i < nBus; i++) {
    const x0 = (r() - 0.5) * 8.6, z0 = (r() - 0.5) * 8.6; if (avoid(x0, z0, 0.4)) continue;
    const di = (r() * 8 | 0), n = 3 + (r() * 6 | 0), L = 0.6 + r() * 2.4; const pdx = -DIRS[di][1], pdz = DIRS[di][0];
    const jog = r() < 0.6;
    for (let j = 0; j < n; j++) { const sx = x0 + pdx * j * 0.075, sz = z0 + pdz * j * 0.075; const pts = [[sx, sz], [sx + DIRS[di][0] * L, sz + DIRS[di][1] * L]]; if (jog) { const d2 = (di + 1) % 8; pts.push([pts[1][0] + DIRS[d2][0] * 0.6, pts[1][1] + DIRS[d2][1] * 0.6]); pts.push([pts[2][0] + DIRS[di][0] * L * .5, pts[2][1] + DIRS[di][1] * L * .5]); } trace(pts.map(([a, c]) => [clamp(a, -4.72, 4.72), clamp(c, -4.72, 4.72)]), 0.012, 0.8); }
  }
  const nW = [50, 70, 90, 130][li];
  for (let i = 0; i < nW; i++) { const x0 = (r() - 0.5) * 9, z0 = (r() - 0.5) * 9; if (avoid(x0, z0)) continue; trace(walkT(x0, z0, r() * 8 | 0, 2 + (r() * 3 | 0), 0.2, 1.2), 0.012 + r() * 0.01, 0.7); }
  if (li === 1) for (let i = 0; i < 140; i++) {
    const a = r() * Math.PI * 2, rr = 0.8 + r() * 3.6, a2 = a + (r() - 0.5) * 2.2, rr2 = r() * 4.1;
    const p0 = [Math.cos(a) * rr, Math.sin(a) * rr], p1 = [Math.cos(a2) * rr2, Math.sin(a2) * rr2];
    const c = [(p0[0] + p1[0]) / 2 + (r() - .5) * 1.6, (p0[1] + p1[1]) / 2 + (r() - .5) * 1.6];
    const pts = []; for (let t = 0; t <= 1.0001; t += 0.1) { const u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); }
    traces.push({ pts, w: 0.008 + r() * 0.008, ph: r(), glow: 0.9, web: true });
  }
  b.lineJoin = m.lineJoin = 'round'; b.lineCap = m.lineCap = 'round';
  for (const t of traces) {
    b.strokeStyle = t.web ? 'rgba(70,110,170,0.35)' : 'rgba(78,104,132,0.55)'; b.lineWidth = Math.max(1, t.w * k);
    b.beginPath(); t.pts.forEach(([x, z], i) => i ? b.lineTo(X(x), X(z)) : b.moveTo(X(x), X(z))); b.stroke();
    m.strokeStyle = `rgb(${255 * t.glow | 0},${t.ph * 255 | 0},0)`; m.lineWidth = Math.max(1, t.w * k * 1.25);
    m.beginPath(); t.pts.forEach(([x, z], i) => i ? m.lineTo(X(x), X(z)) : m.moveTo(X(x), X(z))); m.stroke();
    const e = t.pts[t.pts.length - 1];
    if (!t.web) { b.fillStyle = '#2b3846'; b.beginPath(); b.arc(X(e[0]), X(e[1]), t.w * k * 2.2, 0, 7); b.fill(); b.fillStyle = '#05070a'; b.beginPath(); b.arc(X(e[0]), X(e[1]), t.w * k * 0.9, 0, 7); b.fill(); }
  }
  const nComp = [70, 90, 110, 150][li];
  for (let i = 0; i < nComp; i++) {
    const x = (r() - 0.5) * 9, z = (r() - 0.5) * 9; if (avoid(x, z, 0.3)) continue;
    const big = r() < 0.25; const w = big ? 0.35 + r() * 0.5 : 0.08 + r() * 0.12, h = big ? w * (0.6 + r() * 0.8) : w * (0.4 + r() * 0.3);
    b.fillStyle = '#0c1016'; b.fillRect(X(x - w / 2), X(z - h / 2), w * k, h * k);
    b.strokeStyle = 'rgba(150,175,200,0.18)'; b.lineWidth = 1; b.strokeRect(X(x - w / 2), X(z - h / 2), w * k, h * k);
    if (big) { b.strokeStyle = 'rgba(160,180,200,0.35)'; b.lineWidth = Math.max(1, 0.01 * k); const np = Math.max(3, w * 18 | 0);
      for (let p = 0; p < np; p++) { const px = x - w / 2 + (p + .5) * w / np; b.beginPath(); b.moveTo(X(px), X(z - h / 2)); b.lineTo(X(px), X(z - h / 2 - 0.05)); b.moveTo(X(px), X(z + h / 2)); b.lineTo(X(px), X(z + h / 2 + 0.05)); b.stroke(); } }
    else { b.fillStyle = 'rgba(170,180,190,0.35)'; b.fillRect(X(x - w / 2), X(z - h / 2), w * k * 0.2, h * k); b.fillRect(X(x + w / 2) - w * k * 0.2, X(z - h / 2), w * k * 0.2, h * k); }
    if (r() < 0.07) { m.fillStyle = 'rgb(0,0,200)'; m.beginPath(); m.arc(X(x), X(z), 0.025 * k, 0, 7); m.fill(); }
  }
  for (let i = 0; i < 260 + li * 80; i++) { const x = (r() - .5) * 9.2, z = (r() - .5) * 9.2; if (avoid(x, z)) continue; b.strokeStyle = 'rgba(120,140,160,0.35)'; b.lineWidth = 1; b.beginPath(); b.arc(X(x), X(z), 0.022 * k, 0, 7); b.stroke(); }
  for (const [hx, hz] of [[4.55, 4.55], [-4.55, 4.55], [4.55, -4.55], [-4.55, -4.55]]) {
    b.fillStyle = '#000'; b.beginPath(); b.arc(X(hx), X(hz), 0.24 * k, 0, 7); b.fill();
    b.strokeStyle = '#4a5560'; b.lineWidth = 0.05 * k; b.stroke();
    m.strokeStyle = 'rgb(0,0,140)'; m.lineWidth = 0.03 * k; m.beginPath(); m.arc(X(hx), X(hz), 0.3 * k, 0, 7); m.stroke();
  }
  m.lineWidth = 0.04 * k;
  if (li === 0) {
    m.strokeStyle = 'rgb(0,0,255)'; m.shadowColor = 'rgb(0,0,255)'; m.shadowBlur = 0.25 * k; m.strokeRect(X(-chipH - 0.12), X(-chipH - 0.12), (chipH + 0.12) * 2 * k, (chipH + 0.12) * 2 * k); m.shadowBlur = 0;
    for (let s = 0; s < 4; s++) for (let p = -3; p <= 3; p++) { const o = p * 1.15; const [x, z] = s === 0 ? [4.78, o] : s === 1 ? [-4.78, o] : s === 2 ? [o, 4.78] : [o, -4.78]; b.fillStyle = '#1c2632'; b.fillRect(X(x) - 0.08 * k, X(z) - 0.08 * k, 0.16 * k, 0.16 * k); m.fillStyle = 'rgb(0,0,160)'; m.fillRect(X(x) - 0.05 * k, X(z) - 0.05 * k, 0.1 * k, 0.1 * k); }
  }
  if (li === 1) { m.strokeStyle = 'rgb(0,0,120)'; m.lineWidth = 0.015 * k; m.beginPath(); m.arc(X(0), X(0), 4.25 * k, 0, 7); m.stroke(); }
  if (li === 2) { m.fillStyle = 'rgb(0,0,150)'; for (let i = 0; i < 40; i++) { const a = r() * 7, rr = 1.2 + r() * 2.4; m.beginPath(); m.arc(X(Math.cos(a) * rr), X(Math.sin(a) * rr), 0.02 * k, 0, 7); m.fill(); } }
  if (li === 3) {
    m.strokeStyle = 'rgb(0,0,170)'; m.lineWidth = 0.012 * k;
    for (let i = 1; i <= 7; i++) { m.beginPath(); m.arc(X(0), X(0), (1.6 + i * 0.42) * k, 0, 7); m.stroke(); }
    for (let i = 0; i < 6; i++) { const s = 2.9 * Math.pow(0.72, i); m.strokeStyle = `rgb(0,0,${120 + i * 20})`; m.strokeRect(X(-s / 2), X(-s / 2), s * k, s * k); b.strokeStyle = 'rgba(200,170,110,0.25)'; b.strokeRect(X(-s / 2), X(-s / 2), s * k, s * k); }
  }
  const tb = new THREE.CanvasTexture(cb); tb.colorSpace = THREE.SRGBColorSpace; tb.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const tm = new THREE.CanvasTexture(cm); tm.anisotropy = tb.anisotropy;
  return { tb, tm };
}
function chipTopTexture() {
  const T = 512, c = document.createElement('canvas'); c.width = c.height = T; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, T, T); gr.addColorStop(0, '#141a22'); gr.addColorStop(1, '#07090c'); g.fillStyle = gr; g.fillRect(0, 0, T, T);
  g.strokeStyle = 'rgba(160,190,220,.28)'; g.lineWidth = 2; g.strokeRect(26, 26, T - 52, T - 52);
  g.strokeStyle = 'rgba(160,190,220,.12)'; g.lineWidth = 1; g.strokeRect(150, 150, T - 300, T - 300);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { g.fillStyle = `rgba(120,160,210,${0.04 + ((i * 7 + j * 3) % 5) * 0.015})`; g.fillRect(160 + i * 16, 160 + j * 16, 12, 12); }
  g.fillStyle = 'rgba(190,210,230,.45)'; g.font = '500 22px ui-monospace,Menlo,monospace'; g.fillText('NBX-01', 40, T - 44); g.fillStyle = 'rgba(190,210,230,.25)'; g.font = '16px ui-monospace,Menlo,monospace'; g.fillText('NEURABLACKBOX', T - 190, 56);
  g.beginPath(); g.arc(56, 56, 9, 0, 7); g.strokeStyle = 'rgba(190,210,230,.4)'; g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// ---------------------------------------------------------------- build layers
const layers = [];
const boardSideMat = new THREE.MeshStandardMaterial({ color: 0x0f2232, emissive: 0x0b3a66, emissiveIntensity: 0.55, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.75, depthWrite: false });
const chipMat = new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.3, metalness: 0.8, envMapIntensity: 1.1 });
const pinMat = new THREE.MeshStandardMaterial({ color: 0x9aa6b2, roughness: 0.35, metalness: 1.0 });
const chipTop = chipTopTexture();
const glowBarMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.5, 1.9) });
const LAYER_ACC = [C.cy, C.vi, C.au, C.au];
function addCenterChip(group, size, pins, glowK, li) {
  const h = li === 0 ? 0.24 : 0.16;
  const body = new THREE.Mesh(new THREE.BoxGeometry(size, h, size), [chipMat, chipMat, new THREE.MeshStandardMaterial({ map: chipTop, roughness: 0.28, metalness: 0.7 }), chipMat, chipMat, chipMat]);
  body.position.y = BH / 2 + h / 2 + 0.02; group.add(body);
  const sub = new THREE.Mesh(new THREE.BoxGeometry(size * 1.12, 0.03, size * 1.12), chipMat); sub.position.y = BH / 2 + 0.015; group.add(sub);
  const gw = 0.025, gs = size * 1.04, yb = BH / 2 + 0.045;
  const gm = glowBarMat.clone(); gm.color.multiplyScalar(glowK);
  for (const [x, z, sx, sz] of [[0, gs / 2, gs, gw], [0, -gs / 2, gs, gw], [gs / 2, 0, gw, gs], [-gs / 2, 0, gw, gs]]) { const bar = new THREE.Mesh(new THREE.BoxGeometry(sx, 0.025, sz), gm); bar.position.set(x, yb, z); group.add(bar); }
  const pm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), pinMat, pins * 4); const o = new THREE.Object3D(); let n = 0;
  for (let s = 0; s < 4; s++) for (let p = 0; p < pins; p++) {
    const t = (p + 0.5) / pins - 0.5; const d = size * 0.56 + 0.05;
    if (s === 0) { o.position.set(d, BH / 2 + 0.03, t * size * 0.95); o.scale.set(0.14, 0.025, size / pins * 0.45); }
    if (s === 1) { o.position.set(-d, BH / 2 + 0.03, t * size * 0.95); o.scale.set(0.14, 0.025, size / pins * 0.45); }
    if (s === 2) { o.position.set(t * size * 0.95, BH / 2 + 0.03, d); o.scale.set(size / pins * 0.45, 0.025, 0.14); }
    if (s === 3) { o.position.set(t * size * 0.95, BH / 2 + 0.03, -d); o.scale.set(size / pins * 0.45, 0.025, 0.14); }
    o.updateMatrix(); pm.setMatrixAt(n++, o.matrix);
  }
  group.add(pm);
  return { body, gm, baseCol: gm.color.clone() };
}
for (let li = 0; li < NL; li++) {
  const group = new THREE.Group(); scene.add(group);
  const { tb, tm } = drawBoard(li, TEX);
  const topMat = new THREE.MeshStandardMaterial({ map: tb, roughness: 0.5, metalness: 0.55, envMapIntensity: 0.3, transparent: true, opacity: 0.9, depthWrite: false });
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BW), [boardSideMat, boardSideMat, topMat, topMat, boardSideMat, boardSideMat]);
  board.renderOrder = 1; board.userData.layer = li; group.add(board);
  const ovMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tm }, uT: { value: 0 }, uSp: { value: 0.16 + li * 0.08 }, uC: { value: new THREE.Color(0x2a86ff) }, uC2: { value: LAYER_ACC[li].clone().lerp(C.bl, li === 0 ? 0.3 : 0.15) }, uI: { value: 1 }, uF: { value: 1 }, uDir: { value: li % 2 ? -1 : 1 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `uniform sampler2D map; uniform float uT,uSp,uI,uF,uDir; uniform vec3 uC,uC2; varying vec2 vUv;
     void main(){ vec4 m=texture2D(map,vUv); float d=length(vUv-0.5)*2.0;
      float w=fract(m.g*5.0 + uDir*d*1.4 + uT*uSp); float head=pow(w,22.0)*1.6+pow(w,5.0)*0.3;
      vec3 c = uC*m.r*(0.10+head*uF)*1.9*uI + uC2*m.b*0.85*uI;
      gl_FragColor=vec4(c,1.0);}`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
  });
  const ov = new THREE.Mesh(new THREE.PlaneGeometry(BW, BW).rotateX(-Math.PI / 2), ovMat); ov.position.y = BH / 2 + 0.004; ov.renderOrder = 2; group.add(ov);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, BH, BW)), new THREE.LineBasicMaterial({ color: new THREE.Color(0x5fb8ff), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
  edge.renderOrder = 2; group.add(edge);
  const rr = rng(300 + li);
  const nChip = [16, 18, 12, 24][li]; const chips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), chipMat, nChip + 16); const o = new THREE.Object3D(); let n = 0;
  const chipH = [1.15, 0.72, 0.5, 1.45][li];
  for (let i = 0; i < nChip * 3 && n < nChip; i++) {
    const x = (rr() - .5) * 8.6, z = (rr() - .5) * 8.6; const s = (0.25 + rr() * 0.55) * (1 - li * 0.12);
    if (Math.abs(x) < chipH + s && Math.abs(z) < chipH + s) continue; if (Math.hypot(Math.abs(x) - 4.55, Math.abs(z) - 4.55) < 0.7) continue;
    if (Math.hypot(x, z) < 3.3 && li === 2) continue;
    o.position.set(x, BH / 2 + 0.05, z); o.scale.set(s, 0.08 + rr() * 0.06, s * (0.6 + rr() * 0.6)); o.rotation.y = rr() < 0.15 ? Math.PI / 4 : 0; o.updateMatrix(); chips.setMatrixAt(n++, o.matrix);
  }
  if (li === 2) { for (let gx = -2; gx <= 2; gx++) for (let gz = -2; gz <= 2; gz++) { if (Math.max(Math.abs(gx), Math.abs(gz)) !== 2 || n >= nChip + 16) continue; o.position.set(gx * 1.55, BH / 2 + 0.06, gz * 1.55); o.scale.set(0.95, 0.1, 0.95); o.rotation.y = 0; o.updateMatrix(); chips.setMatrixAt(n++, o.matrix); } }
  chips.count = n; group.add(chips);
  let cchip = null;
  if (li === 0) cchip = addCenterChip(group, 2.1, 24, 1.0, 0);
  if (li === 1) cchip = addCenterChip(group, 1.25, 14, 0.7, 1);
  if (li === 2) cchip = addCenterChip(group, 0.85, 10, 0.55, 2);
  layers.push({ li, group, board, ov, ovMat, edge, chips, cchip, orbitGroup: null, rings: [] });
}

// ---------------------------------------------------------------- pillars, collars, glass cylinder, axis
const pillarCore = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.026, 0.026, 1, 10, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.16, 0.38, 1.35) }), PILLARS.length);
const pillarGlowMat = fresnelMat(new THREE.Color(0.15, 0.45, 1.6), { inv: true, i: 0.08 });
const pillarGlow = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.13, 0.13, 1, 14, 1, true), pillarGlowMat, PILLARS.length);
pillarGlow.renderOrder = 3; scene.add(pillarCore, pillarGlow);
const collars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.2, 18), new THREE.MeshStandardMaterial({ color: 0x0b1724, emissive: new THREE.Color(0.1, 0.4, 1.4), metalness: 0.8, roughness: 0.3 }), PILLARS.length * NL);
scene.add(collars);
const feet = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.7, 2.0) }), PILLARS.length); scene.add(feet);
const glassMat = fresnelMat(new THREE.Color(0.12, 0.5, 1.0), { p: 3.2, b: 0.0, i: 0.12, side: THREE.DoubleSide, c2: new THREE.Color(0.5, 0.8, 1.6) });
const glass = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 96, 1, true), glassMat); glass.renderOrder = 3; scene.add(glass);
const glassRimMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.9, 2.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const rimTop = new THREE.Mesh(new THREE.RingGeometry(0.993, 1.0, 160).rotateX(-Math.PI / 2), glassRimMat), rimBot = rimTop.clone(); scene.add(rimTop, rimBot);
const axisCore = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.7, 1.3, 2.8) }));
const axisGlowMat = fresnelMat(new THREE.Color(0.3, 0.7, 2.2), { inv: true, i: 0.7 });
const axisGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1, 16, 1, true), axisGlowMat); axisGlow.renderOrder = 3;
scene.add(axisCore, axisGlow);
let geomS = -1;
function layoutStack() {
  const o = new THREE.Object3D();
  for (const L of layers) L.group.position.y = layerY(L.li);
  const top = layerY(0) + 0.35, bot = layerY(3) - 0.95; const H = top - bot;
  PILLARS.forEach(([x, z], i) => {
    o.position.set(x, (top + bot) / 2, z); o.scale.set(1, H, 1); o.updateMatrix(); pillarCore.setMatrixAt(i, o.matrix); pillarGlow.setMatrixAt(i, o.matrix);
    o.position.set(x, bot, z); o.scale.set(1, 1, 1); o.updateMatrix(); feet.setMatrixAt(i, o.matrix);
    for (let l = 0; l < NL; l++) { o.position.set(x, layerY(l), z); o.updateMatrix(); collars.setMatrixAt(i * NL + l, o.matrix); }
  });
  pillarCore.instanceMatrix.needsUpdate = pillarGlow.instanceMatrix.needsUpdate = feet.instanceMatrix.needsUpdate = collars.instanceMatrix.needsUpdate = true;
  const gt = layerY(0) + 0.6, gb = layerY(3) - 0.15;
  const GR = Math.min(4.62, 4.4 * coreScale);
  glass.position.y = (gt + gb) / 2; glass.scale.set(GR, gt - gb, GR);
  rimTop.position.y = gt; rimBot.position.y = gb; rimTop.scale.setScalar(GR); rimBot.scale.setScalar(GR);
  const at = layerY(0) + 1.6, ab = layerY(3) + 0.1;
  axisCore.position.y = axisGlow.position.y = (at + ab) / 2; axisCore.scale.y = axisGlow.scale.y = at - ab;
  geomS = S;
}

// ---------------------------------------------------------------- core (L04)
const coreG = new THREE.Group(); layers[3].group.add(coreG); coreG.position.y = CORE_Y;
const coreShellMat = fresnelMat(new THREE.Color(0.15, 0.4, 1.6), { p: 2.2, b: 0.04, i: 1, grid: 1, c2: new THREE.Color(0.6, 0.9, 2.2) });
const coreShell = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 40), coreShellMat); coreShell.renderOrder = 4; coreG.add(coreShell);
const coreInnerMat = fresnelMat(new THREE.Color(0.2, 0.5, 2.0), { p: 1.2, b: 0.25, i: 0.6, side: THREE.BackSide });
const coreInner = new THREE.Mesh(new THREE.SphereGeometry(0.98, 40, 24), coreInnerMat); coreInner.renderOrder = 4; coreG.add(coreInner);
const coreHot = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.7, 3.0) })); coreG.add(coreHot);
const lobes = [];
for (let i = 0; i < 3; i++) {
  const m = fresnelMat(i === 1 ? new THREE.Color(0.35, 0.2, 1.4) : new THREE.Color(0.12, 0.3, 1.4), { p: 1.6, b: 0.02, i: 0.38, c2: new THREE.Color(0.4, 0.7, 1.8) });
  const lob = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 24), m); lob.scale.set(1.75, 0.5, 0.95); lob.rotation.y = i * Math.PI / 3; lob.renderOrder = 4; coreG.add(lob); lobes.push(lob);
}
const coreLines = [];
for (let i = 0; i < 3; i++) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: [C.cy, C.vi, C.bl][i].clone().multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  t.rotation.set(Math.PI / 2 + (i - 1) * 0.5, i * 1.1, 0); coreG.add(t); coreLines.push(t);
}
const coreLight = new THREE.PointLight(0x3a8bff, 18, 9, 2); coreG.add(coreLight);
const topLight = new THREE.PointLight(0x3ad6ff, 6, 6, 2); layers[0].group.add(topLight); topLight.position.y = 1.2;
const fractal = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), edgeBoxMat(0.42), 220);
fractal.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(220 * 3), 3);
{
  const o = new THREE.Object3D(); let n = 0; const c = new THREE.Color();
  const rec = (x, z, s, d, y) => {
    if (n >= 220) return; o.position.set(x, y, z); o.scale.set(s, 0.05, s); o.updateMatrix(); fractal.setMatrixAt(n, o.matrix);
    c.setRGB(1.0, 0.62, 0.18).multiplyScalar(0.35 + d * 0.22); fractal.setColorAt(n, c); n++;
    if (d >= 3) return;
    rec(x, z, s * 0.64, d + 1, y - 0.13);
    if (d < 2) for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) rec(x + sx * s * 0.36, z + sz * s * 0.36, s * 0.22, d + 2, y - 0.07);
  };
  rec(0, 0, 2.9, 0, BH / 2 + 0.03);
  fractal.count = n; fractal.renderOrder = 3; layers[3].group.add(fractal);
}

// ---------------------------------------------------------------- orbs + fx points
const ORB_CAP = 900;
const orbMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vC; void main(){ vC=instanceColor; vec4 mv=modelViewMatrix*instanceMatrix*vec4(position,1.0); vN=normalize(normalMatrix*mat3(instanceMatrix)*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying vec3 vV; varying vec3 vC; void main(){ vec3 n=normalize(vN); float nv=max(dot(n,normalize(vV)),0.0); float f=pow(1.0-nv,2.0);
   vec3 L=normalize(vec3(-0.4,0.8,0.5)); float sp=pow(max(dot(reflect(-L,n),normalize(vV)),0.0),28.0);
   vec3 c = vC*(0.16+0.42*pow(nv,2.0)) + vC*f*1.15 + vec3(sp)*0.35; gl_FragColor=vec4(c,1.0); }`
});
const orbs = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 20, 14), orbMat, ORB_CAP);
orbs.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(ORB_CAP * 3), 3);
orbs.frustumCulled = false; orbs.count = 0; scene.add(orbs);
const FX_CAP = 3200;
const fxPos = new Float32Array(FX_CAP * 3), fxCol = new Float32Array(FX_CAP * 3), fxSize = new Float32Array(FX_CAP);
const fxGeo = new THREE.BufferGeometry();
fxGeo.setAttribute('position', new THREE.BufferAttribute(fxPos, 3).setUsage(THREE.DynamicDrawUsage));
fxGeo.setAttribute('color', new THREE.BufferAttribute(fxCol, 3).setUsage(THREE.DynamicDrawUsage));
fxGeo.setAttribute('size', new THREE.BufferAttribute(fxSize, 1).setUsage(THREE.DynamicDrawUsage));
const fxMat = new THREE.ShaderMaterial({
  uniforms: { uH: { value: 800 }, uMax: { value: 256 } },
  vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; uniform float uH,uMax; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vC=color*clamp((-mv.z-0.3)/3.2,0.0,1.0); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*uH/max(-mv.z,0.05),0.0,uMax); }`,
  fragmentShader: `varying vec3 vC; void main(){ vec2 p=gl_PointCoord-0.5; float d=length(p)*2.0; if(d>1.0) discard; float a=exp(-d*d*6.0)*(1.0-d); float c=pow(max(0.0,1.0-d*3.2),2.0); gl_FragColor=vec4(vC*a + vC*c*1.4 + vec3(c)*0.5*min(length(vC),1.0),1.0); }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});
const fx = new THREE.Points(fxGeo, fxMat); fx.frustumCulled = false; fx.renderOrder = 6; scene.add(fx);
let fxN = 0;
function fxPush(x, y, z, c, k, size) { if (fxN >= FX_CAP) return; const i = fxN * 3; fxPos[i] = x; fxPos[i + 1] = y; fxPos[i + 2] = z; fxCol[i] = c.r * k; fxCol[i + 1] = c.g * k; fxCol[i + 2] = c.b * k; fxSize[fxN] = size; fxN++; }

// ---------------------------------------------------------------- orbits (energy dynamic)
let orbList = [];
const ORBIT_COLS = () => (SEM.orbits && SEM.orbits.length ? SEM.orbits : [{ color: '#3ad6ff' }, { color: '#7a5cff' }, { color: '#ffc24a' }, { color: '#3dff9a' }]).map(o => new THREE.Color(o.color));
function buildOrbits() {
  const pal = ORBIT_COLS(); orbList = [];
  const rr = rng(4242);
  for (const L of layers) {
    if (L.orbitGroup) { L.group.remove(L.orbitGroup); L.orbitGroup.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); }
    const g = new THREE.Group(); L.orbitGroup = g; L.group.add(g); L.rings = [];
    const li = L.li; const nR = Math.max(1, Math.round([2, 3, 4, 5][li] * clamp(density, 0.4, 1.5)));
    const planeY = li === 3 ? CORE_Y : 0.5;
    for (let k = 0; k < nR; k++) {
      const r = Math.min(4.55, (li === 3 ? 1.45 + 2.9 * (k + 1) / nR : 1.1 + 3.25 * (k + 1) / nR) * coreScale);
      const c = pal[(k + li) % pal.length].clone();
      const w = 0.011 + 0.004 * li;
      const ring = new THREE.Mesh(new THREE.RingGeometry(r - w, r + w, 200).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      const tilt = li === 3 ? (k % 2 ? 1 : -1) * (0.05 + 0.04 * k) : 0;
      ring.position.y = planeY; ring.rotation.set(tilt, 0, li === 3 ? tilt * 0.6 : 0); ring.renderOrder = 3; g.add(ring);
      ring.updateMatrix();
      L.rings.push({ r, c, mesh: ring, m: ring.matrix.clone() });
      const base = Math.round((3 + li * 2.2 + k * 1.3) * density) + (li === 3 ? 6 : 0);
      const maxN = Math.round(base * (li === 3 ? 1.8 : 1.25)) + 2;
      const dir = (k + li) % 2 ? 1 : -1;
      for (let j = 0; j < maxN; j++) {
        const cc = rr() < 0.72 ? c : pal[(rr() * pal.length) | 0];
        orbList.push({ li, k, rank: j, base, a0: j / maxN * Math.PI * 2 + rr() * 0.4, w: dir * (0.12 + 0.1 * li) / Math.sqrt(r) * (0.8 + rr() * 0.4), r, size: (0.05 + rr() * 0.07) * (1 + 0.15 * li) * Math.sqrt(coreScale), c: cc.clone(), m: L.rings[k].m, bob: rr() * 6.28 });
      }
    }
  }
  buildConcepts();
}

// ---------------------------------------------------------------- network graph (L02)
const net = { nodes: [], edges: [], adj: [] };
{
  const r = rng(77); const pts = [];
  let guard = 0;
  while (pts.length < 26 && guard++ < 4000) { const a = r() * 6.283, d = 0.9 + Math.sqrt(r()) * 3.5; const p = [Math.cos(a) * d, Math.sin(a) * d]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.85)) pts.push(p); }
  net.nodes = pts.map(([x, z]) => ({ x, z, act: 0 })); net.adj = pts.map(() => []);
  const seen = new Set();
  pts.forEach((p, i) => {
    const near = pts.map((q, j) => [j, Math.hypot(q[0] - p[0], q[1] - p[1])]).filter(v => v[0] !== i).sort((a, b) => a[1] - b[1]).slice(0, 3);
    for (const [j] of near) {
      const key = i < j ? i + '-' + j : j + '-' + i; if (seen.has(key)) continue; seen.add(key);
      const a = net.nodes[i], b = net.nodes[j]; const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz);
      const cx = (a.x + b.x) / 2 - dz / len * (r() - 0.5) * len * 0.5, cz = (a.z + b.z) / 2 + dx / len * (r() - 0.5) * len * 0.5;
      const sp = []; for (let t = 0; t <= 1.0001; t += 1 / 8) { const u = 1 - t; sp.push([u * u * a.x + 2 * u * t * cx + t * t * b.x, u * u * a.z + 2 * u * t * cz + t * t * b.z]); }
      const e = { a: i, b: j, w: 0.04, flash: 0, sp }; net.edges.push(e); net.adj[i].push(e); net.adj[j].push(e);
    }
  });
}
const SEGS = 8;
const edgeMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), net.edges.length * SEGS);
edgeMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(net.edges.length * SEGS * 3), 3);
edgeMesh.renderOrder = 3; edgeMesh.frustumCulled = false; layers[1].group.add(edgeMesh);
function updateEdges() {
  const o = new THREE.Object3D(); const c = new THREE.Color(); let n = 0;
  for (const e of net.edges) {
    const width = 0.008 + e.w * 0.07 + e.flash * 0.03;
    c.copy(C.bl).lerp(C.cy, clamp(e.w * 1.3, 0, 1)).lerp(C.vi, clamp((e.w - 0.6) * 1.5, 0, 0.6)).multiplyScalar((0.12 + e.w * 1.1 + e.flash * 1.6) * flux);
    for (let s = 0; s < SEGS; s++) {
      const [x0, z0] = e.sp[s], [x1, z1] = e.sp[s + 1]; const dx = x1 - x0, dz = z1 - z0;
      o.position.set((x0 + x1) / 2, BH / 2 + 0.03, (z0 + z1) / 2); o.rotation.set(0, -Math.atan2(dz, dx), 0); o.scale.set(Math.hypot(dx, dz) * 1.04, 1, width); o.updateMatrix(); edgeMesh.setMatrixAt(n, o.matrix); edgeMesh.setColorAt(n, c); n++;
    }
  }
  edgeMesh.instanceMatrix.needsUpdate = true; edgeMesh.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------- memory (L03)
const MEM_SLOTS = [];
{ for (let gx = -4; gx <= 4; gx++) for (let gz = -4; gz <= 4; gz++) { const x = gx * 0.62, z = gz * 0.62, d = Math.hypot(x, z); if (d > 1.0 && d < 2.85) MEM_SLOTS.push([x, z, Math.atan2(z, x)]); } MEM_SLOTS.sort((a, b) => a[2] - b[2]); }
const memMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), edgeBoxMat(0.75), MEM_SLOTS.length);
memMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MEM_SLOTS.length * 3), 3);
memMesh.count = 0; memMesh.renderOrder = 3; memMesh.frustumCulled = false; layers[2].group.add(memMesh);
const memory = { counts: new Map(), stored: [], byKey: new Map() };
function updateMem(t) {
  const o = new THREE.Object3D(); const c = new THREE.Color();
  memory.stored.forEach((m, i) => {
    const h = 0.22 + Math.min(0.55, m.hits * 0.06); m.h = lerp(m.h || 0.02, h, 0.08);
    o.position.set(m.x, BH / 2 + m.h / 2 + 0.02, m.z); o.scale.set(0.5, m.h, 0.5); o.updateMatrix(); memMesh.setMatrixAt(i, o.matrix);
    c.copy(m.gold ? C.au : C.vi).lerp(C.pk, m.gold ? 0 : 0.2).multiplyScalar((0.45 + m.flash * 1.8 + 0.12 * Math.sin(t * 1.3 + i)) * flux); memMesh.setColorAt(i, c);
  });
  memMesh.count = memory.stored.length; memMesh.instanceMatrix.needsUpdate = true; memMesh.instanceColor.needsUpdate = true;
}

// ---------------------------------------------------------------- pulses (semantic simulation)
const pulses = [];
const sim = { E: 0.35, loop: 0, sigTimes: [], spawnTimes: [], tSpawn: 0, tAmb: 0, tReplay: 3, tAxis: 0, threshold: 0.42, noise: 0, chipFlash: 0, arrivals: 0, axisP: [] };
const tmpV = new THREE.Vector3();
let simT = 0, diveBoost = 0;
const wp = (x, z, l, yo = 0.12) => ({ x, z, l, yo });
const wpPos = (w, out) => out.set(w.x, layerY(w.l) + w.yo, w.z);
function nearestPillar(x, z, inner = false) { let best = 0, bd = 1e9; (inner ? INNER_P : PILLARS.map((_, i) => i)).forEach(i => { const d = Math.hypot(PILLARS[i][0] - x, PILLARS[i][1] - z); if (d < bd) { bd = d; best = i; } }); return PILLARS[best]; }
function spawnPulse(pts, opt) { const p = Object.assign({ pts, seg: 0, u: 0, speed: 2.4, c: C.cy, size: 0.32, k: 1.4, trail: [], life: 0, fade: 1, onDone: null }, opt); pulses.push(p); sim.spawnTimes.push(simT); return p; }
function spawnStimulus() {
  const s = R0() * 4 | 0, o = (R0() - 0.5) * 7.2; const x = s === 0 ? 4.75 : s === 1 ? -4.75 : o, z = s === 2 ? 4.75 : s === 3 ? -4.75 : o;
  const strength = R0() + sim.loop * 0.25; const pass = strength > sim.threshold;
  const ch = 1.15; const tx = s === 0 ? ch : s === 1 ? -ch : clamp(o * 0.35, -0.95, 0.95), tz = s === 2 ? ch : s === 3 ? -ch : clamp(o * 0.35, -0.95, 0.95);
  const ax = x * (s < 2 ? 0.62 : 1), az = z * (s >= 2 ? 0.62 : 1);
  const bx = s < 2 ? tx + Math.sign(x) * 0.35 : tx, bz = s >= 2 ? tz + Math.sign(z) * 0.35 : tz;
  const pts = [wp(x, z, 0, 0.1), wp(ax, az, 0, 0.1), wp(bx, bz, 0, 0.1), wp(tx, tz, 0, 0.1)];
  if (!pass) { sim.noise++; spawnPulse(pts.slice(0, 2 + (R0() < 0.5 ? 1 : 0)), { c: new THREE.Color(0.5, 0.6, 0.75), size: 0.18, k: 0.7, speed: 1.8, fade: 0.6 }); return; }
  spawnPulse(pts, { c: C.cy, size: 0.3, speed: 2.2 + strength, onDone: () => { sim.chipFlash = 1; sim.sigTimes.push(simT); toNetwork(tx, tz); } });
}
function toNetwork(x, z) {
  const P = nearestPillar(x, z, true); let bi = 0, bd = 1e9; net.nodes.forEach((n, i) => { const d = Math.hypot(n.x - P[0], n.z - P[1]); if (d < bd) { bd = d; bi = i; } });
  const nd = net.nodes[bi];
  spawnPulse([wp(x, z, 0, 0.1), wp(P[0], P[1], 0, 0.1), wp(P[0], P[1], 1, 0.12), wp(nd.x, nd.z, 1, 0.1)], { c: C.cy, size: 0.3, speed: 3.2, onDone: () => netHop(bi, [bi], 2 + (R0() * 3 | 0)) });
}
function netHop(i, path, hops) {
  net.nodes[i].act = 1;
  if (hops <= 0) { const key = Math.min(path[0], i) + '·' + Math.max(path[0], i); toMemory(net.nodes[i].x, net.nodes[i].z, key, path[0]); return; }
  const prev = path.length > 1 ? path[path.length - 2] : -1;
  const opts = net.adj[i].filter(e => (e.a === i ? e.b : e.a) !== prev); if (!opts.length) { toMemory(net.nodes[i].x, net.nodes[i].z, i + '·' + i, path[0]); return; }
  let tot = 0; for (const e of opts) tot += Math.pow(e.w + 0.12, 2); let pick = R0() * tot, e = opts[0]; for (const o of opts) { pick -= Math.pow(o.w + 0.12, 2); if (pick <= 0) { e = o; break; } }
  const j = e.a === i ? e.b : e.a; const sp = e.a === i ? e.sp : [...e.sp].reverse();
  spawnPulse(sp.map(([x, z]) => wp(x, z, 1, 0.1)), { c: C.cy.clone().lerp(C.vi, clamp(e.w, 0, 1) * 0.7), size: 0.28, speed: 2.6, onDone: () => { e.w = Math.min(1, e.w + 0.11); e.flash = 1; netHop(j, [...path, j], hops - 1); } });
}
function toMemory(x, z, key, startNode) {
  const P = nearestPillar(x, z);
  spawnPulse([wp(x, z, 1, 0.1), wp(P[0], P[1], 1, 0.1), wp(P[0], P[1], 2, 0.12)], { c: C.vi, size: 0.3, speed: 3.4, onDone: () => memArrive(P, key, startNode) });
}
function memArrive(P, key, startNode) {
  const cnt = (memory.counts.get(key) || 0) + 1; memory.counts.set(key, cnt);
  let m = memory.byKey.get(key);
  if (!m && cnt >= 3) {
    if (memory.stored.length >= MEM_SLOTS.length) { const weakest = memory.stored.reduce((a, b) => a.hits < b.hits ? a : b); memory.byKey.delete(weakest.key); weakest.key = key; weakest.hits = 1; weakest.flash = 1; weakest.h = 0.02; weakest.start = startNode; memory.byKey.set(key, weakest); m = weakest; }
    else {
      const used = new Set(memory.stored.map(q => q.slot)); let si = (memory.stored.length * 7) % MEM_SLOTS.length; while (used.has(si)) si = (si + 1) % MEM_SLOTS.length; const slot = MEM_SLOTS[si];
      m = { key, x: slot[0], z: slot[1], slot: si, hits: 1, flash: 1, gold: R0() < 0.55, start: startNode, h: 0.02 }; memory.stored.push(m); memory.byKey.set(key, m);
    }
  } else if (m) { m.hits++; m.flash = 1; if (R0() < 0.5) replay(m); }
  const sx = m ? m.x : P[0] * 0.7, sz = m ? m.z : P[1] * 0.7; const IP = nearestPillar(sx, sz, true);
  spawnPulse([wp(P[0], P[1], 2, 0.12), wp(sx, sz, 2, 0.3), wp(sx * 1.25, sz * 1.25, 2, 0.12), wp(IP[0], IP[1], 2, 0.1)], {
    c: m && m.gold ? C.au : C.vi, size: 0.3, speed: 2.6, onDone: () => toCore(IP[0], IP[1])
  });
}
function replay(m) {
  const P = nearestPillar(m.x, m.z, true); const s = m.start || 0; const nd = net.nodes[s];
  spawnPulse([wp(m.x, m.z, 2, 0.3), wp(P[0], P[1], 2, 0.12), wp(P[0], P[1], 1, 0.12), wp(nd.x, nd.z, 1, 0.1)], { c: C.au, size: 0.26, speed: 3.0, k: 1.2, onDone: () => { net.nodes[s].act = 1; for (const e of net.adj[s]) e.w = Math.min(1, e.w + 0.04); } });
}
function toCore(x, z) {
  spawnPulse([wp(x, z, 2, 0.1), wp(x, z, 3, CORE_Y * 0.6), wp(x * 0.3, z * 0.3, 3, CORE_Y), wp(0, 0, 3, CORE_Y)], { c: C.gr.clone().lerp(C.cy, 0.3), size: 0.34, speed: 2.8, onDone: () => { sim.E = Math.min(1, sim.E + 0.028); sim.arrivals++; } });
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function stepSim(dt, visual = true) {
  simT += dt;
  const rate = (1.6 + sim.loop * 2.2) * (0.25 + 0.75 * flux);
  sim.tSpawn -= dt; if (sim.tSpawn <= 0) { sim.tSpawn = (0.5 + R0()) / rate; spawnStimulus(); }
  sim.tAmb -= dt; if (sim.tAmb <= 0 && flux > 0.02) {
    sim.tAmb = (0.3 + R0() * 0.5) / (0.4 + flux); const P = PILLARS[R0() * PILLARS.length | 0]; const l = R0() * 3 | 0; const up = R0() < 0.3;
    spawnPulse(up ? [wp(P[0], P[1], l + 1, 0), wp(P[0], P[1], l, 0)] : [wp(P[0], P[1], l, 0), wp(P[0], P[1], l + 1, 0)], { c: up ? C.au : C.cy, size: 0.26, speed: 3.6 + R0() * 2, k: 1.1 });
  }
  sim.tReplay -= dt; if (sim.tReplay <= 0) { sim.tReplay = 2.5 + R0() * 4; if (memory.stored.length) { const m = memory.stored[R0() * memory.stored.length | 0]; m.flash = 1; replay(m); } }
  sim.E = Math.max(0, sim.E - sim.E * 0.035 * dt);
  sim.tAxis -= dt; if (sim.tAxis <= 0) { sim.tAxis = 1 / (2 + sim.E * 9); sim.axisP.push({ y: 0, v: (1.6 + sim.E * 2.5 + R0()) / 9, c: R0() < 0.2 ? C.gr : R0() < 0.4 ? C.vi : C.cy }); }
  for (let i = sim.axisP.length - 1; i >= 0; i--) { const a = sim.axisP[i]; a.y += a.v * dt; if (a.y > 1) { sim.axisP.splice(i, 1); sim.loop = Math.min(1, sim.loop + 0.012); } }
  sim.loop = Math.max(0, sim.loop - 0.04 * dt);
  for (const e of net.edges) { e.w = Math.max(0.03, e.w - 0.0045 * dt); e.flash = Math.max(0, e.flash - dt * 2.5); }
  for (const n of net.nodes) n.act = Math.max(0, n.act - dt * 2);
  for (const m of memory.stored) m.flash = Math.max(0, m.flash - dt * 1.6);
  sim.chipFlash = Math.max(0, sim.chipFlash - dt * 2.5);
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i]; if (!p) continue; p.life += dt;
    let move = p.speed * dt * (1 + diveBoost * 0.3);
    while (move > 0 && p.seg < p.pts.length - 1) {
      wpPos(p.pts[p.seg], _a); wpPos(p.pts[p.seg + 1], _b); const L = Math.max(1e-4, _a.distanceTo(_b));
      const rem = (1 - p.u) * L; if (move < rem) { p.u += move / L; move = 0; } else { move -= rem; p.u = 0; p.seg++; }
    }
    if (p.seg >= p.pts.length - 1) { pulses.splice(i, 1); if (p.onDone) p.onDone(p); continue; }
    if (visual) { wpPos(p.pts[p.seg], _a); wpPos(p.pts[p.seg + 1], _b); _a.lerp(_b, p.u); p.trail.unshift(_a.x, _a.y, _a.z); if (p.trail.length > 15) p.trail.length = 15; p.pos = p.pos || new THREE.Vector3(); p.pos.copy(_a); }
  }
  const cut = simT - 3; while (sim.sigTimes.length && sim.sigTimes[0] < cut) sim.sigTimes.shift(); while (sim.spawnTimes.length && sim.spawnTimes[0] < cut) sim.spawnTimes.shift();
}

// ---------------------------------------------------------------- concepts (labels) + links
const labelsEl = $('labels');
let concepts = [];
let links = [];
const linkGroup = new THREE.Group(); scene.add(linkGroup);
function splitTerms(s) { const [head, rest] = s.split(':'); const terms = head.split(/,| und /).map(t => t.trim()).filter(Boolean); if (rest && terms.length === 1) terms.push(rest.trim()); return terms.slice(0, 4); }
function buildConcepts() {
  labelsEl.innerHTML = ''; concepts = [];
  SEM.layers.forEach((Ld, li) => {
    const gen = Ld.nodes || []; const lt = splitTerms(Ld[lens] || '');
    const all = [...gen.map(n => ({ n, lens: false })), ...lt.map(n => ({ n, lens: true }))];
    const N = all.length; const rad = Math.min(4.4, [3.75, 3.45, 3.25, 2.45][li] * Math.min(coreScale, li === 3 ? 1.25 : 1.15));
    all.forEach((it, j) => {
      const ang = j / N * Math.PI * 2 + li * 0.85 + 0.3; const rr = it.lens ? rad * 0.8 : rad;
      const pos = new THREE.Vector3(Math.cos(ang) * rr, (li === 3 ? CORE_Y + (j % 2 ? 0.35 : -0.25) : 0.55) + (it.lens ? 0.25 : 0), Math.sin(ang) * rr);
      const el = document.createElement('div'); el.className = 'nd' + (it.lens ? ' lens' : ''); el.textContent = it.n; labelsEl.appendChild(el);
      concepts.push({ name: it.n, li, pos, el, lens: it.lens, o: 0 });
    });
  });
  buildLinks();
}
const linkMatBase = () => new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uH: { value: 0 }, uO: { value: 0 }, uF: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform float uT,uH,uO,uF; uniform vec3 uA,uB; varying vec2 vUv; void main(){ float ph=fract(uT*0.22+uO); float w=fract(ph-vUv.x); float pulse=exp(-w*14.0)*1.8 + exp(-w*60.0)*2.0;
   float ends=smoothstep(0.0,0.06,vUv.x)*smoothstep(1.0,0.94,vUv.x); vec3 c=mix(uA,uB,vUv.x)*(0.22+pulse+uH*1.2)*ends*uF; gl_FragColor=vec4(c,1.0);}`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});
let linkS = -1;
function conceptWorld(c, out) { return out.set(c.pos.x, c.pos.y + layerY(c.li), c.pos.z); }
function buildLinks() {
  linkGroup.children.slice().forEach(m => { linkGroup.remove(m); m.geometry.dispose(); m.material.dispose(); });
  const old = links; links = [];
  (SEM.links || []).forEach(([an, bn, text], i) => {
    const A = concepts.find(c => c.name === an), B = concepts.find(c => c.name === bn); if (!A || !B) return;
    A.el.classList.add('lk'); B.el.classList.add('lk');
    const pa = conceptWorld(A, new THREE.Vector3()), pb = conceptWorld(B, new THREE.Vector3());
    const oa = new THREE.Vector3(pa.x, 0, pa.z).normalize().multiplyScalar(1.6), ob = new THREE.Vector3(pb.x, 0, pb.z).normalize().multiplyScalar(1.6);
    const curve = new THREE.CubicBezierCurve3(pa, pa.clone().add(oa), pb.clone().add(ob), pb);
    const mat = linkMatBase(); mat.uniforms.uO.value = i * 0.27;
    const ca = new THREE.Color(SEM.layers[A.li].color), cb = new THREE.Color(SEM.layers[B.li].color);
    mat.uniforms.uA.value.copy(ca).multiplyScalar(1.4); mat.uniforms.uB.value.copy(cb).multiplyScalar(1.4);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.02, 6, false), mat); tube.renderOrder = 5;
    const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.32, 5, false), new THREE.MeshBasicMaterial({ visible: false }));
    linkGroup.add(tube, hit);
    const L = { a: an, b: bn, text, curve, tube, hit, mat, i, ca, cb, hover: old[i] ? old[i].hover : 0, hoverT: old[i] ? old[i].hoverT : 0 }; hit.userData.link = L; links.push(L);
  });
  linkS = S;
}

// ---------------------------------------------------------------- HUD
const stackEl = $('stack');
const svgNS = 'http://www.w3.org/2000/svg';
const leads = document.createElementNS(svgNS, 'svg'); leads.setAttribute('id', 'leads'); leads.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible';
$('hud').insertBefore(leads, $('hud').firstChild);
const leadPaths = [];
const L2 = i => String(i + 1).padStart(2, '0');
function buildHUD() {
  stackEl.innerHTML = '';
  SEM.layers.forEach((L, i) => {
    const d = document.createElement('div'); d.className = 'ly'; d.style.setProperty('--lc', L.color);
    d.innerHTML = `<div class="n"><span class="k"></span><span class="lw">LAYER </span>${L2(i)}<span class="lw"> //</span> ${L.name}<span class="lw">:</span></div><div class="t">${L.tagline}</div>`;
    d.addEventListener('click', e => { e.stopPropagation(); lastInteract = performance.now(); selectLayer(i, true); });
    stackEl.appendChild(d);
    const p = document.createElementNS(svgNS, 'polyline'); p.setAttribute('fill', 'none'); p.setAttribute('stroke', 'rgba(200,220,240,0.16)'); p.setAttribute('stroke-width', '1'); leads.appendChild(p);
    const dot = document.createElementNS(svgNS, 'circle'); dot.setAttribute('r', '2'); dot.setAttribute('fill', L.color); dot.setAttribute('cx', -10); leads.appendChild(dot); p.dot = dot; leadPaths.push(p);
  });
  if (SEM.intro) $('intro').textContent = SEM.intro;
  setLens(lens);
}
function setLens(l) {
  lens = l; document.documentElement.style.setProperty('--acc', LENS_ACC[l]);
  document.querySelectorAll('#lens button').forEach(b => b.classList.toggle('on', b.dataset.lens === l));
  const ax = SEM.axes && SEM.axes[l] ? SEM.axes[l] : SEM.layers.map(L => (L.machine || '').split(',')[0].trim());
  $('axes').innerHTML = `<b>${l.toUpperCase()}</b> · ` + ax.join(' · ');
  coreShellMat.uniforms.uC2.value.set(LENS_ACC[l]).multiplyScalar(1.6);
  buildConcepts();
  if (selected != null) { showInfo(selected); layers[selected].edge.material.color.set(LENS_ACC[l]); }
}

// ---------------------------------------------------------------- selection + info
let selected = null;
function selectLayer(i, focus) {
  selected = i;
  [...stackEl.children].forEach((d, j) => d.classList.toggle('on', j === i));
  layers.forEach((L, j) => { L.edge.material.opacity = j === i ? 0.95 : 0.4; L.edge.material.color.set(j === i ? LENS_ACC[lens] : '#5fb8ff'); });
  showInfo(i);
  if (focus && mode === 'orbit') { orbit.focus = i; orbit.distT = Math.min(orbit.distT, fitDist() * 0.8); }
  if (focus && mode === 'walk' && walk.levelT !== i) { walk.levelT = i; }
}
function showInfo(i) {
  const L = SEM.layers[i];
  $('info').classList.remove('hide');
  $('iT').textContent = `LAYER ${L2(i)} // ${L.name}`; $('iG').textContent = L.tagline;
  $('iL').textContent = `${lens.toUpperCase()} · ${L[lens]}`;
  $('iH').textContent = L.hover;
  const lk = (SEM.links || []).filter(([a, b]) => L.nodes.includes(a) || L.nodes.includes(b)).map(([a, b, t]) => `<div class="lkr" style="grid-column:1/3;display:block;color:var(--mid);margin-top:3px">${a} → ${b}: <span style="color:#fff">${t}</span></div>`).join('');
  $('info').dataset.layer = i; infoLinks = lk;
  renderInfoMetrics();
}
let infoLinks = '';
function renderInfoMetrics() {
  if ($('info').classList.contains('hide')) return; const i = +$('info').dataset.layer;
  const v = metricsNow(); const hl = ['sig', 'con', 'pat', 'E'][i];
  const row = (k, label, val) => `<div class="${hl === k ? 'hl' : ''}"><span>${label}</span><i>${val}</i></div>`;
  $('iM').innerHTML = row('sig', 'SIGNALE/S', v.sig.toFixed(1)) + row('con', 'VERBINDUNGEN', v.con) + row('pat', 'MUSTER', v.pat) + row('E', 'KERNENERGIE', Math.round(v.E * 100) + '%') + infoLinks;
}
function closeInfo() { $('info').classList.add('hide'); selected = null; orbit.focus = null; [...stackEl.children].forEach(d => d.classList.remove('on')); layers.forEach(L => { L.edge.material.opacity = 0.45; L.edge.material.color.set('#5fb8ff'); }); }
$('infoX').addEventListener('click', closeInfo);
function metricsNow() { return { sig: sim.sigTimes.length / 3, con: net.edges.filter(e => e.w > 0.2).length, pat: memory.stored.length, E: sim.E, orbs: orbs.count + pulses.length, rate: sim.spawnTimes.length / 3 }; }

// ---------------------------------------------------------------- camera system
let mode = 'orbit';
const orbit = { yaw: 0.72, pitch: 0.42, dist: 30, yawT: 0.72, pitchT: 0.42, distT: 30, ty: 0, focus: null };
const walk = { pos: new THREE.Vector3(), yaw: 0, pitch: 0, level: 1, levelT: 1, vy: 0, jumpY: 0 };
const cine = { t: 0, curve: null, S: -1, dur: 46 };
const dive = { t: 0, curve: null, durs: [], done: false, look: [], seg: -1, yaw: 0, pitch: 0 };
const trans = { t: 1, fromP: new THREE.Vector3(), fromQ: new THREE.Quaternion(), dur: 1.3 };
let lastInteract = performance.now();
const UP = new THREE.Vector3(0, 1, 0), _mat = new THREE.Matrix4(), _eul = new THREE.Euler(0, 0, 0, 'YXZ');
function fitDist() {
  const vf = camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * camera.aspect);
  const rh = camera.aspect < 1 ? 7.9 : 7.2, rv = 1.5 * S + 2.6; return Math.max(rh / Math.tan(hf / 2), rv / Math.tan(vf / 2)) + 1.5;
}
function beginTrans(d = 1.3) { trans.t = 0; trans.dur = d; trans.fromP.copy(camera.position); trans.fromQ.copy(camera.quaternion); }
function setMode(m, opt = {}) {
  if (m === mode && !opt.force) return;
  const prev = mode; mode = m; document.body.dataset.mode = m; if (m !== 'dive') diveBoost = 0;
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('walkui').classList.toggle('hide', m !== 'walk');
  $('bEnter').classList.toggle('on', m === 'dive');
  $('mM').textContent = { orbit: 'ORBIT', walk: 'BEGEHEN', cine: 'KAMERAFAHRT', dive: 'ENTER' }[m];
  if (m === 'orbit') {
    const tgt = new THREE.Vector3(0, orbit.ty, 0); const off = camera.position.clone().sub(tgt); const d = off.length();
    if (prev !== 'orbit' && d > 0.5) { orbit.dist = orbit.distT = clamp(d, 3, 80); orbit.yaw = orbit.yawT = Math.atan2(off.x, off.z); orbit.pitch = orbit.pitchT = clamp(Math.asin(off.y / d), -1.3, 1.38); }
    if (opt.reset) { orbit.yawT = orbit.yaw + (((0.72 - orbit.yaw) % 6.283 + 9.425) % 6.283 - 3.1416); orbit.pitchT = 0.42; orbit.distT = fitDist(); orbit.focus = null; closeInfo(); }
    beginTrans(opt.reset ? 1.6 : 0.7);
  }
  if (m === 'walk') {
    const lv = selected != null ? selected : 1; walk.level = walk.levelT = lv;
    const yaw = orbit.yaw; walk.yaw = yaw; walk.pitch = -0.06; walk.pos.set(Math.sin(yaw) * 4.1, floorY(lv), Math.cos(yaw) * 4.1); walk.vy = 0; walk.jumpY = 0;
    beginTrans(1.7); toast(`BEGEHEN · LAYER ${L2(lv)} // ${SEM.layers[lv].name}`);
  }
  if (m === 'cine') { cine.t = 0; buildCine(); beginTrans(2.4); }
  if (m === 'dive') startDive();
}
const floorY = l => layerY(l) + BH / 2 + 0.62;
function buildCine() {
  const P = [[12, -1.6, 10], [6.2, 0.45, 6.0], [1.2, 0.5, 3.3], [-3.2, 0.55, 0.8], [-6.8, 1.3, -4.6], [-3.6, 2.5, -3.6], [0.2, 2.55, -3.4], [3.9, 2.45, 0.6], [8.5, 3.7, 6.5], [13, 1.4, 12.5], [14.5, -0.8, 4]];
  cine.curve = new THREE.CatmullRomCurve3(P.map(([x, f, z]) => new THREE.Vector3(x, (1.5 - f) * S, z)), true, 'centripetal'); cine.S = S;
}
function startDive() {
  if (St < S_EXP) { St = S_EXP; $('bExp').classList.add('on'); }
  const Y = f => (1.5 - f) * S_EXP;
  const a0 = Math.atan2(camera.position.x, camera.position.z);
  const at = (a, r, y) => new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r);
  const af = Math.round((a0 + 2.2) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 8;
  const pts = [camera.position.clone(), at(a0, 7, Y(0) + 3.2), at(a0 + 0.6, 3.9, Y(0.5)), at(a0 + 1.2, 2.9, Y(1.5)), at(a0 + 1.8, 2.2, Y(3) + CORE_Y + 1.0), at(a0 + 2.2, 0.45, Y(3) + CORE_Y + 0.1)];
  dive.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  dive.look = [new THREE.Vector3(0, Y(0), 0), new THREE.Vector3(0, Y(0), 0), new THREE.Vector3(0, Y(1) + 0.3, 0), new THREE.Vector3(0, Y(2) + 0.3, 0), new THREE.Vector3(0, Y(3) + CORE_Y, 0), at(af, 4, Y(3) + CORE_Y + 0.05)];
  dive.durs = [2.4, 3.0, 2.5, 1.9, 1.5]; dive.t = 0; dive.done = false; dive.seg = -1; trans.t = 1;
  dive.yaw = af + Math.PI; dive.pitch = 0;
}
function computePose(dt, outP, outQ) {
  const now = performance.now();
  if (mode === 'orbit') {
    if (now - lastInteract > 3500) orbit.yawT += dt * 0.07;
    const k = 1 - Math.exp(-dt * 7);
    orbit.yaw = lerp(orbit.yaw, orbit.yawT, k); orbit.pitch = lerp(orbit.pitch, orbit.pitchT, k); orbit.dist = lerp(orbit.dist, orbit.distT, k);
    const ty = orbit.focus != null ? layerY(orbit.focus) + 0.3 : 0; orbit.ty = lerp(orbit.ty, ty, 1 - Math.exp(-dt * 3));
    const cp = Math.cos(orbit.pitch);
    outP.set(Math.sin(orbit.yaw) * cp * orbit.dist, orbit.ty + Math.sin(orbit.pitch) * orbit.dist, Math.cos(orbit.yaw) * cp * orbit.dist);
    outQ.setFromRotationMatrix(_mat.lookAt(outP, tmpV.set(0, orbit.ty, 0), UP));
  } else if (mode === 'walk') {
    const fx_ = -Math.sin(walk.yaw), fz_ = -Math.cos(walk.yaw);
    let mx = joy.x, mz = -joy.y;
    if (keys.KeyW) mz += 1; if (keys.KeyS) mz -= 1; if (keys.KeyA) mx -= 1; if (keys.KeyD) mx += 1;
    const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 3.6 : 1.9) * dt;
    walk.pos.x += (fx_ * mz - fz_ * mx) * sp; walk.pos.z += (fz_ * mz + fx_ * mx) * sp;
    walk.pos.x = clamp(walk.pos.x, -4.75, 4.75); walk.pos.z = clamp(walk.pos.z, -4.75, 4.75);
    walk.level = walk.levelT;
    walk.vy -= 9.5 * dt; walk.jumpY = Math.max(0, walk.jumpY + walk.vy * dt); if (walk.jumpY === 0 && walk.vy < 0) walk.vy = 0;
    const ceil = walk.level > 0 ? layerY(walk.level - 1) - BH / 2 - 0.15 - floorY(walk.level) : 9; if (walk.jumpY > ceil) { walk.jumpY = ceil; walk.vy = Math.min(0, walk.vy); }
    const fy = floorY(walk.level) + walk.jumpY + Math.sin(simT * 8) * 0.014 * Math.min(1, ml);
    const ky = 1 - Math.exp(-dt * (Math.abs(walk.pos.y - fy) > 0.3 ? 3.2 : 14));
    walk.pos.y = lerp(walk.pos.y, fy, ky);
    outP.copy(walk.pos); outQ.setFromEuler(_eul.set(walk.pitch, walk.yaw, 0, 'YXZ'));
  } else if (mode === 'cine') {
    if (Math.abs(cine.S - S) > 0.02) buildCine();
    cine.t = (cine.t + dt / cine.dur) % 1;
    cine.curve.getPointAt(cine.t, outP); const ahead = cine.curve.getPointAt((cine.t + 0.035) % 1, new THREE.Vector3());
    const look = ahead.lerp(tmpV.set(0, outP.y * 0.35, 0), 0.55);
    outQ.setFromRotationMatrix(_mat.lookAt(outP, look, UP));
  } else if (mode === 'dive') {
    if (!dive.done) {
      dive.t += dt; let acc = 0, seg = 0; while (seg < dive.durs.length && dive.t > acc + dive.durs[seg]) { acc += dive.durs[seg]; seg++; }
      if (seg >= dive.durs.length) { dive.done = true; toast('You are inside the core.'); }
      else {
        const lt = ease((dive.t - acc) / dive.durs[seg]); const u = (seg + lt) / dive.durs.length;
        dive.curve.getPoint(u, outP);
        const look = dive.look[seg].clone().lerp(dive.look[seg + 1], lt);
        outQ.setFromRotationMatrix(_mat.lookAt(outP, look, UP));
        if (seg !== dive.seg) { dive.seg = seg; const li = Math.min(seg, 3); toast(`LAYER ${L2(li)} // ${SEM.layers[li].name}`); }
        diveBoost = lerp(diveBoost, Math.max(0, seg - 1) * 0.6, 1 - Math.exp(-dt * 2));
        return;
      }
    }
    diveBoost = lerp(diveBoost, 2.0, 1 - Math.exp(-dt * 2));
    if (now - lastInteract > 2500) dive.yaw += dt * 0.12;
    outP.set(Math.sin(dive.yaw - Math.PI) * 0.45, layerY(3) + CORE_Y + 0.1, Math.cos(dive.yaw - Math.PI) * 0.45); outQ.setFromEuler(_eul.set(dive.pitch, dive.yaw, 0, 'YXZ'));
  }
}
function currentLayer() {
  if (mode === 'walk') return walk.level;
  if (mode === 'dive') return dive.done ? 3 : clamp(dive.seg, 0, 3);
  const p = camera.position;
  if (Math.abs(p.x) < 5.2 && Math.abs(p.z) < 5.2 && p.y < layerY(0) + 1.2 && p.y > layerY(3) - 0.5) { for (let i = 0; i < NL; i++) if (p.y >= layerY(i)) return i; return 3; }
  return selected;
}

// ---------------------------------------------------------------- input
const keys = {};
const joy = { x: 0, y: 0, id: null };
const ptrs = new Map(); let pinch0 = 0, dist0 = 0, down = null;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('pointerdown', e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); lastInteract = performance.now();
  if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = orbit.distT; down = null; }
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (e.pointerType === 'mouse') hover(e.clientX, e.clientY); return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; lastInteract = performance.now();
  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (mode === 'cine') setMode('orbit'); if (mode === 'orbit') orbit.distT = clamp(dist0 * pinch0 / Math.max(d, 1), 2.5, 70); return; }
  if (down && down.moved < 5) return;
  if (mode === 'cine') setMode('orbit');
  if (mode === 'orbit') { orbit.yawT -= dx * 0.0055; orbit.pitchT = clamp(orbit.pitchT + dy * 0.0045, -1.3, 1.38); }
  else if (mode === 'walk') { walk.yaw -= dx * 0.0042; walk.pitch = clamp(walk.pitch - dy * 0.0038, -1.25, 1.25); }
  else if (mode === 'dive' && dive.done) { dive.yaw -= dx * 0.0042; dive.pitch = clamp(dive.pitch - dy * 0.0038, -1.3, 1.3); }
});
const endPtr = e => { const had = ptrs.delete(e.pointerId); if (had && down && down.moved < 9 && performance.now() - down.t < 450 && ptrs.size === 0) tap(e.clientX, e.clientY); if (ptrs.size === 0) down = null; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); down = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); lastInteract = performance.now(); if (mode === 'cine') setMode('orbit'); if (mode === 'orbit') orbit.distT = clamp(orbit.distT * Math.exp(e.deltaY * 0.0012), 2.5, 70); }, { passive: false });
function pick(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hl = ray.intersectObjects(links.map(l => l.hit), false);
  const hb = ray.intersectObjects(layers.map(l => l.board), false);
  return { link: hl[0] ? hl[0].object.userData.link : null, linkD: hl[0] ? hl[0].distance : 1e9, board: hb[0] ? hb[0].object.userData.layer : null, boardD: hb[0] ? hb[0].distance : 1e9 };
}
let tipTimer = 0;
function showLinkTip(L, x, y, persist) {
  const tip = $('linktip'); tip.innerHTML = `<em>${L.a} → ${L.b}</em>${L.text}`;
  tip.style.left = clamp(x, 120, innerWidth - 120) + 'px'; tip.style.top = Math.max(60, y) + 'px'; tip.classList.remove('hide'); tip.style.borderLeftColor = '#' + L.cb.getHexString();
  links.forEach(l => l.hoverT = l === L ? 1 : 0); tipTimer = persist ? 4.5 : 0.8;
}
function tap(x, y) {
  const h = pick(x, y);
  if (h.link && flux > 0.05 && h.linkD < h.boardD + 2.5) { showLinkTip(h.link, x, y, true); return; }
  if (h.board != null) selectLayer(h.board, true);
}
let hoverAt = 0;
function hover(x, y) {
  const n = performance.now(); if (n - hoverAt < 70) return; hoverAt = n;
  const h = pick(x, y); canvas.style.cursor = (h.link || h.board != null) ? 'pointer' : 'grab';
  if (h.link && flux > 0.05 && h.linkD < h.boardD + 2.5) showLinkTip(h.link, x, y, false);
}
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; keys[e.code] = true; lastInteract = performance.now();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'PageUp', 'PageDown'].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  if (e.code === 'ArrowUp' || e.code === 'PageUp') stepLayer(-1);
  if (e.code === 'ArrowDown' || e.code === 'PageDown') stepLayer(1);
  if (e.code === 'ArrowLeft' && mode === 'orbit') orbit.yawT += 0.35;
  if (e.code === 'ArrowRight' && mode === 'orbit') orbit.yawT -= 0.35;
  if (e.code === 'Space' && mode === 'walk') jump();
  if (e.code === 'Escape') setMode('orbit');
  if (e.code === 'KeyQ' && mode === 'walk') stepLayer(1);
  if (e.code === 'KeyE' && mode === 'walk') stepLayer(-1);
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function stepLayer(d) {
  if (mode === 'walk') { const n = clamp(walk.levelT + d, 0, 3); if (n !== walk.levelT) { walk.levelT = n; walk.jumpY = 0; walk.vy = 0; selectLayer(n, false); toast(`${d < 0 ? 'HOCH' : 'RUNTER'} · LAYER ${L2(n)} // ${SEM.layers[n].name}`); } return; }
  if (mode !== 'orbit') setMode('orbit');
  const n = selected == null ? (d > 0 ? 0 : 3) : clamp(selected + d, 0, 3); selectLayer(n, true);
}
function jump() { if (walk.jumpY < 0.01) walk.vy = 3.4; }
const joyEl = $('joy'), knob = $('knob');
joyEl.addEventListener('pointerdown', e => { joy.id = e.pointerId; try { joyEl.setPointerCapture(e.pointerId); } catch (_) { } joyMove(e); e.preventDefault(); });
joyEl.addEventListener('pointermove', e => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = e => { if (e.pointerId !== joy.id) return; joy.id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
joyEl.addEventListener('pointerup', joyEnd); joyEl.addEventListener('pointercancel', joyEnd);
function joyMove(e) { const r = joyEl.getBoundingClientRect(); let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const m = r.width * 0.38, l = Math.hypot(dx, dy); if (l > m) { dx *= m / l; dy *= m / l; } joy.x = dx / m; joy.y = dy / m; knob.style.transform = `translate(${dx}px,${dy}px)`; lastInteract = performance.now(); }
$('bUp').addEventListener('click', () => stepLayer(-1)); $('bDown').addEventListener('click', () => stepLayer(1)); $('bJump').addEventListener('click', jump);
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.target.tagName !== 'INPUT') e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());
document.querySelectorAll('#modes button').forEach(b => b.addEventListener('click', () => { lastInteract = performance.now(); setMode(b.dataset.mode); }));
document.querySelectorAll('#lens button').forEach(b => b.addEventListener('click', () => setLens(b.dataset.lens)));
$('bExp').addEventListener('click', () => { St = St > (S_BASE + S_EXP) / 2 ? S_BASE : S_EXP; $('bExp').classList.toggle('on', St === S_EXP); });
$('bEnter').addEventListener('click', () => { lastInteract = performance.now(); setMode('dive', { force: true }); });
$('bReset').addEventListener('click', () => { St = S_BASE; $('bExp').classList.remove('on'); diveBoost = 0; setMode('orbit', { force: true, reset: true }); });
$('bDrawer').addEventListener('click', () => { $('drawer').classList.toggle('hide'); $('bDrawer').classList.toggle('on', !$('drawer').classList.contains('hide')); });
let orbitDirty = false;
const bindSlider = (id, vid, fn) => { const s = $(id); const upd = () => { $(vid).textContent = (+s.value).toFixed(2); fn(+s.value); }; s.addEventListener('input', upd); upd(); };
bindSlider('sFlux', 'vFlux', v => { flux = v; });
bindSlider('sDens', 'vDens', v => { if (v !== density) { density = v; orbitDirty = true; } });
bindSlider('sCore', 'vCore', v => { if (v !== coreScale) { coreScale = v; orbitDirty = true; geomS = -1; } });
document.querySelectorAll('#qual button').forEach(b => b.addEventListener('click', () => { autoQ = false; applyTier(+b.dataset.q); }));

// ---------------------------------------------------------------- recording
let rec = null, recChunks = [], recStart = 0, recUrl = null;
function pickMime() { if (!window.MediaRecorder) return null; const mp4 = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4'], webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const safari = /^((?!chrome|chromium|android|crios).)*safari/i.test(navigator.userAgent); const c = safari ? [...mp4, ...webm] : [...webm, ...mp4]; for (const m of c) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) { } } return ''; }
$('bRec').addEventListener('click', () => {
  if (rec) { try { rec.requestData(); } catch (_) { } rec.stop(); return; }
  const mime = pickMime(); if (mime === null || !canvas.captureStream) { toast('REC wird von diesem Browser nicht unterstützt'); return; }
  try {
    const stream = canvas.captureStream(30); rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 10e6 } : { videoBitsPerSecond: 10e6 }); recChunks = [];
    const r = rec;
    r.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
    r.onstop = () => {
      const type = r.mimeType || mime || 'video/webm'; const ext = type.includes('mp4') ? 'mp4' : 'webm'; const blob = new Blob(recChunks, { type: type.split(';')[0] });
      window.__lastRec = { size: blob.size, type }; if (!blob.size) { rec = null; $('bRec').classList.remove('on'); $('rectime').classList.add('hide'); toast('REC: keine Videodaten – bitte länger aufnehmen'); return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `neurablackbox-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      rec = null; $('bRec').classList.remove('on'); window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
    if (mode === 'orbit' && performance.now() - lastInteract > 1500) setMode('cine');
  } catch (err) { rec = null; toast('REC fehlgeschlagen'); console.warn(err); }
});

// ---------------------------------------------------------------- toast + quality
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('hide'); el.style.opacity = 1; toastT = 2.4; }
let sized = false;
function applyTier(t) {
  tier = t; const T = TIERS[t];
  renderer.setPixelRatio(T.pr); composer.setPixelRatio(T.pr);
  if (isGL2) { composer.renderTarget1.samples = T.s; composer.renderTarget2.samples = T.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = T.bl; resize();
  document.querySelectorAll('#qual button').forEach(b => b.classList.toggle('on', +b.dataset.q === t)); $('mQ').textContent = T.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 52 : 42; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(); fxMat.uniforms.uH.value = h * pr / (2 * Math.tan(camera.fov * Math.PI / 360)); fxMat.uniforms.uMax.value = 130 * pr;
}
addEventListener('resize', () => { resize(); if (mode === 'orbit' && orbit.focus == null && performance.now() - lastInteract > 2000) orbit.distT = fitDist(); });

// ---------------------------------------------------------------- per-frame visuals
const proj = new THREE.Vector3(), wpos = new THREE.Vector3();
const lensCol = new THREE.Color();
function updateLabels() {
  const W = innerWidth, H = innerHeight; const camP = camera.position;
  const inside = Math.abs(camP.x) < 5.5 && Math.abs(camP.z) < 5.5 && camP.y < layerY(0) + 1.5 && camP.y > layerY(3) - 0.5;
  const cl = currentLayer();
  for (const c of concepts) {
    conceptWorld(c, wpos); const d = wpos.distanceTo(camP);
    proj.copy(wpos).project(camera);
    let o = 0;
    if (proj.z < 1 && proj.z > -1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1) {
      const fd = inside ? 1 - clamp((d - 3.5) / 6, 0, 1) : 1 - clamp((d - 12) / 8, 0, 1);
      o = Math.max(fd, selected === c.li ? 0.95 : 0, mode === 'dive' && cl === c.li ? 0.9 : 0) * clamp(flux * 1.5, 0, 1);
      if (d < 0.9) o *= d / 0.9;
    }
    c.o = lerp(c.o, o, 0.2);
    if (c.o < 0.02) { if (c.vis) { c.el.style.opacity = 0; c.vis = false; } continue; }
    c.vis = true; const x = (proj.x * 0.5 + 0.5) * W, y = (-proj.y * 0.5 + 0.5) * H;
    c.el.style.transform = `translate3d(${x.toFixed(1)}px,${(y - 6).toFixed(1)}px,0)`; c.el.style.opacity = c.o.toFixed(2);
  }
  const showLeads = mode !== 'walk' && mode !== 'dive' && !(W <= 760 && H > W);
  const sr = stackEl.getBoundingClientRect();
  [...stackEl.children].forEach((el, i) => {
    const p = leadPaths[i]; if (!p) return;
    const off = () => { p.setAttribute('points', ''); p.dot.setAttribute('cx', -10); };
    if (!showLeads) return off();
    const r = el.getBoundingClientRect(); const ly = r.top + (W < 760 ? 14 : 18);
    let best = null; for (const [cx, cz] of [[5, 5], [5, -5], [-5, 5], [-5, -5]]) { proj.set(cx, layerY(i), cz).project(camera); if (proj.z > 1) continue; const sx = (proj.x * .5 + .5) * W; if (!best || sx > best[0]) best = [sx, (-proj.y * .5 + .5) * H]; }
    if (!best || best[0] > sr.left - 8 || best[0] < 0) return off();
    const mx = sr.left - 14; p.setAttribute('points', `${best[0].toFixed(1)},${best[1].toFixed(1)} ${(mx - 10).toFixed(1)},${ly.toFixed(1)} ${sr.left},${ly.toFixed(1)}`);
    p.dot.setAttribute('cx', best[0].toFixed(1)); p.dot.setAttribute('cy', best[1].toFixed(1));
    p.setAttribute('stroke', selected === i ? 'rgba(58,214,255,0.55)' : 'rgba(200,220,240,0.16)');
  });
}
const _o = new THREE.Object3D(), _c = new THREE.Color(), _v = new THREE.Vector3();
let coreIK = 1, bloomIn = 0;
function updateOrbs(t, dt) {
  const T = TIERS[tier]; let n = 0; const coreMul = 0.6 + sim.E * 0.9 + diveBoost * 0.25;
  if (flux > 0.01) for (const ob of orbList) {
    const mul = (ob.li === 3 ? coreMul : 1 + diveBoost * 0.12 * ob.li) * T.orb;
    if (ob.rank >= Math.round(ob.base * mul)) continue; if (n >= ORB_CAP) break;
    const sp = 1 + diveBoost * (0.35 + 0.25 * ob.li);
    ob.a = (ob.a ?? ob.a0) + ob.w * dt * sp;
    _v.set(Math.cos(ob.a) * ob.r, Math.sin(t * 1.3 + ob.bob) * 0.04, Math.sin(ob.a) * ob.r).applyMatrix4(ob.m); _v.y += layerY(ob.li);
    const s = ob.size * Math.min(1, flux * 1.6);
    _o.position.copy(_v); _o.scale.setScalar(s); _o.updateMatrix(); orbs.setMatrixAt(n, _o.matrix);
    _c.copy(ob.c).multiplyScalar(0.8 + 0.2 * coreIK); orbs.setColorAt(n, _c); n++;
    fxPush(_v.x, _v.y, _v.z, ob.c, 0.3 * flux, s * 4.5);
  }
  orbs.count = n; orbs.instanceMatrix.needsUpdate = true; if (orbs.instanceColor) orbs.instanceColor.needsUpdate = true;
}
let fpsAcc = 0, fpsN = 0, fpsT0 = 0, lastTierChange = 0, metricsT = 0, frameN = 0;
let last = performance.now(), started = false;
const P_ = new THREE.Vector3(), Q_ = new THREE.Quaternion(), coreW = new THREE.Vector3();
function simCam(dt) {
  if (Math.abs(S - St) > 0.0005) { S = lerp(S, St, 1 - Math.exp(-dt * 3.2)); if (Math.abs(S - St) < 0.001) S = St; }
  if (S !== geomS) layoutStack();
  if (Math.abs(S - linkS) > 0.04 || (S === St && S !== linkS)) buildLinks();
  if (orbitDirty) { orbitDirty = false; buildOrbits(); }
  stepSim(dt);
  computePose(dt, P_, Q_);
  if (trans.t < 1) { trans.t = Math.min(1, trans.t + dt / trans.dur); const k = ease(trans.t); camera.position.lerpVectors(trans.fromP, P_, k); camera.quaternion.slerpQuaternions(trans.fromQ, Q_, k); }
  else { camera.position.copy(P_); camera.quaternion.copy(Q_); }
  camera.updateMatrixWorld();
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now; if (document.hidden) return;
  const t = now / 1000; frameN++;
  simCam(dt);
  fxN = 0;
  const cl = currentLayer();
  layers.forEach((L, i) => {
    L.ovMat.uniforms.uT.value = t * (1 + diveBoost * 0.3); L.ovMat.uniforms.uI.value = (selected == null ? 1 : selected === i ? 1.5 : 0.75) * (cl === i ? 1.12 : 1); L.ovMat.uniforms.uF.value = 0.35 + 0.65 * flux;
    if (L.orbitGroup) L.orbitGroup.children.forEach((m, k) => { m.material.opacity = (0.55 + 0.3 * Math.sin(t * 0.8 + k + i)) * flux; m.visible = flux > 0.01; });
  });
  if (layers[0].cchip) layers[0].cchip.gm.color.copy(layers[0].cchip.baseCol).multiplyScalar(1 + sim.chipFlash * 1.6);
  const E = sim.E; const cr = 0.85 * coreScale * (0.92 + 0.16 * E + 0.03 * Math.sin(t * 3.1));
  coreG.scale.setScalar(cr); coreG.visible = flux > 0.01;
  coreW.set(0, layerY(3) + CORE_Y, 0);
  const cdist = camera.position.distanceTo(coreW) / cr; const ik = clamp((cdist - 0.7) / 1.1, 0, 1); const ikk = 0.12 + 0.88 * ik; coreIK = ik;
  coreShellMat.uniforms.uT.value = t; coreShellMat.uniforms.uI.value = (0.4 + 0.4 * E) * flux * (0.35 + 0.65 * ik); coreInnerMat.uniforms.uI.value = (0.16 + 0.22 * E) * flux * ik * ik;
  lobes.forEach((l, i) => { l.rotation.y = i * Math.PI / 3 + t * (0.12 + diveBoost * 0.1); l.rotation.z = Math.sin(t * 0.3 + i) * 0.15; l.material.uniforms.uI.value = (0.12 + 0.14 * E) * flux * ikk * ikk; });
  coreLines.forEach((l, i) => { l.rotation.z += dt * (0.2 + i * 0.13) * (1 + diveBoost); l.material.opacity = 0.75 * flux; });
  coreHot.scale.setScalar(1 + E * 0.8 + 0.15 * Math.sin(t * 6));
  coreLight.intensity = (4 + 9 * E) * flux * ikk; coreHot.visible = cdist > 1.05; if (!coreHot.visible) fxPush(0, coreW.y, 0, C.cy, 0.5 * flux, 0.35);
  const inCore = camera.position.distanceTo(coreW) < cr * 0.98 && flux > 0.01;
  if (!inCore) { fxPush(0, coreW.y, 0, C.bl, (0.22 + E * 0.25) * flux, cr * 3.0); fxPush(0, coreW.y, 0, C.cy, (0.6 + E * 0.5) * flux, cr * 0.9); }
  glassMat.uniforms.uI.value = 0.07 * flux; glassRimMat.opacity = 0.14 * flux; glass.visible = rimTop.visible = rimBot.visible = flux > 0.01;
  axisCore.visible = axisGlow.visible = flux > 0.01; const axD = clamp(Math.hypot(camera.position.x, camera.position.z) / 6, 0.15, 1); axisGlowMat.uniforms.uI.value = (0.12 + 0.12 * E) * flux * ikk * ikk * axD; axisCore.material.color.setRGB(0.7, 1.3, 2.8).multiplyScalar(0.35 + 0.65 * axD); { const cp = camera.position; const inS = Math.abs(cp.x) < 5.3 && Math.abs(cp.z) < 5.3 && cp.y < layerY(0) + 0.8 && cp.y > layerY(3) - 0.6; bloomIn = lerp(bloomIn, inS ? 1 : 0, 0.08); bloom.strength = TIERS[tier].bl * (0.72 + 0.28 * ik) * (1 - 0.25 * bloomIn); bloom.threshold = 0.32 + 0.22 * bloomIn; }
  const ab = coreW.y, at = layerY(0) + 0.6;
  for (const a of sim.axisP) { const y = lerp(ab, at, a.y); fxPush(0, y, 0, a.c, 1.2 * flux, 0.22 + 0.1 * Math.sin(a.y * 20)); }
  for (let k = 0; k < 5; k++) { const u = 0.5 + 0.5 * Math.sin(t * (0.5 + k * 0.13) + k * 1.7); const y = lerp(layerY(3) + 0.2, layerY(0) + 2.6, u); fxPush(0, y, 0, [C.cy, C.vi, C.au, C.gr, C.wh][k], 0.7 * flux, 0.4); }
  for (const p of pulses) {
    if (!p.pos) continue; const fade = p.fade < 1 ? clamp(1 - p.life * 0.5, 0, 1) * p.fade : 1; const k = p.k * fade * (0.4 + 0.6 * flux);
    for (let j = 0; j < p.trail.length; j += 3) { const q = 1 - j / 15; fxPush(p.trail[j], p.trail[j + 1], p.trail[j + 2], p.c, k * q * (j ? 0.55 : 1), p.size * (j ? q * 0.8 : 1)); }
  }
  const y1 = layerY(1) + BH / 2 + 0.05; for (const nd of net.nodes) fxPush(nd.x, y1, nd.z, nd.act > 0.1 ? C.wh : C.cy, (0.35 + nd.act * 1.6) * (0.3 + 0.7 * flux), 0.2 + nd.act * 0.3);
  lensCol.set(LENS_ACC[lens]);
  for (const c of concepts) { conceptWorld(c, wpos); fxPush(wpos.x, wpos.y, wpos.z, c.lens ? lensCol : C.wh, 0.5 * flux, 0.16); }
  links.forEach(L => {
    L.hover = lerp(L.hover, L.hoverT || 0, 0.15); L.mat.uniforms.uT.value = t; L.mat.uniforms.uH.value = L.hover; L.mat.uniforms.uF.value = flux; L.tube.visible = flux > 0.01;
    const ph = (t * 0.22 + L.i * 0.27) % 1; L.curve.getPoint(ph, wpos); _c.copy(L.ca).lerp(L.cb, ph); fxPush(wpos.x, wpos.y, wpos.z, _c, 1.3 * flux, 0.3);
  });
  if (tipTimer > 0) { tipTimer -= dt; if (tipTimer <= 0) { $('linktip').classList.add('hide'); links.forEach(l => l.hoverT = 0); } }
  updateOrbs(t, dt);
  if (!IS_MOBILE || (frameN & 1) === 0) updateEdges();
  updateMem(t); fractal.material.uniforms.uT.value = t; memMesh.material.uniforms.uT.value = t;
  fxGeo.setDrawRange(0, fxN); fxGeo.attributes.position.needsUpdate = fxGeo.attributes.color.needsUpdate = fxGeo.attributes.size.needsUpdate = true;
  updateLabels();
  composer.render(dt);
  const st = $('status'); const want = inCore ? 'You are inside the core.' : (SEM.ui && SEM.ui.status) || 'SYS // NEURABLACKBOX v0.1 · SIGNAL STABLE · LAYERS 4/4';
  if (st.textContent !== want) { st.textContent = want; st.classList.toggle('core', inCore); }
  [...stackEl.children].forEach((d, i) => d.classList.toggle('cur', cl === i));
  metricsT -= dt; if (metricsT <= 0) {
    metricsT = 0.25; const v = metricsNow();
    $('mE').textContent = Math.round(v.E * 100) + '%'; $('bE').style.width = (v.E * 100).toFixed(0) + '%'; $('mO').textContent = v.orbs; $('mS').textContent = v.sig.toFixed(1);
    $('mC').textContent = `${v.con}/${net.edges.length}`; $('mP').textContent = `${v.pat}/${MEM_SLOTS.length}`; $('mR').textContent = v.rate.toFixed(1) + ' Hz'; $('mL').textContent = cl == null ? '—' : `${L2(cl)} ${SEM.layers[cl].name}`;
    renderInfoMetrics();
  }
  if (toastT > 0) { toastT -= dt; if (toastT <= 0.5) $('toast').style.opacity = Math.max(0, toastT * 2); if (toastT <= 0) $('toast').classList.add('hide'); }
  if (rec) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${String(s / 60 | 0).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  if (started) {
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 2.5) { const fps = fpsN / fpsAcc; window.__fps = fps; fpsAcc = 0; fpsN = 0; if (autoQ && tier < 2 && fps < 42 && now - lastTierChange > 4000 && now - fpsT0 > 3500) { lastTierChange = now; applyTier(tier + 1); toast(`GRAFIK → ${TIERS[tier].n}`); } }
  }
}

// ---------------------------------------------------------------- boot
async function boot() {
  try { const r = await fetch('semantics.json', { cache: 'no-store' }); if (r.ok) SEM = await r.json(); } catch (_) { }
  if (!SEM || !Array.isArray(SEM.layers) || SEM.layers.length < 4) SEM = FALLBACK;
  buildHUD(); buildOrbits(); layoutStack(); updateEdges();
  for (let i = 0; i < 800; i++) stepSim(0.05, false);
  pulses.length = 0;
  applyTier(tier); orbit.dist = orbit.distT = fitDist();
  computePose(0.016, camera.position, camera.quaternion);
  requestAnimationFrame(frame);
  const go = $('go'); go.disabled = false; go.textContent = 'SYSTEM STARTEN';
  const start = () => { const s = $('start'); if (!s) return; s.classList.add('out'); started = true; fpsT0 = performance.now(); setTimeout(() => s.remove(), 1100); };
  go.addEventListener('click', start);
  if (Q.has('autostart')) start();
  if (Q.get('mode')) setTimeout(() => setMode(Q.get('mode')), 50);
  window.__ready = true;
}
window.NBB = {
  setMode, selectLayer, setLens, stepLayer, orbit, walk, cine, dive, keys, joy, pick, tap, applyTier,
  get state() { return { mode, S, selected, flux, density, coreScale, tier: TIERS[tier].n, E: sim.E, pulses: pulses.length, orbs: orbs.count, stored: memory.stored.length, con: metricsNow().con, sig: metricsNow().sig, cam: camera.position.toArray().map(v => +v.toFixed(2)), diveDone: dive.done, level: walk.level, fps: window.__fps, status: $('status').textContent, concepts: concepts.length, links: links.length }; },
  set(o) { for (const [k, id] of [['flux', 'sFlux'], ['density', 'sDens'], ['core', 'sCore']]) if (k in o) { $(id).value = o[k]; $(id).dispatchEvent(new Event('input')); } },
  advance(sec) { const n = Math.round(sec / 0.033); for (let i = 0; i < n; i++) { simCam(0.033); for (const o of orbList) o.a = (o.a ?? o.a0) + o.w * 0.033; } },
  frames: () => frameN,
  explode(v) { St = v ? S_EXP : S_BASE; $('bExp').classList.toggle('on', !!v); },
  linkScreen(i) { const L = links[i]; if (!L) return null; L.curve.getPoint(0.5, wpos); wpos.project(camera); return [(wpos.x * .5 + .5) * innerWidth, (-wpos.y * .5 + .5) * innerHeight]; }
};
if ('serviceWorker' in navigator && !Q.has('nosw')) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }));
boot();
