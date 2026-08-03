from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any, Mapping

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.radar.movement_queue import vincular_movimentacoes_pendentes_do_processo


CLASSIFICATION_METHOD = "regras_deterministicas"
DEFAULT_AUTOMATION_STATUS = "backlog"


@dataclass(frozen=True)
class PatternMatch:
    matched: bool
    score: int
    detail: dict[str, Any]


@dataclass(frozen=True)
class Classification:
    status: str
    score: float | None
    rule: dict[str, Any] | None
    candidates: list[dict[str, Any]]
    details: dict[str, Any]


def normalizar_texto(value: Any) -> str:
    raw = str(value or "").casefold().strip()
    normalized = unicodedata.normalize("NFKD", raw)
    without_accents = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return re.sub(r"\s+", " ", without_accents).strip()


def movement_normalized_text(movimento: Mapping[str, Any]) -> str:
    return normalizar_texto(" ".join(str(movimento.get(key) or "") for key in ("descricao", "evento", "usuario")))


def _split_terms(value: Any) -> list[str]:
    return [term for term in re.split(r"\s+", normalizar_texto(value)) if term]


def _pattern_target(pattern: Mapping[str, Any], movimento: Mapping[str, Any]) -> str:
    campo = str(pattern.get("campo") or "descricao")
    return normalizar_texto(movimento.get(campo) or "")


def _match_pattern(pattern: Mapping[str, Any], movimento: Mapping[str, Any]) -> PatternMatch:
    target = _pattern_target(pattern, movimento)
    operator = str(pattern.get("operador") or "contains")
    value = str(pattern.get("valor") or "")
    normalized_value = normalizar_texto(value)
    detail = {
        "campo": pattern.get("campo"),
        "operador": operator,
        "valor": value,
        "obrigatorio": bool(pattern.get("obrigatorio")),
    }
    try:
        if operator == "contains":
            matched = bool(normalized_value and normalized_value in target)
        elif operator == "all_terms":
            terms = _split_terms(value)
            matched = bool(terms) and all(term in target for term in terms)
        elif operator == "any_terms":
            terms = _split_terms(value)
            matched = bool(terms) and any(term in target for term in terms)
        elif operator == "regex":
            matched = bool(normalized_value and re.search(normalized_value, target, flags=re.IGNORECASE))
        else:
            return PatternMatch(False, 0, {**detail, "erro": "operador_desconhecido"})
    except re.error as exc:
        return PatternMatch(False, 0, {**detail, "erro": f"regex_invalida: {exc}"})
    return PatternMatch(matched, int(pattern.get("peso") or 1) if matched else 0, detail)


def _rule_context_matches(rule: Mapping[str, Any], processo: Mapping[str, Any] | None) -> bool:
    processo = processo or {}
    tribunal = rule.get("tribunal")
    if tribunal and normalizar_texto(tribunal) != normalizar_texto(processo.get("tribunal")):
        return False
    area = rule.get("area_juridica")
    if area:
        area_target = normalizar_texto(" ".join(str(processo.get(key) or "") for key in ("area_pasta", "assunto")))
        if normalizar_texto(area) not in area_target:
            return False
    fase = rule.get("fase_processual")
    if fase:
        fase_target = normalizar_texto(" ".join(str(processo.get(key) or "") for key in ("fase_atual", "status_processo")))
        if normalizar_texto(fase) not in fase_target:
            return False
    return True


def classificar_movimentacao(
    movimento: Mapping[str, Any],
    processo: Mapping[str, Any] | None,
    rules: list[dict[str, Any]],
) -> Classification:
    if not str(movimento.get("id") or "").strip() or not str(movimento.get("processo_id") or "").strip():
        return Classification(
            status="erro",
            score=None,
            rule=None,
            candidates=[],
            details={"motivo": "movimentacao_sem_identificadores_minimos"},
        )
    if not any(str(movimento.get(key) or "").strip() for key in ("descricao", "evento", "usuario")):
        return Classification(
            status="erro",
            score=None,
            rule=None,
            candidates=[],
            details={"motivo": "movimentacao_sem_texto_classificavel"},
        )

    candidates: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    for rule in rules:
        if not rule.get("ativa", False) or not _rule_context_matches(rule, processo):
            continue
        patterns = [p for p in (rule.get("padroes") or []) if p.get("ativo", True)]
        if not patterns:
            continue
        score = 0
        matched_details: list[dict[str, Any]] = []
        missing_required = False
        for pattern in patterns:
            result = _match_pattern(pattern, movimento)
            if result.detail.get("erro"):
                errors.append({"regra_id": str(rule.get("id")), **result.detail})
            if result.matched:
                score += result.score
                matched_details.append(result.detail)
            elif pattern.get("obrigatorio"):
                missing_required = True
        if score > 0 and not missing_required:
            candidates.append(
                {
                    "regra_id": str(rule["id"]),
                    "slug": rule.get("slug"),
                    "nome": rule.get("nome"),
                    "tipo_id": str(rule["tipo_id"]) if rule.get("tipo_id") else None,
                    "tipo_slug": rule.get("tipo_slug"),
                    "pontuacao": score,
                    "versao": int(rule.get("versao") or 1),
                    "cria_tarefa": bool(rule.get("cria_tarefa", True)),
                    "requer_aprovacao": bool(rule.get("requer_aprovacao", True)),
                    "padroes": matched_details,
                }
            )

    if errors and not candidates:
        return Classification(status="erro", score=None, rule=None, candidates=[], details={"erros": errors})
    if not candidates:
        return Classification(status="nao_reconhecida", score=0.0, rule=None, candidates=[], details={"motivo": "sem_regra_ativa"})

    candidates.sort(key=lambda item: (item["pontuacao"], item["slug"] or ""), reverse=True)
    top_score = candidates[0]["pontuacao"]
    top_candidates = [item for item in candidates if item["pontuacao"] == top_score]
    if len(top_candidates) > 1:
        return Classification(status="ambigua", score=float(top_score), rule=None, candidates=candidates, details={"motivo": "empate_de_regras"})

    selected = candidates[0]
    selected_rule = next(rule for rule in rules if str(rule["id"]) == selected["regra_id"])
    return Classification(
        status="reconhecida",
        score=float(top_score),
        rule=selected_rule,
        candidates=candidates,
        details={"motivo": "regra_unica_encontrada", "padroes": selected.get("padroes", [])},
    )


def _fetch_active_rules(conn) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            SELECT
              r.*,
              t.slug AS tipo_slug,
              t.nome AS tipo_nome,
              coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', p.id,
                    'campo', p.campo,
                    'operador', p.operador,
                    'valor', p.valor,
                    'peso', p.peso,
                    'obrigatorio', p.obrigatorio,
                    'ordem', p.ordem,
                    'ativo', p.ativo
                  )
                  ORDER BY p.ordem, p.criado_em
                ) FILTER (WHERE p.id IS NOT NULL),
                '[]'::jsonb
              ) AS padroes
            FROM radar_automacao_regras r
            LEFT JOIN radar_movimentacao_tipos t ON t.id = r.tipo_id
            LEFT JOIN radar_automacao_padroes p ON p.regra_id = r.id
            WHERE r.ativa IS TRUE
              AND coalesce(t.ativo, true) IS TRUE
            GROUP BY r.id, t.slug, t.nome
            ORDER BY r.slug, r.versao DESC
            """
        )
        return [dict(row) for row in cur.fetchall()]


def _fetch_movimento(conn, movimentacao_id: str) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM movimentacoes_novas WHERE id = %s", (movimentacao_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def _fetch_processo(conn, processo_id: str) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("SELECT * FROM processos WHERE id = %s", (processo_id,))
        row = cur.fetchone()
        return dict(row) if row else None


def _render_template(template: str, movimento: Mapping[str, Any], processo: Mapping[str, Any] | None) -> str:
    processo = processo or {}
    values = {
        "numero_processo": processo.get("numero") or movimento.get("numero_processo") or "",
        "cliente": processo.get("cliente") or "",
        "descricao": movimento.get("descricao") or "",
        "evento": movimento.get("evento") or "",
        "usuario": movimento.get("usuario") or "",
        "data_hora": movimento.get("data_hora") or "",
    }
    text = template or ""
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", str(value))
    return text.strip()


def _suggested_task_payload(rule: Mapping[str, Any], movimento: Mapping[str, Any], processo: Mapping[str, Any] | None) -> dict[str, Any]:
    prazo_dias = rule.get("prazo_dias")
    prazo = None
    if prazo_dias is not None:
        prazo = (date.today() + timedelta(days=int(prazo_dias))).isoformat()
    return {
        "titulo": _render_template(str(rule.get("titulo_template") or ""), movimento, processo),
        "descricao": _render_template(str(rule.get("descricao_template") or ""), movimento, processo),
        "prazo": prazo,
        "prioridade": rule.get("prioridade") or "alta",
        "responsavel": rule.get("responsavel"),
        "responsavel_id": str(rule["responsavel_id"]) if rule.get("responsavel_id") else None,
    }


def _valid_initial_task_status(cur) -> str:
    cur.execute(
        """
        SELECT slug
        FROM tarefa_statuses
        WHERE ativo IS TRUE
          AND slug IN ('backlog', 'a_fazer')
        ORDER BY CASE slug WHEN 'backlog' THEN 0 ELSE 1 END
        LIMIT 1
        """
    )
    row = cur.fetchone()
    if row:
        return row["slug"] if isinstance(row, Mapping) else row[0]
    return DEFAULT_AUTOMATION_STATUS


def _insert_task_for_execution(
    cur,
    *,
    execucao: Mapping[str, Any],
    regra: Mapping[str, Any],
    movimento: Mapping[str, Any],
    processo: Mapping[str, Any] | None,
    payload: Mapping[str, Any],
    usuario_id: str | None = None,
    tarefa_origem_id: str | None = None,
) -> dict[str, Any]:
    status = _valid_initial_task_status(cur)
    cur.execute(
        """
        INSERT INTO tarefas (
          titulo, descricao, contrato_id, responsavel, responsavel_id, origem,
          movimentacao_id, processo_id, numero_processo, status, prioridade, prazo,
          radar_automacao_execucao_id, radar_regra_id, tarefa_origem_id,
          criada_automaticamente, created_by, updated_by, status_changed_by
        )
        VALUES (%s, %s, %s, %s, %s, 'radar_movimentacao', %s, %s, %s, %s, %s, %s,
                %s, %s, %s, true, %s, %s, %s)
        RETURNING *
        """,
        (
            payload.get("titulo"),
            payload.get("descricao"),
            (processo or {}).get("contrato_id"),
            payload.get("responsavel"),
            payload.get("responsavel_id"),
            movimento["id"],
            movimento["processo_id"],
            (processo or {}).get("numero"),
            status,
            payload.get("prioridade") or regra.get("prioridade") or "alta",
            payload.get("prazo"),
            execucao["id"],
            regra["id"],
            tarefa_origem_id,
            usuario_id,
            usuario_id,
            usuario_id,
        ),
    )
    tarefa = dict(cur.fetchone() or {})
    if not tarefa:
        raise RuntimeError("INSERT tarefas automacao sem RETURNING")
    cur.execute(
        """
        INSERT INTO tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
        VALUES (%s, %s, %s)
        ON CONFLICT (tarefa_id, status) DO UPDATE SET ultima_entrada_em = excluded.ultima_entrada_em
        """,
        (tarefa["id"], tarefa["status"], tarefa["status_changed_at"]),
    )
    cur.execute(
        """
        INSERT INTO tarefa_historico (tarefa_id, usuario_id, evento, valor_novo)
        VALUES (%s, %s, 'tarefa_criada_por_radar_automacao', %s::jsonb)
        """,
        (
            tarefa["id"],
            usuario_id,
            Jsonb(
                {
                    "radar_automacao_execucao_id": str(execucao["id"]),
                    "radar_regra_id": str(regra["id"]),
                    "movimentacao_id": str(movimento["id"]),
                    "processo_id": str(movimento["processo_id"]),
                    "criada_automaticamente": True,
                }
            ),
        ),
    )
    tarefa["movimentacoes_vinculadas"] = vincular_movimentacoes_pendentes_do_processo(
        cur,
        tarefa_id=str(tarefa["id"]),
        processo_id=str(movimento["processo_id"]),
        usuario_id=usuario_id,
        movimentacao_id=str(movimento["id"]),
    )
    return tarefa


def _config_enabled(cur, chave: str) -> bool:
    cur.execute("SELECT valor FROM configuracoes WHERE chave = %s", (chave,))
    row = cur.fetchone()
    if not row:
        return False
    value = row["valor"] if isinstance(row, Mapping) else row[0]
    return normalizar_texto(value) in {"1", "true", "sim", "yes", "on", "ativo", "ativado"}


def _fetch_execution_details(cur, execucao_id: str) -> dict[str, Any]:
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
          t.titulo AS tarefa_titulo,
          anterior.titulo AS tarefa_anterior_titulo
        FROM radar_automacao_execucoes ae
        JOIN radar_automacao_regras rar ON rar.id = ae.regra_id
        LEFT JOIN radar_movimentacao_tipos rmt ON rmt.id = rar.tipo_id
        JOIN movimentacoes_novas m ON m.id = ae.movimentacao_id
        JOIN processos p ON p.id = ae.processo_id
        LEFT JOIN tarefas t ON t.id = ae.tarefa_id
        LEFT JOIN tarefas anterior ON anterior.id = ae.tarefa_anterior_id
        WHERE ae.id = %s
        """,
        (execucao_id,),
    )
    return dict(cur.fetchone() or {})


def encadear_tarefa_concluida(
    cur,
    tarefa: Mapping[str, Any],
    *,
    usuario_id: str | None = None,
) -> dict[str, Any] | None:
    """Create the next Radar automation suggestion/task after task completion.

    This is intentionally gated by configuration and by an explicit
    proxima_regra_id. No legal sequence is inferred automatically.
    """
    tarefa_id = str(tarefa.get("id") or "")
    if not tarefa_id or tarefa.get("status") != "concluida":
        return None
    if str(tarefa.get("origem") or "") != "radar_movimentacao":
        return None
    if not tarefa.get("radar_regra_id") or not tarefa.get("radar_automacao_execucao_id"):
        return None
    if not tarefa.get("movimentacao_id") or not tarefa.get("processo_id"):
        return None
    if not _config_enabled(cur, "radar_encadeamento_tarefas_ativo"):
        return None

    cur.execute(
        """
        SELECT
          prox.*,
          tipo.slug AS tipo_slug,
          tipo.nome AS tipo_nome
        FROM radar_automacao_regras atual
        JOIN radar_automacao_regras prox ON prox.id = atual.proxima_regra_id
        LEFT JOIN radar_movimentacao_tipos tipo ON tipo.id = prox.tipo_id
        WHERE atual.id = %s
          AND atual.ativa IS TRUE
          AND prox.ativa IS TRUE
          AND coalesce(tipo.ativo, true) IS TRUE
        LIMIT 1
        """,
        (tarefa["radar_regra_id"],),
    )
    next_rule_row = cur.fetchone()
    if not next_rule_row:
        return None
    next_rule = dict(next_rule_row)

    cur.execute("SELECT * FROM movimentacoes_novas WHERE id = %s", (tarefa["movimentacao_id"],))
    movimento_row = cur.fetchone()
    cur.execute("SELECT * FROM processos WHERE id = %s", (tarefa["processo_id"],))
    processo_row = cur.fetchone()
    if not movimento_row or not processo_row:
        return None
    movimento = dict(movimento_row)
    processo = dict(processo_row)

    payload = _suggested_task_payload(next_rule, movimento, processo)
    payload["tarefa_origem_id"] = tarefa_id
    payload["tarefa_origem_titulo"] = tarefa.get("titulo")
    version = int(next_rule.get("versao") or 1)
    dedup_key = f"radar_next:{tarefa_id}:{next_rule['id']}:{version}"
    status = "sem_tarefa" if not next_rule.get("cria_tarefa", True) else "aguardando_aprovacao"
    cur.execute(
        """
        INSERT INTO radar_automacao_execucoes (
          movimentacao_id, processo_id, regra_id, versao, dedup_chave,
          status, payload_tarefa_sugerida, tarefa_anterior_id, gatilho
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, 'tarefa_concluida')
        ON CONFLICT (movimentacao_id, regra_id, versao) DO UPDATE SET
          payload_tarefa_sugerida = CASE
            WHEN radar_automacao_execucoes.status = 'aguardando_aprovacao'
            THEN excluded.payload_tarefa_sugerida
            ELSE radar_automacao_execucoes.payload_tarefa_sugerida
          END,
          tarefa_anterior_id = coalesce(radar_automacao_execucoes.tarefa_anterior_id, excluded.tarefa_anterior_id),
          gatilho = CASE
            WHEN radar_automacao_execucoes.gatilho = 'movimentacao_detectada'
            THEN radar_automacao_execucoes.gatilho
            ELSE excluded.gatilho
          END
        RETURNING *
        """,
        (
            movimento["id"],
            movimento["processo_id"],
            next_rule["id"],
            version,
            dedup_key,
            status,
            Jsonb(payload),
            tarefa_id,
        ),
    )
    execucao = dict(cur.fetchone() or {})
    tarefa_criada = None
    if next_rule.get("cria_tarefa", True) and not next_rule.get("requer_aprovacao", True):
        if execucao.get("tarefa_id"):
            cur.execute("SELECT * FROM tarefas WHERE id = %s", (execucao["tarefa_id"],))
            tarefa_criada = dict(cur.fetchone() or {})
        elif execucao.get("status") in {"aguardando_aprovacao", "sem_tarefa"}:
            tarefa_criada = _insert_task_for_execution(
                cur,
                execucao=execucao,
                regra=next_rule,
                movimento=movimento,
                processo=processo,
                payload=payload,
                usuario_id=usuario_id,
                tarefa_origem_id=tarefa_id,
            )
            cur.execute(
                """
                UPDATE radar_automacao_execucoes
                SET tarefa_id = %s,
                    status = 'tarefa_criada',
                    payload_tarefa_sugerida = %s::jsonb
                WHERE id = %s
                RETURNING *
                """,
                (tarefa_criada["id"], Jsonb(payload), execucao["id"]),
            )
            execucao = dict(cur.fetchone() or execucao)
            vincular_movimentacoes_pendentes_do_processo(
                cur,
                tarefa_id=str(tarefa_criada["id"]),
                processo_id=str(movimento["processo_id"]),
                usuario_id=usuario_id,
                movimentacao_id=str(movimento["id"]),
            )

    details = _fetch_execution_details(cur, str(execucao["id"]))
    return {"execucao": details or execucao, "tarefa": tarefa_criada}


def processar_movimentacao_automacao(
    conn,
    movimentacao: Mapping[str, Any],
    processo: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Classify one persisted movement and create an audit execution/task.

    The function is idempotent through database constraints. It never creates a
    task for unknown, ambiguous, inactive or incomplete movements.
    """
    movimento = dict(movimentacao)
    processo_row = dict(processo) if processo is not None else None
    if not processo_row and movimento.get("processo_id"):
        processo_row = _fetch_processo(conn, str(movimento["processo_id"]))

    texto_normalizado = movement_normalized_text(movimento)
    rules = _fetch_active_rules(conn)
    classification = classificar_movimentacao(movimento, processo_row, rules)
    selected_rule = classification.rule
    tipo_id = selected_rule.get("tipo_id") if selected_rule else None
    regra_id = selected_rule.get("id") if selected_rule else None

    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                UPDATE movimentacoes_novas
                SET texto_normalizado = %s
                WHERE id = %s
                RETURNING *
                """,
                (texto_normalizado, movimento["id"]),
            )
            updated_mov = cur.fetchone()
            if updated_mov:
                movimento = dict(updated_mov)
            cur.execute(
                """
                INSERT INTO radar_movimentacao_classificacoes (
                  movimentacao_id, tipo_id, regra_id, status, metodo, pontuacao,
                  regras_candidatas, detalhes
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb)
                ON CONFLICT (movimentacao_id) DO UPDATE SET
                  tipo_id = excluded.tipo_id,
                  regra_id = excluded.regra_id,
                  status = excluded.status,
                  metodo = excluded.metodo,
                  pontuacao = excluded.pontuacao,
                  regras_candidatas = excluded.regras_candidatas,
                  detalhes = excluded.detalhes
                RETURNING *
                """,
                (
                    movimento["id"],
                    tipo_id,
                    regra_id,
                    classification.status,
                    CLASSIFICATION_METHOD,
                    classification.score,
                    Jsonb(classification.candidates),
                    Jsonb(classification.details),
                ),
            )
            classificacao_row = cur.fetchone()
            classificacao = dict(classificacao_row or {})

            if classification.status != "reconhecida" or selected_rule is None:
                return {"classificacao": classificacao, "execucao": None, "tarefa": None}

            payload = _suggested_task_payload(selected_rule, movimento, processo_row)
            version = int(selected_rule.get("versao") or 1)
            dedup_key = f"radar_auto:{movimento['id']}:{selected_rule['id']}:{version}"
            status = "sem_tarefa" if not selected_rule.get("cria_tarefa", True) else "aguardando_aprovacao"
            cur.execute(
                """
                INSERT INTO radar_automacao_execucoes (
                  movimentacao_id, processo_id, regra_id, versao, dedup_chave,
                  status, payload_tarefa_sugerida
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
                ON CONFLICT (movimentacao_id, regra_id, versao) DO UPDATE SET
                  payload_tarefa_sugerida = excluded.payload_tarefa_sugerida
                RETURNING *
                """,
                (
                    movimento["id"],
                    movimento["processo_id"],
                    selected_rule["id"],
                    version,
                    dedup_key,
                    status,
                    Jsonb(payload),
                ),
            )
            execucao = dict(cur.fetchone() or {})
            tarefa = None
            if selected_rule.get("cria_tarefa", True) and not selected_rule.get("requer_aprovacao", True):
                if execucao.get("tarefa_id"):
                    cur.execute("SELECT * FROM tarefas WHERE id = %s", (execucao["tarefa_id"],))
                    tarefa = dict(cur.fetchone() or {})
                else:
                    tarefa = _insert_task_for_execution(
                        cur,
                        execucao=execucao,
                        regra=selected_rule,
                        movimento=movimento,
                        processo=processo_row,
                        payload=payload,
                    )
                    cur.execute(
                        """
                        UPDATE radar_automacao_execucoes
                        SET tarefa_id = %s,
                            status = 'tarefa_criada'
                        WHERE id = %s
                        RETURNING *
                        """,
                        (tarefa["id"], execucao["id"]),
                    )
                    execucao = dict(cur.fetchone() or execucao)
                    vincular_movimentacoes_pendentes_do_processo(
                        cur,
                        tarefa_id=str(tarefa["id"]),
                        processo_id=str(movimento["processo_id"]),
                        movimentacao_id=str(movimento["id"]),
                    )
            return {"classificacao": classificacao, "execucao": execucao, "tarefa": tarefa}


def aprovar_execucao_automacao(
    conn,
    *,
    execucao_id: str,
    usuario_id: str | None,
    overrides: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    overrides = dict(overrides or {})
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT
                  ae.id AS execucao_id,
                  ae.movimentacao_id,
                  ae.processo_id,
                  ae.regra_id,
                  ae.versao,
                  ae.status,
                  ae.payload_tarefa_sugerida,
                  ae.tarefa_anterior_id,
                  r.prioridade AS regra_prioridade,
                  r.prazo_dias,
                  r.titulo_template,
                  r.descricao_template,
                  m.id AS mov_id,
                  m.descricao AS mov_descricao,
                  m.evento AS mov_evento,
                  m.usuario AS mov_usuario,
                  m.data_hora AS mov_data_hora,
                  p.numero,
                  p.cliente,
                  p.contrato_id
                FROM radar_automacao_execucoes ae
                JOIN radar_automacao_regras r ON r.id = ae.regra_id
                JOIN movimentacoes_novas m ON m.id = ae.movimentacao_id
                JOIN processos p ON p.id = ae.processo_id
                WHERE ae.id = %s
                FOR UPDATE OF ae
                """,
                (execucao_id,),
            )
            row = cur.fetchone()
            if not row:
                raise LookupError("automacao_nao_encontrada")
            joined = dict(row)
            if joined["status"] != "aguardando_aprovacao":
                raise ValueError("automacao_ja_decidida")
            regra = {
                "id": joined["regra_id"],
                "prioridade": joined.get("regra_prioridade"),
                "prazo_dias": joined.get("prazo_dias"),
                "titulo_template": joined.get("titulo_template"),
                "descricao_template": joined.get("descricao_template"),
            }
            regra["id"] = joined["regra_id"]
            movimento = {
                "id": joined["mov_id"],
                "descricao": joined.get("mov_descricao"),
                "evento": joined.get("mov_evento"),
                "usuario": joined.get("mov_usuario"),
                "data_hora": joined.get("mov_data_hora"),
                "processo_id": joined.get("processo_id"),
            }
            processo = {"numero": joined.get("numero"), "cliente": joined.get("cliente"), "contrato_id": joined.get("contrato_id")}
            payload = dict(joined.get("payload_tarefa_sugerida") or _suggested_task_payload(regra, movimento, processo))
            for key in ("titulo", "descricao", "prazo", "prioridade", "responsavel", "responsavel_id"):
                if key in overrides:
                    payload[key] = overrides[key] or None
            tarefa = _insert_task_for_execution(
                cur,
                execucao={"id": joined["execucao_id"]},
                regra=regra,
                movimento=movimento,
                processo=processo,
                payload=payload,
                usuario_id=usuario_id,
                tarefa_origem_id=overrides.get("tarefa_origem_id") or joined.get("tarefa_anterior_id"),
            )
            cur.execute(
                """
                UPDATE radar_automacao_execucoes
                SET status = 'tarefa_criada',
                    tarefa_id = %s,
                    aprovado_por = %s,
                    aprovado_em = now(),
                    payload_tarefa_sugerida = %s::jsonb
                WHERE id = %s
                RETURNING *
                """,
                (tarefa["id"], usuario_id, Jsonb(payload), execucao_id),
            )
            execucao = dict(cur.fetchone() or {})
            vincular_movimentacoes_pendentes_do_processo(
                cur,
                tarefa_id=str(tarefa["id"]),
                processo_id=str(movimento["processo_id"]),
                usuario_id=usuario_id,
                movimentacao_id=str(movimento["id"]),
            )
    return {"execucao": execucao, "tarefa": tarefa}


def ignorar_execucao_automacao(
    conn,
    *,
    execucao_id: str,
    usuario_id: str | None,
    motivo: str,
) -> dict[str, Any]:
    motivo = str(motivo or "").strip()
    if not motivo:
        raise ValueError("motivo_obrigatorio")
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("SELECT * FROM radar_automacao_execucoes WHERE id = %s FOR UPDATE", (execucao_id,))
            row = cur.fetchone()
            if not row:
                raise LookupError("automacao_nao_encontrada")
            if row["status"] != "aguardando_aprovacao":
                raise ValueError("automacao_ja_decidida")
            cur.execute(
                """
                UPDATE radar_automacao_execucoes
                SET status = 'ignorada',
                    motivo = %s,
                    ignorado_por = %s,
                    ignorado_em = now()
                WHERE id = %s
                RETURNING *
                """,
                (motivo, usuario_id, execucao_id),
            )
            updated = dict(cur.fetchone() or {})
    return updated
