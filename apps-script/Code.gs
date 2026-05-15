// ═══════════════════════════════════════════════════════════════════════
// Sistema de Medición Clínica Longitudinal
// Dr. Alex Behn · MIDAP · Pontificia Universidad Católica de Chile
// Apps Script v1.0 — Receptor de formulario → Google Sheets
//
// ⚠️  NOTA DSM-5: el formulario actual tiene 17 ítems en 13 dominios
//     (DSM-5 Cross-Cutting Level 1, versión adultos abreviada).
//     El proyecto prevé 25 ítems / 14 dominios (versión completa).
//     Si se amplía el formulario, actualizar DSM5_DOMINIOS abajo.
//
// ⚠️  NOTA PID-5: el formulario usa la versión Breve (25 ítems, 5 dominios).
//     Scoring: media por dominio ≥ 2.0 = Clínico (Krueger et al., 2012).
//
// Instrucciones de despliegue:
//   1. Reemplazar SHEET_ID con el ID de tu Google Sheet (ver URL de la hoja)
//   2. Desplegar → Nueva implementación → Aplicación web
//      · Ejecutar como: Yo
//      · Quién tiene acceso: Cualquier usuario
//   3. Copiar la URL /exec → pegar en GOOGLE_SCRIPT_URL de Medicion.html
// ═══════════════════════════════════════════════════════════════════════

// ─── CONFIGURACIÓN ──────────────────────────────────────────────────────
const SHEET_ID   = '1qdanTvuqgUKfAs2w-Au17muI8fE0vujjcYvQ8n9ATjo';
const SHEET_NAME = 'Respuestas';
const LOG_NAME   = 'Log_errores';

// ─── DSM-5 CROSS-CUTTING LEVEL 1 · Dominios y umbrales ─────────────────
// 17 ítems / 13 dominios tal como está implementado en Medicion.html
// Umbral: puntaje mínimo en al menos 1 ítem para sospecha positiva
const DSM5_DOMINIOS = [
  { col: 'sospecha_depresion',    items: [1, 2],       umbral: 2 },
  { col: 'sospecha_rabia',        items: [3],           umbral: 2 },
  { col: 'sospecha_hipomania',    items: [4, 5],        umbral: 2 },
  { col: 'sospecha_ansiedad',     items: [6, 7],        umbral: 2 },
  { col: 'sospecha_somatico',     items: [8],           umbral: 2 },
  { col: 'sospecha_disociacion',  items: [9],           umbral: 2 },
  { col: 'sospecha_funcionalidad',items: [10],          umbral: 2 },
  { col: 'sospecha_somatico2',    items: [11],          umbral: 2 },
  { col: 'sospecha_sustancias',   items: [12, 13],      umbral: 2 },
  { col: 'sospecha_psiquico',     items: [14],          umbral: 2 },
  { col: 'sospecha_memoria',      items: [15],          umbral: 2 },
  { col: 'sospecha_psicosis',     items: [16],          umbral: 1 }, // umbral 1 = alta prioridad
  { col: 'sospecha_yo',           items: [17],          umbral: 2 },
];

// ─── IPO-83 · Subescalas, ítems y máximos ───────────────────────────────
// Umbrales de clasificación: validación chilena (Behn et al.)
// Scoring: % = (suma de ítems / max) × 100
const IPO_ESCALAS = {
  DP: { items: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16], max: 80 },
  DI: { items: [17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37], max: 105 },
  ER: { items: [38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57], max: 100 },
  VM: { items: [6,14,17,76,77,78,79,80,81,82,83], max: 55 },
  AG: { items: [58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75], max: 90 },
};

const IPO_UMBRALES = {
  DP: { normal: 42.3, clinico: 64.7 },
  DI: { normal: 42.8, clinico: 60.6 },
  ER: { normal: 32.0, clinico: 54.0 },
  VM: { normal: 40.3, clinico: 55.2 },
  AG: { normal: 27.0, clinico: 39.3 },
};

// ─── COLUMNAS (orden canónico de la hoja) ───────────────────────────────
const COLUMNAS = [
  // Metadatos
  'timestamp', 'ID_Pac', 'TP', 'MES', 'momento_label',

  // DSM-5 Cross-Cutting (17 ítems)
  'dsm_1','dsm_2','dsm_3','dsm_4','dsm_5','dsm_6','dsm_7','dsm_8','dsm_9',
  'dsm_10','dsm_11','dsm_12','dsm_13','dsm_14','dsm_15','dsm_16','dsm_17',
  // DSM-5 sospechas por dominio (calculadas en Apps Script)
  'sospecha_depresion','sospecha_rabia','sospecha_hipomania','sospecha_ansiedad',
  'sospecha_somatico','sospecha_disociacion','sospecha_funcionalidad','sospecha_somatico2',
  'sospecha_sustancias','sospecha_psiquico','sospecha_memoria','sospecha_psicosis',
  'sospecha_yo',
  // Score total DSM-5 (calculado en formulario)
  'score_DSM5_total',

  // PHQ-9 (9 ítems + scores)
  'phq_1','phq_2','phq_3','phq_4','phq_5','phq_6','phq_7','phq_8','phq_9',
  'score_PHQ9_total', 'score_PHQ9_nivel', 'alerta_suicida',

  // LPFS-BF 2.0 (12 ítems + subescalas + Self/Interpersonal calculados)
  'lpfs_1','lpfs_2','lpfs_3','lpfs_4','lpfs_5','lpfs_6',
  'lpfs_7','lpfs_8','lpfs_9','lpfs_10','lpfs_11','lpfs_12',
  'score_LPFS_Identidad', 'score_LPFS_Autodireccion',
  'score_LPFS_Empatia',   'score_LPFS_Intimidad', 'score_LPFS_total',
  'score_LPFS_Self',      'score_LPFS_Self_nivel',
  'score_LPFS_Interpersonal', 'score_LPFS_Interpersonal_nivel',
  'score_LPFS_total_nivel',

  // PID-5 Breve (25 ítems, 5 dominios × score + nivel)
  'pid_1','pid_2','pid_3','pid_4','pid_5',
  'pid_6','pid_7','pid_8','pid_9','pid_10',
  'pid_11','pid_12','pid_13','pid_14','pid_15',
  'pid_16','pid_17','pid_18','pid_19','pid_20',
  'pid_21','pid_22','pid_23','pid_24','pid_25',
  'score_PID5_AfectoNeg_media',    'score_PID5_AfectoNeg_nivel',
  'score_PID5_Distanciamiento_media','score_PID5_Distanciamiento_nivel',
  'score_PID5_Antagonismo_media',  'score_PID5_Antagonismo_nivel',
  'score_PID5_Desinhibicion_media','score_PID5_Desinhibicion_nivel',
  'score_PID5_Psicoticismo_media', 'score_PID5_Psicoticismo_nivel',

  // IPO-83 (83 ítems + total + 5 subescalas × pct + nivel)
  'ipo_1','ipo_2','ipo_3','ipo_4','ipo_5','ipo_6','ipo_7','ipo_8','ipo_9','ipo_10',
  'ipo_11','ipo_12','ipo_13','ipo_14','ipo_15','ipo_16','ipo_17','ipo_18','ipo_19','ipo_20',
  'ipo_21','ipo_22','ipo_23','ipo_24','ipo_25','ipo_26','ipo_27','ipo_28','ipo_29','ipo_30',
  'ipo_31','ipo_32','ipo_33','ipo_34','ipo_35','ipo_36','ipo_37','ipo_38','ipo_39','ipo_40',
  'ipo_41','ipo_42','ipo_43','ipo_44','ipo_45','ipo_46','ipo_47','ipo_48','ipo_49','ipo_50',
  'ipo_51','ipo_52','ipo_53','ipo_54','ipo_55','ipo_56','ipo_57','ipo_58','ipo_59','ipo_60',
  'ipo_61','ipo_62','ipo_63','ipo_64','ipo_65','ipo_66','ipo_67','ipo_68','ipo_69','ipo_70',
  'ipo_71','ipo_72','ipo_73','ipo_74','ipo_75','ipo_76','ipo_77','ipo_78','ipo_79','ipo_80',
  'ipo_81','ipo_82','ipo_83',
  'score_IPO_total',
  'score_IPO_DP_pct','score_IPO_DP_nivel',
  'score_IPO_DI_pct','score_IPO_DI_nivel',
  'score_IPO_ER_pct','score_IPO_ER_nivel',
  'score_IPO_VM_pct','score_IPO_VM_nivel',
  'score_IPO_AG_pct','score_IPO_AG_nivel',

  // WAI-P breve (12 ítems + subescalas; solo TP ≥ 1, vacío en TP=0)
  'wai_1','wai_2','wai_3','wai_4','wai_5','wai_6',
  'wai_7','wai_8','wai_9','wai_10','wai_11','wai_12',
  'score_WAI_Tareas','score_WAI_Metas','score_WAI_Vinculo','score_WAI_total',
];

// ═══════════════════════════════════════════════════════════════════════
// FUNCIONES DE SCORING
// ═══════════════════════════════════════════════════════════════════════

// ─── DSM-5: sospecha binaria por dominio ────────────────────────────────
function calcularDSM5_(data) {
  DSM5_DOMINIOS.forEach(d => {
    const positivo = d.items.some(i => {
      const v = parseFloat(data['dsm_' + i]);
      return !isNaN(v) && v >= d.umbral;
    });
    data[d.col] = positivo ? 'Sospecha positiva' : 'Sospecha negativa';
  });
}

// ─── PHQ-9: nivel clínico + alerta suicida (ítem 9) ────────────────────
// Referencia: Kroenke et al. (2001); cutpoints: 0–4 sin indicador,
// 5–9 leve, 10–14 moderado, 15–19 mod-grave, 20–27 grave
function calcularPHQ9_(data) {
  const total = parseFloat(data['score_PHQ9_total']);
  if (!isNaN(total)) {
    if      (total >= 20) data['score_PHQ9_nivel'] = 'Grave';
    else if (total >= 15) data['score_PHQ9_nivel'] = 'Moderadamente grave';
    else if (total >= 10) data['score_PHQ9_nivel'] = 'Moderado';
    else if (total >= 5)  data['score_PHQ9_nivel'] = 'Leve';
    else                  data['score_PHQ9_nivel'] = 'Sin indicador clínico';
  } else {
    data['score_PHQ9_nivel'] = '';
  }
  const item9 = parseFloat(data['phq_9']);
  data['alerta_suicida'] = !isNaN(item9)
    ? (item9 >= 1 ? 'Alerta' : 'Sin alerta')
    : '';
}

// ─── LPFS-BF 2.0: Self / Interpersonal / total + niveles ───────────────
// Self = Identidad + Autodirección (ítems 1–6, 0–4 c/u, rango 0–24)
// Interpersonal = Empatía + Intimidad (ítems 7–12, 0–4 c/u, rango 0–24)
// Niveles Self/Interpersonal: ≥ 16 Det. Clínico; ≥ 10 Det. Leve; < 10 Saludable
// Nivel total (0–48): ≥ 32 Det. Grave; ≥ 22 Det. Moderado; < 22 No cumple criterio
// Referencia: Weekers et al. (2019); adaptación chilena en revisión
function calcularLPFS_(data) {
  const self  = parseFloat(data['score_LPFS_Identidad']    || 0)
              + parseFloat(data['score_LPFS_Autodireccion'] || 0);
  const inter = parseFloat(data['score_LPFS_Empatia']      || 0)
              + parseFloat(data['score_LPFS_Intimidad']     || 0);
  const total = parseFloat(data['score_LPFS_total']        || 0);

  data['score_LPFS_Self']         = self;
  data['score_LPFS_Self_nivel']   = self  >= 16 ? 'Det. Clínico'
                                  : self  >= 10 ? 'Det. Leve' : 'Saludable';
  data['score_LPFS_Interpersonal']       = inter;
  data['score_LPFS_Interpersonal_nivel'] = inter >= 16 ? 'Det. Clínico'
                                         : inter >= 10 ? 'Det. Leve' : 'Saludable';
  data['score_LPFS_total_nivel']  = total >= 32 ? 'Det. Grave'
                                  : total >= 22 ? 'Det. Moderado' : 'No cumple criterio';
}

// ─── PID-5 Breve (25 ítems, 5 dominios, escala 0–3) ────────────────────
// Media por dominio: ≥ 2.0 Clínico; ≥ 1.0 Moderado; < 1.0 Normal
// Referencia: Krueger et al. (2012); validación española: Gutiérrez-Zotes et al. (2021)
function calcularPID5_(data) {
  const dominios = [
    { nombre: 'AfectoNeg',      items: [1,2,3,4,5]   },
    { nombre: 'Distanciamiento',items: [6,7,8,9,10]  },
    { nombre: 'Antagonismo',    items: [11,12,13,14,15] },
    { nombre: 'Desinhibicion',  items: [16,17,18,19,20] },
    { nombre: 'Psicoticismo',   items: [21,22,23,24,25] },
  ];
  dominios.forEach(d => {
    const vals = d.items.map(i => parseFloat(data['pid_' + i])).filter(v => !isNaN(v));
    if (vals.length === 0) {
      data[`score_PID5_${d.nombre}_media`] = '';
      data[`score_PID5_${d.nombre}_nivel`] = '';
      return;
    }
    const media = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    data[`score_PID5_${d.nombre}_media`] = media;
    data[`score_PID5_${d.nombre}_nivel`] = media >= 2.0 ? 'Clínico'
                                         : media >= 1.0 ? 'Moderado' : 'Normal';
  });
}

// ─── IPO-83: % por subescala + nivel ────────────────────────────────────
// Referencia umbrales: Behn et al. (validación chilena)
function calcularIPO_pct_(data, escala) {
  let suma = 0, n = 0;
  escala.items.forEach(i => {
    const v = parseFloat(data['ipo_' + i]);
    if (!isNaN(v) && v >= 1 && v <= 5) { suma += v; n++; }
  });
  return n === 0 ? '' : Math.round((suma / escala.max) * 100 * 10) / 10;
}

function clasificarIPO_(pct, nombreEscala) {
  if (pct === '') return '';
  const u = IPO_UMBRALES[nombreEscala];
  if (pct <= u.normal)  return 'Normal';
  if (pct >= u.clinico) return 'Clínico';
  return 'Sub-umbral';
}

function calcularIPO_(data) {
  ['DP','DI','ER','VM','AG'].forEach(esc => {
    const pct = calcularIPO_pct_(data, IPO_ESCALAS[esc]);
    data[`score_IPO_${esc}_pct`]   = pct;
    data[`score_IPO_${esc}_nivel`] = clasificarIPO_(pct, esc);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA GET — verificación de que el script está activo
// ═══════════════════════════════════════════════════════════════════════
function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<p style="font-family:system-ui;padding:2rem">' +
    '✓ Apps Script activo<br>' +
    '<strong>Dr. Alex Behn · MIDAP · Pontificia Universidad Católica de Chile</strong><br>' +
    '<span style="color:#888">Medición Clínica Longitudinal v1.0</span></p>'
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PUNTO DE ENTRADA POST — receptor principal del formulario
// El formulario Medicion.html envía via iframe POST con campo "payload"
// ═══════════════════════════════════════════════════════════════════════
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // evitar escrituras simultáneas

  try {
    // Medicion.html envía el payload como campo de formulario (iframe POST)
    const data = JSON.parse(e.parameter.payload);

    // Calcular campos derivados
    calcularDSM5_(data);
    calcularPHQ9_(data);
    calcularLPFS_(data);
    calcularPID5_(data);
    calcularIPO_(data);

    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let sheet   = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const header = sheet.getRange(1, 1, 1, COLUMNAS.length);
      sheet.appendRow(COLUMNAS);
      header.setBackground('#1a1412');
      header.setFontColor('#ffffff');
      header.setFontWeight('bold');
      header.setFontSize(10);
      sheet.setFrozenRows(1);
    }

    // Construir fila en orden canónico; celdas vacías para campos ausentes
    const fila = COLUMNAS.map(col => {
      const v = data[col];
      return (v === undefined || v === null) ? '' : v;
    });

    sheet.appendRow(fila);
    sheet.autoResizeColumns(1, 5); // solo metadatos para no ralentizar

  } catch (err) {
    registrarError_(err, e.parameter.payload || '(payload vacío)');
  } finally {
    lock.releaseLock();
  }

  // Respuesta HTML necesaria para que el iframe detecte onload
  return HtmlService.createHtmlOutput(
    '<p style="font-family:system-ui;color:#2a7a5a">✓ Datos guardados.</p>'
  );
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORTAR CSV
// ═══════════════════════════════════════════════════════════════════════

// Exporta todos los momentos de un paciente (ejecutar desde el editor)
function exportarCSV_Paciente(id_pac) {
  const sheet = _getSheet_();
  if (!sheet) return;
  const data  = sheet.getDataRange().getValues();
  const idCol = data[0].indexOf('ID_Pac');
  const filas = data.filter((row, i) => i === 0 || String(row[idCol]) === String(id_pac));
  if (filas.length <= 1) { Logger.log('Sin datos para: ' + id_pac); return; }
  return _guardarCSV_(`Evaluacion_${id_pac}_${_hoy_()}.csv`, _toCSV_(filas));
}

// Exporta solo los registros WAI (TP=1) de un paciente, ordenados por MES
function exportarCSV_WAI(id_pac) {
  const sheet  = _getSheet_();
  if (!sheet) return;
  const data   = sheet.getDataRange().getValues();
  const header = data[0];
  const idCol  = header.indexOf('ID_Pac');
  const tpCol  = header.indexOf('TP');
  const mesCol = header.indexOf('MES');
  let filas = data.filter((row, i) =>
    i === 0 || (String(row[idCol]) === String(id_pac) && String(row[tpCol]) === '1')
  );
  const headerRow = filas.shift();
  filas.sort((a, b) => parseInt(a[mesCol]) - parseInt(b[mesCol]));
  filas.unshift(headerRow);
  if (filas.length <= 1) { Logger.log('Sin datos WAI para: ' + id_pac); return; }
  return _guardarCSV_(`WAI_${id_pac}_${_hoy_()}.csv`, _toCSV_(filas));
}

// Exporta toda la base de datos
function exportarCSV_Todos() {
  const sheet = _getSheet_();
  if (!sheet) return;
  return _guardarCSV_(`Evaluaciones_${_hoy_()}.csv`, _toCSV_(sheet.getDataRange().getValues()));
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITARIOS
// ═══════════════════════════════════════════════════════════════════════

// Crea la fila de encabezados con formato (ejecutar una vez si la hoja ya existe)
function crearEncabezados() {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  let sheet   = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNAS);
  } else {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]);
  }
  const header = sheet.getRange(1, 1, 1, COLUMNAS.length);
  header.setBackground('#1a1412');
  header.setFontColor('#ffffff');
  header.setFontWeight('bold');
  header.setFontSize(10);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, COLUMNAS.length);
  Logger.log('✓ Encabezados creados (' + COLUMNAS.length + ' columnas)');
}

// Simula un envío de TP=0 para AB_DEMO (probar sin el formulario)
function testEnvio_() {
  const fake = {
    timestamp: new Date().toISOString(),
    ID_Pac: 'AB_DEMO', TP: 0, MES: '', momento_label: 'Evaluación de Ingreso',
  };
  // Rellenar todos los ítems con valores mínimos para no romper scoring
  for (let i = 1; i <= 17; i++) fake[`dsm_${i}`] = 0;
  for (let i = 1; i <= 9;  i++) fake[`phq_${i}`] = 0;
  for (let i = 1; i <= 12; i++) fake[`lpfs_${i}`] = 0;
  for (let i = 1; i <= 25; i++) fake[`pid_${i}`] = 0;
  for (let i = 1; i <= 83; i++) fake[`ipo_${i}`] = 1;
  for (let i = 1; i <= 12; i++) fake[`wai_${i}`] = '';
  // Scores que calcula el formulario
  fake['score_DSM5_total'] = 0;
  fake['score_PHQ9_total'] = 0;
  fake['score_LPFS_Identidad'] = 0; fake['score_LPFS_Autodireccion'] = 0;
  fake['score_LPFS_Empatia'] = 0;   fake['score_LPFS_Intimidad'] = 0;
  fake['score_LPFS_total'] = 0;
  fake['score_PID5_AfectoNeg'] = 0; fake['score_PID5_Distanciamiento'] = 0;
  fake['score_PID5_Antagonismo'] = 0; fake['score_PID5_Desinhibicion'] = 0;
  fake['score_PID5_Psicoticismo'] = 0; fake['score_PID5_total'] = 0;
  fake['score_IPO_total'] = 83;

  const result = doPost({ parameter: { payload: JSON.stringify(fake) } });
  Logger.log('testEnvio_ →  ' + result.getContent());
}

// ─── Helpers privados ────────────────────────────────────────────────────
function _getSheet_() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) Logger.log('Hoja "' + SHEET_NAME + '" no encontrada');
  return sheet;
}

function registrarError_(err, payloadRaw) {
  try {
    const ss   = SpreadsheetApp.openById(SHEET_ID);
    let log    = ss.getSheetByName(LOG_NAME);
    if (!log) {
      log = ss.insertSheet(LOG_NAME);
      log.appendRow(['timestamp', 'error', 'payload_fragmento']);
      log.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#fdf0eb');
    }
    log.appendRow([new Date().toISOString(), err.toString(), String(payloadRaw).slice(0, 500)]);
  } catch (_) {}
}

function _toCSV_(rows) {
  return rows.map(row =>
    row.map(cell => {
      const s = String(cell);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(',')
  ).join('\n');
}

function _guardarCSV_(filename, csv) {
  const folder   = DriveApp.getRootFolder();
  const existing = folder.getFilesByName(filename);
  while (existing.hasNext()) existing.next().setTrashed(true);
  const file = folder.createFile(filename, csv, MimeType.CSV);
  Logger.log('CSV generado: ' + file.getUrl());
  return file.getUrl();
}

function _hoy_() {
  return new Date().toISOString().slice(0, 10);
}
