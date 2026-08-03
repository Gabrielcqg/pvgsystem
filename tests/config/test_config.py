from __future__ import annotations

import os

import pytest


def _clear_runtime_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in (
        "APP_ENV",
        "EXPECTED_SUPABASE_PROJECT_REF",
        "SUPABASE_URL",
        "SUPABASE_JWT_JWKS_URL",
        "DATABASE_URL",
        "MIGRATION_DATABASE_URL",
        "RADAR_DB_URL",
        "ALLOW_PROD_DATABASE_IN_TESTS",
        "ALLOW_LOCAL_DATABASE_IN_DEVELOPMENT",
        "SKIP_ENVIRONMENT_GUARD",
    ):
        monkeypatch.delenv(key, raising=False)


@pytest.mark.config
def test_cfg_03_aws_region_defaults_to_sa_east_1(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.delenv("AWS_REGION", raising=False)
    assert Settings.from_env().aws_region == "sa-east-1"


@pytest.mark.config
def test_cfg_03_invalid_region_fails_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("AWS_REGION", "moon-1")
    with pytest.raises(ValueError, match="AWS_REGION='moon-1' invalid"):
        Settings.from_env()


@pytest.mark.config
def test_cfg_04_local_settings_do_not_require_supabase_or_region(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _clear_runtime_env(monkeypatch)
    for key in list(os.environ):
        if key.startswith("SUPABASE_") or key in {"AWS_REGION", "RADAR_DB_URL"}:
            monkeypatch.delenv(key, raising=False)

    settings = Settings.from_env()
    assert settings.aws_region == "sa-east-1"
    assert settings.supabase_url is None


@pytest.mark.config
def test_cfg_supabase_auth_settings_are_loaded(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _clear_runtime_env(monkeypatch)
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

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173, http://127.0.0.1:5173")

    assert cors_origins(Settings.from_env()) == ["http://localhost:5173", "http://127.0.0.1:5173"]


@pytest.mark.config
def test_cfg_development_rejects_production_supabase(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import EnvironmentConfigError, Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("SUPABASE_URL", "https://rforddrnuwtaefxojfte.supabase.co")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres.rforddrnuwtaefxojfte:pass@aws-0.pooler.supabase.com/postgres")

    with pytest.raises(EnvironmentConfigError, match="SUPABASE_URL aponta para o projeto Supabase incorreto"):
        Settings.from_env()


@pytest.mark.config
def test_cfg_development_accepts_dev_project(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("SUPABASE_URL", "https://ddhdwgcjpqgvybmqbjmv.supabase.co")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres.ddhdwgcjpqgvybmqbjmv:pass@aws-0.pooler.supabase.com/postgres")

    settings = Settings.from_env()
    assert settings.normalized_app_env == "development"
    assert settings.database_label == "pvgsystem-dev"


@pytest.mark.config
def test_cfg_production_rejects_dev_supabase(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import EnvironmentConfigError, Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SUPABASE_URL", "https://ddhdwgcjpqgvybmqbjmv.supabase.co")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres.ddhdwgcjpqgvybmqbjmv:pass@aws-0.pooler.supabase.com/postgres")

    with pytest.raises(EnvironmentConfigError, match="SUPABASE_URL aponta para o projeto Supabase incorreto"):
        Settings.from_env()


@pytest.mark.config
def test_cfg_test_rejects_prod_database_without_explicit_allow(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.config import EnvironmentConfigError, Settings

    _clear_runtime_env(monkeypatch)
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", "postgresql://postgres.rforddrnuwtaefxojfte:pass@aws-0.pooler.supabase.com/postgres")

    with pytest.raises(EnvironmentConfigError, match="DATABASE_URL aponta para PROD durante testes"):
        Settings.from_env()
