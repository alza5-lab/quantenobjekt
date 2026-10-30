
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
