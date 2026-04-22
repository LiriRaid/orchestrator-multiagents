# Engram Memory Convention

Este archivo define cómo usar **Engram** dentro de este proyecto para no depender solo del contexto corto de sesión.

## Objetivo

Guardar y recuperar:

- decisiones de arquitectura
- hallazgos de exploración
- bugs y su causa raíz
- preferencias del usuario
- estado de cambios importantes
- resúmenes de sesión

## Reglas de uso

### Al iniciar una sesión del orquestador

- Busca memoria reciente del proyecto antes de asumir que todo empieza desde cero.
- Si existe contexto anterior relevante, úsalo para no repetir exploración innecesaria.
- Si el usuario menciona “recuerda”, “qué hicimos” o “cómo quedó”, consulta primero Engram.

### Durante el trabajo

Guarda en Engram cuando ocurra cualquiera de estas cosas:

- una decisión importante
- un hallazgo técnico no obvio
- una convención nueva
- un bug con causa identificada
- un cambio de flujo del orquestador
- una preferencia explícita del usuario

### Al terminar la sesión

- Guarda un resumen de sesión con lo hecho, lo descubierto y lo que sigue.
- El objetivo es que la próxima sesión no empiece ciega.

## Topic keys recomendados

- `orchestrator/session-summary`
- `orchestrator/routing`
- `orchestrator/skills`
- `orchestrator/engram`
- `orchestrator/tui`
- `orchestrator/queue-workflow`

Para cambios por feature:

- `feature/<nombre-del-cambio>`
- `bug/<nombre-del-bug>`
- `decision/<tema>`

## Regla de prioridad

- Usa Engram como memoria persistente.
- Usa `.atl/skill-registry.md` como catálogo local de skills.
- Usa `ORCHESTRATOR.md` y `CLAUDE.md` como reglas activas del proyecto.

## Importante

Engram es una ayuda para continuidad, no reemplaza:

- `QUEUE.md`
- `ORCHESTRATOR.md`
- `handoffs/`
- el estado visible en la TUI

La memoria debe complementar el flujo del orquestador, no ocultarlo.
