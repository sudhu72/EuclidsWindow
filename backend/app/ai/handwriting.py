"""Handwriting recognition utilities for scratchpad input."""
from __future__ import annotations

import base64
import io
import re
from typing import Tuple

from ..logging_config import logger

try:
    from PIL import Image, ImageOps, ImageFilter
except Exception:  # pragma: no cover
    Image = None

try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None


class HandwritingService:
    """Convert scratchpad image data into rough typed text."""

    def is_available(self) -> bool:
        return Image is not None and pytesseract is not None

    def recognize(self, image_data: str) -> Tuple[str, float]:
        if not self.is_available():
            raise RuntimeError("Handwriting OCR runtime is unavailable. Install Pillow and pytesseract.")
        img = self._decode_data_url(image_data)
        img = self._preprocess(img)
        raw = pytesseract.image_to_string(img, config="--psm 6")
        text = self._normalize_math_text(raw)
        confidence = 0.8 if text.strip() else 0.2
        return text, confidence

    @staticmethod
    def _decode_data_url(image_data: str):
        if "," in image_data:
            _, encoded = image_data.split(",", 1)
        else:
            encoded = image_data
        binary = base64.b64decode(encoded)
        return Image.open(io.BytesIO(binary)).convert("RGB")

    @staticmethod
    def _preprocess(img):
        gray = ImageOps.grayscale(img)
        gray = gray.filter(ImageFilter.MedianFilter(size=3))
        # Increase contrast for drawn strokes.
        gray = ImageOps.autocontrast(gray)
        # Binarize.
        bw = gray.point(lambda p: 255 if p > 170 else 0)
        return bw

    @staticmethod
    def _normalize_math_text(text: str) -> str:
        value = (text or "").strip()
        if not value:
            return ""
        replacements = {
            "—": "-",
            "−": "-",
            "×": "*",
            "÷": "/",
            "“": '"',
            "”": '"',
            "‘": "'",
            "’": "'",
            "O": "0",
        }
        for old, new in replacements.items():
            value = value.replace(old, new)
        # common OCR artifacts
        value = re.sub(r"\s+", " ", value)
        value = value.replace(" = ", "=")
        value = value.replace("x2", "x^2")
        return value.strip()
