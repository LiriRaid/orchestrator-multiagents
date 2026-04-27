---
name: orchestrator-explore
description: >
  Explore, analyze, or investigate the project before proposing or delegating implementation.
license: MIT
metadata:
  owner: agentflow
  version: "1.1"
---

# Skill: orchestrator-explore

## Purpose

Gather useful context before creating TASKs or OpenSpec artifacts.

## Critical Rules

- Understand the user's exact scope first.
- Prefer exploration before implementation when context is unclear.
- Use `OpenCode` as the exploration agent when deep codebase analysis is needed — its role is **analysis only**, not implementation.
- When delegating exploration to OpenCode, include in the brief exactly what it must report: flows, dependencies, architecture findings, inconsistencies, etc.
- Do not fill `QUEUE.md` with implementation tasks until enough context exists.
- Summarize findings in actionable terms: what exists, what is missing, what risks exist, and what tasks follow.
- If the change is large or multi-phase, move toward OpenSpec.
- If work is clear, convert findings into concrete TASKs using `orchestrator-queue-planning`.
- When OpenCode delivers its report in INBOX.md, use those findings to create implementation TASKs (assigned to Codex or Claude-Worker — never back to OpenCode).

## Expected Result

The orchestrator can decide whether to plan TASKs or continue investigation.
