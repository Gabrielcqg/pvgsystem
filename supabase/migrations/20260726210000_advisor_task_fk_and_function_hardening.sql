-- Advisor follow-up: cover task-module foreign keys and pin search_path on
-- financial trigger functions without changing runtime behavior.

CREATE INDEX IF NOT EXISTS idx_tarefa_checklist_criado_por
  ON public.tarefa_checklist_itens (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_checklist_atualizado_por
  ON public.tarefa_checklist_itens (atualizado_por)
  WHERE atualizado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_colaboradores_usuario_id
  ON public.tarefa_colaboradores (usuario_id);

CREATE INDEX IF NOT EXISTS idx_tarefa_colaboradores_criado_por
  ON public.tarefa_colaboradores (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_comentarios_autor_id
  ON public.tarefa_comentarios (autor_id)
  WHERE autor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_comentarios_excluido_por
  ON public.tarefa_comentarios (excluido_por)
  WHERE excluido_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_dependencias_criado_por
  ON public.tarefa_dependencias (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_historico_usuario_id
  ON public.tarefa_historico (usuario_id)
  WHERE usuario_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_status_tempos_status
  ON public.tarefa_status_tempos (status);

CREATE INDEX IF NOT EXISTS idx_tarefa_subtarefas_responsavel_id
  ON public.tarefa_subtarefas (responsavel_id)
  WHERE responsavel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_subtarefas_status
  ON public.tarefa_subtarefas (status);

CREATE INDEX IF NOT EXISTS idx_tarefa_subtarefas_completed_by
  ON public.tarefa_subtarefas (completed_by)
  WHERE completed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_subtarefas_criado_por
  ON public.tarefa_subtarefas (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_subtarefas_atualizado_por
  ON public.tarefa_subtarefas (atualizado_por)
  WHERE atualizado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_tag_relacoes_tag_id
  ON public.tarefa_tag_relacoes (tag_id);

CREATE INDEX IF NOT EXISTS idx_tarefa_tag_relacoes_criado_por
  ON public.tarefa_tag_relacoes (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_tags_criado_por
  ON public.tarefa_tags (criado_por)
  WHERE criado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_archived_by
  ON public.tarefas (archived_by)
  WHERE archived_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_completed_by
  ON public.tarefas (completed_by)
  WHERE completed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_created_by
  ON public.tarefas (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_updated_by
  ON public.tarefas (updated_by)
  WHERE updated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_status_changed_by
  ON public.tarefas (status_changed_by)
  WHERE status_changed_by IS NOT NULL;

ALTER FUNCTION private.validate_lancamento_origin_reference()
  SET search_path = public, private, pg_temp;

ALTER FUNCTION private.prevent_delete_parcela_with_lancamento()
  SET search_path = public, private, pg_temp;

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schema_migrations_no_authenticated_access ON public.schema_migrations;
CREATE POLICY schema_migrations_no_authenticated_access
ON public.schema_migrations
FOR SELECT
TO authenticated
USING (false);
