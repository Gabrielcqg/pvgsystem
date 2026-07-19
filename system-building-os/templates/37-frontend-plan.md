---
template_id: 37-frontend-plan
title: Frontend Plan (Screens & Interactions)
phase: planning
runtime: claude
produces_artifact: frontend/screen-contracts/*.yaml + frontend/frontend-plan.md
schema: screen-contract
---

# Frontend Plan (Screens & Interactions)

## Instructions

Detailed, per-surface frontend plan. NOT a list of page names. For every page/route/modal/panel/significant component produce a full screen contract with every state and its data + backend + AI dependencies. Every surface that exposes product logic references its requirement, API/action, state-machine state, data/AI result, error/fallback, and tests.

## Required fields / sections

- Per-screen: id/purpose/user_role/route/user_objective/information_hierarchy
- main_content/layout/sections/components/primary_action/secondary_actions
- data_displayed/data_source/backend_dependency/ai_dependency/permissions/validations
- States: default/loading/streaming/generating/reconnecting/empty/partial_data/error/success/disabled/permission_denied
- responsive/keyboard/focus/accessibility/animation/transition/scroll/persistence/optimistic
- analytics
- requirement_refs / api_refs / state_machine_states
- acceptance_criteria / tests

## Completeness checklist

- [ ] Every surface has a UI-### screen contract
- [ ] All applicable states defined per surface
- [ ] Each surface maps requirement + API/action + state + tests
- [ ] No screen exposes fake/static data in a production path
- [ ] Validates against screen-contract.schema.json

## Fill below

> Replace this section with the actual content for the project.
