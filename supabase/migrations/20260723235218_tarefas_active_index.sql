create index if not exists ix_tarefas_ativas
on public.tarefas (status, prioridade, prazo, atualizado_em desc)
where archived_at is null and status <> 'concluida';
