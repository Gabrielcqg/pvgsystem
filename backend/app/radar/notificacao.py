from __future__ import annotations

from dataclasses import dataclass

from app.radar.scrapers.base import ResultadoConsulta
from app.security.redaction import redact_value


ERROR_STATUSES = {"erro", "timeout", "captcha_timeout", "senha_necessaria"}


@dataclass(frozen=True)
class AlertasRadar:
    captcha: bool
    degradacao: bool


def linhas_email_tecnico(resultados: list[ResultadoConsulta]) -> list[dict[str, object]]:
    rows = []
    for resultado in resultados:
        if resultado.status not in ERROR_STATUSES:
            continue
        rows.append(
            redact_value(
                {
                    "numero_processo": resultado.numero_processo,
                    "status": resultado.status,
                    "mensagem": resultado.mensagem_erro,
                    "etapa": resultado.etapa,
                    "timestamp": resultado.consultado_em.isoformat() if resultado.consultado_em else None,
                }
            )
        )
    return rows


def avaliar_alertas(total_consultados: int, total_pendente: int, total_conclusivo: int, total_captcha_timeout: int) -> AlertasRadar:
    denominator = max(total_consultados - total_pendente, 0)
    captcha_rate = (total_captcha_timeout / denominator) if denominator else 0
    taxa_conclusiva = (total_conclusivo / denominator) if denominator else 1
    return AlertasRadar(captcha=captcha_rate > 0.20, degradacao=taxa_conclusiva < 0.70)
