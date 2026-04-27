---
name: orchestrator-queue-planning
description: >
  Convierte contexto y hallazgos en tareas concretas para QUEUE.md, con prioridades, agente objetivo y dependencias claras.
  Trigger: "crea tareas", "planifica en queue", "divide el trabajo", "delegar tareas", "llenar queue"
license: MIT
metadata:
  owner: agentflow
  version: "0.2"
---

# Orchestrator Queue Planning

## Propósito

Traducir una necesidad del usuario o hallazgos de exploración en tareas concretas para el motor del orquestador.

## Reglas de asignación de agentes

### OpenCode — análisis solamente
- Úsalo para exploración, auditorías, lectura de contexto y reportes estructurados
- **No le asignes implementación** — OpenCode no modifica archivos del proyecto
- Si el trabajo necesita análisis previo, crea primero una TASK de OpenCode y luego una de Codex con dependencia `> after:TASK-NNN`

### Codex — implementación principal
- Úsalo para implementación, cambios de código, tests y docs técnicas cuando la spec esté clara
- Es el agente primario de ejecución
- Si Codex falla persistentemente, la TUI reasigna automáticamente a Claude-Worker (Frontend/Backend)

### Claude-Worker (Frontend / Backend)
- Es el fallback automático cuando Codex falla
- También puede tomar trabajo cuando Codex y OpenCode están ambos ocupados y hay más tareas pendientes
- Para proyectos solo frontend: usar siempre `Frontend`; para backend: `Backend`

## Reglas críticas

- Escribe TASKs pequeñas, concretas y ejecutables.
- Cada tarea debe tener agente, prioridad, repo y descripción clara.
- Usa dependencias `> after:TASK-NNN` cuando una tarea no pueda arrancar todavía.
- No sobrecargues una sola IA con demasiadas tareas si puedes paralelizar sin riesgo.
- Distribución según cantidad de TASKs independientes:
  - **1 tarea de análisis**: OpenCode
  - **1 tarea de implementación**: Codex
  - **2 tareas paralelas**: OpenCode (análisis) + Codex (implementación si la spec ya es clara)
  - **3+ tareas** y Codex ocupado: el excedente va a `Frontend` (repo FE) o `Backend` (repo BE)
- Si existe un `openspec/changes/<change-name>/tasks.md`, úsalo como fuente de verdad.
- Mantén `QUEUE.md` coherente con el objetivo actual del usuario.
- **No asignes implementación a OpenCode** bajo ninguna circunstancia.

## Resultado esperado

Una cola clara y accionable que el motor pueda despachar de inmediato.
