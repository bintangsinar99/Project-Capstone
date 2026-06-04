import numpy as np
import json
import os
import requests
import keras
import keras.ops as ops
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager

from schemas import StudentData, PredictionResponse, HealthResponse


@keras.saving.register_keras_serializable(package="StressDetection")
class GaussianNoiseLayer(keras.layers.Layer):
    def __init__(self, stddev=0.05, **kwargs):
        super().__init__(**kwargs)
        self.stddev = stddev

    def call(self, inputs, training=None):
        if training:
            noise = keras.random.normal(shape=ops.shape(inputs), stddev=self.stddev)
            return inputs + noise
        return inputs

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"stddev": self.stddev})
        return cfg


@keras.saving.register_keras_serializable(package="StressDetection")
class FeatureNormalizationLayer(keras.layers.Layer):
    def build(self, input_shape):
        n = input_shape[-1]
        self.gamma = self.add_weight(
            name="gamma", shape=(n,), initializer="ones", trainable=True
        )
        self.beta = self.add_weight(
            name="beta", shape=(n,), initializer="zeros", trainable=True
        )
        super().build(input_shape)

    def call(self, inputs):
        mean   = ops.mean(inputs, axis=-1, keepdims=True)
        std    = ops.std(inputs, axis=-1, keepdims=True) + 1e-6
        normed = (inputs - mean) / std
        return normed * self.gamma + self.beta

    def get_config(self):
        return super().get_config()


@keras.saving.register_keras_serializable(package="StressDetection")
class FocalCategoricalCrossentropy(keras.losses.Loss):
    def __init__(self, gamma=2.0, class_weights=None, **kwargs):
        super().__init__(**kwargs)
        self.gamma         = gamma
        self.class_weights = class_weights or {0: 1.0, 1: 1.0, 2: 1.0}
        self.cw_list       = [float(self.class_weights[i])
                               for i in sorted(self.class_weights.keys())]

    def call(self, y_true, y_pred):
        y_pred   = ops.clip(y_pred, 1e-7, 1.0 - 1e-7)
        y_flat   = ops.cast(ops.reshape(y_true, (-1,)), "int32")
        y_oh     = ops.cast(ops.one_hot(y_flat, len(self.cw_list)), "float32")
        w_tensor = ops.cast(self.cw_list, "float32")
        ce       = -y_oh * ops.log(y_pred)
        focal_w  = ops.power(1.0 - y_pred, self.gamma) * y_oh
        return ops.mean(ops.sum(focal_w * ce * w_tensor, axis=-1))

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"gamma": self.gamma, "class_weights": self.class_weights})
        return cfg


CUSTOM_OBJ = {
    "FocalCategoricalCrossentropy" : FocalCategoricalCrossentropy,
    "GaussianNoiseLayer"           : GaussianNoiseLayer,
    "FeatureNormalizationLayer"    : FeatureNormalizationLayer,
}

def _load_env(path=".env"):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env()

MODEL_PATH  = os.getenv("MODEL_PATH",  "../models/stress_mlp_final.keras")
SCALER_PATH = os.getenv("SCALER_PATH", "../models/scaler_params.json")
GROQ_KEY    = os.getenv("GROQ_API_KEY")
GROQ_URL    = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL  = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
VERSION     = "1.0.0"

CLASS_NAMES  = ["Rendah", "Sedang", "Tinggi"]
CLASS_ADVICE = {
    0: "Pola digital Anda terbilang sehat. Pertahankan kebiasaan ini.",
    1: "Terdapat indikasi stres sedang. Pertimbangkan mengurangi screen time dan memperbanyak istirahat.",
    2: "Indikasi stres tinggi terdeteksi. Evaluasi jadwal digital dan tingkatkan kualitas tidur.",
}

state = {
    "ensemble"   : None,
    "weights"    : None,
    "temperature": 1.0,
    "inf_mean"   : None,
    "inf_scale"  : None,
    "inf_feats"  : None,
}


ENSEMBLE_META_PATH = os.getenv("ENSEMBLE_META_PATH", "../models/ensemble_meta.json")
MODELS_DIR         = os.path.dirname(os.path.abspath(ENSEMBLE_META_PATH))


def apply_temperature(probs: np.ndarray, temperature: float) -> np.ndarray:
    logits = np.log(np.clip(probs, 1e-7, 1.0))
    scaled = logits / temperature
    exp_s  = np.exp(scaled - scaled.max())
    return exp_s / exp_s.sum()


def load_artifacts():
    meta_path = ENSEMBLE_META_PATH
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)

        models_dir = os.path.dirname(os.path.abspath(meta_path))

        state["ensemble"] = [
            keras.models.load_model(
                os.path.join(models_dir, os.path.basename(p)),
                custom_objects=CUSTOM_OBJ
            )
            for p in meta["ensemble_paths"]
        ]
        state["weights"]     = np.array(meta["ensemble_weights"])
        state["temperature"] = float(meta.get("temperature", 1.0))

        sc_path = os.path.join(models_dir, os.path.basename(meta["scaler_path"]))
        with open(sc_path) as f:
            sc = json.load(f)
        state["inf_feats"] = meta["features"]
        print("Loaded ensemble: {} models, temperature={:.2f}".format(
            len(state["ensemble"]), state["temperature"]))
    else:
        state["ensemble"]    = [keras.models.load_model(MODEL_PATH, custom_objects=CUSTOM_OBJ)]
        state["weights"]     = np.array([1.0])
        state["temperature"] = 1.0
        with open(SCALER_PATH) as f:
            sc = json.load(f)
        state["inf_feats"] = sc["features"]
        print("Loaded single model (no ensemble meta found)")

    state["inf_mean"]  = np.array(sc["mean_"])
    state["inf_scale"] = np.array(sc["scale_"])


def add_engineered_features(d: dict) -> dict:
    d["screen_to_sleep_ratio"]    = d["Daily_Screen_Time_Hours"] / (d["sleep_quality"] + 1)
    d["social_vs_productivity"]   = d["Social_Media_Usage_Hours"] / (d["Productivity_App_Usage_Hours"] + 0.01)
    d["mental_digital_composite"] = d["mental_risk_score"] * d["digital_overload_score"]
    d["anxiety_depression_sum"]   = d["anxiety_level"] + d["depression"]
    d["support_pressure_diff"]    = d["social_support"] - d["peer_pressure"]
    d["passive_screen_ratio"]     = (
        d["Social_Media_Usage_Hours"] + d["Gaming_App_Usage_Hours"]
    ) / (d["Total_App_Usage_Hours"] + 0.01)
    d["academic_stress_index"]    = d["study_load"] * d["future_career_concerns"]
    d["wellbeing_deficit"]        = (
        d["anxiety_level"] + d["depression"] + d["peer_pressure"]
    ) - (d["social_support"] * 2 + d["sleep_quality"])
    return d


def get_ai_advice(stress_class: str, confidence: float, data: dict) -> str:
    if not GROQ_KEY:
        return "Isi GROQ_API_KEY pada environment variable untuk mengaktifkan saran AI."

    prompt = (
        "Kamu adalah konselor kesehatan mental yang empatik untuk mahasiswa.\n\n"
        "Hasil analisis: tingkat stres {} (confidence: {:.1f}%).\n"
        "Data: screen time={} jam, media sosial={} jam, kualitas tidur={}/5, "
        "kecemasan={}/21, beban belajar={}/5, dukungan sosial={}/3.\n\n"
        "Berikan saran empatik, personal, dan actionable dalam 3-4 kalimat. "
        "Gunakan bahasa Indonesia yang hangat."
    ).format(
        stress_class, confidence * 100,
        data.get("Daily_Screen_Time_Hours"),
        data.get("Social_Media_Usage_Hours"),
        data.get("sleep_quality"),
        data.get("anxiety_level"),
        data.get("study_load"),
        data.get("social_support"),
    )

    try:
        resp = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 500,
            },
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"AI advice tidak tersedia: {str(e)}"


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_artifacts()
    yield


app = FastAPI(
    title="Stress Detection API",
    description="REST API untuk deteksi tingkat stres mahasiswa berbasis pola aktivitas digital.",
    version=VERSION,
    lifespan=lifespan,
)


@app.get("/", tags=["General"])
def root():
    return {"service": "Stress Detection API", "status": "running", "version": VERSION}


@app.get("/health", response_model=HealthResponse, tags=["General"])
def health():
    return HealthResponse(
        status="ok",
        model_loaded=state["ensemble"] is not None,
        version=VERSION,
    )


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
def predict(data: StudentData):
    if state["ensemble"] is None:
        raise HTTPException(status_code=503, detail="Model belum dimuat.")

    try:
        d        = add_engineered_features(data.model_dump())
        x        = np.array([d[f] for f in state["inf_feats"]], dtype=np.float32)
        x_scaled = (x - state["inf_mean"]) / state["inf_scale"]

        probs_all = [m.predict(x_scaled.reshape(1, -1), verbose=0)[0]
                     for m in state["ensemble"]]
        probs_raw = np.average(probs_all, axis=0, weights=state["weights"])
        probs     = apply_temperature(probs_raw, state["temperature"])
        cls       = int(np.argmax(probs))

        ai_text = get_ai_advice(CLASS_NAMES[cls], float(probs[cls]), data.model_dump())

        return PredictionResponse(
            stress_level  = cls,
            stress_class  = CLASS_NAMES[cls],
            confidence    = round(float(probs[cls]), 4),
            probabilities = {
                "rendah": round(float(probs[0]), 4),
                "sedang": round(float(probs[1]), 4),
                "tinggi": round(float(probs[2]), 4),
            },
            rekomendasi   = CLASS_ADVICE[cls],
            ai_advice     = ai_text,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=False)
