import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : ""),
  timeout: 10000,
});

export async function createPrediction(payload) {
  const response = await api.post("/api/predictions", payload);
  return response.data;
}

export async function getPredictions() {
  const response = await api.get("/api/predictions");
  return response.data;
}

export async function deletePrediction(id) {
  await api.delete(`/api/predictions/${id}`);
}

export async function checkApiHealth() {
  const response = await api.get("/api/health");
  return response.data;
}
