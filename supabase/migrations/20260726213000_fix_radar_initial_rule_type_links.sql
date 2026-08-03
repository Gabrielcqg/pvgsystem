-- Link initial technical Radar automation rules to their movement types.
-- The original seed inserted types and rules in one statement; PostgreSQL's
-- statement snapshot can leave the rule tipo_id null for newly inserted types.

UPDATE public.radar_automacao_regras AS regra
SET tipo_id = tipo.id
FROM public.radar_movimentacao_tipos AS tipo
WHERE regra.slug = tipo.slug
  AND regra.versao = 1
  AND regra.slug IN (
    'contestacao_juntada',
    'sentenca_publicada',
    'intimacao',
    'processo_concluso'
  )
  AND regra.tipo_id IS DISTINCT FROM tipo.id;
