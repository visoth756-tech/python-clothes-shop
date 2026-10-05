async function post(url, data) {
    const csrfToken = document.querySelector(
        'meta[name="csrf-token"]'
    )?.content;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrfToken
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error("Request failed");
    }

    return response.json();
}

document.addEventListener("DOMContentLoaded", function () {

    // Add product to cart
    document.addEventListener("submit", async function (event) {
        const form = event.target;
        if (!form || !form.action || !form.action.includes("/cart/add")) {
            return;
        }

        event.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.innerHTML : null;

        const productIdInput = form.querySelector('input[name="product_id"]');
        const qtyInput = form.querySelector('input[name="qty"]');

        if (!productIdInput) return;

        const productId = productIdInput.value;
        const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";
        }

        try {
            const data = await post("/api/cart/add", {
                product_id: productId,
                qty: qty
            });

            if (data && data.success) {
                // Update badge in navbar
                const badge = document.getElementById("cartBadge");
                if (badge) {
                    badge.textContent = data.cart_count;
                    badge.classList.remove("navbar__cart-badge--hidden");
                    badge.classList.remove("badge-pulse");
                    // Trigger reflow to restart animation
                    void badge.offsetWidth;
                    badge.classList.add("badge-pulse");
                }

                // Show toast feedback
                if (typeof showToast === "function") {
                    showToast(data.message || "Added to cart!", "success");
                }
                // Reset card qty input to 1 after adding
                if (qtyInput && qtyInput.classList.contains("card-qty__input")) {
                    qtyInput.value = 1;
                }
            } else {

                // Show failure message
                if (typeof showToast === "function") {
                    showToast(data.message || "Could not add item.", "danger");
                }
            }
        } catch (err) {
            console.error("Error adding to cart:", err);
            if (typeof showToast === "function") {
                showToast("Failed to add product to cart.", "danger");
            }
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = "";
                if (originalText) {
                    submitBtn.innerHTML = originalText;
                }
            }
        }
    });

    // Product card +/- quantity selector interaction
    document.addEventListener("click", function (event) {
        const btn = event.target.closest(".card-qty__btn");
        if (!btn) return;

        const container = btn.closest(".card-qty");
        const input = container?.querySelector(".card-qty__input");
        if (!input) return;

        let val = parseInt(input.value, 10) || 1;
        if (btn.classList.contains("card-qty__btn--minus") || btn.textContent.trim() === "−" || btn.textContent.trim() === "-") {
            val = Math.max(1, val - 1);
        } else {
            val = Math.min(99, val + 1);
        }
        input.value = val;
    });
});
