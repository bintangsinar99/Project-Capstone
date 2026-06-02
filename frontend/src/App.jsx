import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  ChevronDown,
  CheckCircle2,
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Footprints,
  HelpCircle,
  Heart,
  History,
  Laptop,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Moon,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  TimerReset,
  Trash2,
  User,
  X,
  Zap,
} from "lucide-react";

import {
  checkApiHealth,
  createPrediction,
  deletePrediction,
  getPredictions,
  login as apiLogin,
  register as apiRegister,
} from "./services/api";

const initialForm = {
  anxiety_level: 14,
  self_esteem: 20,
  mental_health_history: 0,
  depression: 11,
  headache: 2,
  sleep_quality: 2,
  academic_performance: 3,
  study_load: 2,
  future_career_concerns: 3,
  social_support: 2,
  peer_pressure: 3,
  bullying: 2,
  Age: 22,
  Total_App_Usage_Hours: 6,
  Daily_Screen_Time_Hours: 7,
  Number_of_Apps_Used: 16,
  Social_Media_Usage_Hours: 3,
  Productivity_App_Usage_Hours: 2,
  Gaming_App_Usage_Hours: 2,
  digital_overload_score: 14,
  productivity_balance_score: 0.5,
  study_stress_ratio: 1,
  mental_risk_score: 30,
};

const fieldGroups = [
  {
    title: "Indikator Psikologis",
    fields: [
      ["anxiety_level", "Tingkat Kecemasan", 0, 21, 1],
      ["self_esteem", "Kepercayaan Diri", 0, 30, 1],
      ["depression", "Indikator Depresi", 0, 27, 1],
      ["mental_health_history", "Riwayat Kesehatan Mental", 0, 1, 1],
      ["social_support", "Dukungan Sosial", 0, 3, 1],
      ["peer_pressure", "Tekanan Teman Sebaya", 0, 5, 1],
      ["bullying", "Pengalaman Bullying", 0, 5, 1],
    ],
  },
  {
    title: "Akademik & Wellness Harian",
    fields: [
      ["headache", "Intensitas Sakit Kepala", 0, 5, 1],
      ["sleep_quality", "Kualitas Tidur", 0, 5, 1],
      ["academic_performance", "Performa Akademik", 0, 5, 1],
      ["study_load", "Beban Belajar", 0, 5, 1],
      ["future_career_concerns", "Kekhawatiran Karier", 0, 5, 1],
      ["Age", "Usia", 17, 60, 1],
      ["study_stress_ratio", "Rasio Stres Belajar", 0, 10, 0.1],
      ["mental_risk_score", "Skor Risiko Mental", 0, 80, 1],
    ],
  },
  {
    title: "Aktivitas Digital",
    fields: [
      ["Total_App_Usage_Hours", "Total Penggunaan Aplikasi", 0, 24, 0.1],
      ["Daily_Screen_Time_Hours", "Screen Time Harian", 0, 24, 0.1],
      ["Number_of_Apps_Used", "Jumlah Aplikasi Dipakai", 0, 80, 1],
      ["Social_Media_Usage_Hours", "Penggunaan Media Sosial", 0, 24, 0.1],
      ["Productivity_App_Usage_Hours", "Aplikasi Produktivitas", 0, 24, 0.1],
      ["Gaming_App_Usage_Hours", "Aplikasi Gim", 0, 24, 0.1],
      ["digital_overload_score", "Beban Digital", 0, 40, 0.1],
      ["productivity_balance_score", "Keseimbangan Produktivitas", 0, 5, 0.01],
    ],
  },
];

const demoCases = {
  low: {
    ...initialForm,
    anxiety_level: 5,
    self_esteem: 26,
    depression: 4,
    sleep_quality: 5,
    study_load: 1,
    future_career_concerns: 1,
    social_support: 3,
    peer_pressure: 1,
    bullying: 0,
    Daily_Screen_Time_Hours: 4,
    Social_Media_Usage_Hours: 1,
    Gaming_App_Usage_Hours: 0.5,
    digital_overload_score: 6,
    mental_risk_score: 10,
  },
  high: {
    ...initialForm,
    anxiety_level: 18,
    self_esteem: 5,
    mental_health_history: 1,
    depression: 20,
    headache: 4,
    sleep_quality: 1,
    academic_performance: 1,
    study_load: 5,
    future_career_concerns: 5,
    social_support: 1,
    peer_pressure: 5,
    bullying: 4,
    Daily_Screen_Time_Hours: 12,
    Social_Media_Usage_Hours: 4.5,
    Productivity_App_Usage_Hours: 0.5,
    Gaming_App_Usage_Hours: 4,
    digital_overload_score: 20,
    productivity_balance_score: 0.05,
    study_stress_ratio: 4.5,
    mental_risk_score: 50,
  },
};

const navItems = [
  ["dashboard", LayoutDashboard, "Dashboard"],
  ["prediction", Brain, "Prediction Form"],
  ["history", History, "Mood History"],
  ["resources", BookOpen, "Resources"],
];

const interventions = [
  [
    Droplets,
    "Hydration Check",
    "Minum air untuk menjaga fokus.",
    "Minum segelas air sekitar 250 ml secara perlahan. Setelah itu, beri tubuh waktu sejenak sebelum kembali beraktivitas.",
  ],
  [
    Moon,
    "Power Nap",
    "Istirahat singkat selama 15-20 menit.",
    "Atur alarm selama 15-20 menit, cari posisi yang nyaman, lalu pejamkan mata dan istirahatkan tubuh. Hindari tidur terlalu lama agar tubuh tetap segar setelah bangun.",
  ],
  [
    Footprints,
    "Quick Walk",
    "Berjalan ringan selama 5 menit.",
    "Tinggalkan meja sejenak dan berjalan santai selama sekitar 5 menit. Bila memungkinkan, arahkan perhatian pada langkah kaki dan lingkungan di sekitarmu.",
  ],
  [
    Zap,
    "Digital Detox",
    "Jeda layar selama 10 menit.",
    "Jauhkan ponsel dan layar selama 10 menit. Gunakan jeda ini untuk mengistirahatkan mata, meregangkan tubuh, atau duduk tenang tanpa membuka notifikasi.",
  ],
];

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("mindtrack-session") === "active",
  );
  const [currentUsername, setCurrentUsername] = useState(
    () => localStorage.getItem("mindtrack-username") || "",
  );
  const [publicView, setPublicViewState] = useState("landing");
  const [activeView, setActiveViewState] = useState("dashboard");
  const [form, setForm] = useState(initialForm);
  const [history, setHistory] = useState([]);
  const [health, setHealth] = useState(null);
  const [status, setStatus] = useState("checking");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [toast, setToast] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("mindtrack-theme") || "light");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerForm, setRegisterForm] = useState({ username: "", password: "" });
  const [registerError, setRegisterError] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const latest = history[0];
  const latestResult = latest?.result;
  const probabilities = latestResult?.probabilities || { rendah: 0.12, sedang: 0.68, tinggi: 0.2 };
  const isFormValid = useMemo(() => Object.values(form).every((value) => value !== ""), [form]);
  const filteredHistory = useMemo(() => filterHistory(history, searchTerm), [history, searchTerm]);

  function setPublicView(view, { replace = false } = {}) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ mindtrackScope: "public", view }, "", window.location.href);
    setPublicViewState(view);
  }

  function setActiveView(view, { replace = false } = {}) {
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ mindtrackScope: "app", view }, "", window.location.href);
    setActiveViewState(view);
  }

  useEffect(() => {
    if (!window.history.state?.mindtrackScope) {
      const scope = isAuthenticated ? "app" : "public";
      const view = isAuthenticated ? activeView : publicView;
      window.history.replaceState({ mindtrackScope: scope, view }, "", window.location.href);
    }

    function handlePopState(event) {
      const historyState = event.state;
      if (!historyState?.mindtrackScope) {
        if (!isAuthenticated) {
          setPublicViewState("landing");
        }
        return;
      }

      if (historyState.mindtrackScope === "public") {
        if (!isAuthenticated) {
          setPublicViewState(historyState.view || "landing");
        }
        return;
      }

      if (historyState.mindtrackScope === "app" && isAuthenticated) {
        setActiveViewState(historyState.view || "dashboard");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    refreshData();
  }, [isAuthenticated, currentUsername]);

  useEffect(() => {
    localStorage.setItem("mindtrack-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated && publicView === "landing") {
      return;
    }

    if (window.location.hash) {
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [isAuthenticated, publicView]);

  async function refreshData() {
    setError("");
    try {
      const apiHealth = await checkApiHealth();
      const data = await getPredictions();
      setHealth(apiHealth);
      setHistory(data);
      setStatus(apiHealth.model_available ? "online" : "warning");
      showToast("Data berhasil diperbarui.");
    } catch {
      setStatus("offline");
      setError("API belum aktif. Jalankan FastAPI di http://127.0.0.1:8000.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isFormValid) {
      setError("Lengkapi seluruh field sebelum melakukan prediksi.");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const prediction = await createPrediction(normalizePayload(form));
      setHistory((current) => [prediction, ...current]);
      setStatus("online");
      setActiveView("results");
      showToast("Prediksi berhasil dibuat.");
    } catch (requestError) {
      const message = requestError.response?.data?.detail || "Prediksi gagal diproses.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      await deletePrediction(id);
      setHistory((current) => current.filter((item) => item.id !== id));
      showToast("Riwayat berhasil dihapus.");
    } catch {
      setError("Riwayat gagal dihapus.");
    }
  }

  function updateField(name, value, step) {
    const nextValue = step === 1 ? Number.parseInt(value, 10) : Number.parseFloat(value);
    setForm((current) => ({ ...current, [name]: Number.isNaN(nextValue) ? "" : nextValue }));
  }

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timeout);
    showToast.timeout = window.setTimeout(() => setToast(""), 2800);
  }

  function startSession(
    title = "Meditasi Mindfulness 10 Menit",
    instruction = "Tarik napas perlahan selama 4 detik, tahan 4 detik, lalu hembuskan selama 6 detik. Ulangi beberapa kali sampai tubuh terasa lebih stabil.",
  ) {
    setActiveSession({ title, instruction, startedAt: new Date().toLocaleTimeString("id-ID") });
  }

  function saveReport() {
    if (!latest) {
      showToast("Belum ada hasil prediksi untuk disimpan.");
      return;
    }

    const report = {
      generated_at: new Date().toISOString(),
      prediction_id: latest.id,
      created_at: latest.created_at,
      result: latest.result,
      input: latest.input,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mindtrack-report-${latest.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Report berhasil disiapkan.");
  }

  function handleLogout() {
    localStorage.removeItem("mindtrack-session");
    localStorage.removeItem("mindtrack-username");
    localStorage.removeItem("mindtrack-token");
    localStorage.removeItem("mindtrack-role");
    setCurrentUsername("");
    setHistory([]);
    setHealth(null);
    setError("");
    setIsAuthenticated(false);
    setActiveViewState("dashboard");
    setPublicView("landing");
    setShowNotifications(false);
    setShowSettingsMenu(false);
    setSearchTerm("");
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError("Username dan password wajib diisi.");
      return;
    }
    setLoginError("");
    try {
      const data = await apiLogin(loginForm.username.trim(), loginForm.password);
      localStorage.setItem("mindtrack-session", "active");
      localStorage.setItem("mindtrack-username", data.username);
      localStorage.setItem("mindtrack-token", data.token);
      setCurrentUsername(data.username);
      setHistory([]);
      setActiveView("dashboard");
      setIsAuthenticated(true);
      showToast("Login berhasil.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Login gagal. Periksa username dan password.";
      setLoginError(msg);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    const { username, password } = registerForm;

    if (!username.trim() || !password.trim()) {
      setRegisterError("Username dan password wajib diisi.");
      return;
    }
    if (username.trim().length < 3) {
      setRegisterError("Username minimal 3 karakter.");
      return;
    }
    if (password.length < 6) {
      setRegisterError("Password minimal 6 karakter.");
      return;
    }

    setRegisterError("");
    try {
      const data = await apiRegister(username.trim(), password);
      localStorage.setItem("mindtrack-session", "active");
      localStorage.setItem("mindtrack-username", data.username);
      localStorage.setItem("mindtrack-token", data.token);
      setCurrentUsername(data.username);
      setHistory([]);
      setActiveView("dashboard");
      setIsAuthenticated(true);
      showToast("Registrasi berhasil.");
    } catch (err) {
      const msg = err.response?.data?.detail || "Registrasi gagal. Coba username lain.";
      setRegisterError(msg);
    }
  }

  if (!isAuthenticated) {
    if (publicView === "landing") {
      return (
        <LandingPage
          theme={theme}
          onOpenLogin={() => setPublicView("login")}
          onOpenRegister={() => setPublicView("register")}
        />
      );
    }

    if (publicView === "register") {
      return (
        <RegisterPage
          theme={theme}
          registerForm={registerForm}
          registerError={registerError}
          showPassword={showRegisterPassword}
          setRegisterForm={setRegisterForm}
          setShowPassword={setShowRegisterPassword}
          onSubmit={handleRegister}
          onOpenLogin={() => setPublicView("login")}
        />
      );
    }

    return (
      <LoginPage
        theme={theme}
        loginForm={loginForm}
        loginError={loginError}
        showPassword={showPassword}
        setLoginForm={setLoginForm}
        setShowPassword={setShowPassword}
        onSubmit={handleLogin}
        onBack={() => setPublicView("landing")}
        onOpenRegister={() => setPublicView("register")}
      />
    );
  }

  return (
    <main className="mindtrack-shell" data-theme={theme}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MindTrack</strong>
            <small>Supportive Intelligence</small>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(([id, Icon, label]) => (
            <button
              className={activeView === id ? "active" : ""}
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="screening-button" type="button" onClick={() => setActiveView("prediction")}>
          Start Assessment
        </button>
        <button className="logout-button" type="button" onClick={handleLogout}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      <section className="app-view">
        <header className="app-header">
          <h1>{activeView === "results" ? "Prediction Results" : "MindTrack"}</h1>
          <div className="header-actions">
            <label className="search-box">
              <Search size={20} />
              <input
                placeholder="Cari laporan, artikel, atau histori..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <button
              className="icon-only"
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setShowNotifications((current) => !current);
                setShowSettingsMenu(false);
              }}
            >
              <Bell size={22} />
            </button>
            <button
              className={`icon-only ${showSettingsMenu ? "active" : ""}`}
              type="button"
              aria-label="Settings menu"
              onClick={() => {
                setShowSettingsMenu((current) => !current);
                setShowNotifications(false);
              }}
            >
              <Settings size={22} />
            </button>
            <div className="avatar">{getUserInitial(currentUsername)}</div>
          </div>
          {showNotifications && (
            <NotificationsPanel history={history} onClose={() => setShowNotifications(false)} />
          )}
          {showSettingsMenu && (
            <SettingsMenu
              health={health}
              status={status}
              onClose={() => setShowSettingsMenu(false)}
              onRefresh={async () => {
                await refreshData();
                setShowSettingsMenu(false);
              }}
              onOpenResources={() => {
                setActiveView("resources");
                setShowSettingsMenu(false);
              }}
              theme={theme}
              onToggleTheme={() => {
                setTheme((current) => (current === "dark" ? "light" : "dark"));
              }}
            />
          )}
        </header>

        {error && <p className="error-message">{error}</p>}

        {activeView === "dashboard" && (
          <DashboardView
            form={form}
            latestResult={latestResult}
            history={history}
            username={currentUsername}
            setActiveView={setActiveView}
            startSession={startSession}
          />
        )}

        {activeView === "prediction" && (
          <PredictionForm
            form={form}
            setForm={setForm}
            updateField={updateField}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )}

        {activeView === "results" && (
          <ResultsView
            latestResult={latestResult}
            probabilities={probabilities}
            setActiveView={setActiveView}
            saveReport={saveReport}
            startSession={startSession}
          />
        )}

        {activeView === "history" && (
          <HistoryView history={filteredHistory} searchTerm={searchTerm} handleDelete={handleDelete} />
        )}

        {activeView === "resources" && <ResourcesView startSession={startSession} />}

        {toast && <Toast message={toast} />}
        {activeSession && <SessionModal session={activeSession} onClose={() => setActiveSession(null)} />}
      </section>
    </main>
  );
}

function LandingPage({ theme, onOpenLogin, onOpenRegister }) {
  const highlights = [
    [Brain, "Kenali Pola Stres", "Perhatikan hubungan antara kondisi emosional, tekanan akademik, dan kebiasaan digital."],
    [Activity, "Pantau Kebiasaan", "Gunakan assessment berkala untuk melihat perubahan pola aktivitas dan kesejahteraanmu."],
    [ShieldCheck, "Cari Dukungan", "Jadikan hasil screening sebagai bahan refleksi dan pertimbangkan bantuan saat dibutuhkan."],
  ];

  const features = [
    [Brain, "Prediksi Tingkat Stres", "Model menganalisis indikator psikologis, akademik, dan aktivitas digital untuk memperkirakan tingkat stres."],
    [Sparkles, "Rekomendasi Personal", "Dapatkan langkah sederhana yang dapat dilakukan untuk beristirahat, tidur lebih baik, dan menjaga fokus."],
    [Activity, "Pemantauan Aktivitas", "Pantau keseimbangan waktu layar, penggunaan aplikasi, dan pola kesejahteraan harian."],
    [History, "Riwayat Assessment", "Tinjau hasil screening sebelumnya untuk memahami perubahan indikator stres dari waktu ke waktu."],
  ];

  const steps = [
    [Send, "Isi Formulir", "Bagikan indikator aktivitas harian dan kondisi kesejahteraanmu."],
    [Brain, "Analisis AI", "Model memproses pola psikologis, akademik, dan digital."],
    [BarChart3, "Lihat Hasil", "Tinjau tingkat stres, confidence score, dan peta intensitas."],
    [ShieldCheck, "Ikuti Rekomendasi", "Pilih langkah praktis yang sesuai dengan kebutuhanmu."],
  ];

  const useCases = [
    [Moon, "Refleksi Kebiasaan Tidur", "Kenali pola tidur yang mungkin berkaitan dengan perubahan tingkat stres."],
    [Activity, "Evaluasi Aktivitas Digital", "Perhatikan penggunaan layar dan aplikasi ketika beban akademik meningkat."],
    [Sparkles, "Langkah Kecil yang Praktis", "Pilih rekomendasi singkat yang realistis untuk dilakukan di sela aktivitas kuliah."],
  ];

  return (
    <main className="landing-page" data-theme={theme}>
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="brand-mark">M</span>
          <strong>MindTrack</strong>
        </div>
        <nav>
          <a href="#home">Beranda</a>
          <a href="#features">Fitur</a>
          <a href="#about">Tentang</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div>
          <button type="button" className="landing-login" onClick={onOpenLogin}>Masuk</button>
          <button type="button" className="landing-register" onClick={onOpenRegister}>Daftar</button>
        </div>
      </header>

      <section className="landing-hero" id="home">
        <div className="landing-copy">
          <span className="landing-badge">
            <Sparkles size={15} />
            Screening kesejahteraan mahasiswa berbasis AI
          </span>
          <h1>Pahami Pola Stresmu Melalui Aktivitas Digital</h1>
          <p>
            MindTrack membantu mahasiswa mengenali hubungan antara kondisi psikologis, aktivitas akademik, dan kebiasaan
            digital agar dapat mengambil langkah sederhana lebih awal.
          </p>
          <div className="landing-actions">
            <button type="button" className="landing-primary" onClick={onOpenRegister}>Mulai Screening</button>
            <a href="#features" className="landing-secondary">Pelajari Lebih Lanjut</a>
          </div>
        </div>

        <div className="hero-preview">
          <div className="hero-preview-card">
            <Laptop size={52} />
            <div className="preview-chart">
              <span /><span /><span /><span /><span />
            </div>
            <div className="preview-callout">
              <Sparkles size={22} />
              <div>
                <strong>Insight AI Personal</strong>
                <span>Kenali pola stres dari indikator aktivitasmu.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section center" id="about">
        <div className="landing-section-title">
          <h2>Tekanan Akademik di Era Digital</h2>
          <p>MindTrack membantu mengubah kebiasaan harian menjadi insight yang lebih mudah dipahami.</p>
        </div>
        <div className="landing-stats">
          {highlights.map(([Icon, title, text]) => (
            <article key={title}>
              <span className="landing-stat-icon"><Icon size={24} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section-row">
          <div>
            <h2>Insight yang Suportif</h2>
            <p>Fitur yang dirancang untuk membantu mahasiswa memahami kondisi diri dengan lebih tenang.</p>
          </div>
        </div>
        <div className="landing-feature-grid">
          {features.map(([Icon, title, text]) => (
            <article key={title}>
              <span><Icon size={24} /></span>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section center" id="steps">
        <h2>Langkah Menuju Pemahaman Diri</h2>
        <div className="landing-steps">
          {steps.map(([Icon, title, text]) => (
            <article key={title}>
              <span><Icon size={24} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mockup-band">
        <div className="mockup-intro">
          <span><BarChart3 size={20} /></span>
          <div>
            <h2>Pantau Perkembanganmu</h2>
            <p>Lihat ringkasan indikator kesejahteraan dalam tampilan yang mudah dipahami.</p>
          </div>
        </div>
        <div className="browser-mockup">
          <div className="browser-top">
            <span /><span /><span />
            <small>mindtrack.ai/dashboard</small>
          </div>
          <div className="browser-body">
            <aside><span /><span /><span /></aside>
            <section>
              <div className="mockup-head">
                <h3>Ringkasan Mingguan</h3>
                <button type="button">4 Agu - 11 Agu</button>
              </div>
              <div className="mockup-metrics">
                <div><span>Indeks Stres</span><strong>Rendah</strong></div>
                <div><span>Kualitas Tidur</span><strong>7,5 jam</strong></div>
                <div><span>Keseimbangan Layar</span><strong>Baik</strong></div>
              </div>
              <div className="mockup-chart">
                <div className="mockup-chart-bars" aria-label="Contoh tren indeks stres selama tujuh hari">
                  {[42, 54, 48, 66, 58, 38, 32].map((value, index) => (
                    <span key={index} style={{ "--chart-height": `${value}%` }} />
                  ))}
                </div>
                <div className="mockup-chart-labels">
                  {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => <small key={day}>{day}</small>)}
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="landing-disclaimer" id="disclaimer">
        <ShieldCheck size={28} />
        <p>
          <strong>Catatan Penting:</strong> MindTrack adalah alat screening dan refleksi kesejahteraan, bukan pengganti
          diagnosis atau bantuan profesional. Jika kamu berada dalam kondisi krisis, segera hubungi layanan darurat atau
          dukungan kampus.
        </p>
      </section>

      <section className="landing-section center">
        <div className="landing-section-title">
          <h2>Manfaat untuk Aktivitas Mahasiswa</h2>
          <p>Contoh penggunaan MindTrack dalam rutinitas perkuliahan sehari-hari.</p>
        </div>
        <div className="testimonial-grid">
          {useCases.map(([Icon, title, text]) => (
            <article key={title}>
              <span className="landing-usecase-icon"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-faq" id="faq">
        <h2>Pertanyaan Umum</h2>
        <details open>
          <summary>Apakah data saya aman?<ChevronDown size={18} /></summary>
          <p>Data digunakan untuk menyimpan akun, riwayat assessment, dan insight personal melalui backend aplikasi.</p>
        </details>
        <details>
          <summary>Bagaimana AI memperkirakan tingkat stres?<ChevronDown size={18} /></summary>
          <p>Model memadukan indikator yang kamu isi dengan fitur aktivitas digital untuk memperkirakan tingkat stres.</p>
        </details>
        <details>
          <summary>Apakah hasilnya dapat dibagikan kepada konselor?<ChevronDown size={18} /></summary>
          <p>Kamu dapat menyimpan hasil assessment dan menggunakannya sebagai bahan diskusi bersama tenaga profesional.</p>
        </details>
      </section>

      <section className="landing-cta">
        <h2>Mulai memahami pola kesejahteraanmu</h2>
        <p>Gunakan MindTrack untuk mengenali perubahan, melakukan refleksi, dan memilih langkah sederhana yang realistis.</p>
        <button type="button" onClick={onOpenRegister}>Mulai Screening</button>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-main">
          <div className="landing-footer-brand">
            <div className="landing-brand">
              <span className="brand-mark">M</span>
              <strong>MindTrack</strong>
            </div>
            <p>Screening suportif untuk membantu mahasiswa memahami pola stres dan kebiasaan digital.</p>
            <button type="button" onClick={onOpenRegister}>
              <Sparkles size={17} />
              Mulai Screening
            </button>
          </div>

          <div className="landing-footer-column">
            <strong>Produk</strong>
            <a href="#features"><Sparkles size={17} />Fitur</a>
            <a href="#steps"><Send size={17} />Cara Kerja</a>
            <a href="#about"><BarChart3 size={17} />Insight</a>
          </div>

          <div className="landing-footer-column">
            <strong>Dukungan</strong>
            <a href="#faq"><HelpCircle size={17} />Pusat Bantuan</a>
            <a href="#disclaimer"><ShieldCheck size={17} />Privasi Data</a>
            <a href="#disclaimer"><FileText size={17} />Catatan Penting</a>
          </div>

          <div className="landing-footer-column">
            <strong>Akses Cepat</strong>
            <button type="button" className="landing-footer-link" onClick={onOpenLogin}><User size={17} />Masuk ke Akun</button>
            <a href="#faq"><BookOpen size={17} />FAQ</a>
            <a href="#home"><Activity size={17} />Kembali ke Atas</a>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <span>&copy; 2026 MindTrack. Dibuat untuk mendukung kesejahteraan mahasiswa.</span>
          <span><ShieldCheck size={15} />Alat screening, bukan diagnosis medis.</span>
        </div>
      </footer>
    </main>
  );
}

function LoginPage({
  theme,
  loginForm,
  loginError,
  showPassword,
  setLoginForm,
  setShowPassword,
  onSubmit,
  onOpenRegister,
}) {
  return (
    <main className="login-page" data-theme={theme}>
      <section className="login-visual">
        <div className="login-brand">
          <span className="brand-mark">M</span>
          <strong>MindTrack</strong>
        </div>
        <div className="wellbeing-art" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>Your journey to clarity starts here.</h1>
        <p>Supportive intelligence for your mental wellbeing. Experience a guided approach to understanding your mind.</p>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={onSubmit}>
          <div className="login-card-brand">
            <span className="brand-mark">M</span>
          </div>
          <h2>Welcome Back</h2>
          <p>Login to your MindTrack account</p>

          <label className="login-field">
            <span>Username</span>
            <div>
              <input
                type="text"
                value={loginForm.username}
                placeholder="Enter your username"
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, username: event.target.value }))
                }
              />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div>
              <input
                type={showPassword ? "text" : "password"}
                value={loginForm.password}
                placeholder="Password"
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
              />
              <button type="button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>

          {loginError && <p className="login-error">{loginError}</p>}

          <button className="login-button" type="submit">
            Login
          </button>

          <p className="register-copy">
            Don't have an account? <button type="button" onClick={onOpenRegister}>Register</button>
          </p>
        </form>

        <footer>(c) 2024 MindTrack AI. Supportive Intelligence for Mental Wellbeing.</footer>
      </section>
    </main>
  );
}

function RegisterPage({
  theme,
  registerForm,
  registerError,
  showPassword,
  setRegisterForm,
  setShowPassword,
  onSubmit,
  onOpenLogin,
}) {
  const strength = getPasswordStrength(registerForm.password);

  function updateRegisterField(name, value) {
    setRegisterForm((current) => ({ ...current, [name]: value }));
  }

  return (
    <main className="register-page" data-theme={theme}>
      <header className="register-top-brand">
        <div>
          <span className="brand-mark">M</span>
          <strong>MindTrack</strong>
        </div>
      </header>

      <section className="register-main">
        <div className="register-visual" aria-hidden="true">
          <Sparkles size={48} />
        </div>

        <form className="register-card" onSubmit={onSubmit}>
          <div className="register-card-title">
            <h1>Create Account</h1>
            <p>Step towards your mental clarity today.</p>
          </div>

          <div className="register-form">
            <label className="register-field">
              <span>Username</span>
              <div>
                <User size={16} />
                <input
                  type="text"
                  value={registerForm.username}
                  placeholder="Enter a username"
                  onChange={(event) => updateRegisterField("username", event.target.value)}
                />
              </div>
            </label>

            <label className="register-field password-field">
              <span>Password</span>
              <div>
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={registerForm.password}
                  placeholder="Password (min. 6 characters)"
                  onChange={(event) => updateRegisterField("password", event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label="Toggle register password"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <div className="password-strength">
                <div>
                  <span>Password strength</span>
                  <strong>{strength.label}</strong>
                </div>
                <span style={{ "--strength": `${strength.value}%` }} />
              </div>
            </label>

            {registerError && <p className="login-error">{registerError}</p>}

            <button className="register-submit" type="submit">Register</button>
          </div>

          <p className="register-login-copy">
            Already have an account? <button type="button" onClick={onOpenLogin}>Login</button>
          </p>
        </form>
      </section>

      <footer className="register-footer">
        <div>
          <strong>MindTrack AI</strong>
          <span>&copy; 2026 MindTrack AI. Kecerdasan suportif untuk kesehatan mental.</span>
        </div>
        <nav aria-label="Tautan bantuan registrasi">
          <button type="button">Kebijakan Privasi</button>
          <button type="button">Syarat Layanan</button>
          <button type="button">Hubungi Dukungan</button>
        </nav>
      </footer>
    </main>
  );
}

function DashboardView({ latestResult, history, username, setActiveView, startSession }) {
  const hasAssessment = Boolean(latestResult);
  const latestInput = history[0]?.student_data;
  const stressClass = latestResult?.stress_class || "Belum ada";
  const confidence = latestResult ? Math.round(latestResult.confidence * 100) : 0;
  const displayName = formatUsername(username);
  const screenTime = latestInput?.Daily_Screen_Time_Hours;
  const studyLoad = latestInput?.study_load;
  const totalUsage = latestInput?.Total_App_Usage_Hours;
  const activeMinutes = hasAssessment ? Math.max(20, Math.round((Number(studyLoad) || 2) * 14)) : 0;
  const digitalUsage = hasAssessment ? formatDurationHours(totalUsage || screenTime || 0) : "--";
  const heartRate = hasAssessment ? estimateHeartRate(latestResult?.stress_level, latestInput) : "--";

  return (
    <div className="view-stack dashboard-modern">
      <section className="dashboard-hero-modern">
        <article className="hero-dashboard">
          <div>
            <h2>Selamat pagi, {displayName}!</h2>
            <p>
              {hasAssessment
                ? "Berikut ringkasan kondisi terbaru berdasarkan assessment dan pola aktivitas digitalmu."
                : "Mulai assessment pertama untuk membuat ringkasan dashboard yang personal."}
            </p>
          </div>
          <div className="hero-summary-grid">
            <div>
              <span>Screen Time</span>
              <strong>{hasAssessment ? formatHours(screenTime) : "--"}</strong>
            </div>
            <div>
              <span>Study Load</span>
              <strong>{hasAssessment ? `${studyLoad}/5` : "--"}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong>{hasAssessment ? stressClass : "Pending"}</strong>
            </div>
          </div>
        </article>

        <article className="mood-card">
          <div>
            <Moon size={30} />
            <span>{hasAssessment ? "Terupdate" : "Menunggu"}</span>
          </div>
          <p>Mood Hari Ini</p>
          <h3>{hasAssessment ? dashboardMoodLabel(latestResult?.stress_level) : "Belum Dinilai"}</h3>
          <div className="mood-options" aria-label="Mood selector preview">
            {["Tenang", "Fokus", "Lelah", "Cemas"].map((label, index) => (
              <span className={index === 0 && hasAssessment ? "active" : ""} key={label}>
                {label.charAt(0)}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="stats-row">
        <DashboardStat
          icon={Activity}
          label="Skor Stres"
          value={hasAssessment ? `${stressClass} (${confidence})` : "--"}
          trend={hasAssessment ? "Live" : "Wait"}
          tone="orange"
        />
        <DashboardStat
          icon={TimerReset}
          label="Menit Aktif"
          value={hasAssessment ? `${activeMinutes} Menit` : "--"}
          trend={hasAssessment ? "+8%" : "Wait"}
          tone="blue"
        />
        <DashboardStat
          icon={Heart}
          label="Detak Jantung"
          value={hasAssessment ? `${heartRate} BPM` : "--"}
          trend={hasAssessment ? "Normal" : "Wait"}
          tone="rose"
        />
        <DashboardStat
          icon={Laptop}
          label="Penggunaan Digital"
          value={digitalUsage}
          trend={hasAssessment ? screenTimeLabel(screenTime) : "Wait"}
          tone="purple"
        />
      </section>

      <section className="dashboard-two-column">
        <AiRecommendation latestResult={latestResult} hasAssessment={hasAssessment} startSession={startSession} />
        <StressTrend history={history} hasAssessment={hasAssessment} />
      </section>

      <HistoryTable history={history} setActiveView={setActiveView} />
      <Disclaimer />
    </div>
  );
}

function DashboardStat({ icon: Icon, label, value, trend, tone }) {
  return (
    <article className={`dashboard-stat ${tone}`}>
      <div>
        <span className="stat-icon">
          <Icon size={22} />
        </span>
        <small>{trend}</small>
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

function PredictionForm({ form, setForm, updateField, handleSubmit, isLoading }) {
  const allFields = fieldGroups.flatMap((group) => group.fields);
  const completedFields = allFields.filter(([name]) => form[name] !== "" && form[name] !== null && form[name] !== undefined);
  const progress = Math.round((completedFields.length / allFields.length) * 100);

  return (
    <form className="prediction-layout assessment-form-shell" onSubmit={handleSubmit}>
      <section className="assessment-card">
        <div className="assessment-progress">
          <div>
            <h2>Form Assessment</h2>
            <p>Isi indikator psikologis, akademik, dan aktivitas digital.</p>
          </div>
          <strong>{progress}% selesai</strong>
          <span className="progress-track" aria-label={`Assessment progress ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </span>
        </div>

        <div className="quick-actions">
          <span>Quick sample</span>
          <button type="button" className="ghost-button" onClick={() => setForm(demoCases.low)}>
            <CheckCircle2 size={14} />
            Stres Rendah
          </button>
          <button type="button" className="ghost-button" onClick={() => setForm(demoCases.high)}>
            <Zap size={14} />
            Stres Tinggi
          </button>
          <button type="button" className="ghost-button" onClick={() => setForm(initialForm)}>
            <X size={14} />
            Reset
          </button>
        </div>

        {fieldGroups.map((group) => (
          <fieldset className="field-group" key={group.title}>
            <legend>{group.title}</legend>
            <div className="field-grid">
              {group.fields.map(([name, label, min, max, step]) => (
                <label key={name}>
                  <span>
                    {label}
                    <strong>{form[name]}</strong>
                  </span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={form[name]}
                    aria-label={label}
                    onChange={(event) => updateField(name, event.target.value, step)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="assessment-submit-row">
          <button className="primary-button" type="submit" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Prediksi Stres"}
            <Send size={18} />
          </button>
        </div>
      </section>

      <section className="assessment-help-grid">
        <article>
          <ShieldCheck size={22} />
          <div>
            <strong>Privasi Data</strong>
            <span>Data assessment digunakan untuk prediksi dan riwayat akunmu, bukan diagnosis medis.</span>
          </div>
        </article>
        <article>
          <BookOpen size={22} />
          <div>
            <strong>Tips Pengisian</strong>
            <span>Gunakan kondisi terbaru agar rekomendasi AI lebih sesuai dengan aktivitas harianmu.</span>
          </div>
        </article>
      </section>
    </form>
  );
}

function ResultsView({ latestResult, probabilities, setActiveView, saveReport, startSession }) {
  if (!latestResult) {
    return (
      <section className="empty-panel">
        <h2>No assessment yet</h2>
        <p>Start with the prediction form to generate your first assessment.</p>
        <button className="primary-button" type="button" onClick={() => setActiveView("prediction")}>
          Start Assessment
        </button>
      </section>
    );
  }

  return (
    <div className="view-stack">
      <section className="results-grid">
        <article className="assessment-card result-card">
          <div className="result-badges">
            <span>{latestResult.stress_class} stress level</span>
            <strong>{Math.round(latestResult.confidence * 100)}% Confidence Score</strong>
          </div>
          <h2>Current Assessment</h2>
          <p>{latestResult.recommendation}</p>
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => setActiveView("prediction")}>
              Predict Again
            </button>
            <button className="outline-button" type="button" onClick={saveReport}>
              <Save size={18} />
              Save Result
            </button>
            <button className="text-button" type="button" onClick={() => setActiveView("history")}>
              View History
            </button>
          </div>
        </article>
        <IntensityMap probabilities={probabilities} />
      </section>

      <section className="recommendation-grid">
        <AiRecommendation latestResult={latestResult} startSession={startSession} />
        <div>
          <h2>Micro-Interventions</h2>
          <div className="intervention-grid">
            {interventions.map(([Icon, title, text, instruction]) => (
              <button
                className="intervention-card"
                type="button"
                key={title}
                onClick={() => startSession(title, instruction)}
              >
                <Icon size={24} />
                <div>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="data-card">
        <div>
          <h2>Understanding Your Data</h2>
          <p>
            MindTrack AI correlates your self-reported feelings with academic and digital pressure points to provide
            a more accurate outlook on your mental wellbeing.
          </p>
          <div className="security-pill">
            <ShieldCheck size={20} />
            Your data is encrypted and used only for personal wellness tracking.
          </div>
        </div>
        <div className="data-visual" />
      </section>

      <Disclaimer />
    </div>
  );
}

function HistoryView({ history, searchTerm, handleDelete }) {
  return (
    <section className="assessment-card">
      <div className="section-heading">
        <span>Recent records</span>
        <h2>Mood History</h2>
      </div>
      <div className="history-list">
        {history.length === 0 ? (
          <div className="empty-panel">
            <p>{searchTerm ? "Tidak ada riwayat yang cocok dengan pencarian." : "No predictions saved yet."}</p>
          </div>
        ) : (
          history.map((item) => (
            <article className="history-card" key={item.id}>
              <div>
                <strong>{item.result.stress_class}</strong>
                <span>{new Date(item.created_at).toLocaleString("id-ID")}</span>
              </div>
              <p>{item.result.recommendation}</p>
              <small>{item.result.ai_advice}</small>
              <button type="button" onClick={() => handleDelete(item.id)} aria-label="Delete history">
                <Trash2 size={18} />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ResourcesView({ startSession }) {
  return (
    <section className="assessment-card">
      <div className="section-heading">
        <span>Student support</span>
        <h2>Resources</h2>
        <p>Short actions and reminders for safer mental wellbeing support.</p>
      </div>
      <div className="intervention-grid resources">
        {interventions.map(([Icon, title, text, instruction]) => (
          <button
            className="intervention-card"
            type="button"
            key={title}
            onClick={() => startSession(title, instruction)}
          >
            <Icon size={24} />
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="resource-grid">
        <article>
          <HelpCircle size={24} />
          <strong>Campus Support</strong>
          <span>Hubungi konselor kampus jika stres mulai mengganggu aktivitas harian.</span>
        </article>
        <article>
          <FileText size={24} />
          <strong>Self-check Notes</strong>
          <span>Gunakan riwayat prediksi sebagai bahan refleksi, bukan diagnosis medis.</span>
        </article>
      </div>
      <Disclaimer />
    </section>
  );
}

function AiRecommendation({ latestResult, hasAssessment = true, startSession }) {
  return (
    <article className={`ai-card ${hasAssessment ? "" : "empty-metric"}`}>
      <div className="ai-title">
        <Sparkles size={24} />
        <h2>Rekomendasi AI</h2>
      </div>
      <p>
        {hasAssessment
          ? latestResult?.ai_advice || "Berdasarkan indikatormu yang meningkat, kami merekomendasikan jeda wellness singkat."
          : "Belum ada rekomendasi. Selesaikan assessment pertama untuk membuat saran yang personal."}
      </p>
      <div className="priority-action">
        <div className="action-icon">
          <Activity size={24} />
        </div>
        <div>
          <span>Tindakan Prioritas</span>
          <strong>{hasAssessment ? "Meditasi Mindfulness 10 Menit" : "Assessment dibutuhkan"}</strong>
        </div>
      </div>
      <button
        className="primary-button"
        type="button"
        disabled={!hasAssessment}
        onClick={() => startSession("Meditasi Mindfulness 10 Menit")}
      >
        {hasAssessment ? "Mulai Sesi" : "Belum Ada Sesi"}
      </button>
    </article>
  );
}

function IntensityMap({ probabilities }) {
  return (
    <article className="intensity-card">
      <h2>Intensity Map</h2>
      <ProbabilityBar label="Low Probability" value={probabilities.rendah} tone="low" />
      <ProbabilityBar label="Moderate Probability" value={probabilities.sedang} tone="mid" />
      <ProbabilityBar label="High Probability" value={probabilities.tinggi} tone="high" />
      <p>Based on physiological data points and user input.</p>
    </article>
  );
}

function ProbabilityBar({ label, value, tone }) {
  const percent = Math.round(value * 100);
  return (
    <div className="probability-bar">
      <div>
        <span>{label}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="bar-track">
        <span className={tone} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StressTrend({ history, hasAssessment = true }) {
  const trendPath = buildTrendPath(history);
  const trendLabels = buildTrendLabels(history);

  return (
    <article className={`trend-card ${hasAssessment ? "" : "empty-metric"}`}>
      <div>
        <h2>Tren Stres</h2>
        <span>{hasAssessment ? `${Math.min(history.length, 7)} Catatan` : "Belum Ada Data"}</span>
      </div>
      {trendPath ? (
        <>
          <svg viewBox="0 0 520 180" role="img" aria-label="Stress trend line">
            <path d={trendPath} />
          </svg>
          <div className="days">
            {trendLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </>
      ) : hasAssessment ? (
        <div className="trend-empty">
          <BarChart3 size={34} />
          <strong>Butuh minimal 2 assessment</strong>
          <span>Tren akan terbentuk setelah ada beberapa hasil prediksi.</span>
        </div>
      ) : (
        <div className="trend-empty">
          <BarChart3 size={34} />
          <strong>Belum ada tren</strong>
          <span>Tren akan muncul setelah assessment pertama.</span>
        </div>
      )}
    </article>
  );
}

function HistoryTable({ history, setActiveView }) {
  const rows = history.slice(0, 3);

  return (
    <section className="history-table">
      <div className="table-title">
        <h2>Riwayat Terbaru</h2>
        <button className="text-button" type="button" onClick={() => setActiveView("history")}>
          Lihat Semua
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="dashboard-empty-history">
          <History size={26} />
          <strong>Belum ada riwayat prediksi</strong>
          <span>Mulai assessment pertama untuk membuat hasil khusus akun ini.</span>
          <button className="text-button" type="button" onClick={() => setActiveView("prediction")}>
            Mulai Assessment
          </button>
        </div>
      ) : (
        <>
          <div className="table-grid header">
            <span>Tanggal</span>
            <span>Tingkat Stres</span>
            <span>Aksi</span>
            <span>Sentimen</span>
          </div>
          {rows.map((item) => (
            <div className="table-grid" key={item.id}>
              <span>{item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : item.date}</span>
              <span>{item.result?.stress_class || item.level}</span>
              <span>{item.action || "Meditasi Terpandu"}</span>
              <span className="sentiment">{item.sentiment || "Positif"}</span>
            </div>
          ))}
        </>
      )}
    </section>
  );
}

function NotificationsPanel({ history, onClose }) {
  const latest = history[0];
  const latestResult = latest?.result;
  const hasAssessment = Boolean(latestResult);

  return (
    <aside className="notifications-panel">
      <div>
        <strong>Notifikasi</strong>
        <button type="button" onClick={onClose} aria-label="Close notifications">
          <X size={18} />
        </button>
      </div>

      {hasAssessment ? (
        <>
          <article className="notification-item">
            <strong>Hasil Assessment Terbaru</strong>
            <p>
              Tingkat stresmu terdeteksi <em>{latestResult.stress_class}</em>. Luangkan waktu untuk melihat
              rekomendasi personalmu.
            </p>
          </article>
          <article className="notification-item">
            <strong>Jeda Singkat Disarankan</strong>
            <p>Cobalah meditasi mindfulness selama 10 menit untuk membantu menenangkan diri.</p>
          </article>
          <article className="notification-item">
            <strong>Pengingat</strong>
            <p>Lakukan assessment secara berkala agar kamu dapat memantau perubahan tingkat stres.</p>
          </article>
        </>
      ) : (
        <article className="notification-item">
          <strong>Belum Ada Assessment</strong>
          <p>Isi prediction form untuk mendapatkan rekomendasi yang sesuai dengan kondisimu.</p>
        </article>
      )}
    </aside>
  );
}

function SettingsMenu({
  health,
  status,
  theme,
  onClose,
  onRefresh,
  onOpenResources,
  onToggleTheme,
}) {
  const isDark = theme === "dark";

  return (
    <aside className="settings-menu">
      <div className="settings-menu-head">
        <div>
          <strong>Quick Settings</strong>
          <div className={`settings-status ${status}`}>
            <Activity size={15} />
            <span>{statusLabel(status, health)}</span>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close settings menu">
          <X size={18} />
        </button>
      </div>

      <button type="button" onClick={onRefresh}>
        <RefreshCw size={18} />
        <span>Refresh API Status</span>
      </button>
      <button type="button" onClick={onOpenResources}>
        <BookOpen size={18} />
        <span>Support Resources</span>
      </button>
      <button type="button" onClick={onToggleTheme}>
        {isDark ? <Sun size={18} /> : <Moon size={18} />}
        <span>{isDark ? "Light Theme" : "Dark Theme"}</span>
      </button>
    </aside>
  );
}

function SessionModal({ session, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="session-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup sesi">
          <X size={20} />
        </button>
        <TimerReset size={42} />
        <span>Dimulai pukul {session.startedAt}</span>
        <h2>{session.title}</h2>
        <p>{session.instruction}</p>
        <button className="primary-button" type="button" onClick={onClose}>
          Selesaikan Sesi
        </button>
      </section>
    </div>
  );
}

function Toast({ message }) {
  return <div className="toast">{message}</div>;
}

function Disclaimer() {
  return (
    <section className="disclaimer">
      <strong>Medical Disclaimer</strong>
      <p>
        MindTrack is a wellness screening tool and is not intended to diagnose or treat clinical anxiety, depression,
        or medical conditions. If you are experiencing a mental health crisis, please contact university health services
        or emergency help immediately.
      </p>
    </section>
  );
}

function normalizePayload(payload) {
  const normalized = {};
  for (const [key, value] of Object.entries(payload)) {
    normalized[key] = Number(value);
  }
  return normalized;
}

function filterHistory(history, searchTerm) {
  const query = searchTerm.trim().toLowerCase();
  if (!query) {
    return history;
  }

  return history.filter((item) => {
    const combined = [
      item.result?.stress_class,
      item.result?.recommendation,
      item.result?.ai_advice,
      item.created_at,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return combined.includes(query);
  });
}

function formatHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours)) {
    return "--";
  }
  return `${hours.toFixed(1)}h`;
}

function formatDurationHours(value) {
  const totalHours = Number(value);
  if (!Number.isFinite(totalHours)) {
    return "--";
  }
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function estimateHeartRate(stressLevel, input) {
  const anxiety = Number(input?.anxiety_level) || 0;
  const level = Number(stressLevel) || 0;
  return Math.min(104, Math.max(64, 68 + level * 8 + Math.round(anxiety / 6)));
}

function dashboardMoodLabel(stressLevel) {
  if (Number(stressLevel) >= 2) {
    return "Butuh Rehat";
  }
  if (Number(stressLevel) === 1) {
    return "Stabil & Waspada";
  }
  return "Tenang & Fokus";
}

function sleepQualityLabel(value) {
  if (value >= 4) return "Baik";
  if (value >= 3) return "Cukup";
  return "Perlu Rehat";
}

function sleepQualityHint(value) {
  if (value >= 4) return "Kualitas tidur cukup stabil";
  if (value >= 3) return "Jaga rutinitas tidur tetap konsisten";
  return "Prioritaskan istirahat dan jam tidur";
}

function screenTimeLabel(value) {
  if (value <= 5) return "Seimbang";
  if (value <= 8) return "Sedang";
  return "Tinggi";
}

function screenTimeHint(value) {
  if (value <= 5) return "Beban digital masih terkendali";
  if (value <= 8) return "Coba jeda layar terjadwal";
  return "Penggunaan tinggi bisa menambah lelah";
}

function buildTrendPath(history) {
  const points = history
    .slice(0, 7)
    .reverse()
    .map((item, index, records) => {
      const level = Number(item.result?.stress_level);
      const x = records.length === 1 ? 260 : 20 + (index * 480) / (records.length - 1);
      const y = 140 - Math.max(0, Math.min(level, 2)) * 45;
      return [Math.round(x), Math.round(y)];
    });

  if (points.length < 2) {
    return "";
  }

  return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}

function buildTrendLabels(history) {
  const records = history.slice(0, 7).reverse();
  return records.map((item, index) => {
    if (!item.created_at) {
      return `#${index + 1}`;
    }
    return new Date(item.created_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    });
  });
}

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score += 35;
  if (password.length >= 10) score += 20;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  if (score >= 80) {
    return { label: "Strong", value: 100 };
  }
  if (score >= 50) {
    return { label: "Good", value: 70 };
  }
  if (score > 0) {
    return { label: "Weak", value: 35 };
  }
  return { label: "Empty", value: 0 };
}

function formatUsername(username) {
  const value = String(username || "").trim();
  if (!value) {
    return "Student";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getUserInitial(username) {
  const value = String(username || "").trim();
  return value ? value.charAt(0).toUpperCase() : "A";
}

function statusLabel(status, health) {
  if (status === "online") {
    return health?.model_loaded ? "Model Online" : "API Online";
  }
  if (status === "warning") {
    return "Model Belum Siap";
  }
  if (status === "offline") {
    return "API Offline";
  }
  return "Checking";
}

export default App;
