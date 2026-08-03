from __future__ import annotations

import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import pytest

from tests.conftest import CANONICAL_SCRAPER, SCRAPER_FIXTURE_DIR, _install_drissionpage_stub, load_canonical_scraper


EXPECTED_CANONICAL_SHA256 = "c9429f2aa3ac05a30fe53075ce56fb2def63e5cc82f229a0531b94ba73701ad8"
RUNTIME_SCRAPER = Path("backend/radar/scrapers/vendor/consulta_tjsp_lote.py")


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _normalize_extraction(snapshot: dict) -> dict:
    return {
        "layout": snapshot.get("layout"),
        "movements": snapshot.get("movements", []),
    }


def _load_runtime_scraper():
    _install_drissionpage_stub()
    module_name = "runtime_characterization_consulta_tjsp_lote"
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(module_name, RUNTIME_SCRAPER)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load runtime scraper from {RUNTIME_SCRAPER}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


@pytest.mark.scraper
def test_scraper_01_canonical_file_is_byte_frozen() -> None:
    assert _sha256(CANONICAL_SCRAPER) == EXPECTED_CANONICAL_SHA256
    assert RUNTIME_SCRAPER.exists()


@pytest.mark.scraper
def test_scraper_02_eproc_eventos_golden_fixtures() -> None:
    scraper = load_canonical_scraper()
    golden = json.loads((SCRAPER_FIXTURE_DIR / "golden-extraction.json").read_text())
    eproc_files = [
        "pagina_20260715_231126.html",
        "pagina_20260715_231156.html",
    ]

    for name in eproc_files:
        path = SCRAPER_FIXTURE_DIR / "html" / name
        assert _sha256(path) == golden[name]["sha256"]
        snapshot = scraper.analisar_html(path.read_text(), url=f"https://fixture.local/{name}")
        assert _normalize_extraction(snapshot) == {
            "layout": golden[name]["layout"],
            "movements": golden[name]["movimentacoes"],
        }


@pytest.mark.scraper
def test_scraper_03_container_movimentacao_golden_fixtures() -> None:
    scraper = load_canonical_scraper()
    golden = json.loads((SCRAPER_FIXTURE_DIR / "golden-extraction.json").read_text())
    container_files = [
        "01_10399951520248260114_20260716_233534.html",
        "02_00085271220128260586_20260716_233910.html",
        "03_10399951520248260114_20260716_225819.html",
    ]

    for name in container_files:
        path = SCRAPER_FIXTURE_DIR / "html" / name
        assert _sha256(path) == golden[name]["sha256"]
        snapshot = scraper.analisar_html(path.read_text(), url=f"https://fixture.local/{name}")
        assert _normalize_extraction(snapshot) == {
            "layout": golden[name]["layout"],
            "movements": golden[name]["movimentacoes"],
        }


@pytest.mark.scraper
def test_scraper_04_runtime_copy_preserves_golden_fixtures() -> None:
    scraper = _load_runtime_scraper()
    golden = json.loads((SCRAPER_FIXTURE_DIR / "golden-extraction.json").read_text())
    fixture_files = [
        "pagina_20260715_231126.html",
        "pagina_20260715_231156.html",
        "01_10399951520248260114_20260716_233534.html",
        "02_00085271220128260586_20260716_233910.html",
        "03_10399951520248260114_20260716_225819.html",
    ]

    for name in fixture_files:
        path = SCRAPER_FIXTURE_DIR / "html" / name
        assert _sha256(path) == golden[name]["sha256"]
        snapshot = scraper.analisar_html(path.read_text(), url=f"https://fixture.local/{name}")
        assert _normalize_extraction(snapshot) == {
            "layout": golden[name]["layout"],
            "movements": golden[name]["movimentacoes"],
        }


@pytest.mark.arch
@pytest.mark.scraper
def test_arch_01_scraper_tree_imports_no_database_module() -> None:
    scraper_roots = [
        Path("radar/scrapers"),
        Path("app/radar/scrapers"),
    ]
    banned = ("psycopg", "sqlalchemy", "supabase", "app.db", "app.database")
    offenders: list[str] = []

    for root in scraper_roots:
        if not root.exists():
            continue
        for path in root.rglob("*.py"):
            text = path.read_text()
            for needle in banned:
                if f"import {needle}" in text or f"from {needle}" in text:
                    offenders.append(f"{path}:{needle}")

    assert offenders == []
