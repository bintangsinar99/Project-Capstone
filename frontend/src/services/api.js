import axios from "axios";

const modelApi = axios.create({
  baseURL:
    import.meta.env.VITE_MODEL_API_URL ||
    import.meta.env.VITE_API_URL ||
    "https://zidanpw-mindtrack-stress-detection-api.hf.space/",
  timeout: 15000,
});

const backendApi = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000/" : ""),
  timeout: 10000,
});

function authHeaders() {
  const username = localStorage.getItem("mindtrack-username");
  const token = localStorage.getItem("mindtrack-token");
  return {
    ...(username ? { "X-MindTrack-Username": username } : {}),
    ...(token ? { "X-MindTrack-Token": token } : {}),
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function register(username, password) {
  const response = await backendApi.post("/api/auth/register", { username, password });
  return response.data; // { username, token }
}

export async function login(username, password) {
  const response = await backendApi.post("/api/auth/login", { username, password });
  return response.data; // { username, token }
}

// ── Predictions ─────────────────────────────────────────────────────────────

export async function createPrediction(payload) {
  const response = await backendApi.post("/api/predictions", payload, { headers: authHeaders() });
  return response.data;
}

export async function getPredictions() {
  const response = await backendApi.get("/api/predictions", { headers: authHeaders() });
  return response.data;
}

export async function deletePrediction(id) {
  await backendApi.delete(`/api/predictions/${id}`, { headers: authHeaders() });
}

// ── Health ───────────────────────────────────────────────────────────────────

export async function checkApiHealth() {
  const response = await modelApi.get("/api/health");
  return {
    ...response.data,
    model_available:
      response.data.model_available ?? response.data.model_loaded ?? response.data.status === "ok",
  };
}
