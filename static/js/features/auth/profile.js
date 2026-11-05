import {apiFetch} from "../../shared/api.js";
import {clearTokens} from "../../shared/tokens.js";
const form = document.getElementById("profileForm");
const error = document.getElementById("profileError");
const image = document.getElementById("profileImage");
let previewUrl;
function showProfileError(message) {
  error.textContent = message;
  error.focus({preventScroll: true});
  error.scrollIntoView({behavior: "smooth", block: "center"});
  window.toastError?.(message);
}
image.addEventListener("change", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  const file = image.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showProfileError("Profile image must be 5 MB or smaller.");
    image.value = "";
    return;
  }
  previewUrl = URL.createObjectURL(file);
  document.getElementById("profilePreview").src = previewUrl;
  error.textContent = "";
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  if (button.disabled) return;
  error.textContent = "";
  if (form.elements.new_password.value !== form.elements.confirm_password.value) {
    showProfileError("New passwords do not match.");
    return;
  }
  button.disabled = true;
  try {
    await apiFetch(form.action, {method: "POST", formData: new FormData(form), headers: {Accept: "application/json"}});
    clearTokens();
    location.replace("/auth/login?updated=1");
  } catch (err) {
    showProfileError(err.message || "Could not update your profile. Please try again.");
    button.disabled = false;
  }
});
window.addEventListener("pagehide", () => {if (previewUrl) URL.revokeObjectURL(previewUrl);});
