from __future__ import annotations

import os
from pathlib import Path

import psycopg


REPO_ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS_DIR = REPO_ROOT / "supabase" / "migrations"
LOCAL_COMPAT_SKIPPED_SUFFIXES = ("_remote_schema.sql",)


LOCAL_SUPABASE_COMPAT_PRELUDE = """
create schema if not exists extensions;
create schema if not exists auth;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if to_regprocedure('public.gen_random_uuid()') is null
     and to_regprocedure('extensions.gen_random_uuid()') is not null then
    execute $fn$
      create function public.gen_random_uuid()
      returns uuid
      language sql
      as $body$
        select extensions.gen_random_uuid();
      $body$
    $fn$;
  end if;
end $$;

create or replace function auth.jwt()
returns jsonb
language sql
stable
as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
$$;

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;

create table if not exists auth.users (
  id uuid primary key default public.gen_random_uuid(),
  email text unique,
  created_at timestamptz not null default now()
);

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to authenticated;
grant execute on function auth.jwt() to authenticated;
grant select on auth.users to authenticated;
"""


def migration_files(include_supabase_platform_baseline: bool = False) -> list[Path]:
    files = sorted(MIGRATIONS_DIR.glob("*.sql"))
    if include_supabase_platform_baseline:
        return files
    return [
        path
        for path in files
        if not path.name.endswith(LOCAL_COMPAT_SKIPPED_SUFFIXES)
    ]


def apply_migrations(database_url: str, include_supabase_platform_baseline: bool = False) -> list[str]:
    applied: list[str] = []
    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            if not include_supabase_platform_baseline:
                cur.execute(LOCAL_SUPABASE_COMPAT_PRELUDE)
            cur.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())")
        for path in migration_files(include_supabase_platform_baseline=include_supabase_platform_baseline):
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM schema_migrations WHERE version = %s", (path.name,))
                if cur.fetchone():
                    continue
                cur.execute(path.read_text())
                cur.execute("INSERT INTO schema_migrations(version) VALUES (%s)", (path.name,))
                applied.append(path.name)
    return applied


def main() -> int:
    database_url = os.getenv("MIGRATION_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not database_url:
        raise SystemExit("MIGRATION_DATABASE_URL or DATABASE_URL is required")
    include_supabase_platform_baseline = os.getenv("INCLUDE_SUPABASE_PLATFORM_BASELINE") == "1"
    applied = apply_migrations(database_url, include_supabase_platform_baseline=include_supabase_platform_baseline)
    for name in applied:
        print(f"applied {name}")
    if not applied:
        print("migrations already up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
