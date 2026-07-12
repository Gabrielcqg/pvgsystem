# How to Archive Completed Projects
Run `/archive_plan <slug>`. Completed plans move to `plans/completed/<slug>`;
superseded plans move to `plans/archived/<slug>`. PLAN_METADATA lineage (version,
superseded_version, hashes) is preserved. History is never deleted.
