// REKONSTRUIERT // Dynamik zum Kern · neun Ströme, ein Kern
// Konzept: Luca Matteo Balzano 1991 · shivas_ocean
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
const Q = new URLSearchParams(location.search);
function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const R = rng(1991);
const rr = (a, b) => a + (b - a) * R();
const gauss = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
const IS_TOUCH = (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window) && navigator.maxTouchPoints > 0;
const DPR = Math.min(window.devicePixelRatio || 1, 3);
const VIDEO = Q.has('video');
const pad2 = n => String(n).padStart(2, '0');
let T = 0;

// neun Ströme, nur nummeriert: Cyan, Rot, Magenta, Gold, Orange, Violett, Grün, Blau, Weiß
const NS = 9;
const SCOL = ['#3ad6ff', '#ff2a4a', '#ff3df0', '#ffc23a', '#ff7a1a', '#9a4dff', '#3dff6a', '#3a6bff', '#eef3ff'].map(c => new THREE.Color(c));
const SHEX = ['#3ad6ff', '#ff2a4a', '#ff3df0', '#ffc23a', '#ff7a1a', '#9a4dff', '#3dff6a', '#3a6bff', '#eef3ff'];

// ---------------------------------------------------------------- renderer
const canvas = $('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: Q.has('shot') || VIDEO });
renderer.setClearColor(0x000000, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, innerWidth / innerHeight, 0.05, 900);
const isGL2 = renderer.capabilities.isWebGL2;
const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: isGL2 ? 4 : 0 });
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .8, .45, .3);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const grade = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uFlash: { value: 0 }, uVig: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uFlash,uVig; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
      float L=dot(c,vec3(.299,.587,.114)); c=max(vec3(0.),mix(vec3(L),c,1.32));
      c+=vec3(1.,.95,.9)*uFlash*.55;
      vec2 d=vUv-.5; c*=mix(1.,1.-dot(d,d)*.9,uVig);
      gl_FragColor=vec4(c,1.); }`
});
composer.addPass(grade);
const TIERS = [
  { n: 'ULTRA', pr: Math.min(DPR, 2), s: 4, bl: .85, k: 1 },
  { n: 'HOCH', pr: Math.min(DPR, 1.5), s: 2, bl: .8, k: .7 },
  { n: 'MITTEL', pr: 1, s: 0, bl: .75, k: .45 },
  { n: 'NIEDRIG', pr: .75, s: 0, bl: .7, k: .28 }];
const QN = { ultra: 0, hoch: 1, mittel: 2, niedrig: 3 };
let tier = Q.has('q') ? clamp((QN[(Q.get('q') || '').toLowerCase()] ?? +Q.get('q')) | 0, 0, 3) : (IS_TOUCH ? 1 : 0);
let autoQ = !Q.has('q') && !Q.has('noauto') && !VIDEO;

// ---------------------------------------------------------------- textures
function ctex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const dotTex = ctex(64, 64, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.22, 'rgba(255,255,255,.8)'); gr.addColorStop(.5, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
const softTex = ctex(128, 128, (g, w) => { const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.12, 'rgba(255,255,255,.55)'); gr.addColorStop(.35, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
// Lichtstern mit Strahlen (reine Optik, Linsenreflex)
const starTex = ctex(256, 256, (g, w) => {
  const c = w / 2; g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(c, c, 0, c, c, c * .35); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
  for (const [a, L, th] of [[0, 1, 3], [Math.PI / 2, 1, 3], [Math.PI / 4, .45, 1.5], [-Math.PI / 4, .45, 1.5]]) {
    g.save(); g.translate(c, c); g.rotate(a); const lg = g.createLinearGradient(-c * L, 0, c * L, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,255,255,.95)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = lg; g.fillRect(-c * L, -th / 2, c * L * 2, th); g.restore();
  }
});
const ADD = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending };
const UPT = [];
let PSZK = 1;

function makePoints(n, opt = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), size = new Float32Array(n).fill(opt.size || .08), alpha = new Float32Array(n).fill(1);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('col', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(size, 1)); geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: dotTex }, uPR: { value: 1 }, uH: { value: 800 }, uK: { value: 1 } }, ...ADD,
    vertexShader: `attribute vec3 col; attribute float size; attribute float alpha; uniform float uPR,uH; varying vec3 vC; varying float vA;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(size*uPR*uH/max(.05,-mv.z),0.,160.); vC=col; vA=alpha; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uK; varying vec3 vC; varying float vA; void main(){ float a=texture2D(uMap,gl_PointCoord).a*vA*uK; if(a<.003) discard; gl_FragColor=vec4(vC*a,1.); }`
  });
  UPT.push(mat);
  const mesh = new THREE.Points(geo, mat); mesh.frustumCulled = false;
  return { geo, pos, col, size, alpha, mesh, mat, n, up() { geo.attributes.position.needsUpdate = true; geo.attributes.col.needsUpdate = true; geo.attributes.size.needsUpdate = true; geo.attributes.alpha.needsUpdate = true; } };
}
// dynamische Linien mit Vertexfarben
function makeLines(nSeg, opt = {}) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(nSeg * 6), col = new Float32Array(nSeg * 6);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.LineBasicMaterial({ vertexColors: true, opacity: opt.op ?? 1, ...ADD });
  const mesh = new THREE.LineSegments(geo, mat); mesh.frustumCulled = false;
  return { geo, pos, col, mesh, mat, n: nSeg, up() { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; } };
}
function glowSprite(color, s, op = 1, map = dotTex) { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, opacity: op, ...ADD })); m.scale.setScalar(s); return m; }

// ---------------------------------------------------------------- Szene
const root = new THREE.Group(); scene.add(root);
const FX = -7.2, ROUT = 6.3, RC = .1;           // Feldmitte (x), Außenradius, Kernradius
const fieldG = new THREE.Group(); fieldG.position.set(FX, 0, 0); root.add(fieldG);
const exitG = new THREE.Group(); root.add(exitG);

// ================================================================ STRÖME (GPU: Fasern + Partikel, Bahn im Vertex-Shader)
const SU = {
  uT: { value: 0 }, uW: { value: 1 }, uCoh: { value: .7 }, uBreath: { value: 0 }, uPress: { value: 0 }, uPressR: { value: 0 },
  uCollapse: { value: 0 }, uBlast: { value: 0 }, uBlastR: { value: 0 }, uSwirl: { value: 0 }, uFade: { value: 1 },
  uPh: { value: new Array(NS).fill(0) }, uOn: { value: new Array(NS).fill(1) }, uFront: { value: new Array(NS).fill(2) },
  uPk: { value: new Array(NS * 3).fill(-1) }, uSurge: { value: new Array(NS).fill(0) },
  uCol: { value: SCOL.map(c => new V3(c.r, c.g, c.b)) }, uPR: { value: 1 }, uH: { value: 800 }, uMap: { value: dotTex }
};
const SGLSL = `
#define TAU 6.2831853
uniform float uT,uW,uCoh,uBreath,uPress,uPressR,uCollapse,uBlast,uBlastR,uSwirl,uFade;
uniform float uPh[9]; uniform float uOn[9]; uniform float uFront[9]; uniform float uPk[27]; uniform float uSurge[9];
uniform vec3 uCol[9];
const float ROUT=${ROUT.toFixed(3)}, RC=${RC.toFixed(3)};
float h1(float n){ return fract(sin(n*12.9898)*43758.5453); }
// Curl-Noise: Rotation eines Vektorpotentials => divergenzfreies Strömungsfeld
vec3 curlN(vec3 p){
  float t=uT*.35, a=1.3, b=.9;
  float dA3dy=-b*sin(a*p.x+t)*sin(b*p.y), dA2dz=a*cos(a*p.z+t)*cos(b*p.x);
  float dA1dz=-b*sin(a*p.y+t)*sin(b*p.z), dA3dx=a*cos(a*p.x+t)*cos(b*p.y);
  float dA2dx=-b*sin(a*p.z+t)*sin(b*p.x), dA1dy=a*cos(a*p.y+t)*cos(b*p.z);
  vec3 c1=vec3(dA3dy-dA2dz, dA1dz-dA3dx, dA2dx-dA1dy);
  p=p*2.1+3.7; t=-uT*.5;
  dA3dy=-b*sin(a*p.x+t)*sin(b*p.y); dA2dz=a*cos(a*p.z+t)*cos(b*p.x);
  dA1dz=-b*sin(a*p.y+t)*sin(b*p.z); dA3dx=a*cos(a*p.x+t)*cos(b*p.y);
  dA2dx=-b*sin(a*p.z+t)*sin(b*p.x); dA1dy=a*cos(a*p.y+t)*cos(b*p.z);
  return c1+.45*vec3(dA3dy-dA2dz, dA1dz-dA3dx, dA2dx-dA1dy);
}
// Wellenform je Strom (eigener Charakter, keine Bedeutung)
float waveF(int i,float x,float sd){
  if(i==0) return sin(x);
  if(i==1){ float s=sin(x*.5); return sign(s)*pow(abs(s),9.)*1.7+.12*sin(x*3.); }
  if(i==2) return sin(x*1.7+sd*20.)*.6+.4*sin(x*5.3+sd*7.);
  if(i==3) return sin(x)+.4*sin(x*2.+1.);
  if(i==4) return sin(x)*(sd>.5?1.:-1.);
  if(i==5) return sin(x*2.)*sin(x*.25)*1.2;
  if(i==6) return sin(x*1.2)*1.15;
  if(i==7) return sin(x*.7);
  return (fract(sin(x*7.1+sd*91.)*4375.)-.5)*.9;
}
// q: 0 außen .. 1 Kern, linear in r^2 => Tangentialgeschwindigkeit ~ 1/r (Drehimpulserhaltung)
vec3 sPos(int i,float q,vec2 lane,float sd,out float rn){
  float s=float(i);
  float r=RC+(ROUT-RC)*sqrt(max(1.-q,0.));
  rn=(r-RC)/(ROUT-RC);
  r*=1.-.045*uBreath*rn-.45*uCollapse*rn;
  r+=.34*uPress*exp(-pow((r-uPressR)/.8,2.))+2.8*uBlast*exp(-pow((r-uBlastR)/1.7,2.));
  r=max(r,RC*.4);
  float W=uW*(1.+1.6*uCollapse+uSwirl);
  float th=s*TAU/9.+(h1(s+3.)-.5)*.35+W*log(ROUT/r)-uT*.045;
  vec2 er=vec2(cos(th),sin(th)), et=vec2(-er.y,er.x);
  vec2 nrm=normalize(er*W+et);
  float wid=.05+1.2*pow(rn,1.1);
  float wv=waveF(i,q*15.-uT*1.8+sd*1.3,sd)*(.02+.13*rn)*(.65+.35*sin(uT*.6+s));
  vec3 p=vec3(er*r+nrm*(lane.x*wid+wv), lane.y*wid*.5+.8*sin(th*1.5+s*1.7)*rn*rn);
  float na=(.05+.8*(1.-uCoh))*pow(rn,.8)*(1.+uSwirl*1.5);
  p+=curlN(p*.45+vec3(sd*3.,s,0.))*na*.33;
  return p;
}
float sBright(int i,float q){
  float b=1.;
  for(int k=0;k<3;k++){ float pq=uPk[i*3+k]; if(pq>=0.) b+=3.4*exp(-pow((q-pq)/.035,2.)); }
  b+=uSurge[i]*1.6;
  b*=1.-smoothstep(uFront[i]-.05,uFront[i]+.002,q);
  return b*uOn[i];
}`;
const FIB_MAX = 60, SEG = 150, PRT_MAX = 1500;
const fibMat = new THREE.ShaderMaterial({
  uniforms: SU, ...ADD,
  vertexShader: SGLSL + `
  attribute float aS,aV,aSd,aBr; attribute vec2 aL; varying vec3 vC;
  void main(){
    int i=int(aS+.5);
    float rr=mix(1.-aV,exp(-aV*4.2),.6); float q=1.-rr*rr;
    float rn; vec3 p=sPos(i,q,aL,aSd,rn);
    float d=fract((q-uPh[i])*6.+aSd*3.7);
    float b=sBright(i,q)*(.22+.95*pow(1.-d,5.));
    b*=(.26+1.1*pow(q,7.))*(1.-.7*smoothstep(.88,1.,q))*smoothstep(0.,.07,q);
    vC=mix(uCol[i],vec3(1.,.92,.78),pow(q,14.)*.7*(1.-uCollapse))*b*aBr*uFade*.8*(1.-.82*uCollapse);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
  }`,
  fragmentShader: `varying vec3 vC; void main(){ gl_FragColor=vec4(vC,1.); }`
});
const fibGeo = new THREE.BufferGeometry();
{
  const nF = NS * FIB_MAX, nV = nF * SEG;
  const pos = new Float32Array(nV * 3), aS = new Float32Array(nV), aV = new Float32Array(nV), aSd = new Float32Array(nV), aBr = new Float32Array(nV), aL = new Float32Array(nV * 2);
  const idx = new Uint32Array(nF * (SEG - 1) * 2); let vi = 0, ii = 0; const fr = rng(9);
  for (let f = 0; f < FIB_MAX; f++) for (let s = 0; s < NS; s++) {
    const lx = (fr() * 2 - 1) * Math.pow(fr(), .35), ly = (fr() * 2 - 1), sd = fr(), br = .45 + .9 * Math.pow(fr(), 2.2), v0 = vi;
    for (let k = 0; k < SEG; k++) { aS[vi] = s; aV[vi] = k / (SEG - 1); aSd[vi] = sd; aBr[vi] = br; aL[vi * 2] = lx; aL[vi * 2 + 1] = ly; vi++; }
    for (let k = 0; k < SEG - 1; k++) { idx[ii++] = v0 + k; idx[ii++] = v0 + k + 1; }
  }
  fibGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fibGeo.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); fibGeo.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
  fibGeo.setAttribute('aSd', new THREE.BufferAttribute(aSd, 1)); fibGeo.setAttribute('aBr', new THREE.BufferAttribute(aBr, 1)); fibGeo.setAttribute('aL', new THREE.BufferAttribute(aL, 2));
  fibGeo.setIndex(new THREE.BufferAttribute(idx, 1));
}
const fibers = new THREE.LineSegments(fibGeo, fibMat); fibers.frustumCulled = false; fieldG.add(fibers);

const prtMat = new THREE.ShaderMaterial({
  uniforms: SU, ...ADD,
  vertexShader: SGLSL + `
  uniform float uPR,uH; attribute float aS,aU,aSd,aSz; attribute vec2 aL; varying vec3 vC;
  void main(){
    int i=int(aS+.5);
    float q=fract(aU+uPh[i]);
    float rn; vec3 p=sPos(i,q,aL,aSd,rn);
    float b=sBright(i,q)*(.3+.7*pow(q,6.))*(1.-smoothstep(.975,1.,q))*smoothstep(0.,.05,q);
    b*=.65+.35*sin(uT*7.+aSd*40.);
    vC=mix(uCol[i],vec3(1.,.95,.85),pow(q,10.)*.6*(1.-uCollapse))*b*uFade*.75*(1.-.75*uCollapse);
    vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp(aSz*(.6+1.4*pow(q,3.))*uPR*uH/max(.05,-mv.z),0.,48.);
  }`,
  fragmentShader: `uniform sampler2D uMap; varying vec3 vC; void main(){ float a=texture2D(uMap,gl_PointCoord).a; if(a<.01) discard; gl_FragColor=vec4(vC*a,1.); }`
});
UPT.push(prtMat);
const prtGeo = new THREE.BufferGeometry();
{
  const n = NS * PRT_MAX; const pos = new Float32Array(n * 3), aS = new Float32Array(n), aU = new Float32Array(n), aSd = new Float32Array(n), aSz = new Float32Array(n), aL = new Float32Array(n * 2); const pr = rng(11);
  for (let k = 0; k < PRT_MAX; k++) for (let s = 0; s < NS; s++) { const i = k * NS + s; aS[i] = s; aU[i] = pr(); aSd[i] = pr(); aSz[i] = .03 + .07 * Math.pow(pr(), 3); aL[i * 2] = gauss() * .45; aL[i * 2 + 1] = gauss() * .5; }
  prtGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); prtGeo.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); prtGeo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  prtGeo.setAttribute('aSd', new THREE.BufferAttribute(aSd, 1)); prtGeo.setAttribute('aSz', new THREE.BufferAttribute(aSz, 1)); prtGeo.setAttribute('aL', new THREE.BufferAttribute(aL, 2));
}
const prts = new THREE.Points(prtGeo, prtMat); prts.frustumCulled = false; fieldG.add(prts);

// CPU-Kopie der Bahn (ohne Rauschen) für Tap-Erkennung und Austritt
function sPosCPU(i, q, out) {
  const W = SU.uW.value * (1 + 1.6 * SU.uCollapse.value + SU.uSwirl.value);
  let r = RC + (ROUT - RC) * Math.sqrt(Math.max(1 - q, 0)); const rn = (r - RC) / (ROUT - RC); r *= 1 - .45 * SU.uCollapse.value * rn; r = Math.max(r, RC * .4);
  const h = (Math.sin((i + 3) * 12.9898) * 43758.5453) % 1; const hh = h < 0 ? h + 1 : h;
  const th = i * TAU / 9 + (hh - .5) * .35 + W * Math.log(ROUT / r) - SU.uT.value * .045;
  return out.set(Math.cos(th) * r, Math.sin(th) * r, .8 * Math.sin(th * 1.5 + i * 1.7) * rn * rn);
}

// ================================================================ RESONANZRING
const ringG = new THREE.Group(); fieldG.add(ringG);
const RINGS = [];
for (const [k, c, o] of [[1.06, '#4f8dff', .85], [1.0, '#8a5cff', .35], [1.18, '#3a6bff', .14], [.9, '#3ad6ff', .2], [.74, '#5b6bff', .16], [.55, '#7a5cff', .13], [.34, '#3ad6ff', .1]]) {
  const pts = []; for (let i = 0; i <= 256; i++) { const a = i / 256 * TAU; pts.push(new V3(Math.cos(a) * ROUT * k, Math.sin(a) * ROUT * k, 0)); }
  const m = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: new THREE.Color(c), opacity: o, ...ADD })); m.userData = { o, k }; ringG.add(m); RINGS.push(m);
}
const radL = makeLines(18, { op: 1 }); ringG.add(radL.mesh);
for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + .09; for (const [j, rr2, b] of [[0, .14, .02], [1, 1.06, .1]]) { radL.pos.set([Math.cos(a) * ROUT * rr2, Math.sin(a) * ROUT * rr2, 0], i * 6 + j * 3); radL.col.set([.25 * b * 3, .45 * b * 3, b * 3], i * 6 + j * 3); } } radL.up();
const NSP = 260; const spikes = makeLines(NSP * 2); ringG.add(spikes.mesh);
const SPK = []; for (let i = 0; i < NSP; i++) SPK.push({ a: i / NSP * TAU, b: R(), gold: R() < .12, bin: 4 + Math.floor(R() * 90) });
const NARC = 7, ARCS = 70; const arcs = makeLines(NARC * ARCS); ringG.add(arcs.mesh);
const ARC = []; for (let i = 0; i < NARC; i++) ARC.push({ a0: i / NARC * TAU + R() * .5, span: .35 + R() * .3, r: ROUT * (.5 + R() * .3), c: R() < .7 ? new THREE.Color('#ffc23a') : new THREE.Color('#ff7a1a') });
const FLARES = [];
for (const [a, s, c] of [[0, 2.6, '#cfe6ff'], [Math.PI / 2, 2.6, '#cfe6ff'], [Math.PI, 2.6, '#cfe6ff'], [-Math.PI / 2, 2.6, '#cfe6ff'], [.75, 1.4, '#ffd27a'], [2.3, 1.5, '#ff7ae0'], [3.9, 1.2, '#ffd27a'], [5.3, 1.6, '#9ad8ff'], [1.35, .9, '#ffffff'], [4.6, 1.1, '#ff9a4a'], [2.85, .9, '#9ad8ff'], [5.85, 1.0, '#ff7ae0']]) {
  const sp = glowSprite(new THREE.Color(c), s, .9, starTex); sp.position.set(Math.cos(a) * ROUT * 1.06, Math.sin(a) * ROUT * 1.06, 0); sp.userData = { s, a, ph: R() * TAU }; ringG.add(sp); FLARES.push(sp);
}

// ================================================================ KERN (abstrakter Lichtkern)
const coreG = new THREE.Group(); fieldG.add(coreG);
const coreA = glowSprite(new THREE.Color(1.0, .8, .55), 2.4, .4, softTex); coreG.add(coreA);
const coreB = glowSprite(new THREE.Color(1.0, .95, .85), .9, 1); coreG.add(coreB);
const coreS = glowSprite(new THREE.Color(1.0, .9, .75), 4.5, .55, starTex); coreG.add(coreS);
const coreP = makePoints(420, { size: .04 }); coreG.add(coreP.mesh);
const CP = []; for (let i = 0; i < coreP.n; i++) { CP.push({ r: .12 + Math.pow(R(), 1.6) * .9, a: R() * TAU, z: gauss() * .06, s: R() < .5 ? 1 : 0, c: Math.floor(R() * NS) }); coreP.size[i] = .025 + R() * .05; }

// ================================================================ DRUCKWELLEN + KOLLAPS
const shockMat = () => new THREE.ShaderMaterial({
  uniforms: { uR: { value: 0 }, uA: { value: 0 }, uW: { value: .3 }, uS: { value: 30 }, uC: { value: new THREE.Color(1, .9, .8) }, uT: SU.uT }, ...ADD, side: THREE.DoubleSide,
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform float uR,uA,uW,uS,uT; uniform vec3 uC; varying vec2 vUv;
    void main(){ vec2 p=(vUv-.5)*2.*uS; float d=length(p); float an=atan(p.y,p.x);
      float g=exp(-pow((d-uR)/uW,2.)); float tail=exp(-max(0.,uR-d)/(uW*4.))*step(d,uR)*.06;
      float st=.85+.15*sin(an*70.+uT*2.)*sin(an*23.-uT); vec3 hue=.5+.5*cos(6.2831*(an/6.2831+vec3(0.,.33,.67)));
      vec3 c=mix(uC,vec3(.5,.45,1.),smoothstep(0.,uS*.6,d))*(g*1.6+tail)*uA*st*mix(vec3(1.),hue*1.4,.55);
      gl_FragColor=vec4(c*(1.-smoothstep(uS*.72,uS*.97,d)),1.); }`
});
const SHOCKS = [];
for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), shockMat()); const S = i === 0 ? 34 : 10; m.scale.setScalar(S * 2); m.material.uniforms.uS.value = S; m.visible = false; m.userData = { age: 99, big: i === 0, life: 1 }; fieldG.add(m); SHOCKS.push(m); }
// Explosionspartikel (GPU, Alter als Uniform)
const BU = { uAge: { value: 99 }, uPR: SU.uPR, uH: SU.uH, uMap: { value: dotTex } };
const burstMat = new THREE.ShaderMaterial({
  uniforms: BU, ...ADD,
  vertexShader: `uniform float uAge,uPR,uH; attribute vec3 aDir; attribute vec3 aCol; attribute float aV,aSz; varying vec3 vC;
    void main(){ float k=1.6; float d=aV*(1.-exp(-uAge*k))/k; vec3 p=aDir*(.5+d)+vec3(0.,0.,0.); p.z+=sin(uAge*2.+aV)*.1;
      float a=exp(-uAge*.55)*smoothstep(0.,.4,uAge)*.55; vC=mix(vec3(1.,.95,.85),aCol,smoothstep(0.,.5,uAge))*a*.9;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=clamp(aSz*uPR*uH/max(.05,-mv.z),0.,40.); }`,
  fragmentShader: `uniform sampler2D uMap; varying vec3 vC; void main(){ float a=texture2D(uMap,gl_PointCoord).a; if(a<.01) discard; gl_FragColor=vec4(vC*a,1.); }`
});
UPT.push(burstMat);
const NBURST = 5000; const burstGeo = new THREE.BufferGeometry();
{
  const pos = new Float32Array(NBURST * 3), dir = new Float32Array(NBURST * 3), col = new Float32Array(NBURST * 3), v = new Float32Array(NBURST), sz = new Float32Array(NBURST);
  for (let i = 0; i < NBURST; i++) { const a = R() * TAU, z = gauss() * .22; const l = Math.hypot(1, z); dir.set([Math.cos(a) / l, Math.sin(a) / l, z / l], i * 3); const c = SCOL[i % NS]; col.set([c.r, c.g, c.b], i * 3); v[i] = 4 + Math.pow(R(), .7) * 26; sz[i] = .04 + .1 * Math.pow(R(), 3); }
  burstGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); burstGeo.setAttribute('aDir', new THREE.BufferAttribute(dir, 3)); burstGeo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  burstGeo.setAttribute('aV', new THREE.BufferAttribute(v, 1)); burstGeo.setAttribute('aSz', new THREE.BufferAttribute(sz, 1));
}
const burst = new THREE.Points(burstGeo, burstMat); burst.frustumCulled = false; burst.visible = false; fieldG.add(burst);

// ================================================================ STERNE (Hintergrund, keine Galaxien)
const stars = makePoints(2600, { size: .5 }); scene.add(stars.mesh);
for (let i = 0; i < stars.n; i++) { const u = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - u * u), d = 140 + R() * 120; stars.pos.set([Math.cos(a) * s * d, u * d * .7, Math.sin(a) * s * d - 60], i * 3); const w = .2 + Math.pow(R(), 6) * 1.2; const c = R() < .2 ? [1, .8, .55] : R() < .5 ? [.6, .75, 1] : [.9, .9, 1]; stars.col.set([c[0] * w, c[1] * w, c[2] * w], i * 3); stars.size[i] = .35 + R() * .7; }
stars.up();

// ================================================================ AUSTRITT: Strahl -> Welle -> Spektrum -> Form -> Knoten-Netz
const SPEC = new Float32Array(128), WAVE = new Float32Array(256);
const SPK_X0 = .4, SPK_X1 = 8.2, FORM_X = 11.2, BEAM_X1 = 19.5;
// Strahl
const beamL = makeLines(160); exitG.add(beamL.mesh);
const BX = []; for (let i = 0; i <= 160; i++) BX.push(-27 + (BEAM_X1 + 27) * i / 160);
const bandTex = ctex(16, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const beamBand = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bandTex, color: new THREE.Color(.55, .45, 1), opacity: .3, ...ADD }));
beamBand.scale.set(BEAM_X1 - FX, .55, 1); beamBand.position.set((BEAM_X1 + FX) / 2, 0, 0); exitG.add(beamBand);
const NBP = 900; const beamP = makePoints(NBP, { size: .06 }); exitG.add(beamP.mesh);
const BP = []; for (let i = 0; i < NBP; i++) BP.push({ x: FX + R() * (BEAM_X1 - FX), y: 0, z: 0, v: 5 + R() * 6, s: Math.floor(R() * NS), j: gauss(), k: gauss(), a: 0 });

// Wellenbänder oben
const NRIB = 3, RIBL = 14, RIBP = 150;
const ribs = makeLines(NRIB * RIBL * (RIBP - 1)); exitG.add(ribs.mesh);
const RIB = [{ y: 4.1, c0: new THREE.Color('#7a5cff'), c1: new THREE.Color('#3ad6ff'), k: 1.25, w: 1.6, b: 18 }, { y: 4.6, c0: new THREE.Color('#ff3df0'), c1: new THREE.Color('#9a4dff'), k: .9, w: -1.1, b: 40 }, { y: 3.6, c0: new THREE.Color('#3a6bff'), c1: new THREE.Color('#ff7a1a'), k: 1.7, w: 2.1, b: 8 }];

// Spektrum-Balken (symmetrisch um den Strahl) + Zackenreihen + Oszilloskop
const NBAR = 96; const bars = makeLines(NBAR * 2); exitG.add(bars.mesh);
const NTK = 80; const ticks = makeLines(NTK * 2); exitG.add(ticks.mesh);
const NOS = 120; const osc = makeLines(NOS * 2); exitG.add(osc.mesh);
const barSm = new Float32Array(NBAR);

// Abstrakte Form: Torus mit stehender Welle, Strahl läuft durch die Öffnung, je Strom ein Sektor
const formG = new THREE.Group(); formG.position.set(FORM_X, 0, 0); formG.rotation.set(.18, -.95, 0); exitG.add(formG);
const NFP_PER = 900, NFP = NS * NFP_PER; const formP = makePoints(NFP, { size: .05 }); formG.add(formP.mesh);
const FP = []; for (let i = 0; i < NFP; i++) { const s = i % NS; FP.push({ s, ph: (s + R()) / NS * TAU, ps: R() * TAU, k: R(), sx: -3.6 - R() * 2, sy: gauss() * .12, sz: gauss() * .12, c: 0, wr: R() }); formP.size[i] = .035 + .05 * Math.pow(R(), 2); }
const formRing = makeLines(3 * 128); formG.add(formRing.mesh);
const FILL = new Float32Array(NS);

// Knoten-Netz
const netG = new THREE.Group(); exitG.add(netG);
const NODES = [], EDGES = [];
{ const LX = [13.9, 15.4, 16.9, 18.4], LN = [4, 6, 5, 3]; const nr = rng(31);
  LX.forEach((x, l) => { for (let j = 0; j < LN[l]; j++) NODES.push({ x: x + (nr() - .5) * .3, y: -4.7 + (j - (LN[l] - 1) / 2) * (2.6 / Math.max(1, LN[l] - 1)) * (LN[l] > 1 ? 1 : 0), z: (nr() - .5) * .8, l, f: 0, c: [SCOL[3], SCOL[0], SCOL[5], SCOL[8]][Math.floor(nr() * 4)] }); });
  for (let a = 0; a < NODES.length; a++) for (let b = 0; b < NODES.length; b++) if (NODES[b].l === NODES[a].l + 1 && nr() < .75) EDGES.push({ a, b, f: 0 });
  NODES.forEach((n, i) => { if (n.l === 0) EDGES.push({ a: -1, b: i, f: 0 }); });
}
const netL = makeLines(EDGES.length); netG.add(netL.mesh);
const netN = makePoints(NODES.length, { size: .2 }); netG.add(netN.mesh);
const NPU = 160; const netPu = makePoints(NPU, { size: .1 }); netG.add(netPu.mesh);
const PUL = []; // {e, t, c}
function netFire(strength = 1) { EDGES.forEach((e, i) => { if (e.a === -1 && PUL.length < NPU) PUL.push({ e: i, t: 0, c: SCOL[Math.floor(R() * NS)], v: 1.4 + R() * .6, s: strength }); }); }
function nodePos(i, out) { if (i === -1) return out.set(FORM_X + 1.2, -.6, 0); const n = NODES[i]; return out.set(n.x, n.y, n.z); }

const _a = new V3(), _b = new V3(), _cc = new THREE.Color();
function updateExit(dt, st) {
  const { beamI, on, blast, flash } = st;
  // Strahl
  for (let i = 0; i < 160; i++) {
    const x0 = BX[i], x1 = BX[i + 1]; beamL.pos.set([x0, 0, 0, x1, 0, 0], i * 6);
    const f = x => { const d = x - FX; const left = d < 0 ? Math.exp(d / 6) * .35 : 1; const sp = x > SPK_X0 && x < SPK_X1 ? 1.25 : 1; return (.18 + beamI * .45 + flash * .5) * left * sp * (x > FORM_X + 2.6 ? Math.exp(-(x - FORM_X - 2.6) / 4) : 1); };
    const b0 = f(x0), b1 = f(x1); beamL.col.set([.75 * b0, .7 * b0, 1 * b0, .75 * b1, .7 * b1, 1 * b1], i * 6);
  } beamL.up();
  beamBand.material.opacity = .05 + beamI * .07 + flash * .2; beamBand.scale.y = .3 + beamI * .25;
  let onSum = 0; for (let s = 0; s < NS; s++) onSum += on[s];
  for (let i = 0; i < NBP; i++) {
    const p = BP[i]; p.x += p.v * dt * (1 + beamI); if (p.x > BEAM_X1) { p.x = FX + .2; let s = Math.floor(R() * NS); for (let g = 0; g < 9 && on[s] < .5; g++) s = (s + 1) % NS; p.s = s; p.a = onSum > .1 ? 1 : 0; }
    const sp = .04 + Math.max(0, p.x - FX) * .012; beamP.pos.set([p.x, p.j * sp + Math.sin(p.x * 2 + T * 3 + p.k) * .03, p.k * sp], i * 3);
    const c = SCOL[p.s], b = (.4 + beamI * 1.2) * p.a * on[p.s] * (p.x < FORM_X - 2 ? 1 : .6); beamP.col.set([c.r * b, c.g * b, c.b * b], i * 3); beamP.alpha[i] = 1;
  } beamP.up();
  // Bänder
  let si = 0; const eB = (SPEC[6] + SPEC[10] + SPEC[16]) / 3, eH = (SPEC[30] + SPEC[44]) / 2;
  for (let r = 0; r < NRIB; r++) { const rb = RIB[r]; const amp = (.35 + eB * 1.6 + beamI * .3) * (r === 1 ? .8 : 1);
    for (let l = 0; l < RIBL; l++) { let px, py, pz;
      for (let k = 0; k < RIBP; k++) { const u = k / (RIBP - 1), x = -.3 + u * 17.5; const env = Math.pow(sat(u * 1.6), 1.5) * (.55 + .45 * Math.sin(u * 3.1 + T * .2 + r)); const y = rb.y - (1 - u) * (rb.y - .2) * Math.pow(1 - u, 2) + Math.sin(x * rb.k - T * rb.w + l * .12 + r) * amp * env * (1 + .25 * Math.sin(l * .9 + T)); const z = (l - RIBL / 2) * .06 * env;
        if (k > 0) { ribs.pos.set([px, py, pz, x, y, z], si * 6); _cc.copy(rb.c0).lerp(rb.c1, u); const b0 = (.18 + .35 * env) * (1 - Math.abs(l - RIBL / 2) / RIBL) * (1 + eH); ribs.col.set([_cc.r * b0, _cc.g * b0, _cc.b * b0, _cc.r * b0, _cc.g * b0, _cc.b * b0], si * 6); si++; }
        px = x; py = y; pz = z; } } } ribs.up();
  // Balken
  for (let i = 0; i < NBAR; i++) {
    const u = i / (NBAR - 1), x = SPK_X0 + u * (SPK_X1 - SPK_X0); const bin = Math.floor(2 + Math.pow(u, 1.35) * 70); const v = SPEC[bin];
    barSm[i] += (v - barSm[i]) * Math.min(1, dt * 18); const env = .25 + .75 * Math.pow(u, .6);
    const h = (.06 + barSm[i] * 3.4) * env * (1 + flash * .6) * (.5 + .5 * beamI + .2);
    const cT = (i % 3 === 0) ? SCOL[2] : (i % 3 === 1 ? SCOL[7] : SCOL[5]); const bc = 1.1 + barSm[i];
    bars.pos.set([x, 0, 0, x, h, 0], i * 12); bars.pos.set([x, 0, 0, x, -h * .92, 0], i * 12 + 6);
    const cr = (cT.r * .6 + .25) * bc * .55, cg = (cT.g * .6 + .2) * bc * .55, cb = (cT.b * .6 + .3) * bc * .55, tr = cT.r * .35, tg = cT.g * .35, tb = cT.b * .35;
    bars.col.set([cr, cg, cb, tr, tg, tb], i * 12); bars.col.set([cr, cg, cb, tr, tg, tb], i * 12 + 6);
  } bars.up();
  for (let i = 0; i < NTK; i++) {
    const u = i / NTK, x = 2.2 + u * 6.2; const v = SPEC[40 + (i * 7) % 70]; const up = i % 2 === 0; const h = v * 1.1 * (.3 + u * .7) + .03; const y0 = up ? 2.05 : -2.05; const y1 = up ? y0 + h : y0 - h; const c = up ? (i % 6 === 0 ? SCOL[3] : SCOL[0]) : (i % 5 === 0 ? SCOL[5] : SCOL[3]);
    ticks.pos.set([x, y0, 0, x, y1, 0], i * 6); const b = .5 + v; ticks.col.set([c.r * b * .4, c.g * b * .4, c.b * b * .4, c.r * b, c.g * b, c.b * b], i * 6);
  } ticks.up();
  for (let i = 0; i < NOS; i++) { const u0 = i / NOS, u1 = (i + 1) / NOS; for (const [j, sg, c] of [[0, 1, SCOL[3]], [1, -1, SCOL[4]]]) {
    const xa = -1.2 + u0 * 6.5, xb = -1.2 + u1 * 6.5, ya = sg * (1.45 + u0 * .6) + WAVE[(i * 2) % 256] * (.25 + u0 * .5), yb = sg * (1.45 + u1 * .6) + WAVE[((i + 1) * 2) % 256] * (.25 + u1 * .5); const b = (.55 + beamI * .5) * Math.sin(u0 * Math.PI);
    osc.pos.set([xa, ya, 0, xb, yb, 0], (i * 2 + j) * 6); osc.col.set([c.r * b, c.g * b, c.b * b, c.r * b, c.g * b, c.b * b], (i * 2 + j) * 6); } } osc.up();
  // Form
  for (let s = 0; s < NS; s++) FILL[s] += ((st.fillT[s]) - FILL[s]) * Math.min(1, dt * (st.fillT[s] > FILL[s] ? .55 : 1.6));
  const Rm = 2.15, om = 2.2 + eB * 2, sA = .16 + eB * .35 + beamI * .08;
  for (let i = 0; i < NFP; i++) {
    const p = FP[i]; const c = ease((FILL[p.s] * 1.35 - p.k * .35)); p.c = c;
    const phi = p.ph + T * .12, psi = p.ps + T * (.5 + p.wr * .4);
    const stand = Math.sin(6 * phi) * Math.cos(T * om) + .6 * Math.sin(9 * phi + 1.3) * Math.cos(T * om * 1.5 + 1); // stehende Wellen, Interferenz
    const rt = .22 + sA * .55 * stand + .04 * Math.sin(psi * 3 + T);
    const RR = Rm + .12 * Math.sin(3 * phi - T * .8);
    const bl = blast * 4 * (.5 + p.wr);
    const tx = rt * Math.sin(psi), ty = (RR + rt * Math.cos(psi)) * Math.cos(phi), tz = (RR + rt * Math.cos(psi)) * Math.sin(phi);
    const ex = 1 + bl / (RR + 1); const sx = p.sx + ((T * 2.2 + p.k * 7) % 3.6), sy = p.sy, sz = p.sz;
    formP.pos.set([lerp(sx, tx * ex, c), lerp(sy, ty * ex, c), lerp(sz, tz * ex, c)], i * 3);
    const col = SCOL[p.s], b = (.08 + c * (.9 + .5 * Math.abs(stand))) * (1 + flash * .5) * on[p.s];
    formP.col.set([lerp(col.r, 1, .1) * b * .8, lerp(col.g, 1, .1) * b * .8, lerp(col.b, 1, .1) * b * .8], i * 3);
  } formP.up();
  let fsum = 0; for (let s = 0; s < NS; s++) fsum += FILL[s]; fsum /= NS;
  for (let j = 0; j < 3; j++) for (let k = 0; k < 128; k++) { const a0 = k / 128 * TAU, a1 = (k + 1) / 128 * TAU, rr0 = Rm + (j - 1) * .5; formRing.pos.set([0, Math.cos(a0) * rr0, Math.sin(a0) * rr0, 0, Math.cos(a1) * rr0, Math.sin(a1) * rr0], (j * 128 + k) * 6); const b = (j === 1 ? .22 : .07) * (.3 + fsum); formRing.col.set([.5 * b, .6 * b, b, .5 * b, .6 * b, b], (j * 128 + k) * 6); }
  formRing.up(); formG.rotation.x = .18 + Math.sin(T * .15) * .08;
  // Netz
  EDGES.forEach((e, i) => { nodePos(e.a, _a); nodePos(e.b, _b); e.f = Math.max(0, e.f - dt * 1.5); netL.pos.set([_a.x, _a.y, _a.z, _b.x, _b.y, _b.z], i * 6); const b = .12 + e.f * .6 + fsum * .08; netL.col.set([.35 * b, .5 * b, b, .55 * b, .4 * b, b], i * 6); }); netL.up();
  NODES.forEach((n, i) => { n.f = Math.max(0, n.f - dt * 1.8); netN.pos.set([n.x, n.y, n.z], i * 3); const b = .7 + n.f * 1.8 + fsum * .3; netN.col.set([n.c.r * b, n.c.g * b, n.c.b * b], i * 3); netN.size[i] = .16 + n.f * .22; }); netN.up();
  for (let k = PUL.length - 1; k >= 0; k--) { const p = PUL[k]; p.t += dt * p.v; const e = EDGES[p.e]; if (p.t >= 1) { e.f = 1; NODES[e.b].f = 1; PUL.splice(k, 1); const nx = EDGES.map((q, j) => j).filter(j => EDGES[j].a === e.b); for (const j of nx) if (R() < .55 * p.s && PUL.length < NPU) PUL.push({ e: j, t: 0, c: p.c, v: p.v, s: p.s * .9 }); } }
  for (let k = 0; k < NPU; k++) { const p = PUL[k]; if (!p) { netPu.alpha[k] = 0; continue; } const e = EDGES[p.e]; nodePos(e.a, _a); nodePos(e.b, _b); _a.lerp(_b, p.t); netPu.pos.set([_a.x, _a.y, _a.z], k * 3); netPu.col.set([p.c.r * 1.6, p.c.g * 1.6, p.c.b * 1.6], k * 3); netPu.alpha[k] = 1; } netPu.up();
}

// ================================================================ KLANG (rein generativ)
const SCALE = [196.0, 220.0, 246.9, 293.7, 329.6, 370.0, 440.0, 493.9, 587.3];   // neun Töne, je Strom einer
const CORE_F = 65.41; const HARM = [3, 4, 5, 6, 7, 8, 9, 10, 12];                 // Konvergenz: Teiltöne eines Grundtons
const FFTN = 2048;
function buildAudio(ctx, offline = false) {
  const G = { ctx };
  G.bus = ctx.createGain(); G.bus.gain.value = .9;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .25;
  const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
  G.out = ctx.createGain(); G.bus.connect(comp); comp.connect(lim); lim.connect(G.out);
  if (!offline) { G.an = ctx.createAnalyser(); G.an.fftSize = FFTN; G.an.smoothingTimeConstant = .75; G.an.minDecibels = -100; G.an.maxDecibels = -30; G.out.connect(G.an); }
  G.mute = ctx.createGain(); G.mute.gain.value = offline ? 1 : 0; G.out.connect(G.mute); G.mute.connect(ctx.destination);
  if (!offline && ctx.createMediaStreamDestination) { G.recDest = ctx.createMediaStreamDestination(); G.mute.connect(G.recDest); }
  const sr = ctx.sampleRate, len = Math.floor(sr * 3.6), ir = ctx.createBuffer(2, len, sr);
  const r = rng(77); for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  const conv = ctx.createConvolver(); conv.buffer = ir; G.rev = ctx.createGain(); G.rev.gain.value = .8; const wet = ctx.createGain(); wet.gain.value = .55; G.rev.connect(conv); conv.connect(wet); wet.connect(comp);
  const nb = ctx.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = r() * 2 - 1; G.noise = nb;
  // neun Stimmen
  G.v = [];
  for (let s = 0; s < NS; s++) {
    const g = ctx.createGain(); g.gain.value = 0; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = .5;
    const os = []; for (const [type, mul, gv, dt] of [['sine', 1, 1, 0], ['triangle', 1, .35, 5], ['sine', 2, .18, -4]]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = SCALE[s] * mul; o.detune.value = dt; og.gain.value = gv; o.connect(og); og.connect(lp); o.start(); os.push({ o, mul }); }
    lp.connect(g); const a = s / NS * TAU; aOut(G, g, Math.cos(a) * .7, .55); G.v.push({ g, os });
  }
  // Grundton im Kern
  G.dg = ctx.createGain(); G.dg.gain.value = 0; const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 500; G.dg.connect(dl); dl.connect(G.bus); const dw = ctx.createGain(); dw.gain.value = .4; dl.connect(dw); dw.connect(G.rev);
  for (const [type, mul, gv] of [['sine', 1, 1], ['triangle', 2, .3], ['sine', 3, .12]]) { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = type; o.frequency.value = CORE_F * mul; og.gain.value = gv; o.connect(og); og.connect(G.dg); o.start(); }
  return G;
}
function aOut(G, node, pan, wetv) { const ctx = G.ctx; let n = node; if (ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); n = p; } n.connect(G.bus); if (wetv) { const w = ctx.createGain(); w.gain.value = wetv; n.connect(w); w.connect(G.rev); } }
function aPing(G, when, f, a = .05, dec = 1.6, pan = 0, wetv = .7) { const ctx = G.ctx, o = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain(), g2 = ctx.createGain(); o.frequency.value = f; o2.frequency.value = f * 2.76; g2.gain.value = .15; o.connect(g); o2.connect(g2); g2.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .006); g.gain.exponentialRampToValueAtTime(.0001, when + dec); aOut(G, g, pan, wetv); o.start(when); o2.start(when); o.stop(when + dec + .05); o2.stop(when + dec + .05); }
function aThump(G, when, a = .3) { const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(72, when); o.frequency.exponentialRampToValueAtTime(34, when + .35); o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .01); g.gain.exponentialRampToValueAtTime(.0001, when + .6); aOut(G, g, 0, .12); o.start(when); o.stop(when + .65); }
function aBell(G, when, f, a = .05, pan = 0) { const ctx = G.ctx, c = ctx.createOscillator(), m = ctx.createOscillator(), mg = ctx.createGain(), g = ctx.createGain(); c.frequency.value = f; m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.5, when); mg.gain.exponentialRampToValueAtTime(1, when + 1.5); m.connect(mg); mg.connect(c.frequency); c.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(a, when + .005); g.gain.exponentialRampToValueAtTime(.0001, when + 2.6); aOut(G, g, pan, .9); c.start(when); m.start(when); c.stop(when + 2.7); m.stop(when + 2.7); }
function aChord(G, when, mults, a = .03) { mults.forEach((m, i) => aBell(G, when + i * .035, CORE_F * m, a, (i / Math.max(1, mults.length - 1) - .5) * 1.2)); }
function aRiser(G, when, dur) {
  const ctx = G.ctx, s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = G.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(180, when); bp.frequency.exponentialRampToValueAtTime(5200, when + dur);
  g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(.16, when + dur * .95); g.gain.linearRampToValueAtTime(0, when + dur + .05); s.connect(bp); bp.connect(g); aOut(G, g, 0, .5); s.start(when); s.stop(when + dur + .1);
  const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(CORE_F, when); o.frequency.exponentialRampToValueAtTime(CORE_F * 8, when + dur); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(300, when); lp.frequency.exponentialRampToValueAtTime(3000, when + dur);
  og.gain.setValueAtTime(0, when); og.gain.linearRampToValueAtTime(.05, when + dur * .9); og.gain.linearRampToValueAtTime(0, when + dur + .03); o.connect(lp); lp.connect(og); aOut(G, og, 0, .4); o.start(when); o.stop(when + dur + .1);
}
function aBoom(G, when) {
  const ctx = G.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(62, when); o.frequency.exponentialRampToValueAtTime(23, when + 2); o.connect(g); g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(.7, when + .015); g.gain.exponentialRampToValueAtTime(.0001, when + 3.2); aOut(G, g, 0, .3); o.start(when); o.stop(when + 3.3);
  const s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), ng = ctx.createGain(); s.buffer = G.noise; s.loop = true; lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, when); lp.frequency.exponentialRampToValueAtTime(110, when + 2.6); ng.gain.setValueAtTime(0, when); ng.gain.linearRampToValueAtTime(.3, when + .01); ng.gain.exponentialRampToValueAtTime(.0001, when + 3); s.connect(lp); lp.connect(ng); aOut(G, ng, 0, 1); s.start(when); s.stop(when + 3.1);
  aChord(G, when + .05, [2, 3, 4, 5, 6, 8, 10, 12], .028);
}
function aPlay(G, t, type, a) {
  switch (type) {
    case 'thump': aThump(G, t, a[0]); break;
    case 'ping': aPing(G, t, a[0], a[1], a[2], a[3], .8); break;
    case 'chord': aChord(G, t, a[0], a[1]); break;
    case 'riser': aRiser(G, t, a[0]); break;
    case 'boom': aBoom(G, t); break;
  }
}
function aVoices(G, t, f, g, tc = .12) {
  for (let s = 0; s < NS; s++) { const v = G.v[s]; v.g.gain.setTargetAtTime(g[s], t, tc); for (const o of v.os) o.o.frequency.setTargetAtTime(f[s] * o.mul, t, tc * 1.5); }
  G.dg.gain.setTargetAtTime(g[NS], t, tc * 2);
}
// Spektrum: log-Frequenz-Abbildung (für Analyser live und Offline-FFT im Video gleich)
const SPEC_BIN = []; for (let k = 0; k < 128; k++) SPEC_BIN.push(50 * Math.pow(2, k / 128 * 8));
function specFromBytes(bytes, sr) { const hz = sr / FFTN; for (let k = 0; k < 128; k++) { const b = Math.round(SPEC_BIN[k] / hz); let m = 0; for (let j = Math.max(0, b - 1); j <= b + 1 && j < bytes.length; j++) m = Math.max(m, bytes[j]); SPEC[k] = Math.pow(sat((m / 255 - .22) / .78), 1.25); } }
function fftMag(re, im) { // in-place radix-2
  const n = re.length; for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]];[im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -TAU / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let j = 0; j < len / 2; j++) { const ar = re[i + j], ai = im[i + j], br = re[i + j + len / 2] * cr - im[i + j + len / 2] * ci, bi = re[i + j + len / 2] * ci + im[i + j + len / 2] * cr; re[i + j] = ar + br; im[i + j] = ai + bi; re[i + j + len / 2] = ar - br; im[i + j + len / 2] = ai - bi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}

// ================================================================ ZUSTAND
const ST = { snd: true, vol: .85 };
try { Object.assign(ST, JSON.parse(localStorage.getItem('qork') || '{}')); } catch (_) { }
const saveS = () => { try { localStorage.setItem('qork', JSON.stringify({ snd: ST.snd })); } catch (_) { } };
const P = { puls: 60, wirbel: 1, koh: .72, dichte: 1 };
let rec = null, recChunks = [], recStart = 0, recUrl = null, VSPEC = null, vFrame = 0;
let started = false, manual = VIDEO, lastNow = performance.now(), frameN = 0, mode = 'frei';
const STR = Array.from({ length: NS }, (_, s) => ({ on: 1, onV: 1, go: true, front: 2, th: s * 2.399 % TAU, dw: (s - 4) / 4 * .28, pk: [], surge: 0 }));
let flowPh = 0, beatPh = 0, pulseEnv = 0, coreK = 0, flash = 0, beamI = .3, E = 0, cool = 8, swirl = 0, order = 0, shake = 0, pressAge = 99, chordT = -99, nArrive = 0, nFlash = 0, nBang = 0;
const COL = { ph: 'idle', t: 0, cv: 0 };
const BUILD = { on: false, t: 0, dt: 3.5, done: 0 };
const ARR = []; let shockI = 1;
const fillT = new Float32Array(NS);
function toast(t, s = 2.4) { const e = $('toast'); e.textContent = t; e.classList.remove('hide'); toastT = s; }
let toastT = 0;

// ================================================================ KLANG-WRAPPER (live oder Ereignis-Log fürs Video)
const SND = (() => {
  let ctx = null, G = null, log = null, pc = 0, pT = 0; const bytes = new Uint8Array(FFTN / 2), td = new Float32Array(FFTN);
  function unlock() {
    if (!ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; try { ctx = new AC(); G = buildAudio(ctx); } catch (e) { console.warn(e); ctx = null; return; } }
    try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
    if (ctx.state !== 'running') ctx.resume().catch(() => { });
    vol();
  }
  function vol() { if (!G) return; const v = ST.snd ? ST.vol : (window.__recOn ? .0001 : 0); G.mute.gain.setTargetAtTime(v, ctx.currentTime, .15); }
  const live = () => G && ctx.state === 'running';
  function ev(type, a = []) {
    if (log) { log.ev.push([T, type, a]); return; }
    if (!live()) return; const now = ctx.currentTime;
    if (type === 'ping') { if (now - pT > .1) { pT = now; pc = 0; } if (++pc > 4) return; }
    try { aPlay(G, now + .02, type, a); } catch (e) { console.warn(e); }
  }
  function voices(f, g) { if (log) { if (frameN % 2 === 0) log.v.push([T, f.slice(), g.slice()]); return; } if (live()) aVoices(G, ctx.currentTime, f, g); }
  function analyse(fallback) {
    if (live() && G.an) { G.an.getByteFrequencyData(bytes); specFromBytes(bytes, ctx.sampleRate); G.an.getFloatTimeDomainData(td); for (let i = 0; i < 256; i++) WAVE[i] = clamp(td[i * 4] * 5, -1, 1); return true; }
    fallback(); return false;
  }
  return { unlock, vol, ev, voices, analyse, startLog() { log = { ev: [], v: [] }; }, get log() { return log; }, recTracks: () => G && G.recDest ? G.recDest.stream.getAudioTracks() : [], get ctx() { return ctx; } };
})();
// Ersatz-Spektrum, falls noch kein Audio läuft (aus denselben Stimmen berechnet)
const VF = new Array(NS).fill(0), VG = new Array(NS + 1).fill(0);
function synthSpec() {
  const lk = f => Math.log2(f / 50) * 16;
  for (let k = 0; k < 128; k++) { let v = .04 * Math.random(); for (let s = 0; s < NS; s++) { const g = VG[s] / .03; if (g <= 0) continue; for (const h of [1, 2, 3]) { const d = k - lk(VF[s] * h); v += g / h * Math.exp(-d * d / 3); } } v += VG[NS] * 6 * Math.exp(-Math.pow(k - lk(CORE_F), 2) / 6) + flash * .4 * Math.exp(-k / 60) + pulseEnv * .3 * Math.exp(-k / 12); SPEC[k] = sat(v * .8); }
  for (let i = 0; i < 256; i++) { let w = 0; for (let s = 0; s < NS; s++) w += VG[s] * 12 * Math.sin(i * .05 * (1 + s * .3) + T * 8); WAVE[i] = clamp(w + pulseEnv * .5 * Math.sin(i * .02 + T * 3), -1, 1); }
}
function sndBtn() { $('bSnd').textContent = ST.snd ? 'TON AN' : 'TON AUS'; $('bSnd').classList.toggle('on', ST.snd); }
$('bSnd').onclick = () => { ST.snd = !ST.snd; SND.unlock(); SND.vol(); sndBtn(); saveS(); toast(ST.snd ? 'TON AN · IPHONE: STUMMSCHALTER AUS' : 'TON AUS'); };
sndBtn();

// ================================================================ SIMULATION
const flowV = () => .1 * Math.pow(P.puls / 60, .5) * (1 + swirl * .5) * (1 + COL.cv * 2.5);
function emit(s) { const S = STR[s]; if (S.pk.length >= 3) S.pk.shift(); S.pk.push(0); }
function arrive(s) {
  nArrive++; ARR.push({ t: T, s }); while (ARR.length && T - ARR[0].t > .3) ARR.shift();
  const set = new Set(ARR.filter(a => T - a.t < .25).map(a => a.s)); const n = set.size;
  coreK = Math.min(1.8, coreK + .3); beamI = Math.min(2.2, beamI + .2); E += 1;
  const a = s / NS * TAU; SND.ev('ping', [CORE_F * HARM[s] * 2, .022, 1.8, Math.cos(a) * .7]);
  if (n >= 2) { flash = Math.max(flash, .08 * n); E += n * .8; nFlash++; netFire(.5 + .06 * n); if (n >= 5 && T - chordT > 1.2) { chordT = T; SND.ev('chord', [order > .93 ? [2, 3, 4, 5, 6, 8] : [3, 4, 5], .018 + .003 * n]); } }
  else if (s % 3 === 0) netFire(.45);
}
function headArrive(s) { coreK = Math.min(1.8, coreK + .6); flash = Math.max(flash, .25); beamI = Math.min(2.2, beamI + .5); netFire(.8); SND.ev('ping', [CORE_F * HARM[s] * 2, .04, 2.6, 0]); SND.ev('chord', [[HARM[s], HARM[s] * 2], .02]); }
function beat() {
  coreK = Math.min(1.8, coreK + .35); pressAge = 0; const sh = SHOCKS[shockI]; shockI = shockI % 4 + 1; sh.userData.age = 0; sh.userData.life = 1.4;
  let nA = 0; for (const S of STR) if (S.on && S.front >= 1) nA++; SND.ev('thump', [.16 + .14 * nA / NS]);
}
function startCollapse() { if (COL.ph !== 'idle') return false; COL.ph = 'imp'; COL.t = 0; SND.ev('riser', [1.7]); return true; }
function bang() {
  COL.ph = 'bang'; COL.t = 0; nBang++; const s0 = SHOCKS[0]; s0.material.uniforms.uC.value.setRGB(1, .7, .4); s0.userData.age = 0; s0.userData.life = 5; BU.uAge.value = 0; burst.visible = true;
  flash = .5; shake = 1; E = 0; cool = 18; beamI = 2.4; netFire(1.3); SND.ev('boom');
}
function setStream(s, v) {
  const S = STR[s]; v = v ? 1 : 0; if (S.on === v) return; S.on = v; if (v) { S.front = -.08; S.go = true; } S.pk.length = 0;
  document.querySelectorAll('#dots button')[s]?.classList.toggle('off', !v);
}
function surge(s, q = .2) { const S = STR[s]; if (!S.on) return; if (S.pk.length >= 3) S.pk.shift(); S.pk.push(Math.min(q, Math.max(0, S.front - .02))); S.surge = 1; swirl = Math.min(2, swirl + .15); SND.ev('ping', [SCALE[s] * 2, .03, 1.2, Math.cos(s / NS * TAU) * .7]); }
function corePulse() { beat(); coreK = Math.min(2, coreK + .6); E += 4; flash = Math.max(flash, .2); }
function startBuild(dt = 3.5) { mode = 'aufbau'; BUILD.on = true; BUILD.t = 0; BUILD.dt = dt; BUILD.done = 0; P.koh = .35; for (const S of STR) { S.go = false; S.front = -.08; S.pk.length = 0; S.on = 1; } document.querySelectorAll('#dots button').forEach(b => b.classList.remove('off')); E = 0; cool = 0; syncUI(); }

const _p = new V3();
function frame(dt) {
  T += dt; frameN++; SU.uT.value = T;
  const hz = P.puls / 60;
  // AUFBAU
  if (BUILD.on) {
    BUILD.t += dt; let allA = true;
    STR.forEach((S, s) => { if (!S.go && BUILD.t >= .6 + s * BUILD.dt) { S.go = true; SND.ev('ping', [SCALE[s], .03, 2.2, Math.cos(s / NS * TAU) * .7]); } if (S.front < 1) allA = false; });
    P.koh = lerp(.35, .97, sat((BUILD.t - .6) / (8 * BUILD.dt + 5))); if (frameN % 10 === 0) syncUI();
    if (allA) { BUILD.done += dt; if (BUILD.done > 1.2 && startCollapse()) { BUILD.on = false; mode = 'frei'; P.koh = .97; syncUI(); } }
  }
  const fv = flowV();
  flowPh = (flowPh + dt * fv) % 1;
  // Fronten (Strom baut sich vom Rand zum Kern auf)
  STR.forEach((S, s) => {
    S.onV += (S.on - S.onV) * Math.min(1, dt * 3);
    if (S.go && S.on && S.front < 2) { const f0 = S.front; S.front = Math.min(2, S.front + dt * fv * 2); if (f0 < 1 && S.front >= 1) headArrive(s); }
    SU.uPh.value[s] = (flowPh + s * .137) % 1; SU.uOn.value[s] = S.onV; SU.uFront.value[s] = S.front;
    S.surge = Math.max(0, S.surge - dt * 1.2); SU.uSurge.value[s] = S.surge;
    fillT[s] = S.on && S.front >= 1 && COL.ph !== 'imp' ? 1 : 0;
  });
  // Kuramoto: neun Oszillatoren, Kopplung ~ Kohärenz
  const w0 = TAU * hz / 3, K = P.koh * 1.35 * w0; let cx = 0, cy = 0, nAct = 0;
  const act = STR.map(S => S.on && S.front >= .35);
  for (let s = 0; s < NS; s++) if (act[s]) { cx += Math.cos(STR[s].th); cy += Math.sin(STR[s].th); nAct++; }
  order = nAct ? Math.hypot(cx, cy) / nAct : 0;
  const R0 = order, psi = Math.atan2(cy, cx);
  for (let s = 0; s < NS; s++) { const S = STR[s]; const w = w0 * (1 + S.dw); S.th += dt * (w + (act[s] ? K * R0 * Math.sin(psi - S.th) : 0)); if (S.th >= TAU) { S.th -= TAU; if (act[s] && COL.ph === 'idle') emit(s); } }
  // Pakete
  for (let s = 0; s < NS; s++) { const S = STR[s]; for (let k = S.pk.length - 1; k >= 0; k--) { S.pk[k] += dt * fv * 1.7; if (S.pk[k] >= 1) { S.pk.splice(k, 1); if (S.on) arrive(s); } } for (let k = 0; k < 3; k++) SU.uPk.value[s * 3 + k] = k < S.pk.length && S.on ? S.pk[k] : -1; }
  // Puls im Gegentakt
  beatPh += dt * hz; if (beatPh >= 1) { beatPh -= 1; beat(); }
  pulseEnv = Math.exp(-beatPh * 6) * (1 - Math.exp(-beatPh * 60));
  SU.uBreath.value = pulseEnv * (1 + coreK * .3);
  pressAge += dt; SU.uPressR.value = pressAge * 6.5; SU.uPress.value = Math.exp(-pressAge * 1.2) * (pressAge < 3 ? 1 : 0);
  // Energie und Kollaps
  let nArr = 0; for (const S of STR) if (S.on && S.front >= 1) nArr++;
  cool -= dt;
  if (!BUILD.on && COL.ph === 'idle' && cool <= 0 && E > 45 && nArr >= 6 && order > .85) startCollapse();
  if (COL.ph === 'imp') { COL.t += dt; COL.cv = Math.pow(ease(COL.t / 1.7), 1.5); flash = Math.max(flash, COL.cv * .1); if (COL.t >= 1.7) bang(); }
  else if (COL.ph === 'bang') {
    COL.t += dt; const t = COL.t; COL.cv = (1 - ease(t / .35)) * (t < .35 ? 1 : 0);
    SU.uBlast.value = Math.exp(-t * 1.3) * sat(t / .04); SU.uBlastR.value = t * 13; SU.uFade.value = t < .3 ? Math.max(0, 1 - t / .08) : 1;
    if (t >= .3 && t - dt < .3) for (const S of STR) { S.front = -.06; S.go = true; S.pk.length = 0; }
    BU.uAge.value = t; if (t > 7) { COL.ph = 'idle'; burst.visible = false; SU.uBlast.value = 0; }
  }
  SU.uCollapse.value = COL.cv;
  // Ganzton bei voller Kohärenz
  if (order > .95 && nArr >= 7 && T - chordT > 9 && COL.ph === 'idle') { chordT = T; flash = Math.max(flash, .35); SND.ev('chord', [[1, 2, 3, 4, 5, 6], .022]); }
  swirl *= Math.exp(-dt * 1.2); SU.uSwirl.value = swirl; SU.uW.value = P.wirbel; SU.uCoh.value = P.koh;
  coreK *= Math.exp(-dt * 2.6); flash *= Math.exp(-dt * 2.8); shake *= Math.exp(-dt * 2.2);
  beamI += (.22 + .5 * nArr / NS * order - beamI) * Math.min(1, dt * .9);
  // Stimmen
  const conv = sat(.65 * Math.pow(order, 4) * nArr / NS + COL.cv + .25 * E / 60);
  for (let s = 0; s < NS; s++) {
    const S = STR[s]; let pr = 0; for (const q of S.pk) pr = Math.max(pr, q * q * q);
    VF[s] = SCALE[s] * Math.pow(CORE_F * HARM[s] / SCALE[s], conv);
    VG[s] = S.on ? (S.front >= 1 ? (.009 + .016 * pr + .012 * S.surge) * (1 - .9 * (COL.ph === 'bang' && COL.t < 2 ? 1 - COL.t / 2 : 0)) : S.go ? .006 * sat(S.front) : 0) : 0;
  }
  VG[NS] = .05 * nArr / NS * (.4 + .6 * conv) + .12 * COL.cv;
  SND.voices(VF, VG);
  if (VSPEC) { const fr = VSPEC[Math.min(VSPEC.length - 1, vFrame)]; if (fr) { SPEC.set(fr.s); WAVE.set(fr.w); } } else SND.analyse(synthSpec);
  // Kern
  const cs = (1 + .35 * pulseEnv + .35 * coreK + E / 60 * .25) * (1 - .7 * COL.cv) + (COL.ph === 'bang' ? 1.4 * Math.exp(-COL.t * 2.5) : 0) + COL.cv * .4 * Math.sin(T * 40) * COL.cv;
  coreA.scale.setScalar(2.4 * cs); coreA.material.opacity = .3 + .2 * pulseEnv + .4 * COL.cv;
  coreB.scale.setScalar(.9 * (cs * .7 + .3) * (1 + 1.5 * COL.cv)); coreS.scale.setScalar(4.5 * (1 + .5 * coreK + .8 * COL.cv + flash * .5)); coreS.material.rotation = T * .05;
  for (let i = 0; i < coreP.n; i++) { const c = CP[i]; c.a += dt * (.8 + 1.2 / c.r) * (1 + 3 * COL.cv); const r = c.r * (1 + .25 * pulseEnv) * (1 - .85 * COL.cv) * (COL.ph === 'bang' ? 1 + 6 * (1 - Math.exp(-COL.t * 2)) * Math.exp(-COL.t * .7) : 1); coreP.pos.set([Math.cos(c.a) * r, Math.sin(c.a) * r, c.z], i * 3); const col = c.s ? SCOL[c.c] : SCOL[8]; const b = .6 + .8 * pulseEnv; coreP.col.set([col.r * b, col.g * b, col.b * b], i * 3); }
  coreP.up();
  // Ring: Frequenz-Zacken, Bögen, Reflexe
  RINGS.forEach((m, i) => { m.material.opacity = m.userData.o * (1 + .7 * pulseEnv + flash); m.scale.setScalar(1 + .012 * pulseEnv * (i + 1) * .3 + (COL.ph === 'bang' ? .05 * Math.exp(-COL.t) : 0)); });
  for (let i = 0; i < NSP; i++) { const p = SPK[i]; const v = SPEC[p.bin]; const L = (.04 + v * (p.gold ? 1.3 : .95) * (.35 + p.b)) * (1 + pulseEnv * .6) + (p.b > .93 ? .3 : 0); const r0 = ROUT * 1.06, ca = Math.cos(p.a), sa = Math.sin(p.a);
    spikes.pos.set([ca * r0, sa * r0, 0, ca * (r0 + L), sa * (r0 + L), 0], i * 12); spikes.pos.set([ca * r0, sa * r0, 0, ca * (r0 - L * .45), sa * (r0 - L * .45), 0], i * 12 + 6);
    const c = p.gold ? [1, .75, .25] : [.35, .6, 1]; const b = .35 + v * 1.2; spikes.col.set([c[0] * b, c[1] * b, c[2] * b, c[0] * b * .2, c[1] * b * .2, c[2] * b * .2], i * 12); spikes.col.set([c[0] * b * .7, c[1] * b * .7, c[2] * b * .7, 0, 0, 0], i * 12 + 6); }
  spikes.up();
  for (let i = 0; i < NARC; i++) { const A = ARC[i]; A.a0 += dt * .04 * (i % 2 ? 1 : -1); for (let k = 0; k < ARCS; k++) { const u0 = k / ARCS, u1 = (k + 1) / ARCS; const a0 = A.a0 + u0 * A.span, a1 = A.a0 + u1 * A.span; const w0v = WAVE[(i * 30 + k * 3) % 256] * .22, w1v = WAVE[(i * 30 + k * 3 + 3) % 256] * .22; const r0 = A.r + w0v, r1 = A.r + w1v; arcs.pos.set([Math.cos(a0) * r0, Math.sin(a0) * r0, 0, Math.cos(a1) * r1, Math.sin(a1) * r1, 0], (i * ARCS + k) * 6); const b = Math.sin(u0 * Math.PI) * (.35 + .5 * beamI * .5); arcs.col.set([A.c.r * b, A.c.g * b, A.c.b * b, A.c.r * b, A.c.g * b, A.c.b * b], (i * ARCS + k) * 6); } }
  arcs.up();
  FLARES.forEach((f, i) => { const u = f.userData; f.scale.setScalar(u.s * (.75 + .25 * Math.sin(T * 1.3 + u.ph) + .5 * pulseEnv + flash * .6)); f.material.rotation = .2 * Math.sin(T * .2 + u.ph); });
  // Druckwellen
  SHOCKS.forEach((m, i) => { const u = m.userData; u.age += dt; const big = i === 0; m.visible = u.age < u.life; if (!m.visible) return; const U = m.material.uniforms; U.uR.value = u.age * (big ? 13 : 6.5); U.uA.value = (big ? .75 : .12 * (1 + coreK * .3)) * Math.exp(-u.age * (big ? .5 : 2.2)) * sat(u.age / .03); U.uW.value = big ? .3 + u.age * .22 : .22 + u.age * .14; });
  // Austritt
  updateExit(dt, { beamI, on: STR.map(S => S.onV), blast: COL.ph === 'bang' ? Math.exp(-COL.t * .9) * (1 - Math.exp(-COL.t * 8)) : 0, flash, fillT });
  grade.uniforms.uFlash.value = Math.min(1.2, flash * (COL.ph === 'bang' && COL.t < .5 ? .9 : .6));
  bloom.strength = TIERS[tier].bl * (1 + .25 * Math.min(1, flash) + .3 * COL.cv);
  updCam(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.add('hide'); }
  if (frameN % 6 === 0) status(nArr);
  if (rec && (frameN & 7) === 0) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; }
}
function status(nArr) { const s = `${nArr}/9 · ${order.toFixed(2)}`; if ($('stat').textContent !== s) $('stat').textContent = s; }

// ================================================================ KAMERA
const CAM = { yaw: 0, pit: .1, uy: 0, up: 0, zoom: 1, zT: 1, t: new V3(), d: 30, lastIn: -99, portrait: false, vk: null };
const CEN = new V3(2.6, .2, 0), CORE = new V3(FX, 0, 0);
function fitD() { const f = Math.tan(camera.fov * Math.PI / 360), a = camera.aspect; const W = 36, H = 15.5; return CAM.portrait ? Math.max((W / 2) / f, (H / 2) / (f * a)) : Math.max((W / 2) / (f * a), (H / 2) / f); }
const _t = new V3(), _c = new V3();
function updCam(dt) {
  if (CAM.vk) { const k = CAM.vk; CAM.zoom = k.z; CAM.uy = k.yaw; CAM.up = k.pit; }
  else { CAM.zoom += (CAM.zT - CAM.zoom) * Math.min(1, dt * 3); if (T - CAM.lastIn > 6) { CAM.uy *= Math.exp(-dt * .4); CAM.up *= Math.exp(-dt * .4); } }
  const d = fitD() * CAM.zoom; const zk = sat((CAM.zoom - .22) / .78);
  _t.copy(CORE).lerp(CEN, ease(zk)); _t.applyAxisAngle(new V3(0, 0, 1), root.rotation.z);
  const yaw = (CAM.vk ? 0 : .07 * Math.sin(T * .06)) + CAM.uy, pit = CAM.pit + (CAM.vk ? 0 : .03 * Math.sin(T * .045)) + CAM.up;
  camera.position.set(_t.x + Math.sin(yaw) * Math.cos(pit) * d, _t.y + Math.sin(pit) * d, _t.z + Math.cos(yaw) * Math.cos(pit) * d);
  if (shake > .01) camera.position.add(_c.set(Math.sin(T * 53) * shake * .35, Math.sin(T * 61 + 1) * shake * .35, 0));
  camera.lookAt(_t);
}
// ================================================================ BERÜHRUNG
const PTR = new Map(); let drag = null, pinch0 = 0, zoom0 = 1;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture?.(e.pointerId); PTR.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (PTR.size === 1) drag = { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, moved: false, t: performance.now() }; else if (PTR.size === 2) { const [a, b] = [...PTR.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); zoom0 = CAM.zT; if (drag) drag.moved = true; } CAM.lastIn = T; });
canvas.addEventListener('pointermove', e => {
  if (!PTR.has(e.pointerId)) return; PTR.set(e.pointerId, { x: e.clientX, y: e.clientY }); CAM.lastIn = T;
  if (PTR.size === 2) { const [a, b] = [...PTR.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) CAM.zT = clamp(zoom0 * pinch0 / d, .22, 1.35); return; }
  if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY;
  if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > 8) drag.moved = true;
  if (drag.moved) { CAM.uy = clamp(CAM.uy - dx * .0035, -1.1, 1.1); CAM.up = clamp(CAM.up + dy * .0028, -.5, .9); const sp = Math.hypot(dx, dy); swirl = Math.min(2.2, swirl + sp * .0025); E += sp * .004; }
});
const endP = e => { PTR.delete(e.pointerId); if (PTR.size === 0) { if (drag && !drag.moved && performance.now() - drag.t < 600) tapAt(e.clientX, e.clientY); drag = null; pinch0 = 0; } };
canvas.addEventListener('pointerup', endP); canvas.addEventListener('pointercancel', endP);
canvas.addEventListener('wheel', e => { e.preventDefault(); CAM.zT = clamp(CAM.zT * Math.exp(e.deltaY * .0012), .22, 1.35); CAM.lastIn = T; }, { passive: false });
function proj(v) { v.project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
function tapAt(x, y) {
  if (!started) return; fieldG.updateMatrixWorld(true);
  const [cx, cy] = proj(_p.set(0, 0, 0).applyMatrix4(fieldG.matrixWorld)); const dpx = Math.min(innerWidth, innerHeight);
  if (Math.hypot(cx - x, cy - y) < Math.max(36, dpx * .05)) { corePulse(); return 'core'; }
  let best = null, bd = Math.max(48, dpx * .07);
  for (let s = 0; s < NS; s++) { const S = STR[s]; if (!S.on) continue; for (let q = .02; q < Math.min(S.front, .96); q += .025) { sPosCPU(s, q, _p).applyMatrix4(fieldG.matrixWorld); const [px, py] = proj(_p); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = { s, q }; } } }
  if (best) { surge(best.s, best.q); return best.s; }
  swirl = Math.min(2.2, swirl + .4); E += 1; return null;
}

// ================================================================ BEDIENUNG
const SL = [['sP', 'puls', v => Math.round(v)], ['sW', 'wirbel', v => v.toFixed(2)], ['sK', 'koh', v => v.toFixed(2)], ['sD', 'dichte', v => v.toFixed(2)]];
function syncUI() { for (const [id, k, f] of SL) { const el = $(id); if (document.activeElement !== el) el.value = P[k]; $(id + 'v').textContent = f(P[k]); } }
for (const [id, k, f] of SL) $(id).addEventListener('input', e => { P[k] = +e.target.value; $(id + 'v').textContent = f(P[k]); if (k === 'koh' && BUILD.on) { BUILD.on = false; mode = 'frei'; } if (k === 'dichte') density(); CAM.lastIn = T; });
const dotsEl = $('dots'); SHEX.forEach((c, s) => { const b = document.createElement('button'); b.style.setProperty('--c', c); b.setAttribute('aria-label', String(s + 1)); b.innerHTML = `<i></i><u>${s + 1}</u>`; b.onclick = () => { setStream(s, !STR[s].on); }; dotsEl.appendChild(b); });
$('bSet').onclick = () => { $('set').classList.toggle('open'); $('bSet').classList.toggle('on', $('set').classList.contains('open')); };
$('bAuf').onclick = () => { startBuild(IS_TOUCH ? 3 : 3.5); toast('AUFBAU · 1 → 9'); };
$('bBang').onclick = () => { if (COL.ph === 'idle') startCollapse(); };
syncUI();
function density() { const k = TIERS[tier].k * P.dichte; fibGeo.setDrawRange(0, Math.max(1, Math.round(FIB_MAX * k)) * NS * (SEG - 1) * 2); prtGeo.setDrawRange(0, Math.round(PRT_MAX * Math.min(1, k * 1.1)) * NS); }

// ================================================================ REC (Canvas + Ton)
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
      if (!blob.size) { $('rectime').classList.add('hide'); toast('REC: KEINE VIDEODATEN'); window.__lastRec = { size: 0, type }; return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `rekonstruiert-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
    toast('REC · NOCHMAL TIPPEN ZUM STOPPEN');
  } catch (err) { rec = null; window.__recOn = false; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});

// ================================================================ QUALITÄT + GRÖSSE
function applyTier(t) {
  tier = t; const Tt = TIERS[t]; renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl; stars.geo.setDrawRange(0, Math.round(stars.n * (.4 + .6 * Tt.k))); burstGeo.setDrawRange(0, Math.round(NBURST * (.35 + .65 * Tt.k))); formP.geo.setDrawRange(0, Math.round(NFP * (.5 + .5 * Tt.k)));
  density(); resize(); $('bQ').textContent = 'GRAFIK ' + Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; CAM.portrait = h > w * 1.05; root.rotation.z = CAM.portrait ? -Math.PI / 2 : 0;
  camera.aspect = w / h; camera.fov = CAM.portrait ? 50 : 36; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(), uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of UPT) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  bloom.resolution.set(w * pr / 2, h * pr / 2);
}
addEventListener('resize', resize);
$('bQ').onclick = () => { autoQ = false; applyTier((tier + 1) % 4); toast('GRAFIK ' + TIERS[tier].n); };
applyTier(tier);

let warm = 0, lowT = 0; const fpsWin = [];
function loop(now) {
  requestAnimationFrame(loop);
  if (manual) return;
  let dt = (now - lastNow) / 1000; lastNow = now; if (!(dt > 0)) return; dt = Math.min(dt, .066);
  frame(dt); composer.render();
  if (autoQ && started) {
    warm += dt; fpsWin.push(dt); if (fpsWin.length > 90) fpsWin.shift();
    if (warm > 4 && fpsWin.length >= 60) { const fps = fpsWin.length / fpsWin.reduce((a, b) => a + b, 0); if (fps < 40) { lowT += dt; if (lowT > 3 && tier < 3) { applyTier(tier + 1); toast('GRAFIK ' + TIERS[tier].n); lowT = 0; fpsWin.length = 0; warm = 2; } } else lowT = Math.max(0, lowT - dt); }
  }
}

// ================================================================ START
function enter(m = 'frei') {
  if (started) return; started = true; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100); document.body.classList.add('live');
  SND.unlock();
  if (m === 'aufbau') { startBuild(IS_TOUCH ? 3 : 3.5); toast('AUFBAU · 1 → 9', 3); }
  else { mode = 'frei'; toast('TIPPEN · ZIEHEN', 3); }
}
$('goA').onclick = () => enter('aufbau');
$('goF').onclick = () => enter('frei');
try { await Promise.race([document.fonts.load('600 40px NBMono'), new Promise(r => setTimeout(r, 2000))]); } catch (_) { }
if (!VIDEO) for (let i = 0; i < 60; i++) frame(1 / 60);
$('goA').disabled = $('goF').disabled = false;
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && !Q.has('nosw') && !VIDEO && !Q.has('shot')) { const regSW = () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }); if (document.readyState === 'complete') regSW(); else addEventListener('load', regSW); }

// ================================================================ VIDEO (deterministisch) + Test-Schnittstelle
const VKEYS = [[0, 1.08, -.18, .16], [4, .98, -.08, .12], [12, .92, .08, .1], [17.2, .62, .1, .14], [20.2, .42, .02, .1], [21.9, .46, 0, .1], [25, 1.0, -.06, .12], [30, .95, .12, .1]];
function vCam(t) { let i = 0; while (i < VKEYS.length - 2 && t > VKEYS[i + 1][0]) i++; const a = VKEYS[i], b = VKEYS[i + 1]; const u = ease((t - a[0]) / (b[0] - a[0])); return { z: lerp(a[1], b[1], u), yaw: lerp(a[2], b[2], u), pit: lerp(a[3], b[3], u) - CAM.pit }; }
function videoStart() { manual = true; started = true; $('start').classList.add('hide'); document.body.classList.add('live', 'video'); T = 0; frameN = 0; startBuild(1.6); CAM.vk = vCam(0); }
function videoFrame(dt = 1 / 30) { CAM.vk = vCam(T + dt); frame(dt); vFrame++; }
function wavB64(buf) {
  const n = buf.length, ch = buf.numberOfChannels, sr = buf.sampleRate, ab = new ArrayBuffer(44 + n * ch * 2), v = new DataView(ab); const ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); v.setUint32(4, 36 + n * ch * 2, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * ch * 2, true);
  const d = []; for (let c = 0; c < ch; c++) d.push(buf.getChannelData(c)); let o = 44; for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { v.setInt16(o, clamp(d[c][i], -1, 1) * 32767, true); o += 2; }
  const u8 = new Uint8Array(ab); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s);
}
async function videoPrep(dur = 30, fps = 30) {
  SND.startLog(); videoStart(); const N = Math.round(dur * fps);
  for (let i = 0; i < N; i++) videoFrame(1 / fps);
  const L = SND.log, sr = 48000; const off = new OfflineAudioContext(2, Math.ceil(sr * (dur + .2)), sr); const G = buildAudio(off, true);
  for (const [t, type, a] of L.ev) try { aPlay(G, t + .02, type, a); } catch (e) { }
  for (const [t, f, g] of L.v) aVoices(G, t, f, g);
  const buf = await off.startRendering();
  // Spektrum je Bild wie ein AnalyserNode (Blackman, Glättung .75, -100..-30 dB)
  const L0 = buf.getChannelData(0), L1 = buf.getChannelData(1), mag = new Float32Array(FFTN / 2), by = new Uint8Array(FFTN / 2), re = new Float32Array(FFTN), im = new Float32Array(FFTN); const out = [];
  const win = new Float32Array(FFTN); for (let i = 0; i < FFTN; i++) { const x = i / FFTN; win[i] = .42 - .5 * Math.cos(TAU * x) + .08 * Math.cos(2 * TAU * x); }
  for (let fI = 0; fI < N; fI++) {
    const end = Math.floor(((fI + 1) / fps) * sr); for (let i = 0; i < FFTN; i++) { const j = end - FFTN + i; const x = j >= 0 ? (L0[j] + L1[j]) * .5 : 0; re[i] = x * win[i]; im[i] = 0; }
    fftMag(re, im); for (let k = 0; k < FFTN / 2; k++) { const m = Math.hypot(re[k], im[k]) / FFTN; mag[k] = .75 * mag[k] + .25 * m; const db = 20 * Math.log10(mag[k] + 1e-12); by[k] = clamp(Math.round((db + 100) / 70 * 255), 0, 255); }
    specFromBytes(by, sr); const w = new Array(256); for (let i = 0; i < 256; i++) { const j = end - 1024 + i * 4; w[i] = +(clamp((j >= 0 ? (L0[j] + L1[j]) * .5 : 0) * 5, -1, 1)).toFixed(3); }
    out.push({ s: Array.from(SPEC, v => +v.toFixed(3)), w });
  }
  return { wav: wavB64(buf), spec: out, events: L.ev.length, bangs: nBang, flashes: nFlash };
}
window.__RK = {
  ready: true,
  get state() { let nArr = 0; for (const S of STR) if (S.on && S.front >= 1) nArr++; return { T, mode, nArr, order, E, col: COL.ph, cv: COL.cv, nArrive, nFlash, nBang, tier: TIERS[tier].n, P: { ...P }, on: STR.map(S => S.on), front: STR.map(S => +S.front.toFixed(2)), pk: STR.map(S => S.pk.length), build: BUILD.on, flash, audio: SND.ctx ? SND.ctx.state : 'none', spec: SPEC.reduce((a, b) => a + b, 0) }; },
  setManual(v) { manual = v; }, step(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) frame(dt); composer.render(); },
  enter, build: startBuild, set(k, v) { P[k] = v; syncUI(); if (k === 'dichte') density(); }, stream: setStream, surge, collapse: startCollapse, core: corePulse, tap: tapAt,
  cam(z, yaw = 0, pit = 0) { CAM.zT = CAM.zoom = z; CAM.uy = yaw; CAM.up = pit; CAM.lastIn = T + 1e6; }, tier(t) { autoQ = false; applyTier(t); },
  videoStart, videoFrame, videoPrep, setSpec(a) { VSPEC = a; vFrame = 0; }, render: () => composer.render(),
  dbg: () => ({ draw: renderer.info.render.calls, pts: renderer.info.render.points, lines: renderer.info.render.lines })
};
