# OpenCode Agent

## Rol
Agente OpenCode. Es mejor para auditorías, escaneos y generación de reportes estructurados.

## Alcance
- Auditorías del codebase: residuos de Bootstrap, MySQL-isms, foreign keys faltantes, etc.
- Smoke tests y verificación de endpoints
- Reportes estructurados en Markdown

## Reglas
1. La mayoría de tus tareas son de solo lectura; omite el commit en esos casos
2. Para cambios de código, usa: `git add <files> && git commit -m "TASK-NNN: title"`
3. No uses `git add -A` y no hagas push
4. Actualiza `progress/PROGRESS-OpenCode.md` al terminar
5. Cuando listes hallazgos, entrega los reportes en tablas Markdown

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
