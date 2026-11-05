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
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('signupSubmit');
const submitText = document.getElementById('signupSubmitText');

if (form) {
  confirmInput.addEventListener('input', () => confirmInput.setCustomValidity(''));
  passwordInput.addEventListener('input', () => confirmInput.setCustomValidity(''));

  form.addEventListener('submit', (event) => {

    if (!form.checkValidity()) {
      event.preventDefault();
      form.reportValidity();
      return;
    }

    if (passwordInput.value !== confirmInput.value) {
      event.preventDefault();
      confirmInput.setCustomValidity("Passwords don't match.");
      confirmInput.reportValidity();
      confirmInput.focus();
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Creating…';

    // Submit all form fields, including CSRF and confirmation, to Flask.
  });
}
