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
  - `C:/code/omniinbox`
- workspace del orquestador:
  - `C:/code/orchestrator-omniinbox`

Esto evita ensuciar el repo del producto con:

- `QUEUE.md`
- `logs/`
- `openspec/`
- `handoffs/`
- `progress/`

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
- `orchestrator-queue-planning`
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

- `bin/orchestrator-multiagents.mjs`
- instalación en workspace sibling
- base preparada para npm

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
- **no depender de gentle-ai**
- **no depender de skills globales del usuario**
- **permitir trabajar con 3 agentes hoy y más mañana**
- **mantener a Claude como orquestador principal**

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
7. El motor ejecuta
8. La TUI refleja el movimiento real de los agentes

## Regla sobre git

- ningún agente hace commit
- ningún agente hace push
- git siempre queda manualmente en manos del usuario

## Regla sobre dependencia de terceros

`gentle-ai` fue referencia conceptual, no dependencia objetivo.

Meta:

- poder desinstalar `gentle-ai`
- dejar solo Engram y el orquestador propio
- seguir funcionando con skills locales y config local

## Siguiente foco natural

Antes de cerrar esta etapa:

- revisar el checklist final de publicación npm
- publicar el paquete
- validar luego la experiencia completa sobre un proyecto real como `OmniInbox`
