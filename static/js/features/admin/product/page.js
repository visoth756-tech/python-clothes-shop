import { setupPopup } from "../../../shared/popup.js";
import { escapeHtml } from "../../../shared/html.js";
import { renderHeader } from "../../../components/layout/header.js";
import { renderSidebar } from "../../../components/layout/sidebar.js";
import { openDeleteModal, closeDeleteModal } from "../../../components/modal/confirmDelete.js";
import { MSG } from "../../../shared/messages.js";
import { renderState } from "../../../shared/states.js";
import { formatCapitalLetter, formatMoney } from "../../../shared/format.js";
import { getStockStatusBadge } from "./stockBadge.js";
import { listCategories } from "../category/api.js";
import { getProducts, createProduct, updateProduct, deleteProduct } from "./api.js";

const PRODUCTS = {
  header: [
    { name: "Product" },
    { name: "Category", class: "text-center" },
    { name: "Price", class: "text-center" },
    { name: "Qty", class: "text-center" },
    { name: "Status", class: "text-center" },
    { name: "Action", class: "text-center" }
  ]
};

let product_list = [];
let categories = [];
let editing = null;

const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');
const title = document.getElementById('popupTitle');

const nameInput = document.getElementById('productName');
const descriptionInput = document.getElementById('productDescription');
function updateDescriptionCount() {
  const count = document.getElementById("descriptionCount");
  if (count && descriptionInput) count.textContent = `${descriptionInput.value.length} / ${descriptionInput.maxLength}`;
}
descriptionInput?.addEventListener("input", updateDescriptionCount);

const priceInput = document.getElementById('productPrice');
const categoryInput = document.getElementById('productCategory');
const qtyInput = document.getElementById('productQty');

const inputImage = document.getElementById("inputImage");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const replaceImage = document.getElementById("replaceImage");

const PRODUCT_IMAGE_BASE = window.PRODUCT_IMAGE_BASE;
const PRODUCT_IMAGE_THUMB_BASE = window.PRODUCT_IMAGE_THUMB_BASE;

function getThumbFilename(filename) {
  if (!filename) return "";
  return filename.replace(/(\.[a-zA-Z0-9]+)$/, "_thumb$1");
}

export function productThumbSrc(image) {
  return image ? `${PRODUCT_IMAGE_THUMB_BASE}${getThumbFilename(image)}` : "";
}

function productFullImageSrc(image) {
  return image ? `${PRODUCT_IMAGE_BASE}${image}` : "";
}

function getCategoryName(categoryId) {
  const category = categories.find(c => String(c.id) === String(categoryId));
  return category ? category.name : 'Unknown';
}

function populateCategoryOptions() {
  if (!categoryInput) return;

  categoryInput.innerHTML = `
    <option value="">Select Category</option>
    ${categories.map(category => `
      <option value="${category.id}">
        ${escapeHtml(formatCapitalLetter(category.name))}
      </option>
    `).join('')}
  `;
}

function openModal(id = null) {
  popup.clearError();
  editing = id;
  populateCategoryOptions();
  if (inputImage) inputImage.value = "";

  if (id !== null) {
    const product = product_list.find(p => String(p.id) === String(id));

    if (!product) {
      console.error('Product not found:', id);
      return;
    }

    if (title) title.textContent = 'Edit Product';

    if (nameInput) nameInput.value = product.name || '';
    if (descriptionInput) descriptionInput.value = product.description || '';
    if (categoryInput) categoryInput.value = product.category_id ?? '';
    if (priceInput) priceInput.value = product.price ?? '';
    if (qtyInput) qtyInput.value = product.qty ?? '';

    if (product.image) {
      if (imagePreview) {
        imagePreview.src = productFullImageSrc(product.image);
        imagePreview.classList.remove("hidden");
      }
      if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
      if (replaceImage) replaceImage.classList.remove("hidden");
    } else {
      if (imagePreview) {
        imagePreview.src = "";
        imagePreview.classList.add("hidden");
      }
      if (imagePlaceholder) imagePlaceholder.classList.remove("hidden");
      if (replaceImage) replaceImage.classList.add("hidden");
    }

  } else {
    if (title) title.textContent = 'Add Product';
    if (form) form.reset();
    if (qtyInput) qtyInput.value = '0';

    if (imagePreview) {
      imagePreview.src = "";
      imagePreview.classList.add("hidden");
    }
    if (imagePlaceholder) imagePlaceholder.classList.remove("hidden");
    if (replaceImage) replaceImage.classList.add("hidden");
  }

  updateDescriptionCount();
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  popup.clearError();
  if (modal) modal.classList.add('hidden');
  if (form) form.reset();
  if (imagePreview) {
    imagePreview.src = "";
    imagePreview.classList.add("hidden");
  }
  if (imagePlaceholder) imagePlaceholder.classList.remove("hidden");
  if (replaceImage) replaceImage.classList.add("hidden");
  if (inputImage) inputImage.value = "";
  editing = null;
  updateDescriptionCount();
}

if (inputImage) {
  inputImage.addEventListener("change", () => {
    const file = inputImage.files[0];
    if (!file) return;

    if (imagePreview) {
      imagePreview.src = URL.createObjectURL(file);
      imagePreview.classList.remove("hidden");
    }
    if (imagePlaceholder) imagePlaceholder.classList.add("hidden");
    if (replaceImage) replaceImage.classList.remove("hidden");
  });
}

const table = document.getElementById('table');
const grid = "grid-cols-[2fr_1fr_1fr_1fr_1fr_0.8fr]";

function renderHeaderTable() {
  if (!table) return;

  table.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div class="grid ${grid} bg-stone-50 border-b border-stone-200">
        ${PRODUCTS.header.map(header => `
          <div class="px-5 py-3 text-xs font-bold font-mono uppercase tracking-wide ${header.class ?? ''}">
            ${header.name}
          </div>
        `).join('')}
      </div>
      <div id="productRows"></div>
    </div>
    <p class="text-xs text-stone-400 mt-3 font-mono">
      <span id="productCount">${product_list.length}</span>
      record<span id="recordPlural">${product_list.length === 1 ? '' : 's'}</span>
    </p>
  `;
}

function renderProducts() {
  const container = document.getElementById('productRows');
  const countEl = document.getElementById('productCount');
  const pluralEl = document.getElementById('recordPlural');

  if (countEl) countEl.textContent = product_list.length;
  if (pluralEl) pluralEl.textContent = product_list.length === 1 ? '' : 's';

  if (!container) return;

  if (product_list.length === 0) {
    container.innerHTML = `
      <div class="px-5 py-8 text-center text-stone-400 text-sm">
        No products found. Click "Add Product" to add your first product.
      </div>
    `;
    return;
  }

  container.innerHTML = product_list.map(product => {
    const categoryId = product.category_id ?? product.categoryId;

    return `
      <div class="grid ${grid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
        <div class="px-5 py-4 font-medium flex items-center gap-3">
          ${product.image ? `
            <img src="${productThumbSrc(product.image)}"
                 class="w-10 h-10 rounded-md object-cover border border-stone-200"
                 alt="${escapeHtml(product.name)}">
          ` : `
            <div class="w-10 h-10 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
              <i class="fa-solid fa-box text-sm"></i>
            </div>
          `}
          <div class="min-w-0">
            <span>${escapeHtml(product.name)}</span>
            <p class="text-xs text-stone-500 whitespace-pre-wrap break-words mt-1">${escapeHtml(product.description || 'No description')}</p>
          </div>
        </div>

        <div class="px-5 py-4 text-stone-500 text-center">
          ${escapeHtml(getCategoryName(categoryId))}
        </div>

        <div class="px-5 py-4 text-stone-500 text-center">
          ${formatMoney(product.price)}
        </div>

        <div class="px-5 py-4 text-stone-700 font-semibold text-center">
          ${product.qty}
        </div>

        <div class="px-5 py-4 text-center">
          ${getStockStatusBadge(product.qty)}
        </div>

        <div class="flex px-5 py-4 text-right">
          <button
            type="button"
            onclick="openModal('${product.id}')"
            class="flex items-center text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100 cursor-pointer">
            <i class="fa-solid fa-pen"></i>Upt
          </button>

          <button
            type="button"
            data-product-id="${product.id}"
            class="delete-product flex items-center text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 cursor-pointer ml-1">
            <i class="fa-solid fa-trash"></i>Del
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleSaveProduct() {
  const name = nameInput ? nameInput.value.trim() : '';
  const description = descriptionInput ? descriptionInput.value.trim() : '';
  const price = priceInput ? priceInput.value : '0';
  const categoryId = categoryInput ? categoryInput.value : '';
  const qty = qtyInput ? qtyInput.value : '0';

  if (!name || !categoryId) {
    popup.showError('Please provide a name and category.');
    return;
  }

  if (form && !form.reportValidity()) return;
  if (descriptionInput && description.length > descriptionInput.maxLength) {
    popup.showError(`Description must be ${descriptionInput.maxLength} characters or less.`);
    return;
  }
  const saveButton = form?.querySelector('button[type="submit"]');
  if (saveButton?.disabled) return;
  if (saveButton) saveButton.disabled = true;
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("price", price);
  formData.append("category_id", categoryId);
  formData.append("qty", qty);

  if (inputImage && inputImage.files[0]) {
    formData.append("image", inputImage.files[0]);
  }

  try {
    if (editing === null) {
      await createProduct(formData);
      window.toastSuccess(MSG.success.productCreated);
    } else {
      await updateProduct(editing, formData);
      window.toastSuccess(MSG.success.productUpdated);
    }

    closeModal();
    product_list = await getProducts();
    renderProducts();

  } catch (error) {
    console.error('Error saving product:', error);
    popup.showError(error.message || MSG.error.saveFailed("product"));
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

async function handleDeleteProduct(id) {
  const targetId = id;
  if (targetId === null || targetId === undefined) return;

  try {
    await deleteProduct(targetId);
    product_list = await getProducts();
    renderProducts();
    closeDeleteModal();
    window.toastSuccess(MSG.success.productDeleted);
  } catch (error) {
    console.error('Error deleting product:', error);
    window.toastError(error.message || MSG.error.deleteFailed("product"));
  }
}

if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSaveProduct();
  });
}

document.addEventListener("click", (e) => {
  const button = e.target.closest(".delete-product");

  if (!button) return;

  const id = button.dataset.productId;
  const product = product_list.find(p => String(p.id) === String(id));

  openDeleteModal({
    id,
    name: product ? product.name : "",
    onConfirm: (deletedId) => handleDeleteProduct(deletedId)
  });
});

window.openModal = openModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;

async function initProducts() {
  renderState("productRows", { loading: true });

  try {
    categories = await listCategories();
    product_list = await getProducts();
    renderProducts();
  } catch (error) {
    console.error('Error loading products:', error);
    renderState("productRows", {
      error: MSG.error.loadFailed("products"),
      retry: "initProducts"
    });
  }
}

window.initProducts = initProducts;

renderSidebar();
renderHeader("products");
renderHeaderTable();
initProducts();

const popup = setupPopup("productModal", () => closeModal());
