import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import VisualizationPayload, VisualizationType


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "demo_topics.json"

_WORD_BOUNDARY_CACHE: Dict[str, re.Pattern] = {}


def _keyword_matches(keyword: str, text: str) -> bool:
    """Match keyword in text using word boundaries for short keywords."""
    if len(keyword) <= 5:
        pattern = _WORD_BOUNDARY_CACHE.get(keyword)
        if pattern is None:
            pattern = re.compile(r"\b" + re.escape(keyword) + r"\b")
            _WORD_BOUNDARY_CACHE[keyword] = pattern
        return pattern.search(text) is not None
    return keyword in text


class TopicCatalog:
    def __init__(self) -> None:
        self._topics = self._load_topics()

    def _load_topics(self) -> List[Dict[str, Any]]:
        with DATA_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        return payload.get("topics", [])

    def match_topic(self, message: str) -> Optional[Dict[str, Any]]:
        text = message.lower()
        best_match = None
        best_score = (0, 0, 0)
        for topic in self._topics:
            longest_kw = 0
            hit_count = 0
            total_kw_len = 0
            for keyword in topic.get("keywords", []):
                if keyword and _keyword_matches(keyword, text):
                    hit_count += 1
                    total_kw_len += len(keyword)
                    if len(keyword) > longest_kw:
                        longest_kw = len(keyword)
            if hit_count > 0:
                score = (hit_count, longest_kw, total_kw_len)
                if score > best_score:
                    best_score = score
                    best_match = topic
        return best_match

    _LEVEL_CONTENT_KEYS = {
        "kids": "kids_content",
        "teen": "teen_content",
        "college": "college_content",
        "adult": "adult_content",
    }

    @staticmethod
    def get_response_for_level(topic: Dict[str, Any], learner_level: str) -> str:
        """Return level-specific curated content if available, else response_text."""
        level = (learner_level or "").strip().lower()
        key = TopicCatalog._LEVEL_CONTENT_KEYS.get(level)
        if key:
            curated = topic.get(key)
            if curated:
                return curated
        return topic.get("response_text", "")

    def build_visualization(self, topic: Dict[str, Any]) -> Optional[VisualizationPayload]:
        viz = topic.get("visualization")
        if not viz:
            return None
        return VisualizationPayload(
            viz_id=viz["viz_id"],
            viz_type=VisualizationType(viz["viz_type"]),
            title=viz["title"],
            data=viz.get("data", {}),
        )
