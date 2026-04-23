---
name: orchestrator-queue-planning
description: >
  Convierte contexto y hallazgos en tareas concretas para QUEUE.md, con prioridades, agente objetivo y dependencias claras.
  Trigger: "crea tareas", "planifica en queue", "divide el trabajo", "delegar tareas", "llenar queue"
license: MIT
metadata:
  owner: orchestrator-multiagents
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
- Si existe un `openspec/changes/<change-name>/tasks.md`, usa ese archivo como fuente de verdad para traducirlo a `QUEUE.md`.
- No sobrecargues una sola IA con demasiadas tareas si puedes paralelizar sin riesgo.
- Mantén `QUEUE.md` coherente con el objetivo actual del usuario.

## Resultado esperado

Una cola clara y accionable que el motor pueda despachar de inmediato.
