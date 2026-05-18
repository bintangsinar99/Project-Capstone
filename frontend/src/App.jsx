import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CheckCircle2,
  Droplets,
  FileText,
  Footprints,
  HelpCircle,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import {
  checkApiHealth,
  createPrediction,
  deletePrediction,
  getPredictions,
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
    title: "Psychological Indicators",
    fields: [
      ["anxiety_level", "Anxiety Level", 0, 21, 1],
      ["self_esteem", "Self Esteem", 0, 30, 1],
      ["depression", "Depression", 0, 27, 1],
      ["mental_health_history", "Mental Health History", 0, 1, 1],
      ["social_support", "Social Support", 0, 3, 1],
      ["peer_pressure", "Peer Pressure", 0, 5, 1],
      ["bullying", "Bullying Experience", 0, 5, 1],
    ],
  },
  {
    title: "Academic & Daily Wellness",
    fields: [
      ["headache", "Headache Intensity", 0, 5, 1],
      ["sleep_quality", "Sleep Quality", 0, 5, 1],
      ["academic_performance", "Academic Performance", 0, 5, 1],
      ["study_load", "Study Load", 0, 5, 1],
      ["future_career_concerns", "Career Concerns", 0, 5, 1],
      ["Age", "Age", 17, 60, 1],
      ["study_stress_ratio", "Study Stress Ratio", 0, 10, 0.1],
      ["mental_risk_score", "Mental Risk Score", 0, 80, 1],
    ],
  },
  {
    title: "Digital Activity",
    fields: [
      ["Total_App_Usage_Hours", "Total App Usage", 0, 24, 0.1],
      ["Daily_Screen_Time_Hours", "Daily Screen Time", 0, 24, 0.1],
      ["Number_of_Apps_Used", "Apps Used", 0, 80, 1],
      ["Social_Media_Usage_Hours", "Social Media Usage", 0, 24, 0.1],
      ["Productivity_App_Usage_Hours", "Productivity Apps", 0, 24, 0.1],
      ["Gaming_App_Usage_Hours", "Gaming Apps", 0, 24, 0.1],
      ["digital_overload_score", "Digital Overload", 0, 40, 0.1],
      ["productivity_balance_score", "Productivity Balance", 0, 5, 0.01],
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
  ["settings", Settings, "Settings"],
];

const interventions = [
  [Droplets, "Hydration Check", "Drink 250ml water now."],
  [Moon, "Power Nap", "Rest for 15 mins."],
  [Footprints, "Quick Walk", "5 min air break."],
  [Zap, "Digital Detox", "Eyes off screen."],
];

const fallbackHistory = [
  { id: "fallback-1", date: "Oct 24, 2023", level: "Low (18%)", action: "Deep Breathing Session", sentiment: "Positive" },
  { id: "fallback-2", date: "Oct 23, 2023", level: "Moderate (45%)", action: "Guided Meditation", sentiment: "Neutral" },
  { id: "fallback-3", date: "Oct 22, 2023", level: "Low (22%)", action: "Morning Yoga", sentiment: "Positive" },
];

function App() {
  const [activeView, setActiveView] = useState("dashboard");
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

  const latest = history[0];
  const latestResult = latest?.result;
  const probabilities = latestResult?.probabilities || { rendah: 0.12, sedang: 0.68, tinggi: 0.2 };
  const isFormValid = useMemo(() => Object.values(form).every((value) => value !== ""), [form]);
  const filteredHistory = useMemo(() => filterHistory(history, searchTerm), [history, searchTerm]);

  useEffect(() => {
    refreshData();
  }, []);

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

  function startSession(title = "10-minute Mindfulness Meditation") {
    setActiveSession({ title, startedAt: new Date().toLocaleTimeString("id-ID") });
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
    setActiveView("dashboard");
    showToast("Logout demo berhasil. Data lokal tetap aman.");
  }

  return (
    <main className="mindtrack-shell">
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
                placeholder="Search insights..."
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
            <div className="avatar">A</div>
          </div>
          {showNotifications && (
            <NotificationsPanel status={status} history={history} onClose={() => setShowNotifications(false)} />
          )}
          {showSettingsMenu && (
            <SettingsMenu
              health={health}
              status={status}
              onClose={() => setShowSettingsMenu(false)}
              onOpenSettings={() => {
                setActiveView("settings");
                setShowSettingsMenu(false);
              }}
              onRefresh={async () => {
                await refreshData();
                setShowSettingsMenu(false);
              }}
              onOpenResources={() => {
                setActiveView("resources");
                setShowSettingsMenu(false);
              }}
            />
          )}
        </header>

        <div className={`api-status ${status}`}>
          <Activity size={16} />
          <span>{statusLabel(status, health)}</span>
          <button className="refresh-button" type="button" onClick={refreshData} aria-label="Refresh API status">
            <RefreshCw size={14} />
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        {activeView === "dashboard" && (
          <DashboardView
            form={form}
            latestResult={latestResult}
            history={history}
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

        {activeView === "settings" && <SettingsView health={health} status={status} refreshData={refreshData} />}

        {toast && <Toast message={toast} />}
        {activeSession && <SessionModal session={activeSession} onClose={() => setActiveSession(null)} />}
      </section>
    </main>
  );
}

function DashboardView({ form, latestResult, history, setActiveView, startSession }) {
  const stressClass = latestResult?.stress_class || "Low";
  const confidence = latestResult ? Math.round(latestResult.confidence * 100) : 24;

  return (
    <div className="view-stack">
      <section className="hero-dashboard">
        <h2>Welcome back, Alex!</h2>
        <p>Ready for your daily check-in? Your focus is currently improving.</p>
      </section>

      <section className="metric-grid">
        <article className="metric-card ring-card">
          <div className="stress-ring" style={{ "--progress": `${confidence}%` }}>
            <strong>{confidence}%</strong>
            <span>Index</span>
          </div>
          <p>Stress Level</p>
          <h3>{stressClass}</h3>
        </article>

        <article className="metric-card">
          <Moon className="metric-icon" size={34} />
          <span className="status-pill">Good</span>
          <p>Sleep Quality</p>
          <h3>{Math.max(4, form.sleep_quality + 4.5).toFixed(1)}h</h3>
          <small>+45m from yesterday</small>
        </article>

        <article className="metric-card">
          <BarChart3 className="metric-icon" size={34} />
          <span className="trend">-12%</span>
          <p>Screen Balance</p>
          <h3>{Math.floor(form.Daily_Screen_Time_Hours / 2)}h 20m</h3>
          <small>Below average</small>
        </article>
      </section>

      <section className="dashboard-grid">
        <AiRecommendation latestResult={latestResult} startSession={startSession} />
        <article className="small-stat">
          <Footprints size={26} />
          <strong>42</strong>
          <span>Active Minutes</span>
        </article>
        <article className="small-stat">
          <Heart className="heart" size={28} fill="currentColor" />
          <strong>72 <small>BPM</small></strong>
          <span>Heart Rate</span>
        </article>
        <article className="small-stat">
          <BarChart3 size={26} />
          <strong>Focused</strong>
          <span>Digital Usage</span>
        </article>
        <StressTrend />
      </section>

      <HistoryTable history={history} setActiveView={setActiveView} />
      <Disclaimer />
    </div>
  );
}

function PredictionForm({ form, setForm, updateField, handleSubmit, isLoading }) {
  return (
    <form className="prediction-layout" onSubmit={handleSubmit}>
      <section className="assessment-card">
        <div className="section-heading">
          <span>Latest analysis</span>
          <h2>Prediction Form</h2>
          <p>Fill in your self-reported indicators and digital activity pattern.</p>
        </div>

        <div className="quick-actions">
          <button type="button" className="ghost-button" onClick={() => setForm(demoCases.low)}>
            Low sample
          </button>
          <button type="button" className="ghost-button" onClick={() => setForm(demoCases.high)}>
            High sample
          </button>
          <button type="button" className="ghost-button" onClick={() => setForm(initialForm)}>
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
                    type="number"
                    min={min}
                    max={max}
                    step={step}
                    value={form[name]}
                    onChange={(event) => updateField(name, event.target.value, step)}
                  />
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        <button className="primary-button" type="submit" disabled={isLoading}>
          <Send size={18} />
          {isLoading ? "Processing..." : "Predict Stress"}
        </button>
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
            {interventions.map(([Icon, title, text]) => (
              <button className="intervention-card" type="button" key={title} onClick={() => startSession(title)}>
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
        {interventions.map(([Icon, title, text]) => (
          <button className="intervention-card" type="button" key={title} onClick={() => startSession(title)}>
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

function AiRecommendation({ latestResult, startSession }) {
  return (
    <article className="ai-card">
      <div className="ai-title">
        <Sparkles size={24} />
        <h2>AI Recommendation</h2>
      </div>
      <p>{latestResult?.ai_advice || "Based on your elevated indicators, we recommend a short wellness pause."}</p>
      <div className="priority-action">
        <div className="action-icon">
          <Activity size={24} />
        </div>
        <div>
          <span>Priority Action</span>
          <strong>10-minute Mindfulness Meditation</strong>
        </div>
      </div>
      <button className="primary-button" type="button" onClick={() => startSession("10-minute Mindfulness Meditation")}>
        Start Session
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

function StressTrend() {
  return (
    <article className="trend-card">
      <div>
        <h2>Stress Trend</h2>
        <span>Last 7 Days</span>
      </div>
      <svg viewBox="0 0 520 180" role="img" aria-label="Stress trend line">
        <path d="M20 125 C80 70 130 115 180 105 C250 88 250 28 320 36 C385 44 382 165 455 140 C490 128 485 65 505 55" />
      </svg>
      <div className="days">
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
        <span>Sun</span>
      </div>
    </article>
  );
}

function HistoryTable({ history, setActiveView }) {
  const rows = history.length ? history.slice(0, 3) : fallbackHistory;

  return (
    <section className="history-table">
      <div className="table-title">
        <h2>Recent History</h2>
        <button className="text-button" type="button" onClick={() => setActiveView("history")}>
          View All
        </button>
      </div>
      <div className="table-grid header">
        <span>Date</span>
        <span>Stress Level</span>
        <span>Action Taken</span>
        <span>Sentiment</span>
      </div>
      {rows.map((item) => (
        <div className="table-grid" key={item.id}>
          <span>{item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : item.date}</span>
          <span>{item.result?.stress_class || item.level}</span>
          <span>{item.action || "Guided Meditation"}</span>
          <span className="sentiment">{item.sentiment || "Positive"}</span>
        </div>
      ))}
    </section>
  );
}

function SettingsView({ health, status, refreshData }) {
  return (
    <section className="assessment-card">
      <div className="section-heading">
        <span>System settings</span>
        <h2>Settings</h2>
        <p>Monitor API, model, and app readiness before deployment.</p>
      </div>

      <div className="settings-grid">
        <article>
          <CheckCircle2 size={24} />
          <strong>API Status</strong>
          <span>{statusLabel(status, health)}</span>
        </article>
        <article>
          <Brain size={24} />
          <strong>Model Mode</strong>
          <span>{health?.model_mode || "Unknown"}</span>
        </article>
        <article>
          <BarChart3 size={24} />
          <strong>Loaded Models</strong>
          <span>{health?.n_models ?? 0} models</span>
        </article>
      </div>

      <button className="primary-button" type="button" onClick={refreshData}>
        <RefreshCw size={18} />
        Refresh System
      </button>
    </section>
  );
}

function NotificationsPanel({ status, history, onClose }) {
  return (
    <aside className="notifications-panel">
      <div>
        <strong>Notifications</strong>
        <button type="button" onClick={onClose} aria-label="Close notifications">
          <X size={18} />
        </button>
      </div>
      <p>API status: {status}</p>
      <p>{history.length ? `Prediksi terakhir: ${history[0].result.stress_class}` : "Belum ada prediksi tersimpan."}</p>
      <p>Groq AI aktif jika backend dijalankan dengan environment key.</p>
    </aside>
  );
}

function SettingsMenu({ health, status, onClose, onOpenSettings, onRefresh, onOpenResources }) {
  return (
    <aside className="settings-menu">
      <div className="settings-menu-head">
        <div>
          <strong>Quick Settings</strong>
          <span>{statusLabel(status, health)}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close settings menu">
          <X size={18} />
        </button>
      </div>

      <button type="button" onClick={onOpenSettings}>
        <Settings size={18} />
        <span>System Settings</span>
      </button>
      <button type="button" onClick={onRefresh}>
        <RefreshCw size={18} />
        <span>Refresh API Status</span>
      </button>
      <button type="button" onClick={onOpenResources}>
        <BookOpen size={18} />
        <span>Support Resources</span>
      </button>

      <div className="settings-menu-foot">
        <span>Model</span>
        <strong>{health?.model_mode || "Unknown"} - {health?.n_models ?? 0} models</strong>
      </div>
    </aside>
  );
}

function SessionModal({ session, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="session-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close session">
          <X size={20} />
        </button>
        <TimerReset size={42} />
        <span>Started at {session.startedAt}</span>
        <h2>{session.title}</h2>
        <p>Tarik napas perlahan 4 detik, tahan 4 detik, lalu hembuskan 6 detik. Ulangi sampai tubuh terasa lebih stabil.</p>
        <button className="primary-button" type="button" onClick={onClose}>
          Finish Session
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
