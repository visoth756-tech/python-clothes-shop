function initNavbar() {
  const profileToggle = document.getElementById("profileToggle");
  const profilePopup = document.getElementById("profilePopup");
  const profileWrapper = document.getElementById("profileWrapper");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  // Mobile menu toggle
  if (navToggle && navLinks) {
    navToggle.onclick = function () {
      navLinks.classList.toggle("open");
    };
  }

  // Profile popup dropdown toggle & outside click handling
  if (profileToggle && profilePopup) {
    function closeProfile() {
      profilePopup.classList.add("hidden");
      profileToggle.setAttribute("aria-expanded", "false");
      profileWrapper?.classList.remove("active");
      profileToggle.focus();
    }
    document.getElementById("profileClose")?.addEventListener("click", closeProfile);
    profileToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const isHidden = profilePopup.classList.toggle("hidden");
      profileToggle.setAttribute("aria-expanded", String(!isHidden));
      profileWrapper?.classList.toggle("active", !isHidden);
    });

    document.addEventListener("click", function (e) {
      if (!profileWrapper || !profileWrapper.contains(e.target)) {
        profilePopup.classList.add("hidden");
        profileToggle.setAttribute("aria-expanded", "false");
        profileWrapper?.classList.remove("active");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !profilePopup.classList.contains("hidden")) {
        profilePopup.classList.add("hidden");
        profileToggle.setAttribute("aria-expanded", "false");
        profileWrapper?.classList.remove("active");
        profileToggle.focus();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavbar);
} else {
  initNavbar();
}
