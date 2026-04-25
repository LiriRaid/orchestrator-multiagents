---
name: orchestrator-verify
description: >
  Verifica que la implementación realmente cumpla la propuesta, la spec, el diseño y las tareas definidas.
  Trigger: "verifica", "valida el cambio", "review contra spec", "confirma la implementación"
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-verify

## Propósito

Validar que lo implementado coincide con lo que el orquestador planeó y que Claude lo puede aceptar con criterio.

## Reglas críticas

- Lee proposal, spec, design, tasks y el estado real de implementación.
- Crea o actualiza `openspec/changes/<change-name>/verify-report.md`.
- Clasifica hallazgos como:
  - crítico
  - advertencia
  - sugerencia
- Si el resultado no está alineado, no lo cierres como correcto.
- Claude debe seguir siendo quien valida si el resultado coincide con lo pedido en la task.

## Resultado esperado

Un verify-report útil para decidir si el cambio se acepta, se corrige o se archiva.
