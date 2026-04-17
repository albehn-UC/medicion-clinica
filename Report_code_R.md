# PersonalidadSana — Reporte Longitudinal Clínico

## Propósito
Dashboard de reporte longitudinal para pacientes de psicoterapia.
Visualiza evolución en múltiples instrumentos clínicos a lo largo del tiempo (ingreso, 3, 6, 9, 12 meses).

## Stack
- HTML + CSS + Vanilla JS (sin frameworks)
- Chart.js 4.4.1 (via CDN cdnjs.cloudflare.com)
- Sin dependencias de servidor — funciona como archivo HTML estático

## Estructura del proyecto
```
/
├── CLAUDE.md              ← este archivo
├── index.html             ← dashboard principal
├── data/
│   └── patient_JP.js      ← datos del paciente (objeto JS exportado)
├── src/
│   ├── charts/
│   │   ├── sospecha.js    ← dot plots sintomáticos
│   │   ├── phq9.js        ← gráfico PHQ-9 + alerta suicida
│   │   ├── lpfs.js        ← gráfico LPFS Self vs Interpersonal
│   │   ├── pid5.js        ← spider PID-5 por categorías
│   │   └── ipo.js         ← spider IPO por categorías
│   ├── components/
│   │   ├── header.js      ← cabecera con badges de momentos activos
│   │   └── legend.js      ← leyendas reutilizables
│   └── utils/
│       ├── colors.js      ← paleta y mapeo de categorías a colores
│       └── data.js        ← helpers para filtrar momentos activos
└── styles/
    └── main.css           ← sistema de diseño (variables CSS)
```

## Modelo de datos — patient_*.js

```js
export const PATIENT = {
  id: 'JP',
  // Definir cuáles momentos existen y cuáles están activos para mostrar
  // active: false → se muestra badge gris "pendiente", no aparece en gráficos
  momentos: [
    { label: 'Ingreso',   tp: 0,  active: true  },
    { label: '3 meses',   tp: 3,  active: true  },
    { label: '6 meses',   tp: 6,  active: true  },
    { label: '9 meses',   tp: 9,  active: false },
    { label: '12 meses',  tp: 12, active: false },
  ],

  // Sospecha DSM: 1 = positiva, 0 = negativa, null = sin dato
  // Orden del array: [T0, T3, T6, T9, T12]
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

  // PHQ-9: puntaje total (0-27) + alerta suicida (1=sí, 0=no, null=sin dato)
  phq: {
    total:  [27, 9, 5, null, null],
    alerta: [1,  1, 0, null, null],
    nivel:  ['Clínico', 'Sin indicador clínico', 'Sin indicador clínico', null, null],
  },

  // LPFS: puntajes numéricos + nivel categórico
  // niveles posibles: 'Saludable' | 'Det. Leve' | 'Det. Clínico' | 'Det. Grave' | 'No cumple'
  lpfs: {
    self:          [30, 18, 10, null, null],
    interpersonal: [30, 18, 14, null, null],
    total:         [60, 36, 24, null, null],
    selfNivel:          ['Det. Clínico', 'Det. Clínico', 'Saludable',  null, null],
    interpersonalNivel: ['Det. Clínico', 'Det. Clínico', 'Det. Leve',  null, null],
    totalNivel:         ['Det. Grave',   'Det. Grave',   'No cumple',  null, null],
  },

  // PID-5: categorías por dominio (1=Clínico, 0=Normal, null=sin dato)
  // Orden dominios: AfectoNeg, Desapego, Antagonismo, Desinhibición, Anancastia, Psicoticismo
  pid5: {
    labels: ['Af. Negativo', 'Desapego', 'Antagonismo', 'Desinhibición', 'Anancastia', 'Psicoticismo'],
    cats: [
      [1, 1, 1, 1, 1, 1],    // T0 Ingreso
      [1, 1, 1, 1, 1, 1],    // T3 3 meses
      [0, 0, 0, 0, 0, 0],    // T6 6 meses
      [null, null, null, null, null, null], // T9
      [null, null, null, null, null, null], // T12
    ]
  },

  // IPO: categorías por subescala ('Clinico' | 'Sub-umbral' | 'Normal' | null)
  // Orden subescalas: DP (Defensas Primitivas), DI (Difusión Identidad),
  //                   ER (Examen Realidad), VM (Valores Morales), AG (Agresión)
  ipo: {
    labels: ['Def. Primitivas', 'Difusión Id.', 'Exam. Realidad', 'Valores Mor.', 'Agresión'],
    cats: [
      [null, null, null, null, null], // T0 — pendiente completar
      [null, null, null, null, null], // T3
      [null, null, null, null, null], // T6
      [null, null, null, null, null], // T9
      [null, null, null, null, null], // T12
    ]
  }
};
```

## Reglas de diseño
- Sistema de colores: morado (#534AB7) para Self/T0, coral (#D85A30) para Interpersonal/T2
- Verde (#97C459/#3B6D11) = negativo/normal/sin alerta; rojo (#E24B4A/#A32D2D) = positivo/clínico/alerta
- Ámbar (#EF9F27) = sub-umbral en IPO
- Bordes: 0.5px, border-radius: 8px tarjetas pequeñas, 12px bloques grandes
- Tipografía: font-family: system-ui, sin bold > 500
- Sin gradientes, sin sombras decorativas

## Flexibilidad de momentos
El reporte debe adaptarse automáticamente según `momentos[i].active`:
- Si solo T0 está activo → modo "solo ingreso" (sin gráficos de línea, solo valores puntuales)
- Si T0 + T3 → 2 puntos en líneas
- Si T0 + T3 + T6 + T9 → 4 puntos, etc.
- Los badges de momentos inactivos se muestran en gris "pendiente"
- Los gráficos nunca muestran gaps falsos — usar `spanGaps: false` en Chart.js

## Tareas pendientes para Claude Code
1. [ ] Separar HTML monolítico en módulos (src/charts/*.js)
2. [ ] Implementar modo "solo ingreso" (cuando solo T0 activo, mostrar tarjetas de resumen en lugar de gráficos de línea)
3. [ ] Completar datos IPO de JP y activar spider IPO
4. [ ] Agregar sección WAI-P (alianza terapéutica) cuando estén disponibles los datos
5. [ ] Agregar export a PDF (usando window.print() con @media print CSS)
6. [ ] Internacionalización de etiquetas de nivel (actualmente en español)
7. [ ] Modo multi-paciente: selector de ID_Pac que carga el archivo data/patient_*.js correspondiente

## Notas clínicas
- PHQ-9: 0-4 sin indicador, 5-9 leve, 10-14 moderado, 15-19 moderadamente grave, 20-27 grave
- LPFS: Self = identidad + autodirección; Interpersonal = empatía + intimidad
- PID-5 clínico: promedio dominio ≥ 2 sobre escala 0-3
- IPO niveles: Normal < Sub-umbral < Clínico (ordinal para spider)
- Alerta suicida: ítem PHQ-9 pregunta 9 > 0
