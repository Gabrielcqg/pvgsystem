from __future__ import annotations

from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ProcessoInercia:
    id: str
    numero: str
    data_ultimo_andamento: date | None
    ultima_consulta_inconclusiva: bool
    tribunal: str


def deve_criar_tarefa_inercia(processo: ProcessoInercia, hoje: date, dias: int) -> bool:
    if processo.tribunal in {"TJCE", "TJBA"}:
        return False
    if processo.ultima_consulta_inconclusiva or processo.data_ultimo_andamento is None:
        return False
    return (hoje - processo.data_ultimo_andamento).days >= dias
