# Agentes

## Familias operativas

El runtime soporta varias familias de agentes, pero el modelo operativo por defecto hoy es:

- **Claude** — orquestador principal y revisor final
- **OpenCode** — exploración, lectura de contexto y también implementación cuando se le asigne
- **Codex** — implementación estructurada y apoyo técnico; puede apoyar frontend en tareas acotadas

Otros perfiles pueden permanecer configurados para uso futuro sin estar activos por defecto.

## Claude como orquestador y worker

Claude tiene dos papeles:

- **Claude-Orquestador**: sesión interactiva que divide trabajo, mantiene `QUEUE.md`, revisa resultados y decide próximos pasos.
- **Claude-Worker**: agentes `Backend` y `Frontend` lanzados por la TUI con CLI `claude`, capaces de modificar código.

La sesión orquestadora no debe editar el proyecto real directamente. Para que Claude también trabaje en código, el orquestador asigna una TASK a `Backend` o `Frontend`.

Cuando haya varias tareas independientes, la primera tanda debe intentar ocupar a `Claude-Worker`, `Codex` y `OpenCode` en paralelo. Claude también toma tareas como fallback si Codex u OpenCode quedan bloqueados por cuota, tokens, rate limit o fallo persistente.

## Preferencia para frontend

El trabajo frontend lo lidera preferentemente `Frontend`/Claude. Codex puede recibir TASKs con `repo=frontend`, pero como apoyo menos permisivo: tests, documentación técnica, fixes puntuales, refactors mecánicos o cambios con archivos bien delimitados. Para cambios visuales amplios, arquitectura de componentes o flujos interactivos, usa `Frontend` como dueño principal.

## Capas de agentes

### `agentProfiles`

Configuración reusable por familia de agente, por ejemplo:

- `claude`
- `codex`
- `opencode`
- `gemini`
- `cursor`
- `abacusai`

### `agents`

Instancias operativas visibles en el runtime y en la TUI, por ejemplo:

- `Backend`
- `Frontend`
- `Codex`
- `OpenCode`

## Autoridad de revisión

Aunque OpenCode o Codex implementen código, Claude debe seguir siendo la autoridad principal para:

- revisión final
- consistencia contra la task
- decidir si el resultado coincide con la intención pedida
- tomar tareas como fallback cuando otro agente falla
