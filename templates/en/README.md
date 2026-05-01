# agentflow-ai

**Multi-Agent Orchestration System for AI-Powered Development**

A reusable workspace orchestrator that coordinates multiple AI coding agents to work **in parallel** on real projects, while keeping the project repository **completely clean** of orchestrator files.

```text
project-workspace/
  my-project/          # Real project (stays clean)
  orchestrator-my-project/  # Orchestrator workspace (generated)
```

## 🎯 What It Does

- **Coordinates multiple AI agents** (Claude, Codex, OpenCode, etc.) to work simultaneously on your project.
- **Real-time monitoring** with a modern TUI (Terminal User Interface) that shows live agent status, queue, and progress.
- **Automatic task delegation** based on agent specialization (analysis, implementation, code review).
- **Persistent memory** using Engram to maintain context across sessions.
- **Spec-Driven Development (SDD)** support with OpenSpec for large, multi-phase changes.
- **Fallback system** that automatically reassigns tasks when an agent fails or reaches rate limits.
- **Multi-language support** (English and Spanish) for all templates and documentation.

## ✨ Key Features

### 1. **Sibling Workspace Model**
- The orchestrator creates a **separate workspace** next to your real project.
- Your project repository **stays completely clean** (no `QUEUE.md`, `logs/`, or orchestrator files).
- Agents work on the real project files via absolute paths configured in `orchestrator.config.json`.

### 2. **Multi-Agent Coordination**
| Agent | CLI | Default Model | Implementation? | Notes |
|-------|-----|----------------|----------------|-------|
| **Claude-Orchestrator** | - | - | ❌ No | Session coordinator only |
| **Codex** | `codex` | gpt-5.5 | ✅ Yes | Primary implementation |
| **OpenCode** | `opencode` | auto | ✅ **Yes** (with Mistral Medium 3.5 128B) | Secondary implementation |
| **Claude-Worker** (Backend/Frontend) | `claude` | sonnet | ✅ Yes | Fallback implementation |
| **Gemini** | `gemini` | auto | ❌ No | Audits/reviews only |
| **Cursor** | `cursor` | auto | ❌ No | Bulk edits only |
| **Abacus** | `abacusai` | auto | ❌ No | Small focused tasks |

### 3. **Real-Time Operation**
- **fs.watch on QUEUE.md**: Detects changes in **~1-2 seconds** (Linux/macOS: direct file watch; Windows: directory watch fallback).
- **Live TUI updates**: The dashboard refreshes automatically when tasks are added, started, or completed.
- **Instant notifications**: Claude-Orchestrator receives alerts in `INBOX.md` and `NOTIFY.md` when tasks finish.

### 4. **Smart Task Delegation**
- **Analysis tasks** → Always assigned to **OpenCode**.
- **Implementation tasks** → Assigned to **Codex** (1st) → **OpenCode** (2nd, if using Mistral Medium 3.5 128B) → **Claude-Worker** (3rd).
- **Fallback chain**: `Codex → OpenCode → Claude-Worker` (automatic).

### 5. **Persistent Memory & SDD**
- **Engram**: Stores decisions, bugs, and findings across sessions.
- **OpenSpec**: Supports `proposal.md`, `spec.md`, `design.md`, `tasks.md`, and `verify-report.md` for large changes.
- **Handoffs**: Session summaries for continuity.

## 🚀 Installation

### Global CLI (Recommended)
```bash
npm i -g @liriraid/agentflow-ai
```

### Local Development
```bash
git clone https://github.com/LiriRaid/agentflow-ai.git
cd agentflow-ai
npm install
```

## 🛠️ Quick Start

### 1. Create an Orchestrator Workspace
```bash
# Interactive (asks for language)
agentflow init-workspace C:/code/my-project

# Direct (English)
agentflow init-workspace C:/code/my-project --lang en

# Direct (Spanish)
agentflow init-workspace C:/code/my-project --lang es
```
This creates a sibling workspace (e.g., `orchestrator-my-project/`) with all configuration files.

### 2. Configure Repositories
Edit `orchestrator.config.json` in the generated workspace:
```json
{
  "repos": {
    "backend": "C:/code/my-backend",
    "frontend": "C:/code/my-frontend"
  }
}
```

### 3. Start the TUI
```bash
cd orchestrator-my-project
agentflow ink --paused
```
**Controls:**
- `S`: Start/Resume
- `P`: Pause
- `R`: Reload queue
- `Q`: Quit (stops all agents)

### 4. Launch Claude Code
Open a second terminal in the **orchestrator workspace** (not the real project):
```bash
cd orchestrator-my-project
claude
```
Then run:
```
Read ORCHESTRATOR.md and start.
```

### 5. Request Work
Examples:
- `"Explore this project"` → OpenCode analyzes and reports.
- `"Add JWT authentication"` → OpenCode analyzes, then Codex/OpenCode implement.
- `"Refactor the API layer"` → OpenCode explores, then workers implement in parallel.

## 📁 Workspace Structure

The generated workspace includes:

```text
orchestrator-my-project/
├── ORCHESTRATOR.md      # Core rules for the orchestrator session
├── CLAUDE.md            # Routing rules for Claude
├── QUEUE.md             # Active task queue (TASK-NNN | title | agent | ...)
├── ENGRAM.md            # Persistent memory conventions
├── orchestrator.config.json  # Repos, agents, models, and profiles
├── agents/              # Agent-specific instructions
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   ├── CODEX.md
│   └── OPENCODE.md
├── .claude/             # Local Claude skills and config
│   └── skills/          # Orchestrator skills (init, explore, etc.)
├── .codex/              # Codex config
├── .opencode/           # OpenCode config
├── openspec/            # SDD artifacts
│   ├── changes/
│   └── templates/
├── docs/                # Documentation
├── logs/                # Execution logs
├── handoffs/            # Session handoffs
└── progress/            # Agent progress reports
```

## 🎛️ Configuration

### Agent Configuration (`orchestrator.config.json`)
```json
{
  "projectName": "My Project",
  "workspaceLanguage": "en",
  "maxConcurrent": 5,
  "pollIntervalSeconds": 5,  // Fallback polling (realtime uses fs.watch)
  "taskTimeoutMinutes": 30,
  "repos": {
    "backend": "C:/code/my-backend",
    "frontend": "C:/code/my-frontend"
  },
  "agentProfiles": {
    "claude": { "enabled": true, "localConfigDir": ".claude" },
    "codex": { "enabled": true, "localConfigDir": ".codex" },
    "opencode": { "enabled": true, "localConfigDir": ".opencode" }
  },
  "agents": {
    "Backend": { "cli": "claude", "defaultRepo": "backend", "model": "sonnet" },
    "Frontend": { "cli": "claude", "defaultRepo": "frontend", "model": "sonnet" },
    "Codex": { "cli": "codex", "defaultRepo": "backend", "model": "gpt-5.5" },
    "OpenCode": { "cli": "opencode", "defaultRepo": "frontend", "model": "auto" }
  }
}
```

### Model Selection
- Use `"model": "auto"` to let the agent use your default configured model (e.g., Mistral Medium 3.5 128B for OpenCode).
- Specify a model explicitly (e.g., `"model": "gpt-5.5"`) to override.

## 🔄 Workflow Example

1. **User Request**: `"Add JWT authentication to the backend."`
2. **Claude-Orchestrator**:
   - Creates `TASK-001` (OpenCode): `"Analyze current auth system"`
   - Waits for OpenCode's report in `progress/PROGRESS-OpenCode.md`
3. **OpenCode**:
   - Analyzes the codebase.
   - Writes findings to `progress/PROGRESS-OpenCode.md` and `INBOX.md`.
4. **Claude-Orchestrator**:
   - Reads OpenCode's report.
   - Creates `TASK-002` (Codex): `"Implement JWT auth"` (depends on TASK-001).
5. **Codex/OpenCode**:
   - Implements the feature (Codex first, OpenCode second if using Mistral Medium 3.5 128B).
   - Reports completion in `progress/PROGRESS-*.md`.
6. **TUI**:
   - Shows real-time updates (task status, agent activity, costs).

## 📊 Supported Agents & Models

| Agent | CLI | Default Model | Implementation? | Notes |
|-------|-----|----------------|----------------|-------|
| Backend | `claude` | sonnet | ✅ Yes | Claude-Worker for backend tasks |
| Frontend | `claude` | sonnet | ✅ Yes | Claude-Worker for frontend tasks |
| Codex | `codex` | gpt-5.5 | ✅ Yes | Primary implementation |
| OpenCode | `opencode` | auto | ✅ **Yes** (with Mistral Medium 3.5 128B) | Secondary implementation |
| Gemini | `gemini` | auto | ❌ No | Audits/reviews only |
| Cursor | `cursor` | auto | ❌ No | Bulk edits only |
| Abacus | `abacusai` | auto | ❌ No | Small focused tasks |

## 🛡️ Safety & Best Practices

- **No auto-commits**: Agents never run `git commit` or `git push`.
- **No YOLO by default**: Safe permissions mode is enabled unless `--yolo` is used.
- **Claude as reviewer**: Claude-Orchestrator validates all work before user approval.
- **Clean repos**: Project files stay untouched; orchestrator files live in the sibling workspace.
- **Fallback safety**: Tasks are automatically reassigned if an agent fails.

## 📚 Documentation

- **Core Rules**: See `ORCHESTRATOR.md` in the generated workspace.
- **Agent Routing**: See `CLAUDE.md`.
- **Architecture**: See `docs/architecture.md`.
- **OpenSpec**: See `openspec/FLOW.md`.

## 🤝 Acknowledgements

Inspired by [Orquestador-AI](https://github.com/ariellontero/Orquestador-AI) by Ariel Lontero (MIT). 
Built from scratch with a modern architecture: **Ink TUI + React, npm package, real-time fs.watch, multi-language templates, and multi-agent coordination**.
