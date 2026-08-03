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


def dias_sem_movimentacao(processo: ProcessoInercia, hoje: date) -> int | None:
    if processo.data_ultimo_andamento is None:
        return None
    return (hoje - processo.data_ultimo_andamento).days


def chave_inercia(processo: ProcessoInercia, dias_limite: int) -> str | None:
    if processo.data_ultimo_andamento is None:
        return None
    return f"radar_inercia:{processo.id}:{processo.data_ultimo_andamento.isoformat()}:{dias_limite}"


def deve_criar_tarefa_inercia(processo: ProcessoInercia, hoje: date, dias: int) -> bool:
    total_dias = dias_sem_movimentacao(processo, hoje)
    if total_dias is None:
        return False
    return total_dias > dias
