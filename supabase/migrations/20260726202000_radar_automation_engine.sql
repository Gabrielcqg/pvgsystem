-- Radar automation engine: deterministic movement classification, auditable
-- suggestions and task creation. Initial legal-sensitive rules require human
-- approval and next-task chaining remains disabled.

CREATE TABLE IF NOT EXISTS public.radar_movimentacao_tipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_movimentacao_tipos_slug_ck CHECK (slug ~ '^[a-z0-9_]+$')
);

DROP TRIGGER IF EXISTS set_atualizado_em_radar_movimentacao_tipos ON public.radar_movimentacao_tipos;
CREATE TRIGGER set_atualizado_em_radar_movimentacao_tipos
BEFORE UPDATE ON public.radar_movimentacao_tipos
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TABLE IF NOT EXISTS public.radar_automacao_regras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  nome text NOT NULL,
  descricao text,
  tipo_id uuid REFERENCES public.radar_movimentacao_tipos(id) ON DELETE RESTRICT,
  tribunal public.tribunal_sigla,
  area_juridica text,
  fase_processual text,
  titulo_template text NOT NULL,
  descricao_template text NOT NULL,
  prioridade text NOT NULL DEFAULT 'alta',
  prazo_dias integer,
  responsavel text,
  responsavel_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requer_aprovacao boolean NOT NULL DEFAULT true,
  cria_tarefa boolean NOT NULL DEFAULT true,
  proxima_regra_id uuid REFERENCES public.radar_automacao_regras(id) ON DELETE SET NULL,
  versao integer NOT NULL DEFAULT 1,
  ativa boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_automacao_regras_slug_versao_uq UNIQUE (slug, versao),
  CONSTRAINT radar_automacao_regras_slug_ck CHECK (slug ~ '^[a-z0-9_]+$'),
  CONSTRAINT radar_automacao_regras_prioridade_ck CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  CONSTRAINT radar_automacao_regras_prazo_ck CHECK (prazo_dias IS NULL OR prazo_dias >= 0),
  CONSTRAINT radar_automacao_regras_versao_ck CHECK (versao > 0)
);

DROP TRIGGER IF EXISTS set_atualizado_em_radar_automacao_regras ON public.radar_automacao_regras;
CREATE TRIGGER set_atualizado_em_radar_automacao_regras
BEFORE UPDATE ON public.radar_automacao_regras
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE TABLE IF NOT EXISTS public.radar_automacao_padroes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  regra_id uuid NOT NULL REFERENCES public.radar_automacao_regras(id) ON DELETE CASCADE,
  campo text NOT NULL,
  operador text NOT NULL,
  valor text NOT NULL,
  peso integer NOT NULL DEFAULT 1,
  obrigatorio boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_automacao_padroes_campo_ck CHECK (campo IN ('descricao', 'evento', 'usuario')),
  CONSTRAINT radar_automacao_padroes_operador_ck CHECK (operador IN ('contains', 'all_terms', 'any_terms', 'regex')),
  CONSTRAINT radar_automacao_padroes_peso_ck CHECK (peso > 0)
);

CREATE INDEX IF NOT EXISTS idx_radar_automacao_padroes_regra
  ON public.radar_automacao_padroes (regra_id, ativo, ordem);

ALTER TABLE public.movimentacoes_novas
  ADD COLUMN IF NOT EXISTS evento text,
  ADD COLUMN IF NOT EXISTS usuario text,
  ADD COLUMN IF NOT EXISTS texto_normalizado text;

UPDATE public.movimentacoes_novas
SET texto_normalizado = lower(regexp_replace(concat_ws(' ', descricao, evento, usuario), '\s+', ' ', 'g'))
WHERE texto_normalizado IS NULL;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_novas_texto_normalizado
  ON public.movimentacoes_novas (processo_id, criado_em DESC)
  WHERE texto_normalizado IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimentacoes_novas_data_hora
  ON public.movimentacoes_novas (data_hora DESC);

CREATE TABLE IF NOT EXISTS public.radar_movimentacao_classificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id uuid NOT NULL REFERENCES public.movimentacoes_novas(id) ON DELETE CASCADE,
  tipo_id uuid REFERENCES public.radar_movimentacao_tipos(id) ON DELETE SET NULL,
  regra_id uuid REFERENCES public.radar_automacao_regras(id) ON DELETE SET NULL,
  status text NOT NULL,
  metodo text NOT NULL DEFAULT 'regras_deterministicas',
  pontuacao numeric(8,3),
  regras_candidatas jsonb NOT NULL DEFAULT '[]'::jsonb,
  detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_movimentacao_classificacoes_mov_uq UNIQUE (movimentacao_id),
  CONSTRAINT radar_movimentacao_classificacoes_status_ck CHECK (status IN ('reconhecida', 'nao_reconhecida', 'ambigua', 'erro'))
);

CREATE INDEX IF NOT EXISTS idx_radar_mov_classificacoes_status
  ON public.radar_movimentacao_classificacoes (status, criado_em DESC);

CREATE TABLE IF NOT EXISTS public.radar_automacao_execucoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movimentacao_id uuid NOT NULL REFERENCES public.movimentacoes_novas(id) ON DELETE CASCADE,
  processo_id uuid NOT NULL REFERENCES public.processos(id) ON DELETE CASCADE,
  regra_id uuid NOT NULL REFERENCES public.radar_automacao_regras(id) ON DELETE RESTRICT,
  versao integer NOT NULL,
  dedup_chave text NOT NULL UNIQUE,
  status text NOT NULL,
  tarefa_id uuid UNIQUE REFERENCES public.tarefas(id) ON DELETE SET NULL,
  tarefa_anterior_id uuid REFERENCES public.tarefas(id) ON DELETE SET NULL,
  payload_tarefa_sugerida jsonb NOT NULL DEFAULT '{}'::jsonb,
  motivo text,
  aprovado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  aprovado_em timestamptz,
  ignorado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ignorado_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT radar_automacao_execucoes_mov_regra_versao_uq UNIQUE (movimentacao_id, regra_id, versao),
  CONSTRAINT radar_automacao_execucoes_status_ck CHECK (status IN ('aguardando_aprovacao', 'tarefa_criada', 'ignorada', 'sem_tarefa', 'erro')),
  CONSTRAINT radar_automacao_execucoes_versao_ck CHECK (versao > 0),
  CONSTRAINT radar_automacao_execucoes_aprovacao_ck CHECK (
    (status <> 'tarefa_criada') OR (tarefa_id IS NOT NULL)
  ),
  CONSTRAINT radar_automacao_execucoes_ignorada_ck CHECK (
    (status <> 'ignorada') OR (ignorado_em IS NOT NULL AND nullif(trim(coalesce(motivo, '')), '') IS NOT NULL)
  )
);

DROP TRIGGER IF EXISTS set_atualizado_em_radar_automacao_execucoes ON public.radar_automacao_execucoes;
CREATE TRIGGER set_atualizado_em_radar_automacao_execucoes
BEFORE UPDATE ON public.radar_automacao_execucoes
FOR EACH ROW EXECUTE FUNCTION public.set_atualizado_em();

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_status
  ON public.radar_automacao_execucoes (status, criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_radar_automacao_execucoes_processo
  ON public.radar_automacao_execucoes (processo_id, criado_em DESC);

ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS radar_automacao_execucao_id uuid REFERENCES public.radar_automacao_execucoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS radar_regra_id uuid REFERENCES public.radar_automacao_regras(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tarefa_origem_id uuid REFERENCES public.tarefas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS criada_automaticamente boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS ux_tarefas_radar_automacao_execucao
  ON public.tarefas (radar_automacao_execucao_id)
  WHERE radar_automacao_execucao_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_radar_regra
  ON public.tarefas (radar_regra_id)
  WHERE radar_regra_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tarefas_tarefa_origem
  ON public.tarefas (tarefa_origem_id)
  WHERE tarefa_origem_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tarefas_radar_auto_links_ck'
      AND conrelid = 'public.tarefas'::regclass
  ) THEN
    ALTER TABLE public.tarefas
      ADD CONSTRAINT tarefas_radar_auto_links_ck CHECK (
        NOT (origem = 'radar_movimentacao'::public.tarefa_origem AND criada_automaticamente)
        OR (
          processo_id IS NOT NULL
          AND movimentacao_id IS NOT NULL
          AND radar_automacao_execucao_id IS NOT NULL
        )
      );
  END IF;
END $$;

INSERT INTO public.configuracoes (chave, valor, descricao)
VALUES ('radar_encadeamento_tarefas_ativo', 'false', 'Feature flag para encadeamento automático de tarefas do Radar Processual. Mantido desligado até validação jurídica.')
ON CONFLICT (chave) DO NOTHING;

WITH tipos AS (
  INSERT INTO public.radar_movimentacao_tipos (slug, nome, descricao)
  VALUES
    ('contestacao_juntada', 'Contestação juntada', 'Classificação técnica para movimentações que aparentam registrar juntada de contestação. Requer validação humana.'),
    ('sentenca_publicada', 'Sentença publicada', 'Classificação técnica para movimentações que aparentam publicar sentença. Requer validação humana.'),
    ('intimacao', 'Intimação', 'Classificação técnica para movimentações que aparentam intimação. Requer validação humana.'),
    ('processo_concluso', 'Processo concluso', 'Classificação técnica para movimentações que aparentam conclusão. Não cria tarefa nesta versão.')
  ON CONFLICT (slug) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    ativo = true
  RETURNING id, slug
),
regras AS (
  INSERT INTO public.radar_automacao_regras (
    slug, nome, descricao, tipo_id, tribunal, titulo_template, descricao_template,
    prioridade, prazo_dias, requer_aprovacao, cria_tarefa, versao, ativa
  )
  VALUES
    (
      'contestacao_juntada',
      'Contestação juntada - sugestão de análise',
      'Regra técnica inicial para validação do motor. Não representa orientação jurídica automática.',
      (SELECT id FROM public.radar_movimentacao_tipos WHERE slug = 'contestacao_juntada'),
      NULL,
      'Analisar contestação e avaliar necessidade de réplica',
      'O Radar Processual identificou movimentação compatível com contestação juntada no processo {{numero_processo}}. Revise a movimentação e avalie a providência adequada.',
      'alta',
      NULL,
      true,
      true,
      1,
      true
    ),
    (
      'sentenca_publicada',
      'Sentença publicada - sugestão de análise',
      'Regra técnica inicial para validação do motor. Não representa orientação jurídica automática.',
      (SELECT id FROM public.radar_movimentacao_tipos WHERE slug = 'sentenca_publicada'),
      NULL,
      'Analisar sentença e avaliar estratégia processual',
      'O Radar Processual identificou movimentação compatível com sentença publicada no processo {{numero_processo}}. Revise a movimentação e avalie a estratégia adequada.',
      'urgente',
      NULL,
      true,
      true,
      1,
      true
    ),
    (
      'intimacao',
      'Intimação - sugestão de análise',
      'Regra técnica inicial para validação do motor. Não representa orientação jurídica automática.',
      (SELECT id FROM public.radar_movimentacao_tipos WHERE slug = 'intimacao'),
      NULL,
      'Analisar intimação e verificar eventual prazo',
      'O Radar Processual identificou movimentação compatível com intimação no processo {{numero_processo}}. Verifique se há prazo ou providência necessária.',
      'alta',
      NULL,
      true,
      true,
      1,
      true
    ),
    (
      'processo_concluso',
      'Processo concluso - apenas classificar',
      'Regra técnica inicial apenas para classificação. Não cria sugestão nem tarefa nesta versão.',
      (SELECT id FROM public.radar_movimentacao_tipos WHERE slug = 'processo_concluso'),
      NULL,
      'Processo concluso para análise futura',
      'O Radar Processual identificou movimentação compatível com processo concluso no processo {{numero_processo}}.',
      'normal',
      NULL,
      true,
      false,
      1,
      true
    )
  ON CONFLICT (slug, versao) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    tipo_id = EXCLUDED.tipo_id,
    titulo_template = EXCLUDED.titulo_template,
    descricao_template = EXCLUDED.descricao_template,
    prioridade = EXCLUDED.prioridade,
    requer_aprovacao = EXCLUDED.requer_aprovacao,
    cria_tarefa = EXCLUDED.cria_tarefa,
    ativa = EXCLUDED.ativa
  RETURNING id, slug
)
DELETE FROM public.radar_automacao_padroes
WHERE regra_id IN (SELECT id FROM regras);

INSERT INTO public.radar_automacao_padroes (regra_id, campo, operador, valor, peso, obrigatorio, ordem)
SELECT r.id, p.campo, p.operador, p.valor, p.peso, p.obrigatorio, p.ordem
FROM public.radar_automacao_regras r
JOIN (
  VALUES
    ('contestacao_juntada', 'descricao', 'any_terms', 'contestacao contestação', 2, true, 1),
    ('contestacao_juntada', 'descricao', 'contains', 'juntad', 2, false, 2),
    ('sentenca_publicada', 'descricao', 'any_terms', 'sentenca sentença', 2, true, 1),
    ('sentenca_publicada', 'descricao', 'any_terms', 'publicada proferida disponibilizada', 1, false, 2),
    ('intimacao', 'descricao', 'contains', 'intimacao', 2, true, 1),
    ('processo_concluso', 'descricao', 'all_terms', 'conclus concluso', 2, true, 1)
) AS p(slug, campo, operador, valor, peso, obrigatorio, ordem)
  ON p.slug = r.slug
WHERE r.versao = 1;

ALTER TABLE public.radar_movimentacao_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_automacao_regras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_automacao_padroes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_movimentacao_classificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radar_automacao_execucoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS radar_movimentacao_tipos_app_members ON public.radar_movimentacao_tipos;
CREATE POLICY radar_movimentacao_tipos_app_members
ON public.radar_movimentacao_tipos
FOR SELECT
TO authenticated
USING (public.current_user_is_app_member());

DROP POLICY IF EXISTS radar_automacao_regras_app_members ON public.radar_automacao_regras;
CREATE POLICY radar_automacao_regras_app_members
ON public.radar_automacao_regras
FOR SELECT
TO authenticated
USING (public.current_user_is_app_member());

DROP POLICY IF EXISTS radar_automacao_padroes_app_members ON public.radar_automacao_padroes;
CREATE POLICY radar_automacao_padroes_app_members
ON public.radar_automacao_padroes
FOR SELECT
TO authenticated
USING (public.current_user_is_app_member());

DROP POLICY IF EXISTS radar_movimentacao_classificacoes_app_members ON public.radar_movimentacao_classificacoes;
CREATE POLICY radar_movimentacao_classificacoes_app_members
ON public.radar_movimentacao_classificacoes
FOR ALL
TO authenticated
USING (public.current_user_is_app_member())
WITH CHECK (public.current_user_is_app_member());

DROP POLICY IF EXISTS radar_automacao_execucoes_app_members ON public.radar_automacao_execucoes;
CREATE POLICY radar_automacao_execucoes_app_members
ON public.radar_automacao_execucoes
FOR ALL
TO authenticated
USING (public.current_user_is_app_member())
WITH CHECK (public.current_user_is_app_member());

DROP POLICY IF EXISTS radar_movimentacao_tipos_worker ON public.radar_movimentacao_tipos;
CREATE POLICY radar_movimentacao_tipos_worker
ON public.radar_movimentacao_tipos
FOR SELECT
TO radar_worker
USING (true);

DROP POLICY IF EXISTS radar_automacao_regras_worker ON public.radar_automacao_regras;
CREATE POLICY radar_automacao_regras_worker
ON public.radar_automacao_regras
FOR SELECT
TO radar_worker
USING (true);

DROP POLICY IF EXISTS radar_automacao_padroes_worker ON public.radar_automacao_padroes;
CREATE POLICY radar_automacao_padroes_worker
ON public.radar_automacao_padroes
FOR SELECT
TO radar_worker
USING (true);

DROP POLICY IF EXISTS radar_movimentacao_classificacoes_worker ON public.radar_movimentacao_classificacoes;
CREATE POLICY radar_movimentacao_classificacoes_worker
ON public.radar_movimentacao_classificacoes
FOR ALL
TO radar_worker
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS radar_automacao_execucoes_worker ON public.radar_automacao_execucoes;
CREATE POLICY radar_automacao_execucoes_worker
ON public.radar_automacao_execucoes
FOR ALL
TO radar_worker
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.radar_movimentacao_tipos TO authenticated, radar_worker;
GRANT SELECT ON public.radar_automacao_regras TO authenticated, radar_worker;
GRANT SELECT ON public.radar_automacao_padroes TO authenticated, radar_worker;
GRANT SELECT, INSERT, UPDATE ON public.radar_movimentacao_classificacoes TO authenticated, radar_worker;
GRANT SELECT, INSERT, UPDATE ON public.radar_automacao_execucoes TO authenticated, radar_worker;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, radar_worker;
