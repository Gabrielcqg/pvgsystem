from __future__ import annotations

import os
from datetime import date
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from psycopg.rows import dict_row

from app.config import cors_origins, get_settings
from app.db.session import Caller, JwtValidationError, NotAppMemberError, caller_connection, parse_jwt_claims, radar_connection
from app.domain.db_service import PostgresService
from app.domain.errors import DomainError


_docs_enabled = (os.getenv("ENABLE_API_DOCS") or "1").strip().lower() not in {"0", "false", "no", "off"}
app = FastAPI(
    title="Sistema Integrado Pavageau API",
    docs_url="/docs" if _docs_enabled else None,
    redoc_url="/redoc" if _docs_enabled else None,
    openapi_url="/openapi.json" if _docs_enabled else None,
)

_cors_origins = cors_origins()
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


class ConfirmarParcelaBody(BaseModel):
    mes_recebimento: date
    data_pagamento: date | None = None


class LancarCustoBody(BaseModel):
    competencia: date


class FecharContratoBody(BaseModel):
    parcelas: int = 1
    mes_inicio: date
    data_fechamento: date | None = None


class CriarTarefaBody(BaseModel):
    titulo: str | None = None
    responsavel: str | None = None


class AprovarAutomacaoBody(BaseModel):
    titulo: str | None = None
    descricao: str | None = None
    prazo: date | None = None
    prioridade: str | None = None
    responsavel: str | None = None
    responsavel_id: str | None = None


class IgnorarAutomacaoBody(BaseModel):
    motivo: str


class IgnorarMovimentacaoBody(BaseModel):
    motivo: str | None = None


class IniciarRadarWorkerBody(BaseModel):
    origem: Literal["agendada", "manual"] = "agendada"


class FinalizarRadarWorkerBody(BaseModel):
    status: str | None = None


class RadarWorkerMovimentacaoBody(BaseModel):
    data_hora: str | None = None
    descricao: str
    evento: str | None = None
    usuario: str | None = None
    chave: str | None = None


class RegistrarResultadoRadarWorkerBody(BaseModel):
    processo_id: str
    numero_processo: str
    tribunal: str
    status: str
    movimentacoes: list[RadarWorkerMovimentacaoBody] = []
    quantidade_movimentacoes: int | None = None
    layout_movimentacoes: str | None = None
    url_resultado: str | None = None
    mensagem_erro: str | None = None
    tipo_erro: str | None = None
    etapa: str | None = None
    consultado_em: str | None = None
    duracao_segundos: float | None = None
    tem_movimentacao_nova: bool = False
    chaves_movimentacoes: list[str] = []
    data_ultimo_andamento: str | None = None
    ultima_consulta_inconclusiva: bool = False


class AlterarStatusTarefaBody(BaseModel):
    status: str
    force: bool = False


class ConcluirTarefaBody(BaseModel):
    force: bool = False


class ReabrirTarefaBody(BaseModel):
    status: str = "a_fazer"


class BulkTarefasBody(BaseModel):
    ids: list[str]
    action: str
    payload: dict[str, Any] = {}


class ComentarioTarefaBody(BaseModel):
    conteudo: str


class SenhaProcessoBody(BaseModel):
    senha: str


def error_response(exc: DomainError) -> HTTPException:
    return HTTPException(
        status_code=exc.status_code,
        detail={"erro": exc.message, "detalhe": exc.detail, "codigo": exc.code},
    )


def require_caller(authorization: str | None = Header(default=None)) -> Caller:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail={"erro": "sessao ausente", "detalhe": None, "codigo": "unauthorized"})
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail={"erro": "sessao ausente", "detalhe": None, "codigo": "unauthorized"})
    settings = get_settings()
    try:
        claims = parse_jwt_claims(
            token,
            jwt_secret=settings.supabase_jwt_secret,
            supabase_url=settings.supabase_url,
            supabase_jwks_url=settings.supabase_jwt_jwks_url,
        )
    except JwtValidationError as exc:
        raise HTTPException(status_code=401, detail={"erro": "sessao invalida", "detalhe": None, "codigo": "unauthorized"}) from exc
    user_id = claims.get("sub")
    return Caller(jwt=token, user_id=str(user_id) if user_id else None, claims=claims)


def service_dependency(caller: Caller = Depends(require_caller)):
    settings = get_settings()
    if not settings.database_url:
        raise HTTPException(status_code=500, detail={"erro": "DATABASE_URL nao configurado", "detalhe": None, "codigo": "config"})
    try:
        with caller_connection(settings.database_url, caller, require_member=True) as conn:
            yield PostgresService(
                conn=conn,
                usuario_id=caller.user_id,
                radar_password_key=settings.radar_password_key,
                radar_db_url=settings.radar_db_url,
            )
    except NotAppMemberError:
        raise HTTPException(status_code=403, detail={"erro": "acesso restrito", "detalhe": None, "codigo": "forbidden"})


def radar_worker_service_dependency(caller: Caller = Depends(require_caller)):
    settings = get_settings()
    if not settings.database_url:
        raise HTTPException(status_code=500, detail={"erro": "DATABASE_URL nao configurado", "detalhe": None, "codigo": "config"})
    if not settings.radar_db_url:
        raise HTTPException(status_code=500, detail={"erro": "RADAR_DB_URL nao configurado", "detalhe": None, "codigo": "config"})
    try:
        with caller_connection(settings.database_url, caller, require_member=True):
            pass
        with radar_connection(settings.radar_db_url) as conn:
            yield PostgresService(
                conn=conn,
                usuario_id=caller.user_id,
                radar_password_key=settings.radar_password_key,
                radar_db_url=settings.radar_db_url,
            )
    except NotAppMemberError:
        raise HTTPException(status_code=403, detail={"erro": "acesso restrito", "detalhe": None, "codigo": "forbidden"})


def _call(fn):
    try:
        return fn()
    except DomainError as exc:
        raise error_response(exc) from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _query_filters(request: Request, skip: set[str] | None = None) -> dict[str, Any]:
    omitted = {"limit", "offset", "order", "desc", "cascade", *(skip or set())}
    filters: dict[str, Any] = {}
    for key, value in request.query_params.multi_items():
        if key in omitted or value == "":
            continue
        filters[key] = value
    return filters


def _collection_routes(path: str, table: str):
    @app.get(path)
    def list_resource(
        request: Request,
        limit: int = Query(100, ge=1, le=500),
        offset: int = Query(0, ge=0),
        order: str | None = Query(None),
        desc: bool = Query(False),
        service: PostgresService = Depends(service_dependency),
    ):
        return _call(lambda: service.list_rows(table, limit=limit, offset=offset, filters=_query_filters(request), order_by=order, descending=desc))

    @app.post(path)
    def create_resource(body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
        return _call(lambda: service.create(table, body))

    @app.patch(f"{path}" + "/{row_id}")
    def patch_resource(row_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
        return _call(lambda: service.patch(table, row_id, body))

    @app.delete(f"{path}" + "/{row_id}")
    def delete_resource(row_id: str, cascade: bool = False, service: PostgresService = Depends(service_dependency)):
        return _call(lambda: service.delete(table, row_id, cascade=cascade)) or {"ok": True}


_collection_routes("/parceiros", "parceiros")
_collection_routes("/contratos", "contratos")
_collection_routes("/lancamentos", "lancamentos")
_collection_routes("/custos-fixos", "custos_fixos")
_collection_routes("/processos", "processos")


@app.get("/tarefas/statuses")
def listar_status_tarefas(service: PostgresService = Depends(service_dependency)):
    return _call(service.tarefa_statuses)


@app.get("/tarefas/contadores")
def contadores_tarefas(service: PostgresService = Depends(service_dependency)):
    return _call(service.tarefa_contadores)


@app.post("/tarefas/bulk")
def bulk_tarefas(body: BulkTarefasBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.tarefas_bulk(body.ids, body.action, body.payload))


@app.get("/tarefas")
def listar_tarefas(
    request: Request,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order: str | None = Query(None),
    desc: bool = Query(False),
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.list_tarefas(limit=limit, offset=offset, filters=_query_filters(request), order_by=order, descending=desc))


@app.post("/tarefas")
def criar_tarefa(body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa(body))


@app.get("/tarefas/{tarefa_id}")
def obter_tarefa(tarefa_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.obter_tarefa(tarefa_id))


@app.patch("/tarefas/{tarefa_id}")
def atualizar_tarefa(
    tarefa_id: str,
    body: dict[str, Any],
    force: bool = False,
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.atualizar_tarefa(tarefa_id, body, force=force))


@app.post("/tarefas/{tarefa_id}/status")
def alterar_status_tarefa(tarefa_id: str, body: AlterarStatusTarefaBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.alterar_status_tarefa(tarefa_id, body.status, force=body.force))


@app.post("/tarefas/{tarefa_id}/concluir")
def concluir_tarefa(tarefa_id: str, body: ConcluirTarefaBody | None = None, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.alterar_status_tarefa(tarefa_id, "concluida", force=bool(body.force if body else False)))


@app.post("/tarefas/{tarefa_id}/reabrir")
def reabrir_tarefa(tarefa_id: str, body: ReabrirTarefaBody | None = None, service: PostgresService = Depends(service_dependency)):
    status = body.status if body else "a_fazer"
    return _call(lambda: service.alterar_status_tarefa(tarefa_id, status, force=True))


@app.post("/tarefas/{tarefa_id}/arquivar")
def arquivar_tarefa(tarefa_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.arquivar_tarefa(tarefa_id))


@app.post("/tarefas/{tarefa_id}/restaurar")
def restaurar_tarefa(tarefa_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.restaurar_tarefa(tarefa_id))


@app.delete("/tarefas/{tarefa_id}")
def excluir_tarefa(tarefa_id: str, permanent: bool = False, service: PostgresService = Depends(service_dependency)):
    result = _call(lambda: service.excluir_tarefa(tarefa_id, permanent=permanent))
    if permanent:
        return Response(status_code=204)
    return result


@app.post("/tarefas/{tarefa_id}/checklist")
def criar_checklist_tarefa(tarefa_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa_checklist(tarefa_id, body))


@app.patch("/tarefas/checklist/{item_id}")
def atualizar_checklist_tarefa(item_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.atualizar_tarefa_checklist(item_id, body))


@app.patch("/tarefas/{tarefa_id}/checklist/{item_id}")
def atualizar_checklist_tarefa_aninhado(
    tarefa_id: str,
    item_id: str,
    body: dict[str, Any],
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.atualizar_tarefa_checklist(item_id, body, tarefa_id=tarefa_id))


@app.delete("/tarefas/checklist/{item_id}")
def remover_checklist_tarefa(item_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_tarefa_checklist(item_id))
    return {"ok": True}


@app.delete("/tarefas/{tarefa_id}/checklist/{item_id}")
def remover_checklist_tarefa_aninhado(tarefa_id: str, item_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_tarefa_checklist(item_id, tarefa_id=tarefa_id))
    return {"ok": True}


@app.post("/tarefas/{tarefa_id}/subtarefas")
def criar_subtarefa(tarefa_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_subtarefa(tarefa_id, body))


@app.patch("/tarefas/subtarefas/{subtarefa_id}")
def atualizar_subtarefa(subtarefa_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.atualizar_subtarefa(subtarefa_id, body))


@app.patch("/tarefas/{tarefa_id}/subtarefas/{subtarefa_id}")
def atualizar_subtarefa_aninhada(
    tarefa_id: str,
    subtarefa_id: str,
    body: dict[str, Any],
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.atualizar_subtarefa(subtarefa_id, body, tarefa_id=tarefa_id))


@app.delete("/tarefas/subtarefas/{subtarefa_id}")
def remover_subtarefa(subtarefa_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_subtarefa(subtarefa_id))
    return {"ok": True}


@app.delete("/tarefas/{tarefa_id}/subtarefas/{subtarefa_id}")
def remover_subtarefa_aninhada(tarefa_id: str, subtarefa_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_subtarefa(subtarefa_id, tarefa_id=tarefa_id))
    return {"ok": True}


@app.post("/tarefas/{tarefa_id}/comentarios")
def criar_comentario_tarefa(tarefa_id: str, body: ComentarioTarefaBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa_comentario(tarefa_id, body.conteudo))


@app.delete("/tarefas/comentarios/{comentario_id}")
def excluir_comentario_tarefa(comentario_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.excluir_tarefa_comentario(comentario_id))


@app.delete("/tarefas/{tarefa_id}/comentarios/{comentario_id}")
def excluir_comentario_tarefa_aninhado(tarefa_id: str, comentario_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.excluir_tarefa_comentario(comentario_id, tarefa_id=tarefa_id))


@app.post("/tarefas/{tarefa_id}/dependencias")
def criar_dependencia_tarefa(tarefa_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa_dependencia(tarefa_id, body))


@app.delete("/tarefas/dependencias/{dependencia_id}")
def remover_dependencia_tarefa(dependencia_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_tarefa_dependencia(dependencia_id))
    return {"ok": True}


@app.delete("/tarefas/{tarefa_id}/dependencias/{dependencia_id}")
def remover_dependencia_tarefa_aninhada(tarefa_id: str, dependencia_id: str, service: PostgresService = Depends(service_dependency)):
    _call(lambda: service.remover_tarefa_dependencia(dependencia_id, tarefa_id=tarefa_id))
    return {"ok": True}


@app.get("/me")
def me(caller: Caller = Depends(require_caller)):
    settings = get_settings()
    if not settings.database_url:
        raise HTTPException(status_code=500, detail={"erro": "DATABASE_URL nao configurado", "detalhe": None, "codigo": "config"})
    with caller_connection(settings.database_url, caller) as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT email, papel, ativo
                FROM app_members
                WHERE ativo AND lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
                LIMIT 1
                """
            )
            member = cur.fetchone()
    email = caller.claims.get("email")
    return {
        "user_id": caller.user_id,
        "email": str(email) if email else None,
        "is_member": bool(member),
        "papel": member["papel"] if member else None,
    }


@app.get("/bootstrap")
def bootstrap(
    ano: int = Query(2026, ge=2000, le=2100),
    mes: int | None = Query(None, ge=1, le=12),
    service: PostgresService = Depends(service_dependency),
):
    mes_ref = mes or date.today().month

    def build_payload() -> dict[str, Any]:
        with service.conn.cursor(row_factory=dict_row) as cur:
            cur.execute(
                """
                SELECT jsonb_build_object(
                  'parceiros', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM parceiros ORDER BY criado_em DESC LIMIT 500) t),
                  'contratos', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM contratos ORDER BY criado_em DESC LIMIT 500) t),
                  'parcelas', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM parcelas ORDER BY mes_esperado ASC, criado_em ASC LIMIT 500) t),
                  'lancamentos', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM lancamentos ORDER BY criado_em DESC LIMIT 500) t),
                  'custos_fixos', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM custos_fixos ORDER BY criado_em DESC LIMIT 500) t),
                  'tarefas', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM tarefas WHERE archived_at IS NULL ORDER BY criado_em DESC LIMIT 500) t),
                  'processos', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM processos ORDER BY criado_em DESC LIMIT 500) t),
                  'parametros', coalesce(
                    (SELECT to_jsonb(p) FROM (SELECT * FROM parametros WHERE ano = %s LIMIT 1) p),
                    jsonb_build_object(
                      'ano', %s,
                      'caixa_inicial_ano', 0,
                      'meta_caixa_ano', 0,
                      'meta_recorrencia_mensal', 0,
                      'recorrencia_atual', 0
                    )
                  ),
                  'indicadores', jsonb_build_object(
                    'painel', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM ind_painel WHERE ano = %s LIMIT 1) t),
                    'fluxo_mensal', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM ind_fluxo_mensal WHERE ano = %s ORDER BY mes LIMIT 12) t),
                    'dre_mensal', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM ind_dre_mensal WHERE ano = %s AND mes = %s LIMIT 1) t),
                    'balanco', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM ind_balanco WHERE ano = %s AND mes = %s LIMIT 1) t),
                    'analise_mensal', coalesce((SELECT to_jsonb(t) FROM (SELECT * FROM ind_analise_mensal WHERE ano = %s AND mes = %s LIMIT 1) t), 'null'::jsonb),
                    'gastos_categoria', (SELECT coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) FROM (SELECT * FROM ind_gastos_categoria WHERE ano = %s AND mes = %s ORDER BY total DESC LIMIT 50) t)
                  )
                ) AS payload
                """,
                (ano, ano, ano, ano, ano, mes_ref, ano, mes_ref, ano, mes_ref, ano, mes_ref),
            )
            row = cur.fetchone()
        return dict(row["payload"]) if row else {}

    return _call(build_payload)


@app.get("/contratos/{contrato_id}")
def obter_contrato(contrato_id: str, service: PostgresService = Depends(service_dependency)):
    rows = _call(lambda: service.list_rows("contratos", filters={"id": contrato_id}, limit=1))
    if not rows:
        raise HTTPException(status_code=404, detail={"erro": "Contrato nao encontrado", "detalhe": None, "codigo": "not_found"})
    return rows[0]


@app.get("/contratos/{contrato_id}/parcelas")
def listar_parcelas_contrato(contrato_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("parcelas", filters={"contrato_id": contrato_id}))


@app.post("/contratos/{contrato_id}/fechar")
def fechar_contrato(contrato_id: str, body: FecharContratoBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.fechar_contrato(contrato_id, body.parcelas, body.mes_inicio, body.data_fechamento))


@app.get("/parcelas")
def listar_parcelas(
    request: Request,
    limit: int = Query(500, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order: str | None = Query(None),
    desc: bool = Query(False),
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.list_rows("parcelas", limit=limit, offset=offset, filters=_query_filters(request), order_by=order, descending=desc))


@app.post("/parcelas")
def criar_parcela(body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.create("parcelas", body))


@app.patch("/parcelas/{parcela_id}")
def atualizar_parcela(parcela_id: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.patch("parcelas", parcela_id, body))


@app.delete("/parcelas/{parcela_id}")
def excluir_parcela(parcela_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.delete("parcelas", parcela_id)) or {"ok": True}


@app.post("/parcelas/{parcela_id}/confirmar")
def confirmar_parcela(parcela_id: str, body: ConfirmarParcelaBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.confirmar_parcela(parcela_id, body.mes_recebimento, body.data_pagamento))


@app.post("/parcelas/{parcela_id}/estornar")
def estornar_parcela(parcela_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.estornar_parcela(parcela_id))


@app.post("/custos-fixos/{custo_id}/lancar")
def lancar_custo(custo_id: str, body: LancarCustoBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.lancar_custo_fixo(custo_id, body.competencia))


@app.post("/movimentacoes/{movimentacao_id}/criar-tarefa")
def criar_tarefa_movimento(movimentacao_id: str, body: CriarTarefaBody | None = None, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa_de_movimentacao(movimentacao_id, body.titulo if body else None, body.responsavel if body else None))


@app.post("/movimentacoes/{movimentacao_id}/ignorar")
def ignorar_movimentacao(movimentacao_id: str, body: IgnorarMovimentacaoBody | None = None, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.ignorar_movimentacao_radar(movimentacao_id, body.motivo if body else None))


@app.put("/processos/{processo_id}/senha")
def registrar_senha(processo_id: str, body: SenhaProcessoBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.registrar_senha_processo(processo_id, body.senha))


@app.get("/parametros/{ano}")
def obter_parametros(ano: int, service: PostgresService = Depends(service_dependency)):
    rows = _call(lambda: service.list_rows("parametros", filters={"ano": ano}))
    if not rows:
        return {
            "ano": ano,
            "caixa_inicial_ano": 0,
            "meta_caixa_ano": 0,
            "meta_recorrencia_mensal": 0,
            "recorrencia_atual": 0,
        }
    return rows[0]


@app.put("/parametros/{ano}")
def salvar_parametros(ano: int, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.salvar_parametros(ano, body))


@app.get("/configuracoes")
def listar_configuracoes(service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("configuracoes"))


@app.put("/configuracoes/{chave}")
def atualizar_configuracao(chave: str, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.patch("configuracoes", chave, body))


@app.get("/painel")
def painel(ano: int, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("ind_painel", filters={"ano": ano}))


@app.get("/fluxo-caixa")
def fluxo_caixa(ano: int, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("ind_fluxo_mensal", limit=12, filters={"ano": ano}))


@app.get("/dre")
def dre(ano: int, mes: int, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("ind_dre_mensal", filters={"ano": ano, "mes": mes}))


@app.get("/balanco")
def balanco(ano: int, mes: int, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("ind_balanco", filters={"ano": ano, "mes": mes}))


@app.get("/analises/mes")
def analises_mes(ano: int, mes: int, service: PostgresService = Depends(service_dependency)):
    analise = _call(lambda: service.list_rows("ind_analise_mensal", filters={"ano": ano, "mes": mes}))
    gastos = _call(lambda: service.list_rows("ind_gastos_categoria", filters={"ano": ano, "mes": mes}))
    return {"analise": analise[0] if analise else None, "gastos_categoria": gastos}


@app.post("/radar/executar")
def executar_radar(_service: PostgresService = Depends(service_dependency)):
    raise HTTPException(
        status_code=409,
        detail={
            "erro": "Execucao do radar desabilitada na API nesta etapa",
            "detalhe": "As consultas processuais sao executadas semanalmente pelo ambiente autorizado.",
            "codigo": "radar_external_only",
        },
    )


@app.post("/radar/processos/{processo_id}/executar")
def executar_processo_radar(processo_id: str, service: PostgresService = Depends(service_dependency)):
    processos_rows = _call(lambda: service.list_rows("processos", filters={"id": processo_id}, limit=1))
    if not processos_rows:
        raise HTTPException(status_code=404, detail={"erro": "Processo nao encontrado", "detalhe": None, "codigo": "not_found"})
    raise HTTPException(
        status_code=409,
        detail={
            "erro": "Consulta manual desabilitada na API nesta etapa",
            "detalhe": "O processo sera consultado pela proxima rodada do executor local autorizado.",
            "codigo": "radar_external_only",
        },
    )


@app.post("/radar/worker/execucoes")
def iniciar_execucao_radar_worker(body: IniciarRadarWorkerBody | None = None, service: PostgresService = Depends(radar_worker_service_dependency)):
    origem = body.origem if body else "agendada"
    return _call(lambda: service.iniciar_execucao_radar_api(origem=origem))


@app.post("/radar/worker/execucoes/{execucao_id}/resultados")
def registrar_resultado_radar_worker(
    execucao_id: str,
    body: RegistrarResultadoRadarWorkerBody,
    service: PostgresService = Depends(radar_worker_service_dependency),
):
    payload = body.model_dump()
    return _call(lambda: service.registrar_resultado_radar_api(execucao_id, payload))


@app.post("/radar/worker/execucoes/{execucao_id}/finalizar")
def finalizar_execucao_radar_worker(
    execucao_id: str,
    body: FinalizarRadarWorkerBody | None = None,
    service: PostgresService = Depends(radar_worker_service_dependency),
):
    status = body.status if body else None
    return _call(lambda: service.finalizar_execucao_radar_api(execucao_id, status=status))


@app.get("/radar/execucoes")
def listar_execucoes_radar(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("execucoes_radar", limit=limit, offset=offset, order_by="iniciada_em", descending=True))


@app.get("/radar/ultima")
def ultima_execucao_radar(service: PostgresService = Depends(service_dependency)):
    rows = _call(lambda: service.list_rows("execucoes_radar", limit=1, order_by="iniciada_em", descending=True))
    return rows[0] if rows else None


@app.get("/radar/progresso")
def progresso_radar(service: PostgresService = Depends(service_dependency)):
    return _call(service.progresso_radar)


@app.get("/radar/resumo")
def resumo_radar(
    historico_limit: int = Query(10, ge=1, le=50),
    movimentacoes_limit: int = Query(200, ge=1, le=500),
    automacoes_limit: int = Query(100, ge=1, le=500),
    service: PostgresService = Depends(service_dependency),
):
    return _call(
        lambda: service.resumo_radar(
            historico_limit=historico_limit,
            movimentacoes_limit=movimentacoes_limit,
            automacoes_limit=automacoes_limit,
        )
    )


@app.get("/radar/execucoes/{execucao_id}")
def detalhe_execucao_radar(execucao_id: str, service: PostgresService = Depends(service_dependency)):
    execucoes = _call(lambda: service.list_rows("execucoes_radar", filters={"id": execucao_id}, limit=1))
    if not execucoes:
        raise HTTPException(status_code=404, detail={"erro": "Execucao nao encontrada", "detalhe": None, "codigo": "not_found"})
    resultados = _call(lambda: service.list_rows("resultados_consulta", filters={"execucao_id": execucao_id}, limit=500, order_by="consultado_em", descending=True))
    return {"execucao": execucoes[0], "resultados": resultados}


@app.get("/radar/movimentacoes-novas")
def listar_movimentacoes_novas(
    execucao_id: str | None = None,
    status_analise: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: PostgresService = Depends(service_dependency),
):
    statuses = [item.strip() for item in status_analise.split(",") if item.strip()] if status_analise else None
    return _call(lambda: service.listar_movimentacoes_radar(execucao_id=execucao_id, status_analise=statuses, limit=limit, offset=offset))


@app.get("/radar/automacoes")
def listar_automacoes_radar(
    status: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    service: PostgresService = Depends(service_dependency),
):
    return _call(lambda: service.listar_automacoes_radar(status=status, limit=limit, offset=offset))


@app.post("/radar/automacoes/{execucao_id}/aprovar")
def aprovar_automacao_radar(execucao_id: str, body: AprovarAutomacaoBody, service: PostgresService = Depends(service_dependency)):
    payload = body.model_dump(exclude_unset=True)
    return _call(lambda: service.aprovar_automacao_radar(execucao_id, payload))


@app.post("/radar/automacoes/{execucao_id}/ignorar")
def ignorar_automacao_radar(execucao_id: str, body: IgnorarAutomacaoBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.ignorar_automacao_radar(execucao_id, body.motivo))


@app.get("/auditoria")
def listar_auditoria(request: Request, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("auditoria", filters=_query_filters(request), limit=limit, offset=offset, order_by="criado_em", descending=True))
