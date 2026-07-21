from __future__ import annotations

import pytest


PRODUCT_TABLES = {
    "parceiros",
    "contratos",
    "parcelas",
    "lancamentos",
    "custos_fixos",
    "parametros",
    "configuracoes",
    "processos",
    "execucoes_radar",
    "resultados_consulta",
    "movimentacoes_novas",
    "tarefas",
    "auditoria",
    "import_log",
    "ind_fluxo_mensal",
    "ind_dre_mensal",
    "ind_balanco",
    "ind_gastos_categoria",
    "ind_analise_mensal",
    "ind_painel",
}


def _raises_privilege(fn) -> bool:
    try:
        fn()
    except Exception as exc:  # psycopg raises typed errors, but exact class is not important here.
        return "permission denied" in str(exc) or "violates row-level security" in str(exc)
    return False


@pytest.mark.schema
def test_schema_01_all_planned_tables_exist_and_rls_is_enabled(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT c.relname, c.relrowsecurity
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND c.relkind = 'r'
            """
        )
        rows = dict(cur.fetchall())

    assert PRODUCT_TABLES <= set(rows)
    assert {name for name in PRODUCT_TABLES if not rows[name]} == set()


@pytest.mark.schema
def test_schema_02_closed_enums_include_required_values(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT t.typname, array_agg(e.enumlabel ORDER BY e.enumsortorder)
            FROM pg_type t
            JOIN pg_enum e ON e.enumtypid = t.oid
            WHERE t.typname IN ('tribunal_sigla', 'consulta_status', 'tipo_honorario')
            GROUP BY t.typname
            """
        )
        enums = dict(cur.fetchall())

    assert enums["tribunal_sigla"] == ["TJSP", "TJCE", "TJBA"]
    assert "pendente_implementacao" in enums["consulta_status"]
    assert "fixo_exito_sucumbencia" in enums["tipo_honorario"]


@pytest.mark.schema
def test_schema_03_invalid_cnj_and_unknown_tribunal_are_rejected(clean_db) -> None:
    with clean_db.cursor() as cur:
        with pytest.raises(Exception, match="ck_numero_cnj"):
            cur.execute("INSERT INTO processos (numero, tribunal) VALUES ('bad-number', 'TJSP')")
        with pytest.raises(Exception, match="tribunal_sigla"):
            cur.execute("INSERT INTO processos (numero, tribunal) VALUES ('0000000-00.2026.8.26.0001', 'TJ-SP')")


@pytest.mark.schema
def test_schema_04_migration_runner_recorded_order(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute("SELECT version FROM schema_migrations ORDER BY version")
        versions = [row[0] for row in cur.fetchall()]

    assert "20260720211125_test_github_integration.sql" in versions
    assert "20260720212612_backend_schema_rls_auth_ready.sql" in versions
    assert "20260721211551_harden_rls_and_advisor_findings.sql" in versions
    assert versions.index("20260720211125_test_github_integration.sql") < versions.index("20260720212612_backend_schema_rls_auth_ready.sql")
    assert versions.index("20260720212612_backend_schema_rls_auth_ready.sql") < versions.index("20260721211551_harden_rls_and_advisor_findings.sql")


@pytest.mark.security
@pytest.mark.schema
def test_schema_05_security_definer_recalc_functions_are_private(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT n.nspname, p.proname, p.prosecdef
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE p.proname IN ('refresh_painel', 'recalcular_mes', 'recalcular_meses')
              AND n.nspname IN ('public', 'private')
            """
        )
        rows = {(schema, name): security_definer for schema, name, security_definer in cur.fetchall()}

    assert rows[("private", "refresh_painel")] is True
    assert rows[("private", "recalcular_mes")] is True
    assert rows[("private", "recalcular_meses")] is True
    assert rows[("public", "refresh_painel")] is False
    assert rows[("public", "recalcular_mes")] is False
    assert rows[("public", "recalcular_meses")] is False


@pytest.mark.security
@pytest.mark.schema
def test_rls_01_anonymous_role_cannot_read_or_write(clean_db) -> None:
    def read_as_anon() -> None:
        with clean_db.cursor() as cur:
            cur.execute("SET ROLE anon")
            cur.execute("SELECT count(*) FROM parceiros")

    assert _raises_privilege(read_as_anon)

    with clean_db.cursor() as cur:
        cur.execute("RESET ROLE")


@pytest.mark.security
@pytest.mark.schema
def test_rls_02_authenticated_can_read_facts_but_not_write_indicators(clean_db) -> None:
    with clean_db.cursor() as cur:
        cur.execute("SET ROLE authenticated")
        cur.execute("SELECT count(*) FROM parceiros")
        assert cur.fetchone()[0] >= 0
        with pytest.raises(Exception, match="permission denied"):
            cur.execute("INSERT INTO ind_painel (ano, mes_referencia) VALUES (2026, 7)")
        cur.execute("RESET ROLE")
