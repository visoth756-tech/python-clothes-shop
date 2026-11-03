import {loginWithJWT} from "../api/auth.js";

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

function showError(message) {
  if (formErrorText) formErrorText.textContent = message;
  if (formError) formError.classList.remove('hidden');
}

function setSubmitting(isSubmitting) {
  if (submitBtn) submitBtn.disabled = isSubmitting;
  if (submitText) submitText.textContent = isSubmitting ? 'Signing in…' : 'Sign in';
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
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
      showError(err.message || 'Invalid username or password');
      setSubmitting(false);
    }
  });
}