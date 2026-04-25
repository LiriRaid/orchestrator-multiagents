---
name: orchestrator-memory
description: >
  Use persistent memory for decisions, discoveries, bugs, setup notes, and session summaries.
license: MIT
metadata:
  owner: orchestrator-multiagents
  version: "1.0"
---

# Skill: orchestrator-memory

## Purpose

Preserve durable context for future sessions.

## Critical Rules

- Follow `ENGRAM.md`.
- Save decisions, bug fixes, discoveries, setup changes, and session summaries.
- Do not save secrets, credentials, API keys, or private customer data.
- Memory complements `QUEUE.md`, OpenSpec, and handoffs. It does not replace them.

## Expected Result

Future sessions can resume with useful context instead of rediscovering everything.
