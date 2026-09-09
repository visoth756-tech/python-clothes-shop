async function cartAction(productId, action) {
    try {
        const data = await post("/api/cart/update", { product_id: productId, action });
        updateCartUI(data, productId, action);
    } catch (e) {
        console.error("Cart update failed", e);
    }
}
