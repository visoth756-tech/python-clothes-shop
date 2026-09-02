import {listCategories} from "../api/category.js";
import {getProducts, createProduct, updateProduct, deleteProduct} from "../api/product.js";
import {renderHeader} from "../component/header.js";
import {renderSidebar} from "../component/sidebar.js";
import {formatCapitalLetter, formatMoney} from "../shared/format.js";
import {getStockStatusBadge} from "./util.js";

const PRODUCTS = {
  header: [
    {name: "Product"},
    {name: "Category"},
    {name: "Price", class: "text-center"},
    {name: "Qty", class: "text-center"},
    {name: "Status", class: "text-center"},
    {name: "Action", class: "text-right"}
  ]
};

let product_list = [];
let categories = [];
let editing = null;

const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');
const title = document.getElementById('popupTitle');

const nameInput = document.getElementById('productName');
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
        ${formatCapitalLetter(category.name)}
      </option>
    `).join('')}
  `;
}

function openModal(id = null) {
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

  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
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
const grid = "grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.8fr]";

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

  console.log(product_list)

  container.innerHTML = product_list.map(product => {
    const categoryId = product.category_id ?? product.categoryId;

    return `
      <div class="grid ${grid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
        <div class="px-5 py-4 font-medium flex items-center gap-3">
          ${product.image ? `
            <img src="${productThumbSrc(product.image)}"
                 class="w-10 h-10 rounded-md object-cover border border-stone-200"
                 alt="${product.name}">
          ` : `
            <div class="w-10 h-10 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
              <i class="fa-solid fa-box text-sm"></i>
            </div>
          `}
          <span>${product.name}</span>
        </div>

        <div class="px-5 py-4 text-stone-500">
          ${getCategoryName(categoryId)}
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

        <div class="px-5 py-4 text-right">
          <button
            type="button"
            onclick="openModal('${product.id}')"
            class="text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100 cursor-pointer">
            <i class="fa-solid fa-pen"></i>
          </button>

          <button
            type="button"
            onclick="handleDeleteProduct('${product.id}')"
            class="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 cursor-pointer ml-1">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function handleSaveProduct() {
  const name = nameInput ? nameInput.value.trim() : '';
  const price = priceInput ? priceInput.value : '0';
  const categoryId = categoryInput ? categoryInput.value : '';
  const qty = qtyInput ? qtyInput.value : '0';

  if (!name || !categoryId) {
    alert('Please provide a name and category.');
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  formData.append("category_id", categoryId);
  formData.append("qty", qty);

  if (inputImage && inputImage.files[0]) {
    formData.append("image", inputImage.files[0]);
  }

  try {
    if (editing === null) {
      await createProduct(formData);
    } else {
      await updateProduct(editing, formData);
    }

    closeModal();
    product_list = await getProducts();
    renderProducts();

  } catch (error) {
    console.error('Error saving product:', error);
    alert(error.message || 'Failed to save product');
  }
}

async function handleDeleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  try {
    await deleteProduct(id);
    product_list = await getProducts();
    renderProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    alert(error.message || 'Failed to delete product');
  }
}

if (form) {
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handleSaveProduct();
  });
}

window.openModal = openModal;
window.closeModal = closeModal;
window.handleDeleteProduct = handleDeleteProduct;
window.deleteProduct = handleDeleteProduct;

async function initProducts() {
  categories = await listCategories();
  product_list = await getProducts();

  renderProducts();
}

renderSidebar();
renderHeader("products");
renderHeaderTable();
initProducts();

