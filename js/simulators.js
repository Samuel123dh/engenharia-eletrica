// =====================================================
// Simuladores — cálculos reais
// =====================================================
export function initSimulators() {
  // ---- Lei de Ohm ----
  const ohmV = document.getElementById('ohmV');
  const ohmR = document.getElementById('ohmR');
  const ohmVo = document.getElementById('ohmVout');
  const ohmRo = document.getElementById('ohmRout');
  const ohmRes = document.getElementById('ohmResult');

  function calcOhm() {
    const V = parseFloat(ohmV.value);
    const R = parseFloat(ohmR.value);
    const I = V / R;
    ohmVo.textContent = V;
    ohmRo.textContent = R;
    ohmRes.textContent = `I = ${I.toFixed(2)} A  (V=${V} V ÷ R=${R} Ω)`;
  }
  if (ohmV) { ohmV.addEventListener('input', calcOhm); ohmR.addEventListener('input', calcOhm); calcOhm(); }

  // ---- Potência ----
  const powV = document.getElementById('powV');
  const powI = document.getElementById('powI');
  const powVo = document.getElementById('powVout');
  const powIo = document.getElementById('powIout');
  const powRes = document.getElementById('powResult');

  function calcPow() {
    const V = parseFloat(powV.value);
    const I = parseFloat(powI.value);
    const P = V * I;
    powVo.textContent = V;
    powIo.textContent = I.toFixed(1);
    powRes.textContent = `P = ${P.toFixed(1)} W  (V=${V} V × I=${I.toFixed(1)} A)`;
  }
  if (powV) { powV.addEventListener('input', calcPow); powI.addEventListener('input', calcPow); calcPow(); }

  // ---- Série ----
  let serieResistores = [10];
  const serieList = document.getElementById('serieList');
  const serieResult = document.getElementById('serieResult');

  function renderSerie() {
    serieList.textContent = serieResistores.map((r) => r + ' Ω').join(' + ');
    const Req = serieResistores.reduce((a, b) => a + b, 0);
    const I = 12 / Req;
    serieResult.textContent = `R_eq = ${Req.toFixed(1)} Ω · I = ${I.toFixed(2)} A`;
  }
  document.getElementById('addSerie')?.addEventListener('click', () => {
    if (serieResistores.length < 6) {
      serieResistores.push(10 * serieResistores.length + 10);
      renderSerie();
    }
  });
  document.getElementById('remSerie')?.addEventListener('click', () => {
    if (serieResistores.length > 1) { serieResistores.pop(); renderSerie(); }
  });
  renderSerie();

  // ---- Paralelo ----
  let paraleloResistores = [10];
  const paraleloList = document.getElementById('paraleloList');
  const paraleloResult = document.getElementById('paraleloResult');

  function renderParalelo() {
    paraleloList.textContent = paraleloResistores.map((r) => r + ' Ω').join(' ∥ ');
    const inv = paraleloResistores.reduce((a, r) => a + 1 / r, 0);
    const Req = inv > 0 ? 1 / inv : 0;
    const Itot = 12 / Req;
    paraleloResult.textContent = `R_eq = ${Req.toFixed(2)} Ω · I_total = ${Itot.toFixed(2)} A`;
  }
  document.getElementById('addParalelo')?.addEventListener('click', () => {
    if (paraleloResistores.length < 6) {
      paraleloResistores.push(10 * paraleloResistores.length + 10);
      renderParalelo();
    }
  });
  document.getElementById('remParalelo')?.addEventListener('click', () => {
    if (paraleloResistores.length > 1) { paraleloResistores.pop(); renderParalelo(); }
  });
  renderParalelo();

  // ---- Transformador ----
  const trV1 = document.getElementById('trV1');
  const trN1 = document.getElementById('trN1');
  const trN2 = document.getElementById('trN2');
  const trResult = document.getElementById('trResult');

  function calcTr() {
    const V1 = parseFloat(trV1.value) || 0;
    const N1 = parseFloat(trN1.value) || 1;
    const N2 = parseFloat(trN2.value) || 1;
    const V2 = V1 * (N2 / N1);
    const tipo = N2 > N1 ? 'elevador' : N2 < N1 ? 'abaixador' : 'isolador';
    trResult.textContent = `V2 = ${V2.toFixed(1)} V · Transformador ${tipo}`;
  }
  document.getElementById('trCalc')?.addEventListener('click', calcTr);
  if (trV1) calcTr();

  // ---- Energia residencial ----
  const resP = document.getElementById('resP');
  const resH = document.getElementById('resH');
  const resD = document.getElementById('resD');
  const resT = document.getElementById('resT');
  const resResult = document.getElementById('resResult');

  function calcRes() {
    const P = parseFloat(resP.value) || 0;
    const h = parseFloat(resH.value) || 0;
    const d = parseFloat(resD.value) || 0;
    const t = parseFloat(resT.value) || 0;
    const E = (P * h * d) / 1000; // kWh/mês
    const custo = E * t;
    resResult.textContent = `E = ${E.toFixed(2)} kWh/mês · Custo ≈ R$ ${custo.toFixed(2)}`;
  }
  document.getElementById('resCalc')?.addEventListener('click', calcRes);
  if (resP) calcRes();

  // ---- Solar ----
  const solP = document.getElementById('solP');
  const solH = document.getElementById('solH');
  const solN = document.getElementById('solN');
  const solResult = document.getElementById('solResult');

  function calcSol() {
    const P = parseFloat(solP.value) || 0;
    const H = parseFloat(solH.value) || 0;
    const N = parseFloat(solN.value) || 0;
    const E = (P * H * N) / 1000; // kWh/dia
    const Emes = E * 30;
    solResult.textContent = `E = ${E.toFixed(2)} kWh/dia · ${Emes.toFixed(1)} kWh/mês`;
  }
  document.getElementById('solCalc')?.addEventListener('click', calcSol);
  if (solP) calcSol();
}
