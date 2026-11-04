import {register} from "./api.js";

// Toggle visibility for password fields
document.querySelectorAll('.toggle-password').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const icon = btn.querySelector('i');
    const isHidden = input.type === 'password';

    input.type = isHidden ? 'text' : 'password';
    if (icon) {
      icon.classList.toggle('fa-eye', !isHidden);
      icon.classList.toggle('fa-eye-slash', isHidden);
    }
    btn.setAttribute('aria-pressed', String(isHidden));
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  });
});

const form = document.getElementById('signupForm');
const formError = document.getElementById('formError');
const formErrorText = document.getElementById('formErrorText');
const matchHint = document.getElementById('matchHint');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('signupSubmit');
const submitText = document.getElementById('signupSubmitText');

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (formError) formError.classList.add('hidden');
    if (matchHint) matchHint.classList.add('hidden');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (passwordInput.value !== confirmInput.value) {
      if (matchHint) matchHint.classList.remove('hidden');
      confirmInput.focus();
      return;
    }

    const usernameInput = document.getElementById('username');
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput.value;

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Creating…';

    try {
      await register(username, password);
      window.toastSuccess("Account created — welcome!");
      const loginUrl = window.LOGIN_URL || "/auth/login";
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 600);
    } catch (error) {
      console.error('Signup errors:', error);
      if (formErrorText) {
        formErrorText.textContent = error.message || 'Could not create account.';
      }
      if (formError) formError.classList.remove('hidden');
      window.toastError(error.message || "Could not create account.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
      if (submitText) submitText.textContent = 'Create account';
    }
  });
}
