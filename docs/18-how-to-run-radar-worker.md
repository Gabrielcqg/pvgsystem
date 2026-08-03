# Como rodar o executor externo do Radar

O radar processual roda fora da FastAPI. A API e o frontend gerenciam processos,
senhas e resultados; o navegador pesado fica no comando transportável
`radar_worker`.

Nesta etapa o TJSP deve ser executado localmente no Mac, em navegador visual:

```bash
HEADLESS=false python -m radar_worker --sem-email
```

Quando o backend estiver hospedado na Oracle, configure o executor local para usar
a API remota. Nesse modo o worker nao grava direto no banco: ele autentica no
Supabase Auth, busca os processos pela API, consulta localmente e envia cada
resultado para a API da Oracle:

```bash
RADAR_API_URL=http://164.152.35.255:8000 \
HEADLESS=false \
python -m radar_worker --sem-email
```

## O que o executor faz

1. Se `RADAR_API_URL` estiver definido, conecta na API remota com JWT do
   Supabase Auth. Caso contrario, usa o modo legado direto no banco via
   `RADAR_DB_URL`.
2. Busca `processos` ativos e com `monitorar=true`.
3. Abre uma rodada em `execucoes_radar`.
4. Consulta os processos sequencialmente, usando uma única instância do navegador.
5. Grava cada resultado imediatamente em `resultados_consulta`.
6. Compara as três movimentações atuais com a base salva no processo.
7. Atualiza `processos` e `movimentacoes_novas`.
8. Finaliza a rodada e fecha o navegador.

Uma falha em um processo não cancela os demais. Rodadas simultâneas são bloqueadas
por advisory lock.

## Variáveis necessárias

No `.env` real da máquina que executa o radar:

```env
RADAR_API_URL=http://164.152.35.255:8000
# Autenticacao do worker local na API:
# opcao A: token temporario
RADAR_API_ACCESS_TOKEN=
# opcao B: login Supabase Auth
RADAR_API_EMAIL=
RADAR_API_PASSWORD=
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Modo legado direto no banco, mantido apenas como rollback/testes locais.
RADAR_DB_URL=postgresql://radar_worker:<senha>@.../postgres?sslmode=require
RADAR_PASSWORD_KEY=<32+ caracteres aleatorios>
HEADLESS=false
RADAR_CHROME_USER_DATA_DIR=.drissionpage/tjsp/perfil
RADAR_CHROME_PROFILE_DIRECTORY=Default
```

`RADAR_PASSWORD_KEY` precisa ser a mesma usada pela API ao salvar senhas
processuais. Não coloque o valor real em Git.

## Senhas processuais

O usuário cadastra a senha pelo sistema. O valor é criptografado no schema
`private` do banco e não volta para a tela. Na próxima rodada, o executor lê a
senha pelo banco e tenta preencher o formulário do TJSP quando o processo exigir.

## Frontend

O frontend não inicia o scraper nesta etapa. Ele permite:

- cadastrar, editar, pausar e remover processos;
- cadastrar senha processual;
- visualizar a última tentativa;
- visualizar base inicial, nova movimentação, sem novidade, senha necessária,
  não localizado, não verificado e tribunais aguardando scraper;
- atualizar a leitura dos resultados já gravados.

Mensagem exibida na tela:

```text
As consultas processuais são executadas semanalmente pelo ambiente autorizado.
```

## Comando semanal local

Na raiz do repositório:

```bash
set -a
. ./.env
set +a
RADAR_API_URL=http://164.152.35.255:8000 \
HEADLESS=false python -m radar_worker --sem-email
```

Quando o servidor apropriado existir, basta transportar o pacote `radar_worker`
junto com as dependências Python, o runtime do scraper em `backend/radar/scrapers/vendor`
e as variáveis de ambiente do worker.
