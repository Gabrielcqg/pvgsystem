create schema if not exists extensions;
create extension if not exists "pgcrypto" with schema "extensions";

drop table if exists public.github_integration_test;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'contrato_status') then
    create type public.contrato_status as enum ('proposta','ativo','aguardando_exito','encerrado','sem_exito');
  end if;
  if not exists (select 1 from pg_type where typname = 'tipo_honorario') then
    create type public.tipo_honorario as enum ('fixo_unico','fixo_mensal','fixo_parcelado','exito_puro','sucumbencia','fixo_exito','exito_sucumbencia','fixo_exito_sucumbencia');
  end if;
  if not exists (select 1 from pg_type where typname = 'parcela_tipo') then
    create type public.parcela_tipo as enum ('inicial','mensal','exito','sucumbencia');
  end if;
  if not exists (select 1 from pg_type where typname = 'lancamento_tipo') then
    create type public.lancamento_tipo as enum ('entrada','saida');
  end if;
  if not exists (select 1 from pg_type where typname = 'lancamento_origem') then
    create type public.lancamento_origem as enum ('manual','parcela','custo_fixo');
  end if;
  if not exists (select 1 from pg_type where typname = 'categoria_lancamento') then
    create type public.categoria_lancamento as enum ('honorarios','consultoria','custas_processuais','restituicao_cliente','custo_fixo','impostos','marketing','infraestrutura','freelancer','pro_labore','outras_entradas','outras_saidas');
  end if;
  if not exists (select 1 from pg_type where typname = 'tarefa_status') then
    create type public.tarefa_status as enum ('aberta','concluida');
  end if;
  if not exists (select 1 from pg_type where typname = 'tarefa_origem') then
    create type public.tarefa_origem as enum ('manual','radar_movimentacao','radar_inercia');
  end if;
  if not exists (select 1 from pg_type where typname = 'tribunal_sigla') then
    create type public.tribunal_sigla as enum ('TJSP','TJCE','TJBA');
  end if;
  if not exists (select 1 from pg_type where typname = 'execucao_origem') then
    create type public.execucao_origem as enum ('agendada','manual');
  end if;
  if not exists (select 1 from pg_type where typname = 'execucao_status') then
    create type public.execucao_status as enum ('em_andamento','concluida','interrompida','falhou_parcialmente');
  end if;
  if not exists (select 1 from pg_type where typname = 'consulta_status') then
    create type public.consulta_status as enum ('sucesso','base_inicial_criada','nao_localizado','numero_invalido','senha_necessaria','captcha_timeout','pagina_intermediaria','timeout','erro','pendente_implementacao');
  end if;
end $$;

create table if not exists public.app_members (
  email text primary key check (email = lower(email)),
  papel text not null default 'admin' check (papel in ('admin','membro')),
  ativo boolean not null default true,
  criado_em timestamp with time zone not null default now()
);

comment on table public.app_members is 'Allowlist de usuarios do escritorio. Um usuario autenticado so acessa dados do sistema se o e-mail estiver ativo aqui.';

insert into public.app_members (email, papel, ativo)
values ('gacamargo2003@gmail.com', 'admin', true)
on conflict (email) do update set papel = excluded.papel, ativo = excluded.ativo;

create or replace function public.current_user_is_app_member()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from public.app_members m
    where m.ativo
      and lower(m.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create table if not exists public.parceiros (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  revisar boolean not null default false,
  criado_em timestamp with time zone not null default now()
);

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  parceiro_id uuid not null references public.parceiros(id) on delete restrict,
  numero_processo text,
  status public.contrato_status not null default 'proposta',
  tipo_honorario public.tipo_honorario not null,
  percentual_exito numeric(5,4) not null default 0 check (percentual_exito between 0 and 1),
  percentual_sucumbencia numeric(5,4) not null default 0 check (percentual_sucumbencia between 0 and 1),
  percentual_quota numeric(5,4) not null default 0 check (percentual_quota between 0 and 1),
  honorario_fixo_total numeric(14,2) not null default 0 check (honorario_fixo_total >= 0),
  valor_causa numeric(14,2) not null default 0 check (valor_causa >= 0),
  apelido_split text,
  observacoes text,
  data_proposta date,
  data_fechamento date,
  revisar boolean not null default false,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  constraint ck_fechamento_apos_proposta check (data_fechamento is null or data_proposta is null or data_fechamento >= data_proposta)
);

drop trigger if exists contratos_set_atualizado_em on public.contratos;
create trigger contratos_set_atualizado_em
before update on public.contratos
for each row execute function public.set_atualizado_em();

create index if not exists ix_contratos_parceiro on public.contratos(parceiro_id);
create index if not exists ix_contratos_status on public.contratos(status);

create table if not exists public.parcelas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete restrict,
  tipo public.parcela_tipo not null,
  valor numeric(14,2) not null check (valor > 0),
  mes_esperado date not null,
  recebido boolean not null default false,
  mes_recebimento date,
  observacoes text,
  criado_em timestamp with time zone not null default now(),
  constraint ck_mes_esperado_primeiro_dia check (date_part('day', mes_esperado) = 1),
  constraint ck_mes_recebimento_primeiro_dia check (mes_recebimento is null or date_part('day', mes_recebimento) = 1),
  constraint ck_recebido_coerente check ((recebido and mes_recebimento is not null) or (not recebido and mes_recebimento is null))
);

create index if not exists ix_parcelas_contrato on public.parcelas(contrato_id);
create index if not exists ix_parcelas_abertas on public.parcelas(mes_esperado) where not recebido;

create table if not exists public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  descricao text not null,
  tipo public.lancamento_tipo not null,
  valor numeric(14,2) not null check (valor > 0),
  categoria public.categoria_lancamento not null,
  forma_pagamento text,
  pago boolean not null default true,
  contrato_id uuid references public.contratos(id) on delete set null,
  observacoes text,
  origem public.lancamento_origem not null default 'manual',
  origem_id text,
  criado_em timestamp with time zone not null default now(),
  constraint ck_origem_id_presente check ((origem = 'manual' and origem_id is null) or (origem <> 'manual' and origem_id is not null))
);

create index if not exists ix_lanc_competencia on public.lancamentos(data) where pago;
create index if not exists ix_lanc_contrato on public.lancamentos(contrato_id) where contrato_id is not null;
create unique index if not exists ux_lanc_origem on public.lancamentos(origem, origem_id) where origem <> 'manual';

create table if not exists public.custos_fixos (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor_mensal numeric(14,2) not null check (valor_mensal > 0),
  recorrente boolean not null default true,
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  mes_inicio date not null,
  mes_fim date,
  criado_em timestamp with time zone not null default now(),
  constraint ck_mes_inicio_primeiro_dia check (date_part('day', mes_inicio) = 1),
  constraint ck_mes_fim_primeiro_dia check (mes_fim is null or date_part('day', mes_fim) = 1),
  constraint ck_vigencia check (mes_fim is null or mes_fim >= mes_inicio)
);

create table if not exists public.parametros (
  ano smallint primary key,
  caixa_inicial_ano numeric(14,2) not null default 0,
  meta_caixa_ano numeric(14,2) not null default 0,
  meta_recorrencia_mensal numeric(14,2) not null default 0,
  recorrencia_atual numeric(14,2) not null default 0,
  atualizado_em timestamp with time zone not null default now()
);

drop trigger if exists parametros_set_atualizado_em on public.parametros;
create trigger parametros_set_atualizado_em
before update on public.parametros
for each row execute function public.set_atualizado_em();

create table if not exists public.configuracoes (
  chave text primary key,
  valor text not null,
  descricao text,
  atualizado_em timestamp with time zone not null default now()
);

drop trigger if exists configuracoes_set_atualizado_em on public.configuracoes;
create trigger configuracoes_set_atualizado_em
before update on public.configuracoes
for each row execute function public.set_atualizado_em();

create table if not exists public.processos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique constraint ck_numero_cnj check (numero ~ '^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$'),
  contrato_id uuid references public.contratos(id) on delete set null,
  cliente text,
  tribunal public.tribunal_sigla not null,
  comarca_vara text,
  fase_atual text,
  ativo boolean not null default true,
  monitorar boolean not null default true,
  data_ultimo_andamento date,
  chaves_movimentacoes text[] not null default '{}',
  exige_senha boolean not null default false,
  senha_ref text,
  ultima_consulta_status public.consulta_status,
  ultima_consulta_em timestamp with time zone,
  ultima_consulta_inconclusiva boolean not null default false,
  criado_em timestamp with time zone not null default now(),
  constraint ck_senha_ref_formato check (senha_ref is null or senha_ref ~ '^vault:[0-9a-f-]{36}$')
);

comment on column public.processos.senha_ref is 'Vault reference only. Never store a process password here.';
create index if not exists ix_processos_radar on public.processos(tribunal) where ativo and monitorar;

create table if not exists public.execucoes_radar (
  id uuid primary key default gen_random_uuid(),
  origem public.execucao_origem not null,
  usuario_id uuid references auth.users(id),
  iniciada_em timestamp with time zone not null default now(),
  finalizada_em timestamp with time zone,
  status public.execucao_status not null default 'em_andamento',
  heartbeat_em timestamp with time zone not null default now(),
  total_consultados integer not null default 0,
  total_sucesso integer not null default 0,
  total_com_movimentacao_nova integer not null default 0,
  total_sem_movimentacao integer not null default 0,
  total_senha_necessaria integer not null default 0,
  total_nao_localizado integer not null default 0,
  total_captcha_timeout integer not null default 0,
  total_timeout integer not null default 0,
  total_pendente_implementacao integer not null default 0,
  total_base_inicial_criada integer not null default 0,
  total_numero_invalido integer not null default 0,
  total_pagina_intermediaria integer not null default 0,
  total_erro integer not null default 0,
  constraint ck_manual_tem_usuario check (origem <> 'manual' or usuario_id is not null)
);

create table if not exists public.resultados_consulta (
  id uuid primary key default gen_random_uuid(),
  execucao_id uuid not null references public.execucoes_radar(id) on delete cascade,
  processo_id uuid references public.processos(id) on delete cascade,
  numero_processo text not null,
  tribunal public.tribunal_sigla not null,
  consultado_em timestamp with time zone not null default now(),
  status public.consulta_status not null,
  quantidade_movimentacoes smallint not null default 0,
  movimentacoes jsonb not null default '[]',
  layout_movimentacoes text,
  tem_movimentacao_nova boolean not null default false,
  data_movimentacao_recente date,
  url_resultado text,
  mensagem_erro text,
  tipo_erro text,
  etapa text,
  duracao_segundos numeric(8,3)
);

create index if not exists ix_resultados_execucao on public.resultados_consulta(execucao_id);
create index if not exists ix_resultados_processo on public.resultados_consulta(processo_id, consultado_em desc);

create table if not exists public.movimentacoes_novas (
  id uuid primary key default gen_random_uuid(),
  execucao_id uuid not null references public.execucoes_radar(id) on delete cascade,
  processo_id uuid not null references public.processos(id) on delete cascade,
  resultado_id uuid not null references public.resultados_consulta(id) on delete cascade,
  chave text not null,
  data_hora text,
  descricao text not null,
  virou_tarefa boolean not null default false,
  criado_em timestamp with time zone not null default now(),
  constraint ux_mov_processo_chave unique (processo_id, chave)
);

create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  contrato_id uuid references public.contratos(id) on delete set null,
  responsavel text,
  prazo date,
  status public.tarefa_status not null default 'aberta',
  origem public.tarefa_origem not null default 'manual',
  movimentacao_id uuid references public.movimentacoes_novas(id) on delete set null,
  processo_id uuid references public.processos(id) on delete set null,
  numero_processo text,
  criado_em timestamp with time zone not null default now()
);

create unique index if not exists ux_tarefa_movimentacao on public.tarefas(movimentacao_id) where movimentacao_id is not null;
create unique index if not exists ux_tarefa_inercia_aberta on public.tarefas(processo_id) where origem = 'radar_inercia' and status = 'aberta';

create table if not exists public.auditoria (
  id bigserial primary key,
  usuario_id uuid references auth.users(id),
  entidade text not null,
  entidade_id text,
  acao text not null,
  valor_antigo jsonb,
  valor_novo jsonb,
  criado_em timestamp with time zone not null default now()
);

create table if not exists public.import_log (
  id bigserial primary key,
  execucao_id uuid not null,
  arquivo text not null,
  aba text not null,
  linha integer,
  coluna text,
  acao text not null,
  valor_origem text,
  valor_final text,
  entidade text,
  entidade_id uuid,
  severidade text not null default 'info' check (severidade in ('info','aviso','erro')),
  chave_linha text,
  criado_em timestamp with time zone not null default now()
);

create unique index if not exists ux_import_linha_decisao on public.import_log(arquivo, aba, chave_linha, acao, coalesce(coluna, ''), coalesce(valor_origem, ''), coalesce(valor_final, '')) where chave_linha is not null;
create index if not exists ix_import_severidade on public.import_log(severidade) where severidade <> 'info';

create or replace function public.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'auditoria is insert-only';
end;
$$;

drop trigger if exists auditoria_insert_only on public.auditoria;
create trigger auditoria_insert_only
before update or delete on public.auditoria
for each row execute function public.prevent_audit_mutation();

create table if not exists public.ind_fluxo_mensal (
  ano smallint not null,
  mes smallint not null check (mes between 1 and 12),
  entradas_pagas numeric(14,2) not null default 0,
  saidas_pagas numeric(14,2) not null default 0,
  resultado_mes numeric(14,2) not null default 0,
  saldo_acumulado numeric(14,2) not null default 0,
  recalculado_em timestamp with time zone not null default now(),
  primary key (ano, mes)
);

create table if not exists public.ind_dre_mensal (
  ano smallint not null,
  mes smallint not null check (mes between 1 and 12),
  receita numeric(14,2) not null default 0,
  custos_diretos numeric(14,2) not null default 0,
  despesas_operacionais numeric(14,2) not null default 0,
  resultado numeric(14,2) not null default 0,
  margem numeric(6,4),
  recalculado_em timestamp with time zone not null default now(),
  primary key (ano, mes)
);

create table if not exists public.ind_balanco (
  ano smallint not null,
  mes smallint not null check (mes between 1 and 12),
  caixa numeric(14,2) not null default 0,
  a_receber_total numeric(14,2) not null default 0,
  a_receber_vencido numeric(14,2) not null default 0,
  a_receber_a_vencer numeric(14,2) not null default 0,
  ativo numeric(14,2) not null default 0,
  passivo numeric(14,2) not null default 0,
  patrimonio_liquido numeric(14,2) not null default 0,
  recalculado_em timestamp with time zone not null default now(),
  primary key (ano, mes)
);

create table if not exists public.ind_gastos_categoria (
  ano smallint not null,
  mes smallint not null check (mes between 1 and 12),
  categoria public.categoria_lancamento not null,
  total numeric(14,2) not null default 0,
  recalculado_em timestamp with time zone not null default now(),
  primary key (ano, mes, categoria)
);

create table if not exists public.ind_analise_mensal (
  ano smallint not null,
  mes smallint not null check (mes between 1 and 12),
  faturamento numeric(14,2) not null default 0,
  clientes_fechados integer not null default 0,
  restituicoes numeric(14,2) not null default 0,
  inadimplencia numeric(14,2) not null default 0,
  recalculado_em timestamp with time zone not null default now(),
  primary key (ano, mes)
);

create table if not exists public.ind_painel (
  ano smallint primary key,
  mes_referencia smallint not null check (mes_referencia between 1 and 12),
  caixa_atual numeric(14,2) not null default 0,
  meses_reserva numeric(6,2),
  custo_fixo_mensal numeric(14,2) not null default 0,
  percentual_receita_recorrente numeric(6,4),
  percentual_meta_caixa numeric(6,4),
  percentual_meta_recorrencia numeric(6,4),
  a_receber_total numeric(14,2) not null default 0,
  inadimplencia numeric(14,2) not null default 0,
  taxa_conversao numeric(6,4),
  exito_projetado_escritorio numeric(14,2) not null default 0,
  exito_projetado_parceiro numeric(14,2) not null default 0,
  sucumbencia_projetada numeric(14,2) not null default 0,
  recalculado_em timestamp with time zone not null default now()
);

create or replace function public.refresh_painel(p_ano smallint default null, p_mes_referencia smallint default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ano_row record;
  ref_mes smallint;
  fim_ref date;
  caixa numeric(14,2);
  custo_fixo numeric(14,2);
  receber numeric(14,2);
  inad numeric(14,2);
  receita_ano numeric(14,2);
  receita_rec numeric(14,2);
  propostas integer;
  convertidos integer;
  exito_esc numeric(14,2);
  exito_par numeric(14,2);
  sucumb numeric(14,2);
  meta_caixa numeric(14,2);
  meta_rec numeric(14,2);
  recorr_atual numeric(14,2);
begin
  for ano_row in
    select distinct ano from public.parametros where p_ano is null or ano = p_ano
    union
    select distinct date_part('year', data)::smallint as ano from public.lancamentos where p_ano is null or date_part('year', data)::smallint = p_ano
    union
    select distinct date_part('year', mes_esperado)::smallint as ano from public.parcelas where p_ano is null or date_part('year', mes_esperado)::smallint = p_ano
    union
    select distinct date_part('year', coalesce(data_proposta, data_fechamento))::smallint as ano
    from public.contratos
    where coalesce(data_proposta, data_fechamento) is not null
      and (p_ano is null or date_part('year', coalesce(data_proposta, data_fechamento))::smallint = p_ano)
  loop
    ref_mes := coalesce(p_mes_referencia, case when ano_row.ano = date_part('year', current_date)::smallint then date_part('month', current_date)::smallint else 12 end);
    fim_ref := (make_date(ano_row.ano, ref_mes, 1) + interval '1 month - 1 day')::date;

    select coalesce(saldo_acumulado, 0) into caixa from public.ind_fluxo_mensal where ano = ano_row.ano and mes = ref_mes;
    caixa := coalesce(caixa, 0);

    select coalesce(sum(valor_mensal), 0) into custo_fixo
    from public.custos_fixos
    where recorrente and mes_inicio <= fim_ref and (mes_fim is null or mes_fim >= fim_ref);

    select coalesce(a_receber_total, 0), coalesce(a_receber_vencido, 0)
    into receber, inad
    from public.ind_balanco
    where ano = ano_row.ano and mes = ref_mes;
    receber := coalesce(receber, 0);
    inad := coalesce(inad, 0);

    select
      coalesce(sum(l.valor) filter (where l.pago and l.tipo = 'entrada'), 0),
      coalesce(sum(l.valor) filter (where l.pago and l.tipo = 'entrada' and l.origem = 'parcela' and p.tipo = 'mensal'), 0)
    into receita_ano, receita_rec
    from public.lancamentos l
    left join public.parcelas p on l.origem = 'parcela' and l.origem_id = p.id::text
    where l.data >= make_date(ano_row.ano, 1, 1)
      and l.data < make_date(ano_row.ano + 1, 1, 1);

    select count(*), count(*) filter (where status in ('ativo','aguardando_exito','encerrado'))
    into propostas, convertidos
    from public.contratos
    where data_proposta >= make_date(ano_row.ano, 1, 1)
      and data_proposta < make_date(ano_row.ano + 1, 1, 1);

    select
      coalesce(sum(valor_causa * percentual_exito * (1 - percentual_quota)), 0),
      coalesce(sum(valor_causa * percentual_exito * percentual_quota), 0),
      coalesce(sum(valor_causa * percentual_sucumbencia), 0)
    into exito_esc, exito_par, sucumb
    from public.contratos
    where status in ('ativo','aguardando_exito');

    select meta_caixa_ano, meta_recorrencia_mensal, recorrencia_atual
    into meta_caixa, meta_rec, recorr_atual
    from public.parametros
    where ano = ano_row.ano;

    insert into public.ind_painel (
      ano, mes_referencia, caixa_atual, meses_reserva, custo_fixo_mensal,
      percentual_receita_recorrente, percentual_meta_caixa, percentual_meta_recorrencia,
      a_receber_total, inadimplencia, taxa_conversao,
      exito_projetado_escritorio, exito_projetado_parceiro, sucumbencia_projetada, recalculado_em
    ) values (
      ano_row.ano, ref_mes, caixa, caixa / nullif(custo_fixo, 0), custo_fixo,
      receita_rec / nullif(receita_ano, 0), caixa / nullif(meta_caixa, 0),
      recorr_atual / nullif(meta_rec, 0), receber, inad,
      convertidos::numeric / nullif(propostas, 0),
      exito_esc, exito_par, sucumb, now()
    )
    on conflict (ano) do update set
      mes_referencia = excluded.mes_referencia,
      caixa_atual = excluded.caixa_atual,
      meses_reserva = excluded.meses_reserva,
      custo_fixo_mensal = excluded.custo_fixo_mensal,
      percentual_receita_recorrente = excluded.percentual_receita_recorrente,
      percentual_meta_caixa = excluded.percentual_meta_caixa,
      percentual_meta_recorrencia = excluded.percentual_meta_recorrencia,
      a_receber_total = excluded.a_receber_total,
      inadimplencia = excluded.inadimplencia,
      taxa_conversao = excluded.taxa_conversao,
      exito_projetado_escritorio = excluded.exito_projetado_escritorio,
      exito_projetado_parceiro = excluded.exito_projetado_parceiro,
      sucumbencia_projetada = excluded.sucumbencia_projetada,
      recalculado_em = now();
  end loop;
end;
$$;

create or replace function public.recalcular_mes(p_ano smallint, p_mes smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m smallint;
  inicio date;
  fim date;
  entradas numeric(14,2);
  saidas numeric(14,2);
  resultado numeric(14,2);
  saldo numeric(14,2);
  receita numeric(14,2);
  custos_diretos numeric(14,2);
  despesas numeric(14,2);
  dre_resultado numeric(14,2);
  a_vencido numeric(14,2);
  a_vencer numeric(14,2);
  passivo_val numeric(14,2);
  clientes integer;
  rest numeric(14,2);
begin
  if p_mes < 1 or p_mes > 12 then
    raise exception 'invalid month %', p_mes;
  end if;

  perform pg_advisory_xact_lock(hashtext('recalc:' || p_ano || ':' || p_mes));

  for m in p_mes..12 loop
    inicio := make_date(p_ano, m, 1);
    fim := (inicio + interval '1 month - 1 day')::date;

    select
      coalesce(sum(valor) filter (where pago and tipo = 'entrada'), 0),
      coalesce(sum(valor) filter (where pago and tipo = 'saida'), 0)
    into entradas, saidas
    from public.lancamentos
    where data >= inicio and data <= fim;

    resultado := entradas - saidas;
    if m = 1 then
      select coalesce(caixa_inicial_ano, 0) + resultado into saldo from public.parametros where ano = p_ano;
      saldo := coalesce(saldo, resultado);
    else
      select coalesce(saldo_acumulado, 0) + resultado into saldo from public.ind_fluxo_mensal where ano = p_ano and mes = (m - 1);
      saldo := coalesce(saldo, resultado);
    end if;

    insert into public.ind_fluxo_mensal (ano, mes, entradas_pagas, saidas_pagas, resultado_mes, saldo_acumulado, recalculado_em)
    values (p_ano, m, entradas, saidas, resultado, saldo, now())
    on conflict (ano, mes) do update set entradas_pagas = excluded.entradas_pagas, saidas_pagas = excluded.saidas_pagas, resultado_mes = excluded.resultado_mes, saldo_acumulado = excluded.saldo_acumulado, recalculado_em = now();

    receita := entradas;
    select
      coalesce(sum(valor) filter (where pago and tipo = 'saida' and categoria in ('custas_processuais','restituicao_cliente')), 0),
      coalesce(sum(valor) filter (where pago and tipo = 'saida' and categoria not in ('custas_processuais','restituicao_cliente')), 0)
    into custos_diretos, despesas
    from public.lancamentos
    where data >= inicio and data <= fim;
    dre_resultado := receita - custos_diretos - despesas;

    insert into public.ind_dre_mensal (ano, mes, receita, custos_diretos, despesas_operacionais, resultado, margem, recalculado_em)
    values (p_ano, m, receita, custos_diretos, despesas, dre_resultado, dre_resultado / nullif(receita, 0), now())
    on conflict (ano, mes) do update set receita = excluded.receita, custos_diretos = excluded.custos_diretos, despesas_operacionais = excluded.despesas_operacionais, resultado = excluded.resultado, margem = excluded.margem, recalculado_em = now();

    select
      coalesce(sum(valor) filter (where not recebido and mes_esperado <= fim), 0),
      coalesce(sum(valor) filter (where not recebido and mes_esperado > fim), 0)
    into a_vencido, a_vencer
    from public.parcelas;

    select coalesce(sum(valor), 0) into passivo_val
    from public.lancamentos
    where tipo = 'saida' and not pago and data <= fim;

    insert into public.ind_balanco (ano, mes, caixa, a_receber_total, a_receber_vencido, a_receber_a_vencer, ativo, passivo, patrimonio_liquido, recalculado_em)
    values (p_ano, m, saldo, a_vencido + a_vencer, a_vencido, a_vencer, saldo + a_vencido + a_vencer, passivo_val, saldo + a_vencido + a_vencer - passivo_val, now())
    on conflict (ano, mes) do update set caixa = excluded.caixa, a_receber_total = excluded.a_receber_total, a_receber_vencido = excluded.a_receber_vencido, a_receber_a_vencer = excluded.a_receber_a_vencer, ativo = excluded.ativo, passivo = excluded.passivo, patrimonio_liquido = excluded.patrimonio_liquido, recalculado_em = now();

    select count(*) into clientes
    from public.contratos
    where data_fechamento >= inicio and data_fechamento <= fim;

    select coalesce(sum(valor), 0) into rest
    from public.lancamentos
    where pago and tipo = 'saida' and categoria = 'restituicao_cliente' and data >= inicio and data <= fim;

    insert into public.ind_analise_mensal (ano, mes, faturamento, clientes_fechados, restituicoes, inadimplencia, recalculado_em)
    values (p_ano, m, receita, clientes, rest, a_vencido, now())
    on conflict (ano, mes) do update set faturamento = excluded.faturamento, clientes_fechados = excluded.clientes_fechados, restituicoes = excluded.restituicoes, inadimplencia = excluded.inadimplencia, recalculado_em = now();

    delete from public.ind_gastos_categoria where ano = p_ano and mes = m;
    insert into public.ind_gastos_categoria (ano, mes, categoria, total, recalculado_em)
    select p_ano, m, categoria, sum(valor), now()
    from public.lancamentos
    where pago and tipo = 'saida' and data >= inicio and data <= fim
    group by categoria;
  end loop;

  perform public.refresh_painel(p_ano, null);
end;
$$;

create or replace function public.recalcular_meses(p_ano smallint, p_mes_de smallint, p_mes_ate smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mes_de < 1 or p_mes_ate > 12 or p_mes_de > p_mes_ate then
    raise exception 'invalid month range %.%', p_mes_de, p_mes_ate;
  end if;
  perform public.recalcular_mes(p_ano, p_mes_de);
end;
$$;

create or replace function public.recalc_from_lancamento()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recalcular_mes(date_part('year', old.data)::smallint, date_part('month', old.data)::smallint);
    return old;
  end if;
  perform public.recalcular_mes(date_part('year', new.data)::smallint, date_part('month', new.data)::smallint);
  if tg_op = 'UPDATE' and (date_part('year', old.data) <> date_part('year', new.data) or date_part('month', old.data) <> date_part('month', new.data)) then
    perform public.recalcular_mes(date_part('year', old.data)::smallint, date_part('month', old.data)::smallint);
  end if;
  return new;
end;
$$;

drop trigger if exists lancamentos_recalc on public.lancamentos;
create trigger lancamentos_recalc
after insert or update or delete on public.lancamentos
for each row execute function public.recalc_from_lancamento();

create or replace function public.recalc_from_parcela()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target date;
begin
  target := coalesce(case when tg_op = 'DELETE' then old.mes_recebimento else new.mes_recebimento end, case when tg_op = 'DELETE' then old.mes_esperado else new.mes_esperado end);
  perform public.recalcular_mes(date_part('year', target)::smallint, date_part('month', target)::smallint);
  return coalesce(new, old);
end;
$$;

drop trigger if exists parcelas_recalc on public.parcelas;
create trigger parcelas_recalc
after insert or update or delete on public.parcelas
for each row execute function public.recalc_from_parcela();

create or replace function public.recalc_from_contrato()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target date;
begin
  target := coalesce(case when tg_op = 'DELETE' then old.data_fechamento else new.data_fechamento end, case when tg_op = 'DELETE' then old.data_proposta else new.data_proposta end, make_date(date_part('year', current_date)::smallint, 1, 1));
  perform public.recalcular_mes(date_part('year', target)::smallint, date_part('month', target)::smallint);
  return coalesce(new, old);
end;
$$;

drop trigger if exists contratos_recalc on public.contratos;
create trigger contratos_recalc
after insert or update or delete on public.contratos
for each row execute function public.recalc_from_contrato();

create or replace function public.recalc_from_parametros()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.recalcular_mes(coalesce(new.ano, old.ano), 1::smallint);
  return coalesce(new, old);
end;
$$;

drop trigger if exists parametros_recalc on public.parametros;
create trigger parametros_recalc
after insert or update or delete on public.parametros
for each row execute function public.recalc_from_parametros();

insert into public.parceiros (nome) values
  ('Pavageau'),
  ('Leardini'),
  ('Instagram'),
  ('Goncalves/Mello'),
  ('A&E Advogados'),
  ('Eliton Vilalta')
on conflict (nome) do nothing;

insert into public.configuracoes (chave, valor, descricao) values
  ('radar_cron', '0 3 * * 1', 'Weekly run schedule (cron, America/Sao_Paulo)'),
  ('radar_email_erros', 'gacamargo2003@gmail.com', 'Technical error report recipient'),
  ('radar_inercia_dias', '30', 'Inertia rule threshold in days'),
  ('radar_alerta_sem_rodada_dias', '8', 'Alert when no run completes within N days')
on conflict (chave) do update set valor = excluded.valor, descricao = excluded.descricao;

insert into public.parametros (ano, caixa_inicial_ano, meta_caixa_ano, meta_recorrencia_mensal, recorrencia_atual)
values (2026, 0, 0, 0, 0)
on conflict (ano) do nothing;

alter table public.app_members enable row level security;
alter table public.parceiros enable row level security;
alter table public.contratos enable row level security;
alter table public.parcelas enable row level security;
alter table public.lancamentos enable row level security;
alter table public.custos_fixos enable row level security;
alter table public.parametros enable row level security;
alter table public.configuracoes enable row level security;
alter table public.processos enable row level security;
alter table public.execucoes_radar enable row level security;
alter table public.resultados_consulta enable row level security;
alter table public.movimentacoes_novas enable row level security;
alter table public.tarefas enable row level security;
alter table public.auditoria enable row level security;
alter table public.import_log enable row level security;
alter table public.ind_fluxo_mensal enable row level security;
alter table public.ind_dre_mensal enable row level security;
alter table public.ind_balanco enable row level security;
alter table public.ind_gastos_categoria enable row level security;
alter table public.ind_analise_mensal enable row level security;
alter table public.ind_painel enable row level security;

grant usage on schema public to authenticated;
grant select on public.app_members to authenticated;
grant select, insert, update, delete on public.parceiros, public.contratos, public.parcelas, public.lancamentos, public.custos_fixos, public.parametros, public.configuracoes, public.processos, public.tarefas to authenticated;
grant select on public.execucoes_radar, public.resultados_consulta, public.movimentacoes_novas to authenticated;
grant select on public.ind_fluxo_mensal, public.ind_dre_mensal, public.ind_balanco, public.ind_gastos_categoria, public.ind_analise_mensal, public.ind_painel to authenticated;
grant select, insert on public.auditoria, public.import_log to authenticated;
grant usage, select on all sequences in schema public to authenticated;
revoke insert, update, delete on public.ind_fluxo_mensal, public.ind_dre_mensal, public.ind_balanco, public.ind_gastos_categoria, public.ind_analise_mensal, public.ind_painel from authenticated;
revoke select (senha_ref) on public.processos from authenticated;

revoke all on function public.set_atualizado_em() from public;
revoke all on function public.prevent_audit_mutation() from public;
revoke all on function public.refresh_painel(smallint, smallint) from public;
revoke all on function public.recalcular_mes(smallint, smallint) from public;
revoke all on function public.recalcular_meses(smallint, smallint, smallint) from public;
revoke all on function public.current_user_is_app_member() from public;
grant execute on function public.current_user_is_app_member() to authenticated;
grant execute on function public.refresh_painel(smallint, smallint) to authenticated;
grant execute on function public.recalcular_mes(smallint, smallint) to authenticated;
grant execute on function public.recalcular_meses(smallint, smallint, smallint) to authenticated;

drop policy if exists app_members_self_read on public.app_members;
create policy app_members_self_read on public.app_members for select to authenticated
using (ativo and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists parceiros_rw on public.parceiros;
drop policy if exists contratos_rw on public.contratos;
drop policy if exists parcelas_rw on public.parcelas;
drop policy if exists lancamentos_rw on public.lancamentos;
drop policy if exists custos_fixos_rw on public.custos_fixos;
drop policy if exists parametros_rw on public.parametros;
drop policy if exists configuracoes_rw on public.configuracoes;
drop policy if exists processos_rw on public.processos;
drop policy if exists tarefas_rw on public.tarefas;

create policy parceiros_rw on public.parceiros for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy contratos_rw on public.contratos for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy parcelas_rw on public.parcelas for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy lancamentos_rw on public.lancamentos for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy custos_fixos_rw on public.custos_fixos for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy parametros_rw on public.parametros for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy configuracoes_rw on public.configuracoes for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy processos_rw on public.processos for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());
create policy tarefas_rw on public.tarefas for all to authenticated using (public.current_user_is_app_member()) with check (public.current_user_is_app_member());

drop policy if exists execucoes_radar_read on public.execucoes_radar;
drop policy if exists resultados_consulta_read on public.resultados_consulta;
drop policy if exists movimentacoes_novas_read on public.movimentacoes_novas;
create policy execucoes_radar_read on public.execucoes_radar for select to authenticated using (public.current_user_is_app_member());
create policy resultados_consulta_read on public.resultados_consulta for select to authenticated using (public.current_user_is_app_member());
create policy movimentacoes_novas_read on public.movimentacoes_novas for select to authenticated using (public.current_user_is_app_member());

drop policy if exists auditoria_read on public.auditoria;
drop policy if exists auditoria_insert on public.auditoria;
drop policy if exists import_log_read on public.import_log;
drop policy if exists import_log_insert on public.import_log;
create policy auditoria_read on public.auditoria for select to authenticated using (public.current_user_is_app_member());
create policy auditoria_insert on public.auditoria for insert to authenticated with check (public.current_user_is_app_member());
create policy import_log_read on public.import_log for select to authenticated using (public.current_user_is_app_member());
create policy import_log_insert on public.import_log for insert to authenticated with check (public.current_user_is_app_member());

drop policy if exists ind_fluxo_read on public.ind_fluxo_mensal;
drop policy if exists ind_dre_read on public.ind_dre_mensal;
drop policy if exists ind_balanco_read on public.ind_balanco;
drop policy if exists ind_gastos_read on public.ind_gastos_categoria;
drop policy if exists ind_analise_read on public.ind_analise_mensal;
drop policy if exists ind_painel_read on public.ind_painel;
create policy ind_fluxo_read on public.ind_fluxo_mensal for select to authenticated using (public.current_user_is_app_member());
create policy ind_dre_read on public.ind_dre_mensal for select to authenticated using (public.current_user_is_app_member());
create policy ind_balanco_read on public.ind_balanco for select to authenticated using (public.current_user_is_app_member());
create policy ind_gastos_read on public.ind_gastos_categoria for select to authenticated using (public.current_user_is_app_member());
create policy ind_analise_read on public.ind_analise_mensal for select to authenticated using (public.current_user_is_app_member());
create policy ind_painel_read on public.ind_painel for select to authenticated using (public.current_user_is_app_member());

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'radar_worker') then
    create role radar_worker login;
  end if;
end $$;

grant usage on schema public to radar_worker;
grant select, insert, update on public.execucoes_radar, public.resultados_consulta, public.movimentacoes_novas to radar_worker;
grant select on public.configuracoes to radar_worker;
grant select, update (chaves_movimentacoes, data_ultimo_andamento, ultima_consulta_status, ultima_consulta_em, ultima_consulta_inconclusiva, exige_senha) on public.processos to radar_worker;
grant select, insert on public.tarefas to radar_worker;
grant insert on public.auditoria to radar_worker;
grant usage, select on all sequences in schema public to radar_worker;

drop policy if exists radar_execucoes_rw on public.execucoes_radar;
drop policy if exists radar_resultados_rw on public.resultados_consulta;
drop policy if exists radar_movimentacoes_rw on public.movimentacoes_novas;
drop policy if exists radar_proc_rw on public.processos;
drop policy if exists radar_cfg_read on public.configuracoes;
drop policy if exists radar_task_read on public.tarefas;
drop policy if exists radar_task_insert on public.tarefas;
drop policy if exists radar_audit_insert on public.auditoria;
create policy radar_execucoes_rw on public.execucoes_radar for all to radar_worker using (true) with check (true);
create policy radar_resultados_rw on public.resultados_consulta for all to radar_worker using (true) with check (true);
create policy radar_movimentacoes_rw on public.movimentacoes_novas for all to radar_worker using (true) with check (true);
create policy radar_proc_rw on public.processos for all to radar_worker using (true) with check (true);
create policy radar_cfg_read on public.configuracoes for select to radar_worker using (true);
create policy radar_task_read on public.tarefas for select to radar_worker using (true);
create policy radar_task_insert on public.tarefas for insert to radar_worker with check (origem = 'radar_inercia');
create policy radar_audit_insert on public.auditoria for insert to radar_worker with check (true);
