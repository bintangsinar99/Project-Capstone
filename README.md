# MindTrack Capstone

Aplikasi web deteksi tingkat stres mahasiswa. Project ini sudah menggabungkan:

- Front-End: React + Vite, berjalan dengan Node.js
- Back-End: FastAPI
- Model AI/ML: Keras/TensorFlow MLP ensemble untuk klasifikasi stres mahasiswa
- Penyimpanan: riwayat prediksi ke file JSON, akun user ke PostgreSQL jika `DATABASE_URL` diisi

## Struktur

```text
frontend/                  React app
backend/app/               FastAPI app
backend/models/            Model, ensemble metadata, dan scaler
backend/data/              Riwayat prediksi, dataset referensi, data dictionary
docs/                      Laporan teknis dan daftar fitur
notebooks/                 Notebook final Data Science
dashboard/                 Dashboard Streamlit opsional dari tim Data Science
```

## Pembaruan Aset Terbaru

Aset model dan dokumen Data Science terakhir disinkronkan dari:

```text
F:\capstone project-20260528T111144Z-3-001\capstone project\deteksi stress mahasiswa
```

Bagian yang diperbarui ke project ini:

- `backend/models`: model ensemble `.keras`, `ensemble_meta.json`, dan `scaler_params.json`
- `backend/data`: dataset bersih dan data dictionary
- `docs`: visualisasi training/evaluasi, selected features, dan laporan teknis
- `notebooks`: notebook final Data Science dan notebook training model
- `dashboard`: dashboard Streamlit opsional dari tim Data Science

## Tutorial Membuka Modul Untuk User Baru

Ikuti langkah ini jika baru menerima folder project dan ingin menjalankan aplikasi MindTrack di laptop sendiri.

### 1. Siapkan kebutuhan utama

Pastikan sudah terpasang:

- Python 3.11 atau 3.12
- Node.js
- Browser seperti Chrome, Edge, atau Firefox

Untuk mengecek Python dan Node.js:

```bash
python --version
node --version
npm --version
```

Jika `python` tidak terbaca di Windows, coba:

```bash
py --version
```

### 2. Buka folder project

Contoh jika folder berada di `F:\Program\Projek Gabut\Project Capstone`:

```bash
cd "F:\Program\Projek Gabut\Project Capstone"
```

Jika lokasi folder berbeda, sesuaikan path-nya.

### 3. Buat dan aktifkan virtual environment backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
```

Jika perintah `python` tidak bisa, gunakan:

```bash
py -3.12 -m venv .venv
.venv\Scripts\activate
```

Setelah aktif, terminal biasanya menampilkan tanda `(.venv)`.

### 4. Install dependency backend

```bash
python -m pip install -r requirements.txt
```

Proses ini bisa cukup lama karena TensorFlow ikut di-install.

### 5. Aktifkan fitur saran AI generatif, opsional

Jika ingin fitur `ai_advice` dari Groq aktif, isi environment variable sebelum menjalankan server:

```bash
$env:GROQ_API_KEY="ISI_API_KEY_GROQ_DI_SINI"
```

Jika tidak diisi, aplikasi tetap bisa berjalan. Hanya saran AI generatif yang tidak aktif.

### 6. Hubungkan database PostgreSQL, opsional tapi disarankan untuk hosting

Secara default, akun login/register disimpan ke `backend/data/users.json`. Ini aman untuk uji coba lokal, tetapi tidak cocok untuk hosting karena file lokal bisa hilang saat server restart atau redeploy.

Untuk memakai PostgreSQL atau Supabase:

1. Buat database PostgreSQL. Jika memakai Supabase, buka `Project Settings > Database > Connection string`.
2. Pilih connection string tipe `Transaction pooler`.
3. Salin `backend/.env.example` menjadi `backend/.env`.
4. Isi `DATABASE_URL` di `backend/.env`.

Contoh isi `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DATABASE_SSLMODE=require
```

Atau isi langsung dari PowerShell sebelum menjalankan backend:

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
$env:DATABASE_SSLMODE="require"
```

Saat `DATABASE_URL` aktif, backend otomatis membuat tabel `users` jika belum ada.

Catatan admin monitoring, opsional:

Untuk percobaan halaman admin, isi juga `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di `backend/.env`.

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

Setelah backend dijalankan ulang, login memakai akun admin tersebut akan membuka halaman monitoring khusus admin. User biasa tetap bisa register memakai username bebas, kecuali username yang sama dengan `ADMIN_USERNAME`.

Untuk menonaktifkan admin, kosongkan kembali `ADMIN_PASSWORD`.

### 7. Jalankan aplikasi

Masih dari folder `backend`, jalankan:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Lalu buka browser ke:

```text
http://127.0.0.1:8000
```

Jika halaman MindTrack muncul, modul sudah berhasil dijalankan.

### 8. Cara mematikan aplikasi

Klik terminal yang menjalankan `uvicorn`, lalu tekan:

```text
Ctrl + C
```

Untuk keluar dari virtual environment:

```bash
deactivate
```

## Catatan Untuk Pengiriman Project

Folder yang boleh dihapus sebelum project dikirim agar ukuran lebih kecil:

- `backend/.venv`
- `frontend/node_modules`

Folder/file penting yang jangan dihapus:

- `backend/app`
- `backend/models`
- `backend/data`
- `backend/requirements.txt`
- `frontend/src`
- `frontend/dist`
- `frontend/package.json`
- `frontend/package-lock.json`

Jika `backend/.venv` dihapus, user baru cukup membuat ulang dengan langkah tutorial di atas.

## Menjalankan Front-End

```bash
cd frontend
npm install
npm run dev
```

React app tersedia di:

```text
http://127.0.0.1:5173
```

## Build Front-End Untuk Disajikan Dari FastAPI

Untuk hosting satu service, build React terlebih dahulu:

```bash
cd frontend
npm install
npm run build
```

Hasil build masuk ke `frontend/dist` dan otomatis disajikan oleh FastAPI.

## Menjalankan Back-End

Gunakan Python resmi 3.11 atau 3.12 agar TensorFlow kompatibel.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API tersedia di:

```text
http://127.0.0.1:8000
http://127.0.0.1:8000/docs
```

Jika `frontend/dist` sudah ada, aplikasi React juga tersedia langsung dari FastAPI:

```text
http://127.0.0.1:8000
```

Untuk hosting satu service, start command yang dipakai:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Pada platform seperti Render/Railway, port biasanya dari environment variable:

```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Untuk hosting dengan database, tambahkan environment variable berikut di dashboard hosting:

```text
DATABASE_URL=connection-string-postgresql
DATABASE_SSLMODE=require
```

Jika memakai Supabase, gunakan connection string dari `Transaction pooler`. Jangan menaruh password database langsung di source code.

## Endpoint RESTful

- `GET /api/health`
- `POST /api/predictions`
- `GET /api/predictions`
- `GET /api/predictions/{prediction_id}`
- `DELETE /api/predictions/{prediction_id}`

## Input Model

Model memakai daftar fitur dari `backend/models/ensemble_meta.json`. Pada aset terbaru, ensemble memakai 26 fitur setelah fitur turunan dihitung oleh backend. Jika `ensemble_meta.json` tersedia, backend otomatis memakai ensemble; jika tidak, backend fallback ke `stress_mlp_final.keras`.

Fitur utama yang dikirim dari UI:

- `anxiety_level`
- `self_esteem`
- `mental_health_history`
- `depression`
- `sleep_quality`
- `study_load`
- `social_support`
- `Daily_Screen_Time_Hours`
- `Social_Media_Usage_Hours`
- `Gaming_App_Usage_Hours`
- `digital_overload_score`
- `mental_risk_score`

Back-end otomatis menambahkan fitur turunan sebelum inference sesuai scaler model.

## Dashboard Streamlit Opsional

Dashboard eksplorasi dari tim Data Science tersedia di folder `dashboard`.

```bash
cd dashboard
python -m pip install -r requirements.txt
streamlit run app.py
```

## Output Model

API mengembalikan:

- `stress_level`: 0, 1, atau 2
- `stress_class`: Rendah, Sedang, atau Tinggi
- `confidence`
- `probabilities`
- `recommendation`
- `ai_advice`

`ai_advice` memakai API generatif hanya jika `GROQ_API_KEY` tersedia di environment variable. Tidak ada API key yang disimpan di source code.

## Checklist Capstone

- React memakai module bundler Vite.
- Front-end memakai networking call ke FastAPI dengan Axios.
- Back-end menyediakan RESTful API.
- URL endpoint mengikuti konvensi RESTful.
- API menyimpan riwayat prediksi.
- Model AI/ML asli terintegrasi melalui file `.keras`, ensemble metadata, dan scaler.
- UI responsif dengan validasi input, loading state, error handling, dan riwayat hasil.
