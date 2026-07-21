PYTHON ?= .venv/bin/python
DATABASE_URL ?= postgresql://postgres:postgres@localhost:54329/pavageau
MIGRATION_DATABASE_URL ?= $(DATABASE_URL)

.PHONY: install install-dev lint typecheck test test-scraper test-config test-schema test-calc test-api test-radar test-security test-loader migrate validate-plan scan-secrets

install:
	python3 -m venv .venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -r requirements.txt

install-dev:
	$(PYTHON) -m pip install -r requirements-dev.txt

lint:
	$(PYTHON) -m ruff check app tests

typecheck:
	$(PYTHON) -m mypy app

test:
	$(PYTHON) -m pytest -q

test-scraper:
	$(PYTHON) -m pytest -q -m scraper

test-config:
	$(PYTHON) -m pytest -q -m config

test-schema:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m schema

test-calc:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m calc

test-api:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m api

test-radar:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m radar

test-security:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m security

test-loader:
	DATABASE_URL=$(DATABASE_URL) $(PYTHON) -m pytest -q -m loader

migrate:
	MIGRATION_DATABASE_URL=$(MIGRATION_DATABASE_URL) $(PYTHON) -m app.db.migrate

validate-plan:
	python3 scripts/validate_plan_package.py plans/active/pavageau-sistema-integrado-backend

scan-secrets:
	python3 scripts/scan_secrets.py
