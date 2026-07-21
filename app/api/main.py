from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import cors_origins, get_settings
from app.db.session import Caller, JwtValidationError, caller_connection, parse_jwt_claims
from app.domain.db_service import PostgresService
from app.domain.errors import DomainError
from app.security.vault import InMemoryVault


vault = InMemoryVault()
app = FastAPI(title="Sistema Integrado Pavageau API")

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


class CriarTarefaBody(BaseModel):
    titulo: str
    responsavel: str | None = None


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
        claims = parse_jwt_claims(token, jwt_secret=settings.supabase_jwt_secret, supabase_url=settings.supabase_url)
    except JwtValidationError as exc:
        raise HTTPException(status_code=401, detail={"erro": "sessao invalida", "detalhe": None, "codigo": "unauthorized"}) from exc
    user_id = claims.get("sub")
    return Caller(jwt=token, user_id=str(user_id) if user_id else None, claims=claims)


def service_dependency(caller: Caller = Depends(require_caller)):
    settings = get_settings()
    if not settings.database_url:
        raise HTTPException(status_code=500, detail={"erro": "DATABASE_URL nao configurado", "detalhe": None, "codigo": "config"})
    with caller_connection(settings.database_url, caller) as conn:
        yield PostgresService(conn=conn, usuario_id=caller.user_id, vault=vault)


def _call(fn):
    try:
        return fn()
    except DomainError as exc:
        raise error_response(exc) from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


def _collection_routes(path: str, table: str):
    @app.get(path)
    def list_resource(limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), service: PostgresService = Depends(service_dependency)):
        return _call(lambda: service.list_rows(table, limit=limit, offset=offset))

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
_collection_routes("/tarefas", "tarefas")
_collection_routes("/processos", "processos")


@app.get("/contratos/{contrato_id}/parcelas")
def listar_parcelas_contrato(contrato_id: str, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.list_rows("parcelas", filters={"contrato_id": contrato_id}))


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
def criar_tarefa_movimento(movimentacao_id: str, body: CriarTarefaBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.criar_tarefa_de_movimentacao(movimentacao_id, body.titulo, body.responsavel))


@app.put("/processos/{processo_id}/senha")
def registrar_senha(processo_id: str, body: SenhaProcessoBody, service: PostgresService = Depends(service_dependency)):
    return _call(lambda: service.registrar_senha_processo(processo_id, body.senha))


@app.get("/parametros/{ano}")
def obter_parametros(ano: int, service: PostgresService = Depends(service_dependency)):
    rows = _call(lambda: service.list_rows("parametros", filters={"ano": ano}))
    if not rows:
        raise HTTPException(status_code=404, detail={"erro": "Parametros nao encontrados", "detalhe": None, "codigo": "not_found"})
    return rows[0]


@app.put("/parametros/{ano}")
def salvar_parametros(ano: int, body: dict[str, Any], service: PostgresService = Depends(service_dependency)):
    payload = {"ano": ano, **body}
    try:
        return service.create("parametros", payload)
    except Exception:
        return _call(lambda: service.patch("parametros", str(ano), body))


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
