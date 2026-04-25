---
name: orchestrator-verify
description: >
  Verify that implementation matches proposal, spec, design, tasks, and user intent.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-verify

## Purpose

Let Claude-Orchestrator review worker output before accepting it.

## Critical Rules

- Read proposal, spec, design, tasks, queue entries, logs, and reports when present.
- Compare implementation against the requested behavior.
- Identify gaps, regressions, missing tests, or unclear results.
- Do not accept worker output blindly.
- Create follow-up TASKs in `QUEUE.md` if verification finds work to do.

## Expected Result

A clear verification decision and any required follow-up tasks.
