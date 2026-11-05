export function setupPopup(id, close) {
  const modal = document.getElementById(id);
  const error = modal?.querySelector('[data-popup-error]');
  modal?.querySelector('[data-popup-close]')?.addEventListener('click', close);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal && !modal.classList.contains('hidden') && modal.contains(document.activeElement)) close();
  });
  return {
    clearError() { if (error) { error.textContent = ''; error.hidden = true; } },
    showError(message) {
      if (error) {
        error.textContent = message;
        error.hidden = false;
        error.focus({preventScroll: true});
        error.scrollIntoView({block: 'nearest'});
      }
      window.toastError?.(message);
    }
  };
}
