#!/usr/bin/env python3
"""Generate the 25 canonical machine-readable contracts into
system-building-os/schemas/*.schema.json.

Schemas are a draft-07-compatible subset understood by scripts/lib/jsonschema_lite.
Re-run to regenerate. The emitted files are the committed source of truth.
"""
from __future__ import annotations

import json
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   "system-building-os", "schemas")

S = "string"
STR = {"type": S}
STRLIST = {"type": "array", "items": {"type": S}}
ID = {"type": S, "pattern": "^[A-Z]+-[0-9]{3,}$"}


def obj(props, required=None, additional=True, **extra):
    d = {"type": "object", "properties": props}
    if required:
        d["required"] = required
    if additional is False:
        d["additionalProperties"] = False
    d.update(extra)
    return d


def arr(items, **extra):
    d = {"type": "array", "items": items}
    d.update(extra)
    return d


SCHEMAS: dict[str, dict] = {}


def schema(name, definition, title):
    definition["$schema"] = "http://json-schema.org/draft-07/schema#"
    definition["title"] = title
    definition["$id"] = f"{name}.schema.json"
    SCHEMAS[name] = definition


# -- plan-metadata -----------------------------------------------------------
schema("plan-metadata", obj({
    "project_id": STR, "project_slug": {"type": S, "pattern": "^[a-z0-9-]+$"},
    "version": {"type": S, "pattern": r"^\d+\.\d+\.\d+$"},
    "content_hash": STR, "created_at": STR, "last_planning_update": STR,
    "source_request": STR, "active": {"type": "boolean"},
    "superseded_version": {"type": [S, "null"]},
    "implementation_status": {"type": S, "enum": [
        "not_started", "in_progress", "blocked_externally", "completed"]},
    "canonical_os": {"type": S},
}, required=["project_id", "project_slug", "version", "content_hash",
             "created_at", "source_request", "active", "implementation_status"],
   additional=True), "Plan Metadata")

# -- user-intent -------------------------------------------------------------
schema("user-intent", obj({
    "original_request_verbatim": STR,
    "interpreted_business_objective": STR,
    "problem_being_solved": STR, "desired_outcome": STR,
    "likely_users": STRLIST, "known_constraints": STRLIST,
    "explicit_requirements": STRLIST, "implicit_requirements": STRLIST,
    "non_negotiable_instructions": STRLIST, "open_decisions": STRLIST,
    "potential_contradictions": STRLIST, "current_system_context": STR,
    "definition_of_success": STR,
}, required=["original_request_verbatim", "interpreted_business_objective",
             "problem_being_solved", "definition_of_success"]),
   "User Intent Model")

# -- assumption-ledger -------------------------------------------------------
_assumption = obj({
    "id": {"type": S, "pattern": "^ASM-[0-9]{3,}$"},
    "assumption": STR,
    "confidence": {"type": S, "enum": ["high", "medium", "low"]},
    "reason": STR, "source": STR, "affected_requirements": STRLIST,
    "reversibility": {"type": S, "enum": ["reversible", "costly", "irreversible"]},
    "validation_method": STR, "consequence_if_wrong": STR,
    "category": {"type": S, "enum": ["A", "B", "C", "D", "E", "F"]},
}, required=["id", "assumption", "confidence", "reason", "reversibility",
             "consequence_if_wrong"], additional=False)
schema("assumption-ledger", obj({"assumptions": arr(_assumption)},
       required=["assumptions"]), "Assumption Ledger")

# -- decision-ledger ---------------------------------------------------------
_decision = obj({
    "id": {"type": S, "pattern": "^DEC-[0-9]{3,}$"},
    "decision": STR, "conflicting_statements": STRLIST,
    "alternatives_considered": STRLIST, "selected_option": STR,
    "rationale": STR, "product_impact": STR, "technical_impact": STR,
    "affected_requirements": STRLIST,
    "reversibility": {"type": S, "enum": ["reversible", "costly", "irreversible"]},
    "validation": STR, "user_input_required": {"type": "boolean"},
}, required=["id", "decision", "selected_option", "rationale", "reversibility"],
   additional=False)
schema("decision-ledger", obj({"decisions": arr(_decision)},
       required=["decisions"]), "Decision Ledger")

# -- requirement -------------------------------------------------------------
schema("requirement", obj({
    "id": {"type": S, "pattern": "^(FR|NFR)-[0-9]{3,}$"},
    "title": STR, "description": STR, "rationale": STR,
    "actors": STRLIST, "preconditions": STRLIST, "trigger": STR,
    "inputs": STRLIST, "processing_rules": STRLIST, "outputs": STRLIST,
    "state_changes": STRLIST, "validation": STRLIST, "errors": STRLIST,
    "permissions": STRLIST, "dependencies": STRLIST,
    "acceptance_criteria": STRLIST,
    "priority": {"type": S, "enum": ["must", "should", "could", "wont"]},
}, required=["id", "title", "description", "acceptance_criteria", "priority"],
   additional=False), "Functional/Non-functional Requirement")

# -- actor -------------------------------------------------------------------
schema("actor", obj({
    "id": {"type": S, "pattern": "^ACTOR-[0-9]{3,}$"},
    "description": STR, "objective": STR, "permissions": STRLIST,
    "restrictions": STRLIST, "entry_point": STR, "frequency_of_use": STR,
    "data_ownership": STR,
    "trust_level": {"type": S, "enum": ["anonymous", "authenticated", "privileged", "admin", "system", "service"]},
}, required=["id", "description", "objective", "trust_level"], additional=False),
   "Actor")

# -- user-flow ---------------------------------------------------------------
schema("user-flow", obj({
    "id": {"type": S, "pattern": "^FLOW-[0-9]{3,}$"},
    "actor": STR, "trigger": STR, "preconditions": STRLIST,
    "steps": arr(STR, minItems=1), "system_responses": STRLIST,
    "success_state": STR, "alternative_paths": STRLIST, "error_paths": STRLIST,
    "cancellation_behavior": STR, "recovery_behavior": STR,
    "data_created_or_changed": STRLIST, "audit_events": STRLIST,
    "acceptance_criteria": STRLIST,
}, required=["id", "actor", "trigger", "steps", "success_state",
             "acceptance_criteria"], additional=False), "User Flow / Journey")

# -- ui-screen ---------------------------------------------------------------
schema("ui-screen", obj({
    "id": {"type": S, "pattern": "^UI-[0-9]{3,}$"},
    "purpose": STR, "permitted_users": STRLIST, "route": STR,
    "layout_regions": STRLIST, "components": STRLIST,
    "information_hierarchy": STR, "primary_action": STR,
    "secondary_actions": STRLIST, "inputs": STRLIST, "validation": STRLIST,
    "states": obj({
        "default": STR, "loading": STR, "empty": STR, "error": STR,
        "success": STR, "disabled": STR, "partial_data": STR,
    }, required=["default", "loading", "empty", "error"]),
    "responsive_behavior": STR, "keyboard_behavior": STR,
    "accessibility_behavior": STR, "animation_behavior": STR,
    "navigation_behavior": STR, "persistence_behavior": STR,
    "analytics_events": STRLIST, "acceptance_criteria": STRLIST,
}, required=["id", "purpose", "route", "primary_action", "states",
             "acceptance_criteria"], additional=False), "UI Screen / Page")

# -- business-rule -----------------------------------------------------------
schema("business-rule", obj({
    "id": {"type": S, "pattern": "^RULE-[0-9]{3,}$"},
    "trigger": STR, "inputs": STRLIST, "condition": STR, "output": STR,
    "precedence": {"type": ["integer", S]}, "exceptions": STRLIST,
    "failure_behavior": STR, "audit_requirement": STR, "examples": STRLIST,
    "tests": STRLIST,
}, required=["id", "trigger", "condition", "output"], additional=False),
   "Business Rule")

# -- data-model --------------------------------------------------------------
_field = obj({
    "name": STR, "type": STR, "nullable": {"type": "boolean"},
    "unique": {"type": "boolean"}, "description": STR,
    "classification": {"type": S, "enum": ["public", "internal", "personal", "sensitive", "secret"]},
}, required=["name", "type"], additional=False)
_entity = obj({
    "id": {"type": S, "pattern": "^DB-[0-9]{3,}$"}, "name": STR,
    "description": STR, "owner": STR, "fields": arr(_field, minItems=1),
    "relationships": STRLIST, "constraints": STRLIST, "indexes": STRLIST,
    "soft_delete": {"type": "boolean"}, "audit_fields": {"type": "boolean"},
    "retention": STR, "personal_data": {"type": "boolean"},
}, required=["id", "name", "fields"], additional=False)
schema("data-model", obj({"entities": arr(_entity, minItems=1)},
       required=["entities"]), "Data Model")

# -- database-plan -----------------------------------------------------------
schema("database-plan", obj({
    "persistence_required": {"type": "boolean"},
    "database_kinds": {"type": "array", "items": {"type": S, "enum": [
        "relational", "document", "key_value", "graph", "vector", "search", "cache"]}},
    "recommended_database": STR, "provider": STR,
    "environments": obj({
        "local": STR, "test": STR, "staging": STR, "production": STR,
    }),
    "migration_strategy": STR, "rollback_strategy": STR,
    "backup_strategy": STR, "restore_strategy": STR,
    "multi_tenant_isolation": STR, "row_level_security": {"type": "boolean"},
    "seeds": STR, "fixtures": STR, "schema_drift_check": STR,
}, required=["persistence_required"]), "Database Plan")

# -- api-contract ------------------------------------------------------------
schema("api-contract", obj({
    "id": {"type": S, "pattern": "^API-[0-9]{3,}$"},
    "method": {"type": S, "enum": ["GET", "POST", "PUT", "PATCH", "DELETE",
                                    "PROCEDURE", "SUBSCRIPTION", "EVENT"]},
    "path": STR, "purpose": STR, "authentication": STR, "authorization": STR,
    "path_parameters": STRLIST, "query_parameters": STRLIST, "headers": STRLIST,
    "request_schema": {"type": [S, "object"]},
    "response_schema": {"type": [S, "object"]},
    "validation": STRLIST, "success_codes": STRLIST, "error_codes": STRLIST,
    "idempotency": STR, "rate_limits": STR, "side_effects": STRLIST,
    "database_changes": STRLIST, "events_emitted": STRLIST,
    "observability": STR, "tests": STRLIST,
}, required=["id", "method", "path", "purpose", "authentication"],
   additional=False), "API Contract")

# -- ai-flow -----------------------------------------------------------------
schema("ai-flow", obj({
    "id": {"type": S, "pattern": "^AI-[0-9]{3,}$"},
    "purpose": STR, "where_ai_is_appropriate": STR,
    "where_deterministic_required": STR, "user_inputs": STRLIST,
    "context_inputs": STRLIST, "tools": STRLIST, "memory": STR,
    "prompt_responsibilities": STR,
    "output_schema": {"type": [S, "object"]},
    "confidence_behavior": STR, "validation": STR, "citations": STR,
    "hallucination_mitigation": STR, "refusal_behavior": STR,
    "fallback_behavior": STR, "retry_behavior": STR,
    "evaluation_datasets": STRLIST, "quality_metrics": STRLIST,
    "cost_constraints": STR, "latency_constraints": STR,
    "human_review": STR, "prompt_versioning": STR,
    "model_substitution_strategy": STR, "capability_class": STR,
}, required=["id", "purpose", "output_schema", "validation",
             "fallback_behavior"], additional=False), "AI Flow")

# -- integration -------------------------------------------------------------
schema("integration", obj({
    "id": {"type": S, "pattern": "^INT-[0-9]{3,}$"},
    "external_system": STR, "purpose": STR, "authentication_mechanism": STR,
    "data_sent": STRLIST, "data_received": STRLIST, "triggers": STRLIST,
    "frequency": STR, "timeouts": STR, "retries": STR, "idempotency": STR,
    "rate_limits": STR, "failure_behavior": STR, "fallback": STR,
    "data_sensitivity": {"type": S, "enum": ["public", "internal", "personal", "sensitive"]},
    "audit_requirements": STR, "sandbox_support": {"type": "boolean"},
    "mock_strategy": STR, "tests": STRLIST,
}, required=["id", "external_system", "purpose", "failure_behavior",
             "fallback"], additional=False), "Integration")

# -- mcp-registry ------------------------------------------------------------
_mcp = obj({
    "id": STR, "name": STR, "category": STR, "provider": STR,
    "official_or_trusted_source": STR, "purpose": STR,
    "required_for_project": {"type": "boolean"},
    "runtime": obj({"claude": {"type": "boolean"}, "codex": {"type": "boolean"}}),
    "allowed_agents": STRLIST, "allowed_environments": STRLIST,
    "transport": {"type": S, "enum": ["stdio", "http", "sse", "websocket"]},
    "authentication_reference": STR,
    "access_mode": {"type": S, "enum": ["read_only", "read_write", "write"]},
    "enabled_tools": STRLIST, "disabled_tools": STRLIST,
    "write_capabilities": {"type": "boolean"},
    "data_classification": STR,
    "cost_risk": {"type": S, "enum": ["low", "medium", "high"]},
    "security_risk": {"type": S, "enum": ["low", "medium", "high"]},
    "audit_required": {"type": "boolean"}, "health_check": STR, "fallback": STR,
}, required=["id", "name", "category", "purpose", "required_for_project",
             "access_mode", "fallback"], additional=False)
schema("mcp-registry", obj({"mcps": arr(_mcp)}, required=["mcps"]),
       "MCP Registry")

# -- task-manifest -----------------------------------------------------------
_task = obj({
    "id": {"type": S, "pattern": "^TASK-[0-9]{3,}$"},
    "title": STR, "objective": STR, "phase": STR,
    "requirements": {"type": "array", "items": ID},
    "dependencies": {"type": "array", "items": {"type": S, "pattern": "^TASK-[0-9]{3,}$"}},
    "inputs": STRLIST, "expected_outputs": STRLIST,
    "files_to_create": STRLIST, "files_to_modify": STRLIST,
    "files_not_to_modify": STRLIST, "assigned_agent": STR,
    "required_skills": STRLIST, "optional_skills": STRLIST,
    "recommended_mcp_tools": STRLIST, "validation_commands": STRLIST,
    "acceptance_criteria": {"type": "array", "items": {"type": S, "pattern": "^AC-[0-9]{3,}$"}},
    "rollback": STR, "stop_conditions": STRLIST,
    "estimated_complexity": {"type": S, "enum": ["xs", "s", "m", "l", "xl"]},
    "parallelization_group": STR,
}, required=["id", "title", "objective", "requirements", "assigned_agent",
             "acceptance_criteria", "validation_commands"], additional=False)
schema("task-manifest", obj({"tasks": arr(_task, minItems=1)},
       required=["tasks"]), "Task Manifest")

# -- agent-map ---------------------------------------------------------------
_agent = obj({
    "id": STR, "responsibility": STR, "when_to_use": STR,
    "when_not_to_use": STR, "allowed_tools": STRLIST,
    "disallowed_actions": STRLIST, "model_profile": STR,
    "sandbox_or_permission_preference": STR, "core_skills": STRLIST,
    "specialized_skills": STRLIST, "mcp_tools": STRLIST,
    "input_context_packet": STR, "output_contract": STR,
    "validation_criteria": STRLIST, "stop_conditions": STRLIST,
    "file_ownership": STRLIST,
}, required=["id", "responsibility", "output_contract"], additional=False)
schema("agent-map", obj({"agents": arr(_agent, minItems=1)},
       required=["agents"]), "Agent Map")

# -- skill-map ---------------------------------------------------------------
_skill = obj({
    "name": STR,
    "classification": {"type": S, "enum": [
        "core_required", "project_specific", "community_external",
        "local_fallback", "new_to_create"]},
    "runtime": {"type": "array", "items": {"type": S, "enum": ["claude", "codex", "shared"]}},
    "purpose": STR, "local_fallback": STR, "source": STR,
    "trust_level": {"type": S, "enum": ["builtin", "trusted", "review_required", "untrusted"]},
}, required=["name", "classification", "runtime"], additional=False)
schema("skill-map", obj({"skills": arr(_skill, minItems=1)},
       required=["skills"]), "Skill Map")

# -- file-ownership ----------------------------------------------------------
_own = obj({
    "path": STR, "owner_agent": STR, "owner_task": STR,
    "mode": {"type": S, "enum": ["exclusive", "shared_read", "serialized_write"]},
    "parallelization_group": STR,
}, required=["path", "mode"], additional=False)
schema("file-ownership", obj({
    "ownership": arr(_own, minItems=1),
    "serialize": STRLIST, "parallelize": STRLIST,
}, required=["ownership"]), "File Ownership")

# -- acceptance-criteria -----------------------------------------------------
_ac = obj({
    "id": {"type": S, "pattern": "^AC-[0-9]{3,}$"},
    "requirement": ID, "setup": STR, "action": STR,
    "expected_result": STR, "evidence": STR,
    "verification": {"type": S, "enum": ["automated", "manual", "hybrid"]},
    "test_ids": {"type": "array", "items": {"type": S, "pattern": "^TEST-[0-9]{3,}$"}},
}, required=["id", "requirement", "action", "expected_result", "verification"],
   additional=False)
schema("acceptance-criteria", obj({"criteria": arr(_ac, minItems=1)},
       required=["criteria"]), "Acceptance Criteria")

# -- traceability ------------------------------------------------------------
schema("traceability", obj({
    "goal_to_requirement": {"type": "object"},
    "requirement_to_component": {"type": "object"},
    "requirement_to_task": {"type": "object"},
    "task_to_files": {"type": "object"},
    "requirement_to_acceptance": {"type": "object"},
    "acceptance_to_test": {"type": "object"},
    "test_to_evidence": {"type": "object"},
}, required=["requirement_to_task", "requirement_to_acceptance",
             "acceptance_to_test"]), "Requirement Traceability")

# -- execution-state ---------------------------------------------------------
schema("execution-state", obj({
    "project_id": STR, "plan_version": STR, "plan_hash": STR,
    "phase": {"type": S, "enum": ["planning", "implementation"]},
    "state": STR, "runtime": {"type": S, "enum": ["claude", "codex"]},
    "updated_at": STR, "history": {"type": "array"},
    "open_questions": {"type": "array"}, "active_task": {"type": [S, "null"]},
    "external_blockers": {"type": "array"}, "gates": {"type": "object"},
}, required=["phase", "state", "runtime"]), "Execution State")

# -- completion-gates --------------------------------------------------------
schema("completion-gates", obj({
    "completion_gates": {"type": "object"},
    "gate_semantics": {"type": "object"},
    "gate_states": STRLIST,
}, required=["completion_gates"]), "Completion Gates")

# -- deviation ---------------------------------------------------------------
schema("deviation", obj({
    "id": {"type": S, "pattern": "^DEV-[0-9]{3,}$"},
    "level": {"type": "integer", "minimum": 0, "maximum": 3},
    "summary": STR, "original_requirement": STR, "what_changed": STR,
    "reason": STR, "affected_requirements": STRLIST,
    "adr_id": {"type": [S, "null"]}, "acceptance_still_valid": {"type": "boolean"},
    "recorded_at": STR,
}, required=["id", "level", "summary", "reason"], additional=False),
   "Deviation Record")

# -- final-report ------------------------------------------------------------
schema("final-report", obj({
    "project_id": STR, "plan_version": STR, "generated_at": STR,
    "completion_gates": {"type": "object"},
    "acceptance_summary": {"type": "object"},
    "requirements_implemented": {"type": "array"},
    "tests_run": {"type": "object"}, "deviations": {"type": "array"},
    "external_blockers": {"type": "array"},
    "evidence": {"type": "array"}, "truthful": {"type": "boolean"},
    "final_acceptance_judge_passed": {"type": "boolean"},
}, required=["project_id", "generated_at", "completion_gates",
             "final_acceptance_judge_passed"]), "Final Implementation Report")


def main() -> int:
    os.makedirs(OUT, exist_ok=True)
    for name, definition in SCHEMAS.items():
        path = os.path.join(OUT, f"{name}.schema.json")
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(definition, fh, indent=2)
            fh.write("\n")
    print(f"Wrote {len(SCHEMAS)} schemas to {OUT}")
    for n in sorted(SCHEMAS):
        print(f"  {n}.schema.json")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
