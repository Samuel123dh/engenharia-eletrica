// =====================================================
// ELECTRIC 3D — Ponto de entrada
// =====================================================
import { initHeroScene } from './scene3d.js';
import { initAllViewers } from './models.js';
import { initNavigation } from './navigation.js';
import { initSimulators } from './simulators.js';
import { initQuiz, initGlossary } from './safety.js';

document.addEventListener('DOMContentLoaded', () => {
  // 3D
  initHeroScene('heroCanvas');
  initAllViewers();

  // Interface
  initNavigation();
  initSimulators();
  initGlossary();
  initQuiz();

  console.log('%c⚡ ELECTRIC 3D carregado', 'color:#00e5ff;font-weight:bold;font-size:14px');
});
