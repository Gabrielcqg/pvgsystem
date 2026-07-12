# Product/System Plan — Internal Vendor CRUD

## 8.1 Executive definition
Internal vendor registry for the ops team with role-based access and an audit log.

## 8.3 Actors
- ACTOR-001 ops-admin (manage users + vendors)
- ACTOR-002 ops-editor (CRUD vendors)
- ACTOR-003 ops-viewer (read vendors)

## 8.6 Functional requirements
- FR-001 Create vendor: authenticated editor submits a valid vendor; system persists it and writes an audit event.
- FR-002 Edit vendor: editor updates an existing vendor; prior values are captured in the audit log.
- FR-003 List/search vendors: viewer sees a paginated, filterable list scoped to permissions.
- FR-004 Role-based access: each action is authorized by role; unauthorized actions are denied and audited.
- FR-005 Audit log: every create/edit/delete records actor, timestamp, before/after.

## NFR
- NFR-001 List returns within 300ms p95 for 10k vendors.

## 8.19 Acceptance criteria
See 26-acceptance-criteria.yaml (AC-001..AC-005).
