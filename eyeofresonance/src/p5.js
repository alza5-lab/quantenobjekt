
// ---------------------------------------------------------------- SOUND: generative Web Audio, every term has its voice
const SND = (() => {
  let ctx = null, master, lim, comp, filtA, rev, wet, recDest = null, coreG, coreO = [], fG, fO1, fO2, fTrem, fTremG, subG, subO, epsG, epsBP, built = false;
  const st = { nodes: 0, ev: {} }; const ev = k => { st.ev[k] = (st.ev[k] || 0) + 1; };
  const n = x => { st.nodes++; return x; };
  const osc = (type, f) => { const o = n(ctx.createOscillator()); o.type = type; o.frequency.value = f; return o; };
  const gain = v => { const g = n(ctx.createGain()); g.gain.value = v; return g; };
  const filt = (type, f, q = .7) => { const b = n(ctx.createBiquadFilter()); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84].map(m => 440 * Math.pow(2, (m - 69) / 12));
  let noiseBuf;
  function impulse(sec, decay) { const len = ctx.sampleRate * sec | 0, b = ctx.createBuffer(2, len, ctx.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += (Math.random() * 2 - 1 - lp) * (.25 + .75 * (1 - t)); d[i] = lp * Math.pow(1 - t, decay); } } return b; }
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { ctx = new AC(); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate); { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    master = gain(0); comp = n(ctx.createDynamicsCompressor()); comp.threshold.value = -20; comp.ratio.value = 3.5; comp.attack.value = .01; comp.release.value = .3;
    lim = n(ctx.createDynamicsCompressor()); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
    // A = the denominator: a lowpass that normalizes the whole field
    filtA = filt('lowpass', 4000, .5);
    filtA.connect(comp); comp.connect(lim); const trim = gain(.85); lim.connect(trim); trim.connect(master); master.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) { recDest = ctx.createMediaStreamDestination(); master.connect(recDest); }
    rev = n(ctx.createConvolver()); rev.buffer = impulse(4.5, 2.2); wet = gain(.5); rev.connect(wet); wet.connect(filtA);
    // Ψ core drone: root, fifth, octave with slow breathing
    coreG = gain(0); coreG.connect(filtA); const cw = gain(.4); coreG.connect(cw); cw.connect(rev);
    [[1, .5, .05], [1.5, .22, .071], [2, .18, .043], [1.003, .3, .062]].forEach(([r, a, lf]) => { const o = osc('sine', 55 * r), g = gain(a), l = osc('sine', lf), lg = gain(a * .4); l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(coreG); o.start(); l.start(); coreO.push([o, r]); });
    // S³ sub body
    subG = gain(0); subO = osc('triangle', 55); const sl = filt('lowpass', 240); subO.connect(sl); sl.connect(subG); subG.connect(filtA); subO.start();
    // F² vibrating planes: two detuned voices, tremolo at the plane frequency
    fG = gain(0); fTremG = gain(.5); fTrem = osc('sine', 4); const tg = gain(.5); fTrem.connect(tg); tg.connect(fTremG.gain);
    fO1 = osc('triangle', 220); fO2 = osc('sine', 221.5); const fl = filt('bandpass', 800, .6); fO1.connect(fl); fO2.connect(fl); fl.connect(fTremG); fTremG.connect(fG); fG.connect(filtA); const fw = gain(.5); fG.connect(fw); fw.connect(rev);
    fO1.start(); fO2.start(); fTrem.start();
    // ε: airy noise
    epsG = gain(0); const ns = n(ctx.createBufferSource()); ns.buffer = noiseBuf; ns.loop = true; epsBP = filt('bandpass', 3200, .9); ns.connect(epsBP); epsBP.connect(epsG); epsG.connect(filtA); const ew = gain(.6); epsG.connect(ew); ew.connect(rev); ns.start();
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => { }); else if (ST.snd || window.__recOn) ctx.resume().catch(() => { }); });
    const kick = () => { if (ctx && (ST.snd || window.__recOn) && ctx.state !== 'running') ctx.resume().catch(() => { }); };
    addEventListener('pointerdown', kick, true); addEventListener('touchend', kick, true); addEventListener('keydown', kick, true);
    built = true; params(true); return true;
  }
  function unlock() {
    if (!ctx && !build()) return; try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
    if (ctx.state !== 'running') ctx.resume().catch(() => { });
    vol(); 
  }
  const now = () => ctx.currentTime;
  function vol() { if (!ctx) return; const v = (ST.snd || window.__recOn) ? ST.vol * (ST.snd ? 1 : .0001) : 0; master.gain.setTargetAtTime(v, now(), .15); }
  function params(instant) {
    if (!built) return; const tc = instant ? .01 : .25, t = now();
    const root = 55 * Math.pow(2, (P.S - 1) * .5);
    for (const [o, r] of coreO) o.frequency.setTargetAtTime(root * r, t, tc);
    coreG.gain.setTargetAtTime(.1 + .22 * M.energy, t, tc);
    subO.frequency.setTargetAtTime(root, t, tc); subG.gain.setTargetAtTime(.05 * Math.min(1.6, M.S3), t, tc);
    const ff = 130.8 * (1 + P.F * .75); fO1.frequency.setTargetAtTime(ff, t, tc); fO2.frequency.setTargetAtTime(ff * 1.007 + P.F, t, tc); fTrem.frequency.setTargetAtTime((2.2 + P.F * 1.6) / TAU * 3, t, tc); fG.gain.setTargetAtTime(.025 + .012 * P.F, t, tc);
    filtA.frequency.setTargetAtTime(900 + 6000 / P.A, t, tc);
    epsG.gain.setTargetAtTime(.002 + .05 * P.eps * P.eps, t, tc); epsBP.frequency.setTargetAtTime(2200 + 2400 * P.eps, t, tc);
  }
  function blip(f, a, dec, type = 'sine', panX = 0, wetv = .5, delay = 0) {
    if (!built || !ST.snd && !window.__recOn) return; const t = now() + delay;
    const o = osc(type, f), o2 = osc('sine', f * 2.76), g = gain(0), g2 = gain(.18), p = ctx.createStereoPanner ? n(ctx.createStereoPanner()) : null;
    o.connect(g); o2.connect(g2); g2.connect(g); if (p) { p.pan.value = clamp(panX, -1, 1); g.connect(p); p.connect(filtA); } else g.connect(filtA);
    const w = gain(wetv); g.connect(w); w.connect(rev);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + dec);
    o.start(t); o2.start(t); o.stop(t + dec + .05); o2.stop(t + dec + .05);
  }
  let arrT = 0, chT = 0, grT = 0;
  function update(dt) {
    if (!built) return; arrT -= dt; chT -= dt; grT -= dt;
    if (P.eps > .02 && Math.random() < P.eps * 18 * dt && grT <= 0) { grT = .02; blip(3000 + Math.random() * 5000, .012 * P.eps, .03, 'sine', .4 + Math.random() * .6, .7); ev('grain'); }
  }
  const panOf = x => clamp((x - 3.8) / 6, -1, 1);
  function arrive(r) { if (arrT > 0) return; arrT = .09; blip(PENTA[3 + r.k % 9] , .07, .55, 'triangle', panOf(ringWorld(r).x), .5); ev('arrive'); }
  function chime(r) { if (chT > 0) return; chT = .12; blip(PENTA[r.k % 12] * 2, .028 * (.5 + .5 * Math.min(1.5, r.Ti)), 1.8, 'sine', panOf(ringWorld(r).x), .8); ev('chime'); }
  function term(k) { if (!built) return; const f = TERMS[k] ? TERMS[k].note : 220; blip(f, .12, 1.6, 'triangle', 0, .7); blip(f * 1.5, .05, 1.2, 'sine', 0, .7, .08); ev('term'); }
  let pT = 0; function param() { const t = performance.now(); if (t - pT > 40) { pT = t; params(); } }
  return { unlock, vol, params, update, arrive, chime, term, param, recTracks: () => recDest ? recDest.stream.getAudioTracks() : [], get ctx() { return ctx; }, stats: st };
})();
function sndBtn() { $('bSnd').textContent = ST.snd ? 'TON AN' : 'TON AUS'; $('bSnd').classList.toggle('on', ST.snd); }
$('bSnd').onclick = () => { ST.snd = !ST.snd; if (ST.snd) SND.unlock(); SND.vol(); sndBtn(); saveS(); toast(ST.snd ? 'TON AN' : 'TON AUS'); };
sndBtn();

// ---------------------------------------------------------------- REC (canvas + audio)
let rec = null, recChunks = [], recStart = 0, recUrl = null;
function pickMime() { if (!window.MediaRecorder) return null; const mp4 = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4']; const webm = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']; const safari = /^((?!chrome|chromium|android|crios).)*safari/i.test(navigator.userAgent); const c = safari ? [...mp4, ...webm] : [...webm, ...mp4]; for (const m of c) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (_) { } } return ''; }
$('bRec').addEventListener('click', () => {
  if (rec) { try { rec.requestData(); } catch (_) { } rec.stop(); return; }
  const mime = pickMime(); if (mime === null || !canvas.captureStream) { toast('REC WIRD VON DIESEM BROWSER NICHT UNTERSTÜTZT'); return; }
  try {
    if (!SND.ctx) SND.unlock(); window.__recOn = true; SND.vol();
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...SND.recTracks()]); window.__recAudio = stream.getAudioTracks().length;
    rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 10e6 } : { videoBitsPerSecond: 10e6 }); recChunks = [];
    const r = rec;
    r.ondataavailable = e => { if (e.data && e.data.size) recChunks.push(e.data); };
    r.onstop = () => {
      const type = r.mimeType || mime || 'video/webm', ext = type.includes('mp4') ? 'mp4' : 'webm', blob = new Blob(recChunks, { type: type.split(';')[0] });
      rec = null; window.__recOn = false; SND.vol(); $('bRec').classList.remove('on');
      if (!blob.size) { $('rectime').classList.add('hide'); toast('REC: KEINE VIDEODATEN, BITTE LÄNGER AUFNEHMEN'); window.__lastRec = { size: 0, type }; return; }
      if (recUrl) URL.revokeObjectURL(recUrl); recUrl = URL.createObjectURL(blob);
      const name = `eye-of-resonance-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
      const a = document.createElement('a'); a.href = recUrl; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      $('rectime').innerHTML = `VIDEO ${(blob.size / 1048576).toFixed(1)} MB · ${ext.toUpperCase()}<a href="${recUrl}" download="${name}">SPEICHERN</a>`; $('rectime').classList.remove('hide');
      setTimeout(() => { if (!rec) $('rectime').classList.add('hide'); }, 20000);
      window.__lastRec = { size: blob.size, type, name };
    };
    r.start(500); recStart = performance.now(); $('bRec').classList.add('on'); $('rectime').classList.remove('hide');
  } catch (err) { rec = null; window.__recOn = false; toast('REC FEHLGESCHLAGEN'); console.warn(err); }
});
