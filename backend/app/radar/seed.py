from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path


CNJ_RE = re.compile(r"^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$")


@dataclass(frozen=True)
class SeedResult:
    total: int
    inserted: int
    skipped_invalid: int
    by_tribunal: dict[str, int]


def load_process_seed(path: Path) -> SeedResult:
    total = inserted = skipped = 0
    by_tribunal: dict[str, int] = {}
    with path.open(newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            total += 1
            tribunal = (row.get("tribunal") or "").strip().upper()
            numero = (row.get("numero") or row.get("processo") or "").strip()
            valido_text = (row.get("valido") or "true").strip().lower()
            valido = valido_text not in {"false", "0", "nao", "não"}
            if not valido or not CNJ_RE.fullmatch(numero):
                skipped += 1
                continue
            inserted += 1
            by_tribunal[tribunal] = by_tribunal.get(tribunal, 0) + 1
    return SeedResult(total=total, inserted=inserted, skipped_invalid=skipped, by_tribunal=by_tribunal)
