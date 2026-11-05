import {clearTokens} from "../../shared/tokens.js";
clearTokens();
import {loginWithJWT} from "./api.js";

const togglePassword = document.getElementById('togglePassword');
const togglePasswordIcon = document.getElementById('togglePasswordIcon');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    const isHidden = passwordInput.type === 'password';

    passwordInput.type = isHidden ? 'text' : 'password';
    if (togglePasswordIcon) {
      togglePasswordIcon.classList.toggle('fa-eye', !isHidden);
      togglePasswordIcon.classList.toggle('fa-eye-slash', isHidden);
    }
    togglePassword.setAttribute('aria-pressed', String(isHidden));
    togglePassword.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
}

const form = document.getElementById('loginForm');
const formError = document.getElementById('formError');
const formErrorText = document.getElementById('formErrorText');
const submitBtn = document.getElementById('loginSubmit');
const submitText = document.getElementById('loginSubmitText');
const cooldownKey = 'login_cooldown_until';
let submitting = false;
let cooldownUntil = 0;
try { cooldownUntil = Number(localStorage.getItem(cooldownKey)) || 0; } catch (_) {}

function updateCooldown() {
  try { cooldownUntil = Math.max(cooldownUntil, Number(localStorage.getItem(cooldownKey)) || 0); } catch (_) {}
  const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
  if (submitBtn) {
    submitBtn.disabled = submitting || remaining > 0;
    submitBtn.style.opacity = submitBtn.disabled ? '0.6' : '';
    submitBtn.style.cursor = submitBtn.disabled ? 'not-allowed' : '';
  }
  if (remaining > 0 && submitText) submitText.textContent = `Try again in ${remaining}s`;
  else if (!submitting && submitText) submitText.textContent = 'Sign in';
  return remaining;
}

updateCooldown();
setInterval(updateCooldown, 1000);

function showError(message) {
  if (formErrorText) formErrorText.textContent = message;
  if (formError) formError.classList.remove('hidden');
}

function setSubmitting(isSubmitting) {
  submitting = isSubmitting;
  if (submitBtn) submitBtn.disabled = isSubmitting;
  if (submitText) submitText.textContent = isSubmitting ? 'Signing in…' : 'Sign in';
  updateCooldown();
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting || updateCooldown() > 0) return;
    if (formError) formError.classList.add('hidden');

    const usernameInput = document.getElementById('username');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
      showError('Please enter both username and password.');
      return;
    }

    setSubmitting(true);

    try {
      // Store the JWT first, then submit the form to establish the session
      // the admin pages rely on.
      await loginWithJWT(username, password);
      form.submit();
    } catch (err) {
      if (err.status === 429) {
        cooldownUntil = Date.now() + Math.max(1, err.retryAfter || 60) * 1000;
        try { localStorage.setItem(cooldownKey, String(cooldownUntil)); } catch (_) {}
      }
      showError(err.message || 'Invalid username or password');
      window.toastError?.(err.message || "Invalid username or password");
      setSubmitting(false);
    }
  });
}
