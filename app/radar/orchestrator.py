from __future__ import annotations

from dataclasses import dataclass, field, replace
from datetime import datetime

from app.radar.comparacao import CONCLUSIVO, avaliar_baseline, com_chaves, data_movimentacao_recente
from app.radar.notificacao import avaliar_alertas
from app.radar.scrapers.base import ProcessoConsulta, ResultadoConsulta, ScraperTribunal
from app.radar.scrapers.registry import resolver
from app.security.vault import Vault


@dataclass
class ProcessoMonitorado:
    id: str
    numero: str
    tribunal: str
    chaves_movimentacoes: tuple[str, ...] = ()
    exige_senha: bool = False
    senha_ref: str | None = None
    data_ultimo_andamento: object | None = None
    ultima_consulta_inconclusiva: bool = False


@dataclass
class ExecucaoRadarMemoria:
    origem: str
    usuario_id: str | None = None
    resultados: list[ResultadoConsulta] = field(default_factory=list)
    total_consultados: int = 0
    total_sucesso: int = 0
    total_base_inicial_criada: int = 0
    total_pendente_implementacao: int = 0
    total_erro: int = 0
    total_timeout: int = 0
    total_captcha_timeout: int = 0
    total_senha_necessaria: int = 0
    total_com_movimentacao_nova: int = 0
    status: str = "em_andamento"

    @property
    def total_conclusivo(self) -> int:
        return self.total_sucesso + self.total_base_inicial_criada

    @property
    def taxa_conclusiva(self) -> float | None:
        denominator = self.total_consultados - self.total_pendente_implementacao
        if denominator <= 0:
            return None
        return self.total_conclusivo / denominator


def _incrementar(execucao: ExecucaoRadarMemoria, resultado: ResultadoConsulta) -> None:
    execucao.total_consultados += 1
    if resultado.status == "sucesso":
        execucao.total_sucesso += 1
    elif resultado.status == "base_inicial_criada":
        execucao.total_base_inicial_criada += 1
    elif resultado.status == "pendente_implementacao":
        execucao.total_pendente_implementacao += 1
    elif resultado.status == "erro":
        execucao.total_erro += 1
    elif resultado.status == "timeout":
        execucao.total_timeout += 1
    elif resultado.status == "captcha_timeout":
        execucao.total_captcha_timeout += 1
    elif resultado.status == "senha_necessaria":
        execucao.total_senha_necessaria += 1
    if resultado.tem_movimentacao_nova:
        execucao.total_com_movimentacao_nova += 1


def classificar_execucao(execucao: ExecucaoRadarMemoria) -> str:
    taxa = execucao.taxa_conclusiva
    if execucao.total_erro > 0 or (taxa is not None and taxa < 0.70):
        return "falhou_parcialmente"
    return "concluida"


def executar(
    processos: list[ProcessoMonitorado],
    *,
    origem: str,
    usuario_id: str | None = None,
    vault: Vault | None = None,
    scrapers: dict[str, ScraperTribunal | None] | None = None,
) -> ExecucaoRadarMemoria:
    execucao = ExecucaoRadarMemoria(origem=origem, usuario_id=usuario_id)
    registry = scrapers or {}
    for processo in processos:
        scraper = registry.get(processo.tribunal, resolver(processo.tribunal))
        if scraper is None:
            resultado = ResultadoConsulta(
                numero_processo=processo.numero,
                tribunal=processo.tribunal,
                status="pendente_implementacao",
                movimentacoes=[],
                quantidade_movimentacoes=0,
                mensagem_erro=f"Nenhum scraper implementado para {processo.tribunal}",
                etapa="consultar",
                consultado_em=datetime.now(),
            )
            execucao.resultados.append(resultado)
            _incrementar(execucao, resultado)
            continue

        senha = vault.resolver(processo.senha_ref) if vault and processo.exige_senha and processo.senha_ref else None
        try:
            resultado = scraper.consultar(
                ProcessoConsulta(
                    numero_processo=processo.numero,
                    tribunal=processo.tribunal,
                    senha=senha,
                    chaves_anteriores=processo.chaves_movimentacoes,
                )
            )
        except Exception as exc:  # noqa: BLE001 - per-process isolation is part of the contract.
            resultado = ResultadoConsulta(
                numero_processo=processo.numero,
                tribunal=processo.tribunal,
                status="erro",
                movimentacoes=[],
                quantidade_movimentacoes=0,
                mensagem_erro=str(exc),
                tipo_erro=type(exc).__name__,
                etapa="extrair",
                consultado_em=datetime.now(),
            )

        if resultado.status == "sucesso":
            movimentos = com_chaves(list(resultado.movimentacoes))
            resultado = replace(resultado, movimentacoes=movimentos, quantidade_movimentacoes=len(movimentos))
            veredito = avaliar_baseline(processo.chaves_movimentacoes, resultado)
            resultado = replace(
                resultado,
                status=veredito.status,  # type: ignore[arg-type]
                tem_movimentacao_nova=bool(veredito.novas),
            )
            processo.chaves_movimentacoes = veredito.baseline
            processo.data_ultimo_andamento = data_movimentacao_recente(movimentos) or processo.data_ultimo_andamento
            processo.ultima_consulta_inconclusiva = False
        elif resultado.status not in CONCLUSIVO:
            processo.ultima_consulta_inconclusiva = resultado.status in {"timeout", "captcha_timeout", "erro"}

        execucao.resultados.append(resultado)
        _incrementar(execucao, resultado)

    execucao.status = classificar_execucao(execucao)
    avaliar_alertas(
        execucao.total_consultados,
        execucao.total_pendente_implementacao,
        execucao.total_conclusivo,
        execucao.total_captcha_timeout,
    )
    return execucao
