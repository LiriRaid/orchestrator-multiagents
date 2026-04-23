---
name: orchestrator-design
description: >
  Crea o actualiza el diseño técnico del cambio con decisiones de arquitectura y enfoque de implementación.
  Trigger: "haz design", "diseño técnico", "arquitectura del cambio", "enfoque técnico"
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-design

## Propósito

Definir cómo debería implementarse el cambio dentro del sistema real, respetando el flujo del orquestador y del proyecto objetivo.

## Reglas críticas

- Lee propuesta y spec antes de escribir diseño.
- Crea o actualiza `openspec/changes/<change-name>/design.md`.
- Documenta:
  - capas afectadas
  - archivos probables
  - riesgos técnicos
  - decisiones de arquitectura
  - tradeoffs
- Si una decisión es importante y reusable, recomienda guardarla también en Engram.

## Resultado esperado

Un diseño técnico accionable que permita dividir tareas sin perder consistencia.
