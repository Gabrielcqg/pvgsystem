#!/usr/bin/env python3
"""Generate the 34 canonical plan templates into system-building-os/templates/
and mirror them into plans/templates/. Each template has YAML frontmatter
(template id, artifact, schema, phase, runtime), an instructions block, the
required fields/sections, and a completeness checklist. Re-run to regenerate.
"""
from __future__ import annotations

import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANON = os.path.join(ROOT, "system-building-os", "templates")
MIRROR = os.path.join(ROOT, "plans", "templates")

# id, title, phase, runtime, schema, artifact, instructions, fields[], checklist[]
T = list  # alias for readability

TEMPLATES = [
 ("00-repository-context", "Repository & Context Preflight", "planning", "claude",
  None, "00-repository-context.md / .json",
  "Inspect the repository without exposing secrets. Determine whether it is empty, "
  "partial, or established, and whether the user is creating, extending, replacing, or repairing.",
  ["Repository maturity (empty/partial/established)", "Current stack", "Existing architecture",
   "Existing database configuration", "Existing authentication", "Existing frontend/backend",
   "Existing tests", "Existing CI/CD", "Current MCPs", "Existing Claude/Codex configuration",
   "Constraints that must be preserved", "Create vs extend vs replace vs repair"],
  ["No secret values read or printed", "Both .md and .json produced",
   "Preserved-constraints listed", "Intent classification recorded"]),

 ("01-user-intent", "User Intent Model", "planning", "claude",
  "user-intent", "01-user-intent.md / .json",
  "Transform the user's input into a structured intent model. Never discard the original wording.",
  ["Original request verbatim", "Interpreted business objective", "Problem being solved",
   "Desired outcome", "Likely users", "Known constraints", "Explicit requirements",
   "Implicit requirements", "Non-negotiable instructions", "Open decisions",
   "Potential contradictions", "Current-system context", "Definition of success"],
  ["Original wording preserved verbatim", "Explicit vs implicit separated",
   "Non-negotiables captured", "Success is defined concretely",
   "JSON validates against user-intent.schema.json"]),

 ("02-material-clarifying-questions", "Material Clarifying Questions", "planning", "claude",
  None, "02-material-clarifying-questions.md",
  "ONLY Category E material product ambiguities. Group into one round. Never ask "
  "questions the user already answered or technical questions Claude should decide.",
  ["Decision required", "Why it materially affects the system", "Affected areas",
   "Recommended default", "Consequences of each meaningful option"],
  ["Every question is Category E", "All questions in one grouped round",
   "Each has a recommended default", "No already-answered questions",
   "No library/technical questions unless they are product requirements"]),

 ("03-assumption-ledger", "Assumption Ledger", "planning", "claude",
  "assumption-ledger", "03-assumption-ledger.md",
  "Record every autonomously-resolved assumption (Categories B–D).",
  ["ID (ASM-###)", "Assumption", "Confidence", "Reason", "Source",
   "Affected requirements", "Reversibility", "Validation method", "Consequence if wrong"],
  ["Every Category B–D resolution recorded", "Confidence + reversibility present",
   "Consequence-if-wrong stated", "Validates against assumption-ledger.schema.json"]),

 ("04-decision-ledger", "Decision Ledger", "planning", "claude",
  "decision-ledger", "04-decision-ledger.md",
  "Record technical decisions and every resolved contradiction.",
  ["ID (DEC-###)", "Decision", "Conflicting statements (if any)",
   "Alternatives considered", "Selected option", "Rationale", "Product impact",
   "Technical impact", "Reversibility", "Validation", "User input required"],
  ["Every reversible technical decision recorded", "Every contradiction resolution recorded",
   "Rationale present", "Validates against decision-ledger.schema.json"]),

 ("05-product-system-plan", "Product / System Plan", "planning", "claude",
  "requirement", "05-product-system-plan.md",
  "Extremely detailed product plan with requirement IDs. No implementation-agent "
  "instructions here. Every requirement must be testable; avoid vague language.",
  ["8.1 Executive definition", "8.2 Goals and non-goals", "8.3 Users and actors",
   "8.4 Organizations and tenancy", "8.5 Core user journeys",
   "8.6 Functional requirements (ID/Title/Description/Rationale/Actors/Preconditions/"
   "Trigger/Inputs/Processing/Outputs/State changes/Validation/Errors/Permissions/"
   "Dependencies/Acceptance/Priority)", "8.7 Screens/pages/UI (+ all states)",
   "8.8 Business logic", "8.9 Backend behavior", "8.10 Data & database behavior",
   "8.11 Authentication & authorization", "8.12 AI behavior (exact I/O + validation)",
   "8.13 Integrations", "8.14 Notifications", "8.15 Search & filtering",
   "8.16 Administration & operations", "8.17 Non-functional requirements",
   "8.18 Failure & recovery behavior", "8.19 Acceptance criteria (AC-###)"],
  ["Every requirement has an ID", "No vague language (should work / handle errors)",
   "Every requirement is testable", "All UI states defined (default/loading/empty/error/...)",
   "AI behavior specifies exact inputs/outputs/validation", "Acceptance criteria present"]),

 ("06-technical-architecture-plan", "Technical Architecture Plan", "planning", "claude",
  None, "06-technical-architecture.md",
  "Separate technical plan. Use Mermaid diagrams where useful. Include ADRs.",
  ["Architectural overview", "System context", "Component diagram", "Module boundaries",
   "Dependency rules", "Request flows", "Event flows", "Sequence diagrams",
   "Frontend/backend/API/database/auth/AI/integration/infrastructure/observability/"
   "deployment architecture", "Security boundaries", "Scaling strategy",
   "Failure isolation", "Technology choices", "Alternatives considered", "Trade-offs",
   "Architecture decision records (ADR-###)"],
  ["Component boundaries defined", "Dependency rules explicit", "Key flows diagrammed",
   "Technology choices justified with alternatives", "ADRs recorded"]),

 ("07-data-architecture-plan", "Data Architecture Plan", "planning", "claude",
  "data-model", "07-data-architecture.md + data-model.yaml",
  "Cover storage decision, entities, and machine-readable data model.",
  ["Database requirement decision", "Relational/document/kv/graph/vector needs",
   "Recommended database + provider", "Local/test/staging/production databases",
   "Entities, fields, types", "Relationships", "Ownership", "Constraints/unique/indexes",
   "Query patterns", "Transactions/concurrency", "Soft vs hard delete", "Audit fields/timestamps",
   "Data classification / personal data / encryption", "Retention/archival/backup/restore",
   "Migration/rollback/schema drift", "Seeds/fixtures", "Row-level security / multi-tenant isolation",
   "Analytics/reporting", "File storage / vector storage / cache"],
  ["Every entity has a machine-readable representation", "data-model.yaml validates against data-model.schema.json",
   "Indexes map to query needs", "Personal data + classification marked",
   "Migration + rollback considered"]),

 ("08-database-migration-plan", "Database & Migration Plan", "planning", "claude",
  "database-plan", "database-plan.md + migration-plan.md",
  "All schema changes are migration-based. Define ordering and rollback.",
  ["Migration tool/approach", "Migration ordering", "Backward-compatible strategy",
   "Expand-and-contract for destructive changes", "Rollback per migration",
   "Test database isolation", "Seed/fixture strategy", "Schema drift check",
   "Backup/restore runbook"],
  ["Every schema change has a migration", "Rollback defined", "Drift check defined",
   "Test data is synthetic", "database-plan validates against database-plan.schema.json"]),

 ("09-auth-authorization-plan", "Authentication & Authorization Plan", "planning", "claude",
  "actor", "08-auth-security-plan.md",
  "Define identity, session, and authorization model end to end.",
  ["Auth required?", "Supported methods", "Account lifecycle", "Registration/invitations",
   "Login/logout", "Session management", "Password/IdP behavior", "Recovery/verification",
   "Roles/permissions", "Authorization boundaries", "Privileged actions",
   "Impersonation policy", "Service accounts", "Revoked access", "Audit events",
   "Account deletion"],
  ["Roles + permissions enumerated", "Org isolation defined (if multi-tenant)",
   "Privileged actions listed", "Audit events defined", "Secrets by env-var name only"]),

 ("10-security-threat-model", "Security & Threat Model", "planning", "claude",
  None, "08-auth-security-plan.md (security section)",
  "Threat model + misuse cases + concrete controls and security acceptance criteria.",
  ["Identity architecture", "Authorization model", "Session/token/cookie strategy",
   "CSRF/CORS/secure headers", "Input validation/output encoding", "Dependency security",
   "Secret handling", "Audit logs", "Abuse controls/rate limiting", "Account recovery",
   "Privilege-escalation protections", "Organization isolation", "Threat model",
   "Misuse cases", "Security tests", "Incident-relevant telemetry"],
  ["Threat model present", "Misuse cases enumerated", "Each threat has a control",
   "Security tests mapped to acceptance criteria (SEC-### / AC-###)"]),

 ("11-frontend-uiux-plan", "Frontend & UI/UX Plan", "planning", "claude",
  "ui-screen", "09-frontend-uiux-plan.md",
  "Detailed frontend spec. Every screen defines all states + a11y + responsive.",
  ["Application structure/routes/layouts", "Components + ownership", "Design tokens",
   "Reusable patterns", "Forms + client validation", "Server-state / local-state / caching",
   "Optimistic updates", "Accessibility", "Responsiveness", "Keyboard + focus management",
   "Animation/transitions/scroll", "Loading/empty/error/offline states",
   "Analytics", "Browser testing", "Perceived performance", "Visual acceptance criteria",
   "Premium visual direction (when required): typography, spacing, grid, motion, anti-patterns"],
  ["Every screen has a UI-### id", "All states defined per screen",
   "Accessibility behavior defined", "Community front-design optional with local fallback",
   "ui-screen artifacts validate against ui-screen.schema.json"]),

 ("12-backend-domain-plan", "Backend & Domain Plan", "planning", "claude",
  None, "10-backend-api-plan.md (domain section)",
  "Define domain modules, services, and failure handling.",
  ["Domain modules", "Service boundaries", "Controllers/handlers", "Business services",
   "Repositories", "Validation", "Transactions", "Event handling", "Jobs/queues/scheduled tasks",
   "Concurrency controls", "Caching", "Retries", "Integrations", "Logging/metrics/tracing",
   "Error model", "Test boundaries"],
  ["Domain boundaries explicit", "Error model defined", "Jobs/queues specified",
   "Idempotency + retries stated", "Test boundaries identified"]),

 ("13-api-contract-plan", "API & Contract Plan", "planning", "claude",
  "api-contract", "10-backend-api-plan.md + 24-api-contracts/",
  "Every endpoint/procedure fully specified. Produce OpenAPI/JSON/event schemas where apt.",
  ["API ID", "Method", "Path", "Purpose", "Authentication/authorization",
   "Path/query params + headers", "Request/response schema", "Validation",
   "Success/error codes", "Idempotency", "Rate limits", "Side effects", "Database changes",
   "Events emitted", "Observability", "Tests"],
  ["Every endpoint has an API-### id", "Request+response schemas defined",
   "Error codes enumerated", "Validates against api-contract.schema.json"]),

 ("14-ai-orchestration-plan", "AI Orchestration Plan", "planning", "claude",
  "ai-flow", "11-ai-plan.md",
  "When AI is involved. Never 'use AI to analyze data' — specify exact I/O + validation.",
  ["AI components/agents", "Orchestration", "Prompt contracts", "Tool contracts",
   "Context construction", "Memory strategy", "Retrieval/grounding", "Structured output schema",
   "Validation", "Uncertainty/confidence", "Hallucination reduction", "Refusal + fallback behavior",
   "Fallback models / model-independent interfaces", "Evaluation datasets (golden + red-team)",
   "Prompt injection protections", "Data exposure protections", "Token/latency/cost budgets",
   "Retry & repair loops", "Prompt versioning", "Human review when relevant"],
  ["Exact inputs/outputs specified", "Output schema defined", "Validation defined",
   "Golden + red-team evals present", "Fallback behavior defined",
   "Validates against ai-flow.schema.json"]),

 ("15-integration-plan", "Integration Plan", "planning", "claude",
  "integration", "12-integration-mcp-plan.md",
  "Every external integration with fallback + mock strategy + contract tests.",
  ["Integration ID", "External system", "Purpose", "Authentication mechanism",
   "Data sent/received", "Triggers/frequency", "Timeouts/retries/idempotency",
   "Rate limits", "Failure behavior", "Fallback", "Data sensitivity", "Audit requirements",
   "Sandbox support", "Mock strategy", "Tests"],
  ["Every integration has an INT-### id", "Fallback + mock strategy defined",
   "Contract tests specified", "Validates against integration.schema.json"]),

 ("16-mcp-access-plan", "MCP Access Plan", "planning", "claude",
  "mcp-registry", "12-integration-mcp-plan.md (MCP section)",
  "Select only necessary MCPs with least privilege and separate environments.",
  ["Selected MCPs (from registry)", "Per-MCP registry fields", "Read vs write separation",
   "Environment separation (local/dev/staging/prod)", "Tool allowlists",
   "Blocked destructive tools", "Health checks", "Fallbacks",
   "Separate Claude/Codex configuration"],
  ["Only necessary MCPs enabled", "Least privilege applied", "Env separation present",
   "Every MCP has a fallback", "Secrets referenced by name only",
   "Validates against mcp-registry.schema.json"]),

 ("17-infrastructure-plan", "Infrastructure Plan", "planning", "claude",
  None, "13-infrastructure-environment-plan.md",
  "Containers, IaC, hosting, workers, CI/CD, backups, disaster recovery.",
  ["Container strategy", "Infrastructure as code", "Hosting", "Domains/TLS/CDN",
   "Background workers/queues/schedules", "Storage/backups", "CI/CD", "Release strategy",
   "Rollback", "Disaster recovery"],
  ["Container + IaC strategy defined", "CI/CD defined", "Backup + DR defined",
   "Rollback defined", "Secrets by name only"]),

 ("18-environment-strategy", "Environment Strategy", "planning", "claude",
  None, "13-infrastructure-environment-plan.md (environments)",
  "Define local, test, development, staging, production.",
  ["Per-environment purpose", "Services", "Database", "Storage",
   "Variables required (names only)", "Secret names", "Network boundaries",
   "Access model", "Deployment", "Migrations", "Monitoring", "Test data",
   "Teardown", "Rollback"],
  ["All five environments defined", "Variable names only (no values)",
   "Isolation between local/test and production stated", "Teardown + rollback per env"]),

 ("19-observability-plan", "Observability Plan", "planning", "claude",
  None, "14-observability-plan.md",
  "Structured logs, metrics, traces, dashboards, alerts, redaction.",
  ["Structured logs + fields", "Correlation IDs", "Metrics", "Traces", "Dashboards",
   "Alerts", "Frontend/backend/database/integration errors", "AI tool calls/cost/latency",
   "MCP operations", "Deployment events", "Audit events", "Retention",
   "Sensitive-data redaction"],
  ["Log fields + correlation IDs defined", "Alerts defined", "AI cost/latency observed",
   "Sensitive data redacted", "Retention defined"]),

 ("20-performance-plan", "Performance Plan", "planning", "claude",
  None, "15-performance-plan.md",
  "Measurable budgets + profiling/regression strategy. Include cost/context budgets.",
  ["Initial load", "Route transition", "API latency", "DB query latency",
   "Background-job completion", "AI latency", "Animation smoothness", "Input responsiveness",
   "Bundle size", "Memory use", "Network requests", "Caching/pagination/image delivery",
   "Perceived performance", "Profiling/bottleneck/browser perf/DB analysis/load testing/"
   "regression detection", "Cost & context budgets (capability classes, parallelism, retries)"],
  ["Budgets are measurable numbers", "Regression detection strategy present",
   "Cost/context budgets defined", "Capability classes referenced (not hardcoded models)"]),

 ("21-test-validation-plan", "Test & Validation Plan", "planning", "claude",
  "acceptance-criteria", "16-test-validation-plan.md",
  "Every acceptance criterion maps to >=1 verification method.",
  ["Static analysis/format/lint/typecheck", "Unit/component/integration/contract tests",
   "Database/migration tests", "Auth/authorization tests", "AI evaluation",
   "Browser/E2E tests", "Accessibility/visual tests", "Performance/security/recovery tests",
   "Smoke tests / release verification", "Manual QA where automation insufficient",
   "AC → test mapping"],
  ["Every AC-### maps to >=1 TEST-###", "Test types cover all present dimensions",
   "Manual QA identified where needed"]),

 ("22-release-rollback-plan", "Release & Rollback Plan", "planning", "claude",
  None, "17-release-rollback-plan.md",
  "Release strategy, rollback, disaster recovery, and the risk register.",
  ["Release strategy", "Migration order at release", "Canary/staged rollout",
   "Automatic rollback", "Post-deploy validation", "Disaster recovery",
   "Risk register (RISK-###: likelihood/impact/early signal/prevention/mitigation/"
   "fallback/rollback/owner/validation)"],
  ["Rollback defined", "Risk register present", "Each risk has mitigation + fallback",
   "Expand-and-contract for destructive migrations"]),

 ("23-task-decomposition", "Task Decomposition", "planning", "claude",
  "task-manifest", "18-task-manifest.yaml + 19-dependency-graph.yaml",
  "Atomic, objectively-verifiable tasks. No vague 'build the backend' tasks.",
  ["Task ID", "Title/objective/phase", "Requirements", "Dependencies", "Inputs",
   "Expected outputs", "files_to_create/modify/not_to_modify", "Assigned agent",
   "Required/optional skills", "Recommended MCP tools", "Validation commands",
   "Acceptance criteria", "Rollback", "Stop conditions", "Estimated complexity",
   "Parallelization group"],
  ["No vague tasks", "Every task maps to requirements + acceptance criteria",
   "Dependencies form a DAG", "Validates against task-manifest.schema.json"]),

 ("24-agent-map", "Agent Map", "planning", "claude",
  "agent-map", "20-agent-map.yaml",
  "Project-specific Codex agent map.",
  ["Agent id", "Responsibility", "When to use / when not to use", "Allowed tools",
   "Disallowed actions", "Runtime model profile", "Sandbox/permission preference",
   "Core/specialized skills", "MCP tools", "Input context packet", "Output contract",
   "Validation criteria", "Stop conditions", "File ownership"],
  ["Every task's assigned_agent exists in the map", "Output contract per agent",
   "File ownership stated", "Validates against agent-map.schema.json"]),

 ("25-skill-map", "Skill Map", "planning", "claude",
  "skill-map", "21-skill-map.yaml",
  "Classify skills: core / project-specific / community / local-fallback / new.",
  ["Skill name", "Classification", "Runtime", "Purpose", "Local fallback",
   "Source", "Trust level"],
  ["Every required skill classified", "Community skills have local fallback",
   "New skills flagged for creation", "Validates against skill-map.schema.json"]),

 ("26-file-ownership", "File Ownership & Parallelism", "planning", "claude",
  "file-ownership", "22-file-ownership.yaml + parallelization-plan.yaml",
  "Prevent conflicting concurrent writes; define parallel vs serial work.",
  ["Path", "Owner agent/task", "Mode (exclusive/shared_read/serialized_write)",
   "Parallelization group", "Serialize list (shared schema/config/manifests/routing/"
   "types/migrations/final integration)", "Parallelize list (exploration/research/"
   "read-only reviews/independent modules)"],
  ["No two write-heavy agents own the same file concurrently",
   "Shared schema/config/migrations serialized", "Validates against file-ownership.schema.json"]),

 ("27-context-packet", "Context Packet", "planning", "claude",
  None, "23-context-packets/<task>.md",
  "Focused packet per worker: only what that task needs.",
  ["Assigned task", "Relevant requirements", "Relevant architecture", "Relevant files",
   "Relevant tests", "Relevant skills", "Relevant MCP tools", "Stop conditions",
   "Output contract"],
  ["Packet is task-scoped (not the whole corpus)", "Contains requirements+files+tests",
   "Output contract explicit"]),

 ("28-acceptance-criteria", "Acceptance Criteria", "planning", "claude",
  "acceptance-criteria", "26-acceptance-criteria.yaml",
  "Independently testable criteria AC-###.",
  ["ID (AC-###)", "Requirement", "Setup", "Action", "Expected result", "Evidence",
   "Automated or manual verification", "Test ids"],
  ["Each criterion is independently testable", "Each maps to a requirement",
   "Each maps to >=1 test", "Validates against acceptance-criteria.schema.json"]),

 ("29-requirement-traceability", "Requirement Traceability", "planning", "claude",
  "traceability", "27-requirement-traceability.yaml",
  "Complete mapping graph across the plan.",
  ["Goal → Requirement", "Requirement → Architecture component", "Requirement → Task",
   "Task → Files", "Requirement → Acceptance criterion", "Acceptance criterion → Test",
   "Test → Evidence"],
  ["Every requirement maps to >=1 task", "Every requirement maps to acceptance criteria",
   "Every acceptance criterion maps to a test", "No orphan requirements or tasks",
   "Validates against traceability.schema.json"]),

 ("30-codex-handoff", "Codex Handoff", "planning", "claude",
  None, "28-codex-handoff.md",
  "Self-contained implementation brief. No material decision hidden in chat history.",
  ["Implementation brief", "Exact implementation order", "Task manifest reference",
   "Context packets reference", "Non-negotiable rules", "Completion report format",
   "Active plan version + hash"],
  ["Handoff is self-contained", "Implementation order explicit", "Non-negotiables listed",
   "Points to task manifest + context packets"]),

 ("31-codex-start", "Codex Start", "implementation", "codex",
  None, "29-codex-start.md",
  "The stable entrypoint Codex reads first.",
  ["How to locate the active plan", "How to validate the plan package",
   "Read PLAN_METADATA + EXECUTION.lock + task manifest + context packets",
   "Execution order", "Completion gates", "Where to write state/ledger/reports"],
  ["Entrypoint is unambiguous", "References PLAN_METADATA + EXECUTION.lock",
   "Names the completion gates"]),

 ("32-plan-validation-report", "Plan Validation Report", "planning", "claude",
  None, "30-plan-validation-report.md",
  "Independent plan-consistency judgment. Do not mark ready until critical findings resolved.",
  ["Coverage of every user objective", "Requirement IDs present",
   "Acceptance criteria present + tested", "Task↔requirement mapping both directions",
   "APIs/entities/screens/roles/permissions/transitions/errors defined",
   "Integrations have fallbacks", "Migrations/auth/security/perf/observability/rollback planned",
   "MCP access controlled", "Codex agents/skills exist or will be generated",
   "No unsafe file-ownership conflicts", "No critical TBD",
   "Validation score + findings"],
  ["Score computed", "Critical findings listed", "Not marked ready with open critical findings",
   "Content quality assessed (not just file existence)"]),

 ("33-final-implementation-report", "Final Implementation Report", "implementation", "codex",
  "final-report", "final-implementation-report.md",
  "Truthful, evidence-based delivery report. Never claim untested success.",
  ["Completion-gate results", "Acceptance summary", "Requirements implemented",
   "Tests run + results", "Deviations (with levels)", "External blockers",
   "Evidence links", "Final acceptance judge outcome", "Repository tree",
   "Validation commands used", "Honest list of any failures"],
  ["Every completion gate reported with PASS/FAIL/NA", "Evidence attached",
   "Failures reported honestly", "Validates against final-report.schema.json"]),
]


def render(t) -> str:
    tid, title, phase, runtime, schema, artifact, instr, fields, checklist = t
    fm = [
        "---",
        f"template_id: {tid}",
        f"title: {title}",
        f"phase: {phase}",
        f"runtime: {runtime}",
        f"produces_artifact: {artifact}",
        f"schema: {schema if schema else 'null'}",
        "---",
        "",
    ]
    body = [f"# {title}", "", "## Instructions", "", instr, "", "## Required fields / sections", ""]
    body += [f"- {f}" for f in fields]
    body += ["", "## Completeness checklist", ""]
    body += [f"- [ ] {c}" for c in checklist]
    body += ["", "## Fill below", "", "> Replace this section with the actual content for the project.", ""]
    return "\n".join(fm + body)


def main() -> int:
    os.makedirs(CANON, exist_ok=True)
    os.makedirs(MIRROR, exist_ok=True)
    ids = [t[0] for t in TEMPLATES]
    assert len(ids) == len(set(ids)), "duplicate template ids"
    for t in TEMPLATES:
        content = render(t)
        for base in (CANON, MIRROR):
            with open(os.path.join(base, f"{t[0]}.md"), "w", encoding="utf-8") as fh:
                fh.write(content)
    print(f"Wrote {len(TEMPLATES)} templates to {CANON} and mirrored to {MIRROR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
