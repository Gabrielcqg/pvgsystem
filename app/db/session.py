from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Iterator

import psycopg


@dataclass(frozen=True)
class Caller:
    jwt: str
    user_id: str | None
    claims: dict[str, Any]


class JwtValidationError(ValueError):
    pass


def _decode_json_segment(segment: str) -> dict[str, Any]:
    payload = segment + "=" * (-len(segment) % 4)
    try:
        data = json.loads(base64.urlsafe_b64decode(payload.encode("ascii")))
    except Exception as exc:
        raise JwtValidationError("JWT invalido") from exc
    if not isinstance(data, dict):
        raise JwtValidationError("JWT invalido")
    return data


def _encode_signature(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def parse_jwt_claims(jwt: str, *, jwt_secret: str | None = None, now: int | None = None) -> dict[str, Any]:
    parts = jwt.split(".")
    if len(parts) != 3:
        if jwt_secret:
            raise JwtValidationError("JWT invalido")
        return {"sub": None, "role": "authenticated"}
    header = _decode_json_segment(parts[0])
    claims = _decode_json_segment(parts[1])
    if jwt_secret:
        if header.get("alg") != "HS256":
            raise JwtValidationError("Algoritmo JWT nao suportado")
        expected = _encode_signature(hmac.new(jwt_secret.encode("utf-8"), f"{parts[0]}.{parts[1]}".encode("ascii"), hashlib.sha256).digest())
        if not hmac.compare_digest(expected, parts[2]):
            raise JwtValidationError("Assinatura JWT invalida")
        current = int(time.time()) if now is None else now
        exp = claims.get("exp")
        if exp is not None and int(exp) <= current:
            raise JwtValidationError("JWT expirado")
        nbf = claims.get("nbf")
        if nbf is not None and int(nbf) > current:
            raise JwtValidationError("JWT ainda nao valido")
        sub = claims.get("sub")
        if not sub:
            raise JwtValidationError("JWT sem sub")
        role = claims.get("role")
        if role not in {None, "authenticated"}:
            raise JwtValidationError("JWT sem role authenticated")
    claims.setdefault("role", "authenticated")
    return claims


def parse_jwt_sub(jwt: str) -> str | None:
    try:
        data = parse_jwt_claims(jwt)
    except JwtValidationError:
        return None
    sub = data.get("sub")
    return str(sub) if sub else None


@contextmanager
def caller_connection(database_url: str, caller: Caller) -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL ROLE authenticated")
            claims_payload = dict(caller.claims)
            claims_payload["sub"] = caller.user_id
            claims_payload["role"] = "authenticated"
            claims = json.dumps(claims_payload)
            cur.execute("SELECT set_config('request.jwt.claims', %s, true)", (claims,))
            cur.execute("SELECT set_config('request.jwt.claim.sub', %s, true)", (caller.user_id or "",))
            cur.execute("SELECT set_config('request.jwt.claim.role', 'authenticated', true)")
        yield conn
        conn.commit()


@contextmanager
def radar_connection(radar_db_url: str) -> Iterator[psycopg.Connection]:
    with psycopg.connect(radar_db_url) as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL ROLE radar_worker")
        yield conn
        conn.commit()
