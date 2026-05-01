# Agent Config

This file documents the reusable agent configuration layer.

## Goal

Separate two levels:

1. **Runtime config**
   - Lives in `orchestrator.config.json` under `agents` and `repos`.
   - Controls which agents the engine can launch and which repos they work on.

2. **Agent profile config**
   - Lives in `orchestrator.config.json` under `agentProfiles`.
   - Describes local config folders and shared settings for each CLI family.

This allows the workspace to run one agent, the default three-agent setup, or a larger future setup without redesigning the config.

## Design Rule

- `agents`: operational worker instances visible to the TUI.
- `agentProfiles`: reusable configuration by agent family.

Examples:

- `Backend` and `Frontend` share the `claude` profile.
- `Codex` uses the `codex` profile.
- `OpenCode` uses the `opencode` profile.

## Claude-Orchestrator vs Claude-Worker

The `claude` profile can appear in two operational roles:

- **Claude-Orchestrator**: the interactive session that reads `ORCHESTRATOR.md`, updates `QUEUE.md`, delegates, monitors, and reviews.
- **Claude-Worker**: workers such as `Backend` and `Frontend`, launched by the TUI, that can edit code when they receive a TASK.

Claude-Orchestrator must not modify the real project directly. If Claude should work on code, assign a TASK to `Backend` or `Frontend`.

Default routing should put executable work on Codex or OpenCode first when they are suitable. Claude-Worker is used for fallback, extra capacity, sensitive work, or broad frontend/backend implementation.

## Suggested `agentProfiles` Fields

| Field | Required | Purpose |
| --- | --- | --- |
| `enabled` | No | Whether the profile is active for the project |
| `localConfigDir` | No | Local project folder for that agent |
| `skillsDir` | No | Local skills folder, when applicable |
| `primary` | No | Whether this profile is the main orchestrator profile |
| `useForOrchestration` | No | Whether this profile can orchestrate |
| `notes` | No | Operational notes or restrictions |

## Initial Convention

- `claude` is the primary profile.
- `codex` is the primary implementation profile
- `opencode` is a support profile that **can implement code when using advanced models** (e.g., Mistral Medium 3.5 128B)
- Other profiles can exist while remaining disabled by default.

## Suggested Local Folders

- `.claude/`
- `.codex/`
- `.opencode/`

These folders are project-local. They should not depend only on the user's global home configuration.

## Priority

If both global and local agent configuration exist, the local project config should win for this orchestrator workflow.

## Relationship With Skills

- Claude uses `.claude/skills/` as the main project skill base.
- Codex and OpenCode can have their own local config even if they do not use the same skill model today.
- OpenCode can explore, audit, and **implement code when using advanced models** like Mistral Medium 3.5 128B.
- The design should allow richer local layers for additional agents later.
