# agentflow

Reusable multi-agent orchestration workspace for coding projects.

This package installs a CLI that creates a separate orchestrator workspace next to your real project. The generated workspace can be created in **English** or **Spanish**.

```text
my-product-workspace/
  my-product/                 # real project, stays clean
  orchestrator-my-product/    # generated orchestrator workspace
```

## Install

```bash
npm i -g @liriraid/agentflow
```

## Create a Workspace

Interactive language selection:

```bash
agentflow init-workspace C:/code/my-project
```

Direct language selection:

```bash
agentflow init-workspace C:/code/my-project --lang en
agentflow init-workspace C:/code/mi-proyecto --lang es
```

The selected language controls the generated workspace files:

- `ORCHESTRATOR.md`
- `CLAUDE.md`
- `QUEUE.md`
- `PROJECT.md`
- `README.md`
- `agents/`
- `docs/`
- `openspec/`
- `.claude/`
- `.codex/`
- `.opencode/`
- `.atl/`
- `orchestrator.config.json`

## Runtime

The package runtime remains language-aware through `workspaceLanguage` in the generated `orchestrator.config.json`.

Start the TUI from the generated orchestrator workspace:

```bash
cd C:/code/orchestrator-my-project
agentflow ink --paused
```

Then open Claude Code in the same workspace and start with the prompt from that workspace's `ORCHESTRATOR.md`.

## What Gets Packaged

The npm package ships:

- `bin/`
- `src/`
- `scripts/`
- `templates/en/`
- `templates/es/`
- `orchestrator.js`
- `LICENSE`

The workspace docs and prompts live inside `templates/en` and `templates/es`; they are copied into the generated workspace based on the selected language.
