import * as THREE from "https://unpkg.com/three@0.169.0/build/three.module.js";

const container = document.getElementById("jarvis-3d-canvas");
const labelEl = document.getElementById("orb-state-label");

let orbMode = "idle"; // "idle" | "thinking" | "speaking"

if (container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
    0.1,
    100
  );
  camera.position.z = 4.2;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Inner wireframe energy sphere
  const coreGeo = new THREE.IcosahedronGeometry(1.05, 3);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.78,
  });
  const coreMesh = new THREE.Mesh(coreGeo, coreMat);
  scene.add(coreMesh);

  // Inner glowing nucleus
  const nucleusGeo = new THREE.SphereGeometry(0.45, 24, 24);
  const nucleusMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.45,
  });
  const nucleusMesh = new THREE.Mesh(nucleusGeo, nucleusMat);
  scene.add(nucleusMesh);

  // Outer containment rings
  const ringGeo1 = new THREE.TorusGeometry(1.52, 0.018, 16, 100);
  const ringMat1 = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.55,
  });
  const outerRing1 = new THREE.Mesh(ringGeo1, ringMat1);
  scene.add(outerRing1);

  const ringGeo2 = new THREE.TorusGeometry(1.75, 0.012, 16, 100);
  const ringMat2 = new THREE.MeshBasicMaterial({
    color: 0x0284c7,
    transparent: true,
    opacity: 0.4,
  });
  const outerRing2 = new THREE.Mesh(ringGeo2, ringMat2);
  scene.add(outerRing2);

  function resizeOrb() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  }

  window.addEventListener("resize", resizeOrb);
  const resizeObserver = new ResizeObserver(resizeOrb);
  resizeObserver.observe(container);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    const speedMult =
      orbMode === "thinking" ? 2.8 : orbMode === "speaking" ? 2.1 : 0.75;
    const pulseAmp =
      orbMode === "speaking" ? 0.14 : orbMode === "thinking" ? 0.09 : 0.035;
    const scale = 1 + Math.sin(t * 4.5 * speedMult) * pulseAmp;

    coreMesh.rotation.y += 0.008 * speedMult;
    coreMesh.rotation.x += 0.004 * speedMult;
    coreMesh.scale.setScalar(scale);

    nucleusMesh.scale.setScalar(1 + Math.cos(t * 5 * speedMult) * (pulseAmp * 1.3));

    outerRing1.rotation.x = Math.PI * 0.35 + Math.sin(t * 0.8) * 0.25;
    outerRing1.rotation.y += 0.012 * speedMult;

    outerRing2.rotation.y = -Math.PI * 0.28 + Math.cos(t * 0.6) * 0.25;
    outerRing2.rotation.z -= 0.009 * speedMult;

    renderer.render(scene, camera);
  }

  animate();
}

window.setJarvisOrbMode = (mode) => {
  orbMode = mode || "idle";
  if (!labelEl) return;
  if (mode === "thinking") labelEl.textContent = "PROCESSING DIRECTIVE";
  else if (mode === "speaking") labelEl.textContent = "VOICE SYNTHESIS ACTIVE";
  else labelEl.textContent = "CORE STANDBY";
};
