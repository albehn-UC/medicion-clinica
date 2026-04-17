<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reporte Longitudinal — PersonalidadSana</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>
<style>
/* ─── Reset & base ─── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1a1a1a;
  background: #f8f7f4;
  padding: 1.5rem;
}
@media print {
  body { background: white; padding: 0; }
  .no-print { display: none; }
}

/* ─── Layout ─── */
.report { max-width: 860px; margin: 0 auto; }
.hdr {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 12px; padding-bottom: 1rem;
  border-bottom: 1px solid #e5e3db; margin-bottom: 1.5rem; flex-wrap: wrap;
}
.hdr-title { font-size: 20px; font-weight: 500; }
.hdr-sub { font-size: 12px; color: #888780; margin-top: 3px; }
.badges { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 6px; }
.badge {
  font-size: 11px; padding: 3px 9px; border-radius: 20px; font-weight: 500;
  background: #e6f1fb; color: #0c447c;
}
.badge.pending { background: #f1efe8; color: #888780; }

.sec { margin-bottom: 2rem; }
.sec-title {
  font-size: 11px; font-weight: 500; color: #888780;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: 0.75rem; display: flex; align-items: center; gap: 8px;
}
.sec-title::after { content: ''; flex: 1; height: 1px; background: #e5e3db; }

/* ─── Sospecha sintomática ─── */
.sos-legend { display: flex; gap: 12px; font-size: 11px; color: #888780; margin-bottom: 0.6rem; flex-wrap: wrap; }
.sos-legend span { display: flex; align-items: center; gap: 4px; }
.dot-sml { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
.sos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
.sos-card {
  background: white; border: 0.5px solid #e5e3db;
  border-radius: 8px; padding: 8px 10px;
}
.sos-name { font-size: 11px; font-weight: 500; color: #1a1a1a; margin-bottom: 6px; }
.dot-track { display: flex; flex-direction: column; gap: 3px; }
.dot-row { display: flex; align-items: center; gap: 5px; }
.dot-t { font-size: 10px; color: #888780; width: 16px; flex-shrink: 0; }
.dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.dot-pos { background: #534AB7; }
.dot-neg { background: #97C459; border: 1px solid #639922; }
.dot-null { background: #d3d1c7; }
.dot-lbl { font-size: 10px; }
.dot-lbl-pos { color: #3C3489; }
.dot-lbl-neg { color: #3B6D11; }
.dot-lbl-null { color: #b4b2a9; }

/* ─── Charts row ─── */
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media (max-width: 560px) { .charts-row { grid-template-columns: 1fr; } }
.chart-block {
  background: white; border: 0.5px solid #e5e3db;
  border-radius: 12px; padding: 1rem;
}
.block-title { font-size: 12px; font-weight: 500; color: #1a1a1a; margin-bottom: 6px; }
.mini-legend { display: flex; flex-wrap: wrap; gap: 10px; font-size: 11px; color: #888780; margin-bottom: 6px; }
.mini-legend span { display: flex; align-items: center; gap: 4px; }
.ld { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
.ldc { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.chart-wrap { position: relative; width: 100%; }

/* ─── IPO placeholder ─── */
.ipo-placeholder {
  background: #f1efe8; border-radius: 8px;
  padding: 1.25rem; text-align: center; grid-column: 1 / -1;
}
.ipo-placeholder p:first-child { font-size: 12px; font-weight: 500; margin-bottom: 4px; }
.ipo-placeholder p:last-child { font-size: 11px; color: #888780; }

/* ─── Footer ─── */
.foot {
  font-size: 11px; color: #888780;
  padding-top: 0.75rem; border-top: 1px solid #e5e3db; margin-top: 0.5rem;
}
</style>
</head>
<body>

<div class="report" id="report">
  <div class="hdr">
    <div>
      <p class="hdr-title">Paciente <span id="patientId"></span></p>
      <p class="hdr-sub">Reporte longitudinal · Medición clínica · PersonalidadSana SpA</p>
      <div class="badges" id="momentBadges"></div>
    </div>
    <button class="no-print" onclick="window.print()" style="font-size:12px;padding:6px 14px;border:0.5px solid #d3d1c7;border-radius:8px;background:white;cursor:pointer;">
      Imprimir / PDF
    </button>
  </div>

  <!-- 1. SOSPECHA SINTOMÁTICA -->
  <div class="sec">
    <div class="sec-title">Evaluación sintomática</div>
    <div class="sos-legend">
      <span><span class="dot-sml dot-pos"></span>Positiva</span>
      <span><span class="dot-sml dot-neg"></span>Negativa</span>
      <span><span class="dot-sml dot-null"></span>Sin dato</span>
    </div>
    <div class="sos-grid" id="sosGrid"></div>
  </div>

  <!-- 2. PHQ-9 -->
  <div class="sec">
    <div class="sec-title">PHQ-9</div>
    <div class="mini-legend">
      <span><span class="ld" style="background:#378ADD"></span>Puntaje total</span>
      <span><span class="ldc" style="background:#E24B4A"></span>Con alerta suicida</span>
      <span><span class="ldc" style="background:#97C459;border:1px solid #639922"></span>Sin alerta</span>
    </div>
    <div class="chart-wrap" style="height:160px">
      <canvas id="phqC" role="img" aria-label="PHQ-9 evolución longitudinal">PHQ-9 longitudinal.</canvas>
    </div>
  </div>

  <!-- 3. LPFS + PID-5 -->
  <div class="charts-row sec">
    <div class="chart-block">
      <div class="block-title">LPFS — funcionamiento de personalidad</div>
      <div class="mini-legend">
        <span><span class="ld" style="background:#534AB7"></span>Self</span>
        <span><span class="ld" style="background:#D85A30"></span>Interpersonal</span>
      </div>
      <div class="chart-wrap" style="height:190px">
        <canvas id="lpfsC" role="img" aria-label="LPFS Self e Interpersonal longitudinal">LPFS.</canvas>
      </div>
    </div>
    <div class="chart-block">
      <div class="block-title">PID-5 — rasgos patológicos</div>
      <div class="mini-legend" id="pid5Legend"></div>
      <div class="chart-wrap" style="height:190px">
        <canvas id="pid5C" role="img" aria-label="PID-5 spider por categoría">PID-5.</canvas>
      </div>
    </div>
  </div>

  <!-- 4. IPO -->
  <div class="sec">
    <div class="sec-title">IPO — organización de personalidad</div>
    <div class="mini-legend">
      <span><span class="ld" style="background:#E24B4A"></span>Clínico</span>
      <span><span class="ld" style="background:#EF9F27"></span>Sub-umbral</span>
      <span><span class="ld" style="background:#97C459;border:1px solid #639922"></span>Normal</span>
    </div>
    <div class="charts-row" id="ipoArea"></div>
  </div>

  <p class="foot" id="footText"></p>
</div>

<script>
/* ═══════════════════════════════════════════════
   DATOS DEL PACIENTE
   Para cambiar paciente: editar este objeto o
   cargarlo desde data/patient_ID.js
   ═══════════════════════════════════════════════ */
const PATIENT = {
  id: 'JP',
  momentos: [
    { label: 'Ingreso',  tp: 0,  active: true  },
    { label: '3 meses',  tp: 3,  active: true  },
    { label: '6 meses',  tp: 6,  active: true  },
    { label: '9 meses',  tp: 9,  active: false },
    { label: '12 meses', tp: 12, active: false },
  ],
  sospecha: {
    'Depresión':    [1, 1, 1, null, null],
    'Rabia':        [1, 1, 0, null, null],
    'Hipomanía':    [1, 1, 1, null, null],
    'Ansiedad':     [1, 1, 1, null, null],
    'Somático':     [1, 1, 1, null, null],
    'Autolesiones': [1, 1, 1, null, null],
    'Psicosis':     [1, 1, 1, null, null],
    'Sueño':        [1, 1, 0, null, null],
    'Memoria':      [1, 1, 0, null, null],
    'Repetitivo':   [1, 1, 1, null, null],
    'Disociación':  [1, 1, 0, null, null],
    'Personalidad': [1, 1, 0, null, null],
    'Sustancias':   [1, 1, 1, null, null],
    'Alimentaria':  [1, 1, 0, null, null],
  },
  phq: {
    total:  [27, 9, 5, null, null],
    alerta: [1,  1, 0, null, null],
    nivel:  ['Clínico', 'Sin indicador', 'Sin indicador', null, null],
  },
  lpfs: {
    self:               [30, 18, 10, null, null],
    interpersonal:      [30, 18, 14, null, null],
    selfNivel:          ['Det. Clínico', 'Det. Clínico', 'Saludable', null, null],
    interpersonalNivel: ['Det. Clínico', 'Det. Clínico', 'Det. Leve', null, null],
  },
  pid5: {
    labels: ['Af. Negativo', 'Desapego', 'Antagonismo', 'Desinhibición', 'Anancastia', 'Psicoticismo'],
    // 1 = Clínico (≥2), 0 = Normal (0-1), null = sin dato
    cats: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
    ]
  },
  ipo: {
    labels: ['Def. Primitivas', 'Difusión Id.', 'Exam. Realidad', 'Valores Mor.', 'Agresión'],
    // 'Clinico' | 'Sub-umbral' | 'Normal' | null
    cats: [
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
    ]
  }
};

/* ═══════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════ */
const SERIES_COLORS = ['#534AB7', '#1D9E75', '#D85A30', '#BA7517', '#185FA5'];
const SERIES_DASH   = [[], [4, 3], [2, 2], [6, 2], [3, 3]];

const activeMoments = PATIENT.momentos.filter(m => m.active);
const activeIdx     = PATIENT.momentos.map((m, i) => m.active ? i : -1).filter(i => i >= 0);
const tLabels       = activeMoments.map(m => m.label);
const tShort        = activeMoments.map(m => m.label.split(' ')[0]);

function activeVals(arr) { return activeIdx.map(i => arr[i] ?? null); }

const catNum = { 'Clinico': 3, 'Sub-umbral': 2, 'Normal': 1 };
const catFill = { 'Clinico': '#E24B4A55', 'Sub-umbral': '#EF9F2755', 'Normal': '#97C45955' };
const catBorder = { 'Clinico': '#A32D2D', 'Sub-umbral': '#BA7517', 'Normal': '#3B6D11' };

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } }
};

/* ═══════════════════════════════════════════════
   HEADER
   ═══════════════════════════════════════════════ */
document.getElementById('patientId').textContent = PATIENT.id;
document.getElementById('momentBadges').innerHTML =
  PATIENT.momentos.map(m =>
    `<span class="badge ${m.active ? '' : 'pending'}">${m.label}</span>`
  ).join('');
document.getElementById('footText').textContent =
  `Datos: ${PATIENT.id} · TP ${activeIdx.map(i => PATIENT.momentos[i].tp).join('/')} · PersonalidadSana SpA`;

/* ═══════════════════════════════════════════════
   SOSPECHA SINTOMÁTICA — dot plot vertical por tarjeta
   ═══════════════════════════════════════════════ */
const sosGrid = document.getElementById('sosGrid');
Object.entries(PATIENT.sospecha).forEach(([name, allVals]) => {
  const vals = activeVals(allVals);
  const rows = vals.map((v, ri) => {
    if (v === null) {
      return `<div class="dot-row">
        <span class="dot-t">${tShort[ri]}</span>
        <span class="dot dot-null"></span>
        <span class="dot-lbl dot-lbl-null">—</span>
      </div>`;
    }
    const pos = v === 1;
    return `<div class="dot-row">
      <span class="dot-t">${tShort[ri]}</span>
      <span class="dot ${pos ? 'dot-pos' : 'dot-neg'}"></span>
      <span class="dot-lbl ${pos ? 'dot-lbl-pos' : 'dot-lbl-neg'}">${pos ? 'Pos.' : 'Neg.'}</span>
    </div>`;
  }).join('');
  const card = document.createElement('div');
  card.className = 'sos-card';
  card.innerHTML = `<div class="sos-name">${name}</div><div class="dot-track">${rows}</div>`;
  sosGrid.appendChild(card);
});

/* ═══════════════════════════════════════════════
   PHQ-9
   ═══════════════════════════════════════════════ */
const phqTotal  = activeVals(PATIENT.phq.total);
const phqAlerta = activeVals(PATIENT.phq.alerta);

new Chart(document.getElementById('phqC'), {
  type: 'line',
  data: {
    labels: tLabels,
    datasets: [{
      label: 'PHQ-9',
      data: phqTotal,
      borderColor: '#378ADD',
      backgroundColor: '#378ADD12',
      fill: true,
      tension: 0.35,
      pointRadius: 9,
      pointBackgroundColor: phqAlerta.map(a => a === null ? '#d3d1c7' : a ? '#E24B4A' : '#97C459'),
      pointBorderColor:     phqAlerta.map(a => a === null ? '#b4b2a9' : a ? '#A32D2D' : '#3B6D11'),
      pointBorderWidth: 2,
      spanGaps: false
    }]
  },
  options: {
    ...baseOpts,
    scales: {
      y: { min: 0, max: 30, ticks: { stepSize: 5 }, grid: { color: 'rgba(0,0,0,0.06)' } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const a = phqAlerta[ctx.dataIndex];
        const nivel = activeVals(PATIENT.phq.nivel)[ctx.dataIndex];
        return [
          ` PHQ-9: ${ctx.raw}  (${nivel || '—'})`,
          ` ${a === null ? 'Sin dato' : a ? 'Alerta suicida activa' : 'Sin alerta suicida'}`
        ];
      }}}
    }
  }
});

/* ═══════════════════════════════════════════════
   LPFS — Self vs Interpersonal
   ═══════════════════════════════════════════════ */
new Chart(document.getElementById('lpfsC'), {
  type: 'line',
  data: {
    labels: tLabels,
    datasets: [
      {
        label: 'Self',
        data: activeVals(PATIENT.lpfs.self),
        borderColor: '#534AB7', backgroundColor: '#534AB712', fill: true,
        tension: 0.35, pointRadius: 5, pointBackgroundColor: '#534AB7',
        borderWidth: 2, spanGaps: false
      },
      {
        label: 'Interpersonal',
        data: activeVals(PATIENT.lpfs.interpersonal),
        borderColor: '#D85A30', backgroundColor: '#D85A3008', fill: true,
        tension: 0.35, pointRadius: 5, pointBackgroundColor: '#D85A30',
        borderWidth: 2, borderDash: [5, 3], spanGaps: false
      }
    ]
  },
  options: {
    ...baseOpts,
    scales: {
      y: { min: 0, max: 35, ticks: { stepSize: 5 }, grid: { color: 'rgba(0,0,0,0.06)' } },
      x: { grid: { display: false } }
    },
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const nivelArr = ctx.datasetIndex === 0
          ? PATIENT.lpfs.selfNivel
          : PATIENT.lpfs.interpersonalNivel;
        const nivel = activeVals(nivelArr)[ctx.dataIndex];
        return ` ${ctx.dataset.label}: ${ctx.raw}  (${nivel || '—'})`;
      }}}
    }
  }
});

/* ═══════════════════════════════════════════════
   PID-5 — spider por categorías, 3 momentos
   ═══════════════════════════════════════════════ */
const pid5Legend = document.getElementById('pid5Legend');
pid5Legend.innerHTML = activeMoments.map((m, ri) =>
  `<span><span class="ld" style="background:${SERIES_COLORS[ri]}44;border:1px solid ${SERIES_COLORS[ri]}"></span>${m.label}</span>`
).join('');

const pid5Datasets = activeMoments.map((m, ri) => {
  const cats = PATIENT.pid5.cats[activeIdx[ri]];
  return {
    label: m.label,
    data: cats.map(c => c === null ? null : c === 1 ? 2 : 1),
    backgroundColor: SERIES_COLORS[ri] + '2a',
    borderColor: SERIES_COLORS[ri],
    pointBackgroundColor: cats.map(c => c === 1 ? '#E24B4A' : c === 0 ? '#97C459' : '#d3d1c7'),
    pointBorderColor:     cats.map(c => c === 1 ? '#A32D2D' : c === 0 ? '#3B6D11' : '#b4b2a9'),
    pointRadius: 4,
    borderWidth: 2,
    borderDash: SERIES_DASH[ri],
    spanGaps: false
  };
});

new Chart(document.getElementById('pid5C'), {
  type: 'radar',
  data: { labels: PATIENT.pid5.labels, datasets: pid5Datasets },
  options: {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => {
        const cats = PATIENT.pid5.cats[activeIdx[ctx.datasetIndex]];
        const c = cats[ctx.dataIndex];
        return ` ${ctx.dataset.label}: ${c === 1 ? 'Clínico' : c === 0 ? 'Normal' : 'Sin dato'}`;
      }}}
    },
    scales: {
      r: {
        min: 0, max: 2,
        ticks: { display: false },
        pointLabels: { font: { size: 10 }, color: '#888780' },
        grid: { color: 'rgba(0,0,0,0.08)' },
        angleLines: { color: 'rgba(0,0,0,0.08)' }
      }
    }
  }
});

/* ═══════════════════════════════════════════════
   IPO — spider por categorías (Clínico / Sub-umbral / Normal)
   Si no hay datos: muestra placeholder
   ═══════════════════════════════════════════════ */
const ipoArea = document.getElementById('ipoArea');
const hasIpo = PATIENT.ipo.cats.some(row => activeIdx.some(i => row[i] !== null));

if (!hasIpo) {
  ipoArea.innerHTML = `<div class="ipo-placeholder">
    <p>Datos IPO pendientes</p>
    <p>Completar niveles (Clínico · Sub-umbral · Normal) para: DP · DI · ER · VM · AG en cada momento</p>
  </div>`;
} else {
  const ipoDatasets = activeMoments.map((m, ri) => {
    const cats = PATIENT.ipo.cats.map(row => row[activeIdx[ri]]);
    return {
      label: m.label,
      data: cats.map(c => catNum[c] ?? null),
      backgroundColor: SERIES_COLORS[ri] + '2a',
      borderColor: SERIES_COLORS[ri],
      pointBackgroundColor: cats.map(c => catFill[c]   || '#d3d1c7'),
      pointBorderColor:     cats.map(c => catBorder[c] || '#b4b2a9'),
      pointRadius: 4, borderWidth: 2,
      borderDash: SERIES_DASH[ri],
      spanGaps: false
    };
  });
  ipoArea.innerHTML = `<div style="position:relative;width:100%;height:240px;grid-column:1/-1">
    <canvas id="ipoC" role="img" aria-label="IPO subescalas por categoría">IPO organizacion personalidad.</canvas>
  </div>`;
  new Chart(document.getElementById('ipoC'), {
    type: 'radar',
    data: { labels: PATIENT.ipo.labels, datasets: ipoDatasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => {
          const cats = PATIENT.ipo.cats.map(row => row[activeIdx[ctx.datasetIndex]]);
          return ` ${ctx.dataset.label}: ${cats[ctx.dataIndex] || 'Sin dato'}`;
        }}}
      },
      scales: {
        r: {
          min: 0, max: 3,
          ticks: { stepSize: 1, callback: v => ['','Normal','Sub-umbral','Clínico'][v] || '', backdropColor: 'transparent', font: { size: 9 } },
          pointLabels: { font: { size: 10 }, color: '#888780' },
          grid: { color: 'rgba(0,0,0,0.08)' },
          angleLines: { color: 'rgba(0,0,0,0.08)' }
        }
      }
    }
  });
}
</script>
</body>
</html>
