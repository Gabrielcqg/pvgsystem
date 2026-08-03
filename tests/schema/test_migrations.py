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
    "tarefa_statuses",
    "tarefa_colaboradores",
    "tarefa_subtarefas",
    "tarefa_checklist_itens",
    "tarefa_comentarios",
    "tarefa_dependencias",
    "tarefa_tags",
    "tarefa_tag_relacoes",
    "tarefa_historico",
    "tarefa_status_tempos",
    "tarefa_movimentacoes",
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
        with pytest.raises(Exception, match="ck_numero_(cnj|processo_formato)"):
            cur.execute("INSERT INTO processos (numero, tribunal) VALUES ('bad-number', 'TJSP')")
        with pytest.raises(Exception, match="tribunal_sigla"):
            cur.execute("INSERT INTO processos (numero, tribunal) VALUES ('0000000-00.2026.8.26.0001', 'TJ-SP')")


@pytest.mark.schema
def test_schema_04_migration_runner_recorded_order(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.schema_migrations'), to_regclass('supabase_migrations.schema_migrations')")
        public_table, supabase_table = cur.fetchone()
        if public_table:
            cur.execute("SELECT version FROM public.schema_migrations ORDER BY version")
        elif supabase_table:
            cur.execute(
                """
                SELECT version || '_' || name || '.sql'
                FROM supabase_migrations.schema_migrations
                ORDER BY version
                """
            )
        else:
            pytest.fail("schema migration history table was not found")
        versions = [row[0] for row in cur.fetchall()]

    assert "20260720211125_test_github_integration.sql" in versions
    assert "20260720212612_backend_schema_rls_auth_ready.sql" in versions
    assert "20260721211551_harden_rls_and_advisor_findings.sql" in versions
    assert "20260723231902_tarefas_robustas.sql" in versions
    assert "20260723234036_tarefas_radar_movimentacao_flag.sql" in versions
    assert "20260723235218_tarefas_active_index.sql" in versions
    assert "20260725103000_radar_external_worker_password_vault.sql" in versions
    assert "20260725111500_fix_radar_password_vault_pgcrypto.sql" in versions
    assert "20260725193956_processos_excel_fields.sql" in versions
    assert "20260726131048_harden_financial_origin_integrity.sql" in versions
    assert "20260726190000_radar_inercia_tasks.sql" in versions
    assert "20260802182219_radar_movimentacoes_pendentes.sql" in versions
    assert versions.index("20260720211125_test_github_integration.sql") < versions.index("20260720212612_backend_schema_rls_auth_ready.sql")
    assert versions.index("20260720212612_backend_schema_rls_auth_ready.sql") < versions.index("20260721211551_harden_rls_and_advisor_findings.sql")
    assert versions.index("20260721211551_harden_rls_and_advisor_findings.sql") < versions.index("20260723231902_tarefas_robustas.sql")
    assert versions.index("20260723231902_tarefas_robustas.sql") < versions.index("20260723234036_tarefas_radar_movimentacao_flag.sql")
    assert versions.index("20260723234036_tarefas_radar_movimentacao_flag.sql") < versions.index("20260723235218_tarefas_active_index.sql")
    assert versions.index("20260723235218_tarefas_active_index.sql") < versions.index("20260725103000_radar_external_worker_password_vault.sql")
    assert versions.index("20260725103000_radar_external_worker_password_vault.sql") < versions.index("20260725111500_fix_radar_password_vault_pgcrypto.sql")
    assert versions.index("20260725111500_fix_radar_password_vault_pgcrypto.sql") < versions.index("20260725193956_processos_excel_fields.sql")
    assert versions.index("20260725193956_processos_excel_fields.sql") < versions.index("20260726131048_harden_financial_origin_integrity.sql")
    assert versions.index("20260726131048_harden_financial_origin_integrity.sql") < versions.index("20260726190000_radar_inercia_tasks.sql")
    assert versions.index("20260726190000_radar_inercia_tasks.sql") < versions.index("20260802182219_radar_movimentacoes_pendentes.sql")


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


@pytest.mark.schema
def test_schema_06_tasks_have_extensible_statuses_indexes_and_rls(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute("SELECT slug FROM tarefa_statuses ORDER BY ordem")
        assert [row[0] for row in cur.fetchall()] == [
            "backlog",
            "a_fazer",
            "em_andamento",
            "aguardando",
            "bloqueada",
            "em_revisao",
            "concluida",
        ]
        cur.execute(
            """
            SELECT data_type, udt_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'tarefas' AND column_name = 'status'
            """
        )
        data_type, udt_name = cur.fetchone()
        assert (data_type, udt_name) == ("text", "text")
        cur.execute(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname IN (
                'ix_tarefas_status_prazo',
                'ix_tarefas_responsavel_id',
                'ix_tarefas_processo',
                'ix_tarefas_contrato',
                'ix_tarefas_ativas',
                'ux_tarefa_movimentacao_legada',
                'ux_tarefa_inercia_condicao'
              )
            """
        )
        assert {row[0] for row in cur.fetchall()} == {
            "ix_tarefas_status_prazo",
            "ix_tarefas_responsavel_id",
            "ix_tarefas_processo",
            "ix_tarefas_contrato",
            "ix_tarefas_ativas",
            "ux_tarefa_movimentacao_legada",
            "ux_tarefa_inercia_condicao",
        }
        cur.execute(
            """
            SELECT indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname = 'ux_tarefa_movimentacao_legada'
            """
        )
        assert "radar_automacao_execucao_id IS NULL" in cur.fetchone()[0]
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tarefas'
              AND column_name = 'radar_inercia_chave'
            """
        )
        assert cur.fetchone() is not None
        cur.execute(
            """
            SELECT tablename, count(*)
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN (
                'tarefas',
                'tarefa_subtarefas',
                'tarefa_checklist_itens',
                'tarefa_comentarios',
                'tarefa_dependencias',
                'tarefa_historico'
              )
            GROUP BY tablename
            """
        )
        policies = dict(cur.fetchall())
    assert all(policies.get(table, 0) > 0 for table in ["tarefas", "tarefa_subtarefas", "tarefa_checklist_itens", "tarefa_comentarios", "tarefa_dependencias", "tarefa_historico"])


@pytest.mark.security
@pytest.mark.schema
def test_schema_07_external_radar_has_progress_and_private_password_vault(db_conn) -> None:
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'execucoes_radar'
              AND column_name = 'total_previstos'
            """
        )
        assert cur.fetchone() is not None
        cur.execute("SELECT to_regclass('private.processo_senhas')")
        assert cur.fetchone()[0] == "private.processo_senhas"
        cur.execute(
            """
            SELECT proname, prosecdef
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'private'
              AND p.proname IN ('salvar_senha_processo', 'ler_senha_processo')
            """
        )
        funcs = dict(cur.fetchall())
        assert funcs == {"salvar_senha_processo": True, "ler_senha_processo": True}
        cur.execute(
            """
            SELECT privilege_type
            FROM information_schema.role_table_grants
            WHERE table_schema = 'private'
              AND table_name = 'processo_senhas'
              AND grantee IN ('anon', 'authenticated', 'radar_worker')
            """
        )
        assert cur.fetchall() == []


@pytest.mark.schema
def test_schema_08_processos_include_excel_source_fields_and_indexes(db_conn) -> None:
    expected = {
        "area_pasta",
        "numero_interno",
        "status_processo",
        "autor",
        "reu",
        "assunto",
        "andamento_atual",
    }
    with db_conn.cursor() as cur:
        cur.execute(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'processos'
              AND column_name = any(%s)
            """,
            (list(expected),),
        )
        assert {row[0] for row in cur.fetchall()} == expected
        cur.execute(
            """
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename = 'processos'
              AND indexname IN (
                'ix_processos_area_pasta',
                'ix_processos_status_processo',
                'ix_processos_numero_interno'
              )
            """
        )
        assert {row[0] for row in cur.fetchall()} == {
            "ix_processos_area_pasta",
            "ix_processos_status_processo",
            "ix_processos_numero_interno",
        }


@pytest.mark.schema
def test_schema_09_lancamento_origin_integrity_is_enforced(clean_db) -> None:
    with clean_db.cursor() as cur:
        with pytest.raises(Exception, match="parcela inexistente|violates foreign key"):
            cur.execute(
                """
                INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago, origem, origem_id)
                VALUES ('2026-07-01', 'Origem invalida', 'entrada', 100, 'honorarios', true, 'parcela', '00000000-0000-4000-8000-000000000099')
                """
            )

        cur.execute("SELECT id FROM parceiros WHERE nome = 'Pavageau'")
        parceiro_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO contratos (cliente, parceiro_id, status, tipo_honorario)
            VALUES ('Cliente origem valida', %s, 'ativo', 'fixo_mensal')
            RETURNING id
            """,
            (parceiro_id,),
        )
        contrato_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO parcelas (contrato_id, tipo, valor, mes_esperado)
            VALUES (%s, 'mensal', 100, '2026-07-01')
            RETURNING id
            """,
            (contrato_id,),
        )
        parcela_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago, origem, origem_id)
            VALUES ('2026-07-15', 'Parcela valida', 'entrada', 100, 'honorarios', true, 'parcela', %s)
            RETURNING contrato_id
            """,
            (str(parcela_id),),
        )
        assert cur.fetchone()[0] == contrato_id

        with pytest.raises(Exception, match="estorne a parcela antes de excluir|violates foreign key"):
            cur.execute("DELETE FROM parcelas WHERE id = %s", (parcela_id,))


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
