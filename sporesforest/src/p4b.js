
// ---------------------------------------------------------------- SOUND: generative Web Audio, no files
if (S.snd === undefined) S.snd = true; if (S.vol === undefined) S.vol = .75; if (S.voice === undefined) S.voice = false;
const SND = (() => {
  let ctx = null, master, comp, lim, mix, bus, wetBus, echoBus, recDest = null, droneG, droneLP, droneOsc = [], sawG, padG = [], humG, humO, crushIn, gClean, gCrush;
  let revS, revL, gRS, gRL, dly, dlyFb, dlyOut, crackT = 0, beatT = 0, nGlobal = 0, wakeGate = 0, sparkGate = 0, whisperNodes = null, offTimer = 0;
  const st = { nodes: 0, ev: {} };
  const ev = k => { st.ev[k] = (st.ev[k] || 0) + 1; };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  // A minor pentatonic, 12 steps, pilz 01 lowest, pilz 12 highest
  const PENTA = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
  const SPARK = [81, 84, 86, 88, 91, 93, 96, 98];
  const LP = {
    bio: { clean: 1, crush: 0, rs: .5, rl: .08, dt: .34, fb: .32, echo: .55, drone: 1, saw: 0 },
    machine: { clean: .5, crush: .75, rs: .2, rl: 0, dt: .19, fb: .42, echo: .5, drone: 1, saw: .55 },
    mind: { clean: 1, crush: 0, rs: .18, rl: .85, dt: .58, fb: .5, echo: .75, drone: 1.5, saw: 0 }
  };
  const n = x => { st.nodes++; return x; };
  const osc = (type, f) => { const o = n(ctx.createOscillator()); o.type = type; o.frequency.value = f; return o; };
  const gain = v => { const g = n(ctx.createGain()); g.gain.value = v; return g; };
  const filt = (type, f, q = .7) => { const b = n(ctx.createBiquadFilter()); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
  let noiseBuf = null;
  const noise = (loop = true) => { const s = n(ctx.createBufferSource()); s.buffer = noiseBuf; s.loop = loop; return s; };
  function impulse(sec, decay, damp) {
    const len = ctx.sampleRate * sec | 0, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; const w = Math.random() * 2 - 1; lp += (w - lp) * (damp + (1 - damp) * (1 - t)); d[i] = lp * Math.pow(1 - t, decay) * (i < 90 ? i / 90 : 1); } }
    return b;
  }
  function panner(x, y, z) {
    const p = n(ctx.createPanner()); p.panningModel = 'HRTF'; p.distanceModel = 'inverse'; p.refDistance = 14; p.rolloffFactor = .6; p.maxDistance = 400;
    if (p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } else p.setPosition(x, y, z);
    return p;
  }
  // route a voice: dry into lens bus, plus reverb and echo sends
  function out(node, wet = .4, echo = 0, pos = null) {
    let o = node; if (pos) { const p = panner(pos[0], pos[1], pos[2]); node.connect(p); o = p; }
    o.connect(bus); if (wet > 0) { const w = gain(wet); o.connect(w); w.connect(wetBus); } if (echo > 0) { const e = gain(echo); o.connect(e); e.connect(echoBus); }
    return o;
  }
  const L = () => LP[S.lens] || LP.bio;
  const now = () => ctx.currentTime;
  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    try { ctx = new AC({ latencyHint: 'interactive' }); } catch (_) { ctx = new AC(); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate); { const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    // master chain: mix -> glue compressor -> limiter -> master -> speakers (+ REC tap)
    master = gain(0); comp = n(ctx.createDynamicsCompressor()); comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = .01; comp.release.value = .3;
    lim = n(ctx.createDynamicsCompressor()); lim.threshold.value = -4; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = .002; lim.release.value = .12;
    mix = gain(1); const trim = gain(.82);
    mix.connect(comp); comp.connect(lim); lim.connect(trim); trim.connect(master); master.connect(ctx.destination);
    if (ctx.createMediaStreamDestination) { recDest = ctx.createMediaStreamDestination(); master.connect(recDest); }
    // lens processor: clean path + bitcrush-ish waveshaper path
    bus = gain(1); gClean = gain(1); gCrush = gain(0); bus.connect(gClean); gClean.connect(mix);
    const pre = gain(5), sh = n(ctx.createWaveShaper()), post = gain(.2), hp = filt('highpass', 180), cr = new Float32Array(1024);
    for (let i = 0; i < cr.length; i++) { const x = i / (cr.length - 1) * 2 - 1; const c = Math.max(-1, Math.min(1, x)); cr[i] = .62 * Math.round(c * 9) / 9 + .38 * Math.tanh(x * 1.4); }
    sh.curve = cr; sh.oversample = 'none'; bus.connect(pre); pre.connect(sh); sh.connect(post); post.connect(hp); hp.connect(gCrush); gCrush.connect(mix);
    // procedural convolution reverbs: short forest room and long ethereal hall
    wetBus = gain(1); revS = n(ctx.createConvolver()); revS.buffer = impulse(2.8, 2.6, .35); revL = n(ctx.createConvolver()); revL.buffer = impulse(6.5, 1.8, .2);
    gRS = gain(.5); gRL = gain(0); wetBus.connect(revS); wetBus.connect(revL); revS.connect(gRS); revL.connect(gRL); gRS.connect(mix); gRL.connect(mix);
    // echo
    echoBus = gain(1); dly = n(ctx.createDelay(2)); dly.delayTime.value = .34; dlyFb = gain(.32); const dlp = filt('lowpass', 2600); dlyOut = gain(.55);
    echoBus.connect(dly); dly.connect(dlp); dlp.connect(dlyFb); dlyFb.connect(dly); dlp.connect(dlyOut); dlyOut.connect(mix); const dw = gain(.3); dlyOut.connect(dw); dw.connect(wetBus);
    // drones: 55 / 82.5 / 110 Hz with slow gain LFOs, through a lowpass that opens with the network
    droneG = gain(.0); droneLP = filt('lowpass', 380, .6); droneLP.connect(droneG); droneG.connect(bus); const dwet = gain(.35); droneG.connect(dwet); dwet.connect(wetBus);
    [[55, .5, .061], [82.5, .32, .083], [110, .22, .047], [55.3, .3, .071]].forEach(([f, a, lf]) => {
      const o = osc('sine', f), g = gain(a), l = osc('sine', lf), lg = gain(a * .45); l.connect(lg); lg.connect(g.gain); o.connect(g); g.connect(droneLP); o.start(); l.start(); droneOsc.push([o, f]);
    });
    sawG = gain(0); { const o = osc('sawtooth', 55), o2 = osc('square', 110.4), lp = filt('lowpass', 520, 2), g2 = gain(.25); o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(sawG); sawG.connect(droneLP); o.start(); o2.start(); droneOsc.push([o, 55], [o2, 110.4]); }
    // harmonic pad layers fade in with every three connected mushrooms
    [164.8, 220, 261.6, 329.6].forEach((f, k) => { const g = gain(0), o = osc('triangle', f), o2 = osc('sine', f * 1.003), lp = filt('lowpass', 900); o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(bus); const w = gain(.8); g.connect(w); w.connect(wetBus); o.start(); o2.start(); padG.push(g); droneOsc.push([o, f], [o2, f * 1.003]); });
    // forest fog (lowpassed noise) and wind (swept bandpass)
    { const s = noise(), lp = filt('lowpass', 400), g = gain(.035); s.connect(lp); lp.connect(g); g.connect(bus); s.start(); }
    { const s = noise(), bp = filt('bandpass', 520, .8), g = gain(.018), l = osc('sine', .052), lg = gain(300), l2 = osc('sine', .033), lg2 = gain(.012);
      l.connect(lg); lg.connect(bp.frequency); l2.connect(lg2); lg2.connect(g.gain); s.connect(bp); bp.connect(g); out(g, .6); s.playbackRate.value = .9; s.start(1); l.start(); l2.start(); }
    // mycelium hum follows signal traffic
    humG = gain(0); humO = osc('sine', 110); { const fm = osc('sine', 3.3), fg = gain(4), o2 = osc('triangle', 220.6), g2 = gain(.35); fm.connect(fg); fg.connect(humO.frequency); humO.connect(humG); o2.connect(g2); g2.connect(humG); out(humG, .5); humO.start(); fm.start(); o2.start(); }
    applyLens(true);
    document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend().catch(() => { }); else if (S.snd || window.__recOn) ctx.resume().catch(() => { }); });
    const kick = () => { if (ctx && (S.snd || window.__recOn) && ctx.state !== 'running') ctx.resume().catch(() => { }); };
    addEventListener('pointerdown', kick, true); addEventListener('touchend', kick, true); addEventListener('keydown', kick, true);
    return true;
  }
  function applyLens(instant) {
    if (!ctx) return; const p = L(), t = now(), k = instant ? .01 : .6;
    gClean.gain.setTargetAtTime(p.clean, t, k); gCrush.gain.setTargetAtTime(p.crush, t, k); gRS.gain.setTargetAtTime(p.rs, t, k); gRL.gain.setTargetAtTime(p.rl, t, k);
    dly.delayTime.setTargetAtTime(p.dt, t, k * .5); dlyFb.gain.setTargetAtTime(p.fb, t, k); dlyOut.gain.setTargetAtTime(p.echo, t, k); sawG.gain.setTargetAtTime(p.saw * .5, t, k);
    droneOsc.slice(0, 4).forEach(([o, f]) => o.frequency.setTargetAtTime(f * p.drone, t, instant ? .01 : 1.5));
  }
  // ---- instruments
  function bell(m, t0, v = 1, pos = null, wet = .5, echo = 0, dec = 3.2) {
    const f = mtof(m), lens = S.lens, g = gain(0); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .006); g.gain.exponentialRampToValueAtTime(.0001, t0 + dec);
    const parts = lens === 'machine' ? [[1, .5, 'square'], [2, .12, 'square'], [3, .08, 'sine']] : lens === 'mind' ? [[1, .55, 'sine'], [2, .2, 'sine'], [3, .1, 'sine'], [4.02, .06, 'sine'], [1.5, .07, 'sine']] : [[1, .6, 'sine'], [2, .22, 'triangle'], [2.76, .09, 'sine'], [5.4, .035, 'sine']];
    const lp = filt('lowpass', lens === 'machine' ? 2400 : 7000); lp.connect(g);
    parts.forEach(([mul, a, type], i) => { const o = osc(type, f * mul); o.detune.value = (i % 2 ? 4 : -3); const pg = gain(a * (type === 'square' ? .35 : 1)); if (i) { pg.gain.setValueAtTime(a, t0); pg.gain.exponentialRampToValueAtTime(.001, t0 + dec / (mul * .9)); } o.connect(pg); pg.connect(lp); o.start(t0); o.stop(t0 + dec + .1); });
    out(g, wet, echo, pos);
  }
  function blip(m, t0, dur, v, pos, echo = .6) {
    const g = gain(0), o = osc(S.lens === 'machine' ? 'square' : Math.random() < .5 ? 'sine' : 'triangle', mtof(m)); if (S.lens === 'mind') o.detune.value = 1200 * (Math.random() < .3);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    o.connect(g); o.start(t0); o.stop(t0 + dur + .05); out(g, .5, echo, pos);
  }
  function hit(t0, dur, type, f, q, v, pan = 0, f2 = 0, wet = .2) {
    const s = noise(false), fl = filt(type, f, q), g = gain(0); s.playbackRate.value = .7 + Math.random() * .6;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + Math.min(.004, dur * .2)); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
    s.connect(fl); fl.connect(g); let o = g; if (pan && ctx.createStereoPanner) { const p = n(ctx.createStereoPanner()); p.pan.value = pan; g.connect(p); o = p; }
    o.connect(bus); if (wet) { const w = gain(wet); o.connect(w); w.connect(wetBus); } s.start(t0, Math.random() * 3); s.stop(t0 + dur + .05);
  }
  function crackle(t0, v = 1) {
    const pan = Math.random() * 1.6 - .8;
    if (S.lens === 'machine') { const o = osc('square', 900 + Math.random() * 2600), g = gain(0); g.gain.setValueAtTime(.018 * v, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + .018); o.connect(g); let x = g; if (ctx.createStereoPanner) { const p = n(ctx.createStereoPanner()); p.pan.value = pan; g.connect(p); x = p; } x.connect(bus); o.start(t0); o.stop(t0 + .03); }
    else hit(t0, .004 + Math.random() * .01, 'highpass', 1600 + Math.random() * 3000, .8, (.02 + Math.random() * .03) * v, pan, 0, S.lens === 'mind' ? .5 : .15);
  }
  const heroPos = i => { const h = heroes[i]; return [h.x, h.y + h.top * .55, h.z]; };
  const ok = () => ctx && S.snd && ctx.state === 'running';
  return {
    stats: st, PENTA,
    get ctx() { return ctx; },
    unlock() {
      if (!ctx && !build()) return;
      const t = now(); master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t); master.gain.linearRampToValueAtTime(S.snd ? S.vol : 0, t + 1.5);
      try { const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); } catch (_) { }
      if (S.snd) ctx.resume().catch(() => { }); else if (!window.__recOn) ctx.suspend().catch(() => { });
      droneG.gain.setTargetAtTime(.11, t, 2.5);
    },
    setOn(on) {
      S.snd = on; saveS(); if (on) this.unlock(); if (!ctx) return; const t = now();
      master.gain.cancelScheduledValues(t); master.gain.setTargetAtTime(on ? S.vol : 0, t, .08); clearTimeout(offTimer);
      if (!on) { if (window.speechSynthesis) speechSynthesis.cancel(); offTimer = setTimeout(() => { if (!S.snd && !window.__recOn) ctx.suspend().catch(() => { }); }, 400); }
    },
    setVol(v) { S.vol = v; if (ctx && S.snd) master.gain.setTargetAtTime(v, now(), .05); },
    recTracks() { if (!ctx || !recDest) return []; if (ctx.state !== 'running') ctx.resume().catch(() => { }); return recDest.stream.getAudioTracks(); },
    lens() { if (!ctx) return; applyLens(false); ev('lens'); if (!ok()) return; const t = now(); hit(t, .9, 'bandpass', 300, 1.2, .05, 0, S.lens === 'machine' ? 3000 : 1800, .6); },
    // each mushroom has its own tone; tap = spore sparkle + bell
    tap(i) {
      ev('tap'); if (!ok()) return; const t = now(), pos = heroPos(i), m = PENTA[i];
      if (t - sparkGate > .08) { sparkGate = t; const k = 5 + (Math.random() * 4 | 0); for (let j = 0; j < k; j++) blip(SPARK[Math.random() * SPARK.length | 0], t + .03 + Math.random() * .55, .08 + Math.random() * .12, .05, pos, .7); }
      bell(m, t + .01, .2, pos, .55, .25, 3.6); hit(t, .3, 'highpass', 6000, .7, .018, 0, 0, .4);
    },
    // propagated wake: softer, echoed own tone
    wake(i, en) {
      ev('wake'); if (!ok()) return; const t = now(); if (t - wakeGate < .22) return; wakeGate = t;
      bell(PENTA[i] + 12 * (S.lens === 'mind'), t, .075 * Math.min(1, en + .2), heroPos(i), .7, .7, 2.6);
    },
    // network grows: warm bell rising with progress (1 = lowest, 12 = highest)
    connect(k) {
      ev('connect'); if (!ok()) return; const t = now() + .35, m = PENTA[Math.max(0, Math.min(11, k - 1))];
      bell(m - 12, t, .15, null, .6, .3, 4.5); bell(m, t + .02, .08, null, .6, .3, 3.5);
    },
    // ground pulse: deep bloom whoosh that travels toward the mother
    ground(x, z) {
      ev('ground'); if (!ok()) return; const t = now(), y = H(x, z) + .5, p = panner(x, y, z);
      if (p.positionX) { p.positionX.setValueAtTime(x, t); p.positionZ.setValueAtTime(z, t); p.positionX.linearRampToValueAtTime(x * .25, t + 2); p.positionZ.linearRampToValueAtTime(z * .25, t + 2); }
      const g = gain(0); g.connect(p); p.connect(bus); const w = gain(.6); p.connect(w); w.connect(wetBus);
      const o = osc('sine', 60); o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(38, t + .9); const og = gain(0); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.55, t + .02); og.gain.exponentialRampToValueAtTime(.0001, t + 1.1); o.connect(og); og.connect(g); o.start(t); o.stop(t + 1.2);
      const s = noise(false), bp = filt('bandpass', 180, 1.4); bp.frequency.setValueAtTime(160, t); bp.frequency.exponentialRampToValueAtTime(900, t + .5); bp.frequency.exponentialRampToValueAtTime(140, t + 1.8);
      const ng = gain(0); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(.16, t + .25); ng.gain.exponentialRampToValueAtTime(.0001, t + 2); s.connect(bp); bp.connect(ng); ng.connect(g); s.start(t, Math.random()); s.stop(t + 2.1);
      g.gain.setValueAtTime(1, t);
      for (let k = 0; k < 7; k++) crackle(t + .15 + k * .14 + Math.random() * .08, .9);
    },
    mother(listen) {
      ev('mother'); if (!ok()) return; const t = now(), pos = [0, mother.y + 11, 0];
      bell(33, t, .2, pos, .8, .2, 6); bell(45, t + .03, .1, pos, .8, .3, 5);
    },
    // hold-to-listen: whispery formant-filtered noise under the fragment (+ optional German voice)
    whisper(text) {
      ev('whisper'); if (!ok()) return; const t = now(), dur = Math.min(9, text.length * .034 + 2.2);
      if (whisperNodes) try { whisperNodes.stop(t + .05); } catch (_) { }
      const s = noise(false), g = gain(0), f1 = filt('bandpass', 500, 7), f2 = filt('bandpass', 1300, 9), hp = filt('highpass', 250), am = gain(.6), mix2 = gain(1);
      s.playbackRate.value = 1; s.connect(hp); hp.connect(f1); hp.connect(f2); f1.connect(am); const f2g = gain(.6); f2.connect(f2g); f2g.connect(am); am.connect(mix2); mix2.connect(g);
      let k = t; while (k < t + dur) { const f = 300 + Math.random() * 900; f1.frequency.setTargetAtTime(f, k, .04); f2.frequency.setTargetAtTime(f * (2 + Math.random() * .8), k, .05); am.gain.setTargetAtTime(.25 + Math.random() * .75, k, .03); k += .09 + Math.random() * .12; }
      const v = S.voice && window.speechSynthesis ? .05 : .11;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .4); g.gain.setValueAtTime(v, t + dur - 1); g.gain.linearRampToValueAtTime(0, t + dur);
      out(g, .7, .3); s.start(t, Math.random() * 2); s.stop(t + dur + .1); whisperNodes = s;
      if (S.voice && window.speechSynthesis && window.SpeechSynthesisUtterance) {
        try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = .8; u.pitch = .6; u.volume = .4 * S.vol; const vs = speechSynthesis.getVoices().filter(x => /^de/i.test(x.lang)); if (vs.length) u.voice = vs[0]; speechSynthesis.speak(u); ev('tts'); } catch (_) { }
      }
    },
    // mother awakens: arpeggio of all twelve tones, choir-like formant swell, drones open up
    finale() {
      ev('finale'); if (!ok()) return; const t = now();
      PENTA.forEach((m, i) => bell(m, t + i * .17, .09, null, .7, .35, 4));
      const voices = gain(1), fA = filt('bandpass', 300, 7), fB = filt('bandpass', 870, 8), fC = filt('bandpass', 2240, 10), gA = gain(1), gB = gain(.55), gC = gain(.25), env = gain(0), lp = filt('lowpass', 3200);
      [[fA, 300, 730], [fB, 870, 1090], [fC, 2240, 2440]].forEach(([f, a, b]) => { f.frequency.setValueAtTime(a, t); f.frequency.linearRampToValueAtTime(b, t + 6); f.frequency.linearRampToValueAtTime(a * 1.2, t + 16); });
      voices.connect(fA); voices.connect(fB); voices.connect(fC); fA.connect(gA); fB.connect(gB); fC.connect(gC); gA.connect(env); gB.connect(env); gC.connect(env); env.connect(lp);
      env.gain.setValueAtTime(0, t); env.gain.linearRampToValueAtTime(.55, t + 4); env.gain.setValueAtTime(.55, t + 10); env.gain.linearRampToValueAtTime(0, t + 17);
      out(lp, 1.1, .2);
      const vib = osc('sine', 5.1), vg = gain(5); vib.connect(vg); vib.start(t); vib.stop(t + 17.2);
      [45, 52, 57, 60, 64, 69, 72].forEach((m, i) => [-9, 8].forEach(d => { const o = osc('sawtooth', mtof(m) * (S.lens === 'mind' ? 1 : 1)); o.detune.value = d + (Math.random() * 6 - 3); vg.connect(o.detune); const og = gain(.09 / (1 + i * .15)); o.connect(og); og.connect(voices); o.start(t + i * .25); o.stop(t + 17.2); }));
      const d = droneG.gain, lpF = droneLP.frequency; d.cancelScheduledValues(t); d.setValueAtTime(d.value, t); d.linearRampToValueAtTime(.22, t + 5); d.linearRampToValueAtTime(.14, t + 16);
      lpF.cancelScheduledValues(t); lpF.setValueAtTime(lpF.value, t); lpF.exponentialRampToValueAtTime(4000, t + 6); lpF.exponentialRampToValueAtTime(1300, t + 18);
      hit(t, 3, 'bandpass', 200, 1, .08, 0, 2400, .9);
      beatT = t + 8;
    },
    reset() { if (!ctx) return; const t = now(); droneLP.frequency.cancelScheduledValues(t); droneLP.frequency.setTargetAtTime(380, t, 1); droneG.gain.cancelScheduledValues(t); droneG.gain.setTargetAtTime(.11, t, 1); },
    update(dt) {
      if (!ctx || ctx.state !== 'running') return; const t = now();
      // listener follows the camera
      const ls = ctx.listener, p = camera.position, f = new V3(); camera.getWorldDirection(f); const u = camera.up;
      if (ls.positionX) { ls.positionX.setTargetAtTime(p.x, t, .03); ls.positionY.setTargetAtTime(p.y, t, .03); ls.positionZ.setTargetAtTime(p.z, t, .03); ls.forwardX.setTargetAtTime(f.x, t, .03); ls.forwardY.setTargetAtTime(f.y, t, .03); ls.forwardZ.setTargetAtTime(f.z, t, .03); ls.upX.value = u.x; ls.upY.value = u.y; ls.upZ.value = u.z; }
      else { ls.setPosition(p.x, p.y, p.z); ls.setOrientation(f.x, f.y, f.z, u.x, u.y, u.z); }
      if (!S.snd) return;
      // evolve with the network: drone filter opens and pad layers fade in
      if (!G.final || t > beatT + 4) droneLP.frequency.setTargetAtTime((G.final ? 1300 : 380 + G.connected * 70), t, 2);
      padG.forEach((g, k) => g.gain.setTargetAtTime(Math.max(0, Math.min(1, (G.connected - k * 3) / 3)) * .016 * (G.final ? 1.4 : 1), t, 1.5));
      const act = Math.min(1, pulses.length / 380); humG.gain.setTargetAtTime(act * .02, t, .25); humO.frequency.setTargetAtTime(S.lens === 'mind' ? 165 : 110, t, 1);
      // mycelium crackle and signal ticks
      crackT -= dt * (.6 + act * 7 + S.signal * 1); while (crackT < 0) { crackT += Math.random(); crackle(t + Math.random() * .05, .5 + act * .6); }
      // heartbeat after the finale (~60 bpm)
      if (G.final && beatT && t > beatT) { [0, .24].forEach((o, j) => { const os = osc('sine', 52), g = gain(0); os.frequency.setValueAtTime(58, t + o); os.frequency.exponentialRampToValueAtTime(36, t + o + .25); g.gain.setValueAtTime(0, t + o); g.gain.linearRampToValueAtTime(j ? .12 : .2, t + o + .015); g.gain.exponentialRampToValueAtTime(.0001, t + o + .35); os.connect(g); g.connect(bus); os.start(t + o); os.stop(t + o + .4); }); beatT = t + 1.05; }
    }
  };
})();
window.__SND = SND;
