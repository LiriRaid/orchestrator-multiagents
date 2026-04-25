# Usage

## Recommended Flow

### 1. Install the CLI

```bash
npm i -g @liriraid/agentflow
```

### 2. Create a sibling orchestrator workspace

```bash
agentflow init-workspace C:/code/my-project
```

If no language is passed, the CLI asks whether to generate the workspace in `EN` or `ES`. You can also pass it directly:

```bash
agentflow init-workspace C:/code/my-project --lang en
agentflow init-workspace C:/code/my-project --lang es
```

### 3. Open the orchestrator workspace

Use two terminals:

- one for the TUI
- one for Claude Code

### 4. Start the TUI

```bash
cd C:/code/orchestrator-my-project
agentflow ink --paused
```

### 5. Start Claude in the orchestrator workspace

```bash
cd C:/code/orchestrator-my-project
claude
```

Then say:

```text
Read ORCHESTRATOR.md and start.
```

### 6. Ask for work

Examples:

- `Audit the current frontend routing and create tasks.`
- `Prepare a proposal, spec, design, and tasks for the billing module.`
- `Create queue tasks for the next frontend iteration.`
- `Verify that the implementation matches the spec.`

Claude-Orchestrator should write tasks to `QUEUE.md`; it should not implement project work directly.

### 7. Run tasks

Press `R` in the TUI to reload `QUEUE.md`. Press `S` if paused.

The TUI launches the workers and streams their progress.
