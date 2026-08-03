# Sistema Integrado Pavageau

Monorepo do Sistema Integrado Pavageau, com frontend React/Vite, backend FastAPI,
migrations Supabase e executor local transportável do Radar Processual.

## Estrutura

```text
.
├── frontend/              # React/Vite, testes Vitest/Playwright e build Netlify
├── backend/               # FastAPI, domínio, loader, Radar API e worker local
│   ├── app/               # aplicação FastAPI e regras de negócio
│   ├── radar/             # scraper TJSP versionado/protegido
│   ├── radar_worker/      # executor local do Radar
│   └── requirements*.txt
├── supabase/              # config.toml e migrations oficiais
├── scripts/               # validações, importações e automações operacionais
├── docs/                  # documentação e evidências
├── tests/                 # testes backend, banco, scraper e contratos
├── docker-compose.yml     # stack local
├── netlify.toml           # deploy do frontend no Netlify
└── .env.example           # nomes de variáveis, sem segredos reais
```

## Ambientes

Desenvolvimento local:

```text
frontend local -> backend local -> Supabase pvgsystem-dev
```

Produção:

```text
frontend Netlify -> proxy HTTPS /api -> backend Oracle -> Supabase PROD
```

No Netlify, o frontend deve usar `VITE_API_URL=/api`. O arquivo `netlify.toml`
faz proxy de `/api/*` para a API pública da Oracle, evitando chamadas HTTP
diretas pelo navegador.

Projetos Supabase esperados:

- PROD: `pvgsystem` (`rforddrnuwtaefxojfte`)
- DEV: `pvgsystem-dev` (`ddhdwgcjpqgvybmqbjmv`)

O backend valida `APP_ENV` na inicialização. Em `development`, ele recusa URLs do
projeto PROD; em `production`, ele recusa URLs do projeto DEV. Se a variável
estiver ausente, a aplicação falha de forma explícita em vez de escolher outro
ambiente automaticamente.

## Variáveis

Arquivos seguros para versionar:

- `.env.example`
- `backend/.env.example`
- `frontend/.env.example`
- `frontend/.env.development`
- `frontend/.env.production.example`

Arquivos reais como `.env`, `.env.local`, `.env.production` e tokens nunca devem
ser enviados ao Git.

## Rodar Localmente

Backend:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r backend/requirements.txt
cp .env.example .env
# Preencha as credenciais do pvgsystem-dev no .env.
PYTHONPATH=backend .venv/bin/uvicorn app.api.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Stack completa com Docker:

```bash
docker compose up --build
```

URLs locais:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8000/health`
- Backend docs: `http://localhost:8000/docs`

## Banco de Dados

A fonte oficial de migrations é:

```text
supabase/migrations/
```

Aplicar migrations:

```bash
PYTHONPATH=backend MIGRATION_DATABASE_URL="$MIGRATION_DATABASE_URL" .venv/bin/python -m app.db.migrate
```

## Radar Processual

O backend hospedado na Oracle expõe os endpoints do Radar. O scraper TJSP pesado
continua separado e transportável em `backend/radar_worker/`, para execução local
ou futura migração para servidor apropriado.

Execução local do worker:

```bash
PYTHONPATH=backend HEADLESS=false RADAR_API_URL=https://<api-producao> .venv/bin/python -m radar_worker --sem-email
```

Para publicar o mesmo resultado também no ambiente DEV sem consultar o tribunal
duas vezes, configure adicionalmente:

- `RADAR_SECONDARY_API_URL`
- `RADAR_SECONDARY_API_ACCESS_TOKEN` ou `RADAR_SECONDARY_SUPABASE_URL` +
  `RADAR_SECONDARY_SUPABASE_ANON_KEY` + `RADAR_SECONDARY_API_EMAIL` +
  `RADAR_SECONDARY_API_PASSWORD`

Falha no alvo secundário não desfaz a gravação no PROD. O retorno do worker
inclui o resumo `replicacao` quando um alvo secundário está configurado.

## Testes

Backend e banco:

```bash
PYTHONPATH=backend .venv/bin/ruff check backend/app backend/radar_worker tests
PYTHONPATH=backend .venv/bin/mypy backend/app
PYTHONPATH=backend DATABASE_URL="$DATABASE_URL" .venv/bin/pytest -q
```

Frontend:

```bash
cd frontend
npm test -- --run
npm run build
```

Scan de segredos:

```bash
python3 scripts/scan_secrets.py
```

## Netlify

Configuração do frontend:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Production branch: `main`

Variáveis de produção:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_API_URL=/api`

O deploy automático deve ser conectado ao GitHub na branch `main`.
