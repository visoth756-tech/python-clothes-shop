import {getCsrfToken} from "./api.js";
export function submitSessionLogout() {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = window.LOGOUT_URL || "/auth/logout";
  const csrf = document.createElement("input");
  csrf.type = "hidden";
  csrf.name = "csrf_token";
  csrf.value = getCsrfToken();
  form.append(csrf);
  document.body.append(form);
  form.submit();
}
