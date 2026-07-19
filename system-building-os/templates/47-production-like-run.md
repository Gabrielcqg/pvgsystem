---
template_id: 47-production-like-run
title: Production-like Run Verification
phase: planning
runtime: claude
produces_artifact: production-like-run.md (plan) -> executed by Codex
schema: production-like-run
---

# Production-like Run Verification

## Instructions

Define the clean production-like verification Codex must run: install from clean, init DB, migrate, configure non-secret env, build, start, health, core browser flows, auth, persistence, AI config behavior, real-provider init when credentials present, controlled behavior when absent, logs, console, failed requests, security/perf checks, evidence.

## Required fields / sections

- Ordered steps: action / expected / evidence / status
- Gates verified (production_like_run_verified + related)
- Behavior with credentials present vs absent
- Log / console / failed-request inspection

## Completeness checklist

- [ ] Steps are ordered and objective
- [ ] Covers install->build->run->health->flows->evidence
- [ ] Credential-present and credential-absent paths verified
- [ ] completion gate production_like_run_verified referenced
- [ ] Validates against production-like-run.schema.json

## Fill below

> Replace this section with the actual content for the project.
