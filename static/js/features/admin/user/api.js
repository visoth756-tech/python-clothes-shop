import {authHeaders} from "../../../shared/tokens.js";
import {getCsrfToken, apiErrorMessage} from "../../../shared/api.js";

const BASE_URL = "/admin/api/users";

function getThumbFilename(filename) {
  if (!filename) return null;
  return filename.replace(/(\.[a-zA-Z0-9]+)$/, "_thumb$1");
}

export function getUserImageUrl(user) {
  if (!user?.image) return null;
  return window.USER_IMAGE_BASE + user.image;
}

export function getUserThumbUrl(user) {
  if (!user?.image) return null;
  return window.USER_IMAGE_THUMB_BASE + getThumbFilename(user.image);
}

export async function getUsers() {
  const res = await fetch(BASE_URL, {headers: authHeaders()});

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(apiErrorMessage(body, "Failed to fetch users"));
  }

  return res.json();
}

export async function getUserById(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {headers: authHeaders()});

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(apiErrorMessage(body, "Failed to fetch user"));
  }

  return res.json();
}

export async function createUser(formData) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: authHeaders({
      "X-CSRFToken": getCsrfToken()
    }),
    body: formData,          // no Content-Type header — browser sets the multipart boundary itself
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to create user"));
  return data;
}

export async function updateUser(id, formData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders({
      "X-CSRFToken": getCsrfToken()
    }),
    body: formData,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to update user"));
  return data;
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders({
      "X-CSRFToken": getCsrfToken()
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(apiErrorMessage(data, "Failed to delete user"));
  return data;
}
