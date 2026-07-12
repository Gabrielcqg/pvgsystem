---
template_id: 26-file-ownership
title: File Ownership & Parallelism
phase: planning
runtime: claude
produces_artifact: 22-file-ownership.yaml + parallelization-plan.yaml
schema: file-ownership
---

# File Ownership & Parallelism

## Instructions

Prevent conflicting concurrent writes; define parallel vs serial work.

## Required fields / sections

- Path
- Owner agent/task
- Mode (exclusive/shared_read/serialized_write)
- Parallelization group
- Serialize list (shared schema/config/manifests/routing/types/migrations/final integration)
- Parallelize list (exploration/research/read-only reviews/independent modules)

## Completeness checklist

- [ ] No two write-heavy agents own the same file concurrently
- [ ] Shared schema/config/migrations serialized
- [ ] Validates against file-ownership.schema.json

## Fill below

> Replace this section with the actual content for the project.
