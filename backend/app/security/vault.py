from __future__ import annotations

import uuid
from typing import Protocol


class Vault(Protocol):
    def guardar(self, segredo: str) -> str: ...
    def resolver(self, referencia: str) -> str | None: ...
    def remover(self, referencia: str) -> None: ...


class InMemoryVault:
    def __init__(self) -> None:
        self._values: dict[str, str] = {}

    def guardar(self, segredo: str) -> str:
        ref = f"vault:{uuid.uuid4()}"
        self._values[ref] = segredo
        return ref

    def resolver(self, referencia: str) -> str | None:
        return self._values.get(referencia)

    def remover(self, referencia: str) -> None:
        self._values.pop(referencia, None)
