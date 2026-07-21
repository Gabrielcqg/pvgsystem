from __future__ import annotations

from app.radar.scrapers.base import ScraperTribunal
from app.radar.scrapers.tjsp import TJSPScraper


SCRAPERS: dict[str, ScraperTribunal | None] = {
    "TJSP": TJSPScraper(),
    "TJCE": None,
    "TJBA": None,
}


def resolver(tribunal: str) -> ScraperTribunal | None:
    return SCRAPERS.get(tribunal.strip().upper())
