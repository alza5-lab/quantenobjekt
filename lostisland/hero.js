import * as THREE from './lib/three.module.min.js';

const LILA = 0xd4b8f0;
const LILA_D = 0xb896d8;

function makeFaceTexture(){
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.clearRect(0,0,256,256);
  // eyes — hollow round sockets
  const ink = '#2a2035';
  function eye(x,y){
    g.fillStyle = ink;
    g.beginPath(); g.ellipse(x,y,28,32,0,0,7); g.fill();
    g.fillStyle = '#0a0812';
    g.beginPath(); g.ellipse(x,y,16,18,0,0,7); g.fill();
  }
  eye(92, 88); eye(164, 88);
  // triangle nose
  g.fillStyle = ink;
  g.beginPath(); g.moveTo(128,105); g.lineTo(116,128); g.lineTo(140,128); g.closePath(); g.fill();
  // stitched mouth — bold
  g.strokeStyle = ink; g.lineWidth = 9; g.lineCap = 'round';
  g.beginPath(); g.moveTo(78,152); g.lineTo(178,152); g.stroke();
  g.lineWidth = 6;
  for (let x = 86; x <= 170; x += 14) {
    g.beginPath(); g.moveTo(x,138); g.lineTo(x,166); g.stroke();
  }
  // belly X lower on texture? keep face-only texture; X separate
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeXTexture(){
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0,0,128,128);
  g.strokeStyle = '#2a2035'; g.lineWidth = 14; g.lineCap = 'round';
  g.beginPath(); g.moveTo(28,28); g.lineTo(100,100); g.stroke();
  g.beginPath(); g.moveTo(100,28); g.lineTo(28,100); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createHero(canvas){
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
  camera.position.set(0, 1.25, 3.5);
  camera.lookAt(0, 1.0, 0);

  scene.add(new THREE.HemisphereLight(0xfff5ff, 0x556688, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.0);
  key.position.set(1.2, 3.2, 4);
  scene.add(key);
  scene.add(new THREE.DirectionalLight(0xe8d0ff, 0.4).translateX(-3).translateY(2));

  const mat = new THREE.MeshStandardMaterial({
    color: LILA, roughness: 0.5, metalness: 0.02,
    emissive: LILA_D, emissiveIntensity: 0.07
  });

  const root = new THREE.Group();
  scene.add(root);
  const bodyG = new THREE.Group();
  root.add(bodyG);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.62, 0.7, 12, 28), mat);
  body.position.y = 1.08;
  bodyG.add(body);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.58, 28, 20), mat);
  crown.position.y = 1.58;
  crown.scale.set(1.02, 0.95, 0.92);
  bodyG.add(crown);

  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.16, 6, 12), mat);
    arm.position.set(s * 0.66, 1.05, 0.1);
    arm.rotation.z = s * 0.7;
    bodyG.add(arm);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.2, 6, 12), mat);
    leg.position.set(s * 0.24, 0.3, 0.05);
    bodyG.add(leg);
    legs.push(leg);
  }

  // Face decal plane — always readable
  const faceMat = new THREE.MeshBasicMaterial({
    map: makeFaceTexture(), transparent: true, depthWrite: false
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 1.05), faceMat);
  face.position.set(0, 1.42, 0.72);
  bodyG.add(face);

  const xMat = new THREE.MeshBasicMaterial({
    map: makeXTexture(), transparent: true, depthWrite: false
  });
  const xMark = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), xMat);
  xMark.position.set(0, 0.72, 0.74);
  bodyG.add(xMark);

  let facing = 1, sitAmt = 0, peekAmt = 0, walkPhase = 0, bob = 0;

  function resize(w, h, dpr){
    renderer.setPixelRatio(Math.min(dpr || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  function setFacing(dir){ facing = dir >= 0 ? 1 : -1; }

  function update(dt, state){
    const walking = !!state.walking;
    sitAmt += ((state.sit ? 1 : 0) - sitAmt) * Math.min(1, dt * 6);
    peekAmt += ((state.peek ? 1 : 0) - peekAmt) * Math.min(1, dt * 5);
    if (walking) {
      walkPhase += dt * (7.5 + (state.speed || 1) * 4);
      bob = Math.abs(Math.sin(walkPhase)) * 0.09;
      legs[0].rotation.x = Math.sin(walkPhase) * 0.6;
      legs[1].rotation.x = Math.sin(walkPhase + Math.PI) * 0.6;
      body.rotation.z = Math.sin(walkPhase) * 0.05;
    } else {
      walkPhase *= 0.88; bob *= 0.88;
      legs[0].rotation.x *= 0.85; legs[1].rotation.x *= 0.85;
      body.rotation.z *= 0.85;
      bob += Math.sin(state.t * 2.1) * 0.014;
    }
    const sy = 1 - sitAmt * 0.3;
    const sx = 1 + sitAmt * 0.2;
    bodyG.position.y = bob - sitAmt * 0.25;
    bodyG.scale.set(facing * sx * (1 - peekAmt * 0.1), sy, 1 + sitAmt * 0.04);
    bodyG.position.x = peekAmt * 0.35 * facing;
    bodyG.position.z = -peekAmt * 0.2;
    bodyG.rotation.y = peekAmt * 0.4 * facing;
    // Keep face toward camera even when mirrored via scale.x:
    // when facing -1, plane is mirrored which is fine for face art
    renderer.render(scene, camera);
  }
  return {resize, update, setFacing, renderer};
}
