---
name: orchestrator-explore
description: >
  Explore, analyze, or investigate the project before proposing or delegating implementation.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-explore

## Purpose

Gather useful context before creating TASKs or OpenSpec artifacts.

## Critical Rules

- Understand the user's exact scope first.
- Prefer exploration before implementation when context is unclear.
- Use OpenCode as the first support worker for broad reading, audits, and structured findings when appropriate.
- Do not fill `QUEUE.md` with implementation tasks until enough context exists.
- Summarize findings in actionable terms: what exists, what is missing, what risks exist, and what tasks follow.
- If the change is large or multi-phase, move toward OpenSpec.
- If work is clear, convert findings into concrete TASKs.

## Expected Result

The orchestrator can decide whether to plan TASKs or continue investigation.
