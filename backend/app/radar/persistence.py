"""Persist one radar execution (execução + resultados + movimentações novas +
process state) inside a single radar_worker transaction.

Shared by the external browser worker and tests so every radar result is written
with the same database semantics.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Sequence

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.radar.automation import movement_normalized_text, processar_movimentacao_automacao
from app.radar.inercia import ProcessoInercia, chave_inercia, deve_criar_tarefa_inercia, dias_sem_movimentacao
from app.radar.orchestrator import ExecucaoRadarMemoria


def atualizar_rodadas_interrompidas(conn) -> int:
    """Mark stale in-progress runs before a new local worker round starts."""
    with conn.cursor() as cur:
        cur.execute(
            """
            UPDATE execucoes_radar
            SET status = 'interrompida',
                finalizada_em = coalesce(finalizada_em, now())
            WHERE status = 'em_andamento'
              AND finalizada_em IS NULL
              AND heartbeat_em < now() - interval '5 minutes'
            """
        )
        return int(cur.rowcount or 0)


def iniciar_execucao_radar(
    conn,
    *,
    origem: str,
    total_previstos: int,
    usuario_id: str | None = None,
) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO execucoes_radar (origem, usuario_id, status, total_previstos, heartbeat_em)
            VALUES (%s, %s, 'em_andamento', %s, now())
            RETURNING *
            """,
            (origem, usuario_id, total_previstos),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError("INSERT execucoes_radar sem RETURNING")
        return dict(row)


def _movimentacoes_payload(resultado) -> list[dict[str, Any]]:
    return [
        {
            "chave": movimento.chave,
            "data_hora": movimento.data_hora,
            "descricao": movimento.descricao,
            "evento": movimento.evento,
            "usuario": movimento.usuario,
        }
        for movimento in resultado.movimentacoes
    ]


def _processo_inconclusivo(status: str) -> bool:
    return status in {"timeout", "captcha_timeout", "erro", "senha_necessaria", "pagina_intermediaria"}


def _coerce_date(value: Any) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if hasattr(value, "date"):
        return value.date()
    if isinstance(value, str):
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            return None
    return None


def criar_tarefa_inercia_se_aplicavel(
    conn,
    *,
    processo,
    processo_row: dict[str, Any] | None,
    dias_limite: int,
    hoje: date | None = None,
) -> dict[str, Any] | None:
    if processo_row is None or not processo_row.get("ativo", True) or not processo_row.get("monitorar", True):
        return None

    data_ultimo_andamento = _coerce_date(getattr(processo, "data_ultimo_andamento", None) or processo_row.get("data_ultimo_andamento"))

    processo_inercia = ProcessoInercia(
        id=str(processo_row["id"]),
        numero=str(processo_row["numero"]),
        data_ultimo_andamento=data_ultimo_andamento,
        ultima_consulta_inconclusiva=bool(getattr(processo, "ultima_consulta_inconclusiva", processo_row.get("ultima_consulta_inconclusiva"))),
        tribunal=str(processo_row["tribunal"]),
    )
    hoje_ref = hoje or date.today()
    if not deve_criar_tarefa_inercia(processo_inercia, hoje_ref, dias_limite):
        return None

    total_dias = dias_sem_movimentacao(processo_inercia, hoje_ref)
    chave = chave_inercia(processo_inercia, dias_limite)
    ultimo_andamento = processo_inercia.data_ultimo_andamento
    if total_dias is None or chave is None or ultimo_andamento is None:
        return None

    titulo = f"Acompanhar processo parado - {processo_inercia.numero}"
    descricao = (
        f"Radar Processual identificou {total_dias} dias sem movimentação no processo {processo_inercia.numero}. "
        f"Último andamento conhecido: {ultimo_andamento.strftime('%d/%m/%Y')}. "
        "Ação sugerida: verificar o processo e avaliar contato com o Balcão Virtual."
    )

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO tarefas (
              titulo, descricao, contrato_id, origem, processo_id, numero_processo,
              status, prioridade, radar_inercia_chave
            )
            SELECT %s, %s, %s, 'radar_inercia', %s, %s, 'backlog', 'alta', %s
            WHERE NOT EXISTS (
              SELECT 1
              FROM tarefas
              WHERE origem = 'radar_inercia'
                AND radar_inercia_chave = %s
            )
            ON CONFLICT DO NOTHING
            RETURNING *
            """,
            (
                titulo,
                descricao,
                processo_row.get("contrato_id"),
                processo_row["id"],
                processo_row["numero"],
                chave,
                chave,
            ),
        )
        tarefa_row = cur.fetchone()
        if tarefa_row is None:
            cur.execute(
                """
                SELECT *
                FROM tarefas
                WHERE origem = 'radar_inercia'
                  AND radar_inercia_chave = %s
                LIMIT 1
                """,
                (chave,),
            )
            existing = cur.fetchone()
            return dict(existing) if existing else None

        tarefa = dict(tarefa_row)
        cur.execute(
            """
            INSERT INTO tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
            VALUES (%s, %s, %s)
            ON CONFLICT (tarefa_id, status) DO NOTHING
            """,
            (tarefa["id"], tarefa["status"], tarefa["status_changed_at"]),
        )
        cur.execute(
            """
            INSERT INTO tarefa_historico (tarefa_id, usuario_id, evento, valor_novo)
            VALUES (%s, NULL, 'tarefa_criada_por_radar_inercia', %s::jsonb)
            """,
            (
                tarefa["id"],
                Jsonb(
                    {
                        "origem": "radar_inercia",
                        "processo_id": str(processo_row["id"]),
                        "numero_processo": processo_row["numero"],
                        "dias_sem_movimentacao": total_dias,
                        "radar_inercia_chave": chave,
                    }
                ),
            ),
        )
        return tarefa


def persistir_resultado_radar(
    conn,
    *,
    execucao_id: str,
    resultado,
    processo,
    processo_row: dict[str, Any] | None,
    execucao: ExecucaoRadarMemoria,
) -> dict[str, Any]:
    processo_id = processo_row["id"] if processo_row else None
    movimentacoes_payload = _movimentacoes_payload(resultado)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO resultados_consulta (
              execucao_id, processo_id, numero_processo, tribunal, consultado_em, status,
              quantidade_movimentacoes, movimentacoes, layout_movimentacoes, tem_movimentacao_nova,
              data_movimentacao_recente, url_resultado, mensagem_erro, tipo_erro, etapa, duracao_segundos
            )
            VALUES (%s, %s, %s, %s, coalesce(%s, now()), %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                execucao_id,
                processo_id,
                resultado.numero_processo,
                resultado.tribunal,
                resultado.consultado_em,
                resultado.status,
                resultado.quantidade_movimentacoes,
                Jsonb(movimentacoes_payload),
                resultado.layout_movimentacoes,
                resultado.tem_movimentacao_nova,
                getattr(processo, "data_ultimo_andamento", None),
                resultado.url_resultado,
                resultado.mensagem_erro,
                resultado.tipo_erro,
                resultado.etapa,
                resultado.duracao_segundos,
            ),
        )
        resultado_row = cur.fetchone()
        if resultado_row is None:
            raise RuntimeError("INSERT resultados_consulta sem RETURNING")
        resultado_dict = dict(resultado_row)
        resultado_id = resultado_dict["id"]
        previous_keys = set((processo_row or {}).get("chaves_movimentacoes") or [])
        automacoes: list[dict[str, Any]] = []
        if processo_id and resultado.tem_movimentacao_nova:
            for movimento in resultado.movimentacoes:
                if not movimento.chave or movimento.chave in previous_keys:
                    continue
                cur.execute(
                    """
                    INSERT INTO movimentacoes_novas (
                      execucao_id, processo_id, resultado_id, chave, data_hora,
                      descricao, evento, usuario, texto_normalizado, status_analise
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendente')
                    ON CONFLICT (processo_id, chave) DO NOTHING
                    RETURNING *
                    """,
                    (
                        execucao_id,
                        processo_id,
                        resultado_id,
                        movimento.chave,
                        movimento.data_hora,
                        movimento.descricao,
                        movimento.evento,
                        movimento.usuario,
                        movement_normalized_text(
                            {"descricao": movimento.descricao, "evento": movimento.evento, "usuario": movimento.usuario}
                        ),
                    ),
                )
                inserted_movimento = cur.fetchone()
                if inserted_movimento is not None:
                    automacoes.append(
                        processar_movimentacao_automacao(conn, dict(inserted_movimento), processo_row)
                    )
        if processo_id and processo_row is not None:
            cur.execute(
                """
                UPDATE processos
                SET chaves_movimentacoes = %s,
                    data_ultimo_andamento = coalesce(%s, data_ultimo_andamento),
                    ultima_consulta_status = %s,
                    ultima_consulta_em = now(),
                    ultima_consulta_inconclusiva = %s,
                    exige_senha = CASE
                      WHEN %s = 'senha_necessaria' THEN true
                      WHEN %s IN ('sucesso', 'base_inicial_criada') THEN false
                      ELSE exige_senha
                    END
                WHERE id = %s
                """,
                (
                    list(processo.chaves_movimentacoes) or processo_row.get("chaves_movimentacoes") or [],
                    processo.data_ultimo_andamento,
                    resultado.status,
                    _processo_inconclusivo(resultado.status),
                    resultado.status,
                    resultado.status,
                    processo_id,
                ),
            )
        cur.execute(
            """
            UPDATE execucoes_radar
            SET heartbeat_em = now(),
                total_consultados = %s,
                total_sucesso = %s,
                total_com_movimentacao_nova = %s,
                total_sem_movimentacao = %s,
                total_senha_necessaria = %s,
                total_nao_localizado = %s,
                total_captcha_timeout = %s,
                total_timeout = %s,
                total_pendente_implementacao = %s,
                total_base_inicial_criada = %s,
                total_numero_invalido = %s,
                total_pagina_intermediaria = %s,
                total_erro = %s
            WHERE id = %s
            """,
            (
                execucao.total_consultados,
                execucao.total_sucesso,
                execucao.total_com_movimentacao_nova,
                execucao.total_sem_movimentacao,
                execucao.total_senha_necessaria,
                execucao.total_nao_localizado,
                execucao.total_captcha_timeout,
                execucao.total_timeout,
                execucao.total_pendente_implementacao,
                execucao.total_base_inicial_criada,
                execucao.total_numero_invalido,
                execucao.total_pagina_intermediaria,
                execucao.total_erro,
                execucao_id,
            ),
        )
        resultado_dict["automacoes"] = automacoes
        return resultado_dict


def finalizar_execucao_radar(conn, *, execucao_id: str, status: str) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            UPDATE execucoes_radar
            SET status = %s,
                finalizada_em = now(),
                heartbeat_em = now()
            WHERE id = %s
            RETURNING *
            """,
            (status, execucao_id),
        )
        row = cur.fetchone()
        if row is None:
            raise RuntimeError("UPDATE execucoes_radar sem RETURNING")
        return dict(row)

def persistir_execucao(
    radar_conn,
    execucao,
    processos: Sequence[Any],
    processos_rows: Sequence[dict[str, Any]],
    *,
    origem: str = "manual",
    usuario_id: str | None = None,
) -> dict[str, Any]:
    """Write `execucao` and its results; return the persisted execucoes_radar row."""
    process_state_by_number = {processo.numero: processo for processo in processos}
    with radar_conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO execucoes_radar (
              origem, usuario_id, finalizada_em, status, total_previstos, total_consultados, total_sucesso,
              total_com_movimentacao_nova, total_sem_movimentacao, total_senha_necessaria,
              total_nao_localizado, total_captcha_timeout, total_timeout, total_pendente_implementacao,
              total_base_inicial_criada, total_numero_invalido, total_pagina_intermediaria, total_erro
            )
            VALUES (%s, %s, now(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
            """,
            (
                origem,
                usuario_id,
                execucao.status,
                execucao.total_previstos or len(processos_rows),
                execucao.total_consultados,
                execucao.total_sucesso,
                execucao.total_com_movimentacao_nova,
                execucao.total_sem_movimentacao,
                execucao.total_senha_necessaria,
                execucao.total_nao_localizado,
                execucao.total_captcha_timeout,
                execucao.total_timeout,
                execucao.total_pendente_implementacao,
                execucao.total_base_inicial_criada,
                execucao.total_numero_invalido,
                execucao.total_pagina_intermediaria,
                execucao.total_erro,
            ),
        )
        execucao_row = dict(cur.fetchone() or {})
        execucao_id = execucao_row["id"]
        processo_by_number = {row["numero"]: row for row in processos_rows}
        for resultado in execucao.resultados:
            processo = processo_by_number.get(resultado.numero_processo)
            processo_id = processo["id"] if processo else None
            movimentacoes_payload = [
                {
                    "chave": movimento.chave,
                    "data_hora": movimento.data_hora,
                    "descricao": movimento.descricao,
                    "evento": movimento.evento,
                    "usuario": movimento.usuario,
                }
                for movimento in resultado.movimentacoes
            ]
            cur.execute(
                """
                INSERT INTO resultados_consulta (
                  execucao_id, processo_id, numero_processo, tribunal, consultado_em, status,
                  quantidade_movimentacoes, movimentacoes, layout_movimentacoes, tem_movimentacao_nova,
                  url_resultado, mensagem_erro, tipo_erro, etapa, duracao_segundos
                )
                VALUES (%s, %s, %s, %s, coalesce(%s, now()), %s, %s, %s::jsonb, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                """,
                (
                    execucao_id,
                    processo_id,
                    resultado.numero_processo,
                    resultado.tribunal,
                    resultado.consultado_em,
                    resultado.status,
                    resultado.quantidade_movimentacoes,
                    Jsonb(movimentacoes_payload),
                    resultado.layout_movimentacoes,
                    resultado.tem_movimentacao_nova,
                    resultado.url_resultado,
                    resultado.mensagem_erro,
                    resultado.tipo_erro,
                    resultado.etapa,
                    resultado.duracao_segundos,
                ),
            )
            resultado_row = cur.fetchone()
            if resultado_row is None:
                raise RuntimeError("INSERT resultados_consulta sem RETURNING")
            resultado_id = resultado_row["id"]
            if processo_id and processo is not None:
                previous_keys = set(processo.get("chaves_movimentacoes") or [])
                for movimento in (resultado.movimentacoes if resultado.tem_movimentacao_nova else ()):
                    if not movimento.chave or movimento.chave in previous_keys:
                        continue
                    cur.execute(
                        """
                        INSERT INTO movimentacoes_novas (
                          execucao_id, processo_id, resultado_id, chave, data_hora,
                          descricao, evento, usuario, texto_normalizado, status_analise
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pendente')
                        ON CONFLICT (processo_id, chave) DO NOTHING
                        RETURNING *
                        """,
                        (
                            execucao_id,
                            processo_id,
                            resultado_id,
                            movimento.chave,
                            movimento.data_hora,
                            movimento.descricao,
                            movimento.evento,
                            movimento.usuario,
                            movement_normalized_text(
                                {"descricao": movimento.descricao, "evento": movimento.evento, "usuario": movimento.usuario}
                            ),
                        ),
                    )
                    inserted_movimento = cur.fetchone()
                    if inserted_movimento is not None:
                        processar_movimentacao_automacao(radar_conn, dict(inserted_movimento), processo)
                process_state = process_state_by_number[resultado.numero_processo]
                cur.execute(
                    """
                    UPDATE processos
                    SET chaves_movimentacoes = %s,
                        data_ultimo_andamento = coalesce(%s, data_ultimo_andamento),
                        ultima_consulta_status = %s,
                        ultima_consulta_em = now(),
                        ultima_consulta_inconclusiva = %s,
                        exige_senha = CASE
                          WHEN %s = 'senha_necessaria' THEN true
                          WHEN %s IN ('sucesso', 'base_inicial_criada') THEN false
                          ELSE exige_senha
                        END
                    WHERE id = %s
                    """,
                    (
                        list(process_state.chaves_movimentacoes) or processo.get("chaves_movimentacoes") or [],
                        process_state.data_ultimo_andamento,
                        resultado.status,
                        _processo_inconclusivo(resultado.status),
                        resultado.status,
                        resultado.status,
                        processo_id,
                    ),
                )
    return execucao_row
