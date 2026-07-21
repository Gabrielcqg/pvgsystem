from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.radar.comparacao import chave_movimentacao
from app.radar.notificacao import avaliar_alertas, linhas_email_tecnico
from app.radar.orchestrator import ProcessoMonitorado, executar
from app.radar.scrapers.base import Movimentacao, ProcessoConsulta, ResultadoConsulta
from app.radar.scrapers.registry import SCRAPERS, resolver
from app.radar.scrapers.tjsp import TJSPScraper, diagnostico_permitido, submeter_senha
from app.radar.seed import load_process_seed
from tests.conftest import SCRAPER_FIXTURE_DIR


class StubScraper:
    tribunal = "TJSP"

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        return ResultadoConsulta(
            numero_processo=processo.numero_processo,
            tribunal=processo.tribunal,
            status="sucesso",
            movimentacoes=[Movimentacao("14/07/2026 15:14:45", "PETICAO - Refer. aos Eventos: 32 e 33")],
            quantidade_movimentacoes=1,
            layout_movimentacoes="eproc_eventos",
        )


@pytest.mark.radar
def test_radar_16_reserved_tjce_tjba_slots_are_pending_and_do_not_abort() -> None:
    assert resolver("TJCE") is None
    assert resolver("TJBA") is None
    execucao = executar(
        [
            ProcessoMonitorado(id="1", numero="0000000-00.2026.8.26.0001", tribunal="TJSP"),
            ProcessoMonitorado(id="2", numero="0000000-00.2026.8.06.0001", tribunal="TJCE"),
            ProcessoMonitorado(id="3", numero="0000000-00.2026.8.05.0001", tribunal="TJBA"),
        ],
        origem="agendada",
        scrapers={"TJSP": StubScraper(), "TJCE": None, "TJBA": None},
    )

    assert execucao.total_pendente_implementacao == 2
    assert execucao.status == "concluida"
    assert [r.status for r in execucao.resultados] == [
        "base_inicial_criada",
        "pendente_implementacao",
        "pendente_implementacao",
    ]


@pytest.mark.radar
def test_radar_31_full_run_with_12_pending_finishes_concluida() -> None:
    processos = [
        ProcessoMonitorado(id=str(i), numero=f"{i:07d}-00.2026.8.26.0001", tribunal="TJSP", chaves_movimentacoes=("old",))
        for i in range(106)
    ]
    processos += [
        ProcessoMonitorado(id=f"ce{i}", numero=f"{i:07d}-00.2026.8.06.0001", tribunal="TJCE")
        for i in range(7)
    ]
    processos += [
        ProcessoMonitorado(id=f"ba{i}", numero=f"{i:07d}-00.2026.8.05.0001", tribunal="TJBA")
        for i in range(5)
    ]

    execucao = executar(processos, origem="agendada", scrapers={"TJSP": StubScraper(), "TJCE": None, "TJBA": None})

    assert execucao.total_consultados == 118
    assert execucao.total_pendente_implementacao == 12
    assert execucao.taxa_conclusiva == 1
    assert execucao.status == "concluida"
    assert linhas_email_tecnico(execucao.resultados) == []


@pytest.mark.radar
def test_radar_18_movement_key_is_deterministic_across_spacing_case_and_accents() -> None:
    a = Movimentacao("14/07/2026 15:14:45", "PÉTIÇÃO   Juntada")
    b = Movimentacao("14/07/2026", "peticao juntada")
    assert chave_movimentacao(a) == chave_movimentacao(b)


@pytest.mark.radar
def test_radar_30_alerts_exclude_pending_from_denominator() -> None:
    healthy = avaliar_alertas(total_consultados=118, total_pendente=12, total_conclusivo=94, total_captcha_timeout=0)
    assert healthy.captcha is False
    assert healthy.degradacao is False
    degraded = avaliar_alertas(total_consultados=118, total_pendente=12, total_conclusivo=60, total_captcha_timeout=22)
    assert degraded.captcha is True
    assert degraded.degradacao is True


@pytest.mark.radar
@pytest.mark.scraper
def test_tjsp_adapter_uses_golden_fixture_without_browser() -> None:
    html = (SCRAPER_FIXTURE_DIR / "html" / "pagina_20260715_231126.html").read_text()
    scraper = TJSPScraper(fixture_html={"0000000-00.2026.8.26.0001": html})
    resultado = scraper.consultar(ProcessoConsulta("0000000-00.2026.8.26.0001", "TJSP"))
    assert resultado.status == "sucesso"
    assert resultado.layout_movimentacoes == "eproc_eventos"
    assert len(resultado.movimentacoes) == 3
    assert all(m.chave for m in resultado.movimentacoes)


@pytest.mark.radar
def test_radar_32_seed_processes_reports_invalid_row() -> None:
    result = load_process_seed(Path("plans/active/pavageau-sistema-integrado-backend/vendor/seed/processos_seed.csv"))
    assert result.total == 118
    assert result.inserted == 117
    assert result.skipped_invalid == 1
    assert result.by_tribunal == {"TJSP": 105, "TJCE": 7, "TJBA": 5}


class FakeField:
    def __init__(self) -> None:
        self.value = None

    def clear(self) -> None:
        self.value = ""

    def input(self, value: str) -> None:
        self.value = value


class FakeButton:
    def __init__(self) -> None:
        self.clicked = False

    def click(self) -> None:
        self.clicked = True


class FakeTab:
    def __init__(self) -> None:
        self.field = FakeField()
        self.button = FakeButton()

    def ele(self, selector: str, timeout: float = 0.2):
        if "password" in selector:
            return self.field
        if "submit" in selector:
            return self.button
        return None


@pytest.mark.browser
@pytest.mark.radar
def test_radar_26_password_submission_and_debug_suppression() -> None:
    tab = FakeTab()
    assert submeter_senha(tab, "segredo") is True
    assert tab.field.value == "segredo"
    assert tab.button.clicked is True
    assert diagnostico_permitido("segredo") is False
    assert diagnostico_permitido(None) is True
