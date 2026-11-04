import { post } from "./api.js";

function updateCartUI(data, productId, action) {
    if (!data || typeof data !== "object") return;

    // Update navbar badge
    const badge = document.getElementById("cartBadge");
    if (badge) {
        badge.textContent = data.cart_count;
        badge.classList.toggle("navbar__cart-badge--hidden", data.cart_count === 0);
    }

    // Update cart total
    ["cartTotal", "cartTotalFinal"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = data.total;
    });

    if (action === "remove") {
        // Remove the whole cart item row
        const row = document.querySelector(`.cart-item[data-id="${productId}"]`);
        if (row) row.remove();

        // If cart is now empty, reload to show empty state
        if (data.cart_count === 0) location.reload();
        return;
    }

    // Find updated item in response (guard against a missing items array)
    const items = Array.isArray(data.items) ? data.items : [];
    const item = items.find(i => i.id === productId);
    if (!item) {
        const row = document.querySelector(`.cart-item[data-id="${productId}"]`);
        if (row) row.remove();
        if (data.cart_count === 0) location.reload();
        return;
    }

    const qtyEl = document.getElementById(`qty-${productId}`);
    if (qtyEl) qtyEl.textContent = item.qty;

    const subtotalEl = document.getElementById(`subtotal-${productId}`);
    if (subtotalEl) subtotalEl.textContent = item.subtotal;
}

async function cartAction(productId, action) {
    try {
        const data = await post("/api/cart/update", {
            product_id: productId,
            action: action
        });

        updateCartUI(data, productId, action);

        if (typeof window.toastSuccess === "function") {
            window.toastSuccess("Cart updated.");
        }
    } catch (err) {
        console.error("Error updating cart:", err);
        if (typeof window.toastError === "function") {
            window.toastError(err && err.message ? err.message : "Failed to update cart.");
        }
    }
}

// templates/home/cart.html calls cartAction(...) from inline onclick handlers.
window.cartAction = cartAction;
window.updateCartUI = updateCartUI;
