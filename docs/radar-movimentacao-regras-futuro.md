# Radar Processual - motor futuro de regras de movimentacao

Este documento registra o plano tecnico para uma etapa futura. A implementacao
atual cobre apenas inercia processual e tarefas automaticas no backlog.

## Escopo futuro

O motor deve transformar movimentacoes processuais classificadas em tarefas
sugeridas, sem substituir a revisao humana.

Fluxo previsto:

```text
tipo de movimentacao
-> regra identificada
-> tarefa sugerida
-> prazo sugerido
-> proxima tarefa opcional
```

## Estrutura sugerida

- `radar_movimentacao_tipos`: catalogo versionado de tipos detectaveis.
- `radar_movimentacao_regras`: padroes, tribunal aplicavel, fase aplicavel,
  titulo/descricao sugeridos, prioridade e prazo.
- `radar_regra_execucoes`: registro auditavel da regra acionada para uma
  movimentacao especifica.
- `tarefas.regra_acionada_id`: vinculo opcional da tarefa com a regra.
- `tarefas.tarefa_origem_id`: tarefa anterior que originou a nova etapa.
- `tarefas.tarefa_seguinte_id`: proxima tarefa criada ou programada.

## Regras iniciais candidatas

- contestacao juntada -> preparar replica.
- despacho com prazo -> cumprir despacho.
- sentenca publicada -> analisar recurso.
- arquivamento ou paralizacao prolongada -> revisar estrategia processual.

## Requisitos antes de implementar

- Definir os tipos juridicos aceitos pelo escritorio.
- Definir prazos por tipo de movimentacao e tribunal.
- Validar exemplos reais de movimentacoes do TJSP.
- Criar testes de classificacao com fixtures reais.
- Manter a decisao humana para confirmar ou ajustar a tarefa sugerida quando a
  classificacao nao tiver confianca suficiente.
