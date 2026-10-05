// EYE CORE – erster spielbarer Build (v0.1)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const V3 = THREE.Vector3;
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
let seed = 1337; const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
const IS_TOUCH = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
document.body.classList.toggle('touch', IS_TOUCH);

// ---------------------------------------------------------------- Renderer
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const Q_ORDER = ['ultra', 'hoch', 'mittel', 'niedrig'];
let quality = localStorage.getItem('eyecore.q') || 'ultra';
if (!Q_ORDER.includes(quality)) quality = quality === 'hoch' ? 'hoch' : 'ultra';
let muted = localStorage.getItem('eyecore.mute') === '1';
const PR_MAX = {
  ultra: IS_TOUCH ? 2 : 3,
  hoch: IS_TOUCH ? 1.5 : 2,
  mittel: IS_TOUCH ? 1.1 : 1.35,
  niedrig: IS_TOUCH ? 0.85 : 1,
};
const prFor = q => Math.min(window.devicePixelRatio || 1, PR_MAX[q] ?? PR_MAX.mittel);
renderer.setPixelRatio(prFor(quality));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const FOG_BASE = new THREE.Color(0x0d0724);
scene.fog = new THREE.FogExp2(FOG_BASE.clone(), 0.0055);
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 2600);

// ---------------------------------------------------------------- Canvas-Texturen
function sacred(ctx, cx, cy, r, col, lw = 2) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.shadowColor = col; ctx.shadowBlur = lw * 4;
  const circ = (x, y, rr) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke(); };
  circ(cx, cy, r); circ(cx, cy, r * 0.82);
  for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + k * Math.PI + i * 2 * Math.PI / 3; const x = cx + Math.cos(a) * r * 0.82, y = cy + Math.sin(a) * r * 0.82; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; circ(cx + Math.cos(a) * r * 0.27, cy + Math.sin(a) * r * 0.27, r * 0.27); }
  ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy); ctx.quadraticCurveTo(cx, cy - r * 0.32, cx + r * 0.45, cy); ctx.quadraticCurveTo(cx, cy + r * 0.32, cx - r * 0.45, cy); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r * 0.08, 0, 7); ctx.fill();
  for (let i = 0; i < 20; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); ctx.lineTo(cx + Math.cos(a) * r * 1.0, cy + Math.sin(a) * r * 1.0); ctx.stroke(); }
  ctx.restore();
}
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d'); draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
const coatTex = canvasTex(2048, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
  // finer micro-grid on fabric
  ctx.strokeStyle = 'rgba(90,60,180,.18)'; ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 16) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 16) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  sacred(ctx, w / 2, h * 0.36, 240, '#b07cff', 5);
  sacred(ctx, w / 2, h * 0.36, 104, '#5ef2ff', 4);
  sacred(ctx, w / 2, h * 0.36, 48, '#ff5fd8', 2);
  for (const x of [0, w]) sacred(ctx, x, h * 0.3, 80, '#5ef2ff', 3);
  ctx.strokeStyle = '#8f6bff'; ctx.shadowColor = '#8f6bff'; ctx.shadowBlur = 14; ctx.lineWidth = 4;
  for (let y of [h - 50, h - 78, h - 106]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.font = '36px monospace'; ctx.fillStyle = '#5ef2ff'; ctx.shadowColor = '#5ef2ff';
  const glyphs = '◇△▽○◈⟁⌬⏃⏚⍜⎔⟐⬡⬢✴✵';
  for (let i = 0; i < 72; i++) ctx.fillText(glyphs[i % glyphs.length], i * 28 + 4, h - 58);
  ctx.lineWidth = 2; ctx.strokeStyle = '#5ef2ff';
  for (const x of [48, w - 48]) { ctx.beginPath(); ctx.moveTo(x, h * 0.45); ctx.lineTo(x, h - 110); ctx.stroke(); for (let y = h * 0.48; y < h - 120; y += 22) { ctx.strokeRect(x - 7, y, 14, 14); } }
  // seam stitches
  ctx.strokeStyle = 'rgba(180,140,255,.35)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; const cx = w/2 + Math.cos(a)*90, cy = h*0.36 + Math.sin(a)*90; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx+Math.cos(a)*18, cy+Math.sin(a)*18); ctx.stroke(); }
});
coatTex.anisotropy = MAX_ANISO;
const coatNrm = canvasTex(1024, 512, (ctx, w, h) => {
  ctx.fillStyle = '#8080ff'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 7;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(170,170,255,.55)'); g.addColorStop(1, 'rgba(128,128,255,0)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.strokeStyle = 'rgba(200,200,255,.4)'; ctx.lineWidth = 2;
  for (let y = h * .55; y < h; y += 18) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}, false);
coatNrm.anisotropy = MAX_ANISO;
const ringTex = canvasTex(512, 512, (ctx) => { sacred(ctx, 256, 256, 220, '#a77bff', 4); sacred(ctx, 256, 256, 90, '#5ef2ff', 2); });
const blobTex = canvasTex(256, 256, (ctx) => { const g = ctx.createRadialGradient(128, 128, 6, 128, 128, 124); g.addColorStop(0, 'rgba(0,0,0,.78)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); });
const glowTex = canvasTex(256, 256, (ctx) => { const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); });
const cloudTex = canvasTex(512, 512, (ctx) => {
  for (let i = 0; i < 48; i++) { const x = 100 + rnd() * 312, y = 140 + rnd() * 220, r = 36 + rnd() * 90; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512); }
});
const gridTex = canvasTex(512, 512, (ctx, w) => {
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, w);
  ctx.strokeStyle = 'rgba(110,80,255,.95)'; ctx.lineWidth = 3; ctx.strokeRect(2, 2, w - 4, w - 4);
  ctx.strokeStyle = 'rgba(80,200,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, w); ctx.moveTo(0, w / 2); ctx.lineTo(w, w / 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,90,255,.2)'; ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) { const t = i / 8 * w; ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t, w); ctx.moveTo(0, t); ctx.lineTo(w, t); ctx.stroke(); }
  ctx.fillStyle = 'rgba(94,242,255,.95)'; ctx.fillRect(0, 0, 6, 6);
});
gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(100, 100); gridTex.anisotropy = MAX_ANISO;
const gridNrm = canvasTex(512, 512, (ctx, w) => {
  ctx.fillStyle = '#8080ff'; ctx.fillRect(0, 0, w, w);
  ctx.strokeStyle = 'rgba(200,200,255,.7)'; ctx.lineWidth = 4; ctx.strokeRect(3, 3, w - 6, w - 6);
  ctx.strokeStyle = 'rgba(180,180,255,.35)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, w); ctx.moveTo(0, w/2); ctx.lineTo(w, w/2); ctx.stroke();
  for (let i = 1; i < 8; i++) { const t = i / 8 * w; ctx.beginPath(); ctx.moveTo(t, 0); ctx.lineTo(t, w); ctx.moveTo(0, t); ctx.lineTo(w, t); ctx.stroke(); }
}, false);
gridNrm.wrapS = gridNrm.wrapT = THREE.RepeatWrapping; gridNrm.repeat.set(100, 100); gridNrm.anisotropy = MAX_ANISO;
const towerTex = canvasTex(1024, 2048, (ctx, w, h) => {
  ctx.fillStyle = '#0c0820'; ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 48) {
    ctx.fillStyle = y % 96 === 0 ? 'rgba(90,50,180,.22)' : 'rgba(40,30,90,.18)';
    ctx.fillRect(0, y, w, 44);
    ctx.strokeStyle = 'rgba(160,120,255,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.fillStyle = 'rgba(94,242,255,.35)';
    for (let x = 24; x < w; x += 64) ctx.fillRect(x, y + 14, 10, 10);
  }
  ctx.strokeStyle = 'rgba(94,242,255,.4)'; ctx.lineWidth = 3;
  for (const x of [w * .25, w * .5, w * .75]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  sacred(ctx, w / 2, h * 0.12, 90, '#b08cff', 3);
  sacred(ctx, w / 2, h * 0.88, 70, '#5ef2ff', 2);
});
towerTex.wrapS = towerTex.wrapT = THREE.RepeatWrapping; towerTex.anisotropy = MAX_ANISO;
const towerNrm = canvasTex(512, 1024, (ctx, w, h) => {
  ctx.fillStyle = '#8080ff'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(220,220,255,.75)'; ctx.lineWidth = 3;
  for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  for (const x of [w * .25, w * .5, w * .75]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
}, false);
towerNrm.wrapS = towerNrm.wrapT = THREE.RepeatWrapping; towerNrm.anisotropy = MAX_ANISO;
const glyphTex = canvasTex(256, 256, (ctx, w) => {
  ctx.clearRect(0, 0, w, w);
  const glyphs = '◇△▽○◈⟁⌬⟐';
  ctx.font = '140px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#5ef2ff'; ctx.shadowColor = '#5ef2ff'; ctx.shadowBlur = 18;
  ctx.fillText(glyphs[Math.floor(rnd() * glyphs.length)], w / 2, w / 2);
});
const mapTex = canvasTex(1024, 640, (ctx, w, h) => {
  ctx.fillStyle = 'rgba(12,4,30,.92)'; ctx.fillRect(0, 0, w, h); ctx.strokeStyle = '#7a5cff'; ctx.lineWidth = 3; ctx.strokeRect(6, 6, w - 12, h - 12);
  ctx.fillStyle = '#b08cff'; ctx.font = '32px monospace'; ctx.fillText('ROOM MAP · CORE ROOM 07', 28, 52);
  const N = [[160, 220], [340, 160], [520, 240], [740, 180], [250, 400], [470, 420], [700, 400], [840, 500]];
  ctx.strokeStyle = '#ff5fd8'; ctx.shadowColor = '#ff5fd8'; ctx.shadowBlur = 12; ctx.lineWidth = 4;
  [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 2], [5, 6], [6, 3], [6, 7]].forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(...N[a]); ctx.lineTo(...N[b]); ctx.stroke(); });
  N.forEach(([x, y], i) => { ctx.fillStyle = i === 7 ? '#5ef2ff' : '#ff5fd8'; ctx.fillRect(x - 14, y - 14, 28, 28); });
  ctx.fillStyle = '#5ef2ff'; ctx.shadowBlur = 0; ctx.font = '24px monospace'; ctx.fillText('NODES 24/128 · ACCESS LEVEL 7', 28, h - 28);
});
mapTex.anisotropy = MAX_ANISO;

// ---------------------------------------------------------------- Himmel
const skyGroup = new THREE.Group(); scene.add(skyGroup);
const FLOWER_POS = new V3(0, 80, -200);
const skyMat = new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { uTime: { value: 0 }, uFinale: { value: 0 }, uFdir: { value: FLOWER_POS.clone().normalize() } },
  vertexShader: `varying vec3 vDir; void main(){ vDir=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position=p.xyww; }`,
  fragmentShader: `uniform float uTime,uFinale; uniform vec3 uFdir; varying vec3 vDir;
  float hash(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
  float noise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
   return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
              mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p*=2.03;a*=.5;}return s;}
  void main(){ vec3 d=normalize(vDir); float h=d.y;
   vec3 col=mix(vec3(.17,.075,.36),vec3(.012,.008,.045),smoothstep(-.02,.6,h));
   float n=fbm(d*2.6+vec3(0.,uTime*.006,0.));
   float neb=smoothstep(.42,.86,n)*smoothstep(-.05,.35,h);
   col+=neb*mix(vec3(.42,.12,.7),vec3(.06,.38,.7),fbm(d*4.5+3.))*.95;
   float g=max(dot(d,normalize(uFdir)),0.);
   col+=vec3(.9,.3,1.)*pow(g,40.)*(1.2+uFinale*3.)+vec3(.45,.15,.75)*pow(g,5.)*(.35+uFinale*.6);
   col=mix(col,vec3(.06,.025,.14),smoothstep(0.,-.25,h));
   gl_FragColor=vec4(col,1.);}`
});
skyGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1500, 64, 32), skyMat));
{
  const n = 5200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = rnd() * 2 - 1, a = rnd() * Math.PI * 2; const y = Math.abs(u) * 0.95 + 0.02, r = Math.sqrt(1 - y * y);
    pos.set([Math.cos(a) * r * 1400, y * 1400, Math.sin(a) * r * 1400], i * 3);
    const c = rnd(); const b = 0.6 + rnd() * 1.6; col.set(c < .3 ? [b * .7, b * .8, b * 1.3] : c < .5 ? [b * 1.2, b * .7, b * 1.3] : [b, b, b * 1.1], i * 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  skyGroup.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, fog: false, depthWrite: false, transparent: true })));
}
const planetMat = (c1, c2) => new THREE.ShaderMaterial({
  fog: false, uniforms: { c1: { value: new THREE.Color(c1) }, c2: { value: new THREE.Color(c2) } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform vec3 c1,c2; varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ float f=pow(1.-max(dot(vN,vV),0.),2.5); float l=max(dot(vN,normalize(vec3(.6,.5,.3))),0.); float band=.5+.5*sin(vP.y*.08+sin(vP.x*.03)*2.); vec3 c=c1*(.08+.5*l)*(.7+.3*band)+c2*f*1.8; gl_FragColor=vec4(c,1.);} `
});
const planets = [];
[[-700, 330, -900, 120, 0x3a2a7a, 0x9a6bff, true], [900, 480, -500, 60, 0x1a3c6a, 0x5ef2ff, false], [-300, 620, 900, 90, 0x5a1a5a, 0xff5fd8, false], [520, 190, 1000, 34, 0x2a2050, 0xb08cff, false]].forEach(([x, y, z, r, a, b, ring]) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 40), planetMat(a, b)); m.position.set(x, y, z); skyGroup.add(m); planets.push(m);
  if (ring) { const rg = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 2.2, 128), new THREE.MeshBasicMaterial({ color: 0x8a6cff, transparent: true, opacity: .35, side: THREE.DoubleSide, fog: false, blending: THREE.AdditiveBlending, depthWrite: false })); rg.rotation.x = -1.2; rg.rotation.y = .3; m.add(rg); }
});

// Kristallblume
const flower = new THREE.Group(); flower.position.copy(FLOWER_POS); scene.add(flower);
const petalMat = new THREE.MeshStandardMaterial({ color: 0x2a0a40, emissive: 0xd04cff, emissiveIntensity: 1.6, metalness: .3, roughness: .2, transparent: true, opacity: .92, fog: false });
const petalMat2 = new THREE.MeshStandardMaterial({ color: 0x0a1030, emissive: 0x4fd8ff, emissiveIntensity: 1.4, metalness: .3, roughness: .2, fog: false });
{
  const shard = new THREE.OctahedronGeometry(1, 1);
  const layer = (n, len, wid, mat, off, tilt) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + off; const m = new THREE.Mesh(shard, mat);
      m.scale.set(wid, len, wid * .6); m.position.set(Math.sin(a) * len * .9, Math.cos(a) * len * .9, 0);
      m.rotation.z = -a; m.rotation.x = tilt; flower.add(m);
    }
  };
  layer(8, 22, 4, petalMat, 0, 0); layer(8, 14, 3, petalMat2, Math.PI / 8, .5); layer(12, 34, 1.4, petalMat, Math.PI / 12, -.2); layer(6, 9, 2.5, petalMat2, 0, 1.1);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(6, 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.2, 3.2), fog: false })); flower.add(core);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9a50e0, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); halo.scale.set(110, 110, 1); flower.add(halo);
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(48 + i * 14, .35, 10, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(i === 1 ? 0x5ef2ff : 0xb08cff).multiplyScalar(2), fog: false, transparent: true, opacity: .7 }));
    r.rotation.x = 1.2 + i * .3; r.rotation.y = i * .7; r.userData.spin = (i + 1) * .05; flower.add(r);
  }
}
const clouds = [];
for (let i = 0; i < 52; i++) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: new THREE.Color().setHSL(.72 + rnd() * .08, .55, .5), transparent: true, opacity: .32 + rnd() * .12, depthWrite: false }));
  const a = rnd() * Math.PI * 2, r = 110 + rnd() * 170; s.position.set(Math.cos(a) * r, 28 + rnd() * 60, Math.sin(a) * r); const sc = 60 + rnd() * 100; s.scale.set(sc * 1.6, sc, 1); scene.add(s); clouds.push(s);
}

// ---------------------------------------------------------------- Terrain
const BUMPS = [[-105, -25, 22, 26], [-85, 35, 13, 20], [-128, 30, 10, 14], [-70, -78, 11, 16], [-128, -92, 15, 20], [-62, 72, 6, 15], [-120, 110, 8, 18]];
const RIFT = { x0: 30.3, x1: 71.7, z0: -45.7, z1: -4.3 };
const inRift = (x, z, m = 0) => x > RIFT.x0 - m && x < RIFT.x1 + m && z > RIFT.z0 - m && z < RIFT.z1 + m;
function H(x, z) {
  if (inRift(x, z)) return -40;
  let h = 0; for (const b of BUMPS) { const dx = x - b[0], dz = z - b[1]; h += b[2] * Math.exp(-(dx * dx + dz * dz) / (b[3] * b[3])); }
  const e = Math.max(Math.abs(x), Math.abs(z)); if (e > 134) h += (e - 134) * (e - 134) * 0.045;
  return h;
}
const WORLD = 150;
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0b0820, roughness: .16, metalness: .9, emissive: 0xffffff, emissiveMap: gridTex, emissiveIntensity: .32,
  normalMap: gridNrm, normalScale: new THREE.Vector2(1.1, 1.1), envMapIntensity: .55,
});
{
  const g = new THREE.PlaneGeometry(WORLD * 2, WORLD * 2, 300, 300); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
  g.computeVertexNormals();
  const floorMesh = new THREE.Mesh(g, floorMat); floorMesh.receiveShadow = true; scene.add(floorMesh);
  const sh = new THREE.Shape(); sh.moveTo(-1400, -1400); sh.lineTo(1400, -1400); sh.lineTo(1400, 1400); sh.lineTo(-1400, 1400);
  const hole = new THREE.Path(); hole.moveTo(-149, -149); hole.lineTo(-149, 149); hole.lineTo(149, 149); hole.lineTo(149, -149); sh.holes.push(hole);
  const og = new THREE.ShapeGeometry(sh); og.rotateX(-Math.PI / 2); const om = new THREE.Mesh(og, new THREE.MeshStandardMaterial({ color: 0x07051a, roughness: .25, metalness: .9 })); om.position.y = 10; scene.add(om);
  const vg = new THREE.PlaneGeometry(RIFT.x1 - RIFT.x0, RIFT.z1 - RIFT.z0); vg.rotateX(-Math.PI / 2);
  const vm = new THREE.Mesh(vg, new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, .08, .9), fog: false })); vm.position.set((RIFT.x0 + RIFT.x1) / 2, -38, (RIFT.z0 + RIFT.z1) / 2); scene.add(vm);
}

// ---------------------------------------------------------------- Kollisionsboxen + Kanten-Linien
const boxes = [];
const edgeP = [], edgeC = [];
const COLS = { struct: [.55, .4, 1.9], plat: [.35, 1.6, 2.0], cube: [2.0, .4, 1.6], vault: [2.2, .3, 1.4], lat: [.5, .35, 1.6] };
function edgeBox(mn, mx, c) {
  const v = [[mn.x, mn.y, mn.z], [mx.x, mn.y, mn.z], [mx.x, mn.y, mx.z], [mn.x, mn.y, mx.z], [mn.x, mx.y, mn.z], [mx.x, mx.y, mn.z], [mx.x, mx.y, mx.z], [mn.x, mx.y, mx.z]];
  [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(([a, b]) => { edgeP.push(...v[a], ...v[b]); edgeC.push(...c, ...c); });
}
function addLine(a, b, c) { edgeP.push(...a, ...b); edgeC.push(...c, ...c); }
function addBox(x, y0, z, sx, sy, sz, cat = 'struct', opt = {}) {
  const b = { min: new V3(x - sx / 2, y0, z - sz / 2), max: new V3(x + sx / 2, y0 + sy, z + sz / 2), cat, size: new V3(sx, sy, sz), delta: new V3(), ...opt };
  if (opt.mover) { b.base = new V3(x, y0, z); }
  else if (cat && !opt.noEdge) edgeBox(b.min, b.max, COLS[cat] || COLS.struct);
  boxes.push(b); return b;
}
// Turm
addBox(0, 0, 0, 8, 60, 8, 'struct', { name: 'tower' });
addBox(0, 0, 0, 11, .6, 11, 'plat');
const spiral = [];
for (let k = 0; k < 29; k++) { const a = k * Math.PI / 6; const top = 2 + 2 * k; spiral.push(addBox(Math.sin(a) * 6.5, top - .6, Math.cos(a) * 6.5, 3, .6, 3, 'plat')); }
// Terrassen (Time Echo)
for (let i = 0; i < 7; i++) addBox((75 + 8 * i + 135) / 2, 0, (-135 + (-75 - 8 * i)) / 2, 135 - (75 + 8 * i), 2 * (i + 1), (-75 - 8 * i) - (-135), 'struct');
// Säule
addBox(105, 0, 10, 3, 10, 3, 'struct');
// Wandlauf-Wände
addBox(26, 0, 35, 1, 11, 30, 'struct'); addBox(34, 0, 35, 1, 11, 30, 'struct');
// Tresor
function vault(cx, cz) { const s = 6, t = .5, h = 4.5; addBox(cx, 0, cz - s / 2, s, h, t, 'vault'); addBox(cx, 0, cz + s / 2, s, h, t, 'vault'); addBox(cx - s / 2, 0, cz, t, h, s, 'vault'); addBox(cx + s / 2, 0, cz, t, h, s, 'vault'); addBox(cx, h, cz, s + t, t, s + t, 'vault'); }
vault(-35, 45);
// Gerüst
const SC = new V3(-50, 0, -50);
const scPos = [[5, 5], [0, 5], [-5, 5], [-5, 0], [-5, -5], [0, -5], [5, -5], [5, 0]];
for (let k = 0; k < 10; k++) { const [dx, dz] = scPos[k % 8]; const top = 2.2 * (k + 1); addBox(SC.x + dx, top - .4, SC.z + dz, 3, .4, 3, 'plat'); }
addBox(SC.x, 23.5, SC.z, 6, .5, 6, 'plat');
// Riss
[34.5, 40].forEach(x => addBox(x, -1, -25, 3, 1, 3, 'plat'));
[58, 66].forEach(x => addBox(x, -1, -25, 3, 1, 3, 'plat'));
const riftMover = addBox(50, -.8, -25, 4, .8, 4, 'plat', { mover: { axis: 'z', amp: 9, speed: .55, ph: 0 } });
// Insel + Trittwürfel
const ISL = new V3(-75, 30, -5);
addBox(ISL.x, ISL.y - 2, ISL.z, 10, 2, 10, 'cube');
const hillTop = new V3(-105, H(-105, -25), -25);
for (let i = 1; i <= 6; i++) { const t = i / 7; const x = lerp(hillTop.x, ISL.x - 4, t), z = lerp(hillTop.z, ISL.z - 3, t), y = lerp(hillTop.y + .8, ISL.y, t); addBox(x, y - 1.2, z, 2.6, 1.2, 2.6, 'cube'); }
// Erhöhungen auf der Fläche
[[-20, 20, 2], [-26, 14, 3.5], [-32, 8, 5], [-38, 2, 6.5], [20, -30, 1.5], [16, -40, 3], [12, -50, 4.5], [-15, -90, 3], [-8, -96, 5.5], [0, -102, 8]].forEach(([x, z, h]) => addBox(x, 0, z, 5, h, 5, 'struct'));
// Lattice-Türme am Rand
const latticeTowers = [[118, 0, 100, 6, 60], [-118, 0, -118, 6, 72], [-30, 0, 118, 6, 48], [128, 0, -40, 6, 54], [60, 0, 118, 5, 40]];
latticeTowers.forEach(([x, y, z, s, h]) => addBox(x, y, z, s, h, s, null));
// Digital Room
const DR = { x0: 60, x1: 104, z0: 50, z1: 60, h: 7 };
addBox((DR.x0 + DR.x1) / 2, 0, DR.z0 - .3, DR.x1 - DR.x0, DR.h, .6, 'struct');
addBox((DR.x0 + DR.x1) / 2, 0, DR.z1 + .3, DR.x1 - DR.x0, DR.h, .6, 'struct');
addBox((DR.x0 + DR.x1) / 2, DR.h, (DR.z0 + DR.z1) / 2, DR.x1 - DR.x0, .6, DR.z1 - DR.z0 + 1.2, 'struct');
[[70, 1.2], [80, 2.0], [90, 1.2]].forEach(([x, h], i) => addBox(x, 0, i % 2 ? 53 : 57, 2, h, 4, 'cube'));
[[RIFT.x0, RIFT.z0, RIFT.x1, RIFT.z0], [RIFT.x1, RIFT.z0, RIFT.x1, RIFT.z1], [RIFT.x1, RIFT.z1, RIFT.x0, RIFT.z1], [RIFT.x0, RIFT.z1, RIFT.x0, RIFT.z0]].forEach(([a, b, c, d]) => addLine([a, .05, b], [c, .05, d], [2.2, .4, 2]));

const MATS = {
  struct: new THREE.MeshStandardMaterial({ color: 0x15102c, roughness: .3, metalness: .82, envMapIntensity: .7 }),
  plat: new THREE.MeshStandardMaterial({ color: 0x1d1442, emissive: 0x2a0e66, emissiveIntensity: .75, roughness: .38, metalness: .62, envMapIntensity: .65 }),
  cube: new THREE.MeshStandardMaterial({ color: 0x0f1a34, emissive: 0x0b4a7a, emissiveIntensity: 1.15, roughness: .22, metalness: .62 }),
  vault: new THREE.MeshStandardMaterial({ color: 0x1c0824, emissive: 0x5a0a50, emissiveIntensity: .85, roughness: .28, metalness: .55, transparent: true, opacity: .93 }),
};
const unitBox = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2);
{
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new V3();
  for (const cat of Object.keys(MATS)) {
    const list = boxes.filter(b => b.cat === cat && !b.mover && b.name !== 'tower'); if (!list.length) continue;
    const im = new THREE.InstancedMesh(unitBox, MATS[cat], list.length);
    im.castShadow = true; im.receiveShadow = true;
    list.forEach((b, i) => { c.addVectors(b.min, b.max).multiplyScalar(.5); m4.compose(c, q, b.size); im.setMatrixAt(i, m4); });
    scene.add(im);
  }
}
// High-detail tower shell (visual only; collision stays on boxes)
{
  const tg = new THREE.BoxGeometry(8.08, 60.08, 8.08, 12, 60, 12);
  const pos = tg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    // panel bevel / edge highlight displacement
    const edge = Math.max(Math.abs(pos.getX(i)), Math.abs(pos.getZ(i)));
    if (edge > 3.7) pos.setX(i, pos.getX(i) * 1.01); 
    if (Math.abs((y + 30) % 2) < .08) pos.setX(i, pos.getX(i) * 1.015), pos.setZ(i, pos.getZ(i) * 1.015);
  }
  tg.computeVertexNormals();
  const tm = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({
    color: 0x141028, roughness: .28, metalness: .85,
    map: towerTex, normalMap: towerNrm, normalScale: new THREE.Vector2(1.4, 1.4),
    emissive: 0xffffff, emissiveMap: towerTex, emissiveIntensity: .45, envMapIntensity: .8,
  }));
  tm.position.set(0, 30, 0); tm.castShadow = true; tm.receiveShadow = true; scene.add(tm);
  // finer edge highlight rings around tower
  for (let y = 4; y <= 58; y += 2) {
    const c = y % 10 === 0 ? [1.2, .7, 2.4] : [.45, .35, 1.5];
    const r = 4.15;
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8;
      addLine([Math.sin(a) * r, y, Math.cos(a) * r], [Math.sin(b) * r, y, Math.cos(b) * r], c);
    }
  }
}
const unitEdges = new THREE.EdgesGeometry(unitBox);
for (const b of boxes.filter(b => b.mover)) {
  b.mesh = new THREE.Mesh(unitBox, MATS[b.cat]); b.mesh.scale.copy(b.size);
  b.mesh.add(new THREE.LineSegments(unitEdges, new THREE.LineBasicMaterial({ color: new THREE.Color(...COLS.plat) }))); scene.add(b.mesh);
}
// Lattice-Balken
const beams = [];
function lattice(cx, cz, y0, w, h, d, cell, diag = true) {
  const nx = Math.max(1, Math.round(w / cell)), ny = Math.max(1, Math.round(h / cell)), nz = Math.max(1, Math.round(d / cell));
  const x0 = cx - w / 2, z0 = cz - d / 2;
  for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) { if (i > 0 && i < nx && k > 0 && k < nz) continue; beams.push([x0 + i * w / nx, y0 + h / 2, z0 + k * d / nz, .16, h, .16]); }
  for (let j = 0; j <= ny; j++) { const y = y0 + j * h / ny; beams.push([cx, y, z0, w, .16, .16], [cx, y, z0 + d, w, .16, .16], [x0, y, cz, .16, .16, d], [x0 + w, y, cz, .16, .16, d]); }
  if (diag) for (let j = 0; j < ny; j++) { const ya = y0 + j * h / ny, yb = y0 + (j + 1) * h / ny; const c = COLS.lat; addLine([x0, ya, z0], [x0 + w, yb, z0], c); addLine([x0 + w, ya, z0 + d], [x0, yb, z0 + d], c); addLine([x0, ya, z0 + d], [x0, yb, z0], c); addLine([x0 + w, ya, z0], [x0 + w, yb, z0 + d], c); }
}
lattice(SC.x, SC.z, 0, 14, 26, 14, 3.25);
latticeTowers.forEach(([x, y, z, s, h]) => lattice(x, z, 0, s, h, s, 1.5));
for (let y = 5; y <= 60; y += 5) { const r = 9.5; const c = y % 10 === 0 ? [.5, 1.5, 2.4] : [.35, 1.0, 1.8]; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8; addLine([Math.sin(a) * r, y, Math.cos(a) * r], [Math.sin(b) * r, y, Math.cos(b) * r], c); } }
for (let n = 0; n < 7; n++) {
  const a = n / 7 * Math.PI * 2 + .3, r = 230 + rnd() * 70, cx = Math.cos(a) * r, cz = Math.sin(a) * r, y0 = 40 + rnd() * 60, w = 30 + rnd() * 40, h = 40 + rnd() * 80;
  const c = [.45, .3, 1.3], cs = 10;
  for (let x = 0; x <= w; x += cs) for (let z = 0; z <= w; z += cs) addLine([cx + x, y0, cz + z], [cx + x, y0 + h, cz + z], c);
  for (let y = 0; y <= h; y += cs) { for (let x = 0; x <= w; x += cs) addLine([cx + x, y0 + y, cz], [cx + x, y0 + y, cz + w], c); for (let z = 0; z <= w; z += cs) addLine([cx, y0 + y, cz + z], [cx + w, y0 + y, cz + z], c); }
}
{
  const im = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ color: 0x1a1240, emissive: 0x6a3cff, emissiveIntensity: .95, roughness: .38, metalness: .65 }), beams.length);
  im.castShadow = true; im.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  beams.forEach((b, i) => { m4.compose(new V3(b[0], b[1], b[2]), q, new V3(b[3], b[4], b[5])); im.setMatrixAt(i, m4); }); scene.add(im);
}
{
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(edgeP, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(edgeC, 3));
  scene.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .9 })));
}
const sysLines = (() => {
  const p = []; for (const b of boxes) if (!b.mover) { const mn = b.min, mx = b.max; const v = [[mn.x, mn.y, mn.z], [mx.x, mn.y, mn.z], [mx.x, mn.y, mx.z], [mn.x, mn.y, mx.z], [mn.x, mx.y, mn.z], [mx.x, mx.y, mn.z], [mx.x, mx.y, mx.z], [mn.x, mx.y, mx.z]];[[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7], [0, 6], [1, 7]].forEach(([a, c]) => p.push(...v[a], ...v[c])); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(.2, 2.2, 1.4), transparent: true, opacity: .55, depthTest: false })); l.visible = false; l.renderOrder = 5; scene.add(l); return l;
})();
// Digital-Room-Deko
const drCubes = [];
{
  const n = [], col = new THREE.Color();
  for (let x = DR.x0 + .5; x < DR.x1; x += .7) for (let y = .4; y < DR.h - .2; y += .7) for (const side of [0, 1]) if (rnd() < .42) n.push([x, y, side ? DR.z1 - .3 : DR.z0 + .3]);
  for (let x = DR.x0 + .5; x < DR.x1; x += .7) for (let z = DR.z0 + .5; z < DR.z1; z += .7) if (rnd() < .3) n.push([x, DR.h - .3, z]);
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(.42, .42, .42), new THREE.MeshBasicMaterial({ color: 0xffffff }), n.length);
  const m4 = new THREE.Matrix4();
  n.forEach((p, i) => { m4.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m4); const r = rnd(); col.setRGB(...(r < .45 ? [.2, 1.6, 2.2] : r < .8 ? [1.6, .3, 2.2] : [.9, .6, 2.4])).multiplyScalar(.12 + rnd() * .3); im.setColorAt(i, col); });
  scene.add(im);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(DR.x1 - DR.x0, 1.2), new THREE.MeshBasicMaterial({ color: new THREE.Color(.08, .4, .7) })); strip.rotation.x = -Math.PI / 2; strip.position.set((DR.x0 + DR.x1) / 2, .03, (DR.z0 + DR.z1) / 2); scene.add(strip);
  const wireG = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.6, 1.6, 1.6));
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(); g.position.set(DR.x0 + 3 + i * 2.9, 3.2 + Math.sin(i) * .9, (DR.z0 + DR.z1) / 2 + (i % 2 ? 2.2 : -2.2));
    g.add(new THREE.LineSegments(wireG, new THREE.LineBasicMaterial({ color: new THREE.Color(.3, 1.2, 1.6) })));
    g.add(new THREE.Mesh(new THREE.OctahedronGeometry(.35, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, .3, 1.3) })));
    scene.add(g); drCubes.push(g);
  }
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.1), new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, color: new THREE.Color(1.6, 1.6, 1.6) }));
  panel.position.set(84, 3.6, DR.z0 + .02); scene.add(panel);
}
// Schwebende Würfel
const floatDark = [], floatGlow = [];
for (let i = 0; i < 460; i++) {
  let x = (rnd() * 2 - 1) * 175, z = (rnd() * 2 - 1) * 175; const y = 16 + rnd() * 100; if (Math.hypot(x, z) < 16 && y < 70) x += 30;
  const d = { p: new V3(x, y, z), s: .5 + rnd() * rnd() * 4.5, r: new V3(rnd() * 6, rnd() * 6, rnd() * 6), w: new V3(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(.8), ph: rnd() * 6 };
  (rnd() < .35 ? floatGlow : floatDark).push(d);
}
const imDark = new THREE.InstancedMesh(unitBox, new THREE.MeshStandardMaterial({ color: 0x120c28, roughness: .25, metalness: .85, emissive: 0x1a0c40, emissiveIntensity: .6 }), floatDark.length);
const imGlow = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), floatGlow.length);
floatGlow.forEach((d, i) => { const r = rnd(); imGlow.setColorAt(i, new THREE.Color(...(r < .5 ? [.6, .35, 2.2] : r < .8 ? [.25, 1.4, 2.2] : [2, .4, 1.8]))); });
imDark.instanceMatrix.setUsage(THREE.DynamicDrawUsage); imGlow.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
imDark.frustumCulled = imGlow.frustumCulled = false;
scene.add(imDark, imGlow);
// Environment decor (rocks / crystals / cables / glyphs) — visual only
const decorGroup = new THREE.Group(); scene.add(decorGroup);
{
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1a1235, roughness: .55, metalness: .45, emissive: 0x2a1850, emissiveIntensity: .35 });
  const rockIm = new THREE.InstancedMesh(rockGeo, rockMat, 90);
  rockIm.castShadow = true; rockIm.receiveShadow = true;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new V3(), t = new V3();
  for (let i = 0; i < 90; i++) {
    let x = (rnd() * 2 - 1) * 140, z = (rnd() * 2 - 1) * 140;
    if (Math.hypot(x, z) < 18 || inRift(x, z, 6)) { x += 40; z -= 20; }
    const y = H(x, z); const sc = .6 + rnd() * 2.2;
    e.set(rnd() * 1.2, rnd() * 6, rnd() * 1.2); q.setFromEuler(e); s.set(sc, sc * (.7 + rnd() * .6), sc);
    t.set(x, y + sc * .35, z); m4.compose(t, q, s); rockIm.setMatrixAt(i, m4);
  }
  decorGroup.add(rockIm);
  const cryGeo = new THREE.OctahedronGeometry(.55, 1);
  const cryMat = new THREE.MeshStandardMaterial({ color: 0x2a1050, emissive: 0xb08cff, emissiveIntensity: 1.4, roughness: .2, metalness: .5, transparent: true, opacity: .92 });
  const cryIm = new THREE.InstancedMesh(cryGeo, cryMat, 70);
  cryIm.castShadow = true;
  for (let i = 0; i < 70; i++) {
    let x = (rnd() * 2 - 1) * 135, z = (rnd() * 2 - 1) * 135;
    if (Math.hypot(x, z) < 14 || inRift(x, z, 4)) { x = 50 + rnd() * 60; z = -80 + rnd() * 40; }
    const y = H(x, z); const sc = .5 + rnd() * 1.8;
    e.set(rnd() * .4, rnd() * 6, rnd() * .4); q.setFromEuler(e); s.set(sc * .55, sc * 1.6, sc * .55);
    t.set(x, y + sc * .9, z); m4.compose(t, q, s); cryIm.setMatrixAt(i, m4);
  }
  decorGroup.add(cryIm);
  // Cable arcs between nearby lattice / props
  const cableMat = new THREE.LineBasicMaterial({ color: new THREE.Color(.35, 1.4, 1.9), transparent: true, opacity: .55 });
  const cableP = [];
  for (let i = 0; i < 48; i++) {
    const a = rnd() * Math.PI * 2, r = 25 + rnd() * 110;
    const x0 = Math.cos(a) * r, z0 = Math.sin(a) * r;
    const x1 = x0 + (rnd() - .5) * 28, z1 = z0 + (rnd() - .5) * 28;
    const y0 = H(x0, z0) + 2 + rnd() * 10, y1 = H(x1, z1) + 2 + rnd() * 10;
    const mid = new V3((x0 + x1) / 2, Math.max(y0, y1) + 3 + rnd() * 8, (z0 + z1) / 2);
    for (let k = 0; k < 8; k++) {
      const t0 = k / 8, t1 = (k + 1) / 8;
      const p0 = new V3(x0, y0, z0).lerp(mid, t0).lerp(new V3().set(x1, y1, z1).lerp(mid, t0), t0);
      // simple quadratic: (1-t)^2 P0 + 2(1-t)t M + t^2 P1
      const qbez = (tt) => {
        const u = 1 - tt;
        return new V3(
          u * u * x0 + 2 * u * tt * mid.x + tt * tt * x1,
          u * u * y0 + 2 * u * tt * mid.y + tt * tt * y1,
          u * u * z0 + 2 * u * tt * mid.z + tt * tt * z1
        );
      };
      const A = qbez(t0), B = qbez(t1);
      cableP.push(A.x, A.y, A.z, B.x, B.y, B.z);
    }
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(cableP, 3));
  decorGroup.add(new THREE.LineSegments(cg, cableMat));
  // Floating glyph quads
  const gMat = new THREE.MeshBasicMaterial({ map: glyphTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: .7 });
  for (let i = 0; i < 36; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), gMat.clone());
    // unique glyph look via color tint
    m.material.color = new THREE.Color().setHSL(.55 + rnd() * .25, .7, .65);
    let x = (rnd() * 2 - 1) * 130, z = (rnd() * 2 - 1) * 130;
    m.position.set(x, H(x, z) + 3 + rnd() * 14, z);
    m.rotation.y = rnd() * Math.PI * 2;
    m.userData.spin = (rnd() - .5) * .4;
    decorGroup.add(m);
  }
}
// Grenze
const boundMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uPlayer: { value: new V3() } },
  vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform float uTime; uniform vec3 uPlayer; varying vec2 vUv; varying vec3 vW;
  void main(){ float y=vUv.y; float a=pow(1.-y,2.2)*.55;
   float lines=smoothstep(.93,1.,fract(vW.y*.35-uTime*.4));
   float g=max(step(.965,fract((vW.x+vW.z)*.25)),step(.965,fract(vW.y*.25)));
   float near=smoothstep(40.,0.,distance(vW.xz,uPlayer.xz));
   vec3 c=mix(vec3(.45,.2,1.),vec3(.2,.9,1.),y+near*.3);
   gl_FragColor=vec4(c*(a*.6+(lines*.5+g*.35)*(a+near*.6)+near*.25*a),1.);}`
});
for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(300, 70), boundMat); const a = i * Math.PI / 2; m.position.set(Math.sin(a) * 149.5, 30, Math.cos(a) * 149.5); m.rotation.y = a; scene.add(m); }

// ---------------------------------------------------------------- Portale
const portalDiscMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uTime: { value: 0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uTime; varying vec2 vUv; void main(){ vec2 p=vUv-.5; float r=length(p)*2.; float a=atan(p.y,p.x);
   float s=sin(a*6.+r*14.-uTime*5.)*.5+.5; float m=smoothstep(1.,.55,r);
   vec3 c=mix(vec3(.25,.9,1.2),vec3(1.2,.3,1.),s)*m*(.18+.55*s*r); gl_FragColor=vec4(c,1.);}`
});
const portals = [];
const torusG = new THREE.TorusGeometry(3.2, .14, 14, 128);
function addPortal(pos, target, T, label) {
  const g = new THREE.Group(); g.position.copy(pos); g.position.y += 3.4;
  const dir = new V3(target.x - pos.x, 0, target.z - pos.z).normalize();
  g.rotation.y = Math.atan2(dir.x, dir.z);
  const ring = new THREE.Mesh(torusG, new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, .6, 2.4) })); g.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.7, .05, 10, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, 2, 2.6) })); g.add(ring2);
  g.add(new THREE.Mesh(new THREE.CircleGeometry(3.1, 80), portalDiscMat));
  scene.add(g); portals.push({ g, ring, ring2, center: g.position.clone(), dir, target, T, cool: 0, label });
}
addPortal(new V3(8, 0, 24), new V3(spiral[12].min.x + 1.5, spiral[12].max.y + .05, spiral[12].min.z + 1.5), 2.2, 'TURM');
addPortal(new V3(-48, H(-48, 12), 12), new V3(ISL.x, ISL.y + .05, ISL.z), 1.8, 'INSEL');
addPortal(new V3(124, 14, -124), new V3(0, 60.05, 0), 3.6, 'TURMSPITZE');

// ---------------------------------------------------------------- Fragmente
const FRAG_DEF = [
  [0, 1.4, 48, 'Erster Knoten'],
  [spiral[14].min.x + 1.5, spiral[14].max.y + 1.3, spiral[14].min.z + 1.5, 'Turm · Mitte'],
  [0, 61.3, 0, 'Turmspitze'],
  [129, 15.3, -129, 'Time Echo · Terrassen'],
  [hillTop.x, hillTop.y + 1.4, hillTop.z, 'Reso Field · Hügel'],
  [ISL.x, ISL.y + 1.3, ISL.z, 'Schwebende Insel'],
  [100, 1.4, 55, 'Digital Room'],
  [SC.x, 25.3, SC.z, 'Gerüst'],
  [30, 5.6, 36, 'Wandlauf-Spalt'],
  [-35, 1.4, 45, 'Versiegelter Tresor'],
  [105, 11.3, 10, 'Säule'],
  [50, 1.3, -25, 'Riss · Plattform'],
];
const frags = [];
const fragGeo = new THREE.OctahedronGeometry(.55, 2);
const fragMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.6, 2.6, 3) });
const fragRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, .6, 2.6) });
const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.3, 1.2, 1.6), transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
const beamGeo = new THREE.CylinderGeometry(.09, .09, 80, 12, 1, true); beamGeo.translate(0, 40, 0);
const fragRingG = new THREE.TorusGeometry(.95, .03, 10, 80);
const fragGlowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x5ef2ff, transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false });
FRAG_DEF.forEach(([x, y, z, name], i) => {
  const g = new THREE.Group(); g.position.set(x, y, z);
  const core = new THREE.Mesh(fragGeo, fragMat); g.add(core);
  const r1 = new THREE.Mesh(fragRingG, fragRingMat); const r2 = new THREE.Mesh(fragRingG, fragRingMat); r2.scale.setScalar(.75); g.add(r1, r2);
  const glow = new THREE.Sprite(fragGlowMat); glow.scale.set(3, 3, 1); g.add(glow);
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.y = .5; g.add(beam);
  scene.add(g); frags.push({ id: i, name, g, core, r1, r2, beam, base: new V3(x, y, z), got: false });
});

// ---------------------------------------------------------------- Licht / Umgebung
scene.add(new THREE.HemisphereLight(0x7a60ff, 0x0a0618, .65));
const moon = new THREE.DirectionalLight(0xc8b8ff, 1.35);
moon.position.copy(FLOWER_POS).normalize().multiplyScalar(120);
moon.castShadow = true;
moon.shadow.mapSize.set(4096, 4096);
moon.shadow.bias = -0.00025;
moon.shadow.normalBias = 0.04;
Object.assign(moon.shadow.camera, { near: 10, far: 420, left: -120, right: 120, top: 120, bottom: -120 });
scene.add(moon);
const fillLight = new THREE.DirectionalLight(0x5ef2ff, .25); fillLight.position.set(-40, 60, 30); scene.add(fillLight);
{
  const pm = new THREE.PMREMGenerator(renderer); const es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, uniforms: skyMat.uniforms, vertexShader: skyMat.vertexShader.replace('p.xyww', 'p'), fragmentShader: skyMat.fragmentShader })));
  const add = (c, p, s) => { const m = new THREE.Mesh(new THREE.SphereGeometry(s, 24, 16), new THREE.MeshBasicMaterial({ color: c })); m.position.copy(p); es.add(m); };
  add(new THREE.Color(6, 2, 8), FLOWER_POS.clone().normalize().multiplyScalar(40), 4);
  add(new THREE.Color(.5, 2.5, 3), new V3(30, 6, 20), 3); add(new THREE.Color(2.5, .6, 2.5), new V3(-30, 4, -20), 3); add(new THREE.Color(1.2, .8, 3), new V3(-10, 10, 35), 2.5);
  scene.environment = pm.fromScene(es, .03).texture; pm.dispose();
}

// ---------------------------------------------------------------- Figur
const coatU = { uSway: { value: new V3() }, uFlap: { value: 0 }, uTime: { value: 0 } };
const coatMat = new THREE.MeshStandardMaterial({
  color: 0x110c20, roughness: .5, metalness: .4, emissive: 0xffffff, emissiveMap: coatTex, emissiveIntensity: 1.35,
  normalMap: coatNrm, normalScale: new THREE.Vector2(.85, .85), side: THREE.DoubleSide, transparent: true, opacity: 1, envMapIntensity: .7,
});
coatMat.onBeforeCompile = sh => {
  Object.assign(sh.uniforms, coatU);
  sh.vertexShader = 'uniform vec3 uSway; uniform float uFlap; uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float kk=clamp((1.42-position.y)/1.25,0.,1.); kk*=kk;
    float ang=atan(position.x,position.z);
    transformed.xz+=uSway.xz*kk; transformed.y+=uSway.y*kk;
    transformed.xz+=normalize(position.xz+1e-4)*(sin(uTime*9.+ang*3.+position.y*5.)*.04*uFlap*kk);`);
};
const darkMat = new THREE.MeshStandardMaterial({ color: 0x0e0a1a, roughness: .6, metalness: .3, transparent: true });
const voidMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true });
const handMat = new THREE.MeshStandardMaterial({ color: 0x1a1030, emissive: 0x8a5cff, emissiveIntensity: .9, transparent: true });
const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.8, 3, 3.4) });
const hero = new THREE.Group(); scene.add(hero);
const body = new THREE.Group(); hero.add(body);
const coat = new THREE.Mesh(new THREE.LatheGeometry([[.5, .14], [.48, .24], [.46, .35], [.43, .5], [.40, .65], [.36, .8], [.33, .95], [.30, 1.05], [.29, 1.1], [.30, 1.28], [.33, 1.40], [.26, 1.5], [.12, 1.57]].map(([r, y]) => new THREE.Vector2(r, y)), 56), coatMat); coat.castShadow = true;
body.add(coat);
const shoulders = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), darkMat); shoulders.castShadow = true; shoulders.scale.set(.34, .16, .25); shoulders.position.y = 1.44; body.add(shoulders);
const head = new THREE.Group(); head.position.y = 1.62; body.add(head);
const hood = new THREE.Mesh(new THREE.SphereGeometry(.21, 32, 24), darkMat); hood.scale.set(1, 1.12, 1.08); hood.position.set(0, .08, -.01); head.add(hood);
const peak = new THREE.Mesh(new THREE.ConeGeometry(.13, .3, 24), darkMat); peak.position.set(0, .23, -.1); peak.rotation.x = -.7; head.add(peak);
const face = new THREE.Mesh(new THREE.SphereGeometry(.15, 24, 18), voidMat); face.scale.set(.85, 1, .5); face.position.set(0, .05, .15); head.add(face);
const eyeDot = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 10), eyeMat); eyeDot.position.set(0, .085, .228); head.add(eyeDot);
const hoodRim = new THREE.Mesh(new THREE.TorusGeometry(.16, .012, 10, 48), eyeMat); hoodRim.position.set(0, .06, .17); hoodRim.scale.set(.9, 1.15, 1); head.add(hoodRim);
const capsG = new THREE.CapsuleGeometry(.075, .42, 6, 16), legG = new THREE.CapsuleGeometry(.085, .6, 6, 16);
const mkLimb = (x, y, geo, mat, len, hand) => {
  const piv = new THREE.Group(); piv.position.set(x, y, 0); const m = new THREE.Mesh(geo, mat); m.position.y = -len; piv.add(m);
  if (hand) { const h = new THREE.Mesh(new THREE.SphereGeometry(.065, 16, 12), handMat); h.position.y = -len * 2 - .02; piv.add(h); }
  else { const boot = new THREE.Mesh(new THREE.BoxGeometry(.15, .1, .28), darkMat); boot.position.set(0, -len * 2 - .04, .05); piv.add(boot); }
  body.add(piv); return piv;
};
const armL = mkLimb(.33, 1.42, capsG, darkMat, .28, true), armR = mkLimb(-.33, 1.42, capsG, darkMat, .28, true);
const legL = mkLimb(.11, .92, legG, darkMat, .42, false), legR = mkLimb(-.11, .92, legG, darkMat, .42, false);
const heroLight = new THREE.PointLight(0xb070ff, 1.6, 8, 2); heroLight.position.set(0, 1.4, .8); hero.add(heroLight);
const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); blob.rotation.x = -Math.PI / 2; scene.add(blob);
const footRing = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .55 })); footRing.rotation.x = -Math.PI / 2; scene.add(footRing);
const heroMats = [coatMat, darkMat, voidMat, handMat];
// Nachbilder
const ghosts = [];
for (let i = 0; i < 20; i++) {
  const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(.4, 1.4, 2.2), transparent: true, opacity: .4, blending: THREE.AdditiveBlending, depthWrite: false });
  const c = new THREE.Mesh(coat.geometry, m); const h = new THREE.Mesh(hood.geometry, m); h.scale.copy(hood.scale); h.position.set(0, 1.70, -.01);
  g.add(c, h); g.visible = false; scene.add(g); ghosts.push({ g, m, life: 0, a: .4 });
}
let ghostIdx = 0;
function spawnGhost(col, a = .45) { const gh = ghosts[ghostIdx++ % ghosts.length]; gh.g.position.copy(hero.position); gh.g.rotation.copy(hero.rotation); gh.g.scale.setScalar(1); gh.g.visible = true; gh.life = 1; gh.a = a; gh.m.color.copy(col); }
const fxRings = [];
for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1.6, .07, 10, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, .6, 2.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.visible = false; scene.add(m); fxRings.push({ m, life: 0, s: 1 }); }
let fxIdx = 0;
function spawnRing(pos, dir, col, scale = 1) { const r = fxRings[fxIdx++ % fxRings.length]; r.m.position.copy(pos); r.m.lookAt(pos.clone().add(dir)); r.m.visible = true; r.life = 1; r.s = scale; r.m.material.color.copy(col); }
const PN = 520; const partPos = new Float32Array(PN * 3).fill(-999), partVel = new Float32Array(PN * 3), partLife = new Float32Array(PN);
const partG = new THREE.BufferGeometry(); partG.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
const parts = new THREE.Points(partG, new THREE.PointsMaterial({ map: glowTex, size: .28, color: new THREE.Color(.8, 1.8, 2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); parts.frustumCulled = false; scene.add(parts);
let partIdx = 0;
function burst(p, n = 60, spd = 8) {
  const mul = quality === 'ultra' ? 1.6 : quality === 'hoch' ? 1 : quality === 'mittel' ? .55 : .3;
  const nn = Math.ceil(n * mul);
  for (let i = 0; i < nn; i++) { const k = partIdx++ % PN; partPos.set([p.x, p.y, p.z], k * 3); const v = new V3(rnd() - .5, rnd() - .3, rnd() - .5).normalize().multiplyScalar(spd * (.4 + rnd())); partVel.set([v.x, v.y, v.z], k * 3); partLife[k] = 1; }
}
const waves = [];
for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(1, .006, 6, 192), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .5, 1.8), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); m.rotation.x = Math.PI / 2; m.visible = false; scene.add(m); waves.push({ m, t: -1 }); }

// ---------------------------------------------------------------- Postprocessing
const composer = new EffectComposer(renderer);
composer.setPixelRatio(prFor(quality));
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .8, .5, .8);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uMode: { value: 0 }, uGlitch: { value: 0 }, uDrift: { value: 0 }, uFinale: { value: 0 }, uFlash: { value: 0 }, uAspect: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime,uMode,uGlitch,uDrift,uFinale,uFlash,uAspect; varying vec2 vUv;
  float h1(float n){return fract(sin(n)*43758.5453);}
  void main(){ vec2 uv=vUv; int m=int(uMode+.5);
   float g=uGlitch+(m==3?.22:0.);
   if(g>.001){ float row=floor(uv.y*30.); float tt=floor(uTime*16.); if(h1(row*7.13+tt)<g*.55) uv.x+=(h1(row+tt*3.1)-.5)*.07*g; }
   float sh=.004*g+.002*uDrift; vec3 col;
   col.r=texture2D(tDiffuse,uv+vec2(sh,0.)).r; col.g=texture2D(tDiffuse,uv).g; col.b=texture2D(tDiffuse,uv-vec2(sh,0.)).b;
   float lum=dot(col,vec3(.299,.587,.114));
   if(m==1){ col=mix(vec3(0.,.01,.05),vec3(.35,.85,1.),pow(lum,.7))+vec3(.9,.95,1.)*pow(lum,4.)*.6; }
   else if(m==2){ col=vec3(.15,1.,.75)*pow(lum,.8)*1.15; vec2 gg=fract(vec2(uv.x*uAspect,uv.y)*34.); col+=vec3(0.,.22,.16)*max(step(.95,gg.x),step(.95,gg.y))*.5; col*=.88+.12*sin(uv.y*900.); }
   else if(m==3){ col=vec3(col.r*1.25+col.b*.35,col.g*.65,col.b*1.3+col.r*.25); col*=.88+.12*step(.5,fract(uv.y*220.+uTime*30.)); col+=vec3(.2,0.,.25)*h1(floor(uv.y*80.)+floor(uTime*20.))*.18; }
   else if(m==4){ vec3 pal=mix(vec3(.22,0.,.32),vec3(1.,.35,.85),smoothstep(0.,.55,lum)); pal=mix(pal,vec3(1.,.85,.55),smoothstep(.55,1.,lum)); col=mix(col,pal,.75); float d=length((uv-.5)*vec2(uAspect,1.)); col+=vec3(.6,.15,.6)*pow(.5+.5*sin(d*28.-uTime*3.),12.)*.14; }
   col=mix(col,vec3(dot(col,vec3(.33)))*vec3(.6,.85,1.25),uDrift*.5);
   float d2=length((uv-.5)*vec2(uAspect,1.));
   col+=vec3(1.,.55,1.)*uFlash;
   col+=vec3(.8,.3,1.)*uFinale*pow(.5+.5*sin(d2*18.-uTime*5.),8.)*.22;
   col*=1.-smoothstep(.5,1.1,d2)*.55;
   gl_FragColor=vec4(col,1.);}`
});
composer.addPass(grade);

// ---------------------------------------------------------------- Zustand
const PHYS = { gravity: 1.00, jump: 1.35, momentum: .78, air: .65 };
const G0 = 24, JUMP0 = 9.2, RUN = 9.5, R = .38, HGT = 1.8, STEP = .45;
const START = new V3(0, 0, 70);
const P = {
  pos: START.clone(), vel: new V3(), grounded: false, ground: null, facing: Math.PI,
  contactN: new V3(), contactBox: null, contactT: -1, wallRun: false, wallT: 0, wallN: new V3(), wallTan: new V3(), lastWall: null, wallCool: 0,
  launchT: 0, coyote: 0, jumpBuf: 0, lastSafe: START.clone(), phase: false, shift: false, gjT: 0, airT: 0, landT: 0,
};
const ABIL = {
  phase: { name: 'PHASE CLIP', cd: 8, dur: 2.5, t: 0, act: 0 },
  shift: { name: 'COLLISION SHIFT', cd: 9, dur: 3, t: 0, act: 0 },
  skip: { name: 'STATE SKIP', cd: 4, dur: .25, t: 0, act: 0 },
  drift: { name: 'TIME DRIFT', cd: 12, dur: 5, t: 0, act: 0 },
  gj: { name: 'GLITCH JUMP', cd: 3, dur: 1.1, t: 0, act: 0 },
};
const VIEWS = ['TPV', 'FPV', 'GEOMETRIC', 'EYE VIEW'];
const LAYERS = ['NORMAL', 'DEPTH', 'SYSTEM', 'GLITCH', 'RESONANCE'];
const S = { started: false, paused: false, t: 0, worldT: 0, timeScale: 1, view: 0, layer: 0, yaw: 0, pitch: .32, zoom: 6.5, geoH: 18, glitchFx: 0, flash: 0, finale: -1, collected: 0, zone: '', lookIdle: 0, zoneT: 0 };
let saved = []; try { saved = JSON.parse(localStorage.getItem('eyecore.v1') || '[]'); } catch (e) { }
frags.forEach(f => { if (saved.includes(f.id)) { f.got = true; f.g.visible = false; } });
S.collected = frags.filter(f => f.got).length;

// ---------------------------------------------------------------- Audio (synthetisch)
let AC = null, master = null;
function initAudio() {
  if (AC) { AC.resume(); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = muted ? 0 : .5; master.connect(AC.destination);
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 340; const g = AC.createGain(); g.gain.value = .05; f.connect(g); g.connect(master);
    [55, 55.4, 82.4].forEach(fr => { const o = AC.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); });
    const l = AC.createOscillator(), lg = AC.createGain(); l.frequency.value = .08; lg.gain.value = 160; l.connect(lg); lg.connect(f.frequency); l.start();
  } catch (e) { AC = null; }
}
function tone(fr, dur, type = 'sine', vol = .2, to = null, delay = 0) {
  if (!AC || muted) return; const t0 = AC.currentTime + delay; const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(fr, t0); if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + .05);
}
function noiseSnd(dur, vol = .2, freq = 2000) {
  if (!AC || muted) return; const n = Math.floor(AC.sampleRate * dur), buf = AC.createBuffer(1, n, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; const g = AC.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(master); s.start();
}
const sfx = {
  jump: () => tone(260, .18, 'triangle', .12, 520),
  land: () => tone(120, .1, 'sine', .08, 60),
  collect: () => [0, 4, 7, 12, 16].forEach((s, i) => tone(523 * 2 ** (s / 12), .45, 'sine', .14, null, i * .07)),
  glitch: () => { noiseSnd(.2, .25, 2600); tone(90, .25, 'square', .06, 40); },
  portal: () => { tone(200, .6, 'sawtooth', .07, 900); noiseSnd(.4, .15, 900); },
  deny: () => tone(110, .12, 'square', .05),
  finale: () => [0, 7, 12, 16, 19, 24].forEach((s, i) => tone(261.6 * 2 ** (s / 12), 2.2, 'sine', .12, null, i * .18)),
};

// ---------------------------------------------------------------- HUD
const el = id => document.getElementById(id);
const feedL = el('feedl');
const fmtT = t => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
function feed(name, val, hot = false) {
  const li = document.createElement('li'); if (hot) li.className = 'hot';
  li.innerHTML = `<span>${name}</span><b>${val}</b><i>${fmtT(S.t)}</i>`; feedL.prepend(li);
  while (feedL.children.length > (IS_TOUCH ? 3 : 5)) feedL.lastChild.remove();
  if (IS_TOUCH) layout();
}
let toastTO = 0;
function toast(a, b, dur = 2.4) { el('toasta').textContent = a; el('toastb').textContent = b; el('toast').classList.add('on'); clearTimeout(toastTO); toastTO = setTimeout(() => el('toast').classList.remove('on'), dur * 1000); }
function zoneBanner(a, b) { el('zonea').textContent = a; el('zoneb').textContent = b; el('zone').classList.add('on'); S.zoneT = 2.8; }
const compass = el('compass'); const cEls = [];
for (let d = 0; d < 360; d += 15) { const s = document.createElement('span'); const lab = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' }[d]; s.textContent = lab || ''; s.className = lab ? (d % 90 === 0 ? 'big ' + lab : '') : 't'; compass.appendChild(s); cEls.push({ s, d }); }
const cTarget = document.createElement('span'); cTarget.className = 'tg'; compass.appendChild(cTarget);
function updateHUDStats() {
  const n = S.collected; el('cnt').textContent = n;
  const lvl = 1 + Math.floor(n / 2); el('lvl').textContent = lvl; el('lvlbar').style.width = (n >= 12 ? 100 : (n % 2) * 50) + '%';
  const res = Math.round(n / 12 * 100); el('resp').textContent = res + '%'; el('resbar').style.width = res + '%';
  el('objtxt').textContent = n >= 12 ? 'Alle Knoten sind im Einklang. Das Auge ist erwacht.' : 'Erkunde die Fragmente und bringe alle Knoten in Einklang.';
}
function layout() {
  el('tbtn').style.top = (el('obj').getBoundingClientRect().bottom + 6) + 'px';
  el('feed').style.top = (el('eye').getBoundingClientRect().bottom + 6) + 'px';
  const phys = el('phys'); phys.style.left = 'calc(var(--sal) + 8px)';
  if (IS_TOUCH) { phys.style.top = (el('feed').getBoundingClientRect().bottom + 6) + 'px'; phys.style.bottom = ''; phys.style.width = el('feed').getBoundingClientRect().width + 'px'; }
  else { phys.style.bottom = 'calc(var(--sab) + 26px)'; phys.style.top = ''; }
}
if (IS_TOUCH) el('phys').classList.add('col');
el('physhd').addEventListener('pointerdown', e => { e.stopPropagation(); togglePhys(); });
function togglePhys() { el('phys').classList.toggle('col'); el('physarr').textContent = el('phys').classList.contains('col') ? '▸' : '▾'; setTimeout(layout, 0); }
el('physarr').textContent = el('phys').classList.contains('col') ? '▸' : '▾';
const ctlHTML = IS_TOUCH ?
  `<b>Linker Daumen</b> – virtueller Joystick (links irgendwo ziehen)<br><b>Rechte Seite ziehen</b> – Kamera drehen<br><b>Sprung</b> – springen · gegen eine Wand springen = Wandlauf, dann nochmal springen<br><b>Glitch</b> – Glitch Jump (großer Satz durch ein Portal)<br><b>Phase · Shift · Skip · Drift</b> – die vier Working Glitches<br><b>VIEW / LAYER</b> – Perspektive (TPV/FPV/Geometric/Eye) und Vision Layer<br><b>Ziel</b> – finde alle 12 leuchtenden Knoten. Ringe auf dem Boden katapultieren dich.`
  : `<b>WASD / Pfeile</b> – bewegen · <b>Maus ziehen</b> – Kamera · <b>Mausrad</b> – Zoom<br><b>Leertaste</b> – springen · gegen eine Wand springen = Wandlauf<br><b>E</b> – Glitch Jump · <b>1</b> Phase Clip · <b>2</b> Collision Shift · <b>3</b> State Skip · <b>4</b> Time Drift<br><b>V</b> – Perspektive (TPV/FPV/Geometric/Eye) · <b>B</b> – Vision Layer · <b>H</b> – Physics · <b>Esc</b> – Menü<br><b>Ziel</b> – finde alle 12 leuchtenden Knoten. Ringe auf dem Boden katapultieren dich.`;
el('ctl').innerHTML = ctlHTML; el('ctl2').innerHTML = ctlHTML +
  `<br><br><b>Working Glitches</b><br>Phase Clip – 2,5 s durch Wände · Collision Shift – 3 s: Kollisionen schieben dich auf das Hindernis · State Skip – Sprung 9 m nach vorn · Time Drift – 5 s Zeitlupe für die Welt`;

// ---------------------------------------------------------------- Eingabe
const keys = {};
const input = { mx: 0, my: 0, ext: null };
addEventListener('keydown', e => {
  if (e.repeat) return;
  keys[e.code] = true; if (!S.started) return;
  if (e.code === 'Space') { P.jumpBuf = .15; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'KeyF') useAbility('gj');
  if (e.code === 'Digit1') useAbility('phase'); if (e.code === 'Digit2') useAbility('shift'); if (e.code === 'Digit3') useAbility('skip'); if (e.code === 'Digit4') useAbility('drift');
  if (e.code === 'KeyV') cycleView(); if (e.code === 'KeyB') cycleLayer(); if (e.code === 'KeyH') togglePhys();
  if (e.code === 'Escape' || e.code === 'KeyP') togglePause();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const joy = el('joy'), joyKnob = joy.querySelector('i');
const ptrs = new Map();
canvas.addEventListener('pointerdown', e => {
  if (!S.started || S.paused) return; e.preventDefault();
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
  const touch = e.pointerType !== 'mouse';
  // Left ~52% = joystick; keep clear of right ability cluster
  if (touch && e.clientX < innerWidth * .52) {
    ptrs.set(e.pointerId, { type: 'joy', x0: e.clientX, y0: e.clientY, mx: 0, my: 0 }); joy.style.left = e.clientX + 'px'; joy.style.top = e.clientY + 'px'; joy.classList.add('on'); joyKnob.style.transform = ''; el('joyhint').classList.add('hide');
  } else ptrs.set(e.pointerId, { type: 'look', x: e.clientX, y: e.clientY, touch });
});
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId); if (!p) return; e.preventDefault();
  if (p.type === 'joy') {
    let dx = e.clientX - p.x0, dy = e.clientY - p.y0; const r = Math.hypot(dx, dy), max = 58;
    if (r > max) { dx *= max / r; dy *= max / r; }
    joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
    // Small deadzone so taps don't nudge; then full range
    const rawX = dx / max, rawY = -dy / max, mag = Math.hypot(rawX, rawY);
    if (mag < .12) { p.mx = 0; p.my = 0; }
    else { const t = (mag - .12) / .88; p.mx = (rawX / mag) * t; p.my = (rawY / mag) * t; }
  } else {
    const k = p.touch ? .0062 : .0045; S.yaw -= (e.clientX - p.x) * k; S.pitch += (e.clientY - p.y) * k * (S.view === 1 ? -1 : 1);
    S.pitch = S.view === 1 ? clamp(S.pitch, -1.35, 1.35) : clamp(S.pitch, -.35, 1.35);
    p.x = e.clientX; p.y = e.clientY; S.lookIdle = 0;
    if (S.view === 2) S.yaw = 0;
  }
});
const endPtr = e => { const p = ptrs.get(e.pointerId); if (!p) return; if (p.type === 'joy') joy.classList.remove('on'); ptrs.delete(e.pointerId); };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr); canvas.addEventListener('lostpointercapture', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); if (S.view === 2) S.geoH = clamp(S.geoH + e.deltaY * .05, 16, 100); else S.zoom = clamp(S.zoom + e.deltaY * .006, 3, 16); }, { passive: false });
document.addEventListener('touchmove', e => { if (!e.target.closest('.ov')) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault()); document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());
document.querySelectorAll('.ab').forEach(b => {
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); e.stopPropagation();
    try { b.setPointerCapture(e.pointerId); } catch (err) { }
    b.classList.add('press');
    const a = b.dataset.a; if (a === 'jump') P.jumpBuf = .15; else useAbility(a);
  });
  const up = () => b.classList.remove('press');
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
});
el('b-view').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); cycleView(); });
el('b-layer').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); cycleLayer(); });
el('b-menu').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); togglePause(); });
function readInput() {
  if (input.ext) { input.mx = input.ext[0]; input.my = input.ext[1]; return; }
  let mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
  let my = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
  for (const p of ptrs.values()) if (p.type === 'joy') { mx = p.mx; my = p.my; }
  const l = Math.hypot(mx, my); if (l > 1) { mx /= l; my /= l; }
  input.mx = mx; input.my = my;
}
function cycleView(to) {
  S.view = to ?? (S.view + 1) % VIEWS.length; el('viewlbl').textContent = VIEWS[S.view].replace('GEOMETRIC', 'GEO').replace('EYE VIEW', 'EYE');
  if (S.view === 1) S.pitch = 0; else if (S.view === 0) S.pitch = .32;
  feed('PERSPECTIVE FLIP', ['TPV', 'FPV', 'GEO', 'EYE'][S.view]); S.glitchFx = Math.max(S.glitchFx, .5); sfx.glitch();
}
function cycleLayer(to) {
  S.layer = to ?? (S.layer + 1) % LAYERS.length; el('layerlbl').textContent = LAYERS[S.layer];
  grade.uniforms.uMode.value = S.layer; sysLines.visible = S.layer === 2;
  beamMat.opacity = S.layer === 4 ? .75 : .22; beamMat.depthTest = S.layer !== 4;
  feed('LAYER', LAYERS[S.layer]); S.glitchFx = Math.max(S.glitchFx, .35);
}
function togglePause(force) {
  if (!S.started) return; S.paused = force ?? !S.paused; el('menu').classList.toggle('on', S.paused);
  ptrs.clear(); joy.classList.remove('on');
  if (AC) S.paused ? AC.suspend() : AC.resume();
}
el('b-resume').onclick = () => togglePause(false);
el('b-sound').onclick = () => { muted = !muted; localStorage.setItem('eyecore.mute', muted ? '1' : '0'); if (master) master.gain.value = muted ? 0 : .5; el('b-sound').textContent = 'TON: ' + (muted ? 'AUS' : 'AN'); };
el('b-sound').textContent = 'TON: ' + (muted ? 'AUS' : 'AN');
el('b-quality').onclick = () => {
  const i = Q_ORDER.indexOf(quality);
  setQuality(Q_ORDER[(i + 1) % Q_ORDER.length]);
};
function applyQuality() {
  const u = quality === 'ultra', h = quality === 'hoch', m = quality === 'mittel';
  bloom.strength = u ? (IS_TOUCH ? .7 : .95) : h ? (IS_TOUCH ? .52 : .75) : m ? .38 : .22;
  bloom.radius = u ? .55 : h ? .42 : m ? .32 : .25;
  bloom.threshold = u ? .78 : h ? .86 : m ? .9 : .94;
  parts.visible = u || h || m;
  parts.material.size = u ? .32 : h ? .26 : .18;
  clouds.forEach((c, i) => {
    c.visible = u ? true : h ? (i % 2 === 0) : m ? (i % 3 === 0) : (i % 5 === 0);
  });
  decorGroup.visible = u || h || m;
  if (decorGroup.visible) {
    decorGroup.children.forEach((c, i) => {
      if (c.isInstancedMesh) c.visible = true;
      else c.visible = u ? true : h ? (i % 2 === 0) : (i % 3 === 0);
    });
  }
  imDark.visible = u || h || m;
  imGlow.visible = u || h;
  const shadowOn = u || (h && !IS_TOUCH);
  renderer.shadowMap.enabled = shadowOn;
  moon.castShadow = shadowOn;
  const sm = u ? (IS_TOUCH ? 2048 : 4096) : h ? 1024 : 512;
  if (moon.shadow.mapSize.x !== sm) {
    moon.shadow.mapSize.set(sm, sm);
    if (moon.shadow.map) { moon.shadow.map.dispose(); moon.shadow.map = null; }
  }
  for (let i = 0; i < ghosts.length; i++) {
    if ((m && i >= 10) || (quality === 'niedrig' && i >= 5)) { ghosts[i].life = 0; ghosts[i].g.visible = false; }
  }
}
function setQuality(q) {
  quality = Q_ORDER.includes(q) ? q : 'ultra';
  localStorage.setItem('eyecore.q', quality);
  el('b-quality').textContent = 'GRAFIK: ' + quality.toUpperCase();
  applyQuality(); resize();
}
el('b-quality').textContent = 'GRAFIK: ' + quality.toUpperCase();
applyQuality();
function resetGame() {
  localStorage.removeItem('eyecore.v1'); frags.forEach(f => { f.got = false; f.g.visible = true; }); S.collected = 0; S.finale = -1; updateHUDStats();
  P.pos.copy(START); P.vel.set(0, 0, 0); P.lastSafe.copy(START); S.yaw = 0; el('final').classList.remove('on'); togglePause(false); feed('STATE RESET', '0/12', true);
}
el('b-reset').onclick = resetGame; el('b-reset2').onclick = resetGame;
el('b-cont').onclick = () => { el('final').classList.remove('on'); S.paused = false; };
el('b-start').onclick = () => {
  el('start').classList.remove('on'); S.started = true; initAudio(); layout();
  feed('SYSTEM', 'ONLINE'); setTimeout(() => toast('FRAGMENT REALM', 'Finde die 12 Knoten · folge den Lichtsäulen', 3.5), 400);
};

// ---------------------------------------------------------------- Fähigkeiten
function moveDir() {
  const yaw = S.view === 2 ? 0 : S.yaw; const fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  return new V3(fx * input.my + rx * input.mx, 0, fz * input.my + rz * input.mx);
}
function useAbility(k) {
  if (!S.started || S.paused) return;
  const a = ABIL[k]; const btn = el('a-' + k);
  if (a.t > 0) { btn?.classList.remove('deny'); void btn?.offsetWidth; btn?.classList.add('deny'); sfx.deny(); return; }
  a.t = a.cd; a.act = a.dur; S.glitchFx = Math.max(S.glitchFx, .9); sfx.glitch();
  const fwd = moveDir(); if (fwd.lengthSq() < .01) fwd.set(Math.sin(P.facing), 0, Math.cos(P.facing)); fwd.normalize();
  if (k === 'phase') { P.phase = true; feed(a.name, a.dur.toFixed(2) + 's', true); }
  if (k === 'shift') { P.shift = true; feed(a.name, a.dur.toFixed(2) + 's', true); }
  if (k === 'drift') { feed(a.name, a.dur.toFixed(2) + 's', true); }
  if (k === 'skip') {
    spawnGhost(new THREE.Color(.5, 1.2, 2.4), .6);
    const from = P.pos.clone(); let ok = null;
    for (let s = 9; s >= 0; s -= .5) {
      const p = from.clone().addScaledVector(fwd, s); p.x = clamp(p.x, -148, 148); p.z = clamp(p.z, -148, 148);
      let y = Math.max(p.y, H(p.x, p.z)); let bad = false;
      for (let it = 0; it < 3; it++) { let hit = false; for (const b of boxes) { if (overlapsAt(b, p.x, y, p.z)) { if (b.max.y - y <= 4) { y = b.max.y; hit = true; } else bad = true; } } if (!hit) break; }
      if (!bad) { ok = new V3(p.x, y, p.z); break; }
    }
    if (ok) { const d = from.distanceTo(ok); P.pos.copy(ok); P.vel.x = fwd.x * 8; P.vel.z = fwd.z * 8; P.vel.y = Math.max(P.vel.y, 0); feed(a.name, (d / 36).toFixed(2) + 's', true); spawnRing(ok.clone().add(new V3(0, 1, 0)), fwd, new THREE.Color(.4, 1.6, 2.6), 1); }
  }
  if (k === 'gj') {
    P.vel.set(fwd.x * 19, 15.5, fwd.z * 19); P.grounded = false; P.gjT = .7; endWallRun(); P.launchT = 0; P.facing = Math.atan2(fwd.x, fwd.z);
    spawnRing(P.pos.clone().add(new V3(0, 1.1, 0)).addScaledVector(fwd, 1.2), fwd, new THREE.Color(2.4, .6, 2.6), 1.3);
    feed(a.name, '1.10s', true); sfx.portal();
  }
}

// ---------------------------------------------------------------- Physik
function overlapsAt(b, x, y, z) { return x + R > b.min.x && x - R < b.max.x && z + R > b.min.z && z - R < b.max.z && y + HGT > b.min.y && y < b.max.y; }
function groundAt(x, z, y) {
  let g = H(x, z), gb = null;
  for (const b of boxes) if (x + R > b.min.x && x - R < b.max.x && z + R > b.min.z && z - R < b.max.z && b.max.y <= y + .05 && b.max.y > g) { g = b.max.y; gb = b; }
  return [g, gb];
}
let lastPop = -9;
function shiftPop() { if (S.t - lastPop > .4) { lastPop = S.t; spawnRing(P.pos.clone().add(new V3(0, .2, 0)), new V3(0, 1, 0), new THREE.Color(1.6, .6, 2.6), 1.2); feed('COLLISION SHIFT', 'POP'); S.glitchFx = Math.max(S.glitchFx, .6); } }
function resolveAxis(ax, wasGround) {
  const p = P.pos, v = P.vel, key = ax ? 'z' : 'x';
  for (const b of boxes) {
    if (!overlapsAt(b, p.x, p.y, p.z)) continue;
    const up = b.max.y - p.y;
    if (up <= STEP && (wasGround || v.y <= 0)) { p.y = b.max.y; continue; }
    if (P.phase) continue;
    if (P.shift && up > 0 && up <= 10.5) { p.y = b.max.y + .02; v.y = Math.max(v.y, 0); shiftPop(); continue; }
    const c = (b.min[key] + b.max[key]) / 2, vv = v[key];
    const s = vv > 0 ? -1 : vv < 0 ? 1 : (p[key] < c ? -1 : 1);
    p[key] = s < 0 ? b.min[key] - R - 1e-3 : b.max[key] + R + 1e-3;
    P.contactN.set(ax ? 0 : s, 0, ax ? s : 0); P.contactBox = b; P.contactT = S.t;
    // Soft slide vs hard stop: keep a bit of normal vel so wall-run entry feels less sticky
    if (P.wallRun) v[key] = 0; else v[key] *= 0.18;
  }
}
function resolveY(prevY) {
  const p = P.pos, v = P.vel; P.grounded = false;
  for (const b of boxes) {
    if (!overlapsAt(b, p.x, p.y, p.z)) continue;
    if (v.y <= 0 && prevY >= b.max.y - .06) { p.y = b.max.y; v.y = 0; P.grounded = true; P.ground = b; }
    else if (v.y > 0 && prevY + HGT <= b.min.y + .06) { if (!P.phase) { p.y = b.min.y - HGT - 1e-3; v.y = 0; } }
    else if (!P.phase && b.max.y - p.y < .6) { p.y = b.max.y; v.y = Math.max(v.y, 0); P.grounded = true; P.ground = b; }
  }
  const th = H(p.x, p.z); if (p.y <= th) { p.y = th; if (v.y < 0) v.y = 0; P.grounded = true; P.ground = null; }
  if (!P.grounded && v.y <= 0) { const [g, gb] = groundAt(p.x, p.z, p.y); if (p.y - g < .02) { p.y = g; v.y = 0; P.grounded = true; P.ground = gb; } }
}
function physStep(h, wasGround) {
  const p = P.pos, v = P.vel;
  p.x += v.x * h; resolveAxis(0, wasGround);
  p.z += v.z * h; resolveAxis(1, wasGround);
  const py = p.y; p.y += v.y * h; resolveY(py);
  p.x = clamp(p.x, -148.5, 148.5); p.z = clamp(p.z, -148.5, 148.5);
}
function endWallRun() { if (P.wallRun) { P.wallRun = false; feed('WALL RUN', P.wallT.toFixed(2) + 's'); } }
function pushOut() {
  const p = P.pos;
  for (let it = 0; it < 4; it++) for (const b of boxes) {
    if (!overlapsAt(b, p.x, p.y, p.z)) continue;
    const o = [[b.min.x - R - p.x, 'x'], [b.max.x + R - p.x, 'x'], [b.min.z - R - p.z, 'z'], [b.max.z + R - p.z, 'z'], [b.max.y - p.y, 'y']];
    o.sort((a, c) => Math.abs(a[0]) - Math.abs(c[0])); p[o[0][1]] += o[0][0] + Math.sign(o[0][0]) * .01;
  }
}
function updatePlayer(dt) {
  const p = P.pos, v = P.vel;
  readInput();
  const wish = moveDir(); const im = Math.min(1, wish.length());
  const drift = ABIL.drift.act > 0;
  const G = G0 * PHYS.gravity * (drift ? .55 : 1);
  const JUMP = JUMP0 * PHYS.jump;
  if (P.grounded && P.ground?.mover) p.add(P.ground.delta);
  P.jumpBuf -= dt; P.coyote = P.grounded ? .12 : P.coyote - dt; P.wallCool -= dt; P.gjT -= dt;
  const wasGround = P.grounded;
  if (P.launchT > 0) { P.launchT -= dt; }
  else if (P.wallRun) {
    P.wallT += dt; const spd = Math.max(8.5, v.dot(P.wallTan));
    v.x = P.wallTan.x * spd - P.wallN.x * 2; v.z = P.wallTan.z * spd - P.wallN.z * 2;
    if (P.jumpBuf > 0) {
      v.x = P.wallN.x * 8.5 + P.wallTan.x * 6; v.z = P.wallN.z * 8.5 + P.wallTan.z * 6; v.y = JUMP * .95; P.jumpBuf = 0;
      const wb = P.contactBox; endWallRun(); P.lastWall = wb; P.wallCool = .25; sfx.jump(); spawnGhost(new THREE.Color(1.2, .5, 2.4), .4);
    }
  } else {
    const k0 = 10 / PHYS.momentum; const k = P.grounded ? k0 : k0 * PHYS.air * .45 * (P.gjT > 0 ? .3 : 1);
    const tx = wish.x * RUN, tz = wish.z * RUN;
    if (P.grounded || im > .05) { v.x = damp(v.x, tx, k, dt); v.z = damp(v.z, tz, k, dt); }
    if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0)) { v.y = JUMP; P.grounded = false; P.coyote = 0; P.jumpBuf = 0; sfx.jump(); P.ground = null; }
  }
  if (im > .1 && !P.wallRun && P.launchT <= 0) P.facing = Math.atan2(wish.x, wish.z);
  v.y -= G * dt * (P.wallRun ? .22 : 1); v.y = Math.max(v.y, -55);
  const pre = v.clone();
  const n = Math.min(14, Math.max(1, Math.ceil(v.length() * dt / .25)));
  for (let i = 0; i < n; i++) physStep(dt / n, wasGround || P.grounded);
  if (wasGround && !P.grounded && v.y <= 0 && P.launchT <= 0) { const [g, gb] = groundAt(p.x, p.z, p.y); if (p.y - g < .6 && p.y - g >= 0) { p.y = g; P.grounded = true; P.ground = gb; v.y = 0; } }
  // Wandlauf
  const touching = S.t - P.contactT < .12;
  if (!P.wallRun && !P.grounded && touching && P.launchT <= 0 && im > .3 && P.wallCool <= 0 && P.contactBox !== P.lastWall) {
    const hs = Math.hypot(pre.x, pre.z); const [g] = groundAt(p.x, p.z, p.y);
    if (hs > 2.5 && p.y - g > .4) {
      P.wallRun = true; P.wallT = 0; P.wallN.copy(P.contactN);
      const t = new V3(-P.wallN.z, 0, P.wallN.x); const ref = Math.abs(t.dot(pre)) > .8 ? pre : wish; if (t.dot(ref) < 0) t.negate();
      if (Math.abs(t.dot(ref)) < .2) t.set(Math.sin(P.facing), 0, Math.cos(P.facing)).addScaledVector(P.wallN, -P.wallN.dot(t)).normalize();
      P.wallTan.copy(t); v.y = Math.max(v.y * .5, 4.2); P.lastWall = P.contactBox; sfx.jump();
    }
  }
  if (P.wallRun && (P.grounded || !touching || P.wallT > 1.5 || im < .1)) endWallRun();
  if (P.grounded && !wasGround) { if (P.launchT > 0 || P.airT > .9) { v.x *= .25; v.z *= .25; } P.launchT = 0; if (P.airT > .35) { sfx.land(); P.landT = .22; } P.lastWall = null; }
  P.airT = P.grounded ? 0 : P.airT + dt;
  if (P.grounded && !P.ground?.mover && !inRift(p.x, p.z, 3) && p.y > -1) P.lastSafe.copy(p);
  if (p.y < -16) {
    p.copy(P.lastSafe); p.y += .3; v.set(0, 0, 0); S.flash = .8; S.glitchFx = 1; feed('STATE RESET', 'RESPAWN', true); sfx.glitch(); toast('ZUSTAND ZURÜCKGESETZT', 'Du bist aus dem Fragment gefallen', 1.8);
  }
  if (P.phase && ABIL.phase.act <= 0) { P.phase = false; pushOut(); }
  if (P.shift && ABIL.shift.act <= 0) P.shift = false;
  for (const pt of portals) {
    pt.cool -= dt; if (pt.cool > 0) continue;
    const c = new V3(p.x, p.y + 1, p.z).sub(pt.center); const along = c.dot(pt.dir); const lat = c.clone().addScaledVector(pt.dir, -along).length();
    if (Math.abs(along) < 1 && lat < 2.9) {
      pt.cool = 2; const T = pt.T; const d = pt.target.clone().sub(p); const Gl = G0 * PHYS.gravity * (drift ? .55 : 1);
      v.set(d.x / T, (d.y + .5 * Gl * T * T) / T, d.z / T); P.launchT = T + .15; P.grounded = false; endWallRun(); P.facing = Math.atan2(d.x, d.z);
      spawnRing(pt.center, pt.dir, new THREE.Color(2.4, .6, 2.6), 2); S.glitchFx = 1; sfx.portal(); feed('GLITCH JUMP', pt.label, true);
    }
  }
  if ((drift || P.gjT > 0 || P.launchT > 0 || P.wallRun) && Math.floor(S.t * 12) !== Math.floor((S.t - dt) * 12)) spawnGhost(drift ? new THREE.Color(.3, .9, 1.8) : new THREE.Color(1.1, .35, 1.7), drift ? .12 : .14);
}

// ---------------------------------------------------------------- Animation Figur
const anim = { ph: 0, run: 0, air: 0, lean: 0, roll: 0, sway: new V3() };
const lerpAngle = (a, b, t) => a + wrapA(b - a) * t;
function updateHero(dt) {
  const v = P.vel; const hs = Math.hypot(v.x, v.z);
  hero.position.copy(P.pos);
  hero.rotation.y = lerpAngle(hero.rotation.y, P.wallRun ? Math.atan2(P.wallTan.x, P.wallTan.z) : P.facing, 1 - Math.exp(-14 * dt));
  anim.run = damp(anim.run, P.grounded || P.wallRun ? clamp(hs / RUN, 0, 1.2) : 0, 10, dt);
  anim.air = damp(anim.air, P.grounded || P.wallRun ? 0 : 1, 12, dt);
  anim.ph += dt * (4 + hs * 1.15);
  const sw = Math.sin(anim.ph), breath = Math.sin(S.t * 2.1), rs = anim.run;
  legL.rotation.x = sw * .95 * rs + anim.air * -.7; legR.rotation.x = -sw * .95 * rs + anim.air * .35;
  armL.rotation.x = -sw * .8 * rs + anim.air * -2.2 * (P.gjT > 0 ? 1.2 : .6); armR.rotation.x = sw * .8 * rs + anim.air * -1.0;
  armL.rotation.z = .12 + anim.air * .5 + breath * .02; armR.rotation.z = -.12 - anim.air * .5 - breath * .02;
  body.position.y = Math.abs(Math.sin(anim.ph)) * .07 * rs + breath * .012 * (1 - rs) - (P.landT > 0 ? P.landT * .5 : 0);
  shoulders.scale.y = .16 * (1 + breath * .05 * (1 - rs));
  head.rotation.x = breath * .03 + rs * .1;
  anim.lean = damp(anim.lean, rs * .22 + (P.gjT > 0 ? .45 : 0), 8, dt);
  let rollT = 0; if (P.wallRun) { const ry = hero.rotation.y; const side = P.wallN.x * Math.cos(ry) - P.wallN.z * Math.sin(ry); rollT = side * .5; }
  anim.roll = damp(anim.roll, rollT, 10, dt);
  body.rotation.set(anim.lean, 0, anim.roll);
  const cy = Math.cos(-hero.rotation.y), sy = Math.sin(-hero.rotation.y);
  const lx = v.x * cy - v.z * sy, lz = v.x * sy + v.z * cy;
  anim.sway.x = damp(anim.sway.x, -lx * .022, 6, dt); anim.sway.z = damp(anim.sway.z, -lz * .03 - rs * .05, 6, dt); anim.sway.y = damp(anim.sway.y, clamp(-v.y * .012, -.1, .25), 6, dt);
  coatU.uSway.value.copy(anim.sway); coatU.uFlap.value = clamp(rs + anim.air, 0, 1.4); coatU.uTime.value = S.t;
  P.landT -= dt;
  const glitching = P.phase || P.shift || ABIL.skip.act > 0 || ABIL.gj.act > 0 || ABIL.drift.act > 0;
  const fl = glitching && Math.random() < .14;
  body.position.x = fl ? (Math.random() - .5) * .25 : 0;
  coatMat.emissiveIntensity = fl ? 3.5 : (P.phase ? 2.6 : 1.3);
  const op = P.phase ? .45 + Math.sin(S.t * 30) * .1 : 1; heroMats.forEach(m => { m.opacity = op; });
  coatMat.emissive.setRGB(...(P.phase ? [.4, 1.2, 1.4] : P.shift ? [1.2, .5, 1.4] : [1, 1, 1]));
  hero.visible = S.view !== 1 && !(fl && Math.random() < .3);
  // Geometric top view: enlarge character + marker so player stays readable
  const geoSc = S.view === 2 ? 3.2 : 1;
  hero.scale.setScalar(geoSc);
  const [g] = groundAt(P.pos.x, P.pos.z, P.pos.y + .1);
  blob.position.set(P.pos.x, g + .03, P.pos.z); footRing.position.set(P.pos.x, g + .04, P.pos.z); footRing.rotation.z += dt * .6; footRing.scale.setScalar(S.view === 2 ? 8.5 : 1); blob.scale.setScalar(S.view === 2 ? 3.2 : 1);
  const hgt = P.pos.y - g; blob.material.opacity = clamp(1 - hgt / 10, 0, 1) * (S.view === 2 ? .9 : 1); footRing.material.opacity = (S.view === 2 ? .85 : clamp(.35 - hgt / 12, 0, .35)) + (glitching ? .3 : 0);
  heroLight.intensity = 1.6 + (glitching ? 3 : 0);
}

// ---------------------------------------------------------------- Kamera
const camTarget = new V3(0, 1.5, 70), tmp = new V3(), rayDir = new V3();
function rayBoxes(o, d, maxT) {
  let best = maxT;
  const pad = .55;
  for (const b of boxes) {
    let t0 = 0, t1 = best, ok = true;
    for (const k of ['x', 'y', 'z']) {
      const inv = 1 / (Math.abs(d[k]) < 1e-9 ? 1e-9 : d[k]); let ta = (b.min[k] - pad - o[k]) * inv, tb = (b.max[k] + pad - o[k]) * inv; if (ta > tb) { const s = ta; ta = tb; tb = s; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { ok = false; break; }
    }
    if (ok && t0 > 0 && t0 < best) best = t0;
  }
  return best;
}
function pushCamOut(pos) {
  const pad = .5;
  for (let it = 0; it < 4; it++) {
    for (const b of boxes) {
      if (pos.x <= b.min.x - pad || pos.x >= b.max.x + pad || pos.y <= b.min.y - pad || pos.y >= b.max.y + pad || pos.z <= b.min.z - pad || pos.z >= b.max.z + pad) continue;
      const o = [[b.min.x - pad - pos.x, 'x'], [b.max.x + pad - pos.x, 'x'], [b.min.y - pad - pos.y, 'y'], [b.max.y + pad - pos.y, 'y'], [b.min.z - pad - pos.z, 'z'], [b.max.z + pad - pos.z, 'z']];
      o.sort((a, c) => Math.abs(a[0]) - Math.abs(c[0]));
      pos[o[0][1]] += o[0][0];
    }
  }
}
function nearestFrag() { let best = null, bd = 1e9; for (const f of frags) if (!f.got) { const d = f.g.position.distanceToSquared(P.pos); if (d < bd) { bd = d; best = f; } } return best; }
function updateCamera(dt) {
  camTarget.x = P.pos.x; camTarget.z = P.pos.z; camTarget.y = damp(camTarget.y, P.pos.y + 1.55, 10, dt);
  const portrait = innerWidth < innerHeight;
  let fov = portrait ? 74 : 60; if (P.gjT > 0 || P.launchT > 0) fov += 10;
  if (S.view === 0 || S.view === 3) {
    if (S.view === 3) {
      const f = nearestFrag(); const tgt = f ? f.g.position : FLOWER_POS;
      const want = Math.atan2(-(tgt.x - P.pos.x), -(tgt.z - P.pos.z));
      S.lookIdle += dt; if (S.lookIdle > .8) S.yaw = lerpAngle(S.yaw, want, 1 - Math.exp(-2.5 * dt));
    }
    const dist = S.view === 3 ? S.zoom + 3 : S.zoom; const pitch = S.view === 3 ? Math.max(S.pitch, .25) : S.pitch;
    rayDir.set(Math.sin(S.yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(S.yaw) * Math.cos(pitch));
    const hit = P.phase ? dist : rayBoxes(camTarget, rayDir, dist);
    // Keep third-person cam outside walls/floor with stronger pull-back
    tmp.copy(camTarget).addScaledVector(rayDir, Math.max(1.8, hit - .85));
    const [platY] = groundAt(tmp.x, tmp.z, tmp.y + 4);
    const floorY = Math.max(H(tmp.x, tmp.z), platY) + .95;
    if (tmp.y < floorY) {
      // Lift out of floor/platforms; if still too close, pull toward target
      tmp.y = floorY;
      const flat = Math.hypot(tmp.x - camTarget.x, tmp.z - camTarget.z);
      if (flat > .4 && hit < dist * .55) {
        const t = clamp(hit / Math.max(dist, .01), .25, 1);
        tmp.x = lerp(camTarget.x, tmp.x, t);
        tmp.z = lerp(camTarget.z, tmp.z, t);
        tmp.y = Math.max(tmp.y, floorY);
      }
    }
    pushCamOut(tmp);
    // Never sit closer than ~1.6m or under the look-at point
    if (tmp.distanceTo(camTarget) < 1.6) tmp.copy(camTarget).addScaledVector(rayDir, 1.6);
    if (tmp.y < floorY) tmp.y = floorY;
    camera.position.copy(tmp); camera.lookAt(camTarget.x, camTarget.y + .25, camTarget.z);
  } else if (S.view === 1) {
    const pp = S.pitch; camera.position.set(P.pos.x, P.pos.y + 1.65, P.pos.z);
    camera.lookAt(P.pos.x - Math.sin(S.yaw) * Math.cos(pp), P.pos.y + 1.65 + Math.sin(pp), P.pos.z - Math.cos(S.yaw) * Math.cos(pp)); fov += 6;
  } else {
    // Geometric: slightly higher default + look straight down-ish for clearer marker
    camera.position.set(camTarget.x, camTarget.y + S.geoH, camTarget.z + S.geoH * .55); camera.lookAt(camTarget.x, camTarget.y + .4, camTarget.z);
  }
  camera.fov = damp(camera.fov, fov, 6, dt); camera.updateProjectionMatrix();
}

// ---------------------------------------------------------------- Welt-Animation
const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new V3(), t4 = new V3();
function updateWorld(wdt, dt) {
  const t = S.worldT;
  for (const b of boxes) if (b.mover) {
    const m = b.mover; const off = Math.sin(t * m.speed + m.ph) * m.amp; const old = b.min.clone();
    const c = b.base.clone(); c[m.axis] += off;
    b.min.set(c.x - b.size.x / 2, c.y, c.z - b.size.z / 2); b.max.set(c.x + b.size.x / 2, c.y + b.size.y, c.z + b.size.z / 2);
    b.delta.subVectors(b.min, old); b.mesh.position.set(c.x, c.y + b.size.y / 2, c.z);
  }
  frags[11].base.set(riftMover.min.x + 2, riftMover.max.y + 1.3, riftMover.min.z + 2);
  const upd = (arr, im) => { arr.forEach((d, i) => { e4.set(d.r.x + t * d.w.x, d.r.y + t * d.w.y, d.r.z + t * d.w.z); q4.setFromEuler(e4); s4.setScalar(d.s); t4.copy(d.p); t4.y += Math.sin(t * .4 + d.ph) * 1.5; m4.compose(t4, q4, s4); im.setMatrixAt(i, m4); }); im.instanceMatrix.needsUpdate = true; };
  upd(floatDark, imDark); upd(floatGlow, imGlow);
  const fin = S.finale >= 0 ? Math.min(1, S.finale / 3) : (S.collected >= 12 ? 1 : 0);
  flower.rotation.z = t * (.03 + fin * .15); flower.children.forEach(c => { if (c.userData.spin) c.rotation.z += c.userData.spin * wdt * (1 + fin * 6); });
  flower.scale.setScalar(1 + fin * .6 + Math.sin(t * .5) * .02);
  petalMat.emissiveIntensity = 1.6 + fin * 2.5 + Math.sin(t * 1.3) * .2;
  drCubes.forEach((g, i) => { g.rotation.x = t * .6 + i; g.rotation.y = t * .8; g.position.y = 3.4 + Math.sin(t * 1.2 + i) * .6; });
  portals.forEach(pt => { pt.ring2.rotation.z = t * 2; pt.ring.rotation.z = -t * .7; });
  portalDiscMat.uniforms.uTime.value = t;
  boundMat.uniforms.uTime.value = t; boundMat.uniforms.uPlayer.value.copy(P.pos);
  skyMat.uniforms.uTime.value = t; skyMat.uniforms.uFinale.value = fin;
  planets.forEach((p, i) => p.rotation.y = t * .01 * (i + 1));
  clouds.forEach((c, i) => { c.position.x += Math.sin(i) * wdt * .6; });
  decorGroup.children.forEach(c => { if (c.userData.spin) c.rotation.y += c.userData.spin * wdt; });
  ghosts.forEach(g => {
    if (g.life > 0) {
      g.life -= dt * 1.6;
      const dist = g.g.position.distanceTo(camera.position);
      const near = clamp((dist - 1.2) / 5.5, 0, 1); // 0 = very close to cam
      const sc = 0.28 + 0.72 * near;
      g.g.scale.setScalar(sc);
      g.m.opacity = Math.max(0, g.life) * g.a * (0.2 + 0.8 * near);
      if (g.life <= 0) g.g.visible = false;
    }
  });
  fxRings.forEach(r => { if (r.life > 0) { r.life -= dt * 1.8; r.m.scale.setScalar((1 + (1 - r.life) * 2.2) * r.s); r.m.material.opacity = Math.max(0, r.life); if (r.life <= 0) r.m.visible = false; } });
  for (let i = 0; i < PN; i++) if (partLife[i] > 0) { partLife[i] -= dt * .9; partVel[i * 3 + 1] -= 6 * dt; for (let k = 0; k < 3; k++) partPos[i * 3 + k] += partVel[i * 3 + k] * dt; if (partLife[i] <= 0) partPos[i * 3 + 1] = -999; }
  partG.attributes.position.needsUpdate = true;
  waves.forEach(w => { if (w.t >= 0) { w.t += dt; const r = 1 + w.t * 40; w.m.scale.set(r, r, 60); w.m.material.opacity = Math.max(0, 1 - w.t / 4); if (w.t > 4) { w.t = -1; w.m.visible = false; } } });
}
function updateFrags(dt) {
  const c = new V3(P.pos.x, P.pos.y + .9, P.pos.z);
  for (const f of frags) {
    if (f.got) continue;
    f.g.position.copy(f.base); f.g.position.y += Math.sin(S.t * 2 + f.id) * .18;
    f.core.rotation.y += dt * 1.5; f.r1.rotation.x = S.t * 1.2 + f.id; f.r1.rotation.y = S.t * .7; f.r2.rotation.y = -S.t * 1.4; f.r2.rotation.z = S.t;
    if (S.started && f.g.position.distanceTo(c) < 1.75) collect(f);
  }
}
function collect(f) {
  f.got = true; f.g.visible = false; S.collected++; burst(f.g.position, 90, 9); spawnRing(f.g.position, new V3(0, 1, 0), new THREE.Color(.5, 2.4, 2.8), 2);
  try { localStorage.setItem('eyecore.v1', JSON.stringify(frags.filter(x => x.got).map(x => x.id))); } catch (e) { }
  updateHUDStats(); sfx.collect(); S.flash = .35;
  feed('NODE SYNC', `${S.collected}/12`, true);
  if (S.collected >= 12) startFinale(); else toast(`KNOTEN ${S.collected}/12`, `${f.name} · synchronisiert · Resonanz ${Math.round(S.collected / 12 * 100)}%`);
}
function startFinale() {
  S.finale = 0; sfx.finale(); toast('RESONANZ 100%', 'Alle Knoten im Einklang', 3.5);
  waves.forEach((w, i) => setTimeout(() => { w.t = 0; w.m.visible = true; w.m.position.set(0, 1 + i * 18, 0); }, i * 450));
  feed('RESONANCE', '100%', true);
  setTimeout(() => { if (S.collected >= 12) { el('final').classList.add('on'); S.paused = true; } }, 4500);
}

// ---------------------------------------------------------------- HUD-Update
let hudAcc = 0;
function zoneAt(p) {
  if (p.x > DR.x0 - 1 && p.x < DR.x1 + 1 && p.z > DR.z0 - 1 && p.z < DR.z1 + 1) return ['SYSTEM / DIGITAL ROOM', 'CORE ROOM 07 · SYSTEM ARCHITECTURE'];
  if (Math.hypot(p.x, p.z) < 15) return ['DER TURM', 'CORE SPIRE · 60 M'];
  if (inRift(p.x, p.z, 2)) return ['GLITCH RIFT', 'FEHLERHAFTER ZUSTAND · VORSICHT'];
  if (p.x > 70 && p.z < -70) return ['TIME ECHO', 'TIME LAYER · TERRASSEN'];
  if (p.x < -55) return ['RESO FIELD', 'RESONANCE LAYER · ERHÖHUNGEN'];
  return ['FRAGMENT REALM', 'SPACE LAYER · DIE FLÄCHE'];
}
function updateHUD(dt) {
  const bearing = -S.yaw * 180 / Math.PI; const W = compass.clientWidth, ppd = W / 150;
  for (const c of cEls) { const off = ((c.d - bearing + 540) % 360 + 360) % 360 - 180; c.s.style.transform = `translateX(${(off * ppd).toFixed(1)}px)`; c.s.style.opacity = Math.abs(off) < 75 ? 1 : 0; }
  const f = nearestFrag();
  if (f) { const b = Math.atan2(f.g.position.x - P.pos.x, -(f.g.position.z - P.pos.z)) * 180 / Math.PI; const off = ((b - bearing + 540) % 360 + 360) % 360 - 180; cTarget.style.transform = `translateX(${(clamp(off, -70, 70) * ppd).toFixed(1)}px)`; cTarget.style.opacity = 1; }
  else cTarget.style.opacity = 0;
  for (const k in ABIL) { const a = ABIL[k]; const b = el('a-' + k); if (!b) continue; b.style.setProperty('--cd', (a.t / a.cd).toFixed(3)); b.classList.toggle('act', a.act > 0 && a.dur > .5); }
  if (S.zoneT > 0) { S.zoneT -= dt; if (S.zoneT <= 0) el('zone').classList.remove('on'); }
  hudAcc += dt; if (hudAcc < .1) return; hudAcc = 0;
  const drift = ABIL.drift.act > 0;
  const g = el('p-g'); g.textContent = (PHYS.gravity * (drift ? .55 : 1)).toFixed(2) + 'g'; g.classList.toggle('mod', drift);
  const a = el('p-a'); a.textContent = (PHYS.air * (P.gjT > 0 ? .3 : 1)).toFixed(2) + 'x'; a.classList.toggle('mod', P.gjT > 0);
  const tt = el('p-t'); tt.textContent = S.timeScale.toFixed(2) + 'x'; tt.classList.toggle('mod', S.timeScale < .99);
  const m = el('p-m'); m.textContent = P.wallRun ? 'WALL RUN' : PHYS.momentum.toFixed(2) + 'x'; m.classList.toggle('mod', P.wallRun);
  const [za, zb] = zoneAt(P.pos); if (za !== S.zone) { S.zone = za; if (S.started) zoneBanner(za, zb); }
}

// ---------------------------------------------------------------- Loop
const fogTargets = [FOG_BASE, new THREE.Color(0x000000), new THREE.Color(0x02140f), new THREE.Color(0x1a0630), new THREE.Color(0x2a0a2a)];
function update(dt) {
  S.t += dt;
  for (const k in ABIL) { const a = ABIL[k]; a.t = Math.max(0, a.t - dt); a.act = Math.max(0, a.act - dt); }
  S.timeScale = damp(S.timeScale, ABIL.drift.act > 0 ? .3 : 1, 5, dt);
  const wdt = dt * S.timeScale; S.worldT += wdt;
  updateWorld(wdt, dt);
  if (S.started) updatePlayer(dt);
  updateHero(dt); updateFrags(dt); updateCamera(dt); updateHUD(dt);
  if (S.finale >= 0) S.finale += dt;
  S.glitchFx = Math.max(0, S.glitchFx - dt * 2.2); S.flash = Math.max(0, S.flash - dt * 2);
  grade.uniforms.uTime.value = S.t; grade.uniforms.uGlitch.value = S.glitchFx + ((P.phase || P.shift) ? .12 : 0); grade.uniforms.uDrift.value = clamp(1 - (S.timeScale - .3) / .7, 0, 1);
  grade.uniforms.uFlash.value = S.flash * .35; grade.uniforms.uFinale.value = S.finale >= 0 ? Math.min(1, S.finale / 2) : (S.collected >= 12 ? .4 : 0);
  const bloomBase = quality === 'ultra' ? (IS_TOUCH ? .7 : .95) : quality === 'hoch' ? (IS_TOUCH ? .52 : .75) : quality === 'mittel' ? .38 : .22;
  bloom.strength = bloomBase + (S.finale >= 0 ? Math.min(1, S.finale / 2) * (quality === 'ultra' || quality === 'hoch' ? .7 : .3) : 0);
  scene.fog.color.lerp(fogTargets[S.layer], 1 - Math.exp(-4 * dt));
  scene.fog.density = damp(scene.fog.density, S.layer === 1 ? .014 : S.view === 2 ? .004 : .0055, 4, dt);
  skyGroup.position.copy(camera.position);
}
let last = performance.now(), fpsAcc = 0, fpsN = 0, autoQ = false, autoWarm = 0;
function render() { composer.render(); }
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(.05, Math.max(0, (now - last) / 1000)); last = now;
  if (EC.manual) return;
  if (!S.paused) update(dt);
  render();
  // Warm up ~4s after start, then require sustained low FPS before dropping ULTRA → HOCH only
  if (S.started && !autoQ && !S.paused) {
    autoWarm += dt;
    if (autoWarm > 4) {
      fpsAcc += dt; fpsN++;
      if (fpsAcc > 5) {
        const fps = fpsN / fpsAcc; EC.fps = fps;
        fpsAcc = 0; fpsN = 0;
        if (quality === 'ultra' && fps < 28) {
          autoQ = true;
          setQuality('hoch');
          console.log('Auto-Qualität: hoch', fps.toFixed(1));
          feed('GRAFIK', 'AUTO HOCH');
        } else if (quality !== 'ultra') {
          autoQ = true; // stop probing once not on ultra / or fps ok after first window on ultra
        } else {
          // FPS ok on ultra — stop further auto drops
          autoQ = true;
        }
      }
    }
  }
}
function resize() {
  const w = innerWidth, h = innerHeight, pr = prFor(quality);
  renderer.setPixelRatio(pr); renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix(); grade.uniforms.uAspect.value = w / h; layout();
}
addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 250)); window.visualViewport?.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden && S.started && !S.paused) togglePause(true); });

// Test-/Debug-Schnittstelle
const EC = window.__EC = {
  manual: false, P, S, frags, ABIL, boxes, fps: 0, scene, clouds, bloom, quality: () => quality, setQuality,
  step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) update(dt); render(); },
  teleport(x, y, z) { P.pos.set(x, y, z); P.vel.set(0, 0, 0); camTarget.set(x, y + 1.55, z); },
  setInput(mx, my) { input.ext = (mx === null) ? null : [mx, my]; },
  jump() { P.jumpBuf = .15; }, use: useAbility, view: cycleView, layer: cycleLayer,
  look(yaw, pitch) { S.yaw = yaw; if (pitch !== undefined) S.pitch = pitch; },
  start() { el('b-start').click(); }, collect: i => collect(frags[i]), reset: resetGame,
};
updateHUDStats(); resize(); requestAnimationFrame(loop);
window.__EC_READY = true;
if ('serviceWorker' in navigator && location.protocol !== 'file:') addEventListener('load', () => navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => { }));
