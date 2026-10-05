const BASE_URL = "/admin/api/users";

function getCsrfToken() {
  return document.querySelector(
    '#formModel input[name="csrf_token"]'
  ).value;
}

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
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function getUserById(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function createUser(formData) {
  const csrfToken = getCsrfToken();

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "X-CSRFTOKEN": csrfToken
    },
    body: formData,          // no Content-Type header — browser sets the multipart boundary itself
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create user");
  }
  return res.json();
}

export async function updateUser(id, formData) {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "X-CSRFTOKEN": csrfToken
    },
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(id) {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: {
      "X-CSRFTOKEN": csrfToken
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete user");
  }
  return res.json();
}