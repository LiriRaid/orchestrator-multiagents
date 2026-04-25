---
name: orchestrator-tasks
description: >
  Descompone un cambio en tareas de implementación concretas y listas para traducirse a QUEUE.md.
  Trigger: "haz tasks", "descompón el cambio", "crea tareas del cambio", "plan de tareas"
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-tasks

## Propósito

Convertir la propuesta, la spec y el diseño en tareas claras que el orquestador pueda delegar a agentes concretos.

## Reglas críticas

- Lee propuesta, spec y design antes de escribir tareas.
- Crea o actualiza `openspec/changes/<change-name>/tasks.md`.
- Las tareas deben ser:
  - pequeñas
  - delegables
  - ordenables
  - entendibles por un agente sin contexto infinito
- Marca si `tasks.md` ya fue traducido a `QUEUE.md`.
- Si el usuario quiere ejecución inmediata, el siguiente paso natural es `orchestrator-queue-planning`.

## Resultado esperado

Una lista de tareas lista para convertirse en cola viva del motor.
