# Architecture

## General Model

The orchestrator has three layers:

1. **Global CLI package**
   - installed once with npm
   - exposes `orchestrator-multiagents`
2. **Orchestrator workspace per project**
   - created as a sibling of the real project
   - contains queue, docs, skills, logs, handoffs, and artifacts
3. **Real project repo**
   - remains clean
   - referenced from `orchestrator.config.json`

## Main Components

- **Runtime**: `orchestrator.js`, queue parser, scheduler, agent launcher
- **UI**: Ink TUI and legacy Blessed TUI
- **Routing**: `ORCHESTRATOR.md`, `CLAUDE.md`, local skills
- **Skills**: project-local skills in `.claude/skills/`
- **Memory**: Engram conventions and summaries
- **Artifacts**: OpenSpec lifecycle
- **Installer**: CLI commands for creating workspaces

## Execution Model

Claude-Orchestrator coordinates work but does not edit the real project directly.

Workers execute TASKs:

- Codex for structured implementation
- OpenCode for exploration, audits, and scoped implementation
- Backend/Frontend as Claude-Workers for fallback, extra capacity, and broad implementation

The queue is the boundary between orchestration and execution.

## Permissions

- Safe by default
- No commit or push from workers
- Bypass/YOLO only when explicitly started by the user
