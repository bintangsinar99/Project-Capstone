from pathlib import Path

from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.schemas import HealthResponse, PredictionResponse, StudentData
from app.services.history_store import HistoryStore
from app.services.stress_model import model_status, predict_stress
from app.services.user_store import UserStore

app = FastAPI(
    title="MindTrack Stress Detection API",
    description="RESTful API untuk deteksi tingkat stres mahasiswa berbasis model deep learning.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

history_store = HistoryStore()
user_store = UserStore()
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


# ── Auth schemas ────────────────────────────────────────────────────────────

class AuthPayload(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    username: str
    token: str
    role: str = "user"


class AdminOverviewResponse(BaseModel):
    api_status: str
    auth_store: str
    model_loaded: bool
    model_available: bool
    model_mode: str | None = None
    n_models: int
    user_count: int
    prediction_count: int
    recent_predictions: list[dict]


# ── Auth endpoints ──────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: AuthPayload):
    username = payload.username.strip()
    password = payload.password

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi.")
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username minimal 3 karakter.")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password minimal 6 karakter.")
    if user_store.username_exists(username):
        raise HTTPException(status_code=409, detail="Username sudah digunakan.")

    return user_store.register(username, password)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(payload: AuthPayload):
    username = payload.username.strip()
    password = payload.password

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username dan password wajib diisi.")

    result = user_store.login(username, password)
    if result is None:
        raise HTTPException(status_code=401, detail="Username atau password salah.")

    return result


@app.get("/api/admin/overview", response_model=AdminOverviewResponse)
def admin_overview(
    username: str | None = Header(default=None, alias="X-MindTrack-Username"),
    token: str | None = Header(default=None, alias="X-MindTrack-Token"),
    role: str | None = Header(default=None, alias="X-MindTrack-Role"),
):
    if not user_store.is_admin_session(username, token, role):
        raise HTTPException(status_code=403, detail="Admin access required")

    status_data = model_status()
    return AdminOverviewResponse(
        api_status="online",
        auth_store=user_store.mode,
        model_loaded=status_data["loaded"],
        model_available=status_data["available"],
        model_mode=status_data["mode"],
        n_models=status_data["n_models"],
        user_count=user_store.count_users(),
        prediction_count=history_store.count_all(),
        recent_predictions=history_store.recent_raw(5),
    )


# ── Health ──────────────────────────────────────────────────────────────────

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    status_data = model_status()
    return HealthResponse(
        status="ok",
        service="mindtrack-api",
        model_loaded=status_data["loaded"],
        model_available=status_data["available"],
        model_mode=status_data["mode"],
        n_models=status_data["n_models"],
        version="1.0.0",
        detail=status_data["detail"],
    )


# ── Predictions ─────────────────────────────────────────────────────────────

@app.post(
    "/api/predictions",
    response_model=PredictionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_prediction(
    payload: StudentData,
    username: str | None = Header(default=None, alias="X-MindTrack-Username"),
):
    try:
        prediction = predict_stress(payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return history_store.add(prediction, username=username)


@app.get("/api/predictions", response_model=list[PredictionResponse])
def list_predictions(username: str | None = Header(default=None, alias="X-MindTrack-Username")):
    return history_store.all(username=username)


@app.get("/api/predictions/{prediction_id}", response_model=PredictionResponse)
def get_prediction(
    prediction_id: str,
    username: str | None = Header(default=None, alias="X-MindTrack-Username"),
):
    prediction = history_store.get(prediction_id, username=username)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return prediction


@app.delete("/api/predictions/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(
    prediction_id: str,
    username: str | None = Header(default=None, alias="X-MindTrack-Username"),
):
    deleted = history_store.delete(prediction_id, username=username)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return None


# ── Frontend static serving ─────────────────────────────────────────────────

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )


@app.get("/", include_in_schema=False)
def serve_frontend_index():
    index_path = FRONTEND_DIST / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found. Run `npm run build` in frontend.")
    return FileResponse(index_path)


@app.get("/{path:path}", include_in_schema=False)
def serve_frontend_app(path: str):
    if path.startswith(("api/", "docs", "openapi.json", "redoc")):
        raise HTTPException(status_code=404, detail="Not found")

    requested_file = FRONTEND_DIST / path
    if requested_file.exists() and requested_file.is_file():
        return FileResponse(requested_file)

    index_path = FRONTEND_DIST / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="Frontend build not found. Run `npm run build` in frontend.")
    return FileResponse(index_path)
