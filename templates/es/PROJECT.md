# Orquestador Multiagente

Documento interno de estado y arquitectura del repo reusable.

## Propósito actual

Este repo es la **fuente reusable** del orquestador.

No es el repo del producto final del usuario.

Su función es:

- servir como base local que LiriRaid puede seguir modificando
- producir un paquete instalable
- montar workspaces sibling para proyectos reales

## Modelo correcto de instalación

La dirección deseada no es copiar este repo dentro de cada proyecto.

La dirección correcta es:

- paquete global o ejecutable por `npx`
- proyecto real separado
- workspace sibling del orquestador al lado del proyecto

Ejemplo:

- proyecto:
  - `C:/code/mi-proyecto`
- workspace del orquestador:
  - `C:/code/orchestrator-mi-proyecto`

Esto evita ensuciar el repo del producto con:

- `QUEUE.md`
- `logs/`
- `openspec/`
- `handoffs/`
- `progress/`

## Regla de instalación

La instalación recomendada para usuarios finales es:

```bash
npm i -g @liriraid/agentflow-ai
```

Después, por cada proyecto real:

```bash
agentflow init-workspace C:/code/mi-proyecto
```

El comando puede recibir `--lang en` o `--lang es`; si no se pasa, pregunta interactivamente.

La variante con `npx` sigue siendo válida:

```bash
npx @liriraid/agentflow-ai-ai init-workspace C:/code/mi-proyecto
```

No se recomienda `npm install @liriraid/agentflow-ai-ai  dentro del repo del producto, porque eso lo vuelve una dependencia local del proyecto en vez de una herramienta global del entorno.

## Regla de permisos

El comportamiento deseado del sistema no es `YOLO` por defecto.

Meta operativa:

- permitir que los agentes trabajen y propongan cambios
- evitar autoaceptación ciega en agentes de ejecución
- mantener a Claude como árbitro principal de calidad y consistencia
- permitir que OpenCode explore primero, pero también implemente cuando el reparto de tareas lo necesite
- dejar la aceptación final en manos del usuario

Esto es especialmente importante cuando el agente de apoyo también modifica código y no solo lee contexto.

Si el usuario quiere un modo agresivo para una sesión concreta, debe activarlo explícitamente con `--yolo`. No debe ser el modo base del sistema.

## Capas del sistema

### 1. Runtime

- `orchestrator.js`
- scheduler
- parser de `QUEUE.md`
- integración con CLIs reales
- retries
- fallback
- logs

### 2. UI

- `src/ink/*` como TUI moderna
- `orchestrator.js` / blessed como base histórica

### 3. Routing local

- `ORCHESTRATOR.md`
- `CLAUDE.md`
- `.atl/skill-registry.md`

### 4. Skills locales

Viven en:

```bash
.claude/skills/
```

Hoy incluyen:

- `orchestrator-init`
- `orchestrator-explore`
- `orchestrator-propose`
- `orchestrator-spec`
- `orchestrator-design`
- `orchestrator-tasks`
- `orchestrator-queue-planning`
- `orchestrator-apply`
- `orchestrator-verify`
- `orchestrator-archive`
- `orchestrator-memory`
- `orchestrator-openspec`

### 5. Memoria

- `ENGRAM.md`
- Engram como memoria persistente

### 6. Artefactos SDD

- `openspec/`
- `openspec/FLOW.md`
- templates
- scaffolder de changes

### 7. Configuración por agente

- `AGENT-CONFIG.md`
- `agentProfiles` en `orchestrator.config.json`
- `.claude/`
- `.codex/`
- `.opencode/`

### 8. Installer / ecosystem configurator

- `bin/agentflow.mjs`
- instalación en workspace sibling
- base preparada para npm

### 9. Documentation layer

- `docs/architecture.md`
- `docs/components.md`
- `docs/agents.md`
- `docs/engram.md`
- `docs/openspec.md`
- `docs/usage.md`

## Estado real de la arquitectura

### Ya está integrado

- skills locales del proyecto
- registry local
- routing con `CLAUDE.md`
- Engram
- OpenSpec
- configuración reusable por agente
- installer base
- TUI Ink conectada al motor

### Sigue en evolución

- publicación final en npm
- pulido del installer
- integración más profunda entre OpenSpec y cola viva
- posible crecimiento a más skills SDD

## Regla de diseño principal

Este proyecto debe:

- **priorizar configuración local del repo**
- **no depender de herramientas externas para el flujo base**
- **no depender de skills globales del usuario**
- **permitir trabajar con 3 agentes hoy y más mañana**
- **mantener a Claude como orquestador principal**
- **permitir que OpenCode y Codex implementen código, con Claude como revisor final y fallback**
- **permitir que Claude también avance código como Claude-Worker (`Backend` / `Frontend`) cuando haya tareas paralelas o cuando otro agente falle**

## Flujo operativo esperado

1. Instalar o inicializar el workspace sibling del orquestador
2. Editar `orchestrator.config.json`
3. Levantar la TUI
4. Abrir Claude Code en el workspace del orquestador
5. Decir:

```text
Lee ORCHESTRATOR.md y arranca.
```

6. Claude:
   - usa `CLAUDE.md`
   - resuelve skills
   - usa Engram
   - usa OpenSpec si el cambio es grande
   - traduce trabajo a `QUEUE.md`
   - reparte la primera tanda entre Claude-Worker, Codex y OpenCode cuando existan tareas independientes suficientes
7. El motor ejecuta
8. La TUI refleja el movimiento real de los agentes

## Regla sobre git

- ningún agente hace commit
- ningún agente hace push
- git siempre queda manualmente en manos del usuario

## Regla sobre dependencias del flujo

Meta:

- dejar solo Engram y el orquestador propio como base operativa
- seguir funcionando con skills locales y config local
- no depender del bootstrap ni de la estructura de otra herramienta

## Siguiente foco natural

Antes de cerrar esta etapa:

- revisar el checklist final de publicación npm
- publicar el paquete
- validar luego la experiencia completa sobre un proyecto real de ejemplo
