document.querySelectorAll(".flash").forEach(el => {
    setTimeout(() => el.remove(), 4000);
});
