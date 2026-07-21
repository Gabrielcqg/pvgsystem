from __future__ import annotations

import argparse
import json
import os

from app.loader.importer import load_workbooks


def main() -> int:
    parser = argparse.ArgumentParser(description="Importa planilhas historicas Pavageau.")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--validate-only", action="store_true", help="Resolve mapeamentos e valida sem escrever no banco.")
    mode.add_argument("--commit", action="store_true", help="Executa a importacao transacional.")
    parser.add_argument("--fluxo", required=True, help="Caminho do workbook de fluxo de caixa.")
    parser.add_argument("--contratos", required=True, help="Caminho do workbook de contratos.")
    parser.add_argument("--database-url", default=os.getenv("DATABASE_URL"), help="URL Postgres para --commit.")
    args = parser.parse_args()

    report = load_workbooks(
        fluxo_path=args.fluxo,
        contratos_path=args.contratos,
        database_url=args.database_url,
        validate_only=args.validate_only,
    )
    print(json.dumps(report.as_dict(), indent=2, ensure_ascii=False))
    return 0 if report.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
