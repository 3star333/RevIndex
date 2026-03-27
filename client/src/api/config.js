// All API calls go through this base URL.
// Set VITE_API_URL in /client/.env to change the target.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default API_URL;
