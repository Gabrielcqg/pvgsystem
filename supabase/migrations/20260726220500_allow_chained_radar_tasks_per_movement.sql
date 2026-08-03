-- Radar chaining can create a follow-up task from the same movement. Keep the
-- legacy/manual deduplication, but let audited automation executions own their
-- own unique task through ux_tarefas_radar_automacao_execucao.

DROP INDEX IF EXISTS public.ux_tarefa_movimentacao;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tarefa_movimentacao_legada
  ON public.tarefas (movimentacao_id)
  WHERE movimentacao_id IS NOT NULL
    AND radar_automacao_execucao_id IS NULL;
