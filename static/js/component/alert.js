export function showAlert(message, type = "error") {
  const container = document.getElementById("alertContainer");

  container.innerHTML = `
    <div class="mb-5 flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
       role="alert">
      <div class="flex items-center gap-3">
        <i class="fa-solid ${
          type === "success"
              ? "fa-circle-check"
              : type === "warning"
              ? "fa-triangle-exclamation"
              : "fa-circle-exclamation"
        }"></i>

        <span>${message}</span>
      </div>

      <button type="button"
          onclick="this.closest('[role=alert]').remove()"
          class="ml-4 text-lg leading-none opacity-60 hover:opacity-100">
      &times;
      </button>
    </div>
  `;
}