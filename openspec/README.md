# OpenSpec Workspace

Esta carpeta guarda los artefactos SDD del proyecto.

## Estructura

```text
openspec/
├── changes/
│   ├── archive/
│   └── <change-name>/
├── specs/
└── templates/
```

## Objetivo

Usar `openspec/` como capa persistente para cambios importantes, sin depender solo de conversación, `QUEUE.md` o memoria corta.

## Flujo recomendado

1. **Explorar** una idea o problema
2. Crear un **change** en `openspec/changes/<change-name>/`
3. Escribir:
   - `proposal.md`
   - `specs/spec.md`
   - `design.md`
   - `tasks.md`
   - `verify-report.md`
   - `archive-report.md`
4. Guardar specs delta dentro de:
   - `openspec/changes/<change-name>/specs/`
5. Cuando el cambio termine:
   - moverlo a `openspec/changes/archive/`
   - reflejar aprendizaje útil en Engram

## Regla de diseño

- `openspec/` complementa `QUEUE.md`; no lo reemplaza.
- `QUEUE.md` sigue siendo la cola operativa del motor.
- `openspec/` guarda la intención, la spec delta, el diseño, el checklist y la verificación de cambios relevantes.

## Nombres de changes

Usa nombres claros, por ejemplo:

- `add-orchestrator-installer`
- `integrate-openspec-routing`
- `add-agent-config-sync`
- `improve-open-code-exploration`

Evita:

- `test`
- `wip`
- `change-1`

## Relación con el orquestador

- Claude puede usar `openspec/` para pensar y persistir cambios más grandes.
- `QUEUE.md` puede derivarse de `tasks.md`.
- Engram guarda continuidad y decisiones.
- La TUI sigue mostrando ejecución viva; `openspec/` guarda el razonamiento y la estructura.
