const BASE_URL = "/admin/api/categories";

export async function listCategories() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function getCategory(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Failed to load category");
  return res.json();
}

export async function createCategory(name) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create category");
  return data;
}

export async function updateCategory(id, name) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update category");
  return data;
}

export async function deleteCategory(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
}