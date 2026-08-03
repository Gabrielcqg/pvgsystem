# Relatório de Teste de Sistema — Pavageau

**Data:** 2026-07-30  
**Ambiente validado:** frontend Playwright + FastAPI local de teste (`127.0.0.1:8010`) usando Supabase configurado no `.env`.  
**Nota:** valores de credenciais não foram impressos. O teste com banco limpo remoto permanece protegido por `clean_db`.

## Baseline Corrigido
| Suíte / comando | Resultado |
|---|---:|
| `python3 -m py_compile app/domain/db_service.py tests/api/test_api_contract.py tests/domain/test_db_service_error_mapping.py` | PASS |
| `.venv/bin/ruff check backend/app/domain/db_service.py tests/api/test_api_contract.py tests/domain/test_db_service_error_mapping.py` | PASS |
| `.venv/bin/pytest tests/domain/test_db_service_error_mapping.py -q` | PASS — 2 passed |
| `cd frontend && npm test -- --run` | PASS — 10 passed |
| `cd frontend && npm run build` | PASS |
| `cd frontend && VITE_API_URL=http://127.0.0.1:8010 npm run test:e2e -- smoke-console-sweep.spec.js a11y-sweep.spec.js` | PASS — 2 passed |
| `cd frontend && VITE_API_URL=http://127.0.0.1:8010 npm run test:e2e -- tasks-kanban.spec.js` | PASS — 1 passed |
| `cd frontend && VITE_API_URL=http://127.0.0.1:8010 npm run test:e2e -- full-system-validation.spec.js` | PASS — 1 passed |

## Cobertura Validada
- **Navegação autenticada:** 14 telas varridas no smoke.
- **Modais:** Contratos, Custos fixos, Tarefas e Radar abrem e fecham por Escape.
- **Acessibilidade:** 14 telas com `axe-core`; resultado final: **0 violações sérias/críticas**.
- **Tarefas Kanban:** criação, movimento otimista, foco de coluna, conclusão/reabertura, arquivamento/restauração e persistência.
- **Fluxo abrangente:** contrato, parcela, lançamento, custo fixo, tarefa, processo/Radar, parâmetros, auditoria e evidências E2E passaram no spec completo.
- **Backend robustness:** mapeamento de `psycopg.DataError` para erro de validação coberto em `create` e `patch`.

## Invariantes Confirmadas
- Nenhum erro de console, pageerror, botão faltante ou HTTP 4xx/5xx inesperado nos sweeps executados.
- Nenhum texto visível suspeito (`null`, `undefined`, `NaN`, `Invalid Date`) foi encontrado no smoke.
- A tela Tarefas não apresenta mais violações críticas de formulário sem label.
- O E2E principal não depende mais de seletores por substring ambígua.
- O build de produção do frontend compila após as alterações.

## Bugs Corrigidos
| ID | Severidade | Área | Correção |
|---|---|---|---|
| BUG-004 | Alto | Backend API | `psycopg.DataError` agora vira 422/`ValidationError`, não 500. |
| BUG-003 | Médio | Tarefas / a11y | Controles de formulário receberam nomes acessíveis; axe zerado. |
| BUG-001 | Médio | E2E / Tarefas | Campo e specs usam “TÍTULO DA TAREFA” com seletor exato. |
| BUG-002 | Médio | Modais | `Shell` virou diálogo acessível com Escape, foco inicial e trap básico. |
| BUG-005 | Baixo | E2E abrangente | Seletores de checkbox de tarefa e labels atuais de processo corrigidos. |

## Testes Bloqueados ou Não Executados
- `tests/api/test_api_contract.py::test_invalid_enum_and_date_payloads_return_422_not_500` com `clean_db` foi **skipado** contra Supabase remoto: a fixture bloqueia limpeza destrutiva sem `ALLOW_REMOTE_CLEAN_DB=1`. Não forcei essa variável para não limpar dados remotos. A cobertura sem banco foi adicionada em `tests/domain/test_db_service_error_mapping.py`.

## Artefatos Permanentes no Repo
- `frontend/tests/e2e/smoke-console-sweep.spec.js` — sweep de console/UI em 14 telas e 4 modais.
- `frontend/tests/e2e/a11y-sweep.spec.js` — sweep axe em 14 telas.
- `tests/domain/test_db_service_error_mapping.py` — regressão unitária para 500→422 em erro de enum/data.
- `docs/qa/BUGS.md` — catálogo priorizado atualizado.

## Pendências Reais
- Não há bug crítico/alto/médio aberto vindo desta campanha.
- Opcional futuro: criar uma configuração Playwright separada para validar diretamente contra a API Oracle sem `webServer` local. Hoje, para rodar localmente, use `VITE_API_URL=http://127.0.0.1:8010`.
