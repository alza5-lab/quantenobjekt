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
