# OpenSpec

OpenSpec is the durable planning layer for changes that are too large to keep only in chat.

Recommended flow:

```text
explore -> proposal -> spec -> design -> tasks -> queue -> apply -> verify -> archive
```

## Files

Each change should live under:

```text
openspec/changes/<change-name>/
```

Typical files:

- `proposal.md`
- `specs/spec.md`
- `design.md`
- `tasks.md`
- `verify-report.md`
- `archive-report.md`

## Relationship With The Queue

`tasks.md` is the durable plan. `QUEUE.md` is the live execution queue.

When implementation begins, translate ready items from `tasks.md` into concrete TASK entries in `QUEUE.md`.
