---
name: orchestrator-openspec
description: >
  Create or update OpenSpec artifacts for large or multi-phase changes.
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-openspec

## Purpose

Use `openspec/` as the durable planning layer before delegating larger implementation work.

## When To Use

- Multi-phase changes
- Multi-agent changes
- User explicitly asks for proposal, spec, design, or tasks
- The change needs durable traceability

## Critical Rules

- Create changes under `openspec/changes/<change-name>/`.
- Use clear kebab-case change names.
- Keep proposal, spec, design, tasks, verify report, and archive report consistent.
- `tasks.md` should be translatable into `QUEUE.md`.
- Do not queue large implementation work before the OpenSpec artifacts are clear.
- Do not force OpenSpec for tiny direct changes.

## Expected Result

A coherent OpenSpec change that can feed the live queue.
