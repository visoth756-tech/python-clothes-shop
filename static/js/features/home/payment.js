import {apiFetch} from "../../shared/api.js";
const payments = JSON.parse(document.getElementById("paymentData").textContent);
const orderId = JSON.parse(document.getElementById("orderData").textContent);
let payment = payments.find(p => p.status === "PAID") || payments.find(p => p.status === "PENDING") || payments[payments.length - 1];
const status = document.getElementById("paymentStatus");
const error = document.getElementById("paymentError");
const qr = document.getElementById("paymentQr");
const check = document.getElementById("checkPayment");
const retry = document.getElementById("retryPayment");
const success = document.getElementById("paymentSuccess");
const successMessage = document.getElementById("paymentSuccessMessage");
let timer;
let busy = false;
function render() {
  clearTimeout(timer);
  qr.hidden = true;
  check.hidden = true;
  retry.hidden = true;
  const failedOrder = payment?.orderStatus === "FAILED";
  success.hidden = !payment || payment.status !== "PAID" || failedOrder;
  if (!payment) { status.textContent = "No payment found for this order."; return; }
  status.textContent = `${payment.method}: ${payment.status}`;
  if (failedOrder) status.textContent += ' — Order: FAILED';
  error.textContent = payment.warning || '';
  if (payment.status === "PAID") {
    successMessage.textContent = payment.method === "CASH"
      ? "Cash payment completed. Your order is confirmed."
      : "Bakong payment received. Your order is confirmed.";
  }
  const pending = !failedOrder && payment.method === "BAKONG" && payment.status === "PENDING";
  const mock = payment.qrData?.startsWith("MOCK-KHQR:");
  qr.hidden = !pending || !payment.qrData || mock;
  if (!qr.hidden) qr.src = `/api/payments/${encodeURIComponent(payment.id)}/qr?v=${encodeURIComponent(payment.tokenExpiresAt || "")}`;
  check.hidden = !pending;
  retry.hidden = failedOrder || payment.status !== "FAILED" || payment.method !== "BAKONG";
  const expiry = document.getElementById("paymentExpiry");
  expiry.textContent = mock ? "Test payment: a payable QR is unavailable." : pending && payment.tokenExpiresAt ? `QR expires: ${new Date(payment.tokenExpiresAt).toLocaleString()}` : "";
  if (pending && !mock) timer = setTimeout(refresh, 5000);
}
async function refresh() {
  if (busy || !payment) return;
  clearTimeout(timer);
  busy = true; check.disabled = true; error.textContent = "";
  try {
    payment = await apiFetch(`/api/payments/${encodeURIComponent(payment.id)}/status`);
    render();
  } catch (err) {
    error.textContent = "Could not check payment. " + err.message + " Use Check Payment to retry.";
  } finally { busy = false; check.disabled = false; }
}
check.addEventListener("click", refresh);
retry.addEventListener("click", async () => {
  if (busy) return;
  busy = true; retry.disabled = true; error.textContent = "";
  try {
    payment = await apiFetch("/api/payments", {method: "POST", json: {order_id: orderId, payment_method: "BAKONG"}});
    render();
  } catch (err) { error.textContent = err.message; }
  finally { busy = false; retry.disabled = false; }
});
qr.addEventListener("error", () => { error.textContent = "QR could not be loaded. Check Payment to retry."; });
window.addEventListener("pagehide", () => clearTimeout(timer));
render();
if (payment?.method === "BAKONG" && payment.status === "PENDING") refresh();
