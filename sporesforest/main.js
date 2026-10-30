// SPORENWALD // Spores Forest · shivas_ocean · Luca Matteo Balzano 1991
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const $ = id => document.getElementById(id);
const TAU = Math.PI * 2, V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const Q = new URLSearchParams(location.search);
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let R = rng(1991);
const rr = (a, b) => a + (b - a) * R();
const pick = arr => arr[(R() * arr.length) | 0];
const IS_TOUCH = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) && navigator.maxTouchPoints > 0;
const DPR = Math.min(window.devicePixelRatio || 1, 3);

// ---------------------------------------------------------------- palette (concept: Sporen-Türkis, Myzel-Gold, Pilz-Magenta, Glitch-Weiß)
const C = {
  tq: new THREE.Color('#3affd6'), gold: new THREE.Color('#ffc24a'), mag: new THREE.Color('#ff4fd8'), white: new THREE.Color('#ffffff'),
  vio: new THREE.Color('#8a5cff'), cyan: new THREE.Color('#38c8ff'), lime: new THREE.Color('#9dff4a'), deep: new THREE.Color('#0b0518')
};
const LENS = {
  bio: { a: C.tq, b: C.gold, n: 'BIO', css: '#3affd6' },
  machine: { a: C.cyan, b: C.white, n: 'MACHINE', css: '#7fe3ff' },
  mind: { a: C.mag, b: C.vio, n: 'MIND', css: '#ff4fd8' }
};

// ---------------------------------------------------------------- semantics (12 Fragmente from concept.md + Linsen-Texte)
const SPECIES = {
  spiral: { n: 'SPIRALSTIEL', col: C.vio },
  cluster: { n: 'TÜRKIS-KOLONIE', col: C.tq },
  drip: { n: 'TROPFPILZ', col: C.mag },
  cactus: { n: 'KAKTUSPILZ', col: C.lime },
  machine: { n: 'MASCHINENPILZ', col: C.mag }
};
const SEM = [
  { sp: 'cluster', x: -14, z: 30, f: 'Ich bin nicht einer. Ich bin viele, die sich erinnern.',
    bio: 'Was oben wie viele Pilze aussieht, ist unten oft ein einziger Organismus. Ein Hallimasch in Oregon durchzieht fast 10 km² Waldboden und ist Jahrtausende alt.',
    machine: 'Verteiltes System: viele Instanzen, ein gemeinsamer Zustand. Kein Knoten ist das Original.',
    mind: 'Identität als Netz statt als Punkt. Du bist auch die, mit denen du verbunden bist.' },
  { sp: 'spiral', x: 8, z: 42, f: 'Unter deinen Füßen spricht der Wald in Zucker und Strom.',
    bio: 'Die meisten Landpflanzen leben in Mykorrhiza: Bäume geben Zucker, Pilze liefern Wasser, Phosphor und Stickstoff. Im Myzel messen Forschende auch elektrische Spannungsspitzen.',
    machine: 'Ein Protokoll aus Energie gegen Daten. Jede Hyphe ist Leitung und Speicher zugleich.',
    mind: 'Unter jeder Oberfläche läuft ein Gespräch, das du nicht hörst, bis du stehen bleibst.' },
  { sp: 'drip', x: 24, z: 24, f: 'Jede Spore ist eine Frage, die der Wind beantwortet.',
    bio: 'Ein einziger Riesenbovist kann Billionen Sporen bilden. Wind, Wasser und Tiere tragen sie fort, nur ein winziger Teil keimt.',
    machine: 'Broadcast ohne Empfängerliste: senden an alle, verbinden mit wenigen.',
    mind: 'Nicht jede Frage braucht sofort eine Antwort. Manche müssen erst landen.' },
  { sp: 'cactus', x: 36, z: 4, f: 'Wir teilen Nahrung mit den Schwachen. Das nennt ihr Ethik.',
    bio: 'Über Pilzfäden können Kohlenstoff und Nährstoffe zwischen Pflanzen wandern, auch zu Sämlingen im Schatten. Wie stark das wirkt, wird in der Forschung noch diskutiert.',
    machine: 'Lastverteilung: Ressourcen fließen dorthin, wo das System Mangel meldet.',
    mind: 'Fürsorge als Infrastruktur. Wer teilt, hält das Netz am Leben.' },
  { sp: 'machine', x: 26, z: -22, f: 'Ein Axon ist nur ein Myzel, das schneller sein wollte.',
    bio: 'Hyphen sind wenige Mikrometer dünne Zellfäden. Sie wachsen an der Spitze, verzweigen sich und verschmelzen wieder, ähnlich wie Nervenfasern ein Netz bilden.',
    machine: 'Eine Leiterbahn, die sich selbst verlegt und Umwege von alleine optimiert.',
    mind: 'Denken ist vielleicht nur Wachstum mit höherer Geschwindigkeit.' },
  { sp: 'machine', x: 6, z: -36, f: 'Die Maschine hier rostet. Wir lesen ihren Code im Eisen.',
    bio: 'Pilze lösen mit Säuren Mineralien aus Gestein und können Metalle binden. Manche Arten werden erforscht, um belastete Böden zu reinigen.',
    machine: 'Recycling auf Molekülebene: Hardware wird wieder zu Rohstoff.',
    mind: 'Was wir zurücklassen, wird gelesen. Von jemandem, den wir nie gefragt haben.' },
  { sp: 'drip', x: -18, z: -30, f: 'Zerfall ist kein Ende. Zerfall ist Übersetzung.',
    bio: 'Nur wenige Lebewesen können Lignin abbauen, den harten Stoff im Holz. Weißfäulepilze gehören dazu. Ohne sie läge der Wald unter seinem eigenen Holz begraben.',
    machine: 'Garbage Collection: Speicher wird frei, damit Neues entstehen kann.',
    mind: 'Loslassen ist eine Form von Weitergeben.' },
  { sp: 'cluster', x: -34, z: -8, f: 'Ein Netzwerk ohne Zentrum kann nicht sterben.',
    bio: 'Ein Myzel hat kein Gehirn und kein Zentrum. Wird ein Teil zerstört, leitet das Netz Nährstoffe einfach anders um.',
    machine: 'Mesh-Netzwerk: ausfallsicher durch Redundanz, jeder Knoten kann Router sein.',
    mind: 'Stärke kommt nicht aus der Mitte, sondern aus den Verbindungen.' },
  { sp: 'drip', x: -30, z: 14, f: 'Du atmest uns gerade ein. Hallo.',
    bio: 'Mit jedem Atemzug atmest du Pilzsporen ein. In der Luft schweben je nach Ort und Jahreszeit oft Tausende pro Kubikmeter.',
    machine: 'Hintergrundrauschen, das immer da ist. Du hast es nur ausgefiltert.',
    mind: 'Du bist schon Teil des Netzes, bevor du davon weißt.' },
  { sp: 'spiral', x: 14, z: 10, f: 'Die Spirale wiederholt sich nie ganz. Darum wächst sie.',
    bio: 'Myzel wächst von innen nach außen. Die Fruchtkörper erscheinen oft als Kreis, als Hexenring, der jedes Jahr ein Stück weiter wandert.',
    machine: 'Iteration mit Abweichung: jede Schleife ein neuer Versionsstand.',
    mind: 'Wiederholung ist kein Stillstand, wenn du dich dabei veränderst.' },
  { sp: 'cactus', x: -12, z: -14, f: 'Wir waren vor den Wurzeln da. Wir werden nach den Städten da sein.',
    bio: 'Pilze besiedelten das Land vor über 400 Millionen Jahren zusammen mit den ersten Pflanzen, die noch keine echten Wurzeln hatten. Pilze sind näher mit Tieren verwandt als mit Pflanzen.',
    machine: 'Ein Legacy-System, auf dem alles andere läuft. Niemand hat es installiert.',
    mind: 'Geduld ist eine Zeitskala, nicht eine Tugend.' },
  { sp: 'spiral', x: -8, z: 12, f: 'Jetzt bist du verbunden.',
    bio: 'Das Wood Wide Web: In einem Gramm Waldboden können hunderte Meter Pilzfäden stecken. Leuchtende Arten erzeugen ihr Licht mit Luciferin und dem Enzym Luciferase.',
    machine: 'Handshake abgeschlossen. Verbindung steht.',
    mind: 'Zuhören war der erste Knoten.' }
];
const MOTHER = {
  bio: 'Der Mutterpilz steht für das ganze Myzel: ein Organismus aus Kilometern Fäden, der Nährstoffe, Wasser und Signale zwischen den Bäumen verteilt.',
  machine: 'Kein Server, sondern ein Konsens. Der Kern entsteht erst, wenn alle Knoten antworten.',
  mind: 'Erinnerung ist ein Netz, das sich selbst wiederfindet.'
};

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const FOG = new THREE.Color().setRGB(.014, .007, .032, THREE.LinearSRGBColorSpace);
scene.fog = new THREE.FogExp2(FOG, 0.017);
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.05, 520);
camera.rotation.order = 'YXZ';
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 2 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .85, 0.5, 0.42);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 2, sp: 1, dec: 1 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 0, sp: .8, dec: .85 },
  { n: 'MITTEL', pr: 1, s: 0, sp: .6, dec: .7 },
  { n: 'NIEDRIG', pr: .75, s: 0, sp: .4, dec: .5 }];
let tier = Q.has('q') ? clamp(+Q.get('q') | 0, 0, 3) : (IS_TOUCH ? 1 : 0);
let autoQ = !Q.has('q') && !Q.has('noauto');

// ---------------------------------------------------------------- settings
const S = { spores: .6, glow: 1, growth: 1, signal: .5, lens: 'bio' };
try { Object.assign(S, JSON.parse(localStorage.getItem('sporenwald.s') || '{}')); } catch (_) { }
const saveS = () => { try { localStorage.setItem('sporenwald.s', JSON.stringify(S)); } catch (_) { } };

// ---------------------------------------------------------------- canvas textures
function ctex(w, h, fn, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
  return t;
}
const soilTex = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#0d0912'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = `rgba(${40 + v * 50 | 0},${28 + v * 30 | 0},${50 + v * 60 | 0},${Math.random() * .35})`; const s = Math.random() * 3 + .5; g.fillRect(Math.random() * w, Math.random() * h, s, s); }
  for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .5})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 14 + 2, 0, TAU); g.fill(); }
}, 22);
const glowTex = ctex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(.6, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
const gillTex = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h); g.translate(w / 2, h / 2);
  for (let i = 0; i < 220; i++) { const a = i / 220 * TAU; const r0 = 30 + Math.random() * 40; g.strokeStyle = `rgba(255,255,255,${.25 + Math.random() * .6})`; g.lineWidth = Math.random() * 1.6 + .4; g.beginPath(); g.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); g.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); g.stroke(); }
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.3, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,.35)');
  g.fillStyle = gr; g.globalCompositeOperation = 'lighter'; g.beginPath(); g.arc(0, 0, 256, 0, TAU); g.fill();
});
const veinTex = ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#101010'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { let x = Math.random() * w, y = h; g.strokeStyle = `rgba(255,255,255,${.3 + Math.random() * .6})`; g.lineWidth = Math.random() * 2 + .5; g.beginPath(); g.moveTo(x, y); while (y > 0) { x += (Math.random() - .5) * 18; y -= 10 + Math.random() * 10; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .8})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, Math.random() * 2.2, 0, TAU); g.fill(); }
});
veinTex.wrapS = veinTex.wrapT = THREE.RepeatWrapping;
const circuitTex = ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#080808'; g.fillRect(0, 0, w, h); g.lineCap = 'square';
  for (let i = 0; i < 140; i++) {
    let x = (Math.random() * 32 | 0) * 16, y = (Math.random() * 32 | 0) * 16; g.strokeStyle = `rgba(255,255,255,${.35 + Math.random() * .65})`; g.lineWidth = Math.random() < .3 ? 3 : 1.5; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { const d = Math.random() * 4 | 0, L = (1 + Math.random() * 4 | 0) * 16; if (d === 0) x += L; else if (d === 1) x -= L; else if (d === 2) y += L; else y -= L; g.lineTo(x, y); }
    g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
  }
});
circuitTex.wrapS = circuitTex.wrapT = THREE.RepeatWrapping;
const capTex = ctex(512, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(.75, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,1)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.strokeStyle = `rgba(255,255,255,${Math.random() * .5})`; g.lineWidth = Math.random() * 2; const x = Math.random() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 20, h * .3, x - 20, h * .6, x + (Math.random() - .5) * 30, h); g.stroke(); }
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .9})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h * .8, Math.random() * 3, 0, TAU); g.fill(); }
});
capTex.wrapS = THREE.RepeatWrapping;

// ---------------------------------------------------------------- terrain
const WR = 64; // walkable radius
function H(x, z) {
  const r = Math.hypot(x, z);
  return .55 * Math.sin(x * .11 + 1.3) * Math.cos(z * .09 - .4) + .35 * Math.sin(x * .23 + z * .17) + .16 * Math.sin(x * .5 - z * .41)
    + 1.3 * Math.exp(-r * r / 70) + smooth(WR - 4, WR + 30, r) * 7;
}
{
  const g = new THREE.PlaneGeometry(300, 300, 200, 200); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ color: 0x6a5a80, map: soilTex, roughness: .96, metalness: 0 });
  const ground = new THREE.Mesh(g, m); scene.add(ground);
}
scene.add(new THREE.HemisphereLight(0x4a3a8a, 0x07040c, .55));
const moon = new THREE.DirectionalLight(0x8a7cff, .45); moon.position.set(-30, 60, 20); scene.add(moon);

// ---------------------------------------------------------------- sky + stars
{
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { uTime: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying vec3 vP; uniform float uTime;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=.5; } return s; }
      void main(){ float y = vP.y; vec3 c = mix(vec3(.014,.007,.032), vec3(.002,.001,.005), smoothstep(-.02,.45,y));
        float n = fbm(vP*3.2 + vec3(0., uTime*.004, 0.)); float neb = smoothstep(.5,.85,n) * smoothstep(-.1,.35,y) * (1.-smoothstep(.55,.95,y));
        c += neb * mix(vec3(.25,.08,.45), vec3(.05,.25,.35), fbm(vP*6.)) * .22;
        gl_FragColor = vec4(c,1.); }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 48, 24), m); sky.renderOrder = -1; scene.add(sky); scene.userData.sky = m;
  const N = 2600, pos = new Float32Array(N * 3), sz = new Float32Array(N), ph = new Float32Array(N);
  for (let i = 0; i < N; i++) { const u = Math.random(), a = Math.random() * TAU, y = .05 + Math.pow(u, .7) * .95, r = Math.sqrt(1 - y * y); pos.set([Math.cos(a) * r * 380, y * 380, Math.sin(a) * r * 380], i * 3); sz[i] = Math.random() < .04 ? 3.2 : 1 + Math.random() * 1.4; ph[i] = Math.random() * TAU; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(sz, 1)); g.setAttribute('aP', new THREE.BufferAttribute(ph, 1));
  const sm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, uniforms: { uTime: { value: 0 }, uPR: { value: 1 } },
    vertexShader: `attribute float aS, aP; uniform float uTime, uPR; varying float vA; void main(){ vA = .55+.45*sin(uTime*1.3+aP*7.); gl_PointSize = aS*uPR; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-.5); gl_FragColor = vec4(vec3(.85,.85,1.)*vA*smoothstep(.5,.0,d), 1.); }` });
  const stars = new THREE.Points(g, sm); stars.frustumCulled = false; scene.add(stars); scene.userData.stars = sm;
}

// ---------------------------------------------------------------- mycelium graph (Wood Wide Web)
const nodes = [], edges = [];
function addNode(x, z, kind) { const n = { i: nodes.length, x, z, y: H(x, z), e: [], act: 0, last: -9, lastEn: 0, hero: -1, kind }; nodes.push(n); return n; }
const motherNode = addNode(0, 0, 'mother');
const heroNodes = SEM.map((s, i) => { const n = addNode(s.x, s.z, 'hero'); n.hero = i; return n; });
// light path from the entrance (z=56) to the mother (concept panorama: Pfad aus Myzel-Licht)
const pathX = z => 4.5 * Math.sin(z * .13) + 1.5 * Math.sin(z * .31);
const pathNodes = [];
for (let z = 56; z > 6; z -= 3.2) pathNodes.push(addNode(pathX(z), z, 'path'));
const near = (x, z, d) => nodes.some(n => (n.x - x) ** 2 + (n.z - z) ** 2 < d * d);
for (let k = 0; k < 6000 && nodes.length < 230; k++) {
  const a = R() * TAU, r = Math.sqrt(R()) * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (r < 6.5 || near(x, z, 3.9)) continue;
  addNode(x, z, 'j');
}
const ekey = new Set();
function link(a, b, w = 1) {
  if (a === b) return; const k = a < b ? a + '_' + b : b + '_' + a; if (ekey.has(k)) return; ekey.add(k);
  const e = { i: edges.length, a, b, w, L: 0, v0: 0, np: 0, cum: null, bond: 0 }; edges.push(e); nodes[a].e.push(e.i); nodes[b].e.push(e.i);
}
for (const n of nodes) {
  const ds = nodes.filter(m => m !== n).map(m => [Math.hypot(m.x - n.x, m.z - n.z), m.i]).sort((p, q) => p[0] - q[0]);
  const k = n.kind === 'mother' ? 9 : n.kind === 'hero' ? 4 : 3, maxD = n.kind === 'mother' ? 16 : 10.5;
  for (let j = 0; j < k && j < ds.length; j++) if (ds[j][0] < maxD || j === 0) link(n.i, ds[j][1], n.kind === 'mother' ? 1.8 : n.kind === 'hero' ? 1.35 : 1);
}
for (let i = 0; i < pathNodes.length - 1; i++) link(pathNodes[i].i, pathNodes[i + 1].i, 1.6);
link(pathNodes[pathNodes.length - 1].i, 0, 1.8);
{ // connectivity (union-find)
  const par = nodes.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
  for (const e of edges) par[f(e.a)] = f(e.b);
  for (let guard = 0; guard < 50; guard++) {
    const roots = new Set(nodes.map(n => f(n.i))); if (roots.size <= 1) break;
    const main = f(0); let best = null;
    for (const n of nodes) if (f(n.i) !== main) for (const m of nodes) if (f(m.i) === main) { const d = Math.hypot(n.x - m.x, n.z - m.z); if (!best || d < best[0]) best = [d, n.i, m.i]; }
    link(best[1], best[2]); par[f(best[1])] = f(best[2]);
  }
}
// ribbon geometry
let NV = 0;
const edgePts = edges.map(e => {
  const A = nodes[e.a], B = nodes[e.b], L0 = Math.hypot(B.x - A.x, B.z - A.z), px = -(B.z - A.z) / L0, pz = (B.x - A.x) / L0;
  const o1 = rr(-1, 1) * L0 * .16, o2 = rr(-1, 1) * L0 * .16;
  const cv = new THREE.CatmullRomCurve3([new V3(A.x, 0, A.z), new V3(lerp(A.x, B.x, .33) + px * o1, 0, lerp(A.z, B.z, .33) + pz * o1), new V3(lerp(A.x, B.x, .66) + px * o2, 0, lerp(A.z, B.z, .66) + pz * o2), new V3(B.x, 0, B.z)]);
  const np = Math.max(4, Math.ceil(L0 / .42)); const pts = cv.getSpacedPoints(np - 1);
  e.np = np; e.v0 = NV; NV += np * 2; return pts;
});
const rib = { pos: new Float32Array(NV * 3), side: new Float32Array(NV), t: new Float32Array(NV), glow: new Float32Array(NV), mix: new Float32Array(NV), bond: new Float32Array(NV), w: new Float32Array(NV) };
const ribIdx = [];
edges.forEach((e, ei) => {
  const pts = edgePts[ei], cum = new Float32Array(e.np); let acc = 0; const mx = R();
  for (let k = 0; k < e.np; k++) {
    if (k) acc += pts[k].distanceTo(pts[k - 1]); cum[k] = acc;
    const p = pts[k], q = pts[Math.min(k + 1, e.np - 1)], o = pts[Math.max(k - 1, 0)]; let tx = q.x - o.x, tz = q.z - o.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const taper = .55 + .45 * Math.sin(Math.PI * k / (e.np - 1)), w = (.05 + .045 * e.w) * (1.25 - .5 * taper) * 1.3;
    for (let s = 0; s < 2; s++) {
      const v = e.v0 + k * 2 + s, sd = s ? 1 : -1, x = p.x - tz * w * sd, z = p.z + tx * w * sd;
      rib.pos.set([x, H(x, z) + .06, z], v * 3); rib.side[v] = sd; rib.t[v] = acc + ei * 7.3; rib.mix[v] = mx; rib.w[v] = e.w;
    }
    if (k < e.np - 1) { const a = e.v0 + k * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  e.cum = cum; e.L = acc;
});
const ribGeo = new THREE.BufferGeometry();
ribGeo.setAttribute('position', new THREE.BufferAttribute(rib.pos, 3));
for (const [k, a] of [['aSide', rib.side], ['aT', rib.t], ['aMix', rib.mix], ['aW', rib.w]]) ribGeo.setAttribute(k, new THREE.BufferAttribute(a, 1));
const glowAttr = new THREE.BufferAttribute(rib.glow, 1).setUsage(THREE.DynamicDrawUsage); ribGeo.setAttribute('aGlow', glowAttr);
const bondAttr = new THREE.BufferAttribute(rib.bond, 1).setUsage(THREE.DynamicDrawUsage); ribGeo.setAttribute('aBond', bondAttr);
ribGeo.setIndex(ribIdx);
const FOGV = `vec4 mv = modelViewMatrix*vec4(position,1.); float d = -mv.z; vFog = exp(-uFogD*uFogD*d*d); gl_Position = projectionMatrix*mv;`;
const ribMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uSpeed: { value: .5 }, uFogD: { value: .017 }, uA: { value: C.tq.clone() }, uB: { value: C.gold.clone() }, uBase: { value: .4 }, uK: { value: 1 }, uSync: { value: 0 } },
  vertexShader: `attribute float aSide, aT, aGlow, aMix, aBond, aW; uniform float uTime, uSpeed, uFogD, uSync; varying float vSide, vGlow, vMix, vShim, vFog, vBond, vW;
    void main(){ vSide=aSide; vGlow=aGlow; vMix=aMix; vBond=aBond; vW=aW;
      vShim = .5+.5*sin(aT*1.6 - uTime*(1.2+uSpeed*4.) + aMix*31.);
      vShim = mix(vShim, .5+.5*sin(uTime*3.9), uSync);
      ${FOGV} }`,
  fragmentShader: `uniform vec3 uA, uB; uniform float uBase, uK; varying float vSide, vGlow, vMix, vShim, vFog, vBond, vW;
    void main(){ float core = exp(-vSide*vSide*3.2), hot = exp(-vSide*vSide*22.);
      vec3 c = mix(uA, uB, smoothstep(.55,1.,vMix)*.85);
      float b = uBase*(.3+.5*vShim)*(.55+.45*vW) + vBond*(.45+.35*vShim) + vGlow*1.5;
      vec3 col = c*b*core + vec3(1.)*hot*(vGlow*.7 + vBond*.12);
      gl_FragColor = vec4(col*vFog*uK, 1.); }`
});
const ribbons = new THREE.Mesh(ribGeo, ribMat); ribbons.frustumCulled = false; scene.add(ribbons);

// fine hyphae (texture of the net)
{
  const P = [], Cc = [];
  for (const n of nodes) {
    const br = n.kind === 'hero' ? 14 : n.kind === 'mother' ? 30 : 7;
    for (let b = 0; b < br; b++) {
      let x = n.x, z = n.z, a = R() * TAU; const segs = 4 + (R() * 5 | 0), k = .3 + R() * .5;
      for (let s = 0; s < segs; s++) {
        const nx = x + Math.cos(a) * rr(.35, .8), nz = z + Math.sin(a) * rr(.35, .8);
        P.push(x, H(x, z) + .04, z, nx, H(nx, nz) + .04, nz); const f = k * (1 - s / segs); Cc.push(f, f, f, f * .7, f * .7, f * .7);
        x = nx; z = nz; a += rr(-.7, .7);
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, color: C.tq.clone() });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; scene.add(L); scene.userData.hyphae = m;
}

// node blobs
const nodePos = new Float32Array(nodes.length * 3), nodeAct = new Float32Array(nodes.length), nodeSz = new Float32Array(nodes.length);
nodes.forEach((n, i) => { nodePos.set([n.x, n.y + .14, n.z], i * 3); nodeSz[i] = n.kind === 'mother' ? 3 : n.kind === 'hero' ? 1.6 : .55 + n.e.length * .16; });
const nodeGeo = new THREE.BufferGeometry(); nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3)); nodeGeo.setAttribute('aS', new THREE.BufferAttribute(nodeSz, 1));
const nodeActAttr = new THREE.BufferAttribute(nodeAct, 1).setUsage(THREE.DynamicDrawUsage); nodeGeo.setAttribute('aAct', nodeActAttr);
const nodeMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uA: ribMat.uniforms.uA, uB: ribMat.uniforms.uB, uPR: { value: 1 }, uH: { value: 800 }, uFogD: ribMat.uniforms.uFogD, uBase: ribMat.uniforms.uBase, uK: ribMat.uniforms.uK },
  vertexShader: `attribute float aS, aAct; uniform float uPR, uH, uFogD; varying float vAct, vFog;
    void main(){ vAct = aAct; ${FOGV} gl_PointSize = clamp(aS*(.55+aAct*1.4)*uH*.5/d, 1., 90.)*uPR; }`,
  fragmentShader: `uniform vec3 uA, uB; uniform float uBase, uK; varying float vAct, vFog;
    void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d); float h = smoothstep(.16,.0,d);
      vec3 c = mix(uA, uB, .25)*(uBase*.8+vAct*1.2)*a + vec3(1.)*h*(.2+vAct*.8);
      gl_FragColor = vec4(c*vFog*uK, 1.); }`
});
const nodePts = new THREE.Points(nodeGeo, nodeMat); nodePts.frustumCulled = false; scene.add(nodePts);

// ---------------------------------------------------------------- signal pulses
const pulses = [];
const stat = { sig: [], fired: 0 };
let T = 0;
function sendPulses(n, en, fromE) {
  for (const ei of n.e) {
    if (ei === fromE) continue; if (pulses.length > 900) return;
    const e = edges[ei]; pulses.push({ e: ei, dir: e.a === n.i ? 0 : 1, s: 0, v: (6 + S.signal * 10) * rr(.85, 1.15), en });
  }
}
function fire(ni, en, fromE = -1) {
  const n = nodes[ni];
  if (T - n.last < .45 && en <= n.lastEn + .05) return;
  n.last = T; n.lastEn = en; n.act = Math.max(n.act, en); stat.sig.push(T);
  if (n.hero >= 0) heroWake(n.hero, en);
  if (n.kind === 'mother') motherPing(en);
  const next = en * (.74 + S.signal * .16);
  if (next > .11) sendPulses(n, next, fromE);
}
function updatePulses(dt) {
  const g = rib.glow, dec = Math.exp(-dt * 3.2);
  for (let i = 0; i < g.length; i++) g[i] *= dec;
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i], e = edges[p.e]; p.s += p.v * dt;
    const s = p.dir ? e.L - p.s : p.s, cum = e.cum;
    for (let k = 0; k < e.np; k++) {
      const dd = cum[k] - s; if (dd < -1.6 || dd > 1.6) continue;
      const v = p.en * Math.exp(-dd * dd * 2.2), a = e.v0 + k * 2; if (g[a] < v) { g[a] = v; g[a + 1] = v; }
    }
    if (p.s >= e.L) { pulses.splice(i, 1); fire(p.dir ? e.a : e.b, p.en, p.e); }
  }
  glowAttr.needsUpdate = true;
  for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; n.act *= Math.exp(-dt * 2.2); nodeAct[i] = n.act; }
  nodeActAttr.needsUpdate = true;
  while (stat.sig.length && T - stat.sig[0] > 3) stat.sig.shift();
}
// bonds: persistent glowing paths between connected mushrooms
const bondAnims = [];
function dijkstra(src, targets) {
  const dist = new Float32Array(nodes.length).fill(1e9), prev = new Int32Array(nodes.length).fill(-1), pe = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length);
  dist[src] = 0;
  for (; ;) {
    let u = -1, bd = 1e9; for (let i = 0; i < nodes.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0) return null; if (targets.has(u)) { const path = []; let c = u; while (c !== src) { path.unshift([pe[c], prev[c]]); c = prev[c]; } return path; }
    done[u] = 1;
    for (const ei of nodes[u].e) { const e = edges[ei], v = e.a === u ? e.b : e.a, nd = dist[u] + e.L / e.w; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; pe[v] = ei; } }
  }
}
function bondPath(fromNode, targets) {
  const path = dijkstra(fromNode, targets); if (!path) return;
  // path: [edge, prevNode] from source outwards; animate growth from the mushroom
  const segs = path.map(([ei, pn]) => ({ e: ei, dir: edges[ei].a === pn ? 0 : 1 }));
  bondAnims.push({ segs, d: 0, total: segs.reduce((s, q) => s + edges[q.e].L, 0) });
}
function updateBonds(dt) {
  let dirty = false;
  for (let i = bondAnims.length - 1; i >= 0; i--) {
    const B = bondAnims[i]; B.d += dt * 13; let acc = 0;
    for (const q of B.segs) {
      const e = edges[q.e];
      for (let k = 0; k < e.np; k++) { const along = acc + (q.dir ? e.L - e.cum[k] : e.cum[k]); const v = clamp((B.d - along) / 2, 0, 1); const a = e.v0 + k * 2; if (rib.bond[a] < v) { rib.bond[a] = rib.bond[a + 1] = v; dirty = true; } }
      acc += e.L;
    }
    if (B.d > B.total + 3) { B.segs.forEach(q => edges[q.e].bond = 1); bondAnims.splice(i, 1); }
  }
  if (G.final) { for (let i = 0; i < rib.bond.length; i++) if (rib.bond[i] < .5) { rib.bond[i] = Math.min(.5, rib.bond[i] + dt * .25); dirty = true; } }
  if (dirty) bondAttr.needsUpdate = true;
}
function nearestNode(x, z, maxD = 1e9, filter) { let b = -1, bd = maxD * maxD; for (const n of nodes) { if (filter && !filter(n)) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; b = n.i; } } return b; }

// ---------------------------------------------------------------- mushroom building blocks
const COLL = []; // walk collision circles
function rimMat(col, pow = 2.2) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uC: { value: col.clone() }, uK: { value: 1 }, uP: { value: pow }, uFogD: ribMat.uniforms.uFogD },
    vertexShader: `varying vec3 vN, vV; varying float vFog; uniform float uFogD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); float d = -mv.z; vFog = exp(-uFogD*uFogD*d*d); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC; uniform float uK, uP; varying vec3 vN, vV; varying float vFog; void main(){ float f = pow(1.-abs(dot(normalize(vN), normalize(vV))), uP); gl_FragColor = vec4(uC*(f*1.2+.06)*uK*vFog, 1.); }`
  });
}
function capMat(col, tex = capTex, rep = 3) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uC: { value: col.clone() }, uK: { value: 1 }, uFogD: ribMat.uniforms.uFogD, uFogC: { value: FOG }, uTex: { value: tex }, uRep: { value: rep } },
    vertexShader: `varying vec2 vUv; varying vec3 vN, vV; varying float vFog; uniform float uFogD; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vV = normalize(-mv.xyz); float d = -mv.z; vFog = exp(-uFogD*uFogD*d*d); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform vec3 uC, uFogC; uniform float uK, uRep; uniform sampler2D uTex; varying vec2 vUv; varying vec3 vN, vV; varying float vFog;
      void main(){ float t = texture2D(uTex, vec2(vUv.x*uRep, vUv.y)).r; float v = vUv.y; float fr = pow(1.-abs(dot(normalize(vN), normalize(vV))), 2.2);
        float ln = pow(abs(sin(vUv.x*6.2832*uRep*14. + sin(v*7.+vUv.x*40.)*.6)), 24.) * smoothstep(.15,.95,v);
        float sp = smoothstep(.55,.95,t);
        vec3 c = uC*(.025 + .12*v + .55*ln + .9*sp*(.3+.7*v) + .65*fr) + uC*smoothstep(.8,1.,v)*.55 + vec3(1.)*(pow(smoothstep(.9,1.,v),2.)*.3 + sp*ln*.3);
        gl_FragColor = vec4(mix(uFogC, c*uK, vFog), 1.); }`
  });
}
function capGeo(r, h, curl = .25, seg = 40) {
  const pts = [new THREE.Vector2(0.001, h)];
  for (let i = 1; i <= 16; i++) { const a = i / 16 * Math.PI / 2; pts.push(new THREE.Vector2(r * Math.sin(a), h * Math.pow(Math.cos(a), .8))); }
  pts.push(new THREE.Vector2(r * 1.015, -curl * h), new THREE.Vector2(r * .92, -curl * h * .85));
  return new THREE.LatheGeometry(pts, seg);
}
function taperTube(curve, segs, radial, rFn) {
  const fr = curve.computeFrenetFrames(segs, false), pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPointAt(t), r = rFn(t), N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const a = j / radial * TAU, nx = Math.cos(a) * N.x + Math.sin(a) * B.x, ny = Math.cos(a) * N.y + Math.sin(a) * B.y, nz = Math.cos(a) * N.z + Math.sin(a) * B.z;
      pos.push(p.x + nx * r, p.y + ny * r, p.z + nz * r); nor.push(nx, ny, nz); uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
function stemCurve(h, lean = .4) { const a = R() * TAU, b = a + rr(-1.5, 1.5); return new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(Math.cos(a) * lean, h * .35, Math.sin(a) * lean), new V3(Math.cos(b) * lean * .7, h * .7, Math.sin(b) * lean * .7), new V3(0, h, 0)]); }
const basic = (c, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(k) }); m.userData.base = c.clone(); return m; };
function emStd(col, emissive, k, map, rep) {
  const m = new THREE.MeshStandardMaterial({ color: col, emissive, emissiveIntensity: k, roughness: .45, metalness: .1, side: THREE.DoubleSide });
  if (map) { m.emissiveMap = map; }
  return m;
}
// a mushroom "body" collects driven materials: d = [{m, f}]
function drv(list, m, f = 1) { list.push({ m, f }); return m; }
function applyDrive(list, k) {
  for (const { m, f } of list) {
    if (m.isShaderMaterial) m.uniforms.uK.value = k * f;
    else if (m.isMeshBasicMaterial) m.color.copy(m.userData.base).multiplyScalar(k * f);
    else if (m.isMeshStandardMaterial) m.emissiveIntensity = k * f;
    else if (m.isLineBasicMaterial) m.opacity = clamp(k * f, 0, 1);
  }
}
function addCap(g, list, y, r, h, col, opt = {}) {
  const cap = new THREE.Group(); cap.position.y = y; g.add(cap);
  const top = new THREE.Mesh(capGeo(r, h, opt.curl ?? .25), drv(list, capMat(col, opt.map ?? capTex, opt.mapRep ?? 2), opt.ef ?? 1));
  cap.add(top);
  const gm = new THREE.MeshBasicMaterial({ map: gillTex, color: col.clone() }); gm.userData.base = col.clone(); drv(list, gm, opt.gf ?? .9);
  const gills = new THREE.Mesh(new THREE.CircleGeometry(r * .93, 48), gm); gills.rotation.x = Math.PI / 2; gills.position.y = -(opt.curl ?? .25) * h * .82; cap.add(gills);
  const rim = new THREE.Mesh(capGeo(r * 1.05, h * 1.08, opt.curl ?? .25), drv(list, rimMat(col, 2.4), opt.rf ?? .55)); cap.add(rim);
  return cap;
}
function addRidges(g, list, curve, rFn, n, turns, col, rad = .05) {
  const m = drv(list, basic(col, 1), 1);
  for (let j = 0; j < n; j++) {
    const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, p = curve.getPointAt(t), a = t * TAU * turns + j * TAU / n, r = rFn(t) * 1.02; pts.push(new V3(p.x + Math.cos(a) * r, p.y, p.z + Math.sin(a) * r)); }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, rad, 5), m));
  }
}
function addDrips(g, list, y, r, n, col, dark) {
  const cylG = new THREE.CylinderGeometry(1, .6, 1, 5); cylG.translate(0, -.5, 0);
  const dm = dark ? new THREE.MeshStandardMaterial({ color: 0x15131c, roughness: .4, metalness: .6 }) : drv(list, basic(col, 1.1), 1.1);
  const dropM = drv(list, basic(dark ? C.cyan : col, 1.3), 1.3);
  const cy = new THREE.InstancedMesh(cylG, dm, n), dr = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), dropM, n);
  const info = [], M4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU + rr(-.1, .1), rad = r * rr(.86, .98), L = rr(.25, 1.8), w = dark ? rr(.025, .05) : rr(.02, .045);
    const x = Math.cos(a) * rad, z = Math.sin(a) * rad; M4.compose(new V3(x, y, z), new THREE.Quaternion(), new V3(w, L, w)); cy.setMatrixAt(i, M4);
    info.push({ x, z, y, L, s: w * 1.7, ph: R() });
  }
  g.add(cy, dr); return { dr, info };
}
function updateDrips(D, t) {
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new V3(), s = new V3();
  D.info.forEach((d, i) => { const u = (t * .22 + d.ph) % 1; v.set(d.x, d.y - d.L - u * u * 1.6, d.z); const k = d.s * (u < .85 ? 1 : 1 - (u - .85) / .15); s.set(k, k * 1.3, k); M4.compose(v, q, s); D.dr.setMatrixAt(i, M4); });
  D.dr.instanceMatrix.needsUpdate = true;
}

// ---------------------------------------------------------------- species
function buildSpecies(sp, scale = 1, colOverride) {
  const g = new THREE.Group(), list = [], o = { g, list, top: 0, capR: 1, drips: null, eye: null, sporeY: 2, col: colOverride || SPECIES[sp].col };
  const col = o.col;
  if (sp === 'spiral') {
    const h = rr(5.5, 7) * scale, cv = stemCurve(h, .5 * scale), rF = t => (lerp(.42, .24, t) + .2 * Math.exp(-t * 10)) * scale;
    g.add(new THREE.Mesh(taperTube(cv, 40, 10, rF), drv(list, emStd(new THREE.Color(0x120a20), col, .35, veinTex), .35)));
    addRidges(g, list, cv, rF, 3, 2.3, col.clone().lerp(C.tq, .35), .045 * scale);
    o.capR = rr(2, 2.5) * scale; addCap(g, list, h, o.capR, o.capR * .42, col); o.top = h + o.capR * .42; o.sporeY = h - .2;
  } else if (sp === 'cluster') {
    const sm = drv(list, basic(col, .55), .55), cm = drv(list, basic(col, 1.2), 1.2), rim = drv(list, rimMat(col.clone().lerp(C.white, .3), 1.6), 1);
    for (let i = 0; i < 15; i++) {
      const x = rr(-1.3, 1.3) * scale, z = rr(-1.3, 1.3) * scale, h = rr(.7, 3) * scale * (1.15 - Math.hypot(x, z) / 3 / scale), r = rr(.22, .6) * scale * (.6 + h / 4);
      const cv = new THREE.CatmullRomCurve3([new V3(x * .3, 0, z * .3), new V3(x * .8, h * .5, z * .8), new V3(x, h, z)]);
      g.add(new THREE.Mesh(taperTube(cv, 12, 6, t => lerp(.07, .045, t) * scale), sm));
      const c = new THREE.Mesh(capGeo(r, r * .7, .15, 20), cm); c.position.set(x, h, z); g.add(c);
      const rm = new THREE.Mesh(capGeo(r * 1.08, r * .78, .15, 20), rim); rm.position.copy(c.position); g.add(rm);
      o.top = Math.max(o.top, h + r * .7);
    }
    const rootM = drv(list, basic(col, .8), .8);
    for (let i = 0; i < 10; i++) { const a = R() * TAU, pts = []; for (let k = 0; k <= 6; k++) { const d = k * .35 * scale; pts.push(new V3(Math.cos(a + k * .15) * d, .03 + Math.sin(k) * .02, Math.sin(a + k * .15) * d)); } g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, .03 * scale, 4), rootM)); }
    o.capR = 1.6 * scale; o.sporeY = o.top * .8;
  } else if (sp === 'drip') {
    const h = rr(4.5, 6) * scale, cv = stemCurve(h, .35 * scale), rF = t => (lerp(.4, .28, t) + .18 * Math.exp(-t * 9)) * scale;
    g.add(new THREE.Mesh(taperTube(cv, 40, 10, rF), drv(list, emStd(new THREE.Color(0x1a0818), col, .45, veinTex), .45)));
    addRidges(g, list, cv, rF, 2, 1.6, col.clone().lerp(C.vio, .4), .06 * scale);
    o.capR = rr(2, 2.4) * scale; addCap(g, list, h, o.capR, o.capR * .5, col, { curl: .32 }); o.top = h + o.capR * .5;
    o.drips = addDrips(g, list, h - o.capR * .5 * .3, o.capR, 30, col); o.sporeY = h - .3;
  } else if (sp === 'cactus') {
    const h = rr(4, 5) * scale, m = drv(list, emStd(new THREE.Color(0x0b2010), C.lime, .4, veinTex), .4);
    m.emissiveMap = veinTex.clone(); m.emissiveMap.repeat.set(3, 2); m.emissiveMap.needsUpdate = true;
    const col0 = new THREE.Mesh(new THREE.CylinderGeometry(.5 * scale, .62 * scale, h, 18, 1), m); col0.position.y = h / 2; g.add(col0);
    const topS = new THREE.Mesh(new THREE.SphereGeometry(.5 * scale, 18, 10, 0, TAU, 0, Math.PI / 2), m); topS.position.y = h; g.add(topS);
    const tips = [[0, h + .4 * scale, 0]];
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * TAU + rr(-.4, .4), y = rr(.3, .6) * h, L = rr(.7, 1.1) * scale, up = rr(.8, 1.7) * scale, r = .3 * scale;
      const hz = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 12), m); hz.rotation.z = Math.PI / 2; hz.position.set(L / 2 + .4 * scale, y, 0);
      const vt = new THREE.Mesh(new THREE.CylinderGeometry(r, r, up, 12), m); vt.position.set(L + .4 * scale, y + up / 2, 0);
      const tp = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), m); tp.position.set(L + .4 * scale, y + up, 0);
      const arm = new THREE.Group(); arm.add(hz, vt, tp); arm.rotation.y = a; g.add(arm);
      tips.push([Math.cos(-a) * (L + .4 * scale), y + up + r, Math.sin(-a) * (L + .4 * scale)]);
    }
    const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), drv(list, basic(C.lime, 2.2), 2.2), 26), M4 = new THREE.Matrix4();
    for (let i = 0; i < 26; i++) { const a = R() * TAU, y = rr(.3, h), r = lerp(.62, .5, y / h) * scale; const s = rr(.05, .11) * scale; M4.compose(new V3(Math.cos(a) * r, y, Math.sin(a) * r), new THREE.Quaternion(), new V3(s, s, s)); dots.setMatrixAt(i, M4); }
    g.add(dots);
    const cm = drv(list, basic(C.mag, 1.3), 1.3);
    for (const [x, y, z] of tips) { const c = new THREE.Mesh(capGeo(.42 * scale, .26 * scale, .2, 18), cm); c.position.set(x, y - .1 * scale, z); g.add(c); }
    o.top = h + .7 * scale; o.capR = 1.6 * scale; o.sporeY = h; o.col = C.lime;
  } else if (sp === 'machine') {
    const h = rr(4.2, 5) * scale, metal = new THREE.MeshStandardMaterial({ color: 0x1b1d2a, roughness: .35, metalness: .8, emissive: C.cyan, emissiveIntensity: .25, emissiveMap: circuitTex });
    drv(list, metal, .25);
    const ringM = drv(list, basic(C.cyan, 1.6), 1.6);
    for (let i = 0; i < 8; i++) {
      const y0 = i / 8 * h, s = new THREE.Mesh(new THREE.CylinderGeometry(.3 * scale, .36 * scale, h / 8 * .82, 14), metal); s.position.y = y0 + h / 16; g.add(s);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.34 * scale, .035 * scale, 6, 24), ringM); ring.rotation.x = Math.PI / 2; ring.position.y = y0 + h / 8 * .95; g.add(ring);
    }
    o.capR = rr(2.1, 2.4) * scale;
    const cap = addCap(g, list, h, o.capR, o.capR * .6, col, { map: circuitTex, mapRep: 3, ef: 1.1, curl: .3 });
    const eye = new THREE.Group(); eye.position.set(0, h + o.capR * .28, 0); g.add(eye);
    const ball = new THREE.Group(); ball.position.z = o.capR * .78; eye.add(ball);
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(.55 * scale, 24, 16), new THREE.MeshStandardMaterial({ color: 0xd8d0e0, roughness: .25, emissive: 0x332238, emissiveIntensity: 1 })));
    const iris = new THREE.Mesh(new THREE.CircleGeometry(.34 * scale, 32), drv(list, basic(C.mag, 1.8), 1.8)); iris.position.z = .52 * scale; ball.add(iris);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(.14 * scale, 24), new THREE.MeshBasicMaterial({ color: 0x000000 })); pupil.position.z = .535 * scale; ball.add(pupil);
    const lid = new THREE.Mesh(new THREE.TorusGeometry(.56 * scale, .07 * scale, 8, 28), metal); lid.position.z = .12 * scale; ball.add(lid);
    o.eye = { g: eye, ball }; o.drips = addDrips(g, list, h - o.capR * .6 * .3, o.capR, 22, col, true);
    o.top = h + o.capR * .6; o.sporeY = h - .3; cap.userData.machine = true;
  }
  return o;
}

// ---------------------------------------------------------------- heroes (12 Pilze)
const heroes = SEM.map((s, i) => {
  R = rng(100 + i * 17);
  const o = buildSpecies(s.sp, 1);
  const y = H(s.x, s.z); o.g.position.set(s.x, y, s.z); o.g.rotation.y = R() * TAU; scene.add(o.g);
  const h = Object.assign(o, { i, sem: s, x: s.x, z: s.z, y, wake: 0, connected: false, listened: false, node: heroNodes[i].i, glow: .55, pickC: new V3(s.x, y + o.top * .55, s.z), pickR: Math.max(o.top * .55, o.capR) });
  COLL.push({ x: s.x, z: s.z, r: s.sp === 'cluster' ? 2.2 : s.sp === 'cactus' ? 2.1 : 1.5 });
  return h;
});
R = rng(4242);
// ground glow decals under glowing things
const decal = { list: [] };
function addDecal(x, z, r, col, k) { decal.list.push({ x, z, r, col, k }); }
heroes.forEach(h => addDecal(h.x, h.z, h.capR * 2.4, h.col, .7));

// ---------------------------------------------------------------- mother mushroom (Kern)
const mother = { g: new THREE.Group(), list: [], awake: 0, ping: 0, x: 0, z: 0, y: H(0, 0) };
{
  R = rng(777);
  const g = mother.g, h = 15, cv = new THREE.CatmullRomCurve3([new V3(0, 0, 0), new V3(.6, 4, .3), new V3(-.5, 9, -.2), new V3(0, h, 0)]), rF = t => lerp(1.8, 1.05, t) + 1.4 * Math.exp(-t * 9);
  g.add(new THREE.Mesh(taperTube(cv, 80, 20, rF), drv(mother.list, emStd(new THREE.Color(0x140a24), C.vio, .5, veinTex), .5)));
  const rList = [];
  addRidges(g, rList, cv, rF, 3, 3.2, C.tq, .1); addRidges(g, rList, cv, t => rF(t) * 1.01, 2, -2.4, C.gold, .08);
  mother.list.push(...rList);
  addCap(g, mother.list, h, 9, 3.6, C.vio.clone().lerp(C.mag, .35), { curl: .3, gf: .6, rf: .5, mapRep: 4, ef: .6 });
  const heart = new THREE.Mesh(new THREE.SphereGeometry(1.3, 32, 20), drv(mother.list, basic(C.white, 1.2), 1.2)); heart.position.y = h - 1.6; g.add(heart);
  const heartRim = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 20), drv(mother.list, rimMat(C.tq, 1.5), 1)); heartRim.position.y = h - 1.6; g.add(heartRim);
  mother.rings = [];
  const ringM = drv(mother.list, basic(C.gold, 1.1), 1.1);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(2.6 + i * .2, .05, 6, 64), ringM); r.rotation.x = Math.PI / 2; r.position.y = 2.5 + i * 3.1; g.add(r); mother.rings.push(r); }
  g.position.set(0, mother.y - .2, 0); scene.add(g);
  COLL.push({ x: 0, z: 0, r: 2.8 });
  mother.light = new THREE.PointLight(C.vio, 4, 36, 1.6); mother.light.position.set(0, mother.y + 12, 0); scene.add(mother.light);
  addDecal(0, 0, 18, C.vio, .6);
  // rising spirals (finale)
  const N = 900, u = new Float32Array(N), st = new Float32Array(N), pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { u[i] = Math.random(); st[i] = i % 5; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('aU', new THREE.BufferAttribute(u, 1)); sg.setAttribute('aSt', new THREE.BufferAttribute(st, 1));
  const sm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uPR: { value: 1 }, uH: { value: 800 }, uC1: { value: C.tq }, uC2: { value: C.mag }, uY: { value: mother.y } },
    vertexShader: `attribute float aU, aSt; uniform float uTime, uA, uPR, uH, uY; varying float vU, vS;
      void main(){ float u = fract(aU + uTime*.05); vU = u; vS = aSt; float a = u*6.2831*3. + aSt*1.2566 + uTime*.4; float r = 3. + u*10.;
        vec3 p = vec3(cos(a)*r, uY + u*34., sin(a)*r); vec4 mv = modelViewMatrix*vec4(p,1.); gl_Position = projectionMatrix*mv;
        gl_PointSize = uA*(1.-u*.7)*clamp(uH*.22/(-mv.z), 1., 22.)*uPR; }`,
    fragmentShader: `uniform vec3 uC1, uC2; uniform float uA; varying float vU, vS; void main(){ float d = length(gl_PointCoord-.5); vec3 c = mix(uC1, uC2, mod(vS,2.)); gl_FragColor = vec4(c*smoothstep(.5,0.,d)*uA*(1.-vU)*.8, 1.); }`
  });
  const sp = new THREE.Points(sg, sm); sp.frustumCulled = false; scene.add(sp); mother.spiral = sm;
}

// ---------------------------------------------------------------- giants (panorama), ferns, wrecks
const giants = [];
{
  R = rng(31337);
  const cols = [C.vio, C.cyan, C.vio.clone().lerp(C.mag, .4), C.tq.clone().lerp(C.vio, .5)];
  for (let i = 0, tries = 0; i < 18 && tries < 400; tries++) {
    const a = R() * TAU, r = i < 13 ? rr(48, 74) : rr(26, 44), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (heroes.some(h => Math.hypot(h.x - x, h.z - z) < 9) || giants.some(g => Math.hypot(g.x - x, g.z - z) < 13) || Math.abs(x - pathX(z)) < 7 && z > 0) continue;
    const s = i < 13 ? rr(2.2, 3.4) : rr(1.4, 1.9), col = pick(cols);
    const o = buildSpecies('spiral', s, col);
    o.list.forEach(d => { if (d.m.isMeshStandardMaterial && d.m.emissiveMap === veinTex) { d.m.emissiveMap = circuitTex; d.m.emissive = C.cyan.clone(); } });
    const y = H(x, z); o.g.position.set(x, y - .1, z); o.g.rotation.y = R() * TAU; scene.add(o.g);
    giants.push({ x, z, o, ph: R() * TAU }); applyDrive(o.list, .7); COLL.push({ x, z, r: .9 * s });
    addDecal(x, z, o.capR * 1.8, col, .45); i++;
  }
  // spiral ferns
  const fm = new THREE.MeshBasicMaterial({ color: C.tq.clone().multiplyScalar(.9) });
  const fm2 = new THREE.MeshBasicMaterial({ color: C.lime.clone().multiplyScalar(.7) });
  scene.userData.fern = [fm, fm2];
  for (let i = 0; i < 34; i++) {
    const a = R() * TAU, r = rr(8, 60), x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x, z) < 6) continue;
    const g = new THREE.Group(); g.position.set(x, H(x, z), z); g.rotation.y = R() * TAU;
    for (let f = 0; f < 3 + (R() * 3 | 0); f++) {
      const hgt = rr(1, 2.4), pts = []; const lean = rr(-.3, .3);
      for (let k = 0; k <= 14; k++) { const t = k / 14; pts.push(new V3(lean * t, t * hgt, 0)); }
      for (let k = 1; k <= 26; k++) { const t = k / 26, ang = t * TAU * 1.6, rad = .45 * (1 - t * .85); pts.push(new V3(lean + Math.sin(ang) * rad, hgt + rad - Math.cos(ang) * rad + .0, 0)); }
      const tube = new THREE.Mesh(taperTube(new THREE.CatmullRomCurve3(pts), 60, 5, t => lerp(.045, .012, t)), R() < .7 ? fm : fm2);
      tube.rotation.y = f / 3 * TAU + rr(-.3, .3); g.add(tube);
    }
    scene.add(g);
  }
  // half overgrown robot wrecks (organic x machine)
  const wm = new THREE.MeshStandardMaterial({ color: 0x2a2833, roughness: .55, metalness: .75, emissive: C.cyan, emissiveIntensity: .12, emissiveMap: circuitTex });
  const eyeM = new THREE.MeshBasicMaterial({ color: C.mag.clone().multiplyScalar(1.6) }); scene.userData.wreckEye = eyeM;
  for (const [x, z, ry] of [[11, -41, .6], [-25, -36, -.9], [40, 18, 2.2]]) {
    const g = new THREE.Group(), y = H(x, z); g.position.set(x, y - .6, z); g.rotation.set(rr(-.3, .3), ry, rr(-.25, .25));
    const torso = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 2), wm); torso.position.y = 1; g.add(torso);
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 1.2), wm); head.position.set(-1.2, 2.6, .4); head.rotation.z = .5; g.add(head);
    for (let k = 0; k < 3; k++) { const e = new THREE.Mesh(new THREE.CircleGeometry(.14, 16), eyeM); e.position.set(-1.2 - .15, 2.95 - k * .32, 1.01); e.rotation.z = .5; g.add(e); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.35, .3, 3.4, 10), wm); arm.rotation.z = 1.4; arm.position.set(2.4, .2, .9); g.add(arm);
    const pipe = new THREE.Mesh(new THREE.TorusGeometry(1, .14, 8, 20, Math.PI), wm); pipe.position.set(.5, 2.2, -.6); g.add(pipe);
    scene.add(g); COLL.push({ x, z, r: 2.2 }); addDecal(x, z, 5, C.mag, .3);
    decal.list.push({ x, z, r: 0, wreck: true });
  }
}

// ---------------------------------------------------------------- decor mushrooms (instanced, react to the net)
const DEC_MAX = 1100;
const decCap = new THREE.InstancedMesh(capGeo(1, .62, .18, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }), DEC_MAX);
const decStem = new THREE.InstancedMesh(new THREE.CylinderGeometry(.06, .1, 1, 6).translate(0, .5, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), DEC_MAX);
const dec = [];
{
  R = rng(555);
  const pal = [C.tq, C.tq, C.vio, C.mag, C.cyan, C.gold, C.vio.clone().lerp(C.mag, .5)];
  const place = (x, z, s) => { if (dec.length >= DEC_MAX || Math.hypot(x, z) < 3.5 || COLL.some(c => Math.hypot(c.x - x, c.z - z) < c.r * .8)) return; dec.push({ x, z, y: H(x, z), s, h: rr(.6, 1.6), col: pick(pal).clone(), node: nearestNode(x, z), ph: R() * TAU, lean: rr(-.25, .25), ry: R() * TAU }); };
  for (const h of heroes) for (let k = 0; k < 26; k++) { const a = R() * TAU, r = rr(1.2, 5.5); place(h.x + Math.cos(a) * r, h.z + Math.sin(a) * r, rr(.12, .42)); }
  for (const p of pathNodes) for (let k = 0; k < 9; k++) { const a = R() * TAU, r = rr(1.6, 4.5); place(p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, rr(.1, .35)); }
  for (const w of decal.list.filter(d => d.wreck)) for (let k = 0; k < 30; k++) { const a = R() * TAU, r = rr(1, 3.2); place(w.x + Math.cos(a) * r, w.z + Math.sin(a) * r, rr(.1, .3)); }
  for (let k = 0; dec.length < DEC_MAX && k < 5000; k++) { const n = pick(nodes); const cnt = 2 + (R() * 6 | 0); for (let c = 0; c < cnt; c++) { const a = R() * TAU, r = rr(.4, 2.6); place(n.x + Math.cos(a) * r, n.z + Math.sin(a) * r, rr(.08, .38)); } }
  dec.sort(() => R() - .5);
}
function layoutDecor() {
  const M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  dec.forEach((d, i) => {
    const s = d.s * (.55 + S.growth * .5), hh = d.h * s * 2.4;
    e.set(d.lean, d.ry, 0); q.setFromEuler(e);
    M4.compose(new V3(d.x, d.y - .02, d.z), q, new V3(s * 1.2, hh, s * 1.2)); decStem.setMatrixAt(i, M4);
    const top = new V3(0, hh, 0).applyQuaternion(q).add(new V3(d.x, d.y, d.z));
    M4.compose(top, q, new V3(s, s, s)); decCap.setMatrixAt(i, M4);
  });
  decStem.instanceMatrix.needsUpdate = decCap.instanceMatrix.needsUpdate = true;
}
layoutDecor();
decCap.frustumCulled = decStem.frustumCulled = false;
scene.add(decCap, decStem);
const _dc = new THREE.Color();
function updateDecor(t) {
  const n = decCap.count;
  for (let i = 0; i < n; i++) {
    const d = dec[i], a = nodes[d.node].act;
    const k = (.42 + .18 * Math.sin(t * (.6 + (i % 7) * .13) + d.ph) + a * 1.1) * S.glow;
    _dc.copy(d.col).multiplyScalar(k); decCap.setColorAt(i, _dc);
    _dc.copy(d.col).multiplyScalar(.12 + a * .3); decStem.setColorAt(i, _dc);
  }
  decCap.instanceColor.needsUpdate = decStem.instanceColor.needsUpdate = true;
}
{ // ensure instanceColor exists
  decCap.setColorAt(0, C.tq); decStem.setColorAt(0, C.tq);
}
// ground glow decals
{
  const L = decal.list.filter(d => d.r > 0), m = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffffff });
  const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(2, 2).rotateX(-Math.PI / 2), m, L.length), M4 = new THREE.Matrix4();
  L.forEach((d, i) => { M4.compose(new V3(d.x, H(d.x, d.z) + .08, d.z), new THREE.Quaternion(), new V3(d.r, 1, d.r)); im.setMatrixAt(i, M4); im.setColorAt(i, d.col.clone().multiplyScalar(d.k * .5)); });
  im.frustumCulled = false; scene.add(im); scene.userData.decals = m;
}
// glowing moss specks on the ground (bokeh like the panorama)
{
  R = rng(99); const N = 6000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  const pal = [C.tq, C.vio, C.mag, C.cyan, C.gold];
  for (let i = 0; i < N; i++) {
    let x, z; if (R() < .6) { const n = pick(nodes); x = n.x + rr(-3, 3); z = n.z + rr(-3, 3); } else { const a = R() * TAU, r = Math.sqrt(R()) * 66; x = Math.cos(a) * r; z = Math.sin(a) * r; }
    pos.set([x, H(x, z) + .05 + R() * .1, z], i * 3); const c = pick(pal); const k = rr(.2, 1); col.set([c.r * k, c.g * k, c.b * k], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.PointsMaterial({ size: .16, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
}

// ---------------------------------------------------------------- spores: ambient drift + bursts
const G = { connected: 0, listened: new Set(), final: false, finalT: -99, mode: 'orbit', sel: -1, started: false };
const AMB = 4200;
const amb = (() => {
  R = rng(2024);
  const pos = new Float32Array(AMB * 3), ph = new Float32Array(AMB), col = new Float32Array(AMB * 3), pal = [C.tq, C.tq, C.gold, C.mag, C.vio, C.white];
  for (let i = 0; i < AMB; i++) { const a = R() * TAU, r = Math.sqrt(R()) * 70, x = Math.cos(a) * r, z = Math.sin(a) * r; pos.set([x, H(x, z) + R() * 14, z], i * 3); ph[i] = R() * 100; const c = pick(pal); col.set([c.r, c.g, c.b], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aP', new THREE.BufferAttribute(ph, 1)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    uniforms: { uTime: { value: 0 }, uPR: { value: 1 }, uH: { value: 800 }, uFogD: ribMat.uniforms.uFogD, uK: { value: 1 }, uCam: { value: new V3() } },
    vertexShader: `attribute float aP; uniform float uTime, uPR, uH, uFogD; uniform vec3 uCam; varying vec3 vC; varying float vA, vFog;
      void main(){ vC = color; vec3 p = position; float t = uTime + aP;
        p.y = position.y + mod(t*.18, 14.) - 2.; p.x += sin(t*.21)*1.6 + sin(t*.07+aP)*2.; p.z += cos(t*.17)*1.6;
        vA = smoothstep(-2., .5, p.y-position.y+2.) * (1.-smoothstep(9., 12., p.y-position.y+2.)) * (.45+.55*sin(t*2.3)*sin(t*1.1));
        ${FOGV} gl_PointSize = clamp((.9+fract(aP*7.3)*1.6)*uH*.035/d, .8, 14.)*uPR; }`,
    fragmentShader: `uniform float uK; varying vec3 vC; varying float vA, vFog; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.05,d); gl_FragColor = vec4(vC*a*max(vA,0.)*uK*(.35+.65*vFog), 1.); }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p); return { p, m, g };
})();
const BN = 3000;
const burstP = (() => {
  const pos = new Float32Array(BN * 3), vel = new Float32Array(BN * 3), life = new Float32Array(BN), col = new Float32Array(BN * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('aL', new THREE.BufferAttribute(life, 1).setUsage(THREE.DynamicDrawUsage)); g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, uniforms: { uPR: { value: 1 }, uH: { value: 800 }, uFogD: ribMat.uniforms.uFogD },
    vertexShader: `attribute float aL; uniform float uPR, uH, uFogD; varying vec3 vC; varying float vL, vFog; void main(){ vC = color; vL = aL; ${FOGV} gl_PointSize = aL <= 0. ? 0. : clamp((.5+aL)*uH*.07/d, 1., 26.)*uPR; }`,
    fragmentShader: `varying vec3 vC; varying float vL, vFog; void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d); float h = smoothstep(.15,0.,d); gl_FragColor = vec4((vC*a*.75 + h*.35)*clamp(vL*1.2,0.,1.)*(.4+.6*vFog), 1.); }`
  });
  const p = new THREE.Points(g, m); p.frustumCulled = false; scene.add(p);
  return { pos, vel, life, col, g, m, head: 0 };
})();
function burst(x, y, z, col, n, f = 1) {
  n = Math.round(n * (TIERS[tier].sp * .5 + .5) * (.4 + S.spores));
  const B = burstP;
  for (let k = 0; k < n; k++) {
    const i = B.head; B.head = (B.head + 1) % BN;
    const a = Math.random() * TAU, u = Math.random() * 2 - 1, s = (.6 + Math.random() * 2.4) * f, r = Math.sqrt(1 - u * u);
    B.pos.set([x + rr(-.3, .3), y + rr(-.2, .2), z + rr(-.3, .3)], i * 3); B.vel.set([Math.cos(a) * r * s, Math.abs(u) * s * .7 + .4, Math.sin(a) * r * s], i * 3);
    B.life[i] = 1 + Math.random() * .8; const c = Math.random() < .25 ? C.white : col; B.col.set([c.r, c.g, c.b], i * 3);
  }
  B.g.attributes.color.needsUpdate = true;
}
function updateBurst(dt) {
  const B = burstP, damp = Math.exp(-dt * 1.4);
  for (let i = 0; i < BN; i++) {
    if (B.life[i] <= 0) continue; B.life[i] -= dt * .38; const j = i * 3;
    B.vel[j] *= damp; B.vel[j + 2] *= damp; B.vel[j + 1] = B.vel[j + 1] * damp + .25 * dt;
    B.vel[j] += Math.sin(T * 1.3 + i) * .3 * dt;
    B.pos[j] += B.vel[j] * dt; B.pos[j + 1] += B.vel[j + 1] * dt; B.pos[j + 2] += B.vel[j + 2] * dt;
  }
  B.g.attributes.position.needsUpdate = B.g.attributes.aL.needsUpdate = true;
}

// ---------------------------------------------------------------- reactions
function heroWake(i, en) {
  const h = heroes[i]; const was = h.wake; h.wake = Math.max(h.wake, en);
  if (en > .25 && T - (h.lastBurst || -9) > .5) { h.lastBurst = T; burst(h.x, h.y + h.sporeY, h.z, h.col, 26 * en + 8, .7 + en * .6); }
}
function motherPing(en) { mother.ping = Math.max(mother.ping, en); if (en > .3 && T - (mother.lastBurst || -9) > .6) { mother.lastBurst = T; burst(0, mother.y + 13, 0, C.tq, 30 * en, 1.6); } }
function bondedSet() { const s = new Set([0]); heroes.forEach(h => { if (h.connected) s.add(h.node); }); return s; }
function connectHero(i) {
  const h = heroes[i]; if (h.connected) return false;
  const targets = bondedSet(); h.connected = true; G.connected++;
  bondPath(h.node, targets); hudNet(); toast(`NETZ ${String(G.connected).padStart(2, '0')}/12 VERBUNDEN`);
  if (G.connected === 12) setTimeout(finale, 2200);
  return true;
}
function tapHero(i) {
  const h = heroes[i]; fire(h.node, 1); h.wake = 1.2; h.lastBurst = T; burst(h.x, h.y + h.sporeY, h.z, h.col, 90, 1.6);
  connectHero(i); select(i);
}
function listenHero(i) {
  const h = heroes[i]; h.listened = true; G.listened.add(i); connectHero(i); fire(h.node, .7); select(i); whisper(h.sem.f, `${SPECIES[h.sem.sp].n} · ${String(i + 1).padStart(2, '0')}`); hudNet();
}
function tapMother(listen) {
  fire(0, 1); burst(0, mother.y + 13, 0, C.tq, 60, 1.8); select(-2);
  if (!G.final) whisper('Noch schläft der Kern. Verbinde die Zwölf.', 'MUTTERPILZ');
  else if (listen) whisper('Der Wald erinnert sich an dich.', 'MUTTERPILZ');
}
function tapGround(x, z) {
  const n = nearestNode(x, z, 8); burst(x, H(x, z) + .3, z, LENS[S.lens].a, 30, .8);
  if (n >= 0) fire(n, .9);
}
function finale() {
  if (G.final) return; G.final = true; G.finalT = T; heroes.forEach(h => { if (!h.connected) { h.connected = true; } });
  G.connected = 12; hudNet(); fire(0, 1.3);
  banner('MUTTERPILZ ERWACHT', 'DER WALD ERINNERT SICH AN DICH.');
  for (let k = 0; k < 6; k++) setTimeout(() => burst(rr(-3, 3), mother.y + rr(8, 16), rr(-3, 3), pick([C.tq, C.gold, C.mag]), 80, 2.6), k * 260);
}
function connectAll() { heroes.forEach((h, i) => { connectHero(i); }); }
function resetNet() {
  heroes.forEach(h => { h.connected = false; h.listened = false; h.wake = 0; }); G.connected = 0; G.listened.clear(); G.final = false; mother.awake = 0;
  rib.bond.fill(0); bondAttr.needsUpdate = true; edges.forEach(e => e.bond = 0); bondAnims.length = 0; pulses.length = 0; ribMat.uniforms.uSync.value = 0;
  hudNet(); select(-1); toast('NETZ ZURÜCKGESETZT');
}

// ---------------------------------------------------------------- camera modes
const O = { yaw: .35, pitch: .38, r: 46, tgt: new V3(0, 4, 0), tgtGoal: new V3(0, 4, 0), rGoal: 46, idle: 0 };
const W = { x: pathX(54), z: 54, yaw: 0, pitch: -.04, vx: 0, vz: 0, step: 0, bob: 0 };
const FLY = (() => {
  const pts = [new V3(0, 9, 62)];
  const order = [1, 2, 3, 9, 4, 5, 10, 6, 7, 11, 8, 0, 12].map(i => i === 12 ? null : SEM[i]).filter(Boolean);
  // ring through the heroes, alternating high and low
  const hs = heroes.slice().sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
  hs.forEach((h, k) => { const r = Math.hypot(h.x, h.z), a = Math.atan2(h.z, h.x) + .18; const rr2 = Math.max(r + 7, 16); pts.push(new V3(Math.cos(a) * rr2, H(Math.cos(a) * rr2, Math.sin(a) * rr2) + (k % 3 === 0 ? 11 : 4.5), Math.sin(a) * rr2)); });
  return { curve: new THREE.CatmullRomCurve3(hs.map((h, k) => { const r = Math.hypot(h.x, h.z), a = Math.atan2(h.z, h.x) + .2, d = Math.max(r + 6, 17), x = Math.cos(a) * d, z = Math.sin(a) * d; return new V3(x, H(x, z) + (k % 3 === 0 ? 12 : 4), z); }), true, 'centripetal'), u: 0 };
})();
const keys = {};
function walkBlocked(x, z) { if (Math.hypot(x, z) > WR - 2) return true; for (const c of COLL) if ((c.x - x) ** 2 + (c.z - z) ** 2 < (c.r + .45) ** 2) return true; return false; }
const joy = { x: 0, y: 0, on: false };
function updateCamera(dt) {
  if (G.mode === 'photo') return;
  if (G.mode === 'orbit') {
    O.idle += dt; if (O.idle > 6 && G.sel < 0) O.yaw += dt * .06;
    if (O.yawGoal != null) { const d = Math.atan2(Math.sin(O.yawGoal - O.yaw), Math.cos(O.yawGoal - O.yaw)); O.yaw += d * (1 - Math.exp(-dt * 3)); if (Math.abs(d) < .002) O.yawGoal = null; }
    O.tgt.lerp(O.tgtGoal, 1 - Math.exp(-dt * 3)); O.r = lerp(O.r, O.rGoal, 1 - Math.exp(-dt * 4));
    O.pitch = clamp(O.pitch, -.05, 1.35);
    const cp = Math.cos(O.pitch); camera.position.set(O.tgt.x + Math.sin(O.yaw) * cp * O.r, O.tgt.y + Math.sin(O.pitch) * O.r, O.tgt.z + Math.cos(O.yaw) * cp * O.r);
    const gy = H(camera.position.x, camera.position.z) + .8; if (camera.position.y < gy) camera.position.y = gy;
    camera.lookAt(O.tgt);
  } else if (G.mode === 'walk') {
    let fx = 0, fz = 0;
    if (keys.KeyW || keys.ArrowUp) fz += 1; if (keys.KeyS || keys.ArrowDown) fz -= 1; if (keys.KeyA || keys.ArrowLeft) fx -= 1; if (keys.KeyD || keys.ArrowRight) fx += 1;
    if (joy.on) { fx += joy.x; fz += -joy.y; }
    const run = keys.ShiftLeft || keys.ShiftRight ? 2 : 1, sp = 3.4 * run, l = Math.hypot(fx, fz);
    if (l > 1) { fx /= l; fz /= l; }
    const sy = Math.sin(W.yaw), cy = Math.cos(W.yaw);
    const tx = (fx * cy - fz * sy) * sp, tz = (-fx * sy - fz * cy) * sp;
    W.vx = lerp(W.vx, tx, 1 - Math.exp(-dt * 8)); W.vz = lerp(W.vz, tz, 1 - Math.exp(-dt * 8));
    const nx = W.x + W.vx * dt, nz = W.z + W.vz * dt;
    if (!walkBlocked(nx, W.z)) W.x = nx; else W.vx = 0;
    if (!walkBlocked(W.x, nz)) W.z = nz; else W.vz = 0;
    const v = Math.hypot(W.vx, W.vz); W.step += v * dt; W.bob += v * dt * 2.2;
    if (W.step > .65) { W.step = 0; const n = nearestNode(W.x, W.z, 5); if (n >= 0) fire(n, .55 + S.signal * .25); burst(W.x + W.vx * .2, H(W.x, W.z) + .1, W.z + W.vz * .2, LENS[S.lens].a, 6, .35); }
    W.pitch = clamp(W.pitch, -1.2, 1.2);
    camera.position.set(W.x, H(W.x, W.z) + 1.7 + Math.sin(W.bob) * .045 * Math.min(1, v), W.z);
    camera.rotation.set(W.pitch, W.yaw, 0);
  } else {
    FLY.u = (FLY.u + dt * .0075) % 1;
    const p = FLY.curve.getPointAt(FLY.u), q = FLY.curve.getPointAt((FLY.u + .025) % 1);
    camera.position.lerp(p, 1 - Math.exp(-dt * 2));
    const look = q.clone().lerp(new V3(0, mother.y + 7, 0), .55);
    const m = new THREE.Matrix4().lookAt(camera.position, look, new V3(0, 1, 0)); const qq = new THREE.Quaternion().setFromRotationMatrix(m);
    camera.quaternion.slerp(qq, 1 - Math.exp(-dt * 2.5));
  }
}
function setMode(m) {
  if (m === G.mode) return;
  const prev = G.mode; G.mode = m;
  if (m === 'walk') { if (prev === 'orbit' && G.sel >= 0) { const h = heroes[G.sel]; const a = Math.atan2(h.x, h.z); W.x = h.x + Math.sin(a) * 9; W.z = h.z + Math.cos(a) * 9; if (walkBlocked(W.x, W.z)) { W.x = pathX(54); W.z = 54; } W.yaw = Math.atan2(W.x - h.x, W.z - h.z); } else if (prev !== 'walk') { W.x = pathX(54); W.z = 54; W.yaw = 0; } W.pitch = -.04; W.vx = W.vz = 0; }
  if (m === 'fly') { FLY.u = 0; let best = 0, bd = 1e9; for (let k = 0; k < 200; k++) { const d = FLY.curve.getPointAt(k / 200).distanceTo(camera.position); if (d < bd) { bd = d; best = k / 200; } } FLY.u = best; }
  if (m === 'orbit') { const f = new V3(); camera.getWorldDirection(f); O.tgtGoal.set(0, 4, 0); O.rGoal = 46; O.yaw = Math.atan2(camera.position.x, camera.position.z); O.r = Math.min(80, camera.position.length()); }
  document.body.dataset.mode = m; hudMode();
}
function resetView() { if (G.mode === 'orbit') { O.tgtGoal.set(0, 4, 0); O.rGoal = 46; O.pitch = .38; select(-1); } else if (G.mode === 'walk') { W.x = pathX(54); W.z = 54; W.yaw = 0; W.pitch = -.04; } else FLY.u = 0; }
function focusHero(i) {
  const h = heroes[i];
  if (G.mode === 'orbit') {
    O.tgtGoal.set(h.x, h.y + h.top * .5, h.z); O.rGoal = 12 + h.top; O.pitch = .3; O.idle = 0;
    // pick a view direction with free line of sight (no giant or other mushroom between camera and hero)
    let best = 0, bs = -1e9; const base = Math.atan2(h.x, h.z);
    for (let k = 0; k < 24; k++) {
      const yw = base + k / 24 * TAU, cx = h.x + Math.sin(yw) * O.rGoal, cz = h.z + Math.cos(yw) * O.rGoal; let sc = -Math.abs(Math.atan2(Math.sin(k / 24 * TAU - .5), Math.cos(k / 24 * TAU - .5))) * 2;
      for (const g of giants) for (let s = .15; s <= 1.01; s += .17) { const px = lerp(h.x, cx, s), pz = lerp(h.z, cz, s), d = Math.hypot(g.x - px, g.z - pz); if (d < g.o.capR * 1.3) sc -= 10; }
      for (const o of heroes) if (o !== h) for (let s = .3; s <= 1.01; s += .23) { const d = Math.hypot(o.x - lerp(h.x, cx, s), o.z - lerp(h.z, cz, s)); if (d < o.capR + .8) sc -= 4; }
      if (Math.hypot(cx, cz) < 9) sc -= 6; if (Math.hypot(cx, cz) > 66) sc -= 3;
      if (sc > bs) { bs = sc; best = yw; }
    }
    O.yawGoal = best;
  }
  else if (G.mode === 'walk') { const a = Math.atan2(h.x, h.z); W.x = h.x + Math.sin(a) * 9; W.z = h.z + Math.cos(a) * 9; if (walkBlocked(W.x, W.z)) { W.x -= Math.sin(a) * 3; W.z -= Math.cos(a) * 3; } W.yaw = Math.atan2(W.x - h.x, W.z - h.z); W.pitch = .05; }
}

// ---------------------------------------------------------------- picking + pointer input
const ray = new THREE.Raycaster(), _nd = new THREE.Vector2();
function pickAt(px, py) {
  _nd.set(px / innerWidth * 2 - 1, -py / innerHeight * 2 + 1); ray.setFromCamera(_nd, camera);
  const o = ray.ray.origin, d = ray.ray.direction; let best = null;
  const test = (c, r, what) => { const oc = o.clone().sub(c), b = oc.dot(d), cc = oc.lengthSq() - r * r, disc = b * b - cc; if (disc < 0) return; const t = -b - Math.sqrt(disc); if (t > 0 && (!best || t < best.t)) best = { t, what }; };
  heroes.forEach((h, i) => test(h.pickC, h.pickR, i));
  test(new V3(0, mother.y + 10, 0), 7.5, 'mother');
  // ground
  let gt = null; for (let t = .5; t < 140; t += .4) { const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t; if (y < H(x, z)) { gt = t; break; } }
  if (best && (gt === null || best.t < gt + 2)) return best;
  if (gt !== null) return { t: gt, what: 'ground', x: o.x + d.x * gt, z: o.z + d.z * gt };
  return null;
}
function doTap(px, py, listen) {
  const p = pickAt(px, py); if (!p) return;
  if (p.what === 'mother') tapMother(listen);
  else if (p.what === 'ground') tapGround(p.x, p.z);
  else listen ? listenHero(p.what) : tapHero(p.what);
}
const ptrs = new Map(); let pinch0 = 0, holdTimer = 0, downInfo = null;
canvas.addEventListener('pointerdown', e => {
  if (!G.started) return;
  canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  O.idle = 0;
  if (ptrs.size === 1) {
    downInfo = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false, held: false };
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { if (downInfo && !downInfo.moved) { downInfo.held = true; showHold(downInfo.x, downInfo.y); doTap(downInfo.x, downInfo.y, true); } }, 520);
    showHold(e.clientX, e.clientY, true);
  } else { downInfo = null; clearTimeout(holdTimer); hideHold(); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); } }
});
canvas.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) { if (!IS_TOUCH && G.started) hover(e.clientX, e.clientY); return; }
  const p = ptrs.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (downInfo && Math.hypot(e.clientX - downInfo.x, e.clientY - downInfo.y) > 9) { downInfo.moved = true; clearTimeout(holdTimer); hideHold(); }
  if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0 && G.mode === 'orbit') O.rGoal = clamp(O.rGoal * pinch0 / d, 8, 95); pinch0 = d; return; }
  const k = IS_TOUCH ? .0062 : .0042;
  if (G.mode === 'orbit') { O.yaw -= dx * k; O.pitch += dy * k; O.yawGoal = null; }
  else if (G.mode === 'walk') { W.yaw -= dx * k * .9; W.pitch -= dy * k * .9; }
});
const endPtr = e => {
  if (!ptrs.has(e.pointerId)) return; ptrs.delete(e.pointerId); clearTimeout(holdTimer); hideHold();
  if (downInfo && !downInfo.moved && !downInfo.held && performance.now() - downInfo.t < 520) doTap(downInfo.x, downInfo.y, false);
  downInfo = null;
};
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); if (G.mode === 'orbit') { O.rGoal = clamp(O.rGoal * Math.exp(e.deltaY * .0012), 8, 95); O.idle = 0; } }, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return; keys[e.code] = true;
  if (!G.started) { if (e.code === 'Enter' || e.code === 'Space') enter(); return; }
  if (e.code === 'Digit1') setMode('orbit'); if (e.code === 'Digit2') setMode('walk'); if (e.code === 'Digit3') setMode('fly');
  if (e.code === 'KeyL') setLens({ bio: 'machine', machine: 'mind', mind: 'bio' }[S.lens]);
  if (e.code === 'KeyE' || e.code === 'KeyQ') { const i = heroInView(); if (i >= 0) e.code === 'KeyE' ? tapHero(i) : listenHero(i); else if (e.code === 'KeyE') pulseNow(); }
  if (e.code === 'Space') { e.preventDefault(); pulseNow(); }
  if (e.code === 'KeyR' && !e.metaKey && !e.ctrlKey) resetView();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
function heroInView() {
  const f = new V3(); camera.getWorldDirection(f); let best = -1, bs = -1;
  heroes.forEach((h, i) => { const v = h.pickC.clone().sub(camera.position); const d = v.length(); const s = v.normalize().dot(f) - d * .004; if (v.dot(f) > .9 && d < 40 && s > bs) { bs = s; best = i; } });
  return best;
}
function pulseNow() {
  if (G.mode === 'walk') { const n = nearestNode(W.x, W.z, 12); fire(n >= 0 ? n : 0, 1); burst(W.x, H(W.x, W.z) + .4, W.z, LENS[S.lens].a, 40, 1.2); }
  else if (G.sel >= 0) fire(heroes[G.sel].node, 1);
  else fire(0, 1.1);
}
// joystick
{
  const base = $('joy'), knob = $('knob'); let jid = null, cx = 0, cy = 0;
  const upd = e => { const r = 46; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy); if (l > r) { dx *= r / l; dy *= r / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; joy.x = dx / r; joy.y = dy / r; };
  base.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); base.setPointerCapture(e.pointerId); jid = e.pointerId; const b = base.getBoundingClientRect(); cx = b.left + b.width / 2; cy = b.top + b.height / 2; joy.on = true; upd(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === jid) upd(e); });
  const end = e => { if (e.pointerId !== jid) return; jid = null; joy.on = false; joy.x = joy.y = 0; knob.style.transform = ''; };
  base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
}

// ---------------------------------------------------------------- HUD
TIERS[0].bl = 1.05; TIERS[1].bl = 1.0; TIERS[2].bl = .9; TIERS[3].bl = .8;
const pad2 = n => String(n).padStart(2, '0');
let toastT = 0;
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('hide'); el.style.opacity = 1; toastT = 2.4; }
function hudNet() {
  $('net').innerHTML = `NETZ <b>${pad2(G.connected)}/12</b> VERBUNDEN`;
  document.querySelectorAll('#dots button').forEach((b, i) => { b.classList.toggle('on', heroes[i].connected); b.classList.toggle('ls', heroes[i].listened); b.classList.toggle('sel', G.sel === i); });
  $('mF').textContent = `${pad2(G.listened.size)}/12`;
  $('status').textContent = G.final ? 'MUTTERPILZ WACH · NETZ SYNCHRON · DER WALD ERINNERT SICH' : `MYZEL // SPORENWALD v0.1 · NETZ ${pad2(G.connected)}/12 · ${G.connected ? 'SIGNAL FLIESST' : 'WALD SCHLÄFT'}`;
  $('status').classList.toggle('core', G.final);
}
function hudDens() { $('dens').textContent = `SPORENDICHTE: ${Math.round(S.spores * 100)} %`; }
function hudMode() {
  document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === G.mode));
  $('mM').textContent = { orbit: 'ORBIT', walk: 'BEGEHEN', fly: 'KAMERAFAHRT' }[G.mode];
  $('walkui').classList.toggle('hide', G.mode !== 'walk' || !IS_TOUCH);
  $('hint').innerHTML = G.mode === 'walk' ? (IS_TOUCH ? 'TAP: SPOREN FREISETZEN · HALTEN: ZUHÖREN · JOYSTICK / DRAG: BEWEGEN' : 'TAP: SPOREN FREISETZEN · HALTEN: ZUHÖREN · WASD / DRAG: BEWEGEN · SHIFT: SCHNELLER') : 'TAP: SPOREN FREISETZEN · HALTEN: ZUHÖREN · WASD / DRAG: BEWEGEN';
}
function setLens(l) {
  S.lens = l; saveS(); const L = LENS[l];
  ribMat.uniforms.uA.value.copy(L.a); ribMat.uniforms.uB.value.copy(L.b); scene.userData.hyphae.color.copy(L.a);
  document.documentElement.style.setProperty('--acc', L.css);
  document.querySelectorAll('#lens button').forEach(b => b.classList.toggle('on', b.dataset.lens === l));
  select(G.sel, true);
}
function select(i, keep) {
  G.sel = i; const el = $('info');
  if (i === -1) { el.classList.add('hide'); hudNet(); return; }
  const L = S.lens;
  if (i === -2) {
    $('iK').textContent = 'KERN · MITTE'; $('iT').textContent = 'MUTTERPILZ';
    $('iF').textContent = G.final ? '„Der Wald erinnert sich an dich.“' : `Schläft. ${12 - G.connected} Pilze fehlen noch im Netz.`;
    $('iX').textContent = MOTHER[L]; $('iL').textContent = LENS[L].n;
  } else {
    const h = heroes[i]; $('iK').textContent = `PILZ ${pad2(i + 1)} · ${h.connected ? 'VERBUNDEN' : 'SCHLÄFT'}`; $('iT').textContent = SPECIES[h.sem.sp].n;
    $('iF').textContent = h.listened ? `„${h.sem.f}“` : 'HALTEN: ZUHÖREN';
    $('iF').classList.toggle('dim', !h.listened);
    $('iX').textContent = h.sem[L]; $('iL').textContent = LENS[L].n;
  }
  el.classList.remove('hide');
  if (!keep && i >= 0 && G.mode === 'orbit') focusHero(i);
  hudNet();
}
let whisperTimer = 0;
function whisper(text, who) {
  const el = $('whisper'); el.classList.remove('hide'); $('wK').textContent = who + ' FLÜSTERT'; const t = $('wT'); t.textContent = '';
  clearInterval(whisperTimer); let k = 0; const full = `„${text}“`;
  whisperTimer = setInterval(() => { k++; t.textContent = full.slice(0, k); if (k >= full.length) { clearInterval(whisperTimer); whisperTimer = setTimeout(() => el.classList.add('hide'), 5200); } }, 34);
}
function banner(a, b) {
  const el = $('banner'); $('b1').textContent = a; $('b2').textContent = ''; el.classList.remove('hide', 'fade'); el.classList.add('in');
  setTimeout(() => { $('b2').textContent = b; $('b2').classList.add('in'); }, 2600);
  setTimeout(() => { el.classList.add('fade'); }, 8200); setTimeout(() => { el.classList.add('hide'); el.classList.remove('in', 'fade'); $('b2').classList.remove('in'); }, 9600);
}
function showHold(x, y, pre) { const h = $('hold'); h.style.left = x + 'px'; h.style.top = y + 'px'; h.classList.remove('hide', 'go', 'done'); void h.offsetWidth; h.classList.add(pre ? 'go' : 'done'); }
function hideHold() { const h = $('hold'); if (!h.classList.contains('done')) h.classList.add('hide'); else setTimeout(() => h.classList.add('hide'), 350); }
function hover(x, y) {
  const p = pickAt(x, y), tip = $('tip');
  if (p && p.what !== 'ground') {
    const h = p.what === 'mother' ? null : heroes[p.what];
    tip.innerHTML = h ? `<em>PILZ ${pad2(p.what + 1)} · ${h.connected ? 'VERBUNDEN' : 'SCHLÄFT'}</em>${SPECIES[h.sem.sp].n}` : `<em>KERN</em>MUTTERPILZ`;
    tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.remove('hide'); canvas.style.cursor = 'pointer';
  } else { tip.classList.add('hide'); canvas.style.cursor = ''; }
}
// build dots
{
  const d = $('dots');
  SEM.forEach((s, i) => { const b = document.createElement('button'); b.innerHTML = `<i></i><span>${pad2(i + 1)}</span>`; b.title = SPECIES[s.sp].n; b.style.setProperty('--c', '#' + SPECIES[s.sp].col.getHexString()); b.onclick = () => { if (G.mode === 'fly') setMode('orbit'); focusHero(i); select(i, true); }; d.appendChild(b); });
}
document.querySelectorAll('#lens button').forEach(b => b.onclick = () => setLens(b.dataset.lens));
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
$('infoX').onclick = () => select(-1);
$('bPulse').onclick = () => pulseNow();
$('bReset').onclick = () => resetView();
$('bDrawer').onclick = () => { $('drawer').classList.toggle('hide'); $('bDrawer').classList.toggle('on'); };
$('bNetReset').onclick = () => resetNet();
function bindSlider(id, key, fmt, after) {
  const el = $('s_' + id), v = $('v_' + id); el.value = S[key];
  const upd = () => { S[key] = +el.value; v.textContent = fmt(S[key]); after && after(); };
  el.addEventListener('input', upd); el.addEventListener('change', saveS); upd();
}
bindSlider('spores', 'spores', x => Math.round(x * 100) + ' %', () => { hudDens(); amb.g.setDrawRange(0, Math.round(AMB * S.spores * TIERS[tier].sp)); });
bindSlider('glow', 'glow', x => x.toFixed(2), () => { bloom.strength = TIERS[tier].bl * (.65 + .35 * S.glow); });
let growT = 0;
bindSlider('growth', 'growth', x => x.toFixed(2), () => { growT = .15; });
bindSlider('signal', 'signal', x => Math.round(x * 100) + ' %', () => { ribMat.uniforms.uSpeed.value = S.signal; });

// ---------------------------------------------------------------- REC
let rec = null, recChunks = [], recStart = 0, recUrl = null;
function pickMime() { if (!window.MediaRecorder) return null; const mp4 = ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4'], webm = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const safari = /^((?!chrome|chromium|android|crios).)*safari/i.test(navigator.userAgent); const c = safari ? [...mp4, ...webm] : [...webm, ...mp4]; for (const m of c) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) { } } return ''; }
$('bRec').addEventListener('click', () => {
  if (rec) { try { rec.requestData(); } catch (_) { } rec.stop(); return; }
  const mime = pickMime(); if (mime === null || !canvas.captureStream) { toast('REC WIRD VON DIESEM BROWSER NICHT UNTERSTÜTZT'); return; }
  try {
    const stream = canvas.captureStream(30); rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 10e6 } : { videoBitsPerSecond: 10e6 }); recChunks = [];
    const r = rec;
    r.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
    r.onstop = () => {
      const type = r.mimeType || mime || 'video/webm', ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(recChunks, { type: type.split(';')[0] });
      rec = null; $('bRec').classList.remove('on');
      if (!blob.size) { $('rectime').classList.add('hide'); toast('REC: KEINE VIDEODATEN, BITTE LÄNGER AUFNEHMEN'); window.__lastRec = { size: 0, type }; return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `sporenwald-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
  } catch (err) { rec = null; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});

// ---------------------------------------------------------------- quality + resize
let uH = 800;
function applyTier(t) {
  tier = t; const Tt = TIERS[t];
  renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl * (.65 + .35 * S.glow);
  decCap.count = decStem.count = Math.round(dec.length * Tt.dec);
  amb.g.setDrawRange(0, Math.round(AMB * S.spores * Tt.sp));
  resize();
  document.querySelectorAll('#qual button').forEach(b => b.classList.toggle('on', +b.dataset.q === t)); $('mQ').textContent = Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 68 : 58; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(); uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of [nodeMat, amb.m, burstP.m, mother.spiral]) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  scene.userData.stars.uniforms.uPR.value = pr;
}
addEventListener('resize', resize);
document.querySelectorAll('#qual button').forEach(b => b.onclick = () => { autoQ = false; applyTier(+b.dataset.q); toast('GRAFIK: ' + TIERS[tier].n); });

// ---------------------------------------------------------------- frame
const fpsWin = []; let lowT = 0, warm = 0, manual = false, lastNow = performance.now();
function frame(dt) {
  T += dt; const t = T;
  ribMat.uniforms.uTime.value = t; amb.m.uniforms.uTime.value = t; scene.userData.sky.uniforms.uTime.value = t; scene.userData.stars.uniforms.uTime.value = t; mother.spiral.uniforms.uTime.value = t;
  // ambient network chatter
  const rate = (.25 + S.signal * 2.2 + G.connected * .12) * (G.started ? 1 : .6);
  if (Math.random() < rate * dt) { const pool = heroes.filter(h => h.connected); const n = pool.length && Math.random() < .6 ? pick(pool).node : (Math.random() * nodes.length | 0); fire(n, rr(.45, .8)); }
  if (G.final) { const ph = (t - G.finalT) % 1.6; if (ph < dt) fire(0, 1.05); }
  updatePulses(dt); updateBonds(dt); updateBurst(dt);
  // heroes
  for (const h of heroes) {
    h.wake *= Math.exp(-dt * 1.6);
    const breath = .06 * Math.sin(t * 1.2 + h.i * 1.7);
    const k = Math.min(1.7, (h.connected ? .9 : .55) + breath + h.wake * .6 + (G.final ? .15 : 0)) * S.glow;
    applyDrive(h.list, k);
    const gs = .55 + .45 * S.growth; h.g.scale.setScalar(gs * (1 + h.wake * .04));
    if (h.drips) updateDrips(h.drips, t + h.i);
    if (h.eye) { h.eye.g.lookAt(camera.position); }
    h.pickC.set(h.x, h.y + h.top * .55 * gs, h.z); h.pickR = Math.max(h.top * .55, h.capR) * gs;
  }
  // mother
  mother.awake = G.final ? Math.min(1, (t - G.finalT) / 5) : Math.max(0, mother.awake - dt);
  mother.ping *= Math.exp(-dt * 2);
  const beat = G.final ? Math.pow(Math.max(0, Math.sin((t - G.finalT) / 1.6 * Math.PI * 2)), 8) : 0;
  const mk = Math.min(1.8, .35 + G.connected * .025 + mother.ping * .4 + mother.awake * .6 + beat * .3) * S.glow;
  applyDrive(mother.list, mk);
  mother.light.intensity = 2 + mk * 5;
  mother.rings.forEach((r, i) => { r.rotation.z = t * (.2 + i * .07) * (i % 2 ? -1 : 1); r.position.y = 2.5 + i * 3.1 + (mother.awake ? Math.sin(t * 1.4 + i) * .5 * mother.awake : 0); r.scale.setScalar(1 + mother.awake * (.3 + i * .25) + beat * .1); });
  mother.g.scale.setScalar((.8 + .2 * S.growth) * (1 + beat * .015));
  mother.spiral.uniforms.uA.value = mother.awake;
  ribMat.uniforms.uSync.value = mother.awake * .8;
  ribMat.uniforms.uBase.value = (.55 + G.connected * .02 + mother.awake * .2);
  ribMat.uniforms.uK.value = S.glow;
  giants.forEach(g => applyDrive(g.o.list, (.8 + .12 * Math.sin(t * .5 + g.ph) + mother.awake * .2) * S.glow));
  updateDecor(t);
  if (growT > 0) { growT -= dt; if (growT <= 0) layoutDecor(); }
  amb.m.uniforms.uK.value = .8 + mother.awake * .6;
  updateCamera(dt);
  // HUD
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) { $('toast').style.opacity = 0; setTimeout(() => toastT <= 0 && $('toast').classList.add('hide'), 500); } }
  if ((frameN++ & 7) === 0) {
    $('mS').textContent = (stat.sig.length / 3).toFixed(0); $('mH').textContent = pulses.length;
    if (rec) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; }
  }
}
let frameN = 0;
function render() { composer.render(); }
function loop(now) {
  requestAnimationFrame(loop);
  if (manual) return;
  let dt = (now - lastNow) / 1000; lastNow = now; if (!(dt > 0)) return; dt = Math.min(dt, .066);
  frame(dt); render();
  if (autoQ && G.started) {
    warm += dt; fpsWin.push(dt); if (fpsWin.length > 90) fpsWin.shift();
    if (warm > 4 && fpsWin.length >= 60) { const fps = fpsWin.length / fpsWin.reduce((a, b) => a + b, 0); if (fps < 40) { lowT += dt; if (lowT > 3 && tier < 3) { applyTier(tier + 1); toast('GRAFIK: ' + TIERS[tier].n); lowT = 0; fpsWin.length = 0; warm = 2; } } else lowT = Math.max(0, lowT - dt); }
  }
}

// ---------------------------------------------------------------- start
$('mK').textContent = nodes.length; $('mY').textContent = Math.round(edges.reduce((s, e) => s + e.L, 0)) + ' m';
function enter() {
  if (G.started) return; G.started = true; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  O.idle = 0; toast('HÖR DEM NETZ ZU.'); fire(pathNodes[0].i, 1);
}
$('go').onclick = enter;
setLens(S.lens); hudNet(); hudDens(); hudMode(); document.body.dataset.mode = G.mode;
applyTier(tier);
requestAnimationFrame(loop);
// warm up: compile + first frame
frame(.016); render();
$('go').disabled = false; $('go').textContent = 'BETRETEN';
if (Q.has('go')) enter();
if ('serviceWorker' in navigator && !Q.has('nosw')) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }));

// ---------------------------------------------------------------- test hooks
window.__SF = {
  ready: true,
  setManual(v) { manual = v; lastNow = performance.now(); },
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); render(); },
  state() { return { tier: TIERS[tier].n, mode: G.mode, connected: G.connected, listened: G.listened.size, final: G.final, pulses: pulses.length, nodes: nodes.length, edges: edges.length, cam: camera.position.toArray().map(v => +v.toFixed(2)), walk: [W.x, W.z].map(v => +v.toFixed(2)), awake: mother.awake, decor: decCap.count }; },
  tapHero, listenHero, tapGround, connectAll, finale, setMode, setLens, resetNet, enter, pulseNow, select,
  setTier(t) { autoQ = false; applyTier(t); },
  photo(px, py, pz, tx, ty, tz, fov) { G.mode = 'photo'; $('tip').classList.add('hide'); camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz); if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); } render(); },
  heroes: () => heroes.map(h => ({ x: h.x, z: h.z, y: h.y, top: h.top, sp: h.sem.sp })),
  key(code, down) { keys[code] = down; },
  H, pathX, fireNear(x, z, en = 1) { const n = nearestNode(x, z, 6); if (n >= 0) fire(n, en); return n; },
  setJoy(x, y, on) { joy.x = x; joy.y = y; joy.on = on; },
  project(x, y, z) { const v = new V3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; }
};
