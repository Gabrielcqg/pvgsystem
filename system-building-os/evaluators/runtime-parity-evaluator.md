# Runtime Parity Evaluator

Implemented by `scripts/validate_runtime_parity.py`. Asserts that every registry
item is projected to the correct runtime(s), that planning and implementation
agents are disjoint, that no stray adapters exist, and that shared skills appear
in both runtimes. Parity is SEMANTIC (right adapters exist and behave), not
literal file equality. Parity is never claimed unless this evaluator passes.
