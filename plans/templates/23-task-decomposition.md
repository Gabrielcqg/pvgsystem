---
template_id: 23-task-decomposition
title: Task Decomposition
phase: planning
runtime: claude
produces_artifact: 18-task-manifest.yaml + 19-dependency-graph.yaml
schema: task-manifest
---

# Task Decomposition

## Instructions

Atomic, objectively-verifiable tasks. No vague 'build the backend' tasks.

## Required fields / sections

- Task ID
- Title/objective/phase
- Requirements
- Dependencies
- Inputs
- Expected outputs
- files_to_create/modify/not_to_modify
- Assigned agent
- Required/optional skills
- Recommended MCP tools
- Validation commands
- Acceptance criteria
- Rollback
- Stop conditions
- Estimated complexity
- Parallelization group

## Completeness checklist

- [ ] No vague tasks
- [ ] Every task maps to requirements + acceptance criteria
- [ ] Dependencies form a DAG
- [ ] Validates against task-manifest.schema.json

## Fill below

> Replace this section with the actual content for the project.
