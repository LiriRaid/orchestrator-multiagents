# Claude Project Routing

This file defines how Claude Code should behave inside this orchestrator workspace.

## Resolution Priority

1. Prefer local project skills in `./.claude/skills/`.
2. Use `.atl/skill-registry.md` as the local skill catalog.
3. Use `ENGRAM.md` for persistent memory conventions.
4. Do not rely on `~/.claude/skills/` for the main orchestrator flow.
5. If a global skill has the same name as a local skill, the local skill wins.
6. Use `openspec/` for large or multi-phase changes before broad implementation.

## Intent Routing

### Orchestrator Startup

If the user says:

- `read ORCHESTRATOR.md and start`
- `lee ORCHESTRATOR.md y arranca`
- `start orchestrator`
- `initialize the orchestrator`

use:

- `orchestrator-init`

Startup means reading context and becoming ready. It does not mean implementing the user's first task directly.

### Exploration

If the user asks to explore, analyze, investigate, or review before implementation, use:

- `orchestrator-explore`

### Proposal, Spec, Design, Tasks

If the user asks for proposal, spec, design, tasks, or a documented change, use the matching skill:

- `orchestrator-propose`
- `orchestrator-spec`
- `orchestrator-design`
- `orchestrator-tasks`
- `orchestrator-openspec`

### Queue Planning and Delegation

If the user asks to create tasks, split work, delegate, or plan the queue, use:

- `orchestrator-queue-planning`

The default output should be TASK entries in `QUEUE.md`, not direct implementation by Claude-Orchestrator.

### Apply, Verify, Archive

If the user asks to implement, apply tasks, verify implementation, or archive a change, use:

- `orchestrator-apply`
- `orchestrator-verify`
- `orchestrator-archive`

Implementation still goes through worker agents and `QUEUE.md` unless the user explicitly overrides the orchestrator rule.

### Memory and Continuity

If the user asks to remember, summarize, restore previous context, or save decisions, use:

- `orchestrator-memory`

## Operating Rules

- If intent is ambiguous between exploration and planning, explore first.
- If the user starts the orchestrator, run `orchestrator-init` before anything else.
- If work is large or multi-agent, use OpenSpec before filling `QUEUE.md`.
- If context is clear enough, convert work into concrete TASKs.
- Keep the orchestrator behavior aligned with `ORCHESTRATOR.md`.
- Keep memory behavior aligned with `ENGRAM.md`.
- Respect the default agent restrictions.
- Do not let Claude-Orchestrator implement project work directly.

## Key Files

- `ORCHESTRATOR.md`: core role and execution rules
- `QUEUE.md`: active execution queue
- `orchestrator.config.json`: agents, repos, and models
- `ENGRAM.md`: durable memory rules
- `.atl/skill-registry.md`: local skill catalog
- `.claude/skills/*/SKILL.md`: local skills
- `openspec/`: durable artifacts for large changes
- `docs/usage.md`: recommended workflow
