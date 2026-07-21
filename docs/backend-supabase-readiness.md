# Backend + Supabase readiness

Projeto Supabase vinculado: `rforddrnuwtaefxojfte`.

## Auth para o frontend

O frontend deve autenticar com Supabase Auth e enviar o access token para a API:

```http
Authorization: Bearer <supabase_access_token>
```

Quando `SUPABASE_JWT_SECRET` estiver configurado, a API valida assinatura HS256,
expiracao, `sub` e `role=authenticated` antes de abrir conexao com RLS.

O banco remoto usa `public.app_members` como allowlist. Somente usuarios
autenticados cujo e-mail esteja ativo nessa tabela conseguem passar pelas
policies RLS das tabelas do sistema. Seed inicial:

```text
gacamargo2003@gmail.com
```

## Tabelas principais

- `app_members`
- `parceiros`
- `contratos`
- `parcelas`
- `lancamentos`
- `custos_fixos`
- `parametros`
- `configuracoes`
- `processos`
- `execucoes_radar`
- `resultados_consulta`
- `movimentacoes_novas`
- `tarefas`
- `auditoria`
- `import_log`

## Indicadores

- `ind_fluxo_mensal`
- `ind_dre_mensal`
- `ind_balanco`
- `ind_gastos_categoria`
- `ind_analise_mensal`
- `ind_painel`

## Endpoints backend prontos

- `GET /health`
- CRUD: `/parceiros`, `/contratos`, `/lancamentos`, `/custos-fixos`, `/tarefas`, `/processos`
- Parcelas: `/parcelas`, `/contratos/{contrato_id}/parcelas`, confirmar/estornar parcela
- Custos fixos: `/custos-fixos/{custo_id}/lancar`
- Radar/tarefas: `/movimentacoes/{movimentacao_id}/criar-tarefa`, `/processos/{processo_id}/senha`
- Indicadores: `/painel`, `/fluxo-caixa`, `/dre`, `/balanco`, `/analises/mes`

## Variaveis de ambiente essenciais

Backend:

- `AWS_REGION`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `RADAR_DB_URL`
- `VAULT_PROVIDER`

Frontend futuro:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`

Credenciais administrativas como `SUPABASE_SERVICE_ROLE_KEY`,
`MIGRATION_DATABASE_URL` e senhas de banco nunca devem ir para o frontend.

## Migrations

A fonte oficial de schema e policies e `supabase/migrations/`.
O runner local `python -m app.db.migrate` tambem le essa pasta. Quando usado
contra o Postgres Docker local, ele cria somente objetos de compatibilidade do
ambiente Supabase (`auth.jwt`, roles locais e schemas auxiliares) antes de
aplicar as migrations de produto.

As funcoes de recalculo financeiro ficam no schema `private` para evitar RPC
publico via Data API. A API FastAPI chama essas funcoes pelo banco usando o JWT
do usuario e mantendo RLS ativo.
