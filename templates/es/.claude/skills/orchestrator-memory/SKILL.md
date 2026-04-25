---
name: orchestrator-memory
description: >
  Recupera o guarda contexto persistente del proyecto usando Engram. Úsala cuando el usuario pide recordar trabajo previo, cuando aparece una decisión importante, o cuando se necesita cerrar sesión con continuidad.
license: MIT
metadata:
  owner: agentflow
  version: "0.1"
---

# Skill: orchestrator-memory

Trigger: "recuerda", "qué hicimos", "cómo quedó", "guarda esto", "save memory", "session summary", "contexto anterior"

## Propósito

Usar Engram como memoria persistente del orquestador para continuidad real entre sesiones.

## Reglas críticas

- Si el usuario pide recordar algo, consulta Engram antes de responder.
- Si haces una decisión importante, guarda esa decisión.
- Si descubres algo no obvio del proyecto, guárdalo.
- Si corriges un bug o cambias el flujo del orquestador, guárdalo.
- Al cerrar sesión, guarda un resumen útil para la siguiente sesión.
- Usa topic keys consistentes para no fragmentar la memoria del proyecto.
- Engram complementa el flujo del orquestador; no reemplaza `QUEUE.md` ni la TUI.

## Resultado esperado

La siguiente sesión debe poder recuperar contexto útil sin volver a explorar todo desde cero.
