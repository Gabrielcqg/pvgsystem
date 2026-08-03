create schema if not exists private;

alter table public.execucoes_radar
add column if not exists total_previstos integer not null default 0;

create index if not exists ix_execucoes_radar_status_heartbeat
on public.execucoes_radar(status, heartbeat_em)
where status = 'em_andamento';

create table if not exists private.processo_senhas (
  processo_id uuid primary key references public.processos(id) on delete cascade,
  senha_cipher bytea not null,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now()
);

revoke all on private.processo_senhas from public, anon, authenticated, radar_worker;

create or replace function private.salvar_senha_processo(
  p_processo_id uuid,
  p_senha text,
  p_key text
)
returns table (
  id uuid,
  numero text,
  tribunal public.tribunal_sigla,
  cliente text,
  comarca_vara text,
  fase_atual text,
  ativo boolean,
  monitorar boolean,
  exige_senha boolean,
  ultima_consulta_status public.consulta_status,
  ultima_consulta_em timestamp with time zone,
  ultima_consulta_inconclusiva boolean
)
language plpgsql
security definer
set search_path = private, public, extensions
as $$
begin
  if not public.current_user_is_app_member() then
    raise exception 'acesso restrito' using errcode = '42501';
  end if;
  if p_senha is null or length(trim(p_senha)) = 0 then
    raise exception 'senha vazia' using errcode = '22023';
  end if;
  if p_key is null or length(p_key) < 32 then
    raise exception 'RADAR_PASSWORD_KEY invalida' using errcode = '22023';
  end if;

  if not exists (select 1 from public.processos p where p.id = p_processo_id) then
    raise exception 'processo nao encontrado' using errcode = 'P0002';
  end if;

  insert into private.processo_senhas (processo_id, senha_cipher)
  values (p_processo_id, pgp_sym_encrypt(p_senha, p_key, 'compress-algo=0'::text))
  on conflict (processo_id) do update
    set senha_cipher = excluded.senha_cipher,
        atualizado_em = now();

  update public.processos p
  set senha_ref = 'vault:' || p_processo_id::text,
      exige_senha = false
  where p.id = p_processo_id;

  return query
  select p.id, p.numero, p.tribunal, p.cliente, p.comarca_vara, p.fase_atual, p.ativo,
         p.monitorar, p.exige_senha, p.ultima_consulta_status, p.ultima_consulta_em,
         p.ultima_consulta_inconclusiva
  from public.processos p
  where p.id = p_processo_id;
end;
$$;

create or replace function private.ler_senha_processo(
  p_senha_ref text,
  p_key text
)
returns text
language plpgsql
security definer
set search_path = private, public, extensions
as $$
declare
  v_processo_id uuid;
  v_senha text;
begin
  if p_senha_ref is null or p_senha_ref !~ '^vault:[0-9a-f-]{36}$' then
    return null;
  end if;
  if p_key is null or length(p_key) < 32 then
    raise exception 'RADAR_PASSWORD_KEY invalida' using errcode = '22023';
  end if;

  v_processo_id := replace(p_senha_ref, 'vault:', '')::uuid;
  select pgp_sym_decrypt(s.senha_cipher, p_key)
  into v_senha
  from private.processo_senhas s
  where s.processo_id = v_processo_id;

  return v_senha;
end;
$$;

revoke all on function private.salvar_senha_processo(uuid, text, text) from public, anon, radar_worker;
revoke all on function private.ler_senha_processo(text, text) from public, anon, authenticated;
grant usage on schema private to authenticated, radar_worker;
grant execute on function private.salvar_senha_processo(uuid, text, text) to authenticated;
grant execute on function private.ler_senha_processo(text, text) to radar_worker;
