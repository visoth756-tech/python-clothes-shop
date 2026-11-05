/* Shared toast notifications.
 *
 * Plain script: no import/export statements, so it loads both as a classic
 * <script> (home pages) and as a module (admin pages). Everything is attached
 * to window. Markup matches the .toast* classes in static/css/home/style.css
 * so the existing styles keep working unchanged.
 */

const MAX_TOASTS = 3;
const TOAST_DURATION = 3000;
const TOAST_EXIT_MS = 250;

/* The CSS defines .toast--danger (not .toast--error), so map both. */
const TOAST_CLASS = {
    success: "success",
    error: "danger",
    danger: "danger",
    warning: "warning",
    info: "info"
};

const TOAST_ICON = {
    success: "✓",
    error: "!",
    danger: "!",
    warning: "!",
    info: "i"
};

function getToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function dismissToast(toast) {
    if (!toast || toast.classList.contains("toast--hiding")) return;
    toast.classList.add("toast--hiding");
    setTimeout(() => toast.remove(), TOAST_EXIT_MS);
}

function showToast(message, type = "info") {
    const container = getToastContainer();
    const toastType = TOAST_CLASS[type] ? type : "info";

    // Keep at most MAX_TOASTS visible toasts at any time (dismiss oldest)
    const visible = Array.from(container.querySelectorAll(".toast:not(.toast--hiding)"));
    if (visible.length >= MAX_TOASTS) {
        const excess = visible.length - MAX_TOASTS + 1;
        for (let i = 0; i < excess; i++) {
            dismissToast(visible[i]);
        }
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${TOAST_CLASS[toastType]}`;
    toast.innerHTML = `
        <span class="toast__icon">${TOAST_ICON[toastType]}</span>
        <span class="toast__message"></span>
        <button class="toast__close" aria-label="Close">&times;</button>
    `;

    toast.querySelector(".toast__message").textContent = message;
    toast.setAttribute("role", toastType === "error" || toastType === "danger" ? "alert" : "status");
    toast.querySelector(".toast__close").addEventListener("click", () => dismissToast(toast));

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) dismissToast(toast);
    }, TOAST_DURATION);
}

window.showToast = showToast;
window.toastSuccess = (message) => showToast(message, "success");
window.toastError = (message) => showToast(message, "error");
window.toastWarning = (message) => showToast(message, "warning");
window.toastInfo = (message) => showToast(message, "info");
