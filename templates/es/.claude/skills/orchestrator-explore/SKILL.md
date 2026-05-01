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
- Usa **SOLO OpenCode** como agente de exploración cuando necesites análisis profundo del codebase — su rol es **EXCLUSIVAMENTE análisis**, **NUNCA implementación**.
- Al delegar exploración a OpenCode, incluye en el brief exactamente qué debe reportar: flujos, dependencias, hallazgos de arquitectura, inconsistencias, etc.
- No llenes `QUEUE.md` con implementación hasta tener suficiente contexto.
- Resume hallazgos en términos accionables: qué existe, qué falta, qué riesgo hay y qué tareas salen de eso.
- Si la exploración revela un cambio grande o multifase, el siguiente paso natural es abrir o actualizar un change en `openspec/`.
- Si descubres una línea clara de trabajo, el siguiente paso natural es convertir hallazgos en TASKs concretas con `orchestrator-queue-planning`.
- Mantén el foco dentro del alcance pedido; explorar no es rediseñar todo el sistema.
- **REGLA ESTRICTA: Cuando OpenCode entregue su reporte en INBOX.md, usa ESOS hallazgos para crear las TASKs de implementación (asignadas a Codex o Claude-Worker). NUNCA, bajo ninguna circunstancia, vuelvas a analizar el código tú mismo (Claude-Orquestador) si OpenCode ya lo hizo. Lee el reporte en `progress/PROGRESS-OpenCode.md` o el INBOX.md y basa tus decisiones en ese análisis.**
- Si el reporte de OpenCode es insuficiente, pide a OpenCode que profundice en un área específica con una nueva TASK de análisis, pero NO lo hagas tú directamente.

## Resultado esperado

Una exploración útil que permita al orquestador decidir si ya puede crear TASKs o si necesita una investigación adicional. **El resultado final DEBE ser una o más TASKs en QUEUE.md asignadas a Codex o Claude-Worker para implementación, NO más análisis por parte de Claude-Orquestador.**
