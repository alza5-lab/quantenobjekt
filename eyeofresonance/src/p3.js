
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
