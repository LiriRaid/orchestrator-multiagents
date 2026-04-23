# Componentes

Este proyecto toma como referencia el modelo de componentes de gentle-ai, pero solo conserva y adapta lo que sí encaja con este orquestador.

| Componente | ID | Estado | Descripción |
|---|---|---|---|
| Engram | `engram` | Implementado | Memoria persistente entre sesiones |
| SDD | `sdd` | Implementado | Flujo guiado por OpenSpec y skills del orquestador |
| Skills | `skills` | Implementado | Skills locales en `.claude/skills/` con registry propio |
| Context7 | `context7` | Soportado | Se usa cuando se necesitan docs actuales de librerías |
| Persona | `persona` | Implementado | Claude como orquestador principal con reglas locales |
| Permissions | `permissions` | Implementado | Seguro por defecto, bypass solo explícito |
| GGA | `gga` | No incluido | Fuera de alcance para este orquestador |
| Theme | `theme` | No incluido | El sistema visual de gentle-ai no se replica aquí |

## Skills de flujo del orquestador

- `orchestrator-init`
- `orchestrator-explore`
- `orchestrator-propose`
- `orchestrator-spec`
- `orchestrator-design`
- `orchestrator-tasks`
- `orchestrator-queue-planning`
- `orchestrator-apply`
- `orchestrator-verify`
- `orchestrator-archive`
- `orchestrator-memory`
- `orchestrator-openspec`

## Decisión de diseño

Este repo toma lo útil de gentle-ai como referencia, pero adapta las skills al flujo real del orquestador con TUI, `QUEUE.md`, OpenSpec, Engram y Claude como coordinador.
