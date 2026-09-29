import {listCategories, createCategory, updateCategory, deleteCategory} from "../api/category.js";
import {getProducts} from "../api/product.js";
import {formatDate} from "../shared/format.js";
import {renderHeader} from "../component/header.js";
import {renderSidebar} from "../component/sidebar.js";
import {showAlert} from "../component/alert.js";
import {closeDeleteModal, getDeletingId, openDeleteModal} from "../component/popupConfrimDelete.js";


let categories = [];
let productList = [];
let editingCategoryId = null;

const modal = document.getElementById('categoryModal');
const form = document.getElementById('categoryForm');
const title = document.getElementById('popupTitle');
const nameInput = document.getElementById('categoryName');
const categoryList = document.getElementById('categoryList');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const closeCategoryBtn = document.getElementById('closeCategoryBtn');

function openCategoryModal(id = null) {
  editingCategoryId = id;

  if (id !== null) {
    const category = categories.find(c => String(c.id) === String(id));

    if (!category) {
      console.error('Category not found:', id);
      return;
    }

    if (title) title.textContent = 'Edit Category';
    if (nameInput) nameInput.value = category.name;
  } else {
    if (title) title.textContent = 'Add Category';
    if (form) form.reset();
  }

  if (modal) modal.classList.remove('hidden');
}

function closeCategoryModal() {
  if (modal) modal.classList.add('hidden');
  if (form) form.reset();
  editingCategoryId = null;
}

function updateCategoryCount(count) {
  const countEl = document.getElementById("categoryCount");
  const pluralEl = document.getElementById("recordPlural");

  if (countEl) countEl.textContent = count;
  if (pluralEl) pluralEl.textContent = count === 1 ? '' : 's';
}

function countProductsByCategory(categoryId) {
  return productList.filter(product => String(product.categoryId) === String(categoryId)).length;
}

function renderTable(list) {
  updateCategoryCount(list.length);

  if (!categoryList) return;

  if (list.length === 0) {
    categoryList.innerHTML = `
      <div class="px-5 py-8 text-center text-stone-400 text-sm">
        No categories found. Click "Add Category" to create one.
      </div>
    `;
    return;
  }

  categoryList.innerHTML = list.map(category => `
    <div class="grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr] border-b border-stone-100 hover:bg-stone-50 items-center">
      <div class="px-5 py-4 font-medium">
        ${(category.name)}
      </div>

      <div class="px-5 py-4 text-stone-500">
        ${countProductsByCategory(category.id)}
      </div>

      <div class="px-5 py-4 text-stone-500">
        ${formatDate(category.created_at)}
      </div>

      <div class="px-5 py-4 text-stone-500">
        ${formatDate(category.updated_at)}
      </div>

      <div class="flex justify-center px-5 py-4">
        <button
          type="button"
          onclick="openCategoryModal('${category.id}')"
          class="flex items-center text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100 cursor-pointer">
          <i class="fa-solid fa-pen"></i> Upt
        </button>

        <button
          type="button"
          data-category-id="${category.id}"
          class="delete-category flex items-center text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 cursor-pointer ml-1">
          <i class="fa-solid fa-trash"></i> Del
        </button>
      </div>
    </div>
  `).join('');
}

async function saveCategory() {
  const name = nameInput ? nameInput.value.trim() : '';

  if (!name) return;

  try {
    if (editingCategoryId !== null) {
      await updateCategory(editingCategoryId, name);
    } else {
      await createCategory(name);
    }

    closeCategoryModal();
    categories = await listCategories();
    renderTable(categories);
  } catch (error) {
    console.error('Error saving category:', error);
    showAlert(error.message || 'Failed to save category', "error");
  }
}

async function confirmDelete() {
  const id = getDeletingId();
  if (id === null) return;

  try {
    await deleteCategory(id);
    categories = await listCategories();
    renderTable(categories);
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting category:', error);
    showAlert(error.message || 'Failed to delete category', "error");
  }
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveCategory();
  });
}

if (addCategoryBtn) {
  addCategoryBtn.addEventListener('click', () => openCategoryModal());
}

if (closeCategoryBtn) {
  closeCategoryBtn.addEventListener('click', () => closeCategoryModal());
}

document.addEventListener("click", (e) => {
  const button = e.target.closest(".delete-category");

  if (!button) return;

  openDeleteModal(button.dataset.categoryId);
});

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;

async function initCategories() {
  categories = await listCategories();
  // productList = await getProducts();

  renderTable(categories);
}

renderSidebar();
renderHeader('categories');
initCategories();
