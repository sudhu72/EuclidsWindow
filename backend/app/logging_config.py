"""Structured logging configuration."""
import logging
import sys
from typing import Optional


def setup_logging(level: Optional[str] = None) -> logging.Logger:
    log_level = getattr(logging, (level or "INFO").upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    logger = logging.getLogger("euclids_window")
    logger.setLevel(log_level)
    logger.handlers = [handler]

    return logger


logger = setup_logging()
