import {apiFetch} from "../../../shared/api.js";
export function post(url, data) { return apiFetch(url, {method: "POST", json: data}); }
