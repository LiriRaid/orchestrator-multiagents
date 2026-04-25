---
name: orchestrator-spec
description: >
  Crea o actualiza la especificación funcional del cambio con requerimientos y escenarios.
  Trigger: "haz spec", "crea especificación", "documenta requerimientos", "define escenarios"
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-spec

## Propósito

Traducir la propuesta del cambio en una especificación clara para que la implementación y la verificación tengan una referencia estable.

## Reglas críticas

- Lee la propuesta antes de escribir la spec.
- Crea o actualiza `openspec/changes/<change-name>/specs/spec.md`.
- Expresa requerimientos y escenarios de forma verificable.
- No mezcles demasiado diseño técnico dentro de la spec salvo que sea necesario para entender el comportamiento.
- Si faltan datos del usuario, deja explícitas las suposiciones.

## Resultado esperado

Una spec que permita pasar a design, tasks o verify sin depender de la conversación.
