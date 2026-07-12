# How to Configure Production
Production is policy-driven via profiles (`policies/production-autonomy.md`):
`local_full_autonomy`, `development_full_autonomy`, `staging_full_autonomy`,
`production_managed_autonomy`. The managed profile requires pre-deploy checks,
backup verification, expand-and-contract migrations, canary rollout, automatic
rollback, and post-deploy validation. Missing prod credentials never block local
work — a deployment-ready package is produced instead.
