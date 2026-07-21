from __future__ import annotations

import importlib.util
import sys
from pathlib import Path
from types import ModuleType
from typing import Any, cast

from app.radar.comparacao import com_chaves
from app.radar.scrapers.base import Movimentacao, ProcessoConsulta, ResultadoConsulta


RUNTIME_SCRAPER_PATH = Path(__file__).resolve().parents[3] / "radar" / "scrapers" / "vendor" / "consulta_tjsp_lote.py"


def _install_drissionpage_stub() -> None:
    if "DrissionPage" in sys.modules:
        return
    try:
        __import__("DrissionPage")
        return
    except Exception:
        pass
    module = cast(Any, ModuleType("DrissionPage"))

    class ChromiumOptions:
        def __getattr__(self, _name):
            def _noop(*_args, **_kwargs):
                return self

            return _noop

    class ChromiumPage:
        pass

    module.ChromiumOptions = ChromiumOptions
    module.ChromiumPage = ChromiumPage
    sys.modules["DrissionPage"] = module


def _load_vendor() -> ModuleType:
    _install_drissionpage_stub()
    module_name = "runtime_consulta_tjsp_lote"
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(module_name, RUNTIME_SCRAPER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load TJSP scraper from {RUNTIME_SCRAPER_PATH}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


class TJSPScraper:
    tribunal = "TJSP"

    def __init__(self, fixture_html: dict[str, str] | None = None, page: object | None = None) -> None:
        self.fixture_html = fixture_html or {}
        self.page = page

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        vendor = _load_vendor()
        if processo.numero_processo in self.fixture_html:
            snapshot = vendor.analisar_html(
                self.fixture_html[processo.numero_processo],
                url=f"https://fixture.local/{processo.numero_processo}",
            )
            movimentos = com_chaves([
                Movimentacao(
                    data_hora=item.get("data_hora"),
                    descricao=item.get("descricao") or "",
                    evento=item.get("evento"),
                    usuario=item.get("usuario"),
                )
                for item in snapshot.get("movements", [])
            ])
            return ResultadoConsulta(
                numero_processo=processo.numero_processo,
                tribunal="TJSP",
                status="sucesso",
                movimentacoes=movimentos,
                quantidade_movimentacoes=len(movimentos),
                layout_movimentacoes=snapshot.get("layout"),
                url_resultado=snapshot.get("url"),
                etapa="extrair",
            )

        if self.page is None:
            return ResultadoConsulta(
                numero_processo=processo.numero_processo,
                tribunal="TJSP",
                status="erro",
                movimentacoes=[],
                quantidade_movimentacoes=0,
                mensagem_erro="Browser session not configured for live TJSP query",
                tipo_erro="browser_unavailable",
                etapa="abrir_aba",
            )

        item = {
            "numero_processo": processo.numero_processo,
            "valor_original_excel": processo.numero_processo,
        }
        raw = vendor.consultar_processo(self.page, item, vendor.PORTAL_TJSP)
        movimentos = com_chaves([
            Movimentacao(
                data_hora=m.get("data_hora"),
                descricao=m.get("descricao") or "",
                evento=m.get("evento"),
                usuario=m.get("usuario"),
            )
            for m in raw.get("movimentacoes", [])
        ])
        return ResultadoConsulta(
            numero_processo=processo.numero_processo,
            tribunal="TJSP",
            status=raw.get("status", "erro"),
            movimentacoes=movimentos,
            quantidade_movimentacoes=len(movimentos),
            layout_movimentacoes=raw.get("layout_movimentacoes") or raw.get("layout"),
            url_resultado=raw.get("url_resultado"),
            mensagem_erro=raw.get("mensagem_erro"),
            tipo_erro=raw.get("tipo_erro"),
            etapa=raw.get("etapa"),
            duracao_segundos=raw.get("duracao_total_segundos"),
        )


def submeter_senha(tab: Any, senha: str) -> bool:
    selectors = [
        'input[type="password"]',
        'xpath://input[contains(translate(@name,"SENHA","senha"),"senha")]',
        'xpath://input[contains(translate(@id,"SENHA","senha"),"senha")]',
        'xpath://input[contains(translate(@placeholder,"SENHA","senha"),"senha")]',
        'xpath://input[contains(translate(@aria-label,"CHAVE DE ACESSO","chave de acesso"),"chave de acesso")]',
    ]
    field = None
    for selector in selectors:
        try:
            field = tab.ele(selector, timeout=0.2)
        except TypeError:
            field = tab.ele(selector)
        except Exception:
            field = None
        if field:
            break
    if not field:
        return False
    if hasattr(field, "clear"):
        field.clear()
    if hasattr(field, "input"):
        field.input(senha)
    elif hasattr(field, "type"):
        field.type(senha)
    else:
        setattr(field, "value", senha)
    for selector in ('button[type="submit"]', 'input[type="submit"]', "#sbmNovo"):
        try:
            button = tab.ele(selector, timeout=0.2)
        except TypeError:
            button = tab.ele(selector)
        except Exception:
            button = None
        if button and hasattr(button, "click"):
            button.click()
            return True
    if hasattr(field, "submit"):
        field.submit()
    return True


def diagnostico_permitido(senha: str | None) -> bool:
    return not senha
