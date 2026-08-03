-- Optimize the ordered reads used by GET /bootstrap.
-- Rollback, if ever needed:
--   drop index if exists public.ix_parceiros_criado_em_desc;
--   drop index if exists public.ix_contratos_criado_em_desc;
--   drop index if exists public.ix_parcelas_mes_criado_bootstrap;
--   drop index if exists public.ix_lancamentos_criado_em_desc;
--   drop index if exists public.ix_custos_fixos_criado_em_desc;
--   drop index if exists public.ix_tarefas_ativas_criado_em_desc;
--   drop index if exists public.ix_processos_criado_em_desc;

create index if not exists ix_parceiros_criado_em_desc
  on public.parceiros (criado_em desc);

create index if not exists ix_contratos_criado_em_desc
  on public.contratos (criado_em desc);

create index if not exists ix_parcelas_mes_criado_bootstrap
  on public.parcelas (mes_esperado asc, criado_em asc);

create index if not exists ix_lancamentos_criado_em_desc
  on public.lancamentos (criado_em desc);

create index if not exists ix_custos_fixos_criado_em_desc
  on public.custos_fixos (criado_em desc);

create index if not exists ix_tarefas_ativas_criado_em_desc
  on public.tarefas (criado_em desc)
  where archived_at is null;

create index if not exists ix_processos_criado_em_desc
  on public.processos (criado_em desc);
