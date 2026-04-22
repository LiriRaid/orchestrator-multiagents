---
name: orchestrator-explore
description: >
  Explora, analiza o investiga el proyecto antes de proponer cambios. Ideal cuando el usuario pide entender archivos, flujos o arquitectura antes de delegar implementación.
  Trigger: "explora", "analiza", "investiga", "revisa este proyecto", "revisa estos archivos"
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "0.1"
---

# Orchestrator Explore

## Propósito

Guiar la fase de exploración del orquestador para reunir contexto útil antes de crear o delegar tareas.

## Reglas críticas

- Empieza por entender el alcance exacto del pedido del usuario.
- Si hace falta lectura amplia, prioriza exploración y análisis antes de planear implementación.
- Usa `OpenCode` como primer apoyo para lectura, contexto y hallazgos estructurados cuando aplique.
- No llenes `QUEUE.md` con implementación hasta tener suficiente contexto.
- Resume hallazgos en términos accionables: qué existe, qué falta, qué riesgo hay y qué tareas salen de eso.
- Si descubres una línea clara de trabajo, el siguiente paso natural es convertir hallazgos en TASKs concretas.
- Mantén el foco dentro del alcance pedido; explorar no es rediseñar todo el sistema.

## Resultado esperado

Una exploración útil que permita al orquestador decidir si ya puede crear TASKs o si necesita una investigación adicional.
