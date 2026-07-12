# Production Autonomy Policy

The OS supports autonomous production workflows when a production profile has been
configured. Production behavior is policy-driven, never ad hoc.

## Profiles
- `local_full_autonomy`
- `development_full_autonomy`
- `staging_full_autonomy`
- `production_managed_autonomy`

## A production-capable profile supports
- pre-deploy checks
- backup verification
- backward-compatible migrations
- expand-and-contract migration strategy
- shadow validation
- smoke tests
- health checks
- canary or staged rollout when applicable
- automatic rollback
- post-deploy validation
- deployment logs

## When production connectivity or credentials do not exist
Finish the local implementation and produce a **deployment-ready package**
(infra-as-code, migration order, runbooks, `.env.example`, health-check contracts)
rather than stopping unrelated work. Never weaken secret protection to gain
autonomy. Record the external blocker and provide automated verification for when
the resource becomes available.
