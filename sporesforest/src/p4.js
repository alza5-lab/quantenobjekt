
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
