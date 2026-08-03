"""Compatibility wrapper for the external radar runner.

Use `python -m radar_worker --sem-email` for the transportable worker package.
This module remains so older scripts/tests that call `python -m app.radar.worker`
keep working.
"""
from __future__ import annotations

from radar_worker.runner import main, rodar_worker

__all__ = ["main", "rodar_worker"]


if __name__ == "__main__":
    raise SystemExit(main())
