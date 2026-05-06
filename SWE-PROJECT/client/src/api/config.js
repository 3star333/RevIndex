// In dev (Vite dev server on :5173), proxy to Express on :5000.
// In production the frontend IS served by Express, so use relative URLs ("").
const API_URL = import.meta.env.VITE_API_URL
  ?? (import.meta.env.DEV ? "http://localhost:5000" : "");

export default API_URL;
