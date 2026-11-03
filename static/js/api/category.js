import {authHeaders} from "./token.js";

const BASE_URL = "/admin/api/categories";

function getCsrfToken() {
  return document.querySelector(
    '#categoryForm input[name="csrf_token"]'
  ).value;
}

export async function listCategories() {
  const res = await fetch(BASE_URL, {headers: authHeaders()});
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function getCategory(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {headers: authHeaders()});
  if (!res.ok) throw new Error("Failed to load category");
  return res.json();
}

export async function createCategory(name) {
  const csrfToken = getCsrfToken()

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: authHeaders({
      "Content-Type": "application/json",
      "X-CSRFTOKEN": csrfToken
    }),
    body: JSON.stringify({name}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create category");
  return data;
}

export async function updateCategory(id, name) {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "Content-Type": "application/json",
      "X-CSRFTOKEN": csrfToken
    }),
    body: JSON.stringify({name}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update category");
  return data;
}

export async function deleteCategory(id) {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders({
      "X-CSRFTOKEN": csrfToken
    }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete category");
  }
}