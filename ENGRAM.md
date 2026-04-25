# Engram Memory

This file defines how the orchestrator workspace should use persistent memory.

## Purpose

Engram keeps project continuity outside the short chat context. Use it to preserve decisions, discoveries, bugs, handoffs, and session summaries.

## When To Save Memory

Save memory after:

- architectural decisions
- routing or agent-policy changes
- bug fixes
- important discoveries
- setup or configuration changes
- completed sessions with useful context
- non-obvious tradeoffs

## Recommended Format

Use concise structured notes:

```text
**What**: What changed or was discovered
**Why**: Why it matters
**Where**: Files or areas affected
**Learned**: Gotchas or durable lessons
```

## Relationship With The Orchestrator

Engram complements:

- `ORCHESTRATOR.md`
- `CLAUDE.md`
- `QUEUE.md`
- `openspec/`
- handoff files

It does not replace the queue or the TUI. Runtime work still goes through `QUEUE.md`.

## Rules

- Save memory only for information that will matter in a future session.
- Do not store secrets, API keys, credentials, or private customer data.
- Prefer short, searchable titles.
- Use project-level memory for this repo's architecture and workflow.
- At the end of meaningful work, save a session summary.
