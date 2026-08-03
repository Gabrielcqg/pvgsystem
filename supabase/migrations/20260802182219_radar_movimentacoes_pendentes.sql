-- Fila persistente de analise de movimentacoes do Radar.
-- A ultima execucao do Radar continua em resultados_consulta; esta fila vive em
-- movimentacoes_novas e nao deve sumir quando uma rodada posterior nao trouxer
-- nova movimentacao para o mesmo processo.

ALTER TABLE public.movimentacoes_novas
  ADD COLUMN IF NOT EXISTS status_analise text NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS status_analise_atualizado_em timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS analisada_em timestamptz,
  ADD COLUMN IF NOT EXISTS concluida_em timestamptz,
  ADD COLUMN IF NOT EXISTS ignorada_em timestamptz,
  ADD COLUMN IF NOT EXISTS ignorada_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS motivo_ignorada text,
  ADD COLUMN IF NOT EXISTS tarefa_principal_id uuid REFERENCES public.tarefas(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'movimentacoes_novas_status_analise_ck'
      AND conrelid = 'public.movimentacoes_novas'::regclass
  ) THEN
    ALTER TABLE public.movimentacoes_novas
      ADD CONSTRAINT movimentacoes_novas_status_analise_ck
      CHECK (status_analise IN ('pendente', 'em_tarefa', 'analisada', 'concluida', 'ignorada'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tarefa_movimentacoes (
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  movimentacao_id uuid NOT NULL REFERENCES public.movimentacoes_novas(id) ON DELETE CASCADE,
  criado_em timestamptz NOT NULL DEFAULT now(),
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (tarefa_id, movimentacao_id)
);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_novas_status_analise
  ON public.movimentacoes_novas (status_analise, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_novas_processo_status_analise
  ON public.movimentacoes_novas (processo_id, status_analise, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_novas_tarefa_principal
  ON public.movimentacoes_novas (tarefa_principal_id)
  WHERE tarefa_principal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefa_movimentacoes_movimentacao
  ON public.tarefa_movimentacoes (movimentacao_id);

CREATE INDEX IF NOT EXISTS idx_tarefa_movimentacoes_tarefa
  ON public.tarefa_movimentacoes (tarefa_id);

WITH tarefa_por_movimentacao AS (
  SELECT DISTINCT ON (t.movimentacao_id)
    t.movimentacao_id,
    t.id AS tarefa_id,
    t.status,
    t.completed_at,
    t.archived_at
  FROM public.tarefas t
  WHERE t.movimentacao_id IS NOT NULL
  ORDER BY t.movimentacao_id, t.criado_em DESC
)
UPDATE public.movimentacoes_novas m
SET tarefa_principal_id = coalesce(m.tarefa_principal_id, t.tarefa_id),
    status_analise = CASE
      WHEN t.tarefa_id IS NULL THEN m.status_analise
      WHEN t.status = 'concluida' THEN 'concluida'
      WHEN m.status_analise IN ('ignorada', 'analisada', 'concluida') THEN m.status_analise
      ELSE 'em_tarefa'
    END,
    concluida_em = CASE
      WHEN t.status = 'concluida' THEN coalesce(m.concluida_em, t.completed_at, now())
      ELSE m.concluida_em
    END,
    status_analise_atualizado_em = now(),
    virou_tarefa = CASE WHEN t.tarefa_id IS NOT NULL THEN true ELSE m.virou_tarefa END
FROM tarefa_por_movimentacao t
WHERE t.movimentacao_id = m.id;

INSERT INTO public.tarefa_movimentacoes (tarefa_id, movimentacao_id)
SELECT t.id, t.movimentacao_id
FROM public.tarefas t
WHERE t.movimentacao_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.tarefa_movimentacoes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_movimentacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_movimentacoes TO radar_worker;

GRANT UPDATE (
  status_analise,
  status_analise_atualizado_em,
  analisada_em,
  concluida_em,
  ignorada_em,
  ignorada_por,
  motivo_ignorada,
  tarefa_principal_id,
  virou_tarefa
) ON public.movimentacoes_novas TO authenticated;

DROP POLICY IF EXISTS tarefa_movimentacoes_app_members ON public.tarefa_movimentacoes;
CREATE POLICY tarefa_movimentacoes_app_members
ON public.tarefa_movimentacoes
FOR ALL
TO authenticated
USING ((SELECT public.current_user_is_app_member()))
WITH CHECK ((SELECT public.current_user_is_app_member()));

DROP POLICY IF EXISTS tarefa_movimentacoes_worker ON public.tarefa_movimentacoes;
CREATE POLICY tarefa_movimentacoes_worker
ON public.tarefa_movimentacoes
FOR ALL
TO radar_worker
USING (true)
WITH CHECK (true);
