import {getUsers, createUser, updateUser, deleteUser} from "../api/user.js";
import {renderHeader} from "../component/header.js";
import {renderSidebar} from "../component/sidebar.js";
import {formatCapitalLetter, formatDate} from "../shared/format.js";

const USERS = {
  header: [
    {name: "Profile"},
    {name: "Username"},
    {name: "Role", class: "text-center"},
    {name: "Status", class: "text-center"},
    {name: "Updated At", class: "text-center"},
    {name: "Action", class: "text-right"}
  ]
};

let userList = [];
let editing = null;

const modal = document.getElementById('formModel');
const form = document.getElementById('loginForm');
const title = document.getElementById('popupTitle');

const username = document.getElementById('inputUsername');
const password = document.getElementById('inputPassword');
const role = document.getElementById("role");
const status = document.getElementById("status");

const inputImage = document.getElementById("inputImage");
const imagePreview = document.getElementById("imagePreview");
const imagePlaceholder = document.getElementById("imagePlaceholder");
const replaceImage = document.getElementById("replaceImage");

const DEFAULT_AVATAR = window.DEFAULT_AVATAR_URL;
const USER_IMAGE_BASE = window.USER_IMAGE_BASE;
const USER_IMAGE_THUMB_BASE = window.USER_IMAGE_THUMB_BASE;

export function userAvatarSrc(image) {
  return image ? `${USER_IMAGE_THUMB_BASE}${image}` : DEFAULT_AVATAR;
}

function userFullImageSrc(image) {
  return image ? `${USER_IMAGE_BASE}${image}` : DEFAULT_AVATAR;
}

function openModal(id = null) {
  editing = id;
  inputImage.value = "";

  if (id !== null) {
    const user = userList.find(u => String(u.id) === String(id));

    if (!user) {
      console.error("User not found:", id);
      return;
    }

    if (title) title.textContent = "Edit User";

    if (username) username.value = user.username ?? "";
    if (password) password.value = "";
    if (role) role.value = user.role ?? "USER";
    if (status) status.value = user.status ?? "ACTIVE";

    if (user.image) {
      imagePreview.src = userFullImageSrc(user.image);
      imagePreview.classList.remove("hidden");
      imagePlaceholder.classList.add("hidden");
      replaceImage.classList.remove("hidden");
    } else {
      imagePreview.src = "";
      imagePreview.classList.add("hidden");
      imagePlaceholder.classList.remove("hidden");
      replaceImage.classList.add("hidden");
    }

  } else {
    if (title) title.textContent = "Add User";
    if (form) form.reset();

    imagePreview.src = "";
    imagePreview.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
    replaceImage.classList.add("hidden");
  }

  if (modal) modal.classList.remove("hidden");
}

function closeModal() {
  if (modal) modal.classList.add("hidden");
  if (form) form.reset();
  editing = null;
}

inputImage.addEventListener("change", () => {
  const file = inputImage.files[0];

  if (!file) return;

  imagePreview.src = URL.createObjectURL(file);

  imagePreview.classList.remove("hidden");
  imagePlaceholder.classList.add("hidden");
  replaceImage.classList.remove("hidden");
});

function renderStatusBadge(value) {
  if (value === "INACTIVE") {
    return `
      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        Inactive
      </span>
    `;
  }

  if (value === "ACTIVE") {
    return `
      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Active
      </span>
    `;
  }

  return `
    <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-600">
      ${value || 'Unknown'}
    </span>
  `;
}

const table = document.getElementById("table");
const grid = "grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_0.8fr]";

function renderTableHeader() {
  if (!table) return;

  table.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div class="grid ${grid} bg-stone-50 border-b border-stone-200">
        ${USERS.header.map(header => `
          <div class="px-5 py-3 text-xs font-bold font-mono uppercase tracking-wide ${header.class ?? ""}">
            ${header.name}
          </div>
        `).join("")}
      </div>
      <div id="userRows"></div>
    </div>
    <p class="text-xs text-stone-400 mt-3 font-mono">
      <span id="userCount">${userList.length}</span>
      record<span id="recordPlural">${userList.length === 1 ? '' : 's'}</span>
    </p>
  `;
}

function renderUsers() {
  const container = document.getElementById('userRows');
  const countEl = document.getElementById('userCount');
  const pluralEl = document.getElementById('recordPlural');

  if (countEl) countEl.textContent = userList.length;
  if (pluralEl) pluralEl.textContent = userList.length === 1 ? '' : 's';

  if (!container) return;

  if (userList.length === 0) {
    container.innerHTML = `
      <div class="px-5 py-8 text-center text-stone-400 text-sm">
        No users found.
      </div>
    `;
    return;
  }

  container.innerHTML = userList.map((u) => `
    <div class="grid ${grid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
      <div class="px-5 py-4 font-medium flex items-center gap-2">
        <img src="${userAvatarSrc(u.image)}"
             class="w-10 h-10 rounded-full object-cover border border-stone-200"
             alt="${u.username}"
             onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';">
      </div>
      
      <div class="px-5 py-4 font-medium">
        ${u.username}
      </div>

      <div class="px-5 py-4 text-stone-500 text-center">
        ${formatCapitalLetter(u.role)}
      </div>

      <div class="px-5 py-4 text-stone-500 text-center">
        ${renderStatusBadge(u.status)}
      </div>

      <div class="px-5 py-4 text-stone-500 text-center">
        ${formatDate(u.updated_at || u.created_at)}
      </div>

      <div class="px-5 py-4 text-right">
        <button type="button" onclick="openModal('${u.id}')"
          class="text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100 cursor-pointer">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button type="button" onclick="handleDeleteUser('${u.id}')"
          class="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 cursor-pointer ml-1">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username ? username.value.trim() : "");
    formData.append("role", role ? role.value : "USER");
    formData.append("status", status ? status.value : "ACTIVE");

    if (password && password.value) {
      formData.append("password", password.value);
    }

    if (inputImage && inputImage.files[0]) {
      formData.append("image", inputImage.files[0]);
    }

    try {
      if (editing) {
        await updateUser(editing, formData);
      } else {
        if (!password || !password.value) {
          alert("Password is required for new users.");
          return;
        }
        await createUser(formData);
      }

      closeModal();
      await initUsers();

    } catch (error) {
      console.error('Error saving user:', error);
      alert(error.message || 'Failed to save user');
    }
  });
}

async function handleDeleteUser(id) {
  if (!confirm("Are you sure you want to delete this user? This can't be undone.")) {
    return;
  }

  try {
    await deleteUser(id);
    await initUsers();
  } catch (error) {
    console.error('Error deleting user:', error);
    alert(error.message || 'Failed to delete user');
  }
}

window.openModal = openModal;
window.closeModal = closeModal;
window.handleDeleteUser = handleDeleteUser;
window.deleteUser = handleDeleteUser;

async function initUsers() {
  userList = await getUsers();
  renderUsers();
}

renderSidebar();
renderHeader("users");
renderTableHeader();
initUsers();