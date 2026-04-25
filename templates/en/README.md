# agentflow

A reusable multi-agent workspace for coordinating coding agents around a real project without placing orchestrator files inside the product repository.

The orchestrator lives next to the real project:

```text
project-workspace/
  RealProject/
  orchestrator-realproject/
```

The real project stays clean. The orchestrator workspace keeps queue, docs, skills, OpenSpec artifacts, memory conventions, logs, and handoffs.

## What It Does

- Starts a TUI dashboard for live agent execution.
- Uses `QUEUE.md` as the executable task queue.
- Lets Claude act as orchestrator and final reviewer.
- Runs Codex, OpenCode, and Claude-Workers as implementation agents.
- Keeps project memory and handoffs outside the deliverable repo.
- Supports OpenSpec-style proposal, spec, design, tasks, verify, and archive artifacts.
- Allows one orchestrator workspace per client or product.

## Core Rule

Claude-Orchestrator must not implement project work directly.

When the user asks for work, Claude should:

1. Read context.
2. Split the request into TASKs.
3. Write those TASKs to `QUEUE.md`.
4. Let the TUI launch the workers.
5. Review the results.

Implementation should go through worker agents unless the user explicitly overrides this rule.

## Default Agents

| Agent | CLI | Default Role |
| --- | --- | --- |
| Codex | `codex` | Structured implementation, tests, docs, narrow frontend support |
| OpenCode | `opencode` | Exploration, audits, reports, scoped implementation |
| Backend | `claude` | Claude-Worker for backend work, fallback, and extra capacity |
| Frontend | `claude` | Claude-Worker for broad frontend work, fallback, and extra capacity |

Gemini, Cursor, and Abacus can remain configured but are disabled operationally unless the user enables them for a session.

## Install

```bash
npm i -g @liriraid/agentflow
```

## Create A Workspace

```bash
agentflow init-workspace C:/code/my-project
```

If no language is passed, the CLI asks whether to generate the workspace in **EN** or **ES**. You can also pass it directly:

```bash
agentflow init-workspace C:/code/my-project --lang en
agentflow init-workspace C:/code/my-project --lang es
```

This creates a sibling workspace:

```text
C:/code/
  my-project/
  orchestrator-my-project/
```

## Configure Repos

Edit `orchestrator.config.json`:

```json
{
  "repos": {
    "backend": "C:/code/my-backend",
    "frontend": "C:/code/my-frontend"
  }
}
```

If the project only has frontend for now, both keys can temporarily point to the same repo. Update `backend` later when the backend exists.

## Start The System

Open one terminal in the orchestrator workspace:

```bash
cd C:/code/orchestrator-my-project
agentflow ink
```

Open another terminal in the same orchestrator workspace:

```bash
cd C:/code/orchestrator-my-project
claude
```

Tell Claude:

```text
Read ORCHESTRATOR.md and start.
```

Claude should read the workspace context and become the orchestrator. It should not implement the first user request directly.

## Normal Workflow

1. User asks Claude-Orchestrator for a change.
2. Claude reads the relevant project context.
3. Claude creates TASKs in `QUEUE.md`.
4. User presses `R` in the TUI to reload the queue.
5. User presses `S` if the TUI is paused.
6. The TUI launches workers.
7. Workers report `TASK_REPORT`.
8. Claude-Orchestrator reviews the output and plans the next batch.

## Queue Format

```text
TASK-NNN | short title | Agent | P1 | repo | detailed description
```

Example:

```text
TASK-004 | Audit current frontend routing | OpenCode | P1 | frontend | Inspect route structure and report risks
TASK-005 | Add inbox empty-state test | Codex | P1 | frontend | Add a narrow test for the empty inbox state
TASK-006 | Implement inbox layout polish | Frontend | P1 | frontend | Update the main inbox layout after TASK-004 findings > after:TASK-004
```

## Routing Policy

- Start executable work with Codex or OpenCode when suitable.
- Use Claude-Worker for fallback, extra capacity, broad implementation, or sensitive tasks.
- For frontend, Codex should handle narrow and verifiable tasks; Frontend/Claude-Worker should own broad UI work.
- OpenCode can audit, explore, and implement scoped tasks.
- Do not send all work to Claude just because Claude is the orchestrator.

## Models

The default config can specify models per agent:

```json
{
  "agents": {
    "Backend": { "cli": "claude", "model": "sonnet" },
    "Frontend": { "cli": "claude", "model": "sonnet" },
    "Codex": { "cli": "codex", "model": "gpt-5.5" },
    "OpenCode": { "cli": "opencode", "model": "opencode/glm-5-free" }
  }
}
```

## TUI Controls

- `R`: reload `QUEUE.md`
- `S`: start or resume
- `P`: pause
- `Q`: quit and stop agents

## Local Files

- `ORCHESTRATOR.md`: core session rules
- `CLAUDE.md`: Claude routing
- `QUEUE.md`: active queue
- `orchestrator.config.json`: repos, agents, models
- `agents/*.md`: worker instructions
- `.claude/skills/`: local skills
- `openspec/`: durable change artifacts
- `ENGRAM.md`: memory conventions
- `docs/`: reusable documentation

## Safety

- No worker commits or pushes by default.
- No bypass or YOLO mode unless the user starts the TUI with that intent.
- Claude remains the final reviewer before work is accepted.
- Customer/product repos stay clean because the orchestrator workspace is separate.
