---
name: orchestrator-queue-planning
description: >
  Convert user requests, specs, or findings into concrete TASK entries for QUEUE.md.
license: MIT
metadata:
  owner: agentflow
  version: "1.1"
---

# Skill: orchestrator-queue-planning

## Purpose

Turn the user's request into executable queue work for the TUI.

## Agent Assignment Rules

### OpenCode — analysis only
- Use for exploration, audits, context reading, and structured reports.
- **Do not assign implementation** — OpenCode does not modify project files.
- If work needs prior analysis, create an OpenCode TASK first, then a Codex TASK with `> after:TASK-NNN`.

### Codex — primary implementation
- Use for implementation, code changes, tests, and docs when the spec is clear.
- It is the primary execution agent.
- If Codex fails persistently, the TUI automatically reassigns to Claude-Worker (Frontend/Backend).

### Claude-Worker (Frontend / Backend)
- Automatic fallback when Codex fails.
- Also takes overflow work when both Codex and OpenCode are busy and more tasks are pending.
- Frontend-only projects: always use `Frontend`; backend work: use `Backend`.

## Critical Rules

- Create small, concrete, executable TASKs.
- Every TASK must include agent, priority, repo, and a clear description.
- Use `> after:TASK-NNN` for dependencies.
- Do not implement the task directly as Claude-Orchestrator.
- Distribution by task count:
  - **1 analysis task**: OpenCode
  - **1 implementation task**: Codex
  - **2 parallel tasks**: OpenCode (analysis) + Codex (implementation when spec is clear)
  - **3+ tasks** with Codex busy: overflow goes to `Frontend` (FE repo) or `Backend` (BE repo)
- Keep `QUEUE.md` aligned with the user's current objective.
- **Never assign implementation to OpenCode.**

## Expected Result

`QUEUE.md` contains clear TASKs ready for the TUI to run.
