import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : ""),
  timeout: 10000,
});

function authHeaders() {
  const username = localStorage.getItem("mindtrack-username");
  const token = localStorage.getItem("mindtrack-token");
  const role = localStorage.getItem("mindtrack-role");
  return {
    ...(username ? { "X-MindTrack-Username": username } : {}),
    ...(token ? { "X-MindTrack-Token": token } : {}),
    ...(role ? { "X-MindTrack-Role": role } : {}),
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function register(username, password) {
  const response = await api.post("/api/auth/register", { username, password });
  return response.data; // { username, token }
}

export async function login(username, password) {
  const response = await api.post("/api/auth/login", { username, password });
  return response.data; // { username, token }
}

// ── Predictions ─────────────────────────────────────────────────────────────

export async function createPrediction(payload) {
  const response = await api.post("/api/predictions", payload, { headers: authHeaders() });
  return response.data;
}

export async function getPredictions() {
  const response = await api.get("/api/predictions", { headers: authHeaders() });
  return response.data;
}

export async function deletePrediction(id) {
  await api.delete(`/api/predictions/${id}`, { headers: authHeaders() });
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function checkApiHealth() {
  const response = await api.get("/api/health");
  return response.data;
}

export async function getAdminOverview() {
  const response = await api.get("/api/admin/overview", { headers: authHeaders() });
  return response.data;
}
