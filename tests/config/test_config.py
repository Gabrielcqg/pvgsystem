from __future__ import annotations

import os

import pytest


@pytest.mark.config
def test_cfg_03_aws_region_defaults_to_sa_east_1(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    monkeypatch.delenv("AWS_REGION", raising=False)
    assert Settings.from_env().aws_region == "sa-east-1"


@pytest.mark.config
def test_cfg_03_invalid_region_fails_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    monkeypatch.setenv("AWS_REGION", "moon-1")
    with pytest.raises(ValueError, match="AWS_REGION='moon-1' invalid"):
        Settings.from_env()


@pytest.mark.config
def test_cfg_04_local_settings_do_not_require_supabase_or_region(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    for key in os.environ:
        if key.startswith("SUPABASE_") or key in {"AWS_REGION", "RADAR_DB_URL"}:
            monkeypatch.delenv(key, raising=False)

    settings = Settings.from_env()
    assert settings.aws_region == "sa-east-1"
    assert settings.supabase_url is None


@pytest.mark.config
def test_cfg_supabase_auth_settings_are_loaded(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    monkeypatch.setenv("SUPABASE_JWT_SECRET", "jwt-secret")
    monkeypatch.setenv("SUPABASE_ALLOWED_EMAILS", "gacamargo2003@gmail.com")
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    settings = Settings.from_env()
    assert settings.supabase_jwt_secret == "jwt-secret"
    assert settings.supabase_allowed_emails == "gacamargo2003@gmail.com"
    assert settings.cors_allowed_origins == "http://localhost:5173,http://127.0.0.1:5173"


@pytest.mark.config
def test_cfg_cors_origins_are_parsed(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings, cors_origins

    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173, http://127.0.0.1:5173")

    assert cors_origins(Settings.from_env()) == ["http://localhost:5173", "http://127.0.0.1:5173"]
