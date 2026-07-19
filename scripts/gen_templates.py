#!/usr/bin/env python3
"""Generate the canonical plan templates into system-building-os/templates/
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

 # ======================================================================
 # Production-complete update: frontend depth, AI centrality, cross-layer
 # reconciliation, deliverables, production readiness.
 # ======================================================================

 ("34-frontend-reference-intake", "Frontend Reference Intake", "planning", "claude",
  "frontend-reference", "frontend/frontend-reference.yaml (+ project-reference/frontend/)",
  "Inspect project-reference/frontend/ BEFORE frontend planning. Read FRONTEND_REFERENCE.md, "
  "design-tokens.yaml, screen-inventory.yaml, assets/ and inspiration/. Classify each reference "
  "MUST_FOLLOW / STRONG_INSPIRATION / GENERAL_INSPIRATION / AVOID. If the package is absent or "
  "empty, infer an initial direction from the product, propose a reference file, and ask only "
  "grouped material visual questions when a choice substantially changes product identity.",
  ["Provenance (user / references / inference)", "Visual direction", "Brand personality",
   "Product feeling", "Target polish (utilitarian/polished/premium/flagship)",
   "Color / typography / spacing / surfaces / iconography preferences",
   "Navigation + animation + scroll style", "Responsive + accessibility expectations",
   "References with classification + notes", "Liked / disliked examples",
   "Avoid patterns", "Non-negotiable visual rules", "Decision provenance map"],
  ["project-reference/frontend/ inspected (or inferred + proposed when absent)",
   "Every reference classified", "Non-negotiable visual rules captured",
   "Provenance recorded per decision (user/references/inference)",
   "Validates against frontend-reference.schema.json"]),

 ("35-product-intelligence-grill", "Product Logic & Intelligence Grill", "planning", "claude",
  "ai-responsibility-matrix", "35-product-intelligence-grill.md + ai-responsibility-matrix.yaml",
  "Mandatory. Determine the actual central value of the system and WHO owns each decision "
  "(ai / deterministic_backend / frontend / human). Reject any plan that replaces intended "
  "AI-centered behavior with a fixed automated flow. Produce the intelligence responsibility matrix.",
  ["What is the central value of the system?",
   "Is the central value produced by deterministic workflow, rules, AI, or a combination?",
   "Which decisions MUST be made by AI?", "Which decisions must NEVER be delegated to AI?",
   "Which steps require interpretation vs automation?",
   "Which steps depend on accumulated interaction context?",
   "Which steps are static vs must adapt dynamically?",
   "Which steps require tools or external information?", "Which steps require human review?",
   "What would make this feel like a normal workflow instead of an AI-first product?",
   "How must the product behave when AI is unavailable? Minimum deterministic fallback?",
   "What part of the experience proves the intelligence is actually working?",
   "Responsibility matrix: step_id/description/owner/decision_type/inputs/context/tools/"
   "output_contract/validation/fallback/user_visible_effect"],
  ["Central value + owner stated", "AI-vs-deterministic responsibility explicit per step",
   "Decisions never delegated to AI listed", "Behavior when AI unavailable defined",
   "Intelligence proof identified", "Not a disguised fixed workflow when AI is the point",
   "Validates against ai-responsibility-matrix.schema.json"]),

 ("36-frontend-experience-grill", "Frontend Experience Grill", "planning", "claude",
  "visual-quality-review", "36-frontend-experience-grill.md",
  "Mandatory dedicated frontend grill after product + system logic are understood. Challenge "
  "product communication, information architecture, creativity/differentiation, usability, "
  "responsiveness and visual quality. Output concrete frontend decisions, not generic advice.",
  ["Product communication: does the UI communicate central value + what the AI is doing?",
   "Information architecture: what is primary / supporting / progressive disclosure / hidden?",
   "Creativity: does it look like a generic admin dashboard? what custom visualization fits?",
   "Usability: can the main flow be completed without docs? are errors actionable?",
   "Responsiveness: what stacks / becomes a drawer / stays desktop-first?",
   "Visual quality: hierarchy, spacing, typography, dead areas, stretched cards, transitions",
   "Per-dimension verdict (pass/warn/fail) + finding + evidence",
   "Concrete decisions fed back into the frontend plan"],
  ["All six dimensions challenged", "Findings are concrete frontend decisions",
   "Generic-dashboard risk explicitly assessed", "Feeds screen/interaction contracts",
   "Validates against visual-quality-review.schema.json"]),

 ("37-frontend-plan", "Frontend Plan (Screens & Interactions)", "planning", "claude",
  "screen-contract", "frontend/screen-contracts/*.yaml + frontend/frontend-plan.md",
  "Detailed, per-surface frontend plan. NOT a list of page names. For every page/route/modal/"
  "panel/significant component produce a full screen contract with every state and its data + "
  "backend + AI dependencies. Every surface that exposes product logic references its "
  "requirement, API/action, state-machine state, data/AI result, error/fallback, and tests.",
  ["Per-screen: id/purpose/user_role/route/user_objective/information_hierarchy",
   "main_content/layout/sections/components/primary_action/secondary_actions",
   "data_displayed/data_source/backend_dependency/ai_dependency/permissions/validations",
   "States: default/loading/streaming/generating/reconnecting/empty/partial_data/error/"
   "success/disabled/permission_denied",
   "responsive/keyboard/focus/accessibility/animation/transition/scroll/persistence/optimistic",
   "analytics", "requirement_refs / api_refs / state_machine_states",
   "acceptance_criteria / tests"],
  ["Every surface has a UI-### screen contract", "All applicable states defined per surface",
   "Each surface maps requirement + API/action + state + tests",
   "No screen exposes fake/static data in a production path",
   "Validates against screen-contract.schema.json"]),

 ("38-component-contract", "Component Contracts", "planning", "claude",
  "component-contract", "frontend/component-contracts.yaml",
  "For each significant reusable component define what it reflects (db/ai/api result), the "
  "requirement it represents, the API it consumes, the states it shows, and its error fallback.",
  ["Component id (CMP-###)", "Name/purpose", "Used in screens", "Requirement ref",
   "Consumes API", "State shown", "Reflects (db/ai/api result)", "Props/states",
   "Error fallback", "Accessibility", "Acceptance criteria / tests"],
  ["Every product-logic component references a requirement",
   "Every data component names its API/AI source", "Error fallback defined",
   "Validates against component-contract.schema.json"]),

 ("39-interaction-contract", "Frontend-to-Backend Interaction Contracts", "planning", "claude",
  "interaction-contract", "frontend/interaction-contracts.yaml",
  "For every user interaction, bind the frontend action to its backend/local behavior end to end. "
  "Reject buttons with no implementation contract and backend features with no user surface "
  "(unless explicitly administrative, background-only, or API-only).",
  ["Interaction id (IX-###)", "screen_id/component_id", "user_action",
   "frontend_validation", "request_contract", "backend_handler", "business_rule",
   "ai_behavior", "database_effect", "success_response", "error_responses",
   "loading_state/streaming_state/retry_behavior/optimistic_behavior",
   "user_feedback", "analytics_event", "acceptance_criteria / tests"],
  ["Every user-facing action maps to a backend or local behavior",
   "Every user-visible backend capability maps to a surface (unless admin/background/API-only)",
   "No placeholder/fake-data contracts", "Validates against interaction-contract.schema.json"]),

 ("40-frontend-state-inventory", "Frontend State Inventory", "planning", "claude",
  "frontend-state", "frontend/frontend-states.yaml",
  "Enumerate every non-trivial UI state as a first-class STATE-### with its trigger, data "
  "source, user feedback, and tests. Include AI states: constructing context, generating, "
  "validating, streaming, saving, retrying, provider unavailable.",
  ["State id (STATE-###)", "Name", "Applies to (screen/component)", "Kind",
   "Trigger", "UI representation", "Data source", "User feedback",
   "Exit transitions", "Acceptance criteria / tests"],
  ["Every screen's declared states appear here", "AI generating/validating/streaming states present",
   "reconnecting/offline handled where applicable", "Validates against frontend-state.schema.json"]),

 ("41-design-tokens", "Design Tokens", "planning", "claude",
  "design-token", "frontend/design-tokens.yaml",
  "Concrete design tokens (color, typography, spacing, radius, shadow, motion, breakpoints) "
  "derived from the frontend reference package. Not generic advice — actual token values.",
  ["Color scale", "Typography scale", "Spacing scale", "Radius", "Shadow/elevation",
   "Motion (durations/easings/reduced-motion)", "Breakpoints", "Z-index layers", "Source"],
  ["Tokens are concrete values", "Derived from the reference package where present",
   "Reduced-motion accounted for", "Validates against design-token.schema.json"]),

 ("42-ai-provider-contract", "AI Provider Contract", "planning", "claude",
  "ai-provider-contract", "ai/ai-provider-contract.yaml",
  "When the product depends on an external AI provider, specify a production-capable integration "
  "behind a provider-independent interface WITH at least one concrete adapter. Mock/scripted "
  "providers may exist only as test doubles / offline-dev / CI / explicit demo — never as the "
  "default production path.",
  ["Provider", "Provider-independent interface", "Concrete adapter",
   "Model env var + API key env var (names only)", "Model config",
   "Timeout / retry / rate-limit handling", "Structured output + input/output schema",
   "Prompt contract + prompt versioning", "Streaming", "Token/cost logging",
   "Error mapping", "Fallback behavior", "Startup validation for missing config",
   "Mock-mode policy", ".env.example keys (names only)",
   "Production setup instructions", "Tests (fakes + optional real-key integration test)"],
  ["Provider-independent interface + concrete adapter both specified",
   "Runnable after configuring named env vars", "Startup validation for missing config",
   "Mock mode is not the production default", "Secrets by env-var name only",
   "Validates against ai-provider-contract.schema.json"]),

 ("43-real-ai-integration-plan", "Real AI Integration Plan", "planning", "claude",
  "real-ai-integration-plan", "ai/real-ai-integration-plan.yaml",
  "When AI is the product's central value, define the full production path and the centrality "
  "tests that prove the AI (not a fixed sequence) is responsible for behavior.",
  ["AI is central? (bool)",
   "Production path: frontend -> AI endpoint -> validation -> context -> interface -> adapter "
   "-> provider call -> structured-output validation -> domain validation -> persistence -> "
   "frontend response/stream",
   "Provider contract ref", "Responsibility matrix ref", "Frontend AI states",
   "Centrality tests (different context -> different behavior; not a fixed sequence; uses stored "
   "context; schema-valid output; invalid output rejected/repaired; tools influence output; "
   "fallback on failure; mock not active in prod; adapter initializes with credentials)",
   "Required env vars (names only)", "Mock policy", "Setup instructions"],
  ["Full production path enumerated", "Centrality tests present and meaningful",
   "Env vars named (no values)", "Mock policy forbids scripted production conversation",
   "completion gate real_ai_integration_verified referenced",
   "Validates against real-ai-integration-plan.schema.json"]),

 ("44-vertical-traceability", "Vertical Traceability", "planning", "claude",
  "vertical-traceability", "vertical-traceability.yaml",
  "Prove how each user-facing requirement travels through EVERY applicable layer: goal -> product "
  "requirement -> business rule -> AI/deterministic responsibility -> backend service -> database "
  "entity/integration -> API contract -> frontend surface -> frontend state -> acceptance "
  "criterion -> test -> evidence. Validation fails when an applicable layer is missing.",
  ["Per requirement: requirement_id/goal_id", "business_rules", "ai_behaviors",
   "backend_components", "database_entities", "api_contracts",
   "frontend_surfaces", "frontend_states", "acceptance_criteria", "tests", "evidence",
   "layers_applicable map (which layers apply to this product)"],
  ["Every user-facing requirement maps across all applicable layers",
   "No applicable layer omitted for any requirement",
   "Frontend surfaces + states present for UI requirements",
   "AI behaviors present for AI requirements",
   "Validates against vertical-traceability.schema.json"]),

 ("45-implementation-deliverables", "Implementation Deliverables Contract", "planning", "claude",
  "implementation-deliverable", "implementation-deliverables.yaml",
  "State EXACTLY what the final implementation must contain and how each deliverable is proven "
  "complete. Not what the product does — what Codex must deliver.",
  ["Deliverable id (DEL-###)", "Name", "Type (frontend/backend/database/authentication/"
   "ai_integration/local_environment/production_environment/e2e_suite/observability/"
   "documentation/deployment/final_report)", "Purpose", "Requirements",
   "Expected files", "Expected runtime behavior", "Dependencies", "Configuration",
   "Tests", "Evidence", "Completion conditions", "Completion gate"],
  ["Every applicable layer has a deliverable", "Runtime behavior stated per deliverable",
   "Completion conditions objective", "Maps to completion gates",
   "Validates against implementation-deliverable.schema.json"]),

 ("46-production-readiness", "Production Readiness Matrix", "planning", "claude",
  "production-readiness", "production-readiness.yaml",
  "Enumerate every vertical layer, mark applicability, confirm it is planned, and bind it to an "
  "implementation gate. A plan is not production-ready when an applicable layer is omitted, "
  "superficial, or delegated to Codex to define.",
  ["Per layer: layer/applicable/planned/implementation_gate/evidence/notes",
   "Layers: product_behavior, business_logic, ai_behavior, frontend, backend, database, "
   "authentication, authorization, integrations, environment_configuration, observability, "
   "security, performance, tests, deployment, rollback, documentation",
   "definition_satisfied (bool)"],
  ["Every applicable layer planned + gated", "No applicable layer superficial or deferred",
   "Frontend mandatory when there is a UI; DB when persistence; auth when private/roles; "
   "real AI path when AI is central", "Validates against production-readiness.schema.json"]),

 ("47-production-like-run", "Production-like Run Verification", "planning", "claude",
  "production-like-run", "production-like-run.md (plan) -> executed by Codex",
  "Define the clean production-like verification Codex must run: install from clean, init DB, "
  "migrate, configure non-secret env, build, start, health, core browser flows, auth, "
  "persistence, AI config behavior, real-provider init when credentials present, controlled "
  "behavior when absent, logs, console, failed requests, security/perf checks, evidence.",
  ["Ordered steps: action / expected / evidence / status",
   "Gates verified (production_like_run_verified + related)",
   "Behavior with credentials present vs absent",
   "Log / console / failed-request inspection"],
  ["Steps are ordered and objective", "Covers install->build->run->health->flows->evidence",
   "Credential-present and credential-absent paths verified",
   "completion gate production_like_run_verified referenced",
   "Validates against production-like-run.schema.json"]),
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
