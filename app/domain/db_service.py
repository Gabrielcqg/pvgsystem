from __future__ import annotations

from calendar import monthrange
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from typing import Any

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.domain.errors import ConflictError, NotFoundError, ValidationError
from app.security.redaction import redact_value
from app.security.vault import Vault


READ_TABLES = {
    "parceiros",
    "contratos",
    "parcelas",
    "lancamentos",
    "custos_fixos",
    "parametros",
    "configuracoes",
    "tarefas",
    "processos",
    "ind_fluxo_mensal",
    "ind_dre_mensal",
    "ind_balanco",
    "ind_gastos_categoria",
    "ind_analise_mensal",
    "ind_painel",
}

REPORT_TABLES = {
    "painel": "ind_painel",
    "fluxo-caixa": "ind_fluxo_mensal",
    "dre": "ind_dre_mensal",
    "balanco": "ind_balanco",
}

WRITE_FIELDS: dict[str, set[str]] = {
    "parceiros": {"nome", "ativo", "revisar"},
    "contratos": {
        "cliente",
        "parceiro_id",
        "numero_processo",
        "status",
        "tipo_honorario",
        "percentual_exito",
        "percentual_sucumbencia",
        "percentual_quota",
        "honorario_fixo_total",
        "valor_causa",
        "apelido_split",
        "observacoes",
        "data_proposta",
        "data_fechamento",
        "revisar",
    },
    "parcelas": {"contrato_id", "tipo", "valor", "mes_esperado", "recebido", "mes_recebimento", "observacoes"},
    "lancamentos": {
        "data",
        "descricao",
        "tipo",
        "valor",
        "categoria",
        "forma_pagamento",
        "pago",
        "contrato_id",
        "observacoes",
    },
    "custos_fixos": {"descricao", "valor_mensal", "recorrente", "dia_vencimento", "mes_inicio", "mes_fim"},
    "parametros": {"ano", "caixa_inicial_ano", "meta_caixa_ano", "meta_recorrencia_mensal", "recorrencia_atual"},
    "configuracoes": {"valor", "descricao"},
    "tarefas": {"titulo", "contrato_id", "responsavel", "prazo", "status", "origem", "movimentacao_id", "processo_id", "numero_processo"},
    "processos": {"numero", "cliente", "comarca_vara", "fase_atual", "ativo", "monitorar", "contrato_id", "tribunal"},
}

PRIMARY_KEYS = {
    "parametros": "ano",
    "configuracoes": "chave",
}


@dataclass
class PostgresService:
    conn: psycopg.Connection
    usuario_id: str | None = None
    vault: Vault | None = None

    def _audit(self, entidade: str, entidade_id: str | None, acao: str, antigo: Any = None, novo: Any = None) -> None:
        with self.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO auditoria (usuario_id, entidade, entidade_id, acao, valor_antigo, valor_novo)
                VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb)
                """,
                (
                    self.usuario_id,
                    entidade,
                    entidade_id,
                    acao,
                    Jsonb(redact_value(antigo)) if antigo is not None else None,
                    Jsonb(redact_value(novo)) if novo is not None else None,
                ),
            )

    def _validate_fields(self, table: str, data: Mapping[str, Any], *, partial: bool) -> dict[str, Any]:
        allowed = WRITE_FIELDS[table]
        extra = set(data) - allowed
        if extra:
            raise ValidationError(f"Campos nao permitidos: {sorted(extra)}", "write_allowlist")
        if not partial and table != "configuracoes":
            required = {"numero", "tribunal"} if table == "processos" else set()
            missing = required - set(data)
            if missing:
                raise ValidationError(f"Campos obrigatorios ausentes: {sorted(missing)}")
        return dict(data)

    def list_rows(self, table: str, *, limit: int = 100, offset: int = 0, filters: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
        if table not in READ_TABLES:
            raise NotFoundError("Recurso inexistente")
        limit = max(1, min(limit, 500))
        clauses = []
        params: list[Any] = []
        for key, value in (filters or {}).items():
            if value is None:
                continue
            clauses.append(sql.SQL("{} = %s").format(sql.Identifier(key)))
            params.append(value)
        where = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(clauses) if clauses else sql.SQL("")
        query = sql.SQL("SELECT * FROM {}{} LIMIT %s OFFSET %s").format(sql.Identifier(table), where)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(query, [*params, limit, offset])
            return [dict(row) for row in cur.fetchall()]

    def create(self, table: str, data: Mapping[str, Any]) -> dict[str, Any]:
        if table not in WRITE_FIELDS:
            raise NotFoundError("Recurso inexistente")
        fields = self._validate_fields(table, data, partial=False)
        cols = [sql.Identifier(key) for key in fields]
        placeholders = [sql.Placeholder()] * len(fields)
        query = sql.SQL("INSERT INTO {} ({}) VALUES ({}) RETURNING *").format(
            sql.Identifier(table),
            sql.SQL(", ").join(cols),
            sql.SQL(", ").join(placeholders),
        )
        try:
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, list(fields.values()))
                created = cur.fetchone()
                if created is None:
                    raise RuntimeError("INSERT sem RETURNING")
                row = dict(created)
        except psycopg.errors.UniqueViolation as exc:
            raise ConflictError("Registro duplicado", str(exc)) from exc
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Registro viola uma regra de validacao", str(exc)) from exc
        self._audit(table, str(row.get("id") or row.get("ano") or row.get("chave")), "criar", novo=fields)
        return row

    def patch(self, table: str, row_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._validate_fields(table, data, partial=True)
        if not fields:
            raise ValidationError("Nenhum campo para atualizar")
        assignments = [
            sql.SQL("{} = %s").format(sql.Identifier(key))
            for key in fields
        ]
        pk = PRIMARY_KEYS.get(table, "id")
        query = sql.SQL("UPDATE {} SET {} WHERE {} = %s RETURNING *").format(
            sql.Identifier(table),
            sql.SQL(", ").join(assignments),
            sql.Identifier(pk),
        )
        try:
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, [*fields.values(), row_id])
                row = cur.fetchone()
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Registro viola uma regra de validacao", str(exc)) from exc
        if row is None:
            raise NotFoundError("Registro nao encontrado")
        self._audit(table, row_id, "atualizar", novo=fields)
        return dict(row)

    def delete(self, table: str, row_id: str, *, cascade: bool = False) -> None:
        if table == "contratos" and not cascade:
            with self.conn.cursor() as cur:
                cur.execute("SELECT count(*) FROM parcelas WHERE contrato_id = %s", (row_id,))
                count_row = cur.fetchone()
                if count_row and count_row[0]:
                    raise ConflictError("Contrato possui parcelas; confirme cascade=true")
        if table == "contratos" and cascade:
            with self.conn.cursor() as cur:
                cur.execute("DELETE FROM parcelas WHERE contrato_id = %s", (row_id,))
        pk = PRIMARY_KEYS.get(table, "id")
        with self.conn.cursor() as cur:
            cur.execute(sql.SQL("DELETE FROM {} WHERE {} = %s").format(sql.Identifier(table), sql.Identifier(pk)), (row_id,))
            if cur.rowcount == 0:
                raise NotFoundError("Registro nao encontrado")
        self._audit(table, row_id, "excluir")

    def confirmar_parcela(self, parcela_id: str, mes_recebimento: date, data_pagamento: date | None = None) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT p.*, c.cliente FROM parcelas p JOIN contratos c ON c.id = p.contrato_id WHERE p.id = %s FOR UPDATE", (parcela_id,))
            parcela = cur.fetchone()
            if not parcela:
                raise NotFoundError("Parcela nao encontrada")
            if parcela["recebido"]:
                raise ConflictError("Parcela ja recebida")
            payment_date = data_pagamento or date(mes_recebimento.year, mes_recebimento.month, monthrange(mes_recebimento.year, mes_recebimento.month)[1])
            cur.execute(
                """
                UPDATE parcelas SET recebido = true, mes_recebimento = %s WHERE id = %s
                RETURNING *
                """,
                (date(mes_recebimento.year, mes_recebimento.month, 1), parcela_id),
            )
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE parcelas sem RETURNING")
            updated = dict(updated_row)
            cur.execute(
                """
                INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago, contrato_id, origem, origem_id)
                VALUES (%s, %s, 'entrada', %s, 'honorarios', true, %s, 'parcela', %s)
                RETURNING *
                """,
                (payment_date, f"Parcela {parcela['tipo']} - {parcela['cliente']}", parcela["valor"], parcela["contrato_id"], parcela_id),
            )
            lancamento_row = cur.fetchone()
            if lancamento_row is None:
                raise RuntimeError("INSERT lancamentos sem RETURNING")
            lancamento = dict(lancamento_row)
            cur.execute("SELECT private.recalcular_mes(%s::smallint, %s::smallint)", (mes_recebimento.year, mes_recebimento.month))
        self._audit("parcelas", parcela_id, "confirmar", antigo=dict(parcela), novo=updated)
        return {"parcela": updated, "lancamento": lancamento}

    def estornar_parcela(self, parcela_id: str) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM parcelas WHERE id = %s FOR UPDATE", (parcela_id,))
            parcela = cur.fetchone()
            if not parcela:
                raise NotFoundError("Parcela nao encontrada")
            if not parcela["recebido"]:
                raise ConflictError("Parcela nao recebida")
            mes_recebimento = parcela["mes_recebimento"]
            cur.execute("DELETE FROM lancamentos WHERE origem = 'parcela' AND origem_id = %s", (parcela_id,))
            cur.execute("UPDATE parcelas SET recebido = false, mes_recebimento = NULL WHERE id = %s RETURNING *", (parcela_id,))
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE parcelas sem RETURNING")
            updated = dict(updated_row)
            cur.execute("SELECT private.recalcular_mes(%s::smallint, %s::smallint)", (mes_recebimento.year, mes_recebimento.month))
        self._audit("parcelas", parcela_id, "estornar", antigo=dict(parcela), novo=updated)
        return updated

    def lancar_custo_fixo(self, custo_id: str, competencia: date) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM custos_fixos WHERE id = %s", (custo_id,))
            custo = cur.fetchone()
            if not custo:
                raise NotFoundError("Custo fixo nao encontrado")
            competencia_mes = date(competencia.year, competencia.month, 1)
            if competencia_mes < custo["mes_inicio"] or (custo["mes_fim"] and competencia_mes > custo["mes_fim"]):
                raise ValidationError("Competencia fora da vigencia do custo")
            if not custo["recorrente"] and competencia_mes != custo["mes_inicio"]:
                raise ValidationError("Custo nao recorrente so pode ser lancado no mes inicial")
            due_day = min(custo["dia_vencimento"] or 31, monthrange(competencia.year, competencia.month)[1])
            try:
                cur.execute(
                    """
                    INSERT INTO lancamentos (data, descricao, tipo, valor, categoria, pago, origem, origem_id)
                    VALUES (%s, %s, 'saida', %s, 'custo_fixo', false, 'custo_fixo', %s)
                    RETURNING *
                    """,
                    (date(competencia.year, competencia.month, due_day), custo["descricao"], custo["valor_mensal"], f"{custo_id}:{competencia:%Y-%m}"),
                )
            except psycopg.errors.UniqueViolation as exc:
                raise ConflictError("Custo fixo ja lancado nesta competencia") from exc
            created_lancamento = cur.fetchone()
            if created_lancamento is None:
                raise RuntimeError("INSERT lancamentos sem RETURNING")
            row = dict(created_lancamento)
            cur.execute("SELECT private.recalcular_mes(%s::smallint, %s::smallint)", (competencia.year, competencia.month))
        self._audit("custos_fixos", custo_id, "lancar", novo=row)
        return row

    def criar_tarefa_de_movimentacao(self, movimentacao_id: str, titulo: str, responsavel: str | None = None) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT m.*, p.contrato_id, p.numero
                FROM movimentacoes_novas m
                JOIN processos p ON p.id = m.processo_id
                WHERE m.id = %s
                """,
                (movimentacao_id,),
            )
            movimento = cur.fetchone()
            if not movimento:
                raise NotFoundError("Movimentacao nao encontrada")
            try:
                cur.execute(
                    """
                    INSERT INTO tarefas (titulo, contrato_id, responsavel, origem, movimentacao_id, processo_id, numero_processo)
                    VALUES (%s, %s, %s, 'radar_movimentacao', %s, %s, %s)
                    RETURNING *
                    """,
                    (titulo, movimento["contrato_id"], responsavel, movimentacao_id, movimento["processo_id"], movimento["numero"]),
                )
            except psycopg.errors.UniqueViolation as exc:
                raise ConflictError("Movimentacao ja virou tarefa") from exc
            tarefa_row = cur.fetchone()
            if tarefa_row is None:
                raise RuntimeError("INSERT tarefas sem RETURNING")
            tarefa = dict(tarefa_row)
            cur.execute("UPDATE movimentacoes_novas SET virou_tarefa = true WHERE id = %s", (movimentacao_id,))
        self._audit("movimentacoes_novas", movimentacao_id, "criar_tarefa", novo=tarefa)
        return tarefa

    def registrar_senha_processo(self, processo_id: str, senha: str) -> dict[str, Any]:
        if not self.vault:
            raise ValidationError("Vault nao configurado")
        ref = self.vault.guardar(senha)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                UPDATE processos
                SET senha_ref = %s, exige_senha = false
                WHERE id = %s
                RETURNING id, numero, tribunal, cliente, comarca_vara, fase_atual, ativo, monitorar, exige_senha,
                          ultima_consulta_status, ultima_consulta_em, ultima_consulta_inconclusiva
                """,
                (ref, processo_id),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Processo nao encontrado")
        self._audit("processos", processo_id, "registrar_senha", novo={"senha_ref": ref})
        return dict(row)
