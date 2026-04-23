# Componentes

Este documento describe los componentes reales del orquestador y cómo se organizan dentro del sistema.

| Componente | ID | Estado | Descripción |
|---|---|---|---|
| Engram | `engram` | Implementado | Memoria persistente entre sesiones |
| SDD | `sdd` | Implementado | Flujo guiado por OpenSpec y skills del orquestador |
| Skills | `skills` | Implementado | Skills locales en `.claude/skills/` con registry propio |
| Context7 | `context7` | Soportado | Se usa cuando se necesitan docs actuales de librerías |
| Persona | `persona` | Implementado | Claude como orquestador principal con reglas locales |
| Permissions | `permissions` | Implementado | Seguro por defecto, bypass solo explícito |
| GGA | `gga` | No incluido | Fuera de alcance para este orquestador |
| Theme | `theme` | No incluido | No forma parte del alcance de este orquestador |

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

Este repo organiza sus skills alrededor del flujo real del orquestador con TUI, `QUEUE.md`, OpenSpec, Engram y Claude como coordinador.
