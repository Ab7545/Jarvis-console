import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";

// ===========================================================================
// SECTION 0: SCENE, CAMERA & RENDERER SETUP
// ===========================================================================
const container = document.getElementById("jarvis-3d-canvas");
const labelEl = document.getElementById("orb-state-label");

let orbMode = "idle"; // "idle" | "thinking" | "speaking"

const getSize = () => ({
  w: Math.max(container?.clientWidth || 1, 1),
  h: Math.max(container?.clientHeight || 1, 1),
});

let scene, camera, renderer, orbGroup;
let outerShell, innerLattice, coreSphere, nucleusRing, eqRing, tiltRing;

if (container) {
  scene = new THREE.Scene();
  const initial = getSize();
  camera = new THREE.PerspectiveCamera(42, initial.w / initial.h, 0.1, 100);
  camera.position.z = 5.5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(initial.w, initial.h);
  container.appendChild(renderer.domElement);

  // =========================================================================
  // SECTION 1: MULTI-RING 3D CORE ASSEMBLY
  // =========================================================================
  orbGroup = new THREE.Group();
  scene.add(orbGroup);

  outerShell = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.3, 2),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
    })
  );
  orbGroup.add(outerShell);

  innerLattice = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.9, 2),
    new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      wireframe: true,
      transparent: true,
      opacity: 0.68,
    })
  );
  orbGroup.add(innerLattice);

  coreSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.26,
    })
  );
  orbGroup.add(coreSphere);

  nucleusRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.02, 16, 96),
    new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.88,
    })
  );
  orbGroup.add(nucleusRing);

  eqRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.64, 0.015, 16, 120),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.62,
    })
  );
  eqRing.rotation.x = Math.PI / 2;
  orbGroup.add(eqRing);

  tiltRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.88, 0.011, 16, 120),
    new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.44,
    })
  );
  orbGroup.add(tiltRing);

  // =========================================================================
  // SECTION 2: VIEWPORT FIT & RESIZE HANDLER
  // =========================================================================
  function fitCameraToViewport() {
    const { w, h } = getSize();
    const aspect = w / h;
    camera.aspect = aspect;
    orbGroup.scale.setScalar(aspect < 1 ? Math.max(0.68, aspect * 0.92) : 1.0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  fitCameraToViewport();
  window.addEventListener("resize", fitCameraToViewport);
  new ResizeObserver(fitCameraToViewport).observe(container);

  // =========================================================================
  // SECTION 3: ANIMATION & TELEMETRY PULSE LOOP
  // =========================================================================
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    const speedMult =
      orbMode === "thinking" ? 2.6 : orbMode === "speaking" ? 2.1 : 0.72;
    const pulseAmp =
      orbMode === "speaking" ? 0.13 : orbMode === "thinking" ? 0.08 : 0.03;
    const pulse = 1 + Math.sin(t * 4.2 * speedMult) * pulseAmp;

    outerShell.rotation.y += 0.005 * speedMult;
    outerShell.rotation.x += 0.0025 * speedMult;
    outerShell.scale.setScalar(pulse);

    innerLattice.rotation.y -= 0.009 * speedMult;
    innerLattice.rotation.z += 0.005 * speedMult;

    coreSphere.scale.setScalar(1 + Math.cos(t * 5 * speedMult) * (pulseAmp * 1.1));
    nucleusRing.rotation.x = Math.sin(t * 1.4) * 0.8;
    nucleusRing.rotation.y = Math.cos(t * 1.1) * 0.8;

    eqRing.rotation.z += 0.007 * speedMult;
    tiltRing.rotation.x = 0.65 + Math.sin(t * 0.65) * 0.25;
    tiltRing.rotation.y -= 0.006 * speedMult;

    renderer.render(scene, camera);
  }

  animate();
}

// ===========================================================================
// SECTION 4: PUBLIC MODE API FOR CONTROLLER (app.js)
// ===========================================================================
window.setJarvisOrbMode = (mode) => {
  orbMode = mode || "idle";
  if (!labelEl) return;
  if (mode === "thinking") labelEl.textContent = "PROCESSING DIRECTIVE";
  else if (mode === "speaking") labelEl.textContent = "VOICE SYNTHESIS ACTIVE";
  else labelEl.textContent = "CORE STANDBY";
};
