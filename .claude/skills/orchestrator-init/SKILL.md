---
name: orchestrator-init
description: >
  Inicializa la sesión del orquestador para este proyecto: lee ORCHESTRATOR.md, la configuración, la cola y el estado visible antes de pedir la siguiente prioridad.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "0.1"
---

# Skill: orchestrator-init

Trigger: "arranca", "inicia el orquestador", "lee ORCHESTRATOR.md y arranca", "start orchestrator"

## Propósito

Preparar una sesión nueva del orquestador sin ejecutar trabajo del proyecto directamente.

## Reglas críticas

- Lee `ORCHESTRATOR.md` completo antes de responder.
- Lee `orchestrator.config.json` para saber agentes y repos disponibles.
- Lee `QUEUE.md` para detectar trabajo pendiente, en progreso y completado.
- Si existe `PROJECT.md`, úsalo como contexto del sistema.
- Si existe `openspec/`, revisa si ya hay changes activos que deban continuarse.
- No ejecutes cambios de código durante init; solo establece el contexto operativo.
- Al terminar, responde que la sesión está iniciada y pregunta qué quiere priorizar el usuario.
- Si el proyecto restringe agentes por defecto, respeta esa restricción desde el primer mensaje.

## Resultado esperado

El usuario debe sentir que Claude ya quedó actuando como orquestador y está listo para recibir una tarea o prioridad.
