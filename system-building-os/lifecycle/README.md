# Lifecycle & State Machine

The project lifecycle is persistent and machine-readable. The canonical
definition is `state-machine.json`; a validator (`scripts/validate_state_machine.py`)
enforces that every non-forbidden transition connects declared states and that no
forbidden transition is reachable.

## Planning states (Claude runtime)
```
RECEIVED → UNDERSTANDING → GRILLING → [QUESTIONING] → SPECIFYING_PRODUCT
        → DESIGNING_ARCHITECTURE → DECOMPOSING → PREPARING_CODEX
        → VALIDATING_PLAN → IMPLEMENTATION_READY
```

## Implementation states (Codex runtime)
```
INITIALIZING → INSPECTING_REPOSITORY → BOOTSTRAPPING → IMPLEMENTING
            → INTEGRATING → TESTING ⇄ REPAIRING → REVIEWING
            → VALIDATING_ACCEPTANCE ⇄ REPAIRING → DOCUMENTING
            → READY_FOR_DELIVERY → COMPLETED
IMPLEMENTING ⇄ REPLANNING_IMPLEMENTATION_PATH
(any impl state) → BLOCKED_EXTERNALLY → IMPLEMENTING
```

## Allowed repair loops
- `TESTING → REPAIRING → TESTING`
- `IMPLEMENTING → REPLANNING_IMPLEMENTATION_PATH → IMPLEMENTING`
- `VALIDATING_ACCEPTANCE → REPAIRING → VALIDATING_ACCEPTANCE`

## Forbidden (never allowed)
- `RECEIVED → IMPLEMENTING`
- `IMPLEMENTING → COMPLETED`
- `TESTING (failed) → COMPLETED`

## Persistence
State is written to `runtime/state.json`, an append-only
`runtime/execution-ledger.jsonl`, `runtime/task-status.yaml`,
`runtime/checkpoints/`, and `runtime/phase-logs/`. Under an active project these
are scoped to `plans/active/<slug>/runtime/`.

A blank runtime template lives at `system-building-os/runtime/state.template.json`.
