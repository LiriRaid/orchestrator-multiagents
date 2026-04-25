---
name: orchestrator-spec
description: >
  Create or update the behavioral specification for a change.
license: MIT
metadata:
  owner: agentflow
  version: "1.0"
---

# Skill: orchestrator-spec

## Purpose

Turn the proposal into clear required behavior and acceptance criteria.

## Critical Rules

- Use `openspec/changes/<change-name>/specs/spec.md`.
- Focus on observable behavior.
- Include acceptance criteria when useful.
- Do not mix implementation details into the spec unless needed for clarity.
- Do not implement code directly.

## Expected Result

A spec that can guide design, tasks, implementation, and verification.
