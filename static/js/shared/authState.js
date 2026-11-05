import {clearTokens} from "./tokens.js";
if (!window.CURRENT_USER?.username) clearTokens();
window.addEventListener("storage", event => {
  if (event.key === "access_token" && !event.newValue && window.CURRENT_USER?.username) {
    clearTokens();
    location.replace(window.LOGIN_URL || "/auth/login");
  }
});
