import {renderSidebar} from "../component/sidebar.js";
import {renderHeader} from "../component/header.js";

const table = document.getElementById('table');
const BASE_URL = "/admin/api/error-logs";

let errorLogList = [];

const grid = "grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr]";
const ERRORlOGS = {
  header: [
    {name: "IP Address"},
    {name: "Endpoint"},
    {name: "Method"},
    {name: "Limit"},
    {name: "Timestamp"},
  ]
};

function renderHeaderTable() {
  if (!table) return;

  let error_logs = 0;

  table.innerHTML = `
    <div class="bg-white border border-stone-200 rounded-lg overflow-hidden">
      <div class="grid ${grid} bg-stone-50 border-b border-stone-200">
        ${ERRORlOGS.header.map(header => `
          <div class="px-5 py-3 text-xs font-bold font-mono uppercase tracking-wide ${header.class ?? ''}">
            ${header.name}
          </div>
        `).join('')}
      </div>
      <div id="errorLogRows"></div>
    </div>
    <p class="text-xs text-stone-400 mt-3 font-mono">
      <span id="errorLogCount">${error_logs.length}</span>
      record<span id="recordPlural">${error_logs.length === 1 ? '' : 's'}</span>
    </p>
  `;
}

function renderRows() {
  const rows = document.getElementById('errorLogRows');
  const count = document.getElementById('errorLogCount');
  const plural = document.getElementById('recordPlural');

  if (!errorLogList.length) {
    rows.innerHTML = `<div class="px-5 py-8 text-sm text-stone-400 text-center">No logs found</div>`;
  } else {
    rows.innerHTML = errorLogList.map(log => `
      <div class="grid ${grid} border-b border-stone-100 text-sm hover:bg-stone-50">
        <div class="px-5 py-3 font-mono">${log.ip_address ?? ''}</div>
        <div class="px-5 py-3 truncate">${log.endpoint ?? ''}</div>
        <div class="px-5 py-3">${log.method ?? ''}</div>
        <div class="px-5 py-3">${log.limit ?? ''}</div>
        <div class="px-5 py-3 text-stone-500">${formatTimestamp(log.timestamp)}</div>
      </div>
    `).join('');
  }

  count.textContent = errorLogList.length;
  plural.textContent = errorLogList.length === 1 ? '' : 's';
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp + "+07:00");

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).replace("am", "AM").replace("pm", "PM");
}

async function getErrorLogs() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch error logs");
  return res.json();
}

async function initErrorLog() {
  errorLogList = await getErrorLogs();
  console.log("errorLogList", errorLogList);   // log AFTER the await
  renderRows();
}

renderSidebar();
renderHeader("error_logs");
renderHeaderTable();
initErrorLog();