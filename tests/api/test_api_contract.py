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
    monkeypatch.setattr(session_module, "_load_jwks", lambda _supabase_url: {"keys": [jwk]})

    response = api_client.get("/parceiros", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200, response.text


@pytest.mark.api
def test_api_crud_parceiros_uses_real_database(api_client) -> None:
    nome = f"Parceiro API {uuid.uuid4()}"
    created = _json(api_client.post("/parceiros", headers=AUTH, json={"nome": nome}))
    assert created["nome"] == nome
    rows = _json(api_client.get("/parceiros", headers=AUTH))
    assert any(row["nome"] == nome for row in rows)


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
