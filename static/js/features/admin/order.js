import { renderState } from "../../shared/states.js";
import { escapeHtml } from "../../shared/html.js";
import { getOrders } from "../../api/order.js";
import { renderHeader } from "../../components/layout/header.js";
import { renderSidebar } from "../../components/layout/sidebar.js";
import { formatCapitalLetter, formatDate, formatMoney } from "../../shared/format.js";

const ORDERS = {
  header: [
    { name: "Username" },
    { name: "Items" },
    { name: "Method", class: "text-center" },
    { name: "Total Amount", class: "text-center" },
    { name: "Status", class: "text-center" },
    { name: "Date", class: "text-center" },
  ]
};

let orderList = [];

function getOrderItems(order) {
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return "-";
  }
  return order.items
    .map(item =>
      `${escapeHtml(item.productName || 'Item')} - ${item.qty || 1} × $${Number(item.price || 0).toFixed(2)}`
    )
    .join(", ");
}

function getOrderMethods(order) {
  const payments = Array.isArray(order.payments) ? order.payments : [];
  const methods = [...new Set(payments.map(payment => payment.method).filter(Boolean))];
  return methods.length ? methods.map(escapeHtml).join(", ") : "-";
}

const table = document.getElementById('table');
const grid = "grid-cols-[1.2fr_1.5fr_1fr_1fr_1fr_1fr]";

function renderTableHeader() {
  if (!table) return;

  table.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div class="grid ${grid} bg-stone-50 border-b border-stone-200">
        ${ORDERS.header.map(header => `
          <div class="px-5 py-3 text-xs font-bold font-mono uppercase tracking-wide ${header.class ?? ''}">
            ${header.name}
          </div>
        `).join('')}
      </div>
      <div id="orderRows"></div>
    </div>
    <p class="text-xs text-stone-400 mt-3 font-mono">
      <span id="orderCount">${orderList.length}</span>
      record<span id="recordPlural">${orderList.length === 1 ? '' : 's'}</span>
    </p>
  `;
}

function renderOrders() {
  const container = document.getElementById('orderRows');
  const countEl = document.getElementById('orderCount');
  const pluralEl = document.getElementById('recordPlural');

  if (countEl) countEl.textContent = orderList.length;
  if (pluralEl) pluralEl.textContent = orderList.length === 1 ? '' : 's';

  if (!container) return;

  if (orderList.length === 0) {
    container.innerHTML = `
      <div class="px-5 py-8 text-center text-stone-400 text-sm">
        No orders found.
      </div>
    `;
    return;
  }

  const statusOrder = {
    CONFIRMED: 1,
    PENDING: 2,
    FAIL: 3,
    FAILED: 3
  };

  const sortedOrders = [...orderList].sort((a, b) => {
    const usernameCompare = (a.username || "").localeCompare(b.username || "");
    if (usernameCompare !== 0) return usernameCompare;

    const statusA = statusOrder[a.status?.toUpperCase()] ?? 999;
    const statusB = statusOrder[b.status?.toUpperCase()] ?? 999;
    return statusA - statusB;
  });

  container.innerHTML = sortedOrders.map(order => `
    <div class="grid ${grid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
      <div class="px-5 py-4 font-medium">
        ${escapeHtml(formatCapitalLetter(order.username || 'Anonymous'))}
      </div>

      <div class="px-5 py-4 text-stone-500 truncate" title="${getOrderItems(order)}">
        ${getOrderItems(order)}
      </div>

      <div class="px-5 py-4 text-stone-500 text-center">
        ${getOrderMethods(order)}
      </div>

      <div class="px-5 py-4 text-stone-600 text-center font-medium">
        ${formatMoney(order.totalAmount)}
      </div>

      <div class="px-5 py-4 text-center">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
          ${order.status?.toUpperCase() === 'CONFIRMED'
      ? 'bg-green-100 text-green-700'
      : order.status?.toUpperCase() === 'PENDING'
        ? 'bg-yellow-100 text-yellow-700'
        : order.status?.toUpperCase() === 'FAIL' || order.status?.toUpperCase() === 'FAILED'
          ? 'bg-red-100 text-red-700'
          : 'bg-stone-100 text-stone-600'
    }">
          ${formatCapitalLetter(order.status || 'Pending')}
        </span>
      </div>

      <div class="px-5 py-4 text-stone-500 text-center">
        ${order.updatedAt ? formatDate(order.updatedAt) : (order.createdAt ? formatDate(order.createdAt) : '-')}
      </div>
    </div>
  `).join('');
}

async function initOrders() {
  renderState("orderRows", { loading: true });
  try {
    orderList = await getOrders();
    const id = new URLSearchParams(location.search).get("id");
    if (id) orderList = orderList.filter(order => order.id === id);
    renderOrders();
  } catch (error) { showLoadError(error); }
}

renderSidebar();
renderHeader("orders");
renderTableHeader();
initOrders();

function showLoadError(error) {
  const container = document.getElementById("table");
  container.textContent = error.message;
  const retry = document.createElement("button");
  retry.className = "btn";
  retry.textContent = "Retry";
  retry.onclick = () => location.reload();
  container.append(retry);
}
