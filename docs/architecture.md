# Arquitectura

## Modelo general

El orquestador se divide en:

1. **Paquete CLI global**
   - se instala una sola vez con npm
   - expone `orchestrator-multiagents`
2. **Workspace del orquestador por proyecto**
   - se crea como carpeta hermana del proyecto real
   - contiene cola, estado runtime, docs, skills y artefactos
3. **Repositorio real del proyecto**
   - permanece limpio
   - es referenciado desde `orchestrator.config.json`

## Capas principales

- **Runtime** — `orchestrator.js`, parser de cola, scheduler y lanzador de agentes
- **UI** — TUI en Ink y TUI histórica en Blessed
- **Routing** — `ORCHESTRATOR.md`, `CLAUDE.md` y skill registry local
- **Skills** — skills locales del proyecto en `.claude/skills/`
- **Memoria** — Engram y sus convenciones de uso
- **Artefactos** — ciclo de vida de cambios en OpenSpec
- **Installer** — CLI global + creación de workspace

## Modelo operativo por defecto

- Claude es el orquestador principal
- OpenCode explora, lee contexto y también puede implementar
- Codex implementa trabajo estructurado
- Claude sigue siendo el revisor final y el filtro principal de calidad

## Modelo de permisos

- Seguro por defecto
- Sin bypass / YOLO por defecto
- Bypass explícito solo si el usuario inicia una sesión con `--yolo`
