from __future__ import annotations

import os
from dataclasses import dataclass


ALLOWED_REGIONS = {"sa-east-1", "us-east-1", "us-west-1", "eu-central-1"}


@dataclass(frozen=True)
class Settings:
    aws_region: str = "sa-east-1"
    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_jwt_secret: str | None = None
    supabase_allowed_emails: str | None = None
    cors_allowed_origins: str | None = None
    database_url: str | None = None
    migration_database_url: str | None = None
    radar_db_url: str | None = None
    vault_provider: str = "memory"
    supabase_vault_key_id: str | None = None
    smtp_host: str | None = None
    smtp_port: int | None = None
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    resend_api_key: str | None = None

    @classmethod
    def from_env(cls) -> "Settings":
        region = os.getenv("AWS_REGION") or "sa-east-1"
        if region not in ALLOWED_REGIONS:
            raise ValueError(
                f"AWS_REGION={region!r} invalid; expected one of {sorted(ALLOWED_REGIONS)}"
            )
        smtp_port = os.getenv("SMTP_PORT")
        return cls(
            aws_region=region,
            supabase_url=os.getenv("SUPABASE_URL") or None,
            supabase_anon_key=os.getenv("SUPABASE_ANON_KEY") or None,
            supabase_jwt_secret=os.getenv("SUPABASE_JWT_SECRET") or None,
            supabase_allowed_emails=os.getenv("SUPABASE_ALLOWED_EMAILS") or None,
            cors_allowed_origins=os.getenv("CORS_ALLOWED_ORIGINS") or None,
            database_url=os.getenv("DATABASE_URL") or None,
            migration_database_url=os.getenv("MIGRATION_DATABASE_URL") or None,
            radar_db_url=os.getenv("RADAR_DB_URL") or None,
            vault_provider=os.getenv("VAULT_PROVIDER") or "memory",
            supabase_vault_key_id=os.getenv("SUPABASE_VAULT_KEY_ID") or None,
            smtp_host=os.getenv("SMTP_HOST") or None,
            smtp_port=int(smtp_port) if smtp_port else None,
            smtp_username=os.getenv("SMTP_USERNAME") or None,
            smtp_password=os.getenv("SMTP_PASSWORD") or None,
            smtp_from=os.getenv("SMTP_FROM") or None,
            resend_api_key=os.getenv("RESEND_API_KEY") or None,
        )


def get_settings() -> Settings:
    return Settings.from_env()


def cors_origins(settings: Settings | None = None) -> list[str]:
    value = (settings or get_settings()).cors_allowed_origins
    if not value:
        return []
    return [origin.strip() for origin in value.split(",") if origin.strip()]
