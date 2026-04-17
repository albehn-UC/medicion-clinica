# Sistema de Medición Clínica Longitudinal
**Dr. Alex Behn** · PsiCLab UC / MIDAP · Pontificia Universidad Católica de Chile

Sistema de captura longitudinal de instrumentos clínicos con generación automática de reportes HTML por paciente.

## Estructura

| Archivo | Descripción |
|---|---|
| `index.html` | Dashboard del sistema |
| `Medicion.html` | Formulario de evaluación para pacientes |
| `report-generator/` | Script Python que genera reportes por paciente |

## Instrumentos

PHQ-9 · LPFS-BF · PID-5 breve · IPO-83 · WAI-P · Screening DSM-5 (14 dominios)

## Stack

HTML + Apps Script (captura) · Python + Google Sheets API (reportes) · Chart.js (visualización)

## Seguridad

`credentials.json` y `reports/` están excluidos por `.gitignore` y nunca se suben a GitHub.
