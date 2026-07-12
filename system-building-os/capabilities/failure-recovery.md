# Failure recovery capability

Diagnose, classify, and repair failures without infinite loops.

## Owning agents
- failure-recovery-agent (implementation)

## Skills
- `failure-diagnosis`
- `failure-recovery`
- `checkpoint-and-rollback`

## Plan templates
- `templates/22-release-rollback-plan.md`

## Notes

Implements the repair loop in contracts/failure-recovery.md: classify, evidence, compare attempts, prohibit identical retries, bounded correction, targeted+regression validation, escalate to external-blocked only after local options exhausted.
