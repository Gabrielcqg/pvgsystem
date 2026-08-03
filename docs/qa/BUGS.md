# Catálogo de Bugs — Campanha de Teste de Sistema (Pavageau)

**Atualizado em:** 2026-07-30  
**Ambiente:** frontend Playwright + FastAPI local de teste apontando para Supabase configurado no `.env`.  
**Regra de dados:** testes E2E usam prefixos `E2E_TEST_` e limpeza própria. Nenhum segredo, senha ou token foi registrado.

## Legenda de Severidade
- **Crítico** — perda/corrupção de dados, falha de segurança/autorização, tela principal quebrada, valor derivado editável.
- **Alto** — ação importante quebrada, HTTP 5xx evitável, fluxo central inconsistente.
- **Médio** — comportamento incorreto sem perda de dados, validação ausente, teste principal vermelho, a11y séria.
- **Baixo** — cosmético, texto, alinhamento, mensagem pouco clara, drift de teste sem impacto direto no usuário.

## Bugs Encontrados e Status

### BUG-004 · [Alto] · Backend create/patch · robustez / contrato de API · **CORRIGIDO**
- **Repro:** enviar enum inválido ou data malformada a endpoints genéricos de escrita. Exemplos: `POST /contratos {status:"zzz"}`, `POST /lancamentos {data:"nao-e-data"}`, `POST /processos {tribunal:"XYZ"}`.
- **Esperado:** HTTP 422 com erro de validação.
- **Obtido antes:** HTTP 500 por exceção Postgres não tratada.
- **Causa:** `PostgresService.create` e `PostgresService.patch` não capturavam `psycopg.DataError`, incluindo `InvalidTextRepresentation` e formatos inválidos de data.
- **Correção aplicada:** `app/domain/db_service.py` agora converte `psycopg.DataError` em `ValidationError`, preservando o contrato 422.
- **Teste:** `tests/domain/test_db_service_error_mapping.py` cobre `create` e `patch` sem depender de banco limpo.
- **Sugestão restante:** manter o teste de integração com banco limpo quando houver ambiente local destrutível; contra Supabase remoto ele fica bloqueado por segurança.

### BUG-003 · [Médio] · Tela Tarefas · acessibilidade axe critical · **CORRIGIDO**
- **Repro:** `a11y-sweep.spec.js` na tela Tarefas.
- **Obtido antes:** regra `label` em 25 controles e `select-name` em 4 selects.
- **Esperado:** todos os controles de formulário com nome acessível.
- **Correção aplicada:** filtros, busca, ação em massa, checkboxes de tarefa/subtarefa e inputs de checklist/subtarefa/comentário receberam nomes acessíveis. O helper `F` também associa `label htmlFor` ao controle clonado.
- **Evidência:** `a11y-sweep.spec.js` executado em 14 telas com **0 violações sérias/críticas**.

### BUG-001 · [Médio] · E2E / Tarefas · seletor ambíguo por `getByLabel("TAREFA")` · **CORRIGIDO**
- **Repro anterior:** `full-system-validation.spec.js` falhava ao preencher nova tarefa porque `getByLabel("TAREFA")` casava o input e os botões de filtro.
- **Esperado:** o teste selecionar apenas o campo de título da tarefa.
- **Correção aplicada:** o campo foi renomeado para **TÍTULO DA TAREFA** e os specs usam `getByRole("textbox", { name: "TÍTULO DA TAREFA", exact: true })`.
- **Evidência:** `full-system-validation.spec.js` passou após a correção.

### BUG-002 · [Médio] · Modais · acessibilidade / usabilidade · **CORRIGIDO**
- **Repro anterior:** abrir modal e pressionar Escape.
- **Obtido antes:** Escape não fechava; o modal comum `Shell` não declarava `role="dialog"` nem `aria-modal`.
- **Esperado:** Escape fecha o modal, leitores de tela recebem semântica de diálogo e o foco permanece dentro do modal.
- **Correção aplicada:** `Shell` agora usa `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, foco inicial, restauração de foco e trap básico de Tab. O smoke permanente abre modais e fecha por Escape.
- **Evidência:** `smoke-console-sweep.spec.js` passou com 0 issues.

### BUG-005 · [Baixo] · E2E abrangente · drift de seletores após evolução da UI · **CORRIGIDO**
- **Repro encontrado durante a correção:** depois do BUG-001, o E2E abrangente ainda falhou em dois pontos:
  - checkbox de tarefa ambíguo entre “Concluir tarefa” e “Selecionar tarefa”;
  - labels antigos de processo: “Nº DO PROCESSO”, “CLIENTE” e “COMARCA / VARA”, enquanto a UI atual usa “PROCESSO (Nº CNJ)”, “CLIENTE / VÍNCULO” e “VARA / JUÍZO”.
- **Esperado:** specs selecionarem controles pela semântica atual e nomes exatos.
- **Correção aplicada:** `full-system-validation.spec.js` usa checkbox com nome acessível exato e labels atuais do formulário de processo.
- **Impacto no produto:** não havia bug funcional confirmado na UI; era regressão de teste automatizado.

## Achados que Não Corrigi Por Escopo
- **Config Playwright com `VITE_API_URL` remota:** quando o `.env` aponta para a Oracle, o `webServer` do Playwright tenta validar `http://164.152.35.255/health` e falha porque a URL já está em uso. Para testes locais, execute com `VITE_API_URL=http://127.0.0.1:8010`. Não alterei a config porque isso muda a estratégia de execução local vs. remota e não é bug de produto.

## Resultado Atual
- **Crítico aberto:** 0.
- **Alto aberto:** 0.
- **Médio aberto:** 0.
- **Baixo aberto:** 0.
- **Novo bug de produto encontrado nesta rodada:** nenhum.
- **Novo bug de teste encontrado nesta rodada:** BUG-005, corrigido.
