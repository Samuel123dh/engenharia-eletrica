// =====================================================
// Glossário e Questionário (conteúdo educativo)
// =====================================================

const GLOSSARY = [
  { t: 'Tensão (V)', d: 'Diferença de potencial que impulsiona as cargas elétricas. Unidade: Volt.' },
  { t: 'Corrente (A)', d: 'Fluxo ordenado de cargas. Unidade: Ampère.' },
  { t: 'Resistência (Ω)', d: 'Oposição à passagem de corrente. Unidade: Ohm.' },
  { t: 'Potência (W)', d: 'Taxa de energia por unidade de tempo. P = V·I.' },
  { t: 'Energia (kWh)', d: 'Potência × tempo. 1 kWh = 1000 W por 1 hora.' },
  { t: 'Corrente contínua (CC)', d: 'Sentido constante, como em baterias.' },
  { t: 'Corrente alternada (CA)', d: 'Inverte periodicamente o sentido. Padrão residencial.' },
  { t: 'Frequência (Hz)', d: 'Ciclos por segundo. No Brasil, 60 Hz.' },
  { t: 'Curto-circuito', d: 'Contato direto entre condutores, gerando corrente altíssima.' },
  { t: 'Aterramento', d: 'Caminho seguro para correntes de falta, protege pessoas.' },
  { t: 'DR', d: 'Dispositivo Diferencial Residual: desliga com fuga de corrente.' },
  { t: 'DPS', d: 'Dispositivo de Proteção contra Surtos: desvia raios e picos.' },
  { t: 'NR-10', d: 'Norma brasileira de segurança em instalações elétricas.' },
  { t: 'EPI', d: 'Equipamento de Proteção Individual (luvas, óculos, calçado).' },
  { t: 'Desenergização', d: 'Processo de deixar a instalação sem tensão com segurança.' },
];

const QUIZ = [
  {
    q: 'Qual é a unidade de tensão elétrica?',
    opts: ['Ampère (A)', 'Volt (V)', 'Ohm (Ω)', 'Watt (W)'],
    a: 1,
  },
  {
    q: 'A Lei de Ohm relaciona tensão, corrente e resistência como:',
    opts: ['V = R / I', 'I = V · R', 'V = R · I', 'P = V · I'],
    a: 2,
  },
  {
    q: 'Em um circuito em série, a corrente é:',
    opts: ['Dividida entre os componentes', 'A mesma em todos', 'Zero', 'Dobrada'],
    a: 1,
  },
  {
    q: 'Qual dispositivo protege pessoas contra fuga de corrente?',
    opts: ['Disjuntor', 'Fusível', 'DR', 'DPS'],
    a: 2,
  },
  {
    q: 'A frequência da rede elétrica brasileira é:',
    opts: ['50 Hz', '60 Hz', '100 Hz', '127 Hz'],
    a: 1,
  },
  {
    q: 'Um transformador com N2 > N1 é:',
    opts: ['Abaixador de tensão', 'Elevador de tensão', 'Isolador', 'Inversor'],
    a: 1,
  },
  {
    q: 'A energia consumida de 1000 W por 1 hora equivale a:',
    opts: ['1 W', '1 kW', '1 kWh', '1000 kWh'],
    a: 2,
  },
  {
    q: 'Qual a fórmula da potência elétrica?',
    opts: ['P = V · I', 'P = V / I', 'P = I / V', 'P = R · I'],
    a: 0,
  },
  {
    q: 'Ao trabalhar com eletricidade, a primeira regra é:',
    opts: ['Trabalhar energizado', 'Desenergizar e bloquear', 'Usar apenas uma mão', 'Trabalhar sozinho'],
    a: 1,
  },
  {
    q: 'O DPS protege contra:',
    opts: ['Sobrecarga lenta', 'Surtos de tensão', 'Corrente contínua', 'Curto-circuito apenas'],
    a: 1,
  },
];

export function initGlossary() {
  const grid = document.getElementById('glossaryGrid');
  if (!grid) return;
  grid.innerHTML = GLOSSARY.map(
    (g) => `<div class="card tech-card"><h3>${g.t}</h3><p>${g.d}</p></div>`
  ).join('');
}

export function initQuiz() {
  const qEl = document.getElementById('quizQuestion');
  const optsEl = document.getElementById('quizOptions');
  const nextBtn = document.getElementById('quizNext');
  const scoreEl = document.getElementById('quizScore');
  if (!qEl) return;

  let idx = 0;
  let score = 0;
  let answered = false;

  function render() {
    if (idx >= QUIZ.length) {
      qEl.textContent = '🎉 Quiz concluído!';
      optsEl.innerHTML = '';
      nextBtn.disabled = true;
      scoreEl.textContent = `Acertos: ${score} / ${QUIZ.length}`;
      return;
    }
    answered = false;
    const q = QUIZ[idx];
    qEl.textContent = `(${idx + 1}/${QUIZ.length}) ${q.q}`;
    optsEl.innerHTML = '';
    q.opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.textContent = o;
      b.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        if (i === q.a) {
          b.classList.add('correct');
          score++;
        } else {
          b.classList.add('wrong');
          optsEl.querySelectorAll('button')[q.a].classList.add('correct');
        }
        nextBtn.disabled = false;
        nextBtn.textContent = idx === QUIZ.length - 1 ? 'Ver resultado' : 'Próxima';
      });
      optsEl.appendChild(b);
    });
    nextBtn.textContent = 'Próxima';
    nextBtn.disabled = true;
  }

  nextBtn.addEventListener('click', () => {
    idx++;
    render();
  });

  render();
}
