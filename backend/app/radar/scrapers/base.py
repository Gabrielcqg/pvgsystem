from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import datetime
from typing import Literal, Protocol, Sequence


Etapa = Literal[
    "abrir_aba",
    "aguardar_formulario",
    "preencher",
    "consultar",
    "aguardar_resultado",
    "extrair",
    "submeter_senha",
]

StatusConsulta = Literal[
    "sucesso",
    "nao_localizado",
    "numero_invalido",
    "senha_necessaria",
    "captcha_timeout",
    "pagina_intermediaria",
    "timeout",
    "erro",
    "pendente_implementacao",
    "base_inicial_criada",
]


@dataclass(frozen=True)
class ProcessoConsulta:
    numero_processo: str
    tribunal: str
    senha: str | None = None
    chaves_anteriores: tuple[str, ...] = ()


@dataclass(frozen=True)
class Movimentacao:
    data_hora: str | None
    descricao: str
    evento: str | None = None
    usuario: str | None = None
    chave: str = ""


@dataclass(frozen=True)
class ResultadoConsulta:
    numero_processo: str
    tribunal: str
    status: StatusConsulta
    movimentacoes: Sequence[Movimentacao]
    quantidade_movimentacoes: int
    layout_movimentacoes: str | None = None
    url_resultado: str | None = None
    mensagem_erro: str | None = None
    tipo_erro: str | None = None
    etapa: Etapa | None = None
    consultado_em: datetime | None = None
    duracao_segundos: float | None = None
    tem_movimentacao_nova: bool = False

    @property
    def chaves_movimentacoes(self) -> tuple[str, ...]:
        return tuple(m.chave for m in self.movimentacoes if m.chave)

    def com_status(self, status: StatusConsulta, novas: Sequence[Movimentacao]) -> "ResultadoConsulta":
        return replace(self, status=status, tem_movimentacao_nova=bool(novas))


class ScraperTribunal(Protocol):
    tribunal: str

    def consultar(self, processo: ProcessoConsulta) -> ResultadoConsulta:
        ...
