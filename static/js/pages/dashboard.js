import {listCategories} from "../api/category.js";
import {getProducts} from "../api/product.js";
import {getOrders} from "../api/order.js";
import {getPayments} from "../api/payment.js";
import {renderHeader} from "../component/header.js";
import {renderSidebar} from "../component/sidebar.js";
import {formatCapitalLetter, formatMoney, formatDate} from "../shared/format.js";
import {getStockStatusBadge} from "./util.js";

const ORDERS = {
  header: [
    {name: "Username"},
    {name: "Total Amount", class: "text-center"},
    {name: "Status", class: "text-center"},
    {name: "Date", class: "text-center"}
  ]
};
const orderGrid = "grid-cols-[1fr_1fr_1fr_1fr_0.5fr]";

const STOCKS = {
  header: [
    {name: "Product"},
    {name: "Total Qty", class: "text-center"},
    {name: "Status", class: "text-center"}
  ]
};
const stockGrid = "grid-cols-[2fr_1fr_1fr]";

let categories = [];
let productList = [];
let orderList = [];
let paymentList = [];

function renderSpinner() {
  return `
    <div class="flex justify-center items-center py-10">
      <i class="fa-solid fa-spinner fa-spin text-stone-300 text-xl"></i>
    </div>
  `;
}

// ===== STAT CARDS =====
function getStats() {
  const totalCategory = categories.length;
  const totalProduct = productList.length;

  const paidPayments = paymentList.filter(p => p.status === 'PAID');
  const totalPaid = paidPayments.length;

  const now = new Date();
  const totalIncome = paidPayments.reduce((sum, p) => {
    const paidDate = new Date(p.paidAt ?? p.createdAt ?? now);
    const sameMonth = paidDate.getMonth() === now.getMonth()
      && paidDate.getFullYear() === now.getFullYear();
    return sameMonth ? sum + (Number(p.amount) || 0) : sum;
  }, 0);

  return {totalCategory, totalProduct, totalPaid, totalIncome};
}

function renderStatCardsSkeleton() {
  const labels = ["Total Categories", "Total Products", "Paid Payments", "Income This Month"];
  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7" id="stat-cards">
      ${labels.map(label => `
        <div class="bg-white rounded-xl shadow p-5 border border-stone-100">
          <p class="text-xs font-mono uppercase text-stone-400">${label}</p>
          <p class="text-2xl font-bold mt-1 text-ink">
            <span class="inline-block w-12 h-6 bg-stone-100 rounded animate-pulse"></span>
          </p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStatCards() {
  const {totalCategory, totalProduct, totalPaid, totalIncome} = getStats();

  return `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7" id="stat-cards">
      <div class="bg-white rounded-xl shadow p-5 border border-stone-100">
        <p class="text-xs font-mono uppercase text-stone-400">Total Categories</p>
        <p class="text-2xl font-bold mt-1 text-ink">${totalCategory}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border border-stone-100">
        <p class="text-xs font-mono uppercase text-stone-400">Total Products</p>
        <p class="text-2xl font-bold mt-1 text-ink">${totalProduct}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border border-stone-100">
        <p class="text-xs font-mono uppercase text-stone-400">Paid Payments</p>
        <p class="text-2xl font-bold mt-1 text-ink">${totalPaid}</p>
      </div>
      <div class="bg-white rounded-xl shadow p-5 border border-stone-100">
        <p class="text-xs font-mono uppercase text-stone-400">Income This Month</p>
        <p class="text-2xl font-bold mt-1 text-ink">${formatMoney(totalIncome)}</p>
      </div>
    </div>
  `;
}

// ===== PENDING ORDERS =====
function renderOrderSkeleton() {
  const headerHtml = ORDERS.header
    .map(h => `
      <div class="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wide ${h.class ?? ''}">
        ${h.name}
      </div>
    `).join('');

  return `
    <div class="bg-white rounded-xl shadow p-5 border border-stone-100" id="order-card">
      <h2 class="font-semibold text-lg mb-4 text-ink">Pending Orders</h2>
      <div class="grid ${orderGrid} bg-stone-50 border-b border-stone-200">
        ${headerHtml}<div></div>
      </div>
      ${renderSpinner()}
    </div>
  `;
}

function renderOrder() {
  const pending = orderList.filter(o => o.status === 'PENDING');

  const headerHtml = ORDERS.header
    .map(h => `
      <div class="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wide ${h.class ?? ''}">
        ${h.name}
      </div>
    `).join('');

  const rowsHtml = pending.length
    ? pending.map(o => `
        <div class="grid ${orderGrid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
          <div class="px-4 py-3 font-medium">${formatCapitalLetter(o.username)}</div>
          <div class="px-4 py-3 text-center text-stone-500">${formatMoney(o.totalAmount)}</div>
          <div class="px-4 py-3 text-center">
            <span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
              ${o.status}
            </span>
          </div>
          <div class="px-4 py-3 text-center text-stone-500">${formatDate(o.createdAt ?? o.date)}</div>
          <div class="px-4 py-3 text-center">
            <button type="button" onclick="viewOrder('${o.id}')"
              class="text-stone-400 hover:text-blue-600 p-1.5 rounded hover:bg-stone-100">
              <i class="fa-solid fa-eye"></i>
            </button>
          </div>
        </div>
      `).join('')
    : `<div class="text-center text-stone-400 py-6 text-sm">No pending orders</div>`;

  return `
    <div class="bg-white rounded-xl shadow p-5 border border-stone-100" id="order-card">
      <h2 class="font-semibold text-lg mb-4 text-ink">Pending Orders</h2>
      <div class="grid ${orderGrid} bg-stone-50 border-b border-stone-200">
        ${headerHtml}<div></div>
      </div>
      ${rowsHtml}
    </div>
  `;
}

// ===== OUT OF STOCK =====
function renderProductStockSkeleton() {
  const headerHtml = STOCKS.header
    .map(h => `
      <div class="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wide ${h.class ?? ''}">
        ${h.name}
      </div>
    `).join('');

  return `
    <div class="bg-white rounded-xl shadow p-5 border border-stone-100" id="stock-card">
      <h2 class="font-semibold text-lg mb-4 text-ink">Out of Stock</h2>
      <div class="grid ${stockGrid} bg-stone-50 border-b border-stone-200">
        ${headerHtml}
      </div>
      ${renderSpinner()}
    </div>
  `;
}

function renderProductStock() {
  const lowStock = productList.filter(p => p.qty <= 10);

  const headerHtml = STOCKS.header
    .map(h => `
      <div class="px-4 py-2 text-xs font-bold font-mono uppercase tracking-wide ${h.class ?? ''}">
        ${h.name}
      </div>
    `).join('');

  const rowsHtml = lowStock.length
    ? lowStock.map(p => `
        <div class="grid ${stockGrid} bg-white border-b border-stone-100 hover:bg-stone-50 items-center">
          <div class="px-4 py-3">${p.name}</div>
          <div class="px-4 py-3 text-center">${p.qty}</div>
          <div class="px-4 py-3 text-center">
            ${getStockStatusBadge(p.qty)}
          </div>
        </div>
      `).join('')
    : `<div class="text-center text-stone-400 py-6 text-sm">Nothing out of stock</div>`;

  return `
    <div class="bg-white rounded-xl shadow p-5 border border-stone-100" id="stock-card">
      <h2 class="font-semibold text-lg mb-4 text-ink">Stock Control</h2>
      <div class="grid ${stockGrid} bg-stone-50 border-b border-stone-200">
        ${headerHtml}
      </div>
      ${rowsHtml}
    </div>
  `;
}

// ===== MOUNT =====
function renderDashboardSkeleton() {
  const main = document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
    ${renderStatCardsSkeleton()}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      ${renderOrderSkeleton()}
      ${renderProductStockSkeleton()}
    </div>
  `;
}

function replaceSection(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.outerHTML = html;
}

function viewOrder(id) {
  window.location.href = `orders.html?id=${id}`;
}

window.viewOrder = viewOrder;

async function initDashboard() {
  renderDashboardSkeleton();

  listCategories()
    .then(data => {
      categories = data;
    })
    .catch(() => {
      categories = [];
    })
    .finally(() => refreshStatCardsIfReady());

  getPayments()
    .then(data => {
      paymentList = data;
    })
    .catch(() => {
      paymentList = [];
    })
    .finally(() => refreshStatCardsIfReady());

  getProducts()
    .then(data => {
      productList = data;
      refreshStatCardsIfReady();
      replaceSection('stock-card', renderProductStock());
    })
    .catch(() => {
      productList = [];
      refreshStatCardsIfReady();
      replaceSection('stock-card', renderProductStock());
    });

  getOrders()
    .then(data => {
      orderList = data;
      replaceSection('order-card', renderOrder());
    })
    .catch(() => {
      orderList = [];
      replaceSection('order-card', renderOrder());
    });
}

function refreshStatCardsIfReady() {
  replaceSection('stat-cards', renderStatCards());
}

renderSidebar();
renderHeader("dashboard");
initDashboard();