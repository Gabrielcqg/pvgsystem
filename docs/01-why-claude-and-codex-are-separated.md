# Why Claude and Codex Are Separated
Planning and implementation are different jobs with different failure modes.
- **Claude (planning)** is best at open-ended discovery, adversarial questioning,
  and resolving ambiguity into a precise, traceable specification.
- **Codex (implementation)** is best at executing a precise specification:
  writing code, running tests, and repairing failures deterministically.

Mixing them causes two failures: Claude jumping to code before the product is
understood, and Codex re-interpreting the product mid-build. The OS forbids both.
Claude must not build the product; Codex must not redefine it.
