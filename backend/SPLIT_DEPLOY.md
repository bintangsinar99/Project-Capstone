# Arsitektur Model API dan Backend Aplikasi Terpisah

MindTrack dapat memakai dua service:

```text
Frontend -> Backend aplikasi -> Model API Hugging Face
                         |
                         -> PostgreSQL
```

Backend aplikasi menangani register, login, admin, dan riwayat prediksi. Model
API Hugging Face hanya menangani inferensi model.

## Backend aplikasi

Isi environment variable berikut pada backend aplikasi:

```text
MODEL_API_URL=https://zidanpw-mindtrack-stress-detection-api.hf.space
DATABASE_URL=<connection string PostgreSQL>
DATABASE_SSLMODE=require
```

## Frontend

Isi file `frontend/.env` untuk development lokal:

```text
VITE_MODEL_API_URL=https://zidanpw-mindtrack-stress-detection-api.hf.space/
VITE_BACKEND_URL=http://127.0.0.1:8000/
```

Saat backend aplikasi sudah di-hosting, ganti `VITE_BACKEND_URL` dengan URL
hosting backend tersebut lalu build ulang frontend.
