# Context Management Policy

Avoid context pollution. Each runtime thread and each agent receives only what it
needs.

## Claude main planning thread retains
- user intent (verbatim + normalized);
- major decisions;
- product requirements;
- unresolved questions;
- final synthesis.

Planning subagents receive focused assignments and return summaries + artifacts,
not raw noise.

## Codex supervisor receives
- active plan metadata;
- task statuses;
- key deviations;
- validation status.

## Implementation workers receive (via a context packet)
- the assigned task;
- relevant requirements;
- relevant architecture;
- relevant files;
- relevant tests;
- relevant skills;
- relevant MCP tools.

Do not send every planning file to every worker. Use the context-packet template
(`templates/27-context-packet.md`, schema `schemas/context-packet.schema.json`).

## Capability classes (model-neutral)
Map to concrete models at runtime discovery. Never hardcode a permanent model
name.

| Class                    | Use                                                |
|--------------------------|----------------------------------------------------|
| `highest_reasoning`      | orchestration, architecture, adversarial review    |
| `balanced_reasoning`     | most planning + implementation tasks               |
| `fast_read_only`         | repository exploration, research, summarization     |
| `implementation_heavy`   | large code-writing tasks                            |
| `validation_independent` | independent judges (plan consistency, acceptance)   |

## Budgets
Planning context budget, implementation context budget, max parallel agents,
retry budget, external-service budget, token logging, summarization + archive
strategy are recorded in `templates/20-performance-plan.md` and the cost/context
section of each plan.
