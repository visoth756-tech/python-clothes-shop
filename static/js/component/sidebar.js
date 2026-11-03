import {formatCapitalLetter} from "../shared/format.js";
import {getUserThumbUrl} from "../api/user.js";
import {logoutWithJWT} from "../api/auth.js";

export function renderSidebar() {
  const sidebar = document.getElementById('sidebarNav');

  if (!sidebar) return;

  const currentPath = window.location.pathname;

  const menuItems = [
    {name: 'Dashboard', key: 'dashboard', icon: 'fa-solid fa-house'},
    {name: 'Categories', key: 'categories', icon: 'fa-solid fa-tags'},
    {name: 'Products', key: 'products', icon: 'fa-solid fa-box'},
    {name: 'Orders', key: 'orders', icon: 'fa-solid fa-bag-shopping'},
    {name: 'Payments', key: 'payments', icon: 'fa-solid fa-credit-card'},
    {name: 'Users', key: 'users', icon: 'fa-solid fa-users'},
    {name: 'Error Logs', key: 'error_logs', icon: 'fa-solid fa-bug'},
  ];

  sidebar.innerHTML = `
    <aside class="w-20 md:w-60 bg-ink text-stone-300 flex flex-col h-full shrink-0">

      <div class="px-5 py-5 border-b border-white/10">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded bg-brass flex items-center justify-center font-display font-bold text-ink text-sm">
            S
          </div>

          <div class="hidden md:inline">
            <p class="font-display font-semibold text-white text-[15px] leading-tight">
              Shopfront
            </p>
            <p class="text-[11px] text-stone-500 leading-tight font-mono tracking-wide">
              ADMIN LEDGER
            </p>
          </div>
        </div>
      </div>

      <nav class="flex-1 py-3 overflow-y-auto">
        ${menuItems.map(item => {
          const url = window.ADMIN_URLS?.[item.key] || "#";
          const isActive = currentPath === url;
          return `
            <a href="${url}"
               class="flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive ? 'bg-stone-800 text-white font-medium' : 'hover:bg-stone-800/60 text-stone-400 hover:text-stone-200'
              }">
              <i class="${item.icon} w-5 text-center"></i>
              <span class="hidden md:inline">${item.name}</span>
            </a>
          `;
        }).join('')}
      </nav>

      <div class="flex flex-col items-center justify-between gap-3 py-4 border-t border-white/10 px-4">
        <div class="flex items-center gap-3 min-w-0 w-full">
          <img id="currentUserAvatar"
               src=""
               class="w-10 h-10 rounded-full object-cover border border-stone-700 shrink-0"
               alt="">

          <div class="hidden md:inline min-w-0 flex-1">
            <p id="currentUserName" class="font-medium text-sm text-stone-200 truncate">
              Name
            </p>
            <p id="currentUserRole" class="text-xs text-stone-500 truncate">
              Administrator
            </p>
          </div>
        </div>

        <div class="flex gap-3 items-center justify-between w-full pt-1">
          <div class="hidden md:inline font-medium text-xs text-stone-400">Log out</div>

          <button
            id="logout"
            type="button"
            class="p-2 rounded-sm bg-none border border-stone-700 text-sm text-stone-400 hover:text-white hover:border-stone-500 transition-colors cursor-pointer"
            title="Log out"
          >
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </aside>
  `;

  initCurrentUser();
}

function initCurrentUser() {
  const nameEl = document.getElementById("currentUserName");
  const roleEl = document.getElementById("currentUserRole");
  const avatarEl = document.getElementById("currentUserAvatar");
  const logoutBtn = document.getElementById("logout");

  const user = window.CURRENT_USER || {};
  const DEFAULT_AVATAR = window.DEFAULT_AVATAR_URL;
  const USER_IMAGE_THUMB_BASE = window.USER_IMAGE_THUMB_BASE;

  if (nameEl) nameEl.textContent = user.username || "Unknown";
  if (roleEl) roleEl.textContent = formatCapitalLetter(user.role || "");

  if (avatarEl) {
    avatarEl.src = getUserThumbUrl(user) || DEFAULT_AVATAR;
    avatarEl.alt = user.username || "";
    avatarEl.onerror = function () {
      this.onerror = null;
      this.src = DEFAULT_AVATAR;
    };
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to log out?")) return;

      await logoutWithJWT();
      window.location.href = window.LOGOUT_URL;
    });
  }
}

