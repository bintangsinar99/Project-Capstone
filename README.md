# MindTrack Capstone

MindTrack adalah aplikasi web untuk membantu mahasiswa melakukan screening tingkat stres berdasarkan indikator psikologis, akademik, dan aktivitas digital. Aplikasi ini menampilkan hasil prediksi, riwayat assessment, serta rekomendasi tindakan sederhana yang dapat dilakukan pengguna.

## Tech Stack

- Frontend: React, Vite, Axios, Lucide React
- Backend: FastAPI, Uvicorn, Pydantic
- Model: TensorFlow/Keras ensemble atau remote model API
- Database: PostgreSQL untuk akun user, file JSON untuk riwayat lokal jika database tidak dikonfigurasi
- Deployment: Vercel untuk frontend, Render untuk backend, Hugging Face Space untuk model API

## Struktur Project

```text
frontend/       React + Vite app
backend/        FastAPI RESTful API
backend/app/    Source code backend
backend/models/ Model lokal dan metadata ensemble
backend/data/   Data lokal untuk fallback/testing
docs/           Dokumen dan visual pendukung
notebooks/      Notebook eksperimen model
AI ENGINEER/    Artefak model, notebook, dan data science
dashboard/      Dashboard Streamlit opsional
```

## Menjalankan Project Lokal

### 1. Backend

Gunakan Python 3.11 agar dependency TensorFlow kompatibel.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend tersedia di:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
```

### 2. Frontend

Buka terminal baru dari root project.

```bash
cd frontend
npm install
npm run dev
```

Frontend tersedia di:

```text
http://127.0.0.1:5173
```

## Environment Variable

### Backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu isi sesuai kebutuhan.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_SSLMODE=require
MODEL_API_URL=https://zidanpw-mindtrack-stress-detection-api.hf.space
GROQ_API_KEY=isi_api_key_groq_jika_digunakan
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://domain-frontend.vercel.app
```

Catatan:

- `DATABASE_URL` dipakai untuk login/register berbasis PostgreSQL.
- `MODEL_API_URL` dipakai jika prediksi diarahkan ke model API terpisah.
- `GROQ_API_KEY` bersifat opsional untuk saran AI generatif.
- Jangan commit file `.env` asli karena berisi password dan API key.

### Frontend

Untuk deployment frontend di Vercel, isi:

```env
VITE_BACKEND_URL=https://url-backend-render.onrender.com
VITE_MODEL_API_URL=https://zidanpw-mindtrack-stress-detection-api.hf.space/
```

## Build dan Deployment

### Backend di Render

Pengaturan umum:

```text
Root Directory : backend
Build Command  : pip install -r requirements.txt
Start Command  : python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Environment penting di Render:

```text
PYTHON_VERSION=3.11.11
DATABASE_URL=connection-string-postgresql
DATABASE_SSLMODE=require
MODEL_API_URL=https://zidanpw-mindtrack-stress-detection-api.hf.space
GROQ_API_KEY=api-key-groq
CORS_ORIGINS=https://domain-frontend.vercel.app,http://localhost:5173,http://127.0.0.1:5173
```

Tes backend setelah deploy:

```text
https://url-backend-render.onrender.com/api/health
```

### Frontend di Vercel

Pengaturan umum:

```text
Root Directory   : frontend
Framework Preset : Vite
Install Command  : npm install
Build Command    : npm run build
Output Directory : dist
```

Setelah deployment berhasil, pastikan `VITE_BACKEND_URL` mengarah ke backend Render.

## Endpoint RESTful

```text
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
POST   /api/predictions
GET    /api/predictions
GET    /api/predictions/{prediction_id}
DELETE /api/predictions/{prediction_id}
```

## Input Utama Model

Form prediksi memakai indikator seperti:

- anxiety level
- self esteem
- depression
- sleep quality
- study load
- social support
- daily screen time
- social media usage
- gaming app usage
- digital overload score
- mental risk score

Backend menyesuaikan payload sebelum dikirim ke model lokal atau model API remote.

## Output Prediksi

API mengembalikan:

- `stress_level`
- `stress_class`
- `confidence`
- `probabilities`
- `recommendation`
- `ai_advice`

`ai_advice` hanya aktif jika `GROQ_API_KEY` tersedia dan koneksi ke Groq berhasil.

## Checklist Capstone

- Frontend memakai React dan Vite.
- Frontend melakukan request API menggunakan Axios.
- Backend menyediakan RESTful API dengan FastAPI.
- Model AI/ML terhubung melalui local model atau remote model API.
- Login/register terhubung ke PostgreSQL jika `DATABASE_URL` aktif.
- Riwayat prediksi disimpan dan ditampilkan per user.
- UI sudah mendukung tampilan responsif, loading state, error handling, dan dark mode.

## Catatan Keamanan

- Jangan commit `.env`, password database, API key, atau token pribadi.
- Gunakan environment variable di Render dan Vercel.
- Untuk hosting, gunakan PostgreSQL/Supabase daripada file JSON lokal.
