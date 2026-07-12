# Documentation

Full guide to the Autonomous System Building OS.

- [Architecture Overview](00-architecture-overview.md)
- [Why Claude and Codex Are Separated](01-why-claude-and-codex-are-separated.md)
- [Source-of-Truth Model](02-source-of-truth-model.md)
- [How Canonical Artifacts Work](03-how-canonical-artifacts-work.md)
- [How Runtime Adapters Work](04-how-runtime-adapters-work.md)
- [How to Run /plan_max](05-how-to-run-plan-max.md)
- [How to Answer Question Rounds](06-how-to-answer-question-rounds.md)
- [How Claude Resolves Assumptions](07-how-claude-resolves-assumptions.md)
- [How to Prepare Codex](08-how-to-prepare-codex.md)
- [How to Start Codex Implementation](09-how-to-start-codex-implementation.md)
- [How Implementation Resumes](10-how-implementation-resumes-after-interruption.md)
- [How to Inspect Task Status](11-how-to-inspect-task-status.md)
- [How to Inspect Agent Activity](12-how-to-inspect-agent-activity.md)
- [How to Add a Skill](13-how-to-add-a-skill.md)
- [How to Add an Agent](14-how-to-add-an-agent.md)
- [How to Add an MCP](15-how-to-add-an-mcp.md)
- [How to Configure a Database](16-how-to-configure-a-database.md)
- [How to Configure Production](17-how-to-configure-production.md)
- [How to Validate Runtime Parity](18-how-to-validate-runtime-parity.md)
- [How to Update the OS](19-how-to-update-the-operating-system.md)
- [How to Archive Completed Projects](20-how-to-archive-completed-projects.md)
- [Troubleshooting](21-troubleshooting.md)

## Concise user workflow

1. Open Claude Code in the repository.
2. Run `/plan_max <system idea or plan>`.
3. Answer only the grouped material product questions, if any.
4. Allow Claude to complete and validate the planning package.
5. Open Codex in the same repository.
6. Start: "Implement the active system plan using the implement-max skill."
7. Codex continues until all completion gates pass.
8. Review the final implementation report.

