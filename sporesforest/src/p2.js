
// ---------------------------------------------------------------- mycelium graph (Wood Wide Web)
const nodes = [], edges = [];
function addNode(x, z, kind) { const n = { i: nodes.length, x, z, y: H(x, z), e: [], act: 0, last: -9, lastEn: 0, hero: -1, kind }; nodes.push(n); return n; }
const motherNode = addNode(0, 0, 'mother');
const heroNodes = SEM.map((s, i) => { const n = addNode(s.x, s.z, 'hero'); n.hero = i; return n; });
// light path from the entrance (z=56) to the mother (concept panorama: Pfad aus Myzel-Licht)
const pathX = z => 4.5 * Math.sin(z * .13) + 1.5 * Math.sin(z * .31);
const pathNodes = [];
for (let z = 56; z > 6; z -= 3.2) pathNodes.push(addNode(pathX(z), z, 'path'));
const near = (x, z, d) => nodes.some(n => (n.x - x) ** 2 + (n.z - z) ** 2 < d * d);
for (let k = 0; k < 6000 && nodes.length < 230; k++) {
  const a = R() * TAU, r = Math.sqrt(R()) * 60, x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (r < 6.5 || near(x, z, 3.9)) continue;
  addNode(x, z, 'j');
}
const ekey = new Set();
function link(a, b, w = 1) {
  if (a === b) return; const k = a < b ? a + '_' + b : b + '_' + a; if (ekey.has(k)) return; ekey.add(k);
  const e = { i: edges.length, a, b, w, L: 0, v0: 0, np: 0, cum: null, bond: 0 }; edges.push(e); nodes[a].e.push(e.i); nodes[b].e.push(e.i);
}
for (const n of nodes) {
  const ds = nodes.filter(m => m !== n).map(m => [Math.hypot(m.x - n.x, m.z - n.z), m.i]).sort((p, q) => p[0] - q[0]);
  const k = n.kind === 'mother' ? 9 : n.kind === 'hero' ? 4 : 3, maxD = n.kind === 'mother' ? 16 : 10.5;
  for (let j = 0; j < k && j < ds.length; j++) if (ds[j][0] < maxD || j === 0) link(n.i, ds[j][1], n.kind === 'mother' ? 1.8 : n.kind === 'hero' ? 1.35 : 1);
}
for (let i = 0; i < pathNodes.length - 1; i++) link(pathNodes[i].i, pathNodes[i + 1].i, 1.6);
link(pathNodes[pathNodes.length - 1].i, 0, 1.8);
{ // connectivity (union-find)
  const par = nodes.map((_, i) => i), f = i => par[i] === i ? i : (par[i] = f(par[i]));
  for (const e of edges) par[f(e.a)] = f(e.b);
  for (let guard = 0; guard < 50; guard++) {
    const roots = new Set(nodes.map(n => f(n.i))); if (roots.size <= 1) break;
    const main = f(0); let best = null;
    for (const n of nodes) if (f(n.i) !== main) for (const m of nodes) if (f(m.i) === main) { const d = Math.hypot(n.x - m.x, n.z - m.z); if (!best || d < best[0]) best = [d, n.i, m.i]; }
    link(best[1], best[2]); par[f(best[1])] = f(best[2]);
  }
}
// ribbon geometry
let NV = 0;
const edgePts = edges.map(e => {
  const A = nodes[e.a], B = nodes[e.b], L0 = Math.hypot(B.x - A.x, B.z - A.z), px = -(B.z - A.z) / L0, pz = (B.x - A.x) / L0;
  const o1 = rr(-1, 1) * L0 * .16, o2 = rr(-1, 1) * L0 * .16;
  const cv = new THREE.CatmullRomCurve3([new V3(A.x, 0, A.z), new V3(lerp(A.x, B.x, .33) + px * o1, 0, lerp(A.z, B.z, .33) + pz * o1), new V3(lerp(A.x, B.x, .66) + px * o2, 0, lerp(A.z, B.z, .66) + pz * o2), new V3(B.x, 0, B.z)]);
  const np = Math.max(4, Math.ceil(L0 / .42)); const pts = cv.getSpacedPoints(np - 1);
  e.np = np; e.v0 = NV; NV += np * 2; return pts;
});
const rib = { pos: new Float32Array(NV * 3), side: new Float32Array(NV), t: new Float32Array(NV), glow: new Float32Array(NV), mix: new Float32Array(NV), bond: new Float32Array(NV), w: new Float32Array(NV) };
const ribIdx = [];
edges.forEach((e, ei) => {
  const pts = edgePts[ei], cum = new Float32Array(e.np); let acc = 0; const mx = R();
  for (let k = 0; k < e.np; k++) {
    if (k) acc += pts[k].distanceTo(pts[k - 1]); cum[k] = acc;
    const p = pts[k], q = pts[Math.min(k + 1, e.np - 1)], o = pts[Math.max(k - 1, 0)]; let tx = q.x - o.x, tz = q.z - o.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const taper = .55 + .45 * Math.sin(Math.PI * k / (e.np - 1)), w = (.05 + .045 * e.w) * (1.25 - .5 * taper) * 1.3;
    for (let s = 0; s < 2; s++) {
      const v = e.v0 + k * 2 + s, sd = s ? 1 : -1, x = p.x - tz * w * sd, z = p.z + tx * w * sd;
      rib.pos.set([x, H(x, z) + .06, z], v * 3); rib.side[v] = sd; rib.t[v] = acc + ei * 7.3; rib.mix[v] = mx; rib.w[v] = e.w;
    }
    if (k < e.np - 1) { const a = e.v0 + k * 2; ribIdx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  e.cum = cum; e.L = acc;
});
const ribGeo = new THREE.BufferGeometry();
ribGeo.setAttribute('position', new THREE.BufferAttribute(rib.pos, 3));
for (const [k, a] of [['aSide', rib.side], ['aT', rib.t], ['aMix', rib.mix], ['aW', rib.w]]) ribGeo.setAttribute(k, new THREE.BufferAttribute(a, 1));
const glowAttr = new THREE.BufferAttribute(rib.glow, 1).setUsage(THREE.DynamicDrawUsage); ribGeo.setAttribute('aGlow', glowAttr);
const bondAttr = new THREE.BufferAttribute(rib.bond, 1).setUsage(THREE.DynamicDrawUsage); ribGeo.setAttribute('aBond', bondAttr);
ribGeo.setIndex(ribIdx);
const FOGV = `vec4 mv = modelViewMatrix*vec4(position,1.); float d = -mv.z; vFog = exp(-uFogD*uFogD*d*d); gl_Position = projectionMatrix*mv;`;
const ribMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  uniforms: { uTime: { value: 0 }, uSpeed: { value: .5 }, uFogD: { value: .017 }, uA: { value: C.tq.clone() }, uB: { value: C.gold.clone() }, uBase: { value: .4 }, uK: { value: 1 }, uSync: { value: 0 } },
  vertexShader: `attribute float aSide, aT, aGlow, aMix, aBond, aW; uniform float uTime, uSpeed, uFogD, uSync; varying float vSide, vGlow, vMix, vShim, vFog, vBond, vW;
    void main(){ vSide=aSide; vGlow=aGlow; vMix=aMix; vBond=aBond; vW=aW;
      vShim = .5+.5*sin(aT*1.6 - uTime*(1.2+uSpeed*4.) + aMix*31.);
      vShim = mix(vShim, .5+.5*sin(uTime*3.9), uSync);
      ${FOGV} }`,
  fragmentShader: `uniform vec3 uA, uB; uniform float uBase, uK; varying float vSide, vGlow, vMix, vShim, vFog, vBond, vW;
    void main(){ float core = exp(-vSide*vSide*3.2), hot = exp(-vSide*vSide*22.);
      vec3 c = mix(uA, uB, smoothstep(.55,1.,vMix)*.85);
      float b = uBase*(.3+.5*vShim)*(.55+.45*vW) + vBond*(.45+.35*vShim) + vGlow*1.5;
      vec3 col = c*b*core + vec3(1.)*hot*(vGlow*.7 + vBond*.12);
      gl_FragColor = vec4(col*vFog*uK, 1.); }`
});
const ribbons = new THREE.Mesh(ribGeo, ribMat); ribbons.frustumCulled = false; scene.add(ribbons);

// fine hyphae (texture of the net)
{
  const P = [], Cc = [];
  for (const n of nodes) {
    const br = n.kind === 'hero' ? 14 : n.kind === 'mother' ? 30 : 7;
    for (let b = 0; b < br; b++) {
      let x = n.x, z = n.z, a = R() * TAU; const segs = 4 + (R() * 5 | 0), k = .3 + R() * .5;
      for (let s = 0; s < segs; s++) {
        const nx = x + Math.cos(a) * rr(.35, .8), nz = z + Math.sin(a) * rr(.35, .8);
        P.push(x, H(x, z) + .04, z, nx, H(nx, nz) + .04, nz); const f = k * (1 - s / segs); Cc.push(f, f, f, f * .7, f * .7, f * .7);
        x = nx; z = nz; a += rr(-.7, .7);
      }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, color: C.tq.clone() });
  const L = new THREE.LineSegments(g, m); L.frustumCulled = false; scene.add(L); scene.userData.hyphae = m;
}

// node blobs
const nodePos = new Float32Array(nodes.length * 3), nodeAct = new Float32Array(nodes.length), nodeSz = new Float32Array(nodes.length);
nodes.forEach((n, i) => { nodePos.set([n.x, n.y + .14, n.z], i * 3); nodeSz[i] = n.kind === 'mother' ? 3 : n.kind === 'hero' ? 1.6 : .55 + n.e.length * .16; });
const nodeGeo = new THREE.BufferGeometry(); nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3)); nodeGeo.setAttribute('aS', new THREE.BufferAttribute(nodeSz, 1));
const nodeActAttr = new THREE.BufferAttribute(nodeAct, 1).setUsage(THREE.DynamicDrawUsage); nodeGeo.setAttribute('aAct', nodeActAttr);
const nodeMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uA: ribMat.uniforms.uA, uB: ribMat.uniforms.uB, uPR: { value: 1 }, uH: { value: 800 }, uFogD: ribMat.uniforms.uFogD, uBase: ribMat.uniforms.uBase, uK: ribMat.uniforms.uK },
  vertexShader: `attribute float aS, aAct; uniform float uPR, uH, uFogD; varying float vAct, vFog;
    void main(){ vAct = aAct; ${FOGV} gl_PointSize = clamp(aS*(.55+aAct*1.4)*uH*.5/d, 1., 90.)*uPR; }`,
  fragmentShader: `uniform vec3 uA, uB; uniform float uBase, uK; varying float vAct, vFog;
    void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,.0,d); float h = smoothstep(.16,.0,d);
      vec3 c = mix(uA, uB, .25)*(uBase*.8+vAct*1.2)*a + vec3(1.)*h*(.2+vAct*.8);
      gl_FragColor = vec4(c*vFog*uK, 1.); }`
});
const nodePts = new THREE.Points(nodeGeo, nodeMat); nodePts.frustumCulled = false; scene.add(nodePts);

// ---------------------------------------------------------------- signal pulses
const pulses = [];
const stat = { sig: [], fired: 0 };
let T = 0;
function sendPulses(n, en, fromE) {
  for (const ei of n.e) {
    if (ei === fromE) continue; if (pulses.length > 900) return;
    const e = edges[ei]; pulses.push({ e: ei, dir: e.a === n.i ? 0 : 1, s: 0, v: (6 + S.signal * 10) * rr(.85, 1.15), en });
  }
}
function fire(ni, en, fromE = -1) {
  const n = nodes[ni];
  if (T - n.last < .45 && en <= n.lastEn + .05) return;
  n.last = T; n.lastEn = en; n.act = Math.max(n.act, en); stat.sig.push(T);
  if (n.hero >= 0) heroWake(n.hero, en);
  if (n.kind === 'mother') motherPing(en);
  const next = en * (.74 + S.signal * .16);
  if (next > .11) sendPulses(n, next, fromE);
}
function updatePulses(dt) {
  const g = rib.glow, dec = Math.exp(-dt * 3.2);
  for (let i = 0; i < g.length; i++) g[i] *= dec;
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i], e = edges[p.e]; p.s += p.v * dt;
    const s = p.dir ? e.L - p.s : p.s, cum = e.cum;
    for (let k = 0; k < e.np; k++) {
      const dd = cum[k] - s; if (dd < -1.6 || dd > 1.6) continue;
      const v = p.en * Math.exp(-dd * dd * 2.2), a = e.v0 + k * 2; if (g[a] < v) { g[a] = v; g[a + 1] = v; }
    }
    if (p.s >= e.L) { pulses.splice(i, 1); fire(p.dir ? e.a : e.b, p.en, p.e); }
  }
  glowAttr.needsUpdate = true;
  for (let i = 0; i < nodes.length; i++) { const n = nodes[i]; n.act *= Math.exp(-dt * 2.2); nodeAct[i] = n.act; }
  nodeActAttr.needsUpdate = true;
  while (stat.sig.length && T - stat.sig[0] > 3) stat.sig.shift();
}
// bonds: persistent glowing paths between connected mushrooms
const bondAnims = [];
function dijkstra(src, targets) {
  const dist = new Float32Array(nodes.length).fill(1e9), prev = new Int32Array(nodes.length).fill(-1), pe = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length);
  dist[src] = 0;
  for (; ;) {
    let u = -1, bd = 1e9; for (let i = 0; i < nodes.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
    if (u < 0) return null; if (targets.has(u)) { const path = []; let c = u; while (c !== src) { path.unshift([pe[c], prev[c]]); c = prev[c]; } return path; }
    done[u] = 1;
    for (const ei of nodes[u].e) { const e = edges[ei], v = e.a === u ? e.b : e.a, nd = dist[u] + e.L / e.w; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; pe[v] = ei; } }
  }
}
function bondPath(fromNode, targets) {
  const path = dijkstra(fromNode, targets); if (!path) return;
  // path: [edge, prevNode] from source outwards; animate growth from the mushroom
  const segs = path.map(([ei, pn]) => ({ e: ei, dir: edges[ei].a === pn ? 0 : 1 }));
  bondAnims.push({ segs, d: 0, total: segs.reduce((s, q) => s + edges[q.e].L, 0) });
}
function updateBonds(dt) {
  let dirty = false;
  for (let i = bondAnims.length - 1; i >= 0; i--) {
    const B = bondAnims[i]; B.d += dt * 13; let acc = 0;
    for (const q of B.segs) {
      const e = edges[q.e];
      for (let k = 0; k < e.np; k++) { const along = acc + (q.dir ? e.L - e.cum[k] : e.cum[k]); const v = clamp((B.d - along) / 2, 0, 1); const a = e.v0 + k * 2; if (rib.bond[a] < v) { rib.bond[a] = rib.bond[a + 1] = v; dirty = true; } }
      acc += e.L;
    }
    if (B.d > B.total + 3) { B.segs.forEach(q => edges[q.e].bond = 1); bondAnims.splice(i, 1); }
  }
  if (G.final) { for (let i = 0; i < rib.bond.length; i++) if (rib.bond[i] < .5) { rib.bond[i] = Math.min(.5, rib.bond[i] + dt * .25); dirty = true; } }
  if (dirty) bondAttr.needsUpdate = true;
}
function nearestNode(x, z, maxD = 1e9, filter) { let b = -1, bd = maxD * maxD; for (const n of nodes) { if (filter && !filter(n)) continue; const d = (n.x - x) ** 2 + (n.z - z) ** 2; if (d < bd) { bd = d; b = n.i; } } return b; }
