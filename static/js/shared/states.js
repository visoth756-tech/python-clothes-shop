/* Shared render states: loading / empty / error. */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderState(
  container,
  { loading = false, empty = false, error = null, emptyText = "Nothing here yet.", retry = null } = {}
) {
  let html = "";

  if (loading) {
    html = '<div class="px-5 py-8 text-center"><i class="fa-solid fa-spinner fa-spin text-stone-300 text-xl"></i></div>';
  } else if (error) {
    const retryButton = retry
      ? `<button type="button" class="mt-3 px-4 py-2 border border-stone-300 rounded-md text-sm cursor-pointer hover:bg-stone-50" onclick="${retry}()">Retry</button>`
      : "";
    html = `<div class="px-5 py-8 text-center text-sm text-red-600">${escapeHtml(error)}${retryButton}</div>`;
  } else if (empty) {
    html = `<div class="px-5 py-8 text-center text-stone-400 text-sm">${escapeHtml(emptyText)}</div>`;
  }

  const element = typeof container === "string" ? document.getElementById(container) : container;
  if (element) element.innerHTML = html;

  return html;
}
