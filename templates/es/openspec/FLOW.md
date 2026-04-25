# OpenSpec Flow

Este archivo define el flujo real de artefactos para cambios grandes dentro del orquestador.

## Orden de fases

```text
explore -> proposal -> spec -> design -> tasks -> queue -> apply -> verify -> archive
```

## Regla general

- Si el cambio es pequeño y directo, puede ir solo por `QUEUE.md`.
- Si el cambio tiene varias fases, varios agentes o riesgo no trivial, debe pasar por `openspec/`.

## Cuándo nace un change

Crea `openspec/changes/<change-name>/` cuando ocurra cualquiera de estas:

- el usuario pide proposal, spec, design o tasks
- la exploración revela varias fases o varios agentes
- el cambio necesita trazabilidad durable
- el cambio afecta arquitectura, flujo o estructura del proyecto

## Responsabilidad de cada artefacto

### `proposal.md`

Se usa para fijar:

- objetivo del cambio
- alcance
- riesgos
- rollback

Debe existir antes de escribir `specs/spec.md`.

### `specs/spec.md`

Se usa para fijar:

- requisitos verificables
- escenarios
- expectativas observables

No debe contener detalles de implementación.

### `design.md`

Se usa para fijar:

- enfoque técnico
- componentes afectados
- decisiones
- tradeoffs

Puede omitirse si el cambio es suficientemente pequeño y la spec ya deja clara la implementación.

### `tasks.md`

Se usa para convertir proposal/spec/design en trabajo ejecutable.

Debe contener:

- tareas pequeñas
- orden sugerido
- dependencias
- bloques listos para pasar a `QUEUE.md`

### `verify-report.md`

Se llena después de ejecutar o revisar implementación.

Debe responder:

- qué quedó hecho
- si coincide con spec y design
- qué riesgos o dudas quedan
- veredicto final

### `archive-report.md`

Se usa cuando el cambio ya no seguirá activo.

Debe dejar:

- resumen final
- estado
- decisiones clave
- follow-ups

## Paso de `tasks.md` a `QUEUE.md`

`tasks.md` es la fuente de verdad para descomposición del cambio.

`QUEUE.md` es la fuente de verdad para ejecución viva del motor.

La regla es:

1. primero se escribe o actualiza `tasks.md`
2. luego solo las tareas listas para ejecución pasan a `QUEUE.md`
3. al completarse en el motor, el estado se refleja de vuelta en `tasks.md` y/o `verify-report.md` cuando haga falta

No debe aparecer implementación grande en `QUEUE.md` si antes no está aterrizada en `tasks.md`.

## Estados sugeridos del change

Usa estos estados en `.openspec.yaml`:

- `draft`
- `exploring`
- `proposed`
- `specified`
- `designed`
- `planned`
- `in-progress`
- `verifying`
- `archived`

## Criterio de avance

- `proposal -> spec`: cuando el alcance ya está claro
- `spec -> design`: cuando hace falta decisión técnica
- `design -> tasks`: cuando ya hay enfoque suficiente para ejecutar
- `tasks -> queue`: cuando ya existen tareas concretas, pequeñas y asignables
- `queue -> verify`: cuando las tareas relevantes terminaron
- `verify -> archive`: cuando el cambio ya no requiere ejecución activa

## Relación con Engram

- Usa Engram para decisiones, descubrimientos y continuidad de sesión
- Usa OpenSpec para artefactos del cambio
- No mezcles ambos roles

## Relación con la TUI

- La TUI muestra ejecución viva
- OpenSpec muestra razonamiento, estructura y trazabilidad
- `QUEUE.md` sigue siendo el puente entre ambos
