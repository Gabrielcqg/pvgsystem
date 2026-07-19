# 15 — Integration Plan: Radar Multi-Tribunal

Implements **DEC-11** (single run, multiple scrapers, common interface) and **DEC-15** (every
non-TJSP tribunal gets its own purpose-built scraper, written by Gabriel; the plan reserves the
slots).

---

## 1. Governing principle

> The scraper never touches the database. It receives a struct describing one process and returns a
> structured result. Fetching processes, routing, persisting and updating totals is the **service
> layer's** job.

This is stated in the intent document and is non-negotiable. It is what keeps `consulta_tjsp_lote.py`
isolated and testable, and it is what makes Gabriel's future scrapers drop-in.

## 2. The contract every tribunal scraper implements

`radar/scrapers/base.py`

```python
from typing import Protocol, Literal, Sequence
from dataclasses import dataclass
from datetime import datetime

@dataclass(frozen=True)
class ProcessoConsulta:
    """Everything a scraper needs. No DB handle, no ORM object, no session."""
    numero_processo: str          # CNJ, formatted
    tribunal: str                 # "TJSP" | "TJCE" | "TJBA" | ...
    senha: str | None = None      # resolved from the vault by the service layer, never a reference
    chaves_anteriores: tuple[str, ...] = ()   # baseline for comparison

@dataclass(frozen=True)
class Movimentacao:
    data_hora: str | None
    descricao: str
    evento: str | None = None
    usuario: str | None = None
    chave: str = ""               # deterministic; see §5

@dataclass(frozen=True)
class ResultadoConsulta:
    numero_processo: str
    tribunal: str
    status: StatusConsulta
    movimentacoes: Sequence[Movimentacao]     # at most MAX_MOVIMENTACOES (3)
    quantidade_movimentacoes: int
    layout_movimentacoes: str | None = None
    url_resultado: str | None = None
    mensagem_erro: str | None = None          # name matches resultados_consulta.mensagem_erro
    tipo_erro: str | None = None
    etapa: Etapa | None = None                # REQUIRED by FR-32: the error email must carry it
    consultado_em: datetime | None = None
    duracao_segundos: float | None = None

    @property
    def chaves_movimentacoes(self) -> tuple[str, ...]:
        """The new baseline. Consumed by atualizar_baseline() in §6."""
        return tuple(m.chave for m in self.movimentacoes)

    def com_veredito(self, v: Veredito) -> "ResultadoConsulta": ...

# Every scraper must report which step it reached, so a failure is diagnosable from the email
# alone without opening the log.
Etapa = Literal["abrir_aba","aguardar_formulario","preencher","consultar",
                "aguardar_resultado","extrair","submeter_senha"]

StatusConsulta = Literal[
    "sucesso", "nao_localizado", "numero_invalido", "senha_necessaria",
    "captcha_timeout", "pagina_intermediaria", "timeout", "erro",
    "pendente_implementacao",
]

class ScraperTribunal(Protocol):
    tribunal: str
    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta: ...
```

**Rule:** `consultar()` must never raise for an expected condition. Not-found, password-required,
captcha, timeout are all *returned* as statuses. Only genuinely unexpected faults raise, and the
orchestrator catches those per process (`status="erro"`) so one bad process cannot end the run.

## 3. The registry — reserved slots

`radar/scrapers/registry.py`

```python
SCRAPERS: dict[str, ScraperTribunal | None] = {
    "TJSP": TJSPScraper(),   # implemented + validated: 94/106, 282 movimentações
    "TJCE": None,            # RESERVED — 7 processes waiting
    "TJBA": None,            # RESERVED — 5 processes waiting
}

def resolver(tribunal: str) -> ScraperTribunal | None:
    return SCRAPERS.get(tribunal.strip().upper())
```

**Adding a tribunal is exactly two steps and touches nothing else:**

1. Write `radar/scrapers/tjce.py` with a class satisfying `ScraperTribunal`.
2. Replace `"TJCE": None` with `"TJCE": TJCEScraper()`.

Orchestration, persistence, comparison, task generation, scheduling and email are untouched. That
is the whole point of the seam.

**Reserved-slot behavior (required, not optional):** when `resolver()` returns `None`, the
orchestrator records `status="pendente_implementacao"` for that process and **continues the run**.
Those 12 processes appear in the run summary as awaiting implementation — visible, counted, never
silently skipped, and never a run failure.

## 4. TJSP adapter — wrapping the validated core

`consulta_tjsp_lote.py` is vendored **unmodified** (DEC-16) at `radar/scrapers/vendor/consulta_tjsp_lote.py`.
The adapter is a thin translation layer:

| Concern | Today (script) | Adapter provides |
|---|---|---|
| Input | `carregar_processos()` reads `processos.xlsx` | Service layer passes `ProcessoConsulta` objects from the DB |
| Output | `salvar_checkpoint()` writes JSON | Service layer persists `ResultadoConsulta` to Postgres |
| Config | Module-level constants | Injected; module constants stay as defaults |
| Browser | `criar_navegador()` per run | Orchestrator owns lifecycle; adapter reuses the session across processes |

**What the adapter must reuse verbatim — do not reimplement:**

- `JS_ANALISAR_PAGINA` and `analisar_html()` — the extractors (**DEC-17: frozen**)
- `classificar_pagina()` — page-type classification
- `aguardar_formulario()` / `aguardar_resultado()` — the watchdog state machine
- `executar_tentativa()` / `consultar_processo()` — retry + tab lifecycle
- `chave_texto()`, `texto_limpo()`, `somente_digitos()`, `formatar_cnj()` — normalization
- `PortalConfig` / `PORTAL_TJSP` — the portal profile

**What the adapter adds:** `Movimentacao.chave` computation (§5), `ProcessoConsulta`→`item` dict
translation, `dict`→`ResultadoConsulta` translation.

**Explicitly out of scope for the adapter:** any change to navigation, layout detection, extraction
or recovery. A diff touching those in the vendored file fails review (`GATE-SCRAPER-FROZEN`).

### 4.1 The one additive change: password submission (DEC-20)

The core detects `senha_necessaria` (5 real hits) but cannot submit a password. Add **one new
function** in the adapter layer — not an edit to `aguardar_resultado()`:

```python
def submeter_senha(tab, senha: str) -> bool:
    """Fill the access-key field and resubmit. Returns False if no field is found."""
```

It reuses the detector's own selector logic (`input[type=password]`, `name/id/aria-label/placeholder`
containing `senha` / `chave de acesso`). The orchestrator calls it only when `status ==
"senha_necessaria"` **and** a password was resolved from the vault, then re-runs the result wait.

**Security:** the password reaches the scraper as a plain value in `ProcessoConsulta.senha`,
resolved by the service layer at call time from the vault. It is never logged, never persisted in
`resultados_consulta`, never included in the error email, and never written to the debug dumps.
`salvar_diagnostico()` must be wrapped so HTML/PNG captures are **suppressed** for processes that
carry a password — a full-page screenshot of a password form is a leak.

## 5. Deterministic movement key

The comparison atom. It must be identical across tribunals, otherwise baselines break when a
tribunal's scraper changes.

```
chave = sha256( f"{data_normalizada}|{descricao_normalizada}" ).hexdigest()[:32]
```

Normalization reuses the vendored `chave_texto()` exactly — NFD decompose, strip combining marks,
collapse whitespace, casefold — so keys computed by the TJSP path and by any future tribunal path
agree. `data_normalizada` is the movement date rendered `YYYY-MM-DD` (time discarded: portals
re-render times inconsistently, dates do not).

**Baseline comparison:**

- First ever query for a process → `base_inicial_criada`, `tem_movimentacao_nova = false` (no prior
  reference exists — flagging it would fabricate 106 tasks on day one).
- Subsequent → if any current key is absent from `processos.chaves_movimentacoes`, set
  `tem_movimentacao_nova = true`. The new baseline becomes the current key set.
- **Baseline is written on `sucesso` AND on `base_inicial_criada`** — i.e. on any *conclusive* query.
  It is never touched by `timeout`, `captcha_timeout`, `erro`, `nao_localizado`,
  `senha_necessaria`, `numero_invalido`, `pagina_intermediaria` or `pendente_implementacao`.

> **Why this wording matters.** The service layer promotes a first-ever query to
> `base_inicial_criada` *before* persistence (§6). A rule reading "only on `sucesso`" would
> therefore never write the **initial** baseline: every run would find an empty baseline, re-promote
> to `base_inicial_criada`, and no process would ever detect a movement. The predicate is
> **conclusive**, not `sucesso`.

```python
CONCLUSIVO = {"sucesso", "base_inicial_criada"}   # the single definition; used by §6 and §8
```

## 6. Orchestration

`radar/orchestrator.py`

```
adquirir_trava_global()              # DEC-11: one run at a time, any tribunal
cfg = ler_configuracoes()            # cron, e-mail, limiar de inércia
criar_execucao(origem, usuario_id)
processos = buscar_ativos_monitorados()

for processo in processos:
    scraper = resolver(processo.tribunal)
    if scraper is None:
        persistir(pendente_implementacao); atualizar_totais(); continue

    senha = vault.resolver(processo.senha_ref) if processo.exige_senha else None
    try:
        resultado = scraper.consultar(ProcessoConsulta(..., senha=senha))
    except Exception as exc:
        resultado = ResultadoConsulta(status="erro", tipo_erro=type(exc).__name__,
                                      etapa=etapa_corrente, ...)

    # ---- DETECTION RUNS BEFORE PERSISTENCE ----------------------------------
    # The verdict fields (status -> base_inicial_criada, tem_movimentacao_nova) are decided
    # HERE, so the row is written once, already correct. Persisting first and detecting after
    # would store tem_movimentacao_nova=false always, and base_inicial_criada could never
    # reach the column at all.
    if resultado.status == "sucesso":
        veredito = avaliar_baseline(processo, resultado)
        #   -> ("base_inicial_criada", novas=[])   when processo.chaves_movimentacoes is empty
        #   -> ("sucesso", novas=[...])            otherwise
        resultado = resultado.com_veredito(veredito)

    with transaction():                       # one transaction per process
        persistir_resultado(resultado)
        if resultado.status in CONCLUSIVO:                        # §5: sucesso | base_inicial_criada
            gravar_movimentacoes_novas(veredito.novas)
            atualizar_baseline(processo, resultado.chaves_movimentacoes)
            atualizar_data_ultimo_andamento(processo, resultado)  # DEC-19
        else:
            marcar_consulta_inconclusiva(processo, resultado.status)
        atualizar_totais_execucao()           # incremental, same tx as the result it counts

aplicar_regua_inercia(cfg.radar_inercia_dias) # idempotent; successes only (DEC-19)
finalizar_execucao(status=classificar_execucao())
enviar_email_tecnico(cfg.radar_email_erros, resumo_de_falhas)
liberar_trava_global()
```

**Who promotes `sucesso` → `base_inicial_criada`.** The scraper never emits it — it cannot, because
it holds no history. `StatusConsulta` (§2) therefore has nine values and the DB enum has ten. The
**service layer** promotes it in `avaliar_baseline()`, when the process has an empty baseline. That
asymmetry is intentional and is stated here so the two vocabularies are not "fixed" into agreement.

**`finalizar_execucao` status rule** (otherwise `falhou_parcialmente` is unreachable):

```
taxa_conclusiva = (total_sucesso + total_base_inicial_criada)
                / NULLIF(total_consultados - total_pendente_implementacao, 0)
```

| Condition | Status |
|---|---|
| All processes terminal, `total_erro` = 0, `taxa_conclusiva` ≥ 0.70 | `concluida` |
| All processes terminal, but `total_erro` > 0 or `taxa_conclusiva` < 0.70 | `falhou_parcialmente` |
| Loop exited early / reaper found a stale heartbeat | `interrompida` |
| `taxa_conclusiva` IS NULL (every process was `pendente_implementacao`) and `total_erro` = 0 | `concluida` |

> **Two definitions here are load-bearing, and getting either wrong breaks the very first run.**
> `base_inicial_criada` **counts as a success**: on run #1 every one of the 106 processes is a
> baseline creation, so a rate computed from `total_sucesso` alone would be 0, the run would be
> classified `falhou_parcialmente`, and the §8 alert would fire on day one of a perfectly healthy
> system. And `pendente_implementacao` is **excluded from the denominator**: the 12 TJCE/TJBA
> processes are awaiting a scraper by design (DEC-15), so counting them as failures would peg the
> rate at 88% before a single query runs and make the threshold meaningless.

The 0.70 threshold is the one the §8 alert uses, against a measured baseline of 88.7%.

**Concurrency lock:** a Postgres advisory lock (`pg_try_advisory_lock`) on a fixed key, not a boolean
column. A crashed run releases the lock when its connection dies; a boolean column would deadlock the
radar permanently after one hard crash. If the lock is held, the manual-trigger endpoint returns
**409** with "o radar já está rodando".

**Interruption:** because persistence is per process, a killed run leaves completed processes intact.
A run left `em_andamento` with no heartbeat for > 30 min is reaped to `interrompida`.

## 7. External integrations summary

| Integration | Direction | Auth | Failure mode |
|---|---|---|---|
| TJSP eproc portal | out | none (public) | Handled: `nao_localizado`, `senha_necessaria`, `captcha_timeout`, `timeout` |
| TJCE portal | — | n/a | **Out of v1 scope (DEC-38).** Slot reserved → `pendente_implementacao`; not an integration in v1 |
| TJBA portal | — | n/a | **Out of v1 scope (DEC-38).** Slot reserved → `pendente_implementacao`; not an integration in v1 |
| Secrets vault | both | service credential | Fail closed: no password → `senha_necessaria`, process stays pending |
| SMTP (error report) | out | `SMTP_*` env vars | Non-fatal; a failed email must never fail the run — log and continue |
| Supabase | both | **dedicated Postgres role `radar_worker`** (`RADAR_DB_URL`), **not `service_role`** | Retry with backoff; run aborts cleanly on persistent failure |

> **The worker does not hold `service_role`.** `service_role` bypasses RLS entirely and therefore
> cannot be "least privilege" — holding it would make the `09` §3 restriction ("writes to
> `execucoes_radar`/`resultados_consulta`/`movimentacoes_novas` reserved to the radar role")
> unenforceable, which is the same defect DEC-28 exists to prevent. `radar_worker` is a normal role
> with explicit `GRANT`s on exactly the radar tables plus `SELECT` on `processos`/`configuracoes`,
> and no access to `auth.*`, the financial tables, or `ind_*`. `service_role` is used **only** for
> applying migrations.

## 8. Observability

Each run records: start/end, origin (`agendada`/`manual`), triggering user, and per-status totals.
Beyond the document's list, two counters are **required** because they are the early-warning signals:

- **`captcha_timeout` rate** — 0/106 today. TJSP challenges intermittently (51 detections in the
  older log). A rising rate is the first sign the portal's posture changed, and it is the failure
  most likely to appear without any code change.
- **`pendente_implementacao` count** — makes the 12 uncovered processes permanently visible instead
  of quietly absent.

Alert conditions: no run completed in `radar_alerta_sem_rodada_dias` (default 8, covers the Mac being
off, DEC-23); `captcha_timeout` rate > 20% in a run; **`taxa_conclusiva`** below 0.70 (baseline 88.7%) — the §6 measure, not a raw `total_sucesso` ratio, which would fire on day one of a healthy system.

> **The missing-run alert must not run on the radar host.** If it lived on the office Mac it would be
> off in exactly the situation it exists to detect — a watchdog that sleeps with the thing it
> watches. This is the one piece of radar supervision that deliberately does not live with the radar.
>
> **Mechanism:** `pg_cron` executes SQL and Postgres has no SMTP client, so `pg_cron` alone cannot
> send the alert. The daily job is `pg_cron` → **`pg_net`** issuing an HTTPS POST to a **Supabase Edge
> Function**, which queries `execucoes_radar` for the most recent `concluida` run and sends the email
> via the same transactional mail provider as the error report (`RESEND_API_KEY` / `SMTP_*`). Both
> `pg_cron` and `pg_net` are enabled in **`011_watchdog.sql`, a Supabase-only migration** (T-049b) —
> *not* in `000_bootstrap.sql`, because `pg_net` does not exist on stock Postgres and `pg_cron` needs
> `shared_preload_libraries`, so putting them there would break the mandated local rebuild in T-018.
> The whole watchdog
> lives inside the managed platform and has no dependency on the office Mac being powered on.

**Error email contents** (per the source document): process number, status, error message, **step**
(`resultados_consulta.etapa`), and timestamp — for every process ending in `erro`, `timeout`,
`captcha_timeout` or `senha_necessaria`. Assembled from a fixed field list, never by serializing a
result object, so a new column cannot leak into it. Recipient from `configuracoes.radar_email_erros`.
**A failed send is logged and never fails the run** (TEST-RADAR-20).
