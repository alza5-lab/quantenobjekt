
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
