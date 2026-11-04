import {authHeaders} from "../../../shared/tokens.js";
import {getCsrfToken, apiErrorMessage} from "../../../shared/api.js";

const BASE_URL = "/admin/api/categories";

export async function listCategories() {
  const res = await fetch(BASE_URL, {headers: authHeaders()});

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(apiErrorMessage(body, "Failed to load categories"));
  }

  return res.json();
}

export async function getCategory(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {headers: authHeaders()});

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(apiErrorMessage(body, "Failed to load category"));
  }

  return res.json();
}

export async function createCategory(name) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    }),
    body: JSON.stringify({name}),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to create category"));
  return data;
}

export async function updateCategory(id, name) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      "X-CSRFToken": getCsrfToken()
    }),
    body: JSON.stringify({name}),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to update category"));
  return data;
}

export async function deleteCategory(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders({
      "X-CSRFToken": getCsrfToken()
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to delete category"));
  return data;
}
