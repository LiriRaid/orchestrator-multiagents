---
name: orchestrator-queue-planning
description: >
  Convert user requests, specs, or findings into concrete TASK entries for QUEUE.md.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-queue-planning

## Purpose

Turn the user's request into executable queue work for the TUI.

## Critical Rules

- Create small, concrete, executable TASKs.
- Every TASK must include agent, priority, repo, and a clear description.
- Use `> after:TASK-NNN` for dependencies.
- Do not implement the task directly as Claude-Orchestrator.
- Prefer assigning first executable work to `Codex` or `OpenCode` when they are suitable.
- Use Claude-Worker only for fallback, extra capacity, sensitive work, broad implementation, or when explicitly requested.
- Codex can work in `repo=frontend`, but only for narrow, clear, verifiable tasks.
- Broad frontend work should go to `Frontend`/Claude-Worker.
- Keep `QUEUE.md` aligned with the user's current objective.

## Expected Result

`QUEUE.md` contains clear TASKs ready for the TUI to run.
