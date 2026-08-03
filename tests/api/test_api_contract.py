from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import uuid
from datetime import date

import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from psycopg.rows import dict_row


TEST_USER_ID = "00000000-0000-4000-8000-000000000001"
TEST_USER_EMAIL = "gacamargo2003@gmail.com"


def _signed_hs256_token(secret: str, *, sub: str | None = None, email: str = TEST_USER_EMAIL, exp_delta: int = 3600) -> str:
    def encode(data: dict[str, object]) -> str:
        raw = json.dumps(data, separators=(",", ":")).encode()
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

    header = encode({"alg": "HS256", "typ": "JWT"})
    payload = encode({
        "sub": sub or TEST_USER_ID,
        "email": email,
        "role": "authenticated",
        "aud": "authenticated",
        "exp": int(time.time()) + exp_delta,
    })
    signature = base64.urlsafe_b64encode(hmac.new(secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{header}.{payload}.{signature}"


def _base64url_uint(value: int) -> str:
    return pyjwt.utils.base64url_encode(value.to_bytes(32, "big")).decode("ascii")


def _es256_token_and_jwk(*, issuer: str, kid: str = "test-es256-key") -> tuple[str, dict[str, object]]:
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_numbers = private_key.public_key().public_numbers()
    token = pyjwt.encode(
        {
            "sub": TEST_USER_ID,
            "email": TEST_USER_EMAIL,
            "role": "authenticated",
            "aud": "authenticated",
            "iss": issuer,
            "exp": int(time.time()) + 3600,
        },
        private_key,
        algorithm="ES256",
        headers={"kid": kid, "typ": "JWT"},
    )
    jwk: dict[str, object] = {
        "kty": "EC",
        "kid": kid,
        "alg": "ES256",
        "crv": "P-256",
        "x": _base64url_uint(public_numbers.x),
        "y": _base64url_uint(public_numbers.y),
        "key_ops": ["verify"],
    }
    return token, jwk


AUTH = {"Authorization": f"Bearer {_signed_hs256_token('local-test-secret')}"}


@pytest.fixture()
def api_client(clean_db, monkeypatch: pytest.MonkeyPatch):
    with clean_db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO auth.users (id, email)
            VALUES (%s, %s)
            ON CONFLICT (id) DO UPDATE SET email = excluded.email
            """,
            (TEST_USER_ID, TEST_USER_EMAIL),
        )
    monkeypatch.setenv("DATABASE_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_DB_URL", os.environ["DATABASE_URL"])
    monkeypatch.setenv("RADAR_PASSWORD_KEY", "local-test-radar-password-key-000000")
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "local-test-secret")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    from app.api.main import app

    return TestClient(app)


def _json(response):
    assert response.status_code < 500, response.text
    return response.json()


@pytest.mark.api
@pytest.mark.security
def test_api_requires_authenticated_session(api_client) -> None:
    response = api_client.get("/parceiros")
    assert response.status_code == 401


@pytest.mark.api
def test_api_cors_allows_local_frontend(api_client) -> None:
    response = api_client.options(
        "/parceiros",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.api
@pytest.mark.security
def test_api_rejects_invalid_jwt_when_supabase_secret_is_configured(api_client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    response = api_client.get("/parceiros", headers=AUTH)
    assert response.status_code == 401


@pytest.mark.api
@pytest.mark.security
def test_api_accepts_signed_supabase_jwt_when_secret_is_configured(api_client, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    token = _signed_hs256_token("test-secret")
    response = api_client.get("/parceiros", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200, response.text


@pytest.mark.api
@pytest.mark.security
def test_api_accepts_es256_supabase_jwt_from_jwks(api_client, monkeypatch: pytest.MonkeyPatch) -> None:
    supabase_url = "https://project-ref.supabase.co"
    issuer = f"{supabase_url}/auth/v1"
    token, jwk = _es256_token_and_jwk(issuer=issuer)
    from app.db import session as session_module

    session_module._JWKS_CACHE.clear()
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "legacy-secret-present")
    monkeypatch.setenv("SUPABASE_URL", supabase_url)
    monkeypatch.setattr(session_module, "_load_jwks", lambda _supabase_url, _supabase_jwks_url=None: {"keys": [jwk]})

    response = api_client.get("/parceiros", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200, response.text


@pytest.mark.api
@pytest.mark.security
def test_me_reports_membership_and_non_member_without_data_access(api_client) -> None:
    member = api_client.get("/me", headers=AUTH)
    assert member.status_code == 200, member.text
    assert member.json()["is_member"] is True

    outsider_token = _signed_hs256_token("local-test-secret", sub="00000000-0000-4000-8000-000000000099", email="fora@example.com")
    outsider_headers = {"Authorization": f"Bearer {outsider_token}"}
    outsider = api_client.get("/me", headers=outsider_headers)
    assert outsider.status_code == 200, outsider.text
    assert outsider.json()["is_member"] is False
    assert api_client.get("/parceiros", headers=outsider_headers).status_code == 403


@pytest.mark.api
def test_bootstrap_returns_initial_frontend_payload(api_client) -> None:
    response = api_client.get("/bootstrap?ano=2026", headers=AUTH)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert {
        "parceiros",
        "contratos",
        "parcelas",
        "lancamentos",
        "custos_fixos",
        "tarefas",
        "processos",
        "parametros",
        "indicadores",
    }.issubset(payload)
    assert isinstance(payload["contratos"], list)
    assert isinstance(payload["lancamentos"], list)
    assert {"painel", "fluxo_mensal", "dre_mensal", "balanco", "analise_mensal", "gastos_categoria"}.issubset(payload["indicadores"])
    assert payload["parametros"]["ano"] == 2026


@pytest.mark.api
def test_processos_persist_excel_source_fields_and_bootstrap_returns_them(api_client, clean_db) -> None:
    payload = {
        "area_pasta": "E2E_TEST_Administrativo",
        "numero_interno": "42",
        "numero": "0000042-42.2026.8.26.0100",
        "tribunal": "TJSP",
        "status_processo": "Em acompanhamento",
        "autor": "E2E_TEST_Autor",
        "reu": "E2E_TEST_Reu",
        "comarca_vara": "2a Vara Civel de Teste",
        "assunto": "E2E_TEST Assunto processual",
        "andamento_atual": "E2E_TEST Aguardando publicacao",
        "cliente": "E2E_TEST_Cliente Processo",
        "fase_atual": "Instrucao",
        "data_ultimo_andamento": "2026-06-20",
    }
    created = _json(api_client.post("/processos", headers=AUTH, json=payload))
    for key, value in payload.items():
        assert created[key] == value

    updated = _json(
        api_client.patch(
            f"/processos/{created['id']}",
            headers=AUTH,
            json={"status_processo": "Suspenso", "andamento_atual": "E2E_TEST Prazo suspenso", "data_ultimo_andamento": "2026-06-25"},
        )
    )
    assert updated["status_processo"] == "Suspenso"
    assert updated["andamento_atual"] == "E2E_TEST Prazo suspenso"
    assert updated["data_ultimo_andamento"] == "2026-06-25"

    bootstrap = _json(api_client.get("/bootstrap?ano=2026", headers=AUTH))
    processo = next(row for row in bootstrap["processos"] if row["id"] == created["id"])
    assert processo["area_pasta"] == "E2E_TEST_Administrativo"
    assert processo["numero_interno"] == "42"
    assert processo["autor"] == "E2E_TEST_Autor"
    assert processo["reu"] == "E2E_TEST_Reu"
    assert processo["assunto"] == "E2E_TEST Assunto processual"
    assert processo["andamento_atual"] == "E2E_TEST Prazo suspenso"
    assert processo["data_ultimo_andamento"] == "2026-06-25"


@pytest.mark.api
def test_all_honorario_types_persist_and_calculate_expected_contract_values(api_client, clean_db) -> None:
    tipos = [
        "fixo_unico",
        "fixo_mensal",
        "fixo_parcelado",
        "exito_puro",
        "sucumbencia",
        "fixo_exito",
        "exito_sucumbencia",
        "fixo_exito_sucumbencia",
    ]
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"E2E_TEST_Parceiro {uuid.uuid4()}"}))
    for idx, tipo in enumerate(tipos, start=1):
        contrato = _json(
            api_client.post(
                "/contratos",
                headers=AUTH,
                json={
                    "cliente": f"E2E_TEST_Cliente_{tipo}",
                    "parceiro_id": parceiro["id"],
                    "status": "ativo",
                    "tipo_honorario": tipo,
                    "honorario_fixo_total": 1000 * idx,
                    "valor_causa": 100000,
                    "percentual_exito": 0.20,
                    "percentual_sucumbencia": 0.10,
                    "percentual_quota": 0.30,
                },
            )
        )
        parcela = _json(
            api_client.post(
                "/parcelas",
                headers=AUTH,
                json={"contrato_id": contrato["id"], "tipo": "mensal", "valor": 250 * idx, "mes_esperado": "2026-07-01"},
            )
        )
        assert parcela["contrato_id"] == contrato["id"]
        assert contrato["tipo_honorario"] == tipo

    rows = _json(api_client.get("/bootstrap?ano=2026", headers=AUTH))
    assert {row["tipo_honorario"] for row in rows["contratos"]} >= set(tipos)
    with clean_db.cursor() as cur:
        cur.execute(
            """
            SELECT count(*)
            FROM parcelas p
            LEFT JOIN contratos c ON c.id = p.contrato_id
            WHERE c.id IS NULL
            """
        )
        assert cur.fetchone()[0] == 0


@pytest.mark.api
def test_invalid_enum_and_date_payloads_return_422_not_500(api_client, clean_db) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"E2E_TEST_Parceiro Invalid {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "E2E_TEST_Cliente Invalid",
                "parceiro_id": parceiro["id"],
                "status": "ativo",
                "tipo_honorario": "fixo_mensal",
            },
        )
    )
    invalid_cases = [
        ("POST", "/contratos", {"cliente": "E2E_TEST_Status Invalido", "parceiro_id": parceiro["id"], "status": "zzz", "tipo_honorario": "fixo_mensal"}),
        ("POST", "/contratos", {"cliente": "E2E_TEST_Tipo Invalido", "parceiro_id": parceiro["id"], "status": "ativo", "tipo_honorario": "zzz"}),
        ("PATCH", f"/contratos/{contrato['id']}", {"status": "zzz"}),
        ("POST", "/parcelas", {"contrato_id": contrato["id"], "tipo": "zzz", "valor": 100, "mes_esperado": "2026-07-01"}),
        ("POST", "/lancamentos", {"tipo": "zzz", "data": "2026-07-01", "descricao": "E2E_TEST enum", "valor": 100, "categoria": "honorarios"}),
        ("POST", "/lancamentos", {"tipo": "entrada", "data": "2026-07-01", "descricao": "E2E_TEST categoria", "valor": 100, "categoria": "zzz"}),
        ("POST", "/lancamentos", {"tipo": "entrada", "data": "nao-e-data", "descricao": "E2E_TEST data", "valor": 100, "categoria": "honorarios"}),
        ("POST", "/processos", {"numero": "0000000-00.2026.8.26.0001", "tribunal": "XYZ"}),
    ]

    for method, path, payload in invalid_cases:
        request = api_client.post if method == "POST" else api_client.patch
        response = request(path, headers=AUTH, json=payload)
        assert response.status_code == 422, f"{method} {path} returned {response.status_code}: {response.text}"
        body = response.json()
        assert body["detail"]["codigo"] == "validation"


@pytest.mark.api
def test_api_crud_parceiros_uses_real_database(api_client) -> None:
    nome = f"Parceiro API {uuid.uuid4()}"
    created = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": nome}))
    assert created["nome"] == nome
    rows = _json(api_client.get("/parceiros", headers=AUTH))
    assert any(row["nome"] == nome for row in rows)


@pytest.mark.api
def test_contract_detail_and_audit_endpoints_are_thin_wrappers(api_client) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"Parceiro Detail {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={"cliente": "Cliente Detail", "parceiro_id": parceiro["id"], "status": "ativo", "tipo_honorario": "fixo_mensal"},
        )
    )
    detail = _json(api_client.get(f"/contratos/{contrato['id']}", headers=AUTH))
    assert detail["id"] == contrato["id"]
    filtered = _json(api_client.get("/contratos?status=ativo", headers=AUTH))
    assert any(row["id"] == contrato["id"] for row in filtered)
    audit = _json(api_client.get("/auditoria", headers=AUTH))
    assert any(row["entidade"] == "contratos" and row["acao"] == "criar" for row in audit)


@pytest.mark.api
def test_fechar_contrato_generates_fixed_installments_once(api_client, clean_db) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"E2E_TEST_Parceiro Fechar {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "E2E_TEST_Cliente Fechar",
                "parceiro_id": parceiro["id"],
                "status": "proposta",
                "tipo_honorario": "fixo_parcelado",
                "honorario_fixo_total": 1000,
            },
        )
    )

    closed = api_client.post(
        f"/contratos/{contrato['id']}/fechar",
        headers=AUTH,
        json={"parcelas": 4, "mes_inicio": "2026-07-01", "data_fechamento": "2026-07-15"},
    )
    assert closed.status_code == 200, closed.text
    body = closed.json()
    assert body["contrato"]["status"] == "ativo"
    assert len(body["parcelas"]) == 4
    assert [row["mes_esperado"] for row in body["parcelas"]] == ["2026-07-01", "2026-08-01", "2026-09-01", "2026-10-01"]
    assert sum(float(row["valor"]) for row in body["parcelas"]) == 1000.0

    duplicate = api_client.post(
        f"/contratos/{contrato['id']}/fechar",
        headers=AUTH,
        json={"parcelas": 4, "mes_inicio": "2026-07-01", "data_fechamento": "2026-07-15"},
    )
    assert duplicate.status_code == 409

    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*), sum(valor) FROM parcelas WHERE contrato_id=%s", (contrato["id"],))
        count, total = cur.fetchone()
        assert count == 4
        assert float(total) == 1000.0

    invalid_date_contract = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "E2E_TEST_Cliente Data Fechar",
                "parceiro_id": parceiro["id"],
                "status": "proposta",
                "tipo_honorario": "fixo_unico",
                "honorario_fixo_total": 300,
                "data_proposta": "2026-07-15",
            },
        )
    )
    invalid_date = api_client.post(
        f"/contratos/{invalid_date_contract['id']}/fechar",
        headers=AUTH,
        json={"parcelas": 1, "mes_inicio": "2026-07-01", "data_fechamento": "2026-07-01"},
    )
    assert invalid_date.status_code == 422, invalid_date.text
    assert invalid_date.json()["detail"]["codigo"] == "validation"


@pytest.mark.api
@pytest.mark.radar
def test_radar_bulk_execution_endpoint_is_disabled_for_external_worker(api_client) -> None:
    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000002-00.2026.8.06.0001", "tribunal": "TJCE"},
        )
    )
    response = api_client.post("/radar/executar", headers=AUTH)
    assert response.status_code == 409
    assert response.json()["detail"]["codigo"] == "radar_external_only"
    processos = _json(api_client.get("/processos", headers=AUTH))
    assert any(row["id"] == processo["id"] and row["monitorar"] is True for row in processos)


@pytest.mark.api
@pytest.mark.radar
def test_radar_single_process_endpoint_is_disabled_for_external_worker(api_client) -> None:
    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000003-00.2026.8.26.0001", "tribunal": "TJSP"},
        )
    )

    response = api_client.post(f"/radar/processos/{processo['id']}/executar", headers=AUTH)

    assert response.status_code == 409
    assert response.json()["detail"]["codigo"] == "radar_external_only"


@pytest.mark.api
@pytest.mark.radar
def test_radar_worker_api_ingests_local_scraper_results_without_duplicate(api_client, clean_db) -> None:
    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000456-45.2026.8.26.0100", "tribunal": "TJSP", "cliente": "E2E_TEST Radar API"},
        )
    )

    started = _json(api_client.post("/radar/worker/execucoes", headers=AUTH, json={"origem": "agendada"}))
    execucao_id = started["execucao"]["id"]
    assert started["execucao"]["status"] == "em_andamento"
    assert [row["id"] for row in started["processos"]] == [processo["id"]]
    assert "senha" in started["processos"][0]

    result_payload = {
        "processo_id": processo["id"],
        "numero_processo": processo["numero"],
        "tribunal": "TJSP",
        "status": "base_inicial_criada",
        "movimentacoes": [
            {
                "data_hora": "25/07/2026 10:00:00",
                "descricao": "E2E_TEST movimentacao capturada pelo scraper local",
                "evento": "E2E_TEST_EVENTO",
                "usuario": "E2E_TEST_USUARIO",
            }
        ],
        "quantidade_movimentacoes": 1,
        "layout_movimentacoes": "eproc_eventos",
        "tem_movimentacao_nova": False,
        "chaves_movimentacoes": ["e2e_api_key"],
        "data_ultimo_andamento": "2026-07-25",
    }
    inserted = _json(api_client.post(f"/radar/worker/execucoes/{execucao_id}/resultados", headers=AUTH, json=result_payload))
    assert inserted["execucao_id"] == execucao_id
    assert inserted["processo_id"] == processo["id"]

    duplicate = api_client.post(f"/radar/worker/execucoes/{execucao_id}/resultados", headers=AUTH, json=result_payload)
    assert duplicate.status_code == 409

    final = _json(api_client.post(f"/radar/worker/execucoes/{execucao_id}/finalizar", headers=AUTH, json={}))
    assert final["status"] == "concluida"
    assert final["total_previstos"] == 1
    assert final["total_consultados"] == 1
    assert final["total_base_inicial_criada"] == 1

    progresso = _json(api_client.get("/radar/progresso", headers=AUTH))
    assert progresso["execucao"]["id"] == execucao_id
    assert progresso["execucao"]["total_consultados"] == 1
    assert progresso["status_counts"]["base_inicial_criada"] == 1
    assert progresso["movimentacoes_novas_total"] == 0

    resumo = _json(api_client.get("/radar/resumo?historico_limit=5&movimentacoes_limit=20&automacoes_limit=20", headers=AUTH))
    assert resumo["execucao"]["id"] == execucao_id
    assert resumo["execucao"]["total_consultados"] == 1
    assert len(resumo["resultados"]) == 1
    assert resumo["resultados"][0]["processo_id"] == processo["id"]
    assert resumo["resultados"][0]["status"] == "base_inicial_criada"
    assert any(row["id"] == processo["id"] and row["ultima_consulta_status"] == "base_inicial_criada" for row in resumo["processos"])
    assert resumo["movimentacoes_novas"] == []
    assert isinstance(resumo["configuracoes"]["radar_inercia_dias"], int)

    with clean_db.cursor() as cur:
        cur.execute("SELECT ultima_consulta_status, data_ultimo_andamento, cardinality(chaves_movimentacoes) FROM processos WHERE id = %s", (processo["id"],))
        assert cur.fetchone() == ("base_inicial_criada", date(2026, 7, 25), 1)
        cur.execute("SELECT count(*) FROM resultados_consulta WHERE execucao_id = %s AND processo_id = %s", (execucao_id, processo["id"]))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM movimentacoes_novas WHERE processo_id = %s", (processo["id"],))
        assert cur.fetchone()[0] == 0


@pytest.mark.api
@pytest.mark.security
def test_sec_06_process_patch_rejects_radar_owned_columns(api_client) -> None:
    response = api_client.post(
        "/processos",
        headers=AUTH,
        json={"numero": "0000000-00.2026.8.26.0001", "tribunal": "TJSP"},
    )
    processo_id = _json(response)["id"]
    response = api_client.patch(
        f"/processos/{processo_id}",
        headers=AUTH,
        json={"chaves_movimentacoes": ["abc"], "data_ultimo_andamento": "2026-07-01", "senha_ref": "vault:00000000-0000-0000-0000-000000000000"},
    )
    assert response.status_code == 422


@pytest.mark.api
def test_tx_01_confirmar_parcela_creates_cash_entry_atomically(api_client, clean_db) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"Pavageau API {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "Cliente TX",
                "parceiro_id": parceiro["id"],
                "status": "ativo",
                "tipo_honorario": "fixo_mensal",
            },
        )
    )
    parcela = _json(
        api_client.post(
            "/parcelas",
            headers=AUTH,
            json={"contrato_id": contrato["id"], "tipo": "mensal", "valor": 750, "mes_esperado": "2026-07-01"},
        )
    )
    response = api_client.post(
        f"/parcelas/{parcela['id']}/confirmar",
        headers=AUTH,
        json={"mes_recebimento": "2026-07-01", "data_pagamento": "2026-07-15"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["parcela"]["recebido"] is True
    assert body["lancamento"]["origem"] == "parcela"

    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM lancamentos WHERE origem='parcela' AND origem_id=%s", (parcela["id"],))
        assert cur.fetchone()[0] == 1


@pytest.mark.api
def test_tx_parcela_duplicate_confirm_and_estorno_do_not_leave_orphans(api_client, clean_db) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"E2E_TEST_Parceiro TX {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "E2E_TEST_Cliente Estorno",
                "parceiro_id": parceiro["id"],
                "status": "ativo",
                "tipo_honorario": "fixo_exito_sucumbencia",
                "honorario_fixo_total": 1200,
                "valor_causa": 50000,
                "percentual_exito": 0.15,
                "percentual_sucumbencia": 0.10,
                "percentual_quota": 0.25,
            },
        )
    )
    parcela = _json(
        api_client.post(
            "/parcelas",
            headers=AUTH,
            json={"contrato_id": contrato["id"], "tipo": "mensal", "valor": 1200, "mes_esperado": "2026-07-01"},
        )
    )
    confirmed = api_client.post(
        f"/parcelas/{parcela['id']}/confirmar",
        headers=AUTH,
        json={"mes_recebimento": "2026-07-01", "data_pagamento": "2026-07-15"},
    )
    assert confirmed.status_code == 200, confirmed.text
    duplicate = api_client.post(
        f"/parcelas/{parcela['id']}/confirmar",
        headers=AUTH,
        json={"mes_recebimento": "2026-07-01", "data_pagamento": "2026-07-15"},
    )
    assert duplicate.status_code == 409
    blocked_delete = api_client.delete(f"/parcelas/{parcela['id']}", headers=AUTH)
    assert blocked_delete.status_code == 409
    assert blocked_delete.json()["detail"]["codigo"] == "conflict"

    estornado = api_client.post(f"/parcelas/{parcela['id']}/estornar", headers=AUTH)
    assert estornado.status_code == 200, estornado.text
    assert estornado.json()["recebido"] is False
    duplicate_estorno = api_client.post(f"/parcelas/{parcela['id']}/estornar", headers=AUTH)
    assert duplicate_estorno.status_code == 409
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM lancamentos WHERE origem='parcela' AND origem_id=%s", (parcela["id"],))
        assert cur.fetchone()[0] == 0
        cur.execute(
            """
            SELECT count(*)
            FROM lancamentos l
            LEFT JOIN contratos c ON c.id = l.contrato_id
            WHERE l.contrato_id IS NOT NULL AND c.id IS NULL
            """
        )
        assert cur.fetchone()[0] == 0


@pytest.mark.api
def test_data_integrity_rejects_invalid_references_without_orphans(api_client, clean_db) -> None:
    missing_required = api_client.post(
        "/parcelas",
        headers=AUTH,
        json={"tipo": "mensal", "valor": 100, "mes_esperado": "2026-07-01"},
    )
    assert missing_required.status_code == 422, missing_required.text
    assert missing_required.json()["detail"]["codigo"] == "validation"

    invalid_contract = api_client.post(
        "/parcelas",
        headers=AUTH,
        json={"contrato_id": str(uuid.uuid4()), "tipo": "mensal", "valor": 100, "mes_esperado": "2026-07-01"},
    )
    assert invalid_contract.status_code == 422, invalid_contract.text
    assert invalid_contract.json()["detail"]["codigo"] == "validation"

    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"E2E_TEST_Parceiro FK {uuid.uuid4()}"}))
    _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={
                "cliente": "E2E_TEST_Cliente FK",
                "parceiro_id": parceiro["id"],
                "status": "ativo",
                "tipo_honorario": "fixo_mensal",
            },
        )
    )
    protected_delete = api_client.delete(f"/parceiros/{parceiro['id']}", headers=AUTH)
    assert protected_delete.status_code == 409, protected_delete.text
    assert protected_delete.json()["detail"]["codigo"] == "conflict"

    with clean_db.cursor() as cur:
        cur.execute(
            """
            SELECT count(*)
            FROM parcelas p
            LEFT JOIN contratos c ON c.id = p.contrato_id
            WHERE c.id IS NULL
            """
        )
        assert cur.fetchone()[0] == 0
        cur.execute(
            """
            SELECT count(*)
            FROM contratos c
            LEFT JOIN parceiros p ON p.id = c.parceiro_id
            WHERE p.id IS NULL
            """
        )
        assert cur.fetchone()[0] == 0


@pytest.mark.api
def test_tx_09_delete_contract_requires_explicit_cascade(api_client) -> None:
    parceiro = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": f"Parceiro Cascade {uuid.uuid4()}"}))
    contrato = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={"cliente": "Cliente Cascade", "parceiro_id": parceiro["id"], "status": "ativo", "tipo_honorario": "fixo_mensal"},
        )
    )
    _json(
        api_client.post(
            "/parcelas",
            headers=AUTH,
            json={"contrato_id": contrato["id"], "tipo": "mensal", "valor": 100, "mes_esperado": "2026-07-01"},
        )
    )
    assert api_client.delete(f"/contratos/{contrato['id']}", headers=AUTH).status_code == 409
    assert api_client.delete(f"/contratos/{contrato['id']}?cascade=true", headers=AUTH).status_code == 200

    contrato_recebido = _json(
        api_client.post(
            "/contratos",
            headers=AUTH,
            json={"cliente": "Cliente Cascade Recebido", "parceiro_id": parceiro["id"], "status": "ativo", "tipo_honorario": "fixo_mensal"},
        )
    )
    parcela_recebida = _json(
        api_client.post(
            "/parcelas",
            headers=AUTH,
            json={"contrato_id": contrato_recebido["id"], "tipo": "mensal", "valor": 100, "mes_esperado": "2026-07-01"},
        )
    )
    assert api_client.post(
        f"/parcelas/{parcela_recebida['id']}/confirmar",
        headers=AUTH,
        json={"mes_recebimento": "2026-07-01", "data_pagamento": "2026-07-15"},
    ).status_code == 200
    blocked = api_client.delete(f"/contratos/{contrato_recebido['id']}?cascade=true", headers=AUTH)
    assert blocked.status_code == 409
    assert blocked.json()["detail"]["codigo"] == "conflict"


@pytest.mark.api
def test_parametros_put_is_idempotent_upsert(api_client) -> None:
    payload = {
        "caixa_inicial_ano": 1000,
        "meta_caixa_ano": 2000,
        "meta_recorrencia_mensal": 300,
        "recorrencia_atual": 250,
    }
    created = api_client.put("/parametros/2026", headers=AUTH, json=payload)
    assert created.status_code == 200, created.text

    updated = api_client.put("/parametros/2026", headers=AUTH, json={**payload, "meta_caixa_ano": 2500})
    assert updated.status_code == 200, updated.text
    assert updated.json()["meta_caixa_ano"] == 2500.0


@pytest.mark.api
@pytest.mark.security
def test_sec_03_password_registration_never_echoes_secret(api_client, clean_db) -> None:
    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000001-00.2026.8.26.0001", "tribunal": "TJSP"},
        )
    )
    response = api_client.put(f"/processos/{processo['id']}/senha", headers=AUTH, json={"senha": "segredo-processual"})
    assert response.status_code == 200, response.text
    assert "segredo-processual" not in response.text
    assert "senha_ref" not in response.text
    with clean_db.cursor() as cur:
        cur.execute("SELECT senha_ref FROM processos WHERE id=%s", (processo["id"],))
        assert cur.fetchone()[0].startswith("vault:")
        cur.execute("SELECT valor_novo::text FROM auditoria WHERE entidade='processos' ORDER BY id DESC LIMIT 1")
        assert "segredo-processual" not in cur.fetchone()[0]


@pytest.mark.api
def test_tasks_robust_status_lifecycle_archive_restore_and_delete(api_client, clean_db) -> None:
    task = _json(
        api_client.post(
            "/tarefas",
            headers=AUTH,
            json={
                "titulo": f"E2E_TEST_Tarefa robusta {uuid.uuid4()}",
                "descricao": "Tarefa criada por teste automatizado",
                "status": "backlog",
                "prioridade": "urgente",
                "responsavel": TEST_USER_EMAIL,
                "data_inicio": "2026-07-23",
                "prazo": "2026-07-30",
                "estimativa_minutos": 60,
                "tags": ["E2E_TEST", "tarefas"],
                "observacoes": "sem segredo",
            },
        )
    )
    task_id = task["id"]
    assert task["status"] == "backlog"

    statuses = _json(api_client.get("/tarefas/statuses", headers=AUTH))
    assert [row["slug"] for row in statuses] == ["backlog", "a_fazer", "em_andamento", "aguardando", "bloqueada", "em_revisao", "concluida"]

    for status in ["a_fazer", "em_andamento", "aguardando", "bloqueada", "em_revisao"]:
        moved = _json(api_client.post(f"/tarefas/{task_id}/status", headers=AUTH, json={"status": status}))
        assert moved["status"] == status

    checklist = _json(api_client.post(f"/tarefas/{task_id}/checklist", headers=AUTH, json={"titulo": "E2E_TEST checklist"}))
    subtask = _json(api_client.post(f"/tarefas/{task_id}/subtarefas", headers=AUTH, json={"titulo": "E2E_TEST subtarefa", "prioridade": "alta"}))
    blocked = api_client.post(f"/tarefas/{task_id}/concluir", headers=AUTH)
    assert blocked.status_code == 409
    assert blocked.json()["detail"]["codigo"] == "conflict"

    assert _json(api_client.patch(f"/tarefas/{task_id}/checklist/{checklist['id']}", headers=AUTH, json={"concluido": True}))["concluido"] is True
    assert _json(api_client.patch(f"/tarefas/{task_id}/subtarefas/{subtask['id']}", headers=AUTH, json={"status": "concluida"}))["status"] == "concluida"

    completed = _json(api_client.post(f"/tarefas/{task_id}/concluir", headers=AUTH))
    assert completed["status"] == "concluida"
    assert completed["completed_at"] is not None

    reopened = _json(api_client.post(f"/tarefas/{task_id}/reabrir", headers=AUTH, json={"status": "a_fazer"}))
    assert reopened["status"] == "a_fazer"
    assert reopened["completed_at"] is None

    archived = _json(api_client.delete(f"/tarefas/{task_id}", headers=AUTH))
    assert archived["archived_at"] is not None
    archived_rows = _json(api_client.get("/tarefas?view=arquivadas", headers=AUTH))
    assert any(row["id"] == task_id for row in archived_rows)

    restored = _json(api_client.post(f"/tarefas/{task_id}/restaurar", headers=AUTH))
    assert restored["archived_at"] is None

    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefa_historico WHERE tarefa_id = %s", (task_id,))
        assert cur.fetchone()[0] >= 1

    deleted = api_client.delete(f"/tarefas/{task_id}?permanent=true", headers=AUTH)
    assert deleted.status_code == 204
    assert api_client.get(f"/tarefas/{task_id}", headers=AUTH).status_code == 404


@pytest.mark.api
def test_tasks_radar_movement_creation_is_idempotent_and_marks_source(api_client, clean_db) -> None:
    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000777-77.2026.8.26.0100", "tribunal": "TJSP", "cliente": "E2E_TEST Radar"},
        )
    )
    with clean_db.cursor() as cur:
        cur.execute("INSERT INTO execucoes_radar (origem, status, total_consultados, total_sucesso) VALUES ('agendada', 'concluida', 1, 1) RETURNING id")
        execucao_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO resultados_consulta (execucao_id, processo_id, numero_processo, tribunal, status, quantidade_movimentacoes, tem_movimentacao_nova)
            VALUES (%s, %s, %s, 'TJSP', 'sucesso', 1, true)
            RETURNING id
            """,
            (execucao_id, processo["id"], processo["numero"]),
        )
        resultado_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (execucao_id, processo_id, resultado_id, chave, descricao)
            VALUES (%s, %s, %s, 'E2E_TEST_MOV', 'E2E_TEST movimento processual')
            RETURNING id
            """,
            (execucao_id, processo["id"], resultado_id),
        )
        movimento_id = cur.fetchone()[0]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (execucao_id, processo_id, resultado_id, chave, descricao)
            VALUES (%s, %s, %s, 'E2E_TEST_MOV_2', 'E2E_TEST segunda movimentacao pendente')
            RETURNING id
            """,
            (execucao_id, processo["id"], resultado_id),
        )
        movimento_id_2 = cur.fetchone()[0]

    first = _json(api_client.post(f"/movimentacoes/{movimento_id}/criar-tarefa", headers=AUTH, json={}))
    second = _json(api_client.post(f"/movimentacoes/{movimento_id}/criar-tarefa", headers=AUTH, json={}))
    assert first["id"] == second["id"]
    assert first["origem"] == "radar_movimentacao"
    assert first["status"] == "a_fazer"

    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM tarefas WHERE movimentacao_id = %s", (movimento_id,))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM tarefas WHERE processo_id = %s AND origem = 'radar_movimentacao'", (processo["id"],))
        assert cur.fetchone()[0] == 1
        cur.execute("SELECT count(*) FROM tarefa_movimentacoes WHERE tarefa_id = %s", (first["id"],))
        assert cur.fetchone()[0] == 2
        cur.execute("SELECT status_analise, virou_tarefa, tarefa_principal_id FROM movimentacoes_novas WHERE id IN (%s, %s) ORDER BY chave", (movimento_id, movimento_id_2))
        rows = [(status, virou, str(task_id)) for status, virou, task_id in cur.fetchall()]
        assert rows == [("em_tarefa", True, first["id"]), ("em_tarefa", True, first["id"])]

    concluded = _json(api_client.post(f"/tarefas/{first['id']}/concluir", headers=AUTH, json={"force": True}))
    assert len(concluded["movimentacoes_atualizadas"]) == 2
    with clean_db.cursor() as cur:
        cur.execute("SELECT count(*) FROM movimentacoes_novas WHERE processo_id = %s AND status_analise = 'concluida'", (processo["id"],))
        assert cur.fetchone()[0] == 2


@pytest.mark.api
@pytest.mark.radar
def test_radar_automation_suggestion_api_approves_with_edit_and_deduplicates(api_client, clean_db) -> None:
    from app.radar.automation import processar_movimentacao_automacao

    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000888-88.2026.8.26.0100", "tribunal": "TJSP", "cliente": "E2E_TEST Automacao"},
        )
    )
    with clean_db.cursor(row_factory=dict_row) as cur:
        cur.execute("INSERT INTO execucoes_radar (origem, status, total_consultados, total_sucesso) VALUES ('agendada', 'concluida', 1, 1) RETURNING id")
        execucao_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO resultados_consulta (execucao_id, processo_id, numero_processo, tribunal, status, quantidade_movimentacoes, tem_movimentacao_nova)
            VALUES (%s, %s, %s, 'TJSP', 'sucesso', 1, true)
            RETURNING id
            """,
            (execucao_id, processo["id"], processo["numero"]),
        )
        resultado_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (execucao_id, processo_id, resultado_id, chave, data_hora, descricao, evento, usuario)
            VALUES (%s, %s, %s, 'E2E_TEST_AUTO_API', '26/07/2026 11:00:00', 'Intimação publicada E2E_TEST', 'Publicação', 'Cartório')
            RETURNING *
            """,
            (execucao_id, processo["id"], resultado_id),
        )
        movimento = dict(cur.fetchone())
        cur.execute("SELECT * FROM processos WHERE id = %s", (processo["id"],))
        processo_row = dict(cur.fetchone())

    processar_movimentacao_automacao(clean_db, movimento, processo_row)

    automacoes = _json(api_client.get("/radar/automacoes?status=aguardando_aprovacao", headers=AUTH))
    sugestao = next(row for row in automacoes if row["movimentacao_id"] == str(movimento["id"]))
    assert sugestao["status"] == "aguardando_aprovacao"
    assert sugestao["tarefa_id"] is None

    movimentacoes = _json(api_client.get("/radar/movimentacoes-novas", headers=AUTH))
    enriched = next(row for row in movimentacoes if row["id"] == str(movimento["id"]))
    assert enriched["data_hora"] == "26/07/2026 11:00:00"
    assert enriched["classificacao_status"] == "reconhecida"
    assert enriched["automacao_status"] == "aguardando_aprovacao"

    approved = _json(
        api_client.post(
            f"/radar/automacoes/{sugestao['id']}/aprovar",
            headers=AUTH,
            json={"titulo": "E2E_TEST tarefa aprovada", "descricao": "E2E_TEST descrição aprovada", "prioridade": "alta"},
        )
    )
    assert approved["execucao"]["status"] == "tarefa_criada"
    assert approved["tarefa"]["titulo"] == "E2E_TEST tarefa aprovada"
    assert approved["tarefa"]["processo_id"] == processo["id"]
    assert approved["tarefa"]["movimentacao_id"] == str(movimento["id"])
    assert approved["tarefa"]["radar_automacao_execucao_id"] == sugestao["id"]

    duplicate = api_client.post(
        f"/radar/automacoes/{sugestao['id']}/aprovar",
        headers=AUTH,
        json={"titulo": "E2E_TEST duplicada", "descricao": "E2E_TEST duplicada"},
    )
    assert duplicate.status_code == 409


@pytest.mark.api
@pytest.mark.radar
def test_radar_task_completion_chains_next_suggestion_through_api(api_client, clean_db) -> None:
    from app.radar.automation import processar_movimentacao_automacao

    processo = _json(
        api_client.post(
            "/processos",
            headers=AUTH,
            json={"numero": "0000999-99.2026.8.26.0100", "tribunal": "TJSP", "cliente": "E2E_TEST Encadeamento"},
        )
    )
    with clean_db.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            INSERT INTO configuracoes (chave, valor, descricao)
            VALUES ('radar_encadeamento_tarefas_ativo', 'true', 'E2E_TEST')
            ON CONFLICT (chave) DO UPDATE SET valor = excluded.valor
            """
        )
        cur.execute("INSERT INTO radar_movimentacao_tipos (slug, nome) VALUES ('e2e_current_api_chain', 'E2E current') ON CONFLICT (slug) DO UPDATE SET ativo = true RETURNING id")
        current_type = cur.fetchone()["id"]
        cur.execute("INSERT INTO radar_movimentacao_tipos (slug, nome) VALUES ('e2e_next_api_chain', 'E2E next') ON CONFLICT (slug) DO UPDATE SET ativo = true RETURNING id")
        next_type = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO radar_automacao_regras (
              slug, nome, tipo_id, titulo_template, descricao_template,
              prioridade, requer_aprovacao, cria_tarefa, ativa, versao
            )
            VALUES ('e2e_next_api_chain', 'E2E próxima etapa API', %s, 'E2E_TEST próxima {{numero_processo}}', 'E2E_TEST próxima descrição', 'alta', true, true, true, 1)
            ON CONFLICT (slug, versao) DO UPDATE SET tipo_id = excluded.tipo_id, ativa = true, requer_aprovacao = true
            RETURNING id
            """,
            (next_type,),
        )
        next_rule = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO radar_automacao_regras (
              slug, nome, tipo_id, titulo_template, descricao_template,
              prioridade, requer_aprovacao, cria_tarefa, proxima_regra_id, ativa, versao
            )
            VALUES ('e2e_current_api_chain', 'E2E atual API', %s, 'E2E_TEST atual {{numero_processo}}', 'E2E_TEST atual descrição', 'alta', false, true, %s, true, 1)
            ON CONFLICT (slug, versao) DO UPDATE SET tipo_id = excluded.tipo_id, proxima_regra_id = excluded.proxima_regra_id, ativa = true, requer_aprovacao = false
            RETURNING id
            """,
            (current_type, next_rule),
        )
        current_rule = cur.fetchone()["id"]
        cur.execute("DELETE FROM radar_automacao_padroes WHERE regra_id = %s", (current_rule,))
        cur.execute(
            "INSERT INTO radar_automacao_padroes (regra_id, campo, operador, valor, peso, obrigatorio) VALUES (%s, 'descricao', 'contains', 'e2e_current_api_chain', 5, true)",
            (current_rule,),
        )
        cur.execute("INSERT INTO execucoes_radar (origem, status, total_consultados, total_sucesso) VALUES ('agendada', 'concluida', 1, 1) RETURNING id")
        execucao_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO resultados_consulta (execucao_id, processo_id, numero_processo, tribunal, status, quantidade_movimentacoes, tem_movimentacao_nova)
            VALUES (%s, %s, %s, 'TJSP', 'sucesso', 1, true)
            RETURNING id
            """,
            (execucao_id, processo["id"], processo["numero"]),
        )
        resultado_id = cur.fetchone()["id"]
        cur.execute(
            """
            INSERT INTO movimentacoes_novas (execucao_id, processo_id, resultado_id, chave, data_hora, descricao)
            VALUES (%s, %s, %s, 'E2E_TEST_CHAIN_API', '26/07/2026 12:00:00', 'Movimento e2e_current_api_chain')
            RETURNING *
            """,
            (execucao_id, processo["id"], resultado_id),
        )
        movimento = dict(cur.fetchone())
        cur.execute("SELECT * FROM processos WHERE id = %s", (processo["id"],))
        processo_row = dict(cur.fetchone())

    created = processar_movimentacao_automacao(clean_db, movimento, processo_row)
    task_id = str(created["tarefa"]["id"])

    completed = _json(api_client.post(f"/tarefas/{task_id}/concluir", headers=AUTH, json={}))

    proxima = completed["radar_proxima_automacao"]["execucao"]
    assert proxima["status"] == "aguardando_aprovacao"
    assert proxima["gatilho"] == "tarefa_concluida"
    assert proxima["tarefa_anterior_id"] == task_id

    automacoes = _json(api_client.get("/radar/automacoes?status=aguardando_aprovacao", headers=AUTH))
    sugestoes = [row for row in automacoes if row["tarefa_anterior_id"] == task_id]
    assert len(sugestoes) == 1
    assert sugestoes[0]["tarefa_anterior_titulo"] == created["tarefa"]["titulo"]

    _json(api_client.post(f"/tarefas/{task_id}/reabrir", headers=AUTH, json={"status": "a_fazer"}))
    completed_again = _json(api_client.post(f"/tarefas/{task_id}/concluir", headers=AUTH, json={}))
    assert completed_again["radar_proxima_automacao"]["execucao"]["id"] == proxima["id"]
