# Deploy Backend MindTrack ke Hugging Face Space

Gunakan Space bertipe **Docker** agar backend FastAPI lokal dan backend hosting
menjalankan kode yang sama.

## 1. Masukkan Kode ke Space

Upload atau push isi repository ini ke repository Hugging Face Space. File
`Dockerfile` harus berada di folder paling atas repository Space.

## 2. Tambahkan Secrets

Buka **Settings -> Variables and secrets** pada Space, lalu tambahkan:

```text
DATABASE_URL=<connection string PostgreSQL>
DATABASE_SSLMODE=require
```

Tambahkan juga berikut ini jika fitur saran AI digunakan:

```text
GROQ_API_KEY=<API key Groq>
```

Jangan memasukkan password atau API key ke file yang di-commit.

## 3. Tambahkan Variables

Untuk frontend lokal:

```text
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Jika frontend sudah di-hosting, tambahkan domain frontend pada daftar yang sama,
dipisahkan dengan tanda koma.

## 4. Verifikasi

Setelah Space selesai build, buka:

```text
https://<nama-space>.hf.space/api/health
https://<nama-space>.hf.space/docs
```

Pada dokumentasi API harus tersedia:

```text
POST /api/auth/register
POST /api/auth/login
```

Frontend lokal tetap menggunakan:

```text
VITE_API_URL=https://<nama-space>.hf.space/
```
