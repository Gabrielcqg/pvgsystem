from __future__ import annotations

import re
import unicodedata
from collections.abc import Iterable, Mapping
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any


def chave_texto(value: Any) -> str:
    if value is None:
        return ""
    text = unicodedata.normalize("NFD", str(value))
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    return re.sub(r"\s+", " ", text).strip().casefold()


COLUMN_ALIASES: dict[str, dict[str, tuple[str, ...]]] = {
    "config_params": {
        "caixa_inicial_ano": ("caixa inicial",),
        "meta_caixa_ano": ("meta de caixa", "meta caixa"),
        "meta_recorrencia_mensal": ("meta de recorrencia", "meta recorrencia mensal"),
        "recorrencia_atual": ("recorrencia atual",),
    },
    "fixed_costs": {
        "descricao": ("descricao", "custo", "item"),
        "valor_mensal": ("valor", "valor mensal"),
        "recorrente": ("recorrente",),
        "dia_vencimento": ("dia", "dia vencimento", "vencimento"),
        "mes_inicio": ("mes inicio", "inicio"),
    },
    "cash": {
        "data": ("data",),
        "descricao": ("descricao", "historico"),
        "tipo": ("tipo", "e/s", "entrada/saida"),
        "valor": ("valor",),
        "categoria": ("categoria",),
        "forma_pagamento": ("forma", "forma de pagamento", "pagamento"),
        "pago": ("pago", "status", "sim/pendente"),
        "observacoes": ("obs", "observacoes"),
        "saldo_digitado": ("saldo digitado", "saldo", "saldo caixa"),
    },
    "contracts": {
        "cliente": ("cliente", "nome"),
        "parceiro": ("parceiro", "origem"),
        "numero_processo": ("processo", "numero do processo"),
        "tipo_honorario": ("tipo", "tipo de honorario", "honorario"),
        "percentual_exito": ("% exito", "exito", "percentual exito"),
        "percentual_sucumbencia": ("% sucumbencia", "sucumbencia"),
        "percentual_quota": ("% quota", "quota"),
        "honorario_fixo_total": ("honorario fixo", "fixo", "valor fixo"),
        "valor_causa": ("valor da causa", "causa"),
        "apelido_split": ("split", "apelido"),
        "observacoes": ("obs", "observacoes"),
        "data_proposta": ("data proposta", "proposta"),
        "data_fechamento": ("data fechamento", "fechamento"),
        "status": ("status", "situacao"),
    },
    "parcelas": {
        "cliente": ("cliente", "contrato"),
        "tipo": ("tipo",),
        "valor": ("valor",),
        "mes_esperado": ("mes", "mes esperado", "competencia"),
        "recebido": ("recebido", "pago"),
        "mes_recebimento": ("mes recebimento", "recebido em"),
        "observacoes": ("obs", "observacoes"),
    },
}


def resolve_headers(headers: Iterable[Any], profile: str, required: set[str]) -> dict[str, int]:
    values = list(headers)
    normalized_headers = [(idx, chave_texto(value)) for idx, value in enumerate(values, start=1) if chave_texto(value)]
    resolved: dict[str, int] = {}

    for target, aliases in COLUMN_ALIASES[profile].items():
        alias_keys = [chave_texto(alias) for alias in aliases]
        for col, header_key in normalized_headers:
            if header_key in alias_keys:
                resolved[target] = col
                break
        if target in resolved:
            continue
        for col, header_key in normalized_headers:
            if any(alias_key and (alias_key in header_key or header_key in alias_key) for alias_key in alias_keys):
                resolved[target] = col
                break

    missing = required - set(resolved)
    if missing:
        available = ", ".join(str(value) for value in values if value not in (None, ""))
        raise ValueError(f"Colunas obrigatorias ausentes: {sorted(missing)}. Cabecalhos disponiveis: {available}")
    return resolved


def parse_money(value: Any, *, positive: bool = False) -> Decimal:
    if value is None or value == "":
        result = Decimal("0")
    elif isinstance(value, Decimal):
        result = value
    elif isinstance(value, int | float):
        result = Decimal(str(value))
    else:
        text = str(value).strip().replace("R$", "").replace(" ", "")
        if "," in text and "." in text:
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", ".")
        try:
            result = Decimal(text)
        except InvalidOperation as exc:
            raise ValueError(f"Valor monetario invalido: {value!r}") from exc
    result = result.quantize(Decimal("0.01"))
    if positive and result <= 0:
        raise ValueError(f"Valor precisa ser positivo: {value!r}")
    return result


def parse_percent(value: Any) -> Decimal:
    if value is None or value == "":
        return Decimal("0.0000")
    text = str(value).strip().replace("%", "").replace(",", ".")
    try:
        number = Decimal(text)
    except InvalidOperation as exc:
        raise ValueError(f"Percentual invalido: {value!r}") from exc
    if number > 100:
        raise ValueError(f"Percentual acima de 100: {value!r}")
    if number > 1:
        number = number / Decimal("100")
    return number.quantize(Decimal("0.0001"))


def parse_bool(value: Any, *, default: bool = False) -> bool:
    if value is None or value == "":
        return default
    if isinstance(value, bool):
        return value
    key = chave_texto(value)
    if key in {"sim", "s", "true", "1", "pago", "recebido", "ok", "yes"}:
        return True
    if key in {"nao", "n", "false", "0", "pendente", "aberto", "no"}:
        return False
    raise ValueError(f"Booleano invalido: {value!r}")


def parse_date(value: Any) -> date | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    text = str(value).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d/%m/%y"):
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            pass
    raise ValueError(f"Data invalida: {value!r}")


def parse_month(value: Any, *, default_year: int | None = None) -> date:
    if isinstance(value, datetime):
        return date(value.year, value.month, 1)
    if isinstance(value, date):
        return date(value.year, value.month, 1)
    if value is None or value == "":
        raise ValueError("Mes obrigatorio ausente")
    text = str(value).strip()
    for fmt in ("%Y-%m", "%Y-%m-%d", "%d/%m/%Y", "%m/%Y"):
        try:
            parsed = datetime.strptime(text, fmt).date()
            return date(parsed.year, parsed.month, 1)
        except ValueError:
            pass
    month_names = {
        "jan": 1,
        "fev": 2,
        "mar": 3,
        "abr": 4,
        "mai": 5,
        "jun": 6,
        "jul": 7,
        "ago": 8,
        "set": 9,
        "out": 10,
        "nov": 11,
        "dez": 12,
    }
    key = chave_texto(text)[:3]
    if key in month_names and default_year:
        return date(default_year, month_names[key], 1)
    raise ValueError(f"Mes invalido: {value!r}")


def map_enum(value: Any, mapping: Mapping[str, str], *, field: str) -> str:
    key = chave_texto(value)
    if key in mapping:
        return mapping[key]
    raise ValueError(f"Valor nao mapeado para {field}: {value!r}")


STATUS_MAP = {
    "aguardando exito": "aguardando_exito",
    "aguard. exito": "aguardando_exito",
    "sem exito": "sem_exito",
    "ativo": "ativo",
    "em andamento": "ativo",
    "encerrado": "encerrado",
    "finalizado": "encerrado",
    "proposta": "proposta",
    "pendente": "proposta",
    "em negociacao": "proposta",
}

TIPO_HONORARIO_MAP = {
    "fixo unico": "fixo_unico",
    "unico": "fixo_unico",
    "fixo mensal": "fixo_mensal",
    "mensal": "fixo_mensal",
    "fixo parcelado": "fixo_parcelado",
    "parcelado": "fixo_parcelado",
    "exito puro": "exito_puro",
    "so exito": "exito_puro",
    "sucumbencia": "sucumbencia",
    "fixo + exito": "fixo_exito",
    "fixo e exito": "fixo_exito",
    "fixo+exito": "fixo_exito",
    "exito + sucumbencia": "exito_sucumbencia",
    "exito e sucumbencia": "exito_sucumbencia",
    "fixo + exito + sucumbencia": "fixo_exito_sucumbencia",
}

CATEGORIA_MAP = {
    "honorarios": "honorarios",
    "consultoria": "consultoria",
    "custas processuais": "custas_processuais",
    "restituicao cliente": "restituicao_cliente",
    "custo fixo": "custo_fixo",
    "impostos": "impostos",
    "marketing": "marketing",
    "infraestrutura": "infraestrutura",
    "freelancer": "freelancer",
    "pro labore": "pro_labore",
    "outras entradas": "outras_entradas",
    "outras saidas": "outras_saidas",
}

LANCAMENTO_TIPO_MAP = {
    "entrada": "entrada",
    "e": "entrada",
    "+": "entrada",
    "saida": "saida",
    "s": "saida",
    "-": "saida",
}

PARCELA_TIPO_MAP = {
    "inicial": "inicial",
    "mensal": "mensal",
    "exito": "exito",
    "sucumbencia": "sucumbencia",
}
