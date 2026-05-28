from __future__ import annotations

import json
import os
import zipfile
from pathlib import Path
from typing import Any

from app.schemas import StudentData


BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"


def _load_local_env() -> None:
    for env_path in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and value:
                os.environ[key] = value


_load_local_env()

MODEL_PATH = Path(os.getenv("MODEL_PATH", MODEL_DIR / "stress_mlp_final.keras"))
ENSEMBLE_META_PATH = Path(os.getenv("ENSEMBLE_META_PATH", MODEL_DIR / "ensemble_meta.json"))
SCALER_PATH = Path(os.getenv("SCALER_PATH", MODEL_DIR / "scaler_params.json"))
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_FALLBACK_MODELS = [
    GROQ_MODEL,
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
]
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

CLASS_NAMES = ["Rendah", "Sedang", "Tinggi"]
CLASS_ADVICE = {
    0: "Pola digital dan indikator psikologis terpantau rendah risiko. Pertahankan ritme tidur dan penggunaan aplikasi yang sehat.",
    1: "Ada indikasi stres sedang. Coba kurangi screen time berlebih, rapikan beban belajar, dan sisihkan waktu istirahat yang konsisten.",
    2: "Indikasi stres tinggi terdeteksi. Evaluasi jadwal digital, kualitas tidur, dan pertimbangkan berbicara dengan dosen wali atau konselor kampus.",
}

state: dict[str, Any] = {
    "model": None,
    "models": None,
    "model_mode": None,
    "model_paths": None,
    "weights": None,
    "mean": None,
    "scale": None,
    "features": None,
    "load_error": None,
}


def load_artifacts() -> None:
    if state["model"] is not None or state["models"] is not None:
        return

    try:
        import keras
        import keras.ops as ops
        import numpy as np
    except Exception as exc:
        state["load_error"] = (
            "Dependency ML belum tersedia. Install Python 3.11/3.12 lalu jalankan "
            "`pip install -r backend/requirements.txt`."
        )
        raise RuntimeError(state["load_error"]) from exc

    if not SCALER_PATH.exists():
        state["load_error"] = f"Scaler tidak ditemukan: {SCALER_PATH}"
        raise FileNotFoundError(state["load_error"])

    custom_objects = _build_custom_objects(keras, ops)
    ensemble_paths, ensemble_weights, ensemble_features = _read_ensemble_meta()

    if ensemble_paths:
        missing_paths = [str(path) for path in ensemble_paths if not path.exists()]
        if missing_paths:
            state["load_error"] = f"Model ensemble tidak ditemukan: {', '.join(missing_paths)}"
            raise FileNotFoundError(state["load_error"])

        state["models"] = [_load_keras_model(keras, custom_objects, path) for path in ensemble_paths]
        state["weights"] = np.array(ensemble_weights, dtype=np.float32)
        state["weights"] = state["weights"] / state["weights"].sum()
        state["model_mode"] = "ensemble"
        state["model_paths"] = [str(path) for path in ensemble_paths]
    else:
        if not MODEL_PATH.exists():
            state["load_error"] = f"Model tidak ditemukan: {MODEL_PATH}"
            raise FileNotFoundError(state["load_error"])

        state["model"] = _load_keras_model(keras, custom_objects, MODEL_PATH)
        state["weights"] = None
        state["model_mode"] = "single"
        state["model_paths"] = [str(MODEL_PATH)]

    with SCALER_PATH.open(encoding="utf-8") as file:
        scaler = json.load(file)

    state["mean"] = np.array(scaler["mean_"], dtype=np.float32)
    state["scale"] = np.array(scaler["scale_"], dtype=np.float32)
    state["features"] = ensemble_features or scaler["features"]
    state["load_error"] = None


def predict_stress(data: StudentData) -> dict:
    load_artifacts()

    import numpy as np

    payload = add_engineered_features(data.model_dump())
    model_input = _prepare_model_input(payload, np)
    probabilities = _predict_probabilities(model_input, np)
    stress_level = int(np.argmax(probabilities))
    confidence = round(float(probabilities[stress_level]), 4)

    return {
        "student_data": data.model_dump(),
        "result": {
            "stress_level": stress_level,
            "stress_class": CLASS_NAMES[stress_level],
            "confidence": confidence,
            "probabilities": {
                "rendah": round(float(probabilities[0]), 4),
                "sedang": round(float(probabilities[1]), 4),
                "tinggi": round(float(probabilities[2]), 4),
            },
            "recommendation": CLASS_ADVICE[stress_level],
            "ai_advice": get_ai_advice(CLASS_NAMES[stress_level], confidence, data.model_dump()),
        },
    }


def _prepare_model_input(payload: dict, np):
    feature_values = np.array([payload[feature] for feature in state["features"]], dtype=np.float32)
    scaled_values = (feature_values - state["mean"]) / state["scale"]
    return scaled_values.reshape(1, -1)


def _predict_probabilities(model_input, np):
    if not state["models"]:
        return state["model"].predict(model_input, verbose=0)[0]

    weighted_probabilities = [
        model.predict(model_input, verbose=0)[0] * weight
        for model, weight in zip(state["models"], state["weights"])
    ]
    return np.sum(weighted_probabilities, axis=0)


def add_engineered_features(data: dict) -> dict:
    data["screen_to_sleep_ratio"] = data["Daily_Screen_Time_Hours"] / (data["sleep_quality"] + 1)
    data["social_vs_productivity"] = data["Social_Media_Usage_Hours"] / (
        data["Productivity_App_Usage_Hours"] + 0.01
    )
    data["mental_digital_composite"] = data["mental_risk_score"] * data["digital_overload_score"]
    data["anxiety_depression_sum"] = data["anxiety_level"] + data["depression"]
    data["support_pressure_diff"] = data["social_support"] - data["peer_pressure"]
    data["passive_screen_ratio"] = (
        data["Social_Media_Usage_Hours"] + data["Gaming_App_Usage_Hours"]
    ) / (data["Total_App_Usage_Hours"] + 0.01)
    data["academic_stress_index"] = data["study_load"] * data["future_career_concerns"]
    data["wellbeing_deficit"] = (
        data["anxiety_level"] + data["depression"] + data["peer_pressure"]
    ) - (data["social_support"] * 2 + data["sleep_quality"])
    return data


def get_ai_advice(stress_class: str, confidence: float, data: dict) -> str:
    _load_local_env()
    api_key = os.getenv("GROQ_API_KEY", GROQ_API_KEY).strip()
    if not api_key:
        return "Saran AI generatif belum aktif. Isi GROQ_API_KEY pada environment variable untuk mengaktifkannya."

    try:
        import requests

        prompt = (
            "Kamu adalah konselor kesehatan mental yang empatik untuk mahasiswa. "
            f"Hasil analisis: tingkat stres {stress_class} dengan confidence {confidence * 100:.1f}%. "
            f"Data: screen time {data['Daily_Screen_Time_Hours']} jam, media sosial "
            f"{data['Social_Media_Usage_Hours']} jam, kualitas tidur {data['sleep_quality']}/5, "
            f"kecemasan {data['anxiety_level']}/21, beban belajar {data['study_load']}/5, "
            f"dukungan sosial {data['social_support']}/3. "
            "Berikan saran empatik, personal, dan actionable dalam 3 kalimat bahasa Indonesia."
        )
        model_candidates = _groq_model_candidates()
        last_error = None
        for model_name in model_candidates:
            response = requests.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 260,
                },
                timeout=15,
            )
            if response.ok:
                return response.json()["choices"][0]["message"]["content"]

            last_error = _groq_error_message(response)
            if response.status_code not in {400, 403, 404}:
                break

        return f"Saran AI generatif tidak tersedia: {last_error or 'Groq API request failed.'}"
    except Exception as exc:
        return f"Saran AI generatif tidak tersedia: {exc}"


def _groq_model_candidates() -> list[str]:
    candidates = [os.getenv("GROQ_MODEL", GROQ_MODEL).strip(), *GROQ_FALLBACK_MODELS]
    unique = []
    for candidate in candidates:
        if candidate and candidate not in unique:
            unique.append(candidate)
    return unique


def _groq_error_message(response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = response.text
    return f"{response.status_code} {response.reason}: {payload}"


def is_model_available() -> bool:
    ensemble_paths, _, _ = _read_ensemble_meta()
    if ensemble_paths:
        return SCALER_PATH.exists() and all(path.exists() for path in ensemble_paths)
    return MODEL_PATH.exists() and SCALER_PATH.exists()


def model_status() -> dict:
    ensemble_paths, _, _ = _read_ensemble_meta()
    available_mode = "ensemble" if ensemble_paths else "single"
    available_count = len(ensemble_paths) if ensemble_paths else (1 if MODEL_PATH.exists() else 0)

    return {
        "loaded": state["model"] is not None or state["models"] is not None,
        "available": is_model_available(),
        "detail": state["load_error"],
        "mode": state["model_mode"] or available_mode,
        "n_models": len(state["models"] or []) or (1 if state["model"] is not None else available_count),
    }


def _load_keras_model(keras, custom_objects, model_path: Path):
    try:
        return keras.models.load_model(
            model_path,
            custom_objects=custom_objects,
            compile=False,
            safe_mode=False,
        )
    except TypeError as exc:
        if "quantization_config" not in str(exc):
            raise
        sanitized_path = _create_sanitized_model_copy(model_path)
        return keras.models.load_model(
            sanitized_path,
            custom_objects=custom_objects,
            compile=False,
            safe_mode=False,
        )


def _create_sanitized_model_copy(model_path: Path) -> Path:
    sanitized_path = model_path.with_name(f"{model_path.stem}.sanitized{model_path.suffix}")

    if sanitized_path.exists() and sanitized_path.stat().st_mtime >= model_path.stat().st_mtime:
        return sanitized_path

    with zipfile.ZipFile(model_path, "r") as source, zipfile.ZipFile(
        sanitized_path, "w", compression=zipfile.ZIP_DEFLATED
    ) as target:
        for item in source.infolist():
            content = source.read(item.filename)
            if item.filename == "config.json":
                config = json.loads(content.decode("utf-8"))
                _remove_unsupported_keras_keys(config)
                content = json.dumps(config).encode("utf-8")
            target.writestr(item, content)

    return sanitized_path


def _remove_unsupported_keras_keys(value):
    if isinstance(value, dict):
        value.pop("quantization_config", None)
        for child in value.values():
            _remove_unsupported_keras_keys(child)
    elif isinstance(value, list):
        for child in value:
            _remove_unsupported_keras_keys(child)


def _read_ensemble_meta() -> tuple[list[Path], list[float], list[str] | None]:
    if not ENSEMBLE_META_PATH.exists():
        return [], [], None

    with ENSEMBLE_META_PATH.open(encoding="utf-8") as file:
        meta = json.load(file)

    paths = [ENSEMBLE_META_PATH.parent / path for path in meta.get("ensemble_paths", [])]
    weights = [float(weight) for weight in meta.get("ensemble_weights", [])]
    features = meta.get("features")

    if not paths:
        return [], [], features

    if len(paths) != len(weights):
        raise ValueError("Jumlah model ensemble dan bobot ensemble tidak sama.")

    return paths, weights, features


def _build_custom_objects(keras, ops):
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
            config = super().get_config()
            config.update({"stddev": self.stddev})
            return config

    @keras.saving.register_keras_serializable(package="StressDetection")
    class FeatureNormalizationLayer(keras.layers.Layer):
        def build(self, input_shape):
            feature_count = input_shape[-1]
            self.gamma = self.add_weight(
                name="gamma", shape=(feature_count,), initializer="ones", trainable=True
            )
            self.beta = self.add_weight(
                name="beta", shape=(feature_count,), initializer="zeros", trainable=True
            )
            super().build(input_shape)

        def call(self, inputs):
            mean = ops.mean(inputs, axis=-1, keepdims=True)
            std = ops.std(inputs, axis=-1, keepdims=True) + 1e-6
            normed = (inputs - mean) / std
            return normed * self.gamma + self.beta

    @keras.saving.register_keras_serializable(package="StressDetection")
    class FocalCategoricalCrossentropy(keras.losses.Loss):
        def __init__(self, gamma=2.0, class_weights=None, **kwargs):
            super().__init__(**kwargs)
            self.gamma = gamma
            self.class_weights = class_weights or {0: 1.0, 1: 1.0, 2: 1.0}
            self.cw_list = [float(self.class_weights[index]) for index in sorted(self.class_weights.keys())]

        def call(self, y_true, y_pred):
            y_pred = ops.clip(y_pred, 1e-7, 1.0 - 1e-7)
            y_flat = ops.cast(ops.reshape(y_true, (-1,)), "int32")
            y_one_hot = ops.cast(ops.one_hot(y_flat, len(self.cw_list)), "float32")
            weight_tensor = ops.cast(self.cw_list, "float32")
            cross_entropy = -y_one_hot * ops.log(y_pred)
            focal_weight = ops.power(1.0 - y_pred, self.gamma) * y_one_hot
            return ops.mean(ops.sum(focal_weight * cross_entropy * weight_tensor, axis=-1))

        def get_config(self):
            config = super().get_config()
            config.update({"gamma": self.gamma, "class_weights": self.class_weights})
            return config

    return {
        "GaussianNoiseLayer": GaussianNoiseLayer,
        "FeatureNormalizationLayer": FeatureNormalizationLayer,
        "FocalCategoricalCrossentropy": FocalCategoricalCrossentropy,
    }
