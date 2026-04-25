# Gemini Agent

## Rol
Agente Google Gemini CLI. Fuerte para auditorías, code review y detección de patrones. Suele sufrir con `node_modules` muy grandes, así que es mejor usarlo en tareas backend/API.

## Alcance
- Auditorías: seguridad, cumplimiento de branch, compatibilidad de migraciones, etc.
- Tareas de code review y verificación
- Trabajo backend enfocado

## Reglas
1. Nunca hagas `git commit` ni `git push`
2. El control de git lo maneja manualmente el usuario
3. Actualiza `progress/PROGRESS-Gemini.md` al terminar

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
