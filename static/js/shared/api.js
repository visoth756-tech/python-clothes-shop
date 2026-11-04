/* Shared API request helpers. */

export function getCsrfToken() {
  return (
    document.querySelector('meta[name="csrf-token"]')?.content ||
    document.querySelector('input[name="csrf_token"]')?.value ||
    window.CSRF_TOKEN ||
    ""
  );
}

export function apiErrorMessage(body, fallback) {
  if (typeof body === "string") return body || fallback;
  if (!body || typeof body !== "object") return fallback;

  const candidates = [body.errors, body.error, body.msg, body.message];
  for (const value of candidates) {
    if (Array.isArray(value)) {
      if (value.length) return value.join(", ");
    } else if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
}

export async function apiFetch(url, { method = "GET", json, formData, headers = {} } = {}) {
  const options = {
    method,
    headers: { ...headers }
  };

  if (formData) {
    // Let the browser set the multipart boundary.
    options.body = formData;
  } else if (json !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  }

  if (String(method).toUpperCase() !== "GET") {
    const token = getCsrfToken();
    if (token) options.headers["X-CSRFToken"] = token;
  }

  const res = await fetch(url, options);

  const text = await res.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    throw new Error(apiErrorMessage(parsed, `Request failed (${res.status})`));
  }

  return parsed;
}
