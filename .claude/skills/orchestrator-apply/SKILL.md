---
name: orchestrator-apply
description: >
  Guide the implementation phase by translating ready work into queued worker tasks.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-apply

## Purpose

Run implementation through the orchestrator, not through the interactive Claude session.

## Critical Rules

- Read proposal, spec, design, tasks, and queue state when present.
- Respect `QUEUE.md` as the execution boundary.
- Do not implement code directly as Claude-Orchestrator.
- Add or update TASKs so workers can implement.
- Use Codex and OpenCode first when they fit the task.
- Use Claude-Worker for fallback, extra capacity, broad implementation, or explicit user request.
- Keep Claude as final reviewer.
- Do not commit or push.
- If implementation is partial, leave clear state for verify or the next apply pass.

## Expected Result

Implementation work is queued for workers and remains reviewable by Claude-Orchestrator.
