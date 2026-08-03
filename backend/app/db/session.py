from __future__ import annotations

import atexit
import base64
import hashlib
import hmac
import json
import os
import threading
import time
import urllib.error
import urllib.request
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Any, Iterator

import jwt as pyjwt
import psycopg
from psycopg_pool import ConnectionPool


@dataclass(frozen=True)
class Caller:
    jwt: str
    user_id: str | None
    claims: dict[str, Any]


class JwtValidationError(ValueError):
    pass


class NotAppMemberError(Exception):
    """Authenticated caller is not on the app_members allowlist."""


# Reusing warm connections is essential: opening a fresh connection to the remote
# Supabase pooler costs ~1.5s per request. Pools are keyed by database_url so tests
# (which point at a local DB) and production stay isolated.
_POOLS: dict[str, ConnectionPool] = {}
_POOLS_LOCK = threading.Lock()


def _get_pool(database_url: str) -> ConnectionPool:
    pool = _POOLS.get(database_url)
    if pool is None:
        with _POOLS_LOCK:
            pool = _POOLS.get(database_url)
            if pool is None:
                pool = ConnectionPool(
                    database_url,
                    min_size=1,
                    max_size=8,
                    max_idle=60,
                    max_lifetime=600,
                    timeout=30,
                    open=True,
                    name="caller",
                )
                _POOLS[database_url] = pool
    return pool


@atexit.register
def _close_pools() -> None:
    for pool in list(_POOLS.values()):
        try:
            pool.close()
        except Exception:
            pass


JWKS_CACHE_SECONDS = 600
ASYMMETRIC_ALGORITHMS = {"ES256", "RS256"}
_JWKS_CACHE: dict[str, tuple[float, dict[str, Any]]] = {}


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


def _expected_issuer(supabase_url: str) -> str:
    return f"{supabase_url.rstrip('/')}/auth/v1"


def _jwks_url(supabase_url: str, supabase_jwks_url: str | None = None) -> str:
    return supabase_jwks_url or f"{_expected_issuer(supabase_url)}/.well-known/jwks.json"


def _load_jwks(supabase_url: str, supabase_jwks_url: str | None = None) -> dict[str, Any]:
    url = _jwks_url(supabase_url, supabase_jwks_url)
    cached = _JWKS_CACHE.get(url)
    current = time.monotonic()
    if cached and current - cached[0] < JWKS_CACHE_SECONDS:
        return cached[1]
    try:
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (OSError, urllib.error.URLError, json.JSONDecodeError) as exc:
        jwks_file = os.getenv("SUPABASE_JWKS_FILE")
        if not jwks_file:
            raise JwtValidationError("JWKS indisponivel") from exc
        try:
            with open(jwks_file, encoding="utf-8") as handle:
                data = json.load(handle)
        except (OSError, json.JSONDecodeError) as file_exc:
            raise JwtValidationError("JWKS indisponivel") from file_exc
    if not isinstance(data, dict) or not isinstance(data.get("keys"), list):
        raise JwtValidationError("JWKS invalido")
    _JWKS_CACHE[url] = (current, data)
    return data


def _validate_claims(claims: dict[str, Any], *, now: int | None = None, issuer: str | None = None) -> dict[str, Any]:
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
    aud = claims.get("aud")
    if aud not in {None, "authenticated"}:
        if not (isinstance(aud, list) and "authenticated" in aud):
            raise JwtValidationError("JWT sem aud authenticated")
    if issuer and claims.get("iss") != issuer:
        raise JwtValidationError("Emissor JWT invalido")
    claims.setdefault("role", "authenticated")
    return claims


def _verify_hs256(signing_input: str, signature: str, secret: str, *, now: int | None) -> dict[str, Any]:
    expected = _encode_signature(hmac.new(secret.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(expected, signature):
        raise JwtValidationError("Assinatura JWT invalida")
    claims = _decode_json_segment(signing_input.split(".", 1)[1])
    return _validate_claims(claims, now=now)


def _verify_asymmetric(token: str, header: dict[str, Any], *, supabase_url: str | None, supabase_jwks_url: str | None, now: int | None) -> dict[str, Any]:
    if not supabase_url:
        raise JwtValidationError("SUPABASE_URL necessario para validar JWT assimetrico")
    kid = header.get("kid")
    alg = header.get("alg")
    if not kid or alg not in ASYMMETRIC_ALGORITHMS:
        raise JwtValidationError("JWT assimetrico invalido")
    jwks = _load_jwks(supabase_url, supabase_jwks_url)
    matching_key = next(
        (
            key
            for key in jwks["keys"]
            if key.get("kid") == kid and key.get("alg", alg) == alg
        ),
        None,
    )
    if matching_key is None:
        raise JwtValidationError("Chave JWT nao encontrada")
    try:
        signing_key = pyjwt.PyJWK.from_dict(matching_key).key
        claims = pyjwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            options={"verify_aud": False, "verify_exp": False, "verify_nbf": False, "verify_iat": False},
        )
    except pyjwt.PyJWTError as exc:
        raise JwtValidationError("Assinatura JWT invalida") from exc
    if not isinstance(claims, dict):
        raise JwtValidationError("JWT invalido")
    return _validate_claims(claims, now=now, issuer=_expected_issuer(supabase_url))


def parse_jwt_claims(
    token: str,
    *,
    jwt_secret: str | None = None,
    supabase_url: str | None = None,
    supabase_jwks_url: str | None = None,
    now: int | None = None,
) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 3:
        raise JwtValidationError("JWT invalido")
    header = _decode_json_segment(parts[0])
    claims = _decode_json_segment(parts[1])
    alg = header.get("alg")
    if alg == "HS256" and jwt_secret:
        return _verify_hs256(f"{parts[0]}.{parts[1]}", parts[2], jwt_secret, now=now)
    if alg in ASYMMETRIC_ALGORITHMS:
        return _verify_asymmetric(token, header, supabase_url=supabase_url, supabase_jwks_url=supabase_jwks_url, now=now)
    raise JwtValidationError("JWT sem verificador configurado")


def parse_jwt_sub(jwt: str) -> str | None:
    try:
        data = parse_jwt_claims(jwt)
    except JwtValidationError:
        return None
    sub = data.get("sub")
    return str(sub) if sub else None


@contextmanager
def caller_connection(
    database_url: str, caller: Caller, *, require_member: bool = False
) -> Iterator[psycopg.Connection]:
    pool = _get_pool(database_url)
    with pool.connection() as conn:
        claims_payload = dict(caller.claims)
        claims_payload["sub"] = caller.user_id
        claims_payload["role"] = "authenticated"
        claims = json.dumps(claims_payload)
        member_cur = None
        # Pipeline the role/claims setup (and optional membership check) so the
        # whole per-request preamble costs a single network round trip instead of
        # four sequential ones over the high-latency link to the remote pooler.
        with conn.pipeline():
            conn.cursor().execute("SET LOCAL ROLE authenticated")
            conn.cursor().execute(
                "SELECT set_config('request.jwt.claims', %s, true),"
                " set_config('request.jwt.claim.sub', %s, true),"
                " set_config('request.jwt.claim.role', 'authenticated', true)",
                (claims, caller.user_id or ""),
            )
            if require_member:
                member_cur = conn.cursor()
                member_cur.execute("SELECT public.current_user_is_app_member()")
        if require_member:
            if member_cur is None:
                raise NotAppMemberError()
            row = member_cur.fetchone()
            if not row or not row[0]:
                raise NotAppMemberError()
        yield conn
        conn.commit()


@contextmanager
def radar_connection(radar_db_url: str) -> Iterator[psycopg.Connection]:
    pool = _get_pool(radar_db_url)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SET LOCAL ROLE radar_worker")
        yield conn
        conn.commit()
