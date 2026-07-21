from __future__ import annotations

from pathlib import Path

from app.loader.synthetic import generate_synthetic_fixtures


def main() -> None:
    generate_synthetic_fixtures(Path(__file__).resolve().parent)


if __name__ == "__main__":
    main()
