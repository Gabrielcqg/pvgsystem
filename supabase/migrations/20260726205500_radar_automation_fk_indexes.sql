-- Cover foreign keys introduced by the Radar automation engine so deletes and
-- joins stay predictable under Supabase Advisor checks.

CREATE INDEX IF NOT EXISTS idx_radar_automacao_regras_tipo_id
  ON public.radar_automacao_regras (tipo_id)
  WHERE tipo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_regras_responsavel_id
  ON public.radar_automacao_regras (responsavel_id)
  WHERE responsavel_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_regras_proxima_regra_id
  ON public.radar_automacao_regras (proxima_regra_id)
  WHERE proxima_regra_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_mov_classificacoes_tipo_id
  ON public.radar_movimentacao_classificacoes (tipo_id)
  WHERE tipo_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_mov_classificacoes_regra_id
  ON public.radar_movimentacao_classificacoes (regra_id)
  WHERE regra_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_regra_id
  ON public.radar_automacao_execucoes (regra_id);

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_tarefa_anterior_id
  ON public.radar_automacao_execucoes (tarefa_anterior_id)
  WHERE tarefa_anterior_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_aprovado_por
  ON public.radar_automacao_execucoes (aprovado_por)
  WHERE aprovado_por IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_ignorado_por
  ON public.radar_automacao_execucoes (ignorado_por)
  WHERE ignorado_por IS NOT NULL;
