---
template_id: 07-data-architecture-plan
title: Data Architecture Plan
phase: planning
runtime: claude
produces_artifact: 07-data-architecture.md + data-model.yaml
schema: data-model
---

# Data Architecture Plan

## Instructions

Cover storage decision, entities, and machine-readable data model.

## Required fields / sections

- Database requirement decision
- Relational/document/kv/graph/vector needs
- Recommended database + provider
- Local/test/staging/production databases
- Entities, fields, types
- Relationships
- Ownership
- Constraints/unique/indexes
- Query patterns
- Transactions/concurrency
- Soft vs hard delete
- Audit fields/timestamps
- Data classification / personal data / encryption
- Retention/archival/backup/restore
- Migration/rollback/schema drift
- Seeds/fixtures
- Row-level security / multi-tenant isolation
- Analytics/reporting
- File storage / vector storage / cache

## Completeness checklist

- [ ] Every entity has a machine-readable representation
- [ ] data-model.yaml validates against data-model.schema.json
- [ ] Indexes map to query needs
- [ ] Personal data + classification marked
- [ ] Migration + rollback considered

## Fill below

> Replace this section with the actual content for the project.
