from pydantic import BaseModel, Field, model_validator
from typing import Self

class StudentData(BaseModel):
    anxiety_level: int                   = Field(..., ge=0, le=21,  description="Tingkat kecemasan (0-21)")
    self_esteem: int                     = Field(..., ge=0, le=30,  description="Kepercayaan diri (0-30)")
    mental_health_history: int           = Field(..., ge=0, le=1,   description="Riwayat kesehatan mental (0/1)")
    depression: int                      = Field(..., ge=0, le=27,  description="Tingkat depresi (0-27)")
    headache: int                        = Field(..., ge=0, le=5,   description="Intensitas sakit kepala (0-5)")
    sleep_quality: int                   = Field(..., ge=0, le=5,   description="Kualitas tidur (0-5)")
    academic_performance: int            = Field(..., ge=0, le=5,   description="Performa akademik (0-5)")
    study_load: int                      = Field(..., ge=0, le=5,   description="Beban belajar (0-5)")
    future_career_concerns: int          = Field(..., ge=0, le=5,   description="Kekhawatiran karier (0-5)")
    social_support: int                  = Field(..., ge=0, le=3,   description="Dukungan sosial (0-3)")
    peer_pressure: int                   = Field(..., ge=0, le=5,   description="Tekanan teman sebaya (0-5)")
    bullying: int                        = Field(..., ge=0, le=5,   description="Pengalaman bullying (0-5)")
    Age: int                             = Field(..., ge=17, le=60, description="Usia pengguna")
    Total_App_Usage_Hours: float         = Field(..., ge=0, le=24,  description="Total penggunaan aplikasi (jam/hari, max 24)")
    Daily_Screen_Time_Hours: float       = Field(..., ge=0, le=24,  description="Screen time harian (jam, max 24)")
    Number_of_Apps_Used: int             = Field(..., ge=0, le=50,  description="Jumlah aplikasi digunakan")
    Social_Media_Usage_Hours: float      = Field(..., ge=0, le=24,  description="Penggunaan media sosial (jam/hari)")
    Productivity_App_Usage_Hours: float  = Field(..., ge=0, le=24,  description="Penggunaan app produktivitas (jam/hari)")
    Gaming_App_Usage_Hours: float        = Field(..., ge=0, le=24,  description="Penggunaan app game (jam/hari)")
    digital_overload_score: float        = Field(..., ge=0,         description="Skor digital overload")
    productivity_balance_score: float    = Field(..., ge=0,         description="Skor keseimbangan produktivitas")
    study_stress_ratio: float            = Field(..., ge=0,         description="Rasio beban belajar terhadap tidur")
    mental_risk_score: int               = Field(..., ge=0,         description="Skor risiko mental gabungan")

    @model_validator(mode="after")
    def validate_digital_consistency(self) -> Self:
        digital_sum = (
            self.Social_Media_Usage_Hours
            + self.Productivity_App_Usage_Hours
            + self.Gaming_App_Usage_Hours
        )
        if self.Total_App_Usage_Hours > 0 and digital_sum > self.Total_App_Usage_Hours * 1.5:
            raise ValueError(
                "Jumlah Social_Media + Productivity + Gaming melebihi Total_App_Usage_Hours. "
                "Periksa kembali nilai yang dimasukkan."
            )

        all_digital_zero = (
            self.Total_App_Usage_Hours == 0
            and self.Daily_Screen_Time_Hours == 0
            and self.Number_of_Apps_Used == 0
            and self.Social_Media_Usage_Hours == 0
            and self.Productivity_App_Usage_Hours == 0
            and self.Gaming_App_Usage_Hours == 0
        )
        if all_digital_zero:
            raise ValueError(
                "Semua fitur digital bernilai 0. "
                "Masukkan data screen time dan penggunaan aplikasi yang sebenarnya. "
                "Nilai 0 semua tidak merepresentasikan pola penggunaan nyata."
            )

        return self


class PredictionResponse(BaseModel):
    stress_level: int
    stress_class: str
    confidence: float
    probabilities: dict
    rekomendasi: str
    ai_advice: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    version: str
