/* Home bootstrap.
 *
 * Classic script (no imports) loaded from templates/home/base.html after
 * shared/toast.js. It only provides the two cross-page behaviours that used
 * to live in home/main.js: flash auto-dismiss and the submit-button guard.
 * window.showToast itself comes from shared/toast.js — never redefine it.
 */

if (typeof window.showToast !== "function") {
    window.showToast = function () {};
}

document.addEventListener("DOMContentLoaded", function () {
    // Auto-dismiss flash messages
    document.querySelectorAll(".flash").forEach(el => {
        setTimeout(() => el.remove(), 4000);
    });

    // Disable submit buttons on form submission to prevent spamming
    document.addEventListener("submit", function (e) {
        const submitBtn = e.target.querySelector('button[type="submit"], input[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            setTimeout(() => {
                submitBtn.disabled = true;
                submitBtn.style.pointerEvents = "none";
                submitBtn.style.opacity = "0.7";
            }, 0);
        }
    });
});
