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

## Campos sugeridos de `agentProfiles`

| Campo | Requerido | Propósito |
|------|-----------|-----------|
| `enabled` | No | Si este profile está activo en el proyecto |
| `localConfigDir` | No | Carpeta local del proyecto para ese agente |
| `skillsDir` | No | Carpeta local de skills si aplica |
| `primary` | No | Si es el agente principal del flujo |
| `useForOrchestration` | No | Si puede actuar como orquestador |
| `notes` | No | Notas o restricciones operativas |

## Convención inicial

Para este proyecto reusable:

- `claude` es el profile principal
- `codex` y `opencode` son profiles de apoyo
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
- el diseño debe permitir que mañana también tengan una capa local más rica
