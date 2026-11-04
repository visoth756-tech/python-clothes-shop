let pending = null;   // { id, name, onConfirm }
let overlayBound = false;
let escapeBound = false;

export function openDeleteModal({ id, name, onConfirm }) {
  pending = { id, name, onConfirm };

  const modal = document.getElementById("deleteModal");
  const nameEl = document.getElementById("deleteName");
  const itemNameEl = document.getElementById("deleteItemName");

  if (nameEl) nameEl.textContent = name || "this item";
  if (itemNameEl) itemNameEl.textContent = name || "this item";
  if (modal) modal.classList.remove("hidden");

  if (modal && !overlayBound) {
    modal.addEventListener("click", (e) => {
      if (e.target === e.currentTarget) closeDeleteModal();
    });
    overlayBound = true;
  }

  if (!escapeBound) {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDeleteModal();
    });
    escapeBound = true;
  }
}

export function closeDeleteModal() {
  pending = null;
  const modal = document.getElementById("deleteModal");
  if (modal) modal.classList.add("hidden");
}

export function getDeletingId() {
  return pending ? pending.id : null;
}

export function confirmDelete() {
  if (!pending) return;
  const { id, onConfirm } = pending;
  closeDeleteModal();
  if (typeof onConfirm === "function") onConfirm(id);
}

window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
