create table if not exists public.tarefa_statuses (
  slug text primary key,
  rotulo text not null,
  ordem smallint not null unique,
  grupo text not null,
  cor text not null,
  terminal boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  constraint ck_tarefa_status_slug check (slug ~ '^[a-z0-9_]+$'),
  constraint ck_tarefa_status_grupo check (grupo in ('entrada','execucao','bloqueio','revisao','terminal'))
);

insert into public.tarefa_statuses (slug, rotulo, ordem, grupo, cor, terminal, ativo)
values
  ('backlog', 'Backlog', 10, 'entrada', '#64748b', false, true),
  ('a_fazer', 'A fazer', 20, 'entrada', '#151d3e', false, true),
  ('em_andamento', 'Em andamento', 30, 'execucao', '#2563eb', false, true),
  ('aguardando', 'Aguardando', 40, 'bloqueio', '#b7791f', false, true),
  ('bloqueada', 'Bloqueada', 50, 'bloqueio', '#c2410c', false, true),
  ('em_revisao', 'Em revisão', 60, 'revisao', '#7c3aed', false, true),
  ('concluida', 'Concluída', 70, 'terminal', '#15803d', true, true)
on conflict (slug) do update set
  rotulo = excluded.rotulo,
  ordem = excluded.ordem,
  grupo = excluded.grupo,
  cor = excluded.cor,
  terminal = excluded.terminal,
  ativo = excluded.ativo,
  atualizado_em = now();

drop trigger if exists tarefa_statuses_set_atualizado_em on public.tarefa_statuses;
create trigger tarefa_statuses_set_atualizado_em
before update on public.tarefa_statuses
for each row execute function public.set_atualizado_em();

drop index if exists public.ux_tarefa_inercia_aberta;

alter table public.tarefas alter column status drop default;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'tarefas'
      and column_name = 'status'
      and udt_name = 'tarefa_status'
  ) then
    alter table public.tarefas
      alter column status type text
      using case status::text
        when 'aberta' then 'a_fazer'
        when 'concluida' then 'concluida'
        else status::text
      end;
  end if;
end $$;

update public.tarefas
set status = case status
  when 'aberta' then 'a_fazer'
  when 'concluida' then 'concluida'
  else coalesce(nullif(status, ''), 'a_fazer')
end
where status is null or status in ('', 'aberta', 'concluida');

alter table public.tarefas
  alter column status set default 'a_fazer',
  alter column status set not null;

alter table public.tarefas
  add column if not exists descricao text,
  add column if not exists responsavel_id uuid references auth.users(id) on delete set null,
  add column if not exists prioridade text not null default 'normal',
  add column if not exists data_inicio date,
  add column if not exists completed_at timestamp with time zone,
  add column if not exists completed_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamp with time zone,
  add column if not exists archived_by uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists status_changed_at timestamp with time zone,
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists estimativa_minutos integer,
  add column if not exists observacoes text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists atualizado_em timestamp with time zone not null default now();

update public.tarefas
set status_changed_at = coalesce(status_changed_at, criado_em),
    completed_at = case when status = 'concluida' then coalesce(completed_at, criado_em) else completed_at end
where status_changed_at is null
   or (status = 'concluida' and completed_at is null);

alter table public.tarefas
  alter column status_changed_at set default now(),
  alter column status_changed_at set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'tarefas_status_fkey') then
    alter table public.tarefas
      add constraint tarefas_status_fkey foreign key (status) references public.tarefa_statuses(slug);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_tarefas_prioridade') then
    alter table public.tarefas
      add constraint ck_tarefas_prioridade check (prioridade in ('baixa','normal','alta','urgente'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_tarefas_estimativa') then
    alter table public.tarefas
      add constraint ck_tarefas_estimativa check (estimativa_minutos is null or estimativa_minutos >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ck_tarefas_conclusao_coerente') then
    alter table public.tarefas
      add constraint ck_tarefas_conclusao_coerente check (
        (status = 'concluida' and completed_at is not null)
        or (status <> 'concluida' and completed_at is null)
      );
  end if;
end $$;

drop trigger if exists tarefas_set_atualizado_em on public.tarefas;
create trigger tarefas_set_atualizado_em
before update on public.tarefas
for each row execute function public.set_atualizado_em();

create table if not exists public.tarefa_colaboradores (
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  primary key (tarefa_id, usuario_id)
);

create table if not exists public.tarefa_subtarefas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  titulo text not null,
  responsavel text,
  responsavel_id uuid references auth.users(id) on delete set null,
  status text not null default 'a_fazer' references public.tarefa_statuses(slug),
  prioridade text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  prazo date,
  ordem integer not null default 0 check (ordem >= 0),
  completed_at timestamp with time zone,
  completed_by uuid references auth.users(id) on delete set null,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_por uuid references auth.users(id) on delete set null,
  constraint ck_tarefa_subtarefas_conclusao_coerente check (
    (status = 'concluida' and completed_at is not null)
    or (status <> 'concluida' and completed_at is null)
  )
);

drop trigger if exists tarefa_subtarefas_set_atualizado_em on public.tarefa_subtarefas;
create trigger tarefa_subtarefas_set_atualizado_em
before update on public.tarefa_subtarefas
for each row execute function public.set_atualizado_em();

create table if not exists public.tarefa_checklist_itens (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  titulo text not null,
  concluido boolean not null default false,
  ordem integer not null default 0 check (ordem >= 0),
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  atualizado_por uuid references auth.users(id) on delete set null
);

drop trigger if exists tarefa_checklist_set_atualizado_em on public.tarefa_checklist_itens;
create trigger tarefa_checklist_set_atualizado_em
before update on public.tarefa_checklist_itens
for each row execute function public.set_atualizado_em();

create table if not exists public.tarefa_comentarios (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  autor_id uuid references auth.users(id) on delete set null,
  conteudo text not null,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  editado_em timestamp with time zone,
  excluido_em timestamp with time zone,
  excluido_por uuid references auth.users(id) on delete set null
);

drop trigger if exists tarefa_comentarios_set_atualizado_em on public.tarefa_comentarios;
create trigger tarefa_comentarios_set_atualizado_em
before update on public.tarefa_comentarios
for each row execute function public.set_atualizado_em();

create table if not exists public.tarefa_dependencias (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  tarefa_relacionada_id uuid not null references public.tarefas(id) on delete cascade,
  tipo text not null check (tipo in ('bloqueada_por','bloqueia','relacionada')),
  criado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  constraint ck_tarefa_dependencias_distintas check (tarefa_id <> tarefa_relacionada_id),
  constraint ux_tarefa_dependencia unique (tarefa_id, tarefa_relacionada_id, tipo)
);

create table if not exists public.tarefa_tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cor text not null default '#64748b',
  criado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null
);

create table if not exists public.tarefa_tag_relacoes (
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  tag_id uuid not null references public.tarefa_tags(id) on delete cascade,
  criado_em timestamp with time zone not null default now(),
  criado_por uuid references auth.users(id) on delete set null,
  primary key (tarefa_id, tag_id)
);

create table if not exists public.tarefa_historico (
  id bigserial primary key,
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  usuario_id uuid references auth.users(id) on delete set null,
  evento text not null,
  valor_antigo jsonb,
  valor_novo jsonb,
  criado_em timestamp with time zone not null default now()
);

create table if not exists public.tarefa_status_tempos (
  tarefa_id uuid not null references public.tarefas(id) on delete cascade,
  status text not null references public.tarefa_statuses(slug),
  segundos_total bigint not null default 0 check (segundos_total >= 0),
  ultima_entrada_em timestamp with time zone,
  atualizado_em timestamp with time zone not null default now(),
  primary key (tarefa_id, status)
);

drop trigger if exists tarefa_status_tempos_set_atualizado_em on public.tarefa_status_tempos;
create trigger tarefa_status_tempos_set_atualizado_em
before update on public.tarefa_status_tempos
for each row execute function public.set_atualizado_em();

insert into public.tarefa_status_tempos (tarefa_id, status, ultima_entrada_em)
select t.id, t.status, coalesce(t.status_changed_at, t.criado_em)
from public.tarefas t
on conflict (tarefa_id, status) do nothing;

create unique index if not exists ux_tarefa_movimentacao on public.tarefas(movimentacao_id) where movimentacao_id is not null;
create unique index if not exists ux_tarefa_inercia_ativa on public.tarefas(processo_id)
  where origem = 'radar_inercia' and status <> 'concluida' and archived_at is null;
create index if not exists ix_tarefas_status_prazo on public.tarefas(status, prazo) where archived_at is null;
create index if not exists ix_tarefas_responsavel on public.tarefas(responsavel) where archived_at is null and responsavel is not null;
create index if not exists ix_tarefas_responsavel_id on public.tarefas(responsavel_id) where archived_at is null and responsavel_id is not null;
create index if not exists ix_tarefas_prioridade on public.tarefas(prioridade) where archived_at is null;
create index if not exists ix_tarefas_prazo on public.tarefas(prazo) where archived_at is null and prazo is not null;
create index if not exists ix_tarefas_processo on public.tarefas(processo_id) where processo_id is not null;
create index if not exists ix_tarefas_origem on public.tarefas(origem);
create index if not exists ix_tarefas_archived_at on public.tarefas(archived_at);
create index if not exists ix_tarefas_atualizado_em on public.tarefas(atualizado_em desc);
create index if not exists ix_tarefas_busca on public.tarefas using gin (to_tsvector('portuguese', coalesce(titulo, '') || ' ' || coalesce(descricao, '') || ' ' || coalesce(observacoes, '')));
create index if not exists ix_tarefa_subtarefas_tarefa on public.tarefa_subtarefas(tarefa_id, status, prazo);
create index if not exists ix_tarefa_checklist_tarefa on public.tarefa_checklist_itens(tarefa_id, ordem);
create index if not exists ix_tarefa_comentarios_tarefa on public.tarefa_comentarios(tarefa_id, criado_em);
create index if not exists ix_tarefa_dependencias_tarefa on public.tarefa_dependencias(tarefa_id);
create index if not exists ix_tarefa_dependencias_relacionada on public.tarefa_dependencias(tarefa_relacionada_id);
create index if not exists ix_tarefa_historico_tarefa on public.tarefa_historico(tarefa_id, criado_em desc);
create index if not exists ix_tarefa_status_tempos_tarefa on public.tarefa_status_tempos(tarefa_id);

alter table public.tarefa_statuses enable row level security;
alter table public.tarefa_colaboradores enable row level security;
alter table public.tarefa_subtarefas enable row level security;
alter table public.tarefa_checklist_itens enable row level security;
alter table public.tarefa_comentarios enable row level security;
alter table public.tarefa_dependencias enable row level security;
alter table public.tarefa_tags enable row level security;
alter table public.tarefa_tag_relacoes enable row level security;
alter table public.tarefa_historico enable row level security;
alter table public.tarefa_status_tempos enable row level security;

grant select on public.tarefa_statuses to authenticated;
grant select, insert, update, delete on public.tarefa_colaboradores, public.tarefa_subtarefas, public.tarefa_checklist_itens, public.tarefa_comentarios, public.tarefa_dependencias, public.tarefa_tags, public.tarefa_tag_relacoes, public.tarefa_historico, public.tarefa_status_tempos to authenticated;
grant usage, select on all sequences in schema public to authenticated;

grant select on public.tarefa_statuses to radar_worker;
grant select on public.tarefa_status_tempos to radar_worker;

drop policy if exists tarefas_rw on public.tarefas;
create policy tarefas_rw on public.tarefas for all to authenticated
using ((select public.current_user_is_app_member()))
with check ((select public.current_user_is_app_member()));

drop policy if exists tarefa_statuses_read on public.tarefa_statuses;
create policy tarefa_statuses_read on public.tarefa_statuses for select to authenticated
using ((select public.current_user_is_app_member()));

drop policy if exists tarefa_colaboradores_rw on public.tarefa_colaboradores;
drop policy if exists tarefa_subtarefas_rw on public.tarefa_subtarefas;
drop policy if exists tarefa_checklist_rw on public.tarefa_checklist_itens;
drop policy if exists tarefa_comentarios_rw on public.tarefa_comentarios;
drop policy if exists tarefa_dependencias_rw on public.tarefa_dependencias;
drop policy if exists tarefa_tags_rw on public.tarefa_tags;
drop policy if exists tarefa_tag_relacoes_rw on public.tarefa_tag_relacoes;
drop policy if exists tarefa_historico_rw on public.tarefa_historico;
drop policy if exists tarefa_status_tempos_rw on public.tarefa_status_tempos;

create policy tarefa_colaboradores_rw on public.tarefa_colaboradores for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_subtarefas_rw on public.tarefa_subtarefas for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_checklist_rw on public.tarefa_checklist_itens for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_comentarios_rw on public.tarefa_comentarios for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_dependencias_rw on public.tarefa_dependencias for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_tags_rw on public.tarefa_tags for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_tag_relacoes_rw on public.tarefa_tag_relacoes for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_historico_rw on public.tarefa_historico for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));
create policy tarefa_status_tempos_rw on public.tarefa_status_tempos for all to authenticated using ((select public.current_user_is_app_member())) with check ((select public.current_user_is_app_member()));

drop policy if exists radar_task_insert on public.tarefas;
create policy radar_task_insert on public.tarefas for insert to radar_worker
with check (origem = 'radar_inercia' and archived_at is null);

drop policy if exists radar_tarefa_statuses_read on public.tarefa_statuses;
create policy radar_tarefa_statuses_read on public.tarefa_statuses for select to radar_worker using (true);
