import { apiFetch } from "../shared/api.js";
export function getPayments() {
  return apiFetch("/admin/api/payments");
}
