# Claude Project Routing

Este archivo define cómo **Claude Code** debe comportarse dentro de este repo y qué skills locales debe priorizar.

## Prioridad de resolución

1. Prioriza siempre las skills locales de este repo en `./.claude/skills/`
2. Usa `.atl/skill-registry.md` como catálogo de skills del proyecto
3. Usa `ENGRAM.md` como convención local para memoria persistente
4. No dependas de `~/.claude/skills/` para el flujo principal del orquestador
5. Si existe una skill global con el mismo nombre, la **local** del proyecto gana
6. Si existe `openspec/`, úsalo como capa persistente para cambios grandes antes de delegar implementación amplia

## Routing automático de intención -> skill

### Inicio del orquestador

Si el usuario dice algo como:

- `lee ORCHESTRATOR.md y arranca`
- `arranca el orquestador`
- `inicia el orquestador`
- `start orchestrator`

usa la skill:

- `orchestrator-init`

### Exploración / análisis / investigación

Si el usuario dice algo como:

- `explora este proyecto`
- `analiza estos archivos`
- `investiga este flujo`
- `revisa esto antes de implementar`

usa la skill:

- `orchestrator-explore`

### Proposal / spec / design / tasks

Si el usuario dice algo como:

- `haz proposal`
- `haz spec`
- `haz design`
- `haz tasks`
- `documentemos este cambio`
- `prepara el cambio antes de implementarlo`

usa la skill:

- `orchestrator-propose`
- `orchestrator-spec`
- `orchestrator-design`
- `orchestrator-tasks`

### Planificación de cola / delegación

Si el usuario dice algo como:

- `crea tareas`
- `divide el trabajo`
- `llena la queue`
- `deleguemos esto`
- `planifica las tasks`

usa la skill:

- `orchestrator-queue-planning`

### OpenSpec / cambios grandes

Si el usuario dice algo como:

- `crea un change`
- `abre openspec`
- `documentemos este cambio antes de implementarlo`

usa la skill:

- `orchestrator-openspec`

### Apply / verify / archive

Si el usuario dice algo como:

- `implementa este cambio`
- `aplica las tareas`
- `verifica la implementación`
- `archiva el cambio`

usa la skill:

- `orchestrator-apply`
- `orchestrator-verify`
- `orchestrator-archive`

### Memoria / continuidad / recordatorios

Si el usuario dice algo como:

- `recuerda qué hicimos`
- `cómo quedó esto`
- `guarda este contexto`
- `haz un resumen de sesión`
- `trae el contexto anterior`

usa la skill:

- `orchestrator-memory`

## Reglas operativas

- Si hay ambigüedad entre explorar y planificar, explora primero.
- Si el usuario pide iniciar sesión del orquestador, arranca con `orchestrator-init` antes de cualquier otra cosa.
- Si el trabajo es grande, multifase o involucra varios agentes, pasa por `orchestrator-propose` / `orchestrator-spec` / `orchestrator-design` / `orchestrator-tasks` antes de llenar `QUEUE.md`.
- Si una exploración ya produjo suficiente contexto, el siguiente paso natural es `orchestrator-propose` o `orchestrator-tasks`, según el nivel de claridad.
- Si el usuario pide continuidad o recordar trabajo previo, usa `orchestrator-memory`.
- Si el usuario pide proposal/spec/design/tasks de un cambio, usa las skills `orchestrator-*` correspondientes.
- Mantén la lógica del orquestador alineada con `ORCHESTRATOR.md`.
- Mantén la memoria alineada con `ENGRAM.md`.
- Respeta las restricciones de agentes por defecto del proyecto.

## Archivos clave

- `ORCHESTRATOR.md` — rol y reglas del orquestador
- `ENGRAM.md` — convención local de memoria persistente
- `.atl/skill-registry.md` — catálogo local de skills
- `.claude/skills/*/SKILL.md` — skills locales del proyecto
- `docs/components.md` — mapa de componentes implementados
- `docs/usage.md` — flujo recomendado de uso
- `openspec/` — artefactos persistentes para cambios grandes
- `QUEUE.md` — cola activa del motor
