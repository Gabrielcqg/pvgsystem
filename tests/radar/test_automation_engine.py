from __future__ import annotations

import uuid
from datetime import date, timedelta

import pytest
from psycopg.rows import dict_row

from app.domain.db_service import PostgresService
from app.domain.errors import ConflictError
from app.radar.automation import classificar_movimentacao, processar_movimentacao_automacao
from app.radar.persistence import criar_tarefa_inercia_se_aplicavel


TEST_USER_ID = "00000000-0000-4000-8000-000000000001"


def _rule(
    slug: str,
    *,
    operator: str = "contains",
    value: str = "contestacao",
    field: str = "descricao",
    active: bool = True,
    score: int = 2,
    tribunal: str | None = None,
    area: str | None = None,
    fase: str | None = None,
    approval: bool = True,
    create_task: bool = True,
) -> dict:
    return {
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, slug)),
        "slug": slug,
        "nome": slug,
        "tipo_id": str(uuid.uuid5(uuid.NAMESPACE_DNS, f"tipo:{slug}")),
        "tipo_slug": slug,
        "ativa": active,
        "tribunal": tribunal,
        "area_juridica": area,
        "fase_processual": fase,
        "requer_aprovacao": approval,
        "cria_tarefa": create_task,
        "versao": 1,
        "prioridade": "alta",
        "padroes": [
            {
                "campo": field,
                "operador": operator,
                "valor": value,
                "peso": score,
                "obrigatorio": True,
                "ativo": True,
            }
        ],
    }


def _insert_auth_user(conn) -> None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO auth.users (id, email)
            VALUES (%s, 'gacamargo2003@gmail.com')
            ON CONFLICT (id) DO UPDATE SET email = excluded.email
            """,
            (TEST_USER_ID,),
        )


def _insert_process(conn, *, older_than_days: int | None = None) -> dict:
    data_ultimo = date.today() - timedelta(days=older_than_days) if older_than_days is not None else None
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO processos (
              numero, tribunal, cliente, area_pasta, assunto, fase_atual,
              ativo, monitorar, data_ultimo_andamento
            )
            VALUES (
              %s, 'TJSP', 'E2E_TEST_Automacao', 'Civel', 'Revisional',
              'Contestacao', true, true, %s
            )
            RETURNING *
            """,
            (f"{uuid.uuid4().int % 10000000:07d}-00.2026.8.26.0001", data_ultimo),
        )
        return dict(cur.fetchone())


def _insert_execution_and_movement(conn, processo_id: str, descricao: str, *, evento: str | None = None, usuario: str | None = None) -> dict:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO execucoes_radar (origem, status, total_previstos, total_consultados)
            VALUES ('agendada', 'em_andamento', 1, 1)
            RETURNING id
            """
        )
        execucao_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO resultados_consulta (
              execucao_id, processo_id, numero_processo, tribunal, status,
              quantidade_movimentacoes, movimentacoes, tem_movimentacao_nova
            )
            SELECT %s, p.id, p.numero, p.tribunal, 'sucesso', 1, '[]'::jsonb, true
            FROM processos p
            WHERE p.id = %s
            RETURNING id
            """,
            (execucao_id, processo_id),
        )
        resultado_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (
              execucao_id, processo_id, resultado_id, chave, data_hora,
              descricao, evento, usuario
            )
            VALUES (%s, %s, %s, %s, '26/07/2026 10:00:00', %s, %s, %s)
            RETURNING *
            """,
            (execucao_id, processo_id, resultado_id, f"E2E_TEST_{uuid.uuid4()}", descricao, evento, usuario),
        )
        return dict(cur.fetchone())


def _insert_auto_rule(conn, *, approval: bool, active: bool = True, create_task: bool = True, slug: str = "e2e_automacao_teste") -> str:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO radar_movimentacao_tipos (slug, nome)
            VALUES (%s, %s)
            ON CONFLICT (slug) DO UPDATE SET nome = excluded.nome, ativo = true
            RETURNING id
            """,
            (slug, slug),
        )
        tipo_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO radar_automacao_regras (
              slug, nome, tipo_id, titulo_template, descricao_template, prioridade,
              requer_aprovacao, cria_tarefa, ativa, versao
            )
            VALUES (%s, %s, %s, 'E2E_TEST tarefa {{numero_processo}}', 'E2E_TEST descricao {{descricao}}', 'alta', %s, %s, %s, 1)
            ON CONFLICT (slug, versao) DO UPDATE SET
              tipo_id = excluded.tipo_id,
              requer_aprovacao = excluded.requer_aprovacao,
              cria_tarefa = excluded.cria_tarefa,
              ativa = excluded.ativa
            RETURNING id
            """,
            (slug, slug, tipo_id, approval, create_task, active),
        )
        regra_id = cur.fetchone()[0]
        cur.execute("DELETE FROM radar_automacao_padroes WHERE regra_id = %s", (regra_id,))
        cur.execute(
            """
            INSERT INTO radar_automacao_padroes (regra_id, campo, operador, valor, peso, obrigatorio)
            VALUES (%s, 'descricao', 'contains', %s, 5, true)
            """,
            (regra_id, slug),
        )
        return str(regra_id)


def _link_next_rule(conn, current_rule_id: str, next_rule_id: str | None) -> None:
    with conn.cursor() as cur:
        cur.execute(
            "UPDATE radar_automacao_regras SET proxima_regra_id = %s WHERE id = %s",
            (next_rule_id, current_rule_id),
        )


def _set_chaining(conn, enabled: bool) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO configuracoes (chave, valor, descricao)
            VALUES ('radar_encadeamento_tarefas_ativo', %s, 'E2E_TEST encadeamento')
            ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor
            """,
            ("true" if enabled else "false",),
        )


def test_classifier_supports_contains_all_terms_any_terms_and_regex() -> None:
    movimento = {
        "id": str(uuid.uuid4()),
        "processo_id": str(uuid.uuid4()),
        "descricao": "Juntada de contestação com publicação de intimação",
        "evento": "Publicação",
        "usuario": "Cartório",
    }
    processo = {"tribunal": "TJSP", "area_pasta": "Civel", "fase_atual": "Contestacao"}

    for operator, value in [
        ("contains", "contestacao"),
        ("all_terms", "juntada contestacao"),
        ("any_terms", "sentenca contestacao"),
        ("regex", r"contestac[a-z]+"),
    ]:
        result = classificar_movimentacao(movimento, processo, [_rule(f"rule_{operator}", operator=operator, value=value)])
        assert result.status == "reconhecida"
        assert result.rule is not None


def test_classifier_handles_unrecognized_inactive_ambiguous_and_context_filters() -> None:
    movimento = {"id": str(uuid.uuid4()), "processo_id": str(uuid.uuid4()), "descricao": "Contestação juntada"}
    processo = {"tribunal": "TJSP", "area_pasta": "Civel", "fase_atual": "Contestacao"}

    assert classificar_movimentacao(movimento, processo, [_rule("inactive", active=False)]).status == "nao_reconhecida"
    assert classificar_movimentacao(movimento, processo, [_rule("other", value="sentenca")]).status == "nao_reconhecida"
    assert classificar_movimentacao(movimento, processo, [_rule("a"), _rule("b")]).status == "ambigua"
    assert classificar_movimentacao(movimento, processo, [_rule("wrong_court", tribunal="TJCE")]).status == "nao_reconhecida"
    assert classificar_movimentacao(movimento, processo, [_rule("right_area", area="civel", fase="contestacao")]).status == "reconhecida"


@pytest.mark.radar
def test_worker_classification_creates_approval_suggestion_and_deduplicates(clean_db) -> None:
    _insert_auth_user(clean_db)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Juntada de contestação E2E_TEST")

    first = processar_movimentacao_automacao(clean_db, movimento, processo)
    second = processar_movimentacao_automacao(clean_db, movimento, processo)

    assert first["classificacao"]["status"] == "reconhecida"
    assert first["execucao"]["status"] == "aguardando_aprovacao"
    assert second["execucao"]["id"] == first["execucao"]["id"]
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM radar_automacao_execucoes WHERE movimentacao_id = %s", (movimento["id"],))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM tarefas WHERE movimentacao_id = %s", (movimento["id"],))
        assert cur.fetchone()[0] == 0


@pytest.mark.radar
def test_approval_with_edit_creates_linked_task_and_rejects_second_decision(clean_db) -> None:
    _insert_auth_user(clean_db)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Sentença publicada E2E_TEST")
    result = processar_movimentacao_automacao(clean_db, movimento, processo)
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    approved = service.aprovar_automacao_radar(
        str(result["execucao"]["id"]),
        {"titulo": "E2E_TEST título editado", "descricao": "E2E_TEST descrição editada", "prioridade": "urgente"},
    )

    tarefa = approved["tarefa"]
    assert approved["execucao"]["status"] == "tarefa_criada"
    assert tarefa["titulo"] == "E2E_TEST título editado"
    assert tarefa["processo_id"] == processo["id"]
    assert tarefa["movimentacao_id"] == movimento["id"]
    assert tarefa["radar_automacao_execucao_id"] == result["execucao"]["id"]
    assert tarefa["criada_automaticamente"] is True
    assert tarefa["status"] in {"backlog", "a_fazer"}
    with pytest.raises(ConflictError):
        service.aprovar_automacao_radar(str(result["execucao"]["id"]), {"titulo": "duplicada"})


@pytest.mark.radar
def test_ignore_with_reason_does_not_create_task_and_rejects_second_decision(clean_db) -> None:
    _insert_auth_user(clean_db)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Intimação enviada E2E_TEST")
    result = processar_movimentacao_automacao(clean_db, movimento, processo)
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    ignored = service.ignorar_automacao_radar(str(result["execucao"]["id"]), "E2E_TEST sem providência nesta etapa")

    assert ignored["status"] == "ignorada"
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefas WHERE movimentacao_id = %s", (movimento["id"],))
        assert cur.fetchone()[0] == 0
    with pytest.raises(ConflictError):
        service.ignorar_automacao_radar(str(result["execucao"]["id"]), "duplicada")


@pytest.mark.radar
def test_active_rule_without_approval_creates_automatic_task_with_valid_links(clean_db) -> None:
    _insert_auto_rule(clean_db, approval=False, slug="e2e_auto_sem_aprovacao")
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento e2e_auto_sem_aprovacao")

    result = processar_movimentacao_automacao(clean_db, movimento, processo)

    assert result["execucao"]["status"] == "tarefa_criada"
    assert result["tarefa"]["radar_automacao_execucao_id"] == result["execucao"]["id"]
    with clean_db.cursor() as cur:
        cur.execute(
            """
            SELECT count(*)
            FROM tarefas
            WHERE origem = 'radar_movimentacao'
              AND criada_automaticamente IS TRUE
              AND processo_id = %s
              AND movimentacao_id = %s
            """,
            (processo["id"], movimento["id"]),
        )
        assert cur.fetchone()[0] == 1


@pytest.mark.radar
def test_no_rule_ambiguous_and_classify_only_do_not_create_tasks(clean_db) -> None:
    _insert_auto_rule(clean_db, approval=True, create_task=False, slug="e2e_classificar_sem_tarefa")
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento sem correspondencia")
    result = processar_movimentacao_automacao(clean_db, movimento, processo)
    assert result["classificacao"]["status"] == "nao_reconhecida"
    assert result["execucao"] is None

    classify_only = _insert_execution_and_movement(clean_db, processo["id"], "e2e_classificar_sem_tarefa")
    result = processar_movimentacao_automacao(clean_db, classify_only, processo)
    assert result["classificacao"]["status"] == "reconhecida"
    assert result["execucao"]["status"] == "sem_tarefa"
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefas WHERE processo_id = %s", (processo["id"],))
        assert cur.fetchone()[0] == 0


@pytest.mark.radar
def test_inertia_and_movement_automation_can_coexist_without_shared_dedup(clean_db) -> None:
    _insert_auth_user(clean_db)
    processo = _insert_process(clean_db, older_than_days=31)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Juntada de contestação E2E_TEST")

    inercia = criar_tarefa_inercia_se_aplicavel(
        clean_db,
        processo=type("P", (), {"data_ultimo_andamento": processo["data_ultimo_andamento"], "ultima_consulta_inconclusiva": False})(),
        processo_row=processo,
        dias_limite=30,
    )
    automacao = processar_movimentacao_automacao(clean_db, movimento, processo)

    assert inercia is not None
    assert inercia["origem"] == "radar_inercia"
    assert automacao["execucao"]["status"] == "aguardando_aprovacao"
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefas WHERE origem = 'radar_inercia' AND processo_id = %s", (processo["id"],))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM radar_automacao_execucoes WHERE processo_id = %s", (processo["id"],))
        assert cur.fetchone()[0] == 1


@pytest.mark.radar
def test_legacy_radar_task_without_movement_or_process_still_allowed(clean_db) -> None:
    with clean_db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tarefas (titulo, origem, status, prioridade)
            VALUES ('E2E_TEST legado sem vinculo', 'radar_movimentacao', 'a_fazer', 'normal')
            RETURNING id
            """
        )
        tarefa_id = cur.fetchone()[0]
        cur.execute("SELECT processo_id, movimentacao_id, criada_automaticamente FROM tarefas WHERE id = %s", (tarefa_id,))
        assert cur.fetchone() == (None, None, False)


@pytest.mark.radar
def test_task_completion_chaining_respects_feature_flag(clean_db) -> None:
    _set_chaining(clean_db, False)
    next_rule_id = _insert_auto_rule(clean_db, approval=True, slug="e2e_next_flag_off")
    current_rule_id = _insert_auto_rule(clean_db, approval=False, slug="e2e_current_flag_off")
    _link_next_rule(clean_db, current_rule_id, next_rule_id)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento e2e_current_flag_off")
    created = processar_movimentacao_automacao(clean_db, movimento, processo)
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    completed = service.alterar_status_tarefa(str(created["tarefa"]["id"]), "concluida")

    assert completed["status"] == "concluida"
    assert "radar_proxima_automacao" not in completed
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM radar_automacao_execucoes WHERE tarefa_anterior_id = %s", (created["tarefa"]["id"],))
        assert cur.fetchone()[0] == 0


@pytest.mark.radar
def test_task_completion_chaining_creates_approval_suggestion_and_deduplicates(clean_db) -> None:
    _insert_auth_user(clean_db)
    _set_chaining(clean_db, True)
    next_rule_id = _insert_auto_rule(clean_db, approval=True, slug="e2e_next_approval")
    current_rule_id = _insert_auto_rule(clean_db, approval=False, slug="e2e_current_approval")
    _link_next_rule(clean_db, current_rule_id, next_rule_id)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento e2e_current_approval")
    created = processar_movimentacao_automacao(clean_db, movimento, processo)
    task_id = str(created["tarefa"]["id"])
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    completed = service.alterar_status_tarefa(task_id, "concluida")
    service.alterar_status_tarefa(task_id, "a_fazer", force=True)
    completed_again = service.alterar_status_tarefa(task_id, "concluida")

    execucao = completed["radar_proxima_automacao"]["execucao"]
    assert execucao["status"] == "aguardando_aprovacao"
    assert execucao["gatilho"] == "tarefa_concluida"
    assert execucao["tarefa_anterior_id"] == created["tarefa"]["id"]
    assert completed_again["radar_proxima_automacao"]["execucao"]["id"] == execucao["id"]
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM radar_automacao_execucoes WHERE tarefa_anterior_id = %s", (created["tarefa"]["id"],))
        assert cur.fetchone()[0] == 1

    approved = service.aprovar_automacao_radar(str(execucao["id"]), {"titulo": "E2E_TEST proxima aprovada"})
    assert approved["tarefa"]["titulo"] == "E2E_TEST proxima aprovada"
    assert approved["tarefa"]["tarefa_origem_id"] == created["tarefa"]["id"]
    assert approved["tarefa"]["movimentacao_id"] == movimento["id"]


@pytest.mark.radar
def test_task_completion_chaining_can_create_automatic_next_task_when_rule_allows(clean_db) -> None:
    _set_chaining(clean_db, True)
    next_rule_id = _insert_auto_rule(clean_db, approval=False, slug="e2e_next_auto_task")
    current_rule_id = _insert_auto_rule(clean_db, approval=False, slug="e2e_current_auto_task")
    _link_next_rule(clean_db, current_rule_id, next_rule_id)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento e2e_current_auto_task")
    created = processar_movimentacao_automacao(clean_db, movimento, processo)
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    completed = service.alterar_status_tarefa(str(created["tarefa"]["id"]), "concluida")

    proxima = completed["radar_proxima_automacao"]
    assert proxima["execucao"]["status"] == "tarefa_criada"
    assert proxima["tarefa"]["tarefa_origem_id"] == created["tarefa"]["id"]
    assert proxima["tarefa"]["processo_id"] == processo["id"]
    assert proxima["tarefa"]["movimentacao_id"] == movimento["id"]
    assert proxima["tarefa"]["status"] in {"backlog", "a_fazer"}


@pytest.mark.radar
def test_task_completion_chaining_ignores_inactive_next_rule(clean_db) -> None:
    _set_chaining(clean_db, True)
    next_rule_id = _insert_auto_rule(clean_db, approval=True, active=False, slug="e2e_next_inactive")
    current_rule_id = _insert_auto_rule(clean_db, approval=False, slug="e2e_current_inactive_next")
    _link_next_rule(clean_db, current_rule_id, next_rule_id)
    processo = _insert_process(clean_db)
    movimento = _insert_execution_and_movement(clean_db, processo["id"], "Movimento e2e_current_inactive_next")
    created = processar_movimentacao_automacao(clean_db, movimento, processo)
    service = PostgresService(clean_db, usuario_id=TEST_USER_ID)

    completed = service.alterar_status_tarefa(str(created["tarefa"]["id"]), "concluida")

    assert "radar_proxima_automacao" not in completed
