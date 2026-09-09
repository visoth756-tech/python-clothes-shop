let deletingId = null;

export function openDeleteModal(id) {
  deletingId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}

export function closeDeleteModal() {
  deletingId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

export function getDeletingId() {
  return deletingId;
}