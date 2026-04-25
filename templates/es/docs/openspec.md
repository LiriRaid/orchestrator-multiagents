# OpenSpec

OpenSpec is the persistent artifact layer for larger or multi-phase changes.

## Canonical flow

`explore -> proposal -> spec -> design -> tasks -> queue -> apply -> verify -> archive`

## Main location

```text
openspec/
```

## Typical change layout

```text
openspec/changes/<change-name>/
```

Artifacts typically include:

- `proposal.md`
- `specs/spec.md`
- `design.md`
- `tasks.md`
- `verify-report.md`
- `archive-report.md`

## Relationship to the runtime

- OpenSpec defines the planning and artifact trail
- `QUEUE.md` defines the live execution queue
- `tasks.md` should be translated into `QUEUE.md` when execution begins
