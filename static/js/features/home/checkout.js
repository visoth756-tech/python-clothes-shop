document.getElementById("checkoutForm")?.addEventListener("submit", event => {
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  document.getElementById("checkoutStatus").textContent = "Creating your order?";
});
window.addEventListener("pageshow", () => {
  const button = document.querySelector('#checkoutForm button[type="submit"]');
  if (button) button.disabled = false;
});
