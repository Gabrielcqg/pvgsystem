alter table public.tarefas
  add column if not exists radar_inercia_chave text;

comment on column public.tarefas.radar_inercia_chave is
  'Idempotency key for Radar Processual inertia tasks: process, last movement date, and configured threshold.';

update public.tarefas t
set radar_inercia_chave = format(
  'radar_inercia:%s:%s:%s',
  t.processo_id,
  p.data_ultimo_andamento,
  coalesce((select nullif(valor, '')::integer from public.configuracoes where chave = 'radar_inercia_dias'), 30)
)
from public.processos p
where t.origem = 'radar_inercia'
  and t.processo_id = p.id
  and t.radar_inercia_chave is null
  and p.data_ultimo_andamento is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ck_tarefas_inercia_chave') then
    alter table public.tarefas
      add constraint ck_tarefas_inercia_chave check (
        origem <> 'radar_inercia'
        or radar_inercia_chave is not null
      );
  end if;
end $$;

create unique index if not exists ux_tarefa_inercia_condicao
  on public.tarefas(radar_inercia_chave)
  where origem = 'radar_inercia';

create index if not exists ix_processos_inercia
  on public.processos(data_ultimo_andamento)
  where ativo and monitorar and data_ultimo_andamento is not null;

create index if not exists ix_tarefas_radar_inercia_processo
  on public.tarefas(processo_id, radar_inercia_chave)
  where origem = 'radar_inercia';

with cfg as (
  select coalesce((select nullif(valor, '')::integer from public.configuracoes where chave = 'radar_inercia_dias'), 30) as dias
),
candidatos as (
  select
    p.id as processo_id,
    p.numero,
    p.contrato_id,
    p.data_ultimo_andamento,
    cfg.dias,
    (current_date - p.data_ultimo_andamento)::integer as dias_sem_movimentacao,
    format('radar_inercia:%s:%s:%s', p.id, p.data_ultimo_andamento, cfg.dias) as chave
  from public.processos p
  cross join cfg
  where p.ativo is true
    and p.monitorar is true
    and p.data_ultimo_andamento is not null
    and (current_date - p.data_ultimo_andamento)::integer > cfg.dias
)
insert into public.tarefas (
  titulo,
  descricao,
  contrato_id,
  origem,
  processo_id,
  numero_processo,
  status,
  prioridade,
  radar_inercia_chave
)
select
  format('Acompanhar processo parado - %s', c.numero),
  format(
    'Radar Processual identificou %s dias sem movimentação no processo %s. Último andamento conhecido: %s. Ação sugerida: verificar o processo e avaliar contato com o Balcão Virtual.',
    c.dias_sem_movimentacao,
    c.numero,
    to_char(c.data_ultimo_andamento, 'DD/MM/YYYY')
  ),
  c.contrato_id,
  'radar_inercia',
  c.processo_id,
  c.numero,
  'backlog',
  'alta',
  c.chave
from candidatos c
where not exists (
  select 1
  from public.tarefas t
  where t.origem = 'radar_inercia'
    and t.radar_inercia_chave = c.chave
);

insert into public.tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
select t.id, t.status, t.status_changed_at
from public.tarefas t
where t.origem = 'radar_inercia'
  and t.status = 'backlog'
on conflict (tarefa_id, status) do nothing;

insert into public.tarefa_historico (tarefa_id, usuario_id, evento, valor_novo)
select
  t.id,
  null,
  'tarefa_criada_por_radar_inercia',
  jsonb_build_object(
    'origem', t.origem,
    'processo_id', t.processo_id,
    'numero_processo', t.numero_processo,
    'radar_inercia_chave', t.radar_inercia_chave
  )
from public.tarefas t
where t.origem = 'radar_inercia'
  and not exists (
    select 1
    from public.tarefa_historico h
    where h.tarefa_id = t.id
      and h.evento = 'tarefa_criada_por_radar_inercia'
  );

grant select, insert on public.tarefa_historico, public.tarefa_status_tempos to radar_worker;
grant usage, select on sequence public.tarefa_historico_id_seq to radar_worker;

drop policy if exists radar_task_insert on public.tarefas;
create policy radar_task_insert on public.tarefas for insert to radar_worker
with check (
  origem = 'radar_inercia'
  and status = 'backlog'
  and processo_id is not null
  and radar_inercia_chave is not null
  and archived_at is null
);

drop policy if exists radar_tarefa_historico_insert on public.tarefa_historico;
create policy radar_tarefa_historico_insert on public.tarefa_historico for insert to radar_worker
with check (
  evento = 'tarefa_criada_por_radar_inercia'
  and exists (
    select 1
    from public.tarefas t
    where t.id = tarefa_historico.tarefa_id
      and t.origem = 'radar_inercia'
  )
);

drop policy if exists radar_tarefa_historico_read on public.tarefa_historico;
create policy radar_tarefa_historico_read on public.tarefa_historico for select to radar_worker
using (
  exists (
    select 1
    from public.tarefas t
    where t.id = tarefa_historico.tarefa_id
      and t.origem = 'radar_inercia'
  )
);

drop policy if exists radar_tarefa_status_tempos_insert on public.tarefa_status_tempos;
create policy radar_tarefa_status_tempos_insert on public.tarefa_status_tempos for insert to radar_worker
with check (
  status = 'backlog'
  and exists (
    select 1
    from public.tarefas t
    where t.id = tarefa_status_tempos.tarefa_id
      and t.origem = 'radar_inercia'
  )
);

drop policy if exists radar_tarefa_status_tempos_read on public.tarefa_status_tempos;
create policy radar_tarefa_status_tempos_read on public.tarefa_status_tempos for select to radar_worker
using (
  exists (
    select 1
    from public.tarefas t
    where t.id = tarefa_status_tempos.tarefa_id
      and t.origem = 'radar_inercia'
  )
);
