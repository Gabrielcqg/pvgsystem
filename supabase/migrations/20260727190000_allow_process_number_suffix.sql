alter table public.processos
  drop constraint if exists ck_numero_cnj;

alter table public.processos
  add constraint ck_numero_processo_formato
  check (numero ~ '^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}(/[0-9]+)?$');

comment on constraint ck_numero_processo_formato on public.processos
  is 'Permite CNJ puro ou identificador operacional com sufixo textual numerico, por exemplo /01, preservando o CNJ base.';
