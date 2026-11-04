import { apiFetch } from "../shared/api.js";
export function getOrders() {
  return apiFetch("/admin/api/orders");
}
