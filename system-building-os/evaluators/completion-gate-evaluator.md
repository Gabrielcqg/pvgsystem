# Completion Gate Evaluator

Implements `system-building-os/contracts/completion-gates.yaml` semantics in
`scripts/evaluate_completion_gates.py`. Resolves conditional gates
(required_when_*) against plan facts and refuses completion unless every
applicable required gate is PASS. A failed gate reopens the relevant tasks.
Completion is evidence-gated, never file-existence-gated.
