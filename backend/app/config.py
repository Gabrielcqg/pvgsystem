from __future__ import annotations

import os
from dataclasses import dataclass
from urllib.parse import urlparse


ALLOWED_REGIONS = {"sa-east-1", "us-east-1", "us-west-1", "eu-central-1"}
PROD_SUPABASE_PROJECT_REF = "rforddrnuwtaefxojfte"
DEV_SUPABASE_PROJECT_REF = "ddhdwgcjpqgvybmqbjmv"
ALLOWED_APP_ENVS = {"development", "production", "test"}


class EnvironmentConfigError(ValueError):
    """Configuration would connect the runtime to the wrong environment."""


def _truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "on"}


def _running_under_pytest() -> bool:
    return "PYTEST_CURRENT_TEST" in os.environ or "PYTEST_VERSION" in os.environ


def _project_ref_from_url(value: str | None) -> str | None:
    if not value:
        return None
    for ref in (PROD_SUPABASE_PROJECT_REF, DEV_SUPABASE_PROJECT_REF):
        if ref in value:
            return ref
    parsed = urlparse(value)
    host = parsed.hostname or value
    if ".supabase.co" in host:
        return host.split(".supabase.co", 1)[0].split(".")[-1]
    if ".supabase.com" in host:
        return host.split(".supabase.com", 1)[0].split(".")[-1]
    return None


def _is_local_database_url(value: str | None) -> bool:
    if not value:
        return False
    host = urlparse(value).hostname or ""
    return host in {"localhost", "127.0.0.1", "::1"} or host.endswith(".local")


@dataclass(frozen=True)
class Settings:
    app_env: str | None = None
    expected_supabase_project_ref: str | None = None
    aws_region: str = "sa-east-1"
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_jwt_jwks_url: str | None = None
    supabase_allowed_emails: str | None = None
    cors_allowed_origins: str | None = None
    database_url: str | None = None
    migration_database_url: str | None = None
    radar_db_url: str | None = None
    radar_password_key: str | None = None
    vault_provider: str = "memory"
    supabase_vault_key_id: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    resend_api_key: str | None = None
    radar_alert_email: str | None = None

    @classmethod
    def from_env(cls) -> "Settings":
        region = os.getenv("AWS_REGION") or "sa-east-1"
        if region not in ALLOWED_REGIONS:
            raise ValueError(
                f"AWS_REGION={region!r} invalid; expected one of {sorted(ALLOWED_REGIONS)}"
            )
        smtp_port = os.getenv("SMTP_PORT")
        settings = cls(
            app_env=(os.getenv("APP_ENV") or None),
            expected_supabase_project_ref=os.getenv("EXPECTED_SUPABASE_PROJECT_REF") or None,
            aws_region=region,
            supabase_url=os.getenv("SUPABASE_URL") or None,
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY") or None,
            supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET") or None,
            supabase_jwt_jwks_url=os.getenv("SUPABASE_JWT_JWKS_URL") or None,
            supabase_allowed_emails=os.getenv("SUPABASE_ALLOWED_EMAILS") or None,
            cors_allowed_origins=os.getenv("CORS_ALLOWED_ORIGINS") or None,
            database_url=os.getenv("DATABASE_URL") or None,
            migration_database_url=os.getenv("MIGRATION_DATABASE_URL") or None,
            radar_db_url=os.getenv("RADAR_DB_URL") or None,
            radar_password_key=os.getenv("RADAR_PASSWORD_KEY") or None,
            vault_provider=os.getenv("VAULT_PROVIDER") or "memory",
            supabase_vault_key_id=os.getenv("SUPABASE_VAULT_KEY_ID") or None,
            smtp_host=os.getenv("SMTP_HOST") or None,
            smtp_port=int(smtp_port) if smtp_port else None,
            smtp_username=os.getenv("SMTP_USERNAME") or None,
            smtp_password=os.getenv("SMTP_PASSWORD") or None,
            smtp_from=os.getenv("SMTP_FROM") or None,
            resend_api_key=os.getenv("RESEND_API_KEY") or None,
            radar_alert_email=os.getenv("RADAR_ALERT_EMAIL") or None,
        )
        settings.validate_environment()
        return settings

    @property
    def normalized_app_env(self) -> str:
        if self.app_env:
            return self.app_env.strip().lower()
        if _running_under_pytest():
            return "test"
        return ""

    @property
    def database_label(self) -> str:
        env = self.normalized_app_env
        if env == "production":
            return "PROD"
        if env == "development":
            return "pvgsystem-dev"
        return "test/local"

    def _validate_ref(self, name: str, value: str | None, *, expected: str, forbidden: str) -> None:
        if not value:
            return
        detected = _project_ref_from_url(value)
        if detected == forbidden:
            raise EnvironmentConfigError(
                f"{name} aponta para o projeto Supabase incorreto para APP_ENV={self.normalized_app_env}."
            )
        if detected and detected != expected:
            raise EnvironmentConfigError(
                f"{name} aponta para um projeto Supabase diferente do esperado para APP_ENV={self.normalized_app_env}."
            )
        if not detected and "supabase" in value:
            raise EnvironmentConfigError(
                f"{name} nao permite confirmar o projeto Supabase esperado para APP_ENV={self.normalized_app_env}."
            )

    def validate_environment(self) -> None:
        if _truthy(os.getenv("SKIP_ENVIRONMENT_GUARD")):
            return

        env = self.normalized_app_env
        if not env:
            raise EnvironmentConfigError("APP_ENV deve ser definido como development, production ou test.")
        if env not in ALLOWED_APP_ENVS:
            raise EnvironmentConfigError(
                f"APP_ENV={env!r} invalido; esperado um de {sorted(ALLOWED_APP_ENVS)}."
            )

        if env == "test":
            for name, value in (
                ("SUPABASE_URL", self.supabase_url),
                ("DATABASE_URL", self.database_url),
                ("MIGRATION_DATABASE_URL", self.migration_database_url),
                ("RADAR_DB_URL", self.radar_db_url),
            ):
                if _project_ref_from_url(value) == PROD_SUPABASE_PROJECT_REF and not _truthy(os.getenv("ALLOW_PROD_DATABASE_IN_TESTS")):
                    raise EnvironmentConfigError(
                        f"{name} aponta para PROD durante testes. Defina um banco local/dev ou ALLOW_PROD_DATABASE_IN_TESTS=1."
                    )
            return

        expected = self.expected_supabase_project_ref
        if env == "production":
            expected = expected or PROD_SUPABASE_PROJECT_REF
            forbidden = DEV_SUPABASE_PROJECT_REF
        else:
            expected = expected or DEV_SUPABASE_PROJECT_REF
            forbidden = PROD_SUPABASE_PROJECT_REF

        missing = []
        if not self.supabase_url:
            missing.append("SUPABASE_URL")
        if not self.database_url:
            missing.append("DATABASE_URL")
        if missing:
            raise EnvironmentConfigError(f"Variaveis obrigatorias ausentes para APP_ENV={env}: {', '.join(missing)}.")

        self._validate_ref("SUPABASE_URL", self.supabase_url, expected=expected, forbidden=forbidden)
        if self.supabase_jwt_jwks_url:
            self._validate_ref("SUPABASE_JWT_JWKS_URL", self.supabase_jwt_jwks_url, expected=expected, forbidden=forbidden)

        database_urls = (
            ("DATABASE_URL", self.database_url),
            ("MIGRATION_DATABASE_URL", self.migration_database_url),
            ("RADAR_DB_URL", self.radar_db_url),
        )
        for name, value in database_urls:
            if env == "development" and _is_local_database_url(value) and _truthy(os.getenv("ALLOW_LOCAL_DATABASE_IN_DEVELOPMENT")):
                continue
            self._validate_ref(name, value, expected=expected, forbidden=forbidden)


def get_settings() -> Settings:
    return Settings.from_env()


def cors_origins(settings: Settings | None = None) -> list[str]:
    value = (settings or get_settings()).cors_allowed_origins
    if not value:
        return []
    return [origin.strip() for origin in value.split(",") if origin.strip()]
