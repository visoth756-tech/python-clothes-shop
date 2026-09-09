function changeQty(delta) {
    const input = document.getElementById("qtyInput");
    if (!input) return;
    const next = Math.max(1, Math.min(99, parseInt(input.value) + delta));
    input.value = next;
}
