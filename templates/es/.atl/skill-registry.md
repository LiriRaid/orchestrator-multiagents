# Skill Registry

**Project-local only.** This registry prioritizes skills inside `./.claude/skills/` so the workflow does not depend on global installations such as `gentle-ai`.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| manual | orchestrator-apply | `.claude/skills/orchestrator-apply/SKILL.md` |
| manual | orchestrator-archive | `.claude/skills/orchestrator-archive/SKILL.md` |
| manual | orchestrator-design | `.claude/skills/orchestrator-design/SKILL.md` |
| manual | orchestrator-explore | `.claude/skills/orchestrator-explore/SKILL.md` |
| manual | orchestrator-init | `.claude/skills/orchestrator-init/SKILL.md` |
| manual | orchestrator-memory | `.claude/skills/orchestrator-memory/SKILL.md` |
| manual | orchestrator-openspec | `.claude/skills/orchestrator-openspec/SKILL.md` |
| manual | orchestrator-propose | `.claude/skills/orchestrator-propose/SKILL.md` |
| manual | orchestrator-queue-planning | `.claude/skills/orchestrator-queue-planning/SKILL.md` |
| manual | orchestrator-spec | `.claude/skills/orchestrator-spec/SKILL.md` |
| manual | orchestrator-tasks | `.claude/skills/orchestrator-tasks/SKILL.md` |
| manual | orchestrator-verify | `.claude/skills/orchestrator-verify/SKILL.md` |

## Compact Rules

### orchestrator-apply
- Read proposal, spec, design, tasks, and queue state when present.
- Respect `QUEUE.md` as the execution boundary.
- Do not implement code directly as Claude-Orchestrator.
- Add or update TASKs so workers can implement.
- Use Codex and OpenCode first when they fit the task.
- Use Claude-Worker for fallback, extra capacity, broad implementation, or explicit user request.
- Keep Claude as final reviewer.
- Do not commit or push.

### orchestrator-archive
- Confirm proposal, spec, design, tasks, and verify report are coherent.
- Write or update `archive-report.md`.
- Note completed work, remaining risks, and follow-ups.
- Do not archive incomplete work as complete.

### orchestrator-design
- Use `openspec/changes/<change-name>/design.md`.
- Prefer existing project patterns.
- Capture tradeoffs and risks clearly.
- Keep design aligned with the proposal and spec.
- Do not implement code directly.

### orchestrator-explore
- Understand the user's exact scope first.
- Prefer exploration before implementation when context is unclear.
- Use OpenCode as the first support worker for broad reading, audits, and structured findings when appropriate.
- Do not fill `QUEUE.md` with implementation tasks until enough context exists.
- Summarize findings in actionable terms: what exists, what is missing, what risks exist, and what tasks follow.
- If the change is large or multi-phase, move toward OpenSpec.
- If work is clear, convert findings into concrete TASKs.

### orchestrator-init
- Read `ORCHESTRATOR.md` completely before responding.
- Read `orchestrator.config.json` to understand repos, agents, and models.
- Read `QUEUE.md` to detect pending, active, and completed work.
- Read the newest handoff if present.
- Read progress files if present.
- Use `PROJECT.md` and `openspec/` as context when available.
- Do not implement code during startup.
- Reply that the orchestrator is ready and ask what the user wants to prioritize.

### orchestrator-memory
- Follow `ENGRAM.md`.
- Save decisions, bug fixes, discoveries, setup changes, and session summaries.
- Do not save secrets, credentials, API keys, or private customer data.
- Memory complements `QUEUE.md`, OpenSpec, and handoffs. It does not replace them.

### orchestrator-openspec
- Multi-phase changes
- Multi-agent changes
- User explicitly asks for proposal, spec, design, or tasks
- The change needs durable traceability
- Create changes under `openspec/changes/<change-name>/`.
- Use clear kebab-case change names.
- Keep proposal, spec, design, tasks, verify report, and archive report consistent.
- `tasks.md` should be translatable into `QUEUE.md`.

### orchestrator-propose
- Read the user's request and current project context.
- Use `openspec/changes/<change-name>/proposal.md`.
- Keep the proposal short, actionable, and durable.
- Do not implement code while writing the proposal.

### orchestrator-queue-planning
- Create small, concrete, executable TASKs.
- Every TASK must include agent, priority, repo, and a clear description.
- Use `> after:TASK-NNN` for dependencies.
- Do not implement the task directly as Claude-Orchestrator.
- Prefer assigning first executable work to `Codex` or `OpenCode` when they are suitable.
- Use Claude-Worker only for fallback, extra capacity, sensitive work, broad implementation, or when explicitly requested.
- Codex can work in `repo=frontend`, but only for narrow, clear, verifiable tasks.
- Broad frontend work should go to `Frontend`/Claude-Worker.

### orchestrator-spec
- Use `openspec/changes/<change-name>/specs/spec.md`.
- Focus on observable behavior.
- Include acceptance criteria when useful.
- Do not mix implementation details into the spec unless needed for clarity.
- Do not implement code directly.

### orchestrator-tasks
- Use `openspec/changes/<change-name>/tasks.md`.
- Tasks should be small, ordered, and delegable.
- Mark dependencies clearly.
- Mark which tasks are ready to become `QUEUE.md` entries.
- Do not implement tasks directly.

### orchestrator-verify
- Read proposal, spec, design, tasks, queue entries, logs, and reports when present.
- Compare implementation against the requested behavior.
- Identify gaps, regressions, missing tests, or unclear results.
- Do not accept worker output blindly.
- Create follow-up TASKs in `QUEUE.md` if verification finds work to do.

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| CLAUDE.md | `CLAUDE.md` |  |
| ORCHESTRATOR.md | `ORCHESTRATOR.md` | Orchestrator session entry point |
| PROJECT.md | `PROJECT.md` |  |
| README.md | `README.md` |  |

## Resolution Policy

- Always prefer local skills from `./.claude/skills/`.
- Do not depend on `~/.claude/skills/` for the main orchestrator workflow.
- If a global skill has the same name as a project-local skill, the local skill wins.
- Regenerate this file after creating, deleting, or changing local skills.
