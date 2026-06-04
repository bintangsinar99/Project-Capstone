# Stress Detection pada Mahasiswa

Sistem deteksi dini tingkat stres mahasiswa berdasarkan pola aktivitas digital dan indikator psikologis, dibangun menggunakan Multi-Layer Perceptron (MLP) dengan Keras Functional API dan dilengkapi REST API berbasis FastAPI.

---

## Struktur Proyek

```
stress-detection/
├── notebooks/
│   └── stress_detection_training.ipynb   # Pipeline training lengkap
├── api/
│   ├── api.py                            # FastAPI application
│   └── schemas.py                        # Pydantic request/response schemas
├── models/                               # Output training (dibuat otomatis)
│   ├── stress_mlp_final.keras
│   ├── stress_mlp_final.h5
│   ├── scaler_params.json
│   └── *.png                             # Visualisasi training
├── data/
│   ├── final_clean_dataset.csv
│   └── data_dictionary.csv
├── requirements.txt
└── README.md
```

---

## Dataset

| Kolom | Deskripsi | Tipe |
|---|---|---|
| anxiety_level | Tingkat kecemasan (0-21) | int |
| self_esteem | Kepercayaan diri (0-30) | int |
| depression | Tingkat depresi (0-27) | int |
| sleep_quality | Kualitas tidur (0-5) | int |
| Daily_Screen_Time_Hours | Screen time harian (jam) | float |
| Social_Media_Usage_Hours | Penggunaan media sosial (jam/hari) | float |
| digital_overload_score | Skor digital overload gabungan | float |
| mental_risk_score | Skor risiko mental gabungan | int |
| **stress_level** | **Target: 0=Rendah, 1=Sedang, 2=Tinggi** | int |

Dataset: 1000 sampel, 23 fitur, distribusi kelas seimbang.

---

## Arsitektur Model

```
Input (31 fitur setelah FE)
  └── FeatureNormalizationLayer   (custom layer: per-sample normalization)
  └── GaussianNoiseLayer          (custom layer: noise augmentation, training only)
  └── Dense(256) + BN + Swish + Dropout
  └── Dense(256) + BN + Swish + Dropout  ──┐
  └── Add (residual skip)         ◄─────────┘
  └── Dense(128) + BN + Swish + Dropout
  └── Dense(128) + BN + Swish + Dropout  ──┐
  └── Add (residual skip)         ◄─────────┘
  └── Dense(64)  + BN + Swish + Dropout
  └── Dense(32)  + BN + Swish
  └── Dense(3, softmax)           (output: Rendah / Sedang / Tinggi)
```

**Loss:** Focal Categorical Crossentropy (custom, dengan class weights)  
**Optimizer:** Adam + Warmup Cosine Decay  
**Callbacks:** StressMonitorCallback (early stop by target acc) + WarmupCosineScheduler

---

## Cara Penggunaan

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Jalankan Training

Buka dan jalankan notebook secara berurutan:

```bash
jupyter notebook notebooks/stress_detection_training.ipynb
```

Artefak hasil training akan tersimpan di folder `models/`.

### 3. Jalankan REST API

```bash
cd api
python api.py
```

API berjalan di `http://localhost:8000`.

Dokumentasi interaktif tersedia di `http://localhost:8000/docs`.

### 4. Aktifkan Saran AI (Groq)

Set environment variable sebelum menjalankan API:

```bash
# Windows
set GROQ_API_KEY=your_api_key_here

# Linux / macOS
export GROQ_API_KEY=your_api_key_here
```

Dapatkan API key gratis di: https://console.groq.com

Model default yang digunakan: `llama-3.3-70b-versatile`  
Ganti model via env var jika diperlukan:

```bash
set GROQ_MODEL=llama-3.1-8b-instant
```

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/` | Info service |
| GET | `/health` | Status model |
| POST | `/predict` | Prediksi tingkat stres |
| GET | `/docs` | Swagger UI |

### Contoh Request

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "anxiety_level": 18,
    "self_esteem": 5,
    "mental_health_history": 1,
    "depression": 20,
    "headache": 4,
    "sleep_quality": 1,
    "academic_performance": 1,
    "study_load": 5,
    "future_career_concerns": 5,
    "social_support": 1,
    "peer_pressure": 5,
    "bullying": 4,
    "Age": 22,
    "Total_App_Usage_Hours": 10.5,
    "Daily_Screen_Time_Hours": 12.0,
    "Number_of_Apps_Used": 25,
    "Social_Media_Usage_Hours": 4.5,
    "Productivity_App_Usage_Hours": 0.5,
    "Gaming_App_Usage_Hours": 4.0,
    "digital_overload_score": 20.0,
    "productivity_balance_score": 0.05,
    "study_stress_ratio": 4.5,
    "mental_risk_score": 50
  }'
```

### Contoh Response

```json
{
  "stress_level": 2,
  "stress_class": "Tinggi",
  "confidence": 0.9341,
  "probabilities": {
    "rendah": 0.0124,
    "sedang": 0.0535,
    "tinggi": 0.9341
  },
  "rekomendasi": "Indikasi stres tinggi terdeteksi. Evaluasi jadwal digital dan tingkatkan kualitas tidur.",
  "ai_advice": "..."
}
```

---

## Feature Engineering

8 fitur turunan ditambahkan sebelum training:

| Fitur Baru | Formula |
|---|---|
| screen_to_sleep_ratio | Daily_Screen_Time / (sleep_quality + 1) |
| social_vs_productivity | Social_Media / (Productivity + 0.01) |
| mental_digital_composite | mental_risk_score × digital_overload_score |
| anxiety_depression_sum | anxiety_level + depression |
| support_pressure_diff | social_support - peer_pressure |
| passive_screen_ratio | (Social_Media + Gaming) / Total_App |
| academic_stress_index | study_load × future_career_concerns |
| wellbeing_deficit | (anxiety + depression + peer_pressure) - (social_support×2 + sleep_quality) |
