# Semantic Adapter Contract

Translation between runtimes is **semantic, not literal**. We do not copy Claude
files into Codex directories, rename `CLAUDE.md` to `AGENTS.md`, or assume a
Claude hook has a direct Codex equivalent.

Every canonical agent, skill, rule, hook, or policy carries this contract
(as YAML frontmatter in its canonical definition file):

```yaml
id:                      # stable machine id
canonical_name:          # human name
kind:                    # agent | skill | rule | hook | policy
runtime_scope:           # subset of [claude, codex, shared]
purpose:                 # one paragraph
behavioral_contract:     # what it must guarantee
inputs:                  # list
outputs:                 # list
allowed_tools:           # list
disallowed_actions:      # list
quality_bar:             # measurable bar for "done well"
stop_conditions:         # when it returns control
claude_adapter:          # how Claude expresses it (mechanism + path)
codex_adapter:           # how Codex expresses it (mechanism + path)
compatibility_notes:     # divergences + why
version:                 # semver
```

## Rule translation examples

| Canonical rule                       | Claude adapter                                             | Codex adapter                                             |
|--------------------------------------|-----------------------------------------------------------|----------------------------------------------------------|
| Never expose secrets                 | CLAUDE.md rule + permission config + PreToolUse hook       | AGENTS.md rule + sandbox/config policy + scan_secrets.py |
| Implementation must match the plan   | plan-completeness evaluator + codex-handoff generator      | scope guard + traceability validator + acceptance judge  |

## Adapter derivation rules
- A Claude planning skill → a Claude-compatible skill (`.claude/skills/<id>/SKILL.md`).
- A Codex implementation skill → a Codex-compatible skill (`.agents/skills/<id>/SKILL.md`).
- A shared validation skill → two runtime adapters from one canonical definition.
- Rules are translated into each runtime's native mechanism, never copied verbatim.

## Projection scripts
`generate_canonical.py` (registry → canonical docs), `generate_claude_adapter.py`,
`generate_codex_adapter.py`, `sync_runtime_adapters.py`, and the parity/contract
validators. If a runtime lacks a capability, implement the closest supported
equivalent and record it in `compatibility_notes`; never claim parity unless it
is tested by `validate_runtime_parity.py`.
