// =====================================================
// Navegação: menu mobile, scroll spy e suavidade
// =====================================================
export function initNavigation() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('mainNav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach((a) =>
      a.addEventListener('click', () => nav.classList.remove('open'))
    );
  }

  // destaque do link da seção visível (opcional)
  const links = document.querySelectorAll('.main-nav a');
  const sections = [...links]
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            links.forEach((l) =>
              l.classList.toggle(
                'active',
                l.getAttribute('href') === '#' + en.target.id
              )
            );
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
  }
}
