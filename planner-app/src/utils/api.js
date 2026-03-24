const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function call(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// Weather
export const getWeather = () => call("/api/weather");

// AI Schedule
export const generateSchedule = (payload, firebaseToken) =>
  call("/api/schedule", { method: "POST", body: JSON.stringify(payload) }, firebaseToken);

// Google Calendar (pass Google access token in Authorization)
export const getTodayEvents = (googleToken) =>
  call("/api/calendar/today", {}, googleToken);

export const getUpcomingEvents = (googleToken) =>
  call("/api/calendar/upcoming", {}, googleToken);

// User data (pass Firebase ID token)
export const getUserData = (firebaseToken) =>
  call("/api/user/data", {}, firebaseToken);

export const saveUserData = (data, firebaseToken) =>
  call("/api/user/data", { method: "PUT", body: JSON.stringify(data) }, firebaseToken);

export const patchUserData = (field, value, firebaseToken) =>
  call("/api/user/data", {
    method: "PATCH",
    body: JSON.stringify({ field, value }),
  }, firebaseToken);
