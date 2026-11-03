import {authHeaders, clearTokens, getRefreshToken, saveTokens} from "./token.js";

const API_BASE = "/auth";
const JWT_BASE = "/api/auth";

async function readError(res, fallback) {
  const text = await res.text();
  try {
    return JSON.parse(text).msg || text || fallback;
  } catch {
    return text || fallback;
  }
}

export async function register(username, password) {
  const res = await fetch(`${API_BASE}/register`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username, password})
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = "Registration failed";
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || errorText;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  try {
    return await res.json();
  } catch {
    return {success: true};
  }
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({username, password})
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = "Invalid username or password";
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.message || errorText;
    } catch {
      message = errorText || message;
    }
    throw new Error(message);
  }

  return res.json();
}

/** JWT login — stores the tokens and returns the logged in user. */
export async function loginWithJWT(username, password) {
  const res = await fetch(`${JWT_BASE}/login`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({username, password})
  });

  if (!res.ok) throw new Error(await readError(res, "Invalid username or password"));

  const data = await res.json();
  saveTokens(data.access_token, data.refresh_token);
  return data.user;
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(`${JWT_BASE}/refresh`, {
    method: "POST",
    headers: {Authorization: `Bearer ${refreshToken}`}
  });

  if (!res.ok) {
    clearTokens();
    throw new Error(await readError(res, "Session expired"));
  }

  const data = await res.json();
  saveTokens(data.access_token, refreshToken);
  return data.access_token;
}

export async function logoutWithJWT() {
  try {
    await fetch(`${JWT_BASE}/logout`, {
      method: "POST",
      headers: authHeaders()
    });
  } finally {
    clearTokens();
  }
}
