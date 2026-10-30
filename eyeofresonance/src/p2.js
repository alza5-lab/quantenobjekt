
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
