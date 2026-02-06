import json
from pathlib import Path
from typing import Any, Dict, List, Optional

from .models import VisualizationPayload, VisualizationType


DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "demo_topics.json"


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
        best_len = 0
        for topic in self._topics:
            for keyword in topic.get("keywords", []):
                if keyword and keyword in text:
                    if len(keyword) > best_len:
                        best_match = topic
                        best_len = len(keyword)
        return best_match

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
