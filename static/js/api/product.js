const BASE_URL = "/admin/api/products";

function getCsrfToken() {
  return document.querySelector(
    '#productForm input[name="csrf_token"]'
  ).value;
}

function getThumbFilename(filename) {
  if (!filename) return null;
  return filename.replace(/(\.[a-zA-Z0-9]+)$/, "_thumb$1");
}

export function getProductImageUrl(product) {
  if (!product?.image) return null;
  return (window.PRODUCT_IMAGE_BASE || "/static/uploads/products/") + product.image;
}

export function getProductThumbUrl(product) {
  if (!product?.image) return null;
  return (window.PRODUCT_IMAGE_THUMB_BASE || "/static/uploads/products/") + getThumbFilename(product.image);
}

async function handleResponse(res) {
  let body = null;
  try {
    body = await res.json();
  } catch (_) {
    // no JSON body (e.g. 204 No Content)
  }

  if (!res.ok) {
    const message = (body && body.error) || `Request failed with status ${res.status}`;
    throw new Error(message);
  }

  return body;
}

export async function getProducts() {
  const res = await fetch(BASE_URL, {
    method: "GET",
    headers: {
      "Accept": "application/json",
    },
  });
  return handleResponse(res);
}

export async function getByIdProduct(productId) {
  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: "GET",
    headers: {
      "Accept": "application/json"
    },
  });
  return handleResponse(res);
}

export async function createProduct(data, imageFile) {
  const csrfToken = getCsrfToken();

  let body = data;
  if (!(data instanceof FormData)) {
    const formData = new FormData();
    formData.append("name", data.name ?? "");
    formData.append("price", data.price ?? 0);
    formData.append("qty", data.qty ?? 0);
    formData.append("category_id", data.category_id ?? data.categoryId ?? "");
    if (imageFile || data.image) {
      formData.append("image", imageFile || data.image);
    }
    body = formData;
  }

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "X-CSRFTOKEN": csrfToken
    },
    body: body,
  });
  return handleResponse(res);
}

export async function updateProduct(productId, data, imageFile) {
  const csrfToken = getCsrfToken();

  let body = data;
  if (!(data instanceof FormData)) {
    const formData = new FormData();
    formData.append("name", data.name ?? "");
    formData.append("price", data.price ?? 0);
    formData.append("qty", data.qty ?? 0);
    formData.append("category_id", data.category_id ?? data.categoryId ?? "");
    if (imageFile || data.image) {
      formData.append("image", imageFile || data.image);
    }
    body = formData;
  }

  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: "PUT",
    headers: {
      "X-CSRFTOKEN": csrfToken
    },
    body: body,
  });
  return handleResponse(res);
}

export async function deleteProduct(productId) {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${BASE_URL}/${productId}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "X-CSRFTOKEN": csrfToken
    },
  });
  return handleResponse(res);
}