# How to Validate Runtime Parity
`python3 scripts/validate_runtime_parity.py` asserts that every registry item is
projected to the correct runtime(s), that no stray adapters exist, that planning
and implementation agents are disjoint, and that shared skills exist in both
runtimes. Parity is semantic (right adapters exist), not literal file equality.
Never claim parity that is not tested.
