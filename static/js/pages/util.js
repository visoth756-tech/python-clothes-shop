export function getStockStatusBadge(qty) {
  if (qty <= 0) {
    return `
      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
        Out of Stock
      </span>
    `;
  }

  if (qty <= 10) {
    return `
      <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
        Low Stock
      </span>
    `;
  }

  return `
    <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
      In Stock
    </span>
  `;
}