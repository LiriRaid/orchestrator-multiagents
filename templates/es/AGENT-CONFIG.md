# Agent Config

Este archivo define la capa de configuración por agente del orquestador reusable.

## Objetivo

Separar dos niveles:

1. **Runtime config**
   Vive en `orchestrator.config.json` bajo `agents` y `repos`.
   Controla qué agentes puede lanzar el motor y cómo se conectan a los repos.

2. **Agent profile config**
   Vive en `orchestrator.config.json` bajo `agentProfiles`.
   Controla cómo se organiza la configuración local por CLI o familia de agente.

Esto permite:

- usar solo 1 agente
- usar 3 agentes como base (`claude`, `codex`, `opencode`)
- o escalar a más agentes sin rediseñar el config

## Regla de diseño

- `agents` = instancias operativas visibles para el motor
- `agentProfiles` = configuración reusable por tipo de agente

Ejemplo:

- `Backend` y `Frontend` pueden compartir el profile `claude`
- `Codex` usa el profile `codex`
- `OpenCode` usa el profile `opencode`

## Claude-Orquestador vs Claude-Worker

El profile `claude` puede aparecer en dos formas operativas:

- **Claude-Orquestador**: sesión interactiva que lee `ORCHESTRATOR.md`, mantiene `QUEUE.md`, delega y revisa.
- **Claude-Worker**: agentes como `Backend` y `Frontend`, lanzados por la TUI, que sí pueden implementar código cuando tienen una TASK asignada.

La sesión orquestadora no modifica el repo real directamente. Si Claude debe trabajar en código, se le asigna una TASK a `Backend` o `Frontend`.

Cuando haya varias tareas independientes, el reparto recomendado es mantener ocupados a `Claude-Worker`, `Codex` y `OpenCode` en paralelo antes de acumular varias tareas en un solo agente.

## Campos sugeridos de `agentProfiles`

| Campo                 | Requerido | Propósito                                  |
| --------------------- | --------- | ------------------------------------------ |
| `enabled`             | No        | Si este profile está activo en el proyecto |
| `localConfigDir`      | No        | Carpeta local del proyecto para ese agente |
| `skillsDir`           | No        | Carpeta local de skills si aplica          |
| `primary`             | No        | Si es el agente principal del flujo        |
| `useForOrchestration` | No        | Si puede actuar como orquestador           |
| `notes`               | No        | Notas o restricciones operativas           |

## Convención inicial

Para este proyecto reusable:

- `claude` es el profile principal
- `codex` es el profile de implementación primaria
- `opencode` es el profile de apoyo que **puede implementar código cuando usa modelos avanzados** (ej: Mistral Medium 3.5 128B)
- otros profiles pueden existir, aunque no estén habilitados por defecto

## Directorios locales sugeridos

- `.claude/`
- `.codex/`
- `.opencode/`

Estos directorios no tienen que ser iguales a los del home del usuario. Son la capa local del proyecto.

## Prioridad

Si existe configuración global del agente en el home del usuario y también una local del proyecto:

- la local del proyecto debe ganar en el flujo del orquestador reusable

## Relación con skills

- `Claude` usa `.claude/skills/` como base principal del proyecto
- `Codex` y `OpenCode` pueden tener configuración local propia aunque hoy no usen el mismo modelo de skills
- `OpenCode` no es solo auditor: puede explorar, auditar e **implementar código cuando use modelos avanzados** como Mistral Medium 3.5 128B
- el diseño debe permitir que mañana también tengan una capa local más rica
