# OpenSpec Workspace

This folder stores durable change artifacts.

Use it when a change is large, multi-phase, or needs traceability beyond the current chat.

## Flow

```text
proposal -> spec -> design -> tasks -> queue -> verify -> archive
```

## Structure

```text
openspec/
  FLOW.md
  changes/
    <change-name>/
      proposal.md
      specs/
        spec.md
      design.md
      tasks.md
      verify-report.md
      archive-report.md
```

Translate ready tasks into `QUEUE.md` when execution begins.
