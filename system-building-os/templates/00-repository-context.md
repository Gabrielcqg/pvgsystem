---
template_id: 00-repository-context
title: Repository & Context Preflight
phase: planning
runtime: claude
produces_artifact: 00-repository-context.md / .json
schema: null
---

# Repository & Context Preflight

## Instructions

Inspect the repository without exposing secrets. Determine whether it is empty, partial, or established, and whether the user is creating, extending, replacing, or repairing.

## Required fields / sections

- Repository maturity (empty/partial/established)
- Current stack
- Existing architecture
- Existing database configuration
- Existing authentication
- Existing frontend/backend
- Existing tests
- Existing CI/CD
- Current MCPs
- Existing Claude/Codex configuration
- Constraints that must be preserved
- Create vs extend vs replace vs repair

## Completeness checklist

- [ ] No secret values read or printed
- [ ] Both .md and .json produced
- [ ] Preserved-constraints listed
- [ ] Intent classification recorded

## Fill below

> Replace this section with the actual content for the project.
