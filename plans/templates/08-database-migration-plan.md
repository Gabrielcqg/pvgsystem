---
template_id: 08-database-migration-plan
title: Database & Migration Plan
phase: planning
runtime: claude
produces_artifact: database-plan.md + migration-plan.md
schema: database-plan
---

# Database & Migration Plan

## Instructions

All schema changes are migration-based. Define ordering and rollback.

## Required fields / sections

- Migration tool/approach
- Migration ordering
- Backward-compatible strategy
- Expand-and-contract for destructive changes
- Rollback per migration
- Test database isolation
- Seed/fixture strategy
- Schema drift check
- Backup/restore runbook

## Completeness checklist

- [ ] Every schema change has a migration
- [ ] Rollback defined
- [ ] Drift check defined
- [ ] Test data is synthetic
- [ ] database-plan validates against database-plan.schema.json

## Fill below

> Replace this section with the actual content for the project.
