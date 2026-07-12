# Codex Start

1. Locate this active plan and run `python3 scripts/validate_plan_package.py <this dir>`.
2. Read `PLAN_METADATA.yaml` and `EXECUTION.lock`.
3. Read `18-task-manifest.yaml` and the relevant context packets.
4. Execute tasks in dependency order with the implement-max skill.
5. Run validations after each task and phase; repair failures.
6. Do not declare completion until the completion gates pass; run the final-acceptance-judge; produce the final implementation report.
