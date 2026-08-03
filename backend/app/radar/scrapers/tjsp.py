from __future__ import annotations

import importlib.util
import os
import sys
from datetime import datetime
from pathlib import Path
from types import ModuleType
from typing import Any, cast

from app.radar.comparacao import com_chaves
from app.radar.scrapers.base import Movimentacao, ProcessoConsulta, ResultadoConsulta


RUNTIME_SCRAPER_PATH = Path(__file__).resolve().parents[3] / "radar" / "scrapers" / "vendor" / "consulta_tjsp_lote.py"


def _has_real_drissionpage() -> bool:
    module = sys.modules.get("DrissionPage")
    if module is not None:
        return bool(getattr(module, "__file__", None))
    return importlib.util.find_spec("DrissionPage") is not None


def _install_drissionpage_stub() -> None:
    if "DrissionPage" in sys.modules:
        return
    try:
        __import__("DrissionPage")
        return
    except Exception:
        pass
    module = cast(Any, ModuleType("DrissionPage"))
    errors_module = cast(Any, ModuleType("DrissionPage.errors"))

    class ChromiumOptions:
        def __init__(self, *_args: Any, **_kwargs: Any) -> None:
            pass

        def __getattr__(self, _name):
            def _noop(*_args, **_kwargs):
                return self

            return _noop

    class ChromiumPage:
        pass

    class BrowserConnectError(Exception):
        pass

    module.ChromiumOptions = ChromiumOptions
    module.ChromiumPage = ChromiumPage
    errors_module.BrowserConnectError = BrowserConnectError
    sys.modules["DrissionPage"] = module
    sys.modules["DrissionPage.errors"] = errors_module


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


def _build_item(vendor: ModuleType, numero: str) -> dict[str, Any]:
    """Build the item dict the vendor's consultar_processo expects, from a CNJ number."""
    original = vendor.texto_limpo(numero)
    numero_fmt = vendor.formatar_cnj(numero)
    digits = vendor.somente_digitos(numero_fmt)
    valido = len(digits) == 20
    return {
        "linha_excel": 0,
        "valor_original_excel": original,
        "numero_processo": numero_fmt,
        "chave": digits or vendor.chave_texto(numero_fmt),
        "valido": valido,
        "erro_validacao": None if valido else "O número CNJ não possui 20 dígitos.",
    }


def _set_browser_path(options: Any, browser_path: str) -> None:
    for method_name in ("set_browser_path", "set_paths"):
        method = getattr(options, method_name, None)
        if not callable(method):
            continue
        try:
            if method_name == "set_paths":
                method(browser_path=browser_path)
            else:
                method(browser_path)
            return
        except TypeError:
                continue


def _new_chromium_options(vendor: ModuleType) -> Any:
    try:
        return cast(Any, vendor).ChromiumOptions(read_file=False)
    except TypeError:
        return cast(Any, vendor).ChromiumOptions()


def _set_option(options: Any, method_name: str, *args: Any) -> bool:
    method = getattr(options, method_name, None)
    if not callable(method):
        return False
    try:
        method(*args)
        return True
    except TypeError:
        return False


def _headless_enabled() -> bool:
    value = (
        os.getenv("RADAR_BROWSER_HEADLESS")
        or os.getenv("TJSP_BROWSER_HEADLESS")
        or os.getenv("HEADLESS")
        or "false"
    ).strip().lower()
    return value not in {"0", "false", "no", "off"}


def _configure_runtime_profile(vendor: ModuleType, options: Any) -> None:
    user_data_dir = os.getenv("RADAR_CHROME_USER_DATA_DIR")
    profile_directory = os.getenv("RADAR_CHROME_PROFILE_DIRECTORY")
    if user_data_dir and not os.getenv("TJSP_CHROME_USER_DATA_DIR"):
        os.environ["TJSP_CHROME_USER_DATA_DIR"] = user_data_dir
    if profile_directory and not os.getenv("TJSP_CHROME_PROFILE_DIRECTORY"):
        os.environ["TJSP_CHROME_PROFILE_DIRECTORY"] = profile_directory

    preparar_perfil = getattr(vendor, "preparar_perfil_navegador", None)
    if not callable(preparar_perfil):
        return
    try:
        profile_result = preparar_perfil()
        user_data_path = profile_result[0]
        profile_name = profile_result[1]
    except Exception:
        return

    _set_option(options, "set_user_data_path", user_data_path)
    _set_option(options, "set_user", profile_name)


def _configure_runtime_port(vendor: ModuleType, options: Any) -> None:
    raw_port = os.getenv("RADAR_CHROME_PORT")
    port: int | None = int(raw_port) if raw_port and raw_port.isdigit() else None
    if port is None:
        escolher_porta = getattr(vendor, "escolher_porta_livre", None)
        if callable(escolher_porta):
            try:
                port = int(escolher_porta())
            except Exception:
                port = None
    if port is not None:
        _set_option(options, "set_local_port", port)


def _criar_navegador_runtime(vendor: ModuleType) -> Any:
    options = _new_chromium_options(vendor)
    chrome_address = os.getenv("RADAR_CHROME_ADDRESS")
    if chrome_address:
        address = chrome_address.replace("http://", "").replace("https://", "").rstrip("/")
        set_paths = getattr(options, "set_paths", None)
        if callable(set_paths):
            set_paths(address=address)
        return cast(Any, vendor).ChromiumPage(addr_or_opts=options)

    _configure_runtime_port(vendor, options)
    _configure_runtime_profile(vendor, options)
    headless = _headless_enabled()
    if hasattr(vendor, "NAVEGADOR_HEADLESS"):
        setattr(vendor, "NAVEGADOR_HEADLESS", headless)

    args = [
        "--start-maximized",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1365,900",
        "--no-default-browser-check",
        "--no-first-run",
        "--disable-infobars",
    ]
    for arg in args:
        setter = getattr(options, "set_argument", None)
        if callable(setter):
            setter(arg)
    if headless:
        headless_method = getattr(options, "headless", None)
        if callable(headless_method):
            headless_method(True)
        else:
            setter = getattr(options, "set_argument", None)
            if callable(setter):
                setter("--headless")
    browser_path = os.getenv("RADAR_CHROMIUM_PATH") or os.getenv("CHROME_BIN")
    if browser_path and not os.getenv("TJSP_CHROME_PATH"):
        os.environ["TJSP_CHROME_PATH"] = browser_path
    if not browser_path:
        resolver_chrome = getattr(vendor, "resolver_caminho_chrome", None)
        if callable(resolver_chrome):
            try:
                browser_path = str(resolver_chrome())
            except Exception:
                browser_path = None
    if browser_path:
        _set_browser_path(options, browser_path)
    return cast(Any, vendor).ChromiumPage(addr_or_opts=options)


def preparar_navegador() -> Any:
    """Create a live Chromium session with the base TJSP tab ready (validation/CAPTCHA
    solved once), matching the vendor's validated flow. Requires a real browser +
    DrissionPage installed in the runtime."""
    if not _has_real_drissionpage():
        raise RuntimeError(
            "DrissionPage nao instalado no runtime do radar. Instale requirements-worker.txt "
            "ou use a imagem Docker da API com Chromium."
        )
    vendor = _load_vendor()
    try:
        browser = _criar_navegador_runtime(vendor)
        browser.get(cast(Any, vendor).PORTAL_TJSP.url_consulta)
        cast(Any, vendor).aguardar_formulario(browser, cast(Any, vendor).PORTAL_TJSP)
        return browser
    except Exception as exc:  # noqa: BLE001 - surface a clear operational diagnostic.
        raise RuntimeError(f"Falha ao iniciar navegador do radar TJSP: {exc}") from exc


class UnavailableTJSPScraper:
    tribunal = "TJSP"

    def __init__(self, mensagem: str) -> None:
        self.mensagem = mensagem

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        return ResultadoConsulta(
            numero_processo=processo.numero_processo,
            tribunal="TJSP",
            status="erro",
            movimentacoes=[],
            quantidade_movimentacoes=0,
            mensagem_erro=self.mensagem,
            tipo_erro="browser_unavailable",
            etapa="abrir_aba",
            consultado_em=datetime.now(),
        )


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

        item = _build_item(vendor, processo.numero_processo)
        if processo.senha:
            item["senha"] = processo.senha
        raw = vendor.consultar_processo(self.page, vendor.PORTAL_TJSP, item)
        mensagem_erro = raw.get("mensagem_erro") or raw.get("mensagem")
        status = raw.get("status", "erro")
        tipo_erro = raw.get("tipo_erro")
        etapa = raw.get("etapa")
        if status == "timeout" and mensagem_erro:
            mensagem_lower = str(mensagem_erro).lower()
            if "captcha" in mensagem_lower:
                status = "captcha_timeout"
                tipo_erro = tipo_erro or "captcha_required"
                etapa = etapa or "aguardar_resultado"
            elif "watchdog" in mensagem_lower:
                status = "captcha_timeout"
                tipo_erro = tipo_erro or "captcha_or_submit_blocked"
                etapa = etapa or "aguardar_resultado"
                mensagem_erro = (
                    "Portal TJSP nao liberou a consulta apos preencher o formulario. "
                    "Possivel validacao invisivel/captcha no ambiente automatizado. "
                    f"Detalhe original: {mensagem_erro}"
                )
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
            status=status,
            movimentacoes=movimentos,
            quantidade_movimentacoes=len(movimentos),
            layout_movimentacoes=raw.get("layout_movimentacoes") or raw.get("layout"),
            url_resultado=raw.get("url_resultado"),
            mensagem_erro=mensagem_erro,
            tipo_erro=tipo_erro,
            etapa=etapa,
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
