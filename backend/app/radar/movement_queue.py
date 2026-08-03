from __future__ import annotations

from typing import Any


TERMINAL_ANALYSIS_STATUSES = {"analisada", "concluida", "ignorada"}


def vincular_movimentacoes_pendentes_do_processo(
    cur: Any,
    *,
    tarefa_id: str,
    processo_id: str,
    usuario_id: str | None = None,
    movimentacao_id: str | None = None,
) -> list[dict[str, Any]]:
    """Attach all pending radar movements for a process to one operational task."""
    cur.execute(
        """
        WITH candidatas AS (
          SELECT id
          FROM movimentacoes_novas
          WHERE processo_id = %s
            AND (
              status_analise = 'pendente'
              OR (%s::uuid IS NOT NULL AND id = %s::uuid AND status_analise NOT IN ('analisada', 'concluida', 'ignorada'))
            )
          ORDER BY criado_em ASC
          FOR UPDATE
        ),
        vinculadas AS (
          INSERT INTO tarefa_movimentacoes (tarefa_id, movimentacao_id, criado_por)
          SELECT %s, id, %s
          FROM candidatas
          ON CONFLICT DO NOTHING
          RETURNING movimentacao_id
        )
        UPDATE movimentacoes_novas m
        SET status_analise = 'em_tarefa',
            status_analise_atualizado_em = now(),
            tarefa_principal_id = %s,
            virou_tarefa = true
        FROM candidatas c
        WHERE m.id = c.id
        RETURNING m.*
        """,
        (processo_id, movimentacao_id, movimentacao_id, tarefa_id, usuario_id, tarefa_id),
    )
    return [dict(row) for row in cur.fetchall()]


def movimentacoes_vinculadas_da_tarefa(cur: Any, tarefa_id: str) -> list[dict[str, Any]]:
    cur.execute(
        """
        SELECT m.*
        FROM tarefa_movimentacoes tm
        JOIN movimentacoes_novas m ON m.id = tm.movimentacao_id
        WHERE tm.tarefa_id = %s
        ORDER BY m.criado_em ASC
        """,
        (tarefa_id,),
    )
    return [dict(row) for row in cur.fetchall()]


def atualizar_movimentacoes_da_tarefa(
    cur: Any,
    *,
    tarefa_id: str,
    status_analise: str,
    usuario_id: str | None = None,
) -> list[dict[str, Any]]:
    if status_analise not in {"pendente", "em_tarefa", "analisada", "concluida", "ignorada"}:
        raise ValueError("status_analise invalido")
    timestamp_assignments = {
        "pendente": "tarefa_principal_id = NULL",
        "em_tarefa": "concluida_em = NULL",
        "concluida": "concluida_em = coalesce(concluida_em, now())",
        "analisada": "analisada_em = coalesce(analisada_em, now())",
        "ignorada": "ignorada_em = coalesce(ignorada_em, now()), ignorada_por = coalesce(ignorada_por, %s::uuid)",
    }
    extra_sql = timestamp_assignments.get(status_analise, "")
    params: list[Any] = []
    if status_analise == "ignorada":
        params.append(usuario_id)
    if extra_sql:
        extra_sql = ", " + extra_sql
    cur.execute(
        f"""
        UPDATE movimentacoes_novas m
        SET status_analise = %s,
            status_analise_atualizado_em = now()
            {extra_sql}
        FROM tarefa_movimentacoes tm
        WHERE tm.movimentacao_id = m.id
          AND tm.tarefa_id = %s
          AND m.status_analise <> 'ignorada'
        RETURNING m.*
        """,
        [status_analise, *params, tarefa_id],
    )
    return [dict(row) for row in cur.fetchall()]
