from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from app.schemas import PredictionResponse


class HistoryStore:
    def __init__(self, file_path: Path | None = None):
        self.file_path = file_path or Path(__file__).resolve().parents[2] / "data" / "predictions.json"
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.write_text("[]", encoding="utf-8")

    def all(self, username: str | None = None) -> list[PredictionResponse]:
        items = self._read()
        if username:
            items = [item for item in items if item.get("username") == username]
        return [PredictionResponse.model_validate(item) for item in items]

    def count_all(self) -> int:
        return len(self._read())

    def recent_raw(self, limit: int = 5) -> list[dict]:
        return self._read()[:limit]

    def get(self, prediction_id: str, username: str | None = None) -> PredictionResponse | None:
        for item in self.all(username):
            if item.id == prediction_id:
                return item
        return None

    def add(self, prediction: dict, username: str | None = None) -> PredictionResponse:
        items = self._read()
        record = {
            "id": str(uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "username": username,
            **prediction,
        }
        items.insert(0, record)
        self._write(items)
        return PredictionResponse.model_validate(record)

    def delete(self, prediction_id: str, username: str | None = None) -> bool:
        items = self._read()
        next_items = [
            item
            for item in items
            if not (
                item.get("id") == prediction_id
                and (username is None or item.get("username") == username)
            )
        ]
        if len(next_items) == len(items):
            return False
        self._write(next_items)
        return True

    def _read(self) -> list[dict]:
        try:
            return json.loads(self.file_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _write(self, items: list[dict]) -> None:
        self.file_path.write_text(json.dumps(items, indent=2), encoding="utf-8")
