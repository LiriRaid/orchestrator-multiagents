# Agentes

## Familias operativas

El runtime soporta varias familias de agentes, pero el modelo operativo por defecto hoy es:

- **Claude** — orquestador principal y revisor final
- **OpenCode** — exploración, lectura de contexto y también implementación cuando se le asigne
- **Codex** — implementación estructurada y apoyo técnico

Otros perfiles pueden permanecer configurados para uso futuro sin estar activos por defecto.

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
