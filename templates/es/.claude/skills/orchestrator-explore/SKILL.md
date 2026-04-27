---
name: orchestrator-explore
description: >
  Explora, analiza o investiga el proyecto antes de proponer cambios. Ideal cuando el usuario pide entender archivos, flujos o arquitectura antes de delegar implementación.
  Trigger: "explora", "analiza", "investiga", "revisa este proyecto", "revisa estos archivos"
license: MIT
metadata:
  owner: agentflow
  version: "0.2"
---

# Skill: orchestrator-explore

## Propósito

Guiar la fase de exploración del orquestador para reunir contexto útil antes de crear o delegar tareas.

## Reglas críticas

- Empieza por entender el alcance exacto del pedido del usuario.
- Si hace falta lectura amplia, prioriza exploración y análisis antes de planear implementación.
- Usa `OpenCode` como agente de exploración cuando necesites análisis profundo del codebase — su rol es **solo análisis**, no implementación.
- Al delegar exploración a OpenCode, incluye en el brief exactamente qué debe reportar: flujos, dependencias, hallazgos de arquitectura, inconsistencias, etc.
- No llenes `QUEUE.md` con implementación hasta tener suficiente contexto.
- Resume hallazgos en términos accionables: qué existe, qué falta, qué riesgo hay y qué tareas salen de eso.
- Si la exploración revela un cambio grande o multifase, el siguiente paso natural es abrir o actualizar un change en `openspec/`.
- Si descubres una línea clara de trabajo, el siguiente paso natural es convertir hallazgos en TASKs concretas con `orchestrator-queue-planning`.
- Mantén el foco dentro del alcance pedido; explorar no es rediseñar todo el sistema.
- Cuando OpenCode entregue su reporte en INBOX.md, usa esos hallazgos para crear las TASKs de implementación (asignadas a Codex o Claude-Worker, nunca de vuelta a OpenCode).

## Resultado esperado

Una exploración útil que permita al orquestador decidir si ya puede crear TASKs o si necesita una investigación adicional.
