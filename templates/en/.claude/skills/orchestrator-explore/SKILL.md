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
- Use **ONLY OpenCode** as the exploration agent when deep codebase analysis is needed — its role is **EXCLUSIVELY analysis**, **NEVER implementation**.
- When delegating exploration to OpenCode, include in the brief exactly what it must report: flows, dependencies, architecture findings, inconsistencies, etc.
- Do not fill `QUEUE.md` with implementation tasks until enough context exists.
- Summarize findings in actionable terms: what exists, what is missing, what risks exist, and what tasks follow.
- If the change is large or multi-phase, move toward OpenSpec.
- If work is clear, convert findings into concrete TASKs using `orchestrator-queue-planning`.
- **STRICT RULE: When OpenCode delivers its report in INBOX.md, use THOSE findings to create implementation TASKs (assigned to Codex or Claude-Worker). Under NO circumstances should Claude-Orchestrator re-analyze the code itself if OpenCode has already done so. Read the report in `progress/PROGRESS-OpenCode.md` or INBOX.md and base your decisions on that analysis.**
- If OpenCode's report is insufficient, ask OpenCode to deepen analysis on a specific area with a new analysis TASK, but **DO NOT do it yourself**.

## Expected Result

The orchestrator can decide whether to plan TASKs or continue investigation. **The final result MUST be one or more TASKs in QUEUE.md assigned to Codex or Claude-Worker for implementation, NOT more analysis by Claude-Orchestrator.**
