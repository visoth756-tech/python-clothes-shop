const BASE_URL = "/auth";

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
