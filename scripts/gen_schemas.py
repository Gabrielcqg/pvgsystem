#!/usr/bin/env python3
"""Generate the canonical machine-readable contracts into
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


# ===========================================================================
# Production-complete planning contracts (frontend, AI, reconciliation,
# deliverables, production readiness). Added by the production-complete update.
# ===========================================================================

_PROVENANCE = {"type": S, "enum": ["user", "references", "inference"]}
_REF_CLASS = {"type": S, "enum": ["MUST_FOLLOW", "STRONG_INSPIRATION",
                                  "GENERAL_INSPIRATION", "AVOID"]}

# -- frontend-reference ------------------------------------------------------
_fe_reference = obj({
    "classification": _REF_CLASS, "name": STR, "location": STR,
    "notes": STR, "applies_to": STRLIST,
}, required=["classification", "notes"], additional=False)
schema("frontend-reference", obj({
    "provenance": _PROVENANCE,
    "visual_direction": STR, "brand_personality": STR, "product_feeling": STR,
    "target_polish": {"type": S, "enum": ["utilitarian", "polished", "premium", "flagship"]},
    "color_preferences": STR, "typography_preferences": STR,
    "spacing_density": STR, "surface_and_border_preferences": STR,
    "iconography": STR, "card_behavior": STR, "navigation_style": STR,
    "animation_style": STR, "scroll_behavior": STR,
    "responsive_expectations": STR, "accessibility_expectations": STR,
    "references": arr(_fe_reference),
    "liked_examples": STRLIST, "disliked_examples": STRLIST,
    "avoid_patterns": STRLIST, "non_negotiable_visual_rules": STRLIST,
    "decisions_provenance": {"type": "object"},
}, required=["provenance", "visual_direction", "target_polish",
             "non_negotiable_visual_rules"]),
   "Frontend Reference")

# -- design-token ------------------------------------------------------------
schema("design-token", obj({
    "color": {"type": "object"}, "typography": {"type": "object"},
    "spacing": {"type": "object"}, "radius": {"type": "object"},
    "shadow": {"type": "object"}, "motion": {"type": "object"},
    "breakpoints": {"type": "object"}, "z_index": {"type": "object"},
    "source": _PROVENANCE,
}, required=["color", "typography", "spacing"]), "Design Tokens")

# -- frontend-state ----------------------------------------------------------
_fe_state = obj({
    "id": {"type": S, "pattern": "^STATE-[0-9]{3,}$"},
    "name": STR, "applies_to": STR,
    "kind": {"type": S, "enum": [
        "default", "loading", "streaming", "generating", "reconnecting",
        "empty", "partial_data", "error", "success", "disabled",
        "permission_denied", "optimistic", "offline"]},
    "trigger": STR, "ui_representation": STR, "data_source": STR,
    "user_feedback": STR, "exit_transitions": STRLIST,
    "acceptance_criteria": STRLIST, "tests": STRLIST,
}, required=["id", "name", "applies_to", "kind", "ui_representation"],
   additional=False)
schema("frontend-state", obj({"states": arr(_fe_state, minItems=1)},
       required=["states"]), "Frontend State Inventory")

# -- screen-contract (detailed per-screen contract, superset of ui-screen) ---
_screen_states = obj({
    "default": STR, "loading": STR, "streaming": STR, "generating": STR,
    "reconnecting": STR, "empty": STR, "partial_data": STR, "error": STR,
    "success": STR, "disabled": STR, "permission_denied": STR,
}, required=["default", "loading", "empty", "error"])
schema("screen-contract", obj({
    "id": {"type": S, "pattern": "^UI-[0-9]{3,}$"},
    "purpose": STR, "user_role": STRLIST, "route": STR, "user_objective": STR,
    "information_hierarchy": STR, "main_content": STR, "layout": STR,
    "sections": STRLIST, "components": STRLIST,
    "primary_action": STR, "secondary_actions": STRLIST,
    "data_displayed": STRLIST, "data_source": STRLIST,
    "backend_dependency": STRLIST, "ai_dependency": STRLIST,
    "permissions": STRLIST, "validations": STRLIST,
    "states": _screen_states,
    "responsive_behavior": STR, "keyboard_behavior": STR, "focus_behavior": STR,
    "accessibility": STR, "animation": STR, "transition": STR,
    "scroll_behavior": STR, "persistence": STR, "optimistic_behavior": STR,
    "analytics": STRLIST,
    "requirement_refs": STRLIST, "api_refs": STRLIST,
    "state_machine_states": STRLIST,
    "acceptance_criteria": STRLIST, "tests": STRLIST,
}, required=["id", "purpose", "route", "user_objective", "primary_action",
             "states", "data_source", "acceptance_criteria"], additional=False),
   "Screen Contract")

# -- component-contract ------------------------------------------------------
schema("component-contract", obj({
    "id": {"type": S, "pattern": "^CMP-[0-9]{3,}$"},
    "name": STR, "purpose": STR, "used_in_screens": STRLIST,
    "requirement_ref": STRLIST, "consumes_api": STRLIST,
    "state_shown": STRLIST, "reflects": STR,
    "props": STRLIST, "states": STRLIST,
    "error_fallback": STR, "accessibility": STR,
    "acceptance_criteria": STRLIST, "tests": STRLIST,
}, required=["id", "name", "purpose", "reflects", "error_fallback", "tests"],
   additional=False), "Component Contract")

# -- interaction-contract (frontend->backend contract, section 9) ------------
schema("interaction-contract", obj({
    "id": {"type": S, "pattern": "^IX-[0-9]{3,}$"},
    "screen_id": STR, "component_id": STR, "user_action": STR,
    "frontend_validation": STR, "request_contract": STR,
    "backend_handler": STR, "business_rule": STRLIST, "ai_behavior": STRLIST,
    "database_effect": STR, "success_response": STR, "error_responses": STRLIST,
    "loading_state": STR, "streaming_state": STR, "retry_behavior": STR,
    "optimistic_behavior": STR, "user_feedback": STR, "analytics_event": STR,
    "acceptance_criteria": STRLIST, "tests": STRLIST,
}, required=["id", "screen_id", "user_action", "request_contract",
             "backend_handler", "success_response", "error_responses"],
   additional=False), "Interaction Contract")

# -- visual-quality-review ---------------------------------------------------
_vq_check = obj({
    "id": STR, "dimension": {"type": S, "enum": [
        "product_communication", "information_architecture", "creativity",
        "usability", "responsiveness", "visual_quality", "state_completeness",
        "reference_compliance"]},
    "question": STR,
    "verdict": {"type": S, "enum": ["pass", "warn", "fail"]},
    "evidence": STR, "finding": STR,
}, required=["id", "dimension", "verdict"], additional=False)
schema("visual-quality-review", obj({
    "checks": arr(_vq_check, minItems=1),
    "overall_verdict": {"type": S, "enum": ["pass", "fail"]},
    "gate": {"type": S, "const": "frontend_experience_review_passed"},
    "screens_reviewed": STRLIST, "evidence": STRLIST,
}, required=["checks", "overall_verdict"]), "Visual Quality Review")

# -- ai-responsibility-matrix ------------------------------------------------
_ai_step = obj({
    "step_id": {"type": S, "pattern": "^STEP-[0-9]{3,}$"},
    "description": STR,
    "owner": {"type": "array", "items": {"type": S, "enum": [
        "ai", "deterministic_backend", "frontend", "human"]}, "minItems": 1},
    "decision_type": {"type": S, "enum": [
        "interpretation", "generation", "classification", "retrieval",
        "deterministic_rule", "orchestration", "human_review", "static"]},
    "inputs": STRLIST, "context": STR, "tools": STRLIST,
    "output_contract": STR, "validation": STR, "fallback": STR,
    "user_visible_effect": STR, "adapts_dynamically": {"type": "boolean"},
}, required=["step_id", "description", "owner", "decision_type",
             "output_contract", "fallback"], additional=False)
schema("ai-responsibility-matrix", obj({
    "central_value": STR,
    "central_value_owner": {"type": S, "enum": [
        "ai", "deterministic_workflow", "combination"]},
    "decisions_never_delegated_to_ai": STRLIST,
    "behavior_when_ai_unavailable": STR,
    "minimum_deterministic_fallback": STR,
    "intelligence_proof": STR,
    "steps": arr(_ai_step, minItems=1),
}, required=["central_value", "central_value_owner", "steps",
             "behavior_when_ai_unavailable"]), "AI Responsibility Matrix")

# -- ai-provider-contract ----------------------------------------------------
schema("ai-provider-contract", obj({
    "provider": STR, "provider_independent_interface": STR,
    "concrete_adapter": STR,
    "model_env_var": STR, "api_key_env_var": STR,
    "model_config": STR, "timeout": STR, "retry": STR, "rate_limit_handling": STR,
    "structured_output": {"type": "boolean"},
    "input_schema": {"type": [S, "object"]},
    "output_schema": {"type": [S, "object"]},
    "prompt_contract": STR, "prompt_versioning": STR,
    "streaming": {"type": "boolean"}, "token_cost_logging": STR,
    "error_mapping": STR, "fallback_behavior": STR,
    "startup_validation": STR,
    "mock_mode_policy": {"type": S, "enum": [
        "test_double_only", "offline_dev_only", "ci_substitute",
        "explicit_demo_mode", "not_used_in_production"]},
    "env_example_keys": STRLIST,
    "production_setup_instructions": STR, "tests": STRLIST,
}, required=["provider", "provider_independent_interface", "concrete_adapter",
             "api_key_env_var", "model_env_var", "output_schema",
             "fallback_behavior", "startup_validation", "mock_mode_policy"],
   additional=False), "AI Provider Contract")

# -- real-ai-integration-plan ------------------------------------------------
_prod_path_step = obj({
    "order": {"type": "integer"}, "stage": STR, "detail": STR,
}, required=["order", "stage"], additional=False)
schema("real-ai-integration-plan", obj({
    "ai_is_central": {"type": "boolean"},
    "production_path": arr(_prod_path_step, minItems=1),
    "provider_contract_ref": STR,
    "responsibility_matrix_ref": STR,
    "frontend_ai_states": STRLIST,
    "centrality_tests": STRLIST,
    "required_env_vars": STRLIST,
    "mock_policy": STR,
    "setup_instructions": STR,
    "completion_gate": {"type": S, "const": "real_ai_integration_verified"},
}, required=["ai_is_central", "production_path", "provider_contract_ref",
             "centrality_tests", "required_env_vars", "mock_policy"]),
   "Real AI Integration Plan")

# -- vertical-traceability ---------------------------------------------------
_vt_row = obj({
    "requirement_id": ID, "goal_id": STR,
    "business_rules": STRLIST, "ai_behaviors": STRLIST,
    "backend_components": STRLIST, "database_entities": STRLIST,
    "api_contracts": STRLIST, "frontend_surfaces": STRLIST,
    "frontend_states": STRLIST, "acceptance_criteria": STRLIST,
    "tests": STRLIST, "evidence": STRLIST,
}, required=["requirement_id", "acceptance_criteria", "tests"],
   additional=False)
schema("vertical-traceability", obj({
    "requirements": arr(_vt_row, minItems=1),
    "layers_applicable": {"type": "object"},
}, required=["requirements"]), "Vertical Traceability")

# -- implementation-deliverable ----------------------------------------------
_deliverable = obj({
    "deliverable_id": {"type": S, "pattern": "^DEL-[0-9]{3,}$"},
    "name": STR,
    "type": {"type": S, "enum": [
        "frontend", "backend", "database", "authentication", "ai_integration",
        "local_environment", "production_environment", "e2e_suite",
        "observability", "documentation", "deployment", "final_report", "other"]},
    "purpose": STR, "requirements": STRLIST, "expected_files": STRLIST,
    "expected_runtime_behavior": STR, "dependencies": STRLIST,
    "configuration": STRLIST, "tests": STRLIST, "evidence": STRLIST,
    "completion_conditions": STRLIST,
    "completion_gate": STR,
}, required=["deliverable_id", "name", "type", "purpose",
             "expected_runtime_behavior", "completion_conditions"],
   additional=False)
schema("implementation-deliverable", obj({
    "deliverables": arr(_deliverable, minItems=1),
}, required=["deliverables"]), "Implementation Deliverables Contract")

# -- production-readiness ----------------------------------------------------
_layer = obj({
    "layer": {"type": S, "enum": [
        "product_behavior", "business_logic", "ai_behavior", "frontend",
        "backend", "database", "authentication", "authorization",
        "integrations", "environment_configuration", "observability",
        "security", "performance", "tests", "deployment", "rollback",
        "documentation"]},
    "applicable": {"type": "boolean"},
    "planned": {"type": "boolean"},
    "implementation_gate": STR,
    "evidence": STR, "notes": STR,
}, required=["layer", "applicable", "planned"], additional=False)
schema("production-readiness", obj({
    "layers": arr(_layer, minItems=1),
    "definition_satisfied": {"type": "boolean"},
}, required=["layers"]), "Production Readiness Matrix")

# -- production-like-run ------------------------------------------------------
_run_step = obj({
    "order": {"type": "integer"}, "action": STR,
    "expected": STR, "evidence": STR,
    "status": {"type": S, "enum": ["PASS", "FAIL", "NA", "PENDING"]},
}, required=["order", "action", "expected"], additional=False)
schema("production-like-run", obj({
    "steps": arr(_run_step, minItems=1),
    "gates_verified": STRLIST,
    "completion_gate": {"type": S, "const": "production_like_run_verified"},
}, required=["steps"]), "Production-like Run Verification")


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
