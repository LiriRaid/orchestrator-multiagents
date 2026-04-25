# Agents

## Default Operational Families

The default operational model uses:

- **Codex**: structured implementation, tests, docs, narrow frontend support
- **OpenCode**: exploration, audits, reports, scoped implementation
- **Claude-Worker**: backend/frontend implementation through `Backend` and `Frontend` when needed

Claude-Orchestrator is the interactive coordinator and final reviewer. It should not edit the real project directly.

## Claude-Orchestrator vs Claude-Worker

- **Claude-Orchestrator** reads context, updates `QUEUE.md`, delegates, monitors, and reviews.
- **Claude-Worker** agents (`Backend`, `Frontend`) are launched by the TUI and can edit code when assigned a TASK.

If the user requests implementation, the orchestrator should create TASKs. It should not silently do the work itself.

## Frontend Preference

Codex can work on `repo=frontend`, but with lower permission. Use it for tests, technical docs, mechanical refactors, punctual fixes, and well-delimited file edits.

Use `Frontend`/Claude-Worker for broad UI/UX changes, component architecture, interactive flows, or visual decisions.

## Review Authority

Claude remains the final reviewer for:

- consistency with the TASK
- alignment with the user's intent
- acceptance of sensitive changes
- fallback decisions when another worker fails
