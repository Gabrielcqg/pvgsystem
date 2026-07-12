# MASTER PROMPT — BUILD THE AUTONOMOUS SYSTEM BUILDING OS

## 1. Mission

Create a permanent, reusable and highly autonomous system-building architecture inside this repository.

This is not a request to build one specific product.

Your task is to build the operating system that will be used to plan and implement all future products and systems.

The final architecture must allow the user to:

1. Open the repository in Claude Code.
2. Type a command such as `/plan_max`, followed by an idea, business problem, product concept or initial system description.
3. Have Claude autonomously investigate the idea, challenge it, identify missing requirements, resolve what can be reasonably inferred, ask only the questions that genuinely require a product decision, and generate an extremely detailed implementation-ready plan.
4. Have Claude transform that plan into a deterministic, structured and machine-readable implementation package for Codex.
5. Open the same repository in Codex.
6. Tell Codex to implement the active plan.
7. Have Codex autonomously inspect, implement, test, repair, validate and document the system until all completion gates are satisfied.

The architecture must have two clearly separated runtimes:

```text
Claude Planning Runtime
    Responsible for discovery, questioning, planning, architecture,
    requirements, task decomposition and Codex preparation.

Codex Implementation Runtime
    Responsible for implementation, testing, repair, validation,
    integration, documentation and final delivery.
```

Do not use Claude as the primary product implementation runtime.

Do not use Codex as the primary product discovery and planning runtime.

Claude must produce the best possible plan.

Codex must implement that plan with the least possible ambiguity.

The permanent system created by this prompt will be referred to as:

```text
Autonomous System Building OS
```

It may also be described in documentation as:

```text
Autonomous Software Factory
Planning OS
System Building OS
```

Choose one canonical name and use it consistently throughout the repository.

---

# 2. Primary result

The repository must contain a reusable operating system with:

* a runtime-neutral source of truth;
* a Claude planning adapter;
* a Codex implementation adapter;
* planning agents;
* implementation agents;
* planning skills;
* implementation skills;
* shared validation skills;
* deterministic planning templates;
* machine-readable schemas;
* lifecycle states;
* task manifests;
* requirement traceability;
* hooks and validation scripts;
* MCP governance;
* database planning and implementation capabilities;
* authentication planning and implementation capabilities;
* frontend and UI/UX planning capabilities;
* backend and API planning capabilities;
* AI workflow planning capabilities;
* infrastructure and deployment planning capabilities;
* observability capabilities;
* security capabilities;
* performance capabilities;
* failure recovery;
* completion gates;
* plan-to-code validation;
* automatic runtime adapter generation;
* documentation explaining the complete workflow.

The system must be permanent and reusable.

It must not be designed around one specific product, framework, database, cloud provider or programming language.

---

# 3. Do not build a product yet

Do not implement any real product feature as part of this request.

Do not create a sample SaaS, dashboard, landing page, API or AI application.

You may create small fixtures, schemas or dry-run planning examples exclusively to test whether the operating system works, but they must not become product implementations.

Your deliverable is the factory, not a product made by the factory.

---

# 4. Autonomy doctrine

The user wants maximum autonomy.

The user's initial request to create or implement a system must be treated as standing authorization for every safe, reversible and in-scope action required to complete the work.

The system must not repeatedly ask questions such as:

* May I create this file?
* May I install this normal dependency?
* May I run the tests?
* May I fix this test?
* May I refactor this module?
* May I create a local migration?
* May I initialize a development database?
* May I run the formatter?
* May I continue to the next phase?
* May I retry the failed operation?
* May I use a different library?
* May I create an additional implementation skill?
* May I delegate this task to another agent?

The answer to routine, safe and reversible project work is always yes.

The system must operate according to policies rather than repeated approvals.

Create a permanent autonomy policy equivalent to:

```yaml
autonomy:
  mode: full
  ask_for_routine_confirmation: false
  continue_until_completion: true
  plan_autonomously: true
  choose_reversible_technical_decisions: true
  document_assumptions: true
  create_missing_agents: true
  create_missing_skills: true
  select_required_mcps: true
  install_normal_project_dependencies: true
  create_local_and_development_infrastructure: true
  initialize_local_database: true
  create_and_apply_development_migrations: true
  run_tests: true
  repair_failures: true
  retry_with_strategy_change: true
  refactor_when_required: true
  generate_documentation: true
  validate_against_plan: true
  stop_only_when_completion_gates_pass: true
```

Maximum autonomy does not mean ignoring reality.

If a task requires a credential, account, domain, production environment or external resource that is not available, the system must not stop the entire project or continuously ask for permission.

It must:

1. complete everything that can be completed locally;
2. create a local substitute, mock, adapter or sandbox where possible;
3. create the integration interface;
4. create automated verification for when the external resource becomes available;
5. document the exact external blocker;
6. leave the project runnable without the unavailable external resource where reasonably possible;
7. continue with all unaffected tasks.

Never fabricate credentials.

Never print, copy, expose or commit secrets.

Never place actual secret values in documentation, logs, plans, examples or configuration files.

Use environment-variable names and templates only.

---

# 5. Decision-resolution protocol

Claude must not ask the user questions that it can reasonably answer itself.

During `/plan_max`, classify every missing decision into one of the following categories.

## Category A — Explicitly defined

The user has already provided the answer.

Use it exactly.

Do not ask again.

## Category B — Safely inferable product requirement

The answer can be inferred with high confidence from:

* the user's stated objective;
* surrounding requirements;
* existing repository context;
* established product behavior;
* consistency with other decisions;
* security or usability necessities.

Resolve it automatically.

Record the decision in the assumption and decision ledger.

Example:

```text
The system stores private company processes.

Inference:
Authentication and organization-level data isolation are required.
```

## Category C — Reversible technical decision

The decision does not change the product's core purpose and can be changed later without major product impact.

Choose the most suitable option autonomously.

Examples:

* folder structure;
* validation library;
* test runner;
* ORM;
* internal naming;
* component organization;
* logging library;
* lint configuration;
* cache library;
* state-management implementation;
* API client implementation.

Record the rationale but do not ask the user.

## Category D — Preference-dependent but non-blocking

The user has not specified a preference, but a good default can be chosen.

Choose a high-quality default and document it.

Examples:

* exact empty-state wording;
* default pagination size;
* minor animation duration;
* internal administration layout;
* secondary button placement.

## Category E — Material product ambiguity

The missing information could produce meaningfully different products and cannot be responsibly inferred.

Only this category should generate a user question.

Examples:

* whether the system is internal or customer-facing when both are equally plausible;
* whether multiple companies share one platform;
* whether a legal approval is required in the core workflow;
* whether users can modify records after submission;
* whether AI output is advisory or automatically executed;
* whether a payment is one-time or subscription-based.

Questions must be grouped into one coherent decision round.

Do not ask one question at a time across many turns.

Explain briefly why each answer materially affects the system.

Provide recommended defaults whenever possible.

## Category F — External execution dependency

The requirement is understood but an external resource is unavailable.

Do not treat this as a planning ambiguity.

Plan the real integration, create the local interface and fallback, and record the external dependency.

---

# 6. Contradiction resolution

When requirements conflict:

1. Prefer the user's most recent explicit instruction.
2. Prefer specific requirements over broad requirements.
3. Prefer non-negotiable product goals over implementation preferences.
4. Prefer security, correctness and data integrity over superficial convenience.
5. Prefer a documented assumption when the contradiction is minor.
6. Ask one grouped question only when the contradiction changes the product's core behavior.

Every resolved contradiction must be recorded in:

```text
decision-ledger.md
```

Include:

* decision ID;
* conflicting statements;
* selected interpretation;
* reason;
* affected requirements;
* whether user input was required.

---

# 7. Architectural principle: one source of truth

Do not create two independently maintained operating systems.

Do not make `.claude/` and `.codex/` the canonical source.

Create one runtime-neutral canonical source of truth.

Claude-specific and Codex-specific files must be adapters generated or synchronized from that canonical source.

Use a structure conceptually equivalent to:

```text
/
├── CLAUDE.md
├── AGENTS.md
├── README.md
│
├── system-building-os/
│   ├── core/
│   ├── policies/
│   ├── lifecycle/
│   ├── contracts/
│   ├── schemas/
│   ├── agents/
│   │   ├── planning/
│   │   ├── implementation/
│   │   └── shared/
│   ├── skills/
│   │   ├── planning/
│   │   ├── implementation/
│   │   └── shared/
│   ├── capabilities/
│   ├── templates/
│   ├── registries/
│   ├── evaluators/
│   ├── runtime/
│   └── documentation/
│
├── .claude/
│   ├── agents/
│   ├── skills/
│   ├── commands/
│   ├── rules/
│   └── settings.json.template
│
├── .agents/
│   └── skills/
│
├── .codex/
│   ├── agents/
│   └── config.toml
│
├── integrations/
│   └── mcp/
│
├── plans/
│   ├── templates/
│   ├── drafts/
│   ├── active/
│   ├── completed/
│   └── archived/
│
├── scripts/
├── tests/
└── docs/
```

You may improve the exact directory names if necessary, but preserve the architectural separation.

The canonical layer must describe intent and behavior.

The runtime adapters must describe how the current Claude Code or Codex installation expresses that behavior.

---

# 8. Runtime capability discovery

Before generating Claude or Codex adapters:

1. inspect the installed Claude Code version and supported configuration mechanisms;
2. inspect the installed Codex version and supported configuration mechanisms;
3. inspect existing repository instructions, skills, agents, commands, hooks and MCP configuration;
4. detect naming or path conflicts;
5. preserve compatible existing configuration;
6. back up or clearly record any configuration that must be replaced;
7. do not assume that old runtime syntax is still valid;
8. use current supported formats;
9. validate generated configurations whenever a native validator or dry-run is available.

Create:

```text
system-building-os/runtime/runtime-capabilities.json
```

It must record:

* runtime name;
* detected version;
* supported instruction files;
* supported skill locations;
* supported agent locations;
* supported hooks;
* supported MCP configuration;
* supported permission controls;
* supported invocation mechanism;
* detected limitations;
* adapter generation timestamp.

If a capability is unavailable, implement the closest supported equivalent and document the compatibility decision.

---

# 9. Runtime-specific responsibility

## Claude Planning Runtime

Claude is responsible for:

* understanding user intent;
* product discovery;
* brainstorming;
* critical questioning;
* `grill-me` analysis;
* requirement extraction;
* requirement completeness;
* contradiction detection;
* assumption management;
* user-flow design;
* product behavior;
* frontend experience planning;
* backend behavior planning;
* API planning;
* data and database planning;
* authentication and authorization planning;
* AI behavior planning;
* integration planning;
* MCP selection planning;
* infrastructure planning;
* environment planning;
* security planning;
* observability planning;
* performance planning;
* testing strategy;
* acceptance criteria;
* technical architecture;
* architectural decisions;
* task decomposition;
* dependency mapping;
* Codex agent mapping;
* Codex skill mapping;
* file ownership planning;
* implementation sequencing;
* implementation risk analysis;
* implementation package generation;
* final plan consistency validation.

Claude must not silently jump from idea to product code.

Claude may create and maintain planning infrastructure, planning documents, schemas, adapters and validation scripts.

Claude must not use implementation-oriented skills to start building the future product during `/plan_max`.

## Codex Implementation Runtime

Codex is responsible for:

* repository inspection;
* implementation preparation;
* dependency installation;
* project bootstrap;
* frontend implementation;
* backend implementation;
* database implementation;
* migration creation;
* authentication implementation;
* AI flow implementation;
* integration implementation;
* infrastructure-as-code implementation;
* local environment setup;
* development environment setup;
* tests;
* browser validation;
* accessibility validation;
* performance validation;
* security review;
* failure diagnosis;
* automated repair;
* regression testing;
* documentation;
* final plan comparison;
* final completion report.

Codex must not reinterpret the product's core objective.

Codex may change implementation details when necessary, provided the final behavior remains aligned with the approved plan and the deviation is recorded.

---

# 10. Translation is semantic, not literal

Do not merely copy Claude files into Codex directories.

Do not merely rename `CLAUDE.md` to `AGENTS.md`.

Do not assume a Claude hook has a direct Codex equivalent.

Create a semantic adapter system.

For every canonical agent, skill, rule, hook or policy, record:

```yaml
id:
canonical_name:
runtime_scope:
  - claude
  - codex
  - shared
purpose:
behavioral_contract:
inputs:
outputs:
allowed_tools:
disallowed_actions:
quality_bar:
stop_conditions:
claude_adapter:
codex_adapter:
compatibility_notes:
version:
```

A Claude planning skill must become a Claude-compatible skill.

A Codex implementation skill must become a Codex-compatible skill.

A shared validation skill may produce two runtime adapters from one canonical definition.

Rules must be translated into the native mechanisms of each runtime.

Examples:

```text
Canonical rule:
Never expose secrets.

Claude adapter:
CLAUDE.md rule + permission configuration + PreToolUse hook.

Codex adapter:
AGENTS.md rule + sandbox/config policy + validation script.
```

```text
Canonical rule:
Implementation must match the plan.

Claude adapter:
Plan completeness evaluator and Codex handoff generator.

Codex adapter:
Scope guard, traceability validator and final acceptance judge.
```

Create scripts conceptually equivalent to:

```text
scripts/discover-runtime-capabilities.*
scripts/generate-claude-adapter.*
scripts/generate-codex-adapter.*
scripts/sync-runtime-adapters.*
scripts/validate-runtime-parity.*
scripts/validate-agent-contracts.*
scripts/validate-skill-contracts.*
scripts/validate-runtime-config.*
```

Use an appropriate implementation language for the repository.

---

# 11. The `/plan_max` entrypoint

Create an exact Claude planning entrypoint named:

```text
/plan_max
```

Use the current runtime-supported method.

Prefer a Claude skill if that is the correct current mechanism.

Create a compatibility command alias if necessary.

The user must be able to invoke it with input such as:

```text
/plan_max I want to create a platform that maps business processes,
asks intelligent questions and proposes automation opportunities.
```

The command must work for:

* a one-sentence idea;
* rough notes;
* a detailed product plan;
* an existing repository;
* a partial implementation;
* a redesign;
* a new internal tool;
* a SaaS product;
* an AI system;
* a data pipeline;
* a backend service;
* a frontend experience;
* a mobile application;
* an automation;
* a system involving databases and integrations.

The `/plan_max` command must not produce a superficial summary.

It must execute the complete planning pipeline.

---

# 12. Mandatory `/plan_max` planning pipeline

Implement the following pipeline.

## Phase 0 — Repository and context preflight

Claude must:

* identify whether the repository is empty, partial or established;
* inspect relevant files without exposing secrets;
* identify the current stack;
* identify existing architecture;
* identify existing database configuration;
* identify existing authentication;
* identify existing frontend and backend;
* identify existing tests;
* identify existing CI/CD;
* identify current MCPs;
* identify existing Claude and Codex configuration;
* identify constraints that must be preserved;
* identify whether the user is creating, extending, replacing or repairing a system.

Produce:

```text
00-repository-context.md
00-repository-context.json
```

## Phase 1 — Intent normalization

Transform the user's input into a structured intent model.

Capture:

* original request verbatim;
* interpreted business objective;
* problem being solved;
* desired outcome;
* likely users;
* known constraints;
* explicit requirements;
* implicit requirements;
* non-negotiable instructions;
* open decisions;
* potential contradictions;
* current-system context;
* definition of success.

Produce:

```text
01-user-intent.md
01-user-intent.json
```

Do not discard the original wording.

## Phase 2 — First `grill-me` pass: product reality

The mandatory planning brainstorm process must challenge:

* whether the stated problem is the real problem;
* who experiences the problem;
* how the problem is handled today;
* why the new system is needed;
* what result creates value;
* what assumptions may be false;
* what part is overcomplicated;
* what part is underspecified;
* what is essential;
* what is optional;
* what could make users reject the system;
* what could make the final result different from what the user intended;
* what could cause the project to fail even if the code works.

The `grill-me` process must not be ceremonial.

It must produce concrete findings.

## Phase 3 — Second `grill-me` pass: system completeness

Challenge the system across all relevant dimensions:

* users and roles;
* permissions;
* organization and tenancy;
* user journeys;
* frontend;
* backend;
* business logic;
* database;
* authentication;
* authorization;
* AI;
* integrations;
* file storage;
* search;
* notifications;
* administration;
* auditability;
* privacy;
* performance;
* failures;
* loading;
* empty states;
* offline behavior;
* accessibility;
* environments;
* deployment;
* observability;
* cost;
* testing;
* maintenance;
* migration;
* rollback.

## Phase 4 — Third `grill-me` pass: implementation ambiguity

Challenge whether Codex could implement the plan without guessing.

Look for:

* undefined entities;
* undefined roles;
* undefined states;
* undefined transitions;
* undefined validations;
* undefined API responses;
* undefined database constraints;
* undefined UI behavior;
* undefined AI output schemas;
* undefined fallback behavior;
* undefined error behavior;
* undefined external dependencies;
* vague acceptance criteria;
* ambiguous implementation order;
* tasks that are too large;
* conflicting file ownership;
* missing test coverage;
* missing migration strategy;
* missing completion criteria.

## Phase 5 — Decision-resolution pass

Classify every gap according to the decision-resolution protocol.

Claude must autonomously resolve Categories A through D.

Category E questions must be grouped.

For every question include:

* the decision required;
* why it matters;
* affected areas;
* recommended default;
* consequences of each meaningful option.

Do not ask questions already answered by the user.

Do not ask technical questions that Claude should decide.

Do not ask the user to choose libraries unless the choice is itself a product requirement.

## Phase 6 — Question round, only when required

If material product ambiguity remains, create:

```text
02-material-clarifying-questions.md
```

Ask all essential questions together.

After the user responds:

1. update the intent model;
2. update the decision ledger;
3. rerun completeness analysis;
4. resolve remaining inferable gaps;
5. ask another round only if a new material contradiction was created.

Do not create endless interview cycles.

## Phase 7 — Assumption and decision ledger

Create:

```text
03-assumption-ledger.md
03-decision-ledger.md
```

For each assumption record:

* ID;
* assumption;
* confidence;
* reason;
* source;
* affected requirements;
* reversibility;
* validation method;
* consequence if wrong.

For each decision record:

* ID;
* decision;
* alternatives considered;
* selected option;
* rationale;
* product impact;
* technical impact;
* reversibility;
* validation.

## Phase 8 — Product/System Plan

Create an extremely detailed Product/System Plan.

Do not mix implementation-agent instructions into this document.

Use requirement IDs.

At minimum, include:

### 8.1 Executive definition

* product name or working name;
* system summary;
* business goal;
* problem solved;
* value proposition;
* definition of success;
* product boundaries.

### 8.2 Goals and non-goals

Define:

* primary goals;
* secondary goals;
* explicitly excluded goals;
* future possibilities that are not part of the current implementation.

### 8.3 Users and actors

For every actor:

* actor ID;
* description;
* objective;
* permissions;
* restrictions;
* entry point;
* expected frequency of use;
* data ownership;
* trust level.

### 8.4 Organizations and tenancy

When relevant, define:

* single-user versus multi-user;
* single-organization versus multi-tenant;
* organization creation;
* invitations;
* memberships;
* roles;
* data isolation;
* cross-organization access;
* administrative access;
* deletion and transfer rules.

### 8.5 Core user journeys

For every journey:

* journey ID;
* actor;
* trigger;
* preconditions;
* numbered steps;
* system responses;
* success state;
* alternative paths;
* error paths;
* cancellation behavior;
* recovery behavior;
* data created or changed;
* audit events;
* acceptance criteria.

### 8.6 Functional requirements

Each requirement must contain:

```text
ID
Title
Description
Rationale
Actors
Preconditions
Trigger
Inputs
Processing rules
Outputs
State changes
Validation
Errors
Permissions
Dependencies
Acceptance criteria
Priority
```

Avoid vague language such as:

* should work correctly;
* handle errors;
* be user-friendly;
* support normal use;
* and so on;
* etc.

Every requirement must be testable.

### 8.7 Screens, pages and user interfaces

For each screen or page define:

* UI ID;
* purpose;
* permitted users;
* route or navigation position;
* layout regions;
* components;
* information hierarchy;
* primary action;
* secondary actions;
* inputs;
* validation;
* default state;
* loading state;
* empty state;
* error state;
* success state;
* disabled state;
* partial-data state;
* responsive behavior;
* keyboard behavior;
* accessibility behavior;
* animation behavior;
* navigation behavior;
* persistence behavior;
* analytics events;
* acceptance criteria.

When the product requires a premium visual experience, also define:

* design direction;
* visual tone;
* typography;
* spacing;
* grid;
* alignment;
* motion principles;
* scroll behavior;
* microinteractions;
* visual feedback;
* perceived performance;
* anti-patterns to avoid.

### 8.8 Business logic

For every business rule:

* rule ID;
* trigger;
* inputs;
* exact condition;
* output;
* precedence;
* exceptions;
* failure behavior;
* audit requirement;
* examples;
* tests.

### 8.9 Backend behavior

Define:

* service responsibilities;
* domain boundaries;
* commands;
* queries;
* transactions;
* background processes;
* scheduled work;
* queues;
* events;
* idempotency;
* retries;
* rate limits;
* concurrency;
* consistency requirements;
* failure handling;
* audit logs.

### 8.10 Data and database behavior

Define:

* whether persistence is required;
* data categories;
* ownership;
* lifecycle;
* retention;
* deletion;
* export;
* audit;
* privacy;
* expected volume;
* expected growth;
* consistency;
* search needs;
* reporting needs;
* file storage;
* vector or embedding requirements;
* caching requirements.

### 8.11 Authentication and authorization

Define:

* whether authentication is required;
* supported authentication methods;
* account lifecycle;
* registration;
* invitations;
* login;
* logout;
* session management;
* password or identity-provider behavior;
* recovery;
* verification;
* roles;
* permissions;
* authorization boundaries;
* privileged actions;
* impersonation policy;
* service accounts;
* revoked access;
* audit events;
* account deletion.

### 8.12 AI behavior

When AI is involved, define:

* AI purpose;
* where AI is appropriate;
* where deterministic logic is required;
* user inputs;
* context inputs;
* tools;
* memory;
* prompt responsibilities;
* output schema;
* confidence behavior;
* validation;
* citations or evidence;
* hallucination mitigation;
* refusal behavior;
* fallback behavior;
* retry behavior;
* evaluation datasets;
* quality metrics;
* cost constraints;
* latency constraints;
* human review when relevant;
* prompt versioning;
* model substitution strategy.

Never describe AI behavior merely as:

```text
Use AI to analyze the data.
```

Specify exactly what the AI receives, what it must produce and how the result is validated.

### 8.13 Integrations

For every integration define:

* integration ID;
* external system;
* purpose;
* authentication mechanism;
* data sent;
* data received;
* triggers;
* frequency;
* timeouts;
* retries;
* idempotency;
* rate limits;
* failure behavior;
* fallback;
* data sensitivity;
* audit requirements;
* sandbox support;
* mock strategy;
* tests.

### 8.14 Notifications

When relevant, define:

* event;
* recipient;
* channel;
* content;
* timing;
* retries;
* deduplication;
* preferences;
* failure behavior.

### 8.15 Search and filtering

When relevant, define:

* searchable entities;
* fields;
* indexing;
* filters;
* sorting;
* pagination;
* permissions;
* empty results;
* performance expectations.

### 8.16 Administration and operations

Define:

* administrative users;
* operational dashboards;
* manual overrides;
* audit access;
* retry controls;
* support tools;
* feature flags;
* configuration management;
* maintenance operations.

### 8.17 Non-functional requirements

Include measurable requirements for:

* performance;
* latency;
* throughput;
* scalability;
* availability;
* durability;
* reliability;
* accessibility;
* browser or device support;
* responsiveness;
* maintainability;
* observability;
* recoverability;
* security;
* privacy;
* cost.

### 8.18 Failure and recovery behavior

For each major flow define:

* validation failure;
* network failure;
* backend failure;
* database failure;
* integration failure;
* AI failure;
* timeout;
* duplicate submission;
* stale state;
* partial success;
* lost connection;
* retry behavior;
* user-facing message;
* operational alert;
* recovery path.

### 8.19 Acceptance criteria

Create independently testable criteria using IDs such as:

```text
AC-001
AC-002
AC-003
```

Each criterion must identify:

* requirement;
* setup;
* action;
* expected result;
* evidence;
* automated or manual verification.

## Phase 9 — Technical Architecture Plan

Create a separate technical plan.

Include:

* architectural overview;
* system context;
* component diagram;
* module boundaries;
* dependency rules;
* request flows;
* event flows;
* sequence diagrams;
* frontend architecture;
* backend architecture;
* API architecture;
* database architecture;
* authentication architecture;
* AI architecture;
* integration architecture;
* infrastructure architecture;
* observability architecture;
* deployment architecture;
* security boundaries;
* scaling strategy;
* failure isolation;
* technology choices;
* alternatives considered;
* trade-offs;
* architectural decision records.

Use diagrams in Mermaid or another repository-friendly format where useful.

## Phase 10 — Data Architecture Plan

Create a dedicated plan covering:

* database requirement decision;
* relational, document, key-value, graph or vector needs;
* recommended database;
* provider decision;
* local-development database;
* test database;
* staging database;
* production database;
* entities;
* fields and types;
* relationships;
* ownership;
* constraints;
* unique rules;
* indexes;
* query patterns;
* transactions;
* concurrency;
* soft-delete versus hard-delete;
* audit fields;
* timestamps;
* data lineage;
* data classification;
* personal data;
* encryption;
* retention;
* archival;
* backup;
* restore;
* migration;
* rollback;
* schema drift;
* seeds;
* fixtures;
* row-level security;
* multi-tenant isolation;
* analytics and reporting;
* file storage;
* vector storage;
* cache strategy.

For every entity define a machine-readable representation.

Create:

```text
data-model.md
data-model.yaml
database-plan.md
migration-plan.md
```

## Phase 11 — API and contract plan

For every API endpoint or procedure define:

* API ID;
* method;
* path;
* purpose;
* authentication;
* authorization;
* path parameters;
* query parameters;
* headers;
* request schema;
* response schema;
* validation;
* success codes;
* error codes;
* idempotency;
* rate limits;
* side effects;
* database changes;
* events emitted;
* observability;
* tests.

Where appropriate, produce:

* OpenAPI draft;
* JSON schemas;
* event schemas;
* webhook schemas;
* shared types.

## Phase 12 — Frontend and UI/UX plan

Create a detailed frontend implementation specification covering:

* application structure;
* routes;
* layouts;
* components;
* component ownership;
* design tokens;
* reusable patterns;
* forms;
* client-side validation;
* server-state behavior;
* local-state behavior;
* caching;
* optimistic updates;
* accessibility;
* responsiveness;
* keyboard behavior;
* focus management;
* animation;
* transitions;
* scroll;
* loading;
* empty;
* error;
* offline or reconnect states;
* analytics;
* browser testing;
* perceived performance;
* visual acceptance criteria.

Use or simulate relevant planning skills such as:

* `grill-me`;
* `front-design`;
* `frontend-design`;
* `ui-ux-review`;
* design-system review;
* accessibility review;
* motion review;
* responsive-layout review.

Community skills must be treated as optional external capabilities.

A tested local fallback skill must always exist.

## Phase 13 — Backend and domain plan

Define:

* domain modules;
* service boundaries;
* controllers or handlers;
* business services;
* repositories;
* validation;
* transactions;
* event handling;
* jobs;
* queues;
* scheduled tasks;
* concurrency controls;
* caching;
* retries;
* integrations;
* logging;
* metrics;
* tracing;
* error model;
* test boundaries.

## Phase 14 — Authentication and security plan

Define:

* identity architecture;
* authorization model;
* session strategy;
* token strategy;
* cookie strategy;
* CSRF considerations;
* CORS;
* secure headers;
* input validation;
* output encoding;
* dependency security;
* secret handling;
* audit logs;
* abuse controls;
* rate limiting;
* account recovery;
* privilege escalation protections;
* organization isolation;
* threat model;
* misuse cases;
* security tests;
* incident-relevant telemetry.

## Phase 15 — AI architecture plan

When applicable, define:

* AI components;
* agent responsibilities;
* orchestration;
* prompt contracts;
* tool contracts;
* context construction;
* memory strategy;
* retrieval;
* grounding;
* structured output;
* validation;
* uncertainty;
* hallucination reduction;
* fallback models;
* model-independent interfaces;
* evaluation;
* golden test cases;
* red-team cases;
* prompt injection protections;
* data exposure protections;
* token budgets;
* latency budgets;
* cost budgets;
* retry and repair loops.

## Phase 16 — Infrastructure and environment plan

Define:

```text
local
test
development
staging
production
```

For every environment define:

* purpose;
* services;
* database;
* storage;
* variables required;
* secret names;
* network boundaries;
* access model;
* deployment;
* migrations;
* monitoring;
* test data;
* teardown;
* rollback.

Define:

* container strategy;
* infrastructure as code;
* hosting;
* domains;
* TLS;
* CDN;
* background workers;
* queues;
* schedules;
* storage;
* backups;
* CI/CD;
* release strategy;
* rollback;
* disaster recovery.

## Phase 17 — Observability plan

Define:

* structured logs;
* log fields;
* correlation IDs;
* metrics;
* traces;
* dashboards;
* alerts;
* frontend errors;
* backend errors;
* database errors;
* integration errors;
* AI tool calls;
* AI cost;
* AI latency;
* MCP operations;
* deployment events;
* audit events;
* retention;
* sensitive-data redaction.

## Phase 18 — Performance plan

Define measurable budgets for:

* initial load;
* route transition;
* API latency;
* database query latency;
* background-job completion;
* AI latency;
* animation smoothness;
* input responsiveness;
* bundle size;
* memory use;
* network requests;
* caching;
* pagination;
* image delivery;
* perceived performance.

Include a strategy for:

* profiling;
* bottleneck detection;
* browser performance testing;
* database query analysis;
* load testing;
* regression detection.

## Phase 19 — Test and validation plan

Define:

* static analysis;
* formatting;
* lint;
* type checking;
* unit tests;
* component tests;
* integration tests;
* contract tests;
* database tests;
* migration tests;
* authentication tests;
* authorization tests;
* AI evaluation;
* browser tests;
* end-to-end tests;
* accessibility tests;
* visual tests;
* performance tests;
* security tests;
* recovery tests;
* smoke tests;
* release verification;
* manual QA where automation is not sufficient.

For every acceptance criterion, map at least one verification method.

## Phase 20 — MCP access plan

Determine which external capabilities are useful.

Do not activate every MCP globally.

Select MCPs according to project needs.

Consider categories such as:

* Git repository and pull-request management;
* browser automation;
* design systems and Figma;
* database provider;
* PostgreSQL or Supabase;
* cloud provider;
* AWS;
* monitoring and Sentry;
* documentation;
* issue tracker;
* project management;
* analytics;
* payment sandbox;
* communication systems.

For each MCP record:

```yaml
id:
name:
category:
provider:
official_or_trusted_source:
purpose:
required_for_project:
runtime:
  claude:
  codex:
allowed_agents:
allowed_environments:
transport:
authentication_reference:
access_mode:
enabled_tools:
disabled_tools:
write_capabilities:
data_classification:
cost_risk:
security_risk:
audit_required:
health_check:
fallback:
```

The MCP governor must:

* activate only necessary MCPs;
* use least privilege;
* use environment-variable references;
* separate read and write capabilities;
* separate local, development, staging and production;
* create tool allowlists where possible;
* block unnecessary destructive tools;
* create health checks;
* create mocks or fallbacks;
* generate Claude and Codex configurations separately;
* never make MCP configuration the only source of truth.

Database schemas, migrations and integration contracts must remain in Git.

## Phase 21 — Cost and context plan

Define:

* planning context budget;
* implementation context budget;
* model-capability profiles;
* maximum parallel agents;
* agent-selection rules;
* retry budget;
* external-service budget;
* token logging;
* context-packet strategy;
* summarization strategy;
* archive strategy.

Do not hardcode a specific model name as a permanent requirement.

Create capability classes such as:

```text
highest_reasoning
balanced_reasoning
fast_read_only
implementation_heavy
validation_independent
```

Map these classes to currently available models during runtime discovery.

Each agent must receive only the context it needs.

Do not provide the entire planning corpus to every worker.

Create focused context packets.

## Phase 22 — Implementation task decomposition

Break the system into atomic tasks.

Every task must contain:

```yaml
id:
title:
objective:
phase:
requirements:
dependencies:
inputs:
expected_outputs:
files_to_create:
files_to_modify:
files_not_to_modify:
assigned_agent:
required_skills:
optional_skills:
recommended_mcp_tools:
validation_commands:
acceptance_criteria:
rollback:
stop_conditions:
estimated_complexity:
parallelization_group:
```

Tasks must be small enough that completion is objectively verifiable.

Do not create vague tasks such as:

```text
Build the backend.
Create the frontend.
Implement authentication.
```

Split these into bounded implementation units.

## Phase 23 — Agent map

Generate a project-specific Codex agent map.

For every agent define:

* responsibility;
* when to use;
* when not to use;
* allowed tools;
* disallowed actions;
* runtime model profile;
* sandbox or permission preference;
* core skills;
* specialized skills;
* MCP tools;
* input context packet;
* output contract;
* validation criteria;
* stop conditions;
* file ownership.

## Phase 24 — Skill map

For each task and agent classify skills into:

1. core required skills;
2. project-specific skills;
3. community or external skills;
4. local fallback skills;
5. new skills that must be created.

Do not assume a community skill exists merely because its name is known.

Inspect available skills.

If a community skill is present:

* inspect its content;
* evaluate trust;
* evaluate relevance;
* evaluate tool access;
* evaluate conflicts;
* register its version or source;
* use it only if it improves the workflow.

If it is unavailable or unsuitable, use the local fallback.

## Phase 25 — File ownership and parallelism plan

Create:

```text
file-ownership.yaml
parallelization-plan.yaml
```

Prevent multiple write-heavy agents from modifying the same files simultaneously.

Parallelize:

* repository exploration;
* documentation research;
* test analysis;
* independent modules;
* read-only reviews;
* isolated components.

Serialize:

* shared schema changes;
* central configuration;
* package manifests;
* core routing;
* shared types;
* migrations with dependencies;
* final integration.

## Phase 26 — Risk and recovery plan

For every major risk define:

* risk ID;
* likelihood;
* impact;
* early signal;
* prevention;
* mitigation;
* fallback;
* rollback;
* owner;
* validation.

Include:

* incorrect requirement interpretation;
* incomplete plan;
* dependency incompatibility;
* database migration failure;
* test instability;
* API incompatibility;
* performance regression;
* security regression;
* UI mismatch;
* integration unavailability;
* AI quality failure;
* context loss;
* agent conflict;
* endless repair loop;
* external-account blocker.

## Phase 27 — Codex implementation package

Generate a complete package such as:

```text
plans/active/<project-slug>/
├── PLAN_METADATA.yaml
├── EXECUTION.lock
├── 00-original-request.md
├── 01-user-intent.md
├── 02-clarifying-questions.md
├── 03-assumption-ledger.md
├── 04-decision-ledger.md
├── 05-product-system-plan.md
├── 06-technical-architecture.md
├── 07-data-architecture.md
├── 08-auth-security-plan.md
├── 09-frontend-uiux-plan.md
├── 10-backend-api-plan.md
├── 11-ai-plan.md
├── 12-integration-mcp-plan.md
├── 13-infrastructure-environment-plan.md
├── 14-observability-plan.md
├── 15-performance-plan.md
├── 16-test-validation-plan.md
├── 17-release-rollback-plan.md
├── 18-task-manifest.yaml
├── 19-dependency-graph.yaml
├── 20-agent-map.yaml
├── 21-skill-map.yaml
├── 22-file-ownership.yaml
├── 23-context-packets/
├── 24-api-contracts/
├── 25-data-contracts/
├── 26-acceptance-criteria.yaml
├── 27-requirement-traceability.yaml
├── 28-codex-handoff.md
├── 29-codex-start.md
└── 30-plan-validation-report.md
```

The exact numbering may be improved, but all concepts must be preserved.

## Phase 28 — Plan consistency validation

Before declaring the plan ready, independently verify:

* every user objective is represented;
* every requirement has an ID;
* every important requirement has acceptance criteria;
* every acceptance criterion has a test;
* every task maps to requirements;
* every requirement maps to tasks;
* every API is defined;
* every entity is defined;
* every screen is defined;
* every role is defined;
* every permission is defined;
* every state transition is defined;
* every major error path is defined;
* every integration has a fallback;
* database migrations are planned;
* authentication is planned;
* security is planned;
* performance is measurable;
* observability is planned;
* rollback is planned;
* MCP access is controlled;
* Codex skills exist or will be generated;
* Codex agents exist or will be generated;
* file ownership has no unsafe conflicts;
* no critical `TBD` remains;
* no important implementation decision is hidden in conversational history only;
* the Codex handoff is self-contained.

Generate a validation score and findings.

The plan must not be considered implementation-ready merely because all files exist.

Content quality must be evaluated.

---

# 13. Planning quality standard

The final plan must be detailed enough that Codex does not need to reinterpret the user's product.

The plan must explain:

* what to build;
* why it exists;
* who uses it;
* how each flow behaves;
* how data moves;
* how data is stored;
* how authentication works;
* how authorization works;
* how the frontend behaves;
* how the backend behaves;
* how AI behaves;
* how external systems behave;
* what happens when something fails;
* how the system is tested;
* how completion is judged.

Do not optimize for the shortest plan.

Optimize for implementation clarity, internal consistency and traceability.

The plan may be long when the system is complex.

Use summaries for navigation, but do not replace detailed specifications with summaries.

A plan is incomplete if Codex would have to guess material behavior.

---

# 14. Required Claude planning agents

Create canonical definitions and Claude adapters for at least the following planning agents.

## 14.1 `planning-orchestrator`

Owns the complete `/plan_max` process.

Responsibilities:

* maintain planning state;
* invoke relevant planning agents;
* prevent skipped dimensions;
* synthesize outputs;
* resolve conflicts;
* maintain traceability;
* ensure no implementation starts;
* produce the final Codex package.

## 14.2 `grill-master`

Mandatory for every planning request.

Responsibilities:

* challenge assumptions;
* detect shallow thinking;
* detect missing requirements;
* detect contradictions;
* identify overengineering;
* identify oversimplification;
* identify user-adoption risks;
* identify implementation ambiguity;
* produce high-value questions.

## 14.3 `product-requirements-architect`

Responsible for:

* product scope;
* goals;
* users;
* journeys;
* requirements;
* business rules;
* acceptance criteria.

## 14.4 `system-architect`

Responsible for:

* system boundaries;
* components;
* architecture;
* interfaces;
* scalability;
* technical trade-offs;
* architectural decisions.

## 14.5 `data-architect`

Responsible for:

* data model;
* storage selection;
* entities;
* relationships;
* indexes;
* constraints;
* multi-tenancy;
* migrations;
* retention;
* backup;
* reporting;
* vector needs.

## 14.6 `auth-security-architect`

Responsible for:

* identity;
* roles;
* permissions;
* sessions;
* organization isolation;
* threats;
* secret boundaries;
* security acceptance criteria.

## 14.7 `backend-api-architect`

Responsible for:

* backend modules;
* domain services;
* APIs;
* events;
* jobs;
* queues;
* validation;
* failure handling.

## 14.8 `frontend-uiux-architect`

Responsible for:

* screens;
* components;
* navigation;
* responsiveness;
* accessibility;
* hierarchy;
* alignment;
* typography;
* motion;
* loading;
* errors;
* empty states;
* perceived performance.

## 14.9 `ai-orchestration-architect`

Responsible for:

* AI responsibilities;
* prompts;
* tools;
* context;
* memory;
* output schemas;
* evaluation;
* hallucination control;
* AI safety;
* AI cost and latency.

## 14.10 `integration-mcp-architect`

Responsible for:

* external integrations;
* MCP selection;
* access boundaries;
* tool allowlists;
* fallback integration behavior;
* environment separation.

## 14.11 `infrastructure-release-architect`

Responsible for:

* environments;
* infrastructure;
* CI/CD;
* deploy;
* migration order;
* release;
* rollback;
* disaster recovery.

## 14.12 `qa-validation-architect`

Responsible for:

* test strategy;
* acceptance-test mapping;
* edge cases;
* regression;
* browser QA;
* final validation.

## 14.13 `performance-observability-architect`

Responsible for:

* performance budgets;
* observability;
* logs;
* metrics;
* traces;
* alerts;
* profiling;
* cost telemetry.

## 14.14 `task-decomposer`

Responsible for:

* atomic tasks;
* dependencies;
* implementation phases;
* parallelism;
* file ownership;
* validation commands.

## 14.15 `skill-curator`

Responsible for:

* available skill discovery;
* community skill evaluation;
* local fallback mapping;
* project-specific skill creation;
* runtime classification.

## 14.16 `codex-handoff-writer`

Responsible for:

* implementation brief;
* exact implementation order;
* task manifest;
* context packets;
* non-negotiable rules;
* completion report format.

## 14.17 `plan-consistency-judge`

Must be independent from the main planning synthesis.

Responsible for finding:

* omissions;
* contradictions;
* vague requirements;
* missing tests;
* traceability breaks;
* implementation ambiguity.

It must not mark the plan ready until critical findings are resolved.

---

# 15. Mandatory Claude planning skills

Create canonical definitions and Claude-compatible adapters for at least:

```text
plan-max-orchestration
grill-me-planning
product-discovery
requirement-extraction
requirement-completeness-audit
assumption-management
decision-resolution
user-flow-planning
business-rule-specification
technical-architecture-planning
data-architecture-planning
database-selection
migration-planning
auth-authorization-planning
security-threat-model-planning
backend-api-planning
frontend-uiux-planning
responsive-design-planning
accessibility-planning
motion-performance-planning
ai-flow-planning
ai-evaluation-planning
integration-planning
mcp-governance-planning
infrastructure-planning
environment-strategy
observability-planning
performance-budget-planning
test-strategy-planning
task-decomposition
agent-assignment
skill-assignment
file-ownership-planning
context-packet-generation
codex-handoff-generation
plan-consistency-validation
requirement-traceability
```

Every skill must include:

* name;
* description;
* runtime scope;
* purpose;
* invocation triggers;
* when not to use;
* expected inputs;
* required context;
* outputs;
* step-by-step procedure;
* checklist;
* quality bar;
* failure conditions;
* related agents;
* dependencies;
* tool access;
* version;
* test fixtures.

The planning skills must be used by Claude.

Do not expect Codex to perform the original brainstorm process during implementation.

Codex may detect implementation inconsistencies, but product discovery remains Claude's responsibility.

---

# 16. Community planning skills

Create a community skill registry.

Include categories such as:

* brainstorming;
* `grill-me`;
* product discovery;
* requirement analysis;
* system design;
* frontend design;
* UI/UX;
* accessibility;
* backend architecture;
* database design;
* security review;
* testing;
* performance;
* AI evaluation;
* handoff generation.

For every candidate skill record:

```yaml
name:
category:
purpose:
source:
installed:
reviewed:
trust_level:
runtime:
recommended_agents:
mandatory_relevance:
local_fallback:
conflicts:
notes:
```

Rules:

* `grill-me` style planning is mandatory.
* If a trusted real skill exists, evaluate and use it.
* Otherwise, use the local `grill-me-planning` skill.
* Frontend planning must consider frontend-design and UI/UX skills.
* Testing planning must consider strong QA skills.
* Performance planning must consider runtime and perceived-performance skills.
* Never make a community skill a single point of failure.
* Every essential workflow must have a local fallback.

---

# 17. Codex implementation architecture

Create a Codex implementation runtime that consumes the active plan.

Codex must be able to begin from a stable entrypoint such as:

```text
Implement the active system plan using the implement-max skill.
```

Use the current supported Codex invocation mechanism.

Create:

* a root `AGENTS.md`;
* project-scoped Codex configuration;
* Codex agents;
* Codex implementation skills;
* MCP configuration templates;
* implementation scripts;
* final validation scripts.

The root `AGENTS.md` must remain concise and point to the canonical policies and active plan.

It must instruct Codex to:

1. locate the active plan;
2. validate the plan package;
3. read `PLAN_METADATA.yaml`;
4. read `EXECUTION.lock`;
5. read the task manifest;
6. read relevant context packets;
7. inspect the repository;
8. establish checkpoints;
9. execute tasks in dependency order;
10. use assigned agents and skills;
11. prevent conflicting writes;
12. run validations after every task and phase;
13. repair failures autonomously;
14. preserve product scope;
15. record deviations;
16. continue until completion gates pass;
17. produce the final report.

---

# 18. Required Codex implementation agents

Create canonical definitions and Codex adapters for at least:

## 18.1 `autonomous-execution-supervisor`

The primary implementation coordinator.

Responsibilities:

* own the implementation state machine;
* dispatch tasks;
* manage dependencies;
* manage parallel work;
* ensure validations run;
* reopen failed tasks;
* invoke recovery;
* prevent premature completion;
* produce the final result.

## 18.2 `repository-explorer`

Read-only.

Responsibilities:

* map the existing repository;
* locate relevant files;
* identify conventions;
* identify integration points;
* return concise evidence.

## 18.3 `implementation-task-runner`

Executes bounded tasks from the manifest.

Must not expand scope.

## 18.4 `frontend-uiux-builder`

Responsible for:

* frontend;
* components;
* layout;
* responsive behavior;
* accessibility;
* loading;
* empty states;
* error states;
* animation;
* visual consistency;
* perceived performance.

## 18.5 `backend-api-builder`

Responsible for:

* APIs;
* services;
* business logic;
* validation;
* jobs;
* queues;
* server-side tests.

## 18.6 `database-migration-builder`

Responsible for:

* schemas;
* migrations;
* seeds;
* indexes;
* constraints;
* repositories;
* database tests;
* migration verification.

## 18.7 `auth-authorization-builder`

Responsible for:

* authentication;
* sessions;
* roles;
* permissions;
* organization isolation;
* security tests.

## 18.8 `ai-orchestration-builder`

Responsible for:

* prompts;
* model interfaces;
* tools;
* memory;
* structured output;
* validation;
* fallback;
* AI evaluations.

## 18.9 `integration-builder`

Responsible for:

* external APIs;
* MCP-backed workflows;
* adapters;
* webhooks;
* retries;
* mocks;
* contract tests.

## 18.10 `infrastructure-builder`

Responsible for:

* containers;
* infrastructure as code;
* environment setup;
* CI/CD;
* deploy configuration;
* observability wiring.

## 18.11 `qa-test-validator`

Responsible for:

* unit tests;
* integration tests;
* contract tests;
* E2E;
* regression;
* acceptance criteria.

## 18.12 `browser-ui-validator`

Responsible for:

* running the application;
* navigating real flows;
* checking browser console;
* checking network failures;
* checking responsiveness;
* checking accessibility;
* capturing evidence;
* reporting visual and behavioral mismatches.

It should not edit code unless explicitly configured as a combined role.

## 18.13 `performance-reviewer`

Responsible for:

* profiling;
* latency;
* rendering;
* bundle size;
* slow queries;
* interaction smoothness;
* performance regressions.

## 18.14 `security-reviewer`

Prefer read-only review.

Responsible for:

* auth boundaries;
* injection;
* secrets;
* permissions;
* unsafe dependencies;
* data exposure;
* insecure configuration.

## 18.15 `failure-recovery-agent`

Responsible for:

* diagnosing failure;
* classifying cause;
* reviewing previous attempts;
* selecting a different strategy;
* reverting only problematic changes;
* creating corrective tasks;
* preventing infinite repetition.

## 18.16 `documentation-writer`

Responsible for:

* setup;
* architecture;
* environment;
* operations;
* troubleshooting;
* final implementation documentation.

## 18.17 `final-acceptance-judge`

Independent, primarily read-only.

Responsible for:

* comparing implementation against the plan;
* checking acceptance criteria;
* checking tests and evidence;
* identifying missing work;
* reopening failed criteria;
* preventing false completion.

---

# 19. Mandatory Codex implementation skills

Create canonical definitions and Codex-compatible adapters for at least:

```text
implement-max
active-plan-reader
plan-scope-guard
task-manifest-runner
context-packet-loader
repository-bootstrap
dependency-management
frontend-implementation
frontend-design-fidelity
responsive-implementation
accessibility-implementation
backend-api-implementation
business-logic-implementation
database-schema-implementation
database-migration-implementation
database-test-and-drift-check
auth-implementation
authorization-validation
ai-orchestration-implementation
ai-output-validation
integration-implementation
mcp-tool-usage
infrastructure-implementation
environment-bootstrap
observability-implementation
unit-test-loop
integration-test-loop
e2e-browser-validation
acceptance-criteria-validation
performance-audit
security-review
failure-diagnosis
failure-recovery
checkpoint-and-rollback
implementation-deviation-reporting
phase-completion-reporting
final-plan-comparison
final-delivery-report
```

Implementation skills must contain procedures, not only descriptions.

Every implementation skill must state:

* expected input;
* files it may own;
* files it must not touch;
* tools it may use;
* validations it must run;
* what constitutes success;
* what constitutes failure;
* when to escalate to recovery;
* when to return control to the supervisor.

---

# 20. Project lifecycle and state machine

Create a persistent lifecycle.

Planning states:

```text
RECEIVED
UNDERSTANDING
GRILLING
QUESTIONING
SPECIFYING_PRODUCT
DESIGNING_ARCHITECTURE
DECOMPOSING
PREPARING_CODEX
VALIDATING_PLAN
IMPLEMENTATION_READY
```

Implementation states:

```text
INITIALIZING
INSPECTING_REPOSITORY
BOOTSTRAPPING
IMPLEMENTING
INTEGRATING
TESTING
REPAIRING
REVIEWING
VALIDATING_ACCEPTANCE
DOCUMENTING
READY_FOR_DELIVERY
COMPLETED
BLOCKED_EXTERNALLY
```

Create allowed state transitions.

Examples:

```text
TESTING → REPAIRING → TESTING
IMPLEMENTING → REPLANNING_IMPLEMENTATION_PATH → IMPLEMENTING
VALIDATING_ACCEPTANCE → REPAIRING → VALIDATING_ACCEPTANCE
```

Do not allow:

```text
RECEIVED → IMPLEMENTING
IMPLEMENTING → COMPLETED
TESTING_FAILED → COMPLETED
```

Persist state in machine-readable form.

Create:

```text
runtime/state.json
runtime/execution-ledger.jsonl
runtime/task-status.yaml
runtime/checkpoints/
runtime/phase-logs/
```

The exact locations may be scoped under the active project.

---

# 21. Execution lock

Do not require repetitive human approval.

Create an execution lock that indicates the plan is structurally ready:

```yaml
execution_mode: autonomous
plan_status: implementation_ready
human_approval_per_task: false
continue_until_completion: true
active_plan_version:
active_plan_hash:
created_at:
required_completion_gates:
```

The initial system-building request is the authorization to create the plan.

Once essential material questions are answered, Claude may mark the package implementation-ready automatically.

The lock is a consistency mechanism, not an approval ceremony.

---

# 22. Plan versioning and immutability

Every active plan must have:

* project ID;
* version;
* content hash;
* creation timestamp;
* last planning update;
* source request;
* active status;
* superseded version;
* implementation status.

When the plan changes materially:

1. increment the version;
2. regenerate affected artifacts;
3. update the hash;
4. update traceability;
5. identify invalidated tasks;
6. preserve previous versions.

Codex must implement against one explicit plan version.

Do not silently modify the active plan during implementation.

Implementation-path changes may be logged as deviations or ADRs.

Product-requirement changes require a new plan version.

---

# 23. Requirement traceability

Create a complete traceability system.

Use IDs such as:

```text
GOAL-001
ACTOR-001
FLOW-001
FR-001
NFR-001
UI-001
RULE-001
DATA-001
DB-001
AUTH-001
API-001
AI-001
INT-001
SEC-001
PERF-001
OBS-001
AC-001
TASK-001
TEST-001
FILE-001
```

Create mappings:

```text
Goal → Requirement
Requirement → Architecture component
Requirement → Task
Task → Files
Requirement → Acceptance criterion
Acceptance criterion → Test
Test → Evidence
```

The final acceptance judge must use this map.

---

# 24. Database operating policy

The operating system must be able to plan and implement databases autonomously.

The database must not be represented only by an MCP connection.

The source of truth must remain in repository artifacts such as:

```text
database/
├── schema/
├── migrations/
├── seeds/
├── policies/
├── fixtures/
├── tests/
└── documentation/
```

Rules:

* all schema changes use migrations;
* local and test databases are isolated;
* development migrations may be run autonomously;
* test data must be synthetic;
* production data must never be copied into logs or fixtures;
* migration rollback must be considered;
* schema drift must be checked;
* constraints must be explicit;
* indexes must map to query needs;
* destructive data changes must have a safe transition plan;
* multi-tenant data requires explicit isolation;
* row-level policies must be tested when used;
* backup and restore strategy must be documented;
* database tests must be part of completion gates.

The system must select the database based on requirements.

It must not force the same database on every project.

However, it may define sensible defaults for common project profiles.

---

# 25. Production autonomy policy

The operating system must support autonomous production workflows when a production profile has been configured.

Production behavior must be policy-driven.

Create profiles such as:

```text
local_full_autonomy
development_full_autonomy
staging_full_autonomy
production_managed_autonomy
```

A production-capable profile should support:

* pre-deploy checks;
* backup verification;
* backward-compatible migrations;
* expand-and-contract migration strategy;
* shadow validation;
* smoke tests;
* health checks;
* canary or staged rollout when applicable;
* automatic rollback;
* post-deploy validation;
* deployment logs.

If credentials or production connectivity do not exist, the system must finish the local implementation and produce a deployment-ready package rather than stopping unrelated work.

Do not weaken secret protection in pursuit of autonomy.

---

# 26. Failure recovery

Codex must not stop at the first failure.

Implement a repair loop:

```text
Failure detected
    ↓
Classify failure
    ↓
Collect minimal evidence
    ↓
Review previous attempts
    ↓
Choose repair strategy
    ↓
Create checkpoint
    ↓
Apply bounded correction
    ↓
Run targeted validation
    ↓
Run regression validation
    ↓
Continue or select a different strategy
```

Failure categories:

* syntax;
* type;
* build;
* unit test;
* integration test;
* browser;
* database;
* migration;
* dependency;
* environment;
* external integration;
* security;
* performance;
* requirement mismatch;
* architectural mismatch.

Prevent infinite loops.

For repeated failure:

1. compare attempts;
2. prohibit identical retries;
3. widen diagnosis;
4. invoke a specialist;
5. consider an alternative implementation;
6. revert only the failed approach;
7. preserve successful work;
8. record the evidence.

Only classify a task as externally blocked after safe local alternatives have been exhausted.

---

# 27. Deviation policy

Codex may make autonomous implementation decisions.

Classify deviations:

## Level 0 — No meaningful deviation

Formatting, naming or minor internal organization.

Proceed silently or log briefly.

## Level 1 — Reversible implementation improvement

Changes implementation details without changing product behavior.

Proceed and log.

Examples:

* substitute one compatible library;
* adjust module boundaries;
* improve caching;
* improve internal type structure.

## Level 2 — Architectural path change

Changes the technical approach while preserving requirements.

Proceed only after:

* recording an ADR;
* updating affected technical artifacts;
* updating tasks and tests;
* confirming acceptance criteria remain valid.

Do not ask for routine permission.

## Level 3 — Product behavior change

Changes what the user experiences or the system is required to do.

Do not silently implement it.

Preserve the original requirement.

Seek an implementation that satisfies the plan.

If impossible, record the exact contradiction and complete all unaffected work.

---

# 28. Completion gates

Codex must not declare success because files were created.

Create objective completion gates.

At minimum:

```yaml
completion_gates:
  active_plan_valid: required
  product_requirements_implemented: required
  requirement_traceability_complete: required
  acceptance_criteria_passed: required
  build_passed: required
  lint_passed: required_when_configured
  typecheck_passed: required_when_applicable
  unit_tests_passed: required
  integration_tests_passed: required_when_applicable
  contract_tests_passed: required_when_applicable
  database_tests_passed: required_when_database_exists
  migration_validation_passed: required_when_database_exists
  auth_tests_passed: required_when_auth_exists
  authorization_tests_passed: required_when_auth_exists
  e2e_tests_passed: required_when_ui_exists
  browser_validation_passed: required_when_ui_exists
  accessibility_validation_passed: required_when_ui_exists
  ai_evaluations_passed: required_when_ai_exists
  security_review_passed: required
  performance_review_passed: required
  observability_verified: required_when_applicable
  documentation_complete: required
  deviation_report_complete: required
  external_blockers_documented: required
  final_acceptance_judge_passed: required
```

A failed gate must reopen relevant tasks.

---

# 29. Hooks and deterministic validations

Create Claude hooks or equivalent native mechanisms for:

* blocking secret exposure;
* warning or blocking destructive repository commands;
* detecting attempts to skip `/plan_max`;
* recording planning phases;
* validating planning artifacts;
* validating Codex handoff completeness;
* recording subagent completion;
* detecting conflicting plan versions.

Create Codex-compatible deterministic controls for:

* secret scanning;
* protected-path rules;
* task-manifest validation;
* plan-hash validation;
* phase validation;
* formatting;
* lint;
* type checks;
* tests;
* build;
* database migration checks;
* final plan comparison;
* phase completion logging.

When a runtime has no equivalent hook event, implement the behavior through:

* wrapper scripts;
* skills;
* configuration;
* task gates;
* CI;
* preflight checks;
* final validators.

Do not claim parity unless it is tested.

---

# 30. Secret and protected-data policy

Never read, print or commit:

* `.env` values;
* tokens;
* private keys;
* passwords;
* session secrets;
* production credentials;
* service-account keys;
* database passwords.

The system may inspect environment-variable names without reading their values.

Create:

```text
.env.example
secrets-manifest.yaml
```

The secrets manifest must contain metadata only:

```yaml
name:
purpose:
required_environment:
consumer:
required_for_local:
required_for_production:
rotation_notes:
```

Create protected-path patterns.

Create secret-scanning validation.

Sanitize logs.

---

# 31. Planning and implementation context management

Avoid context pollution.

Claude's main planning thread must retain:

* user intent;
* major decisions;
* product requirements;
* unresolved questions;
* final synthesis.

Subagents must receive focused planning assignments.

Return summaries and artifacts, not raw noise.

Codex's supervisor must receive:

* active plan metadata;
* task statuses;
* key deviations;
* validation status.

Implementation workers must receive:

* assigned task;
* relevant requirements;
* relevant architecture;
* relevant files;
* relevant tests;
* relevant skills;
* relevant MCP tools.

Create context packet templates.

Do not send every planning file to every worker.

---

# 32. Additional commands

In addition to `/plan_max`, create useful Claude planning commands or skills:

```text
/plan_resume
/grill_max
/plan_audit
/plan_validate
/plan_explain_assumptions
/prepare_codex
/regenerate_codex_handoff
/archive_plan
```

Behavior:

## `/plan_resume`

Continue the active planning session from persisted state.

## `/grill_max`

Run an additional adversarial planning review.

## `/plan_audit`

Inspect an existing plan for omissions and implementation ambiguity.

## `/plan_validate`

Run all plan completeness and traceability checks.

## `/plan_explain_assumptions`

Present the assumptions that most affect product behavior.

## `/prepare_codex`

Generate or regenerate all Codex adapters and implementation artifacts.

## `/regenerate_codex_handoff`

Update the handoff after a plan version change.

## `/archive_plan`

Move a completed or superseded plan into the archive without losing lineage.

Use current runtime-supported command or skill mechanisms.

---

# 33. Canonical plan templates

Create templates for at least:

```text
00-repository-context
01-user-intent
02-material-clarifying-questions
03-assumption-ledger
04-decision-ledger
05-product-system-plan
06-technical-architecture-plan
07-data-architecture-plan
08-database-migration-plan
09-auth-authorization-plan
10-security-threat-model
11-frontend-uiux-plan
12-backend-domain-plan
13-api-contract-plan
14-ai-orchestration-plan
15-integration-plan
16-mcp-access-plan
17-infrastructure-plan
18-environment-strategy
19-observability-plan
20-performance-plan
21-test-validation-plan
22-release-rollback-plan
23-task-decomposition
24-agent-map
25-skill-map
26-file-ownership
27-context-packet
28-acceptance-criteria
29-requirement-traceability
30-codex-handoff
31-codex-start
32-plan-validation-report
33-final-implementation-report
```

Each template must include instructions, required fields and a completeness checklist.

---

# 34. Machine-readable contracts

Create schemas for at least:

```text
plan-metadata.schema
user-intent.schema
assumption-ledger.schema
decision-ledger.schema
requirement.schema
actor.schema
user-flow.schema
ui-screen.schema
business-rule.schema
data-model.schema
database-plan.schema
api-contract.schema
ai-flow.schema
integration.schema
mcp-registry.schema
task-manifest.schema
agent-map.schema
skill-map.schema
file-ownership.schema
acceptance-criteria.schema
traceability.schema
execution-state.schema
completion-gates.schema
deviation.schema
final-report.schema
```

Choose JSON Schema, YAML validation or another robust repository-compatible approach.

Create validators.

Human-readable and machine-readable artifacts must remain consistent.

---

# 35. Tests for the operating system itself

Test the factory without building a real product.

Create dry-run fixtures such as:

* a simple internal CRUD system idea;
* an AI-assisted SaaS idea;
* a data pipeline idea;
* a visually complex frontend idea;
* an existing-repository extension idea.

Verify that `/plan_max` or its underlying skill:

* activates planning skills;
* uses the grill process;
* detects missing database decisions;
* detects missing authentication decisions;
* detects missing frontend states;
* detects missing backend behavior;
* detects missing AI validation;
* asks only material questions;
* resolves technical defaults autonomously;
* produces a complete plan package;
* generates a task manifest;
* generates Codex agents and skills;
* generates traceability;
* does not implement product code.

Test adapter parity.

Test schema validation.

Test secret protections.

Test state transitions.

Test completion gate logic.

---

# 36. Documentation

Create clear documentation for:

* architecture overview;
* why Claude and Codex are separated;
* source-of-truth model;
* how canonical artifacts work;
* how runtime adapters work;
* how to run `/plan_max`;
* how to answer question rounds;
* how Claude resolves assumptions;
* how to prepare Codex;
* how to start Codex implementation;
* how implementation resumes after interruption;
* how to inspect task status;
* how to inspect agent activity;
* how to add a skill;
* how to add an agent;
* how to add an MCP;
* how to configure a database;
* how to configure production;
* how to validate runtime parity;
* how to update the operating system;
* how to archive completed projects;
* troubleshooting.

Provide a concise user workflow such as:

```text
1. Open Claude Code in the repository.
2. Run /plan_max <system idea or plan>.
3. Answer only the grouped material product questions, if any.
4. Allow Claude to complete and validate the planning package.
5. Open Codex in the same repository.
6. Start the active implementation using the generated Codex entrypoint.
7. Codex continues until all completion gates pass.
8. Review the final implementation report.
```

---

# 37. `CLAUDE.md` requirements

Create a concise root `CLAUDE.md`.

It must state:

* this repository uses the Autonomous System Building OS;
* Claude is the primary planning runtime;
* `/plan_max` is the default system-planning entrypoint;
* never jump from idea directly to product code;
* always use the grill process;
* resolve inferable decisions autonomously;
* ask only material product questions;
* cover frontend, backend, database, auth, AI, integrations, infrastructure, security, performance, observability and testing;
* create traceable requirements;
* prepare the Codex package;
* do not use implementation skills to build the product;
* do not expose secrets;
* preserve the canonical source of truth;
* validate the plan before handoff.

Keep the root instruction file focused.

Move long procedures into skills and canonical documentation.

---

# 38. `AGENTS.md` requirements

Create a concise root `AGENTS.md`.

It must state:

* Codex is the primary implementation runtime;
* locate and validate the active plan before editing;
* follow the task manifest;
* use requirement traceability;
* use assigned implementation agents and skills;
* do not reinterpret core product behavior;
* make reversible implementation decisions autonomously;
* run tests and validations continuously;
* repair failures;
* do not declare completion prematurely;
* protect secrets;
* record deviations;
* continue until completion gates pass;
* use the final acceptance judge.

Do not duplicate the entire plan in `AGENTS.md`.

Reference canonical artifacts and active-plan entrypoints.

---

# 39. Configuration generation

Generate safe templates for:

* Claude settings;
* Claude hooks;
* Claude MCPs;
* Codex configuration;
* Codex subagents;
* Codex MCPs;
* local environment;
* CI.

Do not include secret values.

When a project-specific command does not yet exist, create a detection mechanism and placeholder contract rather than inventing a command that will fail.

For example:

```text
Detect package manager.
Detect lint command.
Detect test command.
Detect build command.
Detect migration command.
Record commands in the active plan.
```

---

# 40. Final operating-system validation

Before completing this request, verify:

## Architecture

* canonical source of truth exists;
* Claude adapter exists;
* Codex adapter exists;
* responsibilities are separated;
* translation scripts exist;
* parity validation exists.

## Claude planning

* `/plan_max` exists and is discoverable;
* mandatory grill skill exists;
* planning agents exist;
* planning skills exist;
* question protocol exists;
* all system dimensions are covered;
* plan validation exists.

## Codex implementation

* `AGENTS.md` exists;
* implementation entrypoint exists;
* Codex agents exist;
* Codex skills exist;
* task runner exists;
* recovery loop exists;
* acceptance judge exists;
* completion gates exist.

## Database

* data architecture templates exist;
* migration policy exists;
* test database policy exists;
* schema drift validation exists;
* database agent and skills exist.

## Authentication and security

* auth plan exists;
* authorization plan exists;
* threat model exists;
* secret policy exists;
* protected path validation exists.

## MCPs

* registry exists;
* policies exist;
* profiles exist;
* adapters exist;
* access levels exist;
* fallbacks exist;
* health checks exist.

## Quality

* requirement IDs exist;
* task IDs exist;
* test IDs exist;
* traceability exists;
* no critical template is empty;
* validators run successfully;
* documentation is complete;
* dry-run fixtures pass.

---

# 41. Final report

After creating the operating system, produce a detailed report containing:

1. canonical architecture created;
2. files and directories created;
3. Claude agents created;
4. Claude planning skills created;
5. Claude commands or entrypoints created;
6. Codex agents created;
7. Codex implementation skills created;
8. shared skills created;
9. runtime adapter scripts created;
10. hooks and deterministic validators created;
11. database capabilities created;
12. authentication and security capabilities created;
13. MCP registry and profiles created;
14. lifecycle and state machine created;
15. failure-recovery mechanisms created;
16. completion gates created;
17. dry-run tests executed;
18. runtime limitations detected;
19. compatibility decisions made;
20. exact future user workflow;
21. exact `/plan_max` invocation example;
22. exact Codex implementation invocation example;
23. external setup that may eventually be required;
24. confirmation that no product was implemented.

Include a tree of the final repository structure.

Include the commands used to validate the operating system.

Include any validation failures honestly.

Do not claim that something works if it was not tested.

---

# 42. Final non-negotiable rules

1. Build the reusable operating system, not a product.
2. Claude owns deep planning and brainstorming.
3. Codex owns implementation and repair.
4. `/plan_max` is the primary Claude entrypoint.
5. `grill-me` style planning is mandatory.
6. Claude answers inferable questions itself.
7. Claude asks only material product questions.
8. Questions must cover any unresolved part of the complete system, including database, authentication, backend, frontend, AI, integrations, infrastructure and security.
9. The plan must be extremely detailed and implementation-ready.
10. Product requirements and implementation instructions must remain separate.
11. Codex must receive a deterministic package.
12. Every requirement must be traceable to tasks and tests.
13. Skills must be adapted semantically to each runtime.
14. Planning skills belong primarily to Claude.
15. Implementation skills belong primarily to Codex.
16. Essential workflows require local fallback skills.
17. Database changes must be migration-based.
18. MCPs must be selected automatically but governed by least privilege.
19. The source of truth must remain in the repository.
20. Routine work must not require repeated approval.
21. Failures must trigger diagnosis and repair.
22. The implementation cannot finish until completion gates pass.
23. Secrets must never be exposed.
24. External blockers must not prevent completion of unaffected work.
25. The final implementation must match what Claude planned.
26. The final report must be truthful and evidence-based.

Begin by inspecting the repository and current runtime capabilities.

Then create the complete Autonomous System Building OS.

Do not implement a product.
