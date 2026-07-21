-- Harden database execution surfaces and address Supabase Advisor findings.
-- Secrets are intentionally not stored here; radar_worker credentials are
-- configured out-of-band in environment variables.

create schema if not exists private;
grant usage on schema private to authenticated;

do $$
begin
  if to_regprocedure('public.refresh_painel(smallint,smallint)') is not null
     and to_regprocedure('private.refresh_painel(smallint,smallint)') is null then
    execute 'alter function public.refresh_painel(smallint, smallint) set schema private';
  end if;

  if to_regprocedure('public.recalcular_mes(smallint,smallint)') is not null
     and to_regprocedure('private.recalcular_mes(smallint,smallint)') is null then
    execute 'alter function public.recalcular_mes(smallint, smallint) set schema private';
  end if;

  if to_regprocedure('public.recalcular_meses(smallint,smallint,smallint)') is not null
     and to_regprocedure('private.recalcular_meses(smallint,smallint,smallint)') is null then
    execute 'alter function public.recalcular_meses(smallint, smallint, smallint) set schema private';
  end if;
end $$;

do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public';
    execute 'revoke all on function public.rls_auto_enable() from anon';
    execute 'revoke all on function public.rls_auto_enable() from authenticated';
  end if;
end $$;

revoke all on function private.refresh_painel(smallint, smallint) from public;
revoke all on function private.refresh_painel(smallint, smallint) from anon;
revoke all on function private.refresh_painel(smallint, smallint) from authenticated;
revoke all on function private.recalcular_mes(smallint, smallint) from public;
revoke all on function private.recalcular_mes(smallint, smallint) from anon;
revoke all on function private.recalcular_mes(smallint, smallint) from authenticated;
revoke all on function private.recalcular_meses(smallint, smallint, smallint) from public;
revoke all on function private.recalcular_meses(smallint, smallint, smallint) from anon;
revoke all on function private.recalcular_meses(smallint, smallint, smallint) from authenticated;

grant execute on function private.refresh_painel(smallint, smallint) to authenticated;
grant execute on function private.recalcular_mes(smallint, smallint) to authenticated;
grant execute on function private.recalcular_meses(smallint, smallint, smallint) to authenticated;

create or replace function public.refresh_painel(p_ano smallint default null, p_mes_referencia smallint default null)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.refresh_painel(p_ano, p_mes_referencia);
$$;

create or replace function public.recalcular_mes(p_ano smallint, p_mes smallint)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.recalcular_mes(p_ano, p_mes);
$$;

create or replace function public.recalcular_meses(p_ano smallint, p_mes_de smallint, p_mes_ate smallint)
returns void
language sql
security invoker
set search_path = public, private
as $$
  select private.recalcular_meses(p_ano, p_mes_de, p_mes_ate);
$$;

revoke all on function public.refresh_painel(smallint, smallint) from public;
revoke all on function public.refresh_painel(smallint, smallint) from anon;
revoke all on function public.refresh_painel(smallint, smallint) from authenticated;
revoke all on function public.recalcular_mes(smallint, smallint) from public;
revoke all on function public.recalcular_mes(smallint, smallint) from anon;
revoke all on function public.recalcular_mes(smallint, smallint) from authenticated;
revoke all on function public.recalcular_meses(smallint, smallint, smallint) from public;
revoke all on function public.recalcular_meses(smallint, smallint, smallint) from anon;
revoke all on function public.recalcular_meses(smallint, smallint, smallint) from authenticated;

create or replace function public.recalc_from_lancamento()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if tg_op = 'DELETE' then
    perform private.recalcular_mes(date_part('year', old.data)::smallint, date_part('month', old.data)::smallint);
    return old;
  end if;
  perform private.recalcular_mes(date_part('year', new.data)::smallint, date_part('month', new.data)::smallint);
  if tg_op = 'UPDATE' and (date_part('year', old.data) <> date_part('year', new.data) or date_part('month', old.data) <> date_part('month', new.data)) then
    perform private.recalcular_mes(date_part('year', old.data)::smallint, date_part('month', old.data)::smallint);
  end if;
  return new;
end;
$$;

create or replace function public.recalc_from_parcela()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  target date;
begin
  target := coalesce(case when tg_op = 'DELETE' then old.mes_recebimento else new.mes_recebimento end, case when tg_op = 'DELETE' then old.mes_esperado else new.mes_esperado end);
  perform private.recalcular_mes(date_part('year', target)::smallint, date_part('month', target)::smallint);
  return coalesce(new, old);
end;
$$;

create or replace function public.recalc_from_contrato()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  target date;
begin
  target := coalesce(case when tg_op = 'DELETE' then old.data_fechamento else new.data_fechamento end, case when tg_op = 'DELETE' then old.data_proposta else new.data_proposta end, make_date(date_part('year', current_date)::smallint, 1, 1));
  perform private.recalcular_mes(date_part('year', target)::smallint, date_part('month', target)::smallint);
  return coalesce(new, old);
end;
$$;

create or replace function public.recalc_from_parametros()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  perform private.recalcular_mes(coalesce(new.ano, old.ano), 1::smallint);
  return coalesce(new, old);
end;
$$;

drop policy if exists app_members_self_read on public.app_members;
create policy app_members_self_read on public.app_members
for select to authenticated
using (
  ativo
  and lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
);

create index if not exists ix_auditoria_usuario on public.auditoria(usuario_id) where usuario_id is not null;
create index if not exists ix_execucoes_radar_usuario on public.execucoes_radar(usuario_id) where usuario_id is not null;
create index if not exists ix_movimentacoes_execucao on public.movimentacoes_novas(execucao_id);
create index if not exists ix_movimentacoes_resultado on public.movimentacoes_novas(resultado_id);
create index if not exists ix_processos_contrato on public.processos(contrato_id) where contrato_id is not null;
create index if not exists ix_tarefas_contrato on public.tarefas(contrato_id) where contrato_id is not null;
