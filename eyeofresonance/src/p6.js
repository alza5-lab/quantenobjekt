
// ---------------------------------------------------------------- quality + resize
let uH = 800;
function applyTier(t) {
  tier = t; const Tt = TIERS[t];
  renderer.setPixelRatio(Tt.pr); composer.setPixelRatio(Tt.pr);
  if (isGL2) { composer.renderTarget1.samples = Tt.s; composer.renderTarget2.samples = Tt.s; composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); }
  bloom.strength = Tt.bl; noise.g.setDrawRange(0, noiseCount());
  resize();
  document.querySelectorAll('#qual button').forEach(b => b.classList.toggle('on', +b.dataset.q === t)); $('mQ').textContent = Tt.n;
}
function resize() {
  const w = innerWidth, h = innerHeight; camera.aspect = w / h; camera.fov = w < h ? 54 : 42; camera.updateProjectionMatrix();
  renderer.setSize(w, h, false); composer.setSize(w, h);
  const pr = renderer.getPixelRatio(); uH = h / (2 * Math.tan(camera.fov * Math.PI / 360));
  for (const m of [pulseMat, noise.m]) { m.uniforms.uH.value = uH; m.uniforms.uPR.value = pr; }
  stars.uniforms.uPR.value = pr;
  if (!SEL && mode === 'orbit') goTo(overview(), !started);
}
addEventListener('resize', () => { resize(); drawerOpen(!(innerWidth < 760 || innerHeight < 500) || !$('drawer').classList.contains('hide')); });
document.querySelectorAll('#qual button').forEach(b => b.onclick = () => { autoQ = false; applyTier(+b.dataset.q); toast('GRAFIK: ' + TIERS[tier].n); });

// ---------------------------------------------------------------- frame
let started = false, manual = false, lastNow = performance.now(), frameN = 0, xiT = 0, xiA = 0, xiB = 0;
const fpsWin = []; let lowT = 0, warm = 0;
const tmpV = new V3();
function frame(dt) {
  T += dt; const t = T;
  // preset morph
  if (presetAnim) { presetAnim.t = Math.min(1, presetAnim.t + dt / 1.2); const e = presetAnim.t * presetAnim.t * (3 - 2 * presetAnim.t); for (const k in P) P[k] = lerp(presetAnim.from[k], presetAnim.to[k], e); layoutAll(); SND.param(); if (presetAnim.t >= 1) { presetAnim = null; saveS(); } }
  // ε · ξ(t): smooth random walk in [-1, 1]
  xiT -= dt; if (xiT <= 0) { xiA = xiB; xiB = Math.random() * 2 - 1; xiT = .35; } M.xi = lerp(xiA, xiB, 1 - xiT / .35) + (Math.random() - .5) * .15 * P.eps;
  compute();
  const E = M.energy, hk = 1 - Math.exp(-dt * 6);
  for (const k in TERMS) { const tg = (SEL === k ? 1 : 0) + (hoverK === k ? .45 : 0); TERMS[k].h = lerp(TERMS[k].h, Math.min(1, tg), hk); }
  const H = k => TERMS[k].h;
  // Ψ core
  const beat = Math.pow(.5 + .5 * Math.sin(t * (1.2 + E * 2.2) * Math.PI), 6);
  core.scale.setScalar((.85 + .15 * P.S) * (1 + beat * .03 * (.4 + E) + H('psi') * .08));
  coreEdges.rotation.y = coreGlass.rotation.y = t * .12; coreEdges.rotation.x = coreGlass.rotation.x = Math.sin(t * .2) * .2;
  coreMatrix.rotation.y = -t * .25; coreMatrix.rotation.z = t * .11; coreNodes.rotation.copy(coreMatrix.rotation);
  const ck = .5 + E * .8 + beat * .2 + H('psi') * .45;
  coreEdgeMat.color.copy(C.cy).multiplyScalar(.9 * ck); coreMatrixMat.opacity = .35 + .4 * E; coreNodeMat.opacity = .5 + .4 * E;
  coreHeart.material.color.setRGB(1.2 * ck, 1.9 * ck, 2.1 * ck); coreHalo.material.opacity = .1 + .14 * E + .1 * H('psi'); coreHalo.scale.setScalar(1.6 + E * 1.1);
  coreLight.intensity = 1.2 + E * 3.5 + beat;
  for (let b = 0; b < BOLTS; b++) { boltT[b] -= dt * (1 + E * 2); if (boltT[b] <= 0) regenBolt(b); } boltGeo.attributes.position.needsUpdate = true;
  boltMat.opacity = clamp(.25 + E * .9 + (Math.random() < .1 ? .4 : 0), 0, 1); boltGeo.setDrawRange(0, Math.round(BOLTS * (.3 + .7 * Math.min(1, E * 1.6))) * BSEG * 2);
  if (labels.psi) labels.psi.material.opacity = .85 + .15 * Math.sin(t * 1.5) + H('psi') * .3;
  // S³ cube
  cubeEdgeMat.color.setRGB(.6, .85, .95).multiplyScalar(.7 + H('S') * 1.1 + .1 * Math.sin(t * 2)); cornerMat.color.setRGB(.75, 1.1, 1.2).multiplyScalar(.8 + H('S') * 1 + beat * .2);
  for (const c of corners) c.scale.setScalar((1 + H('S') * .5) * Math.min(1, cam.d / 7) / Math.max(.6, P.S));
  // F² planes
  planeMat.uniforms.uT.value = planeMat2.uniforms.uT.value = t; planeMat.uniforms.uK.value = planeMat2.uniforms.uK.value = .8 + H('F') * 1.3 + E * .3;
  // A plate
  plateRimMat.opacity = .35 + .45 / Math.sqrt(P.A) + H('A') * .8; plateMat.emissive.setRGB(0, .05, .07).multiplyScalar(H('A') * 3); if (labels.Aglow) labels.Aglow.material.opacity = H('A') * .9;
  plateRings.rotation.z = t * .05;
  fieldMat.uniforms.uT.value = t; fieldMat.uniforms.uSp.value = .3 + Math.min(3, M.N) * .5; fieldMat.uniforms.uK.value = (.25 + .45 * Math.min(1, M.N / 6)) * (1 + H('A') * 1.5);
  // → vector + pulses
  if (started) arrowGrow = Math.min(1, arrowGrow + dt * .7); layoutArrow(t);
  beamMat.color.setRGB(.9, 2.2, 2.5).multiplyScalar(.5 + .5 * Math.min(1, M.N / 4) + H('arrow') * 1.2); metal.emissive.copy(C.cy); metal.emissiveIntensity = H('arrow') * .25; headMat.emissiveIntensity = .35 + H('arrow') * .6;
  if (arrowGrow > .9) { pulseAcc += dt * M.rate; while (pulseAcc >= 1) { pulseAcc -= 1; spawnPulse(false); } }
  for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i]; p.u += dt * p.sp * (1 + Math.min(1.5, M.N * .08)); if (p.u >= 1) { p.r.flash = Math.min(1.6, p.r.flash + p.en * .8); SND.arrive(p.r); pulses.splice(i, 1); } }
  for (let i = 0; i < PMAX; i++) { if (i < pulses.length) { const p = pulses[i]; p.c.getPointAt(Math.min(1, p.u), tmpV); pulsePos.set([tmpV.x, tmpV.y, tmpV.z], i * 3); pulseA[i] = p.en * (p.u < .06 ? p.u / .06 : 1); } else pulseA[i] = 0; }
  pulseGeo.attributes.position.needsUpdate = true; pulseGeo.attributes.a.needsUpdate = true;
  // Σ(T · R) rings
  for (const r of RING) {
    const w = 1.2 * r.Ti * r.Ri; r.rot += dt * w; r.outer.rotation.y = r.rot + r.ph; r.mid.rotation.x = r.rot * 1.3 + r.ph; r.inner.rotation.z = r.rot * 1.7;
    const rev = Math.floor((r.rot + r.ph) / TAU); if (rev !== r.rev) { if (r.rev !== 0 && w > .05) SND.chime(r); r.rev = rev; }
    r.flash *= Math.exp(-dt * 2.2); const fk = r.flash + H('TR') * .5;
    r.hubM.color.setRGB(.9, 1.5, 1.7).multiplyScalar(.35 + fk * .9 + .25 * Math.min(1, r.Ti * r.Ri)); r.halo.material.opacity = Math.min(.5, r.flash * .28 + H('TR') * .12);
  }
  ringMetal.emissiveIntensity = H('TR') * .22; goldMat.emissiveIntensity = .2 + .35 * Math.min(1, P.T) + H('TR') * .6;
  archMetal.emissiveIntensity = H('sigma') * .22 + .03 * E; threadMat.uniforms.uT.value = t; threadMat.uniforms.uSp.value = .2 + M.Sig * .05; threadMat.uniforms.uK.value = (.25 + .35 * Math.min(1, M.Sig / 12)) * (1 + H('sigma') * 1.6 + H('TR') * .8);
  if (labels.sigma) labels.sigma.material.opacity = .75 + .25 * Math.min(1, M.Sig / 9) + H('sigma') * .3;
  // ε noise
  noise.m.uniforms.uT.value = t; noise.m.uniforms.uK.value = .7 + .5 * P.eps + H('eps') * 1.2;
  if (labels.eps) { labels.eps.material.opacity = .8 + H('eps') * .3; labels.eps.position.x = L.epsC.x + .05 + P.eps * .06 * Math.sin(t * 13); }
  stars.uniforms.uT.value = t;
  SND.update(dt); if ((frameN & 15) === 0) SND.params();
  updateCamera(dt);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) { $('toast').style.opacity = 0; setTimeout(() => toastT <= 0 && $('toast').classList.add('hide'), 500); } }
  if ((frameN++ & 5) === 0) { hudLive(); if (rec) { const s = (performance.now() - recStart) / 1000 | 0; $('rectime').textContent = `● REC ${pad2(s / 60 | 0)}:${pad2(s % 60)}`; } }
}
function render() { composer.render(); }
function loop(now) {
  requestAnimationFrame(loop);
  if (manual) return;
  let dt = (now - lastNow) / 1000; lastNow = now; if (!(dt > 0)) return; dt = Math.min(dt, .066);
  frame(dt); render();
  if (autoQ && started) {
    warm += dt; fpsWin.push(dt); if (fpsWin.length > 90) fpsWin.shift();
    if (warm > 4 && fpsWin.length >= 60) { const fps = fpsWin.length / fpsWin.reduce((a, b) => a + b, 0); if (fps < 40) { lowT += dt; if (lowT > 3 && tier < 3) { applyTier(tier + 1); toast('GRAFIK: ' + TIERS[tier].n); lowT = 0; fpsWin.length = 0; warm = 2; } } else lowT = Math.max(0, lowT - dt); }
  }
}

// ---------------------------------------------------------------- start
function enter() {
  if (started) return; started = true; $('start').classList.add('out'); setTimeout(() => $('start').classList.add('hide'), 1100);
  if (ST.snd) SND.unlock(); idle = 0; toast('Ψ = S³ · F² / A → Σ(T · R) + ε');
  setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => spawnPulse(true), i * 160); }, 1500);
}
$('go').onclick = enter;
await makeLabels();
applyTier(tier); layoutAll(); goTo(overview(), true);
requestAnimationFrame(loop);
frame(.016); render();
$('go').disabled = false; $('go').textContent = 'SYSTEM STARTEN';
if (Q.has('go')) enter();
if ('serviceWorker' in navigator && !Q.has('nosw')) addEventListener('load', () => navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { }));
if (document.readyState === 'complete' && 'serviceWorker' in navigator && !Q.has('nosw')) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => { });

// ---------------------------------------------------------------- test hooks
window.__EOR = {
  ready: true,
  setManual(v) { manual = v; lastNow = performance.now(); },
  step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); render(); },
  state() { return { tier: TIERS[tier].n, mode, sel: SEL, P: { ...P }, M: { ...M }, pulses: pulses.length, noise: noiseCount(), cam: camera.position.toArray().map(v => +v.toFixed(2)), d: +cam.d.toFixed(2) }; },
  set(k, v) { setP(k, v); }, preset(i) { $('presets').children[i].click(); }, select(k, f = true) { select(k, f); }, focus: focusTerm, overview() { select(null); goTo(overview(), true); }, setMode, enter, spawnPulse,
  setTier(t) { autoQ = false; applyTier(t); }, pick: pickAt,
  audio() { const c = SND.ctx; return { state: c ? c.state : 'none', nodes: SND.stats.nodes, ev: SND.stats.ev, recAudio: window.__recAudio || 0 }; },
  project(x, y, z) { const v = new V3(x, y, z).project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight, v.z]; },
  snap() { cam.th = goal.th; cam.ph = goal.ph; cam.d = goal.d; cam.t.copy(goal.t); updateCamera(0); render(); }
};
