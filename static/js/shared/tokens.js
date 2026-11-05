const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function saveTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

/** Merges an Authorization header into the given headers, when a token exists. */
export function authHeaders(headers = {}) {
  const token = getAccessToken();
  return token ? {Authorization: `Bearer ${token}`, ...headers} : headers;
}