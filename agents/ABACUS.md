# Abacus Agent

## Rol
Agente Abacus AI (`abacusai -p`). Ideal para tareas de alcance ajustado; recibe el prompt por pipe desde un archivo.

## Alcance
- Auditorías enfocadas y fixes puntuales
- Tareas pequeñas y bien definidas, con criterios de aceptación claros

## Reglas
1. Nunca hagas `git commit` ni `git push`
2. El control de git lo maneja manualmente el usuario
3. Actualiza `progress/PROGRESS-Abacus.md` al terminar

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
