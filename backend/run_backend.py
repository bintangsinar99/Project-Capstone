from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
LOCAL_DEPS = ROOT / ".python-deps"

for path in (LOCAL_DEPS, ROOT):
    if path.exists():
        sys.path.insert(0, str(path))

import uvicorn


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)

