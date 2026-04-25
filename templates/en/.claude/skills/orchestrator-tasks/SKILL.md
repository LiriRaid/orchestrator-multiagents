---
name: orchestrator-tasks
description: >
  Break a change into implementation tasks that can later be translated into QUEUE.md.
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-tasks

## Purpose

Convert proposal, spec, and design into concrete implementation tasks.

## Critical Rules

- Use `openspec/changes/<change-name>/tasks.md`.
- Tasks should be small, ordered, and delegable.
- Mark dependencies clearly.
- Mark which tasks are ready to become `QUEUE.md` entries.
- Do not implement tasks directly.

## Expected Result

A task list ready for queue planning.
