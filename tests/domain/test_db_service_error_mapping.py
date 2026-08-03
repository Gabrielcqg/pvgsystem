from __future__ import annotations

import psycopg
import pytest

from app.domain.db_service import PostgresService
from app.domain.errors import ValidationError


class _DataErrorCursor:
    def __enter__(self):
        return self

    def __exit__(self, *_exc):
        return False

    def execute(self, *_args, **_kwargs) -> None:
        raise psycopg.errors.InvalidTextRepresentation("invalid enum/date")


class _DataErrorConnection:
    def cursor(self, *_args, **_kwargs):
        return _DataErrorCursor()


def test_generic_create_maps_postgres_data_error_to_validation_error() -> None:
    service = PostgresService(_DataErrorConnection())  # type: ignore[arg-type]

    with pytest.raises(ValidationError) as exc_info:
        service.create(
            "contratos",
            {
                "cliente": "E2E_TEST_Invalid",
                "status": "zzz",
                "tipo_honorario": "fixo_mensal",
            },
        )

    assert "Valor invalido" in str(exc_info.value)


def test_generic_patch_maps_postgres_data_error_to_validation_error() -> None:
    service = PostgresService(_DataErrorConnection())  # type: ignore[arg-type]

    with pytest.raises(ValidationError) as exc_info:
        service.patch("contratos", "00000000-0000-0000-0000-000000000000", {"status": "zzz"})

    assert "Valor invalido" in str(exc_info.value)
