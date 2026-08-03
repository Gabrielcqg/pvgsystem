alter table public.processos
  add column if not exists area_pasta text,
  add column if not exists numero_interno text,
  add column if not exists status_processo text,
  add column if not exists autor text,
  add column if not exists reu text,
  add column if not exists assunto text,
  add column if not exists andamento_atual text;

comment on column public.processos.area_pasta is 'Area/pasta do processo conforme controle operacional do escritorio.';
comment on column public.processos.numero_interno is 'Numero interno/ordem do controle originado da coluna Nº da planilha.';
comment on column public.processos.status_processo is 'Status operacional do processo informado pelo escritorio; diferente do status tecnico da consulta do radar.';
comment on column public.processos.autor is 'Parte autora cadastrada no processo.';
comment on column public.processos.reu is 'Parte re cadastrada no processo.';
comment on column public.processos.assunto is 'Assunto juridico/processual do cadastro do processo.';
comment on column public.processos.andamento_atual is 'Andamento atual textual informado pelo usuario ou importacao.';

create index if not exists ix_processos_area_pasta
on public.processos(area_pasta)
where area_pasta is not null;

create index if not exists ix_processos_status_processo
on public.processos(status_processo)
where status_processo is not null;

create index if not exists ix_processos_numero_interno
on public.processos(numero_interno)
where numero_interno is not null;
