---
name: orchestrator-archive
description: >
  Cierra y archiva un cambio cuando ya fue implementado y verificado.
  Trigger: "archiva el cambio", "cierra el change", "finaliza el cambio", "mueve al archive"
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-archive

## Propósito

Cerrar formalmente un cambio para que el orquestador mantenga un historial limpio y reusable.

## Reglas críticas

- Confirma que proposal, spec, design, tasks y verify-report estén en estado razonable.
- Crea o actualiza `archive-report.md`.
- Mueve el change al área de archivo cuando corresponda.
- Si el cambio deja aprendizajes importantes, sugiere guardarlos también en Engram.
- No hagas commit ni push como parte del archive.

## Resultado esperado

Un cambio cerrado correctamente y listo para futuras referencias.
