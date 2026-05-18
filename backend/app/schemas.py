from datetime import datetime

from pydantic import BaseModel, Field


class StudentData(BaseModel):
    anxiety_level: int = Field(..., ge=0, le=21)
    self_esteem: int = Field(..., ge=0, le=30)
    mental_health_history: int = Field(..., ge=0, le=1)
    depression: int = Field(..., ge=0, le=27)
    headache: int = Field(..., ge=0, le=5)
    sleep_quality: int = Field(..., ge=0, le=5)
    academic_performance: int = Field(..., ge=0, le=5)
    study_load: int = Field(..., ge=0, le=5)
    future_career_concerns: int = Field(..., ge=0, le=5)
    social_support: int = Field(..., ge=0, le=3)
    peer_pressure: int = Field(..., ge=0, le=5)
    bullying: int = Field(..., ge=0, le=5)
    Age: int = Field(..., ge=17, le=60)
    Total_App_Usage_Hours: float = Field(..., ge=0)
    Daily_Screen_Time_Hours: float = Field(..., ge=0)
    Number_of_Apps_Used: int = Field(..., ge=0)
    Social_Media_Usage_Hours: float = Field(..., ge=0)
    Productivity_App_Usage_Hours: float = Field(..., ge=0)
    Gaming_App_Usage_Hours: float = Field(..., ge=0)
    digital_overload_score: float = Field(..., ge=0)
    productivity_balance_score: float = Field(..., ge=0)
    study_stress_ratio: float = Field(..., ge=0)
    mental_risk_score: int = Field(..., ge=0)


class StressPredictionResult(BaseModel):
    stress_level: int
    stress_class: str
    confidence: float = Field(..., ge=0, le=1)
    probabilities: dict[str, float]
    recommendation: str
    ai_advice: str


class PredictionResponse(BaseModel):
    id: str
    student_data: StudentData
    result: StressPredictionResult
    created_at: datetime


class HealthResponse(BaseModel):
    status: str
    service: str
    model_loaded: bool
    model_available: bool
    model_mode: str | None = None
    n_models: int = 0
    version: str
    detail: str | None = None
