from __future__ import annotations

import importlib.util
import os
import sys
import types
from pathlib import Path

import pytest


REPO_ROOT = Path(__file__).resolve().parents[1]
PLAN_ROOT = REPO_ROOT / "plans" / "active" / "pavageau-sistema-integrado-backend"
CANONICAL_SCRAPER = PLAN_ROOT / "vendor" / "scraper" / "consulta_tjsp_lote.py"
SCRAPER_FIXTURE_DIR = PLAN_ROOT / "vendor" / "fixtures"


def _install_drissionpage_stub() -> None:
    if "DrissionPage" in sys.modules:
        return

    module = types.ModuleType("DrissionPage")

    class ChromiumOptions:
        def __getattr__(self, _name):
            def _noop(*_args, **_kwargs):
                return self

            return _noop

    class ChromiumPage:
        pass

    module.ChromiumOptions = ChromiumOptions
    module.ChromiumPage = ChromiumPage
    sys.modules["DrissionPage"] = module


def load_canonical_scraper():
    _install_drissionpage_stub()
    module_name = "canonical_consulta_tjsp_lote"
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(module_name, CANONICAL_SCRAPER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load canonical scraper from {CANONICAL_SCRAPER}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if not url:
        pytest.skip("DATABASE_URL is required for database-backed tests")
    return url


@pytest.fixture()
def db_conn(database_url: str):
    import psycopg

    with psycopg.connect(database_url, autocommit=True) as conn:
        yield conn


@pytest.fixture()
def clean_db(db_conn):
    tables = [
        "auditoria",
        "import_log",
        "tarefas",
        "movimentacoes_novas",
        "resultados_consulta",
        "execucoes_radar",
        "processos",
        "lancamentos",
        "parcelas",
        "contratos",
        "custos_fixos",
        "parametros",
        "ind_fluxo_mensal",
        "ind_dre_mensal",
        "ind_balanco",
        "ind_gastos_categoria",
        "ind_analise_mensal",
        "ind_painel",
    ]
    with db_conn.cursor() as cur:
        cur.execute("RESET ROLE")
        cur.execute(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE")
    yield db_conn
    with db_conn.cursor() as cur:
        cur.execute("RESET ROLE")
        cur.execute(f"TRUNCATE {', '.join(tables)} RESTART IDENTITY CASCADE")
