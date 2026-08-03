"""External radar runner.

This module is intentionally outside `app/`: FastAPI serves the product, while
this command owns the heavyweight browser execution. It fetches monitored
processes from the database, runs one sequential TJSP round with one browser
instance, and persists each result immediately.
"""
from __future__ import annotations

import argparse
import os
import sys
from contextlib import ExitStack
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

import httpx
import psycopg
from psycopg.rows import dict_row

from app.config import Settings, get_settings
from app.radar.email_report import enviar_relatorio_radar
from app.radar.notificacao import avaliar_alertas
from app.radar.orchestrator import (
    ExecucaoRadarMemoria,
    ProcessoMonitorado,
    classificar_execucao,
    consultar_processo_monitorado,
    registrar_resultado,
)
from app.radar.persistence import (
    atualizar_rodadas_interrompidas,
    criar_tarefa_inercia_se_aplicavel,
    finalizar_execucao_radar,
    iniciar_execucao_radar,
    persistir_resultado_radar,
)
from app.radar.scrapers.base import ScraperTribunal
from app.radar.scrapers.tjsp import TJSPScraper, preparar_navegador

RADAR_ADVISORY_LOCK = 824260114


@dataclass
class DatabaseVault:
    conn: psycopg.Connection
    key: str

    def guardar(self, segredo: str) -> str:  # pragma: no cover - worker only reads.
        raise NotImplementedError("O worker externo apenas le senhas ja cadastradas pelo sistema.")

    def resolver(self, referencia: str) -> str | None:
        with self.conn.cursor() as cur:
            cur.execute("SELECT private.ler_senha_processo(%s, %s) AS senha", (referencia, self.key))
            row = cur.fetchone()
            if row is None:
                return None
            return row["senha"] if isinstance(row, dict) else row[0]

    def remover(self, referencia: str) -> None:  # pragma: no cover - worker never removes secrets.
        return None


def _connect_radar(settings: Settings) -> Any:
    if not settings.radar_db_url:
        raise RuntimeError("RADAR_DB_URL nao configurado.")
    conn = psycopg.connect(settings.radar_db_url, autocommit=True, row_factory=dict_row)
    with conn.cursor() as cur:
        try:
            cur.execute("SET ROLE radar_worker")
        except Exception:
            cur.execute("SELECT current_user AS current_user")
            row = cur.fetchone()
            if not row or row["current_user"] != "radar_worker":
                raise
    return conn


@dataclass
class ApiVault:
    senhas: dict[str, str]

    def guardar(self, segredo: str) -> str:  # pragma: no cover - worker only reads.
        raise NotImplementedError("O worker externo apenas le senhas ja cadastradas pelo sistema.")

    def resolver(self, referencia: str) -> str | None:
        return self.senhas.get(referencia)

    def remover(self, referencia: str) -> None:  # pragma: no cover - worker never removes secrets.
        return None


def _api_url() -> str | None:
    value = os.getenv("RADAR_API_URL") or os.getenv("VITE_API_URL")
    if not value:
        return None
    return value.rstrip("/")


@dataclass(frozen=True)
class ApiTarget:
    name: str
    base_url: str
    token_env: str
    supabase_url_env: str
    supabase_key_env: str
    email_env: str
    password_env: str
    use_primary_supabase_fallback: bool = False


@dataclass
class ApiTargetState:
    target: ApiTarget
    client: httpx.Client
    execucao_id: str
    processos_by_key: dict[str, ProcessoMonitorado]
    failures: list[dict[str, str]]


def _process_key(*, numero: str, tribunal: str) -> str:
    return f"{tribunal.strip().upper()}|{numero.strip()}"


def _api_targets() -> list[ApiTarget]:
    primary_url = _api_url()
    if not primary_url:
        return []
    targets = [
        ApiTarget(
            name="primary",
            base_url=primary_url,
            token_env="RADAR_API_ACCESS_TOKEN",
            supabase_url_env="SUPABASE_URL",
            supabase_key_env="SUPABASE_ANON_KEY",
            email_env="RADAR_API_EMAIL",
            password_env="RADAR_API_PASSWORD",
            use_primary_supabase_fallback=True,
        )
    ]
    secondary_url = os.getenv("RADAR_SECONDARY_API_URL") or os.getenv("RADAR_DEV_API_URL")
    if secondary_url and secondary_url.rstrip("/") != primary_url:
        targets.append(
            ApiTarget(
                name="secondary",
                base_url=secondary_url.rstrip("/"),
                token_env="RADAR_SECONDARY_API_ACCESS_TOKEN",
                supabase_url_env="RADAR_SECONDARY_SUPABASE_URL",
                supabase_key_env="RADAR_SECONDARY_SUPABASE_ANON_KEY",
                email_env="RADAR_SECONDARY_API_EMAIL",
                password_env="RADAR_SECONDARY_API_PASSWORD",
            )
        )
    return targets


def _get_api_token(settings: Settings, target: ApiTarget) -> str:
    configured = os.getenv(target.token_env)
    if configured:
        return configured.strip()
    email = os.getenv(target.email_env) or os.getenv("SUPABASE_TEST_EMAIL")
    password = os.getenv(target.password_env) or os.getenv("SUPABASE_TEST_PASSWORD")
    supabase_url = os.getenv(target.supabase_url_env)
    supabase_key = os.getenv(target.supabase_key_env)
    if target.name == "secondary":
        supabase_url = supabase_url or os.getenv("SUPABASE_DEV_URL")
        supabase_key = supabase_key or os.getenv("SUPABASE_DEV_ANON_KEY")
    if target.use_primary_supabase_fallback:
        supabase_url = supabase_url or settings.supabase_url
        supabase_key = supabase_key or settings.supabase_anon_key
    if not supabase_url or not supabase_key or not email or not password:
        raise RuntimeError(
            f"Configure {target.token_env} ou {target.supabase_url_env}/{target.supabase_key_env} "
            f"+ {target.email_env}/{target.password_env} para autenticar o Radar API ({target.name})."
        )
    response = httpx.post(
        f"{supabase_url.rstrip('/')}/auth/v1/token",
        params={"grant_type": "password"},
        headers={"apikey": supabase_key, "Content-Type": "application/json"},
        json={"email": email, "password": password},
        timeout=30,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Falha ao autenticar no Supabase Auth para o Radar API: HTTP {response.status_code}")
    token = response.json().get("access_token")
    if not token:
        raise RuntimeError("Supabase Auth nao retornou access_token para o Radar API.")
    return str(token)


def _request_api(client: httpx.Client, method: str, path: str, **kwargs: Any) -> Any:
    response = client.request(method, path, **kwargs)
    if response.status_code >= 400:
        try:
            detail = response.json().get("detail")
        except Exception:
            detail = None
        raise RuntimeError(f"API Radar retornou HTTP {response.status_code}: {detail or response.text[:200]}")
    if response.content:
        return response.json()
    return None


def _as_json_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    return value


def _resultado_payload(resultado, processo: ProcessoMonitorado) -> dict[str, Any]:
    return {
        "processo_id": processo.id,
        "numero_processo": resultado.numero_processo,
        "tribunal": resultado.tribunal,
        "status": resultado.status,
        "movimentacoes": [
            {
                "data_hora": movimento.data_hora,
                "descricao": movimento.descricao,
                "evento": movimento.evento,
                "usuario": movimento.usuario,
                "chave": movimento.chave,
            }
            for movimento in resultado.movimentacoes
        ],
        "quantidade_movimentacoes": resultado.quantidade_movimentacoes,
        "layout_movimentacoes": resultado.layout_movimentacoes,
        "url_resultado": resultado.url_resultado,
        "mensagem_erro": resultado.mensagem_erro,
        "tipo_erro": resultado.tipo_erro,
        "etapa": resultado.etapa,
        "consultado_em": _as_json_value(resultado.consultado_em),
        "duracao_segundos": resultado.duracao_segundos,
        "tem_movimentacao_nova": resultado.tem_movimentacao_nova,
        "chaves_movimentacoes": list(processo.chaves_movimentacoes),
        "data_ultimo_andamento": _as_json_value(processo.data_ultimo_andamento),
        "ultima_consulta_inconclusiva": processo.ultima_consulta_inconclusiva,
    }


def _to_api_processos(rows: list[dict[str, Any]]) -> tuple[list[ProcessoMonitorado], ApiVault]:
    senhas: dict[str, str] = {}
    processos: list[ProcessoMonitorado] = []
    for row in rows:
        senha = row.get("senha")
        senha_ref = f"api:{row['id']}" if senha else None
        if senha_ref and senha:
            senhas[senha_ref] = str(senha)
        processos.append(
            ProcessoMonitorado(
                id=str(row["id"]),
                numero=row["numero"],
                tribunal=row["tribunal"],
                chaves_movimentacoes=tuple(row.get("chaves_movimentacoes") or ()),
                exige_senha=bool(row.get("exige_senha")),
                senha_ref=senha_ref,
                data_ultimo_andamento=row.get("data_ultimo_andamento"),
                ultima_consulta_inconclusiva=bool(row.get("ultima_consulta_inconclusiva")),
            )
        )
    return processos, ApiVault(senhas)


def _processos_by_key(processos: list[ProcessoMonitorado]) -> dict[str, ProcessoMonitorado]:
    return {
        _process_key(numero=processo.numero, tribunal=processo.tribunal): processo
        for processo in processos
    }


def _acquire_lock(conn: Any) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT pg_try_advisory_lock(%s) AS locked", (RADAR_ADVISORY_LOCK,))
        row = cur.fetchone()
        if not row or not row["locked"]:
            raise RuntimeError("Radar ja esta em execucao. A rodada local nao foi iniciada.")


def _release_lock(conn: Any) -> None:
    with conn.cursor() as cur:
        cur.execute("SELECT pg_advisory_unlock(%s)", (RADAR_ADVISORY_LOCK,))


def _fetch_processos(conn: Any) -> list[dict[str, Any]]:
    with conn.cursor() as cur:
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
        return [dict(row) for row in cur.fetchall()]


def _fetch_radar_inercia_dias(conn: Any) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT valor FROM configuracoes WHERE chave = 'radar_inercia_dias' LIMIT 1")
        row = cur.fetchone()
    raw = (row or {}).get("valor") if isinstance(row, dict) else (row[0] if row else None)
    try:
        dias = int(raw or 30)
    except (TypeError, ValueError) as exc:
        raise RuntimeError("Configuracao radar_inercia_dias invalida.") from exc
    if dias < 1:
        raise RuntimeError("Configuracao radar_inercia_dias precisa ser positiva.")
    return dias


def _to_processos(rows: list[dict[str, Any]]) -> list[ProcessoMonitorado]:
    return [
        ProcessoMonitorado(
            id=str(row["id"]),
            numero=row["numero"],
            tribunal=row["tribunal"],
            chaves_movimentacoes=tuple(row.get("chaves_movimentacoes") or ()),
            exige_senha=bool(row.get("exige_senha")),
            senha_ref=row.get("senha_ref"),
            data_ultimo_andamento=row.get("data_ultimo_andamento"),
            ultima_consulta_inconclusiva=bool(row.get("ultima_consulta_inconclusiva")),
        )
        for row in rows
    ]


def _build_scrapers(processos: list[ProcessoMonitorado]) -> tuple[dict[str, ScraperTribunal | None], Any | None]:
    if not any(processo.tribunal == "TJSP" for processo in processos):
        return {}, None
    browser = preparar_navegador()
    return {"TJSP": TJSPScraper(page=browser)}, browser


def _validar_password_key(settings: Settings, rows: list[dict[str, Any]]) -> None:
    if any(row.get("senha_ref") for row in rows):
        if not settings.radar_password_key or len(settings.radar_password_key) < 32:
            raise RuntimeError("RADAR_PASSWORD_KEY precisa estar configurada para consultar processos com senha salva.")


def rodar_worker_api(
    *,
    origem: str = "agendada",
    scrapers: dict[str, ScraperTribunal | None] | None = None,
    enviar_email: bool = True,
) -> dict[str, Any]:
    settings = get_settings()
    targets = _api_targets()
    if not targets:
        raise RuntimeError("RADAR_API_URL nao configurada.")
    primary_target = targets[0]
    execucao = ExecucaoRadarMemoria(origem="agendada" if origem == "manual" else origem, usuario_id=None)
    browser = None
    execucao_id: str | None = None
    final_row: dict[str, Any] | None = None
    replication: list[dict[str, Any]] = []
    secondary_states: list[ApiTargetState] = []

    def _finalizar(client: httpx.Client, target_name: str, target_execucao_id: str, status: str) -> dict[str, Any] | None:
        try:
            return _request_api(
                client,
                "POST",
                f"/radar/worker/execucoes/{target_execucao_id}/finalizar",
                json={"status": status},
            )
        except Exception as exc:
            replication.append({"target": target_name, "status": "finalize_failed", "detail": str(exc)[:240]})
            return None

    with ExitStack() as stack:
        primary_token = _get_api_token(settings, primary_target)
        primary_client = stack.enter_context(
            httpx.Client(
                base_url=primary_target.base_url,
                headers={"Authorization": f"Bearer {primary_token}"},
                timeout=60,
            )
        )
        start = _request_api(primary_client, "POST", "/radar/worker/execucoes", json={"origem": execucao.origem})
        execucao_row = dict(start["execucao"])
        execucao_id = str(execucao_row["id"])
        processos, vault = _to_api_processos(list(start.get("processos") or []))
        execucao.total_previstos = len(processos)

        for target in targets[1:]:
            try:
                token = _get_api_token(settings, target)
                client = stack.enter_context(
                    httpx.Client(
                        base_url=target.base_url,
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=60,
                    )
                )
                target_start = _request_api(client, "POST", "/radar/worker/execucoes", json={"origem": execucao.origem})
                target_processos, _target_vault = _to_api_processos(list(target_start.get("processos") or []))
                secondary_states.append(
                    ApiTargetState(
                        target=target,
                        client=client,
                        execucao_id=str(dict(target_start["execucao"])["id"]),
                        processos_by_key=_processos_by_key(target_processos),
                        failures=[],
                    )
                )
                replication.append({"target": target.name, "status": "started", "processes": len(target_processos)})
            except Exception as exc:
                replication.append({"target": target.name, "status": "start_failed", "detail": str(exc)[:240]})

        try:
            if scrapers is None:
                active_scrapers, browser = _build_scrapers(processos)
            else:
                active_scrapers = scrapers

            for processo in processos:
                resultado = consultar_processo_monitorado(processo, vault=vault, scrapers=active_scrapers)
                registrar_resultado(execucao, resultado)
                _request_api(
                    primary_client,
                    "POST",
                    f"/radar/worker/execucoes/{execucao_id}/resultados",
                    json=_resultado_payload(resultado, processo),
                )

                key = _process_key(numero=processo.numero, tribunal=processo.tribunal)
                for state in secondary_states:
                    secondary_processo = state.processos_by_key.get(key)
                    if secondary_processo is None:
                        state.failures.append(
                            {
                                "processo": processo.numero,
                                "status": "missing_process",
                            }
                        )
                        continue
                    try:
                        _request_api(
                            state.client,
                            "POST",
                            f"/radar/worker/execucoes/{state.execucao_id}/resultados",
                            json=_resultado_payload(resultado, secondary_processo),
                        )
                    except Exception as exc:
                        state.failures.append(
                            {
                                "processo": processo.numero,
                                "status": "persist_failed",
                                "detail": str(exc)[:240],
                            }
                        )

            execucao.status = classificar_execucao(execucao)
            final_row = _finalizar(primary_client, primary_target.name, execucao_id, execucao.status)
            if final_row is None:
                raise RuntimeError("Falha ao finalizar a execucao do Radar no alvo primario.")
            for state in secondary_states:
                secondary_status = "falhou_parcialmente" if state.failures else execucao.status
                _finalizar(state.client, state.target.name, state.execucao_id, secondary_status)
                replication.append(
                    {
                        "target": state.target.name,
                        "status": "replicated" if not state.failures else "partial",
                        "failures": state.failures[:20],
                    }
                )
        except Exception:
            if execucao_id is not None:
                _finalizar(primary_client, primary_target.name, execucao_id, "interrompida")
            for state in secondary_states:
                _finalizar(state.client, state.target.name, state.execucao_id, "interrompida")
            raise
        finally:
            if browser is not None:
                try:
                    browser.quit()
                except Exception:
                    pass

    if final_row is None:
        final_row = execucao_row
    if replication:
        final_row["replicacao"] = replication
    if enviar_email:
        try:
            final_row["email"] = enviar_relatorio_radar(
                settings, execucao, execucao.resultados, quando=final_row.get("finalizada_em")
            )
        except Exception as exc:  # pragma: no cover - defensive only.
            final_row["email"] = {"status": "error", "motivo": str(exc)}
    return final_row


def rodar_worker(
    *,
    origem: str = "agendada",
    scrapers: dict[str, ScraperTribunal | None] | None = None,
    enviar_email: bool = True,
) -> dict[str, Any]:
    if _api_url():
        return rodar_worker_api(origem=origem, scrapers=scrapers, enviar_email=enviar_email)

    settings = get_settings()
    if origem == "manual":
        origem = "agendada"

    conn = _connect_radar(settings)
    browser = None
    execucao_id: str | None = None
    execucao = ExecucaoRadarMemoria(origem=origem, usuario_id=None)
    try:
        _acquire_lock(conn)
        atualizar_rodadas_interrompidas(conn)
        processos_rows = _fetch_processos(conn)
        radar_inercia_dias = _fetch_radar_inercia_dias(conn)
        _validar_password_key(settings, processos_rows)
        processos = _to_processos(processos_rows)
        execucao.total_previstos = len(processos)
        execucao_row = iniciar_execucao_radar(conn, origem=origem, total_previstos=len(processos))
        execucao_id = str(execucao_row["id"])

        active_scrapers: dict[str, ScraperTribunal | None]
        if scrapers is None:
            active_scrapers, browser = _build_scrapers(processos)
        else:
            active_scrapers = scrapers
        vault = DatabaseVault(conn, settings.radar_password_key) if settings.radar_password_key else None

        for processo, row in zip(processos, processos_rows, strict=True):
            resultado = consultar_processo_monitorado(processo, vault=vault, scrapers=active_scrapers)
            registrar_resultado(execucao, resultado)
            persistir_resultado_radar(
                conn,
                execucao_id=execucao_id,
                resultado=resultado,
                processo=processo,
                processo_row=row,
                execucao=execucao,
            )
            criar_tarefa_inercia_se_aplicavel(
                conn,
                processo=processo,
                processo_row=row,
                dias_limite=radar_inercia_dias,
            )

        execucao.status = classificar_execucao(execucao)
        avaliar_alertas(
            execucao.total_consultados,
            execucao.total_pendente_implementacao,
            execucao.total_conclusivo,
            execucao.total_captcha_timeout,
        )
        execucao_row = finalizar_execucao_radar(conn, execucao_id=execucao_id, status=execucao.status)
    except Exception:
        if execucao_id is not None:
            try:
                finalizar_execucao_radar(conn, execucao_id=execucao_id, status="interrompida")
            except Exception:
                pass
        raise
    finally:
        if browser is not None:
            try:
                browser.quit()
            except Exception:
                pass
        try:
            _release_lock(conn)
        except Exception:
            pass
        conn.close()

    if enviar_email:
        try:
            execucao_row["email"] = enviar_relatorio_radar(
                settings, execucao, execucao.resultados, quando=execucao_row.get("finalizada_em")
            )
        except Exception as exc:  # pragma: no cover - defensive only.
            execucao_row["email"] = {"status": "error", "motivo": str(exc)}
    return execucao_row


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Rodar o radar processual externo com navegador real.")
    parser.add_argument("--sem-email", action="store_true", help="Nao enviar email de relatorio.")
    args = parser.parse_args(argv)

    try:
        row = rodar_worker(origem="agendada", enviar_email=not args.sem_email)
    except Exception as exc:
        print(f"[radar] FALHA: {exc}", file=sys.stderr)
        return 1

    nao_verificados = sum(
        int(row.get(key) or 0)
        for key in ("total_erro", "total_timeout", "total_captcha_timeout", "total_pagina_intermediaria")
    )
    print(
        f"[radar] Rodada {row.get('status')} - previstos={row.get('total_previstos')} "
        f"consultados={row.get('total_consultados')} movimentaram={row.get('total_com_movimentacao_nova')} "
        f"sem_movimentacao={row.get('total_sem_movimentacao')} bases={row.get('total_base_inicial_criada')} "
        f"senha={row.get('total_senha_necessaria')} nao_localizado={row.get('total_nao_localizado')} "
        f"nao_verificados={nao_verificados}"
    )
    if args.sem_email:
        print("[radar] Email: desativado (--sem-email)")
    else:
        email = row.get("email") or {}
        print(f"[radar] Email: {email.get('status')} ({email.get('destinatario') or email.get('motivo') or ''})")
    return 0
