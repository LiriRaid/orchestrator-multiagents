# Components

| Component | Status | Notes |
| --- | --- | --- |
| Runtime | Implemented | `orchestrator.js` reads `QUEUE.md` and launches workers |
| Ink TUI | Implemented | Main dashboard |
| Blessed TUI | Legacy | Still available from `orchestrator.js` |
| Routing | Implemented | `ORCHESTRATOR.md`, `CLAUDE.md`, and local skills |
| Skills | Implemented | `.claude/skills/` |
| OpenSpec | Implemented | Durable artifacts for large changes |
| Engram | Implemented | Memory conventions and summaries |
| Agent config | Implemented | `orchestrator.config.json` |

The runtime is queue-driven. Claude-Orchestrator should write tasks; worker agents execute them.
