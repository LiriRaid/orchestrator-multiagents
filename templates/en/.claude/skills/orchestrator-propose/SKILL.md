---
name: orchestrator-propose
description: >
  Create or update the proposal for a significant change before implementation.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-propose

## Purpose

Define what the change is, why it matters, what is in scope, and what is explicitly out of scope.

## Critical Rules

- Read the user's request and current project context.
- Use `openspec/changes/<change-name>/proposal.md`.
- Keep the proposal short, actionable, and durable.
- Do not implement code while writing the proposal.

## Expected Result

A proposal that can move into spec, design, tasks, and queue planning.
