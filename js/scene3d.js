// =====================================================
// Cena 3D do hero (raios/orbes flutuantes)
// =====================================================
import * as THREE from 'three';

export function initHeroScene(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Iluminação
  scene.add(new THREE.AmbientLight(0x2266ff, 0.6));
  const p1 = new THREE.PointLight(0x00e5ff, 60, 30);
  p1.position.set(4, 3, 5);
  scene.add(p1);
  const p2 = new THREE.PointLight(0x1e90ff, 40, 30);
  p2.position.set(-5, -2, 3);
  scene.add(p2);

  // Núcleo energético
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.2, 1),
    new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0077aa,
      emissiveIntensity: 1.4,
      wireframe: true,
      metalness: 0.6,
      roughness: 0.3,
    })
  );
  scene.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.07,
    })
  );
  scene.add(glow);

  // Orbitais de elétrons
  const orbits = new THREE.Group();
  const orbitGeo = new THREE.TorusGeometry(2.6, 0.02, 8, 120);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.3 });

  for (let i = 0; i < 3; i++) {
    const o = new THREE.Mesh(orbitGeo, orbitMat);
    o.rotation.x = Math.random() * Math.PI;
    o.rotation.y = Math.random() * Math.PI;
    orbits.add(o);
  }
  scene.add(orbits);

  const electrons = [];
  for (let i = 0; i < 6; i++) {
    const e = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0x9be8ff })
    );
    e.userData = {
      radius: 2.6 + (i % 2) * 0.6,
      speed: 0.6 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      axis: new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize(),
    };
    scene.add(e);
    electrons.push(e);
  }

  // Partículas de fundo
  const stars = new THREE.BufferGeometry();
  const pos = new Float32Array(300 * 3);
  for (let i = 0; i < 300 * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
  stars.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  scene.add(new THREE.Points(stars, new THREE.PointsMaterial({
    color: 0x2288cc, size: 0.06, transparent: true, opacity: 0.6,
  })));

  // Resize
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener('resize', resize);
  resize();

  // Loop
  const clock = new THREE.Clock();
  function animate() {
    const t = clock.getElapsedTime();

    core.rotation.x = t * 0.25;
    core.rotation.y = t * 0.35;
    glow.scale.setScalar(1 + Math.sin(t * 1.6) * 0.06);
    orbits.rotation.y = t * 0.2;
    orbits.rotation.x = Math.sin(t * 0.3) * 0.3;

    electrons.forEach((e) => {
      const d = e.userData;
      const angle = t * d.speed + d.phase;
      const v = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), angle).multiplyScalar(d.radius);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle * 0.5);
      e.position.copy(v);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
