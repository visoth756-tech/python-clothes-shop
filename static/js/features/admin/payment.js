import { renderState } from "../../shared/states.js";
import { escapeHtml } from "../../shared/html.js";
import { getPayments } from "../../api/payment.js";
import { getOrders } from "../../api/order.js";
import { renderHeader } from "../../components/layout/header.js";
import { renderSidebar } from "../../components/layout/sidebar.js";
import { formatCapitalLetter, formatDate, formatMoney } from "../../shared/format.js";

const PAYMENTS = {
  header: [
    { name: "Username" },
    { name: "Method" },
    { name: "Total Amount", class: "text-center" },
    { name: "Status", class: "text-center" },
    { name: "Date", class: "text-right" },
  ]
};

let paymentList = [];
let orderList = [];

function getUsernameByPayment(payment) {
  if (payment.username) return payment.username;
  const order = orderList.find(o => String(o.id) === String(payment.orderId));
  return order?.username || "Unknown";
}

const table = document.getElementById('table');
const grid = "grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr]";

function renderTableHeader() {
  if (!table) return;

  table.innerHTML = `
    <div class="flex justify-end mb-3"><button type="button" id="refreshRecords" class="px-4 py-2 border border-stone-300 rounded-md">Refresh</button></div>
    <div class="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div class="grid ${grid} bg-stone-50 border-b border-stone-200">
        ${PAYMENTS.header.map(header => `
          <div class="px-5 py-3 text-xs font-bold font-mono uppercase tracking-wide ${header.class ?? ''}">
            ${header.name}
          </div>
        `).join('')}
      </div>
      <div id="paymentRows"></div>
    </div>
    <p class="text-xs text-stone-400 mt-3 font-mono">
      <span id="paymentCount">${paymentList.length}</span>
      record<span id="recordPlural">${paymentList.length === 1 ? '' : 's'}</span>
    </p>
  `;
}

function renderPayments() {
  const container = document.getElementById('paymentRows');
  const countEl = document.getElementById('paymentCount');
  const pluralEl = document.getElementById('recordPlural');

  if (countEl) countEl.textContent = paymentList.length;
  if (pluralEl) pluralEl.textContent = paymentList.length === 1 ? '' : 's';

  if (!container) return;

  if (paymentList.length === 0) {
    container.innerHTML = `
      <div class="px-5 py-8 text-center text-stone-400 text-sm">
        No payments found.
      </div>
    `;
    return;
  }

  const statusOrder = {
    PAID: 1,
    PENDING: 2,
    FAILED: 3,
    FAIL: 3
  };

  const sortedPayments = [...paymentList].sort((a, b) => {
    const usernameA = getUsernameByPayment(a);
    const usernameB = getUsernameByPayment(b);

    const usernameCompare = usernameA.localeCompare(usernameB);
    if (usernameCompare !== 0) return usernameCompare;

    const statusA = statusOrder[a.status?.toUpperCase()] ?? 999;
    const statusB = statusOrder[b.status?.toUpperCase()] ?? 999;
    return statusA - statusB;
  });

  container.innerHTML = sortedPayments.map(payment => `
    <div class="grid ${grid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
      <div class="px-5 py-4 font-medium">
        ${escapeHtml(formatCapitalLetter(getUsernameByPayment(payment)))}
        <p class="text-xs text-stone-400 truncate">
        <a href="/admin/orders?id=${encodeURIComponent(payment.orderId)}"></a></p>
      </div>

      <div class="px-5 py-4 text-stone-500 truncate">
        ${escapeHtml(payment.method || '-')}
      </div>

      <div class="px-5 py-4 text-stone-600 text-center font-medium">
        ${formatMoney(payment.amount)}
      </div>

      <div class="px-5 py-4 text-center">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
          ${payment.status?.toUpperCase() === 'PAID'
            ? 'bg-green-100 text-green-700'
            : payment.status?.toUpperCase() === 'PENDING'
              ? 'bg-yellow-100 text-yellow-700'
              : payment.status?.toUpperCase() === 'FAILED' || payment.status?.toUpperCase() === 'FAIL'
                ? 'bg-red-100 text-red-700'
                : 'bg-stone-100 text-stone-600'
          }">
          ${formatCapitalLetter(payment.status || 'Pending')}
        </span>
      </div>

      <div class="px-5 py-4 text-stone-500 text-right">
        ${formatDate(payment.paidAt || payment.updatedAt || payment.createdAt)}
      </div>
    </div>
  `).join('');
}

async function initPayments() {
  renderState("paymentRows", {loading: true});
  try {
    [paymentList, orderList] = await Promise.all([getPayments(), getOrders()]);
    renderPayments();
  } catch (error) { showLoadError(error); }
}

renderSidebar();
renderHeader("payments");
renderTableHeader();
document.getElementById("refreshRecords").addEventListener("click", initPayments);
initPayments();

function showLoadError(error) {
  const container = document.getElementById("table");
  container.textContent = error.message;
  const retry = document.createElement("button");
  retry.className = "btn";
  retry.textContent = "Retry";
  retry.onclick = () => location.reload();
  container.append(retry);
}
