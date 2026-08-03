-- Enable audited Radar task chaining after a Radar-generated task is completed.
-- The engine still requires an explicit proxima_regra_id between approved rules;
-- no legal workflow is inferred from movement text alone.

ALTER TABLE public.radar_automacao_execucoes
  ADD COLUMN IF NOT EXISTS gatilho text NOT NULL DEFAULT 'movimentacao_detectada';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'radar_automacao_execucoes_gatilho_ck'
      AND conrelid = 'public.radar_automacao_execucoes'::regclass
  ) THEN
    ALTER TABLE public.radar_automacao_execucoes
      ADD CONSTRAINT radar_automacao_execucoes_gatilho_ck
      CHECK (gatilho IN ('movimentacao_detectada', 'tarefa_concluida'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_radar_automacao_execucoes_tarefa_anterior_regra_versao
  ON public.radar_automacao_execucoes (tarefa_anterior_id, regra_id, versao)
  WHERE tarefa_anterior_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_gatilho_status
  ON public.radar_automacao_execucoes (gatilho, status, criado_em DESC);

INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES (
  'radar_encadeamento_tarefas_ativo',
  'true',
  'Feature flag para encadeamento automático de tarefas do Radar Processual. Ativo apenas para regras aprovadas com proxima_regra_id configurada.'
)
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;
