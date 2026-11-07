import {setupPopup} from "../../../shared/popup.js";
import {renderHeader} from "../../../components/layout/header.js";
import {renderSidebar} from "../../../components/layout/sidebar.js";
import {openDeleteModal, closeDeleteModal} from "../../../components/modal/confirmDelete.js";
import {MSG} from "../../../shared/messages.js";
import {renderState} from "../../../shared/states.js";
import {formatCapitalLetter, formatDate} from "../../../shared/format.js";
import {getUsers, createUser, updateUser, deleteUser} from "./api.js";
import {clearTokens} from "../../../shared/tokens.js";

const USERS = {
  header: [
    {name: "Profile"},
    {name: "Username"},
    {name: "Role", class: "text-center"},
    {name: "Status", class: "text-center"},
    {name: "Updated At", class: "text-center"},
    {name: "Action", class: "text-center"}
  ]
};

let userList = [];
let editing = null;
let removeImageRequested = false;

function isCurrentUser(user) {
  return Boolean(user?.is_current_user) || (
    window.CURRENT_USER?.id != null &&
    String(user?.id) === String(window.CURRENT_USER.id)
  );
}

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
const removeImage = document.getElementById("removeImage");
removeImage.addEventListener("click", () => {
  removeImageRequested = true;
  inputImage.value = "";
  imagePreview.src = "";
  imagePreview.classList.add("hidden");
  imagePlaceholder.classList.remove("hidden");
  replaceImage.classList.add("hidden");
  removeImage.classList.add("hidden");
});

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
  popup.clearError();
  editing = id;
  removeImageRequested = false;
  inputImage.value = "";
  if (status) { status.disabled = false; status.parentElement.hidden = false; }
  if (role) { role.disabled = false; role.parentElement.hidden = false; }

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
    if (role) { role.disabled = isCurrentUser(user); role.parentElement.hidden = isCurrentUser(user); }
    if (status) status.value = user.status ?? "ACTIVE";
    if (status) { status.disabled = isCurrentUser(user); status.parentElement.hidden = isCurrentUser(user); }
    if (status) status.title = isCurrentUser(user) ? "You cannot change your own account status." : "";

    if (user.image) {
      imagePreview.src = userFullImageSrc(user.image);
      imagePreview.classList.remove("hidden");
      imagePlaceholder.classList.add("hidden");
      replaceImage.classList.remove("hidden");
      removeImage.classList.remove("hidden");
    } else {
      imagePreview.src = "";
      imagePreview.classList.add("hidden");
      imagePlaceholder.classList.remove("hidden");
      replaceImage.classList.add("hidden");
      removeImage.classList.add("hidden");
    }

  } else {
    if (title) title.textContent = "Add User";
    if (form) form.reset();

    imagePreview.src = "";
    imagePreview.classList.add("hidden");
    imagePlaceholder.classList.remove("hidden");
    replaceImage.classList.add("hidden");
    removeImage.classList.add("hidden");
  }

  if (modal) modal.classList.remove("hidden");
}

function closeModal() {
  popup.clearError();
  if (modal) modal.classList.add("hidden");
  if (form) form.reset();
  editing = null;
}

inputImage.addEventListener("change", () => {
  const file = inputImage.files[0];
  if (file) removeImageRequested = false;

  if (!file) return;

  imagePreview.src = URL.createObjectURL(file);

  imagePreview.classList.remove("hidden");
  imagePlaceholder.classList.add("hidden");
  replaceImage.classList.remove("hidden");
  removeImage.classList.remove("hidden");
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

      <div class="flex px-5 py-4 text-right">
        <button type="button" onclick="openModal('${u.id}')"
          class="flex items-center text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100 cursor-pointer">
          <i class="fa-solid fa-pen"></i>Upt
        </button>
        <button type="button"
          data-user-id="${u.id}"
          ${isCurrentUser(u) ? 'disabled title="You cannot delete your own account."' : ''}
          class="delete-user flex items-center text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 cursor-pointer ml-1">
          <i class="fa-solid fa-trash"></i>Del
        </button>
      </div>
    </div>
  `).join('');
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const editedUser = userList.find(u => String(u.id) === String(editing));
    if (editing && isCurrentUser(editedUser) && status.value !== editedUser.status) {
      popup.showError("You cannot change your own account status.");
      return;
    }

    const formData = new FormData();
    if (editing !== null && removeImageRequested) formData.append("remove_image", "1");
    formData.append("username", username ? username.value.trim() : "");
    if (!isCurrentUser(editedUser)) formData.append("role", role ? role.value : "USER");
    if (!isCurrentUser(editedUser)) formData.append("status", status ? status.value : "ACTIVE");

    if (password && password.value) {
      formData.append("password", password.value);
    }

    if (inputImage && inputImage.files[0]) {
      formData.append("image", inputImage.files[0]);
    }

    try {
      if (editing) {
        await updateUser(editing, formData);
        if (isCurrentUser(editedUser)) {
          try {
            clearTokens();
          } finally {
            location.replace("/auth/login?updated=1");
          }
          return;
        }
        window.toastSuccess(MSG.success.userUpdated);
      } else {
        if (!password || !password.value) {
          popup.showError("Password is required for new users.");
          return;
        }
        await createUser(formData);
        window.toastSuccess(MSG.success.userCreated);
      }

      closeModal();
      await initUsers();

    } catch (error) {
      console.error('Error saving user:', error);
      popup.showError(error.message || MSG.error.saveFailed("user"));
    }
  });
}

async function handleDeleteUser(id) {
  const targetId = id;
  if (targetId === null || targetId === undefined) return;
  if (isCurrentUser(userList.find(u => String(u.id) === String(targetId)))) {
    window.toastError("You cannot delete your own account.");
    return;
  }

  try {
    await deleteUser(targetId);
    await initUsers();
    closeDeleteModal();
    window.toastSuccess(MSG.success.userDeleted);
  } catch (error) {
    console.error('Error deleting user:', error);
    window.toastError(error.message || MSG.error.deleteFailed("user"));
  }
}

document.addEventListener("click", (e) => {
  const button = e.target.closest(".delete-user");

  if (!button || button.disabled) return;

  const id = button.dataset.userId;
  const user = userList.find(u => String(u.id) === String(id));

  openDeleteModal({
    id,
    name: user ? user.username : "",
    onConfirm: (deletedId) => handleDeleteUser(deletedId)
  });
});

window.openModal = openModal;
window.closeModal = closeModal;
window.closeDeleteModal = closeDeleteModal;

async function initUsers() {
  renderState("userRows", {loading: true});

  try {
    userList = await getUsers();
    renderUsers();
  } catch (error) {
    console.error('Error loading users:', error);
    renderState("userRows", {
      error: MSG.error.loadFailed("users"),
      retry: "initUsers"
    });
  }
}

window.initUsers = initUsers;

renderSidebar();
renderHeader("users");
renderTableHeader();
initUsers();

const popup = setupPopup("formModel", () => closeModal());
