
// ---------------------------------------------------------------- layout from parameters
let lastSA = '';
function layoutAll() {
  compute();
  cubeG.scale.setScalar(P.S);
  const r = plateR(), y = plateY(); plate.scale.set(r, .15, r); plateG.position.y = y; plate.position.y = 0; plateRim.scale.setScalar(r * 1.002); plateRim.position.y = .076; plateRings.scale.setScalar(r * .98); plateRings.position.y = .077;
  if (labels.A) { labels.A.position.set(0, .078, r * .7); labels.A.scale.setScalar(.8 + .25 * Math.sqrt(P.A)); labels.Aglow.position.set(0, .3, r * .7); }
  const key = P.S.toFixed(3) + '|' + P.A.toFixed(3); if (key !== lastSA) { lastSA = key; buildField(); buildCurves(); }
  layoutRings(); layoutArrow(T);
  noise.g.setDrawRange(0, noiseCount()); noise.m.uniforms.uE.value = P.eps;
  planeMat.uniforms.uF.value = planeMat2.uniforms.uF.value = P.F;
  planeMat.uniforms.uAmp.value = planeMat2.uniforms.uAmp.value = .07 + .05 * Math.min(P.F, 2.5);
  hudSliders();
}

// ---------------------------------------------------------------- picking
const pickList = [];
const pickMat = new THREE.MeshBasicMaterial({ visible: false });
function addPick(term, geo, parent, pos, kind) { const m = new THREE.Mesh(geo, pickMat); if (pos) m.position.copy(pos); m.userData = { term, kind }; parent.add(m); pickList.push(m); return m; }
addPick('psi', new THREE.SphereGeometry(.68, 16, 12), core);
addPick('psi', new THREE.PlaneGeometry(1.6, .9), scene, L.psiLabel);
addPick('S', new THREE.BoxGeometry(2.04, 2.04, 2.04), cubeG, null, 'cube');
addPick('F', new THREE.BoxGeometry(2, 2, .3), cubeG); addPick('F', new THREE.BoxGeometry(.3, 2, 2), cubeG);
addPick('A', new THREE.CylinderGeometry(1, 1, 1.4, 32), plate);
{ const m = addPick('arrow', new THREE.BoxGeometry(1, .5, .6), scene); m.position.set((L.arrowX0 + L.arrowX1) / 2, L.arrowY, 0); m.scale.x = L.arrowX1 - L.arrowX0; }
for (const r of RING) addPick('TR', new THREE.SphereGeometry(.42, 12, 10), r.g);
addPick('sigma', new THREE.CylinderGeometry(L.archR + .15, L.archR + .15, L.archD * 2 + .3, 32, 1, false, -Math.PI / 2, Math.PI), sumG, null, 'arch'); { const a = pickList[pickList.length - 1]; a.rotation.x = -Math.PI / 2; a.material = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }); }
addPick('sigma', new THREE.SphereGeometry(.5, 12, 8), sumG, new V3(0, L.archR + .55, 0));
addPick('eps', new THREE.SphereGeometry(1.25, 16, 12), scene, L.epsC);
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pickAt(x, y) {
  ndc.set(x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(pickList, false); if (!hits.length) return null;
  const solid = hits.filter(h => !h.object.userData.kind);
  const cube = hits.find(h => h.object.userData.kind === 'cube');
  if (window.__dbgPick) console.log('PICKDBG', JSON.stringify(hits.map(h => [h.object.userData.term, h.object.userData.kind || '', +h.distance.toFixed(2)])));
  if (cube) { const p = cubeG.worldToLocal(cube.point.clone()); const n = [p.x, p.y, p.z].filter(c => Math.abs(c) > .8).length; if (n >= 2 && (!solid.length || cube.distance <= solid[0].distance + .01)) return 'S'; }
  if (solid.some(h => h.object.userData.term === 'psi') && !solid.some(h => h.object.userData.term === 'TR')) return 'psi';
  if (solid.length) return solid[0].object.userData.term;
  return hits[0].object.userData.term;
}

// ---------------------------------------------------------------- camera: orbit with tween, tour
const cam = { th: 0, ph: .12, d: 14, t: new V3(3.6, .1, 0) }, goal = { th: 0, ph: .12, d: 14, t: new V3(3.6, .1, 0) };
const FOCUS = {
  psi: { t: [0, -.1, 0], d: 5.0, th: .38, ph: .14 }, S: { t: [0, 0, 0], d: 5.4, th: -.55, ph: .38 }, F: { t: [0, 0, 0], d: 4.4, th: .8, ph: .22 },
  A: { t: [0, -1.1, 0], d: 5.6, th: .18, ph: .55 }, arrow: { t: [2.1, -.3, 0], d: 4.6, th: .28, ph: .25 }, sigma: { t: [6.05, .1, 0], d: 7.8, th: -.18, ph: .22 },
  TR: { t: [6.05, -.1, 0], d: 4.9, th: .3, ph: .06 }, eps: { t: [8.9, .1, 0], d: 5.8, th: .45, ph: .14 }
};
const KEYPTS = [[-3.4, .55, 0], [-3.4, -.5, 0], [-1.6, -1.55, 1.6], [1.6, -1.55, -1.6], [1.2, 1.2, 1.2], [-1.2, 1.2, -1.2], [3.2, 1.5, 0], [6.05, 2.05, 0], [3.1, -1.4, .9], [8.95, -1.4, -.9], [11.2, .6, 0], [11.2, -.3, 1], [8.9, -1.4, .9]].map(a => new V3(...a));
const tmpCam = new THREE.PerspectiveCamera();
function overview() {
  const asp = innerWidth / innerHeight, portrait = asp < .9;
  const th = portrait ? 1.08 : .0, ph = portrait ? .3 : .13; let t = portrait ? new V3(4.4, -.1, 0) : new V3(3.9, .05, 0);
  const ylo = portrait ? -.6 : -.62, yhi = portrait ? .56 : .62, xm = portrait ? .97 : .92;
  const dr = $('drawer'), dOpen = !portrait && !dr.classList.contains('hide') && innerHeight >= 500; const xl = dOpen ? -1 + 2 * (dr.getBoundingClientRect().right + 10) / innerWidth : -xm;
  tmpCam.copy(camera); tmpCam.aspect = asp; tmpCam.updateProjectionMatrix();
  const fits = (d, tt) => { placeCam(tmpCam, th, ph, d, tt); tmpCam.updateMatrixWorld(); for (const p of KEYPTS) { const v = p.clone().project(tmpCam); if (v.z > 1 || v.x > xm || v.x < xl || v.y < ylo || v.y > yhi) return false; } return true; };
  let d = 20;
  for (let pass = 0; pass < 4; pass++) {
    let lo = 3, hi = 80; for (let it = 0; it < 22; it++) { const m = (lo + hi) / 2; if (fits(m, t)) hi = m; else lo = m; } d = hi;
    placeCam(tmpCam, th, ph, d, t); tmpCam.updateMatrixWorld(); let mn = 9, mx = -9, yn = 9, yx = -9; for (const p of KEYPTS) { const v = p.clone().project(tmpCam); mn = Math.min(mn, v.x); mx = Math.max(mx, v.x); yn = Math.min(yn, v.y); yx = Math.max(yx, v.y); }
    const hw = Math.tan(tmpCam.fov * Math.PI / 360) * d, sx = ((mn + mx) / 2 - (xl + xm) / 2) * hw * asp, sy = ((yn + yx) / 2 - (ylo + yhi) / 2) * hw;
    const right = new V3().setFromMatrixColumn(tmpCam.matrixWorld, 0), up = new V3().setFromMatrixColumn(tmpCam.matrixWorld, 1);
    t = t.clone().addScaledVector(right, sx).addScaledVector(up, sy);
  }
  return { th, ph, d: d * 1.02, t };
}
function placeCam(c, th, ph, d, t) { c.position.set(t.x + Math.sin(th) * Math.cos(ph) * d, t.y + Math.sin(ph) * d, t.z + Math.cos(th) * Math.cos(ph) * d); c.lookAt(t); }
function goTo(v, instant) { goal.th = v.th; goal.ph = v.ph; goal.d = v.d; goal.t.copy(v.t); if (instant) { cam.th = v.th; cam.ph = v.ph; cam.d = v.d; cam.t.copy(v.t); } }
function focusTerm(k) {
  const f = FOCUS[k]; const asp = innerWidth / innerHeight, d = f.d * (asp < 1 ? 1 / Math.sqrt(Math.max(.4, asp)) : 1), t = new V3(...f.t);
  const dr = $('drawer'); if (asp < .9 && !dr.classList.contains('hide')) t.y -= d * .3; // portrait: keep the object above the open slider panel
  else if (asp >= .9 && !dr.classList.contains('hide') && innerHeight >= 500) { t.x -= d * .18 * Math.cos(f.th); t.z += d * .18 * Math.sin(f.th); }
  goTo({ th: f.th, ph: f.ph, d, t });
}
let mode = 'orbit', idle = 0, tourI = -1, tourT = 0;
const TOUR = ['psi', 'S', 'F', 'A', 'arrow', 'TR', 'sigma', 'eps', null];
function updateCamera(dt) {
  idle += dt;
  if (mode === 'tour') { tourT -= dt; if (tourT <= 0) { tourI = (tourI + 1) % TOUR.length; const k = TOUR[tourI]; if (k) { select(k, false); focusTerm(k); } else { select(null); goTo(overview()); } tourT = k ? 5.5 : 7; } goal.th += dt * .025; }
  const k = 1 - Math.exp(-dt * 2.4);
  cam.th = lerp(cam.th, goal.th, k); cam.ph = lerp(cam.ph, goal.ph, k); cam.d = lerp(cam.d, goal.d, k); cam.t.lerp(goal.t, k);
  let th = cam.th; if (mode === 'orbit' && idle > 6 && !SEL) th += Math.sin((idle - 6) * .18) * .14 * Math.min(1, (idle - 6) / 4);
  placeCam(camera, th, cam.ph, cam.d, cam.t);
}
// pointer input
const ptrs = new Map(); let pinch0 = 0, d0 = 0, down = null;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); idle = 0; if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); d0 = goal.d; if (down) down.moved = 99; } });
canvas.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) { if (!IS_TOUCH) hover(e.clientX, e.clientY); return; }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; idle = 0;
  if (ptrs.size === 1) { if (down) down.moved += Math.abs(dx) + Math.abs(dy); if (!down || down.moved > 6) { if (mode === 'tour') setMode('orbit'); goal.th -= dx * .006; goal.ph = clamp(goal.ph + dy * .005, -.35, 1.25); cam.th = lerp(cam.th, goal.th, .5); } }
  else if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const dd = Math.hypot(a.x - b.x, a.y - b.y); if (pinch0 > 0) goal.d = clamp(d0 * pinch0 / dd, 2.2, 70); }
});
const endPtr = e => { ptrs.delete(e.pointerId); if (down && ptrs.size === 0) { if (down.moved < 8 && performance.now() - down.t < 450) tap(e.clientX, e.clientY); down = null; } if (ptrs.size < 2) pinch0 = 0; };
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('wheel', e => { e.preventDefault(); idle = 0; goal.d = clamp(goal.d * Math.exp(e.deltaY * .0012), 2.2, 70); }, { passive: false });
function tap(x, y) { const k = pickAt(x, y); if (mode === 'tour') setMode('orbit'); if (k) { select(k, true); SND.term(k); if (k === 'arrow') { for (let i = 0; i < 4; i++) setTimeout(() => spawnPulse(true), i * 120); } } else select(null); }
function hover(x, y) { const k = pickAt(x, y); const tip = $('tip'); canvas.style.cursor = k ? 'pointer' : 'grab'; if (k) { tip.innerHTML = TERMS[k].n; tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.remove('hide'); } else tip.classList.add('hide'); hoverK = k; }
let hoverK = null;

// ---------------------------------------------------------------- selection + HUD
function select(k, focus) {
  SEL = k; document.querySelectorAll('#formula .t').forEach(s => s.classList.toggle('on', s.dataset.term === k));
  document.querySelectorAll('#drawer label').forEach(l => l.classList.toggle('on', !!k && (l.dataset.k === k || (k === 'TR' && (l.dataset.k === 'T' || l.dataset.k === 'R')))));
  if (!k) { $('info').classList.add('hide'); return; }
  const t = TERMS[k]; $('iK').innerHTML = t.k; $('iT').innerHTML = t.n; $('iF').innerHTML = t.f; $('iM').innerHTML = t.m; $('info').classList.toggle('gold', !!t.gold); $('info').classList.remove('hide');
  if (focus) focusTerm(k);
}
$('infoX').onclick = () => select(null);
document.querySelectorAll('#formula .t').forEach(s => s.addEventListener('click', e => { e.stopPropagation(); const k = s.dataset.term; if (mode === 'tour') setMode('orbit'); if (SEL === k) { select(null); goTo(overview()); } else { select(k, true); SND.term(k); } }));
const f3 = v => v >= 100 ? v.toFixed(1) : v >= 10 ? v.toFixed(2) : v.toFixed(3);
function hudSliders() { for (const k in P) { const s = $('s_' + k); if (s && document.activeElement !== s) s.value = P[k]; $('v_' + k).textContent = P[k].toFixed(2); } $('s_vol').value = ST.vol; $('v_vol').textContent = Math.round(ST.vol * 100) + '%'; }
function hudLive() {
  $('vS3').textContent = f3(M.S3); $('vF2').textContent = f3(M.F2); $('vA').textContent = f3(P.A); $('vN').textContent = f3(M.N); $('vP').textContent = M.rate.toFixed(2);
  $('vSig').textContent = f3(M.Sig); $('vE').textContent = (P.eps * M.xi >= 0 ? '+' : '') + (P.eps * M.xi).toFixed(3); $('vPsi').textContent = f3(Math.abs(M.psi)) .replace(/^/, M.psi < 0 ? '−' : '');
  let st = 'Ψ // RESONANZ STABIL', hot = false;
  if (M.Sig < .4) st = 'Σ RUHT // OHNE TANGENTE KEINE RESONANZ, Ψ IST NUR NOCH RAUSCHEN';
  else if (P.eps > .8) st = 'ε DOMINIERT // DIE UNSCHÄRFE ÜBERLAGERT DAS FELD';
  else if (M.N > 12) { st = 'ZÄHLER ÜBERLÄDT DEN KERN // Ψ STEIGT'; hot = true; }
  else if (M.N < .25) st = 'A SCHIRMT AB // DAS FELD WIRD NORMIERT';
  else if (M.energy > .55) { st = 'Ψ // HOHE RESONANZ'; hot = true; }
  const el = $('status'); if (el.textContent !== st) el.textContent = st; el.classList.toggle('hot', hot);
}
let presetAnim = null;
function setP(k, v) { P[k] = clamp(v, PR[k][0], PR[k][1]); layoutAll(); saveS(); SND.param(k); }
for (const k in P) { const s = $('s_' + k); s.addEventListener('input', () => { presetAnim = null; setP(k, +s.value); idle = 0; }); s.addEventListener('pointerdown', () => { const t = k === 'T' || k === 'R' ? 'TR' : k; if (SEL !== t) select(t, false); }); }
$('s_vol').addEventListener('input', () => { ST.vol = +$('s_vol').value; $('v_vol').textContent = Math.round(ST.vol * 100) + '%'; SND.vol(); saveS(); });
PRESETS.forEach((p, i) => { const b = document.createElement('button'); b.textContent = p.n; b.onclick = () => { presetAnim = { from: { ...P }, to: p.v, t: 0 }; document.querySelectorAll('#presets button').forEach((x, j) => x.classList.toggle('on', j === i)); toast(p.n); SND.term('psi'); }; $('presets').appendChild(b); });
function setMode(m) { mode = m; document.querySelectorAll('#modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m)); if (m === 'tour') { tourI = -1; tourT = 0; } else { tourT = 0; } }
document.querySelectorAll('#modes button').forEach(b => b.onclick = () => { setMode(b.dataset.mode); if (b.dataset.mode === 'orbit') { select(null); goTo(overview()); } });
$('bReset').onclick = () => { setMode('orbit'); select(null); goTo(overview()); idle = 0; };
$('bPulse').onclick = () => { for (let i = 0; i < 9; i++) setTimeout(() => spawnPulse(true), i * 90); SND.term('arrow'); };
const drawerOpen = v => { $('drawer').classList.toggle('hide', !v); $('bDrawer').classList.toggle('on', v); };
$('bDrawer').onclick = () => { drawerOpen($('drawer').classList.contains('hide')); if (!SEL && mode === 'orbit') goTo(overview()); else if (SEL) focusTerm(SEL); };
drawerOpen(!(innerWidth < 760 || innerHeight < 500));
let toastT = 0; function toast(t) { const el = $('toast'); el.textContent = t; el.classList.remove('hide'); el.style.opacity = 1; toastT = 2.2; }
addEventListener('keydown', e => { if (e.target.tagName === 'INPUT') return; if (e.code === 'Space') { $('bPulse').click(); e.preventDefault(); } if (e.code === 'KeyR') $('bReset').click(); if (e.code === 'Escape') select(null); });
