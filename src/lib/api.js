import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 0, // no client-side timeout — AI-generated responses (e.g. generate-opportunity) can legitimately run long
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      "Something went wrong";
    return Promise.reject({ status: error.response?.status, message });
  }
);

export const http = {
  get: (url, params, config) => api.get(url, { params, ...config }),
  post: (url, body, config) => api.post(url, body, config),
  put: (url, body, config) => api.put(url, body, config),
  patch: (url, body, config) => api.patch(url, body, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;
