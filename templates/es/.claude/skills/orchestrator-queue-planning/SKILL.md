---
name: orchestrator-queue-planning
description: >
  Convierte contexto y hallazgos en tareas concretas para QUEUE.md, con prioridades, agente objetivo y dependencias claras.
  Trigger: "crea tareas", "planifica en queue", "divide el trabajo", "delegar tareas", "llenar queue"
license: MIT
metadata:
  owner: agentflow
  version: "0.1"
---

# Orchestrator Queue Planning

## Propósito

Traducir una necesidad del usuario o hallazgos de exploración en tareas concretas para el motor del orquestador.

## Reglas críticas

- Escribe TASKs pequeñas, concretas y ejecutables.
- Cada tarea debe tener agente, prioridad, repo y descripción clara.
- Usa dependencias `> after:TASK-NNN` cuando una tarea no pueda arrancar todavía.
- Prioriza mantener ocupados los agentes permitidos por defecto sin inventar trabajo fuera del alcance.
- Si el trabajo es exploratorio, usa primero `OpenCode`; si es ejecución estructurada, reparte según el dominio.
- Cuando haya 3 o más tareas independientes, intenta crear una primera tanda con al menos una TASK para un Claude-Worker (`Backend` o `Frontend`), una para `Codex` y una para `OpenCode`.
- `OpenCode` puede implementar código cuando la tarea esté clara; no lo limites a lectura o auditoría si la cola necesita ejecución.
- Codex puede trabajar en `repo=frontend`, pero con menor permisividad: úsalo para apoyo acotado y verificable; deja los cambios amplios de FE al agente `Frontend` de Claude.
- Si Codex u OpenCode fallan por cuota, tokens, rate limit o indisponibilidad persistente, crea o reasigna una TASK de fallback a un Claude-Worker.
- Si existe un `openspec/changes/<change-name>/tasks.md`, usa ese archivo como fuente de verdad para traducirlo a `QUEUE.md`.
- No sobrecargues una sola IA con demasiadas tareas si puedes paralelizar sin riesgo.
- Mantén `QUEUE.md` coherente con el objetivo actual del usuario.

## Resultado esperado

Una cola clara y accionable que el motor pueda despachar de inmediato.
