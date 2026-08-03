from __future__ import annotations

import os
from datetime import date, timedelta

import pytest

from app.radar.scrapers.base import Movimentacao, ProcessoConsulta, ResultadoConsulta
from radar_worker.runner import rodar_worker


class StaticScraper:
    tribunal = "TJSP"

    def __init__(self, movimentos: list[Movimentacao]) -> None:
        self.movimentos = movimentos

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        return ResultadoConsulta(
            numero_processo=processo.numero_processo,
            tribunal=processo.tribunal,
            status="sucesso",
            movimentacoes=list(self.movimentos),
            quantidade_movimentacoes=len(self.movimentos),
            layout_movimentacoes="eproc_eventos",
        )


class StatusScraper:
    tribunal = "TJSP"

    def __init__(self, status: str) -> None:
        self.status = status

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        return ResultadoConsulta(
            numero_processo=processo.numero_processo,
            tribunal=processo.tribunal,
            status=self.status,  # type: ignore[arg-type]
            movimentacoes=[],
            quantidade_movimentacoes=0,
            mensagem_erro="E2E_TEST consulta inconclusiva",
        )


def _insert_processo(
    conn,
    numero: str = "0000001-00.2026.8.26.0001",
    *,
    data_ultimo_andamento: date | None = None,
) -> str:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO processos (numero, tribunal, cliente, ativo, monitorar, data_ultimo_andamento)
            VALUES (%s, 'TJSP', 'E2E_TEST_Radar Worker', true, true, %s)
            RETURNING id
            """,
            (numero, data_ultimo_andamento),
        )
        return str(cur.fetchone()[0])


def _movimento_em(dias_atras: int) -> Movimentacao:
    quando = date.today() - timedelta(days=dias_atras)
    return Movimentacao(quando.strftime("%d/%m/%Y"), f"E2E_TEST movimento de {dias_atras} dias")


def _inercia_chave(processo_id: str, data_ultimo_andamento: date, dias_limite: int = 30) -> str:
    return f"radar_inercia:{processo_id}:{data_ultimo_andamento.isoformat()}:{dias_limite}"


def _count_inercia_tasks(conn, processo_id: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefas WHERE origem = 'radar_inercia' AND processo_id = %s", (processo_id,))
        return int(cur.fetchone()[0])


@pytest.mark.radar
def test_external_worker_creates_baseline_then_only_persists_new_alerts(clean_db, monkeypatch: pytest.MonkeyPatch) -> None:
    processo_id = _insert_processo(clean_db)
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")

    old = Movimentacao("14/07/2026 15:14:45", "PETICAO - Refer. aos Eventos: 32 e 33")
    new = Movimentacao("15/07/2026 09:00:00", "DECISAO - Intimacao publicada")

    first = rodar_worker(scrapers={"TJSP": StaticScraper([old])}, enviar_email=False)
    assert first["total_previstos"] == 1
    assert first["total_base_inicial_criada"] == 1
    assert first["total_com_movimentacao_nova"] == 0
    with clean_db.cursor() as cur:
        cur.execute("SELECT ultima_consulta_status, cardinality(chaves_movimentacoes) FROM processos WHERE id = %s", (processo_id,))
        assert cur.fetchone() == ("base_inicial_criada", 1)
        cur.execute("SELECT count(*) FROM movimentacoes_novas WHERE processo_id = %s", (processo_id,))
        assert cur.fetchone()[0] == 0

    second = rodar_worker(scrapers={"TJSP": StaticScraper([old])}, enviar_email=False)
    assert second["total_sucesso"] == 1
    assert second["total_sem_movimentacao"] == 1
    assert second["total_com_movimentacao_nova"] == 0
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM movimentacoes_novas WHERE processo_id = %s", (processo_id,))
        assert cur.fetchone()[0] == 0

    third = rodar_worker(scrapers={"TJSP": StaticScraper([new, old])}, enviar_email=False)
    assert third["total_sucesso"] == 1
    assert third["total_com_movimentacao_nova"] == 1
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*), min(descricao), max(descricao) FROM movimentacoes_novas WHERE processo_id = %s", (processo_id,))
        count, min_desc, max_desc = cur.fetchone()
        assert count == 1
        assert "DECISAO" in (min_desc or max_desc)
        cur.execute("SELECT ultima_consulta_status, cardinality(chaves_movimentacoes) FROM processos WHERE id = %s", (processo_id,))
        assert cur.fetchone() == ("sucesso", 2)


@pytest.mark.radar
@pytest.mark.parametrize("dias_atras", [29, 30])
def test_external_worker_does_not_create_inertia_task_before_threshold(clean_db, monkeypatch: pytest.MonkeyPatch, dias_atras: int) -> None:
    processo_id = _insert_processo(clean_db, f"{dias_atras:07d}-00.2026.8.26.0001")
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")

    row = rodar_worker(scrapers={"TJSP": StaticScraper([_movimento_em(dias_atras)])}, enviar_email=False)

    assert row["total_base_inicial_criada"] == 1
    assert _count_inercia_tasks(clean_db, processo_id) == 0


@pytest.mark.radar
def test_external_worker_creates_backlog_inertia_task_after_threshold(clean_db, monkeypatch: pytest.MonkeyPatch) -> None:
    processo_id = _insert_processo(clean_db, "0000031-00.2026.8.26.0001")
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")

    row = rodar_worker(scrapers={"TJSP": StaticScraper([_movimento_em(31)])}, enviar_email=False)

    assert row["total_base_inicial_criada"] == 1
    with clean_db.cursor() as cur:
        cur.execute(
            """
            SELECT status, origem, numero_processo, descricao, radar_inercia_chave
            FROM tarefas
            WHERE origem = 'radar_inercia'
              AND processo_id = %s
            """,
            (processo_id,),
        )
        tarefa = cur.fetchone()
    assert tarefa is not None
    assert tarefa[0] == "backlog"
    assert tarefa[1] == "radar_inercia"
    assert tarefa[2] == "0000031-00.2026.8.26.0001"
    assert "31 dias sem movimentação" in tarefa[3]
    assert tarefa[4].startswith(f"radar_inercia:{processo_id}:")


@pytest.mark.radar
def test_external_worker_does_not_create_inertia_task_without_last_movement_date(clean_db, monkeypatch: pytest.MonkeyPatch) -> None:
    processo_id = _insert_processo(clean_db, "0000002-00.2026.8.26.0001")
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")

    row = rodar_worker(scrapers={"TJSP": StaticScraper([Movimentacao(None, "E2E_TEST sem data")])}, enviar_email=False)

    assert row["total_base_inicial_criada"] == 1
    assert _count_inercia_tasks(clean_db, processo_id) == 0


@pytest.mark.radar
def test_external_worker_creates_inertia_task_even_when_latest_query_is_inconclusive(clean_db, monkeypatch: pytest.MonkeyPatch) -> None:
    last_movement = date.today() - timedelta(days=31)
    processo_id = _insert_processo(clean_db, "0000003-00.2026.8.26.0001", data_ultimo_andamento=last_movement)
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")

    row = rodar_worker(scrapers={"TJSP": StatusScraper("captcha_timeout")}, enviar_email=False)

    assert row["total_captcha_timeout"] == 1
    assert _count_inercia_tasks(clean_db, processo_id) == 1
    with clean_db.cursor() as cur:
        cur.execute("SELECT ultima_consulta_status, ultima_consulta_inconclusiva FROM processos WHERE id = %s", (processo_id,))
        assert cur.fetchone() == ("captcha_timeout", True)


@pytest.mark.radar
@pytest.mark.parametrize("status, archived", [("backlog", False), ("concluida", False), ("backlog", True)])
def test_external_worker_does_not_duplicate_existing_inertia_condition(
    clean_db,
    monkeypatch: pytest.MonkeyPatch,
    status: str,
    archived: bool,
) -> None:
    last_movement = date.today() - timedelta(days=31)
    processo_id = _insert_processo(clean_db, "0000004-00.2026.8.26.0001", data_ultimo_andamento=last_movement)
    chave = _inercia_chave(processo_id, last_movement)
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")
    with clean_db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO tarefas (
              titulo, origem, processo_id, numero_processo, status, completed_at,
              archived_at, radar_inercia_chave
            )
            VALUES (
              'E2E_TEST inercia existente', 'radar_inercia', %s, '0000004-00.2026.8.26.0001',
              %s, CASE WHEN %s = 'concluida' THEN now() ELSE NULL END,
              CASE WHEN %s THEN now() ELSE NULL END, %s
            )
            """,
            (processo_id, status, status, archived, chave),
        )

    first = rodar_worker(scrapers={"TJSP": StaticScraper([_movimento_em(31)])}, enviar_email=False)
    second = rodar_worker(scrapers={"TJSP": StaticScraper([_movimento_em(31)])}, enviar_email=False)

    assert first["total_previstos"] == 1
    assert second["total_previstos"] == 1
    assert _count_inercia_tasks(clean_db, processo_id) == 1
