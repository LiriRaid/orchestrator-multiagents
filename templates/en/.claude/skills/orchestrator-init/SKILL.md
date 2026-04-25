---
name: orchestrator-init
description: >
  Initialize the orchestrator session: read ORCHESTRATOR.md, config, queue, progress, handoffs, and visible state before asking for the next priority.
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-init

Trigger examples: "start", "start orchestrator", "read ORCHESTRATOR.md and start", "lee ORCHESTRATOR.md y arranca".

## Purpose

Prepare a new orchestrator session without executing project work directly.

## Critical Rules

- Read `ORCHESTRATOR.md` completely before responding.
- Read `orchestrator.config.json` to understand repos, agents, and models.
- Read `QUEUE.md` to detect pending, active, and completed work.
- Read the newest handoff if present.
- Read progress files if present.
- Use `PROJECT.md` and `openspec/` as context when available.
- Do not implement code during startup.
- Reply that the orchestrator is ready and ask what the user wants to prioritize.

## Expected Result

Claude is ready as Claude-Orchestrator and has not performed project implementation directly.
