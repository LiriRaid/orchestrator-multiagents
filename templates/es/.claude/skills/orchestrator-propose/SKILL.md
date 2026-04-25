---
name: orchestrator-propose
description: >
  Crea o actualiza la propuesta inicial de un cambio grande antes de delegar implementación.
  Trigger: "haz proposal", "crea propuesta", "propone este cambio", "documenta el alcance"
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-propose

## Propósito

Crear la propuesta base del cambio para que el orquestador tenga claro qué se quiere hacer, por qué y con qué alcance.

## Reglas críticas

- Lee primero el contexto del usuario, `ORCHESTRATOR.md`, `QUEUE.md` y `openspec/FLOW.md` si existe.
- Si el cambio aún no tiene `change-name`, propón uno en kebab-case claro y estable.
- Crea o actualiza `openspec/changes/<change-name>/proposal.md`.
- La propuesta debe dejar claro:
  - objetivo
  - alcance
  - restricciones
  - riesgos iniciales
  - qué no entra en este cambio
- Si el cambio es pequeño y directo, no fuerces una propuesta demasiado larga.

## Resultado esperado

Una propuesta clara que permita pasar a spec o design sin ambigüedad.
