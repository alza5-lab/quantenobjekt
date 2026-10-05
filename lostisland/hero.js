import * as THREE from './lib/three.module.min.js';

/** Exact approved Lila look as textured soft-billboard + gentle motion. */
export function createHero(canvas){
  const renderer = new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'high-performance'});
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
  camera.position.set(0, 1.05, 3.4);
  camera.lookAt(0, 0.95, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.0));

  const root = new THREE.Group();
  scene.add(root);
  const bodyG = new THREE.Group();
  root.add(bodyG);

  const loader = new THREE.TextureLoader();
  const tex = loader.load('./img/lila-sprite.png?v=3', (t)=>{
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy?.() || 4);
    t.needsUpdate = true;
  });
  tex.colorSpace = THREE.SRGBColorSpace;

  // Soft plane matching sprite aspect ~370:480
  const aspect = 0.915625;
  const h = 2.15, w = h * aspect;
  const mat = new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, alphaTest: 0.08
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.position.y = 1.05;
  bodyG.add(plane);

  // Soft elliptical shadow under feet
  const shMat = new THREE.MeshBasicMaterial({color: 0x2a1838, transparent:true, opacity:0.28, depthWrite:false});
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), shMat);
  shadow.rotation.x = -Math.PI/2;
  shadow.position.y = 0.02;
  shadow.scale.set(1.1, 0.55, 1);
  root.add(shadow);

  let facing = 1, sitAmt = 0, peekAmt = 0, walkPhase = 0, bob = 0;

  function resize(cw, ch, dpr){
    renderer.setPixelRatio(Math.min(dpr || 1, 2));
    renderer.setSize(cw, ch, false);
    camera.aspect = cw / Math.max(1, ch);
    camera.updateProjectionMatrix();
  }
  function setFacing(dir){ facing = dir >= 0 ? 1 : -1; }

  function update(dt, state){
    const walking = !!state.walking;
    sitAmt += ((state.sit ? 1 : 0) - sitAmt) * Math.min(1, dt * 6);
    peekAmt += ((state.peek ? 1 : 0) - peekAmt) * Math.min(1, dt * 5);

    if (walking) {
      walkPhase += dt * (8 + (state.speed || 1) * 4);
      bob = Math.abs(Math.sin(walkPhase)) * 0.07;
      // subtle tilt while running
      plane.rotation.z = Math.sin(walkPhase) * 0.06;
    } else {
      walkPhase *= 0.88; bob *= 0.88;
      plane.rotation.z *= 0.85;
      bob += Math.sin(state.t * 2.0) * 0.012;
    }

    // sit: squash down
    const sy = 1 - sitAmt * 0.22;
    const sx = 1 + sitAmt * 0.14;
    bodyG.position.y = bob - sitAmt * 0.28;
    bodyG.scale.set(facing * sx * (1 - peekAmt * 0.08), sy, 1);
    // peek: slide toward door / tuck
    bodyG.position.x = peekAmt * 0.45 * facing;
    bodyG.position.z = -peekAmt * 0.15;
    plane.rotation.y = peekAmt * 0.25 * facing;
    // shadow follows
    shadow.position.x = bodyG.position.x;
    shadow.scale.set(1.1 * (1 + sitAmt * 0.2), 0.55, 1);
    shadow.material.opacity = 0.28 * (1 - peekAmt * 0.5);

    // Always face camera (billboard yaw) while keeping flip via scale.x
    // plane already camera-facing in XY; facing flip mirrors sprite
    renderer.render(scene, camera);
  }

  return {resize, update, setFacing, renderer};
}
