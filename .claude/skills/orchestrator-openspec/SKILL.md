---
name: orchestrator-openspec
description: >
  Abre, crea o actualiza artefactos de OpenSpec para cambios grandes o de varias fases.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "0.1"
---

# Skill: orchestrator-openspec

Trigger: "crea un change", "abre openspec", "haz proposal", "haz spec", "haz design", "prepara tasks del cambio"

## Propósito

Usar `openspec/` como capa persistente para cambios relevantes antes de delegar implementación al motor.

## Cuándo usar esta skill

- Cuando el cambio tiene varias fases o varios agentes
- Cuando el usuario pide proposal, spec, design o tasks explícitamente
- Cuando el cambio es lo bastante grande para no dejarlo solo en conversación
- Cuando hace falta mantener trazabilidad durable del cambio

## Reglas críticas

- Si no existe un change para el trabajo actual, crea uno en `openspec/changes/<change-name>/`.
- Usa nombres de change claros, en kebab-case y alineados con el objetivo del usuario.
- Usa `openspec/FLOW.md` como guía de fases y criterio de avance.
- Mantén consistencia entre:
  - `proposal.md`
  - `specs/spec.md`
  - `design.md`
  - `tasks.md`
  - `verify-report.md`
- Mantén `.openspec.yaml` actualizado con `status`, `current_phase` y `queue_synced` cuando el change evolucione.
- `tasks.md` debe poder traducirse luego a `QUEUE.md`.
- No llenes `QUEUE.md` de implementación grande sin haber aterrizado primero el cambio en OpenSpec cuando el trabajo lo justifique.
- Si el cambio es pequeño y directo, no fuerces OpenSpec innecesariamente.

## Flujo recomendado

1. Definir o confirmar el `change-name`
2. Crear el change con `npm run openspec:new -- <change-name>` si no existe
3. Completar o actualizar `proposal.md`
4. Completar o actualizar `specs/spec.md`
5. Completar o actualizar `design.md` si el cambio lo requiere
6. Completar o actualizar `tasks.md`
7. Convertir las tareas listas en entradas concretas para `QUEUE.md`
8. Actualizar `verify-report.md` y `archive-report.md` cuando el cambio madure o cierre

## Resultado esperado

Un change de OpenSpec coherente, reutilizable y listo para alimentar el flujo de delegación del orquestador.
