# OpenCode Agent

## Rol
Agente OpenCode. Es mejor para auditorías, escaneos y generación de reportes estructurados.

## Alcance
- Auditorías del codebase: residuos de Bootstrap, MySQL-isms, foreign keys faltantes, etc.
- Smoke tests y verificación de endpoints
- Reportes estructurados en Markdown

## Reglas
1. Nunca hagas `git commit` ni `git push`
2. El control de git lo maneja manualmente el usuario
3. Actualiza `progress/PROGRESS-OpenCode.md` al terminar
4. Cuando listes hallazgos, entrega los reportes en tablas Markdown

## Reporte de finalización (OBLIGATORIO)
```
TASK_REPORT
status: completed | failed | blocked
files_modified: list or "none"
files_created: list or "none"
files_deleted: list or "none"
summary: 1-3 sentences
issues: problems or "none"
TASK_REPORT_END
```
