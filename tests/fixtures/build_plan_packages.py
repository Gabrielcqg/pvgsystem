#!/usr/bin/env python3
"""Build complete, schema-valid example plan packages under
tests/fixtures/plan-packages/<slug>/ to exercise the factory end to end.

These are DRY-RUN PLANNING EXAMPLES ONLY — they contain planning artifacts, not
product source code. They demonstrate the package shape /plan_max produces and
must pass scripts/validate_plan_package.py.
"""
from __future__ import annotations

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "scripts", "lib"))
import miniyaml  # noqa: E402

OUT = os.path.join(ROOT, "tests", "fixtures", "plan-packages")


def y(obj) -> str:
    return miniyaml.dumps(obj)


def write(pkg: str, name: str, content: str) -> None:
    d = os.path.join(OUT, pkg)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, name), "w", encoding="utf-8") as fh:
        fh.write(content if content.endswith("\n") else content + "\n")


def build(slug: str, meta: dict, intent: dict, product_md: str, tasks: list,
          agents: list, skills: list, ownership: dict, criteria: list,
          traceability: dict, gates: list) -> None:
    write(slug, "PLAN_METADATA.yaml", y(meta))
    write(slug, "01-user-intent.json", json.dumps(intent, indent=2))
    write(slug, "05-product-system-plan.md", product_md)
    write(slug, "18-task-manifest.yaml", y({"tasks": tasks}))
    write(slug, "20-agent-map.yaml", y({"agents": agents}))
    write(slug, "21-skill-map.yaml", y({"skills": skills}))
    write(slug, "22-file-ownership.yaml", y(ownership))
    write(slug, "26-acceptance-criteria.yaml", y({"criteria": criteria}))
    write(slug, "27-requirement-traceability.yaml", y(traceability))
    lock = {
        "execution_mode": "autonomous",
        "plan_status": "implementation_ready",
        "human_approval_per_task": False,
        "continue_until_completion": True,
        "active_plan_version": meta["version"],
        "active_plan_hash": meta["content_hash"],
        "created_at": meta["created_at"],
        "autonomy_profile": "development_full_autonomy",
        "required_completion_gates": gates,
    }
    write(slug, "EXECUTION.lock", y(lock))
    write(slug, "28-codex-handoff.md",
          f"# Codex Handoff — {meta['project_slug']}\n\n"
          "Implementation brief: build the system exactly as specified in "
          "`05-product-system-plan.md`. Execute `18-task-manifest.yaml` in "
          "dependency order using each task's assigned agent and skills. Respect "
          "`22-file-ownership.yaml`. Run each task's validation commands; repair "
          "failures via the recovery loop. Do not change product behavior.\n\n"
          "Order: " + " -> ".join(t["id"] for t in tasks) + "\n\n"
          "Non-negotiable rules: never expose secrets; keep scope; record "
          "deviations; do not complete until the listed completion gates pass; "
          "use the final-acceptance-judge before delivery.\n\n"
          f"Active plan version {meta['version']} (hash {meta['content_hash']}).\n")
    write(slug, "29-codex-start.md",
          "# Codex Start\n\n"
          "1. Locate this active plan and run "
          "`python3 scripts/validate_plan_package.py <this dir>`.\n"
          "2. Read `PLAN_METADATA.yaml` and `EXECUTION.lock`.\n"
          "3. Read `18-task-manifest.yaml` and the relevant context packets.\n"
          "4. Execute tasks in dependency order with the implement-max skill.\n"
          "5. Run validations after each task and phase; repair failures.\n"
          "6. Do not declare completion until the completion gates pass; run the "
          "final-acceptance-judge; produce the final implementation report.\n")


COMMON_GATES = [
    "active_plan_valid", "product_requirements_implemented",
    "requirement_traceability_complete", "acceptance_criteria_passed",
    "build_passed", "unit_tests_passed", "security_review_passed",
    "performance_review_passed", "documentation_complete",
    "deviation_report_complete", "external_blockers_documented",
    "final_acceptance_judge_passed",
]


def internal_crud() -> None:
    meta = {
        "project_id": "example-internal-crud", "project_slug": "internal-crud",
        "version": "1.0.0", "content_hash": "sha256:example-crud-0001",
        "created_at": "2026-07-11T00:00:00Z",
        "source_request": "Internal vendor CRUD with roles and audit log.",
        "active": True, "superseded_version": None,
        "implementation_status": "not_started",
        "canonical_os": "autonomous-system-building-os",
    }
    intent = {
        "original_request_verbatim": "An internal tool for our ops team to create, "
            "edit and track vendor records with roles and an audit log.",
        "interpreted_business_objective": "Give the ops team a governed system of "
            "record for vendors with role-based access and full auditability.",
        "problem_being_solved": "Vendor data lives in spreadsheets with no roles or audit trail.",
        "desired_outcome": "A reliable internal vendor registry with RBAC and audit history.",
        "definition_of_success": "Ops can CRUD vendors under RBAC; every change is audited; "
            "all acceptance criteria pass.",
        "likely_users": ["ops-admin", "ops-editor", "ops-viewer"],
        "explicit_requirements": ["roles", "audit log", "vendor CRUD"],
        "implicit_requirements": ["authentication", "data isolation", "input validation"],
    }
    product_md = (
        "# Product/System Plan — Internal Vendor CRUD\n\n"
        "## 8.1 Executive definition\n"
        "Internal vendor registry for the ops team with role-based access and an audit log.\n\n"
        "## 8.3 Actors\n"
        "- ACTOR-001 ops-admin (manage users + vendors)\n"
        "- ACTOR-002 ops-editor (CRUD vendors)\n"
        "- ACTOR-003 ops-viewer (read vendors)\n\n"
        "## 8.6 Functional requirements\n"
        "- FR-001 Create vendor: authenticated editor submits a valid vendor; system persists it and writes an audit event.\n"
        "- FR-002 Edit vendor: editor updates an existing vendor; prior values are captured in the audit log.\n"
        "- FR-003 List/search vendors: viewer sees a paginated, filterable list scoped to permissions.\n"
        "- FR-004 Role-based access: each action is authorized by role; unauthorized actions are denied and audited.\n"
        "- FR-005 Audit log: every create/edit/delete records actor, timestamp, before/after.\n\n"
        "## NFR\n"
        "- NFR-001 List returns within 300ms p95 for 10k vendors.\n\n"
        "## 8.19 Acceptance criteria\n"
        "See 26-acceptance-criteria.yaml (AC-001..AC-005).\n"
    )
    tasks = [
        {"id": "TASK-001", "title": "Bootstrap project + toolchain", "objective":
         "Create the runnable skeleton and detect package/lint/test/build commands.",
         "requirements": ["FR-001"], "dependencies": [],
         "assigned_agent": "implementation-task-runner",
         "required_skills": ["repository-bootstrap", "dependency-management"],
         "validation_commands": ["<detected build>", "<detected test>"],
         "acceptance_criteria": ["AC-001"], "estimated_complexity": "s",
         "files_to_create": ["<skeleton>"], "parallelization_group": "g0"},
        {"id": "TASK-002", "title": "Vendor schema + migrations", "objective":
         "Create the vendor + audit schema and reversible migrations.",
         "requirements": ["FR-001", "FR-005"], "dependencies": ["TASK-001"],
         "assigned_agent": "database-migration-builder",
         "required_skills": ["database-schema-implementation", "database-migration-implementation",
                             "database-test-and-drift-check"],
         "validation_commands": ["<migrate>", "<db tests>"],
         "acceptance_criteria": ["AC-005"], "estimated_complexity": "m",
         "files_to_create": ["database/schema/*", "database/migrations/*"],
         "parallelization_group": "g1"},
        {"id": "TASK-003", "title": "Auth + RBAC", "objective":
         "Implement authentication, sessions, and role-based authorization.",
         "requirements": ["FR-004"], "dependencies": ["TASK-002"],
         "assigned_agent": "auth-authorization-builder",
         "required_skills": ["auth-implementation", "authorization-validation"],
         "validation_commands": ["<auth tests>"],
         "acceptance_criteria": ["AC-004"], "estimated_complexity": "m",
         "parallelization_group": "g2"},
        {"id": "TASK-004", "title": "Vendor CRUD API", "objective":
         "Implement create/edit/list APIs with validation and audit writes.",
         "requirements": ["FR-001", "FR-002", "FR-003", "FR-005"],
         "dependencies": ["TASK-002", "TASK-003"],
         "assigned_agent": "backend-api-builder",
         "required_skills": ["backend-api-implementation", "business-logic-implementation",
                             "unit-test-loop"],
         "validation_commands": ["<unit tests>", "<integration tests>"],
         "acceptance_criteria": ["AC-001", "AC-002", "AC-003"], "estimated_complexity": "l",
         "parallelization_group": "g3"},
        {"id": "TASK-005", "title": "Vendor UI", "objective":
         "Implement list/create/edit screens with all states and accessibility.",
         "requirements": ["FR-001", "FR-002", "FR-003"], "dependencies": ["TASK-004"],
         "assigned_agent": "frontend-uiux-builder",
         "required_skills": ["frontend-implementation", "responsive-implementation",
                             "accessibility-implementation"],
         "validation_commands": ["<component tests>", "<e2e>"],
         "acceptance_criteria": ["AC-003"], "estimated_complexity": "l",
         "parallelization_group": "g4"},
        {"id": "TASK-006", "title": "Acceptance + QA", "objective":
         "Verify all acceptance criteria with evidence.",
         "requirements": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005"],
         "dependencies": ["TASK-004", "TASK-005"],
         "assigned_agent": "qa-test-validator",
         "required_skills": ["acceptance-criteria-validation", "integration-test-loop"],
         "validation_commands": ["<full suite>"],
         "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004", "AC-005"],
         "estimated_complexity": "m", "parallelization_group": "g5"},
    ]
    used_agents = sorted({t["assigned_agent"] for t in tasks})
    responsibilities = {
        "implementation-task-runner": "Execute bounded bootstrap tasks.",
        "database-migration-builder": "Own database schema, migrations, and drift checks.",
        "auth-authorization-builder": "Own authentication and RBAC.",
        "backend-api-builder": "Own the vendor CRUD API and business logic.",
        "frontend-uiux-builder": "Own the vendor UI and its states.",
        "qa-test-validator": "Own acceptance and regression testing.",
    }
    agents = [{"id": a, "responsibility": responsibilities[a],
               "output_contract": "validated changes within owned files + evidence"}
              for a in used_agents]
    skills = [{"name": s, "classification": "core_required", "runtime": ["codex"]}
              for s in sorted({sk for t in tasks for sk in t["required_skills"]})]
    ownership = {
        "ownership": [
            {"path": "database/**", "mode": "exclusive", "owner_agent": "database-migration-builder"},
            {"path": "<backend>/**", "mode": "exclusive", "owner_agent": "backend-api-builder"},
            {"path": "<frontend>/**", "mode": "exclusive", "owner_agent": "frontend-uiux-builder"},
        ],
        "serialize": ["database/migrations/**", "shared config"],
        "parallelize": ["frontend module", "read-only reviews"],
    }
    criteria = [
        {"id": "AC-001", "requirement": "FR-001", "action": "Editor submits a valid vendor.",
         "expected_result": "Vendor persisted and an audit event written.",
         "verification": "automated", "test_ids": ["TEST-001"]},
        {"id": "AC-002", "requirement": "FR-002", "action": "Editor edits a vendor.",
         "expected_result": "Change saved; before/after captured in audit log.",
         "verification": "automated", "test_ids": ["TEST-002"]},
        {"id": "AC-003", "requirement": "FR-003", "action": "Viewer opens the vendor list.",
         "expected_result": "Paginated, permission-scoped list renders with empty/loading/error states.",
         "verification": "automated", "test_ids": ["TEST-003"]},
        {"id": "AC-004", "requirement": "FR-004", "action": "Viewer attempts an edit.",
         "expected_result": "Action denied by RBAC and the denial is audited.",
         "verification": "automated", "test_ids": ["TEST-004"]},
        {"id": "AC-005", "requirement": "FR-005", "action": "Any create/edit/delete occurs.",
         "expected_result": "An audit record with actor, timestamp, before/after exists.",
         "verification": "automated", "test_ids": ["TEST-005"]},
    ]
    traceability = {
        "goal_to_requirement": {"GOAL-001": ["FR-001", "FR-002", "FR-003", "FR-004", "FR-005"]},
        "requirement_to_component": {"FR-001": ["backend", "database"], "FR-004": ["auth"]},
        "requirement_to_task": {
            "FR-001": ["TASK-002", "TASK-004"], "FR-002": ["TASK-004"],
            "FR-003": ["TASK-004", "TASK-005"], "FR-004": ["TASK-003"],
            "FR-005": ["TASK-002", "TASK-004"]},
        "task_to_files": {"TASK-002": ["database/**"], "TASK-004": ["<backend>/**"]},
        "requirement_to_acceptance": {
            "FR-001": ["AC-001"], "FR-002": ["AC-002"], "FR-003": ["AC-003"],
            "FR-004": ["AC-004"], "FR-005": ["AC-005"]},
        "acceptance_to_test": {
            "AC-001": ["TEST-001"], "AC-002": ["TEST-002"], "AC-003": ["TEST-003"],
            "AC-004": ["TEST-004"], "AC-005": ["TEST-005"]},
        "test_to_evidence": {"TEST-001": ["<ci-run-link>"]},
    }
    build("internal-crud", meta, intent, product_md, tasks, agents, skills,
          ownership, criteria, traceability, COMMON_GATES)


def ai_saas() -> None:
    meta = {
        "project_id": "example-ai-saas", "project_slug": "ai-saas",
        "version": "1.0.0", "content_hash": "sha256:example-aisaas-0001",
        "created_at": "2026-07-11T00:00:00Z",
        "source_request": "AI contract-review SaaS for multiple client companies.",
        "active": True, "superseded_version": None,
        "implementation_status": "not_started",
        "canonical_os": "autonomous-system-building-os",
    }
    intent = {
        "original_request_verbatim": "An AI-assisted SaaS that reviews contracts and "
            "suggests risky clauses for multiple client companies.",
        "interpreted_business_objective": "Multi-tenant SaaS that flags contract risk with "
            "validated, advisory AI output.",
        "problem_being_solved": "Manual contract review is slow and inconsistent.",
        "desired_outcome": "Reviewers get validated, cited risk suggestions they can accept or reject.",
        "definition_of_success": "Tenants isolated; AI output schema-validated and advisory; "
            "golden + red-team evals pass; all acceptance criteria pass.",
    }
    product_md = (
        "# Product/System Plan — AI Contract Review SaaS\n\n"
        "## 8.1 Executive definition\n"
        "Multi-tenant SaaS that reviews contracts and suggests risky clauses. AI output is "
        "advisory (a reviewer accepts/rejects), schema-validated, and cited.\n\n"
        "## 8.6 Functional requirements\n"
        "- FR-001 Upload contract: an authenticated tenant user uploads a contract for review.\n"
        "- FR-002 AI risk review: the system produces schema-validated, cited risk suggestions.\n"
        "- FR-003 Advisory decision: a reviewer accepts or rejects each suggestion; nothing auto-executes.\n"
        "- FR-004 Tenant isolation: data is isolated per client company.\n\n"
        "## 8.12 AI behavior\n"
        "AI-001 receives the contract text + clause taxonomy, returns a JSON list of "
        "{clause, risk_level, rationale, citation}. Output is validated against the AI "
        "output schema; low confidence triggers a human-review fallback; the model sits "
        "behind a model-independent interface. Golden + red-team evals gate release.\n\n"
        "## 8.19 Acceptance criteria\n"
        "See 26-acceptance-criteria.yaml (AC-001..AC-004).\n"
    )
    tasks = [
        {"id": "TASK-001", "title": "Bootstrap + multi-tenant scaffold", "objective":
         "Create the runnable skeleton with tenant context.",
         "requirements": ["FR-004"], "dependencies": [],
         "assigned_agent": "implementation-task-runner",
         "required_skills": ["repository-bootstrap"],
         "validation_commands": ["<build>"], "acceptance_criteria": ["AC-004"],
         "estimated_complexity": "s", "parallelization_group": "g0"},
        {"id": "TASK-002", "title": "Tenant + contract schema", "objective":
         "Schema + migrations with row-level tenant isolation.",
         "requirements": ["FR-001", "FR-004"], "dependencies": ["TASK-001"],
         "assigned_agent": "database-migration-builder",
         "required_skills": ["database-schema-implementation", "database-migration-implementation"],
         "validation_commands": ["<db tests>"], "acceptance_criteria": ["AC-004"],
         "estimated_complexity": "m", "parallelization_group": "g1"},
        {"id": "TASK-003", "title": "AI risk-review flow", "objective":
         "Implement the AI flow behind a model-independent interface with output validation.",
         "requirements": ["FR-002"], "dependencies": ["TASK-002"],
         "assigned_agent": "ai-orchestration-builder",
         "required_skills": ["ai-orchestration-implementation", "ai-output-validation"],
         "validation_commands": ["<ai evals>"], "acceptance_criteria": ["AC-002"],
         "estimated_complexity": "l", "parallelization_group": "g2"},
        {"id": "TASK-004", "title": "Review + advisory UI/API", "objective":
         "Upload + accept/reject flow; nothing auto-executes.",
         "requirements": ["FR-001", "FR-003"], "dependencies": ["TASK-003"],
         "assigned_agent": "backend-api-builder",
         "required_skills": ["backend-api-implementation", "unit-test-loop"],
         "validation_commands": ["<tests>"], "acceptance_criteria": ["AC-001", "AC-003"],
         "estimated_complexity": "l", "parallelization_group": "g3"},
        {"id": "TASK-005", "title": "Acceptance + evals", "objective":
         "Run golden + red-team evals and acceptance checks.",
         "requirements": ["FR-002", "FR-003", "FR-004"], "dependencies": ["TASK-004"],
         "assigned_agent": "qa-test-validator",
         "required_skills": ["acceptance-criteria-validation"],
         "validation_commands": ["<full suite>"],
         "acceptance_criteria": ["AC-001", "AC-002", "AC-003", "AC-004"],
         "estimated_complexity": "m", "parallelization_group": "g4"},
    ]
    used_agents = sorted({t["assigned_agent"] for t in tasks})
    resp = {
        "implementation-task-runner": "Bootstrap and bounded tasks.",
        "database-migration-builder": "Tenant-isolated schema + migrations.",
        "ai-orchestration-builder": "AI flow, output validation, evals.",
        "backend-api-builder": "Review API and advisory decision flow.",
        "qa-test-validator": "Acceptance + eval gating.",
    }
    agents = [{"id": a, "responsibility": resp[a],
               "output_contract": "validated changes within owned files + evidence"}
              for a in used_agents]
    skills = [{"name": s, "classification": "core_required", "runtime": ["codex"]}
              for s in sorted({sk for t in tasks for sk in t["required_skills"]})]
    ownership = {"ownership": [
        {"path": "database/**", "mode": "exclusive", "owner_agent": "database-migration-builder"},
        {"path": "<ai>/**", "mode": "exclusive", "owner_agent": "ai-orchestration-builder"},
        {"path": "<backend>/**", "mode": "exclusive", "owner_agent": "backend-api-builder"},
    ], "serialize": ["database/migrations/**"], "parallelize": ["read-only reviews"]}
    criteria = [
        {"id": "AC-001", "requirement": "FR-001", "action": "Tenant user uploads a contract.",
         "expected_result": "Contract stored under the tenant; review job created.",
         "verification": "automated", "test_ids": ["TEST-001"]},
        {"id": "AC-002", "requirement": "FR-002", "action": "AI reviews a contract.",
         "expected_result": "Schema-valid, cited risk suggestions; low confidence -> human review.",
         "verification": "hybrid", "test_ids": ["TEST-002"]},
        {"id": "AC-003", "requirement": "FR-003", "action": "Reviewer rejects a suggestion.",
         "expected_result": "Suggestion marked rejected; nothing auto-executed.",
         "verification": "automated", "test_ids": ["TEST-003"]},
        {"id": "AC-004", "requirement": "FR-004", "action": "User from tenant A requests tenant B data.",
         "expected_result": "Access denied by isolation; attempt audited.",
         "verification": "automated", "test_ids": ["TEST-004"]},
    ]
    traceability = {
        "goal_to_requirement": {"GOAL-001": ["FR-001", "FR-002", "FR-003", "FR-004"]},
        "requirement_to_component": {"FR-002": ["ai"], "FR-004": ["database", "auth"]},
        "requirement_to_task": {"FR-001": ["TASK-002", "TASK-004"], "FR-002": ["TASK-003"],
                                "FR-003": ["TASK-004"], "FR-004": ["TASK-002"]},
        "task_to_files": {"TASK-003": ["<ai>/**"]},
        "requirement_to_acceptance": {"FR-001": ["AC-001"], "FR-002": ["AC-002"],
                                      "FR-003": ["AC-003"], "FR-004": ["AC-004"]},
        "acceptance_to_test": {"AC-001": ["TEST-001"], "AC-002": ["TEST-002"],
                               "AC-003": ["TEST-003"], "AC-004": ["TEST-004"]},
        "test_to_evidence": {"TEST-002": ["<eval-report>"]},
    }
    build("ai-saas", meta, intent, product_md, tasks, agents, skills, ownership,
          criteria, traceability, COMMON_GATES + ["ai_evaluations_passed"])


def main() -> int:
    internal_crud()
    ai_saas()
    print(f"Built example plan packages in {OUT}")
    for slug in sorted(os.listdir(OUT)):
        print(f"  {slug}: {len(os.listdir(os.path.join(OUT, slug)))} files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
