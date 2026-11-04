// =====================================================
// Visualizadores 3D — modelos procedurais com Three.js
// Todos os modelos são construídos via geometria.
// =====================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { addAnimationsFor } from './animations.js';

const viewers = {};

// ---------- helper: criar viewer genérico ----------
function createViewer(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(4, 3, 6);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.target.set(0, 0, 0);

  // Luzes
  scene.add(new THREE.AmbientLight(0x88bbff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(5, 8, 6);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x00e5ff, 1.2);
  rim.position.set(-6, 3, -5);
  scene.add(rim);

  // grade/plataforma
  const grid = new THREE.GridHelper(10, 20, 0x0a3a5a, 0x06202f);
  grid.position.y = -1.2;
  scene.add(grid);

  const viewer = {
    canvas, renderer, scene, camera, controls,
    parts: [],        // peças clicáveis
    animatable: [],   // objetos animados
    isAnimating: false,
    clock: new THREE.Clock(),
  };
  viewers[canvasId] = viewer;

  // resize
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas);
  resize();

  // Raycaster p/ selecionar peças
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;

  const tooltip = document.createElement('div');
  tooltip.className = 'part-tooltip';
  document.body.appendChild(tooltip);

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(viewer.parts, true);

    if (hits.length) {
      const part = hits[0].object;
      const info = findPartInfo(part);
      if (info) {
        tooltip.textContent = info.name;
        tooltip.classList.add('visible');
        tooltip.style.left = e.clientX + 'px';
        tooltip.style.top = e.clientY + 'px';
      }
      if (hovered !== part) {
        hovered = part;
        canvas.style.cursor = 'pointer';
      }
    } else {
      tooltip.classList.remove('visible');
      hovered = null;
      canvas.style.cursor = 'grab';
    }
  });

  canvas.addEventListener('pointerleave', () => tooltip.classList.remove('visible'));

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(viewer.parts, true);
    if (hits.length) {
      const info = findPartInfo(hits[0].object);
      if (info) {
        const legend = document.getElementById(canvas.id.replace('scene-', 'legend-'));
        if (legend) {
          legend.innerHTML = `<strong>${info.name}</strong> — ${info.desc}`;
        }
        // destaque
        hits[0].object.material.emissive?.set(0x00e5ff);
        hits[0].object.material.emissiveIntensity = 0.6;
      }
    }
  });

  return viewer;
}

function findPartInfo(obj) {
  let o = obj;
  while (o) {
    if (o.userData && o.userData.partName) return o.userData;
    o = o.parent;
  }
  return null;
}

// helper: adicionar peça clicável
function addPart(viewer, mesh, name, desc) {
  mesh.userData.partName = name;
  mesh.userData.desc = desc;
  viewer.parts.push(mesh);
  return mesh;
}

// helper: material padrão metálico
function mat(color, emissive = 0x000000, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive,
    metalness: opts.metalness ?? 0.5,
    roughness: opts.roughness ?? 0.4,
    ...opts,
  });
}

// =====================================================
// CONSTRUTORES DE MODELOS
// =====================================================

// ---- FUNDAMENTOS: circuito simples com elétrons ----
function buildFundamentos(v) {
  const { scene } = v;

  // fio (torus quadrado aproximado com 4 barras)
  const wireMat = mat(0x2a6fa0, 0x0a2030, { roughness: 0.6 });
  const makeWire = (w, h, x, y) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), wireMat);
    m.position.set(x, y, 0);
    scene.add(m);
    return m;
  };
  makeWire(4, 0.12, 0, 1.6);   // topo
  makeWire(4, 0.12, 0, -1.6);  // base
  makeWire(0.12, 3.2, 2, 0);   // direita
  makeWire(0.12, 3.2, -2, 0);  // esquerda

  // bateria (fonte)
  const bat = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.2, 20), mat(0xffd23f, 0x332200));
  bat.rotation.z = Math.PI / 2;
  bat.position.set(-2, 0, 0);
  addPart(v, bat, 'Fonte / Bateria', 'Fornece a tensão que impulsiona as cargas.');
  scene.add(bat);

  // resistor
  const res = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 20), mat(0xff8844, 0x331100));
  res.position.set(2, 0, 0);
  addPart(v, res, 'Resistor', 'Limita a corrente (oposição ao fluxo).');
  scene.add(res);

  // elétrons animados
  v.electrons = [];
  const eMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  for (let i = 0; i < 12; i++) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), eMat);
    e.userData.t = i / 12;
    scene.add(e);
    v.electrons.push(e);
  }

  // animação
  v.animatable.push((t) => {
    if (!v.isAnimating) return;
    v.electrons.forEach((e) => {
      e.userData.t = (e.userData.t + 0.004) % 1;
      const p = perimeterPoint(e.userData.t);
      e.position.set(p.x, p.y, 0);
    });
  });

  cameraLook(v, 0, 0, 0, 7);
}

// percorre o perímetro do retângulo de fios
function perimeterPoint(t) {
  // perímetro total: lados 4 (topo/base) e 3.2 (laterais) -> 14.4
  const segs = [
    { len: 4, fn: (u) => ({ x: -2 + u * 4, y: 1.6 }) },   // topo
    { len: 3.2, fn: (u) => ({ x: 2, y: 1.6 - u * 3.2 }) }, // direita
    { len: 4, fn: (u) => ({ x: 2 - u * 4, y: -1.6 }) },    // base
    { len: 3.2, fn: (u) => ({ x: -2, y: -1.6 + u * 3.2 }) } // esquerda
  ];
  const total = segs.reduce((a, s) => a + s.len, 0);
  let d = t * total;
  for (const s of segs) {
    if (d <= s.len) return s.fn(d / s.len);
    d -= s.len;
  }
  return { x: -2, y: 1.6 };
}

function cameraLook(v, x, y, z, dist) {
  v.camera.position.set(dist * 0.7, dist * 0.5, dist);
  v.controls.target.set(x, y, z);
  v.controls.update();
}

// ---- COMPONENTES (fábrica por tipo) ----
function buildComponente(v, tipo) {
  clearScene(v);

  const builders = {
    resistor: () => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 24), mat(0xd9b38c, 0x1a1208));
      body.rotation.z = Math.PI / 2;
      addPart(v, body, 'Corpo cerâmico', 'Isola e sustenta o elemento resistivo.');
      v.scene.add(body);

      // faixas coloridas
      const bands = [0x8b4513, 0x000000, 0xff0000, 0xffd700];
      bands.forEach((c, i) => {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 24), mat(c, 0x000000, { roughness: 0.7 }));
        b.rotation.z = Math.PI / 2;
        b.position.x = -0.6 + i * 0.4;
        b.userData.partName = 'Faixa de código de cores';
        b.userData.desc = 'Indica o valor da resistência em ohms.';
        v.parts.push(b);
        v.scene.add(b);
      });

      // terminais
      const termMat = mat(0xaaaaaa, 0x222222, { metalness: 0.9, roughness: 0.2 });
      [-1.1, 1.1].forEach((x) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.6, 10), termMat);
        t.rotation.z = Math.PI / 2;
        t.position.x = x;
        addPart(v, t, 'Terminal', 'Ponto de conexão do resistor ao circuito.');
        v.scene.add(t);
      });
    },

    capacitor: () => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2, 24), mat(0x2255aa, 0x001133, { metalness: 0.3 }));
      addPart(v, body, 'Corpo do capacitor', 'Armazena carga elétrica entre duas placas.');
      v.scene.add(body);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24), mat(0xcccccc, 0x222222, { metalness: 0.9 }));
      top.position.y = 0.62;
      addPart(v, top, 'Terminal superior (+)', 'Conexão positiva.');
      v.scene.add(top);

      const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.06, 24), mat(0xcccccc, 0x222222, { metalness: 0.9 }));
      bottom.position.y = -0.62;
      addPart(v, bottom, 'Terminal inferior (−)', 'Conexão negativa.');
      v.scene.add(bottom);

      // placas internas (visíveis em corte)
      const plateMat = mat(0x00e5ff, 0x006688);
      const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), plateMat);
      p1.position.y = 0.25; addPart(v, p1, 'Placa interna', 'Uma das armaduras do capacitor.'); v.scene.add(p1);
      const p2 = p1.clone(); p2.position.y = -0.25; v.scene.add(p2);
    },

    indutor: () => {
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.6, 12), mat(0x888888, 0x222222, { metalness: 0.9 }));
      core.rotation.z = Math.PI / 2;
      addPart(v, core, 'Núcleo', 'Concentra o campo magnético (pode ser ar ou ferrite).');
      v.scene.add(core);

      // bobina
      const coilMat = mat(0xcc6600, 0x331100, { metalness: 0.8 });
      for (let i = 0; i < 14; i++) {
        const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 20), coilMat);
        torus.rotation.y = Math.PI / 2;
        torus.position.x = -0.65 + i * 0.1;
        if (i === 0) addPart(v, torus, 'Bobina de fio', 'Armazena energia em campo magnético. Oposição à variação de corrente.');
        v.scene.add(torus);
      }
    },

    diodo: () => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 20), mat(0x1a1a1a, 0x000000));
      body.rotation.z = Math.PI / 2;
      addPart(v, body, 'Corpo do diodo', 'Permite a passagem de corrente em apenas um sentido.');
      v.scene.add(body);

      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 20), mat(0xffffff, 0x333333));
      stripe.rotation.z = Math.PI / 2;
      stripe.position.x = 0.32;
      addPart(v, stripe, 'Faixa do cátodo', 'Indica o lado do cátodo (negativo).');
      v.scene.add(stripe);

      const termMat = mat(0xbbbbbb, 0x222222, { metalness: 0.9 });
      [-0.7, 0.7].forEach((x) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8), termMat);
        t.rotation.z = Math.PI / 2; t.position.x = x;
        addPart(v, t, 'Terminal', 'Ânodo (esq.) e cátodo (dir.).');
        v.scene.add(t);
      });
    },

    led: () => {
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.45, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 1.4, transparent: true, opacity: 0.85 })
      );
      dome.position.y = 0.2;
      addPart(v, dome, 'Domo (encapsulamento)', 'Lente que difunde a luz. Emissor de luz quando polarizado.');
      v.scene.add(dome);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.5, 24), mat(0xdddddd, 0x222222, { metalness: 0.3 }));
      base.position.y = -0.25;
      addPart(v, base, 'Base', 'Suporta o LED e seus terminais.');
      v.scene.add(base);

      const termMat = mat(0xcccccc, 0x222222, { metalness: 0.9 });
      [-0.2, 0.2].forEach((x) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), termMat);
        t.position.set(x, -0.8, 0);
        addPart(v, t, 'Terminal', 'Ânodo (+) e cátodo (−).');
        v.scene.add(t);
      });

      v.animatable.push((t) => {
        if (!v.isAnimating) return;
        dome.material.emissiveIntensity = 1.2 + Math.sin(t * 4) * 0.5;
      });
    },

    transistor: () => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.3), mat(0x222222, 0x000000, { metalness: 0.4 }));
      addPart(v, body, 'Encapsulamento', 'Protege a pastilha de silício.');
      v.scene.add(body);

      const termMat = mat(0xcccccc, 0x222222, { metalness: 0.9 });
      const names = ['Base', 'Coletor', 'Emissor'];
      [-0.3, 0, 0.3].forEach((x, i) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.7, 8), termMat);
        t.position.set(x, -0.8, 0);
        addPart(v, t, names[i], 'Terminal de ' + names[i].toLowerCase() + '.');
        v.scene.add(t);
      });
    },

    fusivel: () => {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 1.2, 20),
        new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.35, metalness: 0.3 })
      );
      body.rotation.z = Math.PI / 2;
      addPart(v, body, 'Cápsula de vidro', 'Protege o elemento fusível e permite inspeção visual.');
      v.scene.add(body);

      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 6), mat(0xffaa00, 0x553300));
      wire.rotation.z = Math.PI / 2;
      addPart(v, wire, 'Elemento fusível', 'Derrete quando a corrente excede o valor nominal.');
      v.scene.add(wire);

      const capMat = mat(0xcccccc, 0x222222, { metalness: 0.9 });
      [-0.65, 0.65].forEach((x) => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.15, 20), capMat);
        c.rotation.z = Math.PI / 2; c.position.x = x;
        addPart(v, c, 'Terminal metálico', 'Contato elétrico do fusível.');
        v.scene.add(c);
      });
    },

    disjuntor: () => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.6), mat(0xdddddd, 0x333333, { metalness: 0.2, roughness: 0.6 }));
      addPart(v, body, 'Corpo do disjuntor', 'Invólucro isolante com mecanismo de disparo.');
      v.scene.add(body);

      const lever = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.2), mat(0xffd23f, 0x332200));
      lever.position.set(0, 0.8, 0.35);
      addPart(v, lever, 'Alavanca', 'Liga/desliga o circuito (e rearma após disparo).');
      v.scene.add(lever);

      const termMat = mat(0xbbbbbb, 0x222222, { metalness: 0.9 });
      [-1, 1].forEach((y) => {
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 10), termMat);
        t.position.set(0, y * 0.7, 0.5);
        addPart(v, t, 'Terminal', 'Entrada e saída de energia.');
        v.scene.add(t);
      });
    },

    rele: () => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.6), mat(0x2244aa, 0x001133));
      addPart(v, body, 'Carcaça do relé', 'Abriga bobina e contatos. Isola a baixa da alta tensão.');
      v.scene.add(body);

      const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 16), mat(0xcc6600, 0x331100));
      coil.position.set(-0.4, 0, 0.35); coil.rotation.x = Math.PI / 2;
      addPart(v, coil, 'Bobina', 'Gera campo magnético que aciona o contato.');
      v.scene.add(coil);

      const contato = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), mat(0xffd23f, 0x553300, { metalness: 0.9 }));
      contato.position.set(0.4, 0.2, 0.35);
      addPart(v, contato, 'Contato móvel', 'Abre/fecha o circuito de carga.');
      v.scene.add(contato);

      v.animatable.push((t) => {
        if (!v.isAnimating) return;
        const a = (Math.sin(t * 3) + 1) / 2;
        contato.position.y = 0.2 + a * 0.15;
      });
    },

    interruptor: () => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), mat(0xf5f5f5, 0x222222));
      addPart(v, plate, 'Espelho', 'Placa frontal do interruptor.');
      v.scene.add(plate);

      const tecla = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.25), mat(0xdddddd, 0x222222));
      tecla.position.z = 0.15;
      addPart(v, tecla, 'Tecla', 'Aciona o contato interno.');
      v.scene.add(tecla);
    },

    tomada: () => {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.15), mat(0xf5f5f5, 0x222222));
      addPart(v, plate, 'Espelho', 'Placa frontal da tomada.');
      v.scene.add(plate);

      const holeMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
      const positions = [
        [-0.3, 0.2], [0.3, 0.2], [0, -0.3]
      ];
      positions.forEach(([x, y], i) => {
        const h = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.2, 12), holeMat);
        h.rotation.x = Math.PI / 2;
        h.position.set(x, y, 0.15);
        const labels = ['Fase', 'Neutro', 'Terra'];
        addPart(v, h, 'Pino ' + labels[i], 'Contato para ' + labels[i].toLowerCase() + '.');
        v.scene.add(h);
      });
    },

    bateria: () => {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.6, 24), mat(0x222222, 0x000000, { metalness: 0.4 }));
      addPart(v, body, 'Carcaça', 'Contém as células eletroquímicas.');
      v.scene.add(body);

      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.15, 16), mat(0xdddddd, 0x444444, { metalness: 0.9 }));
      top.position.y = 0.85;
      addPart(v, top, 'Polo positivo (+)', 'Terminal positivo.');
      v.scene.add(top);

      const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 24), mat(0xcccccc, 0x333333, { metalness: 0.9 }));
      bottom.position.y = -0.82;
      addPart(v, bottom, 'Polo negativo (−)', 'Terminal negativo.');
      v.scene.add(bottom);
    },

    fonte: () => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.0), mat(0x333a44, 0x111820, { metalness: 0.6 }));
      addPart(v, body, 'Carcaça', 'Abriga transformador, retificador e filtros.');
      v.scene.add(body);

      const led = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
      led.position.set(0.55, 0.35, 0.3);
      addPart(v, led, 'LED indicador', 'Mostra que a fonte está ligada.');
      v.scene.add(led);

      const wires = [0x000000, 0xff0000];
      wires.forEach((c, i) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.0, 8), new THREE.MeshBasicMaterial({ color: c }));
        w.rotation.z = Math.PI / 2;
        w.position.set(1.2, -0.1 + i * 0.2, 0);
        addPart(v, w, c === 0xff0000 ? 'Cabo positivo' : 'Cabo negativo', 'Saída CC.');
        v.scene.add(w);
      });
    },

    transformador: () => {
      // núcleo fechado
      const coreMat = mat(0x777777, 0x222222, { metalness: 0.9, roughness: 0.3 });
      const core = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 0.6), coreMat);
      core.material.transparent = true; core.material.opacity = 0.35;
      addPart(v, core, 'Núcleo magnético', 'Laminado de aço-silício que conduz o fluxo magnético.');
      v.scene.add(core);

      // bobina primária
      const primMat = mat(0xff8844, 0x331100, { metalness: 0.7 });
      for (let i = 0; i < 10; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), primMat);
        t.rotation.y = Math.PI / 2;
        t.position.set(-0.65, -0.5 + i * 0.11, 0.4);
        if (i === 0) addPart(v, t, 'Bobina primária', 'Recebe a tensão de entrada.');
        v.scene.add(t);
      }

      // bobina secundária
      const secMat = mat(0x00e5ff, 0x006688, { metalness: 0.7 });
      for (let i = 0; i < 16; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), secMat);
        t.rotation.y = Math.PI / 2;
        t.position.set(0.65, -0.6 + i * 0.11, 0.4);
        if (i === 0) addPart(v, t, 'Bobina secundária', 'Entrega a tensão transformada. Relação N2/N1 define o ganho.');
        v.scene.add(t);
      }
    },
  };

  (builders[tipo] || builders.resistor)();
  cameraLook(v, 0, 0, 0, 5.5);
}

// ---- INSTALAÇÕES ----
function buildInstalacoes(v) {
  clearScene(v);
  const { scene } = v;

  // Quadro de distribuição
  const quadro = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.4), mat(0x9fb4c7, 0x223344, { metalness: 0.5 }));
  addPart(v, quadro, 'Quadro de distribuição', 'Centraliza os disjuntores, o DR e o DPS da instalação.');
  scene.add(quadro);

  // disjuntores no quadro
  for (let i = 0; i < 4; i++) {
    const dj = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.2), mat(0xdddddd, 0x333333));
    dj.position.set(-0.75 + i * 0.5, 0.3, 0.3);
    addPart(v, dj, 'Disjuntor', 'Protege o circuito contra sobrecorrente.');
    scene.add(dj);
  }
  const dr = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), mat(0xffffff, 0x222222));
  dr.position.set(0, -0.7, 0.3);
  addPart(v, dr, 'DR — Diferencial Residual', 'Desliga quando detecta fuga de corrente (protege pessoas).');
  scene.add(dr);

  const dps = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), mat(0xffd23f, 0x332200));
  dps.position.set(0.7, -0.7, 0.3);
  addPart(v, dps, 'DPS — Protetor de Surtos', 'Desvia surtos de tensão (raios) para o terra.');
  scene.add(dps);

  // fios saindo do quadro
  const wireColors = [0xff0000, 0x000000, 0x00aa00];
  wireColors.forEach((c, i) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.5, 8), new THREE.MeshBasicMaterial({ color: c }));
    w.position.set(-1.5 + i * 0.2, -2.4, 0);
    const label = ['Fase', 'Neutro', 'Terra'][i];
    addPart(v, w, 'Cabo ' + label, 'Condutor de ' + label.toLowerCase() + ' da instalação.');
    scene.add(w);
  });

  // tomada
  const tomada = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.12), mat(0xf5f5f5, 0x222222));
  tomada.position.set(2.5, -1.8, 0);
  addPart(v, tomada, 'Tomada', 'Ponto de entrega de energia aos aparelhos.');
  scene.add(tomada);

  // aterramento (haste)
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), mat(0x00aa00, 0x003300, { metalness: 0.9 }));
  haste.position.set(-2.6, -2.2, 0);
  addPart(v, haste, 'Haste de aterramento', 'Leva correntes de falta para a terra com segurança.');
  scene.add(haste);

  cameraLook(v, 0, -1, 0, 8);
}

// ---- GERAÇÃO ----
function buildGeracao(v) {
  clearScene(v);
  const { scene } = v;

  // represa
  const damMat = mat(0x8a8a8a, 0x222222, { roughness: 0.9 });
  const dam = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 3), damMat);
  dam.position.set(-2, 0, 0);
  addPart(v, dam, 'Barragem / queda d\'água', 'A água armazenada adquire energia potencial.');
  scene.add(dam);

  // tubo
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 16), mat(0x2277aa, 0x002244, { metalness: 0.5 }));
  pipe.rotation.z = Math.PI / 2;
  pipe.position.set(-0.2, -0.7, 0);
  addPart(v, pipe, 'Canal / conduto', 'Leva a água sob pressão à turbina.');
  scene.add(pipe);

  // turbina
  const turbina = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16), mat(0xffd23f, 0x332200));
  hub.rotation.z = Math.PI / 2;
  turbina.add(hub);
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), mat(0xdddddd, 0x333333, { metalness: 0.8 }));
    p.position.x = 0.15;
    p.rotation.x = (i / 6) * Math.PI * 2;
    p.position.y = Math.cos(p.rotation.x) * 0.35;
    p.position.z = Math.sin(p.rotation.x) * 0.35;
    turbina.add(p);
  }
  turbina.position.set(1.2, -0.7, 0);
  turbina.rotation.z = -Math.PI / 2;
  addPart(v, turbina, 'Turbina hidráulica', 'Converte energia da água em rotação mecânica.');
  scene.add(turbina);

  // gerador
  const gerador = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.2, 24), mat(0x2277aa, 0x001133, { metalness: 0.7 }));
  gerador.rotation.z = Math.PI / 2;
  gerador.position.set(2.8, -0.7, 0);
  addPart(v, gerador, 'Gerador / alternador', 'Transforma rotação em eletricidade (indução).');
  scene.add(gerador);

  // painéis solares (à parte)
  const panelMat = mat(0x113366, 0x001133, { metalness: 0.7, roughness: 0.2 });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), panelMat);
    p.position.set(-1 + i * 1.4, 2.6, 0);
    p.rotation.x = -0.5;
    if (i === 0) addPart(v, p, 'Painel solar', 'Converte luz em eletricidade pelo efeito fotovoltaico.');
    scene.add(p);
  }

  // torre eólica
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 2.4, 8), mat(0xcccccc, 0x333333, { metalness: 0.6 }));
  mast.position.set(-2.6, 2.4, 1.6);
  addPart(v, mast, 'Torre eólica', 'Suporta a nacele e as pás; o vento gira o rotor.');
  scene.add(mast);
  const nacele = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 12), mat(0xeeeeee, 0x444444));
  nacele.position.set(-2.6, 3.6, 1.6);
  scene.add(nacele);
  for (let i = 0; i < 3; i++) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.12), mat(0xffffff, 0x666666, { metalness: 0.3 }));
    pa.position.set(-2.6, 3.6, 1.6);
    pa.rotation.z = (i / 3) * Math.PI * 2;
    pa.position.x += Math.cos(pa.rotation.z) * 0.5;
    pa.position.y += Math.sin(pa.rotation.z) * 0.5;
    scene.add(pa);
  }

  // animação da turbina e das pás
  v.animatable.push((t) => {
    if (!v.isAnimating) return;
    turbina.rotation.x += 0.05;
    gerador.rotation.x += 0.03;
  });

  cameraLook(v, 0.5, 0.5, 0, 9);
}

// ---- TRANSMISSÃO ----
function buildTransmissao(v) {
  clearScene(v);
  const { scene } = v;

  // caminho de energia horizontal
  const pathY = 0;

  // usina (simples)
  const usina = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.8), mat(0x555555, 0x222222));
  usina.position.set(-5, pathY, 0);
  addPart(v, usina, 'Usina', 'Gera energia elétrica.');
  scene.add(usina);

  // torres de transmissão
  const towerMat = mat(0x888888, 0x222222, { metalness: 0.8 });
  for (let i = 0; i < 3; i++) {
    const x = -3 + i * 2.4;
    const tower = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.4, 0.15), towerMat);
    base.position.y = 1.2;
    tower.add(base);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), towerMat);
    arm.position.y = 2.2;
    tower.add(arm);
    tower.position.set(x, pathY, 0);
    addPart(v, tower, 'Torre de transmissão', 'Sustenta cabos de alta tensão. Reduz perdas com tensão elevada.');
    scene.add(tower);
  }

  // cabos
  const cableMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  for (let i = 0; i < 2; i++) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 9, 6), cableMat);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0, pathY + 2.2 + i * 0.15, 0);
    addPart(v, cable, 'Linha de alta tensão', 'Transporta energia com baixa corrente (menos perdas).');
    scene.add(cable);
  }

  // subestação
  const sub = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 1.2), mat(0x336699, 0x001133, { metalness: 0.5 }));
  sub.position.set(4.5, pathY, 0);
  addPart(v, sub, 'Subestação', 'Abaixa a tensão com transformadores de potência.');
  scene.add(sub);

  // casa
  const casa = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffcc88, 0x332211));
  casa.position.set(6.5, pathY - 0.2, 0);
  addPart(v, casa, 'Residência', 'Consome energia em baixa tensão.');
  scene.add(casa);
  const telhado = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.7, 4), mat(0x884444, 0x331111));
  telhado.position.set(6.5, pathY + 0.6, 0);
  telhado.rotation.y = Math.PI / 4;
  scene.add(telhado);

  // partículas de energia
  v.energyParticles = [];
  const pMat = new THREE.MeshBasicMaterial({ color: 0xffd23f });
  for (let i = 0; i < 10; i++) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), pMat);
    p.userData.t = i / 10;
    scene.add(p);
    v.energyParticles.push(p);
  }

  v.animatable.push((t) => {
    if (!v.isAnimating) return;
    v.energyParticles.forEach((p) => {
      p.userData.t = (p.userData.t + 0.003) % 1;
      const x = -5 + p.userData.t * 12;
      p.position.set(x, pathY + 0.6, 0);
    });
  });

  cameraLook(v, 0.5, 0, 0, 14);
}

// ---- MÁQUINAS ----
function buildMaquinas(v) {
  clearScene(v);
  const { scene } = v;

  // estator (carcaça com ranhuras)
  const stator = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.3, 2, 32, 1, true),
    mat(0x446688, 0x112233, { metalness: 0.6, side: THREE.DoubleSide })
  );
  stator.rotation.z = Math.PI / 2;
  addPart(v, stator, 'Estator', 'Parte fixa com bobinas que criam o campo magnético girante.');
  scene.add(stator);

  // bobinas do estator
  const coilMat = mat(0xcc6600, 0x331100, { metalness: 0.7 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const coil = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 1.6), coilMat);
    coil.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0);
    coil.rotation.z = a;
    if (i === 0) addPart(v, coil, 'Bobina do estator', 'Enrolamento percorrido por corrente alternada.');
    scene.add(coil);
  }

  // rotor
  const rotor = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 16), mat(0xcccccc, 0x333333, { metalness: 0.9 }));
  shaft.rotation.z = Math.PI / 2;
  rotor.add(shaft);

  const coreR = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.4, 24), mat(0xaa7733, 0x332200, { metalness: 0.6 }));
  coreR.rotation.z = Math.PI / 2;
  rotor.add(coreR);

  addPart(v, rotor, 'Rotor', 'Parte girante. No motor de indução, gira junto com o campo do estator.');
  scene.add(rotor);

  v.rotor = rotor;
  v.animatable.push((t) => {
    if (!v.isAnimating) return;
    rotor.rotation.x += 0.03;
  });

  cameraLook(v, 0, 0, 0, 7);
}

// ---- ELETRÔNICA ----
function buildEletronica(v) {
  clearScene(v);
  const { scene } = v;

  // placa Arduino
  const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.4), mat(0x008888, 0x002222));
  addPart(v, board, 'Arduino', 'Microcontrolador para prototipagem e controle.');
  scene.add(board);

  // chip
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.3), mat(0x111111, 0x000000));
  chip.position.set(-0.3, 0.13, 0);
  addPart(v, chip, 'Microcontrolador', 'Cérebro do Arduino — executa o programa.');
  scene.add(chip);

  // pinos
  const pinMat = mat(0xffd23f, 0x332200, { metalness: 0.8 });
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.06), pinMat);
    p.position.set(0.7, 0.2, -0.55 + i * 0.15);
    if (i === 0) addPart(v, p, 'Pinos de I/O', 'Entradas e saídas digitais/analógicas.');
    scene.add(p);
  }

  // sensor
  const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), mat(0xaa2222, 0x330000));
  sensor.position.set(2, 0.15, 0);
  addPart(v, sensor, 'Sensor', 'Converte uma grandeza física em sinal elétrico.');
  scene.add(sensor);

  // contator
  const contator = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.6), mat(0x333333, 0x111111));
  contator.position.set(-2.2, 0.45, 0);
  addPart(v, contator, 'Contator', 'Chave magnética para acionar cargas de potência.');
  scene.add(contator);

  cameraLook(v, 0, 0, 0, 7);
}

// ---- RENOVÁVEL ----
function buildRenovavel(v) {
  clearScene(v);
  const { scene } = v;

  // sol
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 20), new THREE.MeshBasicMaterial({ color: 0xffd23f }));
  sun.position.set(-3, 3, 0);
  addPart(v, sun, 'Sol', 'Fonte de luz que gera a irradiação solar.');
  scene.add(sun);

  // painéis
  const panelMat = mat(0x113366, 0x001133, { metalness: 0.7, roughness: 0.2 });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.8), panelMat);
    p.position.set(-1 + i * 1.4, 1.2, 0);
    p.rotation.x = -0.4;
    if (i === 0) addPart(v, p, 'Painel solar', 'Converte luz em corrente contínua (efeito fotovoltaico).');
    scene.add(p);
  }

  // controlador de carga
  const ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.4), mat(0x444444, 0x111111));
  ctrl.position.set(2.5, 0, 0);
  addPart(v, ctrl, 'Controlador de carga', 'Regula a carga das baterias e protege contra sobrecarga.');
  scene.add(ctrl);

  // bateria
  const bat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.6), mat(0x222222, 0x000000));
  bat.position.set(2.5, -1.2, 0);
  addPart(v, bat, 'Banco de baterias', 'Armazena energia para uso noturno ou dias nublados.');
  scene.add(bat);

  // inversor
  const inv = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.5), mat(0x2255aa, 0x001133));
  inv.position.set(4, -0.5, 0);
  addPart(v, inv, 'Inversor', 'Converte CC em CA para alimentar a casa.');
  scene.add(inv);

  // casa
  const casa = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffcc88, 0x332211));
  casa.position.set(5.5, -0.5, 0);
  addPart(v, casa, 'Residência', 'Consome a energia gerada.');
  scene.add(casa);

  // raios de luz animados
  v.rays = [];
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.5, 6), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.6 }));
    r.position.set(-2.4 + i * 0.4, 1.8, 0.3);
    r.rotation.z = 0.4;
    scene.add(r);
    v.rays.push(r);
  }

  v.animatable.push((t) => {
    if (!v.isAnimating) return;
    v.rays.forEach((r, i) => {
      r.material.opacity = 0.3 + Math.abs(Math.sin(t * 2 + i)) * 0.5;
    });
  });

  cameraLook(v, 1, 0, 0, 10);
}

// ---------- utilitários ----------
function clearScene(v) {
  // remove tudo exceto luzes e grid
  const keep = new Set();
  v.scene.traverse((o) => {
    if (o.isLight || o.type === 'GridHelper') keep.add(o);
  });
  const toRemove = [];
  v.scene.children.forEach((c) => {
    if (!keep.has(c)) toRemove.push(c);
  });
  toRemove.forEach((c) => v.scene.remove(c));
  v.parts = [];
  v.animatable = [];
  v.electrons = null;
  v.rotor = null;
}

// ---------- inicialização ----------
export function initAllViewers() {
  // fundamentos
  const vFund = createViewer('scene-fundamentos');
  if (vFund) { buildFundamentos(vFund); runLoop(vFund); }

  // componentes
  const vComp = createViewer('scene-componentes');
  if (vComp) {
    buildComponente(vComp, 'resistor');
    runLoop(vComp);
    vComp.rebuild = (tipo) => buildComponente(vComp, tipo);
  }

  // instalacoes
  const vInst = createViewer('scene-instalacoes');
  if (vInst) { buildInstalacoes(vInst); runLoop(vInst); }

  // geracao
  const vGer = createViewer('scene-geracao');
  if (vGer) { buildGeracao(vGer); runLoop(vGer); }

  // transmissao
  const vTrans = createViewer('scene-transmissao');
  if (vTrans) { buildTransmissao(vTrans); runLoop(vTrans); }

  // maquinas
  const vMaq = createViewer('scene-maquinas');
  if (vMaq) { buildMaquinas(vMaq); runLoop(vMaq); }

  // eletronica
  const vEle = createViewer('scene-eletronica');
  if (vEle) { buildEletronica(vEle); runLoop(vEle); }

  // renovavel
  const vRen = createViewer('scene-renovavel');
  if (vRen) { buildRenovavel(vRen); runLoop(vRen); }

  // integração com UI: abas, botões
  setupUI();
}

function runLoop(viewer) {
  function tick() {
    const t = viewer.clock.getElapsedTime();
    viewer.controls.update();
    viewer.animatable.forEach((fn) => {
      try { fn(t); } catch (e) { /* ignore */ }
    });
    viewer.renderer.render(viewer.scene, viewer.camera);
    requestAnimationFrame(tick);
  }
  tick();
}

function setupUI() {
  // Abas de componentes
  const tabs = document.querySelectorAll('#componentTabs .tab');
  const vComp = viewers['scene-componentes'];

  const info = {
    resistor: {
      title: 'Resistor',
      desc: 'Limita a corrente elétrica em um circuito, convertendo energia em calor.',
      facts: [
        'Unidade: Ohm (Ω)',
        'Fórmula: V = R · I',
        'Faixas coloridas indicam o valor',
        'Aplicações: divisores de tensão, proteção, polarização',
        'Riscos: superaquecimento se ultrapassar a potência nominal',
      ],
    },
    capacitor: {
      title: 'Capacitor',
      desc: 'Armazena carga elétrica e energia em um campo elétrico.',
      facts: [
        'Unidade: Farad (F)',
        'Q = C · V',
        'Armazena energia: E = ½·C·V²',
        'Aplicações: filtros, partida de motores, acoplamento',
        'Cuidado: pode reter carga após desligar a fonte',
      ],
    },
    indutor: {
      title: 'Indutor',
      desc: 'Armazena energia em campo magnético e se opõe a variações de corrente.',
      facts: [
        'Unidade: Henry (H)',
        'V = L · di/dt',
        'Aplicações: filtros, transformadores, motores',
        'Riscos: picos de tensão ao desligar (use diodo de roda livre)',
      ],
    },
    diodo: {
      title: 'Diodo',
      desc: 'Permite a passagem de corrente em apenas um sentido.',
      facts: [
        'Queda típica: 0,6 a 0,7 V (silício)',
        'Ânodo → Cátodo (sentido permitido)',
        'Aplicações: retificação, proteção contra inversão de polaridade',
        'Risco: ultrapassar tensão inversa ou corrente direta',
      ],
    },
    led: {
      title: 'LED',
      desc: 'Diodo emissor de luz que converte corrente em luz visível.',
      facts: [
        'Precisa de resistor limitador em série',
        'Queda de tensão depende da cor',
        'Aplicações: iluminação, sinalização, displays',
        'Risco: queima se não houver resistor adequado',
      ],
    },
    transistor: {
      title: 'Transistor',
      desc: 'Componente semicondutor que amplifica ou chaveia sinais.',
      facts: [
        'Terminais: base, coletor, emissor (BJT)',
        'Atua como amplificador ou chave',
        'Aplicações: eletrônica, automação, computadores',
        'Base de toda a eletrônica moderna',
      ],
    },
    fusivel: {
      title: 'Fusível',
      desc: 'Protege o circuito ao derreter quando a corrente excede o valor nominal.',
      facts: [
        'Escolhido pela corrente nominal',
        'Uso único: precisa ser substituído',
        'Nunca troque por valor maior sem corrigir a causa',
        'Aplicações: proteção de aparelhos e circuitos',
      ],
    },
    disjuntor: {
      title: 'Disjuntor',
      desc: 'Protege o circuito contra sobrecarga e curto-circuito, podendo ser rearmado.',
      facts: [
        'Curvas B, C e D (sensibilidade)',
        'Rearmável (diferente do fusível)',
        'Dimensionado pela bitola e carga',
        'Aplicações: instalações prediais, industriais',
      ],
    },
    rele: {
      title: 'Relé',
      desc: 'Chave eletromecânica acionada por uma bobina, isola o circuito de comando da carga.',
      facts: [
        'Permite controlar grandes cargas com sinais fracos',
        'Pode ser de estado sólido (SSR)',
        'Aplicações: automação, proteção, intertravamento',
        'Risco: desgaste dos contatos ao longo do tempo',
      ],
    },
    interruptor: {
      title: 'Interruptor',
      desc: 'Abre ou fecha um circuito para ligar/desligar cargas.',
      facts: [
        'Simples, paralelo (three-way), intermediário',
        'Aplicações: iluminação, comando de equipamentos',
        'Deve ser compatível com a corrente da carga',
      ],
    },
    tomada: {
      title: 'Tomada',
      desc: 'Ponto de conexão que fornece energia a aparelhos elétricos.',
      facts: [
        'Padrão brasileiro: 3 pinos (NBR 14136)',
        'Fase, neutro e terra',
        'Aplicações residenciais e comerciais',
        'Risco: sobrecarga de benjamins e tomadas danificadas',
      ],
    },
    bateria: {
      title: 'Bateria',
      desc: 'Fonte de corrente contínua que armazena energia química.',
      facts: [
        'Tensão nominal depende da química',
        'Capacidade medida em Ah',
        'Aplicações: veículos, sistemas off-grid, eletrônicos',
        'Descarte: nunca no lixo comum',
      ],
    },
    fonte: {
      title: 'Fonte de Alimentação',
      desc: 'Converte energia de uma forma para outra, fornecendo tensão adequada.',
      facts: [
        'Linear ou chaveada',
        'Aplicações: eletrônica, carregadores, iluminação',
        'Especificações: tensão, corrente e potência de saída',
      ],
    },
    transformador: {
      title: 'Transformador',
      desc: 'Altera a tensão por indução entre duas bobinas com relação de espiras.',
      facts: [
        'V2/V1 = N2/N1',
        'Só funciona em corrente alternada',
        'Aplicações: transmissão, fontes, isolamento',
        'Eleva ou abaixa a tensão sem alterar a frequência',
      ],
    },
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const tipo = tab.dataset.model;
      if (vComp && vComp.rebuild) {
        vComp.rebuild(tipo);
        vComp.isAnimating = false;
      }
      const d = info[tipo];
      if (d) {
        document.getElementById('compTitle').textContent = d.title;
        document.getElementById('compDesc').textContent = d.desc;
        const facts = document.getElementById('compFacts');
        facts.innerHTML = d.facts.map((f) => `<li>${f}</li>`).join('');
      }
    });
  });

  // Botões animação / reset
  document.querySelectorAll('[data-anim="toggle"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sceneKey = btn.dataset.scene;
      const v = viewers['scene-' + sceneKey];
      if (!v) return;
      v.isAnimating = !v.isAnimating;
      btn.textContent = v.isAnimating ? '⏸ Pausar' : '▶ Animar';
    });
  });

  document.querySelectorAll('[data-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sceneKey = btn.dataset.reset;
      const v = viewers['scene-' + sceneKey];
      if (!v) return;
      v.camera.position.set(4, 3, 6);
      v.controls.target.set(0, 0, 0);
      v.controls.update();
    });
  });
}
