const MAX_TOASTS = 3;

function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    // Keep at most 3 visible toasts at any time (dismiss oldest)
    const existingToasts = Array.from(container.querySelectorAll(".toast:not(.toast--hiding)"));
    if (existingToasts.length >= MAX_TOASTS) {
        const excess = existingToasts.length - MAX_TOASTS + 1;
        for (let i = 0; i < excess; i++) {
            const oldToast = existingToasts[i];
            oldToast.classList.add("toast--hiding");
            setTimeout(() => oldToast.remove(), 250);
        }
    }

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    
    const icon = type === "success" ? "✓" : "!";
    toast.innerHTML = `
        <span class="toast__icon">${icon}</span>
        <span class="toast__message">${message}</span>
        <button class="toast__close" aria-label="Close">&times;</button>
    `;

    toast.querySelector(".toast__close").addEventListener("click", () => {
        toast.classList.add("toast--hiding");
        setTimeout(() => toast.remove(), 250);
    });

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add("toast--hiding");
            setTimeout(() => toast.remove(), 250);
        }
    }, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
    // Navbar mobile toggle
    document.getElementById("navToggle")?.addEventListener("click", function () {
        document.getElementById("navLinks")?.classList.toggle("open");
    });

    // Auto-dismiss flash messages
    document.querySelectorAll(".flash").forEach(el => {
        setTimeout(() => el.remove(), 4000);
    });
});
