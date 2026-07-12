---
description: Run an additional adversarial planning review on the active plan.
argument-hint: <optional: dimension to focus>
---

# /grill_max

Run an additional adversarial planning review on the active plan.

## Input
$ARGUMENTS

## Steps
1. Invoke the `grill-master` agent and `grill-me-planning` skill.
2. Run all three passes: product reality, system completeness, implementation ambiguity.
3. Record concrete findings with severity and affected requirement/area.
4. Feed material (Category E) findings into a grouped question round only if needed.
5. Update the decision/assumption ledgers with any newly resolved gaps.

> Part of the Autonomous System Building OS. Planning runtime = Claude. Never write product code.
