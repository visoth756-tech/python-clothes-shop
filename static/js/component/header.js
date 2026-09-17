const PAGE_HEADERS = {
  dashboard: {
    title: 'Dashboard',
    button: null,
    action: null
  },
  categories: {
    title: 'Categories',
    button: 'Add Category',
    action: 'openCategoryModal()'
  },
  products: {
    title: 'Products',
    button: 'Add Product',
    action: 'openModal()'
  },
  users: {
    title: 'Users',
    button: 'Add User',
    action: 'openModal()'
  },
  orders: {
    title: 'Orders',
    button: null,
    action: null
  },
  payments: {
    title: 'Payments',
    button: null,
    action: null
  }
};

export function renderHeader(page) {
  const config = PAGE_HEADERS[page];

  if (!config) {
    console.error(`Header configuration not found: ${page}`);
    return;
  }

  const container = document.getElementById('pageHeader');

  if (!container) {
    console.error('pageHeader element not found');
    return;
  }

  container.innerHTML = `
    <header class="bg-white border-b border-stone-200 px-7 py-4 flex items-center justify-between shrink-0">
      <div>
        <p class="text-[11px] font-mono uppercase tracking-widest text-stone-400" id="topBreadcrumb">Overview</p>
        <h1 class="font-display text-xl font-semibold text-ink" id="topTitle">${config.title}</h1>
      </div>
      <div class="flex items-center gap-3">
        <a href="/"
          class="bg-brass hover:bg-brassLight text-ink font-medium text-sm px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors">
          Go To Homepage
        </a>

        ${config.button ? `
          <button onclick="${config.action}"
                  class="bg-brass hover:bg-brassLight text-ink font-medium text-sm px-4 py-2 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span>${config.button}</span>
          </button>
        ` : ''}
      </div>
    </header>
  `;
}
