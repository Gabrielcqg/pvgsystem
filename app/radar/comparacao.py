from __future__ import annotations

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from datetime import date

from app.radar.scrapers.base import Movimentacao, ResultadoConsulta


CONCLUSIVO = {"sucesso", "base_inicial_criada"}


def chave_texto(value: object) -> str:
    text = "" if value is None else str(value)
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text).strip().casefold()
    return text


def normalizar_data(data_hora: str | None) -> str:
    if not data_hora:
        return ""
    text = data_hora.strip()
    match = re.search(r"(\d{2})/(\d{2})/(\d{4})", text)
    if match:
        day, month, year = match.groups()
        return f"{year}-{month}-{day}"
    match = re.search(r"(\d{4})-(\d{2})-(\d{2})", text)
    return match.group(0) if match else chave_texto(text)


def chave_movimentacao(mov: Movimentacao) -> str:
    raw = f"{normalizar_data(mov.data_hora)}|{chave_texto(mov.descricao)}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()[:32]


def com_chaves(movimentos: list[Movimentacao]) -> list[Movimentacao]:
    return [
        Movimentacao(
            data_hora=m.data_hora,
            descricao=m.descricao,
            evento=m.evento,
            usuario=m.usuario,
            chave=m.chave or chave_movimentacao(m),
        )
        for m in movimentos[:3]
    ]


@dataclass(frozen=True)
class Veredito:
    status: str
    novas: tuple[Movimentacao, ...]
    baseline: tuple[str, ...]


def avaliar_baseline(chaves_anteriores: tuple[str, ...], resultado: ResultadoConsulta) -> Veredito:
    movimentos = com_chaves(list(resultado.movimentacoes))
    baseline = tuple(m.chave for m in movimentos)
    if not chaves_anteriores:
        return Veredito("base_inicial_criada", (), baseline)
    novas = tuple(m for m in movimentos if m.chave not in chaves_anteriores)
    return Veredito("sucesso", novas, baseline)


def data_movimentacao_recente(movimentos: tuple[Movimentacao, ...] | list[Movimentacao]) -> date | None:
    for mov in movimentos:
        normalized = normalizar_data(mov.data_hora)
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", normalized):
            return date.fromisoformat(normalized)
    return None
