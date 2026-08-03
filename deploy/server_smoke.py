from __future__ import annotations

import json
import os
import time

import httpx
import jwt


BASE_URL = "http://127.0.0.1:8000"
TEST_USER_ID = "00000000-0000-4000-8000-000000000001"
TEST_USER_EMAIL = "gacamargo2003@gmail.com"


def token() -> str:
    secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not secret:
        raise RuntimeError("SUPABASE_JWT_SECRET ausente")
    return jwt.encode(
        {
            "sub": TEST_USER_ID,
            "email": TEST_USER_EMAIL,
            "role": "authenticated",
            "aud": "authenticated",
            "exp": int(time.time()) + 600,
        },
        secret,
        algorithm="HS256",
    )


def main() -> int:
    bearer = token()
    headers = {"Authorization": f"Bearer {bearer}"}
    results: dict[str, int | str | bool] = {}
    with httpx.Client(timeout=20) as client:
        for name, method, path in [
            ("health", "GET", "/health"),
            ("docs_disabled", "GET", "/docs"),
            ("me", "GET", "/me"),
            ("bootstrap", "GET", "/bootstrap?ano=2026"),
            ("processos", "GET", "/processos?limit=1"),
            ("tarefas", "GET", "/tarefas?limit=1"),
            ("radar_ultima", "GET", "/radar/ultima"),
        ]:
            request_headers = headers if name not in {"health", "docs_disabled"} else {}
            response = client.request(method, BASE_URL + path, headers=request_headers)
            results[name] = response.status_code
            if name == "me" and response.status_code == 200:
                results["me_is_member"] = bool(response.json().get("is_member"))
        cors = client.options(
            BASE_URL + "/bootstrap?ano=2026",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "GET",
                "Authorization": "Bearer redacted",
            },
        )
        results["cors"] = cors.status_code
        results["cors_origin_allowed"] = cors.headers.get("access-control-allow-origin") == "http://localhost:5173"
    print(json.dumps(results, sort_keys=True))
    expected = {
        "health": 200,
        "docs_disabled": 404,
        "me": 200,
        "bootstrap": 200,
        "processos": 200,
        "tarefas": 200,
        "radar_ultima": 200,
        "cors": 200,
    }
    for key, value in expected.items():
        if results.get(key) != value:
            return 1
    if not results.get("me_is_member") or not results.get("cors_origin_allowed"):
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
