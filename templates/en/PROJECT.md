# Project Notes

## Purpose

`agentflow` is a reusable workspace for coordinating multiple coding agents around a real project without placing orchestrator files inside the product repo.

The intended layout is:

```text
project-workspace/
  RealProject/
  orchestrator-realproject/
```

The real project stays clean. The orchestrator workspace keeps queue, docs, skills, OpenSpec artifacts, memory conventions, logs, and handoffs.

## Product Direction

The package should provide:

- a sibling orchestrator workspace per real project
- a TUI for live queue execution
- Claude as orchestrator and final reviewer
- Codex and OpenCode as default support workers
- Claude-Workers for fallback, extra capacity, and broad implementation
- durable memory through Engram conventions
- OpenSpec artifacts for large changes
- local skills and agent instructions

## Default Operating Model

1. Install or initialize an orchestrator workspace next to the real project.
   - Use `--lang en` or `--lang es`, or let the CLI ask interactively.
2. Configure `orchestrator.config.json`.
3. Start the TUI.
4. Open Claude Code inside the orchestrator workspace.
5. Tell Claude: `Read ORCHESTRATOR.md and start`.
6. Claude-Orchestrator reads context and asks what to prioritize.
7. User requests work.
8. Claude-Orchestrator writes TASKs into `QUEUE.md`.
9. The TUI launches workers.
10. Claude-Orchestrator reviews outputs and plans the next batch.

## Important Behavioral Rule

Claude-Orchestrator must not implement project work directly. Even if the user asks for implementation, the orchestrator should create TASKs in `QUEUE.md` and route them to worker agents first.

## Active Default Agents

- `Codex`: structured implementation, tests, docs, narrow frontend support
- `OpenCode`: exploration, audits, reports, scoped implementation
- `Backend` / `Frontend`: Claude-Workers used for fallback, extra capacity, or broad backend/frontend work

Gemini, Cursor, and Abacus can remain configured but should not be used unless the user enables them for that session.

## Git Rule

No agent should commit or push unless the user explicitly asks in the current session.

## Future Product Work

Possible next steps:

- binary distribution
- embedded templates and skills
- `doctor` command
- migration/version checks
- backup and restore
- stronger tests
- workspace sync and upgrade flow
