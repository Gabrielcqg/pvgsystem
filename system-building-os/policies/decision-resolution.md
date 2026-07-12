# Decision-Resolution Protocol

Claude must not ask the user questions it can reasonably answer itself. During
`/plan_max`, classify every missing decision into exactly one category.

| Cat | Name                              | Who resolves | Recorded in            |
|-----|-----------------------------------|--------------|------------------------|
| A   | Explicitly defined                | user (given) | intent model           |
| B   | Safely inferable product req.     | Claude       | assumption ledger      |
| C   | Reversible technical decision     | Claude       | decision ledger        |
| D   | Preference-dependent non-blocking | Claude       | decision ledger        |
| E   | Material product ambiguity        | **user**     | clarifying questions   |
| F   | External execution dependency     | Claude+plan  | integration + blockers |

## A — Explicitly defined
The user already provided the answer. Use it exactly. Never ask again.

## B — Safely inferable product requirement
Inferable with high confidence from the stated objective, surrounding
requirements, repository context, established product behavior, consistency with
other decisions, or security/usability necessity. Resolve automatically and
record in the assumption ledger.

> Example: "The system stores private company processes" ⇒ authentication and
> organization-level data isolation are required.

## C — Reversible technical decision
Does not change the product's core purpose and can be changed later. Choose the
best option autonomously; record rationale in the decision ledger; do not ask.
Examples: folder structure, validation library, test runner, ORM, internal
naming, component organization, logging library, lint config, cache library,
state-management implementation, API client.

## D — Preference-dependent but non-blocking
No stated preference, but a good default exists. Choose a high-quality default
and document it. Examples: empty-state wording, default pagination size, minor
animation duration, internal admin layout, secondary button placement.

## E — Material product ambiguity
The missing information could produce meaningfully different products and cannot
be responsibly inferred. **Only this category generates a user question.**
Examples: internal vs customer-facing when both are equally plausible; whether
multiple companies share one platform; whether legal approval is in the core
workflow; whether records are editable after submission; whether AI output is
advisory or auto-executed; whether payment is one-time or subscription.

Rules for Category E questions:
- Group all questions into ONE coherent decision round. Never one-at-a-time.
- For each: state the decision required, why it matters, affected areas, a
  recommended default, and the consequence of each meaningful option.
- Never ask questions already answered, technical questions Claude should
  decide, or library choices unless the choice is itself a product requirement.

## F — External execution dependency
Understood requirement, unavailable resource. Not a planning ambiguity. Plan the
real integration, create the local interface + fallback, record the external
dependency, and continue.

## Contradiction resolution order
1. Prefer the user's most recent explicit instruction.
2. Prefer specific requirements over broad requirements.
3. Prefer non-negotiable product goals over implementation preferences.
4. Prefer security, correctness and data integrity over convenience.
5. Prefer a documented assumption when the contradiction is minor.
6. Ask one grouped question only when the contradiction changes core behavior.

Every resolved contradiction is recorded in `04-decision-ledger.md` with:
decision ID, conflicting statements, selected interpretation, reason, affected
requirements, and whether user input was required.
