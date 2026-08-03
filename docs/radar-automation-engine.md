# Radar Processual - Motor de Automacao

## Fluxo implementado

1. O executor externo do Radar salva a movimentacao nova em `movimentacoes_novas`.
2. O sistema normaliza `descricao`, `evento` e `usuario` em `texto_normalizado`.
3. O classificador deterministico avalia regras ativas em `radar_automacao_regras` e seus padroes em `radar_automacao_padroes`.
4. A classificacao auditavel e gravada em `radar_movimentacao_classificacoes`.
5. Quando uma regra unica e reconhecida:
   - se `cria_tarefa = false`, a execucao fica como `sem_tarefa`;
   - se `requer_aprovacao = true`, a execucao fica como `aguardando_aprovacao`;
   - se `requer_aprovacao = false`, a tarefa e criada transacionalmente.
6. A deduplicacao usa `radar_auto:{movimentacao_id}:{regra_id}:{versao}` e tambem uma constraint unica por `movimentacao_id`, `regra_id` e `versao`.

## Regras iniciais

As regras iniciais existem apenas para validar tecnicamente o motor e nao representam orientacao juridica automatica:

- `contestacao_juntada`: sugere analisar contestacao e avaliar replica.
- `sentenca_publicada`: sugere analisar sentenca e avaliar estrategia.
- `intimacao`: sugere analisar intimacao e verificar eventual prazo.
- `processo_concluso`: apenas classifica, sem criar tarefa.

Todas as regras que podem gerar tarefa estao com `requer_aprovacao = true`.

## Encadeamento

O encadeamento esta implementado e controlado por `radar_encadeamento_tarefas_ativo`.

Quando uma tarefa criada pelo Radar e concluida, o backend verifica:

- se a tarefa nasceu de `radar_movimentacao`;
- se possui `processo_id`, `movimentacao_id`, `radar_regra_id` e `radar_automacao_execucao_id`;
- se a regra anterior possui `proxima_regra_id`;
- se a proxima regra esta ativa;
- se a configuracao `radar_encadeamento_tarefas_ativo` esta ativa.

Se todas as condicoes forem atendidas, o sistema cria uma nova execucao auditavel em `radar_automacao_execucoes` com `gatilho = tarefa_concluida` e `tarefa_anterior_id` preenchido.

- Regras com `requer_aprovacao = true` geram sugestao em `aguardando_aprovacao`.
- Regras com `requer_aprovacao = false` criam a proxima tarefa automaticamente.
- Regras com `cria_tarefa = false` geram registro `sem_tarefa`.

A deduplicacao do encadeamento usa `radar_next:{tarefa_id}:{regra_id}:{versao}` e constraints por regra/versao para impedir duplicidade em reaberturas e novas conclusoes.

O recurso nao define sequencias juridicas por conta propria. Uma cadeia real so existe depois que os advogados validarem e configurarem `proxima_regra_id`, prazos e necessidade de aprovacao.

Antes de ativar cadeias juridicas sensiveis, ainda devem ser validados:

- validacao juridica das regras;
- aprovacao dos prazos;
- testes de fluxo completo;
- definicao de quando uma tarefa concluida pode gerar a proxima etapa automaticamente ou apenas sugerida.

## Decisoes pendentes dos advogados

- Quais textos de movimentacao realmente exigem providencia.
- Qual tarefa padrao deve nascer para cada tipo de movimentacao.
- Qual prazo sugerido deve ser aplicado por regra.
- Quais regras podem criar tarefa automaticamente.
- Quais regras devem permanecer sempre sob aprovacao humana.
- Como tratar movimentacoes ambiguas ou com mais de uma providencia possivel.

## Registro legado

Existe uma tarefa antiga com `origem = radar_movimentacao` sem `processo_id` e sem `movimentacao_id`.

Ela nao foi corrigida automaticamente porque nao foi encontrada correspondencia exata e segura em `movimentacoes_novas`.
