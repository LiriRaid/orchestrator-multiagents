# Arquitectura

## Modelo general

El orquestador se divide en:

1. **Paquete CLI global**
   - se instala una sola vez con npm
   - expone `agentflow`
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
- Claude también puede trabajar como agente ejecutor mediante los workers `Backend` y `Frontend`
- OpenCode explora, lee contexto, audita y también puede implementar código
- Codex implementa trabajo estructurado en backend y también puede apoyar frontend en tareas acotadas
- Claude sigue siendo el revisor final y el filtro principal de calidad

El rol interactivo de Claude no edita el proyecto real directamente; coordina y revisa. La ejecución de código por Claude ocurre a través de una TASK asignada a un agente Claude-Worker en la cola.

## Modelo de permisos

- Seguro por defecto
- Sin bypass / YOLO por defecto
- Bypass explícito solo si el usuario inicia una sesión con `--yolo`
