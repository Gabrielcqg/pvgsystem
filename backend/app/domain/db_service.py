from __future__ import annotations

from calendar import monthrange
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import psycopg
from psycopg import sql
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.domain.errors import ConflictError, NotFoundError, ValidationError
from app.radar.automation import aprovar_execucao_automacao, encadear_tarefa_concluida, ignorar_execucao_automacao
from app.radar.comparacao import com_chaves
from app.radar.inercia import ProcessoInercia, dias_sem_movimentacao
from app.radar.movement_queue import (
    atualizar_movimentacoes_da_tarefa,
    movimentacoes_vinculadas_da_tarefa,
    vincular_movimentacoes_pendentes_do_processo,
)
from app.radar.orchestrator import ExecucaoRadarMemoria, ProcessoMonitorado, classificar_execucao, registrar_resultado
from app.radar.persistence import (
    atualizar_rodadas_interrompidas,
    criar_tarefa_inercia_se_aplicavel,
    finalizar_execucao_radar,
    iniciar_execucao_radar,
    persistir_resultado_radar,
)
from app.radar.scrapers.base import Movimentacao, ResultadoConsulta
from app.security.redaction import redact_value


READ_TABLES = {
    "parceiros",
    "contratos",
    "parcelas",
    "lancamentos",
    "custos_fixos",
    "parametros",
    "configuracoes",
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
    "processos",
    "execucoes_radar",
    "resultados_consulta",
    "movimentacoes_novas",
    "radar_movimentacao_tipos",
    "radar_automacao_regras",
    "radar_automacao_padroes",
    "radar_movimentacao_classificacoes",
    "radar_automacao_execucoes",
    "auditoria",
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

DEFAULT_LIST_ORDER: dict[str, tuple[str, bool]] = {
    "parceiros": ("criado_em", True),
    "contratos": ("criado_em", True),
    "lancamentos": ("criado_em", True),
    "custos_fixos": ("criado_em", True),
    "processos": ("criado_em", True),
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
    "tarefas": {
        "titulo",
        "descricao",
        "contrato_id",
        "responsavel",
        "responsavel_id",
        "prazo",
        "status",
        "origem",
        "movimentacao_id",
        "processo_id",
        "numero_processo",
        "prioridade",
        "data_inicio",
        "estimativa_minutos",
        "observacoes",
        "tags",
    },
    "tarefa_subtarefas": {"tarefa_id", "titulo", "responsavel", "responsavel_id", "status", "prioridade", "prazo", "ordem"},
    "tarefa_checklist_itens": {"tarefa_id", "titulo", "concluido", "ordem"},
    "tarefa_comentarios": {"tarefa_id", "conteudo"},
    "tarefa_dependencias": {"tarefa_id", "tarefa_relacionada_id", "tipo"},
    "tarefa_tags": {"nome", "cor"},
    "processos": {
        "area_pasta",
        "numero_interno",
        "numero",
        "cliente",
        "tribunal",
        "status_processo",
        "autor",
        "reu",
        "comarca_vara",
        "assunto",
        "andamento_atual",
        "fase_atual",
        "data_ultimo_andamento",
        "ativo",
        "monitorar",
        "contrato_id",
    },
}

PRIMARY_KEYS = {
    "parametros": "ano",
    "configuracoes": "chave",
}

TASK_STATUS_ALIASES = {
    "aberta": "a_fazer",
    "aberto": "a_fazer",
    "a fazer": "a_fazer",
    "a_fazer": "a_fazer",
    "backlog": "backlog",
    "em andamento": "em_andamento",
    "em_andamento": "em_andamento",
    "aguardando": "aguardando",
    "bloqueada": "bloqueada",
    "bloqueado": "bloqueada",
    "em revisão": "em_revisao",
    "em revisao": "em_revisao",
    "em_revisao": "em_revisao",
    "concluida": "concluida",
    "concluída": "concluida",
}
TASK_STATUSES = {"backlog", "a_fazer", "em_andamento", "aguardando", "bloqueada", "em_revisao", "concluida"}
TASK_PRIORITIES = {"baixa", "normal", "alta", "urgente"}
TASK_PRIORITY_ALIASES = {
    "baixa": "baixa",
    "normal": "normal",
    "média": "normal",
    "media": "normal",
    "alta": "alta",
    "urgente": "urgente",
}
TASK_ORIGINS = {"manual", "radar_movimentacao", "radar_inercia"}
RADAR_API_ADVISORY_LOCK = 824260114


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    return date(value.year + month_index // 12, month_index % 12 + 1, 1)


@dataclass
class PostgresService:
    conn: psycopg.Connection
    usuario_id: str | None = None
    radar_password_key: str | None = None
    radar_db_url: str | None = None

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

    def list_rows(
        self,
        table: str,
        *,
        limit: int = 100,
        offset: int = 0,
        filters: Mapping[str, Any] | None = None,
        order_by: str | None = None,
        descending: bool = False,
    ) -> list[dict[str, Any]]:
        if table not in READ_TABLES:
            raise NotFoundError("Recurso inexistente")
        limit = max(1, min(limit, 500))
        clauses = []
        params: list[Any] = []
        for key, value in (filters or {}).items():
            if value is None:
                continue
            clauses.append(sql.SQL("{}::text = %s").format(sql.Identifier(key)))
            params.append(str(value).lower() if isinstance(value, bool) else str(value))
        where = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(clauses) if clauses else sql.SQL("")
        order: sql.Composable = sql.SQL("")
        if order_by:
            direction = sql.SQL(" DESC") if descending else sql.SQL(" ASC")
            order = sql.SQL(" ORDER BY {}").format(sql.Identifier(order_by)) + direction
        elif table in DEFAULT_LIST_ORDER:
            default_column, default_desc = DEFAULT_LIST_ORDER[table]
            direction = sql.SQL(" DESC") if default_desc else sql.SQL(" ASC")
            order = sql.SQL(" ORDER BY {}").format(sql.Identifier(default_column)) + direction
        query = sql.SQL("SELECT * FROM {}{}{} LIMIT %s OFFSET %s").format(sql.Identifier(table), where, order)
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
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Registro referencia outro recurso inexistente", str(exc)) from exc
        except psycopg.errors.NotNullViolation as exc:
            raise ValidationError("Campos obrigatorios ausentes", str(exc)) from exc
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Registro viola uma regra de validacao", str(exc)) from exc
        except psycopg.DataError as exc:
            raise ValidationError("Valor invalido para campo ou formato de data", str(exc)) from exc
        self._audit(table, str(row.get("id") or row.get("ano") or row.get("chave")), "criar", novo=fields)
        return row

    def salvar_parametros(self, ano: int, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._validate_fields("parametros", {"ano": ano, **data}, partial=False)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO parametros (
                  ano, caixa_inicial_ano, meta_caixa_ano, meta_recorrencia_mensal, recorrencia_atual
                )
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (ano) DO UPDATE SET
                  caixa_inicial_ano = excluded.caixa_inicial_ano,
                  meta_caixa_ano = excluded.meta_caixa_ano,
                  meta_recorrencia_mensal = excluded.meta_recorrencia_mensal,
                  recorrencia_atual = excluded.recorrencia_atual
                RETURNING *
                """,
                (
                    fields["ano"],
                    fields.get("caixa_inicial_ano", 0),
                    fields.get("meta_caixa_ano", 0),
                    fields.get("meta_recorrencia_mensal", 0),
                    fields.get("recorrencia_atual", 0),
                ),
            )
            row = cur.fetchone()
            if row is None:
                raise RuntimeError("UPSERT parametros sem RETURNING")
        self._audit("parametros", str(ano), "salvar", novo=fields)
        return dict(row)

    def fechar_contrato(self, contrato_id: str, parcelas_count: int, mes_inicio: date, data_fechamento: date | None = None) -> dict[str, Any]:
        if parcelas_count < 1 or parcelas_count > 60:
            raise ValidationError("Quantidade de parcelas deve estar entre 1 e 60")
        inicio = date(mes_inicio.year, mes_inicio.month, 1)
        try:
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM contratos WHERE id = %s FOR UPDATE", (contrato_id,))
                contrato = cur.fetchone()
                if not contrato:
                    raise NotFoundError("Contrato nao encontrado")
                if contrato["status"] != "proposta":
                    raise ConflictError("Contrato ja foi fechado ou nao esta em proposta")

                cur.execute(
                    """
                    UPDATE contratos
                    SET status = 'ativo',
                        data_fechamento = coalesce(data_fechamento, %s)
                    WHERE id = %s
                    RETURNING *
                    """,
                    (data_fechamento or date.today(), contrato_id),
                )
                updated_row = cur.fetchone()
                if updated_row is None:
                    raise RuntimeError("UPDATE contratos sem RETURNING")
                updated = dict(updated_row)

                total = Decimal(str(contrato["honorario_fixo_total"] or 0))
                created: list[dict[str, Any]] = []
                if total > 0:
                    cur.execute("SELECT count(*) FROM parcelas WHERE contrato_id = %s", (contrato_id,))
                    existing_count = int((cur.fetchone() or {"count": 0})["count"])
                    if existing_count == 0:
                        base_value = (total / Decimal(parcelas_count)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                        values = [base_value for _ in range(parcelas_count)]
                        values[-1] = total - sum(values[:-1], Decimal("0.00"))
                        for idx, valor in enumerate(values):
                            cur.execute(
                                """
                                INSERT INTO parcelas (contrato_id, tipo, valor, mes_esperado)
                                VALUES (%s, 'mensal', %s, %s)
                                RETURNING *
                                """,
                                (contrato_id, valor, _add_months(inicio, idx)),
                            )
                            row = cur.fetchone()
                            if row is None:
                                raise RuntimeError("INSERT parcelas sem RETURNING")
                            created.append(dict(row))
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Registro viola uma regra de validacao", str(exc)) from exc
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Registro referencia outro recurso inexistente", str(exc)) from exc
        except psycopg.errors.UniqueViolation as exc:
            raise ConflictError("Registro duplicado", str(exc)) from exc

        self._audit("contratos", contrato_id, "fechar", antigo=dict(contrato), novo={"contrato": updated, "parcelas": created})
        return {"contrato": updated, "parcelas": created}

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
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Registro referencia outro recurso inexistente", str(exc)) from exc
        except psycopg.errors.NotNullViolation as exc:
            raise ValidationError("Campos obrigatorios ausentes", str(exc)) from exc
        except psycopg.DataError as exc:
            raise ValidationError("Valor invalido para campo ou formato de data", str(exc)) from exc
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
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT id
                    FROM parcelas
                    WHERE contrato_id = %s
                      AND (
                        recebido
                        OR EXISTS (
                          SELECT 1
                          FROM lancamentos l
                          WHERE l.origem = 'parcela'
                            AND l.origem_id = parcelas.id::text
                        )
                      )
                    LIMIT 1
                    """,
                    (row_id,),
                )
                if cur.fetchone():
                    raise ConflictError("Contrato possui parcelas recebidas; estorne antes de excluir")
                cur.execute("DELETE FROM parcelas WHERE contrato_id = %s", (row_id,))
        if table == "parcelas":
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT p.id
                    FROM parcelas p
                    WHERE p.id = %s
                      AND (
                        p.recebido
                        OR EXISTS (
                          SELECT 1
                          FROM lancamentos l
                          WHERE l.origem = 'parcela'
                            AND l.origem_id = p.id::text
                        )
                      )
                    """,
                    (row_id,),
                )
                if cur.fetchone():
                    raise ConflictError("Estorne a parcela antes de excluir")
        pk = PRIMARY_KEYS.get(table, "id")
        try:
            with self.conn.cursor() as cur:
                cur.execute(sql.SQL("DELETE FROM {} WHERE {} = %s").format(sql.Identifier(table), sql.Identifier(pk)), (row_id,))
                if cur.rowcount == 0:
                    raise NotFoundError("Registro nao encontrado")
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ConflictError("Registro possui vinculos e nao pode ser excluido sem remover dependencias", str(exc)) from exc
        self._audit(table, row_id, "excluir")

    def _normalize_task_status(self, value: Any, *, default: str | None = None) -> str | None:
        if value is None or value == "":
            return default
        normalized = TASK_STATUS_ALIASES.get(str(value).strip().lower(), str(value).strip())
        if normalized not in TASK_STATUSES:
            raise ValidationError("Status de tarefa invalido")
        return normalized

    def _normalize_task_priority(self, value: Any, *, default: str | None = None) -> str | None:
        if value is None or value == "":
            return default
        normalized = TASK_PRIORITY_ALIASES.get(str(value).strip().lower(), str(value).strip().lower())
        if normalized not in TASK_PRIORITIES:
            raise ValidationError("Prioridade de tarefa invalida")
        return normalized

    def _normalize_task_payload(self, data: Mapping[str, Any], *, partial: bool) -> dict[str, Any]:
        fields = self._validate_fields("tarefas", data, partial=partial)
        if not partial and not str(fields.get("titulo") or "").strip():
            raise ValidationError("Titulo da tarefa e obrigatorio")
        if "titulo" in fields:
            fields["titulo"] = str(fields["titulo"]).strip()
            if not fields["titulo"]:
                raise ValidationError("Titulo da tarefa e obrigatorio")
        if "status" in fields:
            fields["status"] = self._normalize_task_status(fields["status"], default="a_fazer")
        elif not partial:
            fields["status"] = "a_fazer"
        if "prioridade" in fields:
            fields["prioridade"] = self._normalize_task_priority(fields["prioridade"], default="normal")
        elif not partial:
            fields["prioridade"] = "normal"
        if "origem" in fields:
            origem = str(fields["origem"])
            if origem == "radar":
                origem = "radar_movimentacao"
            if origem not in TASK_ORIGINS:
                raise ValidationError("Origem de tarefa invalida")
            fields["origem"] = origem
        elif not partial:
            fields["origem"] = "manual"
        if "tags" in fields:
            raw_tags = fields["tags"] or []
            if isinstance(raw_tags, str):
                raw_tags = [item.strip() for item in raw_tags.split(",")]
            if not isinstance(raw_tags, list):
                raise ValidationError("Tags devem ser uma lista")
            fields["tags"] = [str(item).strip() for item in raw_tags if str(item).strip()]
        return fields

    def _task_history(self, cur: Any, tarefa_id: str, evento: str, antigo: Any = None, novo: Any = None) -> None:
        cur.execute(
            """
            INSERT INTO tarefa_historico (tarefa_id, usuario_id, evento, valor_antigo, valor_novo)
            VALUES (%s, %s, %s, %s::jsonb, %s::jsonb)
            """,
            (
                tarefa_id,
                self.usuario_id,
                evento,
                Jsonb(redact_value(antigo)) if antigo is not None else None,
                Jsonb(redact_value(novo)) if novo is not None else None,
            ),
        )

    def _task_pending_blockers(self, cur: Any, tarefa_id: str) -> dict[str, int]:
        cur.execute(
            """
            SELECT
              (SELECT count(*) FROM tarefa_subtarefas WHERE tarefa_id = %s AND status <> 'concluida') AS subtarefas,
              (SELECT count(*) FROM tarefa_checklist_itens WHERE tarefa_id = %s AND NOT concluido) AS checklist,
              (
                SELECT count(*)
                FROM tarefa_dependencias d
                JOIN tarefas dep ON dep.id = d.tarefa_relacionada_id
                WHERE d.tarefa_id = %s
                  AND d.tipo = 'bloqueada_por'
                  AND dep.status <> 'concluida'
                  AND dep.archived_at IS NULL
              ) AS dependencias
            """,
            (tarefa_id, tarefa_id, tarefa_id),
        )
        row = cur.fetchone() or {"subtarefas": 0, "checklist": 0, "dependencias": 0}
        return {key: int(row[key] or 0) for key in ("subtarefas", "checklist", "dependencias")}

    def _select_tarefas_sql(self, where_sql: sql.Composable, order_sql: sql.Composable) -> sql.Composed:
        return sql.SQL(
            """
            WITH checklist AS (
              SELECT tarefa_id, count(*)::int AS checklist_total, count(*) FILTER (WHERE concluido)::int AS checklist_concluidos
              FROM tarefa_checklist_itens
              GROUP BY tarefa_id
            ),
            subtarefas AS (
              SELECT tarefa_id, count(*)::int AS subtarefas_total, count(*) FILTER (WHERE status = 'concluida')::int AS subtarefas_concluidas
              FROM tarefa_subtarefas
              GROUP BY tarefa_id
            ),
            comentarios AS (
              SELECT tarefa_id, count(*)::int AS comentarios_total
              FROM tarefa_comentarios
              WHERE excluido_em IS NULL
              GROUP BY tarefa_id
            ),
            dependencias AS (
              SELECT d.tarefa_id, count(*) FILTER (
                WHERE d.tipo = 'bloqueada_por' AND dep.status <> 'concluida' AND dep.archived_at IS NULL
              )::int AS bloqueios_pendentes
              FROM tarefa_dependencias d
              JOIN tarefas dep ON dep.id = d.tarefa_relacionada_id
              GROUP BY d.tarefa_id
            ),
            radar_movimentos AS (
              SELECT
                tm.tarefa_id,
                count(*)::int AS radar_movimentacoes_total,
                jsonb_agg(
                  jsonb_build_object(
                    'id', m.id,
                    'processo_id', m.processo_id,
                    'chave', m.chave,
                    'data_hora', m.data_hora,
                    'descricao', m.descricao,
                    'evento', m.evento,
                    'usuario', m.usuario,
                    'status_analise', m.status_analise,
                    'criado_em', m.criado_em
                  )
                  ORDER BY m.criado_em ASC
                ) AS radar_movimentacoes
              FROM tarefa_movimentacoes tm
              JOIN movimentacoes_novas m ON m.id = tm.movimentacao_id
              GROUP BY tm.tarefa_id
            )
            SELECT
              t.*,
              s.rotulo AS status_rotulo,
              s.ordem AS status_ordem,
              s.grupo AS status_grupo,
              s.cor AS status_cor,
              s.terminal AS status_terminal,
              c.cliente AS contrato_cliente,
              p.cliente AS processo_cliente,
              rm.descricao AS movimentacao_descricao,
              rm.data_hora AS movimentacao_data_hora,
              rm.evento AS movimentacao_evento,
              rm.usuario AS movimentacao_usuario,
              rar.nome AS radar_regra_nome,
              rar.slug AS radar_regra_slug,
              rae.status AS radar_automacao_status,
              coalesce(checklist.checklist_total, 0) AS checklist_total,
              coalesce(checklist.checklist_concluidos, 0) AS checklist_concluidos,
              coalesce(subtarefas.subtarefas_total, 0) AS subtarefas_total,
              coalesce(subtarefas.subtarefas_concluidas, 0) AS subtarefas_concluidas,
              coalesce(comentarios.comentarios_total, 0) AS comentarios_total,
              coalesce(dependencias.bloqueios_pendentes, 0) AS bloqueios_pendentes,
              coalesce(radar_movimentos.radar_movimentacoes_total, CASE WHEN rm.id IS NULL THEN 0 ELSE 1 END) AS radar_movimentacoes_total,
              coalesce(radar_movimentos.radar_movimentacoes, CASE WHEN rm.id IS NULL THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object(
                'id', rm.id,
                'processo_id', rm.processo_id,
                'chave', rm.chave,
                'data_hora', rm.data_hora,
                'descricao', rm.descricao,
                'evento', rm.evento,
                'usuario', rm.usuario,
                'status_analise', rm.status_analise,
                'criado_em', rm.criado_em
              )) END) AS radar_movimentacoes
            FROM tarefas t
            JOIN tarefa_statuses s ON s.slug = t.status
            LEFT JOIN contratos c ON c.id = t.contrato_id
            LEFT JOIN processos p ON p.id = t.processo_id
            LEFT JOIN movimentacoes_novas rm ON rm.id = t.movimentacao_id
            LEFT JOIN radar_automacao_regras rar ON rar.id = t.radar_regra_id
            LEFT JOIN radar_automacao_execucoes rae ON rae.id = t.radar_automacao_execucao_id
            LEFT JOIN checklist ON checklist.tarefa_id = t.id
            LEFT JOIN subtarefas ON subtarefas.tarefa_id = t.id
            LEFT JOIN comentarios ON comentarios.tarefa_id = t.id
            LEFT JOIN dependencias ON dependencias.tarefa_id = t.id
            LEFT JOIN radar_movimentos ON radar_movimentos.tarefa_id = t.id
            """
        ) + where_sql + order_sql + sql.SQL(" LIMIT %s OFFSET %s")

    def list_tarefas(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
        filters: Mapping[str, Any] | None = None,
        order_by: str | None = None,
        descending: bool = False,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        filters = dict(filters or {})
        view = str(filters.pop("view", "") or filters.pop("visao", "") or "")
        q = str(filters.pop("q", "") or filters.pop("search", "") or "").strip()
        include_archived = str(filters.pop("include_archived", "")).lower() in {"1", "true", "sim"}
        clauses: list[sql.Composable] = []
        params: list[Any] = []

        if view == "arquivadas":
            clauses.append(sql.SQL("t.archived_at IS NOT NULL"))
        elif not include_archived:
            clauses.append(sql.SQL("t.archived_at IS NULL"))

        if view in {"minhas", "minhas_tarefas"} and self.usuario_id:
            clauses.append(sql.SQL("(t.responsavel_id = %s OR lower(coalesce(t.responsavel, '')) = lower(coalesce((select auth.jwt() ->> 'email'), '')))"))
            params.append(self.usuario_id)
        elif view == "atrasadas":
            clauses.append(sql.SQL("t.status <> 'concluida' AND t.prazo < current_date"))
        elif view in {"hoje", "para_hoje"}:
            clauses.append(sql.SQL("t.status <> 'concluida' AND t.prazo = current_date"))
        elif view == "proximas":
            clauses.append(sql.SQL("t.status <> 'concluida' AND t.prazo > current_date AND t.prazo <= current_date + 7"))
        elif view == "bloqueadas":
            clauses.append(sql.SQL("(t.status = 'bloqueada' OR EXISTS (SELECT 1 FROM tarefa_dependencias d JOIN tarefas dep ON dep.id = d.tarefa_relacionada_id WHERE d.tarefa_id = t.id AND d.tipo = 'bloqueada_por' AND dep.status <> 'concluida' AND dep.archived_at IS NULL))"))
        elif view == "concluidas":
            clauses.append(sql.SQL("t.status = 'concluida'"))

        for key, value in filters.items():
            if value is None or value == "":
                continue
            if key == "status":
                clauses.append(sql.SQL("t.status = %s"))
                params.append(self._normalize_task_status(value, default="a_fazer"))
            elif key == "prioridade":
                clauses.append(sql.SQL("t.prioridade = %s"))
                params.append(self._normalize_task_priority(value, default="normal"))
            elif key in {"contrato_id", "processo_id", "movimentacao_id", "id"}:
                clauses.append(sql.SQL("t.{} = %s").format(sql.Identifier(key)))
                params.append(value)
            elif key == "origem":
                origem = "radar_movimentacao" if value == "radar" else str(value)
                clauses.append(sql.SQL("t.origem::text = %s"))
                params.append(origem)
            elif key == "responsavel":
                clauses.append(sql.SQL("lower(coalesce(t.responsavel, '')) = lower(%s)"))
                params.append(str(value))
            elif key == "atrasadas":
                if str(value).lower() in {"1", "true", "sim"}:
                    clauses.append(sql.SQL("t.status <> 'concluida' AND t.prazo < current_date"))
            else:
                clauses.append(sql.SQL("t.{}::text = %s").format(sql.Identifier(key)))
                params.append(str(value))

        if q:
            clauses.append(sql.SQL("(t.titulo ILIKE %s OR t.descricao ILIKE %s OR t.observacoes ILIKE %s OR t.numero_processo ILIKE %s OR c.cliente ILIKE %s OR p.cliente ILIKE %s)"))
            like = f"%{q}%"
            params.extend([like, like, like, like, like, like])

        where = sql.SQL(" WHERE ") + sql.SQL(" AND ").join(clauses) if clauses else sql.SQL("")
        allowed_order = {
            "prazo": sql.SQL("t.prazo"),
            "prioridade": sql.SQL("CASE t.prioridade WHEN 'urgente' THEN 1 WHEN 'alta' THEN 2 WHEN 'normal' THEN 3 ELSE 4 END"),
            "criado_em": sql.SQL("t.criado_em"),
            "atualizado_em": sql.SQL("t.atualizado_em"),
            "responsavel": sql.SQL("t.responsavel"),
            "status": sql.SQL("s.ordem"),
        }
        order_expr = allowed_order.get(order_by or "status", sql.SQL("s.ordem"))
        direction = sql.SQL(" DESC") if descending else sql.SQL(" ASC")
        nulls = sql.SQL(" NULLS LAST")
        order = sql.SQL(" ORDER BY ") + order_expr + direction + nulls + sql.SQL(", t.criado_em DESC")

        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(self._select_tarefas_sql(where, order), (*params, limit, offset))
            return [dict(row) for row in cur.fetchall()]

    def tarefa_contadores(self) -> dict[str, int]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                  count(*) FILTER (WHERE archived_at IS NULL)::int AS todas,
                  count(*) FILTER (
                    WHERE archived_at IS NULL
                      AND (responsavel_id = %s OR lower(coalesce(responsavel, '')) = lower(coalesce((select auth.jwt() ->> 'email'), '')))
                  )::int AS minhas,
                  count(*) FILTER (WHERE archived_at IS NULL AND status <> 'concluida' AND prazo < current_date)::int AS atrasadas,
                  count(*) FILTER (WHERE archived_at IS NULL AND status <> 'concluida' AND prazo = current_date)::int AS para_hoje,
                  count(*) FILTER (WHERE archived_at IS NULL AND status <> 'concluida' AND prazo > current_date AND prazo <= current_date + 7)::int AS proximas,
                  count(*) FILTER (WHERE archived_at IS NULL AND status = 'bloqueada')::int AS bloqueadas,
                  count(*) FILTER (WHERE archived_at IS NULL AND status = 'concluida')::int AS concluidas,
                  count(*) FILTER (WHERE archived_at IS NOT NULL)::int AS arquivadas
                FROM tarefas
                """,
                (self.usuario_id,),
            )
            row = cur.fetchone() or {}
        return {key: int(row.get(key) or 0) for key in ("todas", "minhas", "atrasadas", "para_hoje", "proximas", "bloqueadas", "concluidas", "arquivadas")}

    def tarefa_statuses(self) -> list[dict[str, Any]]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_statuses WHERE ativo ORDER BY ordem")
            return [dict(row) for row in cur.fetchall()]

    def obter_tarefa(self, tarefa_id: str) -> dict[str, Any]:
        rows = self.list_tarefas(filters={"id": tarefa_id, "include_archived": "true"})
        if not rows:
            raise NotFoundError("Tarefa nao encontrada")
        tarefa = rows[0]
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_subtarefas WHERE tarefa_id = %s ORDER BY ordem, criado_em", (tarefa_id,))
            tarefa["subtarefas"] = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT * FROM tarefa_checklist_itens WHERE tarefa_id = %s ORDER BY ordem, criado_em", (tarefa_id,))
            tarefa["checklist"] = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT * FROM tarefa_comentarios WHERE tarefa_id = %s AND excluido_em IS NULL ORDER BY criado_em", (tarefa_id,))
            tarefa["comentarios"] = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT * FROM tarefa_dependencias WHERE tarefa_id = %s ORDER BY criado_em", (tarefa_id,))
            tarefa["dependencias"] = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT * FROM tarefa_historico WHERE tarefa_id = %s ORDER BY criado_em DESC LIMIT 100", (tarefa_id,))
            tarefa["historico"] = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT * FROM tarefa_status_tempos WHERE tarefa_id = %s ORDER BY status", (tarefa_id,))
            tarefa["tempos_status"] = [dict(row) for row in cur.fetchall()]
            cur.execute(
                """
                SELECT
                  ae.*,
                  rar.slug AS regra_slug,
                  rar.nome AS regra_nome,
                  rar.requer_aprovacao,
                  rar.cria_tarefa,
                  rmt.slug AS movimentacao_tipo_slug,
                  rmt.nome AS movimentacao_tipo_nome,
                  m.descricao AS movimentacao_descricao,
                  m.evento AS movimentacao_evento,
                  m.usuario AS movimentacao_usuario,
                  m.data_hora AS movimentacao_data_hora,
                  p.numero AS numero_processo,
                  p.cliente,
                  p.tribunal,
                  p.area_pasta,
                  p.assunto,
                  p.fase_atual,
                  t2.titulo AS tarefa_titulo,
                  anterior.titulo AS tarefa_anterior_titulo
                FROM radar_automacao_execucoes ae
                JOIN radar_automacao_regras rar ON rar.id = ae.regra_id
                LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rar.tipo_id
                JOIN movimentacoes_novas m ON m.id = ae.movimentacao_id
                JOIN processos p ON p.id = ae.processo_id
                LEFT JOIN tarefas t2 ON t2.id = ae.tarefa_id
                LEFT JOIN tarefas anterior ON anterior.id = ae.tarefa_anterior_id
                WHERE ae.tarefa_anterior_id = %s
                ORDER BY ae.criado_em DESC
                """,
                (tarefa_id,),
            )
            tarefa["proximas_automacoes"] = [dict(row) for row in cur.fetchall()]
        return tarefa

    def criar_tarefa(self, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._normalize_task_payload(data, partial=False)
        fields["created_by"] = self.usuario_id
        fields["updated_by"] = self.usuario_id
        fields["status_changed_by"] = self.usuario_id
        if fields.get("status") == "concluida":
            fields["completed_at"] = fields.get("completed_at") or sql.SQL("now()")
            fields["completed_by"] = self.usuario_id
        cols = [sql.Identifier(key) for key in fields]
        values: list[Any] = []
        placeholders: list[sql.Composable] = []
        for value in fields.values():
            if isinstance(value, sql.SQL):
                placeholders.append(value)
            else:
                placeholders.append(sql.Placeholder())
                values.append(value)
        query = sql.SQL("INSERT INTO tarefas ({}) VALUES ({}) RETURNING *").format(sql.SQL(", ").join(cols), sql.SQL(", ").join(placeholders))
        try:
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute(query, values)
                row = cur.fetchone()
                if row is None:
                    raise RuntimeError("INSERT tarefas sem RETURNING")
                tarefa = dict(row)
                cur.execute(
                    """
                    INSERT INTO tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (tarefa_id, status) DO UPDATE SET ultima_entrada_em = excluded.ultima_entrada_em
                    """,
                    (tarefa["id"], tarefa["status"], tarefa["status_changed_at"]),
                )
                self._task_history(cur, str(tarefa["id"]), "tarefa_criada", novo=tarefa)
        except psycopg.errors.UniqueViolation as exc:
            raise ConflictError("Tarefa duplicada", str(exc)) from exc
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Tarefa referencia recurso inexistente", str(exc)) from exc
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Tarefa viola uma regra de validacao", str(exc)) from exc
        self._audit("tarefas", str(tarefa["id"]), "criar", novo=fields)
        return tarefa

    def _change_task_status(self, cur: Any, row: Mapping[str, Any], next_status: str, *, force: bool = False) -> dict[str, Any]:
        old_status = str(row["status"])
        tarefa_id = str(row["id"])
        if old_status == next_status:
            return dict(row)
        if next_status == "concluida":
            blockers = self._task_pending_blockers(cur, tarefa_id)
            if any(blockers.values()) and not force:
                raise ConflictError("Tarefa possui pendencias antes da conclusao", str(blockers))
        event = "tarefa_concluida" if next_status == "concluida" else ("tarefa_reaberta" if old_status == "concluida" else "status_alterado")
        cur.execute(
            """
            WITH tempo_anterior AS (
              INSERT INTO tarefa_status_tempos (tarefa_id, status, segundos_total)
              VALUES (%s, %s, greatest(0, extract(epoch from (now() - %s::timestamptz)))::bigint)
              ON CONFLICT (tarefa_id, status) DO UPDATE SET
                segundos_total = tarefa_status_tempos.segundos_total + greatest(0, extract(epoch from (now() - %s::timestamptz)))::bigint,
                ultima_entrada_em = null
              RETURNING tarefa_id
            ),
            tempo_novo AS (
              INSERT INTO tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
              VALUES (%s, %s, now())
              ON CONFLICT (tarefa_id, status) DO UPDATE SET ultima_entrada_em = now()
              RETURNING tarefa_id
            ),
            updated AS (
              UPDATE tarefas
              SET status = %s,
                  status_changed_at = now(),
                  status_changed_by = %s,
                  updated_by = %s,
                  completed_at = CASE WHEN %s = 'concluida' THEN now() ELSE NULL END,
                  completed_by = CASE WHEN %s = 'concluida' THEN %s::uuid ELSE NULL END
              WHERE id = %s
              RETURNING *
            ),
            hist AS (
              INSERT INTO tarefa_historico (tarefa_id, usuario_id, evento, valor_antigo, valor_novo)
              SELECT id, %s, %s, %s::jsonb, %s::jsonb
              FROM updated
              RETURNING tarefa_id
            )
            SELECT * FROM updated
            """,
            (
                tarefa_id,
                old_status,
                row["status_changed_at"],
                row["status_changed_at"],
                tarefa_id,
                next_status,
                next_status,
                self.usuario_id,
                self.usuario_id,
                next_status,
                next_status,
                self.usuario_id,
                tarefa_id,
                self.usuario_id,
                event,
                Jsonb(redact_value({"status": old_status})),
                Jsonb(redact_value({"status": next_status})),
            ),
        )
        updated = cur.fetchone()
        if not updated:
            raise NotFoundError("Tarefa nao encontrada")
        updated_dict = dict(updated)
        if next_status == "concluida":
            updated_dict["movimentacoes_atualizadas"] = atualizar_movimentacoes_da_tarefa(
                cur,
                tarefa_id=tarefa_id,
                status_analise="concluida",
                usuario_id=self.usuario_id,
            )
            proxima = encadear_tarefa_concluida(cur, updated_dict, usuario_id=self.usuario_id)
            if proxima:
                updated_dict["radar_proxima_automacao"] = proxima
        elif old_status == "concluida":
            updated_dict["movimentacoes_atualizadas"] = atualizar_movimentacoes_da_tarefa(
                cur,
                tarefa_id=tarefa_id,
                status_analise="em_tarefa",
                usuario_id=self.usuario_id,
            )
        return updated_dict

    def atualizar_tarefa(self, tarefa_id: str, data: Mapping[str, Any], *, force: bool = False) -> dict[str, Any]:
        fields = self._normalize_task_payload(data, partial=True)
        if not fields:
            raise ValidationError("Nenhum campo para atualizar")
        try:
            with self.conn.cursor(row_factory=dict_row) as cur:
                cur.execute("SELECT * FROM tarefas WHERE id = %s FOR UPDATE", (tarefa_id,))
                current = cur.fetchone()
                if not current:
                    raise NotFoundError("Tarefa nao encontrada")
                current_dict = dict(current)
                next_status = fields.pop("status", None)
                changed_fields: dict[str, Any] = {}
                updated = current_dict
                if fields:
                    fields["updated_by"] = self.usuario_id
                    assignments = [sql.SQL("{} = %s").format(sql.Identifier(key)) for key in fields]
                    cur.execute(
                        sql.SQL("UPDATE tarefas SET {} WHERE id = %s RETURNING *").format(sql.SQL(", ").join(assignments)),
                        [*fields.values(), tarefa_id],
                    )
                    row = cur.fetchone()
                    if not row:
                        raise NotFoundError("Tarefa nao encontrada")
                    updated = dict(row)
                    changed_fields = fields
                    for key in ("responsavel", "responsavel_id", "prazo", "prioridade", "titulo", "descricao"):
                        if key in fields and current_dict.get(key) != fields[key]:
                            self._task_history(cur, tarefa_id, f"{key}_alterado", antigo={key: current_dict.get(key)}, novo={key: fields[key]})
                if next_status:
                    updated = self._change_task_status(cur, updated, str(next_status), force=force)
                if changed_fields:
                    self._task_history(cur, tarefa_id, "tarefa_atualizada", antigo={k: current_dict.get(k) for k in changed_fields}, novo=changed_fields)
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Tarefa referencia recurso inexistente", str(exc)) from exc
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Tarefa viola uma regra de validacao", str(exc)) from exc
        self._audit("tarefas", tarefa_id, "atualizar", novo=data)
        return updated

    def alterar_status_tarefa(self, tarefa_id: str, status: str, *, force: bool = False) -> dict[str, Any]:
        next_status = self._normalize_task_status(status, default="a_fazer")
        if next_status is None:
            raise ValidationError("Status de tarefa invalido")
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefas WHERE id = %s FOR UPDATE", (tarefa_id,))
            current = cur.fetchone()
            if not current:
                raise NotFoundError("Tarefa nao encontrada")
            updated = self._change_task_status(cur, dict(current), next_status, force=force)
        self._audit("tarefas", tarefa_id, "alterar_status", antigo={"status": current["status"]}, novo={"status": next_status})
        return updated

    def arquivar_tarefa(self, tarefa_id: str) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefas WHERE id = %s FOR UPDATE", (tarefa_id,))
            current = cur.fetchone()
            if not current:
                raise NotFoundError("Tarefa nao encontrada")
            cur.execute(
                """
                UPDATE tarefas
                SET archived_at = coalesce(archived_at, now()),
                    archived_by = coalesce(archived_by, %s),
                    updated_by = %s
                WHERE id = %s
                RETURNING *
                """,
                (self.usuario_id, self.usuario_id, tarefa_id),
            )
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE tarefas sem RETURNING")
            updated = dict(updated_row)
            self._task_history(cur, tarefa_id, "tarefa_arquivada", antigo={"archived_at": current["archived_at"]}, novo={"archived_at": updated["archived_at"]})
        self._audit("tarefas", tarefa_id, "arquivar")
        return updated

    def restaurar_tarefa(self, tarefa_id: str) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefas WHERE id = %s FOR UPDATE", (tarefa_id,))
            current = cur.fetchone()
            if not current:
                raise NotFoundError("Tarefa nao encontrada")
            cur.execute(
                """
                UPDATE tarefas
                SET archived_at = null,
                    archived_by = null,
                    updated_by = %s
                WHERE id = %s
                RETURNING *
                """,
                (self.usuario_id, tarefa_id),
            )
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE tarefas sem RETURNING")
            updated = dict(updated_row)
            self._task_history(cur, tarefa_id, "tarefa_restaurada", antigo={"archived_at": current["archived_at"]}, novo={"archived_at": None})
        self._audit("tarefas", tarefa_id, "restaurar")
        return updated

    def excluir_tarefa(self, tarefa_id: str, *, permanent: bool = False) -> dict[str, Any] | None:
        if not permanent:
            return self.arquivar_tarefa(tarefa_id)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefas WHERE id = %s FOR UPDATE", (tarefa_id,))
            current = cur.fetchone()
            if not current:
                raise NotFoundError("Tarefa nao encontrada")
            if current["origem"] != "manual" and current["archived_at"] is None:
                raise ConflictError("Arquive a tarefa antes da exclusao permanente")
            cur.execute("DELETE FROM tarefas WHERE id = %s", (tarefa_id,))
        self._audit("tarefas", tarefa_id, "excluir_permanente", antigo=dict(current))
        return None

    def criar_tarefa_checklist(self, tarefa_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._validate_fields("tarefa_checklist_itens", {"tarefa_id": tarefa_id, **data}, partial=False)
        if not str(fields.get("titulo") or "").strip():
            raise ValidationError("Titulo do item e obrigatorio")
        fields["titulo"] = str(fields["titulo"]).strip()
        if "ordem" not in fields:
            with self.conn.cursor() as cur:
                cur.execute("SELECT coalesce(max(ordem), -1) + 1 FROM tarefa_checklist_itens WHERE tarefa_id = %s", (tarefa_id,))
                ordem_row = cur.fetchone()
                if ordem_row is None:
                    raise RuntimeError("SELECT ordem checklist sem resultado")
                fields["ordem"] = ordem_row[0]
        fields["criado_por"] = self.usuario_id
        fields["atualizado_por"] = self.usuario_id
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO tarefa_checklist_itens (tarefa_id, titulo, concluido, ordem, criado_por, atualizado_por)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (fields["tarefa_id"], fields["titulo"], bool(fields.get("concluido", False)), fields["ordem"], self.usuario_id, self.usuario_id),
            )
            created_row = cur.fetchone()
            if created_row is None:
                raise RuntimeError("INSERT tarefa_checklist_itens sem RETURNING")
            row = dict(created_row)
            self._task_history(cur, tarefa_id, "checklist_atualizado", novo=row)
        return row

    def atualizar_tarefa_checklist(self, item_id: str, data: Mapping[str, Any], *, tarefa_id: str | None = None) -> dict[str, Any]:
        allowed = {"titulo", "concluido", "ordem"}
        fields = {key: value for key, value in data.items() if key in allowed}
        if not fields:
            raise ValidationError("Nenhum campo para atualizar")
        fields["atualizado_por"] = self.usuario_id
        assignments = [sql.SQL("{} = %s").format(sql.Identifier(key)) for key in fields]
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_checklist_itens WHERE id = %s FOR UPDATE", (item_id,))
            old = cur.fetchone()
            if not old:
                raise NotFoundError("Item de checklist nao encontrado")
            if tarefa_id is not None and str(old["tarefa_id"]) != str(tarefa_id):
                raise NotFoundError("Item de checklist nao pertence a esta tarefa")
            cur.execute(
                sql.SQL("UPDATE tarefa_checklist_itens SET {} WHERE id = %s RETURNING *").format(sql.SQL(", ").join(assignments)),
                [*fields.values(), item_id],
            )
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE tarefa_checklist_itens sem RETURNING")
            row = dict(updated_row)
            self._task_history(cur, str(row["tarefa_id"]), "checklist_atualizado", antigo=dict(old), novo=row)
        return row

    def remover_tarefa_checklist(self, item_id: str, *, tarefa_id: str | None = None) -> None:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_checklist_itens WHERE id = %s FOR UPDATE", (item_id,))
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Item de checklist nao encontrado")
            if tarefa_id is not None and str(row["tarefa_id"]) != str(tarefa_id):
                raise NotFoundError("Item de checklist nao pertence a esta tarefa")
            cur.execute("DELETE FROM tarefa_checklist_itens WHERE id = %s", (item_id,))
            self._task_history(cur, str(row["tarefa_id"]), "checklist_atualizado", antigo=dict(row), novo={"removido": True})

    def criar_subtarefa(self, tarefa_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._validate_fields("tarefa_subtarefas", {"tarefa_id": tarefa_id, **data}, partial=False)
        if not str(fields.get("titulo") or "").strip():
            raise ValidationError("Titulo da subtarefa e obrigatorio")
        fields["titulo"] = str(fields["titulo"]).strip()
        fields["status"] = self._normalize_task_status(fields.get("status"), default="a_fazer")
        fields["prioridade"] = self._normalize_task_priority(fields.get("prioridade"), default="normal")
        if fields["status"] == "concluida":
            fields["completed_at"] = datetime.now(timezone.utc)
            fields["completed_by"] = self.usuario_id
        fields["criado_por"] = self.usuario_id
        fields["atualizado_por"] = self.usuario_id
        cols = [sql.Identifier(key) for key in fields]
        placeholders = [sql.Placeholder()] * len(fields)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                sql.SQL("INSERT INTO tarefa_subtarefas ({}) VALUES ({}) RETURNING *").format(sql.SQL(", ").join(cols), sql.SQL(", ").join(placeholders)),
                list(fields.values()),
            )
            created_row = cur.fetchone()
            if created_row is None:
                raise RuntimeError("INSERT tarefa_subtarefas sem RETURNING")
            row = dict(created_row)
            self._task_history(cur, tarefa_id, "subtarefa_criada", novo=row)
        return row

    def atualizar_subtarefa(self, subtarefa_id: str, data: Mapping[str, Any], *, tarefa_id: str | None = None) -> dict[str, Any]:
        allowed = WRITE_FIELDS["tarefa_subtarefas"] - {"tarefa_id"}
        fields = {key: value for key, value in data.items() if key in allowed}
        if "status" in fields:
            fields["status"] = self._normalize_task_status(fields["status"], default="a_fazer")
            if fields["status"] == "concluida":
                fields["completed_at"] = sql.SQL("now()")
                fields["completed_by"] = self.usuario_id
            else:
                fields["completed_at"] = None
                fields["completed_by"] = None
        if "prioridade" in fields:
            fields["prioridade"] = self._normalize_task_priority(fields["prioridade"], default="normal")
        if not fields:
            raise ValidationError("Nenhum campo para atualizar")
        fields["atualizado_por"] = self.usuario_id
        assignments: list[sql.Composable] = []
        values: list[Any] = []
        for key, value in fields.items():
            if isinstance(value, sql.SQL):
                assignments.append(sql.SQL("{} = {}").format(sql.Identifier(key), value))
            else:
                assignments.append(sql.SQL("{} = %s").format(sql.Identifier(key)))
                values.append(value)
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_subtarefas WHERE id = %s FOR UPDATE", (subtarefa_id,))
            old = cur.fetchone()
            if not old:
                raise NotFoundError("Subtarefa nao encontrada")
            if tarefa_id is not None and str(old["tarefa_id"]) != str(tarefa_id):
                raise NotFoundError("Subtarefa nao pertence a esta tarefa")
            cur.execute(
                sql.SQL("UPDATE tarefa_subtarefas SET {} WHERE id = %s RETURNING *").format(sql.SQL(", ").join(assignments)),
                [*values, subtarefa_id],
            )
            updated_row = cur.fetchone()
            if updated_row is None:
                raise RuntimeError("UPDATE tarefa_subtarefas sem RETURNING")
            row = dict(updated_row)
            self._task_history(cur, str(row["tarefa_id"]), "subtarefa_atualizada", antigo=dict(old), novo=row)
        return row

    def remover_subtarefa(self, subtarefa_id: str, *, tarefa_id: str | None = None) -> None:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_subtarefas WHERE id = %s FOR UPDATE", (subtarefa_id,))
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Subtarefa nao encontrada")
            if tarefa_id is not None and str(row["tarefa_id"]) != str(tarefa_id):
                raise NotFoundError("Subtarefa nao pertence a esta tarefa")
            cur.execute("DELETE FROM tarefa_subtarefas WHERE id = %s", (subtarefa_id,))
            self._task_history(cur, str(row["tarefa_id"]), "subtarefa_removida", antigo=dict(row))

    def criar_tarefa_comentario(self, tarefa_id: str, conteudo: str) -> dict[str, Any]:
        if not conteudo.strip():
            raise ValidationError("Comentario vazio")
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                INSERT INTO tarefa_comentarios (tarefa_id, autor_id, conteudo)
                VALUES (%s, %s, %s)
                RETURNING *
                """,
                (tarefa_id, self.usuario_id, conteudo.strip()),
            )
            created_row = cur.fetchone()
            if created_row is None:
                raise RuntimeError("INSERT tarefa_comentarios sem RETURNING")
            row = dict(created_row)
            self._task_history(cur, tarefa_id, "comentario_adicionado", novo={"id": str(row["id"])})
        return row

    def excluir_tarefa_comentario(self, comentario_id: str, *, tarefa_id: str | None = None) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            if tarefa_id is not None:
                cur.execute("SELECT tarefa_id FROM tarefa_comentarios WHERE id = %s", (comentario_id,))
                ownership = cur.fetchone()
                if not ownership or str(ownership["tarefa_id"]) != str(tarefa_id):
                    raise NotFoundError("Comentario nao pertence a esta tarefa")
            cur.execute(
                """
                UPDATE tarefa_comentarios
                SET excluido_em = now(), excluido_por = %s
                WHERE id = %s AND excluido_em IS NULL
                RETURNING *
                """,
                (self.usuario_id, comentario_id),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Comentario nao encontrado")
            result = dict(row)
            self._task_history(cur, str(result["tarefa_id"]), "comentario_excluido", novo={"id": str(result["id"])})
        return result

    def criar_tarefa_dependencia(self, tarefa_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        fields = self._validate_fields("tarefa_dependencias", {"tarefa_id": tarefa_id, **data}, partial=False)
        fields["criado_por"] = self.usuario_id
        with self.conn.cursor(row_factory=dict_row) as cur:
            try:
                cur.execute(
                    """
                    INSERT INTO tarefa_dependencias (tarefa_id, tarefa_relacionada_id, tipo, criado_por)
                    VALUES (%s, %s, %s, %s)
                    RETURNING *
                    """,
                    (fields["tarefa_id"], fields["tarefa_relacionada_id"], fields["tipo"], self.usuario_id),
                )
            except psycopg.errors.UniqueViolation as exc:
                raise ConflictError("Dependencia ja cadastrada") from exc
            created_row = cur.fetchone()
            if created_row is None:
                raise RuntimeError("INSERT tarefa_dependencias sem RETURNING")
            row = dict(created_row)
            self._task_history(cur, tarefa_id, "dependencia_criada", novo=row)
        return row

    def remover_tarefa_dependencia(self, dependencia_id: str, *, tarefa_id: str | None = None) -> None:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM tarefa_dependencias WHERE id = %s FOR UPDATE", (dependencia_id,))
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Dependencia nao encontrada")
            if tarefa_id is not None and str(row["tarefa_id"]) != str(tarefa_id):
                raise NotFoundError("Dependencia nao pertence a esta tarefa")
            cur.execute("DELETE FROM tarefa_dependencias WHERE id = %s", (dependencia_id,))
            self._task_history(cur, str(row["tarefa_id"]), "dependencia_removida", antigo=dict(row))

    def tarefas_bulk(self, ids: list[str], action: str, payload: Mapping[str, Any] | None = None) -> dict[str, Any]:
        if not ids:
            raise ValidationError("Selecione ao menos uma tarefa")
        if len(ids) > 100:
            raise ValidationError("Acoes em massa aceitam ate 100 tarefas")
        payload = dict(payload or {})
        updated: list[dict[str, Any]] = []
        for tarefa_id in ids:
            if action == "alterar_status":
                updated.append(self.alterar_status_tarefa(tarefa_id, str(payload.get("status") or "a_fazer"), force=bool(payload.get("force"))))
            elif action == "alterar_responsavel":
                updated.append(self.atualizar_tarefa(tarefa_id, {"responsavel": payload.get("responsavel") or None}))
            elif action == "alterar_prioridade":
                updated.append(self.atualizar_tarefa(tarefa_id, {"prioridade": payload.get("prioridade") or "normal"}))
            elif action == "concluir":
                updated.append(self.alterar_status_tarefa(tarefa_id, "concluida", force=bool(payload.get("force"))))
            elif action == "arquivar":
                updated.append(self.arquivar_tarefa(tarefa_id))
            elif action == "restaurar":
                updated.append(self.restaurar_tarefa(tarefa_id))
            else:
                raise ValidationError("Acao em massa invalida")
        return {"atualizadas": updated, "total": len(updated)}

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

    def criar_tarefa_de_movimentacao(self, movimentacao_id: str, titulo: str | None = None, responsavel: str | None = None) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT m.*, p.contrato_id, p.numero, p.cliente
                FROM movimentacoes_novas m
                JOIN processos p ON p.id = m.processo_id
                WHERE m.id = %s
                FOR UPDATE OF m
                """,
                (movimentacao_id,),
            )
            movimento = cur.fetchone()
            if not movimento:
                raise NotFoundError("Movimentacao nao encontrada")
            if movimento["status_analise"] in {"analisada", "concluida", "ignorada"}:
                raise ConflictError("Movimentacao ja foi analisada", str(movimento["status_analise"]))
            cur.execute(
                """
                SELECT t.*
                FROM tarefas t
                JOIN movimentacoes_novas m ON m.tarefa_principal_id = t.id
                WHERE m.processo_id = %s
                  AND m.status_analise = 'em_tarefa'
                  AND t.origem = 'radar_movimentacao'
                  AND t.status <> 'concluida'
                  AND t.archived_at IS NULL
                ORDER BY t.criado_em DESC
                LIMIT 1
                FOR UPDATE OF t
                """,
                (movimento["processo_id"],),
            )
            existing_task = cur.fetchone()
            if existing_task:
                tarefa = dict(existing_task)
                vinculadas = vincular_movimentacoes_pendentes_do_processo(
                    cur,
                    tarefa_id=str(tarefa["id"]),
                    processo_id=str(movimento["processo_id"]),
                    usuario_id=self.usuario_id,
                    movimentacao_id=movimentacao_id,
                )
                if vinculadas:
                    self._task_history(
                        cur,
                        str(tarefa["id"]),
                        "radar_movimentacoes_agrupadas",
                        novo={"movimentacoes": [str(row["id"]) for row in vinculadas]},
                    )
                tarefa["movimentacoes_vinculadas"] = movimentacoes_vinculadas_da_tarefa(cur, str(tarefa["id"]))
                self._audit("movimentacoes_novas", movimentacao_id, "anexar_tarefa_existente", novo=tarefa)
                return tarefa
            task_title = (titulo or "").strip()
            if not task_title:
                resumo = str(movimento["descricao"] or "").strip()
                task_title = f"Analisar movimentacao processual - {movimento['numero']}"
                if resumo:
                    task_title = f"{task_title}: {resumo[:120]}"
            try:
                cur.execute(
                    """
                    INSERT INTO tarefas (
                      titulo, contrato_id, responsavel, origem, movimentacao_id,
                      processo_id, numero_processo, status, prioridade,
                      created_by, updated_by, status_changed_by
                    )
                    VALUES (%s, %s, %s, 'radar_movimentacao', %s, %s, %s, 'a_fazer', 'alta', %s, %s, %s)
                    ON CONFLICT (movimentacao_id) WHERE movimentacao_id IS NOT NULL AND radar_automacao_execucao_id IS NULL DO NOTHING
                    RETURNING *
                    """,
                    (
                        task_title,
                        movimento["contrato_id"],
                        responsavel,
                        movimentacao_id,
                        movimento["processo_id"],
                        movimento["numero"],
                        self.usuario_id,
                        self.usuario_id,
                        self.usuario_id,
                    ),
                )
            except psycopg.errors.UniqueViolation as exc:
                raise ConflictError("Movimentacao ja virou tarefa") from exc
            tarefa_row = cur.fetchone()
            created = tarefa_row is not None
            if tarefa_row is None:
                cur.execute("SELECT * FROM tarefas WHERE movimentacao_id = %s", (movimentacao_id,))
                tarefa_row = cur.fetchone()
            if tarefa_row is None:
                raise RuntimeError("Tarefa da movimentacao nao encontrada apos idempotencia")
            tarefa = dict(tarefa_row)
            vinculadas = vincular_movimentacoes_pendentes_do_processo(
                cur,
                tarefa_id=str(tarefa["id"]),
                processo_id=str(movimento["processo_id"]),
                usuario_id=self.usuario_id,
                movimentacao_id=movimentacao_id,
            )
            if created:
                cur.execute(
                    """
                    INSERT INTO tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (tarefa_id, status) DO NOTHING
                    """,
                    (tarefa["id"], tarefa["status"], tarefa["status_changed_at"]),
                )
                self._task_history(
                    cur,
                    str(tarefa["id"]),
                    "tarefa_criada_por_radar",
                    novo={**tarefa, "movimentacoes_vinculadas": [str(row["id"]) for row in vinculadas]},
                )
            elif vinculadas:
                self._task_history(
                    cur,
                    str(tarefa["id"]),
                    "radar_movimentacoes_agrupadas",
                    novo={"movimentacoes": [str(row["id"]) for row in vinculadas]},
                )
            tarefa["movimentacoes_vinculadas"] = movimentacoes_vinculadas_da_tarefa(cur, str(tarefa["id"]))
        self._audit("movimentacoes_novas", movimentacao_id, "criar_tarefa", novo=tarefa)
        return tarefa

    def ignorar_movimentacao_radar(self, movimentacao_id: str, motivo: str | None = None) -> dict[str, Any]:
        motivo = str(motivo or "").strip() or None
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM movimentacoes_novas WHERE id = %s FOR UPDATE", (movimentacao_id,))
            movimento = cur.fetchone()
            if not movimento:
                raise NotFoundError("Movimentacao nao encontrada")
            if movimento["status_analise"] == "ignorada":
                return dict(movimento)
            if movimento["status_analise"] == "concluida":
                raise ConflictError("Movimentacao ja foi concluida")
            if movimento["status_analise"] == "em_tarefa":
                raise ConflictError("Movimentacao ja esta vinculada a uma tarefa; conclua ou reabra a tarefa vinculada")
            cur.execute(
                """
                UPDATE movimentacoes_novas
                SET status_analise = 'ignorada',
                    status_analise_atualizado_em = now(),
                    ignorada_em = now(),
                    ignorada_por = %s,
                    motivo_ignorada = %s
                WHERE id = %s
                RETURNING *
                """,
                (self.usuario_id, motivo, movimentacao_id),
            )
            updated = cur.fetchone()
            if not updated:
                raise NotFoundError("Movimentacao nao encontrada")
        self._audit("movimentacoes_novas", movimentacao_id, "ignorar", antigo=dict(movimento), novo=dict(updated))
        return dict(updated)

    def listar_movimentacoes_radar(
        self,
        *,
        execucao_id: str | None = None,
        status_analise: str | list[str] | tuple[str, ...] | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        clauses: list[str] = []
        params: list[Any] = []
        if execucao_id:
            clauses.append("m.execucao_id = %s")
            params.append(execucao_id)
        if status_analise:
            statuses = [status_analise] if isinstance(status_analise, str) else list(status_analise)
            statuses = [str(status).strip() for status in statuses if str(status).strip()]
            if statuses:
                clauses.append("m.status_analise = ANY(%s)")
                params.append(statuses)
        where = "WHERE " + " AND ".join(clauses) if clauses else ""
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f"""
                SELECT
                  m.*,
                  p.numero AS numero_processo,
                  p.cliente,
                  p.tribunal,
                  p.area_pasta,
                  p.assunto,
                  p.fase_atual,
                  rc.status AS classificacao_status,
                  rc.metodo AS classificacao_metodo,
                  rc.pontuacao AS classificacao_pontuacao,
                  rc.regras_candidatas AS classificacao_candidatas,
                  rc.detalhes AS classificacao_detalhes,
                  rmt.slug AS movimentacao_tipo_slug,
                  rmt.nome AS movimentacao_tipo_nome,
                  rar.id AS regra_id,
                  rar.slug AS regra_slug,
                  rar.nome AS regra_nome,
                  rae.id AS automacao_execucao_id,
                  rae.status AS automacao_status,
                  rae.payload_tarefa_sugerida,
                  rae.gatilho AS automacao_gatilho,
                  rae.tarefa_anterior_id,
                  rae.aprovado_em,
                  rae.ignorado_em,
                  rae.motivo AS automacao_motivo,
                  t.id AS tarefa_id,
                  t.titulo AS tarefa_titulo,
                  tarefa_anterior.titulo AS tarefa_anterior_titulo
                FROM movimentacoes_novas m
                JOIN processos p ON p.id = m.processo_id
                LEFT JOIN radar_movimentacao_classificacoes rc ON rc.movimentacao_id = m.id
                LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rc.tipo_id
                LEFT JOIN LATERAL (
                  SELECT *
                  FROM radar_automacao_execucoes ae
                  WHERE ae.movimentacao_id = m.id
                  ORDER BY ae.criado_em DESC
                  LIMIT 1
                ) rae ON true
                LEFT JOIN radar_automacao_regras rar ON rar.id = coalesce(rae.regra_id, rc.regra_id)
                LEFT JOIN tarefas t ON t.id = coalesce(m.tarefa_principal_id, rae.tarefa_id, (
                  SELECT tt.id
                  FROM tarefas tt
                  WHERE tt.movimentacao_id = m.id
                  ORDER BY tt.criado_em DESC
                  LIMIT 1
                ))
                LEFT JOIN tarefas tarefa_anterior ON tarefa_anterior.id = rae.tarefa_anterior_id
                {where}
                ORDER BY m.criado_em DESC
                LIMIT %s OFFSET %s
                """,
                (*params, limit, offset),
            )
            return [dict(row) for row in cur.fetchall()]

    def listar_automacoes_radar(
        self,
        *,
        status: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        limit = max(1, min(limit, 500))
        clauses: list[str] = []
        params: list[Any] = []
        if status:
            clauses.append("ae.status = %s")
            params.append(status)
        where = "WHERE " + " AND ".join(clauses) if clauses else ""
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                f"""
                SELECT
                  ae.*,
                  rar.slug AS regra_slug,
                  rar.nome AS regra_nome,
                  rar.requer_aprovacao,
                  rar.cria_tarefa,
                  rmt.slug AS movimentacao_tipo_slug,
                  rmt.nome AS movimentacao_tipo_nome,
                  m.descricao AS movimentacao_descricao,
                  m.evento AS movimentacao_evento,
                  m.usuario AS movimentacao_usuario,
                  m.data_hora AS movimentacao_data_hora,
                  p.numero AS numero_processo,
                  p.cliente,
                  p.tribunal,
                  p.area_pasta,
                  p.assunto,
                  p.fase_atual,
                  t.titulo AS tarefa_titulo,
                  anterior.titulo AS tarefa_anterior_titulo
                FROM radar_automacao_execucoes ae
                JOIN radar_automacao_regras rar ON rar.id = ae.regra_id
                LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rar.tipo_id
                JOIN movimentacoes_novas m ON m.id = ae.movimentacao_id
                JOIN processos p ON p.id = ae.processo_id
                LEFT JOIN tarefas t ON t.id = ae.tarefa_id
                LEFT JOIN tarefas anterior ON anterior.id = ae.tarefa_anterior_id
                {where}
                ORDER BY ae.criado_em DESC
                LIMIT %s OFFSET %s
                """,
                (*params, limit, offset),
            )
            return [dict(row) for row in cur.fetchall()]

    def progresso_radar(self) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                WITH ultima AS MATERIALIZED (
                  SELECT *
                  FROM execucoes_radar
                  ORDER BY iniciada_em DESC
                  LIMIT 1
                ),
                cfg AS MATERIALIZED (
                  SELECT coalesce((SELECT nullif(valor::text, '')::int FROM configuracoes WHERE chave = 'radar_inercia_dias' LIMIT 1), 30) AS inercia_dias
                )
                SELECT jsonb_build_object(
                  'execucao', coalesce((SELECT to_jsonb(u) FROM ultima u), 'null'::jsonb),
                  'status_counts', coalesce((
                    SELECT jsonb_object_agg(status, total)
                    FROM (
                      SELECT status, count(*) AS total
                      FROM resultados_consulta
                      WHERE execucao_id = (SELECT id FROM ultima)
                      GROUP BY status
                    ) c
                  ), '{}'::jsonb),
                  'movimentacoes_novas_total', (
                    SELECT count(*)
                    FROM movimentacoes_novas
                    WHERE execucao_id = (SELECT id FROM ultima)
                  ),
                  'movimentacoes_total', (
                    SELECT count(*)
                    FROM movimentacoes_novas
                  ),
                  'movimentacoes_pendentes_total', (
                    SELECT count(*)
                    FROM movimentacoes_novas
                    WHERE status_analise IN ('pendente', 'em_tarefa')
                  ),
                  'processos_com_pendencias_total', (
                    SELECT count(DISTINCT processo_id)
                    FROM movimentacoes_novas
                    WHERE status_analise IN ('pendente', 'em_tarefa')
                  ),
                  'automacoes_pendentes_total', (
                    SELECT count(*)
                    FROM radar_automacao_execucoes
                    WHERE status = 'aguardando_aprovacao'
                  ),
                  'tarefas_inercia_total', (
                    SELECT count(*)
                    FROM tarefas
                    WHERE origem = 'radar_inercia'
                  ),
                  'parados_total', (
                    SELECT count(*)
                    FROM processos, cfg
                    WHERE ativo IS TRUE
                      AND monitorar IS TRUE
                      AND data_ultimo_andamento IS NOT NULL
                      AND data_ultimo_andamento < current_date - (cfg.inercia_dias * interval '1 day')
                  ),
                  'radar_inercia_dias', (SELECT inercia_dias FROM cfg),
                  'server_time', now()
                ) AS payload
                """
            )
            row = cur.fetchone()
        payload = row["payload"] if row else {}
        return dict(payload or {})

    def resumo_radar(self, *, historico_limit: int = 10, movimentacoes_limit: int = 200, automacoes_limit: int = 100) -> dict[str, Any]:
        historico_limit = max(1, min(historico_limit, 50))
        movimentacoes_limit = max(1, min(movimentacoes_limit, 500))
        automacoes_limit = max(1, min(automacoes_limit, 500))
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                WITH ultima AS MATERIALIZED (
                  SELECT *
                  FROM execucoes_radar
                  ORDER BY iniciada_em DESC
                  LIMIT 1
                )
                SELECT jsonb_build_object(
                  'execucao', coalesce((SELECT to_jsonb(u) FROM ultima u), 'null'::jsonb),
                  'resultados', (
                    SELECT coalesce(jsonb_agg(to_jsonb(r)), '[]'::jsonb)
                    FROM (
                      SELECT
                        id,
                        execucao_id,
                        processo_id,
                        numero_processo,
                        tribunal,
                        consultado_em,
                        status,
                        quantidade_movimentacoes,
                        tem_movimentacao_nova,
                        data_movimentacao_recente,
                        mensagem_erro,
                        tipo_erro,
                        etapa,
                        duracao_segundos
                      FROM resultados_consulta
                      WHERE execucao_id = (SELECT id FROM ultima)
                      ORDER BY consultado_em DESC
                      LIMIT 500
                    ) r
                  ),
                  'historico', (
                    SELECT coalesce(jsonb_agg(to_jsonb(h)), '[]'::jsonb)
                    FROM (
                      SELECT *
                      FROM execucoes_radar
                      ORDER BY iniciada_em DESC
                      LIMIT %s
                    ) h
                  ),
                  'movimentacoes_novas', (
                    SELECT coalesce(jsonb_agg(to_jsonb(mv)), '[]'::jsonb)
                    FROM (
                      SELECT
                        m.*,
                        p.numero AS numero_processo,
                        p.cliente,
                        p.tribunal,
                        p.area_pasta,
                        p.assunto,
                        p.fase_atual,
                        rc.status AS classificacao_status,
                        rc.metodo AS classificacao_metodo,
                        rc.pontuacao AS classificacao_pontuacao,
                        rc.regras_candidatas AS classificacao_candidatas,
                        rc.detalhes AS classificacao_detalhes,
                        rmt.slug AS movimentacao_tipo_slug,
                        rmt.nome AS movimentacao_tipo_nome,
                        rar.id AS regra_id,
                        rar.slug AS regra_slug,
                        rar.nome AS regra_nome,
                        rae.id AS automacao_execucao_id,
                        rae.status AS automacao_status,
                        rae.payload_tarefa_sugerida,
                        rae.gatilho AS automacao_gatilho,
                        rae.tarefa_anterior_id,
                        rae.aprovado_em,
                        rae.ignorado_em,
                        rae.motivo AS automacao_motivo,
                        t.id AS tarefa_id,
                        t.titulo AS tarefa_titulo,
                        tarefa_anterior.titulo AS tarefa_anterior_titulo
                      FROM movimentacoes_novas m
                      JOIN processos p ON p.id = m.processo_id
                      LEFT JOIN radar_movimentacao_classificacoes rc ON rc.movimentacao_id = m.id
                      LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rc.tipo_id
                      LEFT JOIN LATERAL (
                        SELECT *
                        FROM radar_automacao_execucoes ae
                        WHERE ae.movimentacao_id = m.id
                        ORDER BY ae.criado_em DESC
                        LIMIT 1
                      ) rae ON true
                      LEFT JOIN radar_automacao_regras rar ON rar.id = coalesce(rae.regra_id, rc.regra_id)
                      LEFT JOIN tarefas t ON t.id = coalesce(m.tarefa_principal_id, rae.tarefa_id, (
                        SELECT tt.id
                        FROM tarefas tt
                        WHERE tt.movimentacao_id = m.id
                        ORDER BY tt.criado_em DESC
                        LIMIT 1
                      ))
                      LEFT JOIN tarefas tarefa_anterior ON tarefa_anterior.id = rae.tarefa_anterior_id
                      WHERE m.execucao_id = (SELECT id FROM ultima)
                      ORDER BY m.criado_em DESC
                      LIMIT %s
                    ) mv
                  ),
                  'movimentacoes_pendentes', (
                    SELECT coalesce(jsonb_agg(to_jsonb(mv)), '[]'::jsonb)
                    FROM (
                      SELECT
                        m.*,
                        p.numero AS numero_processo,
                        p.cliente,
                        p.tribunal,
                        p.area_pasta,
                        p.assunto,
                        p.fase_atual,
                        rc.status AS classificacao_status,
                        rc.metodo AS classificacao_metodo,
                        rc.pontuacao AS classificacao_pontuacao,
                        rc.regras_candidatas AS classificacao_candidatas,
                        rc.detalhes AS classificacao_detalhes,
                        rmt.slug AS movimentacao_tipo_slug,
                        rmt.nome AS movimentacao_tipo_nome,
                        rar.id AS regra_id,
                        rar.slug AS regra_slug,
                        rar.nome AS regra_nome,
                        rae.id AS automacao_execucao_id,
                        rae.status AS automacao_status,
                        rae.payload_tarefa_sugerida,
                        rae.gatilho AS automacao_gatilho,
                        rae.tarefa_anterior_id,
                        rae.aprovado_em,
                        rae.ignorado_em,
                        rae.motivo AS automacao_motivo,
                        t.id AS tarefa_id,
                        t.titulo AS tarefa_titulo,
                        tarefa_anterior.titulo AS tarefa_anterior_titulo
                      FROM movimentacoes_novas m
                      JOIN processos p ON p.id = m.processo_id
                      LEFT JOIN radar_movimentacao_classificacoes rc ON rc.movimentacao_id = m.id
                      LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rc.tipo_id
                      LEFT JOIN LATERAL (
                        SELECT *
                        FROM radar_automacao_execucoes ae
                        WHERE ae.movimentacao_id = m.id
                        ORDER BY ae.criado_em DESC
                        LIMIT 1
                      ) rae ON true
                      LEFT JOIN radar_automacao_regras rar ON rar.id = coalesce(rae.regra_id, rc.regra_id)
                      LEFT JOIN tarefas t ON t.id = coalesce(m.tarefa_principal_id, rae.tarefa_id, (
                        SELECT tt.id
                        FROM tarefas tt
                        WHERE tt.movimentacao_id = m.id
                        ORDER BY tt.criado_em DESC
                        LIMIT 1
                      ))
                      LEFT JOIN tarefas tarefa_anterior ON tarefa_anterior.id = rae.tarefa_anterior_id
                      WHERE m.status_analise IN ('pendente', 'em_tarefa')
                      ORDER BY m.criado_em DESC
                      LIMIT %s
                    ) mv
                  ),
                  'movimentacoes_pendentes_total', (
                    SELECT count(*)::int
                    FROM movimentacoes_novas
                    WHERE status_analise IN ('pendente', 'em_tarefa')
                  ),
                  'processos_com_pendencias_total', (
                    SELECT count(DISTINCT processo_id)::int
                    FROM movimentacoes_novas
                    WHERE status_analise IN ('pendente', 'em_tarefa')
                  ),
                  'automacoes', (
                    SELECT coalesce(jsonb_agg(to_jsonb(ae_row)), '[]'::jsonb)
                    FROM (
                      SELECT
                        ae.*,
                        rar.slug AS regra_slug,
                        rar.nome AS regra_nome,
                        rar.requer_aprovacao,
                        rar.cria_tarefa,
                        rmt.slug AS movimentacao_tipo_slug,
                        rmt.nome AS movimentacao_tipo_nome,
                        m.descricao AS movimentacao_descricao,
                        m.evento AS movimentacao_evento,
                        m.usuario AS movimentacao_usuario,
                        m.data_hora AS movimentacao_data_hora,
                        p.numero AS numero_processo,
                        p.cliente,
                        p.tribunal,
                        p.area_pasta,
                        p.assunto,
                        p.fase_atual,
                        t.titulo AS tarefa_titulo,
                        anterior.titulo AS tarefa_anterior_titulo
                      FROM radar_automacao_execucoes ae
                      JOIN radar_automacao_regras rar ON rar.id = ae.regra_id
                      LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rar.tipo_id
                      JOIN movimentacoes_novas m ON m.id = ae.movimentacao_id
                      JOIN processos p ON p.id = ae.processo_id
                      LEFT JOIN tarefas t ON t.id = ae.tarefa_id
                      LEFT JOIN tarefas anterior ON anterior.id = ae.tarefa_anterior_id
                      ORDER BY ae.criado_em DESC
                      LIMIT %s
                    ) ae_row
                  ),
                  'tarefas_inercia', (
                    SELECT coalesce(jsonb_agg(to_jsonb(ti)), '[]'::jsonb)
                    FROM (
                      SELECT
                        id,
                        titulo,
                        descricao,
                        contrato_id,
                        origem,
                        processo_id,
                        numero_processo,
                        status,
                        prioridade,
                        radar_inercia_chave,
                        criado_em,
                        atualizado_em,
                        completed_at,
                        archived_at
                      FROM tarefas
                      WHERE origem = 'radar_inercia'
                      ORDER BY criado_em DESC
                      LIMIT 500
                    ) ti
                  ),
                  'processos', (
                    SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
                    FROM (
                      SELECT
                        id,
                        numero,
                        cliente,
                        contrato_id,
                        area_pasta,
                        numero_interno,
                        status_processo,
                        autor,
                        reu,
                        assunto,
                        andamento_atual,
                        monitorar,
                        ativo,
                        tribunal,
                        comarca_vara,
                        fase_atual,
                        data_ultimo_andamento,
                        ultima_consulta_em,
                        ultima_consulta_status,
                        ultima_consulta_inconclusiva,
                        exige_senha,
                        (
                          SELECT count(*)::int
                          FROM movimentacoes_novas mn
                          WHERE mn.processo_id = p.id
                            AND mn.status_analise IN ('pendente', 'em_tarefa')
                        ) AS pendencias_analise_total
                      FROM processos p
                      ORDER BY criado_em DESC
                      LIMIT 500
                    ) p
                  ),
                  'configuracoes', jsonb_build_object(
                    'radar_inercia_dias',
                    coalesce((SELECT nullif(valor::text, '')::int FROM configuracoes WHERE chave = 'radar_inercia_dias' LIMIT 1), 30)
                  )
                ) AS payload
                """,
                (historico_limit, movimentacoes_limit, movimentacoes_limit, automacoes_limit),
            )
            row = cur.fetchone()
        payload = dict(row["payload"] if row else {})
        return payload

    def _radar_execucao_from_row(self, row: Mapping[str, Any]) -> ExecucaoRadarMemoria:
        execucao = ExecucaoRadarMemoria(
            origem=str(row.get("origem") or "agendada"),
            usuario_id=str(row["usuario_id"]) if row.get("usuario_id") else None,
        )
        execucao.total_previstos = int(row.get("total_previstos") or 0)
        execucao.total_consultados = int(row.get("total_consultados") or 0)
        execucao.total_sucesso = int(row.get("total_sucesso") or 0)
        execucao.total_com_movimentacao_nova = int(row.get("total_com_movimentacao_nova") or 0)
        execucao.total_sem_movimentacao = int(row.get("total_sem_movimentacao") or 0)
        execucao.total_senha_necessaria = int(row.get("total_senha_necessaria") or 0)
        execucao.total_nao_localizado = int(row.get("total_nao_localizado") or 0)
        execucao.total_captcha_timeout = int(row.get("total_captcha_timeout") or 0)
        execucao.total_timeout = int(row.get("total_timeout") or 0)
        execucao.total_pendente_implementacao = int(row.get("total_pendente_implementacao") or 0)
        execucao.total_base_inicial_criada = int(row.get("total_base_inicial_criada") or 0)
        execucao.total_numero_invalido = int(row.get("total_numero_invalido") or 0)
        execucao.total_pagina_intermediaria = int(row.get("total_pagina_intermediaria") or 0)
        execucao.total_erro = int(row.get("total_erro") or 0)
        execucao.status = str(row.get("status") or "em_andamento")
        return execucao

    def _radar_senhas_por_ref(self, refs: list[str]) -> dict[str, str]:
        if not refs:
            return {}
        if not self.radar_db_url or not self.radar_password_key:
            return {}
        senhas: dict[str, str] = {}
        with psycopg.connect(self.radar_db_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                for ref in refs:
                    cur.execute("SELECT private.ler_senha_processo(%s, %s) AS senha", (ref, self.radar_password_key))
                    row = cur.fetchone()
                    if row and row.get("senha"):
                        senhas[ref] = str(row["senha"])
        return senhas

    def iniciar_execucao_radar_api(self, origem: str = "agendada") -> dict[str, Any]:
        if origem == "manual":
            origem = "agendada"
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT pg_try_advisory_xact_lock(%s) AS locked", (RADAR_API_ADVISORY_LOCK,))
            lock = cur.fetchone()
            if not lock or not lock["locked"]:
                raise ConflictError("Radar ja esta em execucao", "advisory_lock")
            atualizar_rodadas_interrompidas(self.conn)
            cur.execute(
                """
                SELECT id, iniciada_em, heartbeat_em
                FROM execucoes_radar
                WHERE status = 'em_andamento'
                  AND finalizada_em IS NULL
                  AND heartbeat_em >= now() - interval '5 minutes'
                ORDER BY iniciada_em DESC
                LIMIT 1
                """
            )
            active = cur.fetchone()
            if active:
                raise ConflictError("Radar ja esta em execucao", str(active["id"]))
            cur.execute(
                """
                SELECT *
                FROM processos
                WHERE ativo IS TRUE
                  AND monitorar IS TRUE
                ORDER BY criado_em, numero
                LIMIT 500
                """
            )
            processos = [dict(row) for row in cur.fetchall()]
            cur.execute("SELECT valor FROM configuracoes WHERE chave = 'radar_inercia_dias' LIMIT 1")
            config_row = cur.fetchone()

        refs = [str(row["senha_ref"]) for row in processos if row.get("senha_ref")]
        senhas = self._radar_senhas_por_ref(refs)
        execucao = iniciar_execucao_radar(self.conn, origem=origem, total_previstos=len(processos), usuario_id=self.usuario_id)
        try:
            radar_inercia_dias = int((config_row or {}).get("valor") or 30)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Configuracao radar_inercia_dias invalida") from exc
        safe_processos: list[dict[str, Any]] = []
        for row in processos:
            senha_ref = row.get("senha_ref")
            safe_processos.append(
                {
                    "id": row.get("id"),
                    "numero": row.get("numero"),
                    "tribunal": row.get("tribunal"),
                    "cliente": row.get("cliente"),
                    "contrato_id": row.get("contrato_id"),
                    "chaves_movimentacoes": row.get("chaves_movimentacoes") or [],
                    "exige_senha": bool(row.get("exige_senha")),
                    "senha": senhas.get(str(senha_ref)) if senha_ref else None,
                    "data_ultimo_andamento": row.get("data_ultimo_andamento"),
                    "ultima_consulta_inconclusiva": bool(row.get("ultima_consulta_inconclusiva")),
                }
            )
        self._audit("execucoes_radar", str(execucao["id"]), "iniciar_api", novo={"origem": origem, "total_previstos": len(processos)})
        return {"execucao": execucao, "processos": safe_processos, "radar_inercia_dias": radar_inercia_dias}

    def _parse_datetime(self, value: Any) -> datetime | None:
        if value is None or isinstance(value, datetime):
            return value
        if isinstance(value, str) and value.strip():
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00"))
            except ValueError:
                return None
        return None

    def _parse_date(self, value: Any) -> date | None:
        if value is None or isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        if isinstance(value, str) and value.strip():
            try:
                return date.fromisoformat(value[:10])
            except ValueError:
                return None
        return None

    def registrar_resultado_radar_api(self, execucao_id: str, data: Mapping[str, Any]) -> dict[str, Any]:
        processo_id = data.get("processo_id")
        if not processo_id:
            raise ValidationError("processo_id obrigatorio")
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM execucoes_radar WHERE id = %s LIMIT 1", (execucao_id,))
            execucao_row = cur.fetchone()
            if not execucao_row:
                raise NotFoundError("Execucao do Radar nao encontrada")
            if execucao_row["status"] != "em_andamento":
                raise ConflictError("Execucao do Radar nao esta em andamento", str(execucao_row["status"]))
            cur.execute("SELECT * FROM processos WHERE id = %s LIMIT 1", (processo_id,))
            processo_row = cur.fetchone()
            if not processo_row:
                raise NotFoundError("Processo nao encontrado")
            cur.execute(
                """
                SELECT 1
                FROM resultados_consulta
                WHERE execucao_id = %s
                  AND processo_id = %s
                LIMIT 1
                """,
                (execucao_id, processo_id),
            )
            if cur.fetchone():
                raise ConflictError("Resultado do processo ja registrado nesta execucao")
            cur.execute("SELECT valor FROM configuracoes WHERE chave = 'radar_inercia_dias' LIMIT 1")
            config_row = cur.fetchone()

        movimentos = com_chaves(
            [
                Movimentacao(
                    data_hora=movimento.get("data_hora"),
                    descricao=str(movimento.get("descricao") or ""),
                    evento=movimento.get("evento"),
                    usuario=movimento.get("usuario"),
                    chave=str(movimento.get("chave") or ""),
                )
                for movimento in data.get("movimentacoes") or []
                if isinstance(movimento, Mapping)
            ]
        )
        status = data.get("status")
        if status not in {
            "sucesso",
            "nao_localizado",
            "numero_invalido",
            "senha_necessaria",
            "captcha_timeout",
            "pagina_intermediaria",
            "timeout",
            "erro",
            "pendente_implementacao",
            "base_inicial_criada",
        }:
            raise ValidationError("Status de consulta invalido")
        processo = ProcessoMonitorado(
            id=str(processo_row["id"]),
            numero=str(processo_row["numero"]),
            tribunal=str(processo_row["tribunal"]),
            chaves_movimentacoes=tuple(data.get("chaves_movimentacoes") or [mov.chave for mov in movimentos if mov.chave]),
            exige_senha=bool(processo_row.get("exige_senha")),
            senha_ref=processo_row.get("senha_ref"),
            data_ultimo_andamento=self._parse_date(data.get("data_ultimo_andamento")) or processo_row.get("data_ultimo_andamento"),
            ultima_consulta_inconclusiva=bool(data.get("ultima_consulta_inconclusiva") or processo_row.get("ultima_consulta_inconclusiva")),
        )
        resultado = ResultadoConsulta(
            numero_processo=str(data.get("numero_processo") or processo_row["numero"]),
            tribunal=str(data.get("tribunal") or processo_row["tribunal"]),
            status=status,  # type: ignore[arg-type]
            movimentacoes=movimentos,
            quantidade_movimentacoes=int(data.get("quantidade_movimentacoes") or len(movimentos)),
            layout_movimentacoes=data.get("layout_movimentacoes"),
            url_resultado=data.get("url_resultado"),
            mensagem_erro=data.get("mensagem_erro"),
            tipo_erro=data.get("tipo_erro"),
            etapa=data.get("etapa"),  # type: ignore[arg-type]
            consultado_em=self._parse_datetime(data.get("consultado_em")),
            duracao_segundos=data.get("duracao_segundos"),
            tem_movimentacao_nova=bool(data.get("tem_movimentacao_nova")),
        )
        execucao = self._radar_execucao_from_row(dict(execucao_row))
        registrar_resultado(execucao, resultado)
        resultado_row = persistir_resultado_radar(
            self.conn,
            execucao_id=execucao_id,
            resultado=resultado,
            processo=processo,
            processo_row=dict(processo_row),
            execucao=execucao,
        )
        try:
            radar_inercia_dias = int((config_row or {}).get("valor") or 30)
        except (TypeError, ValueError) as exc:
            raise ValidationError("Configuracao radar_inercia_dias invalida") from exc
        tarefa_inercia = criar_tarefa_inercia_se_aplicavel(
            self.conn,
            processo=processo,
            processo_row=dict(processo_row),
            dias_limite=radar_inercia_dias,
        )
        if tarefa_inercia is not None:
            resultado_row["tarefa_inercia_id"] = tarefa_inercia.get("id")
            resultado_row["dias_sem_movimentacao"] = dias_sem_movimentacao(
                ProcessoInercia(
                    id=processo.id,
                    numero=processo.numero,
                    data_ultimo_andamento=self._parse_date(processo.data_ultimo_andamento),
                    ultima_consulta_inconclusiva=processo.ultima_consulta_inconclusiva,
                    tribunal=processo.tribunal,
                ),
                date.today(),
            )
        self._audit("resultados_consulta", str(resultado_row["id"]), "registrar_api", novo={"execucao_id": execucao_id, "processo_id": str(processo_id), "status": status})
        return resultado_row

    def finalizar_execucao_radar_api(self, execucao_id: str, status: str | None = None) -> dict[str, Any]:
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM execucoes_radar WHERE id = %s LIMIT 1", (execucao_id,))
            execucao_row = cur.fetchone()
            if not execucao_row:
                raise NotFoundError("Execucao do Radar nao encontrada")
            if execucao_row["status"] != "em_andamento":
                raise ConflictError("Execucao do Radar ja foi finalizada", str(execucao_row["status"]))
        execucao = self._radar_execucao_from_row(dict(execucao_row))
        final_status = status or classificar_execucao(execucao)
        if final_status not in {"concluida", "falhou_parcialmente", "interrompida"}:
            raise ValidationError("Status final de execucao invalido")
        row = finalizar_execucao_radar(self.conn, execucao_id=execucao_id, status=final_status)
        self._audit("execucoes_radar", execucao_id, "finalizar_api", novo={"status": final_status})
        return row

    def aprovar_automacao_radar(self, execucao_id: str, data: Mapping[str, Any] | None = None) -> dict[str, Any]:
        allowed = {"titulo", "descricao", "prazo", "prioridade", "responsavel", "responsavel_id", "tarefa_origem_id"}
        payload = {key: value for key, value in dict(data or {}).items() if key in allowed}
        if "prioridade" in payload and payload["prioridade"] is not None:
            payload["prioridade"] = self._normalize_task_priority(payload["prioridade"], default="alta")
        try:
            result = aprovar_execucao_automacao(
                self.conn,
                execucao_id=execucao_id,
                usuario_id=self.usuario_id,
                overrides=payload,
            )
        except LookupError as exc:
            raise NotFoundError("Automacao nao encontrada") from exc
        except ValueError as exc:
            code = str(exc)
            if code == "motivo_obrigatorio":
                raise ValidationError("Motivo obrigatorio") from exc
            raise ConflictError("Automacao ja foi decidida", code) from exc
        except psycopg.errors.UniqueViolation as exc:
            raise ConflictError("Automacao ja criou tarefa") from exc
        except psycopg.errors.ForeignKeyViolation as exc:
            raise ValidationError("Automacao referencia recurso inexistente", str(exc)) from exc
        except psycopg.errors.CheckViolation as exc:
            raise ValidationError("Automacao viola uma regra de validacao", str(exc)) from exc
        self._audit("radar_automacao_execucoes", execucao_id, "aprovar", novo=result)
        return result

    def ignorar_automacao_radar(self, execucao_id: str, motivo: str) -> dict[str, Any]:
        try:
            result = ignorar_execucao_automacao(
                self.conn,
                execucao_id=execucao_id,
                usuario_id=self.usuario_id,
                motivo=motivo,
            )
        except LookupError as exc:
            raise NotFoundError("Automacao nao encontrada") from exc
        except ValueError as exc:
            code = str(exc)
            if code == "motivo_obrigatorio":
                raise ValidationError("Motivo obrigatorio") from exc
            raise ConflictError("Automacao ja foi decidida", code) from exc
        self._audit("radar_automacao_execucoes", execucao_id, "ignorar", novo=result)
        return result

    def registrar_senha_processo(self, processo_id: str, senha: str) -> dict[str, Any]:
        if not senha or not senha.strip():
            raise ValidationError("Senha do processo nao pode ficar vazia", "senha_vazia")
        if not self.radar_password_key or len(self.radar_password_key) < 32:
            raise ValidationError("RADAR_PASSWORD_KEY nao configurada para salvar senha processual", "vault_config")
        with self.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT *
                FROM private.salvar_senha_processo(%s, %s, %s)
                """,
                (processo_id, senha.strip(), self.radar_password_key),
            )
            row = cur.fetchone()
            if not row:
                raise NotFoundError("Processo nao encontrado")
        self._audit("processos", processo_id, "registrar_senha", novo={"senha_cadastrada": True})
        return dict(row)
