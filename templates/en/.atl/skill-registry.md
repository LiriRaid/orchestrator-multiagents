# Skill Registry

**Project-local only.** This registry prioritizes skills inside `./.claude/skills/` so the workflow does not depend on global installations.

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

## Resolution Policy

- Always prefer local skills from `./.claude/skills/`.
- Do not depend on global skills for the main orchestrator workflow.
- If a global skill has the same name, the project-local skill wins.
- Regenerate this file after creating, deleting, or changing local skills.
