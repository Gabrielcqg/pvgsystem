# Failure Recovery Contract

Codex must not stop at the first failure. It runs a bounded repair loop and
prevents infinite retries.

```
Failure detected
  → Classify failure
  → Collect minimal evidence
  → Review previous attempts
  → Choose repair strategy (must differ from prior identical attempt)
  → Create checkpoint
  → Apply bounded correction
  → Run targeted validation
  → Run regression validation
  → Continue OR select a different strategy
```

## Failure categories
`syntax, type, build, unit_test, integration_test, browser, database, migration,
dependency, environment, external_integration, security, performance,
requirement_mismatch, architectural_mismatch`.

## Loop-prevention rules (for repeated failure)
1. Compare attempts (attempt log in `runtime/repair-attempts.jsonl`).
2. Prohibit identical retries.
3. Widen diagnosis.
4. Invoke a specialist agent.
5. Consider an alternative implementation.
6. Revert only the failed approach; preserve successful work.
7. Record the evidence.

A task is classified `BLOCKED_EXTERNALLY` only after safe local alternatives are
exhausted (`failure-recovery` skill + `failure-recovery-agent`). The maximum
distinct-strategy attempts per task is bounded (default 4) before escalation to
recovery, and recovery may split the task or mark it externally blocked with a
documented reason.
