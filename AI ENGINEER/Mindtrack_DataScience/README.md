# Mindtrack_DataScience
## Aplikasi Deteksi Dini Tingkat Stres Mahasiswa Berdasarkan Pola Aktivitas Digital Menggunakan Machine Learning

## 📌 Deskripsi Proyek
MindTrack merupakan proyek capstone bertema **Healthy Lives & Well-being** yang bertujuan membantu mendeteksi tingkat stres mahasiswa sejak dini berdasarkan pola aktivitas digital dan kondisi mental pengguna.

Proyek ini menggabungkan analisis data kesehatan mental mahasiswa dengan pola penggunaan smartphone seperti:
- screen time
- penggunaan media sosial
- penggunaan aplikasi produktivitas
- aktivitas digital harian

Data tersebut diproses melalui tahapan Data Science dan selanjutnya digunakan oleh AI Engineer untuk membangun model Machine Learning klasifikasi tingkat stres mahasiswa.

---

# 🎯 Tujuan Proyek
- Membantu mendeteksi risiko stres mahasiswa secara dini
- Menganalisis hubungan aktivitas digital dengan kesehatan mental
- Menyediakan dataset siap modeling untuk sistem Machine Learning
- Menampilkan insight data melalui dashboard interaktif

---

# ❓ Business Questions
1. Bagaimana hubungan tingkat kecemasan terhadap tingkat stres mahasiswa?
2. Bagaimana pengaruh kualitas tidur terhadap tingkat stres?
3. Apakah screen time berpengaruh terhadap kesehatan mental mahasiswa?
4. Bagaimana penggunaan media sosial memengaruhi tingkat stres?
5. Fitur apa saja yang paling relevan untuk prediksi tingkat stres?

---

# 📂 Dataset
Dataset yang digunakan:
1. Student Stress Monitoring Dataset
2. Smartphone Usage and Behavioral Dataset

Sumber dataset:
- Kaggle

---

# ⚙️ Teknologi yang Digunakan

## Data Science
- Python
- Pandas
- NumPy
- Matplotlib
- Google Colab

---

# 📊 Tahapan Data Science
1. Problem Discovery
2. Data Gathering
3. Data Assessing
4. Data Cleaning
5. Exploratory Data Analysis (EDA)
6. Feature Selection
7. Feature Engineering
8. Explanatory Analysis
9. Data Dictionary
10. Dataset Handover ke AI Engineer

---

# 🧩 Feature Engineering
Fitur tambahan yang dibuat:
- `digital_overload_score`
- `productivity_balance_score`
- `study_stress_ratio`
- `mental_risk_score`

---

# 🌐 Dashboard Deployment
Dashboard Streamlit dapat diakses melalui:

👉 https://dashboard-mindtrack.streamlit.app/

Dashboard digunakan untuk menampilkan:
- distribusi tingkat stres
- hubungan aktivitas digital dengan stres
- visualisasi insight data
- exploratory data analysis

---

# 📁 Struktur Repository

```text
MindTrack/
│
├── data/
│   ├── final_clean_dataset.csv
│   └── data_dictionary.csv
│
├── notebooks/
│   └── Capstone_DataScience_MainSideQuest_Final.ipynb
│
├── dashboard/
│   └── app.py
│
├── reports/
│   └── technical_report_data_science.pdf
│
├── selected_features.txt
├── requirements.txt
├── README.md
└── .gitignore