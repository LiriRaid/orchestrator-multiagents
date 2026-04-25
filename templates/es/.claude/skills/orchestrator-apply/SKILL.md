---
name: orchestrator-apply
description: >
  Guía la fase de implementación de un cambio siguiendo proposal, spec, design y tasks.
  Trigger: "implementa", "aplica el cambio", "ejecuta las tareas", "ponlo en marcha"
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-apply

## Propósito

Ejecutar implementación de forma controlada y alineada al cambio documentado, sin dejar que una sola IA improvise todo sin control.

## Reglas críticas

- Lee proposal, spec, design y tasks antes de implementar.
- Respeta `QUEUE.md` y el reparto de trabajo del orquestador.
- Usa agentes de apoyo para ejecutar, pero mantén a Claude como árbitro principal de revisión.
- Si hay tareas independientes suficientes, no esperes pasivamente a que Codex u OpenCode terminen: asigna también una TASK a un Claude-Worker (`Backend` o `Frontend`) para que Claude avance trabajo de código en paralelo.
- OpenCode puede implementar código además de explorar y auditar cuando la TASK esté claramente definida.
- Los cambios no deben darse por aceptados automáticamente; Claude debe revisarlos antes de darlos por buenos si la tarea lo requiere.
- No hagas commit ni push.
- Si la implementación queda parcial, deja el estado claro para verify o una siguiente tanda de apply.
- Si el cambio se desvía del plan, documenta la desviación antes de seguir.

## Resultado esperado

Implementación alineada al cambio, con estado claro para la siguiente fase.
