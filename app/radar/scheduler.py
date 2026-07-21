from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RadarSchedule:
    cron: str
    email_erros: str
    inercia_dias: int
    alerta_sem_rodada_dias: int


def schedule_from_config(config: dict[str, str]) -> RadarSchedule:
    return RadarSchedule(
        cron=config.get("radar_cron", "0 3 * * 1"),
        email_erros=config.get("radar_email_erros", "gacamargo2003@gmail.com"),
        inercia_dias=int(config.get("radar_inercia_dias", "30")),
        alerta_sem_rodada_dias=int(config.get("radar_alerta_sem_rodada_dias", "8")),
    )
